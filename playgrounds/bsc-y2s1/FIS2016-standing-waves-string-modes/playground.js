// playground.js
// Standing waves on a fixed-end string. Show selected mode or 1+3 superposition.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { yMode, ySuper, freqN, antinodes, nodes, L } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderN      = document.getElementById('slider-n');
const sliderSpeed  = document.getElementById('slider-speed');
const valueN       = document.getElementById('value-n');
const valueSpeed   = document.getElementById('value-speed');
const btnSuper     = document.getElementById('btn-superpose');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  n: 1,
  speed: 2,
  superpose: false,
  tNow: 0,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function worldToPx(xWorld, yWorld) {
  const padL = 50, padR = 30, padT = 80, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const px = padL + (xWorld / L) * drawW;
  const py = padT + drawH / 2 - yWorld * (drawH * 0.42);
  return { px, py };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Title bar
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const label = state.superpose ? 'modes 1 + 3 superposition' : `mode n = ${state.n}`;
  ctx.fillText(`${label}   t = ${state.tNow.toFixed(2)}   f_n = ${freqN(state.n).toFixed(3)} (f_1 = ${freqN(1).toFixed(3)})`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`L = 1, c = 1, f_n = n c / (2 L) = n / 2`, 30, 40);

  // String box
  const padL = 50, padR = 30, padT = 80, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);
  // Horizontal center line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(padL, padT + drawH / 2);
  ctx.lineTo(padL + drawW, padT + drawH / 2);
  ctx.stroke();

  // Envelope dashed (mode amplitude shape)
  function drawEnvelope(n, color, alpha = 0.4) {
    ctx.strokeStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const Nx = 200;
    for (let i = 0; i <= Nx; i += 1) {
      const x = i / Nx;
      const env = Math.sin(n * Math.PI * x / L);
      const p = worldToPx(x, env);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= Nx; i += 1) {
      const x = i / Nx;
      const env = -Math.sin(n * Math.PI * x / L);
      const p = worldToPx(x, env);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // String wave
  function drawWave(fn, color, lw = 2.2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const Nx = 400;
    for (let i = 0; i <= Nx; i += 1) {
      const x = i / Nx;
      const yval = fn(x);
      const p = worldToPx(x, yval);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  if (state.superpose) {
    drawEnvelope(1, '#7fb1d8', 0.35);
    drawEnvelope(3, '#d68a69', 0.35);
    const amps = [0, 1.0, 0, 0.5, 0, 0];
    drawWave((x) => ySuper(x, state.tNow, amps), '#f1d28a', 2.2);
    // Show component modes faintly
    drawWave((x) => yMode(x, state.tNow, 1, 1.0), 'rgba(127, 177, 216, 0.6)', 1.0);
    drawWave((x) => yMode(x, state.tNow, 3, 0.5), 'rgba(214, 138, 105, 0.6)', 1.0);
  } else {
    drawEnvelope(state.n, '#7fb1d8', 0.40);
    drawWave((x) => yMode(x, state.tNow, state.n), tok.accentCool, 2.2);
  }

  // Node and antinode markers (for single mode)
  if (!state.superpose) {
    const nList = [0, ...nodes(state.n), L];   // fixed ends are also nodes
    for (const xn of nList) {
      const p = worldToPx(xn, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py - 6); ctx.lineTo(p.px, p.py + 6);
      ctx.stroke();
    }
    for (const xa of antinodes(state.n)) {
      const ynow = yMode(xa, state.tNow, state.n);
      const p = worldToPx(xa, ynow);
      ctx.fillStyle = tok.accentWarm;
      ctx.beginPath();
      ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Boundary pegs
  for (const xx of [0, L]) {
    const p = worldToPx(xx, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('y(x, t) = sin(n pi x / L) cos(2 pi f_n t)', 60, H - 24);
  ctx.fillStyle = tok.accentWarm;
  ctx.textAlign = 'right';
  ctx.fillText('orange dots: antinodes', W - 60, H - 24);
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.02; }

sliderN.addEventListener('input', () => { state.n = parseInt(sliderN.value, 10); valueN.textContent = String(state.n); state.superpose = false; btnSuper.textContent = 'superpose 1+3'; drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnSuper.addEventListener('click', () => {
  state.superpose = !state.superpose;
  btnSuper.textContent = state.superpose ? 'single mode' : 'superpose 1+3';
  drawAll();
});
btnReset.addEventListener('click', () => { state.tNow = 0; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep through modes for variety: 0 -> mode 1, 0.25 -> mode 2, etc.
    state.n = Math.min(5, 1 + Math.floor(frac * 5));
    sliderN.value = String(state.n); valueN.textContent = String(state.n);
    state.tNow = frac * 2.0;
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
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
