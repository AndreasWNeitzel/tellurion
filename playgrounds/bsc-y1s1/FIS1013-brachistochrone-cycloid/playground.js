import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
// playground.js
// Brachistochrone race: cycloid vs straight line vs a concave
// reference curve vs a USER-DRAWN curve. The user drags two control
// points to shape their own path from A to B and races it against
// the cycloid; the descent-time bars at the bottom are the
// diagnostic that proves nothing beats the cycloid.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  positionOnCycloid, positionOnLine,
  cycloidCurve, lineCurve, concaveCurve,
  descentTime, buildCurve,
  T_CYCLOID, T_LINE, X_B, Y_B, G,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const sliderHandles = document.getElementById('slider-handles');
const valueHandles  = document.getElementById('value-handles');
const selCurve      = document.getElementById('select-curve');
const valueCurve    = document.getElementById('value-curve');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const CURVE_LABEL = { spline: 'smooth spline', segments: 'straight segments', catmull: 'Catmull-Rom', bezier: 'Bezier' };
// Spread n interior handles along x, dipping toward the cycloid-ish default.
function defaultHandles(n) {
  const pts = [];
  for (let i = 1; i <= n; i += 1) {
    const fx = i / (n + 1);
    pts.push([X_B * fx, -Y_B * Math.sqrt(fx) * 0.9]);
  }
  return pts;
}

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'race', weight: 2.4 },
    { name: 'bars', weight: 1.6 },
  ]);
}

const T_CONCAVE = descentTime(concaveCurve(160)).time;

const state = {
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  // User control points (interior), world coords. Default: a gentle arc.
  userPts: [[X_B * 0.33, -Y_B * 0.30], [X_B * 0.66, -Y_B * 0.62]],
  curveType: 'spline',
  dragIdx: -1,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function reset() { state.tNow = 0; }

// ---- user-curve descent table -------------------------------------------
// Build a (t -> position) table for the user's curve by integrating
// ds / v along the sampled polyline.
let userTable = null;
function rebuildUserTable() {
  const pts = buildCurve(state.userPts, state.curveType, 140);
  const ts = [0];
  let T = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const ds = Math.hypot(x1 - x0, y1 - y0);
    const v0 = Math.sqrt(2 * G * Math.max(0, -y0));
    const v1 = Math.sqrt(2 * G * Math.max(0, -y1));
    T += ds / Math.max(0.05, 0.5 * (v0 + v1));
    ts.push(T);
  }
  userTable = { pts, ts, T };
}
function positionOnUser(t) {
  if (!userTable) rebuildUserTable();
  const { pts, ts, T } = userTable;
  if (t >= T) return { x: X_B, y: -Y_B, done: true };
  let lo = 0, hi = ts.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] < t) lo = mid; else hi = mid;
  }
  const dt = ts[hi] - ts[lo];
  const f = dt > 0 ? (t - ts[lo]) / dt : 0;
  return {
    x: pts[lo][0] + f * (pts[hi][0] - pts[lo][0]),
    y: pts[lo][1] + f * (pts[hi][1] - pts[lo][1]),
    done: false,
  };
}

function tMax() {
  return Math.max(T_CYCLOID, T_LINE, T_CONCAVE, userTable ? userTable.T : 0) * 1.05;
}

// ---- coordinate transform (isotropic, into the race region) -------------
function raceMap() {
  const r = REG.race;
  const wx = X_B + 0.6, wy = Y_B + 0.8;
  const padX = 34, padTop = 52, padBot = 24;
  const aw = r.w - 2 * padX, ah = r.h - padTop - padBot;
  const scale = Math.min(aw / wx, ah / wy);
  const ox = r.x + padX + (aw - wx * scale) / 2 + 0.3 * scale;
  const oy = r.y + padTop;
  return { ox, oy, scale };
}
function worldToPx(x, y) {
  const m = raceMap();
  return { px: m.ox + x * m.scale, py: m.oy + (-y) * m.scale };
}
function pxToWorld(px, py) {
  const m = raceMap();
  return [(px - m.ox) / m.scale, -((py - m.oy) / m.scale)];
}

function drawCurve(pts, color, lw = 2.0, dash = null) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 1) {
    const p = worldToPx(pts[i][0], pts[i][1]);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
}

function drawAll() {
  if (!REG) relayout();
  if (!userTable) rebuildUserTable();
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, view.w, view.h);

  const RS = REG.race;
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(RS.x, RS.y, RS.w, RS.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.strokeRect(RS.x + 0.5, RS.y + 0.5, RS.w - 1, RS.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('race to B', RS.x + 8, RS.y + 7);
  ctx.font = fontString(canvas, 'caption', 'sans');
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('drag the handles to shape your own ramp', RS.x + 70, RS.y + 7);
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`t = ${state.tNow.toFixed(2)} s`, RS.x + RS.w - 8, RS.y + 7);

  const A = worldToPx(0, 0);
  const B = worldToPx(X_B, -Y_B);

  // Reference curves.
  drawCurve(cycloidCurve(180), 'rgba(127, 177, 216, 0.85)', 2.4);
  drawCurve(concaveCurve(160), 'rgba(241, 210, 138, 0.45)', 1.8);
  drawCurve(lineCurve(40), 'rgba(214, 138, 105, 0.45)', 1.8);
  // User curve, bold.
  drawCurve(userTable.pts, '#9be8b0', 2.6);

  // User control handles.
  for (let i = 0; i < state.userPts.length; i += 1) {
    const p = worldToPx(state.userPts[i][0], state.userPts[i][1]);
    ctx.fillStyle = state.dragIdx === i ? '#ffd166' : '#ffffff';
    ctx.beginPath(); ctx.arc(p.px, p.py, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9be8b0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.px, p.py, 8, 0, Math.PI * 2); ctx.stroke();
  }

  // Endpoints.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = fontString(canvas, 'body', 'mono');
  ctx.textAlign = 'right';
  ctx.fillText('A', A.px - 10, A.py + 4);
  ctx.textAlign = 'left';
  ctx.fillText('B', B.px + 10, B.py + 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath(); ctx.arc(A.px, A.py, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(B.px, B.py, 4, 0, Math.PI * 2); ctx.fill();

  // Beads.
  const t = state.tNow;
  function drawBead(p, color, label) {
    const px = worldToPx(p.x, p.y);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px.px, px.py, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px.px, px.py, 6.5, 0, Math.PI * 2); ctx.stroke();
    if (label) {
      ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillStyle = color; ctx.textAlign = 'left';
      ctx.fillText(label, px.px + 9, px.py - 6);
    }
  }
  drawBead(positionOnCycloid(t), tok.accentCool, 'cycloid');
  drawBead(positionOnLine(t), tok.accentWarm, 'line');
  drawBead(positionOnUser(t), '#9be8b0', 'yours');

  // ---- diagnostic: descent-time bars --------------------------------------
  const BR = REG.bars;
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(BR.x, BR.y, BR.w, BR.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.strokeRect(BR.x + 0.5, BR.y + 0.5, BR.w - 1, BR.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('descent time (shorter is faster)', BR.x + 8, BR.y + 7);
  const tm = tMax();
  const barX = BR.x + 14, barW = BR.w - 28, barH = 15;
  const rowH = (BR.h - 36) / 4;
  let barY = BR.y + 36 + (rowH - barH) / 2 + 4;
  function drawTimeBar(tStop, color, label, isUser) {
    ctx.fillStyle = '#07090f';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    const px = barX + barW * (tStop / tm);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(px, barY); ctx.lineTo(px, barY + barH); ctx.stroke();
    ctx.setLineDash([]);
    const tFill = Math.min(state.tNow, tStop);
    ctx.fillStyle = color;
    ctx.fillRect(barX + 1, barY + 2, Math.max(0, barW * (tFill / tm) - 1), barH - 4);
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, barX, barY - 2);
    ctx.textAlign = 'right';
    const delta = tStop - T_CYCLOID;
    const deltaStr = delta <= 1e-4 ? ' (optimal)' : ` (+${delta.toFixed(2)} s)`;
    ctx.fillStyle = isUser ? (delta <= 1e-4 ? '#9be8b0' : '#ffd166') : 'rgba(255,255,255,0.7)';
    ctx.font = fontString(canvas, 'mono', 'mono');
    ctx.fillText(`${tStop.toFixed(2)} s${deltaStr}`, barX + barW, barY - 2);
    barY += rowH;
  }
  drawTimeBar(T_CYCLOID, tok.accentCool, 'cycloid (brachistochrone)', false);
  drawTimeBar(userTable.T, '#9be8b0', 'your curve', true);
  drawTimeBar(T_CONCAVE, '#f1d28a', 'concave reference', false);
  drawTimeBar(T_LINE, tok.accentWarm, 'straight line', false);
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.0035; }

// ---- pointer interaction: drag the control handles ----------------------
function handleAt(px, py) {
  for (let i = 0; i < state.userPts.length; i += 1) {
    const p = worldToPx(state.userPts[i][0], state.userPts[i][1]);
    if (Math.hypot(px - p.px, py - p.py) < 14) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * (view.w / r.width);
  const py = (e.clientY - r.top) * (view.h / r.height);
  state.dragIdx = handleAt(px, py);
});
canvas.addEventListener('pointermove', (e) => {
  if (state.dragIdx < 0) return;
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * (view.w / r.width);
  const py = (e.clientY - r.top) * (view.h / r.height);
  let [wx, wy] = pxToWorld(px, py);
  // Constrain inside the box and keep x strictly between A and B.
  wx = Math.max(0.15, Math.min(X_B - 0.15, wx));
  wy = Math.max(-(Y_B + 0.8), Math.min(-0.02, wy));
  state.userPts[state.dragIdx] = [wx, wy];
  rebuildUserTable();
  state.tNow = 0;
  drawAll();
});
window.addEventListener('pointerup', () => { state.dragIdx = -1; });

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
if (sliderHandles) sliderHandles.addEventListener('input', () => {
  const n = parseInt(sliderHandles.value, 10);
  valueHandles.textContent = String(n);
  state.userPts = defaultHandles(n);
  rebuildUserTable(); reset(); drawAll();
});
if (selCurve) selCurve.addEventListener('change', () => {
  state.curveType = selCurve.value;
  if (valueCurve) valueCurve.textContent = CURVE_LABEL[state.curveType] || state.curveType;
  rebuildUserTable(); reset(); drawAll();
});
btnReset.addEventListener('click', () => {
  state.userPts = [[X_B * 0.33, -Y_B * 0.30], [X_B * 0.66, -Y_B * 0.62]];
  state.curveType = 'spline';
  if (selCurve) selCurve.value = 'spline';
  if (valueCurve) valueCurve.textContent = CURVE_LABEL.spline;
  if (sliderHandles) { sliderHandles.value = '2'; valueHandles.textContent = '2'; }
  rebuildUserTable();
  reset(); drawAll();
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
  rebuildUserTable();
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * tMax();
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    if (state.tNow > tMax() + 0.5) state.tNow = 0;
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
  if (!userTable) rebuildUserTable();
  return {
    fields: [
      { key: 'elapsed-time', label: 'Elapsed time t (s)', value: state.tNow, format: 'float' },
      { key: 'speed', label: 'Animation speed', value: state.speed, format: 'float' },
      { key: 'user-descent-time', label: 'User curve descent time', value: userTable ? userTable.T : 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  if (!userTable) rebuildUserTable();
  const userT = userTable ? userTable.T : 0;
  const isOptimal = userT <= T_CYCLOID + 1e-3;
  return [
    {
      key: 'descent-time',
      label: 'User time vs brachistochrone $T_{user}/T_{opt}$',
      value: userT > 0 ? (userT / T_CYCLOID).toFixed(3) : 'pending',
      status: isOptimal ? 'pass' : 'drift'
    }
  ];
};
