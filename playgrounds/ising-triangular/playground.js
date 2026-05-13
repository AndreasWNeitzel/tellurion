// playground.js
// Triangular Ising. Render the spin lattice as a tinted pixel grid; track
// live magnetization and energy per site.

import { createIsing, sweep, magnetization, energyPerSite, setTemperature, TC_ANALYTIC } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
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
const btnReset     = document.getElementById('btn-reset');
const btnCold      = document.getElementById('btn-cold');
const btnPlay      = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const DRAW = { x: 20, y: 30, size: Math.min(W - 240, H - 60) };

const state = {
  ising: null,
  speed: 3,
  playing: !DETERMINISTIC,
  rafId: null,
  mHistory: [],            // recent magnetization values for the inset trace
  eHistory: [],
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  bg: cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid: cssVar('--grid', '#9A9C9F4D'),
};

function rebuild(init = 'hot') {
  const L = parseInt(sliderL.value, 10);
  const T = parseFloat(sliderT.value);
  state.ising = createIsing({ L, T, seed: 0xC0FFEE, init });
  state.mHistory = [];
  state.eHistory = [];
}

function drawLattice() {
  ctx.fillStyle = tok.bg;
  ctx.fillRect(0, 0, W, H);
  const { L, spins } = state.ising;
  // pixel-per-site to fit DRAW.size; integer to keep crisp
  const cell = Math.max(2, Math.floor(DRAW.size / L));
  const usedSize = cell * L;
  // Cell shift on odd rows to suggest the triangular structure.
  // Triangular geometry: odd rows shift by half a cell horizontally.
  for (let j = 0; j < L; j += 1) {
    const shift = (j & 1) === 1 ? cell / 2 : 0;
    for (let i = 0; i < L; i += 1) {
      const s = spins[j * L + i];
      ctx.fillStyle = s === 1 ? tok.accent : tok.accentWarm;
      ctx.fillRect(DRAW.x + i * cell + shift, DRAW.y + j * cell, cell, cell);
    }
  }
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(DRAW.x + 0.5, DRAW.y + 0.5, usedSize - 1, usedSize - 1);
}

function drawReadout() {
  const m = magnetization(state.ising);
  const e = energyPerSite(state.ising);
  state.mHistory.push(m);
  state.eHistory.push(e);
  if (state.mHistory.length > 200) state.mHistory.shift();
  if (state.eHistory.length > 200) state.eHistory.shift();

  const xL = DRAW.x + DRAW.size + 16;
  const xR = W - 16;
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const acc = state.ising.totalAttempts === 0 ? 0 : state.ising.accSteps / state.ising.totalAttempts;
  const rows = [
    ['T',       state.ising.T.toFixed(3)],
    ['T_c',     TC_ANALYTIC.toFixed(3)],
    ['T / T_c', (state.ising.T / TC_ANALYTIC).toFixed(3)],
    ['L',       String(state.ising.L)],
    ['m',       m.toFixed(3)],
    ['|m|',     Math.abs(m).toFixed(3)],
    ['e/site',  e.toFixed(3)],
    ['accept',  (100 * acc).toFixed(1) + '%'],
  ];
  let y = DRAW.y + 18;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = tok.fgMuted; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = tok.fg;       ctx.fillText(v, xR, y);
    y += 14;
  }

  // inset magnetization trace
  const inset = { x: xL, y: y + 6, w: xR - xL, h: 80 };
  ctx.fillStyle = tok.surface;
  ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.5;
  ctx.strokeRect(inset.x + 0.5, inset.y + 0.5, inset.w - 1, inset.h - 1);
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('m over time', inset.x + 4, inset.y - 4);
  // m axis: -1 to 1
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.4;
  const yMid = inset.y + inset.h / 2;
  ctx.beginPath(); ctx.moveTo(inset.x, yMid); ctx.lineTo(inset.x + inset.w, yMid); ctx.stroke();
  if (state.mHistory.length >= 2) {
    ctx.strokeStyle = tok.accent; ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let i = 0; i < state.mHistory.length; i += 1) {
      const mv = state.mHistory[i];
      const xv = inset.x + (i / (state.mHistory.length - 1)) * inset.w;
      const yv = inset.y + inset.h * (1 - (mv + 1) / 2);
      if (i === 0) ctx.moveTo(xv, yv); else ctx.lineTo(xv, yv);
    }
    ctx.stroke();
  }
}

function drawAll() {
  drawLattice();
  drawReadout();
}

function tickN(nSweeps) {
  if (!state.ising) return;
  sweep(state.ising, nSweeps);
}

function applyControls() {
  setTemperature(state.ising, parseFloat(sliderT.value));
  state.speed = parseInt(sliderSpeed.value, 10);
  valueT.textContent = state.ising.T.toFixed(2);
  valueL.textContent = String(state.ising.L);
  valueSpeed.textContent = String(state.speed);
}
sliderT.addEventListener('input', () => { setTemperature(state.ising, parseFloat(sliderT.value)); valueT.textContent = parseFloat(sliderT.value).toFixed(2); });
sliderL.addEventListener('change', () => { rebuild('hot'); valueL.textContent = sliderL.value; });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = sliderSpeed.value; });
btnReset.addEventListener('click', () => rebuild('hot'));
btnCold.addEventListener('click', () => rebuild('cold'));
btnPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild('hot');
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep T from cold (T=1.5) to hot (T=6) through the critical region.
    const T = 1.5 + frac * 4.5;
    setTemperature(state.ising, T);
    sliderT.value = T.toString();
    valueT.textContent = T.toFixed(2);
    // equilibrate
    sweep(state.ising, 200);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    drawAll();
  }
  state.rafId = requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
