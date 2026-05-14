import { emissivity, cutoffHz, H, KB } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rC = document.getElementById('readout-c');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logT: 7, logn: 0 }; let running = true;
sT.addEventListener('input', () => { st.logT = parseFloat(sT.value); vT.textContent = st.logT.toFixed(2); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(1); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H_px = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H_px - pad.b); ctx.lineTo(W - pad.r, H_px - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 ε_ν (erg s⁻¹ cm⁻³ Hz⁻¹)', 12, pad.t + 10);
  ctx.fillText('log10 ν (Hz)', W / 2, H_px - pad.b + 18);
  const T = Math.pow(10, st.logT), n = Math.pow(10, st.logn);
  const lognu_min = 8, lognu_max = 22;
  const xToPx = (l) => pad.l + (l - lognu_min) / (lognu_max - lognu_min) * (W - pad.l - pad.r);
  let emax = -1e9, emin = 1e9;
  const N = 600; const eps = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const nu = Math.pow(10, lognu);
    const e = emissivity(nu, T, n, n);
    eps[i] = e > 0 ? Math.log10(e) : -50;
    if (eps[i] > emax) emax = eps[i]; if (eps[i] < emin) emin = eps[i];
  }
  emin = Math.max(emin, emax - 12);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const e = Math.max(emin, eps[i]);
    const py = H_px - pad.b - (e - emin) / (emax - emin) * (H_px - pad.t - pad.b);
    if (i === 0) ctx.moveTo(xToPx(lognu), py); else ctx.lineTo(xToPx(lognu), py);
  }
  ctx.stroke();
  const nu_c = cutoffHz(T);
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(Math.log10(nu_c)), pad.t); ctx.lineTo(xToPx(Math.log10(nu_c)), H_px - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`hν = kT @ log10 ν = ${Math.log10(nu_c).toFixed(2)}`, xToPx(Math.log10(nu_c)) + 4, pad.t + 16);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T = 10^${st.logT.toFixed(1)} K, n = 10^${st.logn.toFixed(1)} cm⁻³`, 12, H_px - 14);
  rC.textContent = `10^${Math.log10(nu_c).toFixed(1)} Hz`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
