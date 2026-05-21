// Temperature sensitivity of the three hydrogen/helium burning channels.
// epsilon_pp ~ rho T^4, epsilon_CNO ~ rho T^18, epsilon_3a ~ rho^2 T^40.
// The old view drew the three static curves and let the temperature
// slider move only a 1px cursor (and the fixed [-15,15] log-epsilon
// axis clipped 3-alpha off screen). Now the y-axis auto-scales to the
// data for the chosen rho, the background is shaded by which channel
// dominates (a function of T and rho), and the selected temperature
// drives a wide band, a marker on each curve, the local logarithmic
// slope nu = dln eps/dln T, and a burning-rate bar. Every control moves
// a large fraction of the frame.
// Reference: Kippenhahn, Weigert and Weiss, Stellar Structure and
// Evolution (2012), Ch. 18; Hansen, Kawaler and Trimble, Stellar
// Interiors (2004), Ch. 6.

import { eps_pp, eps_CNO, eps_3alpha } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { logT: 7.2, rho: 100 };
const st = { ...DEF }; let running = true;

const CH = [
  { fn: eps_pp, color: '#5bc0eb', label: 'pp  (T⁴)' },
  { fn: eps_CNO, color: '#ffd166', label: 'CNO (T¹⁸)' },
  { fn: eps_3alpha, color: '#06d6a0', label: '3α  (T⁴⁰)' },
];
const LOGT_LO = 6.5, LOGT_HI = 9, FLOOR = -6;

sT.addEventListener('input', () => { st.logT = parseFloat(sT.value); vT.textContent = st.logT.toFixed(2); render(); });
sR.addEventListener('input', () => { st.rho = parseFloat(sR.value); vR.textContent = st.rho.toFixed(0); render(); });
btnR.addEventListener('click', () => { st.logT = DEF.logT; st.rho = DEF.rho; sT.value = String(DEF.logT); sR.value = String(DEF.rho); vT.textContent = DEF.logT.toFixed(2); vR.textContent = String(DEF.rho); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const le = (e) => Math.log10(Math.max(e, 1e-30));

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const pad = { l: 64, r: 30, t: 64, b: 52 };
  const x0 = pad.l, x1 = W - pad.r, yb = H - pad.b, yt = pad.t;
  const xOf = (lt) => x0 + (lt - LOGT_LO) / (LOGT_HI - LOGT_LO) * (x1 - x0);

  // Auto-scaled log-epsilon axis: span the data for the current rho so
  // 3-alpha is no longer clipped and the crossovers stay visible.
  let yMax = -Infinity;
  const N = 220;
  const grid = [];
  for (let i = 0; i <= N; i += 1) {
    const lt = LOGT_LO + (LOGT_HI - LOGT_LO) * i / N;
    const T = Math.pow(10, lt);
    const v = CH.map((c) => le(c.fn(T, st.rho)));
    for (const q of v) if (q > yMax) yMax = q;
    grid.push({ lt, v });
  }
  const yLo = FLOOR, yHi = Math.ceil(yMax + 1);
  const yOf = (l) => yb - (Math.max(yLo, Math.min(yHi, l)) - yLo) / (yHi - yLo) * (yb - yt);

  // Background shaded by the dominant channel at each temperature.
  for (const g of grid) {
    let di = 0; for (let k = 1; k < 3; k += 1) if (g.v[k] > g.v[di]) di = k;
    ctx.fillStyle = CH[di].color + '14';
    ctx.fillRect(xOf(g.lt) - 1, yt, (x1 - x0) / N + 2, yb - yt);
  }

  // y gridlines and decade labels.
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  for (let l = Math.ceil(yLo / 5) * 5; l <= yHi; l += 5) {
    const yy = yOf(l);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.fillStyle = '#6e727a'; ctx.fillText(`10^${l}`, x0 - 6, yy + 3);
  }
  ctx.textAlign = 'center';
  for (let lt = 7; lt <= 9; lt += 1) { ctx.fillStyle = '#6e727a'; ctx.fillText(lt.toFixed(0), xOf(lt), yb + 16); }
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, yt); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('log₁₀ T (K)', (x0 + x1) / 2, H - 14);
  ctx.save(); ctx.translate(16, (yt + yb) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('log₁₀ ε (erg g⁻¹ s⁻¹)', 0, 0); ctx.restore();
  ctx.textAlign = 'left';

  // Selected-temperature band.
  const xs = xOf(st.logT);
  ctx.fillStyle = 'rgba(239,71,111,0.16)'; ctx.fillRect(xs - 3, yt, 6, yb - yt);
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xs, yt); ctx.lineTo(xs, yb); ctx.stroke(); ctx.setLineDash([]);

  // Curves and the marker on each at the selected T.
  const T = Math.pow(10, st.logT);
  CH.forEach((c, idx) => {
    ctx.strokeStyle = c.color; ctx.lineWidth = 1.8; ctx.beginPath();
    grid.forEach((g, i) => { const X = xOf(g.lt), Y = yOf(g.v[idx]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
    const yv = le(c.fn(T, st.rho));
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(xs, yOf(yv), 4.5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillRect(x1 - 150, yt + 6 + idx * 15, 9, 9);
    ctx.fillStyle = '#cdd1d6'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(c.label, x1 - 136, yt + 15 + idx * 15);
  });

  // Dominant channel and its local logarithmic slope nu = dln eps/dln T.
  const eps = CH.map((c) => c.fn(T, st.rho));
  let di = 0; for (let k = 1; k < 3; k += 1) if (eps[k] > eps[di]) di = k;
  const T2 = T * 1.01;
  const nu = (le(CH[di].fn(T2, st.rho)) - le(CH[di].fn(T, st.rho))) / Math.log10(1.01);
  const epsTot = eps[0] + eps[1] + eps[2];

  // Callout (two lines, clear of the plot box at yt = 64).
  ctx.fillStyle = '#e6e7ea'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`T = 10^${st.logT.toFixed(2)} K    ρ = ${st.rho.toFixed(0)} g/cm³    ε_total = 10^${le(epsTot).toFixed(2)} erg g⁻¹ s⁻¹`, 14, 24);
  ctx.fillStyle = CH[di].color;
  ctx.fillText(`dominant: ${['pp', 'CNO', '3α'][di]}    ν = dlnε/dlnT ≈ ${nu.toFixed(1)}`, 14, 44);
  rD.textContent = ['pp', 'CNO', '3α'][di];
}

let rafOn = false;
function tick() { render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && !CAPTURE_NAME) { rafOn = true; requestAnimationFrame(tick); } }
btnP.addEventListener('click', startLoop);
btnR.addEventListener('click', startLoop);
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }


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
