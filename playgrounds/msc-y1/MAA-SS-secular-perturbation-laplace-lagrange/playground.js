import { eccentricityOsc, eigenfrequencies } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { e0: 0.15, coupling: 0.3, t: 0 }; let running = true;
sE.addEventListener('input', () => { st.e0 = parseFloat(sE.value); vE.textContent = st.e0.toFixed(2); });
sC.addEventListener('input', () => { st.coupling = parseFloat(sC.value); vC.textContent = st.coupling.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('e_j', 12, pad.t + 10); ctx.fillText('t (secular)', W - 80, H - pad.b + 14);
  const xToPx = (tt) => pad.l + tt / 20 * (W - pad.l - pad.r);
  const yToPx = (e) => H - pad.b - e / (st.e0 * 1.2) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const tt = i / 200 * 20;
    const e1 = (st.e0 / 2) * (1 + Math.cos(st.coupling * tt));
    if (i === 0) ctx.moveTo(xToPx(tt), yToPx(e1)); else ctx.lineTo(xToPx(tt), yToPx(e1));
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const tt = i / 200 * 20;
    const e2 = (st.e0 / 2) * (1 - Math.cos(st.coupling * tt));
    if (i === 0) ctx.moveTo(xToPx(tt), yToPx(e2)); else ctx.lineTo(xToPx(tt), yToPx(e2));
  }
  ctx.stroke();
  ctx.strokeStyle = '#06d6a0'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(st.t % 20), pad.t); ctx.lineTo(xToPx(st.t % 20), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  const e2_now = (st.e0 / 2) * (1 - Math.cos(st.coupling * (st.t % 20)));
  ctx.fillStyle = '#ffd166'; ctx.fillText('e_1 (orange)', pad.l + 10, pad.t + 28);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('e_2 (cyan)', pad.l + 10, pad.t + 44);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`coupling = ${st.coupling.toFixed(2)}, AMD conserved`, 12, H - 14);
  rE.textContent = e2_now.toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.8; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
