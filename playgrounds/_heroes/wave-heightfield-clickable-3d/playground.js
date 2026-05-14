import { makeGrid, seedImpulse, step as cpuStep, totalEnergy } from './sim.js';
import { setupWave2DGL } from '../../../shared/js/engine-gl/wave-2d.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const rE = document.getElementById('readout-e');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const N = 96;
let st = { c: 0.4, gamma: 0.05, A: 0.8, sigma: 3, t: 0 };
let running = true;

let gl = null; let cpu = null;
try { gl = setupWave2DGL(canvas, N); } catch (e) { console.warn('webgl2 wave engine init failed, falling back to canvas2d', e); }
if (!gl) {
  cpu = makeGrid(N);
}

sC.addEventListener('input', () => { st.c = parseFloat(sC.value); vC.textContent = st.c.toFixed(2); });
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); });
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(1); });
btnR.addEventListener('click', () => {
  if (gl) gl.reset(); else cpu = makeGrid(N);
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false');
});
btnP.addEventListener('click', () => {
  running = !running;
  btnP.textContent = running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!running));
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * N;
  const cy = (1 - (e.clientY - rect.top) / rect.height) * N;
  if (gl) gl.seed(cx, cy, st.A, st.sigma);
  else seedImpulse(cpu, cx, cy, st.A, st.sigma);
});

let last = performance.now();
const ctx2d = gl ? null : canvas.getContext('2d', { alpha: false });
function viridis(t) {
  return [Math.floor(255 * Math.max(0, Math.min(1, 0.267 + 0.105 * t - 0.330 * t * t + 1.000 * t * t * t))),
          Math.floor(255 * Math.max(0, Math.min(1, 0.005 + 1.404 * t - 0.479 * t * t))),
          Math.floor(255 * Math.max(0, Math.min(1, 0.329 + 0.749 * t - 0.972 * t * t)))];
}
function render() {
  if (gl) {
    const w = canvas.width, h = canvas.height;
    gl.renderSurface(w, h, 0.7, st.t);
  } else if (ctx2d) {
    ctx2d.fillStyle = '#060608'; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height, cellPx = W / N;
    const img = ctx2d.createImageData(W, H);
    for (let py = 0; py < H; py += 1) for (let px = 0; px < W; px += 1) {
      const ix = Math.floor(px / cellPx), iy = Math.floor(py / cellPx);
      const u = cpu.u[iy * N + ix];
      const v = 0.5 + Math.max(-1, Math.min(1, u * 1.5)) * 0.5;
      const c = viridis(v);
      const idx = (py * W + px) * 4;
      img.data[idx] = c[0]; img.data[idx + 1] = c[1]; img.data[idx + 2] = c[2]; img.data[idx + 3] = 255;
    }
    ctx2d.putImageData(img, 0, 0);
  }
  // Readout: energy from CPU mirror if available, else qualitative.
  if (cpu) { const E = totalEnergy(cpu, st.c, 1); rE.textContent = E.toFixed(3); }
  else rE.textContent = 'GPU';
}
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) {
    for (let k = 0; k < 4; k += 1) {
      if (gl) gl.step(st.c, st.gamma, 0.5);
      else cpuStep(cpu, st.c, st.gamma, 0.5);
    }
    st.t += dt;
  }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    if (gl) {
      gl.seed(N / 2, N / 2, 1, 5);
      for (let i = 0; i < CAPTURE_FRAC * 200; i += 1) gl.step(st.c, st.gamma, 0.5);
    } else {
      seedImpulse(cpu, N / 2, N / 2, 1, 5);
      for (let i = 0; i < CAPTURE_FRAC * 200; i += 1) cpuStep(cpu, st.c, st.gamma, 0.5);
    }
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
