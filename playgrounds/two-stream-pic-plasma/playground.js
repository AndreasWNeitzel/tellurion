// playground.js
// 1D-1V PIC simulation of two-stream instability. Phase space scatter +
// log-amplitude trace of mode 1.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { createTwoStream, stepPIC, modeOneAmplitude, NPARTICLES, L } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV0     = document.getElementById('slider-v0');
const sliderSpeed  = document.getElementById('slider-speed');
const valueV0      = document.getElementById('value-v0');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PHASE_H = H - 130;
const TRACE_H = 100;

const state = {
  v0: 1.0,
  speed: 3,
  sim: null,
  modeHistory: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function rebuild() {
  state.sim = createTwoStream({ v0: state.v0, T: 0.01, seed: SEED });
  state.modeHistory = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PHASE_X = 30, PHASE_W = W - 60;
  const PHASE_Y = 20;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PHASE_X, PHASE_Y, PHASE_W, PHASE_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PHASE_X + 0.5, PHASE_Y + 0.5, PHASE_W - 1, PHASE_H - 1);

  const V_MAX = state.v0 * 3;
  // Scatter particles
  for (let p = 0; p < NPARTICLES; p += 1) {
    const x = state.sim.x[p];
    const v = state.sim.v[p];
    const px = PHASE_X + PHASE_W * (x / L);
    const py = PHASE_Y + PHASE_H * (1 - (v + V_MAX) / (2 * V_MAX));
    ctx.fillStyle = p < NPARTICLES / 2 ? '#7fb1d8' : '#d68a69';
    ctx.fillRect(px - 0.5, py - 0.5, 1.2, 1.2);
  }

  // Axis labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('phase space (x, v): blue = +v0 stream, orange = -v0 stream', PHASE_X + 8, PHASE_Y + 12);
  ctx.textAlign = 'right';
  ctx.fillText(`t = ${state.sim.t.toFixed(2)}  steps = ${state.sim.nSteps}`, PHASE_X + PHASE_W - 8, PHASE_Y + 12);

  // Mode-amplitude trace (log scale)
  const TRACE_Y = PHASE_Y + PHASE_H + 12;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PHASE_X, TRACE_Y, PHASE_W, TRACE_H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(PHASE_X + 0.5, TRACE_Y + 0.5, PHASE_W - 1, TRACE_H - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('log |rho_hat[k=1]| over time (linear regime = straight line)', PHASE_X + 8, TRACE_Y + 12);

  if (state.modeHistory.length >= 2) {
    let logMin = Infinity, logMax = -Infinity;
    const logs = state.modeHistory.map(v => Math.log(Math.max(1e-6, v)));
    for (const l of logs) { if (l < logMin) logMin = l; if (l > logMax) logMax = l; }
    if (logMax === logMin) logMax = logMin + 1;
    ctx.strokeStyle = '#f1d28a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < logs.length; i += 1) {
      const x = PHASE_X + (PHASE_W - 4) * (i / Math.max(1, logs.length - 1));
      const y = TRACE_Y + TRACE_H - 4 - (TRACE_H - 24) * (logs[i] - logMin) / (logMax - logMin);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function tickN(n) {
  if (!state.sim) return;
  for (let i = 0; i < n; i += 1) {
    stepPIC(state.sim, 0.05);
    state.modeHistory.push(modeOneAmplitude(state.sim));
    if (state.modeHistory.length > 600) state.modeHistory.shift();
  }
}

sliderV0.addEventListener('change', () => { state.v0 = parseFloat(sliderV0.value); valueV0.textContent = state.v0.toFixed(2); rebuild(); drawAll(); });
sliderV0.addEventListener('input', () => { valueV0.textContent = parseFloat(sliderV0.value).toFixed(2); });
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
    const target = Math.round(frac * 300);
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
