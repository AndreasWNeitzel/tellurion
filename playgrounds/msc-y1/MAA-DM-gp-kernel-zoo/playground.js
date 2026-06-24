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

// Posterior fit is the hero; the kernel-covariance and prior-sample
// panels sit below it, each scaled to its own data so nothing spills.
const POST = { x: 30, y: 66, w: W - 60, h: 474 };
const KER = { x: 40, y: 600, w: 348, h: 388 };
const PRI = { x: 440, y: 600, w: W - 40 - 440, h: 388 };
POST._map = null;

function panelFrame(p, title, color) {
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = color || 'rgba(220,230,245,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(title, p.x + 8, p.y + 16);
}

function drawPosterior() {
  const p = POST;
  panelFrame(p, `posterior GP fit: mean and 1, 2 sigma bands on ${state.xObs.length} observations (sigma_n = ${state.sn.toFixed(2)})`, 'rgba(127,190,255,0.95)');
  const k = getKernel();
  const { mu, std } = posterior(k, state.xs, state.xObs, state.yObs, state.sn);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < NX; i += 1) { lo = Math.min(lo, mu[i] - 2 * std[i]); hi = Math.max(hi, mu[i] + 2 * std[i]); }
  for (const y of state.yObs) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!Number.isFinite(lo)) { lo = -3; hi = 3; }
  const pad = (hi - lo) * 0.12 + 1e-6; lo -= pad; hi += pad;
  const ax = p.x + 16, ay = p.y + 30, aw = p.w - 30, ah = p.h - 58;
  const X = (x) => ax + aw * (x - X_MIN) / (X_MAX - X_MIN);
  const Y = (y) => ay + ah * (1 - (y - lo) / (hi - lo));
  if (lo < 0 && hi > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, Y(0)); ctx.lineTo(ax + aw, Y(0)); ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
  const band = (ns, fill) => {
    ctx.fillStyle = fill; ctx.beginPath();
    for (let i = 0; i < NX; i += 1) { const xx = X(state.xs[i]), yy = Y(mu[i] + ns * std[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    for (let i = NX - 1; i >= 0; i -= 1) ctx.lineTo(X(state.xs[i]), Y(mu[i] - ns * std[i]));
    ctx.closePath(); ctx.fill();
  };
  band(2, 'rgba(110,165,215,0.16)');
  band(1, 'rgba(110,165,215,0.30)');
  ctx.strokeStyle = tok.accent; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i < NX; i += 1) { const xx = X(state.xs[i]), yy = Y(mu[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke();
  ctx.restore();
  // Observations with +/- sigma_n noise bars.
  ctx.fillStyle = '#f1d28a'; ctx.strokeStyle = 'rgba(241,210,138,0.7)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < state.xObs.length; i += 1) {
    const xx = X(state.xObs[i]);
    ctx.beginPath(); ctx.moveTo(xx, Y(state.yObs[i] + state.sn)); ctx.lineTo(xx, Y(state.yObs[i] - state.sn)); ctx.stroke();
    ctx.beginPath(); ctx.arc(xx, Y(state.yObs[i]), 4.5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = 'rgba(170,180,200,0.6)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('click in the panel to add an observation', p.x + p.w - 10, p.y + p.h - 8);
  POST._map = { ax, ay, aw, ah, lo, hi };
}

function drawKernel() {
  const p = KER;
  panelFrame(p, 'kernel: cov( f(x0), f(x) )', 'rgba(180,230,160,0.92)');
  const k = getKernel();
  const x0 = 1.2, N = 140;
  const ax = p.x + 32, ay = p.y + 32, aw = p.w - 44, ah = p.h - 60;
  const vals = []; let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= N; i += 1) { const x = X_MIN + (X_MAX - X_MIN) * i / N; const v = k(x0, x); vals.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  lo = Math.min(lo, 0); hi = Math.max(hi, 1e-6); const pad = (hi - lo) * 0.1 + 1e-6; hi += pad; lo -= pad * 0.4;
  const X = (x) => ax + aw * (x - X_MIN) / (X_MAX - X_MIN);
  const Y = (v) => ay + ah * (1 - (v - lo) / (hi - lo));
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, Y(0)); ctx.lineTo(ax + aw, Y(0)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(x0), ay); ctx.lineTo(X(x0), ay + ah); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
  ctx.fillStyle = 'rgba(120,200,140,0.14)'; ctx.beginPath(); ctx.moveTo(X(X_MIN), Y(0));
  for (let i = 0; i <= N; i += 1) ctx.lineTo(X(X_MIN + (X_MAX - X_MIN) * i / N), Y(vals[i]));
  ctx.lineTo(X(X_MAX), Y(0)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#86d99a'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= N; i += 1) { const xx = X(X_MIN + (X_MAX - X_MIN) * i / N), yy = Y(vals[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('x', ax + aw / 2, ay + ah + 16);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('x0', X(x0), ay + ah + 16);
}

function drawPrior() {
  const p = PRI;
  panelFrame(p, 'prior samples (no data)', 'rgba(205,180,240,0.92)');
  const k = getKernel();
  const draws = priorSamples(k, state.xs, 5, state.priorSeed);
  let lo = Infinity, hi = -Infinity;
  for (const d of draws) for (const v of d) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (!Number.isFinite(lo)) { lo = -3; hi = 3; }
  const pad = (hi - lo) * 0.1 + 1e-6; lo -= pad; hi += pad;
  const ax = p.x + 12, ay = p.y + 30, aw = p.w - 24, ah = p.h - 50;
  const X = (x) => ax + aw * (x - X_MIN) / (X_MAX - X_MIN);
  const Y = (y) => ay + ah * (1 - (y - lo) / (hi - lo));
  ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
  for (let s = 0; s < draws.length; s += 1) {
    ctx.strokeStyle = `hsla(${(s * 70 + 220) % 360}, 70%, 65%, 0.9)`; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let i = 0; i < NX; i += 1) { const xx = X(state.xs[i]), yy = Y(draws[s][i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('x', ax + aw / 2, ay + ah + 16);
}

function drawAll() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawPosterior();
  drawKernel();
  drawPrior();
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
  // Add an observation when the click lands inside the posterior plot area.
  const m = POST._map;
  if (m && cx >= m.ax && cx <= m.ax + m.aw && cy >= m.ay && cy <= m.ay + m.ah) {
    const xv = X_MIN + (X_MAX - X_MIN) * (cx - m.ax) / m.aw;
    const yv = m.lo + (m.hi - m.lo) * (1 - (cy - m.ay) / m.ah);
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
