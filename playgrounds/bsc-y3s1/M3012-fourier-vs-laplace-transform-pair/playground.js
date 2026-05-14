import { fourierMag2, laplaceReal, timeFn } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const selF = document.getElementById('select-f');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { a: 1, omega0: 2, fn: 'exp' };
let running = true;
sA.addEventListener('input', () => { st.a = parseFloat(sA.value); vA.textContent = st.a.toFixed(2); });
sW.addEventListener('input', () => { st.omega0 = parseFloat(sW.value); vW.textContent = st.omega0.toFixed(1); });
selF.addEventListener('change', () => { st.fn = selF.value; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function pgPanel(x, y, w, h, label) {
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText(label, x + 4, y + 12);
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const p = { a: st.a, omega0: st.omega0, decay: st.a, T: 2 };
  // Time domain.
  const x1 = 50, y1 = 40, w1 = W / 3 - 60, h1 = H / 2 - 60;
  pgPanel(x1, y1, w1, h1, 'f(t)');
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  let fMax = 0;
  for (let i = 0; i <= 200; i += 1) {
    const t = i / 200 * 6;
    const f = timeFn(t, st.fn, p);
    if (Math.abs(f) > fMax) fMax = Math.abs(f);
  }
  for (let i = 0; i <= 200; i += 1) {
    const t = i / 200 * 6;
    const f = timeFn(t, st.fn, p);
    const px = x1 + i / 200 * w1;
    const py = y1 + h1 / 2 - f / (fMax + 1e-9) * h1 / 2 * 0.9;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Fourier.
  const x2 = W / 3 + 30, y2 = 40, w2 = W / 3 - 30, h2 = H / 2 - 60;
  pgPanel(x2, y2, w2, h2, '|F(ω)|²');
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.beginPath();
  let FMax = 0;
  for (let i = -100; i <= 100; i += 1) {
    const omega = i / 100 * 8;
    const F = fourierMag2(omega, st.fn, p);
    if (F > FMax) FMax = F;
  }
  for (let i = -100; i <= 100; i += 1) {
    const omega = i / 100 * 8;
    const F = fourierMag2(omega, st.fn, p);
    const px = x2 + (i + 100) / 200 * w2;
    const py = y2 + h2 - F / FMax * h2 * 0.9;
    if (i === -100) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Laplace (real s).
  const x3 = 2 * W / 3 + 30, y3 = 40, w3 = W / 3 - 60, h3 = H / 2 - 60;
  pgPanel(x3, y3, w3, h3, 'F(s) (real s)');
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5; ctx.beginPath();
  let LMax = 0;
  for (let i = 1; i <= 200; i += 1) {
    const s = i / 200 * 5;
    const F = laplaceReal(s, st.fn, p);
    if (Math.abs(F) > LMax) LMax = Math.abs(F);
  }
  for (let i = 1; i <= 200; i += 1) {
    const s = i / 200 * 5;
    const F = laplaceReal(s, st.fn, p);
    const px = x3 + i / 200 * w3;
    const py = y3 + h3 / 2 - F / (LMax + 1e-9) * h3 / 2 * 0.9;
    if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // s-plane with pole positions.
  const x4 = 250, y4 = H / 2 + 30, w4 = W - 480, h4 = H / 2 - 60;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x4, y4 + h4 / 2); ctx.lineTo(x4 + w4, y4 + h4 / 2); ctx.moveTo(x4 + w4 / 2, y4); ctx.lineTo(x4 + w4 / 2, y4 + h4); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Re(s)', x4 + w4 - 30, y4 + h4 / 2 - 4); ctx.fillText('Im(s)', x4 + w4 / 2 + 4, y4 + 12);
  const poles = [];
  if (st.fn === 'exp') poles.push({ re: -st.a, im: 0 });
  else if (st.fn === 'cos') { poles.push({ re: -st.a, im: st.omega0 }); poles.push({ re: -st.a, im: -st.omega0 }); }
  else if (st.fn === 'ramp') poles.push({ re: -st.a, im: 0 });
  ctx.fillStyle = '#ef476f';
  for (const pole of poles) {
    const px = x4 + w4 / 2 + pole.re / 4 * w4 / 2;
    const py = y4 + h4 / 2 - pole.im / 4 * h4 / 2;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#ef476f'; ctx.fillText('×', px - 4, py + 4);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`function: ${st.fn}, poles in left half-plane`, x4 + 10, y4 + h4 + 14);
  rA.textContent = st.a.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
