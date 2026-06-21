import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for an interactive 2D Laplace solver, Canvas2D only.
// Top region: the potential relaxing on a grid by successive
// over-relaxation, drawn as a diverging colour map with equipotential
// contours; conductors (Dirichlet cells) are fixed and can be painted.
// Bottom region: the residual (largest change per sweep) on a log scale,
// plunging toward zero as the solution converges.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec.
// 3.1; Press et al., Numerical Recipes, Sec. 20.5.

import { createGrid, sweep, applyPreset, setFixed, maxResidual } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selPreset = document.getElementById('select-preset');
const selBrush = document.getElementById('select-brush');
const valuePreset = document.getElementById('value-preset');
const valueBrush = document.getElementById('value-brush');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const N = 112, OMEGA = 1.92, SWEEPS_PER_FRAME = 3;
let running = !DETERMINISTIC;
let g = createGrid(N);
let resid = 1, residHist = [];
let heat = null;

function syncVals() {
  valuePreset.textContent = { plates: 'plates', coax: 'coax', dipole: 'two', sphere: 'disc' }[selPreset.value];
  valueBrush.textContent = { '1': '+1', '-1': '-1', '0': 'gnd', erase: 'erase' }[selBrush.value];
}
function loadPreset() { applyPreset(g, selPreset.value); resid = 1; residHist = []; }
selPreset.addEventListener('change', () => { syncVals(); loadPreset(); render(); });
selBrush.addEventListener('change', syncVals);
btnReset.addEventListener('click', () => {
  selPreset.value = 'plates'; selBrush.value = '1';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); loadPreset(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h);
  SCN = { draw, gx0: draw.x + (draw.w - size) / 2, gy0: draw.y + (draw.h - size) / 2, size };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.25 },
    { name: 'diagnostic', weight: 1.0 },
  ]);
  computeSceneTransform();
}
const CX = (i) => SCN.gx0 + (i / (N - 1)) * SCN.size;
const CY = (j) => SCN.gy0 + (j / (N - 1)) * SCN.size;
const invI = (sx) => Math.round((sx - SCN.gx0) / SCN.size * (N - 1));
const invJ = (sy) => Math.round((sy - SCN.gy0) / SCN.size * (N - 1));

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    pos: '#ef5466', neg: '#5b8def',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
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
  panel(col, r, 'Potential relaxing on the grid (paint conductors)');
  const { phi, fixed, val } = g;

  // heatmap (smooth) from phi.
  if (!heat) heat = document.createElement('canvas');
  heat.width = N; heat.height = N;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(N, N);
  for (let k = 0; k < N * N; k++) {
    const t = 0.5 + 0.5 * Math.max(-1, Math.min(1, phi[k]));
    const c = rdbu(t);
    img.data[k * 4] = c.r; img.data[k * 4 + 1] = c.g; img.data[k * 4 + 2] = c.b; img.data[k * 4 + 3] = 255;
  }
  hctx.putImageData(img, 0, 0);

  ctx.save();
  clipTo(ctx, { x: SCN.gx0, y: SCN.gy0, w: SCN.size, h: SCN.size });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, SCN.gx0, SCN.gy0, SCN.size, SCN.size);

  // equipotential contours (sub-sampled marching squares).
  const step = 2;
  const at = (i, j) => phi[j * N + i];
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let L = -0.8; L <= 0.81; L += 0.2) {
    if (Math.abs(L) < 1e-9) continue;
    for (let j = 0; j < N - 1 - step; j += step) for (let i = 0; i < N - 1 - step; i += step) {
      const a = at(i, j), b = at(i + step, j), c = at(i + step, j + step), d = at(i, j + step);
      const pts = [];
      const cr = (va, vb, x1, y1, x2, y2) => { if ((va > L) !== (vb > L)) { const t = (L - va) / (vb - va); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
      cr(a, b, i, j, i + step, j); cr(b, c, i + step, j, i + step, j + step); cr(c, d, i + step, j + step, i, j + step); cr(d, a, i, j + step, i, j);
      if (pts.length >= 2) { ctx.moveTo(CX(pts[0][0]), CY(pts[0][1])); ctx.lineTo(CX(pts[1][0]), CY(pts[1][1])); }
      if (pts.length === 4) { ctx.moveTo(CX(pts[2][0]), CY(pts[2][1])); ctx.lineTo(CX(pts[3][0]), CY(pts[3][1])); }
    }
  }
  ctx.stroke();

  // conductors (fixed cells) crisply, coloured by their value.
  const cell = SCN.size / (N - 1);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i; if (!fixed[k]) continue;
    const v = val[k];
    ctx.fillStyle = v > 0.01 ? col.pos : (v < -0.01 ? col.neg : 'rgba(180,188,200,0.9)');
    ctx.fillRect(CX(i) - cell / 2, CY(j) - cell / 2, cell + 1, cell + 1);
  }

  ctx.restore();

  // readout strip.
  const items = [
    [{ plates: 'plates', coax: 'coax', dipole: 'two', sphere: 'disc' }[selPreset.value], col.fg],
    [`residual ${resid.toExponential(0)}`, col.accent],
    [resid < 1e-4 ? 'converged' : 'solving…', resid < 1e-4 ? col.neg : col.accent],
    [`brush ${{ '1': '+1', '-1': '-1', '0': 'gnd', erase: 'erase' }[selBrush.value]}`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Residual per sweep (log scale): convergence');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 16, h: r.h - 28 - 42 };
  const loE = -5, hiE = 0;                  // log10 from 1e-5 to 1
  const xOf = (i) => inner.x + (i / Math.max(1, residHist.length - 1)) * inner.w;
  const yOf = (e) => inner.y + inner.h - (Math.max(loE, Math.min(hiE, e)) - loE) / (hiE - loE) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = hiE; e >= loE; e -= 1) { const y = yOf(e); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(`1e${e}`, inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  if (residHist.length > 1) {
    ctx.strokeStyle = col.accent; ctx.lineWidth = 2.4; ctx.beginPath();
    residHist.forEach((v, i) => { const X = xOf(i), Y = yOf(Math.log10(Math.max(1e-12, v))); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
    const lastY = yOf(Math.log10(Math.max(1e-12, residHist[residHist.length - 1])));
    ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(xOf(residHist.length - 1), lastY, 4, 0, 2 * Math.PI); ctx.fill();
  }

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('sweeps', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('residual (max Δφ)', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function resetInterior() {
  // wipe the free cells back to zero (keep the conductors) so the
  // relaxation visibly replays from flat; conductors stay fixed.
  for (let k = 0; k < N * N; k++) if (!g.fixed[k]) g.phi[k] = 0;
  resid = 1; residHist = [];
}
let holdC = 0;
function stepSolve() {
  for (let s = 0; s < SWEEPS_PER_FRAME; s++) resid = sweep(g, OMEGA);
  residHist.push(resid); if (residHist.length > 240) residHist.shift();
  // auto-replay the relaxation once converged (paused by interaction).
  if (resid < 1e-5) { holdC += 1; if (holdC > 50) { resetInterior(); holdC = 0; } } else holdC = 0;
}

// --- painting conductors ---
let painting = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
function paintAt(ev) {
  const { sx, sy } = pScreen(ev);
  const ci = invI(sx), cj = invJ(sy);
  if (ci < 1 || ci > N - 2 || cj < 1 || cj > N - 2) return;
  const R = 2, brush = selBrush.value;
  for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
    const i = ci + di, j = cj + dj; if (i < 1 || i > N - 2 || j < 1 || j > N - 2) continue;
    if (di * di + dj * dj > R * R + 1) continue;
    if (brush === 'erase') { g.fixed[j * N + i] = 0; }
    else setFixed(g, i, j, parseFloat(brush));
  }
  resid = 1;
}
canvas.addEventListener('pointerdown', (ev) => { if (!SCN) return; painting = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); paintAt(ev); render(); });
canvas.addEventListener('pointermove', (ev) => { if (painting) { paintAt(ev); render(); } });
const endPaint = () => { painting = false; };
canvas.addEventListener('pointerup', endPaint);
canvas.addEventListener('pointercancel', endPaint);

let last = performance.now();
function tick(now) {
  last = now;
  if (running) stepSolve();
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals(); loadPreset(); relayout();
  for (let n = 0; n < 200; n++) { resid = sweep(g, OMEGA); residHist.push(resid); if (residHist.length > 240) residHist.shift(); }
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
  let nfix = 0; for (let k = 0; k < N * N; k++) if (g.fixed[k]) nfix++;
  return {
    fields: [
      { key: 'setup', label: 'setup', value: { plates: 'parallel plates', coax: 'coaxial', dipole: 'two electrodes', sphere: 'charged disc' }[selPreset.value], format: 'text' },
      { key: 'resid', label: 'residual (max Δφ)', value: resid, format: 'float' },
      { key: 'fixed', label: 'fixed cells', value: nfix, format: 'int' },
      { key: 'converged', label: 'converged', value: resid < 1e-4 ? 'yes' : 'no', format: 'text' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // A converged solution is harmonic: the discrete Laplacian vanishes
    // over the free, source-free interior.
    const m = maxResidual(g);
    return [{
      key: 'harmonic',
      label: 'max |∇²φ| over free interior',
      value: m.toExponential(2),
      status: m < 5e-3 ? 'pass' : (m < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
