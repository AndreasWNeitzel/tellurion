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
let st = { Rr: 3, t: 0 }; let running = true;
sR.addEventListener('input', () => { st.Rr = parseFloat(sR.value); vR.textContent = st.Rr.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function colorForK(K, kMax) {
  const t = Math.max(-1, Math.min(1, K / kMax));
  if (t > 0) return `rgba(239,71,111,${0.3 + t * 0.5})`;
  return `rgba(91,192,235,${0.3 - t * 0.5})`;
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
      const px = cx + X + Z * 0.3, py = cy - Y + Z * 0.2;
      const K = torusK(theta, R, r);
      ctx.fillStyle = colorForK(K, kMax);
      ctx.fillRect(px - 4, py - 4, 8, 8);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
