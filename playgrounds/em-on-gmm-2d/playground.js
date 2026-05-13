// playground.js
// EM on a 2D Gaussian mixture. Synthetic data from a 3-cluster ground
// truth; user runs EM, watches ellipses converge.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { sampleGMM, initEM, emStep, ellipsePoints } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderK      = document.getElementById('slider-K');
const sliderSeed   = document.getElementById('slider-seed');
const valueK       = document.getElementById('value-K');
const valueSeed    = document.getElementById('value-seed');
const btnStep      = document.getElementById('btn-step');
const btnRun       = document.getElementById('btn-run');
const btnReset     = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PLOT_H = 460;
const PROF_Y = PLOT_H + 20;
const PROF_H = H - PROF_Y - 20;

const N_POINTS = 600;
const VIEW = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
const COLORS = ['#69a8d6', '#d68a69', '#7ec27e', '#d6c869', '#b07cd1'];

const TRUE_MEANS = [[-2.5, -1.2], [2.0, 1.5], [-0.5, 2.7]];
const TRUE_COVS = [
  [0.45, 0.20, 0.20, 0.30],
  [0.70, -0.30, -0.30, 0.55],
  [0.30, 0.05, 0.05, 0.40],
];
const TRUE_WEIGHTS = [0.35, 0.35, 0.30];

const state = {
  K: 3,
  initSeed: 1,
  data: null,
  labels: null,
  means: null,
  covs: null,
  weights: null,
  iter: 0,
  logLikeHistory: [],
};

function toPx(x, y) {
  return {
    px: (W) * (x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin),
    py: PLOT_H * (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)),
  };
}

function generateData() {
  const { data, labels } = sampleGMM({
    N: N_POINTS, K: 3, means: TRUE_MEANS, covs: TRUE_COVS, weights: TRUE_WEIGHTS,
    seed: SEED,
  });
  state.data = data;
  state.labels = labels;
}

function initParams() {
  const p = initEM({ data: state.data, N: N_POINTS, K: state.K, seed: state.initSeed });
  state.means = p.means;
  state.covs = p.covs;
  state.weights = p.weights;
  state.iter = 0;
  state.logLikeHistory = [];
}

function step() {
  const r = emStep({
    data: state.data, N: N_POINTS, K: state.K,
    means: state.means, covs: state.covs, weights: state.weights,
  });
  state.means = r.means;
  state.covs = r.covs;
  state.weights = r.weights;
  state.iter += 1;
  state.logLikeHistory.push(r.logLike);
  return r.gamma;
}

function pointColor(n, gamma) {
  let best = 0, bestK = 0;
  for (let k = 0; k < state.K; k += 1) {
    const g = gamma[n * state.K + k];
    if (g > best) { best = g; bestK = k; }
  }
  return { color: COLORS[bestK % COLORS.length], confidence: best };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // axis
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let xv = -4; xv <= 4; xv += 2) {
    const p = toPx(xv, 0);
    ctx.beginPath();
    ctx.moveTo(p.px, 0); ctx.lineTo(p.px, PLOT_H);
    ctx.stroke();
  }
  for (let yv = -4; yv <= 4; yv += 2) {
    const p = toPx(0, yv);
    ctx.beginPath();
    ctx.moveTo(0, p.py); ctx.lineTo(W, p.py);
    ctx.stroke();
  }

  // True ellipses (faint, dashed)
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.0;
  for (let k = 0; k < TRUE_MEANS.length; k += 1) {
    const pts = ellipsePoints(TRUE_MEANS[k], TRUE_COVS[k], 2);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const p = toPx(pts[i], pts[i + 1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Run a no-update E step to get current gammas for coloring.
  const fakeStep = emStep({
    data: state.data, N: N_POINTS, K: state.K,
    means: state.means, covs: state.covs, weights: state.weights,
  });
  // Plot data points
  for (let n = 0; n < N_POINTS; n += 1) {
    const { color, confidence } = pointColor(n, fakeStep.gamma);
    const p = toPx(state.data[2 * n], state.data[2 * n + 1]);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3 + 0.6 * confidence;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Estimated ellipses (solid)
  for (let k = 0; k < state.K; k += 1) {
    const pts = ellipsePoints(state.means[k], state.covs[k], 2);
    ctx.strokeStyle = COLORS[k % COLORS.length];
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const p = toPx(pts[i], pts[i + 1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.closePath();
    ctx.stroke();
    // Mean point
    const mp = toPx(state.means[k][0], state.means[k][1]);
    ctx.fillStyle = COLORS[k % COLORS.length];
    ctx.beginPath();
    ctx.arc(mp.px, mp.py, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Log-likelihood trace
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(40, PROF_Y, W - 80, PROF_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(40, PROF_Y, W - 80, PROF_H);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('log-likelihood across EM iterations (monotone non-decreasing)', 44, PROF_Y - 4);

  if (state.logLikeHistory.length >= 2) {
    let lmin = Infinity, lmax = -Infinity;
    for (const l of state.logLikeHistory) { if (l < lmin) lmin = l; if (l > lmax) lmax = l; }
    if (lmax === lmin) lmax = lmin + 1;
    ctx.strokeStyle = '#f1d28a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < state.logLikeHistory.length; i += 1) {
      const x = 40 + (W - 80) * (i / Math.max(1, state.logLikeHistory.length - 1));
      const y = PROF_Y + PROF_H * (1 - (state.logLikeHistory[i] - lmin) / (lmax - lmin));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Markers
    ctx.fillStyle = '#f1d28a';
    for (let i = 0; i < state.logLikeHistory.length; i += 1) {
      const x = 40 + (W - 80) * (i / Math.max(1, state.logLikeHistory.length - 1));
      const y = PROF_Y + PROF_H * (1 - (state.logLikeHistory[i] - lmin) / (lmax - lmin));
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  }

  // Top-right readout
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'right';
  ctx.fillText(`iter ${state.iter}`, W - 12, 20);
  if (state.logLikeHistory.length > 0) {
    const last = state.logLikeHistory[state.logLikeHistory.length - 1];
    ctx.fillText(`log L = ${last.toFixed(2)}`, W - 12, 34);
  }
}

function applyControlsChanged() {
  state.K = parseInt(sliderK.value, 10);
  state.initSeed = parseInt(sliderSeed.value, 10);
  valueK.textContent = String(state.K);
  valueSeed.textContent = String(state.initSeed);
  initParams();
  drawAll();
}

sliderK.addEventListener('change', applyControlsChanged);
sliderSeed.addEventListener('change', applyControlsChanged);

btnStep.addEventListener('click', () => {
  step(); drawAll();
});
btnRun.addEventListener('click', () => {
  for (let i = 0; i < 20; i += 1) step();
  drawAll();
});
btnReset.addEventListener('click', () => {
  initParams(); drawAll();
});

function bootSync() {
  generateData();
  initParams();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const N_ITERS = [0, 2, 6, 14, 30];
    const target = N_ITERS[Math.min(N_ITERS.length - 1, Math.round(frac * (N_ITERS.length - 1)))];
    for (let i = 0; i < target; i += 1) step();
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
    return;
  }
  drawAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
