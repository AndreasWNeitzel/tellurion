import { pendulumStep, polygonArea, rectangleSamples } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sQ = document.getElementById('slider-q'), vQ = document.getElementById('value-q');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { q0: 0, p0: 0.8, s: 0.2 };
let pts, A0, running = true;
function reset() { pts = rectangleSamples(st.q0, st.p0, st.s, st.s, 80); A0 = polygonArea(pts); }
reset();
sQ.addEventListener('input', () => { st.q0 = parseFloat(sQ.value); vQ.textContent = st.q0.toFixed(2); reset(); });
sP.addEventListener('input', () => { st.p0 = parseFloat(sP.value); vP.textContent = st.p0.toFixed(2); reset(); });
sS.addEventListener('input', () => { st.s = parseFloat(sS.value); vS.textContent = st.s.toFixed(2); reset(); });
btnR.addEventListener('click', () => { reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function step() { for (let k = 0; k < 3; k += 1) pts = pts.map(([q, p]) => { const r = pendulumStep(q, p, 0.05); return [r.q, r.p]; }); }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2, sc = 90;
  ctx.strokeStyle = '#3a3a40'; ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(canvas.width - 20, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, canvas.height - 20); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('q', canvas.width - 30, cy - 6); ctx.fillText('p', cx + 6, 30);
  ctx.strokeStyle = 'rgba(91,192,235,0.4)'; ctx.lineWidth = 1;
  for (const E of [-0.8, -0.4, 0, 0.4, 1, 1.5]) {
    ctx.beginPath();
    for (let q = -Math.PI; q < Math.PI; q += 0.02) {
      const pp = 2 * (E + Math.cos(q));
      if (pp < 0) continue;
      const p = Math.sqrt(pp);
      ctx.moveTo(cx + q * sc, cy - p * sc); ctx.lineTo(cx + q * sc + 0.5, cy - p * sc);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,209,102,0.15)'; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((pt, i) => {
    const px = cx + pt[0] * sc, py = cy - pt[1] * sc;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath(); ctx.fill(); ctx.stroke();
  const A = polygonArea(pts);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`A(t) = ${A.toFixed(5)}, A(0) = ${A0.toFixed(5)}, ratio = ${(A / A0).toFixed(4)}`, 12, canvas.height - 12);
  rA.textContent = (A / A0).toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < CAPTURE_FRAC * 300; i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
