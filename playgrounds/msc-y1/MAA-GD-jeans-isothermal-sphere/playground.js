import { density, massEnclosed, vCirc, G_SI } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rV = document.getElementById('readout-v');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { sigma: 200 }; let running = true;
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(0); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('v_c (km/s)', 12, pad.t + 10); ctx.fillText('r (kpc)', W - 40, H - pad.b + 14);
  const sigma_si = st.sigma * 1000;
  const vc = vCirc(sigma_si) / 1000;
  const xToPx = (r) => pad.l + r / 50 * (W - pad.l - pad.r);
  const yToPx = (v) => H - pad.b - v / 600 * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const r_kpc = 1 + 49 * i / 200;
    const v = vc;
    const px = xToPx(r_kpc), py = yToPx(v);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#5bc0eb'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`σ = ${st.sigma.toFixed(0)} km/s → v_c = √2 σ = ${vc.toFixed(0)} km/s (flat)`, 12, H - 14);
  ctx.fillStyle = '#9aa0a6'; ctx.fillText(`M(r=20 kpc) = ${(massEnclosed(20 * 3.086e19, sigma_si) / 1.989e30).toExponential(2)} M⊙`, 12, H - 30);
  rV.textContent = `${vc.toFixed(0)} km/s`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
