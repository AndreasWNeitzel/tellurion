// playground.js
// 2D PM disc render.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createDisk, stepPM, totalAngularMomentum, totalMass, NGRID, L, NPARTICLES } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderR      = document.getElementById('slider-R');
const sliderSpeed  = document.getElementById('slider-speed');
const valueR       = document.getElementById('value-R');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  R: 1.0,
  speed: 1,
  sim: null,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
};

function rebuild() {
  state.sim = createDisk({ N: NPARTICLES, M: 1.0, R: state.R, seed: SEED });
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  // Plot region
  const PLOT = { x: 30, y: 30, w: W - 60, h: H - 100 };
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);
  function toPx(x, y) {
    return {
      px: PLOT.x + PLOT.w * (x / L),
      py: PLOT.y + PLOT.h * (1 - y / L),
    };
  }

  // Particles
  ctx.fillStyle = tok.accent;
  for (let p = 0; p < state.sim.N; p += 1) {
    const x = state.sim.x[2 * p];
    const y = state.sim.x[2 * p + 1];
    const pt = toPx(x, y);
    ctx.globalAlpha = 0.55;
    ctx.fillRect(pt.px - 0.5, pt.py - 0.5, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  // Readout
  const M = totalMass(state.sim);
  const Lz = totalAngularMomentum(state.sim);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.sim.t.toFixed(2)}  N = ${state.sim.N}  R = ${state.R.toFixed(2)}  M = ${M.toFixed(3)}  L_z = ${Lz.toFixed(3)}`, 30, 18);
}

function tickN(n) {
  if (!state.sim) return;
  for (let i = 0; i < n; i += 1) stepPM(state.sim, 0.02);
}

sliderR.addEventListener('change', () => { state.R = parseFloat(sliderR.value); valueR.textContent = state.R.toFixed(2); rebuild(); drawAll(); });
sliderR.addEventListener('input', () => { valueR.textContent = parseFloat(sliderR.value).toFixed(2); });
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
    const target = Math.round(frac * 100);
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
