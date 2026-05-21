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
  descentTime, userCurve,
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
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const T_CONCAVE = descentTime(concaveCurve(160)).time;

const state = {
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  // User control points (interior), world coords. Default: a gentle arc.
  userPts: [[X_B * 0.33, -Y_B * 0.30], [X_B * 0.66, -Y_B * 0.62]],
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
  const pts = userCurve(state.userPts, 140);
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

// ---- coordinate transform -----------------------------------------------
const PAD = { l: 50, r: 30, t: 56, b: 150 };
function worldToPx(x, y) {
  const wx = X_B + 0.5;
  const wy = Y_B + 1.0;
  const drawW = W - PAD.l - PAD.r;
  const drawH = H - PAD.t - PAD.b;
  const scale = Math.min(drawW / wx, drawH / wy);
  return { px: PAD.l + (x / wx) * (wx * scale), py: PAD.t + ((-y) / wy) * (wy * scale) };
}
function pxToWorld(px, py) {
  const wx = X_B + 0.5;
  const wy = Y_B + 1.0;
  const drawW = W - PAD.l - PAD.r;
  const drawH = H - PAD.t - PAD.b;
  const scale = Math.min(drawW / wx, drawH / wy);
  return [(px - PAD.l) / scale, -(py - PAD.t) / scale];
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
  if (!userTable) rebuildUserTable();
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.tNow.toFixed(3)} s`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('drag the two white handles to shape your own path; race it against the cycloid', 30, 40);

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
  ctx.font = '13px ui-monospace, monospace';
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
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillStyle = color; ctx.textAlign = 'left';
      ctx.fillText(label, px.px + 9, px.py - 6);
    }
  }
  drawBead(positionOnCycloid(t), tok.accentCool, 'cycloid');
  drawBead(positionOnLine(t), tok.accentWarm, 'line');
  drawBead(positionOnUser(t), '#9be8b0', 'yours');

  // ---- diagnostic: descent-time bars --------------------------------------
  const tm = tMax();
  const barX = 50, barW = W - 100, barH = 15;
  let barY = H - 122;
  function drawTimeBar(tStop, color, label, isUser) {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    // T_stop dashed marker.
    const px = barX + barW * (tStop / tm);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(px, barY); ctx.lineTo(px, barY + barH); ctx.stroke();
    ctx.setLineDash([]);
    // Fill to current time.
    const tFill = Math.min(state.tNow, tStop);
    ctx.fillStyle = color;
    ctx.fillRect(barX + 1, barY + 2, barW * (tFill / tm) - 1, barH - 4);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'left';
    ctx.fillText(label, barX, barY - 3);
    ctx.textAlign = 'right';
    // Show how much SLOWER than the cycloid (the optimum).
    const delta = tStop - T_CYCLOID;
    const deltaStr = delta <= 1e-4 ? ' (optimal)' : ` (+${delta.toFixed(3)} s)`;
    ctx.fillStyle = isUser
      ? (delta <= 1e-4 ? '#9be8b0' : '#ffd166')
      : 'rgba(255,255,255,0.7)';
    ctx.fillText(`T = ${tStop.toFixed(3)} s${deltaStr}`, barX + barW, barY - 3);
    barY += 30;
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
  const px = (e.clientX - r.left) * (W / r.width);
  const py = (e.clientY - r.top) * (H / r.height);
  state.dragIdx = handleAt(px, py);
});
canvas.addEventListener('pointermove', (e) => {
  if (state.dragIdx < 0) return;
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * (W / r.width);
  const py = (e.clientY - r.top) * (H / r.height);
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
btnReset.addEventListener('click', () => {
  state.userPts = [[X_B * 0.33, -Y_B * 0.30], [X_B * 0.66, -Y_B * 0.62]];
  rebuildUserTable();
  reset(); drawAll();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
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
