import { ckmModulus, trianglePoints, angleBeta, angleGamma, CKM_DEFAULT } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { rho: 0.157, eta: 0.355 }; let running = true;
sR.addEventListener('input', () => { st.rho = parseFloat(sR.value); vR.textContent = st.rho.toFixed(3); });
sE.addEventListener('input', () => { st.eta = parseFloat(sE.value); vE.textContent = st.eta.toFixed(3); });
btnR.addEventListener('click', () => { st.rho = 0.157; st.eta = 0.355; sR.value = 0.157; sE.value = 0.355; vR.textContent = '0.157'; vE.textContent = '0.355'; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  // Left: CKM matrix.
  const mL = 30, mT = 60, cell = 70;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('|V_ij|', mL, mT - 14);
  const ckm = ckmModulus({ ...CKM_DEFAULT, rho: st.rho, eta: st.eta });
  const labels = ['d', 's', 'b']; const rowLabels = ['u', 'c', 't'];
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = '#ffd166'; ctx.fillText(labels[i], mL + cell * i + 25, mT - 4);
    for (let j = 0; j < 3; j += 1) {
      if (i === 0) { ctx.fillStyle = '#5bc0eb'; ctx.fillText(rowLabels[j], mL - 18, mT + cell * j + 35); }
      const v = ckm[j][i];
      const c = `rgba(255,209,102,${Math.min(1, v)})`;
      ctx.fillStyle = c; ctx.fillRect(mL + cell * i, mT + cell * j, cell - 4, cell - 4);
      ctx.fillStyle = '#060608'; ctx.font = '13px ui-monospace, monospace';
      ctx.fillText(v.toFixed(3), mL + cell * i + 10, mT + cell * j + cell / 2 + 5);
    }
  }
  // Right: triangle.
  const W2 = W - 320, cx2 = 350 + W2 / 2, cy2 = H - 80, sc = W2 * 0.6;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(350, cy2); ctx.lineTo(W - 30, cy2); ctx.moveTo(350 + (W2 - sc) / 2, 30); ctx.lineTo(350 + (W2 - sc) / 2, cy2 + 10); ctx.stroke();
  const x0 = 350 + (W2 - sc) / 2;
  const xToPx = (r) => x0 + r * sc;
  const yToPx = (e) => cy2 - e * sc;
  const A = trianglePoints({ rho: st.rho, eta: st.eta }).A;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,209,102,0.15)';
  ctx.beginPath();
  ctx.moveTo(xToPx(0), yToPx(0));
  ctx.lineTo(xToPx(1), yToPx(0));
  ctx.lineTo(xToPx(A[0]), yToPx(A[1]));
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5bc0eb';
  ctx.beginPath(); ctx.arc(xToPx(0), yToPx(0), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xToPx(1), yToPx(0), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(xToPx(A[0]), yToPx(A[1]), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('(0, 0)', xToPx(0) - 18, yToPx(0) + 18);
  ctx.fillText('(1, 0)', xToPx(1) - 10, yToPx(0) + 18);
  ctx.fillText(`(ρ̄, η̄)`, xToPx(A[0]) + 8, yToPx(A[1]) - 10);
  const beta = angleBeta(st.rho, st.eta) * 180 / Math.PI;
  const gamma = angleGamma(st.rho, st.eta) * 180 / Math.PI;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`β = ${beta.toFixed(1)}°, γ = ${gamma.toFixed(1)}°, α = ${(180 - beta - gamma).toFixed(1)}°`, 350, H - 22);
  ctx.fillText(`Area (J Jarlskog ~ A² λ⁶ η̄) ≈ ${(0.5 * st.eta).toFixed(3)} (triangle area)`, 350, H - 8);
  rE.textContent = st.eta.toFixed(3);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
