// playground.js
// Projectile motion with three drag laws (vacuum, Stokes, quadratic), fired
// together. Vertical 4:5 composition:
//   1. SCENE: the three balls fly and trace their arcs (isotropic, so the
//      parabola keeps its true shape), land at marked ranges, descend steeper
//      under drag. Launch wedge and readout fill the headroom.
//   2. RANGE vs ANGLE: the range as a function of launch angle for each drag
//      law, with a cursor at the current angle and a marker at each optimum.
//      The vacuum range peaks at 45 degrees; drag pushes the optimum lower.

import { createProjectile, stepProjectile, vacuumRange, vacuumPeak, G } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderV = document.getElementById('slider-v');
const sliderAng = document.getElementById('slider-ang');
const sliderDrag = document.getElementById('slider-drag');
const sliderSpeed = document.getElementById('slider-speed');
const valueV = document.getElementById('value-v');
const valueAng = document.getElementById('value-ang');
const valueDrag = document.getElementById('value-drag');
const valueSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const DRAG_B0 = 0.20;   // Stokes coefficient at drag strength 1
const DRAG_C0 = 0.012;  // quadratic coefficient at drag strength 1
const dragB = () => DRAG_B0 * state.drag;
const dragC = () => DRAG_C0 * state.drag;
const KEYS = ['none', 'stokes', 'quadratic'];
const COL = { none: '#f1d28a', stokes: '#7fb1d8', quadratic: '#e0925f' };
const NAME = { none: 'vacuum', stokes: 'Stokes drag', quadratic: 'quadratic drag' };

const state = {
  v0: 20,
  angle: 45,
  drag: 1,
  speed: 2,
  sims: null,
  trails: { none: [], stokes: [], quadratic: [] },
  landed: { none: false, stokes: false, quadratic: false },
  holdT: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.2 },
    { name: 'ra', weight: 1.25 },
  ]);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function niceCeil(v) {
  if (v <= 0) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / e;
  for (const s of [1, 1.5, 2, 3, 4, 5, 6, 8, 10]) if (m <= s + 1e-9) return s * e;
  return 10 * e;
}
function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'),
    panel: '#0a0c12',
    fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)',
    accent: g('--accent', '#ffd166'),
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.10)',
  };
}
function panel(col, r) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

function rebuild() {
  state.sims = {
    none: createProjectile({ v0: state.v0, angleDeg: state.angle, dragMode: 'none' }),
    stokes: createProjectile({ v0: state.v0, angleDeg: state.angle, dragMode: 'stokes', b: dragB() }),
    quadratic: createProjectile({ v0: state.v0, angleDeg: state.angle, dragMode: 'quadratic', c: dragC() }),
  };
  state.trails = { none: [], stokes: [], quadratic: [] };
  state.landed = { none: false, stokes: false, quadratic: false };
  state.holdT = 0;
}

// Range as a function of launch angle, integrated for the drag laws. Cached
// per launch speed since only v0 changes the curve, not the live angle cursor.
function computeRange(v0, angDeg, mode) {
  const s = createProjectile({ v0, angleDeg: angDeg, dragMode: mode, b: dragB(), c: dragC() });
  for (let i = 0; i < 6000; i += 1) {
    const x0 = s.x, y0 = s.y;
    stepProjectile(s, 0.02);
    if (s.y < 0) { const f = y0 / (y0 - s.y); return x0 + f * (s.x - x0); }
  }
  return s.x;
}
let rangeCurve = null, rangeCurveV0 = null, rangeCurveDrag = null;
function buildRangeCurve() {
  const data = [];
  for (let a = 1; a <= 89; a += 1) {
    data.push({
      a,
      none: vacuumRange(state.v0, a),
      stokes: computeRange(state.v0, a, 'stokes'),
      quadratic: computeRange(state.v0, a, 'quadratic'),
    });
  }
  rangeCurve = data; rangeCurveV0 = state.v0; rangeCurveDrag = state.drag;
}
function optimum(key) {
  let best = rangeCurve[0];
  for (const d of rangeCurve) if (d[key] > best[key]) best = d;
  return best;
}

function arrow(x0, y0, x1, y1, color, width, head) {
  const a = Math.atan2(y1 - y0, x1 - x0), hl = head || 8;
  ctx.strokeStyle = color; ctx.lineWidth = width || 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - hl * Math.cos(a - 0.4), y1 - hl * Math.sin(a - 0.4));
  ctx.lineTo(x1 - hl * Math.cos(a + 0.4), y1 - hl * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

function drawScene(col) {
  const r = REG.scene;
  panel(col, r);
  const padL = 34, padR = 16, padT = 50, padB = 26;
  const aw = r.w - padL - padR, ah = r.h - padT - padB;
  const xMax = Math.max(10, vacuumRange(state.v0, state.angle) * 1.12);
  const yMax = Math.max(4, vacuumPeak(state.v0, state.angle) * 1.3);
  const scale = Math.min(aw / xMax, ah / yMax);   // isotropic, true shape
  const ox = r.x + padL;
  const gy = r.y + r.h - padB;                     // ground y (world y = 0)
  const X = (x) => ox + x * scale;
  const Y = (y) => gy - y * scale;

  // Ground line.
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(X(0), gy); ctx.lineTo(r.x + r.w - padR, gy); ctx.stroke();

  // Trails + landing markers + live balls.
  for (const key of KEYS) {
    const tr = state.trails[key];
    if (tr.length >= 2) {
      ctx.strokeStyle = COL[key]; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < tr.length; i += 1) {
        const p = [X(tr[i][0]), Y(Math.max(0, tr[i][1]))];
        if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }
    // landing tick
    if (state.landed[key] && tr.length) {
      const lx = tr[tr.length - 1][0];
      ctx.strokeStyle = COL[key]; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(lx), gy - 5); ctx.lineTo(X(lx), gy + 5); ctx.stroke();
    }
    const s = state.sims[key];
    if (s.y >= 0) {
      ctx.fillStyle = COL[key];
      ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  // Launch wedge: angle arc + v0 arrow at the origin.
  const aRad = state.angle * Math.PI / 180;
  const wl = Math.min(64, 0.9 * vacuumPeak(state.v0, state.angle) * scale + 26);
  arrow(X(0), gy, X(0) + wl * Math.cos(aRad), gy - wl * Math.sin(aRad), col.accent, 2, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(X(0), gy, 22, -aRad, 0); ctx.stroke();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = col.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${state.angle}°`, X(0) + 26, gy - 12);

  // The single shared legend (swatch + name) explains the colours for both
  // panels in one place. Draw it first so we know its width, then place the
  // v0/theta readout to its right, dropping to a second row on narrow (phone)
  // folds where the two would otherwise collide.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let lx = r.x + 10;
  for (const key of KEYS) {
    ctx.fillStyle = COL[key];
    ctx.beginPath(); ctx.arc(lx + 4, r.y + 14, 4, 0, 6.28); ctx.fill();
    ctx.fillStyle = col.fg;
    ctx.fillText(NAME[key], lx + 12, r.y + 14);
    lx += 12 + ctx.measureText(NAME[key]).width + 16;
  }
  ctx.font = fontString(canvas, 'mono', 'mono');
  const readout = `v₀ ${state.v0} m/s   θ ${state.angle}°`;
  const rw = ctx.measureText(readout).width;
  const fits = (r.x + r.w - 10 - rw) > (lx + 8);
  ctx.fillStyle = col.fg; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(readout, r.x + r.w - 10, fits ? r.y + 14 : r.y + 34);
}

function drawRangeAngle(col) {
  const r = REG.ra;
  panel(col, r);
  const padL = 42, padR = 16, padT = 30, padB = 30;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  if (!rangeCurve) return;
  let rMax = 0;
  for (const d of rangeCurve) for (const k of KEYS) rMax = Math.max(rMax, d[k]);
  rMax = niceCeil(rMax * 1.05);
  const fx = (a) => x0 + (a / 90) * pw;
  const fy = (rr) => y1 - (rr / rMax) * ph;

  // Grid + axes.
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= rMax + 1e-9; v += rMax / 4) {
    const py = fy(v);
    ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillText(String(Math.round(v)), x0 - 5, py);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let a = 0; a <= 90; a += 15) {
    const px = fx(a);
    ctx.strokeStyle = a === 45 ? 'rgba(241,210,138,0.30)' : col.grid;
    ctx.lineWidth = a === 45 ? 1.1 : 0.6;
    ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y1); ctx.stroke();
    ctx.fillStyle = col.muted; ctx.fillText(`${a}°`, px, y1 + 5);
  }

  // Curves.
  for (const key of KEYS) {
    ctx.strokeStyle = COL[key]; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.beginPath();
    rangeCurve.forEach((d, i) => {
      const px = fx(d.a), py = fy(d[key]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    // optimum marker, annotated with its best angle (the curves' colours are
    // explained by the legend in the scene above, so no names repeated here).
    const o = optimum(key);
    ctx.fillStyle = COL[key];
    ctx.beginPath(); ctx.arc(fx(o.a), fy(o[key]), 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${o.a}°`, fx(o.a), fy(o[key]) - 5);
  }

  // Cursor at current angle.
  const cxp = fx(state.angle);
  ctx.strokeStyle = col.accent; ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(cxp, y0); ctx.lineTo(cxp, y1); ctx.stroke();
  ctx.setLineDash([]);

  // Title + axis label only; the dots carry the best angle, and drag pushes the
  // best angle below the 45 deg line that vacuum sits on.
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.accent;
  ctx.fillText('range vs launch angle  (dot = best angle)', r.x + 10, r.y + 8);
  ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.font = fontString(canvas, 'caption', 'sans');
  ctx.fillText('launch angle', (x0 + x1) / 2, r.y + r.h - 2);
}

function drawAll() {
  if (!REG) relayout();
  if (!rangeCurve || rangeCurveV0 !== state.v0 || rangeCurveDrag !== state.drag) buildRangeCurve();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  if (!state.sims) return;
  drawScene(col);
  drawRangeAngle(col);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    for (const key of KEYS) {
      const s = state.sims[key];
      if (state.landed[key]) continue;
      stepProjectile(s, 0.01);
      if (s.y < 0 && s.t > 0.05) { s.y = 0; state.landed[key] = true; }
      state.trails[key].push([s.x, Math.max(0, s.y)]);
      if (state.trails[key].length > 6000) state.trails[key].shift();
    }
  }
}

sliderV.addEventListener('change', () => { state.v0 = parseInt(sliderV.value, 10); valueV.textContent = String(state.v0); rebuild(); drawAll(); });
sliderV.addEventListener('input', () => { valueV.textContent = String(parseInt(sliderV.value, 10)); });
sliderAng.addEventListener('input', () => { state.angle = parseInt(sliderAng.value, 10); valueAng.textContent = `${state.angle} deg`; rebuild(); drawAll(); });
// Drag strength rebuilds the range curve (expensive), so commit on release.
sliderDrag.addEventListener('input', () => { valueDrag.textContent = `${parseFloat(sliderDrag.value).toFixed(1)}x`; });
sliderDrag.addEventListener('change', () => { state.drag = parseFloat(sliderDrag.value); valueDrag.textContent = `${state.drag.toFixed(1)}x`; rebuild(); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => {
  state.v0 = 20; state.angle = 45; state.drag = 1;
  sliderV.value = '20'; sliderAng.value = '45'; if (sliderDrag) sliderDrag.value = '1';
  valueV.textContent = '20'; valueAng.textContent = '45 deg'; if (valueDrag) valueDrag.textContent = '1.0x';
  rebuild(); drawAll();
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
  rebuild();
  valueV.textContent = String(state.v0);
  valueAng.textContent = `${state.angle} deg`;
  if (valueDrag) valueDrag.textContent = `${state.drag.toFixed(1)}x`;
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const tFlight = 2 * state.v0 * Math.sin(state.angle * Math.PI / 180) / G;
    const target = Math.max(1, Math.round(frac * (tFlight / 0.01) * 0.96));
    tickN(target);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  drawAll();
}

let liveFrame = 0;
function tick() {
  if (state.playing) {
    const allLanded = KEYS.every((k) => state.landed[k]);
    if (allLanded) {
      state.holdT += 1;
      if (state.holdT > 80) rebuild();   // brief hold, then replay
    } else {
      liveFrame += 1;
      tickN(state.speed);
    }
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
  // Predicted quadratic-drag range at the current angle, read from the cached
  // sweep so the rail shows the same value the curve plots (consistent with the
  // analytic vacuum range, not the live landed distance which is 0 mid-flight).
  const rangeQuad = () => {
    if (rangeCurve) {
      const d = rangeCurve.find((e) => e.a === Math.round(state.angle));
      if (d) return d.quadratic;
    }
    return computeRange(state.v0, state.angle, 'quadratic');
  };
  return {
    fields: [
      { key: 'v0', label: 'launch speed v0 (m/s)', value: state.v0, format: 'float' },
      { key: 'angle', label: 'launch angle (deg)', value: state.angle, format: 'float' },
      { key: 'range-vac', label: 'range vacuum (m)', value: vacuumRange(state.v0, state.angle), format: 'float' },
      { key: 'range-quad', label: 'range quad drag (m)', value: rangeQuad(), format: 'float' },
    ],
  };
};
let __projE0 = null, __projRef = null;
window.playground.getInvariants = function () {
  const none = state.sims && state.sims.none;
  if (!none) return [];
  const E = 0.5 * (none.vx * none.vx + none.vy * none.vy) + G * Math.max(0, none.y);
  if (state.sims !== __projRef) { __projRef = state.sims; __projE0 = E; }
  const drift = Math.abs(E - __projE0) / Math.max(1e-9, Math.abs(__projE0));
  return [{
    key: 'energy',
    label: 'no-drag flight conserves v^2/2 + g y',
    value: drift.toExponential(2),
    status: drift < 1e-2 ? 'pass' : (drift < 1e-1 ? 'pending' : 'drift'),
  }];
};
