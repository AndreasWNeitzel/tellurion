// playground.js
// Beats from superposition of two close-frequency waves.
//
// Vertical 4:5 composition, top to bottom:
//   1. HERO (space): the same two close frequencies travelling in a dispersive
//      medium (deep-water ripples). The superposition is a moving wave group;
//      balls ride the carrier crests at the phase velocity while the group
//      envelope creeps at half that speed. Velocity arrows make the contrast
//      explicit. This is where group vs phase velocity lives.
//   2. COMPONENTS (time): y1 and y2 at a fixed point, drifting in and out of
//      phase: what an ear at one spot hears.
//   3. DIAGNOSTICS (time): a frequency spectrum (two lines that separate as the
//      detuning grows) beside the |envelope| trace with the beat period marked.

import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack, setupCanvas } from '../../../shared/js/render/vertical-layout.js';
import {
  y1, y2, ySum, envelope, envelopeFreq, beatRate, carrierFreq,
  yField, envelopeField, phaseVel, groupVel,
  carrierWavelength, beatWavelength, waveK, omega,
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
  speed: 3,
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

// ---- HERO: a travelling beat in space, crests outrunning the group --------
// The same two close frequencies in a dispersive medium (deep-water ripples).
// Superposition makes a moving wave group: the carrier crests stream forward
// at the phase velocity while the group envelope creeps at half that speed.
function spatialWindow() {
  const lc = carrierWavelength(state.f1, state.f2);
  if (!isFinite(lc)) return 1;
  const lb = beatWavelength(state.f1, state.f2);
  const Lbeat = 2.1 * (isFinite(lb) ? lb : 30 * lc);
  return clamp(Lbeat, 6 * lc, 30 * lc);
}

function drawHero(col) {
  const r = REG.sum;
  panel(col, r, null);

  const padL = 12, padR = 12, padTop = 46, padBot = 30;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, sw = x1 - x0;
  const yc = r.y + padTop + (r.h - padTop - padBot) / 2;
  const half = (r.h - padTop - padBot) / 2;
  const AMAX = 2.25;
  const ay = (a) => yc - (a / AMAX) * half;
  const L = spatialWindow();
  const t = state.tNow;
  const xAt = (i) => (i / sw) * L;          // metres
  const sxOf = (xm) => x0 + (xm / L) * sw;   // metres -> screen x

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x + 1, r.y + padTop - 8, r.w - 2, (r.h - padTop - padBot) + 16);
  ctx.clip();

  // Zero line.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, ay(0)); ctx.lineTo(x1, ay(0)); ctx.stroke();

  // Group envelope outline (+/-), muted so the sum and riders stay legible.
  for (const sign of [1, -1]) {
    ctx.strokeStyle = 'rgba(170,196,222,0.40)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i <= sw; i += 1) {
      const e = Math.abs(envelopeField(xAt(i), t, state.f1, state.f2));
      const py = ay(sign * e);
      if (i === 0) ctx.moveTo(x0, py); else ctx.lineTo(x0 + i, py);
    }
    ctx.stroke();
  }

  // The travelling sum.
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= sw; i += 1) {
    const yv = clamp(yField(xAt(i), t, state.f1, state.f2), -AMAX, AMAX);
    if (i === 0) ctx.moveTo(x0, ay(yv)); else ctx.lineTo(x0 + i, ay(yv));
  }
  ctx.stroke();

  const dk = waveK(state.f1) - waveK(state.f2);
  const dw = omega(state.f1) - omega(state.f2);
  const kbar = 0.5 * (waveK(state.f1) + waveK(state.f2));
  const wbar = 0.5 * (omega(state.f1) + omega(state.f2));
  const yTopM = ay(2.3), yBotM = ay(-2.3);

  // Group markers: a vertical line on EVERY envelope peak, all moving together
  // at the group velocity (peaks sit at dk x - dw t = 2 pi m). Steady markers
  // on every low-frequency crest, not a single jumping one.
  if (Math.abs(dk) > 1e-9) {
    const mLo = Math.ceil((dk * 0 - dw * t) / (2 * Math.PI));
    const mHi = Math.floor((dk * L - dw * t) / (2 * Math.PI));
    for (let m = mLo; m <= mHi; m += 1) {
      const xs = sxOf((2 * Math.PI * m + dw * t) / dk);
      ctx.fillStyle = 'rgba(214,138,105,0.10)';
      ctx.fillRect(xs - 6, yTopM, 12, yBotM - yTopM);
      ctx.strokeStyle = col.warm; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xs, yTopM); ctx.lineTo(xs, yBotM); ctx.stroke();
    }
  }

  // Balls riding the carrier crests (stream right at the phase velocity).
  if (kbar > 1e-9) {
    const nLo = Math.ceil((-wbar * t) / (2 * Math.PI));
    const nHi = Math.floor((kbar * L - wbar * t) / (2 * Math.PI));
    for (let n = nLo; n <= nHi; n += 1) {
      const xn = (2 * Math.PI * n + wbar * t) / kbar;
      const yv = envelopeField(xn, t, state.f1, state.f2);
      ctx.fillStyle = col.cool;
      ctx.beginPath();
      ctx.arc(sxOf(xn), ay(clamp(yv, -AMAX, AMAX)), 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Phase marker: ONE vertical line gliding at the phase velocity. It is not
  // snapped to a crest, so it moves smoothly (at the carrier-crest speed) and
  // visibly overtakes the group lines; for deep water v_phase = 2 v_group.
  {
    const vpHere = phaseVel(state.f1, state.f2);
    const xPhase = L > 0 ? (((vpHere * t) % L) + L) % L : 0;
    const xs = sxOf(xPhase);
    ctx.strokeStyle = col.cool; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(xs, yTopM); ctx.lineTo(xs, yBotM); ctx.stroke();
    ctx.fillStyle = col.cool;
    ctx.beginPath(); ctx.moveTo(xs, yTopM); ctx.lineTo(xs - 4, yTopM - 6); ctx.lineTo(xs + 4, yTopM - 6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Title (top-left).
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillStyle = col.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('y(x): a travelling beat', r.x + 8, r.y + 6);

  // Velocity arrows from a common origin: phase crests stream forward; the
  // group creeps at half the speed (the exact deep-water result). Phase on
  // top in cool, group below in warm, so they match the riders and the band.
  const vp = phaseVel(state.f1, state.f2), vg = groupVel(state.f1, state.f2);
  const ax0 = r.x + 16;
  const maxLen = Math.min(140, (r.w - 60) * 0.40);
  const vmax = Math.max(vp, 1e-6);
  const arrow = (yy, len, color, lab) => {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(ax0, yy); ctx.lineTo(ax0 + Math.max(6, len), yy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax0 + Math.max(6, len), yy);
    ctx.lineTo(ax0 + Math.max(6, len) - 7, yy - 4);
    ctx.lineTo(ax0 + Math.max(6, len) - 7, yy + 4);
    ctx.closePath(); ctx.fill();
    ctx.font = fontString(canvas, 'caption', 'mono', 700);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(lab, ax0 + maxLen + 12, yy);
  };
  arrow(r.y + 27, maxLen * (vp / vmax), col.cool, `phase ${vp.toFixed(2)} m/s`);
  arrow(r.y + 41, maxLen * (vg / vmax), col.warm, `group ${vg.toFixed(2)} m/s`);

  // Compact f1/f2 readout (top-right) so a Reel crop of just the hero is
  // self-contained.
  const lines = [`f₁ ${state.f1.toFixed(2)} Hz`, `f₂ ${state.f2.toFixed(2)} Hz`];
  ctx.font = fontString(canvas, 'mono', 'mono');
  let bw = 0;
  for (const s of lines) bw = Math.max(bw, ctx.measureText(s).width);
  bw += 14;
  const bx = r.x + r.w - bw - 8, by = r.y + 6;
  ctx.fillStyle = 'rgba(8,10,18,0.78)';
  ctx.fillRect(bx, by, bw, lines.length * 16 + 8);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, lines.length * 16 + 7);
  ctx.fillStyle = col.fg; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  let dy = by + 5;
  for (const s of lines) { ctx.fillText(s, bx + bw - 7, dy); dy += 16; }
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
  ctx.fillText('at one point, over time: in and out of phase', r.x + 56, r.y + 7);
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
  drawHero(col);
  drawComponents(col, T);
  drawDiagnostics(col, T);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) state.tNow += 0.003;
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
      { key: 'beat', label: 'audible beat', value: beatRate(state.f1, state.f2), unit: 'Hz', format: 'fixed-2' },
      { key: 'vp', label: 'phase velocity', value: phaseVel(state.f1, state.f2), unit: 'm/s', format: 'fixed-3' },
      { key: 'vg', label: 'group velocity', value: groupVel(state.f1, state.f2), unit: 'm/s', format: 'fixed-3' },
      { key: 'ratio', label: 'v_p / v_g', value: groupVel(state.f1, state.f2) > 1e-9 ? phaseVel(state.f1, state.f2) / groupVel(state.f1, state.f2) : 0, format: 'fixed-2' },
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
    mk('group_half', 'v_group = v_phase / 2', groupVel(f1, f2) - 0.5 * phaseVel(f1, f2), 1e-6),
  ];
};
