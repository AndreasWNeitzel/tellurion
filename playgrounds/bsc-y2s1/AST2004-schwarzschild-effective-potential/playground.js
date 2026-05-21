import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Schwarzschild effective-potential plot.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  veffMassive, veffPhoton, turningPoints,
  PHOTON_SPHERE, ISCO, L_ISCO, M,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });

// This template ships an empty #controls container; build the control
// DOM here (the previous code queried elements that never existed, so
// the first addEventListener threw null and the page never loaded).
const controlsHost = document.getElementById('controls');
if (controlsHost) {
  controlsHost.innerHTML = `
    <div class="row"><span>L / M</span>
      <input id="slider-L" type="range" min="2.5" max="6" step="0.01" value="4.5" aria-label="angular momentum L over M">
      <span class="value" id="value-L">4.50</span></div>
    <div class="row"><span>mode</span>
      <input id="slider-mode" type="range" min="0" max="1" step="1" value="0" aria-label="massive or photon">
      <span class="value" id="value-mode">massive</span></div>
    <div class="row"><span>speed</span>
      <input id="slider-speed" type="range" min="0" max="6" step="1" value="2" aria-label="sweep speed">
      <span class="value" id="value-speed">2</span></div>
    <div class="row buttons">
      <button id="btn-reset" type="button">Reset</button>
      <button id="btn-playpause" type="button" aria-pressed="false">Pause</button>
    </div>`;
}

const sliderL      = document.getElementById('slider-L');
const sliderMode   = document.getElementById('slider-mode');
const sliderSpeed  = document.getElementById('slider-speed');
const valueL       = document.getElementById('value-L');
const valueMode    = document.getElementById('value-mode');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  L: 4.5,
  mode: 0,         // 0 = massive, 1 = photon
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
  const tps = turningPoints(state.L);
  const isMassive = state.mode === 0;

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`L / M = ${state.L.toFixed(2)}   mode: ${isMassive ? 'massive' : 'photon'}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`L_ISCO = 2 sqrt(3) ~= ${L_ISCO.toFixed(3)}   r_photon = 3M = ${PHOTON_SPHERE}   r_ISCO = 6M = ${ISCO}`, 30, 40);

  const padL = 50, padR = 30, padT = 60, padB = 60;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;

  // Frame
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);

  // Range
  const rMin = 1.05 * 2 * M;
  const rMax = 30 * M;
  function xR(r) { return padL + (drawW) * (r - rMin) / (rMax - rMin); }
  // V range: massive is small around -0.05 to 0.05; photon is 0 to L^2/54
  const vMin = isMassive ? -0.06 : 0;
  const vMax = isMassive ?  0.06 : (state.L * state.L / 54) * 1.4;
  function yV(v) {
    const clamped = Math.max(vMin, Math.min(vMax, v));
    return padT + drawH - (drawH * (clamped - vMin) / (vMax - vMin));
  }
  // Zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(padL, yV(0)); ctx.lineTo(padL + drawW, yV(0));
  ctx.stroke();
  ctx.setLineDash([]);

  // V_eff curve
  ctx.strokeStyle = isMassive ? tok.accentCool : tok.accentWarm;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const NPTS = drawW;
  for (let i = 0; i < NPTS; i += 1) {
    const r = rMin + (rMax - rMin) * i / (NPTS - 1);
    const v = isMassive ? veffMassive(r, state.L) : veffPhoton(r, state.L);
    const px = padL + i;
    const py = yV(v);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Markers
  function vline(r, color, label) {
    const px = xR(r);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, padT); ctx.lineTo(px, padT + drawH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, px, padT + 14);
  }
  // ISCO
  vline(ISCO, '#a3d4a3', 'ISCO = 6M');
  // Photon sphere
  vline(PHOTON_SPHERE, '#f1d28a', 'r_g = 3M');
  // Horizon
  vline(2 * M, 'rgba(255, 255, 255, 0.50)', 'horizon');

  // Turning points (massive only, when in well)
  if (isMassive && tps.length === 2 && tps[0] !== tps[1]) {
    for (const r of tps) {
      const px = xR(r);
      const py = yV(veffMassive(r, state.L));
      ctx.fillStyle = '#f1d28a';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Axis ticks
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const r of [2, 6, 10, 15, 20, 25, 30]) {
    const px = xR(r);
    if (px > padL && px < padL + drawW) ctx.fillText(`${r}M`, px, padT + drawH + 14);
  }
  ctx.fillText('r / M', padL + drawW / 2, padT + drawH + 30);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.L += state.sweepDir * 0.01;
    if (state.L >= 6)   { state.L = 6;    state.sweepDir = -1; }
    if (state.L <= 2.5) { state.L = 2.5;  state.sweepDir = 1; }
  }
  valueL.textContent = state.L.toFixed(2);
  sliderL.value = state.L.toFixed(2);
}

sliderL.addEventListener('input', () => { state.L = parseFloat(sliderL.value); valueL.textContent = state.L.toFixed(2); drawAll(); });
sliderMode.addEventListener('input', () => {
  state.mode = parseInt(sliderMode.value, 10);
  valueMode.textContent = state.mode === 0 ? 'massive' : 'photon';
  drawAll();
});
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.L = 4.5; state.sweepDir = 1; sliderL.value = '4.5'; valueL.textContent = '4.50'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.L = 2.5 + frac * 3.5;
    sliderL.value = state.L.toFixed(2); valueL.textContent = state.L.toFixed(2);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
