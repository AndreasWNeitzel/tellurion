// Uniform vs pointwise convergence. The scene sweeps the degree n and draws f_n
// with its pointwise limit and the sup-norm gap; a draggable point shows f_n(x0)
// settling pointwise. The diagnostic plots the sup-norm against n: it vanishes for
// uniform convergence and stays away from zero (or grows) otherwise. Canvas2D.
//
// Reference: Rudin, Principles of Mathematical Analysis, 3rd ed., Sec. 7.1-7.2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { FUNCS, supNorm } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const btnFn = document.getElementById('btn-fn'), vFn = document.getElementById('value-fn');
const sN = document.getElementById('s-n'), vN = document.getElementById('v-n');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(FUNCS);
const st = { fn: 'power', nmax: 30, x0: 0.5 };
let nShown = 1, supCache = null, supKey = '';
function fn() { return FUNCS[st.fn]; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.3 }, { name: 'diag', weight: 0.92 }]); }
function syncVals() { vFn.textContent = fn().label; sN.value = st.nmax; vN.textContent = `${st.nmax}`; }
function pickFn(k) { st.fn = k; const d = FUNCS[k].dom; st.x0 = (d[0] + d[1]) * 0.4; nShown = 1; supCache = null; syncVals(); }
btnFn.addEventListener('click', () => { pickFn(KEYS[(KEYS.indexOf(st.fn) + 1) % KEYS.length]); });
btnReset.addEventListener('click', () => { st.nmax = 30; pickFn('power'); });
sN.addEventListener('input', () => { st.nmax = +sN.value; if (nShown > st.nmax) nShown = 1; supCache = null; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', axis: 'rgba(255,255,255,0.3)', fn: '#4ea8ff', limit: '#ffd166', gap: '#ff5d5d', x0: '#b487ff', sup: '#8de08a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function buildSupCache() {
  const key = `${st.fn}|${st.nmax}`; if (key === supKey && supCache) return; supKey = key;
  supCache = []; for (let n = 1; n <= st.nmax; n += 1) supCache.push(supNorm(st.fn, n).sup);
}

let SC = null;
function drawScene(col, r) {
  const f = fn(); const n = nShown;
  panel(col, r, `Function sequence f_n (sweeping n), with its pointwise limit and the sup-norm gap`);
  const [x0d, x1d] = f.dom, [ylo, yhi] = f.yr;
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 30 };
  const xOf = (x) => inner.x + (x - x0d) / (x1d - x0d) * inner.w;
  const yOf = (y) => inner.y + inner.h * (yhi - y) / (yhi - ylo);
  SC = { inner, x0d, x1d, xOf };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  if (ylo < 0 && yhi > 0) { ctx.strokeStyle = col.axis; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke(); }
  // pointwise limit.
  ctx.strokeStyle = col.limit; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 400; i += 1) { const x = x0d + (x1d - x0d) * i / 400; const y = f.flim(x); const Y = yOf(y); if (pen) ctx.lineTo(xOf(x), Y); else { ctx.moveTo(xOf(x), Y); pen = true; } } ctx.stroke(); ctx.setLineDash([]);
  // f_n.
  ctx.strokeStyle = col.fn; ctx.lineWidth = 2.8; ctx.beginPath();
  for (let i = 0; i <= 500; i += 1) { const x = x0d + (x1d - x0d) * i / 500; const Y = yOf(f.fn(x, n)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  // sup-norm gap (vertical red segment at the argmax).
  const sn = supNorm(st.fn, n); const gx = sn.x;
  ctx.strokeStyle = col.gap; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(xOf(gx), yOf(f.flim(gx))); ctx.lineTo(xOf(gx), yOf(f.fn(gx, n))); ctx.stroke();
  ctx.fillStyle = col.gap; ctx.beginPath(); ctx.arc(xOf(gx), yOf(f.fn(gx, n)), 3.5, 0, 6.28); ctx.fill();
  // pointwise probe x0.
  ctx.strokeStyle = col.x0; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.x0), inner.y); ctx.lineTo(xOf(st.x0), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.fn; ctx.beginPath(); ctx.arc(xOf(st.x0), yOf(f.fn(st.x0, n)), 4, 0, 6.28); ctx.fill();
  ctx.fillStyle = col.limit; ctx.beginPath(); ctx.arc(xOf(st.x0), yOf(f.flim(st.x0)), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.fn; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`f_n  (n = ${n.toFixed(1)})`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.limit; ctx.fillText('pointwise limit f', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.gap; ctx.fillText('sup-norm gap', inner.x + 6, inner.y + 32);
  ctx.fillStyle = col.x0; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('x0 (drag)', xOf(st.x0), inner.y + inner.h + 4);
  ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.fillText(`${x1d}`, inner.x + inner.w - 2, inner.y + inner.h + 4); ctx.textAlign = 'left'; ctx.fillText(`${x0d}`, inner.x + 2, inner.y + inner.h + 4);
}

function drawDiag(col, r) {
  const f = fn();
  panel(col, r, 'Sup-norm ||f_n - f|| vs n: vanishes for uniform convergence, stays away otherwise');
  buildSupCache();
  const inner = { x: r.x + 52, y: r.y + 28, w: r.w - 52 - 16, h: r.h - 28 - 34 };
  let top = 0; for (const v of supCache) top = Math.max(top, v); top = Math.max(top, 0.2) * 1.12;
  const xOf = (n) => inner.x + (n - 1) / Math.max(1, st.nmax - 1) * inner.w;
  const yOf = (v) => inner.y + inner.h * (1 - v / top);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // zero line (the uniform target).
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); clipTo(ctx, inner);
  ctx.strokeStyle = col.sup; ctx.lineWidth = 2.6; ctx.beginPath(); supCache.forEach((v, i) => { const X = xOf(i + 1), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  supCache.forEach((v, i) => { ctx.fillStyle = col.sup; ctx.beginPath(); ctx.arc(xOf(i + 1), yOf(v), 2.4, 0, 6.28); ctx.fill(); });
  // current swept n marker.
  const ni = Math.min(st.nmax, Math.max(1, Math.round(nShown))); ctx.fillStyle = col.fn; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(xOf(ni), yOf(supCache[ni - 1]), 5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  // verdict.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = f.uniform ? col.sup : col.gap; ctx.fillText(f.uniform ? 'uniform: sup-norm -> 0' : 'pointwise only: sup-norm does NOT vanish', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.fillText(`(${f.note})`, inner.x + 6, inner.y + 18);
  // axis labels.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let n = 1; n <= st.nmax; n += Math.max(1, Math.round(st.nmax / 6))) ctx.fillText(`${n}`, xOf(n), inner.y + inner.h + 6);
  ctx.fillText('degree n', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(top.toFixed(2), inner.x - 4, inner.y + 6); ctx.fillText('0', inner.x - 4, inner.y + inner.h - 6);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col.muted; ctx.fillText('sup-norm', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let running = true, last = 0;
function advance(dt) { nShown += dt * Math.max(2, st.nmax / 6); if (nShown > st.nmax + 2) nShown = 1; }
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); if (nShown > st.nmax) nShown = st.nmax; render(); requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return; drag = true; setFrom(sx); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; setFrom(ptr(e)[0]); });
window.addEventListener('pointerup', () => { drag = false; });
function setFrom(sx) { st.x0 = Math.max(SC.x0d, Math.min(SC.x1d, SC.x0d + (sx - SC.inner.x) / SC.inner.w * (SC.x1d - SC.x0d))); render(); }

function boot() {
  if (params.get('fn') && FUNCS[params.get('fn')]) pickFn(params.get('fn'));
  syncVals(); relayout();
  if (DETERMINISTIC) { nShown = Math.min(st.nmax, 16); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn(); const n = Math.round(nShown); const sn = supNorm(st.fn, n);
  return { fields: [
    { key: 'fn', label: 'sequence', value: f.label, format: 'text' },
    { key: 'n', label: 'degree n', value: n, format: 'int' },
    { key: 'sup', label: 'sup-norm ||f_n - f||', value: sn.sup, format: 'float' },
    { key: 'x0', label: 'probe x0', value: st.x0, format: 'float' },
    { key: 'fx0', label: 'f_n(x0)', value: f.fn(st.x0, n), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn(); const sFar = supNorm(st.fn, Math.max(st.nmax, 40)).sup;
  const ptErr = Math.abs(f.fn(st.x0, Math.max(st.nmax, 200)) - f.flim(st.x0));
  return [
    { key: 'point', label: 'converges pointwise (f_n(x0) -> f)', value: ptErr.toExponential(1), status: ptErr < 0.05 ? 'pass' : 'pending' },
    { key: 'unif', label: f.uniform ? 'uniform: sup-norm -> 0' : 'not uniform: sup-norm stays', value: sFar.toFixed(2), status: f.uniform ? (sFar < 0.1 ? 'pass' : 'pending') : (sFar > 0.3 ? 'pass' : 'pending') },
  ];
};
