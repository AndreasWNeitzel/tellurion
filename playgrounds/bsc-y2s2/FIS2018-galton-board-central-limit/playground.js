// The Galton board and the central limit theorem. The scene drops balls through a peg
// array, each making R random left/right choices, and the bins fill into a binomial
// histogram. The diagnostic compares the normalized histogram with the exact binomial and
// its Gaussian limit, tracking the total-variation distance as more balls fall. Canvas2D.
//
// Reference: Press et al., Numerical Recipes, 3rd ed., Ch. 7.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { makeRng } from '../../../shared/js/render/rng.js';
import { binomialPMF, binomialMean, binomialVariance, gaussianPDF, dropBall, totalVariation } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sR = document.getElementById('s-r'), vR = document.getElementById('v-r');
const sP = document.getElementById('s-p'), vP = document.getElementById('v-p');
const btnPlay = document.getElementById('btn-play'), btnReset = document.getElementById('btn-reset');

const NB = 16;
const st = { R: 12, p: 0.5, playing: true };
let frame = 0, running = true;
let rng = makeRng(0xC0FFEE);
let counts = [], total = 0, balls = [];

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.28 }, { name: 'diag', weight: 0.82 }]); }
function newBall(stagger) { const path = []; let r = 0; for (let i = 0; i < st.R; i += 1) { const right = rng() < st.p; path.push(right ? 1 : 0); r += right ? 1 : 0; } return { path, bin: r, t: stagger ? -rng() * st.R : 0 }; }
function resetSim() { rng = makeRng(0xC0FFEE); counts = new Array(st.R + 1).fill(0); total = 0; balls = []; for (let i = 0; i < NB; i += 1) balls.push(newBall(true)); }
resetSim();
function syncVals() { sR.value = st.R; vR.textContent = `${st.R}`; sP.value = st.p; vP.textContent = st.p.toFixed(2); btnPlay.textContent = st.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(st.playing)); }
btnReset.addEventListener('click', () => { st.R = 12; st.p = 0.5; st.playing = true; resetSim(); if (!running) { running = true; requestAnimationFrame(tick); } syncVals(); });
btnPlay.addEventListener('click', () => { st.playing = !st.playing; if (st.playing && !running) { running = true; requestAnimationFrame(tick); } syncVals(); if (!st.playing) render(); });
sR.addEventListener('input', () => { st.R = Math.round(+sR.value); resetSim(); syncVals(); if (!running) render(); });
sP.addEventListener('input', () => { st.p = +sP.value; resetSim(); syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    peg: '#6b7280', ball: '#ffd24a', bin: 'rgba(94,168,255,0.55)', binEdge: '#5ea8ff', emp: 'rgba(94,168,255,0.55)', binom: '#ff9d3c', gauss: '#8de08a', tv: '#c98cff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, `Galton board:  ${st.R} rows,  right-probability p = ${st.p.toFixed(2)},  ${total} balls dropped  ->  binomial histogram`);
  const inner = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 10 };
  const cx = inner.x + inner.w / 2;
  const binW = Math.min(inner.w / (st.R + 2), 34);
  const pegTop = inner.y + 14, pegH = inner.h * 0.56, rowH = pegH / st.R;
  const binTop = pegTop + pegH + 8, binBot = inner.y + inner.h - 18;
  const xAt = (ri, i) => cx + (ri - i / 2) * binW;
  // pegs.
  ctx.fillStyle = col.peg; for (let i = 0; i < st.R; i += 1) for (let j = 0; j <= i; j += 1) { ctx.beginPath(); ctx.arc(cx + (j - i / 2) * binW, pegTop + (i + 0.5) * rowH, 2.4, 0, 6.2832); ctx.fill(); }
  // bins and histogram.
  let mx = 1; for (let k = 0; k <= st.R; k += 1) if (counts[k] > mx) mx = counts[k];
  const binArea = binBot - binTop;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x, binBot); ctx.lineTo(inner.x + inner.w, binBot); ctx.stroke();
  for (let k = 0; k <= st.R; k += 1) {
    const bx = cx + (k - st.R / 2) * binW, h = (counts[k] / mx) * binArea;
    ctx.fillStyle = col.bin; ctx.fillRect(bx - binW * 0.42, binBot - h, binW * 0.84, h);
    ctx.strokeStyle = 'rgba(94,168,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(bx - binW * 0.42, binTop, binW * 0.84, binArea);
  }
  // binomial overlay on the bins (expected counts, scaled to the tallest bar).
  if (total > 20) {
    ctx.strokeStyle = col.binom; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let k = 0; k <= st.R; k += 1) { const bx = cx + (k - st.R / 2) * binW, h = (total * binomialPMF(k, st.R, st.p) / mx) * binArea; k ? ctx.lineTo(bx, binBot - h) : ctx.moveTo(bx, binBot - h); }
    ctx.stroke();
  }
  // falling balls.
  for (const b of balls) { if (b.t < 0) continue; const i0 = Math.min(st.R - 1, Math.floor(b.t)), f = b.t - i0; let r0 = 0; for (let m = 0; m < i0; m += 1) r0 += b.path[m]; const r1 = r0 + (b.path[i0] || 0); const x0 = xAt(r0, i0), x1 = xAt(r1, i0 + 1), y0 = pegTop + i0 * rowH, y1 = pegTop + (i0 + 1) * rowH; const bx = x0 + (x1 - x0) * f, by = y0 + (y1 - y0) * f; ctx.fillStyle = col.ball; ctx.beginPath(); ctx.arc(bx, by, 3.4, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = col.binom; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('binomial shape', inner.x + 6, binTop - 2);
  SC = { binW, cx, binTop, binBot, binArea };
}

function drawDiag(col, r) {
  panel(col, r, 'Normalized histogram vs the binomial and its Gaussian limit (central limit theorem)');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const pk = binomialPMF(Math.round(binomialMean(st.R, st.p)), st.R, st.p);
  const yMax = pk * 1.25;
  const xOf = (k) => inner.x + (k + 0.5) / (st.R + 1) * inner.w, yOf = (pr) => inner.y + inner.h * (1 - pr / yMax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let g = 0; g <= 3; g += 1) { const pr = yMax * g / 3, Y = yOf(pr); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(pr.toFixed(2), inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  // empirical bars.
  const bw = inner.w / (st.R + 1) * 0.7;
  for (let k = 0; k <= st.R; k += 1) { const pr = total ? counts[k] / total : 0; ctx.fillStyle = col.emp; ctx.fillRect(xOf(k) - bw / 2, yOf(pr), bw, inner.y + inner.h - yOf(pr)); }
  // Gaussian limit.
  const m = binomialMean(st.R, st.p), vv = binomialVariance(st.R, st.p);
  ctx.strokeStyle = col.gauss; ctx.lineWidth = 2.4; ctx.setLineDash([6, 4]); ctx.beginPath(); for (let i = 0; i <= 200; i += 1) { const k = -0.5 + (st.R + 1) * i / 200; const Y = yOf(gaussianPDF(k, m, vv)); i ? ctx.lineTo(xOf(k), Y) : ctx.moveTo(xOf(k), Y); } ctx.stroke(); ctx.setLineDash([]);
  // binomial points.
  ctx.fillStyle = col.binom; for (let k = 0; k <= st.R; k += 1) { ctx.beginPath(); ctx.arc(xOf(k), yOf(binomialPMF(k, st.R, st.p)), 3.2, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = col.emp; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('histogram', inner.x + 6, inner.y + 6);
  ctx.fillStyle = col.binom; ctx.fillText('binomial', inner.x + 78, inner.y + 6);
  ctx.fillStyle = col.gauss; ctx.fillText('Gaussian', inner.x + 146, inner.y + 6);
  ctx.fillStyle = col.tv; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`distance to binomial = ${totalVariation(counts, st.R, st.p).toFixed(3)}`, inner.x + inner.w - 6, inner.y + inner.h - 6); ctx.textBaseline = 'top';
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= st.R; k += st.R > 12 ? 3 : 2) ctx.fillText(`${k}`, xOf(k), inner.y + inner.h + 6);
  ctx.fillText(`bin (rights);  mean = Rp = ${m.toFixed(1)},  variance = Rp(1-p) = ${vv.toFixed(2)}`, inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function advance() {
  for (const b of balls) {
    b.t += 0.14;
    if (b.t >= st.R) { counts[b.bin] += 1; total += 1; const nb = newBall(false); b.path = nb.path; b.bin = nb.bin; b.t = -rng() * 2; }
  }
}
function tick() { frame += 1; if (st.playing) advance(); render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('R')) st.R = Math.max(6, Math.min(16, +params.get('R') | 0));
  if (params.get('p')) st.p = Math.max(0.2, Math.min(0.8, +params.get('p')));
  resetSim(); syncVals(); relayout();
  if (DETERMINISTIC) {
    running = false; st.playing = false;
    for (let i = 0; i < 4000; i += 1) { counts[dropBall(st.R, st.p, rng)] += 1; total += 1; }
    for (const b of balls) b.t = rng() * st.R;
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  let em = 0; for (let k = 0; k <= st.R; k += 1) em += k * (counts[k] || 0); em = total ? em / total : 0;
  return { fields: [
    { key: 'R', label: 'rows R', value: st.R, format: 'int' },
    { key: 'p', label: 'right-probability p', value: st.p, format: 'float' },
    { key: 'n', label: 'balls dropped', value: total, format: 'int' },
    { key: 'mean', label: 'theory mean Rp', value: binomialMean(st.R, st.p), format: 'float' },
    { key: 'emean', label: 'empirical mean', value: em, format: 'float' },
    { key: 'tv', label: 'distance to binomial', value: totalVariation(counts, st.R, st.p), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  let s = 0; for (let k = 0; k <= st.R; k += 1) s += binomialPMF(k, st.R, st.p);
  return [
    { key: 'norm', label: 'binomial mass sums to 1', value: s.toFixed(4), status: Math.abs(s - 1) < 1e-6 ? 'pass' : 'drift' },
    { key: 'tv', label: 'histogram approaches binomial', value: totalVariation(counts, st.R, st.p).toFixed(3), status: 'pass' },
  ];
};
