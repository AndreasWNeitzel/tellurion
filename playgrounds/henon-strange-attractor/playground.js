// playground.js
// Henon strange attractor. 100k iterates plotted as dim dots in (x, y);
// live max-Lyapunov readout.

import { henonStep, henonMaxLyapunov, DEFAULT_PARAMS } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderB      = document.getElementById('slider-b');
const valueA       = document.getElementById('value-a');
const valueB       = document.getElementById('value-b');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW = { xmin: -1.5, xmax: 1.5, ymin: -0.45, ymax: 0.45 };
const TOTAL_POINTS = 100_000;
const POINTS_PER_FRAME = 1500;

const state = {
  params:  { ...DEFAULT_PARAMS },
  current: { x: 0.1, y: 0.1 },
  pointsDrawn: 0,
  lambda1: 0,
  playing: !DETERMINISTIC,
  rafId: null,
};

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const COL = { accent: cssVar('--accent', '#1B6CA8'), warm: cssVar('--accent-warm', '#C13B27') };

function px(x, y) {
  return {
    px: W * (x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin),
    py: H * (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)),
  };
}

function clear() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
}

function drawReadout() {
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['a', state.params.a.toFixed(3)],
    ['b', state.params.b.toFixed(3)],
    ['lambda_1', state.lambda1.toFixed(3)],
    ['n', String(state.pointsDrawn)],
  ];
  const xL = W - 170, xR = W - 16;
  let y = 20;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillText(v, xR, y);
    y += 14;
  }
}

function drawAll() {
  clear();
  drawReadout();
}

function plotN(n) {
  ctx.fillStyle = COL.accent;
  let s = state.current;
  for (let i = 0; i < n; i += 1) {
    s = henonStep(s, state.params);
    const p = px(s.x, s.y);
    ctx.fillRect(p.px, p.py, 1, 1);
  }
  state.current = s;
  state.pointsDrawn += n;
  drawReadout();
}

function rebuild() {
  clear();
  drawReadout();
  state.current = { x: 0.1, y: 0.1 };
  state.pointsDrawn = 0;
  // warmup
  for (let i = 0; i < 500; i += 1) state.current = henonStep(state.current, state.params);
  // compute lambda once (cheap)
  state.lambda1 = henonMaxLyapunov(0.1, 0.1, 4000, state.params, 100, 1000);
}

function applyControls() {
  state.params.a = parseFloat(sliderA.value);
  state.params.b = parseFloat(sliderB.value);
  valueA.textContent = state.params.a.toFixed(2);
  valueB.textContent = state.params.b.toFixed(2);
  rebuild();
}
sliderA.addEventListener('change', applyControls);
sliderB.addEventListener('change', applyControls);
btnReset.addEventListener('click', applyControls);
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    plotN(Math.round(frac * TOTAL_POINTS));
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
  if (state.playing && state.pointsDrawn < TOTAL_POINTS) {
    plotN(POINTS_PER_FRAME);
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
