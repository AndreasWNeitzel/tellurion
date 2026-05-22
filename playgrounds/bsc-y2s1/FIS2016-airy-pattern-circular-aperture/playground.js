import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Airy diffraction pattern: 2D intensity heatmap + 1D radial profile.

import { viridis } from '../../../shared/js/render/colormaps.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  airy2DFieldWithStrehl,
  airy1DProfileWithStrehl,
  AIRY_FIRST_ZERO,
  J1_ZEROS,
  airyIntensity,
  rayleighResolution,
  strehRatio,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderLambda = document.getElementById('slider-lambda');
const sliderD      = document.getElementById('slider-d');
const sliderSigma  = document.getElementById('slider-sigma');
const sliderGamma  = document.getElementById('slider-gamma');
const valueLambda  = document.getElementById('value-lambda');
const valueD       = document.getElementById('value-d');
const valueSigma   = document.getElementById('value-sigma');
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

const state = {
  lambda: 550e-9,
  D: 1e-3,
  sigmaWaves: 0,
  gamma: 0.30,
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const N = 256;
  // Fixed angular viewing window (radians). The dimensionless argument
  // x = (pi D / lambda) sin(theta) at the window edge therefore scales
  // with D / lambda, so changing the wavelength or aperture visibly
  // rescales the rings: more, tighter rings for large D / short lambda;
  // fewer, wider rings for small D / long lambda. (Without this the
  // pattern was universal in x and the lambda and D sliders did nothing
  // to the image.) THETA_WINDOW chosen so the default 550 nm, 1 mm view
  // reproduces the previous x in [-16, 16] extent.
  const THETA_WINDOW = 2.80e-3;
  const xMax = (Math.PI * state.D / state.lambda) * THETA_WINDOW;
  const thetaWinAS = THETA_WINDOW * 206265;
  const field = airy2DFieldWithStrehl({ N, xMax, sigmaWaves: state.sigmaWaves });
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

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(`theta in [-${thetaWinAS.toFixed(0)}, +${thetaWinAS.toFixed(0)}] arcsec; ring size = 1.22 lambda / D`,
    HEAT_X + HEAT_W / 2, HEAT_Y + HEAT_H + 18);

  // 1D radial profile, plotted with first 5 Bessel zeros marked.
  const N1 = 600;
  const { xs, Is } = airy1DProfileWithStrehl({ N: N1, xMax, sigmaWaves: state.sigmaWaves });
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
    if (z > xMax) break;
    const px = PROF_X + (PROF_W) * (z / xMax);
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
    const px = PROF_X + PROF_W * (x / xMax);
    const py = PROF_Y + PROF_H * (1 - Is[i]);
    if (x === xs.find(v => v >= 0)) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Axes labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('I / I_0 vs theta', PROF_X, PROF_Y - 8);
  ctx.fillText('0', PROF_X + 2, PROF_Y + PROF_H + 14);
  ctx.textAlign = 'right';
  ctx.fillText(thetaWinAS.toFixed(0) + ' arcsec', PROF_X + PROF_W - 2, PROF_Y + PROF_H + 14);
  // First-null angular size: fixed in normalised x (3.83) but its
  // physical angle theta_1 = 1.22 lambda / D moves with the sliders, so
  // the profile reflects the lambda and D dependence directly.
  const x1 = 3.8317;
  const nullPx = PROF_X + PROF_W * (x1 / xMax);
  const theta1as = rayleighResolution({ lambda: state.lambda, D: state.D }) * 206265;
  ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.textAlign = 'left';
  ctx.fillText(`1st null: theta_1 = ${theta1as.toFixed(1)} arcsec`, nullPx + 4, PROF_Y + PROF_H - 10);

  // Top-right readout
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const theta1 = rayleighResolution({ lambda: state.lambda, D: state.D });
  const strehl = strehRatio({ sigmaWaves: state.sigmaWaves });
  const rows = [
    ['lambda', (state.lambda * 1e9).toFixed(0) + ' nm'],
    ['D', (state.D * 1e3).toFixed(1) + ' mm'],
    ['sigma_RMS', state.sigmaWaves.toFixed(3) + ' waves'],
    ['theta_1', (theta1 * 206265).toFixed(2) + ' arcsec'],
    ['Strehl', (strehl * 100).toFixed(1) + ' %'],
    ['gamma', state.gamma.toFixed(2)],
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

sliderLambda.addEventListener('input', () => {
  state.lambda = parseFloat(sliderLambda.value) * 1e-9;
  valueLambda.textContent = parseFloat(sliderLambda.value).toFixed(0);
  drawAll();
});
sliderD.addEventListener('input', () => {
  state.D = parseFloat(sliderD.value) * 1e-3;
  valueD.textContent = parseFloat(sliderD.value).toFixed(1);
  drawAll();
});
sliderSigma.addEventListener('input', () => {
  state.sigmaWaves = parseFloat(sliderSigma.value);
  valueSigma.textContent = parseFloat(sliderSigma.value).toFixed(3);
  drawAll();
});
sliderGamma.addEventListener('input', () => {
  state.gamma = parseFloat(sliderGamma.value);
  valueGamma.textContent = state.gamma.toFixed(2);
  drawAll();
});
btnNarrow.addEventListener('click', () => {
  state.lambda = 450e-9;
  state.D = 0.5e-3;
  sliderLambda.value = '450';
  sliderD.value = '0.5';
  valueLambda.textContent = '450';
  valueD.textContent = '0.5';
  drawAll();
});
btnWide.addEventListener('click', () => {
  state.lambda = 700e-9;
  state.D = 2e-3;
  sliderLambda.value = '700';
  sliderD.value = '2.0';
  valueLambda.textContent = '700';
  valueD.textContent = '2.0';
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const lambdas = [400e-9, 500e-9, 600e-9, 700e-9, 800e-9];
    state.lambda = lambdas[Math.min(lambdas.length - 1, Math.round(frac * (lambdas.length - 1)))];
    sliderLambda.value = String(state.lambda * 1e9);
    valueLambda.textContent = (state.lambda * 1e9).toFixed(0);
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

// Animation: cycle wavelength slowly to show how pattern changes with color.
let paused = false;
let userOverride = false;
const userInputs = [sliderLambda, sliderD, sliderSigma, sliderGamma];
for (const input of userInputs) {
  input.addEventListener('input', () => { userOverride = true; });
}
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
// No lambda auto-cycle: it overwrote the wavelength slider until the
// user happened to touch a control (so the slider read as doing
// nothing) and its sinusoid was a large per-frame noise source. The PSF
// is now purely slider-driven; every handler already calls drawAll().
function tick() { requestAnimationFrame(tick); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const theta1 = rayleighResolution({ lambda: state.lambda, D: state.D });
  return {
    fields: [
      { key: 'wavelength', label: 'wavelength $\\lambda$ (nm)', value: state.lambda * 1e9, format: 'float' },
      { key: 'aperture', label: 'aperture $D$ (m)', value: state.D, format: 'float' },
      { key: 'rayleigh-angle', label: 'Rayleigh angle $\\theta_1$ (arcsec)', value: theta1 * 206265, format: 'float' },
      { key: 'strehl', label: 'Strehl ratio', value: strehRatio({ sigmaWaves: state.sigmaWaves }), format: 'percent' },
    ],
  };
};
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    const theta1 = rayleighResolution({ lambda: state.lambda, D: state.D });
    const strehl = strehRatio({ sigmaWaves: state.sigmaWaves });
    const theta1as = theta1 * 206265;
    return [
      {
        key: 'theta1-positive',
        label: 'Rayleigh limit $\\theta_1 > 0$',
        value: theta1.toExponential(2),
        status: theta1 > 0 ? 'pass' : 'drift',
      },
      {
        key: 'strehl-valid',
        label: 'Strehl ratio in [0, 1]',
        value: (strehl * 100).toFixed(1) + '%',
        status: strehl >= 0 && strehl <= 1 ? 'pass' : 'drift',
      },
    ];
  };
}
