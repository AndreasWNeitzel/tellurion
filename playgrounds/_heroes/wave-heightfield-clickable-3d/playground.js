import { makeGrid, seedImpulse, step, totalEnergy } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const N = 96;
let state = makeGrid(N);
let st = { c: 0.4, gamma: 0.05, A: 0.8, sigma: 3 };
let running = true;
sC.addEventListener('input', () => { st.c = parseFloat(sC.value); vC.textContent = st.c.toFixed(2); });
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); });
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(1); });
btnR.addEventListener('click', () => { state = makeGrid(N); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * N;
  const cy = ((e.clientY - rect.top) / rect.height) * N;
  seedImpulse(state, cx, cy, st.A, st.sigma);
});
function viridis(v) {
  const t = Math.max(0, Math.min(1, v));
  return [Math.floor(255 * Math.max(0, Math.min(1, 0.267 + 0.105 * t - 0.330 * t * t + 1.000 * t * t * t))),
          Math.floor(255 * Math.max(0, Math.min(1, 0.005 + 1.404 * t - 0.479 * t * t))),
          Math.floor(255 * Math.max(0, Math.min(1, 0.329 + 0.749 * t - 0.972 * t * t)))];
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, cellPx = W / N;
  const img = ctx.createImageData(W, H);
  for (let py = 0; py < H; py += 1) for (let px = 0; px < W; px += 1) {
    const ix = Math.floor(px / cellPx), iy = Math.floor(py / cellPx);
    const u = state.u[iy * N + ix];
    const v = 0.5 + Math.max(-1, Math.min(1, u * 1.5)) * 0.5;
    const c = viridis(v);
    const idx = (py * W + px) * 4;
    img.data[idx] = c[0]; img.data[idx + 1] = c[1]; img.data[idx + 2] = c[2]; img.data[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const E = totalEnergy(state, st.c, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(8, 8, 220, 36);
  ctx.fillStyle = '#e8e8e8'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E = ${E.toFixed(3)}`, 16, 26);
  ctx.fillText(`c = ${st.c.toFixed(2)}, γ = ${st.gamma.toFixed(2)}`, 16, 42);
  rE.textContent = E.toFixed(3);
}
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) { for (let k = 0; k < 4; k += 1) step(state, st.c, st.gamma, 0.5); }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { seedImpulse(state, N / 2, N / 2, 1, 5); for (let i = 0; i < CAPTURE_FRAC * 600; i += 1) step(state, st.c, st.gamma, 0.5); }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
