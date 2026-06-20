// playground.js
// Beats from superposition of two close-frequency cosines.
//
// Vertical 4:5 composition, top to bottom:
//   1. HERO: the sum y1 + y2 inside a glowing envelope band whose colour
//      tracks the instantaneous amplitude (viridis), so the beat reads as a
//      swell-and-pinch even when the carrier is a dense hatch at small sizes.
//   2. COMPONENTS: y1 and y2 drawn together so you watch them drift into and
//      out of phase, tinted by the same envelope so "aligned" reads as "loud".
//   3. DIAGNOSTICS: a frequency spectrum (two lines that separate as the
//      detuning grows) beside the |envelope| trace with the beat period marked.

import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack, setupCanvas } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import {
  y1, y2, ySum, envelope, envelopeFreq, beatRate, carrierFreq,
} from './sim.js';

const urlParams = new URLSearchParams(location.search);
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

// Slider bounds, mirrored from the HTML, used for the spectrum frequency axis.
const F_LO = parseFloat(sliderF1.min);
const F_HI = parseFloat(sliderF1.max);

// Simulation state
const state = {
  f1: 5.0,
  f2: 4.7,
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// Logical drawing size (CSS px) and region rects, recomputed on resize.
let view = { w: 760, h: 950, dpr: 1 };
let REG = null;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// The visible time window adapts so roughly 1.7 beat periods are always on
// screen: tight detuning stretches the window, equal frequencies cap it.
function windowSpan() {
  const fb = beatRate(state.f1, state.f2);
  return clamp(1.7 / Math.max(fb, 1e-3), 3.5, 12);
}

function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }

// Colours from design tokens with fallbacks.
function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'),
    panel: '#0a0c12',
    fg: g('--fg', '#e8e8e8'),
    cool: g('--accent-cool', '#7fb1d8'),
    warm: g('--accent-warm', '#d68a69'),
    accent: g('--accent', '#ffd166'),
    grid: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.12)',
  };
}

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'sum', weight: 3.0 },
    { name: 'comp', weight: 1.5 },
    { name: 'diag', weight: 1.5 },
  ]);
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

// ---- HERO: sum inside a glowing envelope band -----------------------------
function drawHero(col, T) {
  const r = REG.sum;
  panel(col, r, null);

  const padL = 10, padR = 10, padTop = 26, padBot = 10;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, sw = x1 - x0;
  const yc = r.y + padTop + (r.h - padTop - padBot) / 2;
  const half = (r.h - padTop - padBot) / 2;
  const AMAX = 2.15;
  const ay = (a) => yc - (a / AMAX) * half;
  const tAt = (i) => state.tNow + (i / sw) * T;

  // Envelope band: one column per logical pixel, coloured by local amplitude.
  for (let i = 0; i <= sw; i += 1) {
    const env = Math.abs(envelope(tAt(i), state.f1, state.f2)); // 0..2
    const c = viridis(clamp(env / 2, 0, 1));
    ctx.fillStyle = rgba(c, 0.55);
    const yTop = ay(env), yBot = ay(-env);
    ctx.fillRect(x0 + i, yTop, 1, Math.max(1, yBot - yTop));
  }

  // Zero line.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, ay(0));
  ctx.lineTo(x1, ay(0));
  ctx.stroke();

  // Envelope outline (+/-), brighter than the band fill.
  for (const sign of [1, -1]) {
    ctx.strokeStyle = rgba(viridis(0.9), 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= sw; i += 1) {
      const env = Math.abs(envelope(tAt(i), state.f1, state.f2));
      const px = x0 + i, py = ay(sign * env);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // The sum waveform threaded through the band.
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= sw; i += 1) {
    const yv = clamp(ySum(tAt(i), state.f1, state.f2), -AMAX, AMAX);
    const px = x0 + i, py = ay(yv);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Rider dots bob on the sum and glow with the local amplitude: the motion
  // that makes a still frame read as alive.
  const nDots = Math.max(6, Math.round(sw / 60));
  for (let k = 0; k <= nDots; k += 1) {
    const i = (k / nDots) * sw;
    const t = tAt(i);
    const env = Math.abs(envelope(t, state.f1, state.f2));
    const yv = clamp(ySum(t, state.f1, state.f2), -AMAX, AMAX);
    const c = viridis(clamp(env / 2, 0, 1));
    const rad = 1.6 + 2.4 * clamp(env / 2, 0, 1);
    ctx.beginPath();
    ctx.fillStyle = rgba(c, 0.95);
    ctx.arc(x0 + i, ay(yv), rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mark the nearest beat node (the silence) inside the window.
  const fb = beatRate(state.f1, state.f2);
  if (fb > 1e-3) {
    // envelope zeros where cos(pi*df*t) = 0 -> t = (2n+1)/(2*df)
    const df = Math.abs(state.f1 - state.f2);
    const nFirst = Math.ceil((2 * df * state.tNow - 1) / 2);
    const tNode = (2 * nFirst + 1) / (2 * df);
    const frac = (tNode - state.tNow) / T;
    if (frac >= 0.04 && frac <= 0.96) {
      const xN = x0 + frac * sw;
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xN, r.y + padTop);
      ctx.lineTo(xN, r.y + r.h - padBot);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = fontString(canvas, 'caption', 'sans');
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('beat node', xN, r.y + r.h - padBot - 2);
    }
  }

  // Title.
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillStyle = col.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('y₁ + y₂', r.x + 8, r.y + 6);

  // Compact readout (top-right), self-contained for a Reel crop.
  const lines = [
    `f₁ ${state.f1.toFixed(2)} Hz`,
    `f₂ ${state.f2.toFixed(2)} Hz`,
    `beat ${fb.toFixed(2)} Hz`,
    `carrier ${carrierFreq(state.f1, state.f2).toFixed(2)} Hz`,
  ];
  ctx.font = fontString(canvas, 'mono', 'mono');
  const lh = 16;
  let bw = 0;
  for (const s of lines) bw = Math.max(bw, ctx.measureText(s).width);
  bw += 14;
  const bh = lines.length * lh + 10;
  const bx = r.x + r.w - bw - 8, by = r.y + 6;
  ctx.fillStyle = 'rgba(8,10,18,0.78)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = col.accent;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  let dy = by + 6;
  for (const s of lines) { ctx.fillText(s, bx + bw - 7, dy); dy += lh; }
}

// ---- COMPONENTS: y1 and y2 drifting in and out of phase -------------------
function drawComponents(col, T) {
  const r = REG.comp;
  panel(col, r, null);

  const padL = 10, padR = 10, padTop = 22, padBot = 8;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, sw = x1 - x0;
  const yc = r.y + padTop + (r.h - padTop - padBot) / 2;
  const half = (r.h - padTop - padBot) / 2;
  const AMAX = 1.18;
  const ay = (a) => yc - (a / AMAX) * half;
  const tAt = (i) => state.tNow + (i / sw) * T;

  // Faint envelope tint so loud regions (waves aligned) are visibly brighter.
  const step = 3;
  for (let i = 0; i <= sw; i += step) {
    const env = Math.abs(envelope(tAt(i), state.f1, state.f2));
    const c = viridis(clamp(env / 2, 0, 1));
    ctx.fillStyle = rgba(c, 0.10);
    ctx.fillRect(x0 + i, r.y + padTop, step, r.h - padTop - padBot);
  }

  const drawWave = (fn, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i <= sw; i += 1) {
      const yv = clamp(fn(tAt(i)), -AMAX, AMAX);
      const px = x0 + i, py = ay(yv);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };
  drawWave((t) => y1(t, state.f1), col.cool);
  drawWave((t) => y2(t, state.f2), col.warm);

  // Labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = col.cool;
  ctx.fillText('y₁', r.x + 8, r.y + 7);
  ctx.fillStyle = col.warm;
  ctx.fillText('y₂', r.x + 28, r.y + 7);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('aligned → loud', r.x + 56, r.y + 7);
}

// ---- DIAGNOSTICS: spectrum beside the |envelope| trace --------------------
function drawDiagnostics(col, T) {
  const r = REG.diag;
  const gap = 12;
  const leftW = Math.round(r.w * 0.42);
  const spec = { x: r.x, y: r.y, w: leftW - gap / 2, h: r.h };
  const env = { x: r.x + leftW + gap / 2, y: r.y, w: r.w - leftW - gap / 2, h: r.h };

  // Spectrum: two stems on a frequency axis that separate with the detuning.
  panel(col, spec, 'spectrum');
  {
    const padL = 8, padR = 8, padBot = 18, padTop = 24;
    const x0 = spec.x + padL, x1 = spec.x + spec.w - padR, sw = x1 - x0;
    const yBase = spec.y + spec.h - padBot;
    const yTop = spec.y + padTop;
    const fx = (f) => x0 + ((f - F_LO) / (F_HI - F_LO)) * sw;
    // Frequency axis ticks.
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 1;
    ctx.font = fontString(canvas, 'tick', 'mono');
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let f = Math.ceil(F_LO); f <= Math.floor(F_HI); f += 1) {
      const px = fx(f);
      ctx.beginPath();
      ctx.moveTo(px, yBase);
      ctx.lineTo(px, yBase + 3);
      ctx.stroke();
      ctx.fillText(String(f), px, yBase + 4);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.beginPath();
    ctx.moveTo(x0, yBase);
    ctx.lineTo(x1, yBase);
    ctx.stroke();
    // Stems (equal unit amplitude).
    const stem = (f, color) => {
      const px = fx(f);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, yBase);
      ctx.lineTo(px, yTop);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, yTop, 3, 0, Math.PI * 2);
      ctx.fill();
    };
    stem(state.f1, col.cool);
    stem(state.f2, col.warm);
  }

  // |envelope| over the window, with the beat period marked.
  panel(col, env, '|envelope|');
  {
    const padL = 10, padR = 8, padBot = 14, padTop = 24;
    const x0 = env.x + padL, x1 = env.x + env.w - padR, sw = x1 - x0;
    const yBase = env.y + env.h - padBot;
    const yTop = env.y + padTop;
    const EMAX = 2.05;
    const ey = (e) => yBase - (e / EMAX) * (yBase - yTop);
    const tAt = (i) => state.tNow + (i / sw) * T;
    // Gridlines at 0,1,2.
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 0.75;
    ctx.font = fontString(canvas, 'tick', 'mono');
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let e = 0; e <= 2; e += 1) {
      const py = ey(e);
      ctx.beginPath();
      ctx.moveTo(x0, py);
      ctx.lineTo(x1, py);
      ctx.stroke();
      ctx.fillText(String(e), x0 - 2, py);
    }
    // Trace.
    ctx.strokeStyle = col.accent;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= sw; i += 1) {
      const e = Math.abs(envelope(tAt(i), state.f1, state.f2));
      const px = x0 + i, py = ey(e);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Beat period span between two adjacent |envelope| maxima (t = k/df).
    const df = Math.abs(state.f1 - state.f2);
    if (df > 1e-3) {
      const Tb = 1 / df;
      const kFirst = Math.ceil(state.tNow * df);
      const ta = kFirst / df, tb = (kFirst + 1) / df;
      const xa = x0 + ((ta - state.tNow) / T) * sw;
      const xb = x0 + ((tb - state.tNow) / T) * sw;
      if (xa >= x0 && xb <= x1) {
        const yArr = yTop + 6;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xa, yArr); ctx.lineTo(xb, yArr);
        ctx.moveTo(xa, yArr - 3); ctx.lineTo(xa, yArr + 3);
        ctx.moveTo(xb, yArr - 3); ctx.lineTo(xb, yArr + 3);
        ctx.stroke();
        ctx.font = fontString(canvas, 'caption', 'sans');
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`T_b = ${Tb.toFixed(2)} s`, (xa + xb) / 2, yArr + 3);
      }
    }
  }
}

function drawAll() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  const T = windowSpan();
  drawHero(col, T);
  drawComponents(col, T);
  drawDiagnostics(col, T);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) state.tNow += 0.002;
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
  state.tNow = 0;
  drawAll();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); drawAll(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * windowSpan();
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
