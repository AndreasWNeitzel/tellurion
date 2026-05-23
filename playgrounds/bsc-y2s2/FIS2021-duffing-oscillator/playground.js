import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Driven, damped Duffing oscillator. Left panel: phase portrait with
// stroboscopic Poincare points sampled once per drive period. Right panel:
// bifurcation diagram in the drive amplitude gamma.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createDuffing, stepDuffing, bifurcationGamma,
  DEFAULT_DT, DEFAULT_PARAMS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderDelta  = document.getElementById('slider-delta');
const sliderGamma  = document.getElementById('slider-gamma');
const sliderOmega  = document.getElementById('slider-omega');
const sliderSpeed  = document.getElementById('slider-speed');
const valueDelta   = document.getElementById('value-delta');
const valueGamma   = document.getElementById('value-gamma');
const valueOmega   = document.getElementById('value-omega');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const LEFT_W = 520;
const RIGHT_X = LEFT_W + 8;
const RIGHT_W = W - RIGHT_X - 12;
const PHASE_VIEW = { xmin: -2.2, xmax: 2.2, vmin: -2.0, vmax: 2.0 };
const BIF_VIEW   = { gmin: 0.20, gmax: 0.70, xmin: -1.6, xmax: 1.6 };

const TRAIL_MAX = 4000;
const POINCARE_MAX = 200;
const STEPS_PER_PERIOD = 200;

const state = {
  params:  { ...DEFAULT_PARAMS },
  speed:   0.6,
  duf:     null,
  trail:   [],
  poincare:[],
  periodAcc: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  rafId:   null,
  bif:     null,
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

function buildBifurcation() {
  const NG = 220;
  const gammas = new Float64Array(NG);
  for (let i = 0; i < NG; i += 1) gammas[i] = BIF_VIEW.gmin + (BIF_VIEW.gmax - BIF_VIEW.gmin) * (i / (NG - 1));
  const result = bifurcationGamma({
    gammas,
    omega: state.params.omega,
    delta: state.params.delta,
    nTransient: 180,
    nSamples: 45,
    stepsPerPeriod: 120,
    ic: [0.1, 0],
  });
  state.bif = result;
}

function rebuild() {
  state.duf = createDuffing({ params: state.params, ic: [0.1, 0], dt: (2 * Math.PI / state.params.omega) / STEPS_PER_PERIOD });
  state.trail = [];
  state.poincare = [];
  state.periodAcc = 0;
  for (let p = 0; p < 100; p += 1) {
    for (let s = 0; s < STEPS_PER_PERIOD; s += 1) stepDuffing(state.duf);
  }
  buildBifurcation();
}

function phaseToPx(x, v) {
  return {
    px: LEFT_W * (x - PHASE_VIEW.xmin) / (PHASE_VIEW.xmax - PHASE_VIEW.xmin),
    py: H * (1 - (v - PHASE_VIEW.vmin) / (PHASE_VIEW.vmax - PHASE_VIEW.vmin)),
  };
}

function bifToPx(g, x) {
  return {
    px: RIGHT_X + RIGHT_W * (g - BIF_VIEW.gmin) / (BIF_VIEW.gmax - BIF_VIEW.gmin),
    py: H * (1 - (x - BIF_VIEW.xmin) / (BIF_VIEW.xmax - BIF_VIEW.xmin)),
  };
}

function drawPhase() {
  ctx.fillStyle = '#0A0A0E';
  ctx.fillRect(0, 0, LEFT_W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const ox = phaseToPx(0, 0);
  ctx.moveTo(0, ox.py); ctx.lineTo(LEFT_W, ox.py);
  ctx.moveTo(ox.px, 0); ctx.lineTo(ox.px, H);
  ctx.stroke();

  for (const xw of [-1, 1]) {
    const wp = phaseToPx(xw, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(wp.px, wp.py, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  if (state.trail.length >= 2) {
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    const first = phaseToPx(state.trail[0].x, state.trail[0].v);
    ctx.moveTo(first.px, first.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const p = phaseToPx(state.trail[i].x, state.trail[i].v);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const last = state.trail[state.trail.length - 1];
    const lp = phaseToPx(last.x, last.v);
    ctx.fillStyle = tokens.accentWarm;
    ctx.beginPath();
    ctx.arc(lp.px, lp.py, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 200, 50, 0.95)';
  for (const p of state.poincare) {
    const pp = phaseToPx(p.x, p.v);
    ctx.beginPath();
    ctx.arc(pp.px, pp.py, 2.0, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('phase portrait', 10, 16);
  ctx.fillStyle = 'rgba(255, 200, 50, 0.95)';
  ctx.fillText('strobe', 10, 30);
}

function drawBifurcation() {
  ctx.fillStyle = '#0A0A0E';
  ctx.fillRect(RIGHT_X, 0, RIGHT_W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.5;
  for (let gi = 0; gi <= 5; gi += 1) {
    const g = BIF_VIEW.gmin + (BIF_VIEW.gmax - BIF_VIEW.gmin) * (gi / 5);
    const p = bifToPx(g, 0);
    ctx.beginPath();
    ctx.moveTo(p.px, 0); ctx.lineTo(p.px, H);
    ctx.stroke();
  }
  for (let xi = -1; xi <= 1; xi += 1) {
    const p = bifToPx(BIF_VIEW.gmin, xi);
    ctx.beginPath();
    ctx.moveTo(RIGHT_X, p.py); ctx.lineTo(RIGHT_X + RIGHT_W, p.py);
    ctx.stroke();
  }

  if (state.bif) {
    ctx.fillStyle = 'rgba(180, 200, 230, 0.55)';
    for (let i = 0; i < state.bif.gammas.length; i += 1) {
      const g = state.bif.gammas[i];
      const xs = state.bif.sections[i];
      for (let j = 0; j < xs.length; j += 1) {
        const p = bifToPx(g, xs[j]);
        ctx.fillRect(p.px - 0.5, p.py - 0.5, 1.0, 1.0);
      }
    }
  }

  const cur = bifToPx(state.params.gamma, 0);
  ctx.strokeStyle = tokens.accentWarm;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(cur.px, 0);
  ctx.lineTo(cur.px, H);
  ctx.stroke();

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('bifurcation in γ', RIGHT_X + 8, 16);
  ctx.textAlign = 'right';
  ctx.fillText(`gamma = ${state.params.gamma.toFixed(3)}`, RIGHT_X + RIGHT_W - 4, 16);
  ctx.textAlign = 'left';
  ctx.fillText(`g_min ${BIF_VIEW.gmin.toFixed(2)}`, RIGHT_X + 8, H - 8);
  ctx.textAlign = 'right';
  ctx.fillText(`g_max ${BIF_VIEW.gmax.toFixed(2)}`, RIGHT_X + RIGHT_W - 4, H - 8);
}

function drawReadout() {
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['delta',  state.params.delta.toFixed(2)],
    ['gamma',  state.params.gamma.toFixed(3)],
    ['omega',  state.params.omega.toFixed(2)],
    ['T_drive',(2 * Math.PI / state.params.omega).toFixed(3)],
    ['strobed', String(state.poincare.length)],
  ];
  ctx.textAlign = 'left';
  let y = 50;
  for (const [k, v] of rows) {
    ctx.fillText(k, 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, LEFT_W - 10, y);
    ctx.textAlign = 'left';
    y += 14;
  }
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  drawPhase();
  drawBifurcation();
  drawReadout();
}

function tickN(nSteps) {
  if (!state.duf) return;
  const y = state.duf.inst.y;
  const T = 2 * Math.PI / state.params.omega;
  const dt = state.duf.dt;
  for (let i = 0; i < nSteps; i += 1) {
    stepDuffing(state.duf);
    state.trail.push({ x: y[0], v: y[1] });
    if (state.trail.length > TRAIL_MAX) state.trail.shift();
    state.periodAcc += dt;
    if (state.periodAcc >= T) {
      state.periodAcc -= T;
      state.poincare.push({ x: y[0], v: y[1] });
      if (state.poincare.length > POINCARE_MAX) state.poincare.shift();
    }
  }
}

function applyControls() {
  state.params.delta = parseFloat(sliderDelta.value);
  state.params.gamma = parseFloat(sliderGamma.value);
  state.params.omega = parseFloat(sliderOmega.value);
  state.speed        = parseFloat(sliderSpeed.value);
  valueDelta.textContent = state.params.delta.toFixed(2);
  valueGamma.textContent = state.params.gamma.toFixed(3);
  valueOmega.textContent = state.params.omega.toFixed(2);
  valueSpeed.textContent = state.speed.toFixed(1);
  rebuild();
  drawAll();
}

function applyGammaOnly() {
  state.params.gamma = parseFloat(sliderGamma.value);
  valueGamma.textContent = state.params.gamma.toFixed(3);
  state.duf = createDuffing({ params: state.params, ic: [0.1, 0], dt: (2 * Math.PI / state.params.omega) / STEPS_PER_PERIOD });
  state.trail = [];
  state.poincare = [];
  state.periodAcc = 0;
  for (let p = 0; p < 80; p += 1) {
    for (let s = 0; s < STEPS_PER_PERIOD; s += 1) stepDuffing(state.duf);
  }
  drawAll();
}

sliderDelta.addEventListener('change', applyControls);
sliderOmega.addEventListener('change', applyControls);
sliderGamma.addEventListener('change', applyGammaOnly);
sliderGamma.addEventListener('input', () => {
  valueGamma.textContent = parseFloat(sliderGamma.value).toFixed(3);
});
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
    const CAPTURE_TOTAL = 600 * STEPS_PER_PERIOD;
    const target = Math.round(frac * CAPTURE_TOTAL);
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
    const stepsThisFrame = Math.max(2, Math.round(60 * state.speed));
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!state.duf || !state.duf.inst || !state.duf.inst.state) {
    const x = state.duf ? (state.duf.inst ? (state.duf.inst.state ? state.duf.inst.state[0] : 0.1) : 0.1) : 0.1;
    const v = state.duf ? (state.duf.inst ? (state.duf.inst.state ? state.duf.inst.state[1] : 0) : 0) : 0;
    return {
      fields: [
        { key: 'param-delta', label: 'Damping delta', value: state.params.delta, format: 'float' },
        { key: 'param-gamma', label: 'Drive amplitude gamma', value: state.params.gamma, format: 'float' },
        { key: 'param-omega', label: 'Drive frequency omega', value: state.params.omega, format: 'float' },
        { key: 'position-x', label: 'Position x', value: x, format: 'float' },
        { key: 'velocity-v', label: 'Velocity v', value: v, format: 'float' }
      ]
    };
  }
  return {
    fields: [
      { key: 'param-delta', label: 'Damping delta', value: state.params.delta, format: 'float' },
      { key: 'param-gamma', label: 'Drive amplitude gamma', value: state.params.gamma, format: 'float' },
      { key: 'param-omega', label: 'Drive frequency omega', value: state.params.omega, format: 'float' },
      { key: 'position-x', label: 'Position x', value: state.duf.inst.state[0], format: 'float' },
      { key: 'velocity-v', label: 'Velocity v', value: state.duf.inst.state[1], format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  if (!state.duf || !state.duf.inst || !state.duf.inst.state) {
    return [{ key: 'state-init', label: 'Initializing', value: 'pending', status: 'pending' }];
  }
  const x = state.duf.inst.state[0];
  const v = state.duf.inst.state[1];
  const bounded = Math.abs(x) < 3 && Math.abs(v) < 3;
  const wellform = Math.sign(x * x - 1) !== 0;
  return [
    {
      key: 'phase-space-bounded',
      label: 'Phase space bounded (|x|, |v| < 3)',
      value: bounded ? 'bounded' : 'diverging',
      status: bounded ? 'pass' : 'drift'
    },
    {
      key: 'attractor-structure',
      label: 'In double-well regime',
      value: wellform ? 'bistable' : 'transitional',
      status: 'pending'
    }
  ];
};
