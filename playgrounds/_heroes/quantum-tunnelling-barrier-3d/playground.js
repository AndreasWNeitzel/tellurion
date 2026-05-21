// Quantum tunnelling hero. Physics: shared Crank-Nicolson TDSE via
// ./sim.js (unitary). Render: shared/js/engine-gl/tdse-landscape-3d.js
// (V(x) terrain ridge + phase-coloured |psi|^2 curtain + classical
// ball). Secondary Canvas2D: the analytic transmission curve T(E).

import { makeTDSE, setPacket, setPotential, sculptV, step, norm, fluxSplit, rectBarrierT } from './sim.js';
import { setupTDSELandscapeGL } from '../../../shared/js/engine-gl/tdse-landscape-3d.js';
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

const NGRID = 2048, DOM = 240;
const sim = makeTDSE(NGRID, DOM);
const ui = { V0: 6, bw: 3, k0: 3, sigma: 5, kind: 'rect', running: !prefersReducedMotion() };
function relaunch() {
  setPacket(sim, -55, ui.k0, ui.sigma);
  setPotential(sim, ui.kind, ui.V0, ui.bw);
}
relaunch();

let engine = null;
try { engine = setupTDSELandscapeGL(canvas, 480); } catch (e) { console.warn('[tdse] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0, 1.1, 0], radius: 15.5, minRadius: 7, maxRadius: 44,
  azimuthDeg: 40, elevationDeg: 17, fovDeg: 54,
});
window.__camera = camera;

const RKEYS = ['packet E', 'barrier V0', 'transmitted', 'reflected', 'R+T', 'norm'];
const rEls = {};
for (const k of RKEYS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.append(lab, val); rEls[k] = val;
}

function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return inp;
}
slider('barrier V0', 0, 16, 0.2, ui.V0, (v) => v.toFixed(1), (v) => { ui.V0 = v; relaunch(); });
slider('barrier width', 0.5, 8, 0.1, ui.bw, (v) => v.toFixed(1), (v) => { ui.bw = v; relaunch(); });
slider('packet k0', 1, 6, 0.1, ui.k0, (v) => v.toFixed(1), (v) => { ui.k0 = v; relaunch(); });
slider('packet spread', 2, 10, 0.2, ui.sigma, (v) => v.toFixed(1), (v) => { ui.sigma = v; relaunch(); });
function sel(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
sel('preset', ['thin barrier', 'thick barrier', 'resonant double', 'step potential'], (p) => {
  if (p === 'thin barrier') { ui.kind = 'rect'; ui.V0 = 8; ui.bw = 1.2; ui.k0 = 3; }
  else if (p === 'thick barrier') { ui.kind = 'rect'; ui.V0 = 8; ui.bw = 5; ui.k0 = 3; }
  else if (p === 'resonant double') { ui.kind = 'double'; ui.V0 = 7; ui.bw = 1.5; ui.k0 = 3; }
  else { ui.kind = 'step'; ui.V0 = 4; ui.bw = 3; ui.k0 = 3.4; }
  relaunch();
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bRe = document.createElement('button'); bRe.type = 'button'; bRe.textContent = 'Relaunch';
const bStep = document.createElement('button'); bStep.type = 'button'; bStep.textContent = 'Step';
btnRow.append(bPause, bRe, bStep); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bRe.addEventListener('click', () => relaunch());
bStep.addEventListener('click', () => { for (let i = 0; i < 8; i += 1) step(sim, 0.02); });

// Drag on the canvas sculpts the potential terrain (raises a bump
// where the cursor's screen-x maps along the barrier axis).
let dragging = false;
canvas.addEventListener('pointerdown', (e) => { dragging = e.shiftKey; });
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const f = (e.clientX - rect.left) / rect.width;
  const xc = -DOM / 2 + f * DOM;
  sculptV(sim, xc, 6, 0.6);
});

function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  const Emax = 18, x0 = 44, x1 = W - 16, y0 = 16, y1 = H - 24;
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(x0, y1); pctx.lineTo(x1, y1); pctx.stroke();
  pctx.strokeStyle = '#5fd0e0'; pctx.lineWidth = 1.8; pctx.beginPath();
  let first = true;
  for (let E = 0.05; E <= Emax; E += 0.08) {
    const T = rectBarrierT(E, ui.V0, ui.bw);
    const X = x0 + (E / Emax) * (x1 - x0);
    const Y = y1 - T * (y1 - y0);
    if (first) { pctx.moveTo(X, Y); first = false; } else pctx.lineTo(X, Y);
  }
  pctx.stroke();
  const Ep = 0.5 * ui.k0 * ui.k0;
  const Xp = x0 + (Math.min(Emax, Ep) / Emax) * (x1 - x0);
  pctx.strokeStyle = '#ffd166'; pctx.beginPath(); pctx.moveTo(Xp, y0); pctx.lineTo(Xp, y1); pctx.stroke();
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText('analytic T(E) for this rectangular barrier   (yellow = packet energy)', 8, 12);
}

function refreshReadout() {
  const { T, R } = fluxSplit(sim);
  rEls['packet E'].textContent = (0.5 * ui.k0 * ui.k0).toFixed(2);
  rEls['barrier V0'].textContent = ui.V0.toFixed(1);
  rEls.transmitted.textContent = T.toFixed(3);
  rEls.reflected.textContent = R.toFixed(3);
  rEls['R+T'].textContent = (T + R).toFixed(4);
  rEls.norm.textContent = norm(sim).toFixed(5);
}

function frame() {
  if (engine) { engine.update(sim); engine.render(camera.viewMatrix(), camera.projMatrix(canvas.width / canvas.height)); }
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  last = now;
  if (ui.running) for (let i = 0; i < 5; i += 1) step(sim, 0.02);
  camera.tickIdle(now);
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const presets = [
      { kind: 'rect', V0: 8, bw: 1.2, k0: 3 },
      { kind: 'rect', V0: 8, bw: 5, k0: 3 },
      { kind: 'double', V0: 7, bw: 1.5, k0: 3 },
      { kind: 'step', V0: 4, bw: 3, k0: 3.4 },
      { kind: 'rect', V0: 5, bw: 3, k0: 3 },
    ];
    const P = presets[Math.min(presets.length - 1, Math.floor(CAPTURE_FRAC * presets.length + 1e-6))];
    Object.assign(ui, P); relaunch();
    camera.setAzimuthDeg(38 + CAPTURE_FRAC * 30);
    for (let i = 0; i < Math.round(700 + CAPTURE_FRAC * 700); i += 1) step(sim, 0.02);
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
  const s = makeTDSE(1024, 160);
  setPacket(s, -40, 3, 5); setPotential(s, 'rect', 6, 3);
  const n0 = norm(s);
  for (let i = 0; i < 700; i += 1) step(s, 0.02);
  const drift = Math.abs(norm(s) - n0);
  const { T, R } = fluxSplit(s);
  return {
    name: 'Crank-Nicolson unitarity + R+T=1',
    pass: drift < 1e-6 && Math.abs(T + R - 1) < 1e-3,
    msg: `norm drift ${drift.toExponential(1)}, R+T=${(T + R).toFixed(4)}`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; TDSE validated by __physicsCheck and invariants' });

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
