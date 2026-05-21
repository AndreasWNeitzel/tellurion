// Expanding-universe hero. Cosmology: shared Friedmann engine via
// ./sim.js. Render: shared/js/engine-gl/cosmic-lattice-3d.js (a
// comoving galaxy lattice whose proper size is a(t)). The secondary
// Canvas2D panel is the scale-factor history a(t).

import {
  integrateScaleFactor, scaleAt, redshift, recession, hubble,
  densityFractions, aEqMatterRadiation, aEqMatterLambda,
} from './sim.js';
import { setupCosmicLatticeGL } from '../../../shared/js/engine-gl/cosmic-lattice-3d.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const plot = document.getElementById('plot');
const pctx = plot.getContext('2d');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

let engine = null;
try { engine = setupCosmicLatticeGL(canvas, 12); } catch (e) { console.warn('[universe] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 26, minRadius: 6, maxRadius: 70,
  azimuthDeg: 32, elevationDeg: 16, fovDeg: 55,
});
window.__camera = camera;

const ui = { Om: 0.3, OL: 0.7, H0: 1.0, time: 0, dir: 1, running: !prefersReducedMotion() };
let sol = integrateScaleFactor({ m: ui.Om, L: ui.OL }, ui.H0, { dt: 0.004, tMax: 40 });
const pulses = [];

// The proper lattice grows without bound for dark energy; cap the
// auto-play window so the lattice stays in frame (the readout and the
// a(t) panel still show the true runaway). A closed universe naturally
// returns to a~0, so its window is its whole life.
function loopWindow(s) {
  const ACAP = 2.4;                       // keep the lattice in frame
  let i0 = 0; while (i0 < s.a.length && s.a[i0] < 0.12) i0 += 1;
  // first index after now where a exceeds the cap (closed models peak
  // below it and then recollapse, so their window is the whole life).
  let i1 = i0 + 1;
  while (i1 < s.a.length - 1 && s.a[i1] < ACAP) i1 += 1;
  if (s.Ok < -0.02) { i1 = s.a.length - 1; }   // closed: expand + crunch
  s.tLoop0 = s.t[Math.max(0, i0 - 1)];
  s.tLoop1 = s.t[Math.min(s.t.length - 1, i1)];
  if (s.tLoop1 - s.tLoop0 < 1) s.tLoop1 = s.tLoop0 + Math.min(8, s.t[s.t.length - 1] - s.tLoop0);
}
function resolve() {
  sol = integrateScaleFactor({ m: ui.Om, L: ui.OL }, ui.H0, { dt: 0.004, tMax: 40 });
  loopWindow(sol);
  ui.time = sol.tLoop0;
}
loopWindow(sol);
ui.time = sol.tLoop0;

const RKEYS = ['cosmic t', 'scale a', 'H(a)', 'curvature', 'fate', 'probe z'];
const rEls = {};
for (const k of RKEYS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.append(lab, val); rEls[k] = val;
}
let probeMsg = '', probeUntil = 0;

function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return inp;
}
const sOm = slider('Omega_m', 0, 2, 0.02, ui.Om, (v) => v.toFixed(2), (v) => { ui.Om = v; resolve(); });
const sOL = slider('Omega_Lambda', 0, 1.5, 0.02, ui.OL, (v) => v.toFixed(2), (v) => { ui.OL = v; resolve(); });
slider('H0', 0.5, 1.6, 0.02, ui.H0, (v) => v.toFixed(2), (v) => { ui.H0 = v; resolve(); });
slider('cosmic time', -3, 30, 0.05, ui.time, (v) => v.toFixed(2), (v) => { ui.time = v; });
function selRow(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
selRow('preset', ['dark energy (our universe)', 'matter-dominated', 'closed (Big Crunch)', 'empty (coasting)'], (p) => {
  if (p === 'dark energy (our universe)') { ui.Om = 0.3; ui.OL = 0.7; }
  else if (p === 'matter-dominated') { ui.Om = 1.0; ui.OL = 0.0; }
  else if (p === 'closed (Big Crunch)') { ui.Om = 1.8; ui.OL = 0.0; }
  else { ui.Om = 0.0; ui.OL = 0.0; }
  sOm.value = ui.Om.toFixed(2); sOL.value = ui.OL.toFixed(2); ui.time = 0; resolve();
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bRev = document.createElement('button'); bRev.type = 'button'; bRev.textContent = 'Reverse';
const bNow = document.createElement('button'); bNow.type = 'button'; bNow.textContent = 'Today';
const bClr = document.createElement('button'); bClr.type = 'button'; bClr.textContent = 'Clear light';
btnRow.append(bPause, bRev, bNow, bClr); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bRev.addEventListener('click', () => { ui.dir *= -1; });
bNow.addEventListener('click', () => { ui.time = 0; });
bClr.addEventListener('click', () => { pulses.length = 0; });

// Click: emit a light pulse from the nearest lattice galaxy toward
// the observer at the origin (comoving), redshifting as it travels.
canvas.addEventListener('pointerup', (e) => {
  if (!engine) return;
  const com = engine.comoving;
  // pick a comoving galaxy at random-ish near a ray would need a
  // projection; instead emit from the most distant galaxy along a
  // pseudo-random index seeded by the click position (deterministic
  // per click, faithful to the physics being shown).
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width;
  const idx = Math.floor(sx * engine.nGal) % engine.nGal;
  const cx = com[idx * 4], cy = com[idx * 4 + 1], cz = com[idx * 4 + 2];
  pulses.push({ cx, cy, cz, frac: 1, tEmit: ui.time });
});

function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  // Split the plot vertically: top 60 % = a(t), bottom 40 % =
  // density-fraction bands Omega_r/m/Lambda(a). The bands are the
  // merged content from the multicomponent playground; they make the
  // matter-radiation and matter-Lambda equality epochs visible.
  const topH = Math.round(H * 0.60);
  const botH = H - topH - 4;
  const t0 = sol.t[0], t1 = sol.t[sol.t.length - 1];
  let aMax = 0; for (const v of sol.a) aMax = Math.max(aMax, v);
  const xOf = (t) => 40 + (t - t0) / (t1 - t0) * (W - 60);
  const yOf = (a) => topH - 22 - (a / aMax) * (topH - 40);
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(40, yOf(0)); pctx.lineTo(W - 20, yOf(0)); pctx.stroke();
  pctx.strokeStyle = '#9b8cff'; pctx.lineWidth = 1.8; pctx.beginPath();
  for (let i = 0; i < sol.t.length; i += 2) { const X = xOf(sol.t[i]), Y = yOf(sol.a[i]); if (i === 0) pctx.moveTo(X, Y); else pctx.lineTo(X, Y); }
  pctx.stroke();
  const cx = xOf(Math.max(t0, Math.min(t1, ui.time)));
  pctx.strokeStyle = '#ffd166'; pctx.beginPath(); pctx.moveTo(cx, 18); pctx.lineTo(cx, H - 18); pctx.stroke();
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText('scale factor a(t)   (yellow = now; t=0 is today)', 8, 14);

  // Density-fraction bands vs log(a). x ranges from log10(a) = -8
  // (early radiation era) to log10(a) = 0 (today).
  const py0 = topH + 4, py1 = topH + botH;
  pctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  pctx.fillRect(40, py0, W - 60, py1 - py0);
  pctx.strokeStyle = 'rgba(220, 230, 255, 0.20)';
  pctx.strokeRect(40 + 0.5, py0 + 0.5, W - 61, py1 - py0 - 1);
  pctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  pctx.font = fontString(canvas, 'caption', 'mono', 600);
  pctx.fillText('density fractions Ω_r / Ω_m / Ω_Λ  (log a)', 44, py0 + 12);
  const aLo = -8, aHi = 0;
  function xOfLogA(la) { return 50 + ((la - aLo) / (aHi - aLo)) * (W - 70); }
  // Stack the bands as a filled area chart.
  const NSTEPS = 80;
  const bandY = py0 + 20, bandH = py1 - py0 - 26;
  for (let i = 0; i < NSTEPS; i += 1) {
    const la = aLo + (i / (NSTEPS - 1)) * (aHi - aLo);
    const aLog = Math.pow(10, la);
    const f = densityFractions(aLog, { Om: ui.Om, OL: ui.OL });
    const x = xOfLogA(la);
    const wstep = (W - 70) / NSTEPS + 1;
    // Bottom: radiation; mid: matter; top: Lambda.
    pctx.fillStyle = '#5bc0eb'; pctx.fillRect(x, bandY + (1 - f.r) * bandH, wstep, f.r * bandH);
    pctx.fillStyle = '#ffd166'; pctx.fillRect(x, bandY + (1 - f.r - f.m) * bandH, wstep, f.m * bandH);
    pctx.fillStyle = '#ef476f'; pctx.fillRect(x, bandY, wstep, f.l * bandH);
  }
  // Equality markers.
  const aEq_mr = aEqMatterRadiation({ Om: ui.Om });
  const aEq_mL = aEqMatterLambda({ Om: ui.Om, OL: Math.max(1e-6, ui.OL) });
  if (aEq_mr > Math.pow(10, aLo) && aEq_mr < 1) {
    pctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; pctx.setLineDash([3, 3]);
    pctx.beginPath();
    pctx.moveTo(xOfLogA(Math.log10(aEq_mr)), bandY);
    pctx.lineTo(xOfLogA(Math.log10(aEq_mr)), bandY + bandH);
    pctx.stroke();
    pctx.setLineDash([]);
    pctx.fillStyle = '#fff'; pctx.font = fontString(canvas, 'caption', 'mono');
    pctx.fillText('m=r', xOfLogA(Math.log10(aEq_mr)) + 2, bandY + 10);
  }
  if (aEq_mL > Math.pow(10, aLo) && aEq_mL < 1) {
    pctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; pctx.setLineDash([3, 3]);
    pctx.beginPath();
    pctx.moveTo(xOfLogA(Math.log10(aEq_mL)), bandY);
    pctx.lineTo(xOfLogA(Math.log10(aEq_mL)), bandY + bandH);
    pctx.stroke();
    pctx.setLineDash([]);
    pctx.fillStyle = '#fff'; pctx.font = fontString(canvas, 'caption', 'mono');
    pctx.fillText('m=Λ', xOfLogA(Math.log10(aEq_mL)) + 2, bandY + 22);
  }
  // x-axis ticks.
  pctx.fillStyle = 'rgba(200, 210, 240, 0.85)'; pctx.font = fontString(canvas, 'caption', 'mono');
  for (let la = aLo; la <= aHi; la += 2) {
    const xx = xOfLogA(la);
    pctx.fillText(`10^${la}`, xx - 10, py1 - 2);
  }
}

function refreshReadout() {
  const a = scaleAt(sol, ui.time);
  rEls['cosmic t'].textContent = ui.time.toFixed(2);
  rEls['scale a'].textContent = a.toFixed(3);
  rEls['H(a)'].textContent = hubble(a, sol.Om, ui.H0).toFixed(3);
  rEls.curvature.textContent = sol.Ok > 0.02 ? 'open' : (sol.Ok < -0.02 ? 'closed' : 'flat');
  const last = sol.a[sol.a.length - 1];
  rEls.fate.textContent = (sol.Ok < -0.02 && last < 0.05) ? 'Big Crunch' : (ui.OL > 0.01 ? 'accelerating' : 'expanding');
  rEls['probe z'].textContent = (probeUntil > performance.now()) ? probeMsg : 'click a galaxy';
}

function frame() {
  const a = scaleAt(sol, ui.time);
  // advance pulses toward the observer; record redshift from the engine
  const live = [];
  for (const p of pulses) {
    p.frac = Math.max(0, p.frac - 0.012);
    const z = redshift(sol, p.tEmit, ui.time);
    p.lastZ = z;
    live.push({ x: p.cx * a * p.frac, y: p.cy * a * p.frac, z: p.cz * a * p.frac, z_redshift: Math.min(1, z / 4) });
  }
  if (live.length) { probeMsg = `d=${(Math.hypot(pulses[pulses.length - 1].cx, pulses[pulses.length - 1].cy, pulses[pulses.length - 1].cz) * a).toFixed(1)}  v=${recession(sol, Math.hypot(pulses[pulses.length - 1].cx, pulses[pulses.length - 1].cy, pulses[pulses.length - 1].cz), ui.time, ui.H0).toFixed(2)}  z=${pulses[pulses.length - 1].lastZ.toFixed(2)}`; probeUntil = performance.now() + 4000; }
  if (engine) engine.render(camera.viewMatrix(), camera.projMatrix(canvas.width / canvas.height), camera.eyePosition(), a, live);
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) {
    ui.time += ui.dir * dt * 0.5;          // slower loop so the expansion plays out
    if (ui.time > sol.tLoop1) ui.time = sol.tLoop0;       // loop the window
    if (ui.time < sol.tLoop0) ui.time = sol.tLoop1;
  }
  camera.tickIdle(now);
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const kinds = [{ m: 0.3, L: 0.7 }, { m: 1.0, L: 0 }, { m: 1.8, L: 0 }, { m: 0.3, L: 0.7 }, { m: 0, L: 0 }];
    const K = kinds[Math.min(kinds.length - 1, Math.floor(CAPTURE_FRAC * kinds.length + 1e-6))];
    ui.Om = K.m; ui.OL = K.L; resolve();
    ui.time = sol.tLoop0 + CAPTURE_FRAC * (sol.tLoop1 - sol.tLoop0);
    camera.setAzimuthDeg(32 + CAPTURE_FRAC * 36);
    frame();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  frame();
}

window.__physicsCheck = async () => {
  const s = integrateScaleFactor({ m: 0.3, L: 0.7 }, 1, { dt: 0.002, tMax: 8 });
  let ok = true, worst = 0;
  for (let i = s.iNow + 5; i < s.iNow + 200; i += 40) {
    const adot = (s.a[i + 1] - s.a[i - 1]) / (s.t[i + 1] - s.t[i - 1]);
    const rhs = (0.3) / s.a[i] ** 3 + 0.7;
    const e = Math.abs((adot / s.a[i]) ** 2 - rhs) / Math.max(rhs, 1e-6);
    worst = Math.max(worst, e); if (e > 1e-3) ok = false;
  }
  return { name: 'Friedmann constraint (a_dot/a)^2 = H0^2 E(a)', pass: ok, msg: `worst rel error ${worst.toExponential(1)}` };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; cosmology validated by __physicsCheck and invariants' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
