// playground.js
// Schwarzschild-effective-potential orbit with tunable GR-strength alpha.
// Orange: current orbit (last single revolution). Faint blue: four recent
// orbits, fading. Red dots: perihelion passages. Yellow disc: central body.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createMercury, stepMercury, mercuryDiagnostics,
  DEFAULT_DT, DEFAULT_ALPHA, DEFAULT_E,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderAlpha  = document.getElementById('slider-alpha');
const sliderE      = document.getElementById('slider-e');
const sliderSpeed  = document.getElementById('slider-speed');
const valueAlpha   = document.getElementById('value-alpha');
const valueE       = document.getElementById('value-e');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW_R = 1.9;
const CX = W / 2, CY = H / 2;
const PX_PER_UNIT = Math.min(W, H) / (2 * VIEW_R);
const STEPS_PER_FRAME_BASE = 30;

const state = {
  merc: null,
  alpha: DEFAULT_ALPHA,
  e: DEFAULT_E,
  speed: 0.5,
  ringBuffer: [],
  recentOrbits: [],
  currentOrbit: [],
  perihelions: [],
  rPrev: Infinity, rCurr: Infinity, rNext: Infinity,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  rafId: null,
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

function toPx(x, y) {
  return { px: CX + x * PX_PER_UNIT, py: CY - y * PX_PER_UNIT };
}

function rebuild() {
  state.merc = createMercury({ alpha: state.alpha, e: state.e, integrator: 'verlet' });
  state.recentOrbits = [];
  state.currentOrbit = [];
  state.perihelions = [];
  state.rPrev = Infinity; state.rCurr = Infinity; state.rNext = Infinity;
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let k = 1; k <= 2; k += 1) {
    ctx.beginPath();
    ctx.arc(CX, CY, k * 0.5 * PX_PER_UNIT, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, CY); ctx.lineTo(W, CY);
  ctx.moveTo(CX, 0); ctx.lineTo(CX, H);
  ctx.stroke();

  for (let oi = 0; oi < state.recentOrbits.length; oi += 1) {
    const orb = state.recentOrbits[oi];
    const fade = (oi + 1) / state.recentOrbits.length;
    ctx.strokeStyle = `rgba(120, 165, 220, ${0.10 + 0.25 * fade})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < orb.length; i += 1) {
      const p = toPx(orb[i][0], orb[i][1]);
      if (!started) { ctx.moveTo(p.px, p.py); started = true; }
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  if (state.currentOrbit.length >= 2) {
    ctx.strokeStyle = tokens.accentWarm;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const f = toPx(state.currentOrbit[0][0], state.currentOrbit[0][1]);
    ctx.moveTo(f.px, f.py);
    for (let i = 1; i < state.currentOrbit.length; i += 1) {
      const p = toPx(state.currentOrbit[i][0], state.currentOrbit[i][1]);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  for (const ph of state.perihelions) {
    const p = toPx(ph.x, ph.y);
    ctx.fillStyle = '#ff5050';
    ctx.beginPath();
    ctx.arc(p.px, p.py, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = '#ffd96a';
  ctx.beginPath();
  ctx.arc(CX, CY, 6, 0, 2 * Math.PI);
  ctx.fill();

  if (state.merc) {
    const last = state.merc.inst.q;
    const p = toPx(last[0], last[1]);
    ctx.fillStyle = tokens.accent;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  drawReadout();
}

function drawReadout() {
  if (!state.merc) return;
  const diag = mercuryDiagnostics(state.merc);
  const rows = [
    ['alpha',     state.alpha.toFixed(3)],
    ['e',         state.e.toFixed(2)],
    ['t',         diag.t.toFixed(2)],
    ['perihelia', String(state.perihelions.length)],
    ['dE/E',      diag.energyDrift.toExponential(2)],
    ['L',         diag.angularMomentum.toFixed(4)],
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  let y = 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 18, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 220, y);
    y += 14;
  }
}

function trackPerihelion() {
  const y = state.merc.inst.q;
  const r = Math.hypot(y[0], y[1]);
  state.rPrev = state.rCurr;
  state.rCurr = state.rNext;
  state.rNext = r;
  if (Number.isFinite(state.rPrev) && state.rPrev > state.rCurr && state.rCurr < state.rNext) {
    state.perihelions.push({ x: y[0], y: y[1] });
    if (state.perihelions.length > 16) state.perihelions.shift();
    if (state.currentOrbit.length > 10) {
      state.recentOrbits.push(state.currentOrbit);
      if (state.recentOrbits.length > 4) state.recentOrbits.shift();
    }
    state.currentOrbit = [];
  }
}

function tickN(nSteps) {
  if (!state.merc) return;
  const y = state.merc.inst.q;
  for (let i = 0; i < nSteps; i += 1) {
    stepMercury(state.merc, DEFAULT_DT);
    state.currentOrbit.push([y[0], y[1]]);
    if (state.currentOrbit.length > 6000) state.currentOrbit.shift();
    trackPerihelion();
  }
}

function applyControls() {
  state.alpha = parseFloat(sliderAlpha.value);
  state.e     = parseFloat(sliderE.value);
  state.speed = parseFloat(sliderSpeed.value);
  valueAlpha.textContent = state.alpha.toFixed(3);
  valueE.textContent     = state.e.toFixed(2);
  valueSpeed.textContent = state.speed.toFixed(1);
  rebuild();
  drawAll();
}

sliderAlpha.addEventListener('change', applyControls);
sliderE.addEventListener('change', applyControls);
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
    const CAPTURE_TOTAL = 30_000;
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
    const stepsThisFrame = Math.max(2, Math.round(STEPS_PER_FRAME_BASE * state.speed));
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
