// playground.js
// Lissajous figure on a square, with x(t) and y(t) trace strips beneath.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { x as xFn, y as yFn, period, PRESETS } from './sim.js';

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
  playing: !DETERMINISTIC,
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

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const padX = 28;
  // Layout: big square Lissajous on left, two trace strips on right.
  const mainSize = Math.min(H - 100, 380);
  const mainX = padX;
  const mainY = 56;
  const tracesX = mainX + mainSize + padX;
  const tracesW = W - tracesX - padX;
  const traceH = (mainSize - 16) / 2;

  // Title bar
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
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
  // Pen position
  const xi = xFn(state.tNow % T, state.a, state.delta);
  const yi = yFn(state.tNow % T, state.b);
  ctx.fillStyle = '#f1d28a';
  ctx.beginPath();
  ctx.arc(ptX(xi), ptY(yi), 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // x(t) trace
  function drawTrace(panelY, color, fn, label) {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(tracesX, panelY, tracesW, traceH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(tracesX + 0.5, panelY + 0.5, tracesW - 1, traceH - 1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath();
    ctx.moveTo(tracesX, panelY + traceH / 2);
    ctx.lineTo(tracesX + tracesW, panelY + traceH / 2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const Nt = tracesW - 2;
    for (let i = 0; i < Nt; i += 1) {
      const t = T * i / (Nt - 1);
      if (t > state.tNow) break;
      const v = fn(t);
      const px = tracesX + 1 + i;
      const py = panelY + (traceH / 2) - v * (traceH / 2 - 6);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // pen on trace
    const tcur = state.tNow % T;
    const Nti = Math.max(0, Math.floor(tcur / T * (Nt - 1)));
    const v = fn(tcur);
    const px = tracesX + 1 + Nti;
    const py = panelY + (traceH / 2) - v * (traceH / 2 - 6);
    ctx.fillStyle = '#f1d28a';
    ctx.beginPath();
    ctx.arc(px, py, 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(label, tracesX + 6, panelY + 14);
  }
  drawTrace(mainY,                       tok.accentCool, (t) => xFn(t, state.a, state.delta), 'x(t)');
  drawTrace(mainY + traceH + 16,         tok.accentWarm, (t) => yFn(t, state.b),              'y(t)');
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.04; }

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
