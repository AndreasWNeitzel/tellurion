// playground.js
// Airy diffraction pattern: 2D intensity heatmap + 1D radial profile.

import { viridis } from '../../../shared/js/render/colormaps.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { airy2DField, airy1DProfile, AIRY_FIRST_ZERO, J1_ZEROS, airyIntensity } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderXmax   = document.getElementById('slider-xmax');
const sliderGamma  = document.getElementById('slider-gamma');
const valueXmax    = document.getElementById('value-xmax');
const valueGamma   = document.getElementById('value-gamma');
const btnNarrow    = document.getElementById('btn-narrow');
const btnWide      = document.getElementById('btn-wide');

const W = canvas.width, H = canvas.height;
const HEAT_W = 480;
const HEAT_X = 20, HEAT_Y = 30;
const HEAT_H = H - HEAT_Y - 30;
const PROF_X = HEAT_X + HEAT_W + 30;
const PROF_W = W - PROF_X - 20;
const PROF_Y = HEAT_Y;
const PROF_H = HEAT_H;

const state = { xMax: 14, gamma: 0.30 };

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const N = 256;
  const field = airy2DField({ N, xMax: state.xMax });
  const img = new ImageData(N, N);
  for (let i = 0; i < field.length; i += 1) {
    const t = Math.pow(Math.max(0, Math.min(1, field[i])), state.gamma);
    const c = viridis(t);
    img.data[i * 4] = c.r;
    img.data[i * 4 + 1] = c.g;
    img.data[i * 4 + 2] = c.b;
    img.data[i * 4 + 3] = 255;
  }
  const off = new OffscreenCanvas(N, N);
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, HEAT_X, HEAT_Y, HEAT_W, HEAT_H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(HEAT_X, HEAT_Y, HEAT_W, HEAT_H);

  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(`x = (2 pi a / lambda) sin theta, in [-${state.xMax.toFixed(1)}, +${state.xMax.toFixed(1)}]`,
    HEAT_X + HEAT_W / 2, HEAT_Y + HEAT_H + 18);

  // 1D radial profile, plotted with first 5 Bessel zeros marked.
  const N1 = 600;
  const { xs, Is } = airy1DProfile({ N: N1, xMax: state.xMax });
  // background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i += 1) {
    const xx = PROF_X + (PROF_W) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(xx, PROF_Y); ctx.lineTo(xx, PROF_Y + PROF_H);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const yy = PROF_Y + (PROF_H) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(PROF_X, yy); ctx.lineTo(PROF_X + PROF_W, yy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.strokeRect(PROF_X, PROF_Y, PROF_W, PROF_H);

  // Mark Bessel zeros as vertical lines.
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.fillStyle = 'rgba(255, 80, 80, 0.85)';
  ctx.textAlign = 'left';
  for (const z of J1_ZEROS) {
    if (z > state.xMax) break;
    const px = PROF_X + (PROF_W) * (z / state.xMax);
    ctx.beginPath();
    ctx.moveTo(px, PROF_Y); ctx.lineTo(px, PROF_Y + PROF_H);
    ctx.stroke();
    ctx.fillText('z=' + z.toFixed(2), px + 2, PROF_Y + 12);
  }

  // Profile curve I(x) on linear scale [0, 1].
  ctx.strokeStyle = '#7fb1d8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < N1; i += 1) {
    // Use only x >= 0 here (radial profile); xs covers [-xMax, +xMax]
    const x = xs[i];
    if (x < 0) continue;
    const px = PROF_X + PROF_W * (x / state.xMax);
    const py = PROF_Y + PROF_H * (1 - Is[i]);
    if (x === xs.find(v => v >= 0)) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Axes labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('I(x) / I_0 vs x', PROF_X, PROF_Y - 8);
  ctx.fillText('x = 0', PROF_X + 2, PROF_Y + PROF_H + 14);
  ctx.textAlign = 'right';
  ctx.fillText('x = ' + state.xMax.toFixed(1), PROF_X + PROF_W - 2, PROF_Y + PROF_H + 14);

  // Top-right readout
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['x_max', state.xMax.toFixed(2)],
    ['gamma', state.gamma.toFixed(2)],
    ['1st zero', AIRY_FIRST_ZERO.toFixed(4)],
    ['I(0)',  airyIntensity(1e-8).toFixed(4)],
  ];
  let y = 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, PROF_X, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, PROF_X + PROF_W, y);
    y += 14;
  }
}

sliderXmax.addEventListener('input', () => {
  state.xMax = parseFloat(sliderXmax.value);
  valueXmax.textContent = state.xMax.toFixed(1);
  drawAll();
});
sliderGamma.addEventListener('input', () => {
  state.gamma = parseFloat(sliderGamma.value);
  valueGamma.textContent = state.gamma.toFixed(2);
  drawAll();
});
btnNarrow.addEventListener('click', () => {
  state.xMax = 5.0;
  sliderXmax.value = '5.0';
  valueXmax.textContent = '5.0';
  drawAll();
});
btnWide.addEventListener('click', () => {
  state.xMax = 20.0;
  sliderXmax.value = '20.0';
  valueXmax.textContent = '20.0';
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const xMaxs = [4, 8, 14, 20, 22];
    state.xMax = xMaxs[Math.min(xMaxs.length - 1, Math.round(frac * (xMaxs.length - 1)))];
    sliderXmax.value = String(state.xMax);
    valueXmax.textContent = state.xMax.toFixed(1);
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

// Animation: cycle x_max slowly so the user sees the pattern zoom in and out.
let animTime = 0;
let paused = false;
let userOverride = false;
sliderXmax.addEventListener('input', () => { userOverride = true; });
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.008;
    state.xMax = 14 + 9 * Math.sin(animTime);
    sliderXmax.value = state.xMax.toFixed(1);
    valueXmax.textContent = state.xMax.toFixed(1);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
