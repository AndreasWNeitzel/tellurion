import { fieldE, skinDepth } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const selM = document.getElementById('select-mat');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const st = { fExp: 6, mat: 'cu', t: 0 };
let running = !prefersReducedMotion();
sF.addEventListener('input', () => { st.fExp = parseFloat(sF.value); vF.textContent = `1e${st.fExp.toFixed(1)}`; });
selM.addEventListener('change', () => { st.mat = selM.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function matProps() {
  switch (st.mat) {
    case 'cu': return { sigma: 5.96e7, mu_r: 1 };
    case 'al': return { sigma: 3.5e7, mu_r: 1 };
    case 'fe': return { sigma: 1e7, mu_r: 200 };
    case 'sea': return { sigma: 4, mu_r: 1 };
  }
}
let last = performance.now();

// Minimal viridis-ish colormap (t in [0,1] -> rgb).
function viridis(t) {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.min(1, 0.28 + 1.6 * Math.pow(t, 2.2)));
  const g = Math.round(255 * (0.02 + 0.86 * t));
  const b = Math.round(255 * (0.33 + 0.5 * Math.cos(3.1 * t - 0.4)));
  return `rgb(${r},${Math.min(255, g)},${Math.max(0, Math.min(255, b))})`;
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const f = Math.pow(10, st.fExp);
  const { sigma, mu_r } = matProps();
  const omega = 2 * Math.PI * f;
  const delta = skinDepth(omega, sigma, mu_r);
  const zmax = 5 * delta;

  // PRIMARY: conductor cross-section. A filled bar; x = depth from surface.
  // Current density J(x) = J0 exp(-x/delta) mapped to viridis, with an AC
  // pulse so the surface brightens and dims at the drive frequency.
  const barX = 40, barY = 30, barW = W - 80, barH = H * 0.42;
  const pulse = 0.55 + 0.45 * Math.cos(st.t * 3.0);   // AC envelope in time
  const cols = 220;
  for (let c = 0; c < cols; c += 1) {
    const xfrac = c / cols;
    const xphys = xfrac * zmax;
    const J = Math.exp(-xphys / delta) * pulse;
    ctx.fillStyle = viridis(J);
    ctx.fillRect(barX + xfrac * barW, barY, barW / cols + 1, barH);
  }
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barW, barH);
  // Skin-depth dashed line at x = delta.
  const xDelta = barX + (delta / zmax) * barW;
  ctx.strokeStyle = '#ff5d5d'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(xDelta, barY - 6); ctx.lineTo(xDelta, barY + barH + 6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff5d5d'; ctx.font = fontString(canvas, 'caption', 'mono');
  const dLabel = delta < 1e-3 ? `${(delta * 1e6).toFixed(1)} um` : `${(delta * 1000).toFixed(2)} mm`;
  ctx.fillText(`skin depth delta = ${dLabel}`, xDelta + 6, barY + 16);
  ctx.fillStyle = '#e8e8e8';
  ctx.fillText('surface', barX + 4, barY + barH + 18);
  ctx.fillText('interior ->', barX + barW - 90, barY + barH + 18);
  ctx.fillText(`f = ${f.toExponential(2)} Hz`, barX + 4, barY - 10);

  // SECONDARY: the E(z) standing-profile curve, in the lower region.
  const secTop = barY + barH + 30;
  const secBot = H - 28;
  const cx = 80, cy = (secTop + secBot) / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(cx, secTop); ctx.lineTo(cx, secBot); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(canvas.width - 20, cy); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('E(z)', cx + 5, secTop + 12);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  for (let k = 1; k <= 5; k += 1) {
    const z = k * delta;
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    ctx.beginPath(); ctx.moveTo(px, secTop); ctx.lineTo(px, secBot); ctx.stroke();
    ctx.fillStyle = '#5bc0eb'; ctx.fillText(`${k}d`, px - 8, secBot + 14);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 600;
  for (let i = 0; i <= N; i += 1) {
    const z = (i / N) * zmax;
    const E = fieldE(z, st.t / Math.max(1e-30, omega) * omega, omega, sigma, 1, mu_r);
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    const py = cy - E * 55;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const z = (i / N) * zmax;
    const env = Math.exp(-z / delta);
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    const py = cy - env * 55;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const z = (i / N) * zmax;
    const env = -Math.exp(-z / delta);
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    const py = cy - env * 55;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  rD.textContent = (delta < 1e-3 ? `${(delta * 1e6).toFixed(2)} um` : `${(delta * 1000).toFixed(3)} mm`);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 4; render(); requestAnimationFrame(tick); }
function bootSync() { if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = Math.pow(10, st.fExp);
  const { sigma, mu_r } = matProps();
  const sk = skinDepth(2 * Math.PI * f, sigma, mu_r);
  return {
    fields: [
      { key: 'material', label: 'Material', value: st.mat, format: undefined },
      { key: 'frequency', label: 'Frequency (Hz)', value: f, format: 'float' },
      { key: 'skin-depth', label: 'Skin depth (m)', value: sk, format: 'float' },
      { key: 'time', label: 'Time (s)', value: st.t, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const f = Math.pow(10, st.fExp);
  const { sigma, mu_r } = matProps();
  const sk = skinDepth(2 * Math.PI * f, sigma, mu_r);
  const status = sk > 0 && sk < 1000 ? 'pass' : 'pending';
  return [
    { key: 'skin-effect', label: 'Skin depth positive', value: sk.toExponential(2) + ' m', status }
  ];
};
