import { Omega_m_at, growthFactor, deltaGrowth } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Om: 0.315 }; let running = true;
sO.addEventListener('input', () => { st.Om = parseFloat(sO.value); vO.textContent = st.Om.toFixed(3); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  // Two panels.
  const top1 = pad.t, mid = H / 2 + 5, bot1 = mid - 10, top2 = mid + 10, bot2 = H - pad.b;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, top1); ctx.lineTo(pad.l, bot1); ctx.lineTo(W - pad.r, bot1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, top2); ctx.lineTo(pad.l, bot2); ctx.lineTo(W - pad.r, bot2); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Ω_m(a), f(a) = Ω_m^0.55', pad.l + 4, top1 + 12);
  ctx.fillText('δ(a) (normalized)', pad.l + 4, top2 + 12);
  ctx.fillText('a (scale factor, log)', W - 120, bot2 + 14);
  const xToPx = (a) => pad.l + (Math.log10(a) - (-3)) / 3 * (W - pad.l - pad.r);
  // Panel 1: Omega_m, f.
  const yToPx1 = (v) => bot1 - v * (bot1 - top1 - 20);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const a = Math.pow(10, -3 + 3 * i / 200);
    const v = Omega_m_at(a, st.Om);
    if (i === 0) ctx.moveTo(xToPx(a), yToPx1(v)); else ctx.lineTo(xToPx(a), yToPx1(v));
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const a = Math.pow(10, -3 + 3 * i / 200);
    const v = growthFactor(a, st.Om);
    if (i === 0) ctx.moveTo(xToPx(a), yToPx1(v)); else ctx.lineTo(xToPx(a), yToPx1(v));
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.fillText('Ω_m(a)', W - 100, top1 + 30);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('f(a) ≈ Ω_m^0.55', W - 140, top1 + 48);
  // Panel 2: delta(a) normalized.
  const dToday = deltaGrowth(1, st.Om);
  const yToPx2 = (v) => bot2 - v / 1.05 * (bot2 - top2 - 20);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const a = Math.pow(10, -3 + 3 * i / 100);
    const d = deltaGrowth(a, st.Om) / dToday;
    if (i === 0) ctx.moveTo(xToPx(a), yToPx2(d)); else ctx.lineTo(xToPx(a), yToPx2(d));
  }
  ctx.stroke();
  // Today marker.
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(1), top1); ctx.lineTo(xToPx(1), bot2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`a today; Ω_m,0 = ${st.Om.toFixed(3)}`, 12, H - 14);
  rD.textContent = `1.00`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
