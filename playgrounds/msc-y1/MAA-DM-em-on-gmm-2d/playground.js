import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// EM on a 2D Gaussian mixture. Synthetic data from a 3-cluster ground
// truth; user runs EM, watches ellipses converge.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { sampleGMM, initEM, emStep, ellipsePoints } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

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
// The GMM lives on a square data range [-5,5]^2, so the scene must be a
// square with isotropic scaling or the cluster covariances render
// distorted (the old 820x460 region stretched x by 1.78x). The square
// scatter is the hero; the log-likelihood trace is a shorter strip below.
const SC = { side: Math.min(W - 96, 716) };
SC.x0 = (W - SC.side) / 2;
SC.y0 = 18;
const PROF_X = SC.x0, PROF_W = SC.side;
const PROF_Y = SC.y0 + SC.side + 30;
const PROF_H = H - PROF_Y - 16;

const N_POINTS = 600;
const VIEW = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
const COLORS = ['#69a8d6', '#d68a69', '#7ec27e', '#d6c869', '#b07cd1'];

// Ground-truth mixtures to fit (synthetic; a labelled teaching demo). Covariances
// are [xx, xy, xy, yy]. The dataset selector switches between them.
const DATASETS = {
  three:     { K: 3, means: [[-2.5, -1.2], [2.0, 1.5], [-0.5, 2.7]], covs: [[0.45, 0.20, 0.20, 0.30], [0.70, -0.30, -0.30, 0.55], [0.30, 0.05, 0.05, 0.40]], weights: [0.35, 0.35, 0.30] },
  separated: { K: 3, means: [[-3, -2.2], [3, 2], [0.2, 3]], covs: [[0.4, 0, 0, 0.4], [0.4, 0, 0, 0.4], [0.4, 0, 0, 0.4]], weights: [0.34, 0.33, 0.33] },
  overlap:   { K: 2, means: [[-0.9, 0], [0.9, 0]], covs: [[1.1, 0.2, 0.2, 1.1], [1.1, -0.2, -0.2, 1.1]], weights: [0.5, 0.5] },
  elongated: { K: 3, means: [[-2, -1], [2, 1], [0, 2.6]], covs: [[1.7, 1.25, 1.25, 1.05], [1.5, -1.05, -1.05, 0.95], [0.3, 0, 0, 1.9]], weights: [0.34, 0.33, 0.33] },
  unequal:   { K: 3, means: [[-2.6, -1.6], [2.1, 1.6], [0, 3]], covs: [[0.5, 0, 0, 0.5], [0.6, 0, 0, 0.6], [0.28, 0, 0, 0.28]], weights: [0.6, 0.3, 0.1] },
  four:      { K: 4, means: [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]], covs: [[0.45, 0, 0, 0.45], [0.45, 0, 0, 0.45], [0.45, 0, 0, 0.45], [0.45, 0, 0, 0.45]], weights: [0.25, 0.25, 0.25, 0.25] },
};
let truth = DATASETS.three;

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
    px: SC.x0 + SC.side * (x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin),
    py: SC.y0 + SC.side * (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)),
  };
}

function generateData() {
  const { data, labels } = sampleGMM({
    N: N_POINTS, K: truth.K, means: truth.means, covs: truth.covs, weights: truth.weights,
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

  // Square scatter panel: frame, grid, and a clip so 2-sigma ellipses
  // never spill past the border.
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(SC.x0, SC.y0, SC.side, SC.side);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(SC.x0 + 0.5, SC.y0 + 0.5, SC.side - 1, SC.side - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let xv = -4; xv <= 4; xv += 2) {
    const p = toPx(xv, 0);
    ctx.beginPath(); ctx.moveTo(p.px, SC.y0); ctx.lineTo(p.px, SC.y0 + SC.side); ctx.stroke();
  }
  for (let yv = -4; yv <= 4; yv += 2) {
    const p = toPx(0, yv);
    ctx.beginPath(); ctx.moveTo(SC.x0, p.py); ctx.lineTo(SC.x0 + SC.side, p.py); ctx.stroke();
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(SC.x0, SC.y0, SC.side, SC.side); ctx.clip();

  // True ellipses (faint, dashed)
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.0;
  for (let k = 0; k < truth.means.length; k += 1) {
    const pts = ellipsePoints(truth.means[k], truth.covs[k], 2);
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

  ctx.restore();   // end scatter clip

  // Log-likelihood trace (supporting strip): framed, with axis ticks.
  const plX0 = PROF_X + 52, plX1 = PROF_X + PROF_W - 12;
  const plY0 = PROF_Y + 18, plY1 = PROF_Y + PROF_H - 22;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PROF_X, PROF_Y, PROF_W, PROF_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PROF_X + 0.5, PROF_Y + 0.5, PROF_W - 1, PROF_H - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('log-likelihood across EM iterations (monotone non-decreasing)', PROF_X + 4, PROF_Y - 4);

  if (state.logLikeHistory.length >= 2) {
    let lmin = Infinity, lmax = -Infinity;
    for (const l of state.logLikeHistory) { if (l < lmin) lmin = l; if (l > lmax) lmax = l; }
    if (lmax === lmin) lmax = lmin + 1;
    const nIt = state.logLikeHistory.length;
    const PX = (i) => plX0 + (plX1 - plX0) * (i / Math.max(1, nIt - 1));
    const PY = (l) => plY1 - (plY1 - plY0) * (l - lmin) / (lmax - lmin);
    // y ticks (log L) and x ticks (iteration)
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(200,210,230,0.6)';
    for (const f of [0, 0.5, 1]) {
      const lv = lmin + f * (lmax - lmin), yy = PY(lv);
      ctx.beginPath(); ctx.moveTo(plX0, yy); ctx.lineTo(plX1, yy); ctx.stroke();
      ctx.fillText(lv.toFixed(0), PROF_X + 6, yy + 4);
    }
    const xticks = Math.min(nIt - 1, 8);
    for (let t = 0; t <= xticks; t += 1) {
      const i = Math.round((nIt - 1) * t / xticks);
      ctx.fillText(String(i), PX(i) - 4, plY1 + 14);
    }
    // The panel title already names both axes (log L vs EM iteration), so
    // the numeric ticks stand alone without redundant axis labels.
    // curve
    ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < nIt; i += 1) { const x = PX(i), y = PY(state.logLikeHistory[i]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = '#f1d28a';
    for (let i = 0; i < nIt; i += 1) { ctx.beginPath(); ctx.arc(PX(i), PY(state.logLikeHistory[i]), 2.4, 0, 2 * Math.PI); ctx.fill(); }
  }

  // Top-right readout
  ctx.font = fontString(canvas, 'caption', 'mono');
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

const selData = document.getElementById('select-data');
if (selData) selData.addEventListener('change', () => {
  truth = DATASETS[selData.value] || DATASETS.three;
  state.K = truth.K;
  sliderK.value = String(truth.K); valueK.textContent = String(truth.K);
  generateData(); initParams(); drawAll();
});

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

// Auto-run mode: when enabled, run one EM step per frame; users can pause.
let autoRun = !(DETERMINISTIC || prefersReducedMotion());
let autoFrame = 0;
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.textContent = autoRun ? 'Pause auto-run' : 'Auto-run';
  btnPlayPause.addEventListener('click', () => {
    autoRun = !autoRun;
    btnPlayPause.textContent = autoRun ? 'Pause auto-run' : 'Auto-run';
  });
}
function autoTick() {
  if (autoRun && !CAPTURE_NAME) {
    autoFrame += 1;
    if (autoFrame % 6 === 0) {
      if (state.iter > 35) initParams();          // converged: restart the EM demo so it loops
      else step();
      drawAll();
    }
  }
  requestAnimationFrame(autoTick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(autoTick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(autoTick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const ll = state.logLikeHistory.length > 0 ? state.logLikeHistory[state.logLikeHistory.length - 1] : 0;
  return {
    fields: [
      { key: 'iteration', label: 'EM iteration', value: state.iter, format: 'float' },
      { key: 'cluster-count', label: 'Clusters K', value: state.K, format: 'float' },
      { key: 'log-likelihood', label: 'Log-likelihood', value: ll, format: 'float' },
      { key: 'data-size', label: 'Data points N', value: N_POINTS, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const ll = state.logLikeHistory.length > 0 ? state.logLikeHistory[state.logLikeHistory.length - 1] : 0;
  const llFinite = Number.isFinite(ll);
  const llMonotone = state.logLikeHistory.length < 2 || state.logLikeHistory[state.logLikeHistory.length - 1] >= state.logLikeHistory[state.logLikeHistory.length - 2] - 1e-6;
  return [
    {
      key: 'likelihood-finite',
      label: 'Log-likelihood is finite',
      value: llFinite ? 'pass' : 'fail',
      status: llFinite ? 'pass' : 'drift'
    },
    {
      key: 'likelihood-monotone',
      label: 'EM log-likelihood non-decreasing',
      value: llMonotone ? 'pass' : 'drift',
      status: llMonotone ? 'pass' : 'drift'
    }
  ];
};
