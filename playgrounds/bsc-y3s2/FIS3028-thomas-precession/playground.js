import { gamma, thomasFactor } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rW = document.getElementById('readout-w');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { beta: 0.5, t: 0 }; let running = true;
sB.addEventListener('input', () => { st.beta = parseFloat(sB.value); vB.textContent = st.beta.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2, R = 160;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
  const omega_orb = 0.5;
  const theta_orb = omega_orb * st.t;
  const px = cx + R * Math.cos(theta_orb), py = cy + R * Math.sin(theta_orb);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(px, py, 9, 0, 2 * Math.PI); ctx.fill();
  const theta_thomas = thomasFactor(st.beta) * theta_orb;
  const theta_axis = theta_thomas;
  const ax = Math.cos(theta_axis), ay = Math.sin(theta_axis);
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 28 * ax, py + 28 * ay); ctx.stroke();
  ctx.fillStyle = '#ef476f'; ctx.beginPath();
  ctx.moveTo(px + 28 * ax, py + 28 * ay); ctx.lineTo(px + 22 * ax + 4 * ay, py + 22 * ay - 4 * ax); ctx.lineTo(px + 22 * ax - 4 * ay, py + 22 * ay + 4 * ax); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(154,160,166,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R + 30, cy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`β = ${st.beta.toFixed(2)}, γ = ${gamma(st.beta).toFixed(2)}, (γ-1) per orbit = ${thomasFactor(st.beta).toFixed(3)} rad`, 12, canvas.height - 12);
  ctx.fillText(`Thomas lag = ${(theta_thomas * 180 / Math.PI).toFixed(1)} deg after ${(theta_orb * 180 / Math.PI).toFixed(0)} deg of orbit`, 12, canvas.height - 30);
  rW.textContent = thomasFactor(st.beta).toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
