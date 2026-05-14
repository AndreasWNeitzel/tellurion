import { transmitOptical, profileVsTau } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rI = document.getElementById('readout-i');
const sI = document.getElementById('slider-Iin'), vI = document.getElementById('value-Iin');
const sS = document.getElementById('slider-S'), vS = document.getElementById('value-S');
const sT = document.getElementById('slider-tau'), vT = document.getElementById('value-tau');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Iin: 1, S: 3, tau: 2 }; let running = true;
sI.addEventListener('input', () => { st.Iin = parseFloat(sI.value); vI.textContent = st.Iin.toFixed(2); });
sS.addEventListener('input', () => { st.S = parseFloat(sS.value); vS.textContent = st.S.toFixed(2); });
sT.addEventListener('input', () => { st.tau = parseFloat(sT.value); vT.textContent = st.tau.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('I', 12, pad.t + 10); ctx.fillText('τ', W - pad.r - 12, H - pad.b + 14);
  const r = profileVsTau(st.Iin, st.S, st.tau, 200);
  const Imax = Math.max(st.Iin, st.S, 1);
  const xToPx = (t) => pad.l + t / st.tau * (W - pad.l - pad.r);
  const yToPx = (i) => H - pad.b - i / Imax * (H - pad.t - pad.b);
  ctx.fillStyle = 'rgba(154,160,166,0.1)'; ctx.fillRect(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b);
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(pad.l, yToPx(st.S)); ctx.lineTo(W - pad.r, yToPx(st.S)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, yToPx(st.Iin)); ctx.lineTo(W - pad.r, yToPx(st.Iin)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`S = ${st.S.toFixed(2)}`, W - pad.r - 60, yToPx(st.S) - 4);
  ctx.fillText(`I_in = ${st.Iin.toFixed(2)}`, pad.l + 6, yToPx(st.Iin) - 4);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < r.I.length; i += 1) {
    const px = xToPx(r.taus[i]), py = yToPx(r.I[i]);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const I_out = transmitOptical(st.Iin, st.S, st.tau);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(st.tau), yToPx(I_out), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`I(τ=${st.tau.toFixed(2)}) = ${I_out.toFixed(3)}`, 12, H - 14);
  rI.textContent = I_out.toFixed(3);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
