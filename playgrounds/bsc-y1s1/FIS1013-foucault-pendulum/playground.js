// playground.js
// Foucault pendulum as the museum sand table: a hand-projected 3D scene
// (Canvas2D, no WebGL) with a ceiling mount, suspension wire and shaded
// bob swinging over a circular sand bed. The bob carves a slowly
// precessing rosette into the sand and knocks over a ring of pins as
// the swing plane rotates at -Omega sin(latitude). sim.js carries the
// rotating-frame physics unchanged.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createFoucault, stepFoucault, omegaZ, precessionPeriod } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderLat    = document.getElementById('slider-lat');
const sliderSpeed  = document.getElementById('slider-speed');
const valueLat     = document.getElementById('value-lat');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  lat: 45,
  speed: 1,
  sim: null,
  trail: [],
  az: -0.7,            // camera azimuth (radians); slow live orbit
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};


// Scene scale (world units ~ pendulum amplitude 1).
const RW = 1.45;                 // sand-bed radius (world)
const HAP = 1.95;                // apex height (world); mount stays in frame
const S = 138;                   // pixels per world unit
const ELEV = 0.5;                // camera tilt (radians)
const CX = W / 2, CY = H * 0.52;
const NPINS = 20;

function project(x, y, z) {
  const ca = Math.cos(state.az), sa = Math.sin(state.az);
  const ex = x * ca - y * sa;
  const ey = x * sa + y * ca;
  return {
    sx: CX + ex * S,
    sy: CY - z * S * Math.cos(ELEV) + ey * S * Math.sin(ELEV),
    depth: ey,
  };
}

function rebuild() {
  state.sim = createFoucault({ latDeg: state.lat, x0: 1.0, y0: 0, vx0: 0, vy0: 0 });
  state.trail = [];
}

function ringPath(rr) {
  ctx.beginPath();
  for (let i = 0; i <= 72; i += 1) {
    const a = (i / 72) * 2 * Math.PI;
    const p = project(rr * Math.cos(a), rr * Math.sin(a), 0);
    if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
  }
  ctx.closePath();
}

function drawSandBed() {
  // Museum sand table rendered as an engraved bronze astrolabe: warm
  // sand fill, a guilloche of fine concentric rings and radial spokes,
  // a raised lighter rim and a soft inner vignette.
  const rim = [];
  for (let i = 0; i <= 72; i += 1) {
    const a = (i / 72) * 2 * Math.PI;
    rim.push(project(RW * Math.cos(a), RW * Math.sin(a), 0));
  }
  const cTop = project(0, -RW, 0).sy, cBot = project(0, RW, 0).sy;
  const g = ctx.createLinearGradient(0, cTop, 0, cBot);
  g.addColorStop(0, '#2a2118'); g.addColorStop(0.5, '#1d1711'); g.addColorStop(1, '#100c09');
  ctx.fillStyle = g;
  ctx.beginPath();
  rim.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
  ctx.closePath(); ctx.fill();
  // Fine engraved concentric rings.
  for (let kk = 1; kk <= 11; kk += 1) {
    const rr = RW * kk / 11;
    ctx.strokeStyle = `rgba(208,170,116,${kk % 2 ? 0.10 : 0.06})`;
    ctx.lineWidth = 1; ringPath(rr); ctx.stroke();
  }
  // Radial spokes (compass rays), clipped to the bed.
  ctx.save();
  ctx.beginPath();
  rim.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
  ctx.closePath(); ctx.clip();
  const c0 = project(0, 0, 0);
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * 2 * Math.PI;
    const e = project(RW * Math.cos(a), RW * Math.sin(a), 0);
    ctx.strokeStyle = i % 6 === 0 ? 'rgba(214,170,110,0.16)' : 'rgba(208,170,116,0.06)';
    ctx.lineWidth = i % 6 === 0 ? 1.3 : 1;
    ctx.beginPath(); ctx.moveTo(c0.sx, c0.sy); ctx.lineTo(e.sx, e.sy); ctx.stroke();
  }
  // Soft inner vignette so the carved figure pops in the centre.
  const vg = ctx.createRadialGradient(c0.sx, c0.sy, 4, c0.sx, c0.sy, RW * S);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // Raised outer rim, lighter on the near (lower) side.
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(228,196,140,0.45)'; ringPath(RW); ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(120,96,60,0.5)'; ringPath(RW * 0.985); ctx.stroke();
}

// Decorative marker pegs around the rim; the one nearest the current
// swing-plane azimuth is highlighted so the precession reads on the rim.
function drawPins(planeAngle) {
  for (let i = 0; i < NPINS; i += 1) {
    const a = (i / NPINS) * 2 * Math.PI;
    const d = Math.abs(((a - planeAngle) % Math.PI + Math.PI + Math.PI / 2) % Math.PI - Math.PI / 2);
    const lit = d < Math.PI / NPINS;
    const bx = RW * 0.99 * Math.cos(a), by = RW * 0.99 * Math.sin(a);
    const base = project(bx, by, 0);
    const top = project(bx, by, lit ? 0.22 : 0.13);
    ctx.strokeStyle = lit ? '#e8b25a' : 'rgba(150,140,118,0.5)';
    ctx.lineWidth = lit ? 3 : 1.8;
    ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(top.sx, top.sy); ctx.stroke();
    // Brass head bead; the lit pin glows.
    ctx.fillStyle = lit ? '#ffd98a' : 'rgba(180,168,140,0.6)';
    ctx.beginPath(); ctx.arc(top.sx, top.sy, lit ? 3 : 2, 0, 2 * Math.PI); ctx.fill();
    if (lit) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,200,110,0.30)';
      ctx.beginPath(); ctx.arc(top.sx, top.sy, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
    }
  }
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const s = state.sim;
  const Oz = omegaZ(state.lat);
  const Tp = state.lat === 0 ? Infinity : precessionPeriod(state.lat);
  const planeAngle = -Oz * s.t;                 // swing-plane orientation

  drawSandBed();

  // Initial swing axis (dashed) on the sand.
  ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  let p1 = project(-RW, 0, 0.001), p2 = project(RW, 0, 0.001);
  ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
  ctx.setLineDash([]);

  // Carved rosette: a fine groove drawn as one continuous path (dark
  // incision plus an additive warm highlight, recent strokes brighter)
  // so the precessing star reads as light caught in carved sand.
  const tr = state.trail, n = tr.length;
  if (n > 1) {
    const pts = new Array(n);
    for (let i = 0; i < n; i += 1) pts[i] = project(tr[i][0], tr[i][1], 0.002);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,14,8,0.55)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < n; i += 1) ctx.lineTo(pts[i].sx, pts[i].sy);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const seg = Math.max(1, (n / 90) | 0);
    for (let i = 1; i < n; i += seg) {
      const j = Math.min(n - 1, i + seg);
      const age = i / n;
      ctx.strokeStyle = `rgba(255,${(170 + 60 * age) | 0},${(90 + 60 * age) | 0},${(0.05 + 0.5 * age).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(pts[i - 1].sx, pts[i - 1].sy);
      for (let q = i; q <= j; q += 1) ctx.lineTo(pts[q].sx, pts[q].sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPins(planeAngle);

  // Pendulum: bob at horizontal (x, y); small-angle height above the
  // sand rho^2 / (2 L) so it skims the bottom and rises at the turns.
  const rho2 = s.x * s.x + s.y * s.y;
  const zb = 0.06 + rho2 / (2 * 2.6);
  const apex = project(0, 0, HAP);
  const bob = project(s.x, s.y, zb);

  // Soft contact shadow on the sand, growing/fading with bob height.
  const gp = project(s.x, s.y, 0.002);
  const shR = 15 * (1 - 0.4 * Math.min(1, zb));
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${(0.42 * (1 - Math.min(1, zb))).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(gp.sx, gp.sy, shR, shR * Math.sin(ELEV) * 1.1 + 2, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Ceiling mount.
  const m1 = project(-0.28, 0, HAP), m2 = project(0.28, 0, HAP);
  ctx.strokeStyle = 'rgba(206,210,220,0.65)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(m1.sx, m1.sy); ctx.lineTo(m2.sx, m2.sy); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#aab4c4'; ctx.beginPath(); ctx.arc(apex.sx, apex.sy, 4, 0, 2 * Math.PI); ctx.fill();

  // Faint stylus drop line to the sand at the bob's ground point.
  ctx.strokeStyle = 'rgba(228,196,140,0.28)'; ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(bob.sx, bob.sy); ctx.lineTo(gp.sx, gp.sy); ctx.stroke();
  ctx.setLineDash([]);

  // Suspension wire with a subtle sheen.
  ctx.strokeStyle = 'rgba(225,228,236,0.8)'; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.moveTo(apex.sx, apex.sy); ctx.lineTo(bob.sx, bob.sy); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(apex.sx, apex.sy); ctx.lineTo(bob.sx, bob.sy); ctx.stroke();

  // Shaded brass bob with a rim light and a tight specular.
  const rr = 14;
  const rg = ctx.createRadialGradient(bob.sx - 5, bob.sy - 6, 2, bob.sx, bob.sy, rr);
  rg.addColorStop(0, '#fff3da'); rg.addColorStop(0.32, '#e7a356'); rg.addColorStop(0.78, '#9a5a22'); rg.addColorStop(1, '#1f0e06');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(bob.sx, bob.sy, rr, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,150,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(bob.sx, bob.sy, rr - 0.5, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(bob.sx - 4.5, bob.sy - 5.5, 2.3, 0, 2 * Math.PI); ctx.fill();

  // Readout (monospace).
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'left';
  ctx.fillText(`latitude = ${state.lat} deg    t = ${s.t.toFixed(1)} s`, 24, 26);
  const TpStr = Number.isFinite(Tp) ? `${Tp.toFixed(1)} s` : 'no precession';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`omega_z = ${Oz.toFixed(3)} rad/s   T_precess = ${TpStr}   plane rotated = ${(planeAngle * 180 / Math.PI).toFixed(0)} deg`, 24, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left';
  ctx.fillText('dashed = initial swing axis    lit rim pegs mark the current swing plane', 24, H - 18);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepFoucault(state.sim, 0.005);
    state.trail.push([state.sim.x, state.sim.y]);
    if (state.trail.length > 7000) state.trail.shift();
  }
}

sliderLat.addEventListener('change', () => { state.lat = parseInt(sliderLat.value, 10); valueLat.textContent = `${state.lat} deg`; rebuild(); drawAll(); });
sliderLat.addEventListener('input', () => { valueLat.textContent = `${parseInt(sliderLat.value, 10)} deg`; });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  valueLat.textContent = `${state.lat} deg`;
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.az = -0.7;                              // fixed camera for determinism
    tickN(Math.round(frac * 9000));
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    state.az += 0.0016;                           // slow live orbit
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
