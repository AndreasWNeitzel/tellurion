// playground.js
// Beats from superposition of two close-frequency cosines. Top: y1(t)
// and y2(t) overlaid. Middle: sum with envelope. Bottom: spectrum bars.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { setCanvasFont } from '../../../shared/js/canvas-type.js';
import {
  y1, y2, ySum, envelope, envelopeFreq, beatRate, carrierFreq,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderF1     = document.getElementById('slider-f1');
const sliderF2     = document.getElementById('slider-f2');
const sliderSpeed  = document.getElementById('slider-speed');
const valueF1      = document.getElementById('value-f1');
const valueF2      = document.getElementById('value-f2');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const T_WINDOW = 8.0;

const state = {
  f1: 5.0,
  f2: 4.7,
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

const trails = { sum: [], y1: [], y2: [] };
function pushTrail(key, x, y) {
  const a = trails[key];
  a.push({ x, y });
  if (a.length > 46) a.shift();
}
function drawTrail(key, rgb) {
  const a = trails[key];
  for (let i = 1; i < a.length; i += 1) {
    ctx.strokeStyle = `rgba(${rgb}, ${0.05 + 0.55 * (i / a.length)})`;
    ctx.lineWidth = 1 + 1.8 * (i / a.length);
    ctx.beginPath(); ctx.moveTo(a[i - 1].x, a[i - 1].y); ctx.lineTo(a[i].x, a[i].y); ctx.stroke();
  }
}

function reset() { state.tNow = 0; trails.sum.length = 0; trails.y1.length = 0; trails.y2.length = 0; }

function drawPanel(x, y, w, h, label) {
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  setCanvasFont(ctx, canvas, 'caption', { family: 'mono', align: 'left' });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(label, x + 6, y + 16);
}

function plotFunc(x, y, w, h, fn, yMin, yMax, color, lw = 1.2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  const N = w;
  for (let i = 0; i < N; i += 1) {
    const t = state.tNow + (i / (N - 1)) * T_WINDOW;
    const yval = fn(t);
    const yClamped = Math.max(yMin, Math.min(yMax, yval));
    const px = x + i;
    const py = y + h * (1 - (yClamped - yMin) / (yMax - yMin));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const padX = 30;
  const PANEL_W = W - 2 * padX;

  // Title-bar state (f1, f2, carrier, beat rate) now lives in the rail.
  const panelGap = 14;
  const panelY0 = 16;
  const panelH = (H - panelY0 - 3 * panelGap - 14) / 3;
  const panelY1 = panelY0 + panelH + panelGap;
  const panelY2 = panelY1 + panelH + panelGap;

  // Panel 1: y1, y2
  drawPanel(padX, panelY0, PANEL_W, panelH, 'y_1(t) and y_2(t)');
  plotFunc(padX + 1, panelY0, PANEL_W - 2, panelH, (t) => y1(t, state.f1), -1.1, 1.1, tok.accentCool);
  plotFunc(padX + 1, panelY0, PANEL_W - 2, panelH, (t) => y2(t, state.f2), -1.1, 1.1, tok.accentWarm);

  // Panel 2: y1 + y2 with envelope
  drawPanel(padX, panelY1, PANEL_W, panelH, 'y_1(t) + y_2(t) (with envelope shadow)');
  ctx.strokeStyle = 'rgba(241, 210, 138, 0.45)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < PANEL_W - 2; i += 1) {
    const t = state.tNow + (i / (PANEL_W - 3)) * T_WINDOW;
    const env = Math.abs(envelope(t, state.f1, state.f2));
    const px = padX + 1 + i;
    const py = panelY1 + panelH * (1 - (env - (-2.2)) / 4.4);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < PANEL_W - 2; i += 1) {
    const t = state.tNow + (i / (PANEL_W - 3)) * T_WINDOW;
    const env = -Math.abs(envelope(t, state.f1, state.f2));
    const px = padX + 1 + i;
    const py = panelY1 + panelH * (1 - (env - (-2.2)) / 4.4);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  plotFunc(padX + 1, panelY1, PANEL_W - 2, panelH, (t) => ySum(t, state.f1, state.f2), -2.2, 2.2, '#f1d28a', 1.3);

  // Panel 3: spectrum bars
  drawPanel(padX, panelY2, PANEL_W, panelH, 'spectrum |Y(f)|');
  function xF(f) { return padX + 6 + (PANEL_W - 12) * (f - 0) / 9.0; }
  setCanvasFont(ctx, canvas, 'tick', { family: 'mono', align: 'center' });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let f = 0; f <= 9; f += 1) {
    const px = xF(f);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.beginPath();
    ctx.moveTo(px, panelY2 + panelH - 4);
    ctx.lineTo(px, panelY2 + panelH);
    ctx.stroke();
    ctx.fillText(String(f), px, panelY2 + panelH - 8);
  }
  function bar(f, color) {
    const px = xF(f);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, panelY2 + panelH - 14);
    ctx.lineTo(px, panelY2 + 24);
    ctx.stroke();
  }
  bar(state.f1, tok.accentCool);
  bar(state.f2, tok.accentWarm);
  setCanvasFont(ctx, canvas, 'tick', { family: 'mono', align: 'left' });
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('f_1', xF(state.f1) + 4, panelY2 + 28);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('f_2', xF(state.f2) + 4, panelY2 + 44);

  // Scrolling-scope reference line + instantaneous dots with trails.
  ctx.strokeStyle = 'rgba(241, 210, 138, 0.70)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const cx = padX + 1;
  ctx.moveTo(cx, panelY0);
  ctx.lineTo(cx, panelY1 + panelH);
  ctx.stroke();

  const y1v = y1(state.tNow, state.f1), y2v = y2(state.tNow, state.f2);
  const py1 = panelY0 + panelH * (1 - (Math.max(-1.1, Math.min(1.1, y1v)) + 1.1) / 2.2);
  const py2 = panelY0 + panelH * (1 - (Math.max(-1.1, Math.min(1.1, y2v)) + 1.1) / 2.2);
  pushTrail('y1', cx, py1); pushTrail('y2', cx, py2);
  drawTrail('y1', '127, 177, 216'); drawTrail('y2', '214, 138, 105');
  ctx.fillStyle = tok.accentCool; ctx.beginPath(); ctx.arc(cx, py1, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tok.accentWarm; ctx.beginPath(); ctx.arc(cx, py2, 3, 0, Math.PI * 2); ctx.fill();

  const ys = ySum(state.tNow, state.f1, state.f2);
  const ydot = panelY1 + panelH * (1 - (ys - (-2.2)) / 4.4);
  pushTrail('sum', cx, ydot);
  drawTrail('sum', '241, 210, 138');
  ctx.fillStyle = '#f1d28a';
  ctx.beginPath();
  ctx.arc(cx, ydot, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) state.tNow += 0.002;
}

sliderF1.addEventListener('input', () => { state.f1 = parseFloat(sliderF1.value); valueF1.textContent = state.f1.toFixed(2); drawAll(); });
sliderF2.addEventListener('input', () => { state.f2 = parseFloat(sliderF2.value); valueF2.textContent = state.f2.toFixed(2); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { reset(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * T_WINDOW;
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
window.playground.getState = function getState() {
  return {
    fields: [
      { key: 'f1', label: 'frequency f₁', value: state.f1, unit: 'Hz', format: 'fixed-3' },
      { key: 'f2', label: 'frequency f₂', value: state.f2, unit: 'Hz', format: 'fixed-3' },
      { key: 'carrier', label: 'carrier f̄', value: carrierFreq(state.f1, state.f2), unit: 'Hz', format: 'fixed-3' },
      { key: 'envelope', label: 'envelope f_b', value: envelopeFreq(state.f1, state.f2), unit: 'Hz', format: 'fixed-3' },
      { key: 'beat', label: 'audible beat', value: beatRate(state.f1, state.f2), unit: 'Hz', format: 'fixed-3' },
    ],
  };
};
window.playground.getInvariants = function getInvariants() {
  // Trig-identity checks for the closed-form superposition.
  const f1 = state.f1, f2 = state.f2;
  const mk = (key, label, value, tol) => ({
    key, label, value, tolerance: tol,
    status: Math.abs(value) < tol ? 'pass' : 'drift',
  });
  return [
    mk('beat_rate', 'beat = |f₁ - f₂|', beatRate(f1, f2) - Math.abs(f1 - f2), 1e-9),
    mk('carrier', 'carrier = (f₁+f₂)/2', carrierFreq(f1, f2) - (f1 + f2) / 2, 1e-9),
    mk('envelope', 'envelope = |f₁-f₂|/2', envelopeFreq(f1, f2) - Math.abs(f1 - f2) / 2, 1e-9),
  ];
};
