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
// Uniform-scale view: the Henon attractor is wide and flat, so map it with one
// scale into a top band (no per-axis stretch that distorts its true shape).
// The lower canvas carries the Lyapunov-vs-a diagnostic.
const ATT = { cx: W / 2, cy: 198, scale: (W - 48) / 3 };
const DIAG = { x: 40, y: 360, w: W - 80, h: H - 360 - 16 };
const A_MIN = 0.9, A_MAX = 1.41, NA = 68;

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
  return { px: ATT.cx + x * ATT.scale, py: ATT.cy - y * ATT.scale };
}

// Lyapunov exponent vs a (at the current b), built once and on each b change.
let lyapCurve = [];
let curveB = null;
function buildLyapCurve() {
  lyapCurve = [];
  for (let i = 0; i <= NA; i += 1) {
    const a = A_MIN + (A_MAX - A_MIN) * i / NA;
    let l = henonMaxLyapunov(0.1, 0.1, 2200, { a, b: state.params.b }, 100, 700);
    if (!Number.isFinite(l)) l = 0;
    lyapCurve.push([a, Math.max(-0.8, Math.min(0.8, l))]);
  }
  curveB = state.params.b;
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

function drawDiagnostic() {
  const { x, y, w, h } = DIAG;
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(226,232,240,0.18)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(226,232,240,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('Lyapunov exponent vs a   (> 0: chaos;  dips below 0: periodic windows)', x + 10, y + 16);
  const plT = y + 28, plB = y + h - 30, plL = x + 46, plR = x + w - 12;
  let lo = -0.4, hi = 0.5;
  for (const [, l] of lyapCurve) { if (l < lo) lo = l; if (l > hi) hi = l; }
  const xA = (a) => plL + (a - A_MIN) / (A_MAX - A_MIN) * (plR - plL);
  const yL = (l) => plB - (l - lo) / (hi - lo) * (plB - plT);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(plL, plT); ctx.lineTo(plL, plB); ctx.lineTo(plR, plB); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.55)'; ctx.textAlign = 'center';
  for (let a = 1.0; a <= 1.4; a += 0.1) ctx.fillText(a.toFixed(1), xA(a), plB + 14);
  if (lo < 0 && hi > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(plL, yL(0)); ctx.lineTo(plR, yL(0)); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.fillText('0', plL - 4, yL(0) + 3);
  }
  if (lyapCurve.length > 1) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6; ctx.beginPath();
    lyapCurve.forEach(([a, l], i) => { const X = xA(a), Y = yL(l); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
    ctx.stroke();
  }
  // current operating point: read off the curve so the marker stays on the line
  const a = state.params.a;
  if (a >= A_MIN && a <= A_MAX && lyapCurve.length > 1) {
    const idx = Math.max(0, Math.min(NA, (a - A_MIN) / (A_MAX - A_MIN) * NA));
    const i0 = Math.floor(idx), i1 = Math.min(NA, i0 + 1), fr = idx - i0;
    const lAt = lyapCurve[i0][1] * (1 - fr) + lyapCurve[i1][1] * fr;
    ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xA(a), plT); ctx.lineTo(xA(a), plB); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(xA(a), yL(lAt), 4.5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#8893a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.fillText('a', (plL + plR) / 2, plB + 28);
  ctx.save(); ctx.translate(x + 14, (plT + plB) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = 'rgba(180,190,210,0.7)'; ctx.fillText('lambda_1', 0, 0); ctx.restore();
}

function drawAll() {
  paintBg();
  drawDiagnostic();
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
  if (curveB !== state.params.b) buildLyapCurve();
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'parameter-a', label: 'Parameter a', value: state.params.a, format: 'float' },
      { key: 'parameter-b', label: 'Parameter b', value: state.params.b, format: 'float' },
      { key: 'position-x', label: 'Current x', value: state.current.x, format: 'float' },
      { key: 'position-y', label: 'Current y', value: state.current.y, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const x = state.current.x;
  const y = state.current.y;
  const attractor_bounded = Math.abs(x) <= 2.0 && Math.abs(y) <= 0.6;
  const status = attractor_bounded ? 'pass' : 'drift';
  return [
    {
      key: 'attractor-bounded',
      label: 'Orbit bounded (strange attractor)',
      value: attractor_bounded ? 'pass' : `x=${x.toFixed(3)}`,
      status: status
    }
  ];
};
