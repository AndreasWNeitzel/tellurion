// playground.js
// Lissajous figures: x(t) = A sin(a t + delta), y(t) = B sin(b t).
//
// Vertical 4:5 composition:
//   1. HERO: the square figure with its two drivers drawn on the margins, an
//      x oscillation above and a y oscillation to the left. Dashed guides carry
//      the current x and y onto the traced dot, so the figure reads as two
//      perpendicular oscillations combined, not a magic curve.
//   2. GALLERY: a grid of frequency ratios. Tap one to load it.

import { x as xFn, y as yFn, period } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderA = document.getElementById('slider-a');
const sliderB = document.getElementById('slider-b');
const sliderDelta = document.getElementById('slider-delta');
const sliderSpeed = document.getElementById('slider-speed');
const valueA = document.getElementById('value-a');
const valueB = document.getElementById('value-b');
const valueDelta = document.getElementById('value-delta');
const valueSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');
const presetBtns = document.querySelectorAll('[data-preset]');

// Full a:b matrix (columns a = 1..A_MAX, rows b = 1..B_MAX). A matrix, not a
// row of picks, so the transpose pairs sit mirrored across the diagonal and you
// can see a:b is not just a rotated b:a once the phase is non-trivial.
const A_MAX = 5, B_MAX = 5;

const state = {
  a: 3, b: 5, delta: Math.PI / 2, speed: 2, tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
let galleryCells = [];

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'hero', weight: 3.0 },
    { name: 'gallery', weight: 1.7 },
  ]);
}

function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }
function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'),
    panel: '#0a0c12',
    fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)',
    accent: g('--accent', '#ffd166'),
    cool: '#7fb1d8',
    warm: '#e0925f',
    border: 'rgba(255,255,255,0.12)',
  };
}
function panel(col, r) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

function reset() { state.tNow = 0; }

function drawHero(col) {
  const r = REG.hero;
  panel(col, r);
  const pad = 12;
  const drvLeft = 60, drvTop = 56;
  const topUI = 30;
  const figSize = Math.min(r.w - drvLeft - pad - 6, r.h - drvTop - topUI - pad - 6);
  const figX = r.x + drvLeft + 4;
  const figY = r.y + topUI + drvTop;
  const half = figSize / 2 - 8;
  const cxF = figX + figSize / 2, cyF = figY + figSize / 2;
  const ptX = (xx) => cxF + xx * half;
  const ptY = (yy) => cyF - yy * half;
  const T = period(state.a, state.b);
  const tc = state.tNow % T;

  // Figure frame + crosshairs.
  ctx.fillStyle = '#07090f';
  ctx.fillRect(figX, figY, figSize, figSize);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(figX + 0.5, figY + 0.5, figSize - 1, figSize - 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.moveTo(figX, cyF); ctx.lineTo(figX + figSize, cyF);
  ctx.moveTo(cxF, figY); ctx.lineTo(cxF, figY + figSize);
  ctx.stroke();

  // Full figure (faint) so the shape is always visible.
  ctx.strokeStyle = 'rgba(127,177,216,0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const NF = 1400;
  for (let i = 0; i <= NF; i += 1) {
    const t = T * i / NF;
    const px = ptX(xFn(t, state.a, state.delta)), py = ptY(yFn(t, state.b));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Bright recent trail, coloured along its length with viridis.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const TR = 90;
  for (let s = TR; s >= 1; s -= 1) {
    const u = 1 - s / TR;                 // 0 (old) .. 1 (now)
    const tt = (((tc - s * 0.006 * T) % T) + T) % T;
    const c = viridis(u);
    ctx.fillStyle = rgba(c, (0.05 + 0.5 * u).toFixed(3));
    ctx.beginPath();
    ctx.arc(ptX(xFn(tt, state.a, state.delta)), ptY(yFn(tt, state.b)), 1 + 3.2 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const xc = xFn(tc, state.a, state.delta);
  const yc = yFn(tc, state.b);
  const dotX = ptX(xc), dotY = ptY(yc);

  // x driver above the figure: x value on the horizontal (aligned with the
  // figure), time increasing upward; head sits at the figure edge.
  const xStripBot = figY - 6, xStripTop = r.y + topUI + 4;
  const xWin = 1.6 * (2 * Math.PI / state.a);
  const xTS = (xStripBot - xStripTop) / xWin;
  ctx.strokeStyle = col.warm; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const tau = tc - xWin * i / 120;
    const py = xStripBot - (tc - tau) * xTS;
    const px = ptX(xFn(tau, state.a, state.delta));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // y driver left of the figure: y value on the vertical, time increasing left.
  const yStripRight = figX - 6, yStripLeft = r.x + 8;
  const yWin = 1.6 * (2 * Math.PI / state.b);
  const yTS = (yStripRight - yStripLeft) / yWin;
  ctx.strokeStyle = col.cool; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const tau = tc - yWin * i / 120;
    const px = yStripRight - (tc - tau) * yTS;
    const py = ptY(yFn(tau, state.b));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Projection guides from each driver head to the dot.
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dotX, xStripBot); ctx.lineTo(dotX, dotY);   // vertical from x driver
  ctx.moveTo(yStripRight, dotY); ctx.lineTo(dotX, dotY); // horizontal from y driver
  ctx.stroke();
  ctx.setLineDash([]);
  // Driver heads.
  ctx.fillStyle = col.warm;
  ctx.beginPath(); ctx.arc(dotX, xStripBot, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col.cool;
  ctx.beginPath(); ctx.arc(yStripRight, dotY, 3.2, 0, Math.PI * 2); ctx.fill();

  // The tracing dot.
  const glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 18);
  glow.addColorStop(0, 'rgba(255,243,200,0.9)');
  glow.addColorStop(1, 'rgba(255,243,200,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(dotX, dotY, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3c8';
  ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill();

  // Driver labels + readout.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillStyle = col.warm; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('x = sin(a t + δ)', figX + 2, r.y + topUI - 2);
  ctx.save();
  ctx.translate(r.x + 12, figY + figSize - 2); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = col.cool; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('y = sin(b t)', 0, 0);
  ctx.restore();
  ctx.font = fontString(canvas, 'mono', 'mono');
  ctx.fillStyle = col.fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`a:b = ${state.a}:${state.b}   δ ${state.delta.toFixed(2)}`, r.x + 10, r.y + 8);
}

function drawGallery(col) {
  const r = REG.gallery;
  panel(col, r);
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('ratio matrix a:b  (every cell at the shared phase δ — tap one)', r.x + 8, r.y + 6);

  const pad = 8, top = r.y + 24;
  const cw = (r.w - pad * 2) / A_MAX;
  const ch = (r.y + r.h - top - pad) / B_MAX;
  galleryCells = [];
  for (let bi = 1; bi <= B_MAX; bi += 1) {
    for (let ai = 1; ai <= A_MAX; ai += 1) {
      const cxi = r.x + pad + (ai - 1) * cw;
      const cyi = top + (bi - 1) * ch;
      galleryCells.push({ a: ai, b: bi, x: cxi, y: cyi, w: cw, h: ch });
      const isCur = ai === state.a && bi === state.b;
      // Distinct colour per cell across the matrix (viridis, not rainbow).
      const tcol = viridis(((bi - 1) * A_MAX + (ai - 1)) / (A_MAX * B_MAX - 1));
      if (isCur) { ctx.fillStyle = rgba(tcol, 0.20); ctx.fillRect(cxi + 1, cyi + 1, cw - 2, ch - 2); }
      ctx.strokeStyle = isCur ? col.accent : 'rgba(255,255,255,0.10)';
      ctx.lineWidth = isCur ? 1.6 : 1;
      ctx.strokeRect(cxi + 0.5, cyi + 0.5, cw - 1, ch - 1);
      // Thumbnail at the CURRENT shared phase delta, so dragging the phase
      // reshapes the whole matrix and a:b stops looking like a rotated b:a.
      const mxi = cxi + cw / 2, myi = cyi + ch / 2 + 4;
      const rr = Math.min(cw, ch) * 0.34;
      ctx.strokeStyle = isCur ? col.accent : rgba(tcol, 0.95);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      const TT = period(ai, bi), NN = 200;
      for (let k = 0; k <= NN; k += 1) {
        const t = TT * k / NN;
        const px = mxi + xFn(t, ai, state.delta) * rr;
        const py = myi - yFn(t, bi) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.font = fontString(canvas, 'tick', 'mono');
      ctx.fillStyle = isCur ? col.accent : col.muted;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`${ai}:${bi}`, cxi + 3, cyi + 2);
    }
  }
}

function drawAll() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawHero(col);
  drawGallery(col);
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.012; }

function applyAB(a, b) {
  state.a = a; state.b = b;
  sliderA.value = String(a); valueA.textContent = String(a);
  sliderB.value = String(b); valueB.textContent = String(b);
  reset();
}

sliderA.addEventListener('input', () => { state.a = parseInt(sliderA.value, 10); valueA.textContent = String(state.a); reset(); drawAll(); });
sliderB.addEventListener('input', () => { state.b = parseInt(sliderB.value, 10); valueB.textContent = String(state.b); reset(); drawAll(); });
sliderDelta.addEventListener('input', () => { state.delta = parseFloat(sliderDelta.value); valueDelta.textContent = state.delta.toFixed(2); reset(); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { reset(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});
presetBtns.forEach((b) => b.addEventListener('click', () => {
  const [pa, pb] = b.dataset.preset.split(':').map(Number);
  applyAB(pa, pb); state.delta = Math.PI / 2; sliderDelta.value = '1.57'; valueDelta.textContent = '1.57';
  drawAll();
}));

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (view.w / rect.width);
  const cy = (e.clientY - rect.top) * (view.h / rect.height);
  for (const cell of galleryCells) {
    if (cx >= cell.x && cx <= cell.x + cell.w && cy >= cell.y && cy <= cell.y + cell.h) {
      applyAB(cell.a, cell.b);   // keep the current phase so the matrix and the hero share delta
      drawAll();
      return;
    }
  }
});

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); drawAll(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  valueA.textContent = String(state.a);
  valueB.textContent = String(state.b);
  valueDelta.textContent = state.delta.toFixed(2);
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * period(state.a, state.b) * 1.05;
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) { tickN(state.speed); drawAll(); }
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
      { key: 'freq-x', label: 'x frequency a', value: state.a, format: 'float' },
      { key: 'freq-y', label: 'y frequency b', value: state.b, format: 'float' },
      { key: 'phase', label: 'phase offset delta (rad)', value: state.delta, format: 'float' },
      { key: 'period', label: 'period T (2pi units)', value: period(state.a, state.b), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const rational = Number.isInteger(state.a) && Number.isInteger(state.b);
  return [{
    key: 'closed-curve',
    label: 'closed curve when the ratio a/b is rational',
    value: rational ? 'a/b rational' : 'a/b irrational',
    status: rational ? 'pass' : 'pending',
  }];
};
