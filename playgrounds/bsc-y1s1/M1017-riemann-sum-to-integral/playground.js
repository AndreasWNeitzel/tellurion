// The Riemann sum converging to the definite integral. The scene draws f(x) with
// n rectangles (left, right, midpoint, or trapezoid) and the exact area; the
// diagnostic plots the approximation error against n on log-log axes, where the
// endpoint rules fall as 1/n and the midpoint and trapezoid rules as 1/n^2.
// Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 5.2 and 7.7.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { FUNCS, RULES, riemannSum, error, sample } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnFunc = document.getElementById('btn-func'), vFunc = document.getElementById('value-func');
const btnRule = document.getElementById('btn-rule'), vRule = document.getElementById('value-rule');
const btnReset = document.getElementById('btn-reset');

const FKEYS = Object.keys(FUNCS);
const st = { func: 'quad', rule: 'left', n: 8 };
function fn() { return FUNCS[st.func]; }

let view = { w: 820, h: 1020, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.35 }, { name: 'diag', weight: 0.86 }]);
}
function syncVals() { vN.textContent = String(st.n); vFunc.textContent = fn().label; vRule.textContent = st.rule; }
sN.addEventListener('input', () => { st.n = parseInt(sN.value, 10); syncVals(); render(); });
btnFunc.addEventListener('click', () => { st.func = FKEYS[(FKEYS.indexOf(st.func) + 1) % FKEYS.length]; syncVals(); render(); });
btnRule.addEventListener('click', () => { st.rule = RULES[(RULES.indexOf(st.rule) + 1) % RULES.length]; syncVals(); render(); });
btnReset.addEventListener('click', () => { st.func = 'quad'; st.rule = 'left'; st.n = 8; sN.value = '8'; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', curve: '#ffd166', exact: 'rgba(103,217,140,0.16)', rect: 'rgba(91,155,213,0.30)', rectEdge: '#5b9bd5', err: '#ef5466', ref: 'rgba(255,255,255,0.3)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  panel(col, r, `Riemann sum of f with ${st.n} ${st.rule} rectangles approaching the exact integral`);
  const f = fn(); const a = f.a, b = f.b;
  const pad = { l: 44, r: 16, t: 26, b: 34 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b - 24 };
  let fmax = 0; for (let i = 0; i <= 200; i += 1) fmax = Math.max(fmax, f.f(a + (b - a) * i / 200)); fmax *= 1.12;
  const X = (x) => box.x + (x - a) / (b - a) * box.w;
  const Y = (y) => box.y + box.h - y / fmax * box.h;
  ctx.save(); clipTo(ctx, box);
  // exact area under the curve (light fill).
  ctx.fillStyle = col.exact; ctx.beginPath(); ctx.moveTo(X(a), Y(0)); for (let i = 0; i <= 240; i += 1) { const x = a + (b - a) * i / 240; ctx.lineTo(X(x), Y(f.f(x))); } ctx.lineTo(X(b), Y(0)); ctx.closePath(); ctx.fill();
  // Riemann rectangles / trapezoids.
  const h = (b - a) / st.n;
  ctx.strokeStyle = col.rectEdge; ctx.lineWidth = 1;
  for (let i = 0; i < st.n; i += 1) {
    const x0 = a + i * h, x1 = a + (i + 1) * h;
    ctx.fillStyle = col.rect; ctx.beginPath();
    if (st.rule === 'trapezoid') { ctx.moveTo(X(x0), Y(0)); ctx.lineTo(X(x0), Y(f.f(x0))); ctx.lineTo(X(x1), Y(f.f(x1))); ctx.lineTo(X(x1), Y(0)); }
    else { const hgt = sample(f, st.rule, a, h, i); ctx.moveTo(X(x0), Y(0)); ctx.lineTo(X(x0), Y(hgt)); ctx.lineTo(X(x1), Y(hgt)); ctx.lineTo(X(x1), Y(0)); }
    ctx.closePath(); ctx.fill(); if (st.n <= 60) ctx.stroke();
  }
  // f(x) curve on top.
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 320; i += 1) { const x = a + (b - a) * i / 320; const Xp = X(x), Yp = Y(f.f(x)); i ? ctx.lineTo(Xp, Yp) : ctx.moveTo(Xp, Yp); } ctx.stroke();
  ctx.restore();
  // axes.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(box.x, Y(0)); ctx.lineTo(box.x + box.w, Y(0)); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`${a}`, X(a), box.y + box.h + 4); ctx.fillText(`${b.toFixed(2)}`, X(b), box.y + box.h + 4); ctx.fillText('x', box.x + box.w / 2, box.y + box.h + 18);
  // readouts.
  const Sn = riemannSum(f, st.n, st.rule), E = error(f, st.n, st.rule);
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const items = [[`sum ${Sn.toFixed(4)}`, col.rectEdge], [`exact ${f.exact.toFixed(4)}`, col.exact.replace('0.16', '0.9')], [`error ${E.toExponential(2)}`, col.err]];
  items.forEach(([t, c], i) => { ctx.fillStyle = i === 1 ? '#67d98c' : c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 12); });
}

function drawDiag(col, r) {
  panel(col, r, 'Error vs number of rectangles (log-log): endpoint rules fall as 1/n, midpoint and trapezoid as 1/n^2');
  const f = fn();
  const ns = []; for (let k = 1; k <= 9; k += 1) ns.push(2 ** k);     // 2,4,...,512
  const inner = { x: r.x + 50, y: r.y + 26, w: r.w - 50 - 16, h: r.h - 26 - 32 };
  const data = ns.map((n) => ({ n, e: Math.max(error(f, n, st.rule), 1e-16) }));
  const xLo = Math.log10(2), xHi = Math.log10(512);
  const yLo = -10, yHi = Math.ceil(Math.log10(Math.max(...data.map((d) => d.e))));
  const xOf = (n) => inner.x + (Math.log10(n) - xLo) / (xHi - xLo) * inner.w;
  const yOf = (e) => inner.y + inner.h - (Math.max(yLo, Math.log10(e)) - yLo) / (yHi - yLo) * inner.h;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = yHi; e >= yLo; e -= 2) { const Y = yOf(10 ** e); ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${e}`, inner.x - 5, Y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // reference slopes (-1 and -2) anchored at the first point.
  const a0 = data[0];
  for (const [slope, lab] of [[-1, '1/n'], [-2, '1/n^2']]) {
    ctx.strokeStyle = col.ref; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath();
    for (const n of ns) { const e = a0.e * (n / a0.n) ** slope; const X = xOf(n), Y = yOf(e); n === ns[0] ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.ref; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lab, xOf(512) - 30, yOf(a0.e * (512 / a0.n) ** slope) + (slope === -1 ? -8 : 8));
  }
  // the rule's error curve.
  ctx.strokeStyle = col.err; ctx.lineWidth = 2.4; ctx.beginPath(); data.forEach((d, i) => { const X = xOf(d.n), Y = yOf(d.e); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  data.forEach((d) => { ctx.fillStyle = col.err; ctx.beginPath(); ctx.arc(xOf(d.n), yOf(d.e), 2.5, 0, 6.28); ctx.fill(); });
  // current n marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.n), inner.y); ctx.lineTo(xOf(st.n), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('number of rectangles n', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = col.err; ctx.fillText('error', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function boot() {
  if (params.get('func') && FUNCS[params.get('func')]) st.func = params.get('func');
  if (params.get('rule') && RULES.includes(params.get('rule'))) st.rule = params.get('rule');
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn();
  return { fields: [
    { key: 'func', label: 'function', value: f.label, format: 'text' },
    { key: 'rule', label: 'rule', value: st.rule, format: 'text' },
    { key: 'n', label: 'rectangles n', value: st.n, format: 'int' },
    { key: 'sum', label: 'Riemann sum', value: riemannSum(f, st.n, st.rule), format: 'float' },
    { key: 'exact', label: 'exact integral', value: f.exact, format: 'float' },
    { key: 'error', label: 'error', value: error(f, st.n, st.rule), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn();
  const e1 = error(f, 64, st.rule), e2 = error(f, 1024, st.rule);
  const conv = e2 < e1 + 1e-15;
  const order = e2 > 0 ? Math.log2(error(f, 200, st.rule) / error(f, 400, st.rule)) : 2;
  const expected = (st.rule === 'left' || st.rule === 'right') ? 1 : 2;
  // a rule must reach at least its nominal order; endpoint rules can do better
  // when f matches at the two ends (the sine case), which is fine.
  return [
    { key: 'conv', label: 'the sum converges to the integral', value: e2.toExponential(1), status: conv ? 'pass' : 'drift' },
    { key: 'order', label: `order at least ${expected} for ${st.rule}`, value: order.toFixed(2), status: order > expected - 0.4 || error(f, 400, st.rule) < 1e-12 ? 'pass' : 'drift' },
  ];
};
