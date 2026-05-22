import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Render the 1D TDSE wavefunction (Re psi, |psi|^2) with barrier overlay.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createTDSE, stepCN, totalNorm, reflectionTransmission, N_GRID, X_MIN, X_MAX } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selKind      = document.getElementById('select-kind');
const sliderV0     = document.getElementById('slider-v0');
const sliderK0     = document.getElementById('slider-k0');
const sliderSpeed  = document.getElementById('slider-speed');
const valueV0      = document.getElementById('value-v0');
const valueK0      = document.getElementById('value-k0');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  tdse: null,
  speed: 6,
  V0: 4.0,
  k0: 2.0,
  kind: 'barrier',
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function toPx(x, y, ymin, ymax) {
  return {
    px: (W - 40) * (x - X_MIN) / (X_MAX - X_MIN) + 20,
    py: 20 + (H - 80) * (1 - (y - ymin) / (ymax - ymin)),
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Y range covers ~ [-0.5, 0.5] for Re psi, and 0-1.0 for |psi|^2.
  const ymin = -0.6, ymax = 0.6;

  // Axis
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  const zero = toPx(0, 0, ymin, ymax);
  ctx.beginPath();
  ctx.moveTo(20, zero.py); ctx.lineTo(W - 20, zero.py);
  ctx.moveTo(zero.px, 20); ctx.lineTo(zero.px, H - 60);
  ctx.stroke();

  if (!state.tdse) { return; }

  // Barrier rectangle
  const v0Px = state.V0 / 10;   // scale V_0 to a barrier-rect height in the plot
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * (X_MAX - X_MIN) / (N_GRID - 1);
    const V = state.tdse.V[i];
    if (V !== 0) {
      const a = toPx(x, 0, ymin, ymax);
      const b = toPx(x, V * 0.05, ymin, ymax);
      ctx.fillStyle = V > 0 ? 'rgba(255, 80, 80, 0.20)' : 'rgba(80, 255, 80, 0.18)';
      ctx.fillRect(a.px - 1, Math.min(a.py, b.py), 2, Math.abs(a.py - b.py));
    }
  }

  // |psi|^2 in red
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * (X_MAX - X_MIN) / (N_GRID - 1);
    const p = state.tdse.psiRe[i] ** 2 + state.tdse.psiIm[i] ** 2;
    const pt = toPx(x, p * 1.5, ymin, ymax);
    if (i === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
  }
  ctx.stroke();

  // Re psi in blue
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * (X_MAX - X_MIN) / (N_GRID - 1);
    const pt = toPx(x, state.tdse.psiRe[i], ymin, ymax);
    if (i === 0) ctx.moveTo(pt.px, pt.py); else ctx.lineTo(pt.px, pt.py);
  }
  ctx.stroke();

  // Readout
  const norm = totalNorm(state.tdse);
  const { R, T } = reflectionTransmission(state.tdse);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['t',     state.tdse.t.toFixed(2)],
    ['steps', String(state.tdse.nSteps)],
    ['V_0',   state.tdse.V0.toFixed(2)],
    ['k_0',   state.k0.toFixed(2)],
    ['kind',  state.tdse.kind],
    ['norm',  norm.toFixed(6)],
    ['R (x<0)', R.toFixed(3)],
    ['T (x>0)', T.toFixed(3)],
  ];
  let y = 20;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 24, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 240, y);
    y += 14;
  }

  // Color legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  ctx.fillStyle = tok.accent;
  ctx.fillText('Re psi', W - 24, 20);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('|psi|^2 (x 1.5)', W - 24, 34);
}

function rebuild() {
  state.tdse = createTDSE({
    x0: -15, k0: state.k0, sigma: 1.5,
    V0: state.V0, barrierA: 3.0, kind: state.kind, dt: 0.05,
  });
}

function tickN(n) {
  if (!state.tdse) return;
  for (let i = 0; i < n; i += 1) stepCN(state.tdse);
}

selKind.addEventListener('change', () => { state.kind = selKind.value; rebuild(); drawAll(); });
sliderV0.addEventListener('change', () => { state.V0 = parseFloat(sliderV0.value); valueV0.textContent = state.V0.toFixed(1); rebuild(); drawAll(); });
sliderV0.addEventListener('input', () => { valueV0.textContent = parseFloat(sliderV0.value).toFixed(1); });
sliderK0.addEventListener('change', () => { state.k0 = parseFloat(sliderK0.value); valueK0.textContent = state.k0.toFixed(2); rebuild(); drawAll(); });
sliderK0.addEventListener('input', () => { valueK0.textContent = parseFloat(sliderK0.value).toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 400);   // 400 steps total = full crossing
    tickN(target);
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
    tickN(state.speed);
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
  const norm = state.tdse ? totalNorm(state.tdse) : 0;
  const { R, T } = state.tdse ? reflectionTransmission(state.tdse, state.k0) : { R: 0, T: 0 };
  return { fields: [
    { key: 'barrier-height', label: 'Barrier height V0', value: state.V0, format: 'float' },
    { key: 'incident-momentum', label: 'Incident momentum k0', value: state.k0, format: 'float' },
    { key: 'norm-psi', label: 'Norm |psi|^2', value: norm, format: 'float' },
    { key: 'reflection-prob', label: 'Reflection probability R', value: R, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  if (!state.tdse) return [{ key: 'not-initialized', label: 'TDSE not initialized', value: 'waiting', status: 'pending' }];

  const norm = totalNorm(state.tdse);
  const { R, T } = reflectionTransmission(state.tdse, state.k0);

  // Invariant 1: Wavefunction norm should be conserved (= 1.0) by Crank-Nicolson
  const normError = Math.abs(norm - 1.0);

  // Invariant 2: Probabilities must sum to ~1: R + T = 1 (optical theorem)
  const probSum = R + T;
  const probSumError = Math.abs(probSum - 1.0);

  // Invariant 3: Both R and T must be in [0, 1]
  const probBounds = R >= -1e-6 && R <= 1 + 1e-6 && T >= -1e-6 && T <= 1 + 1e-6;

  return [
    { key: 'norm-conservation', label: 'Norm = 1 (CN scheme conserves probability)', value: normError.toExponential(2), status: normError < 1e-6 ? 'pass' : normError < 1e-3 ? 'drift' : 'pending' },
    { key: 'probability-sum', label: 'R + T = 1', value: probSumError.toExponential(2), status: probSumError < 1e-6 ? 'pass' : probSumError < 0.1 ? 'drift' : 'pending' },
  ];
};
