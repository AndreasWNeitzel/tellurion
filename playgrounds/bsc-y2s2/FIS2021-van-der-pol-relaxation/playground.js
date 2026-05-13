// playground.js
// Van der Pol oscillator: phase portrait (left) + x(t) trace (right).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createVdP, stepVdP } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderMu     = document.getElementById('slider-mu');
const sliderSpeed  = document.getElementById('slider-speed');
const valueMu      = document.getElementById('value-mu');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  mu: 1.0,
  speed: 3,
  sim: null,
  trail: [],
  trace: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createVdP({ mu: state.mu, x0: 1.5, v0: 0 });
  state.trail = [];
  state.trace = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`mu = ${state.mu.toFixed(2)}   t = ${state.sim.t.toFixed(1)}   step = ${state.sim.nSteps}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`mu = 0: pure SHO. mu small: near-circular limit cycle. mu large: relaxation oscillation.`, 30, 40);

  // Layout
  const padL = 40, padR = 40;
  const panelW = (W - padL - padR - 40) / 2;
  const panelY = 60;
  const panelH = H - panelY - 80;

  // Phase panel
  const phaseX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(phaseX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(phaseX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const xRange = 3.0;
  const vRange = Math.max(3.0, state.mu * 2);
  function xPhase(xx) { return phaseX + (panelW / 2) + (xx / xRange) * (panelW / 2 - 6); }
  function yPhase(vv) { return panelY + (panelH / 2) - (vv / vRange) * (panelH / 2 - 6); }
  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(phaseX, panelY + panelH / 2); ctx.lineTo(phaseX + panelW, panelY + panelH / 2);
  ctx.moveTo(phaseX + panelW / 2, panelY); ctx.lineTo(phaseX + panelW / 2, panelY + panelH);
  ctx.stroke();
  // Trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.65)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const px = xPhase(state.trail[i].x);
      const py = yPhase(state.trail[i].v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Current point
  const curX = xPhase(state.sim.x), curY = yPhase(state.sim.v);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(curX, curY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('phase (x, v)', phaseX + 6, panelY + 14);

  // Trace panel
  const traceX = padL + panelW + 40;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(traceX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(traceX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(traceX, panelY + panelH / 2); ctx.lineTo(traceX + panelW, panelY + panelH / 2);
  ctx.stroke();
  if (state.trace.length >= 2) {
    const tWindow = 30.0;
    const tStart = Math.max(0, state.sim.t - tWindow);
    ctx.strokeStyle = tok.accentCool;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let first = true;
    for (const pt of state.trace) {
      if (pt.t < tStart) continue;
      const px = traceX + 4 + (panelW - 8) * (pt.t - tStart) / tWindow;
      const py = panelY + panelH / 2 - (pt.x / xRange) * (panelH / 2 - 6);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('x(t)', traceX + 6, panelY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepVdP(state.sim, 0.01);
    if (state.sim.nSteps % 1 === 0) {
      state.trail.push({ x: state.sim.x, v: state.sim.v });
      state.trace.push({ t: state.sim.t, x: state.sim.x });
      if (state.trail.length > 4000) state.trail.shift();
      if (state.trace.length > 3000) state.trace.shift();
    }
  }
}

sliderMu.addEventListener('change', () => { state.mu = parseFloat(sliderMu.value); valueMu.textContent = state.mu.toFixed(2); rebuild(); drawAll(); });
sliderMu.addEventListener('input', () => { valueMu.textContent = parseFloat(sliderMu.value).toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 4000);
    tickN(target);
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
