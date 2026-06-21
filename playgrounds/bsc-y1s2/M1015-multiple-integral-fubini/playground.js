import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import {
  INTEGRANDS, integrand, fAt, areaAtX, areaAtY, iterate, exactValue,
} from './sim.js';
// Fubini's theorem as a sliceable solid, Canvas2D only.
//
//   Top region (scene): the solid under z = f(x,y) over the region
//   [0,X1] x [0,Y1], drawn in an oblique 3D projection. The solid is cut
//   into slabs in the chosen order; a sweep fills the slabs in one at a
//   time. Slicing along x (dy then dx) gives fins that recede into depth;
//   slicing along y (dx then dy) gives walls stacked front to back. The
//   two stacks fill the SAME solid, which is the whole point.
//
//   Bottom region (diagnostic): the volume accumulated as the sweep
//   advances, plotted for both slicing orders at once. Two different
//   running totals that land on exactly the same value: Fubini.
//
// Reference: Riley, Hobson, Bence, Mathematical Methods for Physics and
// Engineering, 3rd ed., Ch. 10.

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selOrder = document.getElementById('select-order');
const selFn = document.getElementById('select-fn');
const valueOrder = document.getElementById('value-order');
const valueFn = document.getElementById('value-fn');
const valueRegion = document.getElementById('value-region');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const PI = Math.PI;
const SLABS = 16;       // visible slices in the swept direction
const PROF = 22;        // points along each slice's top profile
const KC = 80;          // resolution of the accumulation curves

const state = {
  id: (params.get('fn') && INTEGRANDS[params.get('fn')]) ? params.get('fn') : 'dome',
  order: params.get('order') === 'dxdy' ? 'dxdy' : 'dydx',
  X1: PI, Y1: PI,
  phase: 0.6,
  running: !DETERMINISTIC,
};
let curve1 = [0], curve2 = [0], total = 0;   // dydx accumulation, dxdy, exact

function orderName(o) { return o === 'dxdy' ? 'dx dy (slice along y)' : 'dy dx (slice along x)'; }
function syncVals() {
  valueOrder.textContent = state.order === 'dxdy' ? 'dx dy' : 'dy dx';
  valueFn.textContent = integrand(state.id).label;
  valueRegion.textContent = `[0, ${state.X1.toFixed(2)}] x [0, ${state.Y1.toFixed(2)}]`;
}

selOrder.addEventListener('change', () => { state.order = selOrder.value; syncVals(); render(); });
selFn.addEventListener('change', () => { state.id = selFn.value; rebuildCurves(); syncVals(); render(); });
btnReset.addEventListener('click', () => {
  state.order = 'dydx'; state.id = 'dome'; state.X1 = PI; state.Y1 = PI; state.phase = 0.6;
  state.running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  selOrder.value = 'dydx'; selFn.value = 'dome';
  rebuildCurves(); syncVals(); render();
});
btnPlay.addEventListener('click', () => {
  state.running = !state.running;
  btnPlay.textContent = state.running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!state.running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;

// Oblique projection of the full domain [0,pi] x [0,pi] x [0,fRef] into the
// scene rect. Fixed to the domain (not the region) so the solid does not
// rescale as the region is dragged; only the slab footprint changes.
const THETA = 32 * Math.PI / 180;
const KD = 0.58;          // depth foreshortening
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 24, stripH = 28, pad = 30;
  const draw = { x: r.x + pad, y: r.y + titleH, w: r.w - 2 * pad, h: r.h - titleH - stripH - 10 };
  const fRef = integrand(state.id).fRef;
  const dcx = KD * Math.cos(THETA), dcy = KD * Math.sin(THETA);
  // screen bbox in units of s (x scale) before fixing sz:
  const wUnits = PI * (1 + dcx);              // total horizontal span / s
  const s = (draw.w) / wUnits;
  const baseRise = s * dcy * PI;              // vertical rise from depth
  let sz = (draw.h - baseRise) / fRef;        // remaining height for z
  sz = Math.min(sz, s * 0.62);                // cap so the solid is not spindly
  const solidH = sz * fRef;
  // origin = front-bottom-left (x=0,y=0,z=0), placed so the whole bbox is
  // vertically centred in draw.
  const usedH = baseRise + solidH;
  const ox = draw.x;
  const oy = draw.y + (draw.h - usedH) / 2 + solidH;   // base front sits below the solid head-room
  SCN = { draw, s, sz, dcx, dcy, fRef, ox, oy };
}
function project(x, y, z) {
  const { ox, oy, s, sz, dcx, dcy } = SCN;
  return { X: ox + s * x + s * dcx * y, Y: oy - s * dcy * y - sz * z };
}
function unproject0(px, py) {           // invert at z = 0
  const { ox, oy, s, dcx, dcy } = SCN;
  const y = (oy - py) / (s * dcy);
  const x = (px - ox - s * dcx * y) / s;
  return { x, y };
}

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.0 },
  ]);
  computeSceneTransform();
  rebuildCurves();
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    c1: '#5bc0eb', c2: '#ff9f43', region: '#ffd166',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

function rebuildCurves() {
  const { id, X1, Y1 } = state;
  // curve1: slice along x, accumulate A(x) = int_0^Y1 f dy over x.
  curve1 = [0]; let g1 = 0, px = 0, pA = areaAtX(id, 0, 0, Y1);
  for (let k = 1; k <= KC; k += 1) {
    const x = X1 * k / KC, A = areaAtX(id, x, 0, Y1);
    g1 += 0.5 * (pA + A) * (x - px); px = x; pA = A; curve1.push(g1);
  }
  // curve2: slice along y, accumulate A(y) = int_0^X1 f dx over y.
  curve2 = [0]; let g2 = 0, py = 0, pB = areaAtY(id, 0, 0, X1);
  for (let k = 1; k <= KC; k += 1) {
    const y = Y1 * k / KC, B = areaAtY(id, y, 0, X1);
    g2 += 0.5 * (pB + B) * (y - py); py = y; pB = B; curve2.push(g2);
  }
  total = exactValue(id, 0, X1, 0, Y1);
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 10, r.y + 7);
  }
}

// One cross-sectional slice silhouette: the area under the surface along the
// slice line, which is exactly the inner integral. `axis` is 'x' (fin at
// fixed x, varying y) or 'y' (wall at fixed y, varying x).
function sliceSilhouette(axis, c) {
  const { id, X1, Y1 } = state;
  const pts = [];
  if (axis === 'x') {
    for (let k = 0; k <= PROF; k += 1) {
      const y = Y1 * k / PROF; pts.push(project(c, y, fAt(id, c, y)));
    }
    for (let k = PROF; k >= 0; k -= 1) pts.push(project(c, Y1 * k / PROF, 0));
  } else {
    for (let k = 0; k <= PROF; k += 1) {
      const x = X1 * k / PROF; pts.push(project(x, c, fAt(id, x, c)));
    }
    for (let k = PROF; k >= 0; k -= 1) pts.push(project(X1 * k / PROF, c, 0));
  }
  return pts;
}
function topProfile(axis, c) {
  const { id, X1, Y1 } = state;
  const pts = [];
  if (axis === 'x') for (let k = 0; k <= PROF; k += 1) { const y = Y1 * k / PROF; pts.push(project(c, y, fAt(id, c, y))); }
  else for (let k = 0; k <= PROF; k += 1) { const x = X1 * k / PROF; pts.push(project(x, c, fAt(id, x, c))); }
  return pts;
}
function poly(pts, fill, stroke, w) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y)));
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w || 1.5; ctx.lineJoin = 'round'; ctx.stroke(); }
}

function drawBase(col) {
  // Full-domain base parallelogram (faint) with the region rectangle on top.
  const D = [project(0, 0, 0), project(PI, 0, 0), project(PI, PI, 0), project(0, PI, 0)];
  poly([...D, D[0]], 'rgba(255,255,255,0.02)', col.grid, 1);
  // region footprint [0,X1]x[0,Y1].
  const { X1, Y1 } = state;
  const Rg = [project(0, 0, 0), project(X1, 0, 0), project(X1, Y1, 0), project(0, Y1, 0)];
  poly([...Rg, Rg[0]], 'rgba(255,209,102,0.06)', 'rgba(255,209,102,0.55)', 1.4);
  // axis labels.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted;
  const xm = project(PI * 0.5, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('x', xm.X, xm.Y + 4);
  const ym = project(PI, PI * 0.5, 0); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('y', ym.X + 6, ym.Y);
}

function drawScene(col, r) {
  const slicingX = state.order === 'dydx';     // dydx -> fins along x
  panel(col, r, slicingX
    ? 'Slice along x: each fin is ∫ f dy, sum them over x'
    : 'Slice along y: each wall is ∫ f dx, sum them over y');
  drawBase(col);

  const { X1, Y1 } = state;
  const oc = slicingX ? col.c1 : col.c2;
  const sweep = state.phase * (slicingX ? X1 : Y1);
  const span = slicingX ? X1 : Y1;
  const idx = (i) => span * (i + 0.5) / SLABS;   // slice centre

  // Painter's order: fins (axis x) drawn small->large; walls (axis y, depth)
  // drawn far->near so nearer walls occlude farther ones.
  const seq = [];
  for (let i = 0; i < SLABS; i += 1) seq.push(i);
  if (!slicingX) seq.reverse();

  for (const i of seq) {
    const c = idx(i);
    const swept = c <= sweep;
    const current = Math.abs(c - sweep) <= 0.5 * span / SLABS;
    const axis = slicingX ? 'x' : 'y';
    let fill, top, tw;
    if (current) { fill = hexA(oc, 0.78); top = '#ffffff'; tw = 2.4; }
    else if (swept) { fill = hexA(oc, 0.42); top = hexA(oc, 0.95); tw = 1.6; }
    else { fill = 'rgba(150,160,175,0.10)'; top = 'rgba(160,170,185,0.40)'; tw = 1.0; }
    poly(sliceSilhouette(axis, c), fill, null);
    poly(topProfile(axis, c), null, top, tw);
  }

  // corner handle at (X1, Y1).
  const h = project(X1, Y1, 0);
  ctx.fillStyle = col.region; ctx.beginPath(); ctx.arc(h.X, h.Y, 7, 0, 2 * PI); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();

  // readout strip: one row when it fits, two rows of two when narrow (phone).
  const A = slicingX ? areaAtX(state.id, sweep, 0, Y1) : areaAtY(state.id, sweep, 0, X1);
  const acc = lerpCurve(slicingX ? curve1 : curve2, state.phase);
  const items = [
    [`f = ${integrand(state.id).label}`, col.fg],
    [`${slicingX ? 'A(x)' : 'A(y)'} = ${A.toFixed(2)}`, oc],
    [`filled ${acc.toFixed(2)}`, col.fg],
    [`V = ${total.toFixed(2)}`, col.accent],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  let need = 0; for (const [t] of items) need += ctx.measureText(t).width + 18;
  if (need <= r.w) {
    ctx.textAlign = 'center';
    items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
  } else {
    ctx.textAlign = 'center';
    items.forEach(([t, c], i) => {
      const row = i < 2 ? 0 : 1, colI = i % 2;
      ctx.fillStyle = c;
      ctx.fillText(t, r.x + r.w * (colI + 0.5) / 2, r.y + r.h - (row === 0 ? 24 : 9));
    });
  }
}

function lerpCurve(arr, frac) {
  const t = Math.max(0, Math.min(1, frac)) * KC;
  const i = Math.floor(t), f = t - i;
  if (i >= KC) return arr[KC];
  return arr[i] * (1 - f) + arr[i + 1] * f;
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Accumulated volume: both slicing orders reach the same V');
  const inner = { x: r.x + 48, y: r.y + 26, w: r.w - 48 - 16, h: r.h - 26 - 44 };
  let mx = total;
  for (const g of curve1.concat(curve2)) mx = Math.max(mx, g);
  mx = mx * 1.12 || 1;
  const xOf = (frac) => inner.x + frac * inner.w;
  const yOf = (g) => inner.y + inner.h - (g / mx) * inner.h;

  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let g = 0; g <= mx + 1e-9; g += mx / 4) {
    ctx.strokeStyle = col.grid; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(inner.x, yOf(g)); ctx.lineTo(inner.x + inner.w, yOf(g)); ctx.stroke();
    ctx.fillStyle = col.muted; ctx.fillText(g.toFixed(1), inner.x - 5, yOf(g));
  }

  // exact total line.
  ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(total)); ctx.lineTo(inner.x + inner.w, yOf(total)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.accent; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText(`V = ${total.toFixed(3)}`, inner.x + inner.w - 4, yOf(total) - 3);

  const active = state.order === 'dydx' ? 'c1' : 'c2';
  const plot = (arr, c, bold) => {
    ctx.strokeStyle = c; ctx.lineWidth = bold ? 2.8 : 1.6; ctx.globalAlpha = bold ? 1 : 0.55;
    ctx.beginPath();
    arr.forEach((g, i) => { const X = xOf(i / KC), Y = yOf(g); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xOf(1), yOf(arr[KC]), 4, 0, 2 * PI); ctx.fill();
  };
  plot(curve1, col.c1, active === 'c1');
  plot(curve2, col.c2, active === 'c2');

  // moving cursor + dot on the active curve.
  const arr = state.order === 'dydx' ? curve1 : curve2;
  const cx = xOf(state.phase), cy = yOf(lerpCurve(arr, state.phase));
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cx, inner.y); ctx.lineTo(cx, inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, 2 * PI); ctx.fill();

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('sweep progress', inner.x + inner.w / 2, inner.y + inner.h + 22);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('volume', 0, 0); ctx.restore();
  const leg = [['dy dx', col.c1], ['dx dy', col.c2]];
  let lx = inner.x + 8; const ly = inner.y + 11;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 15, ly); lx += 62; }
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- drag the region corner ---
let dragging = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); const sx = (ev.clientX - rect.left) * (view.w / rect.width); const sy = (ev.clientY - rect.top) * (view.h / rect.height); return { sx, sy }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  const h = project(state.X1, state.Y1, 0);
  if ((h.X - sx) ** 2 + (h.Y - sy) ** 2 < 30 * 30) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return; const { sx, sy } = pScreen(ev);
  const { x, y } = unproject0(sx, sy);
  state.X1 = Math.max(0.6, Math.min(PI, x));
  state.Y1 = Math.max(0.6, Math.min(PI, y));
  rebuildCurves(); syncVals(); render();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (state.running) { state.phase += 0.28 * dt; if (state.phase > 1) state.phase -= 1; }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  selOrder.value = state.order; selFn.value = state.id;
  if (Number.isFinite(CAPTURE_FRAC)) state.phase = Math.max(0, Math.min(1, CAPTURE_FRAC));
  relayout(); syncVals(); render();
  if (CAPTURE_NAME && DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
      window.__simulationReady = true; window.__simulationReadyDetail = { capture: CAPTURE_NAME };
    }));
  }
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

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
      { key: 'fn', label: 'integrand f(x,y)', value: integrand(state.id).label, format: 'text' },
      { key: 'order', label: 'slice order', value: state.order === 'dxdy' ? 'dx dy' : 'dy dx', format: 'text' },
      { key: 'region', label: 'region (x, y upper)', value: `${state.X1.toFixed(2)}, ${state.Y1.toFixed(2)}`, format: 'text' },
      { key: 'dydx', label: 'V as dy dx', value: iterate(state.id, 'dydx', 0, state.X1, 0, state.Y1), format: 'float' },
      { key: 'dxdy', label: 'V as dx dy', value: iterate(state.id, 'dxdy', 0, state.X1, 0, state.Y1), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    const a = iterate(state.id, 'dxdy', 0, state.X1, 0, state.Y1, 120);
    const b = iterate(state.id, 'dydx', 0, state.X1, 0, state.Y1, 120);
    const err = Math.abs(a - b);
    return [{
      key: 'fubini',
      label: '|V(dx dy) − V(dy dx)| (Fubini)',
      value: err.toExponential(2),
      status: err < 1e-4 ? 'pass' : (err < 1e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) { return []; }
};
