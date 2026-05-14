import { densityAt, phaseAt, energyEV, expectedR } from './sim.js';
import { setupOrbitalGL } from '../../../shared/js/engine-gl/hydrogen-orbital.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const rE = document.getElementById('readout-e');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const selV = document.getElementById('select-v');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { n: 2, l: 1, m: 0, view: 'density', t: 0 };
let running = true; let needsRebuild = true;
function clamp() {
  if (st.l >= st.n) st.l = st.n - 1;
  if (st.m > st.l) st.m = st.l;
  if (st.m < -st.l) st.m = -st.l;
  vN.textContent = st.n; vL.textContent = st.l; vM.textContent = st.m;
  sL.value = st.l; sM.value = st.m;
}
sN.addEventListener('input', () => { st.n = parseInt(sN.value); clamp(); needsRebuild = true; });
sL.addEventListener('input', () => { st.l = parseInt(sL.value); clamp(); needsRebuild = true; });
sM.addEventListener('input', () => { st.m = parseInt(sM.value); clamp(); needsRebuild = true; });
selV.addEventListener('change', () => { st.view = selV.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
clamp();
let gl = null; try { gl = setupOrbitalGL(canvas, 40); } catch (e) { console.warn('webgl2 hydrogen init failed', e); }
const ctx2d = gl ? null : canvas.getContext('2d', { alpha: false });
function hsv(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), tt = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, tt, p]; case 1: return [q, v, p]; case 2: return [p, v, tt];
    case 3: return [p, q, v]; case 4: return [tt, p, v]; default: return [v, p, q];
  }
}
function viridis(t) { return [Math.max(0, Math.min(1, 0.267 + 0.105 * t - 0.330 * t * t + 1.000 * t * t * t)), Math.max(0, Math.min(1, 0.005 + 1.404 * t - 0.479 * t * t)), Math.max(0, Math.min(1, 0.329 + 0.749 * t - 0.972 * t * t))]; }
let last = performance.now();
function render() {
  if (gl) {
    if (needsRebuild) { gl.fillVolume(st.n, st.l, Math.abs(st.m)); needsRebuild = false; }
    const mode = st.view === 'iso' ? 1 : 0;
    gl.render(st.t, mode, 0.05);
  } else {
    // Canvas2D fallback.
    ctx2d.fillStyle = '#060608'; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const rmax = 25 * st.n;
    const N = 200, scale = Math.min(W, H) * 0.4 / rmax;
    const id = ctx2d.createImageData(W, H);
    const rotPhi = st.t * 0.15;
    let dmax = 1e-30;
    for (let py = 0; py < H; py += 2) for (let px = 0; px < W; px += 2) {
      const X3 = (px - cx) / scale;
      const Z3 = -(py - cy) / scale - 0.3 * X3;
      const xr = X3 * Math.cos(rotPhi);
      const r = Math.hypot(xr, Z3);
      const theta = Math.acos(Math.max(-1, Math.min(1, Z3 / Math.max(r, 1e-6))));
      const phi = xr >= 0 ? rotPhi : Math.PI + rotPhi;
      const d = densityAt(r, theta, phi, st.n, st.l, Math.abs(st.m));
      if (d > dmax) dmax = d;
    }
    for (let py = 0; py < H; py += 1) for (let px = 0; px < W; px += 1) {
      const X3 = (px - cx) / scale;
      const Z3 = -(py - cy) / scale - 0.3 * X3;
      const xr = X3 * Math.cos(rotPhi);
      const r = Math.hypot(xr, Z3);
      if (r > rmax) continue;
      const theta = Math.acos(Math.max(-1, Math.min(1, Z3 / Math.max(r, 1e-6))));
      const phi = xr >= 0 ? rotPhi : Math.PI + rotPhi;
      const d = densityAt(r, theta, phi, st.n, st.l, Math.abs(st.m));
      const t = Math.pow(d / dmax, 0.4);
      const c = st.view === 'phase' ? hsv(((phaseAt(phi, st.m) / (2 * Math.PI)) + 100) % 1, 1, Math.min(1, Math.sqrt(d / dmax) + 0.05)) : viridis(t);
      const idx = (py * W + px) * 4;
      id.data[idx] = c[0] * 255; id.data[idx + 1] = c[1] * 255; id.data[idx + 2] = c[2] * 255; id.data[idx + 3] = 255;
    }
    ctx2d.putImageData(id, 0, 0);
  }
  rE.textContent = `${energyEV(st.n).toFixed(2)} eV`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 4; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
