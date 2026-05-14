import { initEnsemble, rk4, centroid } from './sim.js';
import { setupLorenzGL } from '../../../shared/js/engine-gl/lorenz-ensemble.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const rS = document.getElementById('readout-s');
let last = performance.now();
let gl = null; let cpu = null; let t = 0;
try {
  gl = setupLorenzGL(canvas, 32);
  gl.init(0xC0FFEE);
} catch (e) {
  console.warn('webgl2 lorenz init failed, falling back to canvas2d', e);
}
if (!gl) {
  cpu = initEnsemble(1000, 1e-3, 0xC0FFEE);
}
const ctx2d = gl ? null : canvas.getContext('2d', { alpha: false });
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (gl) {
    for (let k = 0; k < 4; k += 1) gl.step(0.005);
    const cam = gl.camera(t);
    gl.decay(0.985);
    gl.splat(cam.view, cam.proj);
    gl.render();
  } else {
    ctx2d.fillStyle = 'rgba(6,6,8,0.06)'; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    for (let k = 0; k < 2; k += 1) rk4(cpu, 0.005);
    const cx = canvas.width / 2, cy = canvas.height / 2 + 80, scale = 7;
    for (let i = 0; i < 1000; i += 1) {
      const x = cpu[3 * i], y = cpu[3 * i + 1], z = cpu[3 * i + 2];
      const px = cx + x * scale + y * scale * 0.4;
      const py = cy - z * scale + y * scale * 0.3;
      const c = Math.floor(Math.max(0, Math.min(255, 80 + z * 4)));
      ctx2d.fillStyle = `rgba(${c}, ${c * 0.9 + 60}, ${c * 0.5 + 40}, 0.6)`;
      ctx2d.fillRect(px, py, 1.5, 1.5);
    }
  }
  t += dt;
  if (cpu) {
    const c = centroid(cpu);
    rS.textContent = `(${c[0].toFixed(1)}, ${c[1].toFixed(1)}, ${c[2].toFixed(1)})`;
  } else rS.textContent = 'GPU';
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    if (gl) { for (let i = 0; i < 400; i += 1) gl.step(0.01); const cam = gl.camera(0); for (let i = 0; i < 100; i += 1) { gl.step(0.01); gl.splat(cam.view, cam.proj); } gl.render(); }
    else { for (let i = 0; i < CAPTURE_FRAC * 4000; i += 1) rk4(cpu, 0.01); }
  }
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
