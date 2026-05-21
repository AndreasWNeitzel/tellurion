import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Rossler 1976 attractor visualization. The (x, y) projection is drawn as
// a fading trail with a moving head. A live tangent-vector estimator
// reports the running max-Lyapunov exponent.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createRossler, stepRossler, maxLyapunov,
  DEFAULT_DT, DEFAULT_PARAMS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderB      = document.getElementById('slider-b');
const sliderC      = document.getElementById('slider-c');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueB       = document.getElementById('value-b');
const valueC       = document.getElementById('value-c');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW = { xmin: -12, xmax: 14, ymin: -13, ymax: 12 };
const TRAIL_MAX = 9000;
const RESCALE_EVERY = 50;
const STEPS_PER_FRAME = 12;
const WARMUP_STEPS = 1500;

const state = {
  params:  { ...DEFAULT_PARAMS },
  speed:   0.2,
  rossler: null,
  trail:   [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
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
  state.rossler = createRossler({ params: state.params, ic: [0.1, 0, 0], dt: DEFAULT_DT, method: 'rk4' });
  state.trail = [];
  for (let i = 0; i < WARMUP_STEPS; i += 1) stepRossler(state.rossler);
}

function pxView(x, y) {
  return {
    px: W * (x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin),
    py: H * (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)),
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
    const first = pxView(state.trail[0].x, state.trail[0].y);
    ctx.moveTo(first.px, first.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const p = pxView(state.trail[i].x, state.trail[i].y);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const last = state.trail[state.trail.length - 1];
    const lp = pxView(last.x, last.y);
    ctx.fillStyle = tokens.accentWarm;
    ctx.beginPath();
    ctx.arc(lp.px, lp.py, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  drawReadout();
}

function drawReadout() {
  const lambda = maxLyapunov(state.rossler, RESCALE_EVERY);
  const t = state.rossler.inst.t;
  const rows = [
    ['a',         state.params.a.toFixed(3)],
    ['b',         state.params.b.toFixed(3)],
    ['c',         state.params.c.toFixed(2)],
    ['t',         t.toFixed(2)],
    ['lambda_1',  lambda.toFixed(3)],
    ['nSteps',    String(state.rossler.inst.nSteps)],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono');
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
  if (!state.rossler) return;
  const y = state.rossler.inst.y;
  for (let i = 0; i < nSteps; i += 1) {
    stepRossler(state.rossler);
    state.trail.push({ x: y[0], y: y[1], z: y[2] });
    if (state.trail.length > TRAIL_MAX) state.trail.shift();
    if ((state.rossler.inst.nSteps % RESCALE_EVERY) === 0) {
      const tnorm = Math.hypot(y[3], y[4], y[5]);
      if (tnorm > 0) {
        state.rossler.logSum += Math.log(tnorm);
        state.rossler.nRescale += 1;
        y[3] /= tnorm;
        y[4] /= tnorm;
        y[5] /= tnorm;
      }
    }
  }
}

function applyControls() {
  state.params.a = parseFloat(sliderA.value);
  state.params.b = parseFloat(sliderB.value);
  state.params.c = parseFloat(sliderC.value);
  state.speed    = parseFloat(sliderSpeed.value);
  valueA.textContent = state.params.a.toFixed(3);
  valueB.textContent = state.params.b.toFixed(3);
  valueC.textContent = state.params.c.toFixed(2);
  valueSpeed.textContent = state.speed.toFixed(2);
  rebuild();
  drawAll();
}

for (const el of [sliderA, sliderB, sliderC]) {
  el.addEventListener('change', applyControls);
}
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(2);
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
    const CAPTURE_TOTAL_STEPS = 18000;
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
    const stepsThisFrame = Math.max(1, Math.round(STEPS_PER_FRAME * state.speed));
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
