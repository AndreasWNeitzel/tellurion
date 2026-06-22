import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// GP kernel zoo: prior samples on top, posterior on bottom, with observations.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { KERNELS, priorSamples, posterior } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selKernel    = document.getElementById('select-kernel');
const sliderEll    = document.getElementById('slider-ell');
const sliderSf     = document.getElementById('slider-sf');
const sliderSn     = document.getElementById('slider-sn');
const valueEll     = document.getElementById('value-ell');
const valueSf      = document.getElementById('value-sf');
const valueSn      = document.getElementById('value-sn');
const btnClear     = document.getElementById('btn-clear');
const btnResample  = document.getElementById('btn-resample');

const W = canvas.width, H = canvas.height;
const NX = 100;
const X_MIN = -3, X_MAX = 3;

const state = {
  kernel: 'rbf',
  ell: 0.7,
  sf: 1.0,
  sn: 0.05,
  xs: new Float64Array(NX),
  xObs: [],
  yObs: [],
  priorSeed: 7,
};
for (let i = 0; i < NX; i += 1) state.xs[i] = X_MIN + (X_MAX - X_MIN) * i / (NX - 1);

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function getKernel() {
  return KERNELS[state.kernel](state.ell, state.sf);
}

function toPx(x, y, panel) {
  return {
    px: panel.x + panel.w * (x - X_MIN) / (X_MAX - X_MIN),
    py: panel.y + panel.h * (1 - (y - panel.ymin) / (panel.ymax - panel.ymin)),
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PAD = 30;
  const PRIOR = { x: PAD, y: 30, w: W - 2 * PAD, h: (H - 100) / 2, ymin: -3, ymax: 3 };
  const POST  = { x: PAD, y: 30 + PRIOR.h + 30, w: W - 2 * PAD, h: (H - 100) / 2, ymin: -3, ymax: 3 };

  const k = getKernel();

  // PRIOR
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PRIOR.x, PRIOR.y, PRIOR.w, PRIOR.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PRIOR.x + 0.5, PRIOR.y + 0.5, PRIOR.w - 1, PRIOR.h - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('Prior samples (no observations)', PRIOR.x + 8, PRIOR.y - 4);

  const draws = priorSamples(k, state.xs, 5, state.priorSeed);
  for (let s = 0; s < draws.length; s += 1) {
    ctx.strokeStyle = `hsla(${(s * 70 + 220) % 360}, 70%, 60%, 0.85)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < NX; i += 1) {
      const p = toPx(state.xs[i], draws[s][i], PRIOR);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // POSTERIOR
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(POST.x, POST.y, POST.w, POST.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(POST.x + 0.5, POST.y + 0.5, POST.w - 1, POST.h - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText(`Posterior (${state.xObs.length} observations, sigma_n = ${state.sn.toFixed(2)})`, POST.x + 8, POST.y - 4);

  const { mu, std } = posterior(k, state.xs, state.xObs, state.yObs, state.sn);
  // Confidence band
  ctx.fillStyle = 'rgba(110, 165, 215, 0.25)';
  ctx.beginPath();
  for (let i = 0; i < NX; i += 1) {
    const p = toPx(state.xs[i], mu[i] + 2 * std[i], POST);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  for (let i = NX - 1; i >= 0; i -= 1) {
    const p = toPx(state.xs[i], mu[i] - 2 * std[i], POST);
    ctx.lineTo(p.px, p.py);
  }
  ctx.closePath();
  ctx.fill();
  // Mean
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < NX; i += 1) {
    const p = toPx(state.xs[i], mu[i], POST);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  // Observations
  ctx.fillStyle = '#f1d28a';
  for (let i = 0; i < state.xObs.length; i += 1) {
    const p = toPx(state.xObs[i], state.yObs[i], POST);
    ctx.beginPath();
    ctx.arc(p.px, p.py, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Auto-sweep the length scale so the prior samples and the posterior morph
// from wiggly (short ell) to smooth (long ell), the core GP intuition. Any
// control pauses it.
let playing = !(DETERMINISTIC || prefersReducedMotion()), ellDir = 1, _last = (typeof performance !== 'undefined' ? performance.now() : 0);
const ellLo = parseFloat(sliderEll.min) || 0.1, ellHi = parseFloat(sliderEll.max) || 2;
selKernel.addEventListener('change', () => { playing = false; state.kernel = selKernel.value; drawAll(); });
sliderEll.addEventListener('input', () => { playing = false; state.ell = parseFloat(sliderEll.value); valueEll.textContent = state.ell.toFixed(2); drawAll(); });
sliderSf.addEventListener('input', () => { playing = false; state.sf = parseFloat(sliderSf.value); valueSf.textContent = state.sf.toFixed(2); drawAll(); });
sliderSn.addEventListener('input', () => { playing = false; state.sn = parseFloat(sliderSn.value); valueSn.textContent = state.sn.toFixed(2); drawAll(); });
btnClear.addEventListener('click', () => { playing = false; state.xObs = []; state.yObs = []; drawAll(); });
btnResample.addEventListener('click', () => { playing = false; state.priorSeed += 17; drawAll(); });
function tick(now) {
  if (playing) {
    const dt = Math.min(0.05, (now - _last) / 1000 || 0);
    state.ell += ellDir * dt * ((ellHi - ellLo) / 11);
    if (state.ell >= ellHi) { state.ell = ellHi; ellDir = -1; } else if (state.ell <= ellLo) { state.ell = ellLo; ellDir = 1; }
    sliderEll.value = String(state.ell); valueEll.textContent = state.ell.toFixed(2);
    drawAll();
  }
  _last = now;
  requestAnimationFrame(tick);
}

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width, sy = H / rect.height;
  const cx = (ev.clientX - rect.left) * sx;
  const cy = (ev.clientY - rect.top) * sy;
  // Add observation in posterior panel (bottom half)
  if (cy > 30 + (H - 100) / 2 + 30) {
    const PAD = 30;
    const POST = { x: PAD, y: 30 + (H - 100) / 2 + 30, w: W - 2 * PAD, h: (H - 100) / 2, ymin: -3, ymax: 3 };
    const xv = X_MIN + (X_MAX - X_MIN) * (cx - POST.x) / POST.w;
    const yv = POST.ymin + (POST.ymax - POST.ymin) * (1 - (cy - POST.y) / POST.h);
    playing = false;
    state.xObs.push(xv); state.yObs.push(yv);
    drawAll();
  }
});

function bootSync() {
  // Seed posterior with 3 observations
  state.xObs = [-1.5, 0.5, 1.8];
  state.yObs = [1.0, -0.5, 0.8];
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const kernels = ['rbf', 'matern32', 'matern52', 'periodic', 'linear'];
    state.kernel = kernels[Math.min(kernels.length - 1, Math.round(frac * (kernels.length - 1)))];
    selKernel.value = state.kernel;
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME && playing) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'kernel', label: 'Kernel type', value: state.kernel, format: 'float' },
    { key: 'lengthscale', label: 'Length scale (ell)', value: state.ell, format: 'float' },
    { key: 'signal-variance', label: 'Signal variance (sigma_f)', value: state.sf, format: 'float' },
    { key: 'noise-variance', label: 'Noise variance (sigma_n)', value: state.sn, format: 'float' }
  ] };
};
window.playground.getInvariants = function () {
  const k = getKernel();
  if (state.xObs.length === 0) {
    return [{ key: 'prior-variance', label: 'Prior variance at origin', value: k(0, 0).toFixed(4), status: 'pass' }];
  }
  const { mu, std } = posterior(k, state.xs, state.xObs, state.yObs, state.sn);
  const maxStdRatio = Math.max(...std) / (state.sf * state.sf);
  return [
    { key: 'posterior-std-bounded', label: 'Posterior std <= prior', value: maxStdRatio <= 1.0001 ? 'pass' : 'drift', status: maxStdRatio <= 1.0001 ? 'pass' : 'drift' },
    { key: 'posterior-mean', label: 'Posterior mean evaluated', value: mu.length.toString(), status: 'pass' }
  ];
};
