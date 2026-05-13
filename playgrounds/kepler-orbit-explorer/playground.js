// playground.js
// UI for the Kepler orbit explorer. Sliders for (a, e); the orbit is drawn as
// an accent-colored polyline trail with the central mass and current particle
// position highlighted.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createOrbit,
  stepOrbit,
  orbitDiagnostics,
  DEFAULT_DT,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  a:        document.getElementById('readout-a'),
  e:        document.getElementById('readout-e'),
  T:        document.getElementById('readout-T'),
  E:        document.getElementById('readout-E'),
  L:        document.getElementById('readout-L'),
  Amag:     document.getElementById('readout-A'),
  dE:       document.getElementById('readout-dE'),
  t:        document.getElementById('readout-t'),
};
const sliderA      = document.getElementById('slider-a');
const sliderE      = document.getElementById('slider-e');
const valueA       = document.getElementById('value-a');
const valueE       = document.getElementById('value-e');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
// World coordinate window in dimensionless units. a goes up to 2 with e up to 0.9,
// so r_ap goes up to 2 * 1.9 = 3.8. Center the canvas around the focus (origin).
const VIEW = { xmin: -4, xmax: 4, ymin: -2.5, ymax: 2.5 };

const TRAIL_MAX = 1500;

const state = {
  a: 1.0,
  e: 0.6,
  orbit: null,
  trail: [],
  playing: !DETERMINISTIC,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  accent:     cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};

function rebuildOrbit() {
  state.orbit = createOrbit(state.a, state.e);
  state.trail = [{ x: state.orbit.inst.q[0], y: state.orbit.inst.q[1] }];
}

function px(x, y) {
  return {
    px: ((x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin)) * W,
    py: (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)) * H,
  };
}

function draw() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // grid lines at integer ticks
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -4; x <= 4; x += 1) {
    const { px: xp } = px(x, 0);
    ctx.moveTo(xp, 0); ctx.lineTo(xp, H);
  }
  for (let y = -2; y <= 2; y += 1) {
    const { py: yp } = px(0, y);
    ctx.moveTo(0, yp); ctx.lineTo(W, yp);
  }
  ctx.stroke();

  // axes
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const o = px(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H);
  ctx.stroke();

  // ticks
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let x = -3; x <= 3; x += 1) {
    if (x === 0) continue;
    const p = px(x, 0);
    ctx.fillText(String(x), p.px, p.py + 12);
  }
  ctx.textAlign = 'right';
  for (let y = -2; y <= 2; y += 1) {
    if (y === 0) continue;
    const p = px(0, y);
    ctx.fillText(String(y), p.px - 4, p.py + 3);
  }

  // trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const first = px(state.trail[0].x, state.trail[0].y);
    ctx.moveTo(first.px, first.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const q = px(state.trail[i].x, state.trail[i].y);
      ctx.lineTo(q.px, q.py);
    }
    ctx.stroke();
  }

  // central mass at origin
  const focus = px(0, 0);
  ctx.fillStyle = tokens.fg;
  ctx.beginPath();
  ctx.arc(focus.px, focus.py, 6, 0, 2 * Math.PI);
  ctx.fill();

  // current particle
  if (state.orbit) {
    const p = px(state.orbit.inst.q[0], state.orbit.inst.q[1]);
    ctx.fillStyle = tokens.accent;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // title
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Kepler orbit (central mass at the origin focus)', 20, 20);
}

function updateReadouts() {
  readouts.a.textContent = state.a.toFixed(3);
  readouts.e.textContent = state.e.toFixed(3);
  if (!state.orbit) return;
  readouts.T.textContent = state.orbit.period.toFixed(3);
  const d = orbitDiagnostics(state.orbit);
  readouts.E.textContent    = d.energy.toFixed(6);
  readouts.L.textContent    = d.angularMomentum.toFixed(6);
  readouts.Amag.textContent = d.lrlMag.toFixed(4);
  readouts.dE.textContent   = Math.abs(d.energyDrift).toExponential(2);
  readouts.t.textContent    = state.orbit.inst.t.toFixed(2);
  readouts.dE.classList.toggle('warn', Math.abs(d.energyDrift) > 1e-3);
}

function stepOnce() {
  stepOrbit(state.orbit, DEFAULT_DT);
  state.trail.push({ x: state.orbit.inst.q[0], y: state.orbit.inst.q[1] });
  if (state.trail.length > TRAIL_MAX) state.trail.shift();
}

function applySliders() {
  state.a = parseFloat(sliderA.value);
  state.e = parseFloat(sliderE.value);
  valueA.textContent = state.a.toFixed(2);
  valueE.textContent = state.e.toFixed(2);
  rebuildOrbit();
  draw();
  updateReadouts();
}

sliderA.addEventListener('input', applySliders);
sliderE.addEventListener('input', applySliders);

btnReset.addEventListener('click', () => {
  sliderA.value = '1.0';
  sliderE.value = '0.6';
  applySliders();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

const CAPTURE_PERIODS = 1.0;

function bootSync() {
  // Capture sweep: vary e along [0, 0.6] across captureFraction.
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.e = 0.6 * frac;
    state.a = 1.0;
    sliderA.value = state.a.toString();
    sliderE.value = state.e.toString();
    valueA.textContent = state.a.toFixed(2);
    valueE.textContent = state.e.toFixed(2);
    state.playing = false;
  } else {
    state.a = parseFloat(sliderA.value);
    state.e = parseFloat(sliderE.value);
    valueA.textContent = state.a.toFixed(2);
    valueE.textContent = state.e.toFixed(2);
  }
  rebuildOrbit();
  // Capture: integrate one period before drawing.
  if (CAPTURE_NAME) {
    const steps = Math.round(CAPTURE_PERIODS * state.orbit.period / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepOnce();
  }
  draw();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, a: state.a, e: state.e };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let accumulator   = 0;

function tick(now) {
  if (!state.playing) {
    lastFrameTime = now;
    requestAnimationFrame(tick);
    return;
  }
  const frameDt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  accumulator += frameDt;
  let safety = 0;
  while (accumulator >= DEFAULT_DT && safety < 240) {
    stepOnce();
    accumulator -= DEFAULT_DT;
    safety += 1;
  }
  draw();
  updateReadouts();
  requestAnimationFrame(tick);
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
