import { soundSpeed, shellRadius, C_KM_S } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { R: 0.6, t: 0 }; let running = true;
sR.addEventListener('input', () => { st.R = parseFloat(sR.value); vR.textContent = st.R.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  // CDM peak (no pressure, stays at center).
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('CDM peak (stays)', cx - 50, cy + 30);
  // Baryon shell (expands at c_s).
  const c_s = soundSpeed(st.R);
  const t_rec_Myr = 380e3 / 1e6;
  const r_Mpc = c_s * st.t * 1e-3;
  const r_px = Math.min(220, r_Mpc / 50 * 220);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r_px, 0, 2 * Math.PI); ctx.stroke();
  for (let r = r_px - 8; r > 0; r -= 1) {
    ctx.strokeStyle = `rgba(255,209,102,${0.05 * (1 - r / r_px)})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
  }
  // Photon trail (faster).
  const r_gamma_px = Math.min(280, (C_KM_S / Math.sqrt(3)) * st.t * 1e-3 / 50 * 220);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, r_gamma_px, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`c_s = ${(c_s).toFixed(0)} km/s, baryon shell at r ≈ ${r_Mpc.toFixed(0)} Mpc`, 12, 20);
  ctx.fillText(`If freeze at 380 kyr: r_s ≈ ${(c_s * 380e3 * 1e-3).toFixed(0)} Mpc`, 12, 38);
  rR.textContent = `${r_Mpc.toFixed(0)} Mpc`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 50e3; if (st.t > 400e3) st.t = 0; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 200e3; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
