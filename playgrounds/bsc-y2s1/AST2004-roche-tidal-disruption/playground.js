import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Tidal stream from a self-gravitating cloud. Render cloud + trail.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createCloud, stepCloud, streamLength, comDistance } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderE      = document.getElementById('slider-e');
const sliderCoh    = document.getElementById('slider-coh');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueE       = document.getElementById('value-e');
const valueCoh     = document.getElementById('value-coh');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const SCENE_H = H - 225;                         // reserve a band below for the disruption plot
const CX = W / 2, CY = SCENE_H / 2;
// View centred on the orbit (offset by a*e from the primary, since the body
// starts at apoastron on +x), fitted to the orbit and the Roche circle so the
// scene fills the canvas instead of hugging one side.
let VIEW_CX = 0, PX_PER_UNIT = Math.min(W, H) / 14;
function updateView() {
  VIEW_CX = state.a * state.e;
  const VIEW_R = Math.max(state.a, state.a * state.e + 2.44) + 0.5;
  PX_PER_UNIT = Math.min(W, SCENE_H) / (2 * VIEW_R);
}
const STEPS_PER_FRAME = 40;
const DT = 0.005;
const TRAIL_MAX = 800;

const state = {
  a: 3.5,
  e: 0.55,
  cohesion: 0.05,
  speed: 0.5,
  cloud: null,
  trail: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function toPx(x, y) { return { px: CX + (x - VIEW_CX) * PX_PER_UNIT, py: CY - y * PX_PER_UNIT }; }

function rebuild() {
  state.cloud = createCloud({ N: 1000, a: state.a, e: state.e, rCloud: 0.30, seed: SEED });
  state.trail = [];
  state.hist = [];
}

function drawAll() {
  updateView();
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const O = toPx(0, 0);                          // the primary / world origin in pixels
  // axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, O.py); ctx.lineTo(W, O.py);
  ctx.moveTo(O.px, 0); ctx.lineTo(O.px, SCENE_H);
  ctx.stroke();

  // Roche radius marker (2.44 in code units; here primary "radius" is r_P = 1)
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(O.px, O.py, 2.44 * PX_PER_UNIT, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 80, 80, 0.55)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'left';
  const rPx = toPx(2.44, 0);
  ctx.fillText('Roche limit r_R = 2.44', rPx.px + 4, rPx.py - 4);

  // Primary
  ctx.fillStyle = '#ffd96a';
  ctx.beginPath();
  ctx.arc(O.px, O.py, 9, 0, 2 * Math.PI);
  ctx.fill();

  // Trail of CoM
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.30)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const p = toPx(state.trail[i][0], state.trail[i][1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Particles
  ctx.fillStyle = '#7fb1d8';
  for (let i = 0; i < state.cloud.N; i += 1) {
    const p = toPx(state.cloud.xs[i], state.cloud.ys[i]);
    ctx.beginPath();
    ctx.arc(p.px, p.py, 1.6, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Readout
  const r = comDistance(state.cloud);
  const stream = streamLength(state.cloud);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['a',          state.a.toFixed(2)],
    ['e',          state.e.toFixed(2)],
    ['cohesion',   state.cohesion.toFixed(3)],
    ['t',          state.cloud.t.toFixed(2)],
    ['r (CoM)',    r.toFixed(2)],
    ['stream len', stream.toFixed(2)],
    ['inside Roche', r < 2.44 ? 'yes' : 'no'],
  ];
  let y = 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 14, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 250, y);
    y += 14;
  }
  drawDiagnostic();
}

// Quantitative diagnostic: the tidal stream length against the centre-of-mass
// distance. The cloud holds together outside the Roche limit and stretches into
// a stream once it crosses inside, so the trace climbs sharply left of r_R.
function drawDiagnostic() {
  const p = { x: 26, y: SCENE_H + 14, w: W - 52, h: H - SCENE_H - 32 };
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('stream length vs distance: it stretches once inside the Roche limit', p.x + 8, p.y + 6);
  const hist = state.hist || [];
  const ax = p.x + 46, ay = p.y + 26, aw = p.w - 46 - 14, ah = p.h - 26 - 22;
  const rMax = Math.max(state.a * (1 + state.e) + 0.3, 3);
  let sMax = 1; for (const h of hist) if (h.s > sMax) sMax = h.s; sMax *= 1.1;
  const xOf = (rr) => ax + Math.min(rr, rMax) / rMax * aw;
  const yOf = (ss) => ay + ah - Math.min(ss, sMax) / sMax * ah;
  const xR = xOf(2.44);
  ctx.fillStyle = 'rgba(255,80,80,0.06)'; ctx.fillRect(ax, ay, xR - ax, ah);
  ctx.strokeStyle = 'rgba(255,80,80,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xR, ay); ctx.lineTo(xR, ay + ah); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,80,80,0.75)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('r_R', xR, ay + 2);
  if (hist.length > 1) {
    ctx.strokeStyle = 'rgba(127,177,216,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
    hist.forEach((h, i) => { const X = xOf(h.r), Y = yOf(h.s); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    const last = hist[hist.length - 1];
    ctx.fillStyle = '#7fb1d8'; ctx.beginPath(); ctx.arc(xOf(last.r), yOf(last.s), 3.5, 0, 6.28); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('0', ax, ay + ah + 4);
  ctx.textAlign = 'right'; ctx.fillText(rMax.toFixed(1), ax + aw, ay + ah + 4);
  ctx.textAlign = 'center'; ctx.fillText('CoM distance r', ax + aw / 2, ay + ah + 4);
  ctx.save(); ctx.translate(p.x + 12, ay + ah / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('stream len', 0, 0); ctx.restore();
}

function tickN(nSteps) {
  if (!state.cloud) return;
  if (!state.hist) state.hist = [];
  for (let s = 0; s < nSteps; s += 1) {
    stepCloud(state.cloud, DT, state.cohesion);
    // Sample the disruption trace periodically so a single warmup call (capture)
    // still fills the diagnostic, not just the once-per-frame live path.
    if (s % 6 === 0) {
      state.hist.push({ r: comDistance(state.cloud), s: streamLength(state.cloud) });
      if (state.hist.length > 1400) state.hist.shift();
    }
  }
  // Track CoM trail
  let cx = 0, cy = 0;
  for (let i = 0; i < state.cloud.N; i += 1) { cx += state.cloud.xs[i]; cy += state.cloud.ys[i]; }
  cx /= state.cloud.N; cy /= state.cloud.N;
  state.trail.push([cx, cy]);
  if (state.trail.length > TRAIL_MAX) state.trail.shift();
}

function applyControlsRebuild() {
  state.a = parseFloat(sliderA.value);
  state.e = parseFloat(sliderE.value);
  state.cohesion = parseFloat(sliderCoh.value);
  state.speed = parseFloat(sliderSpeed.value);
  valueA.textContent = state.a.toFixed(2);
  valueE.textContent = state.e.toFixed(2);
  valueCoh.textContent = state.cohesion.toFixed(3);
  valueSpeed.textContent = state.speed.toFixed(1);
  rebuild();
  drawAll();
}

sliderA.addEventListener('change', applyControlsRebuild);
sliderE.addEventListener('change', applyControlsRebuild);
sliderCoh.addEventListener('input', () => {
  state.cohesion = parseFloat(sliderCoh.value);
  valueCoh.textContent = state.cohesion.toFixed(3);
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(1);
});
btnReset.addEventListener('click', applyControlsRebuild);
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 8000);
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
    const steps = Math.max(1, Math.round(STEPS_PER_FRAME * state.speed));
    tickN(steps);
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
  const cloud = state.cloud;
  if (!cloud) return { fields: [] };
  const len = streamLength(cloud);
  const com = comDistance(cloud);
  return {
    fields: [
      { key: 'semimajor', label: 'semi-major axis', value: state.a, format: 'float' },
      { key: 'ecc', label: 'eccentricity', value: state.e, format: 'float' },
      { key: 'cohesion', label: 'cohesion', value: state.cohesion, format: 'float' },
      { key: 'stream-length', label: 'stream length', value: len, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const cloud = state.cloud;
  if (!cloud) {
    return [{ key: 'init', label: 'cloud initializing', value: 'pending', status: 'pending' }];
  }
  const len = streamLength(cloud);
  const com = comDistance(cloud);
  const rRoche = 2.44;
  const rMin = state.a * (1 - state.e);
  const isInRoche = rMin < rRoche;
  const hasStream = len > 1.0;
  const status = (isInRoche && hasStream) ? 'pass' : (isInRoche ? 'drift' : 'pass');
  return [
    {
      key: 'roche-disruption',
      label: 'tides disrupt inside r_R',
      value: hasStream ? 'disrupted' : 'stable',
      status: status
    }
  ];
};
