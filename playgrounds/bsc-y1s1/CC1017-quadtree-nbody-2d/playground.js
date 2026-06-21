import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the Barnes-Hut quadtree N-body. Top region: a gravity
// disk orbiting a heavy core, with the live adaptive quadtree drawn over it.
// Bottom region: force-pair evaluations per step versus N, Barnes-Hut (about
// N log N) against the brute-force direct sum (N^2).
//
// Reference: Barnes and Hut, Nature 324, 446 (1986); Springel 2005 (GADGET-2).

import {
  makeDisk, buildTree, accBH, accDirect, leapfrog, snapshotTree,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderN = document.getElementById('slider-n');
const sliderTheta = document.getElementById('slider-theta');
const selTree = document.getElementById('select-tree');
const valueN = document.getElementById('value-n');
const valueTheta = document.getElementById('value-theta');
const valueTree = document.getElementById('value-tree');
const toggleTree = document.getElementById('toggle-show-tree');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const G = 1, EPS = 0.03, DT = 0.003, SUBSTEPS = 3, SEED = 0xC0FFEE;
let running = !DETERMINISTIC;
let state = null;
let cost = null;
let aScratch = null;

function rebuild() {
  const N = parseInt(sliderN.value, 10);
  state = makeDisk(N, { seed: SEED });
  accBH(state, theta(), G, EPS);     // initialise accelerations + tree
  aScratch = new Float64Array(2 * N);
}
function theta() { return parseFloat(sliderTheta.value); }
function useTree() { return selTree.value === 'tree'; }

function costCurve(th) {
  const Ns = [50, 100, 200, 400, 600, 800, 1000, 1200];
  const out = [];
  for (const n of Ns) {
    const st = makeDisk(n, { seed: SEED });
    const r = accBH(st, th, G, EPS);
    out.push({ n, bh: Math.max(1, r.evals), direct: n * (n - 1) });
  }
  return out;
}

function syncVals() {
  valueN.textContent = String(parseInt(sliderN.value, 10));
  valueTheta.textContent = parseFloat(sliderTheta.value).toFixed(2);
  valueTree.textContent = selTree.value;
}
sliderN.addEventListener('input', () => { syncVals(); rebuild(); render(); });
sliderTheta.addEventListener('input', () => { syncVals(); cost = costCurve(theta()); render(); });
selTree.addEventListener('change', () => { syncVals(); render(); });
toggleTree.addEventListener('change', render);
btnReset.addEventListener('click', () => {
  rebuild(); running = true; btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false'); render();
});
btnPause.addEventListener('click', () => {
  running = !running;
  btnPause.textContent = running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.9 },
    { name: 'diagnostic', weight: 1.15 },
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
    tree: 'rgba(200,170,120,0.20)',
    core: '#ffd166',
    bh: '#67d98c',
    direct: '#ef476f',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
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
  panel(col, r, 'A gravity disk, binned by an adaptive quadtree');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x + 6, y: r.y + titleH + 4, w: r.w - 12, h: r.h - titleH - 4 - stripH - 4 };
  const VIEW = 1.4;
  const side = Math.min(draw.w, draw.h);
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const scale = side / (2 * VIEW);
  const SX = (x) => cx + x * scale;
  const SY = (y) => cy - y * scale;

  ctx.save();
  clipTo(ctx, draw);

  // Quadtree boxes (rebuilt for the current positions).
  if (toggleTree.checked) {
    const nN = buildTree(state.x, state.m, state.N);
    const tr = snapshotTree();
    ctx.strokeStyle = col.tree;
    ctx.lineWidth = 1;
    for (let k = 0; k < nN; k++) {
      if (tr.nBody[k] === -2) continue;
      const w = 2 * tr.nHalf[k] * scale;
      if (w < 3) continue;             // skip tiny deep cells (clutter + cost)
      ctx.strokeRect(SX(tr.nHx[k] - tr.nHalf[k]), SY(tr.nHy[k] + tr.nHalf[k]), w, w);
    }
  }

  // Bodies, colored by speed.
  const { x, v, N } = state;
  for (let i = 1; i < N; i++) {
    const sp = Math.hypot(v[2 * i], v[2 * i + 1]);
    const c = viridis(Math.min(1, sp / 6));
    ctx.fillStyle = `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
    ctx.fillRect(SX(x[2 * i]) - 1, SY(x[2 * i + 1]) - 1, 2.2, 2.2);
  }
  // Heavy core.
  ctx.fillStyle = col.core;
  ctx.beginPath(); ctx.arc(SX(x[0]), SY(x[1]), 5, 0, 2 * Math.PI); ctx.fill();

  ctx.restore();

  // Readout strip.
  const directEv = state.N * (state.N - 1);
  const bhEv = state.evals || 1;
  const speedup = directEv / bhEv;
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [`N = ${state.N}`, col.fg],
    [useTree() ? 'Barnes-Hut' : 'direct N²', useTree() ? col.bh : col.direct],
    [`evals = ${fmt(useTree() ? bhEv : directEv)}`, useTree() ? col.bh : col.direct],
    [`speedup ${speedup.toFixed(0)}×`, col.accent],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function fmt(v) {
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'k';
  return String(Math.round(v));
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Force-pair evaluations vs N: N log N vs N²');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 14, h: r.h - 28 - 40 };
  if (!cost) cost = costCurve(theta());
  const xLo = Math.log10(50), xHi = Math.log10(1200);
  const yLo = 1, yHi = Math.log10(1200 * 1199) + 0.2;   // log10 of evals
  const xOf = (n) => inner.x + (Math.log10(n) - xLo) / (xHi - xLo) * inner.w;
  const yOf = (e) => inner.y + inner.h - (Math.log10(Math.max(1, e)) - yLo) / (yHi - yLo) * inner.h;

  // grid + ticks (decades on y, a few N on x).
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = 2; e <= 6; e += 1) {
    const y = yOf(Math.pow(10, e));
    ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke();
    ctx.fillText(`1e${e}`, inner.x - 5, y);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const n of [50, 200, 600, 1200]) ctx.fillText(String(n), xOf(n), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // direct N^2 and BH curves.
  const curve = (key, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.beginPath();
    cost.forEach((p, i) => { const X = xOf(p.n), Y = yOf(p[key]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
    cost.forEach((p) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xOf(p.n), yOf(p[key]), 2.5, 0, 2 * Math.PI); ctx.fill(); });
  };
  curve('direct', col.direct);
  curve('bh', col.bh);

  // current N cursor.
  const cxN = xOf(state.N);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cxN, inner.y); ctx.lineTo(cxN, inner.y + inner.h); ctx.stroke(); ctx.restore();

  // legend.
  const legend = [['direct N²', col.direct], ['Barnes-Hut', col.bh]];
  ctx.fillStyle = 'rgba(10,12,18,0.72)'; ctx.fillRect(inner.x + 6, inner.y + 6, 168, 18);
  let lx = inner.x + 12; const ly = inner.y + 15;
  ctx.font = fontString(canvas, 'legend', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of legend) {
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke();
    ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 17, ly); lx += ctx.measureText(lab).width + 28;
  }

  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('number of bodies N', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('evals / step', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!state) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    for (let k = 0; k < SUBSTEPS; k++) leapfrog(state, DT, { use_tree: useTree(), theta: theta(), G, eps: EPS });
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  rebuild();
  cost = costCurve(theta());
  const steps = CAPTURE_NAME ? Math.round((Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 200) : 120;
  for (let k = 0; k < steps; k++) leapfrog(state, DT, { use_tree: true, theta: theta(), G, eps: EPS });
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
  const directEv = state.N * (state.N - 1);
  const bhEv = state.evals || 1;
  return {
    fields: [
      { key: 'N', label: 'bodies $N$', value: state.N, format: 'int' },
      { key: 'evals', label: 'BH evals/step', value: bhEv, format: 'int' },
      { key: 'direct', label: 'direct $N^2$', value: directEv, format: 'int' },
      { key: 'speedup', label: 'speedup', value: directEv / bhEv, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    if (!state) return [];
    // Barnes-Hut accuracy: relative L2 error of the tree forces against the
    // exact direct sum. This is exactly what the opening angle theta trades
    // for speed, so it is the meaningful check (energy drift would conflate
    // the integrator with the force approximation).
    const N = state.N;
    accDirect(state, G, EPS);
    for (let i = 0; i < 2 * N; i++) aScratch[i] = state.a[i];   // exact
    accBH(state, theta(), G, EPS);                              // approximate
    let num = 0, den = 0;
    for (let i = 0; i < 2 * N; i++) { const d = state.a[i] - aScratch[i]; num += d * d; den += aScratch[i] * aScratch[i]; }
    const err = Math.sqrt(num / Math.max(1e-30, den));
    return [{
      key: 'bherr',
      label: 'tree force error vs exact (rel. L2)',
      value: err.toExponential(2),
      status: err < 0.05 ? 'pass' : (err < 0.15 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
