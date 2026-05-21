import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Kuramoto oscillators on the unit circle, with r(t) panel.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createKuramoto, stepKuramoto, orderParameter, criticalCoupling, N,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderK      = document.getElementById('slider-K');
const sliderGamma  = document.getElementById('slider-gamma');
const sliderSpeed  = document.getElementById('slider-speed');
const valueK       = document.getElementById('value-K');
const valueGamma   = document.getElementById('value-gamma');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  K: 1.5,
  gamma: 0.5,
  speed: 2,
  sim: null,
  rHistory: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createKuramoto({ K: state.K, gamma: state.gamma, seed: SEED });
  state.rHistory = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const r = orderParameter(state.sim);
  const Kc = criticalCoupling(state.gamma);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`K = ${state.K.toFixed(2)}   K_c = ${Kc.toFixed(2)}   r = ${r.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`${state.K < Kc ? 'incoherent' : 'partially synchronized'}   N = ${N}   gamma = ${state.gamma.toFixed(2)}   t = ${state.sim.t.toFixed(2)}`, 30, 40);

  // Layout: unit circle on left, r(t) on right
  const padL = 30, padR = 30;
  const panelGap = 30;
  const panelW = (W - padL - padR - panelGap) / 2;
  const panelY = 60;
  const panelH = H - panelY - 80;

  // Unit circle
  const circleX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(circleX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(circleX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const cx = circleX + panelW / 2;
  const cy = panelY + panelH / 2;
  const R0 = Math.min(panelW, panelH) / 2 - 20;
  // Unit circle outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, R0, 0, Math.PI * 2);
  ctx.stroke();
  // Oscillator dots
  for (let i = 0; i < N; i += 1) {
    const px = cx + R0 * Math.cos(state.sim.theta[i]);
    const py = cy - R0 * Math.sin(state.sim.theta[i]);
    ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Order parameter arrow
  let sx = 0, sy = 0;
  for (let i = 0; i < N; i += 1) { sx += Math.cos(state.sim.theta[i]); sy += Math.sin(state.sim.theta[i]); }
  sx /= N; sy /= N;
  const arrowEnd = { x: cx + R0 * sx, y: cy - R0 * sy };
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(arrowEnd.x, arrowEnd.y);
  ctx.stroke();
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(arrowEnd.x, arrowEnd.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('oscillator phases on unit circle', circleX + 6, panelY + 14);

  // r(t)
  const traceX = padL + panelW + panelGap;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(traceX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(traceX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  // 0 and 1 lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(traceX, panelY + panelH - 4);
  ctx.lineTo(traceX + panelW, panelY + panelH - 4);
  ctx.moveTo(traceX, panelY + 4);
  ctx.lineTo(traceX + panelW, panelY + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  // r(t) trace
  if (state.rHistory.length >= 2) {
    ctx.strokeStyle = tok.accentWarm;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const tWindow = 40;
    const tStart = Math.max(0, state.sim.t - tWindow);
    let first = true;
    for (const pt of state.rHistory) {
      if (pt.t < tStart) continue;
      const px = traceX + 4 + (panelW - 8) * (pt.t - tStart) / tWindow;
      const py = panelY + 4 + (panelH - 8) * (1 - pt.r);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // r = 1 and 0 labels
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('r = 1', traceX + 6, panelY + 14);
  ctx.fillText('r = 0', traceX + 6, panelY + panelH - 6);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepKuramoto(state.sim, 0.04);
    if (state.sim.nSteps % 1 === 0) {
      const r = orderParameter(state.sim);
      state.rHistory.push({ t: state.sim.t, r });
      if (state.rHistory.length > 4000) state.rHistory.shift();
    }
  }
}

sliderK.addEventListener('change', () => { state.K = parseFloat(sliderK.value); valueK.textContent = state.K.toFixed(2); drawAll(); });
sliderK.addEventListener('input', () => { valueK.textContent = parseFloat(sliderK.value).toFixed(2); state.K = parseFloat(sliderK.value); });
sliderGamma.addEventListener('change', () => { state.gamma = parseFloat(sliderGamma.value); valueGamma.textContent = state.gamma.toFixed(2); rebuild(); drawAll(); });
sliderGamma.addEventListener('input', () => { valueGamma.textContent = parseFloat(sliderGamma.value).toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

// Sync the K slider value to the sim each step (since K can be changed without rebuild)
function syncK() { if (state.sim) state.sim.K = state.K; }

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 1000);
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
    syncK();
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
