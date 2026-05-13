// playground.js
// Two parallel strings with fixed vs free boundaries.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createString, stepString, N, DX, L_X, DT } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  speed: 3,
  fixed: null,
  free: null,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.fixed = createString({ bc: 'fixed' });
  state.free  = createString({ bc: 'free' });
}

function drawString(s, panelY, panelH, color, label) {
  const padL = 30, padR = 30;
  const panelW = W - padL - padR;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  // Zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(padL, panelY + panelH / 2); ctx.lineTo(padL + panelW, panelY + panelH / 2);
  ctx.stroke();
  // Wave
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = padL + 4 + (panelW - 8) * i / (N - 1);
    const y = panelY + panelH / 2 - s.y[i] * (panelH * 0.4);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Boundary markers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL + 4, panelY + 4); ctx.lineTo(padL + 4, panelY + panelH - 4);
  ctx.moveTo(padL + panelW - 4, panelY + 4); ctx.lineTo(padL + panelW - 4, panelY + panelH - 4);
  ctx.stroke();
  // Label
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(label, padL + 6, panelY + 14);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.fixed) return;
  const t = state.fixed.t;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${t.toFixed(2)} s   c = 1   L = ${L_X}   c dt / dx = ${(1 * DT / DX).toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`Watch for the pulse to invert (fixed) vs preserve (free) when it hits the right boundary.`, 30, 40);

  // Two stacked panels
  const padT = 60, padB = 60;
  const panelH = (H - padT - padB) / 2 - 10;
  drawString(state.fixed, padT,             panelH, tok.accentCool, 'fixed-end (y = 0 boundary)');
  drawString(state.free,  padT + panelH + 20, panelH, tok.accentWarm, 'free-end (y_x = 0 boundary)');
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepString(state.fixed);
    stepString(state.free);
  }
}

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
    // Total run T = 6 s; each frame at fixed step.
    const target = Math.round(frac * 6.0 / DT);
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
    tickN(state.speed * 5);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
