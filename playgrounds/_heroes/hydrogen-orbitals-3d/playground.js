import { densityAt, phaseAt, energyEV, expectedR } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const selV = document.getElementById('select-v');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { n: 2, l: 1, m: 0, view: 'density', t: 0 };
let running = true;
function clamp() {
  if (st.l >= st.n) st.l = st.n - 1;
  if (st.m > st.l) st.m = st.l;
  if (st.m < -st.l) st.m = -st.l;
  vN.textContent = st.n; vL.textContent = st.l; vM.textContent = st.m;
  sL.value = st.l; sM.value = st.m;
}
sN.addEventListener('input', () => { st.n = parseInt(sN.value); clamp(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value); clamp(); });
sM.addEventListener('input', () => { st.m = parseInt(sM.value); clamp(); });
selV.addEventListener('change', () => { st.view = selV.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
clamp();
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
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const rmax = 25 * st.n;
  const N = 256, scale = Math.min(W, H) * 0.4 / rmax;
  const id = ctx.createImageData(W, H);
  // Compute density on a grid in (X, Z) plane (y = 0).
  let dmax = 1e-30;
  const grid = new Float32Array(N * N);
  for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
    const X = (i / N - 0.5) * 2 * rmax;
    const Z = (j / N - 0.5) * 2 * rmax;
    const r = Math.hypot(X, Z);
    const theta = Math.acos(Math.max(-1, Math.min(1, Z / Math.max(r, 1e-6))));
    const phi = X >= 0 ? 0 : Math.PI;
    const d = densityAt(r, theta, phi, st.n, st.l, Math.abs(st.m));
    grid[j * N + i] = d;
    if (d > dmax) dmax = d;
  }
  // Rotation around z axis: animate.
  const rotPhi = st.t * 0.15;
  for (let py = 0; py < H; py += 1) for (let px = 0; px < W; px += 1) {
    // Inverse projection: 3D view, rotation, then sample y=0 slice.
    const X3 = (px - cx) / scale;
    const Z3 = -(py - cy) / scale - 0.3 * X3;
    // Rotate around vertical (z) axis.
    const xr = X3 * Math.cos(rotPhi);
    const zr = Z3;
    const r = Math.hypot(xr, zr);
    if (r > rmax) continue;
    const theta = Math.acos(Math.max(-1, Math.min(1, zr / Math.max(r, 1e-6))));
    const phi = xr >= 0 ? rotPhi : Math.PI + rotPhi;
    const d = densityAt(r, theta, phi, st.n, st.l, Math.abs(st.m));
    const t = Math.pow(d / dmax, 0.4);
    let c;
    if (st.view === 'phase') {
      const ph = ((phaseAt(phi, st.m) / (2 * Math.PI)) + 100) % 1;
      c = hsv(ph, 1, Math.min(1, Math.sqrt(d / dmax) + 0.05));
    } else {
      c = viridis(t);
    }
    const idx = (py * W + px) * 4;
    id.data[idx] = Math.floor(c[0] * 255);
    id.data[idx + 1] = Math.floor(c[1] * 255);
    id.data[idx + 2] = Math.floor(c[2] * 255);
    id.data[idx + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  // <r> ring.
  const rExp = expectedR(st.n, st.l);
  ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, rExp * scale, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`n=${st.n}, l=${st.l}, m=${st.m}; <r> = ${rExp.toFixed(2)} a_0; E_n = ${energyEV(st.n).toFixed(2)} eV`, 12, H - 12);
  rE.textContent = `${energyEV(st.n).toFixed(2)} eV`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 4; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
