import { generateData, fitCircle, rms } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { e: 0.3, N: 20, s: 0.05, seed: 0xC0FFEE }; let running = true;
sE.addEventListener('input', () => { st.e = parseFloat(sE.value); vE.textContent = st.e.toFixed(2); });
sN.addEventListener('input', () => { st.N = parseInt(sN.value); vN.textContent = st.N; });
sS.addEventListener('input', () => { st.s = parseFloat(sS.value); vS.textContent = st.s.toFixed(3); });
btnR.addEventListener('click', () => { st.seed = (st.seed * 31 + 7) >>> 0; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2, sc = 130;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  ctx.moveTo(20, cy); ctx.lineTo(canvas.width - 20, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, canvas.height - 20); ctx.stroke();
  const times = Array.from({ length: st.N }, (_, i) => i / st.N);
  const data = generateData(1, st.e, 0.3, 1, times, st.s, st.seed);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const M = 2 * Math.PI * i / 200;
    let E = M; for (let it = 0; it < 30; it += 1) E -= (E - st.e * Math.sin(E) - M) / (1 - st.e * Math.cos(E));
    const nu = 2 * Math.atan2(Math.sqrt(1 + st.e) * Math.sin(E / 2), Math.sqrt(1 - st.e) * Math.cos(E / 2));
    const r = (1 - st.e * st.e) / (1 + st.e * Math.cos(nu));
    const x = r * Math.cos(nu + 0.3), y = r * Math.sin(nu + 0.3);
    const px = cx + x * sc, py = cy - y * sc;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#06d6a0';
  for (const d of data) {
    ctx.beginPath(); ctx.arc(cx + d.x * sc, cy - d.y * sc, 4, 0, 2 * Math.PI); ctx.fill();
  }
  const fit = fitCircle(data);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx + fit.x0 * sc, cy - fit.y0 * sc, fit.r * sc, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`circle fit: r = ${fit.r.toFixed(3)}, center = (${fit.x0.toFixed(2)}, ${fit.y0.toFixed(2)})`, 12, 20);
  const rmsv = rms(data, fit);
  ctx.fillText(`residual RMS = ${rmsv.toFixed(4)} (noise σ = ${st.s.toFixed(3)})`, 12, 38);
  rR.textContent = rmsv.toFixed(4);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
