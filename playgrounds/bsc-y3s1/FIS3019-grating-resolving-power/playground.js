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
  const mainTop = pad.t, mainBot = Math.round(H * 0.50);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, mainTop); ctx.lineTo(pad.l, mainBot); ctx.lineTo(W - pad.r, mainBot); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('I(θ): full pattern', pad.l + 6, mainTop + 12); ctx.fillText('sin θ', W / 2, mainBot + 18);
  const xMin = -0.5, xMax = 0.5;
  const xToPx = (s) => pad.l + (s - xMin) / (xMax - xMin) * (W - pad.l - pad.r);
  let Imax = 1e-9;
  const N1 = 1000; const I1 = new Float64Array(N1), I2 = new Float64Array(N1);
  for (let i = 0; i < N1; i += 1) {
    const sinTh = xMin + (xMax - xMin) * i / (N1 - 1);
    const theta = Math.asin(Math.max(-1, Math.min(1, sinTh)));
    I1[i] = intensity(theta, st.l, st.d, st.a, st.N);
    I2[i] = st.dl > 0 ? intensity(theta, st.l + st.dl, st.d, st.a, st.N) : 0;
    if (I1[i] > Imax) Imax = I1[i];
    if (I2[i] > Imax) Imax = I2[i];
  }
  const plotCurve = (arr, col, baseY, topY) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < N1; i += 1) {
      const sinTh = xMin + (xMax - xMin) * i / (N1 - 1);
      const py = baseY - arr[i] / Imax * (baseY - topY);
      if (i === 0) ctx.moveTo(xToPx(sinTh), py); else ctx.lineTo(xToPx(sinTh), py);
    }
    ctx.stroke();
  };
  for (let m = -5; m <= 5; m += 1) {
    const sinTh_m = m * st.l * 1e-9 / (st.d * 1e-6);
    if (sinTh_m < xMin || sinTh_m > xMax) continue;
    ctx.strokeStyle = 'rgba(154,160,166,0.4)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xToPx(sinTh_m), mainTop); ctx.lineTo(xToPx(sinTh_m), mainBot); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#9aa0a6'; ctx.fillText(`m=${m}`, xToPx(sinTh_m) - 12, mainTop + 26);
  }
  plotCurve(I1, '#ffd166', mainBot, mainTop + 30);
  if (st.dl > 0) plotCurve(I2, '#5bc0eb', mainBot, mainTop + 30);
  // box around the m=+1 order that the inset magnifies
  const m1c = st.l * 1e-9 / (st.d * 1e-6);
  if (m1c > xMin && m1c < xMax) { ctx.strokeStyle = 'rgba(6,214,160,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(xToPx(m1c) - 18, mainTop + 30, 36, mainBot - mainTop - 30); }

  drawInset(W, H, pad, mainBot);

  const R = resolvingPower(1, st.N);
  const dlam_min = st.l / R;
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`R = m*N = 1*${st.N} = ${R}, min Δλ = ${dlam_min.toFixed(2)} nm @ ${st.l} nm`, 12, H - 14);
  rR.textContent = R;
}

// Zoomed inset on the m=+1 order. At full-pattern zoom the doublet separation
// (~m*Δλ/d in sin θ) is a couple of pixels, so whether the two lines are
// resolved is invisible. Magnify a window a few peak-widths wide, draw both
// wavelengths on the inset's own vertical scale, mark the two principal-max
// positions, and apply the Rayleigh criterion (resolved when the separation
// reaches the half-width to the first zero, i.e. N >= lambda/Delta-lambda).
function drawInset(W, H, pad, mainBot) {
  const insTop = Math.round(H * 0.58), insBot = H - pad.b - 22;
  const insL = pad.l, insR = W - pad.r;
  const m = 1;
  const sc = m * st.l * 1e-9 / (st.d * 1e-6);            // m=1 principal max, lambda1
  const sep = m * st.dl * 1e-9 / (st.d * 1e-6);          // doublet separation (sin theta)
  const pkW = st.l * 1e-9 / (st.N * st.d * 1e-6);        // half-width to first zero
  const half = Math.max(5 * pkW, 3.2 * sep, 0.004);
  const mid = sc + sep / 2, zLo = mid - half, zHi = mid + half;
  const zToPx = (s) => insL + (s - zLo) / (zHi - zLo) * (insR - insL);
  ctx.fillStyle = 'rgba(6,214,160,0.04)'; ctx.fillRect(insL, insTop, insR - insL, insBot - insTop);
  ctx.strokeStyle = 'rgba(6,214,160,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(insL, insTop, insR - insL, insBot - insTop);
  ctx.fillStyle = '#06d6a0'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('zoom on m=+1: is the doublet resolved?', insL + 8, insTop + 16);
  // sample both wavelengths across the zoom window, normalise to the window max
  const N2 = 700; const z1 = new Float64Array(N2), z2 = new Float64Array(N2);
  let zMax = 1e-9;
  for (let i = 0; i < N2; i += 1) {
    const s = zLo + (zHi - zLo) * i / (N2 - 1);
    const th = Math.asin(Math.max(-1, Math.min(1, s)));
    z1[i] = intensity(th, st.l, st.d, st.a, st.N);
    z2[i] = st.dl > 0 ? intensity(th, st.l + st.dl, st.d, st.a, st.N) : 0;
    if (z1[i] > zMax) zMax = z1[i]; if (z2[i] > zMax) zMax = z2[i];
  }
  const baseY = insBot - 6, topY = insTop + 30;
  const zCurve = (arr, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < N2; i += 1) {
      const s = zLo + (zHi - zLo) * i / (N2 - 1);
      const py = baseY - arr[i] / zMax * (baseY - topY);
      if (i === 0) ctx.moveTo(zToPx(s), py); else ctx.lineTo(zToPx(s), py);
    }
    ctx.stroke();
  };
  // mark the two principal-max positions
  for (const [s, col, lab] of [[sc, '#ffd166', 'λ'], [sc + sep, '#5bc0eb', 'λ+Δλ']]) {
    if (st.dl <= 0 && lab !== 'λ') continue;
    ctx.strokeStyle = col === '#ffd166' ? 'rgba(255,209,102,0.45)' : 'rgba(91,192,235,0.45)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(zToPx(s), topY); ctx.lineTo(zToPx(s), baseY); ctx.stroke(); ctx.setLineDash([]);
  }
  zCurve(z1, '#ffd166');
  if (st.dl > 0) zCurve(z2, '#5bc0eb');
  // Rayleigh verdict
  const Rneed = st.dl > 0 ? Math.ceil(st.l / st.dl) : 0;
  const resolved = st.dl > 0 && st.N >= Rneed;
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  if (st.dl <= 0) { ctx.fillStyle = '#9aa0a6'; ctx.fillText('single line (Δλ = 0)', insR - 10, insTop + 16); }
  else {
    ctx.fillStyle = resolved ? '#06d6a0' : '#ef476f';
    ctx.fillText(resolved ? 'RESOLVED' : 'NOT RESOLVED', insR - 10, insTop + 16);
    ctx.fillStyle = '#9aa0a6';
    ctx.fillText(`need N ≥ λ/Δλ = ${Rneed}  (now ${st.N})`, insR - 10, insBot - 8);
  }
  ctx.textAlign = 'left';
}
// Auto-sweep the slit count N so the resolving-power story plays on load:
// the principal maxima narrow and the two close wavelengths separate as N
// grows. Any slider input or the pause button stops it.
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (running) {
    Nf += Ndir * dt * 20;                                 // sweep 2..130 so the doublet crosses the resolution threshold (need N ~ lambda/dlambda)
    if (Nf >= 130) { Nf = 130; Ndir = -1; } else if (Nf <= 2) { Nf = 2; Ndir = 1; }
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
    st.N = Math.round(2 + CAPTURE_FRAC * 138);
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
