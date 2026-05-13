// playground.js
// q-state Potts lattice + order-parameter trace.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { createPotts, sweep, orderParameter, energyPerSite, setTemperature, setQ, critTemperature } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderQ      = document.getElementById('slider-q');
const sliderTr     = document.getElementById('slider-Tr');
const sliderSpeed  = document.getElementById('slider-speed');
const valueQ       = document.getElementById('value-q');
const valueTr      = document.getElementById('value-Tr');
const valueSpeed   = document.getElementById('value-speed');
const btnCold      = document.getElementById('btn-cold');
const btnHot       = document.getElementById('btn-hot');

const W = canvas.width, H = canvas.height;
const LEFT_W = 560;
const LATTICE_L = 96;

const state = {
  potts: null,
  q: 3,
  ratio: 1.0,
  speed: 2.0,
  history: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

// Categorical palette for up to 10 spin states. Picked for perceptual distinctness
// against the dark background; not a colormap.
const COLORS = [
  '#69a8d6', '#d68a69', '#7ec27e', '#d6c869', '#b07cd1',
  '#d169a8', '#6dccc2', '#d96660', '#a2a89d', '#bcd169',
];

function rebuild(init = 'hot') {
  const q = state.q;
  const Tc = critTemperature(q);
  state.potts = createPotts({ L: LATTICE_L, q, T: state.ratio * Tc, seed: SEED, init });
  state.history = [];
}

function drawLattice() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const { L, spins } = state.potts;
  const cell = Math.floor((LEFT_W - 30) / L);
  const x0 = 15, y0 = 15;
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const s = spins[j * L + i];
      ctx.fillStyle = COLORS[s];
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell, cell);
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, cell * L - 1, cell * L - 1);
}

function drawTraceAndReadout() {
  const xL = LEFT_W + 12;
  const xR = W - 12;
  const Tc = critTemperature(state.potts.q);
  const m = orderParameter(state.potts);
  const e = energyPerSite(state.potts);
  state.history.push(m);
  if (state.history.length > 250) state.history.shift();

  const acc = state.potts.totalAttempts === 0 ? 0 : state.potts.accSteps / state.potts.totalAttempts;
  const rows = [
    ['q',      String(state.potts.q)],
    ['T',      state.potts.T.toFixed(3)],
    ['T_c(q)', Tc.toFixed(3)],
    ['T / T_c', (state.potts.T / Tc).toFixed(3)],
    ['order M', m.toFixed(3)],
    ['e/site', e.toFixed(3)],
    ['accept', (100 * acc).toFixed(1) + '%'],
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  let y = 30;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, xL, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, xR, y);
    y += 14;
  }

  const inset = { x: xL, y: y + 8, w: xR - xL, h: H - y - 30 };
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.strokeRect(inset.x + 0.5, inset.y + 0.5, inset.w - 1, inset.h - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('M(t) over MC sweeps', inset.x + 4, inset.y - 4);

  ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
  ctx.lineWidth = 0.7;
  const y0px = inset.y + inset.h;
  const y1px = inset.y;
  ctx.beginPath();
  ctx.moveTo(inset.x, y0px); ctx.lineTo(inset.x + inset.w, y0px);
  ctx.stroke();

  if (state.history.length >= 2) {
    ctx.strokeStyle = '#f1d28a';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let i = 0; i < state.history.length; i += 1) {
      const mv = state.history[i];
      const xv = inset.x + (i / (state.history.length - 1)) * inset.w;
      const yv = inset.y + inset.h * (1 - mv);
      if (i === 0) ctx.moveTo(xv, yv); else ctx.lineTo(xv, yv);
    }
    ctx.stroke();
  }
}

function drawAll() {
  drawLattice();
  drawTraceAndReadout();
}

function tickN(nSweeps) {
  if (state.potts) sweep(state.potts, nSweeps);
}

sliderQ.addEventListener('change', () => {
  state.q = parseInt(sliderQ.value, 10);
  valueQ.textContent = String(state.q);
  rebuild('hot');
  drawAll();
});
sliderTr.addEventListener('input', () => {
  state.ratio = parseFloat(sliderTr.value);
  valueTr.textContent = state.ratio.toFixed(2);
  if (state.potts) setTemperature(state.potts, state.ratio * critTemperature(state.potts.q));
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(1);
});
btnHot.addEventListener('click', () => { rebuild('hot'); drawAll(); });
btnCold.addEventListener('click', () => { rebuild('cold'); drawAll(); });

function bootSync() {
  rebuild('hot');
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.q = [3, 3, 3, 7, 7][Math.min(4, Math.round(frac * 4))];
    state.ratio = [0.6, 0.95, 1.4, 0.6, 1.5][Math.min(4, Math.round(frac * 4))];
    sliderQ.value = String(state.q);
    valueQ.textContent = String(state.q);
    sliderTr.value = state.ratio.toFixed(2);
    valueTr.textContent = state.ratio.toFixed(2);
    rebuild('hot');
    sweep(state.potts, 600);
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
    tickN(Math.max(1, Math.round(state.speed)));
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
