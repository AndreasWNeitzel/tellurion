import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Runge vs Chebyshev: live interpolation and error curves.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  rungeFn, equispacedNodes, chebyshevNodes, buildInterp, maxError,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-n');
const sliderSpeed  = document.getElementById('slider-speed');
const valueN       = document.getElementById('value-n');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  n: 12,
  speed: 2,
  sweepDir: 1,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const eqNodes = equispacedNodes(state.n);
  const chNodes = chebyshevNodes(state.n);
  const pEq = buildInterp(eqNodes, rungeFn);
  const pCh = buildInterp(chNodes, rungeFn);
  const eEq = maxError(pEq, rungeFn);
  const eCh = maxError(pCh, rungeFn);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`n = ${state.n}   equispaced max error = ${eEq.toExponential(2)}   Chebyshev max error = ${eCh.toExponential(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`Runge function f(x) = 1 / (1 + 25 x^2) on [-1, 1]`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: interpolation curves
  const topY = 60, topH = 280;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  // y range
  const yMin = -1.5, yMax = 2.0;
  function xP(x) { return padL + 4 + (PW - 8) * (x + 1) / 2; }
  function yP(y) {
    const yc = Math.max(yMin, Math.min(yMax, y));
    return topY + topH - 4 - (topH - 12) * (yc - yMin) / (yMax - yMin);
  }
  // True function (white)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = PW - 8;
  for (let i = 0; i < NPTS; i += 1) {
    const x = -1 + 2 * i / (NPTS - 1);
    const y = rungeFn(x);
    if (i === 0) ctx.moveTo(xP(x), yP(y)); else ctx.lineTo(xP(x), yP(y));
  }
  ctx.stroke();
  // Equispaced (orange)
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const x = -1 + 2 * i / (NPTS - 1);
    const y = pEq(x);
    if (i === 0) ctx.moveTo(xP(x), yP(y)); else ctx.lineTo(xP(x), yP(y));
  }
  ctx.stroke();
  // Chebyshev (cyan)
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const x = -1 + 2 * i / (NPTS - 1);
    const y = pCh(x);
    if (i === 0) ctx.moveTo(xP(x), yP(y)); else ctx.lineTo(xP(x), yP(y));
  }
  ctx.stroke();
  // Nodes
  for (const xn of eqNodes) {
    const px = xP(xn), py = yP(rungeFn(xn));
    ctx.fillStyle = tok.accentWarm;
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
  }
  for (const xn of chNodes) {
    const px = xP(xn), py = yP(rungeFn(xn));
    ctx.fillStyle = tok.accentCool;
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('f(x) (truth)', padL + 6, topY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('equispaced', padL + 100, topY + 14);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('Chebyshev', padL + 210, topY + 14);

  // Bottom: error vs n curve
  const botY = topY + topH + 30, botH = H - botY - 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, botY, PW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, PW - 1, botH - 1);
  // Log scale for error
  const nMin = 4, nMax = 30;
  function xN(nn) { return padL + 4 + (PW - 8) * (nn - nMin) / (nMax - nMin); }
  const errMin = -16, errMax = 8;  // log10(error)
  function yE(e) {
    const l = Math.log10(Math.max(1e-16, e));
    const c = Math.max(errMin, Math.min(errMax, l));
    return botY + botH - 4 - (botH - 12) * (c - errMin) / (errMax - errMin);
  }
  // Plot points and lines
  for (const [nodesFn, color] of [[equispacedNodes, tok.accentWarm], [chebyshevNodes, tok.accentCool]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let first = true;
    for (let nn = nMin; nn <= nMax; nn += 1) {
      const p = buildInterp(nodesFn(nn), rungeFn);
      const e = maxError(p, rungeFn, 200);
      const px = xN(nn), py = yE(e);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Cursor at current n
  const cPx = xN(state.n);
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cPx, botY + 6); ctx.lineTo(cPx, botY + botH - 6);
  ctx.stroke();
  // Labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('max error vs n (log scale)', padL + 6, botY + 14);
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center';
  for (const nn of [5, 10, 15, 20, 25, 30]) {
    const px = xN(nn);
    if (px >= padL) ctx.fillText(`${nn}`, px, botY + botH - 4);
  }
  ctx.fillText('n', padL + PW / 2, botY + botH + 14);
}

function tickN(k) {
  for (let i = 0; i < k; i += 1) {
    state.n += state.sweepDir * 0.1;
    if (state.n >= 30) { state.n = 30; state.sweepDir = -1; }
    if (state.n <= 4)  { state.n = 4;  state.sweepDir = 1; }
  }
  const ni = Math.round(state.n);
  valueN.textContent = String(ni);
  sliderN.value = String(ni);
}

sliderN.addEventListener('input', () => { state.n = parseInt(sliderN.value, 10); valueN.textContent = String(state.n); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.n = 12; state.sweepDir = 1; sliderN.value = '12'; valueN.textContent = '12'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.n = Math.max(4, Math.round(4 + frac * 26));
    sliderN.value = String(state.n); valueN.textContent = String(state.n);
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
      state.n = Math.round(state.n);
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


// === Diagnostics interface (Layout System v2) ===
// State reports the polynomial degree and the equispaced and
// Chebyshev sup-norm errors at that degree. The invariant is the
// Runge phenomenon itself: at high degree, equispaced interpolation
// of the Runge function blows up while Chebyshev nodes keep the
// error controlled, so the equispaced/Chebyshev error ratio >> 1.
window.playground = window.playground || {};
window.playground.getState = function () {
  const n = state.n;
  return {
    fields: [
      { key: 'degree', label: 'polynomial degree n', value: String(n) },
      { key: 'equi-error', label: 'equispaced max error', value: maxError(buildInterp(equispacedNodes(n), rungeFn), rungeFn), format: 'float' },
      { key: 'cheb-error', label: 'Chebyshev max error', value: maxError(buildInterp(chebyshevNodes(n), rungeFn), rungeFn), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const N = 24;
  const eqErr = maxError(buildInterp(equispacedNodes(N), rungeFn), rungeFn);
  const chErr = maxError(buildInterp(chebyshevNodes(N), rungeFn), rungeFn);
  const ratio = eqErr / Math.max(1e-12, chErr);
  return [{
    key: 'runge',
    label: 'Chebyshev nodes tame the Runge phenomenon (degree 24)',
    value: `equi/cheb error = ${ratio.toExponential(1)}`,
    status: ratio > 1 ? 'pass' : 'drift',
  }];
};
