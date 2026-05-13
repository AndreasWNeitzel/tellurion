// playground.js
// Arnold cat map on a small pixel grid. Initial pattern: a circle / "cat"
// silhouette drawn with two tones so the iterations are visually striking.

import { applyForwardPixel, recurrencePeriod, LYAP_EXACT } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-N');
const sliderIter   = document.getElementById('slider-iter');
const valueN       = document.getElementById('value-N');
const valueIter    = document.getElementById('value-iter');
const btnReset     = document.getElementById('btn-reset');
const btnStep      = document.getElementById('btn-step');
const btnPlay      = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  N: 64,
  iter: 0,
  grid: null,
  initGrid: null,
  buffer: null,
  period: null,
  playing: false,
  rafLast: 0,
  rafId: null,
};

function makeInitGrid(N) {
  const g = new Uint8Array(N * N);
  // Draw a filled cat silhouette: an ellipse for the head plus two ear triangles.
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      const xc = i + 0.5 - N / 2;
      const yc = j + 0.5 - N / 2;
      // head: ellipse centered at (0, 2), radii (rx, ry) = (0.36 N, 0.30 N)
      const inHead = (xc / (0.36 * N)) ** 2 + ((yc - 0.05 * N) / (0.30 * N)) ** 2 < 1;
      // left ear: triangle with apex above-left of head
      const inLeftEar = yc < -0.15 * N && yc > -0.35 * N && (xc + 0.2 * N) > Math.abs(yc + 0.25 * N) * 0.8 && xc < -0.05 * N;
      const inRightEar = yc < -0.15 * N && yc > -0.35 * N && -(xc - 0.2 * N) > Math.abs(yc + 0.25 * N) * 0.8 && xc > 0.05 * N;
      g[j * N + i] = (inHead || inLeftEar || inRightEar) ? 1 : 0;
    }
  }
  return g;
}

function rebuildGrid() {
  state.N = parseInt(sliderN.value, 10);
  valueN.textContent = String(state.N);
  state.initGrid = makeInitGrid(state.N);
  state.grid = new Uint8Array(state.initGrid);
  state.buffer = new Uint8Array(state.N * state.N);
  state.iter = 0;
  sliderIter.value = '0';
  valueIter.textContent = '0';
  state.period = recurrencePeriod(state.initGrid, state.N, 256);
}

function stepOnce() {
  applyForwardPixel(state.grid, state.N, state.buffer);
  const t = state.grid; state.grid = state.buffer; state.buffer = t;
  state.iter += 1;
  sliderIter.value = String(state.iter);
  valueIter.textContent = String(state.iter);
}

function stepTo(n) {
  // re-build from initGrid and step n times to land at exact iter.
  state.grid = new Uint8Array(state.initGrid);
  state.buffer = new Uint8Array(state.N * state.N);
  state.iter = 0;
  while (state.iter < n) stepOnce();
}

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const tok = {
  bg:  cssVar('--bg', '#FBFBF9'),
  fg:  cssVar('--fg', '#1A1B1C'),
  accent: cssVar('--accent', '#1B6CA8'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
};

function draw() {
  ctx.fillStyle = tok.bg;
  ctx.fillRect(0, 0, W, H);

  // Reserve right-side readout. The grid takes a square area on the left.
  const drawSize = Math.min(W - 240, H - 40);
  const x0 = 20, y0 = (H - drawSize) / 2;
  const cell = drawSize / state.N;
  ctx.fillStyle = tok.fg;
  ctx.fillRect(x0, y0, drawSize, drawSize);
  ctx.fillStyle = tok.accent;
  for (let j = 0; j < state.N; j += 1) {
    for (let i = 0; i < state.N; i += 1) {
      if (state.grid[j * state.N + i]) {
        ctx.fillRect(x0 + i * cell, y0 + j * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
  // border
  ctx.strokeStyle = tok.fgMuted;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, drawSize - 1, drawSize - 1);

  // readout
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.fg;
  const rows = [
    ['N',         String(state.N)],
    ['iter',      String(state.iter)],
    ['period',    state.period > 0 ? String(state.period) : '> 256'],
    ['mod period', state.period > 0 ? String(state.iter % state.period) : '-'],
    ['lambda_1',  LYAP_EXACT.toFixed(4)],
  ];
  const xL = W - 220, xR = W - 16;
  let y = y0 + 16;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = tok.fgMuted; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = tok.fg; ctx.fillText(v, xR, y);
    y += 16;
  }
}

sliderN.addEventListener('change', () => { rebuildGrid(); draw(); });
sliderIter.addEventListener('input', () => {
  const target = parseInt(sliderIter.value, 10);
  stepTo(target);
  draw();
});
btnReset.addEventListener('click', () => { rebuildGrid(); draw(); });
btnStep.addEventListener('click', () => { stepOnce(); draw(); });
btnPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuildGrid();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 48);
    stepTo(target);
    draw();
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
  draw();
}

function tick(now) {
  if (state.playing) {
    if (!state.rafLast || (now - state.rafLast) > 220) {
      stepOnce();
      draw();
      state.rafLast = now;
    }
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
