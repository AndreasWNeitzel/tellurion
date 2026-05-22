import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Joint Gaussian heatmap + marginals + analytic and numerical I(X; Y).

import { viridis } from '../../../shared/js/render/colormaps.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  sample2DGaussianPdf, marginalX, marginalY, miAnalytic, miNumeric,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const sliderRho   = document.getElementById('slider-rho');
const sliderSx    = document.getElementById('slider-sx');
const sliderSy    = document.getElementById('slider-sy');
const valueRho    = document.getElementById('value-rho');
const valueSx     = document.getElementById('value-sx');
const valueSy     = document.getElementById('value-sy');
const btnReset    = document.getElementById('btn-reset');
const btnZero     = document.getElementById('btn-zero');

const W = canvas.width, H = canvas.height;
const MARGIN = 12;
const TOP_MARG = 90;
const RIGHT_MARG = 130;
const HEAT_X = MARGIN + 80;
const HEAT_Y = TOP_MARG;
const HEAT_W = W - HEAT_X - RIGHT_MARG;
const HEAT_H = H - HEAT_Y - MARGIN;

const state = {
  rho: 0.6,
  sigmaX: 1.0,
  sigmaY: 1.0,
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const joint = sample2DGaussianPdf({ rho: state.rho, sigmaX: state.sigmaX, sigmaY: state.sigmaY, gridN: 96, span: 3.2 });
  const N = joint.N;
  const img = new ImageData(N, N);
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      const t = joint.pdf[j * N + i] / joint.zMax;
      const c = viridis(t);
      const idx = (j * N + i) * 4;
      img.data[idx + 0] = c.r;
      img.data[idx + 1] = c.g;
      img.data[idx + 2] = c.b;
      img.data[idx + 3] = 255;
    }
  }
  const off = new OffscreenCanvas(N, N);
  const offCtx = off.getContext('2d');
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, HEAT_X, HEAT_Y, HEAT_W, HEAT_H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 1;
  ctx.strokeRect(HEAT_X, HEAT_Y, HEAT_W, HEAT_H);

  const px = marginalX(joint);
  const py = marginalY(joint);
  let pxMax = 0; for (let i = 0; i < px.length; i += 1) if (px[i] > pxMax) pxMax = px[i];
  let pyMax = 0; for (let i = 0; i < py.length; i += 1) if (py[i] > pyMax) pyMax = py[i];

  ctx.strokeStyle = '#7fb1d8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < px.length; i += 1) {
    const x = HEAT_X + (HEAT_W * i) / (px.length - 1);
    const yy = HEAT_Y - 5 - (TOP_MARG - 20) * (px[i] / pxMax);
    if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let j = 0; j < py.length; j += 1) {
    const y = HEAT_Y + HEAT_H - (HEAT_H * j) / (py.length - 1);
    const xx = HEAT_X + HEAT_W + 5 + (RIGHT_MARG - 30) * (py[j] / pyMax);
    if (j === 0) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
  }
  ctx.stroke();

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('p(x)', HEAT_X, HEAT_Y - 60);
  ctx.fillText('p(y)', HEAT_X + HEAT_W + 8, HEAT_Y + HEAT_H);

  const analyticI = miAnalytic(state.rho);
  const numericI  = miNumeric(joint);

  const rows = [
    ['rho',     state.rho.toFixed(3)],
    ['sigma_x', state.sigmaX.toFixed(2)],
    ['sigma_y', state.sigmaY.toFixed(2)],
    ['I (analytic)', analyticI.toFixed(4) + ' nats'],
    ['I (numeric)',  numericI.toFixed(4) + ' nats'],
    ['delta I', (numericI - analyticI).toExponential(2)],
  ];
  let y = 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, MARGIN, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, MARGIN + 230, y);
    y += 14;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.50)';
  ctx.fillText('x', HEAT_X + HEAT_W / 2, H - 2);
  ctx.save();
  ctx.translate(HEAT_X - 14, HEAT_Y + HEAT_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('y', 0, 0);
  ctx.restore();
}

function applyControls() {
  state.rho    = parseFloat(sliderRho.value);
  state.sigmaX = parseFloat(sliderSx.value);
  state.sigmaY = parseFloat(sliderSy.value);
  valueRho.textContent = state.rho.toFixed(3);
  valueSx.textContent  = state.sigmaX.toFixed(2);
  valueSy.textContent  = state.sigmaY.toFixed(2);
  drawAll();
}

for (const el of [sliderRho, sliderSx, sliderSy]) {
  el.addEventListener('input', applyControls);
}

btnReset.addEventListener('click', () => {
  sliderRho.value = '0.6';
  sliderSx.value  = '1.0';
  sliderSy.value  = '1.0';
  applyControls();
});

btnZero.addEventListener('click', () => {
  sliderRho.value = '0.0';
  applyControls();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const rhos = [0.0, 0.3, 0.6, 0.85, 0.97];
    const idx = Math.min(rhos.length - 1, Math.max(0, Math.round(frac * (rhos.length - 1))));
    state.rho = rhos[idx];
    sliderRho.value = String(rhos[idx]);
    valueRho.textContent = state.rho.toFixed(3);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', {
            detail: { capture: CAPTURE_NAME, seed: SEED, rho: state.rho },
          }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED, rho: state.rho };
        });
      });
    }
  }
}

// Animation: cycle rho through [-0.95, +0.95] with a slow sinusoid so the
// page is alive on first load. User dragging the rho slider takes over.
let animTime = 0;
let userOverride = false;
let paused = false;
const btnPlayPause = document.getElementById('btn-playpause');
sliderRho.addEventListener('input', () => { userOverride = true; });
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.012;
    state.rho = 0.93 * Math.sin(animTime);
    sliderRho.value = state.rho.toFixed(3);
    valueRho.textContent = state.rho.toFixed(3);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const I_a = miAnalytic(state.rho);
  return {
    fields: [
      { key: 'correlation', label: 'correlation $\\rho$', value: state.rho.toFixed(3), format: 'float' },
      { key: 'sigma-x', label: 'std dev X ($\\sigma_x$)', value: state.sigmaX.toFixed(2), format: 'float' },
      { key: 'sigma-y', label: 'std dev Y ($\\sigma_y$)', value: state.sigmaY.toFixed(2), format: 'float' },
      { key: 'mutual-info', label: 'mutual info I(X;Y) (nats)', value: I_a.toFixed(3), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const I_a = miAnalytic(state.rho);
  inv.push({
    key: 'mutual-info-nonneg',
    label: 'I(X;Y) >= 0 (nonnegative)',
    value: I_a.toExponential(2),
    status: I_a >= -1e-10 ? 'pass' : 'drift'
  });
  if (Math.abs(state.rho) < 1e-10) {
    inv.push({
      key: 'independence-check',
      label: 'I(X;Y) = 0 when $\\rho = 0$',
      value: I_a.toExponential(2),
      status: I_a < 1e-10 ? 'pass' : 'drift'
    });
  }
  const joint = sample2DGaussianPdf({ rho: state.rho, sigmaX: state.sigmaX, sigmaY: state.sigmaY, gridN: 96, span: 3.2 });
  const I_n = miNumeric(joint);
  const rel = Math.abs(I_n - I_a) / (Math.max(Math.abs(I_a), 1e-10));
  inv.push({
    key: 'numeric-analytic-match',
    label: 'numeric vs analytic within 1%',
    value: rel.toExponential(2),
    status: rel < 0.01 ? 'pass' : 'pending'
  });
  return inv;
};
