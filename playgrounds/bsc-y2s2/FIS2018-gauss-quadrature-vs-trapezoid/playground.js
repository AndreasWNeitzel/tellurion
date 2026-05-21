import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Side-by-side quadrature: f(x) + nodes + log-error convergence.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { gaussLegendre, trapezoid, testFns, GL } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-n');
const sliderFn     = document.getElementById('slider-fn');
const sliderSpeed  = document.getElementById('slider-speed');
const valueN       = document.getElementById('value-n');
const valueFn      = document.getElementById('value-fn');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const FN_NAMES = ['cos', 'gaussian', 'runge', 'sqrt-abs'];

const state = {
  n: 8,
  fnIdx: 0,
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
  const fnKey = FN_NAMES[state.fnIdx];
  const { fn, exact } = testFns[fnKey];
  const eGL = Math.abs(gaussLegendre(fn, state.n) - exact);
  const eTr = Math.abs(trapezoid(fn, state.n) - exact);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`n = ${state.n}   f = ${fnKey}   exact = ${exact.toFixed(6)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`GL error = ${eGL.toExponential(2)}   trap error = ${eTr.toExponential(2)}`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: function with nodes
  const topY = 60, topH = 280;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  // Auto-range y for current function
  let yLo = Infinity, yHi = -Infinity;
  for (let i = 0; i < 400; i += 1) {
    const x = -1 + 2 * i / 399;
    const y = fn(x);
    if (y < yLo) yLo = y;
    if (y > yHi) yHi = y;
  }
  const ymarg = (yHi - yLo) * 0.1;
  yLo -= ymarg; yHi += ymarg;
  function xP(x) { return padL + 4 + (PW - 8) * (x + 1) / 2; }
  function yP(y) { return topY + topH - 4 - (topH - 12) * (y - yLo) / (yHi - yLo); }
  const NPTS = PW - 8;

  // Trapezoid panels shaded (so the user SEES the linear-interpolation
  // approximation that gives the trap rule its name).
  const trH = 2 / state.n;
  ctx.fillStyle = 'rgba(214, 138, 105, 0.18)';
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.lineWidth = 1.0;
  for (let k = 0; k < state.n; k += 1) {
    const xL = -1 + k * trH;
    const xR = -1 + (k + 1) * trH;
    const yL = fn(xL), yR = fn(xR);
    const yBase = Math.max(yLo, 0);
    ctx.beginPath();
    ctx.moveTo(xP(xL), yP(yBase));
    ctx.lineTo(xP(xL), yP(yL));
    ctx.lineTo(xP(xR), yP(yR));
    ctx.lineTo(xP(xR), yP(yBase));
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // GL bars: width 2 / n centred on each node, height set to f(node),
  // alpha proportional to weight (so the eye reads which nodes
  // contribute most to the integral).
  const glN = GL[state.n];
  let wMax = 0; for (const w of glN.weights) if (w > wMax) wMax = w;
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.55)';
  for (let k = 0; k < glN.nodes.length; k += 1) {
    const xc = glN.nodes[k], yc = fn(xc), wc = glN.weights[k];
    const halfW = (PW - 8) / (NPTS - 1) * 1.4;
    const yBase = Math.max(yLo, 0);
    ctx.fillStyle = `rgba(127, 177, 216, ${0.12 + 0.32 * wc / wMax})`;
    ctx.beginPath();
    ctx.rect(xP(xc) - halfW, Math.min(yP(yc), yP(yBase)), 2 * halfW, Math.abs(yP(yc) - yP(yBase)));
    ctx.fill(); ctx.stroke();
  }

  // Function curve drawn LAST so it sits cleanly on top.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const x = -1 + 2 * i / (NPTS - 1);
    const y = fn(x);
    if (i === 0) ctx.moveTo(xP(x), yP(y)); else ctx.lineTo(xP(x), yP(y));
  }
  ctx.stroke();
  // Trapezoid node dots and GL node dots on top of the shading.
  for (let k = 0; k <= state.n; k += 1) {
    const xt = -1 + k * trH;
    ctx.fillStyle = tok.accentWarm;
    ctx.beginPath(); ctx.arc(xP(xt), yP(fn(xt)), 3.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const xc of glN.nodes) {
    ctx.fillStyle = tok.accentCool;
    ctx.beginPath(); ctx.arc(xP(xc), yP(fn(xc)), 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // Physics-context caption per function.
  const PHYSICS = {
    'cos':       'cos x: simple-harmonic-oscillator energy integral',
    'gaussian':  'exp(-4 x^2): Maxwell-Boltzmann / partition-function kernel',
    'runge':     '1 / (1 + 25 x^2): Runge phenomenon (polynomial-fit pitfall)',
    'sqrt-abs':  'sqrt|x|: integrand with an algebraic singularity at 0',
  };
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(`f(x)`, padL + 6, topY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('trapezoid panels', padL + 60, topY + 14);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('Gauss-Legendre bars (alpha ~ weight)', padL + 200, topY + 14);
  ctx.fillStyle = 'rgba(220, 220, 220, 0.70)';
  ctx.fillText(PHYSICS[fnKey] ?? '', padL + 6, topY + topH - 8);

  // Bottom: convergence
  const botY = topY + topH + 30, botH = H - botY - 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, botY, PW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, PW - 1, botH - 1);
  const nMin = 2, nMax = 16;
  function xN(nn) { return padL + 4 + (PW - 8) * (nn - nMin) / (nMax - nMin); }
  const errMin = -16, errMax = 1;
  function yE(e) {
    const l = Math.log10(Math.max(1e-16, e));
    const c = Math.max(errMin, Math.min(errMax, l));
    return botY + botH - 4 - (botH - 12) * (c - errMin) / (errMax - errMin);
  }
  // Trap and GL curves
  for (const [qfn, color] of [[trapezoid, tok.accentWarm], [gaussLegendre, tok.accentCool]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let first = true;
    for (let nn = nMin; nn <= nMax; nn += 1) {
      const e = Math.abs(qfn(fn, nn) - exact);
      const px = xN(nn), py = yE(e);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Cursor
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
  ctx.fillText('log10(|error|) vs n', padL + 6, botY + 14);
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center';
  for (const nn of [2, 4, 6, 8, 10, 12, 14, 16]) {
    const px = xN(nn);
    ctx.fillText(`${nn}`, px, botY + botH - 4);
  }
}

function tickN(k) {
  for (let i = 0; i < k; i += 1) {
    state.n += state.sweepDir * 0.1;
    if (state.n >= 16) { state.n = 16; state.sweepDir = -1; }
    if (state.n <= 2)  { state.n = 2;  state.sweepDir = 1; }
  }
  const ni = Math.round(state.n);
  valueN.textContent = String(ni);
  sliderN.value = String(ni);
}

sliderN.addEventListener('input', () => { state.n = parseInt(sliderN.value, 10); valueN.textContent = String(state.n); drawAll(); });
sliderFn.addEventListener('input', () => {
  state.fnIdx = parseInt(sliderFn.value, 10);
  valueFn.textContent = FN_NAMES[state.fnIdx];
  drawAll();
});
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.n = 8; state.sweepDir = 1; sliderN.value = '8'; valueN.textContent = '8'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.n = 2 + Math.round(frac * 14);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
