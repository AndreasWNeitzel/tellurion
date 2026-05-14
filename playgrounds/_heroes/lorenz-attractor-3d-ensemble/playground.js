import { initEnsemble, rk4, centroid } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const N = 1000;
let state = initEnsemble(N, 1e-3, 0xC0FFEE);
let last = performance.now();
function render() {
  ctx.fillStyle = 'rgba(6,6,8,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2 + 80, scale = 7;
  for (let i = 0; i < N; i += 1) {
    const x = state[3 * i], y = state[3 * i + 1], z = state[3 * i + 2];
    const px = cx + x * scale + y * scale * 0.4;
    const py = cy - z * scale + y * scale * 0.3;
    const c = Math.floor(Math.max(0, Math.min(255, 80 + z * 4)));
    ctx.fillStyle = `rgba(${c}, ${c * 0.9 + 60}, ${c * 0.5 + 40}, 0.5)`;
    ctx.fillRect(px, py, 1.5, 1.5);
  }
}
function tick(now) { const dt = (now - last) / 1000; last = now; for (let k = 0; k < 2; k += 1) rk4(state, 0.005); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < CAPTURE_FRAC * 4000; i += 1) rk4(state, 0.01); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
