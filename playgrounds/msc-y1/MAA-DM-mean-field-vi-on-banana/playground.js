// playground.js
// Mean-field VI on the Rosenbrock banana. Shows the converged ellipse
// failing to follow the curvature.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createVI, viStep, sampleQ, logPGrid, logBanana } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderLR     = document.getElementById('slider-lr');
const sliderK      = document.getElementById('slider-K');
const sliderSpeed  = document.getElementById('slider-speed');
const valueLR      = document.getElementById('value-lr');
const valueK       = document.getElementById('value-K');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnStep      = document.getElementById('btn-step');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PLOT_H = H - 130;
const LOSS_H = 100;

const state = {
  theta: null,
  iter: 0,
  lossHistory: [],
  lr: 0.005,
  K: 32,
  speed: 5,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function rebuild() {
  state.theta = createVI({ muX: 0, logSX: 0, muY: 0, logSY: 0 });
  state.iter = 0;
  state.lossHistory = [];
}

function stepOnce() {
  const elbo = viStep(state.theta, state.lr, state.K, SEED + state.iter);
  state.iter += 1;
  state.lossHistory.push(elbo);
  if (state.lossHistory.length > 600) state.lossHistory.shift();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PLOT_X = 30, PLOT_W = W - 60;
  const PLOT_Y = 20;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PLOT_X, PLOT_Y, PLOT_W, PLOT_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PLOT_X + 0.5, PLOT_Y + 0.5, PLOT_W - 1, PLOT_H - 1);

  const X_MIN = -2.5, X_MAX = 2.5;
  const Y_MIN = -1.0, Y_MAX = 4.0;
  function toPx(x, y) {
    return {
      px: PLOT_X + PLOT_W * (x - X_MIN) / (X_MAX - X_MIN),
      py: PLOT_Y + PLOT_H * (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)),
    };
  }

  // Banana contours: sample log p on grid, draw isolines at fixed values.
  const Nx = 80, Ny = 80;
  const xs = new Float64Array(Nx), ys = new Float64Array(Ny);
  for (let i = 0; i < Nx; i += 1) xs[i] = X_MIN + (X_MAX - X_MIN) * i / (Nx - 1);
  for (let j = 0; j < Ny; j += 1) ys[j] = Y_MIN + (Y_MAX - Y_MIN) * j / (Ny - 1);
  // Use the log-p value directly; draw "level set" by coloring cells where log p >= level.
  ctx.fillStyle = 'rgba(110, 165, 215, 0.10)';
  for (const level of [-5, -3, -1, -0.3]) {
    ctx.beginPath();
    for (let j = 0; j < Ny - 1; j += 1) {
      for (let i = 0; i < Nx - 1; i += 1) {
        if (logBanana(xs[i], ys[j]) >= level) {
          const p = toPx(xs[i], ys[j]);
          ctx.rect(p.px, p.py, PLOT_W / (Nx - 1) + 1, PLOT_H / (Ny - 1) + 1);
        }
      }
    }
    ctx.fill();
  }

  // Variational ellipse (2-sigma)
  const sX = Math.exp(state.theta.logSX), sY = Math.exp(state.theta.logSY);
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 64; i += 1) {
    const t = 2 * Math.PI * i / 64;
    const x = state.theta.muX + 2 * sX * Math.cos(t);
    const y = state.theta.muY + 2 * sY * Math.sin(t);
    const p = toPx(x, y);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.closePath();
  ctx.stroke();
  // mean
  const cm = toPx(state.theta.muX, state.theta.muY);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(cm.px, cm.py, 4, 0, 2 * Math.PI);
  ctx.fill();

  // ELBO trace
  const LOSS_Y = PLOT_Y + PLOT_H + 12;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PLOT_X, LOSS_Y, PLOT_W, LOSS_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PLOT_X + 0.5, LOSS_Y + 0.5, PLOT_W - 1, LOSS_H - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ELBO over iterations (monotone non-decreasing in expectation)', PLOT_X + 8, LOSS_Y + 12);
  if (state.lossHistory.length >= 2) {
    let lMin = Infinity, lMax = -Infinity;
    for (const l of state.lossHistory) { if (l < lMin) lMin = l; if (l > lMax) lMax = l; }
    if (lMax === lMin) lMax = lMin + 1;
    ctx.strokeStyle = '#f1d28a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < state.lossHistory.length; i += 1) {
      const x = PLOT_X + (PLOT_W - 4) * (i / Math.max(1, state.lossHistory.length - 1));
      const y = LOSS_Y + LOSS_H - 4 - (LOSS_H - 24) * (state.lossHistory[i] - lMin) / (lMax - lMin);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Readout
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'right';
  const last = state.lossHistory[state.lossHistory.length - 1];
  ctx.fillText(`iter ${state.iter}  ELBO ${last !== undefined ? last.toFixed(3) : '-'}  mu=(${state.theta.muX.toFixed(2)}, ${state.theta.muY.toFixed(2)})  sigma=(${sX.toFixed(2)}, ${sY.toFixed(2)})`,
    W - 36, LOSS_Y + 12);
}

sliderLR.addEventListener('input', () => { state.lr = parseFloat(sliderLR.value); valueLR.textContent = state.lr.toFixed(3); });
sliderK.addEventListener('input', () => { state.K = parseInt(sliderK.value, 10); valueK.textContent = String(state.K); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnStep.addEventListener('click', () => { stepOnce(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 600);
    for (let i = 0; i < target; i += 1) stepOnce();
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

function tick() {
  if (state.playing) {
    for (let s = 0; s < state.speed; s += 1) stepOnce();
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
