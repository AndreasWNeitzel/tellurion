import { intensity, resolvingPower, principalMaxAngle } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const ids = ['N','d','a','l','dl'];
const sliders = ids.map(k => ({ k, s: document.getElementById('slider-'+k), v: document.getElementById('value-'+k) }));
const st = { N: 20, d: 2, a: 0.5, l: 589, dl: 6 };
let running = !prefersReducedMotion();
let Nf = 20, Ndir = 1;
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
sliders.forEach(({ k, s, v }) => s.addEventListener('input', () => {
  running = false; btnP.textContent = 'Play'; btnP.setAttribute('aria-pressed', 'true');
  st[k] = parseFloat(s.value); v.textContent = k === 'N' ? st[k].toString() : st[k].toFixed(2);
  if (k === 'N') Nf = st.N;
}));
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 50, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('I(θ)', 12, pad.t + 10); ctx.fillText('sin θ', W / 2, H - pad.b + 18);
  const xMin = -0.5, xMax = 0.5;
  const xToPx = (s) => pad.l + (s - xMin) / (xMax - xMin) * (W - pad.l - pad.r);
  let Imax = 1;
  const N1 = 800; const I1 = new Float64Array(N1), I2 = new Float64Array(N1);
  for (let i = 0; i < N1; i += 1) {
    const sinTh = xMin + (xMax - xMin) * i / (N1 - 1);
    const theta = Math.asin(Math.max(-1, Math.min(1, sinTh)));
    I1[i] = intensity(theta, st.l, st.d, st.a, st.N);
    I2[i] = st.dl > 0 ? intensity(theta, st.l + st.dl, st.d, st.a, st.N) : 0;
    if (I1[i] > Imax) Imax = I1[i];
    if (I2[i] > Imax) Imax = I2[i];
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N1; i += 1) {
    const sinTh = xMin + (xMax - xMin) * i / (N1 - 1);
    const py = H - pad.b - I1[i] / Imax * (H - pad.t - pad.b);
    if (i === 0) ctx.moveTo(xToPx(sinTh), py); else ctx.lineTo(xToPx(sinTh), py);
  }
  ctx.stroke();
  if (st.dl > 0) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < N1; i += 1) {
      const sinTh = xMin + (xMax - xMin) * i / (N1 - 1);
      const py = H - pad.b - I2[i] / Imax * (H - pad.t - pad.b);
      if (i === 0) ctx.moveTo(xToPx(sinTh), py); else ctx.lineTo(xToPx(sinTh), py);
    }
    ctx.stroke();
  }
  for (let m = -5; m <= 5; m += 1) {
    const sinTh_m = m * st.l * 1e-9 / (st.d * 1e-6);
    if (sinTh_m < xMin || sinTh_m > xMax) continue;
    ctx.strokeStyle = 'rgba(154,160,166,0.4)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xToPx(sinTh_m), pad.t); ctx.lineTo(xToPx(sinTh_m), H - pad.b); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#9aa0a6'; ctx.fillText(`m=${m}`, xToPx(sinTh_m) - 12, pad.t + 22);
  }
  const R = resolvingPower(1, st.N);
  const dlam_min = st.l / R;
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`R = m*N = 1*${st.N} = ${R}, min Δλ = ${dlam_min.toFixed(2)} nm @ ${st.l} nm`, 12, H - 14);
  rR.textContent = R;
}
// Auto-sweep the slit count N so the resolving-power story plays on load:
// the principal maxima narrow and the two close wavelengths separate as N
// grows. Any slider input or the pause button stops it.
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (running) {
    Nf += Ndir * dt * 6;                                  // ~6 slits/s, 2..40
    if (Nf >= 40) { Nf = 40; Ndir = -1; } else if (Nf <= 2) { Nf = 2; Ndir = 1; }
    const n = Math.round(Nf);
    if (n !== st.N) { st.N = n; const sN = sliders.find((x) => x.k === 'N'); if (sN) { sN.s.value = String(n); sN.v.textContent = String(n); } }
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  // Reference capture sweeps the slit count N (resolving power R = mN):
  // the principal maxima visibly narrow and the two close wavelengths
  // separate as N grows, so the five golden frames are distinct and
  // tell the resolving-power story.
  if (CAPTURE_NAME) {
    st.N = Math.round(2 + CAPTURE_FRAC * 38);
    const sN = sliders.find((x) => x.k === 'N');
    if (sN) { sN.s.value = String(st.N); sN.v.textContent = st.N.toString(); }
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const R = resolvingPower(1, st.N);
  const dlam_min = st.l / R;
  return { fields: [
    { key: 'grating-slits', label: 'Grating slits N', value: st.N, format: 'float' },
    { key: 'slit-separation', label: 'Slit spacing d (um)', value: st.d, format: 'float' },
    { key: 'slit-width', label: 'Slit width a (um)', value: st.a, format: 'float' },
    { key: 'resolving-power', label: 'Resolving power R', value: R, format: 'float' },
  ]};
};
window.playground.getInvariants = function () {
  const R = resolvingPower(1, st.N);
  const theoreticalR = st.N;
  const RMatches = Math.abs(R - theoreticalR) < 0.01;
  return [{ key: 'resolving-power-formula', label: 'R = m*N formula holds', value: RMatches ? 'pass' : 'drift', status: RMatches ? 'pass' : 'drift' }];
};
