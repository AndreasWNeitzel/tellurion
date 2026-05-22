import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Thin-film reflectance R(lambda) curve + reflected color swatch + history strip
// for the d-sweep animation.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { reflectance, wavelengthToRGB } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderD      = document.getElementById('slider-d');
const sliderN      = document.getElementById('slider-n');
const sliderSpeed  = document.getElementById('slider-speed');
const valueD       = document.getElementById('value-d');
const valueN       = document.getElementById('value-n');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  d: 350,
  n: 1.33,
  speed: 2,
  sweepDir: 1,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  history: [],   // array of {d, color} for the strip
};

// Compute reflected color by integrating R(lambda) over visible.
function reflectedColor(d, n) {
  let R = 0, G = 0, B = 0;
  const N_LAM = 60;
  for (let i = 0; i < N_LAM; i += 1) {
    const lambda = 380 + (780 - 380) * i / (N_LAM - 1);
    const r = reflectance(lambda, n, d, 1.0, 1.5);
    const [cr, cg, cb] = wavelengthToRGB(lambda);
    R += r * cr; G += r * cg; B += r * cb;
  }
  // normalize so a max-reflecting white film gives white
  const norm = N_LAM * 255 * 0.45;
  return [
    Math.min(255, R / norm * 255) | 0,
    Math.min(255, G / norm * 255) | 0,
    Math.min(255, B / norm * 255) | 0,
  ];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const [cr, cg, cb] = reflectedColor(state.d, state.n);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`d = ${state.d} nm   n_film = ${state.n.toFixed(2)}   n_top = 1.0 (air), n_sub = 1.5 (glass)`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`reflectance R(lambda) at normal incidence`, 30, 40);

  // Layout
  const padL = 30, padR = 30;
  const PANEL_W = W - padL - padR;

  // Top panel: R(lambda) curve
  const curveY = 60, curveH = 200;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, curveY, PANEL_W, curveH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, curveY + 0.5, PANEL_W - 1, curveH - 1);
  // Curve
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const NPTS = PANEL_W - 4;
  for (let i = 0; i < NPTS; i += 1) {
    const lambda = 380 + (780 - 380) * i / (NPTS - 1);
    const R = reflectance(lambda, state.n, state.d, 1.0, 1.5);
    const px = padL + 2 + i;
    const py = curveY + curveH - 4 - (curveH - 8) * Math.min(1, R / 0.4);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Background strip showing spectrum colors
  for (let i = 0; i < NPTS; i += 1) {
    const lambda = 380 + (780 - 380) * i / (NPTS - 1);
    const [r, g, b] = wavelengthToRGB(lambda);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(padL + 2 + i, curveY + curveH + 4, 1, 12);
  }
  // wavelength ticks
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const lam of [400, 500, 600, 700]) {
    const px = padL + 2 + (NPTS - 1) * (lam - 380) / 400;
    ctx.fillText(`${lam}`, px, curveY + curveH + 30);
  }
  ctx.textAlign = 'left';
  ctx.fillText('R(lambda)', padL + 6, curveY + 14);

  // Bottom: color swatch + history strip
  const swatchY = curveY + curveH + 50;
  const swatchH = 80;
  ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
  ctx.fillRect(padL, swatchY, 140, swatchH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.strokeRect(padL + 0.5, swatchY + 0.5, 139, swatchH - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('reflected color', padL, swatchY - 6);

  // History strip
  const stripX = padL + 160;
  const stripW = W - padR - stripX;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(stripX, swatchY, stripW, swatchH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(stripX + 0.5, swatchY + 0.5, stripW - 1, swatchH - 1);
  const NHIST = state.history.length;
  if (NHIST > 0) {
    for (let i = 0; i < NHIST; i += 1) {
      const c = state.history[i].color;
      const x = stripX + 1 + (stripW - 2) * i / Math.max(1, NHIST - 1);
      ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      ctx.fillRect(x, swatchY + 1, (stripW - 2) / NHIST + 1, swatchH - 2);
    }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('color vs d (recent sweep history)', stripX, swatchY - 6);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.d += state.sweepDir * 4;
    if (state.d >= 1500) { state.d = 1500; state.sweepDir = -1; }
    if (state.d <= 100)  { state.d = 100;  state.sweepDir = 1; }
    state.history.push({ d: state.d, color: reflectedColor(state.d, state.n) });
    if (state.history.length > 200) state.history.shift();
  }
  valueD.textContent = String(state.d);
  sliderD.value = String(state.d);
}

sliderD.addEventListener('input', () => { state.d = parseInt(sliderD.value, 10); valueD.textContent = String(state.d); drawAll(); });
sliderN.addEventListener('input', () => { state.n = parseFloat(sliderN.value); valueN.textContent = state.n.toFixed(2); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.d = 350; state.sweepDir = 1; state.history = []; sliderD.value = '350'; valueD.textContent = '350'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.d = Math.round(100 + frac * 1400);
    sliderD.value = String(state.d); valueD.textContent = String(state.d);
    // build history by sweeping from 100 to current d
    for (let dd = 100; dd <= state.d; dd += 8) {
      state.history.push({ d: dd, color: reflectedColor(dd, state.n) });
    }
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
    if (state.speed > 0) tickN(state.speed);
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
  const [cr, cg, cb] = reflectedColor(state.d, state.n);
  const R550 = reflectance(550, state.n, state.d, 1.0, 1.5);
  return {
    fields: [
      { key: 'film-thickness', label: 'Film thickness d (nm)', value: state.d, format: 'float' },
      { key: 'refractive-index', label: 'Refractive index n', value: state.n, format: 'float' },
      { key: 'reflectance-550', label: 'Reflectance at 550 nm', value: R550, format: 'float' },
      { key: 'color-rgb', label: 'Reflected color (RGB)', value: `(${cr},${cg},${cb})`, format: undefined },
    ],
  };
};
window.playground.getInvariants = function () {
  let allPass = true;
  for (let lambda = 380; lambda <= 780; lambda += 20) {
    const R = reflectance(lambda, state.n, state.d, 1.0, 1.5);
    if (R < 0 || R > 1) {
      allPass = false;
      break;
    }
  }
  return [
    {
      key: 'reflectance-bounds',
      label: 'Reflectance in [0,1]',
      value: allPass ? 'pass' : 'drift',
      status: allPass ? 'pass' : 'drift',
    },
  ];
};
