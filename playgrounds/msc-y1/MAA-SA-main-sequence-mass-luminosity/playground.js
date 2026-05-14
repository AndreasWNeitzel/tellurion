import { L_solar, MS_lifetime_Gyr } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rL = document.getElementById('readout-l');
const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { M: 1 }; let running = true;
sM.addEventListener('input', () => { st.M = parseFloat(sM.value); vM.textContent = st.M.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 L', 12, pad.t + 10); ctx.fillText('log10 M', W - 70, H - pad.b + 14);
  const xToPx = (lm) => pad.l + (lm + 1) / 3 * (W - pad.l - pad.r);
  const yToPx = (ll) => H - pad.b - (ll + 2) / 9 * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const M = Math.pow(10, -1 + 3 * i / 200);
    const L = L_solar(M);
    const px = xToPx(Math.log10(M)), py = yToPx(Math.log10(L));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const L = L_solar(st.M);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(Math.log10(st.M)), yToPx(Math.log10(L)), 8, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`M = ${st.M.toFixed(2)} M⊙, L = ${L.toFixed(2)} L⊙, t_MS ≈ ${MS_lifetime_Gyr(st.M).toExponential(2)} Gyr`, 12, H - 14);
  rL.textContent = `${L.toFixed(2)} L⊙`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
