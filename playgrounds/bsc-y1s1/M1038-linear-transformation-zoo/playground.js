// A 2x2 linear map deforming the plane. The scene draws the transformed grid, the
// unit square as a parallelogram (area = det), the unit circle as an ellipse with
// its singular-value axes, and the real eigenvector directions; the basis-vector
// tips are draggable. The diagnostic plots the stretch |M u| against input
// direction, bounded by the singular values. Canvas2D only.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Ch. 6 and Sec. 7.1.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { apply, determinant, trace, eigen, singularValues, stretch, PRESETS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selPre = document.getElementById('select-preset');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-play');
let holdT = 0, autoCycle = true;
function setPlay(on) { autoCycle = on; if (on) holdT = 0; if (btnPlay) { btnPlay.textContent = on ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!on)); } }

let preKey = 'shear';
let M = { ...PRESETS[preKey].M };
let tw = { from: null, to: null, t: 1, active: false };

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.4 }, { name: 'diag', weight: 0.82 }]); }
function syncVals() { selPre.value = preKey; }
function tweenTo(key) { preKey = key; tw = { from: { ...M }, to: { ...PRESETS[key].M }, t: 0, active: true }; syncVals(); }
selPre.addEventListener('change', () => { setPlay(false); tweenTo(selPre.value); });
btnReset.addEventListener('click', () => { setPlay(true); tweenTo('shear'); });
if (btnPlay) btnPlay.addEventListener('click', () => setPlay(!autoCycle));

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', refgrid: 'rgba(255,255,255,0.07)', grid: '#3f78c8', square: 'rgba(141,224,138,0.16)', squareEdge: '#8de08a', circle: '#ffd166', col1: '#ff5d5d', col2: '#5bd6a8', eig: '#b487ff', axis: 'rgba(255,255,255,0.28)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function setView(r) { const cx = r.x + r.w * 0.5, cy = r.y + 26 + (r.h - 26) * 0.5; const S = Math.min(r.w, r.h - 26) * 0.16; SC = { cx, cy, S, region: r }; }
function w2s(x, y) { return [SC.cx + x * SC.S, SC.cy - y * SC.S]; }

function drawScene(col, r) {
  panel(col, r, 'A linear map deforms the plane (drag the red and green vectors)');
  setView(r);
  const R = 5;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 20, w: r.w, h: r.h - 20 });
  // faint reference (identity) grid.
  ctx.strokeStyle = col.refgrid; ctx.lineWidth = 1;
  for (let k = -R; k <= R; k += 1) { let p = w2s(k, -R), q = w2s(k, R); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); p = w2s(-R, k); q = w2s(R, k); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
  // transformed grid (image of the integer grid under M).
  ctx.strokeStyle = `rgba(63,120,200,0.5)`; ctx.lineWidth = 1.1;
  for (let k = -R; k <= R; k += 1) {
    let a = apply(M, k, -R), b = apply(M, k, R); let p = w2s(a[0], a[1]), q = w2s(b[0], b[1]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    a = apply(M, -R, k); b = apply(M, R, k); p = w2s(a[0], a[1]); q = w2s(b[0], b[1]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
  }
  // axes through origin.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.2; let p = w2s(-R, 0), q = w2s(R, 0); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); p = w2s(0, -R); q = w2s(0, R); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
  // unit square -> parallelogram (columns of M).
  const o = w2s(0, 0), c1 = apply(M, 1, 0), c2 = apply(M, 0, 1), corner = apply(M, 1, 1);
  const sc1 = w2s(c1[0], c1[1]), sc2 = w2s(c2[0], c2[1]), scc = w2s(corner[0], corner[1]);
  ctx.fillStyle = col.square; ctx.strokeStyle = col.squareEdge; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(sc1[0], sc1[1]); ctx.lineTo(scc[0], scc[1]); ctx.lineTo(sc2[0], sc2[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
  // unit circle -> ellipse.
  ctx.strokeStyle = col.circle; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 72; i += 1) { const th = 2 * Math.PI * i / 72; const e = apply(M, Math.cos(th), Math.sin(th)); const s = w2s(e[0], e[1]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); } ctx.stroke();
  // singular-value axes: argmax / argmin of the stretch.
  let thMax = 0, thMin = 0, vMax = -1, vMin = Infinity;
  for (let i = 0; i < 360; i += 1) { const th = 2 * Math.PI * i / 360, v = stretch(M, th); if (v > vMax) { vMax = v; thMax = th; } if (v < vMin) { vMin = v; thMin = th; } }
  if (vMax - vMin > 0.03 * vMax) for (const th of [thMax, thMin]) { const e = apply(M, Math.cos(th), Math.sin(th)); const s = w2s(e[0], e[1]); ctx.strokeStyle = col.circle; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(s[0], s[1]); ctx.stroke(); ctx.setLineDash([]); }
  // real eigenvector directions (invariant lines through the origin).
  const eg = eigen(M);
  if (eg.real) eg.vectors.forEach((v) => { const a = w2s(-R * v[0], -R * v[1]), b = w2s(R * v[0], R * v[1]); ctx.strokeStyle = col.eig; ctx.lineWidth = 1.6; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); });
  // basis vectors (draggable handles).
  drawVec(col.col1, o, sc1, 'i'); drawVec(col.col2, o, sc2, 'j');
  ctx.fillStyle = col.fg; ctx.beginPath(); ctx.arc(o[0], o[1], 3.5, 0, 6.28); ctx.fill();
  ctx.restore();
  // readout strip.
  const det = determinant(M), tr = trace(M), [s1, s2] = singularValues(M);
  const eigTxt = eg.real ? `eig ${eg.values[0].toFixed(2)}, ${eg.values[1].toFixed(2)}` : 'eig complex (rotation)';
  const items = [[`det = ${det.toFixed(2)}`, col.squareEdge], [eigTxt, col.eig], [`sigma ${s1.toFixed(2)}, ${s2.toFixed(2)}`, col.circle]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 10); });
}
function drawVec(color, o, tip, label) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  const a = Math.atan2(tip[1] - o[1], tip[0] - o[0]);
  ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(tip[0] - 9 * Math.cos(a - 0.4), tip[1] - 9 * Math.sin(a - 0.4)); ctx.lineTo(tip[0] - 9 * Math.cos(a + 0.4), tip[1] - 9 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(tip[0], tip[1], 6, 0, 6.28); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawDiag(col, r) {
  panel(col, r, 'Stretch |M u| vs input direction: bounded by the singular values');
  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 16, h: r.h - 28 - 34 };
  const [s1, s2] = singularValues(M); const ymax = Math.max(s1 * 1.12, 0.5);
  const xOf = (deg) => inner.x + deg / 360 * inner.w;
  const yOf = (v) => inner.y + inner.h * (1 - v / ymax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // sigma1 / sigma2 reference lines.
  for (const [s, lab] of [[s1, 'sigma1'], [s2, 'sigma2']]) { ctx.strokeStyle = col.circle; ctx.globalAlpha = 0.55; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(s)); ctx.lineTo(inner.x + inner.w, yOf(s)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = col.circle; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(`${lab} = ${s.toFixed(2)}`, inner.x + 6, yOf(s) - 2); }
  // the stretch curve.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let d = 0; d <= 360; d += 1) { const v = stretch(M, d * Math.PI / 180); const X = xOf(d), Y = yOf(v); d ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  // eigenvector directions as vertical markers.
  const eg = eigen(M);
  if (eg.real) eg.vectors.forEach((v, i) => { let deg = Math.atan2(v[1], v[0]) * 180 / Math.PI; if (deg < 0) deg += 360; ctx.strokeStyle = col.eig; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(deg), inner.y); ctx.lineTo(xOf(deg), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); });
  ctx.restore();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const d of [0, 90, 180, 270, 360]) ctx.fillText(`${d}`, xOf(d), inner.y + inner.h + 6);
  ctx.fillText('input direction (deg)', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('|M u|', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function smooth(t) { return t * t * (3 - 2 * t); }
function advance(dt) {
  if (tw.active) { tw.t = Math.min(1, tw.t + dt / 0.55); const k = smooth(tw.t); M = { a: tw.from.a + (tw.to.a - tw.from.a) * k, b: tw.from.b + (tw.to.b - tw.from.b) * k, c: tw.from.c + (tw.to.c - tw.from.c) * k, d: tw.from.d + (tw.to.d - tw.from.d) * k }; if (tw.t >= 1) { tw.active = false; holdT = 0; } } else if (autoCycle) { holdT += dt; if (holdT > 1.6) { holdT = 0; const ks = Object.keys(PRESETS); tweenTo(ks[(ks.indexOf(preKey) + 1) % ks.length]); } }
}

let drag = null;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return;
  const t1 = w2s(M.a, M.c), t2 = w2s(M.b, M.d);
  if (Math.hypot(sx - t1[0], sy - t1[1]) < 16) drag = 'c1'; else if (Math.hypot(sx - t2[0], sy - t2[1]) < 16) drag = 'c2';
  if (drag) { tw.active = false; setPlay(false); setMatrixFrom(sx, sy); }
});
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [sx, sy] = ptr(e); setMatrixFrom(sx, sy); });
window.addEventListener('pointerup', () => { drag = null; });
function setMatrixFrom(sx, sy) {
  const wx = Math.round((sx - SC.cx) / SC.S * 5) / 5, wy = Math.round((SC.cy - sy) / SC.S * 5) / 5;
  if (drag === 'c1') { M.a = wx; M.c = wy; } else { M.b = wx; M.d = wy; }
}

let running = true, last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('preset') && PRESETS[params.get('preset')]) { preKey = params.get('preset'); M = { ...PRESETS[preKey].M }; tw.t = 1; }
  syncVals(); relayout(); render();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const eg = eigen(M), [s1, s2] = singularValues(M);
  return { fields: [
    { key: 'matrix', label: 'M (row major)', value: `[${M.a.toFixed(2)} ${M.b.toFixed(2)}; ${M.c.toFixed(2)} ${M.d.toFixed(2)}]`, format: 'text' },
    { key: 'det', label: 'determinant', value: determinant(M), format: 'float' },
    { key: 'trace', label: 'trace', value: trace(M), format: 'float' },
    { key: 'eig', label: 'eigenvalues', value: eg.real ? `${eg.values[0].toFixed(2)}, ${eg.values[1].toFixed(2)}` : 'complex', format: 'text' },
    { key: 'sv', label: 'singular values', value: `${s1.toFixed(2)}, ${s2.toFixed(2)}`, format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const det = determinant(M), [s1, s2] = singularValues(M);
  const areaOk = Math.abs(s1 * s2 - Math.abs(det));
  return [
    { key: 'area', label: 'sigma1 sigma2 = |det| (ellipse area)', value: areaOk.toExponential(1), status: areaOk < 1e-6 ? 'pass' : 'drift' },
    { key: 'orient', label: 'sign(det): orientation', value: det >= 0 ? 'kept' : 'flipped', status: 'pass' },
  ];
};
