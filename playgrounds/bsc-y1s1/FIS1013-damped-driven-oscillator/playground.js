// playground.js
// Damped, driven oscillator: x'' + 2 gamma x' + omega0^2 x = F0 cos(omega t).
//
// Vertical 4:5 composition, top to bottom:
//   1. OSCILLATOR: a mass on a spring, driven by a steady force, integrated
//      live. It swings huge at resonance and barely moves off it. The visceral
//      payoff, with the steady-state envelope drawn so you see the limit.
//   2. RESONANCE CURVE: analytic A(omega) coloured by amplitude (the peak
//      glows), with a live cursor at the current drive frequency.
//   3. TRACE: x(t) over a rolling window, showing the transient build-up to
//      steady state.

import { fontString } from '../../../shared/js/canvas-type.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createDriven, stepDriven, steadyAmplitude, steadyPhase, resonancePeak, qualityFactor,
  OMEGA0, F0,
} from './sim.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderOmega = document.getElementById('slider-omega');
const sliderGamma = document.getElementById('slider-gamma');
const sliderSpeed = document.getElementById('slider-speed');
const valueOmega = document.getElementById('value-omega');
const valueGamma = document.getElementById('value-gamma');
const valueSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const state = {
  omega: 1.0,
  gamma: 0.1,
  speed: 3,
  sim: null,
  trace: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

const T_TRACE_WINDOW = 24.0;  // rolling window (s)
// Reference displacement that maps to most of the mass track. The resonant
// amplitude is F0 / (2 gamma omega0); at gamma_min it is large, so the mass
// position is clamped to the track and the envelope shows the true value.
const X_REF = 6.0;

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }
function niceCeil(v) {
  if (v <= 0) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / e;
  const steps = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  for (const s of steps) if (m <= s + 1e-9) return s * e;
  return 10 * e;
}

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
    muted: 'rgba(255,255,255,0.5)',
    grid: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.12)',
  };
}

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'osc', weight: 1.5 },
    { name: 'curve', weight: 2.5 },
    { name: 'trace', weight: 1.3 },
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
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

// ---- OSCILLATOR: driven mass on a spring -----------------------------------
function drawOscillator(col) {
  const r = REG.osc;
  panel(col, r, null);
  const A = steadyAmplitude(state.omega, state.gamma);
  const x = state.sim ? state.sim.x : 0;

  const cy = r.y + r.h * 0.5;
  const xWall = r.x + 26;
  const trackR = r.x + r.w - 30;
  const xEq = (xWall + 40 + trackR) / 2;          // equilibrium near track centre
  const halfTrack = trackR - xEq - 24;            // mass half-size headroom
  const pxPerUnit = (halfTrack * 0.92) / X_REF;
  const massX = xEq + clamp(x * pxPerUnit, -halfTrack, halfTrack);
  const massR = 16;

  // Track baseline.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xWall, cy + massR + 6); ctx.lineTo(trackR, cy + massR + 6); ctx.stroke();

  // Steady-state envelope markers (analytic), clamped to the track.
  for (const sgn of [-1, 1]) {
    const ex = xEq + clamp(sgn * A * pxPerUnit, -halfTrack, halfTrack);
    ctx.strokeStyle = 'rgba(127,177,216,0.45)';
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ex, cy - massR - 14); ctx.lineTo(ex, cy + massR + 6); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.font = fontString(canvas, 'tick', 'sans');
  ctx.fillStyle = 'rgba(127,177,216,0.7)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('steady-state swing', xWall + 30, cy - massR - 16);

  // Equilibrium line.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xEq, cy - massR - 2); ctx.lineTo(xEq, cy + massR + 6); ctx.stroke();
  ctx.setLineDash([]);

  // Wall with hatching.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(xWall - 6, cy - 34, 6, 68);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  for (let yy = cy - 32; yy < cy + 34; yy += 7) {
    ctx.beginPath(); ctx.moveTo(xWall - 6, yy); ctx.lineTo(xWall - 12, yy + 6); ctx.stroke();
  }

  // Spring from wall to mass.
  const sx0 = xWall, sx1 = massX - massR;
  const coils = 14;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx0, cy);
  for (let i = 0; i <= coils; i += 1) {
    const fx = sx0 + (sx1 - sx0) * (i / coils);
    const yy = cy + (i % 2 === 0 ? -8 : 8) * (i > 0 && i < coils ? 1 : 0);
    ctx.lineTo(fx, yy);
  }
  ctx.lineTo(sx1, cy);
  ctx.stroke();

  // Motion ghosts from recent history (alive).
  if (state.trace.length > 2) {
    const n = state.trace.length;
    for (let g = 1; g <= 4; g += 1) {
      const pt = state.trace[n - 1 - g * 3];
      if (!pt) break;
      const gx = xEq + clamp(pt.x * pxPerUnit, -halfTrack, halfTrack);
      ctx.fillStyle = `rgba(127,177,216,${0.10 - g * 0.02})`;
      ctx.fillRect(gx - massR, cy - massR, massR * 2, massR * 2);
    }
  }

  // Mass, brightness scales with how hard it is swinging.
  const swing = clamp(Math.abs(x) / X_REF, 0, 1);
  const mc = viridis(0.35 + 0.5 * swing);
  ctx.fillStyle = rgba(mc, 0.95);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(massX - massR, cy - massR, massR * 2, massR * 2, 5);
  ctx.fill(); ctx.stroke();

  // Drive indicator below the track: an arrow whose length follows F0 cos(wt).
  if (state.sim) {
    const drive = F0 * Math.cos(state.omega * state.sim.t);
    const dxp = drive * pxPerUnit * 0.9;
    const ay = cy + massR + 26;
    ctx.strokeStyle = col.warm;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(xEq, ay); ctx.lineTo(xEq + dxp, ay); ctx.stroke();
    const dir = Math.sign(dxp) || 1;
    ctx.beginPath();
    ctx.moveTo(xEq + dxp, ay);
    ctx.lineTo(xEq + dxp - dir * 7, ay - 5);
    ctx.lineTo(xEq + dxp - dir * 7, ay + 5);
    ctx.closePath(); ctx.fillStyle = col.warm; ctx.fill();
    ctx.font = fontString(canvas, 'caption', 'sans');
    ctx.fillStyle = col.warm; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('drive force F₀cos(ωt)', xEq, ay + 8);
  }

  // Title + readout overlay.
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillStyle = col.cool; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('mass on a spring', r.x + 8, r.y + 7);

  const Q = qualityFactor(state.gamma);
  const phi = steadyPhase(state.omega, state.gamma) * 180 / Math.PI;
  const lines = [
    `ω ${state.omega.toFixed(2)}   ω₀ ${OMEGA0.toFixed(2)}`,
    `Q ${Q.toFixed(1)}   A ${A.toFixed(2)}   φ ${phi.toFixed(0)}°`,
  ];
  ctx.font = fontString(canvas, 'mono', 'mono');
  let bw = 0; for (const s of lines) bw = Math.max(bw, ctx.measureText(s).width);
  bw += 14;
  const bx = r.x + r.w - bw - 8, by = r.y + 6, lh = 16, bh = lines.length * lh + 8;
  ctx.fillStyle = 'rgba(8,10,18,0.78)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = col.accent; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  let dy = by + 5; for (const s of lines) { ctx.fillText(s, bx + bw - 7, dy); dy += lh; }
}

// ---- RESONANCE CURVE: A(omega) coloured by amplitude -----------------------
function drawCurve(col) {
  const r = REG.curve;
  panel(col, r, null);
  const padL = 40, padR = 14, padTop = 26, padBot = 26;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, sw = x1 - x0;
  const yBase = r.y + r.h - padBot, yTop = r.y + padTop, ph = yBase - yTop;
  const wMin = 0.2, wMax = 2.5;
  const fx = (w) => x0 + ((w - wMin) / (wMax - wMin)) * sw;

  let aPeak = 0;
  for (let i = 0; i <= sw; i += 2) {
    const w = wMin + (wMax - wMin) * i / sw;
    aPeak = Math.max(aPeak, steadyAmplitude(w, state.gamma));
  }
  const aMax = niceCeil(aPeak);
  const ay = (A) => yBase - (A / aMax) * ph;

  // y gridlines at nice integer-ish steps.
  const yStep = aMax / 4;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= aMax + 1e-9; v += yStep) {
    const py = ay(v);
    ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillText(Number.isInteger(v) ? String(v) : v.toFixed(1), x0 - 5, py);
  }

  // x axis.
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, yBase); ctx.lineTo(x1, yBase); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const w of [0.5, 1.0, 1.5, 2.0]) {
    const px = fx(w);
    ctx.beginPath(); ctx.moveTo(px, yBase); ctx.lineTo(px, yBase + 3); ctx.stroke();
    ctx.fillText(w.toFixed(1), px, yBase + 5);
  }
  // omega0 marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fx(OMEGA0), yTop); ctx.lineTo(fx(OMEGA0), yBase); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('ω₀', fx(OMEGA0), yTop + 12);

  // Curve, stroked per segment so colour can track amplitude (peak glows).
  let prev = null;
  for (let i = 0; i <= sw; i += 1) {
    const w = wMin + (wMax - wMin) * i / sw;
    const A = steadyAmplitude(w, state.gamma);
    const p = [x0 + i, ay(Math.min(A, aMax))];
    if (prev) {
      const c = viridis(clamp(A / aMax, 0, 1));
      ctx.strokeStyle = rgba(c, 0.95);
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    }
    prev = p;
  }

  // Live cursor at current drive frequency, with a dot on the curve.
  const cx = fx(state.omega);
  const Acur = Math.min(steadyAmplitude(state.omega, state.gamma), aMax);
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, yTop); ctx.lineTo(cx, yBase); ctx.stroke();
  ctx.fillStyle = col.accent;
  ctx.beginPath(); ctx.arc(cx, ay(Acur), 5, 0, Math.PI * 2); ctx.fill();

  // Labels.
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillStyle = col.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('A(ω): steady-state amplitude', r.x + 8, r.y + 7);
  ctx.font = fontString(canvas, 'caption', 'sans');
  ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('drive frequency ω', (x0 + x1) / 2, r.y + r.h - 4);
}

// ---- TRACE: x(t) over a rolling window -------------------------------------
function drawTrace(col) {
  const r = REG.trace;
  panel(col, r, null);
  const padL = 12, padR = 12, padTop = 22, padBot = 8;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, sw = x1 - x0;
  const yc = r.y + padTop + (r.h - padTop - padBot) / 2;
  const half = (r.h - padTop - padBot) / 2;
  const Anow = steadyAmplitude(state.omega, state.gamma);
  const yScale = Math.max(F0 * 1.2, Anow * 1.15);
  const ay = (a) => yc - clamp(a / yScale, -1, 1) * half;

  const tNow = state.sim ? state.sim.t : 0;
  const tStart = Math.max(0, tNow - T_TRACE_WINDOW);

  // Zero line.
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, ay(0)); ctx.lineTo(x1, ay(0)); ctx.stroke();

  // Drive (faint).
  ctx.strokeStyle = 'rgba(214,138,105,0.3)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let i = 0; i <= sw; i += 1) {
    const t = tStart + (T_TRACE_WINDOW * i / sw);
    const py = ay(F0 * Math.cos(state.omega * t));
    if (i === 0) ctx.moveTo(x0 + i, py); else ctx.lineTo(x0 + i, py);
  }
  ctx.stroke();

  // x(t).
  if (state.trace.length >= 2) {
    ctx.strokeStyle = col.cool; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    ctx.beginPath();
    let first = true;
    for (const pt of state.trace) {
      if (pt.t < tStart) continue;
      const px = x0 + ((pt.t - tStart) / T_TRACE_WINDOW) * sw;
      const py = ay(pt.x);
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Labels.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.cool; ctx.fillText('x(t)', r.x + 8, r.y + 6);
  ctx.fillStyle = col.warm; ctx.fillText('drive', r.x + 44, r.y + 6);
  ctx.fillStyle = col.muted; ctx.fillText('last 24 s', r.x + r.w - 70, r.y + 6);
}

function drawAll() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawOscillator(col);
  drawCurve(col);
  drawTrace(col);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepDriven(state.sim, 0.01);
    if (state.sim.nSteps % 2 === 0) {
      state.trace.push({ t: state.sim.t, x: state.sim.x });
      if (state.trace.length > 2600) state.trace.shift();
    }
  }
}

function resetSim() {
  state.sim = createDriven({ omega: state.omega, gamma: state.gamma });
  state.trace = [];
}

// Control handlers: omega/gamma update the cursor live on input, and restart
// the integration on change (release) so the transient is not retriggered on
// every pixel of a drag.
sliderOmega.addEventListener('input', () => {
  state.omega = parseFloat(sliderOmega.value);
  valueOmega.textContent = state.omega.toFixed(2);
  drawAll();
});
sliderOmega.addEventListener('change', () => { resetSim(); drawAll(); });
sliderGamma.addEventListener('input', () => {
  state.gamma = parseFloat(sliderGamma.value);
  valueGamma.textContent = state.gamma.toFixed(3);
  drawAll();
});
sliderGamma.addEventListener('change', () => { resetSim(); drawAll(); });
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnReset.addEventListener('click', () => { resetSim(); drawAll(); });
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
  resetSim();
  valueOmega.textContent = state.omega.toFixed(2);
  valueGamma.textContent = state.gamma.toFixed(3);
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    tickN(Math.round(frac * 4000));
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const q = qualityFactor(state.gamma);
  const amp = steadyAmplitude(state.omega, state.gamma);
  const phase = steadyPhase(state.omega, state.gamma);
  return {
    fields: [
      { key: 'omega-0', label: 'Natural freq (rad/s)', value: OMEGA0, format: 'float' },
      { key: 'omega-drive', label: 'Drive freq (rad/s)', value: state.omega, format: 'float' },
      { key: 'gamma', label: 'Damping coefficient', value: state.gamma, format: 'float' },
      { key: 'quality-factor', label: 'Quality factor Q', value: q, format: 'float' },
      { key: 'amplitude', label: 'Steady-state amplitude', value: amp, format: 'float' },
      { key: 'phase', label: 'Phase lag (deg)', value: phase * 180 / Math.PI, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  // Numerically observed amplitude (recent peak |x|) vs the analytic A(omega),
  // valid once the transient has decayed (a few Q periods).
  const A = steadyAmplitude(state.omega, state.gamma);
  let observed = 0;
  let settled = false;
  if (state.sim) {
    const periods = 6 * Math.max(1, qualityFactor(state.gamma)) * (2 * Math.PI / state.omega);
    settled = state.sim.t > Math.min(periods, 200);
    const tCut = state.sim.t - (2 * Math.PI / state.omega);
    for (const pt of state.trace) if (pt.t >= tCut) observed = Math.max(observed, Math.abs(pt.x));
  }
  const rel = A > 0 ? Math.abs(observed - A) / A : 0;
  return [
    {
      key: 'amp-match',
      label: 'numerical |x| matches A(ω)',
      value: settled ? rel.toExponential(2) : 'settling',
      status: !settled ? 'pending' : (rel < 0.08 ? 'pass' : (rel < 0.2 ? 'pending' : 'drift')),
    },
  ];
};
