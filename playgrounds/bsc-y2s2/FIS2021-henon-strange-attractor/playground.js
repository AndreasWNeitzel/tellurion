import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Henon strange attractor. We render in two layers:
//   1. A faint background of all visited points (so the attractor's shape
//      builds up over time).
//   2. A bright current point with a fading trail of the last ~ 120 iterates,
//      so the user can see the orbit actually jumping around.
//
// The single-point-with-trail rendering is the same pattern that makes the
// Lorenz attractor readable: the user wants to see motion, not a static
// dot dust.

import { henonStep, henonMaxLyapunov, DEFAULT_PARAMS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderB      = document.getElementById('slider-b');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueB       = document.getElementById('value-b');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlay      = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW = { xmin: -1.5, xmax: 1.5, ymin: -0.45, ymax: 0.45 };

// Background "shape buildup" buffer in pixel space. We accumulate visited
// pixels at a low alpha so the attractor's silhouette gradually fills in
// while the active trail stays bright.
let bgBuffer = null;

const state = {
  params:  { ...DEFAULT_PARAMS },
  current: { x: 0.1, y: 0.1 },
  trail:   [],            // recent points for the bright trail
  pointsDrawn: 0,
  lambda1: 0,
  speed: 6,               // iterations per frame; user-adjustable
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  rafId: null,
};

const TRAIL_MAX = 120;

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const COL = {
  accent: cssVar('--accent', '#1B6CA8'),
  warm:   cssVar('--accent-warm', '#C13B27'),
  faint:  cssVar('--fg-faint', '#9A9C9F'),
};

function px(x, y) {
  return {
    px: W * (x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin),
    py: H * (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)),
  };
}

function clearBackground() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!bgBuffer) bgBuffer = ctx.createImageData(W, H);
  for (let i = 0; i < bgBuffer.data.length; i += 4) {
    bgBuffer.data[i] = 6; bgBuffer.data[i + 1] = 6; bgBuffer.data[i + 2] = 8; bgBuffer.data[i + 3] = 255;
  }
}

function depositBg(p) {
  const ix = Math.round(p.px), iy = Math.round(p.py);
  if (ix < 0 || ix >= W || iy < 0 || iy >= H) return;
  const idx = (iy * W + ix) * 4;
  // tint the pixel toward the accent color
  const cur = bgBuffer.data;
  cur[idx]     = Math.min(255, cur[idx]     + 25);
  cur[idx + 1] = Math.min(255, cur[idx + 1] + 50);
  cur[idx + 2] = Math.min(255, cur[idx + 2] + 90);
}

function paintBg() {
  ctx.putImageData(bgBuffer, 0, 0);
}

function drawTrail() {
  if (state.trail.length < 1) return;
  // Successive Henon iterates are spatially scattered (the map is
  // chaotic), so they must be drawn as a point cloud, NOT connected by
  // lines. Recent iterates are bright dots fading with age over the
  // persistent attractor stippled into the background buffer.
  for (let i = 0; i < state.trail.length; i += 1) {
    const t = (i + 1) / state.trail.length;
    const p = px(state.trail[i].x, state.trail[i].y);
    ctx.fillStyle = `rgba(193, 59, 39, ${(0.12 + 0.7 * t).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 1.6, 0, 2 * Math.PI);
    ctx.fill();
  }
  const last = state.trail[state.trail.length - 1];
  const p = px(last.x, last.y);
  ctx.fillStyle = COL.warm;
  ctx.beginPath();
  ctx.arc(p.px, p.py, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

function drawReadout() {
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const rows = [
    ['a',         state.params.a.toFixed(3)],
    ['b',         state.params.b.toFixed(3)],
    ['lambda_1',  state.lambda1.toFixed(3)],
    ['iter',      String(state.pointsDrawn)],
  ];
  const xL = W - 170, xR = W - 16;
  let y = 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText(v, xR, y);
    y += 14;
  }
}

function drawAll() {
  paintBg();
  drawTrail();
  drawReadout();
}

function iterateN(n) {
  let s = state.current;
  for (let i = 0; i < n; i += 1) {
    s = henonStep(s, state.params);
    state.trail.push({ x: s.x, y: s.y });
    if (state.trail.length > TRAIL_MAX) state.trail.shift();
    depositBg(px(s.x, s.y));
    state.pointsDrawn += 1;
  }
  state.current = s;
}

function rebuild() {
  clearBackground();
  state.current = { x: 0.1, y: 0.1 };
  state.trail = [];
  state.pointsDrawn = 0;
  // warmup to land on the attractor
  for (let i = 0; i < 500; i += 1) state.current = henonStep(state.current, state.params);
  state.lambda1 = henonMaxLyapunov(0.1, 0.1, 4000, state.params, 100, 1000);
}

function applyControls() {
  state.params.a = parseFloat(sliderA.value);
  state.params.b = parseFloat(sliderB.value);
  state.speed = parseInt(sliderSpeed.value, 10);
  valueA.textContent = state.params.a.toFixed(2);
  valueB.textContent = state.params.b.toFixed(2);
  valueSpeed.textContent = String(state.speed);
  rebuild();
}
sliderA.addEventListener('change', applyControls);
sliderB.addEventListener('change', applyControls);
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnReset.addEventListener('click', applyControls);
btnPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    iterateN(Math.round(frac * 60_000));
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing && state.pointsDrawn < 200_000) {
    iterateN(state.speed);
    drawAll();
  }
  state.rafId = requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
