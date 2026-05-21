import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Hydrogen orbital |psi_nlm|^2 in the (x, z) plane.

import { viridis } from '../../../shared/js/render/colormaps.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { densityField, ORBITALS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selOrbital   = document.getElementById('select-orbital');
const sliderSpan   = document.getElementById('slider-span');
const sliderGamma  = document.getElementById('slider-gamma');
const valueSpan    = document.getElementById('value-span');
const valueGamma   = document.getElementById('value-gamma');

const W = canvas.width, H = canvas.height;
const state = {
  idx: 4,                        // 3s by default; rich radial nodes
  span: ORBITALS[4].span,
  gamma: 0.40,
};

function fillOptions() {
  selOrbital.innerHTML = '';
  for (let i = 0; i < ORBITALS.length; i += 1) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = ORBITALS[i].label;
    if (i === state.idx) opt.selected = true;
    selOrbital.appendChild(opt);
  }
}

const readoutNLM = document.getElementById('readout-nlm');
const readoutNodes = document.getElementById('readout-nodes');
const readoutSpan = document.getElementById('readout-span');

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const PLOT_SIDE = Math.min(W - 20, H - 80);
  const PLOT_X = (W - PLOT_SIDE) / 2;
  const PLOT_Y = 30;
  const orb = ORBITALS[state.idx];
  if (readoutNLM) readoutNLM.textContent = `(${orb.n}, ${orb.l}, ${orb.m})`;
  if (readoutNodes) readoutNodes.textContent = String(orb.n - orb.l - 1);
  if (readoutSpan) readoutSpan.textContent = state.span.toFixed(1);

  const NF = 256;
  const { field, zMax } = densityField({ n: orb.n, l: orb.l, m: orb.m, N: NF, span: state.span });
  const img = new ImageData(NF, NF);
  for (let j = 0; j < NF; j += 1) {
    for (let i = 0; i < NF; i += 1) {
      const t = Math.pow(Math.max(0, Math.min(1, field[(NF - 1 - j) * NF + i] / Math.max(1e-30, zMax))), state.gamma);
      const c = viridis(t);
      const idx = (j * NF + i) * 4;
      img.data[idx]     = c.r;
      img.data[idx + 1] = c.g;
      img.data[idx + 2] = c.b;
      img.data[idx + 3] = 255;
    }
  }
  const off = new OffscreenCanvas(NF, NF);
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, PLOT_X, PLOT_Y, PLOT_SIDE, PLOT_SIDE);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PLOT_X, PLOT_Y, PLOT_SIDE, PLOT_SIDE);

  // Axis labels and centered cross-hair
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('x (a_0)', PLOT_X + PLOT_SIDE / 2, PLOT_Y + PLOT_SIDE + 22);
  ctx.save();
  ctx.translate(PLOT_X - 16, PLOT_Y + PLOT_SIDE / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('z (a_0)', 0, 0);
  ctx.restore();

  // Tick marks at +/- span
  ctx.textAlign = 'right';
  ctx.fillText('+' + state.span, PLOT_X + PLOT_SIDE - 4, PLOT_Y + 12);
  ctx.textAlign = 'left';
  ctx.fillText('-' + state.span, PLOT_X + 4, PLOT_Y + PLOT_SIDE - 4);

  // Top-right labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const E = -1 / (2 * orb.n * orb.n);  // hydrogen energy in Hartree
  const rows = [
    ['n', String(orb.n)],
    ['l', String(orb.l)],
    ['m', String(orb.m)],
    ['E (Hartree)', E.toFixed(4)],
    ['E (eV)', (E * 27.2114).toFixed(3)],
  ];
  let y = 20;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 12, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 180, y);
    y += 14;
  }
}

selOrbital.addEventListener('change', () => {
  state.idx = parseInt(selOrbital.value, 10);
  state.span = ORBITALS[state.idx].span;
  sliderSpan.value = String(state.span);
  valueSpan.textContent = String(state.span);
  drawAll();
});
sliderSpan.addEventListener('input', () => {
  state.span = parseFloat(sliderSpan.value);
  valueSpan.textContent = String(state.span);
  drawAll();
});
sliderGamma.addEventListener('input', () => {
  state.gamma = parseFloat(sliderGamma.value);
  valueGamma.textContent = state.gamma.toFixed(2);
  drawAll();
});

function bootSync() {
  fillOptions();
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const idxs = [0, 2, 4, 6, 8];   // 1s, 2p_z, 3s, 3d_z2, 4f_z3
    state.idx = idxs[Math.min(idxs.length - 1, Math.round(frac * (idxs.length - 1)))];
    state.span = ORBITALS[state.idx].span;
    selOrbital.value = String(state.idx);
    sliderSpan.value = String(state.span);
    valueSpan.textContent = String(state.span);
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

// Animation: cycle through the orbital list slowly.
let animFrame = 0;
let paused = false;
let userOverride = false;
selOrbital.addEventListener('change', () => { userOverride = true; });
sliderSpan.addEventListener('input', () => { userOverride = true; });
sliderGamma.addEventListener('input', () => { userOverride = true; });
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
    animFrame += 1;
    if (animFrame % 180 === 0) {
      state.idx = (state.idx + 1) % ORBITALS.length;
      state.span = ORBITALS[state.idx].span;
      selOrbital.value = String(state.idx);
      sliderSpan.value = String(state.span);
      valueSpan.textContent = String(state.span);
      drawAll();
    }
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
