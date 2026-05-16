// playground.js
// Triangular AF Ising lattice render.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createAF, sweep, magnetization, energyPerSite, frustratedFraction, setTemperature } from './sim.js';

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

const state = {
  af: null,
  L: 64,
  T: 0.5,
  speed: 3,
  playing: !DETERMINISTIC,
};

function rebuild(init = 'hot') {
  state.af = createAF({ L: state.L, T: state.T, seed: SEED, init });
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const { L, spins } = state.af;
  const cell = Math.floor((W - 40) / L);
  const x0 = 20, y0 = 20;
  // Render as flat grid (no row offset). Triangular neighbor logic lives in
  // sim.js; the visual layout is a clean square grid for readability.
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      ctx.fillStyle = spins[j * L + i] === 1 ? '#1B6CA8' : '#C13B27';
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell, cell);
    }
  }
  // Frustration overlay: mark every triangular plaquette whose three
  // spins are all equal (maximally frustrated under AF coupling). This
  // makes the geometric frustration visible, so the low-T maze reads as
  // a degenerate frustrated state rather than a broken "ordered" one.
  ctx.fillStyle = 'rgba(255, 222, 89, 0.85)';
  for (let j = 0; j < L; j += 1) {
    const jD = (j + 1) % L;
    for (let i = 0; i < L; i += 1) {
      const a = spins[j * L + i];
      const b = spins[j * L + ((i + 1) % L)];
      const c = spins[jD * L + i];
      if (a === b && b === c) {
        const fx = x0 + (i + 0.5) * cell + cell * 0.33;
        const fy = y0 + (j + 0.5) * cell + cell * 0.33;
        const rr = Math.max(1, cell * 0.22);
        ctx.beginPath(); ctx.arc(fx, fy, rr, 0, 2 * Math.PI); ctx.fill();
      }
    }
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, cell * L - 1, cell * L - 1);
  ctx.fillStyle = 'rgba(255, 222, 89, 0.95)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('yellow dot = frustrated plaquette (3 equal spins; AF cannot satisfy all bonds)', 20, y0 + cell * L + 16);

  // Readout
  const m = magnetization(state.af);
  const e = energyPerSite(state.af);
  const ff = frustratedFraction(state.af);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['T',          state.T.toFixed(2)],
    ['L',          String(state.L)],
    ['m',          m.toFixed(3)],
    ['e/site',     e.toFixed(3)],
    ['same-3 plaquettes', (100 * ff).toFixed(2) + ' %'],
  ];
  let y = H - 80;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 20, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 280, y);
    y += 14;
  }
}

function tickN(n) {
  if (state.af) sweep(state.af, n);
}

sliderT.addEventListener('input', () => {
  state.T = parseFloat(sliderT.value);
  valueT.textContent = state.T.toFixed(2);
  if (state.af) setTemperature(state.af, state.T);
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
    const Ts = [0.1, 0.5, 1.0, 2.0, 4.0];
    state.T = Ts[Math.min(Ts.length - 1, Math.round(frac * (Ts.length - 1)))];
    setTemperature(state.af, state.T);
    sliderT.value = state.T.toFixed(2);
    valueT.textContent = state.T.toFixed(2);
    sweep(state.af, 200);
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
