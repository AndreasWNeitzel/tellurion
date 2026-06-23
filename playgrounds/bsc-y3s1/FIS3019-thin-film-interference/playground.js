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
  // Normalize for display. The factor is small (0.14) because n_film between
  // n_top and n_sub reflects only a few percent, and a soap-film-style demo
  // should still show the interference hue rather than a near-black swatch.
  const norm = N_LAM * 255 * 0.14;
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
  ctx.fillText(`d = ${state.d} nm   n_film = ${state.n.toFixed(2)}   n_top = 1.0 (air), n_sub = 1.5 (glass)`, 30, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`reflectance R(lambda) at normal incidence`, 30, 44);

  // Layout
  const padL = 30, padR = 30;
  const PANEL_W = W - padL - padR;
  const NPTS = PANEL_W - 4;

  // Per-frame autoscale: a film whose index sits between the surrounding media
  // reflects only a few percent, so a fixed R/0.4 axis flattened the curve to
  // the floor. Find the visible-band peak and scale to that with headroom.
  const Rvals = new Float64Array(NPTS);
  let Rmax = 0;
  for (let i = 0; i < NPTS; i += 1) {
    const lambda = 380 + (780 - 380) * i / (NPTS - 1);
    const R = reflectance(lambda, state.n, state.d, 1.0, 1.5);
    Rvals[i] = R;
    if (R > Rmax) Rmax = R;
  }
  const Rtop = Math.max(0.02, Rmax * 1.14);

  // Top panel: R(lambda) curve, filling most of the portrait height.
  const curveY = 66, curveH = 470;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, curveY, PANEL_W, curveH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, curveY + 0.5, PANEL_W - 1, curveH - 1);
  // Faint horizontal gridlines at quarters of the autoscaled range.
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let q = 1; q < 4; q += 1) {
    const gy = curveY + curveH - 6 - (curveH - 12) * (q / 4);
    ctx.beginPath(); ctx.moveTo(padL + 1, gy); ctx.lineTo(padL + PANEL_W - 1, gy); ctx.stroke();
  }
  // Curve
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const px = padL + 2 + i;
    const py = curveY + curveH - 6 - (curveH - 12) * Math.min(1, Rvals[i] / Rtop);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // R-axis labels (autoscaled top, zero bottom).
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'left';
  ctx.fillText(`R = ${(Rtop * 100).toFixed(1)}%`, padL + 8, curveY + 16);
  ctx.fillText('R = 0', padL + 8, curveY + curveH - 8);
  // Background strip showing spectrum colors
  for (let i = 0; i < NPTS; i += 1) {
    const lambda = 380 + (780 - 380) * i / (NPTS - 1);
    const [r, g, b] = wavelengthToRGB(lambda);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(padL + 2 + i, curveY + curveH + 6, 1, 16);
  }
  // wavelength ticks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const lam of [400, 500, 600, 700]) {
    const px = padL + 2 + (NPTS - 1) * (lam - 380) / 400;
    ctx.fillText(`${lam} nm`, px, curveY + curveH + 38);
  }

  // Bottom: large reflected-color swatch + color-vs-d history strip, filling
  // the lower portion of the portrait.
  const swatchY = curveY + curveH + 70;
  const swatchH = H - swatchY - 36;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('reflected color', padL, swatchY - 8);
  ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
  ctx.fillRect(padL, swatchY, 150, swatchH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.strokeRect(padL + 0.5, swatchY + 0.5, 149, swatchH - 1);

  // History strip: each past thickness as a vertical colour band.
  const stripX = padL + 170;
  const stripW = W - padR - stripX;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('color vs d (recent sweep history)', stripX, swatchY - 8);
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(stripX, swatchY, stripW, swatchH);
  const NHIST = state.history.length;
  if (NHIST > 0) {
    const bw = (stripW - 2) / NHIST + 1;
    for (let i = 0; i < NHIST; i += 1) {
      const c = state.history[i].color;
      const x = stripX + 1 + (stripW - 2) * i / Math.max(1, NHIST - 1);
      ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      ctx.fillRect(x, swatchY + 1, bw, swatchH - 2);
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(stripX + 0.5, swatchY + 0.5, stripW - 1, swatchH - 1);
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
