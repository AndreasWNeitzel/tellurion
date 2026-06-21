import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for empirical Big-O. Top region: a real sort running on a
// shuffled bar array, comparisons highlighted and counted live. Bottom region:
// measured comparison counts versus N on log-log axes, the quadratic sorts on
// the N^2 line and merge sort on N log N.
//
// Reference: Cormen et al., Introduction to Algorithms, 3rd ed., Ch. 2;
// Newman, Computational Physics, Ch. 2.

import {
  shuffledArray, recordSort, comparisonCount, EV_CMP, EV_SWAP, EV_SET,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderN = document.getElementById('slider-N');
const sliderSpeed = document.getElementById('slider-speed');
const selAlgo = document.getElementById('select-algo');
const valueN = document.getElementById('value-N');
const valueSpeed = document.getElementById('value-speed');
const valueAlgo = document.getElementById('value-algo');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const KINDS = ['bubble', 'insertion', 'merge'];
const SCAT_N = [8, 16, 32, 64, 128, 256];
const BASE_SEED = 0xC0FFEE;
let running = !DETERMINISTIC;
let runCount = 0;
let run = null;            // {events, comparisons, disp, idx, comps, hi, hj, elapsed, done}
let holdT = 0;
let evAccum = 0;           // fractional events carried between frames
let scatter = null;       // { bubble:[{n,c}], insertion:[...], merge:[...] }

// Events replayed per second at each speed setting. The rate is fixed per
// step, not per whole sort, so an N^2 sort visibly takes far longer than an
// N log N sort on the same array: that contrast is the entire lesson. Speed 1
// crawls (a few comparisons a second, watchable one by one); speed 8 clears a
// large quadratic sort in a few seconds.
function eventsPerSec() {
  return 4 * Math.pow(2.34, parseInt(sliderSpeed.value, 10) - 1);
}

function kind() { return selAlgo.value; }
function N() { return parseInt(sliderN.value, 10); }

function startRun() {
  const n = N();
  const arr = shuffledArray(n, BASE_SEED + runCount);
  const rec = recordSort(kind(), arr);
  run = {
    events: rec.events, comparisons: rec.comparisons,
    disp: Array.from(arr), idx: 0, comps: 0, hi: -1, hj: -1, done: false,
    elapsed: 0,
  };
  holdT = 0;
  evAccum = 0;
}
function buildScatter() {
  scatter = {};
  for (const k of KINDS) scatter[k] = SCAT_N.map((n) => ({ n, c: Math.max(1, comparisonCount(k, n, BASE_SEED)) }));
}

function syncVals() {
  valueN.textContent = String(N());
  valueSpeed.textContent = String(parseInt(sliderSpeed.value, 10));
  valueAlgo.textContent = kind();
}
sliderN.addEventListener('input', () => { syncVals(); startRun(); render(); });
selAlgo.addEventListener('change', () => { syncVals(); startRun(); render(); });
sliderSpeed.addEventListener('input', syncVals);
btnReset.addEventListener('click', () => {
  sliderN.value = '48'; selAlgo.value = 'bubble'; runCount = 0;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); startRun(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.6 },
    { name: 'diagnostic', weight: 1.4 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    bubble: '#ef476f',
    insertion: '#ff9d6e',
    merge: '#67d98c',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}
function kcol(col, k) { return k === 'merge' ? col.merge : (k === 'insertion' ? col.insertion : col.bubble); }

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
  panel(col, r, `${kind()} sort: every comparison counted`);

  const titleH = 22, stripH = 28;
  const draw = { x: r.x + 10, y: r.y + titleH + 8, w: r.w - 20, h: r.h - titleH - 8 - stripH - 6 };
  const n = run.disp.length;
  const bw = draw.w / n;
  const maxV = n;

  ctx.save();
  clipTo(ctx, draw);
  for (let i = 0; i < n; i++) {
    const v = run.disp[i];
    const h = (v / maxV) * (draw.h - 4);
    const x = draw.x + i * bw;
    const c = viridis(v / maxV);
    const hot = (i === run.hi || i === run.hj);
    ctx.fillStyle = hot ? '#ffffff' : `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
    ctx.fillRect(x + 0.5, draw.y + draw.h - h, Math.max(1, bw - 1), h);
  }
  ctx.restore();

  // Live cost: comparison count and elapsed time, side by side, so the
  // viewer sees both the operation count climb and the wall-clock cost of
  // those operations grow. A faint backing keeps them legible over the bars.
  const label = `${run.comps.toLocaleString()} comparisons`;
  ctx.font = fontString(canvas, 'heading', 'mono', 700);
  const lw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(10,12,18,0.55)';
  ctx.fillRect(draw.x + 2, draw.y + 2, Math.max(lw + 16, 132), 52);
  ctx.fillStyle = col.accent;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(label, draw.x + 8, draw.y + 6);
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText(`t = ${run.elapsed.toFixed(1)} s`, draw.x + 8, draw.y + 32);
  if (run.done) {
    ctx.fillStyle = col.merge;
    ctx.font = fontString(canvas, 'caption', 'mono', 700);
    ctx.textAlign = 'right';
    ctx.fillText(`sorted in ${run.elapsed.toFixed(1)} s`, draw.x + draw.w - 4, draw.y + 6);
  }

  // Readout strip.
  const ry = r.y + r.h - stripH / 2 + 1;
  const cls = kind() === 'merge' ? 'N log N' : 'N²';
  const items = [
    [`${kind()}`, kcol(col, kind())],
    [`N = ${n}`, col.fg],
    [`compares ${run.comps}`, col.accent],
    [`class ${cls}`, kcol(col, kind())],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Comparisons vs N (log-log): slope is the exponent');

  const inner = { x: r.x + 48, y: r.y + 28, w: r.w - 48 - 14, h: r.h - 28 - 40 };
  const xLo = Math.log10(8), xHi = Math.log10(256);
  const yLo = Math.log10(2), yHi = Math.log10(256 * 256 / 2) + 0.3;
  const xOf = (n) => inner.x + (Math.log10(n) - xLo) / (xHi - xLo) * inner.w;
  const yOf = (c) => inner.y + inner.h - (Math.log10(Math.max(1, c)) - yLo) / (yHi - yLo) * inner.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = 1; e <= 4; e++) { const y = yOf(Math.pow(10, e)); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(`1e${e}`, inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const n of [8, 32, 128, 256]) ctx.fillText(String(n), xOf(n), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // measured series.
  for (const k of KINDS) {
    const pts = scatter[k];
    const sel = k === kind();
    ctx.strokeStyle = kcol(col, k);
    ctx.globalAlpha = sel ? 1 : 0.5;
    ctx.lineWidth = sel ? 2.8 : 1.6;
    ctx.beginPath();
    pts.forEach((p, i) => { const X = xOf(p.n), Y = yOf(p.c); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (const p of pts) { ctx.fillStyle = kcol(col, k); ctx.beginPath(); ctx.arc(xOf(p.n), yOf(p.c), sel ? 3 : 2, 0, 2 * Math.PI); ctx.fill(); }
  }

  // current N cursor.
  const cxN = xOf(Math.min(256, Math.max(8, N())));
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cxN, inner.y); ctx.lineTo(cxN, inner.y + inner.h); ctx.stroke(); ctx.restore();

  // legend.
  const legend = [['bubble N²', col.bubble], ['insertion N²', col.insertion], ['merge NlogN', col.merge]];
  ctx.fillStyle = 'rgba(10,12,18,0.75)'; ctx.fillRect(inner.x + 6, inner.y + 6, 142, 46);
  let ly = inner.y + 15;
  ctx.font = fontString(canvas, 'legend', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of legend) {
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(inner.x + 12, ly); ctx.lineTo(inner.x + 26, ly); ctx.stroke();
    ctx.fillStyle = col.fg; ctx.fillText(lab, inner.x + 30, ly); ly += 15;
  }

  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('array size N', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 36, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('comparisons', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!run) startRun();
  if (!scatter) buildScatter();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function stepRun(perFrame) {
  const ev = run.events;
  for (let s = 0; s < perFrame && run.idx < ev.length; s++) {
    const e = ev[run.idx++];
    if (e[0] === EV_CMP) { run.hi = e[1]; run.hj = e[2]; run.comps += 1; }
    else if (e[0] === EV_SWAP) { const t = run.disp[e[1]]; run.disp[e[1]] = run.disp[e[2]]; run.disp[e[2]] = t; }
    else if (e[0] === EV_SET) { run.disp[e[1]] = e[2]; }
  }
  if (run.idx >= ev.length) { run.done = true; run.hi = run.hj = -1; }
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    if (!run.done) {
      run.elapsed += dt;
      evAccum += eventsPerSec() * dt;
      const steps = Math.floor(evAccum);
      if (steps > 0) { evAccum -= steps; stepRun(steps); }
    } else {
      holdT += dt;
      if (holdT > 1.6) { runCount += 1; startRun(); }
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  buildScatter();
  startRun();
  // Capture frames want a populated mid-sort; the live page starts fresh so
  // the comparison count and the elapsed clock both run from zero.
  if (CAPTURE_NAME) { stepRun(Math.round((Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * run.events.length)); }
  relayout();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'algo', label: 'algorithm', value: kind(), format: 'text' },
      { key: 'N', label: 'array size $N$', value: N(), format: 'int' },
      { key: 'comps', label: 'comparisons so far', value: run ? run.comps : 0, format: 'int' },
      { key: 'total', label: 'total comparisons', value: run ? run.comparisons : 0, format: 'int' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    if (!scatter) buildScatter();
    // The quadratic sorts must grow steeper than merge: the exponent
    // (slope on log-log between the two endpoints) should be near 2 for
    // bubble/insertion and near 1 for merge.
    const slope = (k) => {
      const p = scatter[k];
      const a = p[0], b = p[p.length - 1];
      return (Math.log(b.c) - Math.log(a.c)) / (Math.log(b.n) - Math.log(a.n));
    };
    const sBubble = slope('bubble'), sMerge = slope('merge');
    const ok = sBubble > 1.7 && sMerge < 1.4 && sBubble > sMerge;
    return [{
      key: 'scaling',
      label: 'N² grows steeper than N log N',
      value: `${sBubble.toFixed(2)} vs ${sMerge.toFixed(2)}`,
      status: ok ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
