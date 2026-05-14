import { density, realPsi, spreadAt, center } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { s0: 1, k0: 3, t: 0 };
let running = true;
sS.addEventListener('input', () => { st.s0 = parseFloat(sS.value); vS.textContent = st.s0.toFixed(2); });
sK.addEventListener('input', () => { st.k0 = parseFloat(sK.value); vK.textContent = st.k0.toFixed(1); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cy = canvas.height / 2; const xmin = -5, xmax = 20;
  const xToPx = (x) => 40 + (x - xmin) / (xmax - xmin) * (canvas.width - 80);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(canvas.width - 40, cy); ctx.stroke();
  const N = 400;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = xmin + (xmax - xmin) * i / N;
    const y = cy - realPsi(x, st.t, 0, st.k0, st.s0) * 180;
    if (i === 0) ctx.moveTo(xToPx(x), y); else ctx.lineTo(xToPx(x), y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = xmin + (xmax - xmin) * i / N;
    const y = cy - density(x, st.t, 0, st.k0, st.s0) * 350;
    if (i === 0) ctx.moveTo(xToPx(x), y); else ctx.lineTo(xToPx(x), y);
  }
  ctx.stroke();
  const sig = spreadAt(st.s0, st.t), c = center(0, st.k0, st.t);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xToPx(c), cy + 40); ctx.lineTo(xToPx(c), cy - 200); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xToPx(c - sig), cy + 60); ctx.lineTo(xToPx(c + sig), cy + 60); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`σ(t) = ${sig.toFixed(2)}, center = ${c.toFixed(2)}, t = ${st.t.toFixed(2)}`, 12, canvas.height - 12);
  rS.textContent = sig.toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.5; if (st.t > 6) st.t = 0; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 4; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
