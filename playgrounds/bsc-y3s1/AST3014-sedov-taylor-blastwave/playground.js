import { shockRadius, shockSpeed, postShockDensity } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sE = document.getElementById('slider-E'), vE = document.getElementById('value-E');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logE: 51, logn: 0, t: 0 }; let running = true;
sE.addEventListener('input', () => { st.logE = parseFloat(sE.value); vE.textContent = st.logE.toFixed(2); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const E_erg = Math.pow(10, st.logE), E = E_erg * 1e-7;
  const rho1 = Math.pow(10, st.logn) * 1.66e-27 * 1.4 * 1e6;
  const yr = 3.155e7, pc = 3.086e16;
  const t_now = 0.01 + (st.t % 10) * 1000 * yr;
  const R = shockRadius(E, t_now, rho1);
  const cx = canvas.width / 2, cy = canvas.height / 2 + 50;
  const Rpx = Math.max(0.5, Math.min(180, R / (50 * pc) * 180));
  for (let r = Math.max(1, Rpx - 17); r <= Rpx; r += 1) {
    ctx.strokeStyle = `rgba(255,209,102,${Math.max(0, r - (Rpx - 18)) / 18})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.5, Rpx), 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  for (let i = 0; i < 50; i += 1) {
    const t_k = (i + 1) / 50 * (st.t % 10) * 1000 * yr;
    if (t_k < 1) continue;
    const Rk = shockRadius(E, t_k, rho1) / (50 * pc) * 180;
    if (Rk > Rpx || Rk < 0.5) continue;
    ctx.beginPath(); ctx.arc(cx, cy, Rk, 0, 2 * Math.PI); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E = 10^${st.logE.toFixed(1)} erg, n = 10^${st.logn.toFixed(1)} cm⁻³`, 12, 20);
  ctx.fillText(`R(t) = ${(R / pc).toFixed(1)} pc, v_s = ${(shockSpeed(E, t_now, rho1) / 1e3).toFixed(0)} km/s`, 12, 38);
  ctx.fillText(`t ≈ ${(t_now / yr / 1000).toFixed(1)} kyr after explosion`, 12, 56);
  rR.textContent = `${(R / pc).toFixed(1)} pc`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_NAME ? 1.5 + CAPTURE_FRAC * 7.5 : 3; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
