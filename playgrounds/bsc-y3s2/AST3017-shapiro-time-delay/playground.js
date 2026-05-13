// playground.js
// Shapiro delay visualization with ray sketch + delay vs b curve.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { shapiroDelay, shapiroDelayFull } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderB      = document.getElementById('slider-b');
const sliderR      = document.getElementById('slider-r');
const sliderSpeed  = document.getElementById('slider-speed');
const valueB       = document.getElementById('value-b');
const valueR       = document.getElementById('value-r');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  b: 20,
  r: 1000,
  speed: 2,
  sweepDir: -1,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const delay = shapiroDelay(state.r, state.r, state.b);
  const delayFull = shapiroDelayFull(state.r, state.r, state.b);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`b / M = ${state.b.toFixed(1)}   r_E = r_R = ${state.r.toFixed(0)} M`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`delta t = 2 M ln(4 r^2 / b^2) = ${delay.toFixed(3)} M   (full Schwarzschild: ${delayFull.toFixed(3)} M)`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: ray sketch
  const topY = 60, topH = 200;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  // Sun
  const cx = padL + PW / 2, cy = topY + topH * 0.7;
  ctx.fillStyle = '#f1d28a';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  // Light path
  const bPx = state.b / 100 * (topH * 0.5);   // scale b for visual
  const pathY = cy - bPx;
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(padL + 20, pathY); ctx.lineTo(padL + PW - 20, pathY);
  ctx.stroke();
  // Arrowhead
  ctx.fillStyle = tok.accentCool;
  ctx.beginPath();
  ctx.moveTo(padL + PW - 20, pathY);
  ctx.lineTo(padL + PW - 30, pathY - 5);
  ctx.lineTo(padL + PW - 30, pathY + 5);
  ctx.closePath();
  ctx.fill();
  // Emitter / receiver
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(padL + 20, pathY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('emitter', padL + 28, pathY - 8);
  ctx.fillText('receiver', padL + PW - 70, pathY - 8);
  ctx.fillText('Sun', cx + 16, cy + 5);
  // b annotation
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy); ctx.lineTo(cx, pathY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(`b`, cx + 6, (cy + pathY) / 2);

  // Bottom: delay vs b curve
  const botY = topY + topH + 40, botH = H - botY - 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, botY, PW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, PW - 1, botH - 1);
  const bMin = 1, bMax = 100;
  const dMin = 0, dMax = shapiroDelay(state.r, state.r, bMin) * 1.05;
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = PW - 8;
  for (let i = 0; i < NPTS; i += 1) {
    const bb = bMin + (bMax - bMin) * i / (NPTS - 1);
    const d = shapiroDelay(state.r, state.r, bb);
    const px = padL + 4 + i;
    const py = botY + botH - 4 - (botH - 12) * (d - dMin) / (dMax - dMin);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // cursor
  const cPx = padL + 4 + (PW - 8) * (state.b - bMin) / (bMax - bMin);
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cPx, botY + 6); ctx.lineTo(cPx, botY + botH - 6);
  ctx.stroke();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('delta t vs impact parameter b', padL + 6, botY + 14);
  // axis
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const bb of [10, 25, 50, 75, 100]) {
    const px = padL + 4 + (PW - 8) * (bb - bMin) / (bMax - bMin);
    ctx.fillText(`${bb}`, px, botY + botH - 4);
  }
  ctx.fillText('b / M', padL + PW / 2, botY + botH + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.b += state.sweepDir * 0.5;
    if (state.b <= 1) { state.b = 1; state.sweepDir = 1; }
    if (state.b >= 100) { state.b = 100; state.sweepDir = -1; }
  }
  valueB.textContent = state.b.toFixed(1);
  sliderB.value = state.b.toFixed(1);
}

sliderB.addEventListener('input', () => { state.b = parseFloat(sliderB.value); valueB.textContent = state.b.toFixed(1); drawAll(); });
sliderR.addEventListener('input', () => { state.r = parseFloat(sliderR.value); valueR.textContent = state.r.toFixed(0); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.b = 20; state.sweepDir = -1; sliderB.value = '20'; valueB.textContent = '20.0'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.b = 1 + frac * 99;
    sliderB.value = state.b.toFixed(1); valueB.textContent = state.b.toFixed(1);
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
