import { criticalRadius, parkerSpeed, G, M_SUN, R_SUN } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rU = document.getElementById('readout-u');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { T: 1.4, t: 0 }; let running = true;
sT.addEventListener('input', () => { st.T = parseFloat(sT.value); vT.textContent = st.T.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const T = st.T * 1e6;
  const k_mp = 1.38e-23 / 1.66e-27;
  const cs = Math.sqrt(2 * k_mp * T);
  const rc = criticalRadius(cs);
  const r_AU = 1.496e11;
  const u_1AU = parkerSpeed(r_AU, cs);
  const pad = { l: 60, r: 30, t: 30, b: 50 }, W = canvas.width, H = canvas.height;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('u(r) (km/s)', 12, pad.t + 10); ctx.fillText('r / R_sun', W / 2, H - pad.b + 18);
  const r_max = 220 * R_SUN, u_max = 700e3;
  const rToPx = (r) => pad.l + r / r_max * (W - pad.l - pad.r);
  const uToPx = (u) => H - pad.b - u / u_max * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const r = R_SUN + (r_max - R_SUN) * i / 400;
    const u = parkerSpeed(r, cs);
    const px = rToPx(r), py = uToPx(u);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(rToPx(rc), pad.t); ctx.lineTo(rToPx(rc), H - pad.b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, uToPx(cs)); ctx.lineTo(W - pad.r, uToPx(cs)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`r_c = ${(rc / R_SUN).toFixed(1)} R_⊙`, rToPx(rc) + 4, pad.t + 12);
  ctx.fillText(`c_s = ${(cs / 1000).toFixed(0)} km/s`, W - pad.r - 80, uToPx(cs) - 4);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(rToPx(r_AU), uToPx(u_1AU), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`u(1 AU) = ${(u_1AU / 1000).toFixed(0)} km/s, T = ${(T / 1e6).toFixed(2)} MK`, 12, H - 12);
  rU.textContent = `${(u_1AU / 1000).toFixed(0)} km/s`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
