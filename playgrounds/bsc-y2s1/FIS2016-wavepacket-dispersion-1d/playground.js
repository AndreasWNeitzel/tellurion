// Free-particle Gaussian wavepacket. Top: the packet as a glowing
// probability cloud |psi(x,t)|^2 with the Re(psi) carrier riding
// inside it, translating at the group velocity v = hbar k0/m and
// visibly broadening and dimming as it disperses. Bottom: an (x, t)
// waterfall so the dispersion is unmistakable, the bright worldline
// fans out and its slope is the group velocity. The analytic
// solution in sim.js (spreadAt, center, density, realPsi) is
// unchanged. Reference: Eisberg and Resnick, Quantum Physics, Ch. 5.
import { density, realPsi, spreadAt, center } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { s0: 1, k0: 3, t: 0 };
let running = !prefersReducedMotion();
const XMIN = -4, XMAX = 34;
const PX0 = 40, PX1 = W - 30;
const xToPx = (x) => PX0 + (x - XMIN) / (XMAX - XMIN) * (PX1 - PX0);

// waterfall offscreen (x across, time down)
const WFW = 480, WFH = 190;
const wf = document.createElement('canvas'); wf.width = WFW; wf.height = WFH;
const wfx = wf.getContext('2d');
wfx.fillStyle = '#05060c'; wfx.fillRect(0, 0, WFW, WFH);
const rowImg = wfx.createImageData(WFW, 1);

function rowColor(d, dmax) {
  const u = Math.min(1, Math.sqrt(d / (dmax + 1e-9)));
  // dark -> blue -> cyan -> white
  const r = u < 0.5 ? 20 + 60 * u : 40 + 380 * (u - 0.5);
  const g = u < 0.5 ? 60 + 180 * u : 150 + 210 * (u - 0.5);
  const b = 90 + 165 * Math.min(1, u * 1.4);
  return [Math.min(255, r) | 0, Math.min(255, g) | 0, Math.min(255, b) | 0];
}
function pushWaterfall(t) {
  let dmax = 1e-9;
  for (let i = 0; i < WFW; i += 1) { const x = XMIN + (XMAX - XMIN) * i / WFW; dmax = Math.max(dmax, density(x, t, 0, st.k0, st.s0)); }
  for (let i = 0; i < WFW; i += 1) {
    const x = XMIN + (XMAX - XMIN) * i / WFW;
    const [r, g, b] = rowColor(density(x, t, 0, st.k0, st.s0), dmax);
    const k = i * 4; rowImg.data[k] = r; rowImg.data[k + 1] = g; rowImg.data[k + 2] = b; rowImg.data[k + 3] = 255;
  }
  wfx.drawImage(wf, 0, -1);                       // scroll up 1 px
  wfx.putImageData(rowImg, 0, WFH - 1);
}
function resetWaterfall() {
  wfx.fillStyle = '#05060c'; wfx.fillRect(0, 0, WFW, WFH);
}

sS.addEventListener('input', () => { st.s0 = parseFloat(sS.value); vS.textContent = st.s0.toFixed(2); st.t = 0; resetWaterfall(); });
sK.addEventListener('input', () => { st.k0 = parseFloat(sK.value); vK.textContent = st.k0.toFixed(1); st.t = 0; resetWaterfall(); });
btnR.addEventListener('click', () => { st.s0 = 1; st.k0 = 3; st.t = 0; sS.value = '1'; vS.textContent = '1.00'; sK.value = '3'; vK.textContent = '3.0'; resetWaterfall(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  if (!CAPTURE_NAME && running) { st.t += 0.03; if (st.t > 6) { st.t = 0; resetWaterfall(); } if (Math.round(st.t / 0.03) % 2 === 0) pushWaterfall(st.t); }
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('A quantum wavepacket: it moves at the group velocity and spreads as it goes', 18, 26);

  const sig = spreadAt(st.s0, st.t), c = center(0, st.k0, st.t);
  // top: glowing probability cloud + Re(psi) carrier
  const cyT = 146, lane = 78;
  let dmax = 1e-9, N = 460;
  for (let i = 0; i <= N; i += 1) { const x = XMIN + (XMAX - XMIN) * i / N; dmax = Math.max(dmax, density(x, st.t, 0, st.k0, st.s0)); }
  for (let i = 0; i <= N; i += 1) {
    const x = XMIN + (XMAX - XMIN) * i / N;
    const d = density(x, st.t, 0, st.k0, st.s0) / dmax;
    if (d < 0.004) continue;
    const px = xToPx(x), hh = d * lane;
    const a = (0.10 + 0.5 * d).toFixed(3);
    ctx.fillStyle = `rgba(91,192,235,${a})`;
    ctx.fillRect(px, cyT - hh, (PX1 - PX0) / N + 1, 2 * hh);
  }
  // Re(psi) carrier (the internal de Broglie oscillation)
  ctx.strokeStyle = 'rgba(255,209,102,0.9)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = XMIN + (XMAX - XMIN) * i / N;
    const y = cyT - realPsi(x, st.t, 0, st.k0, st.s0) * 150;
    if (i === 0) ctx.moveTo(xToPx(x), y); else ctx.lineTo(xToPx(x), y);
  }
  ctx.stroke();
  // sigma(t) bracket + centre
  ctx.strokeStyle = 'rgba(6,214,160,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xToPx(c), cyT - lane - 14); ctx.lineTo(xToPx(c), cyT + lane + 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xToPx(c - sig), cyT + lane + 10); ctx.lineTo(xToPx(c + sig), cyT + lane + 10); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`+/- sigma(t) = ${sig.toFixed(2)}`, xToPx(c) + 6, cyT + lane + 26);

  // bottom: (x, t) waterfall, dispersion fans the worldline out
  const wy = 280, wfdrawW = PX1 - PX0;
  ctx.drawImage(wf, PX0, wy, wfdrawW, WFH);
  ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.strokeRect(PX0 + 0.5, wy + 0.5, wfdrawW - 1, WFH - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('(x, t) waterfall: the bright worldline drifts (group velocity) and widens (dispersion)', PX0, wy - 8);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('x  ->', PX1 - 40, wy + WFH + 16);
  ctx.save(); ctx.translate(PX0 - 6, wy + WFH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('t (old -> new, down)', -40, 0); ctx.restore();

  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`sigma0 = ${st.s0.toFixed(2)}   k0 = ${st.k0.toFixed(1)}   v_g = hbar k0/m = ${st.k0.toFixed(1)}   t = ${st.t.toFixed(2)}   sigma(t) = ${sig.toFixed(2)}`, 18, H - 14);
  rS.textContent = sig.toFixed(2);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.t = frac * 5.0;
    resetWaterfall();
    for (let tt = 0; tt <= st.t + 1e-6; tt += 0.06) pushWaterfall(tt);   // deterministic history
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
