import { alfvenSpeedMS, bField, vField } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rV = document.getElementById('readout-v');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { B_nT: 5, n_amu_cc: 5, t: 0 }; let running = true;
sB.addEventListener('input', () => { st.B_nT = parseFloat(sB.value); vB.textContent = st.B_nT.toFixed(1); });
sN.addEventListener('input', () => { st.n_amu_cc = parseFloat(sN.value); vN.textContent = st.n_amu_cc.toFixed(1); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const B0 = st.B_nT * 1e-9, rho = st.n_amu_cc * 1.66e-27 * 1e6;
  const vA = alfvenSpeedMS(B0, rho);
  const cy = canvas.height / 2, ampPx = 80, scale = 200;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(canvas.width - 40, cy); ctx.stroke();
  const lambda = 1e7;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const x = i / 400 * 2e7 - 1e7;
    const b = bField(x, st.t, lambda, 0.5, vA);
    const px = 40 + i / 400 * (canvas.width - 80);
    const py = cy - 100 - b * ampPx;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const x = i / 400 * 2e7 - 1e7;
    const v = vField(x, st.t, lambda, 0.5, vA, B0, rho);
    const vNorm = v / 1e6;
    const px = 40 + i / 400 * (canvas.width - 80);
    const py = cy + 100 - vNorm * ampPx;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('b_y(x, t) (orange)  →   propagating at v_A', 12, 20);
  ctx.fillText('v_y(x, t) (cyan)    →   antiphase', 12, 38);
  ctx.fillText(`v_A = ${(vA / 1000).toFixed(1)} km/s, B_0 = ${st.B_nT.toFixed(1)} nT, n = ${st.n_amu_cc.toFixed(1)} amu/cm³`, 12, canvas.height - 12);
  rV.textContent = `${(vA / 1000).toFixed(0)} km/s`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.4; if (st.t > 100) st.t = 0; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
