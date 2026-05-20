// playground.js
// MC integration: function and convergence curve.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  plainMC, importanceMC, convergence, testFn, EXACT,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderLog    = document.getElementById('slider-log');
const sliderSpeed  = document.getElementById('slider-speed');
const valueLog     = document.getElementById('value-log');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  log2N: 14,
  speed: 2,
  sweepDir: 1,
  playing: !DETERMINISTIC,
  cachedCurves: null,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function buildCurves() {
  // Compute convergence at fixed seed once.
  state.cachedCurves = {
    plain:      convergence(plainMC, 18, SEED),
    importance: convergence(importanceMC, 18, SEED),
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const N = 1 << state.log2N;
  const rPlain = plainMC(N, SEED);
  const rIS = importanceMC(N, SEED + 999);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`N = ${N}   EXACT = ${EXACT.toFixed(4)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`plain I = ${rPlain.I.toFixed(4)} +/- ${rPlain.se.toFixed(4)}   IS I = ${rIS.I.toFixed(4)} +/- ${rIS.se.toFixed(4)}`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: function
  const topY = 60, topH = 230;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  function xP(x) { return padL + 4 + (PW - 8) * x; }
  function yP(y) { return topY + topH - 4 - (topH - 12) * y / 2.0; }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = PW - 8;
  for (let i = 0; i < NPTS; i += 1) {
    const x = i / (NPTS - 1);
    const f = testFn(x);
    if (i === 0) ctx.moveTo(xP(x), yP(f)); else ctx.lineTo(xP(x), yP(f));
  }
  ctx.stroke();
  // EXACT integral line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(padL, yP(EXACT)); ctx.lineTo(padL + PW, yP(EXACT));
  ctx.stroke();
  ctx.setLineDash([]);

  // Hit-or-miss dart throw: render up to NDARTS uniform random points
  // in [0, 1] x [0, 2]; green if under f(x) (counted), red if rejected.
  // The fraction below the curve times the rectangle area is the
  // running plain-MC estimate of integral f. Deterministic mulberry32
  // seeded by N so the goldens are stable.
  const NDARTS = Math.min(N, 360);
  function mulb(seed) { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const dr = mulb((SEED + 12345 + (N & 0xFFFF)) | 0);
  let hits = 0;
  for (let i = 0; i < NDARTS; i += 1) {
    const x = dr(), y = dr() * 2.0;
    const fy = testFn(x);
    const under = y < fy;
    if (under) hits += 1;
    ctx.fillStyle = under ? 'rgba(143, 219, 130, 0.70)' : 'rgba(232, 124, 124, 0.55)';
    ctx.fillRect(xP(x) - 1.0, yP(y) - 1.0, 2.0, 2.0);
  }
  // Redraw f(x) on top so the curve stays clear of dart over-cover.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const x = i / (NPTS - 1);
    const f = testFn(x);
    if (i === 0) ctx.moveTo(xP(x), yP(f)); else ctx.lineTo(xP(x), yP(f));
  }
  ctx.stroke();

  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'left';
  ctx.fillText('f(x) = 1 + 10 (x - 0.5)^4', padL + 6, topY + 14);
  ctx.fillStyle = 'rgba(143, 219, 130, 0.95)';
  ctx.fillText(`hits ${hits}/${NDARTS}, I_hit ~ ${(2.0 * hits / NDARTS).toFixed(3)}`, padL + 6, topY + 30);

  // Bottom: convergence
  const botY = topY + topH + 30, botH = H - botY - 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, botY, PW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, PW - 1, botH - 1);
  // Plot curves: log10|error| vs log2 N
  if (!state.cachedCurves) buildCurves();
  const curves = state.cachedCurves;
  function xN(log2N) { return padL + 4 + (PW - 8) * (log2N - 4) / (18 - 4); }
  const errMin = -4, errMax = 1;
  function yE(e) {
    const l = Math.log10(Math.max(1e-6, e));
    const c = Math.max(errMin, Math.min(errMax, l));
    return botY + botH - 4 - (botH - 12) * (c - errMin) / (errMax - errMin);
  }
  for (const [data, color] of [[curves.plain, tok.accentCool], [curves.importance, tok.accentWarm]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let first = true;
    for (const pt of data) {
      const lg = Math.log2(pt.N);
      const err = Math.abs(pt.I - EXACT);
      const px = xN(lg), py = yE(err);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // 1 / sqrt(N) reference line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  let first = true;
  for (let lg = 4; lg <= 18; lg += 1) {
    const ref = 1 / Math.sqrt(1 << lg);
    const px = xN(lg), py = yE(ref);
    if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // Cursor
  const cPx = xN(state.log2N);
  ctx.strokeStyle = '#f1d28a';
  ctx.beginPath();
  ctx.moveTo(cPx, botY + 6); ctx.lineTo(cPx, botY + botH - 6);
  ctx.stroke();
  // Labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('plain MC', padL + 6, botY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('importance', padL + 90, botY + 14);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('1/sqrt(N) reference (dashed)', padL + 200, botY + 14);
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (const lg of [4, 8, 12, 16, 18]) {
    const px = xN(lg);
    ctx.fillText(`2^${lg}`, px, botY + botH - 4);
  }
  ctx.fillText('N (log scale)', padL + PW / 2, botY + botH + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.log2N += state.sweepDir * 0.1;
    if (state.log2N >= 18) { state.log2N = 18; state.sweepDir = -1; }
    if (state.log2N <= 4)  { state.log2N = 4;  state.sweepDir = 1; }
  }
  const i = Math.round(state.log2N);
  valueLog.textContent = String(i);
  sliderLog.value = String(i);
}

sliderLog.addEventListener('input', () => { state.log2N = parseInt(sliderLog.value, 10); valueLog.textContent = String(state.log2N); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.log2N = 14; state.sweepDir = 1; sliderLog.value = '14'; valueLog.textContent = '14'; state.cachedCurves = null; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  buildCurves();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.log2N = 4 + Math.round(frac * 14);
    sliderLog.value = String(state.log2N); valueLog.textContent = String(state.log2N);
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
    if (state.speed > 0) {
      tickN(state.speed);
      state.log2N = Math.round(state.log2N);
    }
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
