import { greenFn, solve } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rX = document.getElementById('readout-x');
const sX = document.getElementById('slider-x'), vX = document.getElementById('value-x');
const selF = document.getElementById('select-f');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { x0: 0.5, fn: 'const' };
let running = true;
sX.addEventListener('input', () => { st.x0 = parseFloat(sX.value); vX.textContent = st.x0.toFixed(2); });
selF.addEventListener('change', () => { st.fn = selF.value; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function f(x) {
  switch (st.fn) {
    case 'const': return 1;
    case 'step': return x < 0.5 ? 1 : 0;
    case 'gauss': return Math.exp(-50 * (x - 0.3) ** 2);
    case 'sin': return Math.sin(Math.PI * x);
  }
  return 0;
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const x0p = 40, x1p = W - 30, y_top = 30, y_mid = H / 2 + 5, y_bot = H - 40;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x0p, y_top); ctx.lineTo(x0p, y_mid - 20); ctx.lineTo(x1p, y_mid - 20); ctx.stroke();
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x0p, y_mid + 20); ctx.lineTo(x0p, y_bot); ctx.lineTo(x1p, y_bot); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('G(x, x₀) (top), u(x) and f(x) (bottom)', 12, 20);
  const xToPx = (x) => x0p + x * (x1p - x0p);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const x = i / 200;
    const G = greenFn(x, st.x0, 1);
    const py = y_mid - 20 - G * 250 * 0.45;
    if (i === 0) ctx.moveTo(xToPx(x), py); else ctx.lineTo(xToPx(x), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(st.x0), y_top); ctx.lineTo(xToPx(st.x0), y_mid - 20); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(xToPx(st.x0), y_mid - 20, 6, 0, 2 * Math.PI); ctx.fill();
  const r = solve(f, 1, 200);
  let uMax = 0, fMax = 0;
  for (let i = 0; i < r.u.length; i += 1) { if (Math.abs(r.u[i]) > uMax) uMax = Math.abs(r.u[i]); }
  for (let i = 0; i <= 200; i += 1) { const v = Math.abs(f(i / 200)); if (v > fMax) fMax = v; }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < r.u.length; i += 1) {
    const x = r.xs[i];
    const py = y_bot - r.u[i] / (uMax + 1e-9) * (y_bot - y_mid - 30);
    if (i === 0) ctx.moveTo(xToPx(x), py); else ctx.lineTo(xToPx(x), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#06d6a0'; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const x = i / 200;
    const ff = f(x);
    const py = y_bot - ff / (fMax + 1e-9) * (y_bot - y_mid - 30);
    if (i === 0) ctx.moveTo(xToPx(x), py); else ctx.lineTo(xToPx(x), py);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('orange: G(x, x₀); red dot: x₀; cyan: u(x); green: f(x)', 12, H - 16);
  rX.textContent = st.x0.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
