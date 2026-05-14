import { fieldE, skinDepth } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const selM = document.getElementById('select-mat');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { fExp: 6, mat: 'cu', t: 0 };
let running = true;
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
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const f = Math.pow(10, st.fExp);
  const { sigma, mu_r } = matProps();
  const omega = 2 * Math.PI * f;
  const delta = skinDepth(omega, sigma, mu_r);
  const zmax = 5 * delta;
  const cx = 80, cy = canvas.height / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(cx, 30); ctx.lineTo(cx, canvas.height - 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(canvas.width - 20, cy); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('z = 0', cx + 5, 20);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  for (let k = 1; k <= 5; k += 1) {
    const z = k * delta;
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    ctx.beginPath(); ctx.moveTo(px, 30); ctx.lineTo(px, canvas.height - 30); ctx.stroke();
    ctx.fillStyle = '#5bc0eb'; ctx.fillText(`${k}δ`, px - 10, canvas.height - 12);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 600;
  for (let i = 0; i <= N; i += 1) {
    const z = (i / N) * zmax;
    const E = fieldE(z, st.t / Math.max(1e-30, omega) * omega, omega, sigma, 1, mu_r);
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    const py = cy - E * 170;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const z = (i / N) * zmax;
    const env = Math.exp(-z / delta);
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    const py = cy - env * 170;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const z = (i / N) * zmax;
    const env = -Math.exp(-z / delta);
    const px = cx + (z / zmax) * (canvas.width - cx - 40);
    const py = cy - env * 170;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#e8e8e8'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`f = ${(f).toExponential(2)} Hz`, 12, 20);
  ctx.fillText(`δ = ${(delta * 1000).toExponential(2)} mm`, 12, 38);
  rD.textContent = (delta < 1e-3 ? `${(delta * 1e6).toFixed(2)} μm` : `${(delta * 1000).toFixed(3)} mm`);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 4; render(); requestAnimationFrame(tick); }
function bootSync() { if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
