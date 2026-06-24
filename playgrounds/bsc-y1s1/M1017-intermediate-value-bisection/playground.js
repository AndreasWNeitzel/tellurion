// The intermediate value theorem made constructive by bisection. The scene draws
// f, the bracket that holds the sign change, and the midpoint being tested, the
// bracket halving step by step toward the root; the diagnostic plots the bracket
// width and |f(midpoint)| against iteration on a log axis (geometric halving).
// Canvas2D only.
//
// Reference: Burden and Faires, Numerical Analysis, 9th ed., Sec. 2.1.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { FUNCS, bracketsRoot, width, midpoint, bisectStep } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selFn = document.getElementById('select-fn');
const btnStep = document.getElementById('btn-step'), btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');

const MAXIT = 30, STEP_DT = 0.55;
const st = { fn: 'cubic', a0: FUNCS.cubic.a0, b0: FUNCS.cubic.b0 };
let cur = { a: st.a0, b: st.b0 }, hist = [], acc = 0, phase = 'run';
function fn() { return FUNCS[st.fn]; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.9 }]); }
let running = true;
function restart() { cur = { a: st.a0, b: st.b0 }; hist = []; acc = 0; phase = 'run'; }
function pickFn(key) { st.fn = key; st.a0 = FUNCS[key].a0; st.b0 = FUNCS[key].b0; restart(); syncVals(); }
function syncVals() { selFn.value = st.fn; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(running)); }
function setRunning(on) { running = on; syncVals(); }
selFn.addEventListener('change', () => { pickFn(selFn.value); render(); });
btnStep.addEventListener('click', () => { setRunning(false); step(); render(); });
btnPlay.addEventListener('click', () => { setRunning(!running); });
btnReset.addEventListener('click', () => { st.fn = 'cubic'; pickFn('cubic'); setRunning(true); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', axis: 'rgba(255,255,255,0.32)', f: '#ffd166', band: 'rgba(78,168,255,0.13)', pos: '#5bd6a8', neg: '#ff5d5d', mid: '#b487ff', root: '#8de08a', wid: '#4ea8ff', fm: '#ff9d3c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, 'Bisection brackets the root (drag the endpoints a and b)');
  const f = fn(); const [x0, x1] = f.dom;
  const inner = { x: r.x + 36, y: r.y + 28, w: r.w - 36 - 16, h: r.h - 28 - 30 };
  const lo = f.yr[0], hi = f.yr[1];
  const xOf = (x) => inner.x + (x - x0) / (x1 - x0) * inner.w;
  const yOf = (y) => inner.y + inner.h * (hi - y) / (hi - lo);
  SC = { inner, x0, x1, xOf, yOf };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // bracket band.
  ctx.fillStyle = col.band; ctx.fillRect(xOf(Math.min(cur.a, cur.b)), inner.y, Math.abs(xOf(cur.b) - xOf(cur.a)), inner.h);
  // axes.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.2; if (lo < 0 && hi > 0) { ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke(); }
  ctx.strokeStyle = col.grid; if (x0 < 0 && x1 > 0) { ctx.beginPath(); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke(); }
  // f curve.
  ctx.strokeStyle = col.f; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const x = x0 + (x1 - x0) * i / 300; const Y = yOf(f.f(x)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  // endpoints a, b (coloured by sign of f) and the midpoint.
  const drawPt = (x, color, lab) => { ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(x), inner.y); ctx.lineTo(xOf(x), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xOf(x), yOf(f.f(x)), 5, 0, 6.28); ctx.fill(); };
  const ca = f.f(cur.a) >= 0 ? col.pos : col.neg, cb = f.f(cur.b) >= 0 ? col.pos : col.neg;
  drawPt(cur.a, ca); drawPt(cur.b, cb);
  if (hist.length) { const m = hist[hist.length - 1].m; ctx.strokeStyle = col.mid; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xOf(m), inner.y); ctx.lineTo(xOf(m), inner.y + inner.h); ctx.stroke(); ctx.fillStyle = col.mid; ctx.beginPath(); ctx.arc(xOf(m), yOf(f.f(m)), 5, 0, 6.28); ctx.fill(); }
  // IVT indicator: the y-values f(a) and f(b) straddle 0, so a root must lie between.
  if (lo < 0 && hi > 0 && bracketsRoot(f, cur.a, cur.b)) {
    const fa = f.f(cur.a), fb = f.f(cur.b), yA = yOf(fa), yB = yOf(fb), y0 = yOf(0), stripX = inner.x + 4;
    ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.strokeStyle = ca; ctx.beginPath(); ctx.moveTo(xOf(cur.a), yA); ctx.lineTo(stripX, yA); ctx.stroke();
    ctx.strokeStyle = cb; ctx.beginPath(); ctx.moveTo(xOf(cur.b), yB); ctx.lineTo(stripX, yB); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(stripX, yA); ctx.lineTo(stripX, yB); ctx.stroke();
    ctx.fillStyle = col.root; ctx.beginPath(); ctx.arc(stripX, y0, 4, 0, 6.28); ctx.fill();
  }
  ctx.restore();
  // endpoint labels (single char, colour encodes the sign of f); hidden when the
  // endpoints have closed to within a few pixels of each other.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  if (Math.abs(xOf(cur.a) - xOf(cur.b)) > 22) { ctx.fillStyle = ca; ctx.fillText('a', xOf(cur.a), inner.y + inner.h + 4); ctx.fillStyle = cb; ctx.fillText('b', xOf(cur.b), inner.y + inner.h + 4); }
  // status.
  const ok = bracketsRoot(f, cur.a, cur.b);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillStyle = ok ? col.muted : col.neg; ctx.fillText(ok ? `step ${hist.length}:  f(a) ${f.f(cur.a) >= 0 ? '> 0' : '< 0'},  f(b) ${f.f(cur.b) >= 0 ? '> 0' : '< 0'},  width ${width(cur).toExponential(1)}` : 'no sign change: pick a, b with f(a), f(b) opposite', inner.x + 6, inner.y + 4);
  if (phase === 'hold') { ctx.fillStyle = col.root; ctx.fillText(`converged: root ${midpoint(cur).toFixed(5)}`, inner.x + 6, inner.y + 18); }
  else if (ok) { ctx.fillStyle = col.root; ctx.fillText('opposite signs: f hits 0 between a and b (IVT)', inner.x + 6, inner.y + 18); }
}

function drawDiag(col, r) {
  panel(col, r, 'Bracket width and |f(midpoint)| vs step: geometric halving on a log axis');
  const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 34 };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  const lt = 1, lb = -7; // log10 decades
  // Grow the step axis with the steps taken (capped at MAXIT) so the staircase
  // fills the panel from the first steps instead of hugging the left tenth of a
  // fixed 0..30 axis.
  const xMax = Math.max(6, Math.min(MAXIT, hist.length + 1));
  const xOf = (k) => inner.x + k / xMax * inner.w;
  const yOf = (v) => inner.y + inner.h * (lt - Math.log10(Math.max(v, 1e-8))) / (lt - lb);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let d = lb; d <= lt; d += 1) { const Y = yOf(Math.pow(10, d)); ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  const series = (key, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath(); hist.forEach((h, i) => { const X = xOf(h.k), Y = yOf(h[key]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); hist.forEach((h) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xOf(h.k), yOf(h[key]), 2.6, 0, 6.28); ctx.fill(); }); };
  series('w', col.wid); series('fm', col.fm);
  ctx.restore();
  ctx.fillStyle = col.wid; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('bracket width (halves each step)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.fm; ctx.fillText('|f(midpoint)|', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const tickEvery = xMax <= 12 ? 2 : 5; for (let k = 0; k <= xMax; k += tickEvery) ctx.fillText(`${k}`, xOf(k), inner.y + inner.h + 6); ctx.fillText('step', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function step() {
  const f = fn(); if (phase !== 'run' || !bracketsRoot(f, cur.a, cur.b)) return;
  cur = bisectStep(f, cur); hist.push({ k: hist.length + 1, m: cur.m, w: width(cur), fm: Math.abs(f.f(cur.m)) });
  if (hist.length >= MAXIT || width(cur) < 1e-7) phase = 'hold';   // hold at convergence; Reset restarts
}
function advance(dt) {
  if (phase !== 'run' || !bracketsRoot(fn(), cur.a, cur.b)) return;
  acc += dt; if (acc >= STEP_DT) { acc -= STEP_DT; step(); }
}

let last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

let drag = null;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return;
  if (Math.abs(sx - SC.xOf(st.a0)) < Math.abs(sx - SC.xOf(st.b0))) drag = 'a'; else drag = 'b'; setFrom(sx);
});
canvas.addEventListener('pointermove', (e) => { if (!drag) return; setFrom(ptr(e)[0]); });
window.addEventListener('pointerup', () => { drag = null; });
function setFrom(sx) { const x = Math.max(SC.x0, Math.min(SC.x1, SC.x0 + (sx - SC.inner.x) / SC.inner.w * (SC.x1 - SC.x0))); if (drag === 'a') st.a0 = x; else st.b0 = x; restart(); }

function boot() {
  if (params.get('fn') && FUNCS[params.get('fn')]) pickFn(params.get('fn'));
  syncVals(); relayout();
  if (DETERMINISTIC) { for (let i = 0; i < 5; i += 1) step(); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn();
  return { fields: [
    { key: 'fn', label: 'function', value: f.label, format: 'text' },
    { key: 'bracket', label: 'bracket [a, b]', value: `[${cur.a.toFixed(4)}, ${cur.b.toFixed(4)}]`, format: 'text' },
    { key: 'step', label: 'step', value: hist.length, format: 'int' },
    { key: 'width', label: 'bracket width', value: width(cur), format: 'float' },
    { key: 'mid', label: 'midpoint', value: midpoint(cur), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn(); const ok = bracketsRoot(f, cur.a, cur.b);
  const err = Math.abs(midpoint(cur) - f.root);
  return [
    { key: 'sign', label: 'the bracket holds a sign change', value: (f.f(cur.a) * f.f(cur.b) <= 0) ? 'yes' : 'no', status: ok ? 'pass' : 'pending' },
    { key: 'bound', label: 'error within half the bracket width', value: err.toExponential(1), status: err <= width(cur) / 2 + 1e-9 ? 'pass' : 'drift' },
  ];
};
