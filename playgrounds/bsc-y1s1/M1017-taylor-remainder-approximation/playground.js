// Taylor polynomials and the remainder. The scene draws f and its Taylor
// polynomial about a draggable centre, the next term fading in as the degree
// sweeps up, with the remainder shaded and the convergence interval marked. The
// diagnostic plots the error and the Lagrange bound against degree at a draggable
// evaluation point. Canvas2D only.
//
// Reference: Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 5.15.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { FUNCS, taylorValue, remainder, lagrangeBound } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selFn = document.getElementById('select-fn');
const sN = document.getElementById('s-n'), vN = document.getElementById('v-n');
const btnReset = document.getElementById('btn-reset');

const DEF = { fn: 'sin', a: 0, maxDeg: 7, xEval: 4.2 };
const st = { fn: DEF.fn, a: DEF.a, maxDeg: DEF.maxDeg, xEval: DEF.xEval };
let nShown = 0;
function fn() { return FUNCS[st.fn]; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.9 }]); }
function clampDom(x) { const d = fn().dom; return Math.max(d[0], Math.min(d[1], x)); }
function syncVals() { selFn.value = st.fn; sN.value = st.maxDeg; vN.textContent = `${st.maxDeg}`; }
function pickFn(key) { st.fn = key; st.a = 0; st.xEval = clampDom(key === 'geom' ? -1.8 : key === 'log1p' ? 1.8 : key === 'exp' ? 2.2 : 4.2); nShown = 0; syncVals(); }
selFn.addEventListener('change', () => { pickFn(selFn.value); render(); });
btnReset.addEventListener('click', () => { pickFn('sin'); st.maxDeg = DEF.maxDeg; st.a = DEF.a; st.xEval = DEF.xEval; nShown = 0; syncVals(); });
sN.addEventListener('input', () => { st.maxDeg = +sN.value; if (nShown > st.maxDeg) nShown = 0; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', axis: 'rgba(255,255,255,0.3)', f: '#ffd166', poly: '#4ea8ff', rem: 'rgba(255,93,93,0.22)', center: '#8de08a', xev: '#b487ff', bound: '#ff7a59' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

// the Taylor polynomial with the highest term faded in by the fractional degree.
function taylorSmooth(f, a, nf, x) {
  const deg = Math.floor(nf), frac = nf - deg;
  let v = taylorValue(f, a, deg, x);
  if (frac > 0) v += frac * f.coeff(a, deg + 1) * Math.pow(x - a, deg + 1);
  return v;
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, 'f and its Taylor polynomial about a (drag the centre a and the point x)');
  const f = fn(); const [x0, x1] = f.dom;
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 46 };
  // y-range from f over the domain.
  let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 200; i += 1) { const v = f.f(x0 + (x1 - x0) * i / 200); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
  const pad = 0.18 * (hi - lo || 1); lo -= pad; hi += pad;
  const xOf = (x) => inner.x + (x - x0) / (x1 - x0) * inner.w;
  const yOf = (y) => inner.y + inner.h * (hi - y) / (hi - lo);
  SC = { inner, x0, x1, lo, hi, xOf, yOf };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // convergence interval [a-R, a+R].
  const R = f.radius(st.a);
  if (isFinite(R)) { ctx.fillStyle = 'rgba(141,224,138,0.08)'; const xa = xOf(Math.max(x0, st.a - R)), xb = xOf(Math.min(x1, st.a + R)); ctx.fillRect(xa, inner.y, xb - xa, inner.h);
    ctx.strokeStyle = 'rgba(141,224,138,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); for (const xe of [st.a - R, st.a + R]) if (xe > x0 && xe < x1) { ctx.beginPath(); ctx.moveTo(xOf(xe), inner.y); ctx.lineTo(xOf(xe), inner.y + inner.h); ctx.stroke(); } ctx.setLineDash([]); }
  // axes.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; if (lo < 0 && hi > 0) { ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke(); } if (x0 < 0 && x1 > 0) { ctx.beginPath(); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke(); }
  // remainder shading: only where the polynomial is in view (a lens around a);
  // beyond that the polynomial simply leaves the frame (divergence).
  const NS = 320; const clampY = (y) => Math.max(lo - pad, Math.min(hi + pad, y));
  ctx.fillStyle = col.rem; let run = [];
  const flush = () => { if (run.length >= 2) { ctx.beginPath(); for (const pt of run) ctx.lineTo(xOf(pt.x), yOf(pt.f)); for (let j = run.length - 1; j >= 0; j -= 1) ctx.lineTo(xOf(run[j].x), yOf(run[j].p)); ctx.closePath(); ctx.fill(); } run = []; };
  for (let i = 0; i <= NS; i += 1) { const x = x0 + (x1 - x0) * i / NS; const pv = taylorSmooth(f, st.a, nShown, x), fv = f.f(x); if (isFinite(fv) && pv >= lo && pv <= hi) run.push({ x, f: fv, p: pv }); else flush(); }
  flush();
  // f curve.
  ctx.strokeStyle = col.f; ctx.lineWidth = 2.8; ctx.beginPath(); for (let i = 0; i <= NS; i += 1) { const x = x0 + (x1 - x0) * i / NS; const Y = yOf(f.f(x)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  // Taylor polynomial.
  ctx.strokeStyle = col.poly; ctx.lineWidth = 2.4; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= NS; i += 1) { const x = x0 + (x1 - x0) * i / NS; const yv = taylorSmooth(f, st.a, nShown, x); const Y = yOf(yv); if (yv < lo - pad || yv > hi + pad) { pen = false; continue; } if (pen) ctx.lineTo(xOf(x), Y); else { ctx.moveTo(xOf(x), Y); pen = true; } } ctx.stroke();
  // centre a marker (touch point).
  ctx.strokeStyle = col.center; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.a), inner.y); ctx.lineTo(xOf(st.a), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.center; ctx.beginPath(); ctx.arc(xOf(st.a), yOf(f.f(st.a)), 5, 0, 6.28); ctx.fill();
  // evaluation point x: dots on f and on the polynomial, the gap is the error.
  const xe = st.xEval, fe = f.f(xe), pe = clampY(taylorSmooth(f, st.a, nShown, xe));
  ctx.strokeStyle = col.xev; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(xe), inner.y); ctx.lineTo(xOf(xe), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.f; ctx.beginPath(); ctx.arc(xOf(xe), yOf(fe), 4, 0, 6.28); ctx.fill();
  ctx.fillStyle = col.poly; ctx.beginPath(); ctx.arc(xOf(xe), yOf(pe), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  // handle labels.
  ctx.fillStyle = col.center; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('a', xOf(st.a), inner.y + inner.h + 4);
  ctx.fillStyle = col.xev; ctx.fillText('x', xOf(xe), inner.y + inner.h + 4);
  ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.fillText(`degree ${Math.min(st.maxDeg, Math.floor(nShown))} of ${st.maxDeg}`, inner.x + inner.w / 2, inner.y + inner.h + 18);
  // legend.
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillStyle = col.f; ctx.fillText(`f = ${f.label}`, inner.x + 6, inner.y + 4); ctx.fillStyle = col.poly; ctx.fillText('Taylor P_n', inner.x + 6, inner.y + 18); ctx.fillStyle = col.bound; ctx.fillText('shaded = remainder', inner.x + 6, inner.y + 32);
}

function drawDiag(col, r) {
  panel(col, r, 'Error and Lagrange bound at x vs degree n (log scale)');
  const f = fn(); const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 34 };
  const N = st.maxDeg; const errs = [], bnds = [];
  for (let n = 0; n <= N; n += 1) { errs.push(Math.max(1e-16, Math.abs(remainder(f, st.a, n, st.xEval)))); bnds.push(Math.max(1e-16, lagrangeBound(f, st.a, n, st.xEval))); }
  let top = -Infinity, bot = Infinity; for (const e of errs.concat(bnds)) { top = Math.max(top, e); bot = Math.min(bot, e); }
  const lt = Math.ceil(Math.log10(top) + 0.5), lb = Math.floor(Math.log10(Math.max(bot, 1e-16)) - 0.2);
  const xOf = (n) => inner.x + (N === 0 ? 0.5 : n / N) * inner.w;
  const yOf = (e) => inner.y + inner.h * (lt - Math.log10(e)) / (lt - lb);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // decade gridlines.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let d = lb; d <= lt; d += 1) { const Y = yOf(Math.pow(10, d)); ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  // Lagrange bound.
  ctx.strokeStyle = col.bound; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]); ctx.beginPath(); bnds.forEach((e, n) => { const X = xOf(n), Y = yOf(e); n ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]);
  // error.
  ctx.strokeStyle = col.poly; ctx.lineWidth = 2.4; ctx.beginPath(); errs.forEach((e, n) => { const X = xOf(n), Y = yOf(e); n ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  errs.forEach((e, n) => { ctx.fillStyle = col.poly; ctx.beginPath(); ctx.arc(xOf(n), yOf(e), 2.6, 0, 6.28); ctx.fill(); });
  // current swept degree marker.
  const nc = Math.min(N, Math.floor(nShown)); ctx.fillStyle = col.center; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(xOf(nc), yOf(errs[nc]), 5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.poly; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('error |f - P_n|', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.bound; ctx.fillText('Lagrange bound', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let n = 0; n <= N; n += Math.max(1, Math.round(N / 7))) ctx.fillText(`${n}`, xOf(n), inner.y + inner.h + 6);
  ctx.fillText('degree n', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let running = true, last = 0;
function advance(dt) { nShown += dt * 2.4; if (nShown > st.maxDeg + 1.6) nShown = 0; }
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

let drag = null;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return;
  const da = Math.abs(sx - SC.xOf(st.a)), dx = Math.abs(sx - SC.xOf(st.xEval));
  drag = da < dx ? 'a' : 'x'; setFrom(sx);
});
canvas.addEventListener('pointermove', (e) => { if (!drag) return; setFrom(ptr(e)[0]); });
window.addEventListener('pointerup', () => { drag = null; });
function setFrom(sx) { const x = clampDom(SC.x0 + (sx - SC.inner.x) / SC.inner.w * (SC.x1 - SC.x0)); if (drag === 'a') st.a = x; else st.xEval = x; }

function boot() {
  if (params.get('fn') && FUNCS[params.get('fn')]) pickFn(params.get('fn'));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) { nShown = Math.min(st.maxDeg, 4.0); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn(); const n = Math.min(st.maxDeg, Math.floor(nShown));
  return { fields: [
    { key: 'fn', label: 'function', value: f.label, format: 'text' },
    { key: 'a', label: 'centre a', value: st.a, format: 'float' },
    { key: 'n', label: 'degree shown', value: n, format: 'int' },
    { key: 'R', label: 'radius of convergence', value: Number.isFinite(f.radius(st.a)) ? f.radius(st.a) : 'infinite', format: Number.isFinite(f.radius(st.a)) ? 'float' : 'text' },
    { key: 'err', label: 'error at x', value: Math.abs(remainder(f, st.a, n, st.xEval)), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn(); const n = Math.min(st.maxDeg, Math.floor(nShown));
  const atCentre = Math.abs(remainder(f, st.a, n, st.a));
  const err = Math.abs(remainder(f, st.a, n, st.xEval)), bnd = lagrangeBound(f, st.a, n, st.xEval);
  return [
    { key: 'touch', label: 'P_n(a) = f(a) at the centre', value: atCentre.toExponential(1), status: atCentre < 1e-9 ? 'pass' : 'drift' },
    { key: 'bound', label: 'error within the Lagrange bound', value: `${err.toExponential(1)} <= ${bnd.toExponential(1)}`, status: err <= bnd + 1e-9 ? 'pass' : 'drift' },
  ];
};
