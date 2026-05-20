import { greatCircle, angularSeparation } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { dphi: 0.3, t: 0 }; let running = true;
sD.addEventListener('input', () => { st.dphi = parseFloat(sD.value); vD.textContent = st.dphi.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function project(x, y, z) { return { px: canvas.width / 2 + x * 180 + z * 50, py: canvas.height / 2 - y * 180 + z * 50, depth: z }; }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  // Sphere outline.
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 180, 0, 2 * Math.PI); ctx.stroke();
  // Equator.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const phi = 2 * Math.PI * i / 60;
    const p = project(Math.cos(phi), 0, Math.sin(phi));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  // Two geodesics northward.
  const colors = ['#ffd166', '#ef476f'];
  [0, st.dphi].forEach((phi0, k) => {
    ctx.strokeStyle = colors[k]; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const tt = (i / 100) * Math.PI / 2 * (st.t / 3 % 1 + 0.3);
      const g = greatCircle(tt, Math.PI / 2, phi0, Math.PI / 2);
      const p = project(g.x, g.z, g.y);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  });
  // Markers.
  [0, st.dphi].forEach((phi0, k) => {
    const tt = Math.min(Math.PI / 2, (st.t / 3) * Math.PI / 2);
    const g = greatCircle(tt, Math.PI / 2, phi0, Math.PI / 2);
    const p = project(g.x, g.z, g.y);
    ctx.fillStyle = colors[k]; ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI); ctx.fill();
  });
  const tt = Math.min(Math.PI / 2, (st.t / 3) * Math.PI / 2);
  const g1 = greatCircle(tt, Math.PI / 2, 0, Math.PI / 2);
  const g2 = greatCircle(tt, Math.PI / 2, st.dphi, Math.PI / 2);
  const sep = angularSeparation(g1, g2);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Δ (rad) = ${sep.toFixed(3)} | Δφ_init = ${st.dphi.toFixed(2)}`, 12, canvas.height - 12);
  rD.textContent = sep.toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 1.2; if (st.t > 3) st.t = 0; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 1.5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
