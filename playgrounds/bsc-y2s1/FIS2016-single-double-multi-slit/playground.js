// playground.js
// Multi-slit diffraction: I(theta) curve and screen image.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { intensity, principalMaxima, A_DEF, D_DEF, LAMBDA } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-N');
const sliderRatio  = document.getElementById('slider-ratio');
const sliderSpeed  = document.getElementById('slider-speed');
const valueN       = document.getElementById('value-N');
const valueRatio   = document.getElementById('value-ratio');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  N: 4,
  ratio: 5.0,     // d / a
  speed: 2,
  sweepDir: 1,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const a = A_DEF;
  const d = a * state.ratio;
  const I0 = intensity(0, state.N, a, d);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`N = ${state.N}   d / a = ${state.ratio.toFixed(1)}   I(0) = ${I0.toFixed(1)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`principal max at sin(theta) = m lambda / d   envelope zeros at sin(theta) = m lambda / a`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: intensity curve
  const curveY = 60, curveH = 320;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, curveY, PW, curveH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, curveY + 0.5, PW - 1, curveH - 1);
  // theta range: limit by sin(theta) in [-0.5, 0.5] for visibility
  const THETA_MAX = Math.asin(0.4);
  function xT(theta) { return padL + 4 + (PW - 8) * (theta + THETA_MAX) / (2 * THETA_MAX); }
  // envelope (single slit)
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  const NPTS = PW - 8;
  let envMax = 1;
  // envelope max is 1 at theta = 0
  for (let i = 0; i < NPTS; i += 1) {
    const theta = -THETA_MAX + (2 * THETA_MAX) * i / (NPTS - 1);
    const sin_t = Math.sin(theta);
    const beta = Math.PI * a * sin_t / LAMBDA;
    const env = Math.abs(beta) < 1e-12 ? 1 : (Math.sin(beta) / beta) ** 2;
    const px = padL + 4 + i;
    const py = curveY + curveH - 6 - (curveH - 12) * env;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // full pattern (normalized by N^2)
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const theta = -THETA_MAX + (2 * THETA_MAX) * i / (NPTS - 1);
    const I = intensity(theta, state.N, a, d) / I0;
    const px = padL + 4 + i;
    const py = curveY + curveH - 6 - (curveH - 12) * I;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(214, 138, 105, 0.75)';
  ctx.fillText('envelope (sinc^2)', padL + 6, curveY + 14);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('N-slit pattern', padL + 160, curveY + 14);
  // theta ticks
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const deg of [-20, -10, 0, 10, 20]) {
    const theta = (deg * Math.PI) / 180;
    if (Math.abs(theta) <= THETA_MAX) {
      const px = xT(theta);
      ctx.fillText(`${deg}`, px, curveY + curveH - 4);
    }
  }
  ctx.fillText('theta (deg)', padL + PW / 2, curveY + curveH + 14);

  // Bottom: screen image strip
  const stripY = curveY + curveH + 30;
  const stripH = 60;
  for (let i = 0; i < PW - 8; i += 1) {
    const theta = -THETA_MAX + (2 * THETA_MAX) * i / (PW - 9);
    const I = intensity(theta, state.N, a, d) / I0;
    const v = Math.min(1, Math.sqrt(I));
    const r = Math.round(v * 255), g = Math.round(v * 255), b = Math.round(v * 255);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(padL + 4 + i, stripY, 1, stripH);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 4, stripY, PW - 8, stripH);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('screen image (intensity -> brightness)', padL + 6, stripY - 6);
}

function tickN(n) {
  // Speed mode: cycle N from 1 to 8.
  for (let i = 0; i < n; i += 1) {
    state.N += state.sweepDir * 0.04;
    if (state.N >= 8) { state.N = 8; state.sweepDir = -1; }
    if (state.N <= 1) { state.N = 1; state.sweepDir = 1; }
  }
  const Ni = Math.round(state.N);
  sliderN.value = String(Ni);
  valueN.textContent = String(Ni);
}

sliderN.addEventListener('input', () => { state.N = parseInt(sliderN.value, 10); valueN.textContent = String(state.N); drawAll(); });
sliderRatio.addEventListener('input', () => { state.ratio = parseFloat(sliderRatio.value); valueRatio.textContent = state.ratio.toFixed(1); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.N = 4; state.sweepDir = 1; sliderN.value = '4'; valueN.textContent = '4'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.N = Math.max(1, Math.round(1 + frac * 7));
    sliderN.value = String(state.N); valueN.textContent = String(state.N);
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
    if (state.speed > 0) {
      tickN(state.speed);
      state.N = Math.round(state.N);   // for the intensity function we need integer
    }
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
