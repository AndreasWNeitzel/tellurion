import { gaussian, lorentzian, pseudoVoigt } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rF = document.getElementById('readout-f');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { sigma: 0.8, gamma: 0.4 }; let running = true;
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(2); });
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('I (norm)', 12, pad.t + 10); ctx.fillText('Δν / FWHM', W - 80, H - pad.b + 14);
  const xToPx = (x) => pad.l + (x + 5) / 10 * (W - pad.l - pad.r);
  const maxI = Math.max(gaussian(0, st.sigma), lorentzian(0, st.gamma), pseudoVoigt(0, st.sigma, st.gamma));
  const yToPx = (v) => H - pad.b - v / maxI * (H - pad.t - pad.b);
  const N = 400;
  const lines = [
    { fn: (x) => gaussian(x, st.sigma), color: '#5bc0eb', label: 'Gaussian' },
    { fn: (x) => lorentzian(x, st.gamma), color: '#06d6a0', label: 'Lorentzian' },
    { fn: (x) => pseudoVoigt(x, st.sigma, st.gamma), color: '#ffd166', label: 'Voigt' },
  ];
  lines.forEach((L, i) => {
    ctx.strokeStyle = L.color; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k <= N; k += 1) {
      const x = -5 + 10 * k / N;
      const v = L.fn(x);
      const px = xToPx(x), py = yToPx(v);
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = L.color; ctx.fillText(L.label, W - 100, pad.t + 20 + i * 14);
  });
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  const fwhm = Math.sqrt(8 * Math.log(2)) * st.sigma + 2 * st.gamma;
  ctx.fillText(`σ_Gauss = ${st.sigma.toFixed(2)}, γ_Lor = ${st.gamma.toFixed(2)}, Voigt FWHM ≈ ${fwhm.toFixed(2)}`, 12, H - 14);
  rF.textContent = fwhm.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
