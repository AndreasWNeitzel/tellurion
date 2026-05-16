// playground.js
// Relativistic beaming as a pseudo-3D scene: a shaded solid-of-revolution
// of the D^(3+alpha) emission pattern, plus a stream of photons emitted
// isotropically in the rest frame and aberrated into the lab frame. As
// gamma rises the photons visibly collimate into the forward headlight
// cone. Canvas2D only (project stack rule); physics in sim.js is unchanged.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { makeRng } from '../../../shared/js/render/rng.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { beamingPattern, beamingHalfAngle, doppler, aberratedAngle } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderG      = document.getElementById('slider-gamma');
const sliderA      = document.getElementById('slider-alpha');
const valueG       = document.getElementById('value-gamma');
const valueA       = document.getElementById('value-alpha');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const CX = W * 0.42, CY = H * 0.52;

const state = { gamma: 5.0, alpha: 0.0 };
const rng = makeRng(SEED);

// Camera: boost axis is +x to the right; a fixed pitch tilts the
// revolution surface so it reads as 3D.
const PITCH = 0.42;
const cosP = Math.cos(PITCH), sinP = Math.sin(PITCH);
function project(vx, vy, vz, scale) {
  return {
    x: CX + vx * scale,
    y: CY - (vy * cosP - vz * sinP) * scale,
    depth: vx * 0.55 + vz * sinP,         // larger = nearer the camera
  };
}

// Cached shaded lobe, recomputed only when gamma/alpha move enough.
const lobe = document.createElement('canvas');
lobe.width = W; lobe.height = H;
const lctx = lobe.getContext('2d');
let lobeGamma = -1, lobeAlpha = -1;

function rebuildLobe() {
  lctx.clearRect(0, 0, W, H);
  const NT = 84, NP = 30;
  const { thetas, intensities } = beamingPattern({ gamma: state.gamma, alpha: state.alpha, n: NT });
  let iMax = 0;
  for (let i = 0; i < intensities.length; i += 1) if (intensities[i] > iMax) iMax = intensities[i];
  const norm = Math.log10(1 + iMax) || 1;
  const R = Math.min(W, H) * 0.40;

  // Vertex grid: V(it, ip) revolves the profile about the +x axis.
  const verts = [];
  for (let it = 0; it < NT; it += 1) {
    const th = thetas[it];
    const rr = (Math.log10(1 + intensities[it]) / norm) * R;
    const row = [];
    for (let ip = 0; ip <= NP; ip += 1) {
      const ph = 2 * Math.PI * (ip / NP);
      const vx = rr * Math.cos(th);
      const vy = rr * Math.sin(th) * Math.cos(ph);
      const vz = rr * Math.sin(th) * Math.sin(ph);
      row.push({ vx, vy, vz, t: Math.log10(1 + intensities[it]) / norm });
    }
    verts.push(row);
  }

  // Quads with painter's-algorithm depth sort and Lambert shading.
  const L = (() => { const m = Math.hypot(0.5, 0.7, 0.5); return [0.5 / m, 0.7 / m, 0.5 / m]; })();
  const quads = [];
  for (let it = 0; it < NT - 1; it += 1) {
    for (let ip = 0; ip < NP; ip += 1) {
      const a = verts[it][ip], b = verts[it + 1][ip], c = verts[it + 1][ip + 1], d = verts[it][ip + 1];
      const pa = project(a.vx, a.vy, a.vz, 1), pb = project(b.vx, b.vy, b.vz, 1);
      const pc = project(c.vx, c.vy, c.vz, 1), pd = project(d.vx, d.vy, d.vz, 1);
      // Surface normal from two edges (object space).
      const e1 = [b.vx - a.vx, b.vy - a.vy, b.vz - a.vz];
      const e2 = [d.vx - a.vx, d.vy - a.vy, d.vz - a.vz];
      let nx = e1[1] * e2[2] - e1[2] * e2[1];
      let ny = e1[2] * e2[0] - e1[0] * e2[2];
      let nz = e1[0] * e2[1] - e1[1] * e2[0];
      const nl = Math.hypot(nx, ny, nz) || 1;
      const lamb = Math.abs((nx * L[0] + ny * L[1] + nz * L[2]) / nl);
      const shade = 0.35 + 0.65 * lamb;
      const depth = (pa.depth + pb.depth + pc.depth + pd.depth) / 4;
      quads.push({ pa, pb, pc, pd, t: a.t, shade, depth });
    }
  }
  quads.sort((u, v) => u.depth - v.depth);
  for (const q of quads) {
    const col = viridis(Math.max(0, Math.min(1, q.t)));
    lctx.fillStyle = `rgba(${Math.round(col.r * q.shade)},${Math.round(col.g * q.shade)},${Math.round(col.b * q.shade)},0.78)`;
    lctx.strokeStyle = lctx.fillStyle;
    lctx.lineWidth = 0.6;
    lctx.beginPath();
    lctx.moveTo(q.pa.x, q.pa.y); lctx.lineTo(q.pb.x, q.pb.y);
    lctx.lineTo(q.pc.x, q.pc.y); lctx.lineTo(q.pd.x, q.pd.y);
    lctx.closePath(); lctx.fill(); lctx.stroke();
  }
  lobeGamma = state.gamma; lobeAlpha = state.alpha;
}

// Photon stream: isotropic in the rest frame, aberrated to the lab frame.
const NPH = 520;
const photons = [];
function spawnPhoton(p) {
  const u = 2 * rng() - 1;                 // cos(theta') uniform on sphere
  const thp = Math.acos(u);
  const php = 2 * Math.PI * rng();
  const thLab = aberratedAngle(state.beta ?? Math.sqrt(1 - 1 / (state.gamma * state.gamma)), thp);
  p.dx = Math.cos(thLab);
  const dp = Math.sin(thLab);
  p.dy = dp * Math.cos(php);
  p.dz = dp * Math.sin(php);
  p.r = 6 + rng() * 10;
  p.life = 0;
  p.D = doppler(Math.sqrt(1 - 1 / (state.gamma * state.gamma)), thLab);
}
for (let i = 0; i < NPH; i += 1) { const p = {}; spawnPhoton(p); p.r = rng() * 220; photons.push(p); }

function drawScene(advance) {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const beta = Math.sqrt(1 - 1 / (state.gamma * state.gamma));
  state.beta = beta;
  const Rmax = Math.min(W, H) * 0.40;

  // Reference grid: faint boost axis and a sphere of "rest-frame isotropy".
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  for (let k = 1; k <= 4; k += 1) {
    ctx.beginPath();
    ctx.ellipse(CX, CY, Rmax * k / 4, Rmax * k / 4 * cosP, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Headlight cone: half-angle theta_beam about the +x axis (3D wireframe).
  const thB = beamingHalfAngle(beta);
  ctx.strokeStyle = 'rgba(255,217,106,0.5)'; ctx.lineWidth = 1.2;
  for (const sgn of [1, -1]) {
    ctx.beginPath();
    const tip = project(0, 0, 0, 1);
    const end = project(Rmax * 1.15 * Math.cos(thB), sgn * Rmax * 1.15 * Math.sin(thB), 0, 1);
    ctx.moveTo(tip.x, tip.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  }

  // Cached shaded 3D lobe.
  if (Math.abs(state.gamma - lobeGamma) > 0.08 || state.alpha !== lobeAlpha) rebuildLobe();
  ctx.drawImage(lobe, 0, 0);

  // Photon stream, drawn over the lobe.
  const speed = advance ? 4.6 : 0;
  let dMax = 1e-6;
  for (const p of photons) if (p.D > dMax) dMax = p.D;
  for (const p of photons) {
    if (advance) { p.r += speed * (0.6 + 0.5 * p.D / dMax); p.life += 1; }
    if (p.r > Rmax * 1.12) spawnPhoton(p);
    const head = project(p.dx * p.r, p.dy * p.r, p.dz * p.r, 1);
    const tailR = Math.max(0, p.r - 16 - 10 * p.D / dMax);
    const tail = project(p.dx * tailR, p.dy * tailR, p.dz * tailR, 1);
    const tnorm = Math.max(0, Math.min(1, Math.log10(1 + p.D) / Math.log10(1 + dMax)));
    const col = viridis(0.15 + 0.85 * tnorm);
    const aLpha = 0.20 + 0.75 * tnorm;
    ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${aLpha})`;
    ctx.lineWidth = 0.8 + 1.8 * tnorm;
    ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y); ctx.stroke();
  }

  // The source: a small glowing relativistic blob at the origin.
  const o = project(0, 0, 0, 1);
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 16);
  g.addColorStop(0, 'rgba(255,245,220,0.95)');
  g.addColorStop(1, 'rgba(255,245,220,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(o.x, o.y, 16, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#fff6dc';
  ctx.beginPath(); ctx.arc(o.x, o.y, 4.5, 0, 2 * Math.PI); ctx.fill();

  // Velocity arrow along +x.
  ctx.strokeStyle = '#ffd96a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Rmax * 0.34, o.y); ctx.stroke();
  ctx.fillStyle = '#ffd96a';
  ctx.beginPath();
  ctx.moveTo(o.x + Rmax * 0.34, o.y);
  ctx.lineTo(o.x + Rmax * 0.34 - 9, o.y - 5);
  ctx.lineTo(o.x + Rmax * 0.34 - 9, o.y + 5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('beta', o.x + Rmax * 0.20, o.y - 8);

  // Readout block.
  const D0 = doppler(beta, 0), D180 = doppler(beta, Math.PI);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const rows = [
    ['gamma',          state.gamma.toFixed(2)],
    ['beta',           beta.toFixed(4)],
    ['alpha',          state.alpha.toFixed(2)],
    ['theta_beam',     thB.toFixed(3) + ' rad'],
    ['1/gamma',        (1 / state.gamma).toFixed(3) + ' rad'],
    ['D(0) fwd',       D0.toFixed(2)],
    ['D(pi) back',     D180.toFixed(3)],
    ['I(0)/I(pi)',     Math.pow(D0 / D180, 3 + state.alpha).toExponential(2)],
  ];
  let yy = 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillText(k, W - 196, yy);
    ctx.textAlign = 'right'; ctx.fillText(v, W - 14, yy);
    yy += 14;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('isotropic in rest frame -> beamed forward in lab frame', 14, H - 14);
}

sliderG.addEventListener('input', () => {
  state.gamma = parseFloat(sliderG.value);
  valueG.textContent = state.gamma.toFixed(2);
});
sliderA.addEventListener('input', () => {
  state.alpha = parseFloat(sliderA.value);
  valueA.textContent = state.alpha.toFixed(2);
});

let paused = false;
let userOverride = false;
sliderG.addEventListener('input', () => { userOverride = true; });
sliderA.addEventListener('input', () => { userOverride = true; });
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}

let animTime = 0;
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.008;
    state.gamma = 6 + 4.5 * Math.sin(animTime);
    sliderG.value = state.gamma.toFixed(2);
    valueG.textContent = state.gamma.toFixed(2);
  }
  drawScene(!CAPTURE_NAME);
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const gs = [1.2, 2.0, 5.0, 10.0, 18.0];
    state.gamma = gs[Math.min(gs.length - 1, Math.round(frac * (gs.length - 1)))];
    sliderG.value = state.gamma.toFixed(2);
    valueG.textContent = state.gamma.toFixed(2);
    // Settle photons into the steady-state collimation for this gamma.
    const beta = Math.sqrt(1 - 1 / (state.gamma * state.gamma));
    state.beta = beta;
    for (const p of photons) { spawnPhoton(p); p.r = rng() * Math.min(W, H) * 0.40; }
    drawScene(false);
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawScene(true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
