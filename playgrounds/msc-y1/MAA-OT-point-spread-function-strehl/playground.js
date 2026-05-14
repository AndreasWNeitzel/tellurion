import { airyIntensity, strehl, firstNullArcsec } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sD = document.getElementById('slider-D'), vD = document.getElementById('value-D');
const sSg = document.getElementById('slider-s'), vSg = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { lambda: 650, D: 8, sigma: 0.05 }; let running = true;
sL.addEventListener('input', () => { st.lambda = parseFloat(sL.value); vL.textContent = st.lambda.toFixed(0); });
sD.addEventListener('input', () => { st.D = parseFloat(sD.value); vD.textContent = st.D.toFixed(1); });
sSg.addEventListener('input', () => { st.sigma = parseFloat(sSg.value); vSg.textContent = st.sigma.toFixed(3); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const psfSize = 280, x0 = 40, y0 = 80;
  const arcsec_per_px = firstNullArcsec(st.lambda, st.D) / 80;
  const S = strehl(st.sigma);
  // 2D PSF.
  const id = ctx.createImageData(psfSize, psfSize);
  for (let py = 0; py < psfSize; py += 1) for (let px = 0; px < psfSize; px += 1) {
    const dx = (px - psfSize / 2), dy = (py - psfSize / 2);
    const r_arcsec = Math.hypot(dx, dy) * arcsec_per_px;
    const theta = r_arcsec / 3600 * Math.PI / 180;
    const I_diff = airyIntensity(theta, st.lambda, st.D);
    const I = S * I_diff + (1 - S) * 0.03 * Math.exp(-r_arcsec * r_arcsec / 4);
    const a = Math.max(0, Math.min(255, Math.floor(Math.pow(I, 0.3) * 255)));
    const idx = (py * psfSize + px) * 4;
    id.data[idx] = a; id.data[idx + 1] = a * 0.9; id.data[idx + 2] = a * 0.6; id.data[idx + 3] = 255;
  }
  ctx.putImageData(id, x0, y0);
  // Radial cut.
  const rL = x0 + psfSize + 60, rT = 80, rW = W - rL - 30, rH = 320;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(rL, rT); ctx.lineTo(rL, rT + rH); ctx.lineTo(rL + rW, rT + rH); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('I(θ) (log)', rL + 4, rT + 12); ctx.fillText('θ (arcsec)', rL + rW - 60, rT + rH + 14);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const arcsec = i / 200 * arcsec_per_px * 100;
    const theta = arcsec / 3600 * Math.PI / 180;
    const I = airyIntensity(theta, st.lambda, st.D);
    const px = rL + i / 200 * rW;
    const py = rT + rH - (Math.log10(I + 1e-6) + 6) / 6 * rH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`λ = ${st.lambda} nm, D = ${st.D.toFixed(1)} m, first null = ${firstNullArcsec(st.lambda, st.D).toFixed(3)}"`, 12, 20);
  ctx.fillText(`σ_RMS = ${st.sigma.toFixed(3)} λ → Strehl S = ${S.toFixed(3)} ${S > 0.8 ? '(diffraction-limited)' : ''}`, 12, 38);
  rS.textContent = S.toFixed(3);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
