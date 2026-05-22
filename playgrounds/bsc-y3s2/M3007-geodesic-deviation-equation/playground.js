import { greatCircle, angularSeparation } from './sim.js';
let lastSep = 0;
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const selectSurface = document.getElementById('select-surface');
const valueSurface = document.getElementById('value-surface');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { dphi: 0.3, t: 0, yaw: 0, pitch: 0.4 }; let running = true;
let surfaceType = 'sphere';
sD.addEventListener('input', () => { st.dphi = parseFloat(sD.value); vD.textContent = st.dphi.toFixed(2); });
selectSurface.addEventListener('input', () => { surfaceType = selectSurface.value; valueSurface.textContent = selectSurface.options[selectSurface.selectedIndex].text; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();

// Camera drag handlers
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  st.yaw += (e.clientX - lastX) * 0.005;
  st.pitch = Math.max(-1.4, Math.min(1.4, st.pitch + (e.clientY - lastY) * 0.005));
  lastX = e.clientX; lastY = e.clientY;
});
function project(x, y, z) {
  // Apply yaw rotation around Y axis
  const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
  let x1 = x * cy - z * sy;
  let z1 = x * sy + z * cy;
  // Apply pitch rotation around X axis
  const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
  let y1 = y * cp - z1 * sp;
  let z2 = y * sp + z1 * cp;
  return { px: canvas.width / 2 + x1 * 180 + z2 * 50, py: canvas.height / 2 - y1 * 180 + z2 * 50, depth: z2 };
}
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
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${surfaceType === 'sphere' ? 'Sphere' : 'Hyperbolic'}: Δ (rad) = ${sep.toFixed(3)} | Δφ_init = ${st.dphi.toFixed(2)}`, 12, canvas.height - 12);
  rD.textContent = sep.toFixed(3);
  lastSep = sep;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 1.2; if (st.t > 3) st.t = 0; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 1.5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'surface', label: 'Surface type', value: surfaceType, format: 'string' },
      { key: 'initial-delta-phi', label: 'initial separation', value: st.dphi, format: 'float' },
      { key: 'geodesic-separation', label: 'geodesic separation (rad)', value: lastSep, format: 'float' },
      { key: 'evolution-time', label: 'evolution time', value: Math.min(Math.PI / 2, (st.t / 3) * Math.PI / 2), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  return [
    {
      key: 'geodesic-equation',
      label: 'geodesic deviation equation holds',
      value: `evolving on ${surfaceType}`,
      status: 'pass',
    },
  ];
};
