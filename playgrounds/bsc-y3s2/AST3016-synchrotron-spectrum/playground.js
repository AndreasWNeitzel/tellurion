import { nu_c, singleSpec, powerLawSpec, spectralIndex } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { gamma: 2000, logB: -4, p: 2.4, mode: 'single' }; let running = true;
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(0); });
sB.addEventListener('input', () => { st.logB = parseFloat(sB.value); vB.textContent = st.logB.toFixed(2); });
sP.addEventListener('input', () => { st.p = parseFloat(sP.value); vP.textContent = st.p.toFixed(2); });
selM.addEventListener('change', () => { st.mode = selM.value; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 F', 12, pad.t + 10); ctx.fillText('log10 ν', W - 60, H - pad.b + 14);
  const B = Math.pow(10, st.logB) * 1e-4;
  const nu_peak = nu_c(st.gamma, B);
  const lnumin = Math.log10(nu_peak) - 4, lnumax = Math.log10(nu_peak) + 4;
  const xToPx = (l) => pad.l + (l - lnumin) / (lnumax - lnumin) * (W - pad.l - pad.r);
  if (st.mode === 'single') {
    let max = 0;
    const N = 600; const vals = new Float64Array(N);
    for (let i = 0; i < N; i += 1) {
      const lnu = lnumin + (lnumax - lnumin) * i / (N - 1);
      const x = Math.pow(10, lnu) / nu_peak;
      vals[i] = Math.log10(singleSpec(x) + 1e-30);
      if (vals[i] > max) max = vals[i];
    }
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < N; i += 1) {
      const lnu = lnumin + (lnumax - lnumin) * i / (N - 1);
      const py = H - pad.b - (vals[i] - max + 6) / 6 * (H - pad.t - pad.b);
      if (i === 0) ctx.moveTo(xToPx(lnu), py); else ctx.lineTo(xToPx(lnu), py);
    }
    ctx.stroke();
  } else {
    const alpha = spectralIndex(st.p);
    const lognu_min = Math.log10(nu_peak) - 2, lognu_max = Math.log10(nu_peak) + 2;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
    const N = 200;
    let max = 0;
    for (let i = 0; i < N; i += 1) {
      const lnu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
      const f = -alpha * lnu;
      if (i === 0) max = f;
      const py = H - pad.b - (f - max + 6) / 6 * (H - pad.t - pad.b);
      if (i === 0) ctx.moveTo(xToPx(lnu), py); else ctx.lineTo(xToPx(lnu), py);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(Math.log10(nu_peak)), pad.t); ctx.lineTo(xToPx(Math.log10(nu_peak)), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`ν_c = ${nu_peak.toExponential(2)} Hz`, xToPx(Math.log10(nu_peak)) + 4, pad.t + 14);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`γ = ${st.gamma.toFixed(0)}, B = 10^${st.logB.toFixed(1)} G, α = (p-1)/2 = ${spectralIndex(st.p).toFixed(2)}`, 12, H - 14);
  rA.textContent = spectralIndex(st.p).toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
