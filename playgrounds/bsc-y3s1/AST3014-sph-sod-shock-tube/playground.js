import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// 1D SPH Sod shock-tube render. Particle ribbon and three stacked traces
// (density, velocity, pressure).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createSod, stepSPH, diagnostics, totalEnergy, totalMass, N, X_DOMAIN,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const sliderField  = document.getElementById('slider-field');
const valueSpeed   = document.getElementById('value-speed');
const valueField   = document.getElementById('value-field');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const FIELD_LABELS = ['rho', 'v', 'P'];

const state = {
  speed: 2,
  field: 0,
  sim: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  E0: 0,
  M0: 0,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent:     cssVar('--accent',      '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
};

function rebuild() {
  state.sim = createSod();
  state.E0 = totalEnergy(state.sim);
  state.M0 = totalMass(state.sim);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const d = diagnostics(state.sim);

  const PADX = 36;
  const PANEL_W = W - 2 * PADX;
  const ribbonY = 60;
  const ribbonH = 28;
  const panelGap = 12;
  const panelH = (H - ribbonY - ribbonH - 4 * panelGap - 30) / 3;

  const Mc = totalMass(state.sim);
  const Ec = totalEnergy(state.sim);
  const E_rel = (Ec - state.E0) / Math.abs(state.E0);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.sim.t.toFixed(3)}   step = ${state.sim.nSteps}   N = ${N}`, PADX, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`mass = ${Mc.toFixed(5)} (drift ${((Mc - state.M0) / state.M0).toExponential(2)})`, PADX, 40);
  ctx.textAlign = 'right';
  ctx.fillText(`E_total / E_0 - 1 = ${E_rel.toExponential(2)}`, W - PADX, 40);

  function xToPx(x) {
    return PADX + PANEL_W * (x - X_DOMAIN.min) / (X_DOMAIN.max - X_DOMAIN.min);
  }

  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PADX, ribbonY, PANEL_W, ribbonH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(PADX + 0.5, ribbonY + 0.5, PANEL_W - 1, ribbonH - 1);
  for (let i = 0; i < N; i += 1) {
    const px = xToPx(state.sim.x[i]);
    const py = ribbonY + ribbonH * 0.5;
    ctx.fillStyle = i < 320 ? '#7fb1d8' : '#d68a69';
    ctx.fillRect(px - 0.5, py - 2, 1.2, 4);
  }
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'left';
  ctx.fillText('particles (blue = initially left, orange = initially right)', PADX + 4, ribbonY + ribbonH - 4);

  const panels = [
    { key: 'rho', data: d.rho, min: 0,    max: 1.1, color: tok.accentCool, label: 'rho(x)' },
    { key: 'v',   data: d.v,   min: -0.5, max: 1.2, color: '#f1d28a',      label: 'v(x)' },
    { key: 'P',   data: d.P,   min: 0,    max: 1.1, color: tok.accentWarm, label: 'P(x)' },
  ];
  for (let p = 0; p < 3; p += 1) {
    const py = ribbonY + ribbonH + panelGap + p * (panelH + panelGap);
    const pan = panels[p];
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(PADX, py, PANEL_W, panelH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(PADX + 0.5, py + 0.5, PANEL_W - 1, panelH - 1);

    if (pan.key === 'v') {
      const y0 = py + panelH * (1 - (0 - pan.min) / (pan.max - pan.min));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath(); ctx.moveTo(PADX, y0); ctx.lineTo(PADX + PANEL_W, y0); ctx.stroke();
    }

    const idx = Array.from({ length: N }, (_, k) => k).sort((a, b) => state.sim.x[a] - state.sim.x[b]);
    ctx.strokeStyle = pan.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < idx.length; k += 1) {
      const i = idx[k];
      const px = xToPx(state.sim.x[i]);
      const yval = pan.data[i];
      const yClamped = Math.max(pan.min, Math.min(pan.max, yval));
      const yy = py + panelH * (1 - (yClamped - pan.min) / (pan.max - pan.min));
      if (k === 0) ctx.moveTo(px, yy); else ctx.lineTo(px, yy);
    }
    ctx.stroke();

    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'left';
    ctx.fillStyle = state.field === p ? '#fff' : 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(pan.label, PADX + 4, py + 14);
  }

  const xAxisY = ribbonY + ribbonH + panelGap + 3 * (panelH + panelGap) + 4;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  for (let t = 0; t <= 1; t += 0.2) ctx.fillText(t.toFixed(1), xToPx(t), xAxisY);
  ctx.fillText('x', xToPx(0.5), xAxisY + 12);
}

function tickN(n) {
  if (!state.sim) return;
  for (let i = 0; i < n; i += 1) stepSPH(state.sim, 0.0015);
}

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
sliderField.addEventListener('input', () => {
  state.field = parseInt(sliderField.value, 10);
  valueField.textContent = FIELD_LABELS[state.field];
  drawAll();
});
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
    const target = Math.round(frac * 130);
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
