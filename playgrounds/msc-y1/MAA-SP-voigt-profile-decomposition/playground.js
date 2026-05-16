// Voigt profile shown AS the convolution. Top: a stationary Lorentzian
// (natural broadening) with a Gaussian kernel (thermal broadening)
// sliding across it; the shaded overlap integral at slide position tau
// is exactly the Voigt value V(tau). Bottom: V(x) traced out as the
// kernel sweeps, so the profile is literally built by the convolution.
// Reference: Mihalas, Stellar Atmospheres, Ch. 9.

import { gaussian, lorentzian, voigtConv } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rF = document.getElementById('readout-f');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { sigma: 0.8, gamma: 0.4, t: 0 }; let running = true;
let last = performance.now();
const XR = 5;

sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(2); render(); });
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const padL = 56, padR = 24;
  const tau = -XR + ((st.t * 0.9) % (2 * XR));
  const xToPx = (x) => padL + (x + XR) / (2 * XR) * (W - padL - padR);

  // Top panel: the sliding-kernel convolution mechanism.
  const t0 = 26, t1 = H * 0.52;
  const pkL = lorentzian(0, st.gamma), pkG = gaussian(0, st.sigma);
  const topMax = Math.max(pkL, pkG) * 1.08;
  const ty = (v) => t1 - v / topMax * (t1 - t0 - 16);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, t1); ctx.lineTo(W - padR, t1); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('Lorentzian (natural) with sliding Gaussian (thermal) kernel', padL, t0 - 8);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const x = -XR + 2 * XR * i / 300; const p = xToPx(x), y = ty(lorentzian(x, st.gamma)); i === 0 ? ctx.moveTo(p, y) : ctx.lineTo(p, y); }
  ctx.stroke();
  // Shaded region = the convolution integrand, the PRODUCT
  // L(x') * G(x' - tau). Its area is exactly V(tau). Scaled by the
  // largest possible product (kernel centred on the Lorentzian peak) so
  // the shape is a faithful, consistently scaled product, not a fudge.
  const pMax = lorentzian(0, st.gamma) * gaussian(0, st.sigma) * 1.05;
  const py = (v) => t1 - v / pMax * (t1 - t0 - 16);
  ctx.fillStyle = 'rgba(255,209,102,0.40)';
  ctx.beginPath(); ctx.moveTo(xToPx(-XR), t1);
  for (let i = 0; i <= 300; i += 1) { const x = -XR + 2 * XR * i / 300; ctx.lineTo(xToPx(x), py(lorentzian(x, st.gamma) * gaussian(x - tau, st.sigma))); }
  ctx.lineTo(xToPx(XR), t1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.85)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const x = -XR + 2 * XR * i / 300; const q = xToPx(x), yy = py(lorentzian(x, st.gamma) * gaussian(x - tau, st.sigma)); i === 0 ? ctx.moveTo(q, yy) : ctx.lineTo(q, yy); }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const x = -XR + 2 * XR * i / 300; const p = xToPx(x), y = ty(gaussian(x - tau, st.sigma)); i === 0 ? ctx.moveTo(p, y) : ctx.lineTo(p, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(tau), t0); ctx.lineTo(xToPx(tau), t1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.fillText('shaded = L·G product; its area = V(τ)', Math.min(xToPx(tau) + 6, W - padR - 220), t0 + 8);

  // Bottom panel: V(x) traced out by the convolution.
  const b0 = H * 0.60, b1 = H - 40;
  const vPk = voigtConv(0, st.sigma, st.gamma) * 1.12;
  const by = (v) => b1 - v / vPk * (b1 - b0);
  ctx.strokeStyle = '#9aa0a6';
  ctx.beginPath(); ctx.moveTo(padL, b1); ctx.lineTo(W - padR, b1); ctx.stroke();
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('Voigt = Gaussian convolved with Lorentzian (built as τ sweeps)', padL, b0 - 8);
  ctx.fillText('x', W - padR - 8, b1 + 16);
  ctx.strokeStyle = 'rgba(255,209,102,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) { const x = -XR + 2 * XR * i / 240; const p = xToPx(x), y = by(voigtConv(x, st.sigma, st.gamma)); i === 0 ? ctx.moveTo(p, y) : ctx.lineTo(p, y); }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 240; i += 1) {
    const x = -XR + 2 * XR * i / 240;
    if (x > tau) break;
    const p = xToPx(x), y = by(voigtConv(x, st.sigma, st.gamma));
    if (!started) { ctx.moveTo(p, y); started = true; } else ctx.lineTo(p, y);
  }
  ctx.stroke();
  const vTau = voigtConv(tau, st.sigma, st.gamma);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(xToPx(tau), by(vTau), 5, 0, 2 * Math.PI); ctx.fill();

  const fwhm = Math.sqrt(8 * Math.log(2)) * st.sigma + 2 * st.gamma;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`σ_Gauss = ${st.sigma.toFixed(2)}   γ_Lor = ${st.gamma.toFixed(2)}   Voigt FWHM ~ ${fwhm.toFixed(2)}   V(τ) = ${vTau.toFixed(3)}`, 14, H - 14);
  rF.textContent = fwhm.toFixed(2);
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt * 1.6;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * (2 * XR) / 0.9;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
