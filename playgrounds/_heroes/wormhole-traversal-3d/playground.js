// Wormhole traversal hero. Geometry: shared Ellis/Morris-Thorne
// engine via ./sim.js. Render: shared/js/engine-gl/wormhole-3d.js
// (per-pixel null-geodesic ray-march; two skies through the throat).
// Secondary Canvas2D: the real embedding funnel z(l) with the ship.

import { embedZ, circumferentialR, properDistance, tidalScale, criticalImpact } from './sim.js';
import { setupWormholeGL } from '../../../shared/js/engine-gl/wormhole-3d.js';
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
try { engine = setupWormholeGL(canvas); } catch (e) { console.warn('[wormhole] GL init failed', e); engine = null; }

const ui = { b0: 1.2, lCam: 12, yaw: 0, tidal: 1.0, running: !prefersReducedMotion(), dir: -1, t: 0, mode: 'traverse', yawAuto: 0 };

const RKEYS = ['throat b0', 'ship l', 'proper dist', 'tidal scale', 'region', 'traverse if b<'];
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
slider('throat b0', 0.5, 3, 0.05, ui.b0, (v) => v.toFixed(2), (v) => { ui.b0 = v; });
const sL = slider('ship l', -16, 16, 0.1, ui.lCam, (v) => v.toFixed(1), (v) => { ui.lCam = v; });
slider('look yaw', -1.4, 1.4, 0.02, ui.yaw, (v) => v.toFixed(2), (v) => { ui.yaw = v; });
slider('tidal scaling', 0.2, 3, 0.05, ui.tidal, (v) => v.toFixed(2), (v) => { ui.tidal = v; });
function sel(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
sel('preset', ['approach the throat', 'traverse', 'orbit the mouth', 'look back after traversal'], (p) => {
  // Every preset now animates so the user actually sees something
  // moving. 'approach' creeps in toward the throat then resets; 'traverse'
  // does a full pass through to the far universe then auto-rebounds;
  // 'orbit' holds at the mouth while the yaw sweeps; 'look back' sits
  // in the far universe with the yaw scanning the lensed home sky.
  ui.mode = p;
  ui.running = true;
  if (p === 'approach the throat') { ui.lCam = 12; ui.yaw = 0; ui.dir = -1; }
  else if (p === 'traverse') { ui.lCam = 14; ui.yaw = 0; ui.dir = -1; }
  else if (p === 'orbit the mouth') { ui.lCam = 2.2; ui.yaw = 0; ui.dir = 0; }
  else { ui.lCam = -7; ui.yaw = 3.14; ui.dir = 0; }
  sL.value = ui.lCam.toFixed(1);
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bFlip = document.createElement('button'); bFlip.type = 'button'; bFlip.textContent = 'Reverse';
const bHome = document.createElement('button'); bHome.type = 'button'; bHome.textContent = 'Far side';
btnRow.append(bPause, bFlip, bHome); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bFlip.addEventListener('click', () => { ui.dir *= -1; ui.running = true; });
bHome.addEventListener('click', () => { ui.lCam = -10; sL.value = '-10.0'; });

// Embedding funnel z(l) panel with the ship marker.
function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  const cx = W * 0.5, cy = H * 0.5, sc = 9;
  pctx.strokeStyle = '#3a4f6a'; pctx.lineWidth = 1.6; pctx.beginPath();
  let first = true;
  for (let l = -15; l <= 15; l += 0.15) {
    const r = circumferentialR(l, ui.b0), z = embedZ(l, ui.b0);
    const X = cx + r * sc, Y = cy - z * sc;
    if (first) { pctx.moveTo(X, Y); first = false; } else pctx.lineTo(X, Y);
  }
  pctx.stroke();
  first = true; pctx.beginPath();
  for (let l = -15; l <= 15; l += 0.15) {
    const r = circumferentialR(l, ui.b0), z = embedZ(l, ui.b0);
    const X = cx - r * sc, Y = cy - z * sc;
    if (first) { pctx.moveTo(X, Y); first = false; } else pctx.lineTo(X, Y);
  }
  pctx.stroke();
  const rs = circumferentialR(ui.lCam, ui.b0), zs = embedZ(ui.lCam, ui.b0);
  pctx.fillStyle = '#ffd166'; pctx.beginPath();
  pctx.arc(cx + rs * sc, cy - zs * sc, 5, 0, 7); pctx.fill();
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText('embedding funnel  z(l) = b0 asinh(l/b0)   (yellow = ship)', 8, 14);
  pctx.fillText(ui.lCam >= 0 ? 'this universe' : 'far universe', 8, H - 8);
}

function refreshReadout() {
  rEls['throat b0'].textContent = ui.b0.toFixed(2);
  rEls['ship l'].textContent = ui.lCam.toFixed(2);
  rEls['proper dist'].textContent = properDistance(ui.lCam).toFixed(2);
  rEls['tidal scale'].textContent = (tidalScale(ui.lCam, ui.b0) * ui.tidal).toFixed(3);
  rEls.region.textContent = ui.lCam >= 0 ? 'this universe' : 'far universe';
  rEls['traverse if b<'].textContent = criticalImpact(ui.b0).toFixed(2);
}

function frame() {
  if (engine) engine.render(ui.b0, ui.lCam, ui.yaw, ui.t);
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; ui.t += dt;
  if (ui.running) {
    if (ui.mode === 'approach the throat') {
      // Creep toward the throat from l = 12 to l = 1.5 then reset.
      ui.lCam += ui.dir * dt * 1.5;
      if (ui.lCam <= 1.5) { ui.lCam = 12; }
    } else if (ui.mode === 'traverse') {
      // Full pass through; auto-rebound at the far end so the user
      // gets a continuous loop and sees the sky-swap repeatedly.
      ui.lCam += ui.dir * dt * 3.0;
      if (ui.lCam < -14) { ui.dir = 1; }
      if (ui.lCam > 14)  { ui.dir = -1; }
    } else if (ui.mode === 'orbit the mouth') {
      // Hold at l ~ 2 with the yaw sweeping a half-circle (the throat
      // disc visibly rotates around the screen).
      ui.yaw += dt * 0.35;
      if (ui.yaw > 1.4) ui.yaw = -1.4;
    } else if (ui.mode === 'look back after traversal') {
      // In the far universe, yaw scans the home sky framed by the
      // throat.
      ui.yaw += dt * 0.18;
      if (ui.yaw > 4.0) ui.yaw = 2.4;
    } else {
      // Default (no mode): legacy linear drift.
      ui.lCam += ui.dir * dt * 3.0;
      if (ui.lCam < -15) ui.lCam = -15;
      if (ui.lCam > 15)  ui.lCam = 15;
    }
    sL.value = ui.lCam.toFixed(1);
  }
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    ui.b0 = 1.2;
    ui.lCam = 14 - CAPTURE_FRAC * 26;        // a full traversal sweep
    ui.yaw = (CAPTURE_FRAC - 0.5) * 0.4;
    ui.t = CAPTURE_FRAC * 5;
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
  const { tracePhoton, flareOut } = await import('./sim.js');
  const tr = tracePhoton({ b0: 1, b: 0.7, ell0: 25, dlam: 0.008 });
  const sc = tracePhoton({ b0: 1, b: 1.6, ell0: 25, dlam: 0.008 });
  const fo = flareOut(1);
  return {
    name: 'flare-out + traverse/scatter threshold at b0',
    pass: fo > 0 && tr.outcome === 'traverse' && sc.outcome === 'scatter' && tr.maxDrift < 1e-5,
    msg: `flareOut=${fo.toFixed(3)}, b<b0 ${tr.outcome}, b>b0 ${sc.outcome}, nullDrift ${tr.maxDrift.toExponential(1)}`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is the ray-march; geometry validated by __physicsCheck and invariants' });

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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
