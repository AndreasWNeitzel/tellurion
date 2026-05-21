// playground.js
// Damped driven oscillator: x(t) trace and resonance curve.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createDriven, stepDriven, steadyAmplitude, resonancePeak, qualityFactor,
  OMEGA0, F0,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderOmega  = document.getElementById('slider-omega');
const sliderGamma  = document.getElementById('slider-gamma');
const sliderSpeed  = document.getElementById('slider-speed');
const valueOmega   = document.getElementById('value-omega');
const valueGamma   = document.getElementById('value-gamma');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const T_TRACE_WINDOW = 40.0;

const state = {
  omega: 1.0,
  gamma: 0.1,
  speed: 3,
  sim: null,
  trace: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createDriven({ omega: state.omega, gamma: state.gamma });
  state.trace = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const Q = qualityFactor(state.gamma);
  const peak = resonancePeak(state.gamma);
  const A_at_omega = steadyAmplitude(state.omega, state.gamma);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`omega = ${state.omega.toFixed(2)}   gamma = ${state.gamma.toFixed(3)}   Q = ${Q.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`omega_r = ${peak.toFixed(3)}   A(omega) = ${A_at_omega.toFixed(3)}   t = ${state.sim.t.toFixed(1)}`, 30, 40);

  // Layout: trace (top half), response curve (bottom half)
  const padL = 40, padR = 40;
  const traceY = 60, traceH = 200;
  const curveY = traceY + traceH + 40, curveH = H - curveY - 40;
  const PW = W - padL - padR;

  // Trace panel
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, traceY, PW, traceH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, traceY + 0.5, PW - 1, traceH - 1);
  // Zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath(); ctx.moveTo(padL, traceY + traceH / 2); ctx.lineTo(padL + PW, traceY + traceH / 2); ctx.stroke();
  // Drive (faint)
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.40)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  const xScale = 1.5 * Math.max(Math.abs(A_at_omega), F0);   // y axis scale
  for (let i = 0; i < PW - 2; i += 1) {
    const tStart = Math.max(0, state.sim.t - T_TRACE_WINDOW);
    const t = tStart + (T_TRACE_WINDOW * i / (PW - 3));
    if (t > state.sim.t) break;
    const drive = F0 * Math.cos(state.omega * t);
    const py = traceY + traceH / 2 - drive / xScale * (traceH * 0.42);
    if (i === 0) ctx.moveTo(padL + 1 + i, py); else ctx.lineTo(padL + 1 + i, py);
  }
  ctx.stroke();
  // x(t) trace
  if (state.trace.length >= 2) {
    ctx.strokeStyle = tok.accentCool;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const tStart = Math.max(0, state.sim.t - T_TRACE_WINDOW);
    let first = true;
    for (const pt of state.trace) {
      if (pt.t < tStart) continue;
      const px = padL + 1 + (PW - 3) * (pt.t - tStart) / T_TRACE_WINDOW;
      const py = traceY + traceH / 2 - pt.x / xScale * (traceH * 0.42);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('x(t)', padL + 6, traceY + 14);
  ctx.fillStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.fillText('F_0 cos(omega t) (drive)', padL + 60, traceY + 14);

  // Response curve panel
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, curveY, PW, curveH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, curveY + 0.5, PW - 1, curveH - 1);
  // Compute curve
  const omegaMin = 0.2, omegaMax = 2.5;
  let aMax = 0;
  for (let i = 0; i < PW - 2; i += 1) {
    const w = omegaMin + (omegaMax - omegaMin) * i / (PW - 3);
    aMax = Math.max(aMax, steadyAmplitude(w, state.gamma));
  }
  aMax *= 1.1;
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < PW - 2; i += 1) {
    const w = omegaMin + (omegaMax - omegaMin) * i / (PW - 3);
    const A = steadyAmplitude(w, state.gamma);
    const px = padL + 1 + i;
    const py = curveY + curveH - 16 - (curveH - 32) * A / aMax;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Cursor at current omega
  const cursorX = padL + 1 + (PW - 3) * (state.omega - omegaMin) / (omegaMax - omegaMin);
  ctx.strokeStyle = 'rgba(241, 210, 138, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cursorX, curveY + 4);
  ctx.lineTo(cursorX, curveY + curveH - 4);
  ctx.stroke();
  // Peak marker
  const peakX = padL + 1 + (PW - 3) * (peak - omegaMin) / (omegaMax - omegaMin);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(peakX, curveY + 6); ctx.lineTo(peakX, curveY + curveH - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  // Labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('A(omega)', padL + 6, curveY + 14);
  // x axis ticks
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  for (const wTick of [0.5, 1.0, 1.5, 2.0]) {
    const px = padL + 1 + (PW - 3) * (wTick - omegaMin) / (omegaMax - omegaMin);
    ctx.fillText(wTick.toFixed(1), px, curveY + curveH - 4);
  }
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepDriven(state.sim, 0.01);
    if (state.sim.nSteps % 2 === 0) {
      state.trace.push({ t: state.sim.t, x: state.sim.x });
      if (state.trace.length > 2500) state.trace.shift();
    }
  }
}

sliderOmega.addEventListener('change', () => { state.omega = parseFloat(sliderOmega.value); valueOmega.textContent = state.omega.toFixed(2); rebuild(); drawAll(); });
sliderOmega.addEventListener('input', () => { valueOmega.textContent = parseFloat(sliderOmega.value).toFixed(2); });
sliderGamma.addEventListener('change', () => { state.gamma = parseFloat(sliderGamma.value); valueGamma.textContent = state.gamma.toFixed(2); rebuild(); drawAll(); });
sliderGamma.addEventListener('input', () => { valueGamma.textContent = parseFloat(sliderGamma.value).toFixed(2); });
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
