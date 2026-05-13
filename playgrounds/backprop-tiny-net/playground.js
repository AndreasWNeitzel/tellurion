// playground.js
// 2D classification with a tanh MLP, decision surface + loss trace.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { createNet, forward, trainStep, DATASETS } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selDataset   = document.getElementById('select-dataset');
const sliderH      = document.getElementById('slider-h');
const sliderLR     = document.getElementById('slider-lr');
const sliderSpeed  = document.getElementById('slider-speed');
const valueH       = document.getElementById('value-h');
const valueLR      = document.getElementById('value-lr');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnStep      = document.getElementById('btn-step');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PANEL_H = H - 130;
const LOSS_H = 100;

const state = {
  dataset: 'moons',
  hidden: 8,
  lr: 0.5,
  speed: 4,
  net: null,
  data: null,
  iter: 0,
  lossHistory: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function rebuild() {
  state.net = createNet({ hidden: state.hidden, seed: SEED });
  state.data = DATASETS[state.dataset]({ N: 200, seed: 1 });
  state.iter = 0;
  state.lossHistory = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Decision surface as heatmap
  const PLOT_W = W - 60, PLOT_X = 30, PLOT_Y = 20;
  const GRID = 60;
  // Find data range
  let xmin = -2, xmax = 2, ymin = -2, ymax = 2;
  if (state.dataset === 'spiral') { xmin = -2.5; xmax = 2.5; ymin = -2.5; ymax = 2.5; }
  const img = new ImageData(GRID, GRID);
  for (let j = 0; j < GRID; j += 1) {
    const yc = ymax - (ymax - ymin) * (j / (GRID - 1));
    for (let i = 0; i < GRID; i += 1) {
      const xc = xmin + (xmax - xmin) * (i / (GRID - 1));
      const { p } = forward(state.net, [xc, yc]);
      const idx = (j * GRID + i) * 4;
      // Diverging color blue (class 0) to red (class 1), with mid grey.
      const r = Math.round(64 + (192 * p));
      const b = Math.round(64 + (192 * (1 - p)));
      img.data[idx]     = r;
      img.data[idx + 1] = 70;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  const off = new OffscreenCanvas(GRID, GRID);
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, PLOT_X, PLOT_Y, PLOT_W, PANEL_H);

  // Points
  for (let n = 0; n < state.data.X.length; n += 1) {
    const x = state.data.X[n], yL = state.data.y[n];
    const px = PLOT_X + PLOT_W * (x[0] - xmin) / (xmax - xmin);
    const py = PLOT_Y + PANEL_H * (1 - (x[1] - ymin) / (ymax - ymin));
    ctx.fillStyle = yL === 0 ? '#88c8ff' : '#ff8888';
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.strokeRect(PLOT_X + 0.5, PLOT_Y + 0.5, PLOT_W - 1, PANEL_H - 1);

  // Loss trace
  const LOSS_Y = PLOT_Y + PANEL_H + 10;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PLOT_X, LOSS_Y, PLOT_W, LOSS_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PLOT_X + 0.5, LOSS_Y + 0.5, PLOT_W - 1, LOSS_H - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('training loss (BCE) vs iterations', PLOT_X + 8, LOSS_Y + 12);

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
  const lastLoss = state.lossHistory[state.lossHistory.length - 1];
  ctx.fillText(`iter ${state.iter}  loss ${lastLoss !== undefined ? lastLoss.toFixed(4) : '-'}`, W - 36, LOSS_Y + 12);
}

function trainOnce() {
  const L = trainStep(state.net, state.data.X, state.data.y, state.lr);
  state.iter += 1;
  state.lossHistory.push(L);
}

selDataset.addEventListener('change', () => { state.dataset = selDataset.value; rebuild(); drawAll(); });
sliderH.addEventListener('change', () => { state.hidden = parseInt(sliderH.value, 10); valueH.textContent = String(state.hidden); rebuild(); drawAll(); });
sliderH.addEventListener('input', () => { valueH.textContent = sliderH.value; });
sliderLR.addEventListener('input', () => { state.lr = parseFloat(sliderLR.value); valueLR.textContent = state.lr.toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnStep.addEventListener('click', () => { trainOnce(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const N_ITERS = [0, 30, 100, 300, 800];
    const target = N_ITERS[Math.min(N_ITERS.length - 1, Math.round(frac * (N_ITERS.length - 1)))];
    for (let i = 0; i < target; i += 1) trainOnce();
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
    for (let s = 0; s < state.speed; s += 1) trainOnce();
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
