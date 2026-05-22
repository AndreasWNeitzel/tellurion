import { torusK, sphereK, hyperbolicK, cylinderK } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rK = document.getElementById('readout-k');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Rr: 3, t: 0, yaw: 0, pitch: 0 }; let running = true;
sR.addEventListener('input', () => { st.Rr = parseFloat(sR.value); vR.textContent = st.Rr.toFixed(2); });
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
function colorForK(K, kMax) {
  const t = Math.max(-1, Math.min(1, K / kMax));
  if (t > 0) return `rgba(239,71,111,${0.3 + t * 0.5})`;
  return `rgba(91,192,235,${0.3 - t * 0.5})`;
}
function projectPoint(x, y, z, cx, cy) {
  // Apply yaw rotation around Y axis
  const cy_yaw = Math.cos(st.yaw), sy_yaw = Math.sin(st.yaw);
  let x1 = x * cy_yaw - z * sy_yaw;
  let z1 = x * sy_yaw + z * cy_yaw;
  // Apply pitch rotation around X axis
  const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
  let y1 = y * cp - z1 * sp;
  let z2 = y * sp + z1 * cp;
  return { px: cx + x1 + z2 * 0.3, py: cy - y1 + z2 * 0.2 };
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Torus shifted left of centre so the K(theta) diagnostic panel in
  // the top-right corner no longer overlaps the rotating surface.
  const cx = canvas.width * 0.36, cy = 200;
  const R = 100, r = 100 / st.Rr;
  let kMax = 0;
  for (let i = 0; i < 60; i += 1) {
    const theta = 2 * Math.PI * i / 60;
    const K = torusK(theta, R, r);
    if (Math.abs(K) > kMax) kMax = Math.abs(K);
  }
  for (let i = 0; i < 60; i += 1) {
    const phi = 2 * Math.PI * i / 60 + st.t * 0.5;
    for (let j = 0; j < 30; j += 1) {
      const theta = 2 * Math.PI * j / 30;
      const X = (R + r * Math.cos(theta)) * Math.cos(phi);
      const Y = r * Math.sin(theta);
      const Z = (R + r * Math.cos(theta)) * Math.sin(phi);
      const p = projectPoint(X, Y, Z, cx, cy);
      const K = torusK(theta, R, r);
      ctx.fillStyle = colorForK(K, kMax);
      ctx.fillRect(p.px - 4, p.py - 4, 8, 8);
    }
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Torus: red = K > 0 (outer), blue = K < 0 (inner)', 12, 20);
  // Below: reference surfaces.
  const refY = 360, refSize = 60;
  const refs = [
    { name: 'Sphere (K = 1/R²)', K: sphereK(1), color: '#ef476f' },
    { name: 'Cylinder (K = 0)', K: 0, color: '#9aa0a6' },
    { name: 'Hyperbolic (K = -1)', K: hyperbolicK(1), color: '#5bc0eb' },
  ];
  refs.forEach((r, i) => {
    const x0 = canvas.width / 4 + i * canvas.width / 4 - canvas.width / 8;
    ctx.fillStyle = r.color;
    ctx.beginPath(); ctx.arc(x0, refY, refSize / 2, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#060608'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(r.name, x0 - 60, refY + 60);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText(`K = ${r.K.toFixed(2)}`, x0 - 25, refY + 75);
  });
  drawKDiagnostic(R, r, kMax);
  rK.textContent = kMax.toExponential(2);
}

// Rule-13 diagnostic: Gaussian curvature K(θ) around the torus tube.
// K = cos θ / [r (R + r cos θ)] is positive on the outer equator
// (θ = 0), zero on the top and bottom circles (θ = ±π/2), and
// negative on the inner equator (θ = π). The plot is the quantitative
// companion to the red/blue coloured torus.
function drawKDiagnostic(R, r, kMax) {
  const W = canvas.width;
  const pw = 300, ph = 150, px = W - pw - 16, py = 16;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('Gaussian curvature  K(θ) around the tube', px + 8, py + 16);
  const ax = px + 40, ay = py + 26, aw = pw - 52, ah = ph - 48;
  const km = kMax > 0 ? kMax : 1;
  const xOf = (th) => ax + (th / (2 * Math.PI)) * aw;
  const yOf = (K) => ay + ah / 2 - (K / km) * (ah / 2);
  // Zero line.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  // K(theta) curve, coloured by sign.
  ctx.lineWidth = 2;
  for (let i = 0; i < 120; i += 1) {
    const th0 = 2 * Math.PI * i / 120, th1 = 2 * Math.PI * (i + 1) / 120;
    const K0 = torusK(th0, R, r), K1 = torusK(th1, R, r);
    ctx.strokeStyle = (0.5 * (K0 + K1)) >= 0 ? '#ef476f' : '#5bc0eb';
    ctx.beginPath();
    ctx.moveTo(xOf(th0), yOf(K0)); ctx.lineTo(xOf(th1), yOf(K1));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('+K', px + 8, ay + 8);
  ctx.fillText('-K', px + 8, ay + ah);
  ctx.fillText('θ: 0', ax, ay + ah + 14);
  ctx.fillText('π (inner)', xOf(Math.PI) - 24, ay + ah + 14);
  ctx.fillText('2π', ax + aw - 14, ay + ah + 14);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 1; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const R = 100, r = 100 / st.Rr;
  return { fields: [
    { key: 'aspect', label: 'aspect ratio $R/r$', value: st.Rr, format: 'float' },
    { key: 'k-outer', label: 'outer-equator curvature $K(0)$', value: torusK(0, R, r), format: 'float' },
    { key: 'k-inner', label: 'inner-equator curvature $K(\\pi)$', value: torusK(Math.PI, R, r), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const R = 100, r = 100 / st.Rr;
  // Gauss-Bonnet: the integral of K over a closed surface is 2 pi times
  // its Euler characteristic. The torus has chi = 0, so the total
  // Gaussian curvature must vanish (the positive outer rim exactly
  // cancels the negative inner rim).
  const N = 240;
  let integral = 0;
  for (let i = 0; i < N; i += 1) {
    const theta = ((i + 0.5) / N) * 2 * Math.PI;
    const dA = r * (R + r * Math.cos(theta)) * (2 * Math.PI / N) * (2 * Math.PI);
    integral += torusK(theta, R, r) * dA;
  }
  const drift = Math.abs(integral) / (4 * Math.PI * Math.PI * R * r);
  return [{
    key: 'gauss-bonnet',
    label: 'total curvature $\\iint K\\,dA = 0$ on the torus (Gauss-Bonnet, $\\chi = 0$)',
    value: drift.toExponential(2),
    status: drift < 1e-6 ? 'pass' : (drift < 1e-3 ? 'pending' : 'drift'),
  }];
};
