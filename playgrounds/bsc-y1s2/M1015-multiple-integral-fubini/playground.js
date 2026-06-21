import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for Fubini's theorem, Canvas2D only. Top region: the
// integrand f(x,y) = sin x cos y as a colour map over a resizable
// rectangle, with a slab sweeping across (vertical for dy-then-dx,
// horizontal for dx-then-dy). Bottom region: the running double integral
// accumulated in both orders, taking different paths but landing on the
// same total.
//
// Reference: Riley, Hobson, Bence, Mathematical Methods for Physics and
// Engineering, 3rd ed., Ch. 6 (multiple integrals).

import { dxDy, dyDx, exact, innerX, innerY } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selOrder = document.getElementById('select-order');
const valueOrder = document.getElementById('value-order');
const valueRegion = document.getElementById('value-region');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const PI = Math.PI, K = 90;
let running = !DETERMINISTIC;
let X1 = PI, Y1 = PI / 2;
let phase = 0;
let heat = null;
let curve1 = [], curve2 = [], total = 0;   // accumulation per order

function order() { return selOrder.value; }
function syncVals() {
  valueOrder.textContent = order() === 'dxdy' ? 'dx dy' : 'dy dx';
  valueRegion.textContent = `[0,${X1.toFixed(2)}] × [0,${Y1.toFixed(2)}]`;
}
selOrder.addEventListener('change', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selOrder.value = 'dydx'; X1 = PI; Y1 = PI / 2; phase = 0.6;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); rebuildCurves(); render();
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
  const titleH = 22, stripH = 26, pad = 16;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h) - 2 * pad;
  SCN = { draw, gx0: draw.x + (draw.w - size) / 2, gy1: draw.y + (draw.h + size) / 2, size };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.95 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
  computeSceneTransform();
  buildHeat();
  rebuildCurves();
}
// world (x,y) in [0,pi]^2 -> screen (y up).
const WX = (x) => SCN.gx0 + (x / PI) * SCN.size;
const WY = (y) => SCN.gy1 - (y / PI) * SCN.size;
const invX = (sx) => (sx - SCN.gx0) / SCN.size * PI;
const invY = (sy) => (SCN.gy1 - sy) / SCN.size * PI;

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

function buildHeat() {
  const n = 96;
  if (!heat) heat = document.createElement('canvas');
  heat.width = n; heat.height = n;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(n, n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n * PI, y = PI - (j + 0.5) / n * PI;   // row 0 = top = y=pi
    const f = Math.sin(x) * Math.cos(y);
    const c = rdbu(0.5 + 0.5 * Math.tanh(f / 0.7));
    const k = (j * n + i) * 4;
    img.data[k] = c.r; img.data[k + 1] = c.g; img.data[k + 2] = c.b; img.data[k + 3] = 235;
  }
  hctx.putImageData(img, 0, 0);
}

function rebuildCurves() {
  // curve1: dy-then-dx (accumulate innerY over x). curve2: dx-then-dy.
  curve1 = [0]; curve2 = [0];
  let g1 = 0; let prevx = 0, prevIY = innerY(0, Y1);
  for (let k = 1; k <= K; k++) {
    const x = X1 * k / K, iy = innerY(x, Y1);
    g1 += 0.5 * (prevIY + iy) * (x - prevx); prevx = x; prevIY = iy;
    curve1.push(g1);
  }
  let g2 = 0; let prevy = 0, prevIX = innerX(0, X1);
  for (let k = 1; k <= K; k++) {
    const y = Y1 * k / K, ix = innerX(y, X1);
    g2 += 0.5 * (prevIX + ix) * (y - prevy); prevy = y; prevIX = ix;
    curve2.push(g2);
  }
  total = exact(0, X1, 0, Y1);
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

function drawScene(col, r) {
  const isDyDx = order() === 'dydx';
  panel(col, r, isDyDx ? 'Sweep vertical strips: integrate y, then x' : 'Sweep horizontal strips: integrate x, then y');
  const { gx0, gy1, size } = SCN;

  ctx.save();
  clipTo(ctx, { x: gx0, y: gy1 - size, w: size, h: size });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, gx0, gy1 - size, size, size);

  // dim outside the integration region [0,X1]x[0,Y1].
  ctx.fillStyle = 'rgba(6,6,10,0.6)';
  ctx.fillRect(WX(X1), gy1 - size, gx0 + size - WX(X1), size);     // x > X1
  ctx.fillRect(gx0, gy1 - size, WX(X1) - gx0, WY(Y1) - (gy1 - size)); // y > Y1 (within x<X1)

  // region outline.
  ctx.strokeStyle = col.region; ctx.lineWidth = 2;
  ctx.strokeRect(WX(0), WY(Y1), WX(X1) - WX(0), WY(0) - WY(Y1));

  // swept-so-far shade + sweeping slab.
  if (isDyDx) {
    const xs = phase * X1;
    ctx.fillStyle = 'rgba(91,192,235,0.10)'; ctx.fillRect(WX(0), WY(Y1), WX(xs) - WX(0), WY(0) - WY(Y1));
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; const w = Math.max(3, size * 0.012);
    ctx.fillRect(WX(xs) - w / 2, WY(Y1), w, WY(0) - WY(Y1));
    ctx.strokeStyle = col.c1; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(WX(xs), WY(0)); ctx.lineTo(WX(xs), WY(Y1)); ctx.stroke();
  } else {
    const ys = phase * Y1;
    ctx.fillStyle = 'rgba(255,159,67,0.10)'; ctx.fillRect(WX(0), WY(ys), WX(X1) - WX(0), WY(0) - WY(ys));
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; const h = Math.max(3, size * 0.012);
    ctx.fillRect(WX(0), WY(ys) - h / 2, WX(X1) - WX(0), h);
    ctx.strokeStyle = col.c2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(WX(0), WY(ys)); ctx.lineTo(WX(X1), WY(ys)); ctx.stroke();
  }

  ctx.restore();

  // axis ticks + corner handle.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('0', WX(0), gy1 + 3); ctx.fillText('π', WX(PI), gy1 + 3);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('π', gx0 - 4, WY(PI));
  ctx.fillStyle = col.region; ctx.beginPath(); ctx.arc(WX(X1), WY(Y1), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();

  // readout strip.
  const items = [
    [isDyDx ? 'dy dx' : 'dx dy', col.fg],
    [`box ${X1.toFixed(1)}×${Y1.toFixed(1)}`, col.region],
    [`∬ ${total.toFixed(3)}`, col.accent],
    ['both agree', col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Accumulated double integral: both orders, same total');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 42 };
  let mn = 0, mx = 0;
  for (const g of curve1.concat(curve2, [total, 0])) { mn = Math.min(mn, g); mx = Math.max(mx, g); }
  const span = (mx - mn) || 1; mn -= 0.08 * span; mx += 0.08 * span;
  const xOf = (frac) => inner.x + frac * inner.w;
  const yOf = (g) => inner.y + inner.h - (g - mn) / (mx - mn) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('0', inner.x - 5, yOf(0));

  // exact total line.
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(total)); ctx.lineTo(inner.x + inner.w, yOf(total)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.accent; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`∬ = ${total.toFixed(3)}`, inner.x + inner.w - 4, yOf(total) - 3);

  const plot = (arr, c) => { ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.beginPath(); arr.forEach((g, i) => { const X = xOf(i / K), Y = yOf(g); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xOf(1), yOf(arr[K]), 4.5, 0, 2 * Math.PI); ctx.fill(); };
  plot(curve1, col.c1);
  plot(curve2, col.c2);

  // cursor at sweep progress.
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(phase), inner.y); ctx.lineTo(xOf(phase), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('sweep progress', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('accumulated ∬', 0, 0); ctx.restore();
  const leg = [['dy dx', col.c1], ['dx dy', col.c2]];
  let lx = inner.x + 8; const ly = inner.y + 11;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 15, ly); lx += 62; }
}

function render() {
  if (!REG) relayout();
  if (!heat) { buildHeat(); rebuildCurves(); }
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- drag the region corner ---
let dragging = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  if ((WX(X1) - sx) ** 2 + (WY(Y1) - sy) ** 2 < 26 * 26) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return; const { sx, sy } = pScreen(ev);
  X1 = Math.max(0.4, Math.min(PI, invX(sx)));
  Y1 = Math.max(0.4, Math.min(PI, invY(sy)));
  syncVals(); rebuildCurves(); render();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) { phase += 0.3 * dt; if (phase > 1) phase -= 1; }
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); relayout(); phase = 0.6; render(); }

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
      { key: 'order', label: 'slice order', value: order() === 'dxdy' ? 'dx dy' : 'dy dx', format: 'text' },
      { key: 'region', label: 'region (x, y upper)', value: `${X1.toFixed(2)}, ${Y1.toFixed(2)}`, format: 'text' },
      { key: 'dydx', label: '∬ as dy dx', value: dyDx(120, 0, X1, 0, Y1), format: 'float' },
      { key: 'dxdy', label: '∬ as dx dy', value: dxDy(120, 0, X1, 0, Y1), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Fubini: the two iterated orders agree (to quadrature accuracy).
    const a = dxDy(160, 0, X1, 0, Y1), b = dyDx(160, 0, X1, 0, Y1);
    const err = Math.abs(a - b);
    return [{
      key: 'fubini',
      label: '|∬ dxdy − ∬ dydx| (Fubini)',
      value: err.toExponential(2),
      status: err < 1e-4 ? 'pass' : (err < 1e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
