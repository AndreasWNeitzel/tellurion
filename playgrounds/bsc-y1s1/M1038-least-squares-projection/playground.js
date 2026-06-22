// Least squares as projection. The scene shows draggable data, the best-fit line
// through the centroid with the vertical residuals, and (when the line is tilted
// off the optimum) the optimal line as a ghost; the diagnostic is the SSR parabola
// in the slope, minimised at the least-squares fit. Canvas2D only.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Sec. 4.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { stats, lsSlope, lsIntercept, ssr, ssrCentroid, ssrMin, residuals, normalSums, rSquared, PRESET } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const btnReset = document.getElementById('btn-reset'), btnBest = document.getElementById('btn-best');

let pts = PRESET.map((p) => ({ ...p }));
let mDisp = lsSlope(pts); // displayed slope (optimal unless tilted)
const WX = [-3.6, 3.6], WY = [-3.2, 3.2];

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.3 }, { name: 'diag', weight: 0.92 }]); }
btnReset.addEventListener('click', () => { pts = PRESET.map((p) => ({ ...p })); mDisp = lsSlope(pts); render(); });
btnBest.addEventListener('click', () => { mDisp = lsSlope(pts); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', axis: 'rgba(255,255,255,0.3)', line: '#4ea8ff', ghost: 'rgba(141,224,138,0.7)', res: '#ff5d5d', pt: '#ffd166', cen: '#8de08a', parab: '#b487ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function arrow(x0, y0, x1, y1, color, w, head) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0), h = head || 8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - h * Math.cos(a - 0.42), y1 - h * Math.sin(a - 0.42)); ctx.lineTo(x1 - h * Math.cos(a + 0.42), y1 - h * Math.sin(a + 0.42)); ctx.closePath(); ctx.fill();
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, 'Best-fit line and residuals (drag the points or the blue slope handle)');
  const inner = { x: r.x + 30, y: r.y + 28, w: r.w - 30 - 18, h: r.h - 28 - 26 };
  const xOf = (x) => inner.x + (x - WX[0]) / (WX[1] - WX[0]) * inner.w;
  const yOf = (y) => inner.y + inner.h * (WY[1] - y) / (WY[1] - WY[0]);
  SC = { inner, xOf, yOf };
  const s = stats(pts), mStar = lsSlope(pts);
  const lineY = (x) => s.ybar + mDisp * (x - s.xbar);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // grid + axes.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1; for (let k = -3; k <= 3; k += 1) { ctx.beginPath(); ctx.moveTo(xOf(k), inner.y); ctx.lineTo(xOf(k), inner.y + inner.h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(inner.x, yOf(k)); ctx.lineTo(inner.x + inner.w, yOf(k)); ctx.stroke(); }
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke();
  // optimal ghost line when tilted off the optimum.
  if (Math.abs(mDisp - mStar) > 1e-3) { ctx.strokeStyle = col.ghost; ctx.lineWidth = 1.6; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(xOf(WX[0]), yOf(s.ybar + mStar * (WX[0] - s.xbar))); ctx.lineTo(xOf(WX[1]), yOf(s.ybar + mStar * (WX[1] - s.xbar))); ctx.stroke(); ctx.setLineDash([]); }
  // residual segments.
  ctx.strokeStyle = col.res; ctx.lineWidth = 2; for (const p of pts) { ctx.beginPath(); ctx.moveTo(xOf(p.x), yOf(p.y)); ctx.lineTo(xOf(p.x), yOf(lineY(p.x))); ctx.stroke(); }
  // the fit line.
  ctx.strokeStyle = col.line; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(xOf(WX[0]), yOf(lineY(WX[0]))); ctx.lineTo(xOf(WX[1]), yOf(lineY(WX[1]))); ctx.stroke();
  // centroid.
  ctx.strokeStyle = col.cen; ctx.lineWidth = 1.6; const cx = xOf(s.xbar), cy = yOf(s.ybar); ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7); ctx.stroke();
  // data points.
  for (const p of pts) { ctx.fillStyle = col.pt; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(xOf(p.x), yOf(p.y), 6, 0, 6.28); ctx.fill(); ctx.stroke(); }
  // slope handle at the right end of the line.
  const hx = WX[1] * 0.82; ctx.fillStyle = col.line; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(xOf(hx), yOf(lineY(hx)), 7, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  // readout strip.
  const c = s.ybar - mDisp * s.xbar, ssrv = ssrCentroid(pts, mDisp), R2 = rSquared(pts, mDisp);
  const items = [[`y = ${mDisp.toFixed(2)} x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(2)}`, col.line], [`SSR = ${ssrv.toFixed(2)}`, col.res], [`R^2 = ${R2.toFixed(3)}`, col.cen]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, cc], i) => { ctx.fillStyle = cc; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 9); });
}

function drawDiag(col, r) {
  panel(col, r, 'Least squares as projection: b projects onto the column space, residual e perpendicular to it');
  const inner = { x: r.x + 14, y: r.y + 28, w: r.w - 28, h: r.h - 28 - 12 };
  const s = stats(pts), mStar = lsSlope(pts), dm = mDisp - mStar;
  const perp = Math.sqrt(Math.max(0, ssrMin(pts)));        // irreducible residual, perpendicular to C(A)
  const lean = dm * Math.sqrt(s.Sxx);                      // in-plane part of e, zero only at the fit
  const atOpt = Math.abs(dm) < 1e-3;
  // oblique-3D frame: the column space is the plane spanned by U (the ones column)
  // and Vp (the x column); N is the normal direction, the residual axis.
  const O = [inner.x + inner.w * 0.14, inner.y + inner.h * 0.74];
  const PW = inner.w * 0.54, PD = inner.h * 0.46;
  const Uvec = [PW, 0], Vvec = [PD * 0.74, -PD * 0.46];
  const Nu = (() => { const v = [-0.14, -1], n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n]; })();
  const Vlen = Math.hypot(Vvec[0], Vvec[1]), Vu = [Vvec[0] / Vlen, Vvec[1] / Vlen];
  // fixed scale tied to the irreducible residual, so e visibly grows as the line is tilted off the fit.
  const SCALE = Math.min(inner.h * 0.42 / Math.max(0.55, Math.sqrt(ssrMin(pts))), 90);
  const add = (a, ...terms) => { let x = a[0], y = a[1]; for (let i = 0; i < terms.length; i += 2) { x += terms[i] * terms[i + 1][0]; y += terms[i] * terms[i + 1][1]; } return [x, y]; };
  ctx.save(); clipTo(ctx, inner);
  // the plane (column space).
  const c0 = O, c1 = add(O, 1, Uvec), c2 = add(O, 1, Uvec, 1, Vvec), c3 = add(O, 1, Vvec);
  ctx.fillStyle = 'rgba(78,168,255,0.10)'; ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...c1); ctx.lineTo(...c2); ctx.lineTo(...c3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(78,168,255,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  const plab = add(O, 0.5, Uvec);
  ctx.fillStyle = 'rgba(78,168,255,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('column space C(A) = all A x', plab[0], plab[1] + 5);
  // foot p (the projection / fitted vector) in the plane.
  const p = add(O, 0.42, Uvec, 0.5, Vvec);
  // residual e from p: perpendicular part along N, in-plane lean along V.
  const e = add(p, perp * SCALE, Nu, lean * SCALE, Vu);
  // dashed in-plane component O -> p (the fit p = A x-hat lives in the plane).
  ctx.strokeStyle = 'rgba(141,224,138,0.7)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(...O); ctx.lineTo(...p); ctx.stroke(); ctx.setLineDash([]);
  // right-angle mark at p when e is perpendicular (the least-squares fit).
  if (atOpt) { const m1 = add(p, 11, Vu), m2 = add(p, 11, Vu, 11, Nu), m3 = add(p, 11, Nu); ctx.strokeStyle = col.res; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...m1); ctx.lineTo(...m2); ctx.lineTo(...m3); ctx.stroke(); }
  // e = b - p (red), b (yellow), p (blue dot).
  arrow(p[0], p[1], e[0], e[1], col.res, 2.6, 9);
  arrow(O[0], O[1], e[0], e[1], col.pt, 2.4, 9);
  ctx.fillStyle = col.line; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 6.28); ctx.fill(); ctx.stroke();
  // labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = col.pt; ctx.fillText('b (data)', e[0] + 8, e[1] - 4);
  ctx.fillStyle = col.line; ctx.fillText('p = A x-hat', p[0] + 9, p[1] + 11);
  ctx.fillStyle = col.res; ctx.fillText(`e, |e| = sqrt(SSR) = ${Math.sqrt(ssrCentroid(pts, mDisp)).toFixed(2)}`, (p[0] + e[0]) / 2 + 10, (p[1] + e[1]) / 2);
  ctx.restore();
  // the normal-equations annotation.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = atOpt ? col.cen : col.res;
  ctx.fillText(atOpt ? 'fit: e perpendicular to C(A), A^T e = 0 (the normal equations)' : 'tilted off the fit: e not perpendicular, A^T e != 0, |e| larger', inner.x + 4, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = null; // {kind:'pt', i} or {kind:'slope'}
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function w2(sx, sy) { return [WX[0] + (sx - SC.inner.x) / SC.inner.w * (WX[1] - WX[0]), WY[1] - (sy - SC.inner.y) / SC.inner.h * (WY[1] - WY[0])]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return;
  const s = stats(pts); const hx = WX[1] * 0.82, hsx = SC.xOf(hx), hsy = SC.yOf(s.ybar + mDisp * (hx - s.xbar));
  if (Math.hypot(sx - hsx, sy - hsy) < 14) { drag = { kind: 'slope' }; return; }
  for (let i = 0; i < pts.length; i += 1) if (Math.hypot(sx - SC.xOf(pts[i].x), sy - SC.yOf(pts[i].y)) < 14) { drag = { kind: 'pt', i }; return; }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return; const [sx, sy] = ptr(e); const [wx, wy] = w2(sx, sy);
  if (drag.kind === 'pt') { pts[drag.i].x = Math.max(WX[0], Math.min(WX[1], wx)); pts[drag.i].y = Math.max(WY[0], Math.min(WY[1], wy)); mDisp = lsSlope(pts); }
  else { const s = stats(pts); mDisp = Math.max(-3, Math.min(3, (wy - s.ybar) / ((wx - s.xbar) || 1e-6))); }
  render();
});
window.addEventListener('pointerup', () => { drag = null; });

function boot() {
  syncReady();
}
function syncReady() {
  relayout(); render();
  if (DETERMINISTIC) { mDisp = (params.get('tilt') ? lsSlope(pts) + 0.45 : lsSlope(pts)); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = stats(pts), c = s.ybar - mDisp * s.xbar;
  return { fields: [
    { key: 'slope', label: 'slope m', value: mDisp, format: 'float' },
    { key: 'intercept', label: 'intercept c', value: c, format: 'float' },
    { key: 'ssr', label: 'SSR', value: ssrCentroid(pts, mDisp), format: 'float' },
    { key: 'ssrmin', label: 'SSR minimum', value: ssrMin(pts), format: 'float' },
    { key: 'r2', label: 'R^2', value: rSquared(pts, mDisp), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const mStar = lsSlope(pts); const ns = normalSums(pts, mStar);
  const atOpt = Math.abs(mDisp - mStar) < 1e-3;
  const ssrGap = ssrCentroid(pts, mDisp) - ssrMin(pts);
  return [
    { key: 'normal', label: 'residual orthogonal at optimum (sum r x = 0)', value: ns.sumRx.toExponential(1), status: Math.abs(ns.sumRx) < 1e-6 ? 'pass' : 'drift' },
    { key: 'min', label: atOpt ? 'at the least-squares minimum' : 'tilted: SSR above minimum', value: ssrGap.toFixed(2), status: ssrGap >= -1e-9 ? 'pass' : 'drift' },
  ];
};
