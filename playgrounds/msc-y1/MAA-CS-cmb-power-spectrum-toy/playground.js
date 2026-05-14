import { Dl } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rL = document.getElementById('readout-l');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { lPeak: 220, lDamp: 2000 }; let running = true;
sL.addEventListener('input', () => { st.lPeak = parseFloat(sL.value); vL.textContent = st.lPeak.toFixed(0); });
sD.addEventListener('input', () => { st.lDamp = parseFloat(sD.value); vD.textContent = st.lDamp.toFixed(0); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('D_ℓ (μK²)', 12, pad.t + 10); ctx.fillText('ℓ', W - 30, H - pad.b + 14);
  const lMin = 2, lMax = 3000;
  const xToPx = (l) => pad.l + (l - lMin) / (lMax - lMin) * (W - pad.l - pad.r);
  let max = 0;
  const N = 600; const vals = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const l = lMin + (lMax - lMin) * i / (N - 1);
    vals[i] = Dl(l, st.lPeak, st.lDamp);
    if (vals[i] > max) max = vals[i];
  }
  const yToPx = (d) => H - pad.b - d / max * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const l = lMin + (lMax - lMin) * i / (N - 1);
    const px = xToPx(l), py = yToPx(vals[i]);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Peak marker.
  let peakIdx = 0;
  for (let i = 0; i < N; i += 1) if (vals[i] > vals[peakIdx]) peakIdx = i;
  const peakL = lMin + (lMax - lMin) * peakIdx / (N - 1);
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(peakL), pad.t); ctx.lineTo(xToPx(peakL), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`ℓ_1 ≈ ${peakL.toFixed(0)}`, xToPx(peakL) + 4, pad.t + 14);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`First acoustic peak at ℓ ≈ ${peakL.toFixed(0)}`, 12, H - 14);
  rL.textContent = peakL.toFixed(0);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
