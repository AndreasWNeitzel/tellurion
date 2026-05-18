// playground.js
// Beats from superposition of two close-frequency cosines. Top: y1(t) and
// y2(t) overlaid. Middle: sum with envelope. Bottom: spectrum bars.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
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
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

// Decaying trails for the oscillating cursor dots (sum, y1, y2). Cleared
// when the sweep wraps so the comet does not streak across the panel.
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
  // zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  // label
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 6, y + 14);
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

  // Title bar
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`f_1 = ${state.f1.toFixed(2)} Hz   f_2 = ${state.f2.toFixed(2)} Hz`, padX, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`carrier f_bar = ${carrierFreq(state.f1, state.f2).toFixed(3)}   envelope f_b = ${envelopeFreq(state.f1, state.f2).toFixed(3)}   audible beat = ${beatRate(state.f1, state.f2).toFixed(3)} Hz`, padX, 40);

  // Panel layout: 3 stacked
  const panelGap = 14;
  const panelH = (H - 60 - 3 * panelGap - 20) / 3;
  const panelY0 = 56;
  const panelY1 = panelY0 + panelH + panelGap;
  const panelY2 = panelY1 + panelH + panelGap;

  // Panel 1: y1, y2
  drawPanel(padX, panelY0, PANEL_W, panelH, 'y_1(t) and y_2(t)');
  plotFunc(padX + 1, panelY0, PANEL_W - 2, panelH, (t) => y1(t, state.f1), -1.1, 1.1, tok.accentCool);
  plotFunc(padX + 1, panelY0, PANEL_W - 2, panelH, (t) => y2(t, state.f2), -1.1, 1.1, tok.accentWarm);

  // Panel 2: y1 + y2 with envelope
  drawPanel(padX, panelY1, PANEL_W, panelH, 'y_1(t) + y_2(t) (with envelope shadow)');
  // envelope shadow (upper and lower)
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
  // axis ticks
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  for (let f = 0; f <= 9; f += 1) {
    const px = xF(f);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.beginPath();
    ctx.moveTo(px, panelY2 + panelH - 4);
    ctx.lineTo(px, panelY2 + panelH);
    ctx.stroke();
    ctx.fillText(String(f), px, panelY2 + panelH - 8);
  }
  // bars at f1 and f2
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
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText(`f_1`, xF(state.f1) + 4, panelY2 + 28);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText(`f_2`, xF(state.f2) + 4, panelY2 + 44);

  // The time window scrolls with state.tNow (oscilloscope), so the
  // left edge is "now". A fixed reference line marks it; the dots show
  // the instantaneous y1, y2 and their sum entering the scope. Trails
  // are cleared only on reset (tNow advances monotonically).
  ctx.strokeStyle = 'rgba(241, 210, 138, 0.70)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const cx = padX + 1;
  ctx.moveTo(cx, panelY0);
  ctx.lineTo(cx, panelY1 + panelH);
  ctx.stroke();

  // Oscillating dots with decaying trails: y1, y2 on panel 1 and the
  // resultant on panel 2, sampled at the current time (left edge).
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
  // Slowed an order of magnitude (was 0.02) so the beat is followable.
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
