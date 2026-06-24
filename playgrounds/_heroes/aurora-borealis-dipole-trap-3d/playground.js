// Aurora borealis playground. Canvas2D 3D-projected Earth with its dipole
// field lines and a population of trapped charged particles. Each particle
// spirals (gyrates) along a field line and bounces between magnetic mirror
// points; the ones whose mirror point falls below the atmosphere sit in the
// loss cone and precipitate, lighting the auroral oval near the poles. The
// magnetic-bottle field profile and the precipitation latitude are shown as
// diagnostics. See sim.js for the dipole geometry and mirror relations.
// References: Stormer 1955 (`stormer1955`); Kivelson and Russell 1995
// (`kivelson-russell-1995`); Jackson, Classical Electrodynamics, Ch. 12.

import {
  dipoleField, borisPush, stepLorentz, spawnParticle, checkAuroralExcitation,
  bRatioAlongLine, mirrorLatitude, footLatitude, lossConeAngle, linePoint, lineTangent,
  REARTH, RAURORA,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rN = document.getElementById('readout-n');
const rHits = document.getElementById('readout-hits');
const rStep = document.getElementById('readout-step');
const sInject = document.getElementById('slider-inject'), vInject = document.getElementById('value-inject');
const sMdip = document.getElementById('slider-mdip'), vMdip = document.getElementById('value-mdip');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const sPitch = document.getElementById('slider-pitch'), vPitch = document.getElementById('value-pitch');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const SCENE_H = 660;   // 3D scene occupies the top; diagnostics sit below

const st = {
  inject: 3, mdip: 1.4, speed: 2, pitchDeg: 30,
  tilt: 0.42, az: 0.6, zoom: 1.42,
  running: !prefersReducedMotion(),
  particles: [], hits: [], nSteps: 0, nHits: 0, t: 0,
  MAX_PARTICLES: 220,
  latHist: new Float64Array(36),   // precipitation binned by magnetic latitude
};

// Deterministic LCG so the animation is reproducible.
let _seed = 0xC0FFEE;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return ((_seed >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
}

// =========================================================================
// 3D projection (azimuth + tilt + zoom), restricted to the scene region.
// =========================================================================
function project(x, y, z) {
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const xp = ca * x - sa * z;
  const zp = sa * x + ca * z;
  const ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
  const yp = ct * y - stl * zp;
  const zr = stl * y + ct * zp;
  const cam = 15 / Math.max(0.4, Math.min(6, st.zoom));
  const f = 360 / (cam + zr);
  return { x: W * 0.5 + f * xp, y: SCENE_H * 0.49 - f * yp, depth: cam + zr, scale: f / 25 };
}

// =========================================================================
// Trapped-particle population. Each particle lives on a field line (L,
// phi), bounces in latitude with amplitude lamAmp, gyrates around the
// line, and slowly drifts in longitude. Loss-cone particles precipitate
// at the foot and respawn.
// =========================================================================
const PRECIP_COL = [120, 240, 150];   // green: precipitating (aurora)
const TRAP_COL = [150, 200, 255];     // blue: trapped (radiation belt)

// Two physical populations. The aurora is fed by a field-aligned beam
// from the outer magnetosphere (the plasma sheet, mapping to the outer
// shells L ~ 5-6.5, foot latitude ~ 64 deg): those particles sit inside
// the loss cone and precipitate at the oval. The inner-to-mid shells hold
// the trapped radiation belt, with large pitch angles that mirror well
// above the atmosphere. The pitch-angle control sets how field-aligned
// the source is, hence the fraction that precipitates.
function spawnTrapped() {
  const sourceFrac = Math.min(0.85, Math.max(0.05, (92 - st.pitchDeg) / 90));
  const meanA = st.pitchDeg * Math.PI / 180;
  const phi = rand() * 2 * Math.PI;
  let L, alphaEq, precip;
  if (rand() < sourceFrac) {
    // Outer-shell field-aligned beam: precipitates at the auroral oval.
    L = 5.2 + 1.3 * rand();                  // 5.2 .. 6.5
    precip = true;
    alphaEq = Math.max(0.05, lossConeAngle(L, RAURORA) * (0.25 + 0.5 * rand()));
  } else {
    // Trapped belt: inner-to-mid shells, kept above the local loss cone.
    L = 2.0 + 4.2 * rand();                  // 2.0 .. 6.2
    const lc = lossConeAngle(L, RAURORA);
    alphaEq = Math.max(lc + 0.10, Math.min(Math.PI / 2, meanA + (rand() - 0.5) * 0.7));
    precip = false;
  }
  const lamM = mirrorLatitude(alphaEq);
  const lamFoot = footLatitude(L, RAURORA);
  const lossCone = lossConeAngle(L, RAURORA);
  const lamAmp = precip ? lamFoot : Math.min(lamM, 1.45);
  return {
    L, phi, alphaEq, lamM, lamFoot, lossCone, precip, lamAmp,
    bouncePhase: precip ? 0.001 : rand() * Math.PI * 2,
    bounceDir: rand() < 0.5 ? 1 : -1,
    gyro: rand() * Math.PI * 2,
    driftSign: precip ? 0 : (rand() < 0.5 ? 1 : -1),
    trail: [],
    born: st.t,
    life: 7 + rand() * 6,                     // belt particles recycle so pitch changes propagate
  };
}

function particlePos(p) {
  // Latitude from the bounce phase: lam = amp sin(phase). The mapping
  // slows the particle near the mirror (d lam/d phase -> 0 there), the
  // visible signature of the magnetic mirror.
  const lam = p.lamAmp * Math.sin(p.bouncePhase);
  const gc = linePoint(p.L, p.phi, lam);
  // Gyration: offset perpendicular to the field line so the trail is a
  // helix. Stronger dipole => smaller gyroradius.
  const T = lineTangent(p.phi, lam);
  const ePhi = [-Math.sin(p.phi), 0, Math.cos(p.phi)];           // azimuthal, ⊥ tangent
  const N = [T[1] * ePhi[2] - T[2] * ePhi[1],
             T[2] * ePhi[0] - T[0] * ePhi[2],
             T[0] * ePhi[1] - T[1] * ePhi[0]];                   // tangent × ePhi
  const rg = (0.055 + 0.03 * Math.sin(p.alphaEq)) / Math.max(0.5, st.mdip) * (0.55 + p.L * 0.09);
  const cg = Math.cos(p.gyro), sg = Math.sin(p.gyro);
  return [
    gc[0] + rg * (cg * ePhi[0] + sg * N[0]),
    gc[1] + rg * (cg * ePhi[1] + sg * N[1]),
    gc[2] + rg * (cg * ePhi[2] + sg * N[2]),
    lam,
  ];
}

function depositHit(p, lam) {
  const foot = linePoint(p.L, p.phi, lam);
  const latDeg = lam * 180 / Math.PI;
  st.hits.push({ x: foot[0], y: foot[1], z: foot[2], age: 0, latDeg });
  if (st.hits.length > 140) st.hits.shift();
  st.nHits += 1;
  const bin = Math.max(0, Math.min(35, Math.floor((latDeg + 90) / 5)));
  st.latHist[bin] += 1;
}

function update(dt) {
  st.t += dt;
  // Keep the population near the requested size.
  const target = 30 + st.inject * 30;
  while (st.particles.length < Math.min(st.MAX_PARTICLES, target)) {
    st.particles.push(spawnTrapped());
  }
  while (st.particles.length > Math.min(st.MAX_PARTICLES, target)) {
    st.particles.pop();
  }
  for (let i = st.particles.length - 1; i >= 0; i -= 1) {
    const p = st.particles[i];
    // Bounce frequency: faster for stronger field / smaller shell.
    const bounceRate = 1.7 * Math.sqrt(st.mdip) / Math.sqrt(p.L);
    const prevPhase = p.bouncePhase;
    p.bouncePhase += p.bounceDir * bounceRate * dt;
    // Gyration is fast relative to the bounce.
    p.gyro += dt * (9 + 5 * st.mdip);
    // Longitudinal drift (gradient-curvature): the slow ring-current motion.
    p.phi += p.driftSign * 0.05 * dt * (p.L / 4);

    if (p.precip) {
      // Precipitating particle: travels equator -> foot. When the bounce
      // phase first crosses +/- pi/2 it has reached the foot: light the
      // aurora and respawn a fresh particle on the requested distribution.
      const crossed = (prevPhase < Math.PI / 2 && p.bouncePhase >= Math.PI / 2)
                   || (prevPhase > -Math.PI / 2 && p.bouncePhase <= -Math.PI / 2)
                   || Math.abs(p.bouncePhase) > Math.PI / 2;
      if (crossed) {
        const lam = p.bounceDir > 0 ? p.lamAmp : -p.lamAmp;
        depositHit(p, lam);
        st.particles[i] = spawnTrapped();
        continue;
      }
    } else {
      // Trapped particle: reflect the bounce at +/- pi/2 (the mirror points).
      if (p.bouncePhase > Math.PI / 2) { p.bouncePhase = Math.PI - p.bouncePhase; p.bounceDir = -1; }
      if (p.bouncePhase < -Math.PI / 2) { p.bouncePhase = -Math.PI - p.bouncePhase; p.bounceDir = 1; }
      // Recycle after a finite life so pitch-angle changes propagate.
      if (st.t - p.born > p.life) { st.particles[i] = spawnTrapped(); continue; }
    }

    // Trail of recent positions for the helix streak.
    const pos = particlePos(p);
    p.trail.push([pos[0], pos[1], pos[2]]);
    if (p.trail.length > 14) p.trail.shift();
  }
  st.nSteps += 1;
}

// =========================================================================
// SCENE RENDERING.
// =========================================================================
function drawStarfield() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  let s = 7;
  ctx.fillStyle = 'rgba(180, 200, 255, 0.2)';
  for (let i = 0; i < 200; i += 1) {
    s = (s * 16807) | 0; const u = ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    s = (s * 16807) | 0; const v = ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
    if (v * H < SCENE_H) ctx.fillRect(u * W, v * H, 1, 1);
  }
}

function drawFieldLines() {
  // Nested dipole field lines (the magnetic bottle) for several L-shells,
  // each at a few longitudes so the structure reads as a 3D cage. Lines
  // run from foot to foot (they start at the atmosphere, not the core).
  ctx.lineWidth = 1.0;
  for (const L of [2, 3, 4, 5, 6.3]) {
    const lamF = footLatitude(L, REARTH);
    const azs = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
    for (const az0 of azs) {
      ctx.strokeStyle = `rgba(120, 170, 235, ${(0.12 + 0.07 * (L / 6.3)).toFixed(3)})`;
      ctx.beginPath();
      const NS = 80;
      for (let k = 0; k <= NS; k += 1) {
        const lam = -lamF + (2 * lamF) * (k / NS);
        const q = linePoint(L, az0, lam);
        const pr = project(q[0], q[1], q[2]);
        if (k === 0) ctx.moveTo(pr.x, pr.y); else ctx.lineTo(pr.x, pr.y);
      }
      ctx.stroke();
    }
  }
}

function drawEarth() {
  const center = project(0, 0, 0);
  const R = Math.max(8, center.scale * 80);
  const g = ctx.createRadialGradient(center.x - R * 0.3, center.y - R * 0.3, R * 0.1, center.x, center.y, R);
  g.addColorStop(0, '#3b6eb0');
  g.addColorStop(0.6, '#1a3a66');
  g.addColorStop(1, '#0b1e36');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(center.x, center.y, R, 0, Math.PI * 2); ctx.fill();
  // Equator great circle.
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.16)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const phi = (k / 64) * 2 * Math.PI;
    const p = project(Math.cos(phi), 0, Math.sin(phi));
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  // Magnetic axis.
  const top = project(0, 1.5, 0), bot = project(0, -1.5, 0);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
}

function drawAuroralOval() {
  // A faint base ring at the mean precipitation latitude on each pole,
  // brightened in real time by the live hit glows.
  for (const sign of [1, -1]) {
    const latDeg = 64;
    const lam = sign * latDeg * Math.PI / 180;
    ctx.strokeStyle = 'rgba(90, 230, 140, 0.30)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let k = 0; k <= 96; k += 1) {
      const phi = (k / 96) * 2 * Math.PI;
      const r = REARTH * 1.03;
      const x = r * Math.cos(lam) * Math.cos(phi);
      const z = r * Math.cos(lam) * Math.sin(phi);
      const y = r * Math.sin(lam);
      const p = project(x, y, z);
      if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    const lp = project(0, sign * 2.15, 0);
    ctx.fillStyle = 'rgba(110, 240, 150, 0.9)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'center';
    ctx.fillText(sign > 0 ? 'aurora borealis (N)' : 'aurora australis (S)', lp.x, lp.y);
    ctx.textAlign = 'left';
  }
}

function drawParticles() {
  const items = st.particles.map((p) => {
    const pos = particlePos(p);
    return { p, pos, proj: project(pos[0], pos[1], pos[2]) };
  });
  items.sort((a, b) => b.proj.depth - a.proj.depth);
  for (const { p, proj } of items) {
    if (proj.y > SCENE_H + 20) continue;
    const col = p.precip ? PRECIP_COL : TRAP_COL;
    // Helix trail.
    if (p.trail.length > 1) {
      ctx.lineWidth = 1.3;
      for (let k = 1; k < p.trail.length; k += 1) {
        const a = project(p.trail[k - 1][0], p.trail[k - 1][1], p.trail[k - 1][2]);
        const b = project(p.trail[k][0], p.trail[k][1], p.trail[k][2]);
        const al = (k / p.trail.length) * (p.precip ? 0.7 : 0.45);
        ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${al.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    // Head.
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.95)`;
    ctx.beginPath(); ctx.arc(proj.x, proj.y, p.precip ? 1.9 : 1.5, 0, 2 * Math.PI); ctx.fill();
  }
}

function drawHits() {
  for (let i = st.hits.length - 1; i >= 0; i -= 1) {
    const h = st.hits[i];
    h.age += 1;
    if (h.age > 70) { st.hits.splice(i, 1); continue; }
    const a = (1 - h.age / 70) * 0.5;
    const p = project(h.x, h.y, h.z);
    if (p.y > SCENE_H + 20) continue;
    const r = 8 + (1 - h.age / 70) * 6;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, `rgba(120, 250, 160, ${a.toFixed(3)})`);
    g.addColorStop(1, 'rgba(120, 250, 160, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fill();
  }
}

// =========================================================================
// DIAGNOSTIC PANELS (bottom row).
// =========================================================================
function panel(x, y, w, h, title) {
  ctx.fillStyle = 'rgba(16, 22, 36, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.30)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(224, 232, 255, 0.94)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText(title, x + 8, y - 6);
}

// The magnetic bottle: |B| along a field line vs magnetic latitude, with
// the mirror line for the current mean pitch angle and the loss cone.
function drawBottle(X, Y, Wd, Hd) {
  panel(X, Y, Wd, Hd, 'the magnetic bottle:  |B| / B_eq  along a field line');
  const padL = 44, padR = 14, padT = 16, padB = 28;
  const pX = X + padL, pY = Y + padT, pW = Wd - padL - padR, pH = Hd - padT - padB;
  const LAT = 80;                         // plot lambda in [-80, 80] deg
  const Bcap = 16;                        // y-axis cap on B/B_eq
  const xForLat = (deg) => pX + (deg + LAT) / (2 * LAT) * pW;
  const yForB = (b) => pY + pH - (Math.min(b, Bcap) - 1) / (Bcap - 1) * pH;

  // Loss-cone shading for a representative outer shell (the oval feeder).
  const Lrep = 5.85;
  const lamFoot = footLatitude(Lrep, RAURORA) * 180 / Math.PI;
  ctx.fillStyle = 'rgba(120, 240, 150, 0.10)';
  ctx.fillRect(xForLat(lamFoot), pY, xForLat(LAT) - xForLat(lamFoot), pH);
  ctx.fillRect(xForLat(-LAT), pY, xForLat(-lamFoot) - xForLat(-LAT), pH);

  // Grid + axis labels.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.10)';
  for (const b of [1, 4, 8, 12, 16]) {
    const yy = yForB(b);
    ctx.beginPath(); ctx.moveTo(pX, yy); ctx.lineTo(pX + pW, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(176, 190, 224, 0.7)'; ctx.fillText(String(b), X + 6, yy + 4);
  }
  for (const d of [-80, -40, 0, 40, 80]) {
    const xx = xForLat(d);
    ctx.strokeStyle = 'rgba(150, 170, 210, 0.10)';
    ctx.beginPath(); ctx.moveTo(xx, pY); ctx.lineTo(xx, pY + pH); ctx.stroke();
    ctx.fillStyle = 'rgba(176, 190, 224, 0.7)';
    ctx.fillText(`${d}`, xx - (d === 0 ? 3 : 9), pY + pH + 15);
  }
  ctx.fillStyle = 'rgba(150, 170, 210, 0.7)';
  ctx.fillText('magnetic latitude (deg)', pX + pW - 150, pY + pH + 15);

  // B(lambda) curve.
  ctx.strokeStyle = 'rgba(140, 200, 255, 0.95)'; ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let k = 0; k <= 200; k += 1) {
    const deg = -LAT + (2 * LAT) * (k / 200);
    const b = bRatioAlongLine(deg * Math.PI / 180);
    const yy = yForB(b);
    const xx = xForLat(deg);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Mirror line for the current mean pitch angle.
  const meanA = st.pitchDeg * Math.PI / 180;
  const bMirror = 1 / (Math.sin(meanA) ** 2);
  const lamMdeg = mirrorLatitude(meanA) * 180 / Math.PI;
  ctx.strokeStyle = 'rgba(255, 200, 90, 0.9)'; ctx.lineWidth = 1.3;
  ctx.setLineDash([4, 4]);
  const yM = yForB(bMirror);
  ctx.beginPath(); ctx.moveTo(pX, yM); ctx.lineTo(pX + pW, yM); ctx.stroke();
  for (const sgn of [1, -1]) {
    const xm = xForLat(sgn * lamMdeg);
    ctx.beginPath(); ctx.moveTo(xm, yM); ctx.lineTo(xm, pY + pH); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 210, 120, 0.95)';
  ctx.fillText(`B_mirror (alpha_eq = ${st.pitchDeg.toFixed(0)} deg)`, pX + 6, Math.max(pY + 12, yM - 5));
  ctx.fillStyle = 'rgba(120, 240, 150, 0.85)';
  ctx.fillText('loss cone -> aurora', xForLat(lamFoot) + 4, pY + pH - 6);
}

// Precipitation rate vs magnetic latitude (the auroral oval).
function drawPrecip(X, Y, Wd, Hd) {
  panel(X, Y, Wd, Hd, 'precipitation rate vs magnetic latitude');
  const padL = 30, padR = 14, padT = 16, padB = 28;
  const pX = X + padL, pY = Y + padT, pW = Wd - padL - padR, pH = Hd - padT - padB;
  let hmax = 1;
  for (let b = 0; b < 36; b += 1) if (st.latHist[b] > hmax) hmax = st.latHist[b];
  const barW = pW / 36;
  for (let b = 0; b < 36; b += 1) {
    const h = (st.latHist[b] / hmax) * pH;
    const lat = -90 + (b + 0.5) * 5;
    const boost = Math.max(0, 1 - Math.abs(Math.abs(lat) - 64) / 14);
    const rr = Math.round(90 + 50 * boost), gg = Math.round(190 + 40 * boost), bb = Math.round(140 - 40 * boost);
    ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${(0.55 + 0.4 * boost).toFixed(2)})`;
    ctx.fillRect(pX + b * barW, pY + pH - h, barW - 0.6, h);
  }
  // Auroral-oval reference lines.
  ctx.strokeStyle = 'rgba(120, 230, 160, 0.7)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (const tl of [-64, 64]) {
    const x = pX + ((tl + 90) / 180) * pW;
    ctx.beginPath(); ctx.moveTo(x, pY); ctx.lineTo(x, pY + pH); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(176, 190, 224, 0.7)';
  for (const tl of [-90, -45, 0, 45, 90]) {
    const x = pX + ((tl + 90) / 180) * pW;
    ctx.fillText(`${tl}`, x - (tl === 0 ? 3 : 9), pY + pH + 15);
  }
  ctx.fillStyle = 'rgba(120, 230, 160, 0.85)';
  ctx.fillText('auroral oval', pX + ((64 + 90) / 180) * pW - 64, pY + 12);
}

// =========================================================================
// RENDER.
// =========================================================================
function render() {
  drawStarfield();
  drawFieldLines();
  drawEarth();
  drawAuroralOval();
  drawParticles();
  drawHits();

  // HUD.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  const nPre = st.particles.reduce((a, p) => a + (p.precip ? 1 : 0), 0);
  ctx.fillText(`trapped ${st.particles.length - nPre}   precipitating ${nPre}   aurora hits ${st.nHits}`, 18, 22);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.8)';
  ctx.fillText('particles spiral along field lines and bounce at the mirror points;', 18, 40);
  ctx.fillText('the loss-cone fraction precipitates and lights the oval near the poles', 18, 58);

  // Diagnostics row.
  const gap = 12, dY = SCENE_H + 26, dH = H - dY - 12;
  const dW = (W - 24 - gap) / 2;
  drawBottle(12, dY, dW, dH);
  drawPrecip(12 + dW + gap, dY, dW, dH);

  rN.textContent = String(st.particles.length);
  rHits.textContent = String(st.nHits);
  rStep.textContent = String(st.nSteps);
}

function tick() {
  if (st.running) {
    const sub = Math.max(1, st.speed);
    const dt = 0.05 * Math.max(0.5, st.speed) / sub;
    for (let k = 0; k < sub; k += 1) update(dt);
  }
  render();
  requestAnimationFrame(tick);
}

// =========================================================================
// CONTROLS.
// =========================================================================
function syncLabels() {
  vInject.textContent = String(st.inject);
  vMdip.textContent = st.mdip.toFixed(1);
  vSpeed.textContent = String(st.speed);
  if (vPitch) vPitch.textContent = `${st.pitchDeg.toFixed(0)} deg`;
}

sInject.addEventListener('input', () => { st.inject = parseInt(sInject.value, 10); syncLabels(); });
sMdip.addEventListener('input', () => { st.mdip = parseFloat(sMdip.value); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
if (sPitch) sPitch.addEventListener('input', () => {
  // New particles spawn with the new pitch; precipitating beams respawn
  // every bounce and belt particles recycle on their lifetime, so the
  // change propagates through the population within a second or two.
  st.pitchDeg = parseFloat(sPitch.value);
  syncLabels();
});
btnReset.addEventListener('click', () => {
  st.inject = 3; st.mdip = 1.4; st.speed = 2; st.pitchDeg = 30;
  st.particles.length = 0; st.hits.length = 0; st.nHits = 0; st.nSteps = 0; st.t = 0;
  st.latHist.fill(0);
  _seed = 0xC0FFEE;
  sInject.value = '3'; sMdip.value = '1.4'; sSpeed.value = '2';
  if (sPitch) sPitch.value = '30';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Drag to orbit, wheel to zoom (restricted to the scene region).
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const yCanvas = (e.clientY - rect.top) / rect.height * H;
  if (yCanvas > SCENE_H) return;          // do not grab over the diagnostics
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  st.az += (e.clientX - lastX) * 0.006;
  st.tilt = Math.max(-1.45, Math.min(1.45, st.tilt + (e.clientY - lastY) * 0.006));
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  st.zoom = Math.max(0.4, Math.min(6, st.zoom * Math.exp(-e.deltaY * 0.0015)));
}, { passive: false });

const SHARE_KEYS = {
  mdip: { get: () => st.mdip, set: v => { st.mdip = parseFloat(v); sMdip.value = v; }, parse: parseFloat },
  pitch: { get: () => st.pitchDeg, set: v => { st.pitchDeg = parseFloat(v); if (sPitch) sPitch.value = v; }, parse: parseFloat },
};

function bootSync() {
  parseUrlState(SHARE_KEYS);
  mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.az = 0.4 + f * 1.6;
    st.pitchDeg = 18 + f * 30;             // sweep pitch angle across the frames
    // Warm up so the population, trails, and precipitation histogram fill.
    for (let n = 0; n < 360; n += 1) update(0.05);
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const nPre = st.particles.reduce((a, p) => a + (p.precip ? 1 : 0), 0);
  return {
    fields: [
      { key: 'trapped', label: 'trapped particles', value: st.particles.length - nPre, format: 'int' },
      { key: 'precip', label: 'precipitating (loss cone)', value: nPre, format: 'int' },
      { key: 'aurora-hits', label: 'auroral excitations', value: st.nHits, format: 'int' },
      { key: 'pitch', label: 'mean equatorial pitch angle (deg)', value: st.pitchDeg, format: 'float' },
      { key: 'dipole-moment', label: 'dipole moment m', value: st.mdip, format: 'float' },
    ],
  };
};
// The magnetic force does no work, so a Boris-pushed particle keeps its
// speed. We re-derive that bound from a probe particle each frame.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const p = { x: 3, y: 0, z: 0.5, vx: 0.5, vy: 0.4, vz: 0.6 };
      const v0 = Math.hypot(p.vx, p.vy, p.vz);
      for (let i = 0; i < 200; i += 1) stepLorentz(p, 0.01, 1.0, st.mdip);
      const v1 = Math.hypot(p.vx, p.vy, p.vz);
      const drift = Math.abs(v1 - v0) / v0;
      return [{
        key: 'speed',
        label: 'particle speed conserved (magnetic force does no work)',
        value: drift.toExponential(2),
        status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
