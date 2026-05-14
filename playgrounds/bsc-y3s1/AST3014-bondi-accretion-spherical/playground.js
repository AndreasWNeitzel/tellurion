import { bondiRadius, MdotBondi, bondiVelocityIsothermal, M_SUN, G } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rM = document.getElementById('readout-m');
const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logM: 0, cs: 10, logn: 3, t: 0 }; let running = true;
sM.addEventListener('input', () => { st.logM = parseFloat(sM.value); vM.textContent = st.logM.toFixed(2); });
sC.addEventListener('input', () => { st.cs = parseFloat(sC.value); vC.textContent = st.cs.toFixed(0); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const M = Math.pow(10, st.logM) * M_SUN, cs = st.cs * 1000;
  const rho_inf = Math.pow(10, st.logn) * 1.66e-27 * 1e6;
  const rB = bondiRadius(M, cs);
  const Mdot = MdotBondi(M, cs, rho_inf);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 140, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 70, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('r_B', cx + 145, cy);
  ctx.fillText('r_B/2 (sonic)', cx + 75, cy);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI); ctx.fill();
  for (let k = 0; k < 60; k += 1) {
    const ang = k * 2 * Math.PI / 60;
    const r_outer = 200 + 30 * Math.sin(st.t * 0.5 + k);
    const t_arrival = (st.t + k * 0.13) % 1;
    const r_now = 200 - t_arrival * 190;
    const px = cx + r_now * Math.cos(ang); const py = cy + r_now * Math.sin(ang);
    const alpha = 1 - t_arrival;
    ctx.fillStyle = `rgba(154,160,166,${alpha})`;
    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`r_B = ${(rB / 1.496e11).toExponential(2)} AU`, 12, 20);
  ctx.fillText(`Mdot = ${(Mdot * 3.155e7 / M_SUN).toExponential(2)} M⊙/yr`, 12, 38);
  ctx.fillText(`cs = ${st.cs} km/s, M = 1e${st.logM.toFixed(1)} M⊙`, 12, canvas.height - 12);
  rM.textContent = `${(Mdot * 3.155e7 / M_SUN).toExponential(1)} M⊙/yr`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 1; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
