// playground.js
// Max-entropy zoo. Choose a constraint family, set its parameters,
// see the pdf and its entropy.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { pdf, analyticEntropy, numericEntropy, gridX, chooseSupport, CONSTRAINTS } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selFamily    = document.getElementById('select-family');
const sliderMu     = document.getElementById('slider-mu');
const sliderScale  = document.getElementById('slider-scale');
const sliderSupp   = document.getElementById('slider-supp');
const valueMu      = document.getElementById('value-mu');
const valueScale   = document.getElementById('value-scale');
const valueSupp    = document.getElementById('value-supp');
const rowMu        = document.getElementById('row-mu');
const rowSigma     = document.getElementById('row-sigma');
const rowSupport   = document.getElementById('row-support');

const W = canvas.width, H = canvas.height;

const state = {
  family: 'gaussian',
  mu: 0,
  scale: 1.0,
  supp: 2.0,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function paramsFor() {
  switch (state.family) {
    case 'gaussian':    return { mu: state.mu, sigma: state.scale };
    case 'uniform':     return { a: -state.supp, b: state.supp };
    case 'exponential': return { mean: state.scale };
    case 'laplace':     return { mu: state.mu, b: state.scale };
    default: throw new Error();
  }
}

function showRows() {
  rowMu.style.display      = (state.family === 'gaussian' || state.family === 'laplace') ? '' : 'none';
  rowSigma.style.display   = (state.family !== 'uniform') ? '' : 'none';
  rowSupport.style.display = (state.family === 'uniform') ? '' : 'none';
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const X0 = 60, X1 = W - 60;
  const Y0 = 40, Y1 = H - 80;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);

  const xs = gridX(state.family);
  const params = paramsFor();
  const p = pdf(state.family, params, xs);
  const { xmin, xmax } = chooseSupport(state.family);

  let yMax = 0;
  for (let i = 0; i < p.length; i += 1) if (p[i] > yMax) yMax = p[i];
  yMax *= 1.10;
  if (yMax <= 0) yMax = 1;

  function toPx(x, y) {
    return {
      px: X0 + (X1 - X0) * (x - xmin) / (xmax - xmin),
      py: Y1 - (Y1 - Y0) * (y / yMax),
    };
  }

  // axis x = 0
  if (xmin <= 0 && xmax >= 0) {
    const z = toPx(0, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath();
    ctx.moveTo(z.px, Y0); ctx.lineTo(z.px, Y1);
    ctx.stroke();
  }

  // Filled pdf
  ctx.fillStyle = 'rgba(110, 165, 215, 0.30)';
  ctx.beginPath();
  const f0 = toPx(xs[0], 0);
  ctx.moveTo(f0.px, f0.py);
  for (let i = 0; i < xs.length; i += 1) {
    const pp = toPx(xs[i], p[i]);
    ctx.lineTo(pp.px, pp.py);
  }
  const fEnd = toPx(xs[xs.length - 1], 0);
  ctx.lineTo(fEnd.px, fEnd.py);
  ctx.closePath();
  ctx.fill();
  // outline
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < xs.length; i += 1) {
    const pp = toPx(xs[i], p[i]);
    if (i === 0) ctx.moveTo(pp.px, pp.py); else ctx.lineTo(pp.px, pp.py);
  }
  ctx.stroke();

  // Tick labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  const nTicks = 5;
  for (let i = 0; i <= nTicks; i += 1) {
    const x = xmin + (xmax - xmin) * (i / nTicks);
    const t = toPx(x, 0);
    ctx.fillText(x.toFixed(1), t.px, Y1 + 14);
  }

  // Title and readouts
  ctx.font = '13px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const titleMap = { gaussian: 'Gaussian (R, mean, variance)', uniform: 'Uniform ([a, b], no moment constraint)', exponential: 'Exponential ([0, infty), mean fixed)', laplace: 'Laplace (R, mean and E|X - mu| fixed)' };
  ctx.fillText(titleMap[state.family], X0, Y0 - 14);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(CONSTRAINTS[state.family], X0, Y1 + 40);

  const hAnalytic = analyticEntropy(state.family, params);
  const hNumeric  = numericEntropy(p, xs);
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.textAlign = 'right';
  ctx.fillText(`h (analytic) = ${hAnalytic.toFixed(4)} nats`, X1, Y0 - 14);
  ctx.fillText(`h (numeric)  = ${hNumeric.toFixed(4)} nats`, X1, Y0 + 0);
  ctx.fillText(`delta h      = ${(hNumeric - hAnalytic).toExponential(2)}`, X1, Y0 + 14);
}

selFamily.addEventListener('change', () => {
  state.family = selFamily.value;
  showRows();
  drawAll();
});
sliderMu.addEventListener('input', () => {
  state.mu = parseFloat(sliderMu.value);
  valueMu.textContent = state.mu.toFixed(2);
  drawAll();
});
sliderScale.addEventListener('input', () => {
  state.scale = parseFloat(sliderScale.value);
  valueScale.textContent = state.scale.toFixed(2);
  drawAll();
});
sliderSupp.addEventListener('input', () => {
  state.supp = parseFloat(sliderSupp.value);
  valueSupp.textContent = state.supp.toFixed(2);
  drawAll();
});

function bootSync() {
  showRows();
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const fams = ['gaussian', 'uniform', 'exponential', 'laplace', 'gaussian'];
    state.family = fams[Math.min(fams.length - 1, Math.round(frac * (fams.length - 1)))];
    selFamily.value = state.family;
    if (state.family === 'gaussian' && frac === 1.0) {
      state.scale = 2.0;
      sliderScale.value = '2.0';
      valueScale.textContent = '2.00';
    }
    showRows();
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

// Animate: cycle the scale slider so the user sees the distribution breathe.
let animTime = 0;
let paused = false;
let userOverride = false;
sliderMu.addEventListener('input', () => { userOverride = true; });
sliderScale.addEventListener('input', () => { userOverride = true; });
sliderSupp.addEventListener('input', () => { userOverride = true; });
selFamily.addEventListener('change', () => { userOverride = true; });
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
    const phase = 0.5 + 0.5 * Math.sin(animTime);
    state.scale = 0.5 + 2.0 * phase;
    sliderScale.value = state.scale.toFixed(2);
    valueScale.textContent = state.scale.toFixed(2);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
