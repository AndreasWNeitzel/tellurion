import { fixedTargetS, colliderS, sqrtS } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sM1 = document.getElementById('slider-m1'), vM1 = document.getElementById('value-m1');
const sM2 = document.getElementById('slider-m2'), vM2 = document.getElementById('value-m2');
const sE = document.getElementById('slider-E'), vE = document.getElementById('value-E');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { m1: 0.94, m2: 0.94, logE: 3 }; let running = true;
sM1.addEventListener('input', () => { st.m1 = parseFloat(sM1.value); vM1.textContent = st.m1.toFixed(2); });
sM2.addEventListener('input', () => { st.m2 = parseFloat(sM2.value); vM2.textContent = st.m2.toFixed(2); });
sE.addEventListener('input', () => { st.logE = parseFloat(sE.value); vE.textContent = st.logE.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 √s (GeV)', 12, pad.t + 10); ctx.fillText('log10 E_lab (GeV)', W - 100, H - pad.b + 14);
  const xToPx = (l) => pad.l + l / 5 * (W - pad.l - pad.r);
  const yToPx = (l) => H - pad.b - l / 5 * (H - pad.t - pad.b);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const logE = 5 * i / 200;
    const E = Math.pow(10, logE);
    const s = fixedTargetS(st.m1, st.m2, E);
    const py = yToPx(Math.log10(sqrtS(s)));
    if (i === 0) ctx.moveTo(xToPx(logE), py); else ctx.lineTo(xToPx(logE), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const logE = 5 * i / 200;
    const E = Math.pow(10, logE);
    const s = colliderS(st.m1, st.m2, E, E);
    const py = yToPx(Math.log10(sqrtS(s)));
    if (i === 0) ctx.moveTo(xToPx(logE), py); else ctx.lineTo(xToPx(logE), py);
  }
  ctx.stroke();
  const Ecur = Math.pow(10, st.logE);
  const sf = fixedTargetS(st.m1, st.m2, Ecur);
  const sc = colliderS(st.m1, st.m2, Ecur, Ecur);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(xToPx(st.logE), yToPx(Math.log10(sqrtS(sf))), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xToPx(st.logE), yToPx(Math.log10(sqrtS(sc))), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('fixed-target', pad.l + 10, pad.t + 28);
  ctx.fillStyle = '#ffd166'; ctx.fillText('symmetric collider', pad.l + 10, pad.t + 44);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E_lab = ${Ecur.toExponential(2)} GeV → √s fixed = ${sqrtS(sf).toExponential(2)} GeV, collider = ${sqrtS(sc).toExponential(2)} GeV`, 12, H - 12);
  rS.textContent = `${sqrtS(sc).toExponential(1)} GeV`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  // Reference capture sweeps the beam energy: the two markers slide
  // along the fixed-target and collider curves, so the five golden
  // frames are distinct and show sqrt(s) growing as sqrt(E) versus
  // linearly in E.
  if (CAPTURE_NAME) {
    st.logE = 0.3 + CAPTURE_FRAC * 4.4;
    sE.value = String(st.logE);
    vE.textContent = st.logE.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
