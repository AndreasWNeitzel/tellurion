import { gapAtT, Tc, gapZero } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { N0V: 0.3, tRel: 0.3 }; let running = true;
sN.addEventListener('input', () => { st.N0V = parseFloat(sN.value); vN.textContent = st.N0V.toFixed(2); });
sT.addEventListener('input', () => { st.tRel = parseFloat(sT.value); vT.textContent = st.tRel.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('Δ(T) / Δ(0)', 12, pad.t + 10); ctx.fillText('T / T_c', W - 60, H - pad.b + 14);
  const Tc_v = Tc(st.N0V);
  const Delta0 = gapZero(st.N0V);
  const xToPx = (t) => pad.l + t * (W - pad.l - pad.r);
  const yToPx = (d) => H - pad.b - d * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    const d = gapAtT(t * Tc_v, st.N0V) / Delta0;
    const px = xToPx(t), py = yToPx(d);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const tCur = Math.min(st.tRel, 1.05);
  const dCur = gapAtT(tCur * Tc_v, st.N0V) / Delta0;
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(tCur), yToPx(dCur), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(1), pad.t); ctx.lineTo(xToPx(1), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('T = T_c', xToPx(1) + 4, pad.t + 14);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`N(0)V = ${st.N0V.toFixed(2)}, Δ₀ = ${Delta0.toFixed(3)}, T_c = ${Tc_v.toFixed(3)}, 2Δ₀/kT_c = ${(2 * Delta0 / Tc_v).toFixed(3)}`, 12, H - 12);
  rD.textContent = dCur.toFixed(3);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
