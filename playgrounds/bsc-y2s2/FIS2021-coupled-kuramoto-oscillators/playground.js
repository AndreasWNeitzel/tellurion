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

  // Layout: big square phase circle on top, full-width r(t) plot below
  const cpS = 564, cpX = (W - cpS) / 2, cpY = 54;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(cpX, cpY, cpS, cpS);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.strokeRect(cpX + 0.5, cpY + 0.5, cpS - 1, cpS - 1);
  const cx = cpX + cpS / 2, cy = cpY + cpS / 2, R0 = cpS / 2 - 34;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.stroke();
  // oscillator dots
  for (let i = 0; i < N; i += 1) {
    const px = cx + R0 * Math.cos(state.sim.theta[i]);
    const py = cy - R0 * Math.sin(state.sim.theta[i]);
    ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
    ctx.beginPath(); ctx.arc(px, py, 3.2, 0, Math.PI * 2); ctx.fill();
  }
  // order-parameter arrow (length r, angle = mean phase)
  let sx = 0, sy = 0;
  for (let i = 0; i < N; i += 1) { sx += Math.cos(state.sim.theta[i]); sy += Math.sin(state.sim.theta[i]); }
  sx /= N; sy /= N;
  const arrowEnd = { x: cx + R0 * sx, y: cy - R0 * sy };
  ctx.strokeStyle = tok.accentWarm; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(arrowEnd.x, arrowEnd.y); ctx.stroke();
  ctx.fillStyle = tok.accentWarm; ctx.beginPath(); ctx.arc(arrowEnd.x, arrowEnd.y, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.textAlign = 'left';
  ctx.fillText('oscillator phases on the unit circle; arrow length = r', cpX + 8, cpY + 16);
  ctx.fillStyle = tok.accentWarm; ctx.textAlign = 'center';
  ctx.fillText(`r = ${r.toFixed(2)}`, arrowEnd.x, arrowEnd.y - 10);

  // r(t) plot (full width, bottom)
  const traceX = 30, traceY = 648, traceW = W - 60, traceH = H - traceY - 20;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(traceX, traceY, traceW, traceH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.strokeRect(traceX + 0.5, traceY + 0.5, traceW - 1, traceH - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'; ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(traceX, traceY + traceH - 4); ctx.lineTo(traceX + traceW, traceY + traceH - 4);
  ctx.moveTo(traceX, traceY + 4); ctx.lineTo(traceX + traceW, traceY + 4);
  ctx.stroke(); ctx.setLineDash([]);
  if (state.rHistory.length >= 2) {
    ctx.strokeStyle = tok.accentWarm; ctx.lineWidth = 1.8; ctx.beginPath();
    const tWindow = 40, tStart = Math.max(0, state.sim.t - tWindow);
    let first = true;
    for (const pt of state.rHistory) {
      if (pt.t < tStart) continue;
      const px = traceX + 6 + (traceW - 12) * (pt.t - tStart) / tWindow;
      const py = traceY + 4 + (traceH - 8) * (1 - pt.r);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'; ctx.textAlign = 'left';
  ctx.fillText('r = 1 (full sync)', traceX + 6, traceY + 14);
  ctx.fillText('r = 0 (incoherent)', traceX + 6, traceY + traceH - 6);
  ctx.textAlign = 'right'; ctx.fillText('order parameter r(t)', traceX + traceW - 6, traceY + 14);
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const r = state.sim ? orderParameter(state.sim) : 0;
  return {
    fields: [
      { key: 'coupling', label: 'Coupling K', value: state.K, format: 'float' },
      { key: 'critical', label: 'Critical Kc', value: criticalCoupling(state.gamma), format: 'float' },
      { key: 'order-param', label: 'Order parameter r', value: r, format: 'float' },
      { key: 'linewidth', label: 'Linewidth gamma', value: state.gamma, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!state.sim) return [{ key: 'not-initialized', label: 'Simulation', value: 'pending', status: 'pending' }];
  const r = orderParameter(state.sim);
  const Kc = criticalCoupling(state.gamma);
  const behavior = state.K < Kc ? 'incoherent' : 'synchronized';
  const r_bounds = r >= 0 && r <= 1 ? 'pass' : 'drift';
  return [
    {
      key: 'order-bounds',
      label: 'Order parameter in [0,1]',
      value: r.toFixed(3),
      status: r_bounds,
    },
  ];
};
