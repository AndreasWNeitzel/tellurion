import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the Lagrange points of the CR3BP, Canvas2D only.
// Top region: the rotating-frame effective potential with zero-velocity
// contours, the two primaries, the five Lagrange points (green stable,
// red unstable), and a draggable test body that librates or escapes.
// Bottom region: the effective potential along the line of the masses,
// with L1, L2, L3 at its crests.
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics,
// 2nd ed.; Murray and Dermott, Solar System Dynamics, Ch. 3.

import { createCR3BP, stepCR3BP, diagnosticsCR3BP, lagrangePoints, effectivePotential, DEFAULT_DT, MU_ROUTH } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderMu = document.getElementById('slider-mu');
const selStart = document.getElementById('select-start');
const selFrame = document.getElementById('select-frame');
const valueMu = document.getElementById('value-mu');
const valueStart = document.getElementById('value-start');
const valueFrame = document.getElementById('value-frame');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const VIEW = 1.7;
let running = !DETERMINISTIC;
let muVal = 0.0122;
let frameMode = 'rotating';        // 'rotating' (synodic) or 'inertial'
let simTime = 0;                   // dimensionless time; synodic frame rotates at omega = 1
let sim = null, trail = [], LP = null, heat = null, contours = [];

function mu() { return parseFloat(sliderMu.value); }
function startIC() {
  const L = LP[selStart.value];
  return { q: [L[0] + 0.012, L[1] + (selStart.value === 'L4' ? 0.018 : 0.0)], v: [0, 0] };
}
function spawn() { sim = createCR3BP({ mu: mu(), ic: startIC() }); trail = []; }

const FRAME_LABEL = { rotating: 'co-rotating', inertial: 'inertial' };
function syncVals() {
  valueMu.textContent = mu().toFixed(3);
  valueStart.textContent = selStart.value;
  if (valueFrame) valueFrame.textContent = FRAME_LABEL[frameMode];
}
sliderMu.addEventListener('input', () => { muVal = mu(); syncVals(); LP = lagrangePoints(muVal); buildLandscape(); spawn(); render(); });
selStart.addEventListener('change', () => { syncVals(); spawn(); render(); });
if (selFrame) selFrame.addEventListener('change', () => { frameMode = selFrame.value; syncVals(); render(); });
btnReset.addEventListener('click', () => {
  sliderMu.value = '0.0122'; selStart.value = 'L4'; muVal = 0.0122;
  frameMode = 'rotating'; if (selFrame) selFrame.value = 'rotating'; simTime = 0;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); LP = lagrangePoints(muVal); buildLandscape(); spawn(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h);
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale: size / (2 * VIEW) };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.85 },
    { name: 'diagnostic', weight: 1.15 },
  ]);
  computeSceneTransform();
  LP = lagrangePoints(muVal); buildLandscape();
}
const WX = (x) => SCN.ox + x * SCN.scale;
const WY = (y) => SCN.oy - y * SCN.scale;
const invX = (sx) => (sx - SCN.ox) / SCN.scale;
const invY = (sy) => (SCN.oy - sy) / SCN.scale;

// Project a synodic-frame world point to screen, honouring the active frame.
// In the inertial frame the synodic plane has rotated by theta = omega * t = t
// (the equations of motion are non-dimensionalised so the mean motion is 1), so
// a point fixed in the rotating frame traces a circle of its own radius.
function rotXY(x, y, th) { const c = Math.cos(th), s = Math.sin(th); return [x * c - y * s, x * s + y * c]; }
function P(x, y) { if (frameMode === 'inertial') { const r = rotXY(x, y, simTime); return [WX(r[0]), WY(r[1])]; } return [WX(x), WY(y)]; }
function Pt(x, y, t) { if (frameMode === 'inertial') { const r = rotXY(x, y, t); return [WX(r[0]), WY(r[1])]; } return [WX(x), WY(y)]; }
// Inverse of P at the current time: screen -> synodic world (used by the drag).
function screenToSyn(sx, sy) {
  const ix = invX(sx), iy = invY(sy);
  if (frameMode === 'inertial') { const r = rotXY(ix, iy, -simTime); return [r[0], r[1]]; }
  return [ix, iy];
}
// Text with a dark halo so labels stay legible over the potential map.
function haloText(txt, x, y, fill) {
  ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(4,6,12,0.85)';
  ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    stable: '#67d98c', unstable: '#ef5466', saddle: '#ffb454', test: '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// clamp window from the Lagrange-point potential values.
function uWindow() {
  const us = ['L1', 'L2', 'L3', 'L4'].map((k) => effectivePotential(LP[k][0], LP[k][1], muVal));
  const hi = Math.max(...us) + 0.05, lo = Math.min(...us) - 0.9;
  return { hi, lo };
}
function buildLandscape() {
  if (!SCN) return;
  const { draw } = SCN; const { hi, lo } = uWindow();
  // Sample over the FULL draw rectangle (in world coordinates), not a centred
  // VIEW-square, so the heatmap fills the panel and leaves no black bars when
  // the column is wider than it is tall. Resolution tracks the panel aspect.
  const ny = 90;
  const nx = Math.max(60, Math.min(170, Math.round(ny * draw.w / draw.h)));
  const xs = [], ys = [], grid = new Float64Array(nx * ny);
  for (let i = 0; i < nx; i++) xs.push(invX(draw.x + (i + 0.5) / nx * draw.w));
  for (let j = 0; j < ny; j++) ys.push(invY(draw.y + (j + 0.5) / ny * draw.h));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) grid[j * nx + i] = effectivePotential(xs[i], ys[j], muVal);

  if (!heat) heat = document.createElement('canvas');
  heat.width = nx; heat.height = ny;
  const hctx = heat.getContext('2d'); const img = hctx.createImageData(nx, ny);
  for (let k = 0; k < nx * ny; k++) {
    const t = Math.max(0, Math.min(1, (grid[k] - lo) / (hi - lo)));
    // Stay in the dark half of viridis and dim it, so the bright yellow end no
    // longer drowns the overlaid Lagrange labels, contours, and readout.
    const c = viridis(0.5 * t);
    img.data[k * 4] = c.r * 0.74; img.data[k * 4 + 1] = c.g * 0.74; img.data[k * 4 + 2] = c.b * 0.74; img.data[k * 4 + 3] = 226;
  }
  hctx.putImageData(img, 0, 0);

  // contour levels = the Lagrange-point potentials + a few extra.
  const lev = new Set(['L1', 'L2', 'L3', 'L4'].map((k) => effectivePotential(LP[k][0], LP[k][1], muVal)));
  for (let s = 1; s <= 3; s++) lev.add(lo + (hi - lo) * s / 4);
  contours = [];
  const at = (i, j) => grid[j * nx + i];
  for (const L of lev) {
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const pts = [];
      const cr = (va, vb, x1, y1, x2, y2) => { if ((va > L) !== (vb > L)) { const tt = (L - va) / (vb - va); pts.push([x1 + tt * (x2 - x1), y1 + tt * (y2 - y1)]); } };
      cr(a, b, xs[i], ys[j], xs[i + 1], ys[j]); cr(b, c, xs[i + 1], ys[j], xs[i + 1], ys[j + 1]); cr(c, d, xs[i + 1], ys[j + 1], xs[i], ys[j + 1]); cr(d, a, xs[i], ys[j + 1], xs[i], ys[j]);
      if (pts.length >= 2) contours.push([pts[0], pts[1]]);
      if (pts.length === 4) contours.push([pts[2], pts[3]]);
    }
  }
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

// Inertial-frame backdrop: barycentre cross and the two circular orbits the
// primaries trace about it. The rotating-frame potential map is meaningless
// here (the centrifugal term is a rotating-frame construct), so it is dropped.
function drawInertialBackdrop(col, m1, m2) {
  const cx = WX(0), cy = WY(0);
  ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,210,74,0.30)'; ctx.beginPath(); ctx.arc(cx, cy, Math.hypot(m1[0], m1[1]) * SCN.scale, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(188,196,208,0.32)'; ctx.beginPath(); ctx.arc(cx, cy, Math.hypot(m2[0], m2[1]) * SCN.scale, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1; const d = 5;
  ctx.beginPath(); ctx.moveTo(cx - d, cy); ctx.lineTo(cx + d, cy); ctx.moveTo(cx, cy - d); ctx.lineTo(cx, cy + d); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  haloText('barycentre', cx + 8, cy + 9, col.muted);
}

function drawScene(col, r) {
  panel(col, r, frameMode === 'inertial'
    ? 'Inertial frame: the two masses orbit the barycentre'
    : 'Effective potential in the co-rotating frame');
  const { draw } = SCN;
  const stable = muVal < MU_ROUTH;
  const m1 = [-muVal, 0], m2 = [1 - muVal, 0];

  ctx.save();
  clipTo(ctx, draw);

  if (frameMode === 'rotating') {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(heat, draw.x, draw.y, draw.w, draw.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const s of contours) { ctx.moveTo(WX(s[0][0]), WY(s[0][1])); ctx.lineTo(WX(s[1][0]), WY(s[1][1])); }
    ctx.stroke();
  } else {
    drawInertialBackdrop(col, m1, m2);
  }

  // primaries (frame-aware positions).
  const p1 = P(m1[0], m1[1]), p2 = P(m2[0], m2[1]);
  // In the inertial frame, tie the two masses to L4/L5 to expose the rigid
  // equilateral triangle that co-rotates with them.
  if (frameMode === 'inertial') {
    const triCol = stable ? 'rgba(103,217,140,0.34)' : 'rgba(239,84,102,0.34)';
    ctx.strokeStyle = triCol; ctx.lineWidth = 1.1; ctx.beginPath();
    for (const k of ['L4', 'L5']) { const s = P(LP[k][0], LP[k][1]); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(s[0], s[1]); ctx.lineTo(p2[0], p2[1]); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,210,74,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  }
  ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(p1[0], p1[1], 9, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#bcc4d0'; ctx.beginPath(); ctx.arc(p2[0], p2[1], 5, 0, 2 * Math.PI); ctx.fill();

  // Lagrange points (fixed in the rotating frame, so they sweep circles in the
  // inertial one). Labels carry a dark halo to stay legible over the map.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const k of ['L1', 'L2', 'L3', 'L4', 'L5']) {
    const tri = (k === 'L4' || k === 'L5');
    const c = tri ? (stable ? col.stable : col.unstable) : col.saddle;
    const s = P(LP[k][0], LP[k][1]);
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(s[0], s[1], 4, 0, 2 * Math.PI); ctx.fill();
    haloText(k, s[0] + 5, s[1] - 1, c);
  }

  // test body trail + dot (each trail point rotated by its own recorded time).
  if (trail.length > 1) {
    ctx.strokeStyle = 'rgba(255,209,102,0.74)'; ctx.lineWidth = 1.6; ctx.beginPath();
    trail.forEach((p, k) => { const s = Pt(p[0], p[1], p[2]); if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); });
    ctx.stroke();
  }
  const bs = P(sim.inst.q[0], sim.inst.q[1]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bs[0], bs[1], 4.5, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = col.test; ctx.lineWidth = 1.6; ctx.stroke();

  ctx.restore();

  // readout strip.
  const drift = Math.abs(diagnosticsCR3BP(sim).energyDrift || 0);
  const items = [
    [`μ ${muVal.toFixed(3)}`, col.fg],
    [stable ? 'L4/L5 stable' : 'L4/L5 unstable', stable ? col.stable : col.unstable],
    [FRAME_LABEL[frameMode], col.test],
    [`Jacobi Δ ${drift.toExponential(0)}`, col.muted],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [txt] of items) widest = Math.max(widest, ctx.measureText(txt).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);   // shrink on narrow folds
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Effective potential along the line of the masses');

  const inner = { x: r.x + 30, y: r.y + 28, w: r.w - 30 - 16, h: r.h - 28 - 42 };
  const X0 = -1.8, X1 = 1.8;
  const { hi, lo } = uWindow(); const yLo = lo - 0.4, yHi = hi + 0.15;
  const xOf = (x) => inner.x + (x - X0) / (X1 - X0) * inner.w;
  const yOf = (u) => inner.y + inner.h - (Math.max(yLo, Math.min(yHi, u)) - yLo) / (yHi - yLo) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of [-1, 0, 1]) ctx.fillText(`${x}`, xOf(x), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // primaries (vertical dashed).
  for (const px of [-muVal, 1 - muVal]) { ctx.strokeStyle = 'rgba(255,210,74,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(px), inner.y); ctx.lineTo(xOf(px), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }

  // U(x, 0).
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.4; ctx.beginPath();
  const N = 400; let pen = false;
  for (let i = 0; i <= N; i++) { const x = X0 + (X1 - X0) * i / N; const u = effectivePotential(x, 0, muVal); const X = xOf(x), Y = yOf(u); if (Math.abs(x + muVal) < 0.02 || Math.abs(x - 1 + muVal) < 0.02) { pen = false; continue; } if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } }
  ctx.stroke();

  // L1, L2, L3 markers (crests on this cut).
  for (const k of ['L1', 'L2', 'L3']) { const p = LP[k]; const u = effectivePotential(p[0], 0, muVal); ctx.fillStyle = col.saddle; ctx.beginPath(); ctx.arc(xOf(p[0]), yOf(u), 4, 0, 2 * Math.PI); ctx.fill(); ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(k, xOf(p[0]), yOf(u) - 4); }

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('position x along the line of masses', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 22, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('effective potential', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!sim) { LP = lagrangePoints(muVal); buildLandscape(); spawn(); }
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function advance() {
  for (let s = 0; s < 7; s++) { stepCR3BP(sim, DEFAULT_DT); simTime += DEFAULT_DT; }
  const x = sim.inst.q[0], y = sim.inst.q[1];
  trail.push([x, y, simTime]); if (trail.length > 280) trail.shift();
  if (Math.hypot(x, y) > 3 || !Number.isFinite(x)) spawn();   // escaped: relaunch
}

// --- drag the test body ---
let dragging = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  const bs = P(sim.inst.q[0], sim.inst.q[1]);
  if ((bs[0] - sx) ** 2 + (bs[1] - sy) ** 2 < 30 * 30) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return; const { sx, sy } = pScreen(ev);
  const syn = screenToSyn(sx, sy);                          // drop point is set in synodic coordinates
  const wx = Math.max(-VIEW, Math.min(VIEW, syn[0])), wy = Math.max(-VIEW, Math.min(VIEW, syn[1]));
  sim = createCR3BP({ mu: muVal, ic: { q: [wx, wy], v: [0, 0] } }); trail = [];
  render();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  last = now;
  if (running && !dragging) advance();
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  const fp = params.get('frame');
  if (fp === 'inertial' || fp === 'rotating') { frameMode = fp; if (selFrame) selFrame.value = fp; }
  muVal = mu(); syncVals(); relayout();
  LP = lagrangePoints(muVal); buildLandscape(); spawn();
  for (let i = 0; i < 120; i++) advance();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'mu', label: 'mass ratio μ', value: muVal, format: 'float' },
      { key: 'routh', label: 'Routh limit μ', value: MU_ROUTH, format: 'float' },
      { key: 'l45', label: 'L4 / L5', value: muVal < MU_ROUTH ? 'stable' : 'unstable', format: 'text' },
      { key: 'start', label: 'test body start', value: selStart.value, format: 'text' },
      { key: 'frame', label: 'frame', value: FRAME_LABEL[frameMode], format: 'text' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // The Jacobi integral is conserved in the rotating frame (the only
    // constant of motion of the CR3BP).
    const drift = Math.abs(diagnosticsCR3BP(sim).energyDrift || 0);
    return [{
      key: 'jacobi',
      label: 'Jacobi constant conserved (rel.)',
      value: drift.toExponential(2),
      status: drift < 5e-3 ? 'pass' : (drift < 5e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
