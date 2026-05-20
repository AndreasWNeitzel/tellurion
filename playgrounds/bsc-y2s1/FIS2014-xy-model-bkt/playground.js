// playground.js
// XY model with vortex overlay.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createXY, sweep, magnetization, energyPerSite, vortexMap, setTemperature, T_BKT } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderT      = document.getElementById('slider-T');
const sliderL      = document.getElementById('slider-L');
const sliderSpeed  = document.getElementById('slider-speed');
const valueT       = document.getElementById('value-T');
const valueL       = document.getElementById('value-L');
const valueSpeed   = document.getElementById('value-speed');
const btnCold      = document.getElementById('btn-cold');
const btnHot       = document.getElementById('btn-hot');

const W = canvas.width, H = canvas.height;
const state = { xy: null, T: 0.7, L: 64, speed: 3, playing: !DETERMINISTIC };

function rebuild(init = 'hot') {
  state.xy = createXY({ L: state.L, T: state.T, seed: SEED, init });
}

function hsv(h, s, v) {
  const c = v * s;
  const hp = (h * 6) % 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; b = 0; }
  else if (hp < 2) { r = x; g = c; b = 0; }
  else if (hp < 3) { r = 0; g = c; b = x; }
  else if (hp < 4) { r = 0; g = x; b = c; }
  else if (hp < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const m = v - c;
  return [Math.round(255 * (r + m)), Math.round(255 * (g + m)), Math.round(255 * (b + m))];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const { L, theta } = state.xy;
  const cell = Math.floor((W - 40) / L);
  const x0 = (W - L * cell) / 2, y0 = 20;
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const t = theta[j * L + i];
      const h = ((t / (2 * Math.PI)) + 1) % 1;
      // Darker palette per user feedback: lower value + slightly lower
      // saturation gives a richer, less candy-bright cell colour.
      const [r, g, b] = hsv(h, 0.80, 0.60);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell, cell);
    }
  }
  // Vortex overlay
  const { v, nPlus, nMinus } = vortexMap(state.xy);
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const c = v[j * L + i];
      if (c === 0) continue;
      const px = x0 + (i + 1) * cell;
      const py = y0 + (j + 1) * cell;
      ctx.fillStyle = c === 1 ? '#ff5050' : '#5070ff';
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2, cell * 0.35), 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, cell * L - 1, cell * L - 1);

  const m = magnetization(state.xy);
  const e = energyPerSite(state.xy);
  // Legend in the TOP-LEFT (per user request), inside a semi-opaque
  // panel so it stays readable over the colourful cell field.
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const rows = [
    ['T',            state.T.toFixed(2)],
    ['T_BKT',        T_BKT.toFixed(3)],
    ['T / T_BKT',    (state.T / T_BKT).toFixed(2)],
    ['L',            String(state.L)],
    ['|m|',          m.toFixed(3)],
    ['e/site',       e.toFixed(3)],
    ['vortices (+)', String(nPlus)],
    ['vortices (-)', String(nMinus)],
  ];
  const pad = 8;
  const panelW = 250, panelH = rows.length * 14 + pad * 2;
  ctx.fillStyle = 'rgba(10, 12, 18, 0.78)';
  ctx.fillRect(10, 10, panelW, panelH);
  ctx.strokeStyle = 'rgba(220, 225, 235, 0.45)';
  ctx.strokeRect(10.5, 10.5, panelW - 1, panelH - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
  let y = 10 + pad + 12;
  for (const [k, v2] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 18, y);
    ctx.textAlign = 'right';
    ctx.fillText(v2, 10 + panelW - 8, y);
    y += 14;
  }
  ctx.textAlign = 'left';
}

function tickN(n) { if (state.xy) sweep(state.xy, n); }

sliderT.addEventListener('input', () => {
  state.T = parseFloat(sliderT.value);
  valueT.textContent = state.T.toFixed(2);
  if (state.xy) setTemperature(state.xy, state.T);
});
sliderL.addEventListener('change', () => {
  state.L = parseInt(sliderL.value, 10);
  valueL.textContent = String(state.L);
  rebuild('hot'); drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnCold.addEventListener('click', () => { rebuild('cold'); drawAll(); });
btnHot.addEventListener('click', () => { rebuild('hot'); drawAll(); });
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    state.playing = !state.playing;
    btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  });
}

function bootSync() {
  rebuild('hot');
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const Ts = [0.20, 0.60, T_BKT, 1.30, 2.20];
    state.T = Ts[Math.min(Ts.length - 1, Math.round(frac * (Ts.length - 1)))];
    sliderT.value = state.T.toFixed(2);
    valueT.textContent = state.T.toFixed(2);
    setTemperature(state.xy, state.T);
    sweep(state.xy, 200);
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
  if (state.playing) { tickN(state.speed); drawAll(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
