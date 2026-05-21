// Meissner-effect hero. Physics: shared image-dipole engine via
// ./sim.js. Render: shared/js/engine-gl/meissner-3d.js (magnet,
// sample, field-line streamlines that wrap/penetrate, London skin).
// Secondary Canvas2D: |B| versus depth into the sample.

import { lambdaL, criticalField, isSuperconducting, fieldAt, levitationForce, levitationHeight, penetrationProfile } from './sim.js';
import { setupMeissnerGL } from '../../../shared/js/engine-gl/meissner-3d.js';
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
try { engine = setupMeissnerGL(canvas); } catch (e) { console.warn('[meissner] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0, 0.2, 0], radius: 11, minRadius: 5, maxRadius: 28,
  azimuthDeg: 34, elevationDeg: 14, fovDeg: 52,
});
window.__camera = camera;

const WEIGHT = 0.05, MZ0 = 2.2, TC = 1;
const ui = { TbyTc: 0.4, Bapp: 0.2, lam0: 0.45, mz: MZ0, running: !prefersReducedMotion() };
let h = 3, hVel = 0;

const RKEYS = ['T / Tc', 'state', 'lambda_L', 'Hc(T)', 'levitation h', 'bulk |B|'];
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
const sT = slider('T / Tc', 0, 1.4, 0.01, ui.TbyTc, (v) => v.toFixed(2), (v) => { ui.TbyTc = v; });
const sB = slider('applied field', 0, 1.5, 0.01, ui.Bapp, (v) => v.toFixed(2), (v) => { ui.Bapp = v; });
slider('lambda0', 0.15, 1.2, 0.01, ui.lam0, (v) => v.toFixed(2), (v) => { ui.lam0 = v; });
slider('magnet m', 1, 3.5, 0.05, ui.mz, (v) => v.toFixed(2), (v) => { ui.mz = v; });
function sel(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
sel('preset', ['Meissner levitation', 'normal (field penetrates)', 'Type-II vortex', 'quench by overfield'], (p) => {
  if (p === 'Meissner levitation') { ui.TbyTc = 0.4; ui.Bapp = 0.2; }
  else if (p === 'normal (field penetrates)') { ui.TbyTc = 1.15; ui.Bapp = 0.2; }
  else if (p === 'Type-II vortex') { ui.TbyTc = 0.65; ui.Bapp = 0.30; }     // SC with partial-penetration regime
  else { ui.TbyTc = 0.4; ui.Bapp = 1.3; }
  sT.value = ui.TbyTc.toFixed(2); sB.value = ui.Bapp.toFixed(2);
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bCool = document.createElement('button'); bCool.type = 'button'; bCool.textContent = 'Cool down';
const bWarm = document.createElement('button'); bWarm.type = 'button'; bWarm.textContent = 'Warm up';
btnRow.append(bPause, bCool, bWarm); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bCool.addEventListener('click', () => { ui.TbyTc = 0.3; sT.value = '0.30'; });
bWarm.addEventListener('click', () => { ui.TbyTc = 1.15; sT.value = '1.15'; });

function sc() { return isSuperconducting(ui.TbyTc * TC, TC, ui.Bapp, 1); }
function lam() { return Math.min(6, lambdaL(ui.TbyTc * TC, TC, ui.lam0)); }

function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  const L = lam(), x0 = 44, x1 = W - 16, y0 = 16, y1 = H - 22;
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(x0, y1); pctx.lineTo(x1, y1); pctx.stroke();
  pctx.strokeStyle = sc() ? '#5fd0e0' : '#ff8a5a'; pctx.lineWidth = 1.8; pctx.beginPath();
  for (let k = 0; k <= 100; k += 1) {
    const d = (k / 100) * 4;
    const f = sc() ? penetrationProfile(d, L) : 1;     // normal: no decay
    const X = x0 + (d / 4) * (x1 - x0), Y = y1 - f * (y1 - y0);
    if (k === 0) pctx.moveTo(X, Y); else pctx.lineTo(X, Y);
  }
  pctx.stroke();
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText(sc() ? 'field fraction vs depth into the sample (exponential London decay)'
    : 'normal state: the field penetrates fully (no Meissner screening)', 8, 12);
}

function refreshReadout() {
  const s = sc();
  rEls['T / Tc'].textContent = ui.TbyTc.toFixed(2);
  rEls.state.textContent = s ? (ui.Bapp > 0.45 && ui.TbyTc > 0.6 ? 'Type-II vortex' : 'Meissner') : (ui.TbyTc >= 1 ? 'normal' : 'quenched');
  rEls.lambda_L.textContent = Number.isFinite(lambdaL(ui.TbyTc * TC, TC, ui.lam0)) ? lam().toFixed(2) : 'inf';
  rEls['Hc(T)'].textContent = criticalField(ui.TbyTc * TC, TC, 1).toFixed(2);
  rEls['levitation h'].textContent = s ? h.toFixed(2) : 'on sample';
  rEls['bulk |B|'].textContent = Math.hypot(...fieldAt([0, 0, -1.0], h, ui.mz, s, lam())).toExponential(1);
}

function frame() {
  const s = sc();
  if (engine) { engine.update(h, ui.mz, s, lam()); engine.render(camera.viewMatrix(), camera.projMatrix(canvas.width / canvas.height), h, s); }
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) {
    const s = sc();
    // Rest height when not superconducting: the magnet's south pole
    // must sit on the sample's top surface, not sink into it.
    // Sample top is at world y = -0.9; south pole at world y = h - 1.85
    // so the rest height is 0.95 + a small clearance.
    const hEq = s ? Math.max(1.4, levitationHeight(ui.mz, WEIGHT)) : 1.0;
    hVel += (hEq - h) * 6 * dt - hVel * 4 * dt;          // damped settle
    h += hVel * dt;
    h = Math.max(0.6, Math.min(6, h));
  }
  camera.tickIdle(now);
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const P = [{ T: 0.4, B: 0.2 }, { T: 1.15, B: 0.2 }, { T: 0.75, B: 0.55 }, { T: 0.4, B: 1.3 }, { T: 0.3, B: 0.15 }];
    const k = P[Math.min(P.length - 1, Math.floor(CAPTURE_FRAC * P.length + 1e-6))];
    ui.TbyTc = k.T; ui.Bapp = k.B;
    h = sc() ? Math.max(1.4, levitationHeight(ui.mz, WEIGHT)) : 1.0;
    camera.setAzimuthDeg(34 + CAPTURE_FRAC * 34);
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
  const Bz = Math.abs(fieldAt([0.4, 0, 1e-5], 3, 1, true, 1)[2]);
  const BzN = Math.abs(fieldAt([0.4, 0, 1e-5], 3, 1, false, 1)[2]);
  const fr = levitationForce(2, 1) / levitationForce(4, 1);
  return {
    name: 'Meissner surface screening + 1/h^4 levitation',
    pass: Bz < 1e-2 && BzN > 1e-2 && Math.abs(fr - 16) < 1e-3,
    msg: `cold Bz=${Bz.toExponential(1)}, warm Bz=${BzN.toFixed(3)}, F(2)/F(4)=${fr.toFixed(2)}`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; EM validated by __physicsCheck and invariants' });

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
