// Quantum vs classical random walk on a 1D lattice of 101 sites.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const N = 101;
const CENTER = (N - 1) / 2;

const state = { steps: 50 };

function classical(steps) {
  const p = new Float64Array(N);
  for (let xi = 0; xi < N; xi += 1) {
    const x = xi - CENTER;
    if (Math.abs(x) > steps || ((steps + x) & 1) !== 0) continue;
    const k = (steps + x) / 2;
    let lp = -steps * Math.log(2);
    for (let i = 1; i <= k; i += 1) lp += Math.log(steps - k + i) - Math.log(i);
    p[xi] = Math.exp(lp);
  }
  return p;
}

function quantum(steps) {
  let lR = new Float64Array(N), lI = new Float64Array(N);
  let rR = new Float64Array(N), rI = new Float64Array(N);
  // initial coin (|L> + i|R>)/sqrt2 produces a symmetric Hadamard distribution
  const inv = 1 / Math.SQRT2;
  lR[CENTER] = inv; rI[CENTER] = inv;
  for (let t = 0; t < steps; t += 1) {
    const aLR = new Float64Array(N), aLI = new Float64Array(N);
    const aRR = new Float64Array(N), aRI = new Float64Array(N);
    for (let x = 0; x < N; x += 1) {
      aLR[x] = (lR[x] + rR[x]) * inv; aLI[x] = (lI[x] + rI[x]) * inv;
      aRR[x] = (lR[x] - rR[x]) * inv; aRI[x] = (lI[x] - rI[x]) * inv;
    }
    const nLR = new Float64Array(N), nLI = new Float64Array(N);
    const nRR = new Float64Array(N), nRI = new Float64Array(N);
    for (let x = 0; x < N; x += 1) {
      if (x - 1 >= 0) { nLR[x - 1] = aLR[x]; nLI[x - 1] = aLI[x]; }
      if (x + 1 <  N) { nRR[x + 1] = aRR[x]; nRI[x + 1] = aRI[x]; }
    }
    lR = nLR; lI = nLI; rR = nRR; rI = nRI;
  }
  const p = new Float64Array(N);
  for (let x = 0; x < N; x += 1) {
    p[x] = lR[x] * lR[x] + lI[x] * lI[x] + rR[x] * rR[x] + rI[x] * rI[x];
  }
  return p;
}

function variance(p) {
  let m = 0, tot = 0;
  for (let x = 0; x < N; x += 1) { m += (x - CENTER) * p[x]; tot += p[x]; }
  m /= Math.max(tot, 1e-12);
  let v = 0;
  for (let x = 0; x < N; x += 1) v += p[x] * (x - CENTER - m) ** 2;
  return v / Math.max(tot, 1e-12);
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const pC = classical(state.steps);
  const pQ = quantum(state.steps);
  const baseY = H - 50;
  const dx = (W / 2) / N;
  let mx = 0;
  for (let i = 0; i < N; i += 1) { if (pC[i] > mx) mx = pC[i]; if (pQ[i] > mx) mx = pQ[i]; }
  const ys = (H - 110) / Math.max(mx, 1e-9);

  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'body');
  ctx.fillText('Classical (binomial)', 20, 28);
  ctx.fillStyle = '#7c9cff';
  for (let i = 0; i < N; i += 1) ctx.fillRect(i * dx + 4, baseY - pC[i] * ys, dx - 1.5, pC[i] * ys);

  ctx.fillStyle = '#dcdde2';
  ctx.fillText('Quantum (Hadamard)', W / 2 + 20, 28);
  ctx.fillStyle = '#ffd57f';
  for (let i = 0; i < N; i += 1) ctx.fillRect(W / 2 + i * dx + 4, baseY - pQ[i] * ys, dx - 1.5, pQ[i] * ys);

  ctx.strokeStyle = 'rgba(220,220,240,0.4)';
  ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(W, baseY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, baseY); ctx.stroke();

  const vC = variance(pC), vQ = variance(pQ);
  readoutInv.textContent = `var_C=${vC.toFixed(2)} var_Q=${vQ.toFixed(2)} ratio=${(vQ / Math.max(vC, 1e-6)).toFixed(2)}`;
  readoutFrame.textContent = String(state.steps);
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'qrw-steps'; lab.textContent = 'Steps N';
  const inp = document.createElement('input'); inp.id = 'qrw-steps'; inp.type = 'range'; inp.min = '1'; inp.max = '50'; inp.value = String(state.steps);
  inp.setAttribute('aria-label', 'Number of walk steps');
  const val = document.createElement('span'); val.className = 'value'; val.textContent = String(state.steps);
  inp.addEventListener('input', () => { state.steps = parseInt(inp.value, 10); val.textContent = String(state.steps); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
}

buildControls();
render();
if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  const pQ = quantum(state.steps);
  let total = 0; for (let i = 0; i < N; i += 1) total += pQ[i];
  if (Math.abs(total - 1) > 1e-8) return { name: 'unitarity', pass: false, msg: `sum|psi|^2 = ${total}` };
  const vC = variance(classical(50));
  const vQ = variance(quantum(50));
  if (Math.abs(vC - 50) / 50 > 0.05) return { name: 'classical var', pass: false, msg: `var_C(50) = ${vC.toFixed(2)}` };
  if (vQ < 75) return { name: 'quantum speedup', pass: false, msg: `var_Q(50) = ${vQ.toFixed(2)}` };
  return { name: 'unitarity + speedup', pass: true, msg: `sum=1 var_C=${vC.toFixed(2)} var_Q=${vQ.toFixed(2)}` };
};


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
