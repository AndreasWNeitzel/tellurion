import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Paraxial Gaussian beam: render intensity field, overlay +/- w(z), mark
// Rayleigh range.

import { viridis } from '../../../shared/js/render/colormaps.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  intensityField, spotRadius, rayleighRange, divergenceAngle,
  powerThroughAperture,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderW0     = document.getElementById('slider-w0');
const sliderLam    = document.getElementById('slider-lambda');
const sliderZmax   = document.getElementById('slider-zmax');
const valueW0      = document.getElementById('value-w0');
const valueLam     = document.getElementById('value-lambda');
const valueZmax    = document.getElementById('value-zmax');

const W = canvas.width, H = canvas.height;

const state = {
  w0: 0.20,
  lambda: 0.020,
  zMax: 4.0,
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PLOT_X = 60, PLOT_W = W - 100;
  const PLOT_Y = 30, PLOT_H = H - 100;
  const rMax = 4 * state.w0;

  const Nz = 320, Nr = 200;
  const { field, zR } = intensityField({ Nz, Nr, zMax: state.zMax, rMax, w0: state.w0, lambda: state.lambda });

  // Build image: row j (top -> bottom) = r values from +rMax to -rMax; column i = z
  const img = new ImageData(Nz, Nr);
  // Gamma 0.5 to keep faint tails visible.
  for (let j = 0; j < Nr; j += 1) {
    for (let i = 0; i < Nz; i += 1) {
      // Flip vertical: top row of image is +rMax
      const flippedJ = Nr - 1 - j;
      const t = Math.pow(Math.max(0, Math.min(1, field[flippedJ * Nz + i])), 0.5);
      const c = viridis(t);
      const idx = (j * Nz + i) * 4;
      img.data[idx + 0] = c.r;
      img.data[idx + 1] = c.g;
      img.data[idx + 2] = c.b;
      img.data[idx + 3] = 255;
    }
  }
  const off = new OffscreenCanvas(Nz, Nr);
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, PLOT_X, PLOT_Y, PLOT_W, PLOT_H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PLOT_X, PLOT_Y, PLOT_W, PLOT_H);

  function toPx(z, r) {
    return {
      px: PLOT_X + PLOT_W * (z + state.zMax) / (2 * state.zMax),
      py: PLOT_Y + PLOT_H * (1 - (r + rMax) / (2 * rMax)),
    };
  }

  // +/- w(z) overlay
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  for (const sign of [1, -1]) {
    ctx.beginPath();
    const NWZ = 200;
    for (let i = 0; i < NWZ; i += 1) {
      const z = -state.zMax + (2 * state.zMax) * (i / (NWZ - 1));
      const w = spotRadius(z, state.w0, zR);
      const p = toPx(z, sign * w);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Rayleigh range markers
  if (zR < state.zMax) {
    for (const z of [-zR, +zR]) {
      const top = toPx(z, +rMax);
      const bot = toPx(z, -rMax);
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.5)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(top.px, top.py); ctx.lineTo(bot.px, bot.py);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Beam waist marker
  const w0Top = toPx(0, +state.w0);
  const w0Bot = toPx(0, -state.w0);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(w0Top.px, w0Top.py); ctx.lineTo(w0Bot.px, w0Bot.py);
  ctx.stroke();

  // Axis labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i += 1) {
    const z = -state.zMax + (2 * state.zMax) * (i / 4);
    const t = toPx(z, -rMax);
    ctx.fillText(z.toFixed(1), t.px, t.py + 14);
  }
  ctx.fillText('z (axial position)', PLOT_X + PLOT_W / 2, PLOT_Y + PLOT_H + 32);

  ctx.save();
  ctx.translate(PLOT_X - 18, PLOT_Y + PLOT_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('r (radial)', 0, 0);
  ctx.restore();

  // Readout
  const theta = divergenceAngle(state.w0, state.lambda);
  const M2 = 1.0;  // perfect TEM_00
  const rows = [
    ['w_0',       state.w0.toFixed(3)],
    ['lambda',    state.lambda.toFixed(3)],
    ['z_R',       zR.toFixed(3)],
    ['theta',     theta.toFixed(4) + ' rad'],
    ['M^2',       M2.toFixed(1)],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  let y = PLOT_Y + PLOT_H + 50;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, PLOT_X, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, PLOT_X + 200, y);
    y += 14;
    if (y > H - 10) break;
  }
}

sliderW0.addEventListener('input', () => {
  state.w0 = parseFloat(sliderW0.value);
  valueW0.textContent = state.w0.toFixed(3);
  drawAll();
});
sliderLam.addEventListener('input', () => {
  state.lambda = parseFloat(sliderLam.value);
  valueLam.textContent = state.lambda.toFixed(3);
  drawAll();
});
sliderZmax.addEventListener('input', () => {
  state.zMax = parseFloat(sliderZmax.value);
  valueZmax.textContent = state.zMax.toFixed(1);
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const samples = [
      { w0: 0.10, lambda: 0.020, zMax: 2.0 },
      { w0: 0.20, lambda: 0.020, zMax: 4.0 },
      { w0: 0.30, lambda: 0.020, zMax: 6.0 },
      { w0: 0.20, lambda: 0.040, zMax: 6.0 },
      { w0: 0.10, lambda: 0.040, zMax: 8.0 },
    ];
    const s = samples[Math.min(samples.length - 1, Math.round(frac * (samples.length - 1)))];
    state.w0 = s.w0; state.lambda = s.lambda; state.zMax = s.zMax;
    sliderW0.value = state.w0.toString();
    sliderLam.value = state.lambda.toString();
    sliderZmax.value = state.zMax.toString();
    valueW0.textContent = state.w0.toFixed(3);
    valueLam.textContent = state.lambda.toFixed(3);
    valueZmax.textContent = state.zMax.toFixed(1);
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
  }
}

// Animate w_0 slowly so the beam pulses.
let animTime = 0;
let paused = false;
let userOverride = false;
sliderW0.addEventListener('input', () => { userOverride = true; });
sliderLam.addEventListener('input', () => { userOverride = true; });
sliderZmax.addEventListener('input', () => { userOverride = true; });
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.008;
    state.w0 = 0.22 + 0.16 * Math.sin(animTime);
    sliderW0.value = state.w0.toFixed(3);
    valueW0.textContent = state.w0.toFixed(3);
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
