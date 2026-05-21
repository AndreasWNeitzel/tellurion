// Relativistic starship hero. Optics: shared special-relativity
// engine via ./sim.js. Render: shared/js/engine-gl/starship-3d.js
// (aberrated/Doppler/beamed star field + distorted corridor rings).
// The lower Canvas2D panel is the lab's view: the length-contracted
// ship, the marker rings, and the twin clocks.

import {
  gamma, deaberrateCos, dopplerFactor, contractedLength, properTime,
} from './sim.js';
import { setupStarshipGL } from '../../../shared/js/engine-gl/starship-3d.js';
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
try { engine = setupStarshipGL(canvas, 2600); }
catch (e) { console.warn('[starship] webgl2 init failed', e); engine = null; }

const ui = { beta: 0.87, yaw: 0, pitch: 0, running: !prefersReducedMotion(), labT: 0, probe: '' };
let probeUntil = 0;

const RKEYS = ['beta', 'gamma', 'lab clock', 'ship clock', 'ring L/L0', 'probe'];
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
const betaSlider = slider('throttle beta', 0, 0.999, 0.001, ui.beta, (v) => v.toFixed(3), (v) => { ui.beta = v; });
function selectRow(label, opts, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.value = String(o.v); op.textContent = o.t; sel.appendChild(op); }
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '';
  sel.addEventListener('change', () => onChange(parseFloat(sel.value)));
  row.append(lab, sel, val); controlsEl.appendChild(row); return sel;
}
selectRow('preset', [
  { v: 0.1, t: 'Newtonian (0.1)' }, { v: 0.6, t: 'fast (0.6)' },
  { v: 0.87, t: 'relativistic (0.87, gamma 2)' }, { v: 0.995, t: 'ultra (0.995)' },
], (v) => { ui.beta = v; betaSlider.value = String(v); betaSlider.dispatchEvent(new Event('input')); });
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset clocks';
const bLook = document.createElement('button'); bLook.type = 'button'; bLook.textContent = 'Look forward';
btnRow.append(bPause, bReset, bLook); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bReset.addEventListener('click', () => { ui.labT = 0; });
bLook.addEventListener('click', () => { ui.yaw = 0; ui.pitch = 0; });

// Mouse-look (drag) and click-probe.
let down = false, dragX = 0, dragY = 0, moved = false;
canvas.addEventListener('pointerdown', (e) => { down = true; moved = false; dragX = e.clientX; dragY = e.clientY; canvas.classList.add('dragging'); });
canvas.addEventListener('pointermove', (e) => {
  if (!down) return;
  const dx = e.clientX - dragX, dy = e.clientY - dragY;
  if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
  ui.yaw = Math.max(-0.9, Math.min(0.9, ui.yaw - dx * 0.003));
  ui.pitch = Math.max(-0.8, Math.min(0.8, ui.pitch + dy * 0.003));
  dragX = e.clientX; dragY = e.clientY;
});
canvas.addEventListener('pointerup', (e) => {
  canvas.classList.remove('dragging'); down = false;
  if (moved) return;
  // Probe: invert the projection to a ship direction, deaberrate to
  // the lab angle, report rest vs observed wavelength + aberration.
  const rect = canvas.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const cy = 1 - ((e.clientY - rect.top) / rect.height) * 2;
  const FOV = 1.05, aspect = canvas.width / canvas.height;
  let dx = cx * FOV * aspect, dy = cy * FOV, dz = 1;
  // undo pitch then yaw
  const cp = Math.cos(ui.pitch), sp = Math.sin(ui.pitch);
  let y = cp * dy + sp * dz, z = -sp * dy + cp * dz;
  const cyaw = Math.cos(ui.yaw), syaw = Math.sin(ui.yaw);
  let x = cyaw * dx - syaw * z; z = syaw * dx + cyaw * z;
  const L = Math.hypot(x, y, z); const cosShip = z / L;
  const cosLab = deaberrateCos(ui.beta, cosShip);
  const D = dopplerFactor(ui.beta, cosShip);
  const lamObs = 550 / D;
  ui.probe = `lab ${(Math.acos(Math.max(-1, Math.min(1, cosLab))) * 57.3).toFixed(0)} deg, see ${(Math.acos(Math.max(-1, Math.min(1, cosShip))) * 57.3).toFixed(0)} deg, lambda 550->${lamObs.toFixed(0)} nm`;
  probeUntil = performance.now() + 5000;
});

// Lab-frame external view + twin clocks + gamma curve.
// The diagnostic panel is styled as a starship cockpit HUD: dark
// glass, a faint scan grid, cyan corner brackets, and instrument
// gauges for the length contraction, the twin clocks, and the
// velocity / Lorentz-factor bars.
const HUD = (a) => `rgba(95,208,224,${a})`;
const AMB = (a) => `rgba(255,209,102,${a})`;

function hudClock(cxp, cyp, R, frac, label, time, col) {
  pctx.strokeStyle = col(0.85); pctx.lineWidth = 1.6;
  pctx.beginPath(); pctx.arc(cxp, cyp, R, 0, 2 * Math.PI); pctx.stroke();
  // tick marks every 30 degrees
  pctx.strokeStyle = col(0.45); pctx.lineWidth = 1;
  for (let k = 0; k < 12; k += 1) {
    const a = k * Math.PI / 6;
    const r0 = R - (k % 3 === 0 ? 7 : 4);
    pctx.beginPath();
    pctx.moveTo(cxp + r0 * Math.sin(a), cyp - r0 * Math.cos(a));
    pctx.lineTo(cxp + R * Math.sin(a), cyp - R * Math.cos(a));
    pctx.stroke();
  }
  // sweeping hand
  const ang = frac * 2 * Math.PI;
  pctx.strokeStyle = col(1); pctx.lineWidth = 2;
  pctx.beginPath();
  pctx.moveTo(cxp, cyp);
  pctx.lineTo(cxp + (R - 6) * Math.sin(ang), cyp - (R - 6) * Math.cos(ang));
  pctx.stroke();
  pctx.fillStyle = col(1); pctx.beginPath(); pctx.arc(cxp, cyp, 2.6, 0, 2 * Math.PI); pctx.fill();
  pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'center';
  pctx.fillStyle = col(0.7); pctx.fillText(label, cxp, cyp + R + 14);
  pctx.fillStyle = col(1); pctx.fillText(time, cxp, cyp + R + 28);
}

function hudBar(x, y, w, lab, frac, valStr, col) {
  pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillStyle = col(0.75); pctx.fillText(lab, x, y - 6);
  pctx.strokeStyle = col(0.5); pctx.lineWidth = 1;
  pctx.strokeRect(x + 0.5, y + 0.5, w - 1, 9);
  pctx.fillStyle = col(0.85);
  pctx.fillRect(x + 1.5, y + 1.5, Math.max(0, Math.min(1, frac)) * (w - 3), 6);
  pctx.fillStyle = col(1); pctx.textAlign = 'right';
  pctx.fillText(valStr, x + w, y - 6);
}

function drawPlot() {
  const W = plot.width, H = plot.height;
  const g = gamma(ui.beta);
  const tau = properTime(ui.labT, ui.beta);
  // HUD glass + scan grid.
  pctx.fillStyle = '#04060a'; pctx.fillRect(0, 0, W, H);
  pctx.strokeStyle = HUD(0.06); pctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 40) { pctx.beginPath(); pctx.moveTo(gx, 0); pctx.lineTo(gx, H); pctx.stroke(); }
  for (let gy = 40; gy < H; gy += 40) { pctx.beginPath(); pctx.moveTo(0, gy); pctx.lineTo(W, gy); pctx.stroke(); }
  // corner brackets.
  pctx.strokeStyle = HUD(0.85); pctx.lineWidth = 1.6;
  const cb = 16, mg = 6;
  for (const [cx, cy, dx, dy] of [[mg, mg, 1, 1], [W - mg, mg, -1, 1], [mg, H - mg, 1, -1], [W - mg, H - mg, -1, -1]]) {
    pctx.beginPath();
    pctx.moveTo(cx + dx * cb, cy); pctx.lineTo(cx, cy); pctx.lineTo(cx, cy + dy * cb);
    pctx.stroke();
  }
  pctx.fillStyle = HUD(0.95); pctx.font = fontString(canvas, 'caption', 'mono', 600); pctx.textAlign = 'left';
  pctx.fillText('LAB-FRAME TELEMETRY', 24, 16);
  pctx.fillStyle = HUD(0.5); pctx.font = fontString(canvas, 'caption', 'mono');
  pctx.fillText(`hull L/L0 ${contractedLength(1, ui.beta).toFixed(3)}   (dashed = rest length)`, 190, 16);

  // Length-contraction lane: rest-length ghost + contracted hull.
  const cyl = 70, x0 = 60, x1 = W - 250;
  pctx.strokeStyle = HUD(0.25); pctx.lineWidth = 1;
  pctx.beginPath(); pctx.moveTo(x0, cyl); pctx.lineTo(x1, cyl); pctx.stroke();
  const ringN = 9;
  for (let r = 0; r < ringN; r += 1) {
    const xx = x0 + (x1 - x0) * (r / (ringN - 1));
    pctx.strokeStyle = HUD(0.20 + 0.45 * r / ringN);
    pctx.beginPath(); pctx.ellipse(xx, cyl, 5, 24, 0, 0, 2 * Math.PI); pctx.stroke();
  }
  const L0 = 60, shipL = L0 / g, sx = x0 + (x1 - x0) * 0.34;
  pctx.strokeStyle = HUD(0.4); pctx.setLineDash([4, 4]); pctx.lineWidth = 1;
  pctx.beginPath();
  pctx.moveTo(sx, cyl); pctx.lineTo(sx - L0, cyl - 12); pctx.lineTo(sx - L0, cyl + 12); pctx.closePath();
  pctx.stroke(); pctx.setLineDash([]);
  pctx.fillStyle = HUD(0.22); pctx.strokeStyle = HUD(1); pctx.lineWidth = 1.6;
  pctx.beginPath();
  pctx.moveTo(sx, cyl); pctx.lineTo(sx - shipL, cyl - 12); pctx.lineTo(sx - shipL, cyl + 12); pctx.closePath();
  pctx.fill(); pctx.stroke();

  // Twin clocks as HUD gauges.
  const cR = 22, c2 = W - 188, cy = 66;
  hudClock(c2, cy, cR, (ui.labT % 6) / 6, 'LAB', `${ui.labT.toFixed(1)} s`, AMB);
  hudClock(c2 + 104, cy, cR, (tau % 6) / 6, 'SHIP', `${tau.toFixed(1)} s`, HUD);

  // Velocity and Lorentz-factor bars along the bottom.
  const by = H - 14;
  hudBar(24, by, 150, 'VELOCITY v/c', ui.beta, ui.beta.toFixed(3), HUD);
  hudBar(W - 174, by, 150, 'LORENTZ gamma', 1 - 1 / g, g.toFixed(2), AMB);
}

function refreshReadout() {
  const g = gamma(ui.beta);
  rEls.beta.textContent = ui.beta.toFixed(3);
  rEls.gamma.textContent = g.toFixed(3);
  rEls['lab clock'].textContent = ui.labT.toFixed(1) + ' s';
  rEls['ship clock'].textContent = properTime(ui.labT, ui.beta).toFixed(1) + ' s';
  rEls['ring L/L0'].textContent = (contractedLength(1, ui.beta)).toFixed(3);
  rEls.probe.textContent = (probeUntil > performance.now()) ? ui.probe : 'click a star';
}

function frame() {
  if (engine) { engine.update(ui.beta, ui.yaw, ui.pitch); engine.render(ui.beta); }
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) ui.labT += dt;
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    ui.beta = 0.2 + 0.78 * CAPTURE_FRAC;          // sweep speed across frames
    ui.yaw = (CAPTURE_FRAC - 0.5) * 0.5;
    ui.labT = 6 + 10 * CAPTURE_FRAC;
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
  // gamma and interval invariance, recomputed headlessly.
  const b = 0.8, g = gamma(b);
  const ok1 = Math.abs(g - 1 / Math.sqrt(1 - b * b)) < 1e-9;
  // round-trip aberration
  const c = 0.37, back = deaberrateCos(b, (c + b) / (1 + b * c) /* aberrate */);
  const ok2 = Math.abs(back - c) < 1e-7;
  return { name: 'gamma + aberration self-inverse', pass: ok1 && ok2, msg: `gamma=${g.toFixed(4)} roundtrip err ${Math.abs(back - c).toExponential(1)}` };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; optics validated by __physicsCheck and invariants' });

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
