import { bindingEnergy } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { N0V: 0.3 }; let running = true;
sN.addEventListener('input', () => { st.N0V = parseFloat(sN.value); vN.textContent = st.N0V.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 E_bind / ℏω_D', 12, pad.t + 10); ctx.fillText('N(0) V', W - 70, H - pad.b + 14);
  const xToPx = (n) => pad.l + (n - 0.05) / 0.95 * (W - pad.l - pad.r);
  const minLog = -20, maxLog = 0;
  const yToPx = (l) => H - pad.b - (l - minLog) / (maxLog - minLog) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const n = 0.05 + 0.95 * i / 200;
    const E = bindingEnergy(n);
    const l = Math.log10(Math.max(E, 1e-30));
    const px = xToPx(n), py = yToPx(l);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const Ecur = bindingEnergy(st.N0V);
  const lcur = Math.log10(Math.max(Ecur, 1e-30));
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(st.N0V), yToPx(lcur), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E_bind = ${Ecur.toExponential(3)} ℏω_D at N(0)V = ${st.N0V.toFixed(2)}`, 12, H - 12);
  rE.textContent = Ecur.toExponential(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
