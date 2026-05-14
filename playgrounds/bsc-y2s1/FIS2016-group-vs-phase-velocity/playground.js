import { omega, phaseVelocity, groupVelocity } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rVp = document.getElementById('readout-vp'), rVg = document.getElementById('readout-vg');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sD = document.getElementById('slider-dk'), vD = document.getElementById('value-dk');
const selD = document.getElementById('select-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { k0: 4, dk: 0.5, disp: 'water-deep', t: 0 };
let running = true;
sK.addEventListener('input', () => { st.k0 = parseFloat(sK.value); vK.textContent = st.k0.toFixed(2); });
sD.addEventListener('input', () => { st.dk = parseFloat(sD.value); vD.textContent = st.dk.toFixed(2); });
selD.addEventListener('change', () => { st.disp = selD.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cy = canvas.height / 2;
  const k1 = st.k0 - st.dk, k2 = st.k0 + st.dk;
  const w1 = omega(st.disp, k1), w2 = omega(st.disp, k2);
  const vp = phaseVelocity(st.disp, st.k0), vg = groupVelocity(st.disp, st.k0);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(canvas.width - 20, cy); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 800;
  for (let i = 0; i < N; i += 1) {
    const x = 20 + (i / N) * (canvas.width - 40);
    const xphys = (x - canvas.width / 2) / 50;
    const y = Math.cos(k1 * xphys - w1 * st.t) + Math.cos(k2 * xphys - w2 * st.t);
    const py = cy - y * 60;
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(91,192,235,0.7)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = 20 + (i / N) * (canvas.width - 40);
    const xphys = (x - canvas.width / 2) / 50;
    const y = 2 * Math.cos((k2 - k1) / 2 * xphys - (w2 - w1) / 2 * st.t);
    const py = cy - y * 60;
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = 20 + (i / N) * (canvas.width - 40);
    const xphys = (x - canvas.width / 2) / 50;
    const y = -2 * Math.cos((k2 - k1) / 2 * xphys - (w2 - w1) / 2 * st.t);
    const py = cy - y * 60;
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  const cx_p = canvas.width / 2 + 50 * vp * st.t * 0.3;
  const cx_g = canvas.width / 2 + 50 * vg * st.t * 0.3;
  if (Math.abs(cx_p - canvas.width / 2) < canvas.width / 2 - 20) {
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx_p, cy - 80, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('phase', cx_p - 18, cy - 92);
  }
  if (Math.abs(cx_g - canvas.width / 2) < canvas.width / 2 - 20) {
    ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(cx_g, cy + 80, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#9aa0a6'; ctx.fillText('group', cx_g - 18, cy + 102);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`v_p = ${vp.toFixed(3)}, v_g = ${vg.toFixed(3)}, v_g/v_p = ${(vg/vp).toFixed(3)}`, 12, canvas.height - 12);
  rVp.textContent = vp.toFixed(3); rVg.textContent = vg.toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.8; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
