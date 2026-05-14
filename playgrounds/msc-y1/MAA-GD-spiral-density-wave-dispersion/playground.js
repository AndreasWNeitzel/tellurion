import { nuSquared, ToomreQ, kCrit } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rQ = document.getElementById('readout-q');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sG = document.getElementById('slider-G'), vG = document.getElementById('value-G');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { sigma: 1.5, kappa: 1.5, GSig: 3 }; let running = true;
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(2); });
sK.addEventListener('input', () => { st.kappa = parseFloat(sK.value); vK.textContent = st.kappa.toFixed(2); });
sG.addEventListener('input', () => { st.GSig = parseFloat(sG.value); vG.textContent = st.GSig.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  const cy = H / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.moveTo(pad.l, cy); ctx.lineTo(W - pad.r, cy); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ν²', 12, pad.t + 10); ctx.fillText('k', W - 20, H - pad.b + 14);
  const kMax = 6;
  const xToPx = (k) => pad.l + k / kMax * (W - pad.l - pad.r);
  const yMin = -4, yMax = 10;
  const yToPx = (y) => H - pad.b - (y - yMin) / (yMax - yMin) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const k = i / 200 * kMax;
    const v = nuSquared(k, st.kappa, st.sigma, st.GSig / (2 * Math.PI));
    if (i === 0) ctx.moveTo(xToPx(k), yToPx(v)); else ctx.lineTo(xToPx(k), yToPx(v));
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(239,71,111,0.15)';
  ctx.fillRect(pad.l, yToPx(0), W - pad.l - pad.r, H - pad.b - yToPx(0));
  const Q = ToomreQ(st.sigma, st.kappa, st.GSig / (2 * Math.PI));
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Q = σ κ / (π G Σ) = ${Q.toFixed(2)}`, 12, H - 14);
  ctx.fillStyle = Q < 1 ? '#ef476f' : '#06d6a0';
  ctx.fillText(Q < 1 ? 'UNSTABLE (ν² < 0 region)' : 'Stable to axisymmetric perturbations', 12, H - 30);
  rQ.textContent = Q.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
