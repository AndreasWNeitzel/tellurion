// Lagrange multipliers. The scene shows the contours of f, the constraint
// curve, and a point sweeping the constraint with the gradients of f and g; at
// a constrained optimum the constraint is tangent to a level set and the two
// gradients line up. The diagnostic is f along the constraint, whose peaks and
// valleys are exactly those optima. Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 14.8.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { PRESETS, constrainedValue, tangentSlope, gradientCross, optima } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selP = document.getElementById('select-preset');
const sT = document.getElementById('slider-t'), vT = document.getElementById('value-t');
const btnReset = document.getElementById('btn-reset'), btnPlay = document.getElementById('btn-playpause');

const st = { key: 'circleLinear', u: 0.12 };       // u in [0,1] maps to the constraint parameter
let running = !DETERMINISTIC;
let heat = null, contours = [], opt = [], heatKey = '';

let view = { w: 760, h: 980, dpr: 1 }, REG = null, SQ = null;
function preset() { return PRESETS[st.key]; }
function VIEW() { return preset().view; }
function paramT() { const [a, b] = preset().tRange; return a + (b - a) * st.u; }

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.5 }, { name: 'diag', weight: 1.0 }]);
  const r = REG.scene, titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const s = Math.min(draw.w, draw.h) * 0.92;
  SQ = { cx: draw.x + draw.w / 2, cy: draw.y + draw.h / 2, half: s / 2, draw };
}
const DX = (x) => SQ.cx + x / VIEW() * SQ.half;
const DY = (y) => SQ.cy - y / VIEW() * SQ.half;

function buildField() {
  if (!SQ) return;
  const p = preset(), V = p.view, N = 110;
  const key = `${st.key}:${N}`;
  const grid = new Float64Array(N * N); let lo = Infinity, hi = -Infinity;
  for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
    const x = -V + 2 * V * (i + 0.5) / N, y = V - 2 * V * (j + 0.5) / N;
    const v = p.f(x, y); grid[j * N + i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
  }
  if (!heat) heat = document.createElement('canvas');
  heat.width = N; heat.height = N; const hctx = heat.getContext('2d'); const img = hctx.createImageData(N, N);
  for (let k = 0; k < N * N; k += 1) { const t = (grid[k] - lo) / (hi - lo || 1); const c = viridis(0.06 + 0.7 * t); img.data[k * 4] = c.r; img.data[k * 4 + 1] = c.g; img.data[k * 4 + 2] = c.b; img.data[k * 4 + 3] = 150; }
  hctx.putImageData(img, 0, 0);
  contours = [];
  const xs = (i) => -V + 2 * V * (i + 0.5) / N, ys = (j) => V - 2 * V * (j + 0.5) / N;
  for (let s = 1; s <= 9; s += 1) {
    const L = lo + (hi - lo) * s / 10;
    for (let j = 0; j < N - 1; j += 1) for (let i = 0; i < N - 1; i += 1) {
      const a = grid[j * N + i], b = grid[j * N + i + 1], c = grid[(j + 1) * N + i + 1], d = grid[(j + 1) * N + i];
      const pts = []; const cr = (va, vb, x1, y1, x2, y2) => { if ((va > L) !== (vb > L)) { const t = (L - va) / (vb - va); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
      cr(a, b, xs(i), ys(j), xs(i + 1), ys(j)); cr(b, c, xs(i + 1), ys(j), xs(i + 1), ys(j + 1)); cr(c, d, xs(i + 1), ys(j + 1), xs(i), ys(j + 1)); cr(d, a, xs(i), ys(j + 1), xs(i), ys(j));
      if (pts.length >= 2) contours.push([pts[0], pts[1]]);
      if (pts.length === 4) contours.push([pts[2], pts[3]]);
    }
  }
  opt = optima(p);
  heatKey = key;
}

function syncVals() { vT.textContent = `${(st.u * 100).toFixed(0)} %`; selP.value = st.key; }
selP.addEventListener('change', () => { st.key = selP.value; buildField(); render(); });
sT.addEventListener('input', () => { st.u = parseFloat(sT.value); running = false; btnPlay.textContent = 'Play'; btnPlay.setAttribute('aria-pressed', 'true'); syncVals(); render(); });
btnReset.addEventListener('click', () => { st.key = 'circleLinear'; st.u = 0.12; selP.value = 'circleLinear'; sT.value = '0.12'; running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false'); buildField(); syncVals(); render(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', constraint: '#ff6f9d', gradf: '#ffd166', gradg: '#5bc0eb', opt: '#67d98c', contour: 'rgba(255,255,255,0.16)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}
function vec(color, x0, y0, ux, uy, len, w = 2.6) {
  const x1 = x0 + ux * len, y1 = y0 - uy * len;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0), a = 7; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - a * Math.cos(ang - 0.4), y1 - a * Math.sin(ang - 0.4)); ctx.lineTo(x1 - a * Math.cos(ang + 0.4), y1 - a * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
}

function drawScene(col, r) {
  if (heatKey !== `${st.key}:110`) buildField();
  panel(col, r, 'At a constrained optimum the constraint is tangent to a level set of f');
  const p = preset();
  ctx.save(); clipTo(ctx, SQ.draw);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, SQ.cx - SQ.half, SQ.cy - SQ.half, 2 * SQ.half, 2 * SQ.half);
  ctx.strokeStyle = col.contour; ctx.lineWidth = 1; ctx.beginPath();
  for (const s of contours) { ctx.moveTo(DX(s[0][0]), DY(s[0][1])); ctx.lineTo(DX(s[1][0]), DY(s[1][1])); }
  ctx.stroke();
  // constraint curve.
  ctx.strokeStyle = col.constraint; ctx.lineWidth = 2.6; ctx.beginPath();
  const [t0, t1] = p.tRange; const M = 240;
  for (let i = 0; i <= M; i += 1) { const t = t0 + (t1 - t0) * i / M; const [x, y] = p.curve(t); const X = DX(x), Y = DY(y); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // optima markers (green).
  for (const o of opt) { const [x, y] = p.curve(o.t); ctx.fillStyle = col.opt; ctx.beginPath(); ctx.arc(DX(x), DY(y), 5, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 1.4; ctx.stroke(); }
  // current point and its gradients.
  const t = paramT(); const [px, py] = p.curve(t);
  const gf = p.gradf(px, py), gg = p.gradg(px, py);
  const nf = Math.hypot(...gf) || 1, ng = Math.hypot(...gg) || 1;
  const L = SQ.half * 0.26;
  vec(col.gradg, DX(px), DY(py), gg[0] / ng, gg[1] / ng, L * 0.85, 2);
  vec(col.gradf, DX(px), DY(py), gf[0] / nf, gf[1] / nf, L, 3);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(DX(px), DY(py), 4.5, 0, 6.28); ctx.fill();
  ctx.restore();
  // labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle';
  ctx.fillStyle = col.gradf; ctx.textAlign = 'left'; ctx.fillText('grad f', DX(px) + gf[0] / nf * L + 5, DY(py) - gf[1] / nf * L);
  ctx.fillStyle = col.gradg; ctx.fillText('grad g', DX(px) + gg[0] / ng * L * 0.85 + 5, DY(py) - gg[1] / ng * L * 0.85);

  // readout strip.
  const cross = Math.abs(gradientCross(p, t));
  const aligned = cross < 0.05 * nf * ng;
  const items = [
    [p.fExpr, col.gradf],
    [`g: ${p.gExpr}`, col.constraint],
    [`f = ${constrainedValue(p, t).toFixed(2)}`, col.fg],
    [aligned ? 'gradients ALIGNED (optimum)' : 'gradients not parallel', aligned ? col.opt : col.muted],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [tx] of items) widest = Math.max(widest, ctx.measureText(tx).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([tx, c], i) => { ctx.fillStyle = c; ctx.fillText(tx, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiag(col, r) {
  panel(col, r, 'f along the constraint: its peaks and valleys are the optima');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 30 };
  const p = preset(); const [t0, t1] = p.tRange;
  let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 200; i += 1) { const v = constrainedValue(p, t0 + (t1 - t0) * i / 200); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
  const xOf = (u) => inner.x + u * inner.w;
  const yOf = (v) => inner.y + inner.h - (v - lo) / (hi - lo) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const v = lo + (hi - lo) * k / 4; const y = yOf(v); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(v.toFixed(1), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // f(t) curve.
  ctx.strokeStyle = col.constraint; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const u = i / 300; const v = constrainedValue(p, t0 + (t1 - t0) * u); const X = xOf(u), Y = yOf(v); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // optima markers.
  for (const o of opt) { const u = (o.t - t0) / (t1 - t0); ctx.fillStyle = col.opt; ctx.beginPath(); ctx.arc(xOf(u), yOf(o.value), 4.5, 0, 6.28); ctx.fill(); }
  // current point.
  ctx.strokeStyle = col.gradf; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.u), inner.y); ctx.lineTo(xOf(st.u), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(st.u), yOf(constrainedValue(p, paramT())), 4, 0, 6.28); ctx.fill();

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('position along the constraint', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('f on the constraint', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiag(col, REG.diag);
}
function tick() { if (running) { st.u += 0.004; if (st.u > 1) st.u -= 1; sT.value = String(st.u); syncVals(); } render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  const pk = params.get('preset'); if (pk && PRESETS[pk]) { st.key = pk; }
  syncVals(); relayout(); buildField(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

window.addEventListener('resize', () => { relayout(); buildField(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); buildField(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const p = preset(), t = paramT(), [x, y] = p.curve(t);
  return { fields: [
    { key: 'preset', label: 'problem', value: p.label, format: 'text' },
    { key: 'point', label: 'point on constraint', value: `${x.toFixed(2)}, ${y.toFixed(2)}`, format: 'text' },
    { key: 'fval', label: 'f on the constraint', value: constrainedValue(p, t), format: 'float' },
    { key: 'cross', label: 'grad f x grad g (0 = optimum)', value: gradientCross(p, t), format: 'float' },
    { key: 'nopt', label: 'constrained optima', value: opt.length, format: 'int' },
  ] };
};
window.playground.getInvariants = function () {
  const p = preset();
  if (!opt.length) return [];
  let worst = 0; for (const o of opt) worst = Math.max(worst, Math.abs(gradientCross(p, o.t)));
  return [
    { key: 'parallel', label: 'at optima: grad f parallel grad g', value: worst.toExponential(1), status: worst < 1e-3 ? 'pass' : 'drift' },
    { key: 'count', label: 'optima found on the constraint', value: String(opt.length), status: opt.length > 0 ? 'pass' : 'drift' },
  ];
};
