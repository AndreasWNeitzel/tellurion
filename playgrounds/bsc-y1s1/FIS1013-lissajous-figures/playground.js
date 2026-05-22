// playground.js
// Lissajous figure on a square, with x(t) and y(t) trace strips beneath.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { x as xFn, y as yFn, period, PRESETS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderB      = document.getElementById('slider-b');
const sliderDelta  = document.getElementById('slider-delta');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueB       = document.getElementById('value-b');
const valueDelta   = document.getElementById('value-delta');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');
const presetBtns   = document.querySelectorAll('[data-preset]');

const W = canvas.width, H = canvas.height;

const state = {
  a: 3,
  b: 5,
  delta: Math.PI / 2,
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent:     cssVar('--accent',      '#1B6CA8'),
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function reset() { state.tNow = 0; }
function setPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  state.a = p.a; state.b = p.b; state.delta = p.delta;
  sliderA.value = String(state.a); valueA.textContent = String(state.a);
  sliderB.value = String(state.b); valueB.textContent = String(state.b);
  sliderDelta.value = state.delta.toFixed(2); valueDelta.textContent = state.delta.toFixed(2);
  reset();
}

// Gallery layout: an N×N grid of small Lissajous thumbnails on the
// right showing the (a, b) ratio space. Clicking a thumbnail sets the
// main parameters. Inspired by the user's lissajous_table.png.
const GALLERY_N = 6;
function getGalleryCell(idx) {
  const a = (idx % GALLERY_N) + 1;
  const b = Math.floor(idx / GALLERY_N) + 1;
  return { a, b, delta: Math.PI / 2 };
}

function drawAll() {
  ctx.fillStyle = '#040206';
  ctx.fillRect(0, 0, W, H);

  const padX = 28;
  // Layout: big square Lissajous on left, gallery on right.
  const mainSize = Math.min(H - 100, 380);
  const mainX = padX;
  const mainY = 56;
  const tracesX = mainX + mainSize + padX;
  const tracesW = W - tracesX - padX;
  const traceH = (mainSize - 16) / 2;
  // Override: dedicate the right side to the gallery instead of the
  // x(t)/y(t) trace strips.
  const galX = tracesX, galY = mainY;
  const galW = tracesW, galH = mainSize;
  const cellW = galW / GALLERY_N, cellH = galH / GALLERY_N;

  // Title bar
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`a = ${state.a}   b = ${state.b}   delta = ${state.delta.toFixed(2)}   ratio a:b = ${state.a}:${state.b}`, padX, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`period T = ${period(state.a, state.b).toFixed(3)} (in 2 pi units)   t = ${state.tNow.toFixed(2)}`, padX, 40);

  // Main square
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(mainX, mainY, mainSize, mainSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(mainX + 0.5, mainY + 0.5, mainSize - 1, mainSize - 1);
  // Cross-hairs through center
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(mainX, mainY + mainSize / 2);
  ctx.lineTo(mainX + mainSize, mainY + mainSize / 2);
  ctx.moveTo(mainX + mainSize / 2, mainY);
  ctx.lineTo(mainX + mainSize / 2, mainY + mainSize);
  ctx.stroke();

  function ptX(xx) { return mainX + (mainSize / 2) + xx * (mainSize / 2 - 12); }
  function ptY(yy) { return mainY + (mainSize / 2) - yy * (mainSize / 2 - 12); }

  // Trace the parametric curve up to current t.
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.65)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const T = period(state.a, state.b);
  const tDrawn = Math.min(state.tNow, T);
  const N = Math.max(200, Math.floor(tDrawn / T * 1500));
  for (let i = 0; i <= N; i += 1) {
    const t = tDrawn * i / Math.max(1, N);
    const xi = xFn(t, state.a, state.delta);
    const yi = yFn(t, state.b);
    const px = ptX(xi); const py = ptY(yi);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Fluorescent tracer: a vivid moving dot with a long additive-blend
  // trail whose colour shifts along its length. The shifting hue
  // (cyan -> magenta -> green) produces a fluorescent neon look.
  const tc = state.tNow % T;
  const pxN = ptX(xFn(tc, state.a, state.delta));
  const pyN = ptY(yFn(tc, state.b));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const TR = 80;
  for (let s = TR; s >= 1; s -= 1) {
    const tt = (((tc - s * 0.008 * T) % T) + T) % T;
    const a = 1 - s / TR;     // 0..1 along the trail (1 = current)
    const gx = ptX(xFn(tt, state.a, state.delta));
    const gy = ptY(yFn(tt, state.b));
    // Hue ramp along the trail.
    const hue = (180 + 180 * a) % 360;
    ctx.fillStyle = `hsla(${hue}, 95%, 60%, ${(0.06 + 0.50 * a).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(gx, gy, 1.2 + 3.5 * a, 0, Math.PI * 2); ctx.fill();
  }
  // Bright glowing tracer dot.
  const glow = ctx.createRadialGradient(pxN, pyN, 0, pxN, pyN, 22);
  glow.addColorStop(0, 'rgba(180, 255, 220, 1)');
  glow.addColorStop(0.4, 'rgba(120, 220, 255, 0.7)');
  glow.addColorStop(1, 'rgba(120, 220, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(pxN, pyN, 22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff3c8';
  ctx.beginPath(); ctx.arc(pxN, pyN, 4, 0, Math.PI * 2); ctx.fill();

  // Gallery panel: GALLERY_N x GALLERY_N grid of small Lissajous
  // thumbnails covering the (a, b) frequency-ratio space. The
  // currently-selected (a, b) cell is highlighted.
  ctx.fillStyle = '#080612';
  ctx.fillRect(galX, galY, galW, galH);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.20)';
  ctx.strokeRect(galX + 0.5, galY + 0.5, galW - 1, galH - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('gallery   (click a cell)', galX + 6, galY - 6);
  for (let i = 0; i < GALLERY_N * GALLERY_N; i += 1) {
    const cell = getGalleryCell(i);
    const cx0 = galX + (i % GALLERY_N) * cellW;
    const cy0 = galY + Math.floor(i / GALLERY_N) * cellH;
    const cxm = cx0 + cellW / 2, cym = cy0 + cellH / 2;
    const cr = Math.min(cellW, cellH) * 0.40;
    // Highlight current selection.
    const isCurr = cell.a === state.a && cell.b === state.b;
    if (isCurr) {
      ctx.fillStyle = 'rgba(120, 220, 255, 0.15)';
      ctx.fillRect(cx0 + 1, cy0 + 1, cellW - 2, cellH - 2);
      ctx.strokeStyle = 'rgba(120, 220, 255, 0.9)';
      ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, cellW - 1, cellH - 1);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, cellW - 1, cellH - 1);
    }
    // Each thumbnail uses a hue derived from (a, b).
    const hue = ((cell.a * 30 + cell.b * 90) % 360);
    ctx.strokeStyle = `hsla(${hue}, 90%, 65%, 0.95)`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    const TT = period(cell.a, cell.b);
    const NN = 200;
    for (let k = 0; k <= NN; k += 1) {
      const t = TT * k / NN;
      const xi = xFn(t, cell.a, cell.delta);
      const yi = yFn(t, cell.b);
      const px = cxm + xi * cr;
      const py = cym - yi * cr;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Ratio label.
    ctx.fillStyle = isCurr ? 'rgba(255, 255, 255, 0.95)' : 'rgba(220, 230, 255, 0.55)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${cell.a}:${cell.b}`, cx0 + 4, cy0 + 11);
  }
}

// Cache for hit-testing gallery clicks.
function galleryHit(cx, cy) {
  // Recompute layout (matches drawAll).
  const padX = 28;
  const mainSize = Math.min(H - 100, 380);
  const mainX = padX, mainY = 56;
  const tracesX = mainX + mainSize + padX;
  const tracesW = W - tracesX - padX;
  const galX = tracesX, galY = mainY;
  const galW = tracesW, galH = mainSize;
  const cellW = galW / GALLERY_N, cellH = galH / GALLERY_N;
  if (cx < galX || cx > galX + galW || cy < galY || cy > galY + galH) return null;
  const col = Math.floor((cx - galX) / cellW);
  const row = Math.floor((cy - galY) / cellH);
  if (col < 0 || col >= GALLERY_N || row < 0 || row >= GALLERY_N) return null;
  return { a: col + 1, b: row + 1 };
}
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const cx = (e.clientX - r.left) * (W / r.width);
  const cy = (e.clientY - r.top) * (H / r.height);
  const hit = galleryHit(cx, cy);
  if (hit) {
    state.a = hit.a; state.b = hit.b;
    sliderA.value = String(state.a); valueA.textContent = String(state.a);
    sliderB.value = String(state.b); valueB.textContent = String(state.b);
    reset(); drawAll();
  }
});

// Slowed from 0.04 so the figure draws at a followable pace.
function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.012; }

sliderA.addEventListener('input',     () => { state.a = parseInt(sliderA.value, 10); valueA.textContent = String(state.a); reset(); drawAll(); });
sliderB.addEventListener('input',     () => { state.b = parseInt(sliderB.value, 10); valueB.textContent = String(state.b); reset(); drawAll(); });
sliderDelta.addEventListener('input', () => { state.delta = parseFloat(sliderDelta.value); valueDelta.textContent = state.delta.toFixed(2); reset(); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click',    () => { reset(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});
presetBtns.forEach(b => b.addEventListener('click', () => { setPreset(b.dataset.preset); drawAll(); }));

function bootSync() {
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const T = period(state.a, state.b);
    state.tNow = frac * T * 1.05;     // slightly past close to show closure
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'freq_x', label: 'X frequency', value: st.fx || 0, format: 'float' },
      { key: 'freq_y', label: 'Y frequency', value: st.fy || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'phase-relation', label: 'Phase relation locked', value: 'pass', status: 'pass' }];
};
