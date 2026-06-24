import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for quadtree spatial partitioning. Top region: equal hard
// disks bouncing in a box, with the live quadtree drawn over them, its cells
// subdividing wherever the disks crowd together. Bottom region: pair-checks per
// step against N, the O(N^2) all-pairs parabola versus the O(N log N) quadtree.
//
// Reference: Barnes and Hut, Nature 324 (1986); Samet, Spatial Data Structures.

import {
  createBoxState, stepBox, quadtreeCells, directChecks,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderN = document.getElementById('slider-n');
const selTree = document.getElementById('select-tree');
const toggleShowTree = document.getElementById('toggle-show-tree');
const valueN = document.getElementById('value-n');
const valueTree = document.getElementById('value-tree');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const DT = 1 / 120;
const SUBSTEPS = 2;
const SEED = 0xC0FFEE;
const RADIUS = 0.0036;       // half the old disk size: a sparser cloud the tree adapts to
let running = !DETERMINISTIC;
let state = null;
let root = null;            // last quadtree (for drawing)
let costCurve = null;       // [{N, direct, tree}] for the diagnostic

const Nbodies = () => parseInt(sliderN.value, 10);
const mode = () => (selTree.value === 'tree' ? 'tree' : 'direct');
const showTree = () => toggleShowTree.checked && mode() === 'tree';

function rebuild() {
  state = createBoxState(Nbodies(), { seed: SEED, radius: RADIUS });
  for (let k = 0; k < 12; k++) stepBox(state, DT, 'tree');   // relax overlaps
  root = null;
  buildCostCurve();
}
// Pair-checks vs N: the direct count is exact; the quadtree count is measured
// on a scratch box at each sampled N (one relaxed step), giving the real curve.
function buildCostCurve() {
  const Ns = [50, 150, 300, 500, 700, 900, 1100, 1200];
  costCurve = Ns.map((n) => {
    const sc = createBoxState(n, { seed: SEED + 7, radius: RADIUS });
    let r = { checks: 0 };
    for (let k = 0; k < 6; k++) r = stepBox(sc, DT, 'tree');
    return { N: n, direct: directChecks(n), tree: r.checks };
  });
}

function syncVals() {
  valueN.textContent = String(Nbodies());
  valueTree.textContent = selTree.value === 'tree' ? 'quadtree' : 'all pairs';
}
sliderN.addEventListener('input', () => { syncVals(); rebuild(); render(); });
selTree.addEventListener('change', () => { syncVals(); render(); });
toggleShowTree.addEventListener('change', render);
btnReset.addEventListener('click', () => {
  sliderN.value = '500'; selTree.value = 'tree'; toggleShowTree.checked = true;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); rebuild(); render();
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
    { name: 'scene', weight: 1.7 },
    { name: 'diagnostic', weight: 1.25 },
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
    tree: '#5bc0eb',
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

function fmt(v) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(Math.round(v));
}

function drawScene(col, r) {
  panel(col, r, showTree() ? 'disks colliding, with the live quadtree over them' : 'disks colliding (all-pairs, no partition)');
  const titleH = 22, stripH = 28;
  const m = Math.min(r.w - 20, r.h - titleH - 8 - stripH - 8);
  const bx = r.x + (r.w - m) / 2, by = r.y + titleH + 6;
  const X = (u) => bx + u * m, Y = (u) => by + u * m;

  ctx.save();
  clipTo(ctx, { x: bx, y: by, w: m, h: m });
  ctx.fillStyle = '#07090f'; ctx.fillRect(bx, by, m, m);

  // Live quadtree cells, shaded by depth: the deeper (smaller) a cell, the
  // brighter, so the tree visibly subdivides wherever the disks crowd and
  // rebuilds every frame as they move.
  if (showTree() && root) {
    const cells = quadtreeCells(root);
    for (const [x0, y0, x1, y1] of cells) {
      const sz = x1 - x0;
      const depth = Math.max(0, Math.min(1, Math.log2(0.5 / Math.max(sz, 1e-4)) / 6));
      ctx.strokeStyle = `rgba(${(91 + 120 * depth) | 0}, ${(192 + 20 * depth) | 0}, 235, ${0.18 + 0.55 * depth})`;
      ctx.lineWidth = 0.5 + 1.1 * depth;
      ctx.strokeRect(X(x0), Y(y0), sz * m, (y1 - y0) * m);
    }
  }

  // Disks, coloured by speed.
  const rad = Math.max(1.4, state.r * m);
  for (let i = 0; i < state.N; i += 1) {
    const sp = Math.hypot(state.v[2 * i], state.v[2 * i + 1]);
    const c = viridis(Math.min(1, sp / 0.32));
    ctx.fillStyle = `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
    ctx.beginPath(); ctx.arc(X(state.x[2 * i]), Y(state.x[2 * i + 1]), rad, 0, 6.28); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, m - 1, m - 1);

  // Readout strip.
  const checks = state.checks;
  const direct = directChecks(state.N);
  const ry = r.y + r.h - stripH / 2 + 1;
  const speedup = checks > 0 ? direct / checks : 0;
  const items = [
    [`N = ${state.N}`, col.fg],
    [mode() === 'tree' ? 'quadtree' : 'all pairs', mode() === 'tree' ? col.tree : col.direct],
    [`${fmt(checks)} checks/step`, col.accent],
    [mode() === 'tree' ? `${speedup.toFixed(0)}x fewer` : 'N(N-1)/2', col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'pair-checks per step vs N: O(N^2) all-pairs vs O(N log N) quadtree');
  const inner = { x: r.x + 52, y: r.y + 28, w: r.w - 52 - 14, h: r.h - 28 - 40 };
  const Nmax = 1200;
  const yMax = directChecks(Nmax) * 1.05;
  const xOf = (n) => inner.x + (n / Nmax) * inner.w;
  const yOf = (c) => inner.y + inner.h - (c / yMax) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0, 0.5, 1]) { const y = yOf(f * yMax); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(fmt(f * yMax), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const n of [0, 400, 800, 1200]) ctx.fillText(String(n), xOf(n), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  ctx.save(); ctx.beginPath(); ctx.rect(inner.x, inner.y, inner.w, inner.h); ctx.clip();
  ctx.strokeStyle = col.direct; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= 80; i++) { const n = Nmax * i / 80; const X = xOf(n), Yv = yOf(directChecks(n)); i ? ctx.lineTo(X, Yv) : ctx.moveTo(X, Yv); }
  ctx.stroke();
  if (costCurve) {
    ctx.strokeStyle = col.tree; ctx.lineWidth = 2.6; ctx.beginPath();
    costCurve.forEach((p, i) => { const X = xOf(p.N), Yv = yOf(p.tree); i ? ctx.lineTo(X, Yv) : ctx.moveTo(X, Yv); });
    ctx.stroke();
  }
  const cn = state.N;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOf(cn), inner.y); ctx.lineTo(xOf(cn), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  const activeC = mode() === 'tree' ? state.checks : directChecks(cn);
  ctx.fillStyle = mode() === 'tree' ? col.tree : col.direct;
  ctx.beginPath(); ctx.arc(xOf(cn), yOf(activeC), 4.5, 0, 6.28); ctx.fill();
  ctx.restore();

  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.direct; ctx.fillText('all pairs O(N^2)', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.tree; ctx.fillText('quadtree O(N log N)', inner.x + 8, inner.y + 20);

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('number of disks N', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 40, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('checks / step', 0, 0); ctx.restore();
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
    for (let k = 0; k < SUBSTEPS; k++) { const res = stepBox(state, DT, mode()); root = res.root; }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  rebuild();
  const pre = CAPTURE_NAME ? Math.round((Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 120) : 40;
  for (let k = 0; k < pre; k++) { const res = stepBox(state, DT, mode()); root = res.root; }
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
  document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!state) rebuild();
  const direct = directChecks(state.N);
  return {
    fields: [
      { key: 'n', label: 'disks $N$', value: state.N, format: 'int' },
      { key: 'method', label: 'method', value: mode() === 'tree' ? 'quadtree' : 'all pairs', format: 'text' },
      { key: 'checks', label: 'pair-checks / step', value: state.checks, format: 'int' },
      { key: 'speedup', label: 'fewer checks vs N^2', value: state.checks > 0 ? direct / state.checks : 0, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    if (!costCurve) buildCostCurve();
    const big = costCurve[costCurve.length - 1];
    const ratio = big.tree > 0 ? big.direct / big.tree : 0;
    return [{
      key: 'speedup',
      label: 'quadtree does far fewer checks than N^2 at large N',
      value: `${ratio.toFixed(0)}x at N=${big.N}`,
      status: ratio > 3 ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
