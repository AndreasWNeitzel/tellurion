import { frictionMag } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { v_rel: 1.5, logM: 8 }; let running = true;
sV.addEventListener('input', () => { st.v_rel = parseFloat(sV.value); vV.textContent = st.v_rel.toFixed(2); });
sM.addEventListener('input', () => { st.logM = parseFloat(sM.value); vM.textContent = st.logM.toFixed(1); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('|a_df| (norm.)', 12, pad.t + 10); ctx.fillText('v / σ', W - 40, H - pad.b + 14);
  // Friction vs v/sigma curve (normalized).
  const sigma = 200e3, rho = 1e-21;
  const M_SUN = 1.989e30;
  const M = Math.pow(10, st.logM) * M_SUN;
  let maxF = 0;
  const N = 200; const vals = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const x = 0.05 + 4.95 * i / N;
    vals[i] = frictionMag(x * sigma, M, rho, sigma);
    if (vals[i] > maxF) maxF = vals[i];
  }
  const xToPx = (x) => pad.l + (x - 0.05) / 4.95 * (W - pad.l - pad.r);
  const yToPx = (f) => H - pad.b - f / maxF * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = 0.05 + 4.95 * i / N;
    if (i === 0) ctx.moveTo(xToPx(x), yToPx(vals[i])); else ctx.lineTo(xToPx(x), yToPx(vals[i]));
  }
  ctx.stroke();
  const fcur = frictionMag(st.v_rel * sigma, M, rho, sigma);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(st.v_rel), yToPx(fcur), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`v/σ = ${st.v_rel.toFixed(2)}, |a_df| ≈ ${fcur.toExponential(2)} m/s² (M = 10^${st.logM} M⊙)`, 12, H - 14);
  rA.textContent = fcur.toExponential(2) + ' m/s²';
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
