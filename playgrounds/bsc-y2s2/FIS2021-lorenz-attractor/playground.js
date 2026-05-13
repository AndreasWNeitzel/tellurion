// playground.js
// Lorenz 1963 attractor visualization. The (x, z) projection is drawn as a
// growing trail. A live tangent-vector estimator reports the running max-
// Lyapunov exponent.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  createLorenz, stepLorenz, maxLyapunov,
  DEFAULT_DT, DEFAULT_PARAMS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSigma  = document.getElementById('slider-sigma');
const sliderRho    = document.getElementById('slider-rho');
const sliderBeta   = document.getElementById('slider-beta');
const sliderSpeed  = document.getElementById('slider-speed');
const valueSigma   = document.getElementById('value-sigma');
const valueRho     = document.getElementById('value-rho');
const valueBeta    = document.getElementById('value-beta');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const VIEW = { xmin: -25, xmax: 25, zmin: 0, zmax: 50 };
const TRAIL_MAX = 12000;
const RESCALE_EVERY = 50;
// Slower default: 18 steps/frame at speed=1 advances ~ 0.09 time units/frame,
// or one Lyapunov time (~ 1.1 t.u.) every 12 frames. Speed slider now allows
// 0.1 .. 1.5 with 1.0 as the default ceiling for clarity.
const STEPS_PER_FRAME = 18;
const WARMUP_STEPS = 1000;

const state = {
  params:  { ...DEFAULT_PARAMS },
  speed:   1.0,
  lorenz:  null,
  trail:   [],
  playing: !DETERMINISTIC,
  rafId:   null,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  fg:        cssVar('--fg', '#1A1B1C'),
  fgMuted:   cssVar('--fg-muted', '#5C5E61'),
  accent:    cssVar('--accent', '#1B6CA8'),
  accentWarm:cssVar('--accent-warm', '#C13B27'),
};

function rebuild() {
  state.lorenz = createLorenz({ params: state.params, ic: [1, 1, 1], dt: DEFAULT_DT, method: 'rk4' });
  state.trail = [];
  for (let i = 0; i < WARMUP_STEPS; i += 1) stepLorenz(state.lorenz);
}

function pxView(x, z) {
  return {
    px: W * (x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin),
    py: H * (1 - (z - VIEW.zmin) / (VIEW.zmax - VIEW.zmin)),
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const o = pxView(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H);
  ctx.stroke();

  if (state.trail.length >= 2) {
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 1.0;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    const first = pxView(state.trail[0].x, state.trail[0].z);
    ctx.moveTo(first.px, first.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const p = pxView(state.trail[i].x, state.trail[i].z);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const last = state.trail[state.trail.length - 1];
    const lp = pxView(last.x, last.z);
    ctx.fillStyle = tokens.accentWarm;
    ctx.beginPath();
    ctx.arc(lp.px, lp.py, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  drawReadout();
}

function drawReadout() {
  const lambda = maxLyapunov(state.lorenz, RESCALE_EVERY);
  const t = state.lorenz.inst.t;
  const rows = [
    ['sigma',     state.params.sigma.toFixed(2)],
    ['rho',       state.params.rho.toFixed(2)],
    ['beta',      state.params.beta.toFixed(3)],
    ['t',         t.toFixed(2)],
    ['lambda_1',  lambda.toFixed(3)],
    ['nSteps',    String(state.lorenz.inst.nSteps)],
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const xLeft = W - 200;
  const xValue = W - 16;
  let y = 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, xLeft, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, xValue, y);
    y += 14;
  }
}

function tickN(nSteps) {
  if (!state.lorenz) return;
  const y = state.lorenz.inst.y;
  for (let i = 0; i < nSteps; i += 1) {
    stepLorenz(state.lorenz);
    state.trail.push({ x: y[0], y: y[1], z: y[2] });
    if (state.trail.length > TRAIL_MAX) state.trail.shift();
    if ((state.lorenz.inst.nSteps % RESCALE_EVERY) === 0) {
      const tnorm = Math.hypot(y[3], y[4], y[5]);
      if (tnorm > 0) {
        state.lorenz.logSum += Math.log(tnorm);
        state.lorenz.nRescale += 1;
        y[3] /= tnorm;
        y[4] /= tnorm;
        y[5] /= tnorm;
      }
    }
  }
}

function applyControls() {
  state.params.sigma = parseFloat(sliderSigma.value);
  state.params.rho   = parseFloat(sliderRho.value);
  state.params.beta  = parseFloat(sliderBeta.value);
  state.speed        = parseFloat(sliderSpeed.value);
  valueSigma.textContent = state.params.sigma.toFixed(2);
  valueRho.textContent   = state.params.rho.toFixed(2);
  valueBeta.textContent  = state.params.beta.toFixed(3);
  valueSpeed.textContent = state.speed.toFixed(1);
  rebuild();
  drawAll();
}

for (const el of [sliderSigma, sliderRho, sliderBeta]) {
  el.addEventListener('change', applyControls);
}
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(1);
});

btnReset.addEventListener('click', applyControls);
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();

  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const CAPTURE_TOTAL_STEPS = 15000;
    const target = Math.round(frac * CAPTURE_TOTAL_STEPS);
    tickN(target);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', {
            detail: { capture: CAPTURE_NAME, seed: SEED, steps: target },
          }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED, steps: target };
        });
      });
    }
    return;
  }

  drawAll();
}

function tick() {
  if (state.playing) {
    const stepsThisFrame = Math.round(STEPS_PER_FRAME * state.speed);
    tickN(stepsThisFrame);
    drawAll();
  }
  state.rafId = requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
