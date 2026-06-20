// playground.js
// Beats from superposition of two close-frequency cosines.
// Vertical 4:5 composition: main animation panel (scrolling scope with live
// waveforms and spectrum), then a diagnostic plot of beat envelope amplitude.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack, fit } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import {
  y1, y2, ySum, envelope, envelopeFreq, beatRate, carrierFreq,
} from './sim.js';

const urlParams = new URLSearchParams(location.search);
const SEED = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

// Controls
const sliderF1 = document.getElementById('slider-f1');
const sliderF2 = document.getElementById('slider-f2');
const sliderSpeed = document.getElementById('slider-speed');
const valueF1 = document.getElementById('value-f1');
const valueF2 = document.getElementById('value-f2');
const valueSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

// Layout and timescale
const T_WINDOW = 8.0;
let REG = null;

// Simulation state
const state = {
  f1: 5.0,
  f2: 4.7,
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// Seeded RNG for tracer spawning
let _seed = SEED >>> 0;
function rnd() {
  _seed = (_seed + 0x6D2B79F5) >>> 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Flowing tracers to animate the waveforms
let tracers = { sum: [], y1: [], y2: [] };
const TRAIL_LEN = 12;

function spawnTracer(key, fresh) {
  const p = REG ? REG.scene : { w: 760, h: 400, x: 0, y: 0 };
  const life = 1.2 + rnd() * 1.6;
  const x = rnd() * p.w;
  const y = rnd() * p.h;
  return { x, y, age: fresh ? rnd() * life : 0, life, hist: [[x, y]] };
}

function stepTracers(dt) {
  if (!REG) return;
  for (const key of Object.keys(tracers)) {
    for (const t of tracers[key]) {
      t.age += dt;
      if (t.age > t.life) Object.assign(t, spawnTracer(key, false));
    }
  }
}

// Colors from design tokens or fallbacks
function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    accentCool: css.getPropertyValue('--accent-cool').trim() || '#7fb1d8',
    accentWarm: css.getPropertyValue('--accent-warm').trim() || '#d68a69',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    grid: '#23252a',
  };
}

// Compute layout on init and resize
function layout() {
  REG = stack(canvas, [
    { name: 'scene', weight: 3 },
    { name: 'plot', weight: 1 },
  ]);
}

function reset() {
  state.tNow = 0;
  tracers = { sum: [], y1: [], y2: [] };
  // Spawn initial tracers
  for (let i = 0; i < 18; i += 1) {
    tracers.sum.push(spawnTracer('sum', true));
    tracers.y1.push(spawnTracer('y1', true));
    tracers.y2.push(spawnTracer('y2', true));
  }
}

// Main render pass
function drawAll() {
  const col = colors();

  // Background
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // === SCENE PANEL: Scrolling scope + live waveforms ===
  const sc = REG.scene;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(sc.x, sc.y, sc.w, sc.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sc.x + 0.5, sc.y + 0.5, sc.w - 1, sc.h - 1);

  // Fit domain [-2.2, 2.2] vertically within the scene for all three signals
  const fit_scene = fit(sc, 1, 2.2 * 3 + 0.3, { pad: 8, flipY: false });
  const h_sig = fit_scene.s(2.2);
  const y_center = (y) => fit_scene.y(2.2 + 1.1 + y * 1.1);

  // Three subpanels: y1, y2, sum (stacked vertically)
  const panelH = (sc.h - 16) / 3 - 2;
  const y1_y = sc.y + 8;
  const y2_y = y1_y + panelH + 2;
  const sum_y = y2_y + panelH + 2;

  // Helper: draw a signal band
  function drawSignalBand(label, yFunc, yStart, panelHeight, color) {
    ctx.fillStyle = 'rgba(10, 10, 14, 0.7)';
    ctx.fillRect(sc.x + 2, yStart, sc.w - 4, panelHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sc.x + 2, yStart, sc.w - 4, panelHeight);

    // Draw the signal
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const N = sc.w - 4;
    for (let i = 0; i < N; i += 1) {
      const t = state.tNow + (i / (N - 1)) * T_WINDOW;
      const yval = Math.max(-1.1, Math.min(1.1, yFunc(t)));
      const px = sc.x + 2 + i;
      const py = yStart + panelHeight * (1 - (yval + 1.1) / 2.2);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = fontString(canvas, 'caption', { family: 'mono' });
    ctx.textAlign = 'left';
    ctx.fillText(label, sc.x + 8, yStart + 14);
  }

  drawSignalBand('y₁(t)', (t) => y1(t, state.f1), y1_y, panelH, col.accentCool);
  drawSignalBand('y₂(t)', (t) => y2(t, state.f2), y2_y, panelH, col.accentWarm);
  drawSignalBand('sum (with envelope)', (t) => ySum(t, state.f1, state.f2), sum_y, panelH, col.accent);

  // Draw envelope shadow on the sum panel
  ctx.strokeStyle = 'rgba(255, 210, 138, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < sc.w - 4; i += 1) {
    const t = state.tNow + (i / (sc.w - 5)) * T_WINDOW;
    const env = Math.abs(envelope(t, state.f1, state.f2));
    const px = sc.x + 2 + i;
    const py = sum_y + panelH * (1 - (env + 1.1) / 2.2);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < sc.w - 4; i += 1) {
    const t = state.tNow + (i / (sc.w - 5)) * T_WINDOW;
    const env = -Math.abs(envelope(t, state.f1, state.f2));
    const px = sc.x + 2 + i;
    const py = sum_y + panelH * (1 - (env + 1.1) / 2.2);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Vertical "now" line (scrolling cursor)
  const nowX = sc.x + 2;
  ctx.strokeStyle = 'rgba(255, 210, 138, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(nowX, y1_y);
  ctx.lineTo(nowX, sum_y + panelH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Live readout overlay in the scene (bottom-right corner)
  const fb = beatRate(state.f1, state.f2);
  const fc = carrierFreq(state.f1, state.f2);
  const fenv = envelopeFreq(state.f1, state.f2);
  ctx.fillStyle = 'rgba(30, 30, 40, 0.75)';
  ctx.fillRect(sc.x + sc.w - 192, sc.y + sc.h - 100, 184, 92);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sc.x + sc.w - 192, sc.y + sc.h - 100, 184, 92);

  ctx.font = fontString(canvas, 'tick', { family: 'mono', size: 12 });
  ctx.fillStyle = col.accent;
  ctx.textAlign = 'right';
  let dy = sc.y + sc.h - 80;
  ctx.fillText(`f₁: ${state.f1.toFixed(2)} Hz`, sc.x + sc.w - 8, dy);
  dy += 15;
  ctx.fillText(`f₂: ${state.f2.toFixed(2)} Hz`, sc.x + sc.w - 8, dy);
  dy += 15;
  ctx.fillText(`beat: ${fb.toFixed(2)} Hz`, sc.x + sc.w - 8, dy);
  dy += 15;
  ctx.fillText(`carrier: ${fc.toFixed(2)} Hz`, sc.x + sc.w - 8, dy);
  dy += 15;
  ctx.fillText(`envelope: ${fenv.toFixed(3)} Hz`, sc.x + sc.w - 8, dy);

  // === PLOT PANEL: Beat envelope amplitude over time ===
  const pl = REG.plot;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pl.x + 0.5, pl.y + 0.5, pl.w - 1, pl.h - 1);

  // Fit the plot: time [state.tNow, state.tNow + T_WINDOW] x amplitude [0, 2]
  const fit_plot = fit(pl, T_WINDOW, 2.0, { pad: 6, flipY: false });

  // Draw envelope amplitude trace
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const plot_N = pl.w - 12;
  for (let i = 0; i < plot_N; i += 1) {
    const t = state.tNow + (i / (plot_N - 1)) * T_WINDOW;
    const env = Math.abs(envelope(t, state.f1, state.f2));
    const px = fit_plot.x(i / plot_N * T_WINDOW);
    const py = fit_plot.y(env);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Grid lines and labels
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.5;
  for (let f = 0; f <= 2; f += 1) {
    const py = fit_plot.y(f);
    ctx.beginPath();
    ctx.moveTo(pl.x + 6, py);
    ctx.lineTo(pl.x + pl.w - 6, py);
    ctx.stroke();
  }

  ctx.font = fontString(canvas, 'tick', { family: 'mono', size: 12 });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'right';
  for (let f = 0; f <= 2; f += 1) {
    const py = fit_plot.y(f);
    ctx.fillText(String(f), pl.x + 4, py + 3);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.font = fontString(canvas, 'tick', { family: 'mono', size: 12 });
  ctx.fillText('|envelope|', pl.x + pl.w / 2, pl.y + 10);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.tNow += 0.002;
    stepTracers(0.002);
  }
}

// Control event listeners
sliderF1.addEventListener('input', () => {
  state.f1 = parseFloat(sliderF1.value);
  valueF1.textContent = state.f1.toFixed(2);
  drawAll();
});
sliderF2.addEventListener('input', () => {
  state.f2 = parseFloat(sliderF2.value);
  valueF2.textContent = state.f2.toFixed(2);
  drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnReset.addEventListener('click', () => {
  reset();
  drawAll();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  layout();
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * T_WINDOW;
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
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function getState() {
  return {
    fields: [
      { key: 'f1', label: 'frequency f₁', value: state.f1, unit: 'Hz', format: 'fixed-2' },
      { key: 'f2', label: 'frequency f₂', value: state.f2, unit: 'Hz', format: 'fixed-2' },
      { key: 'carrier', label: 'carrier f̄', value: carrierFreq(state.f1, state.f2), unit: 'Hz', format: 'fixed-3' },
      { key: 'envelope', label: 'envelope f_b', value: envelopeFreq(state.f1, state.f2), unit: 'Hz', format: 'fixed-3' },
      { key: 'beat', label: 'audible beat', value: beatRate(state.f1, state.f2), unit: 'Hz', format: 'fixed-2' },
    ],
  };
};
window.playground.getInvariants = function getInvariants() {
  const f1 = state.f1, f2 = state.f2;
  const mk = (key, label, value, tol) => ({
    key, label, value, tolerance: tol,
    status: Math.abs(value) < tol ? 'pass' : 'drift',
  });
  return [
    mk('beat_rate', 'beat = |f₁ - f₂|', beatRate(f1, f2) - Math.abs(f1 - f2), 1e-9),
    mk('carrier', 'carrier = (f₁+f₂)/2', carrierFreq(f1, f2) - (f1 + f2) / 2, 1e-9),
    mk('envelope', 'envelope = |f₁-f₂|/2', envelopeFreq(f1, f2) - Math.abs(f1 - f2) / 2, 1e-9),
  ];
};
