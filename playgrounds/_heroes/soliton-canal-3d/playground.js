// Soliton canal hero. Physics: shared pseudo-spectral KdV engine via
// ./sim.js. Render: shared/js/engine-gl/kdv-canal-3d.js (WebGL2 water).
// Camera: shared orbit-camera. The renderer owns no physics; it draws
// whatever height array the KdV integrator produces each frame.

import { makeKdV, addSoliton, setGaussian, clear, step, invariants, peak } from './sim.js';
import { setupKdVCanalGL } from '../../../shared/js/engine-gl/kdv-canal-3d.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { rayPlaneIntersect } from '../../../shared/js/gl/raycast.js';
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

const NGRID = 512, L = 60;
const sim = makeKdV(NGRID, L);

const ui = { preset: 'two-soliton', amp: 0.9, depth: 1.0, nsol: 3, speedMul: 1, running: !prefersReducedMotion() };
let i0 = null;                       // invariant baseline

function applyPreset(name) {
  ui.preset = name;
  clear(sim);
  sim.dispersion = ui.depth;
  if (name === 'single') {
    addSoliton(sim, 0.30 * L, 0.9);
  } else if (name === 'two-soliton') {
    addSoliton(sim, 0.16 * L, 1.25);     // tall, fast, behind
    addSoliton(sim, 0.46 * L, 0.40);     // short, slow, ahead
  } else if (name === 'train') {
    for (let m = 0; m < ui.nsol; m += 1) {
      addSoliton(sim, (0.12 + 0.16 * m) * L, 1.2 - 0.22 * m);
    }
  } else if (name === 'dispersing') {
    setGaussian(sim, 0.42 * L, 0.65, 1.5);
  }
  i0 = invariants(sim);
}
applyPreset('two-soliton');

let engine = null;
try { engine = setupKdVCanalGL(canvas, NGRID); }
catch (e) { console.warn('[soliton canal] webgl2 init failed', e); engine = null; }

const camera = createOrbitCamera(canvas, {
  target: [0, 0.15, 0],
  radius: 13.0, minRadius: 6, maxRadius: 28,
  azimuthDeg: 24, elevationDeg: 13, fovDeg: 52,
});
window.__camera = camera;

// Readout grid.
const RKEYS = ['t', 'peak a', 'speed c', 'mass drift', 'momentum drift', 'energy drift'];
const rEls = {};
for (const k of RKEYS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val); rEls[k] = val;
}

// Controls.
function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return inp;
}
function select(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.value = o; op.textContent = o; if (o === value) op.selected = true; sel.appendChild(op); }
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '';
  sel.addEventListener('change', () => onChange(sel.value));
  row.append(lab, sel, val); controlsEl.appendChild(row); return sel;
}
select('preset', ['two-soliton', 'single', 'train', 'dispersing'], 'two-soliton', (v) => applyPreset(v));
slider('amplitude', 0.2, 1.6, 0.05, ui.amp, (v) => v.toFixed(2), (v) => { ui.amp = v; });
slider('canal depth', 0.5, 2.0, 0.05, ui.depth, (v) => v.toFixed(2), (v) => { ui.depth = v; sim.dispersion = v; });
slider('solitons', 1, 4, 1, ui.nsol, (v) => String(v | 0), (v) => { ui.nsol = v | 0; if (ui.preset === 'train') applyPreset('train'); });
slider('speed', 0.25, 4, 0.25, ui.speedMul, (v) => v.toFixed(2) + 'x', (v) => { ui.speedMul = v; });
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bColl = document.createElement('button'); bColl.type = 'button'; bColl.textContent = 'Collision';
btnRow.append(bPause, bReset, bColl); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bReset.addEventListener('click', () => applyPreset(ui.preset));
bColl.addEventListener('click', () => { applyPreset('two-soliton'); document.querySelector('#controls select').value = 'two-soliton'; });

// Click: orbit if dragged; on a clean click, project to the water
// plane (y=0). On an existing hump -> probe it; on flat water ->
// inject a soliton whose amplitude is set by the vertical drag.
let pressed = false, didDrag = false, pX = 0, pY = 0, pT = 0;
const AX = engine ? engine.AX : 9;
canvas.addEventListener('pointerdown', (e) => { pressed = true; didDrag = false; pX = e.clientX; pY = e.clientY; pT = performance.now(); }, true);
canvas.addEventListener('pointermove', (e) => { if (pressed && (Math.abs(e.clientX - pX) > 4 || Math.abs(e.clientY - pY) > 4)) didDrag = true; }, true);
canvas.addEventListener('pointerup', (e) => {
  if (pressed && !didDrag) {
    const rect = canvas.getBoundingClientRect();
    const ray = camera.screenToRay(e.clientX - rect.left, e.clientY - rect.top);
    const hit = rayPlaneIntersect(ray, [0, 0, 0], [0, 1, 0]);
    if (hit && Math.abs(hit[0]) <= AX) {
      const frac = hit[0] / (2 * AX) + 0.5;        // 0..1 along canal
      const xs = frac * L;
      // sample local |u| to decide probe vs inject
      const gi = Math.max(0, Math.min(sim.N - 1, Math.round(frac * sim.N)));
      if (Math.abs(sim.u[gi]) > 0.12) {
        // probe: read the local hump
        let bi = gi, bv = sim.u[gi];
        for (let d = -20; d <= 20; d += 1) { const j = (gi + d + sim.N) % sim.N; if (sim.u[j] > bv) { bv = sim.u[j]; bi = j; } }
        const width = 1 / Math.sqrt(Math.max(2 * bv, 1e-3));
        probeMsg = `a=${bv.toFixed(3)}  c=${(2 * bv).toFixed(3)}  w=${width.toFixed(2)}`;
        probeUntil = performance.now() + 4000;
      } else {
        addSoliton(sim, xs, ui.amp);
        i0 = invariants(sim);
      }
    }
  }
  pressed = false;
}, true);
let probeMsg = '', probeUntil = 0;

// Conserved-quantity history: KdV conserves mass, momentum, energy.
// Tracking the relative drift over time PROVES the integrator is
// faithful (a fake animation would not conserve them).
const invHistory = [];   // {t, dMass, dMom, dEnergy}
function pushInvHistory() {
  if (!i0) return;
  const inv = invariants(sim);
  const dr = (a, b) => (b ? Math.abs(a - b) / Math.max(Math.abs(b), 1e-9) : 0);
  invHistory.push({
    t: sim.t,
    dMass: dr(inv.mass, i0.mass),
    dMom: dr(inv.momentum, i0.momentum),
    dEnergy: dr(inv.energy, i0.energy),
  });
  if (invHistory.length > 400) invHistory.shift();
}

// Secondary diagnostic: TOP = cross-section u(x), BOTTOM = conserved-
// quantity drift vs time on a log axis.
function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  const topH = Math.floor(H * 0.58);
  // ---- u(x) cross-section ----
  let umin = -0.15, umax = 0.15;
  for (let i = 0; i < sim.N; i += 1) { if (sim.u[i] > umax) umax = sim.u[i]; if (sim.u[i] < umin) umin = sim.u[i]; }
  const pad = 8;
  const yOf = (v) => topH - pad - (v - umin) / (umax - umin) * (topH - 2 * pad);
  pctx.strokeStyle = '#2a2d34'; pctx.lineWidth = 1;
  pctx.beginPath(); pctx.moveTo(0, yOf(0)); pctx.lineTo(W, yOf(0)); pctx.stroke();
  pctx.strokeStyle = '#5fd0e0'; pctx.lineWidth = 1.6; pctx.beginPath();
  for (let i = 0; i < sim.N; i += 1) {
    const xx = (i / (sim.N - 1)) * W, yy = yOf(sim.u[i]);
    if (i === 0) pctx.moveTo(xx, yy); else pctx.lineTo(xx, yy);
  }
  pctx.stroke();
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText('cross-section  u(x)', 8, 14);

  // ---- conserved-quantity drift vs time (log y) ----
  const dY0 = topH + 4, dY1 = H - 18;
  pctx.strokeStyle = '#2a2d34';
  pctx.strokeRect(30, dY0, W - 40, dY1 - dY0);
  pctx.fillStyle = '#7a818c';
  pctx.fillText('conserved-quantity drift (log)', 8, dY0 + 12);
  // y: log10 drift from -10 to 0.
  const lLo = -10, lHi = 0;
  function yDrift(d) {
    const l = Math.max(lLo, Math.min(lHi, Math.log10(Math.max(1e-12, d))));
    return dY1 - ((l - lLo) / (lHi - lLo)) * (dY1 - dY0 - 4);
  }
  const tMax = invHistory.length > 0 ? invHistory[invHistory.length - 1].t : 1;
  function xT(t) { return 30 + (t / Math.max(1, tMax)) * (W - 40); }
  const series = [
    { key: 'dMass', col: '#ffd166' },
    { key: 'dMom', col: '#5bc0eb' },
    { key: 'dEnergy', col: '#ef476f' },
  ];
  for (const s of series) {
    pctx.strokeStyle = s.col; pctx.lineWidth = 1.4;
    pctx.beginPath();
    for (let i = 0; i < invHistory.length; i += 1) {
      const h = invHistory[i];
      const x = xT(h.t), y = yDrift(h[s.key]);
      if (i === 0) pctx.moveTo(x, y); else pctx.lineTo(x, y);
    }
    pctx.stroke();
  }
  // y ticks.
  pctx.fillStyle = '#5a6068'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'right';
  for (let l = lLo; l <= lHi; l += 5) pctx.fillText(`10^${l}`, 28, yDrift(Math.pow(10, l)) + 3);
  // Legend.
  pctx.textAlign = 'left'; pctx.font = fontString(canvas, 'caption', 'mono');
  pctx.fillStyle = '#ffd166'; pctx.fillText('mass', 36, dY0 + 12);
  pctx.fillStyle = '#5bc0eb'; pctx.fillText('momentum', 72, dY0 + 12);
  pctx.fillStyle = '#ef476f'; pctx.fillText('energy', 138, dY0 + 12);
}

function refreshReadout() {
  const p = peak(sim);
  const inv = invariants(sim);
  const dr = (a, b) => (b ? Math.abs(a - b) / Math.max(Math.abs(b), 1e-9) : 0);
  rEls.t.textContent = sim.t.toFixed(2);
  rEls['peak a'].textContent = p.amplitude.toFixed(3);
  rEls['speed c'].textContent = (2 * p.amplitude).toFixed(3);
  rEls['mass drift'].textContent = i0 ? dr(inv.mass, i0.mass).toExponential(1) : '--';
  rEls['momentum drift'].textContent = i0 ? dr(inv.momentum, i0.momentum).toExponential(1) : '--';
  rEls['energy drift'].textContent = (probeUntil > performance.now())
    ? probeMsg
    : (i0 ? dr(inv.energy, i0.energy).toExponential(1) : '--');
}

const aspect = () => canvas.width / canvas.height;
function renderFrame() {
  if (engine) {
    engine.setHeights(sim.u);
    engine.render(camera.viewMatrix(), camera.projMatrix(aspect()), camera.eyePosition());
  }
  drawPlot();
}

const DT = 1.8e-3;
let last = performance.now();
function tick(now) {
  const wall = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) {
    const stepsPerFrame = Math.max(1, Math.round(7 * ui.speedMul));
    for (let n = 0; n < stepsPerFrame; n += 1) step(sim, DT);
    pushInvHistory();
  }
  camera.tickIdle(now);
  renderFrame();
  refreshReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    // Deterministic two-soliton collision sweep: each golden frame
    // advances the collision and rotates the camera a little.
    applyPreset('two-soliton');
    camera.setAzimuthDeg(26 + CAPTURE_FRAC * 40);
    const total = Math.round(CAPTURE_FRAC * 4200);
    for (let n = 0; n < total; n += 1) step(sim, DT);
    renderFrame();
    refreshReadout();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  renderFrame();
  refreshReadout();
}

// Physics gate hook: re-verify KdV conservation headlessly.
window.__physicsCheck = async () => {
  const s = makeKdV(256, 60);
  addSoliton(s, 15, 1.0); addSoliton(s, 32, 0.4);
  const a = invariants(s);
  for (let n = 0; n < 4000; n += 1) step(s, 1.5e-3);
  const b = invariants(s);
  const rel = (x, y) => Math.abs(x - y) / Math.max(Math.abs(y), 1e-9);
  const mOk = rel(b.mass, a.mass) < 1e-4, pOk = rel(b.momentum, a.momentum) < 1e-4, eOk = rel(b.energy, a.energy) < 1e-4;
  return {
    name: 'KdV mass/momentum/energy conservation',
    pass: mOk && pOk && eOk,
    msg: `drift mass ${rel(b.mass, a.mass).toExponential(1)} mom ${rel(b.momentum, a.momentum).toExponential(1)} en ${rel(b.energy, a.energy).toExponential(1)}`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; physics validated by __physicsCheck and invariants' });

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
