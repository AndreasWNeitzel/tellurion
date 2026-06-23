import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the 2x2 SVD. Top region: a unit circle (and a marked
// frame) morphs through the three SVD steps, rotate V^T, scale Sigma, rotate
// U, into the output ellipse, with the factorization shown alongside. Bottom
// region: the stretch factor |M v| versus input direction, whose peak and
// trough are the singular values sigma1 >= sigma2.
//
// Reference: Strang, Linear Algebra and Its Applications, Ch. 6;
// Arfken and Weber, Mathematical Methods for Physicists, 7th ed., Ch. 3.

import { svd2x2 } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sIds = ['a', 'b', 'c', 'd'];
const sliders = {}, valEls = {};
for (const k of sIds) { sliders[k] = document.getElementById('slider-' + k); valEls[k] = document.getElementById('value-' + k); }
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const DEF = { a: 1.5, b: -0.7, c: 0.4, d: 2.1 };
let running = !DETERMINISTIC;
let phase = 0;                 // morph phase in [0, 4)
const M = { ...DEF };
let dec = null;               // svd decomposition + keyframe matrices

function readMatrix() {
  for (const k of sIds) M[k] = parseFloat(sliders[k].value);
}
function rebuild() {
  readMatrix();
  const s = svd2x2(M.a, M.b, M.c, M.d);
  // Keyframe 2x2 matrices [m00, m01, m10, m11].
  const I = [1, 0, 0, 1];
  const VT = [s.v1.x, s.v1.y, s.v2.x, s.v2.y];
  const SVT = [s.s1 * s.v1.x, s.s1 * s.v1.y, s.s2 * s.v2.x, s.s2 * s.v2.y];
  const MM = [M.a, M.b, M.c, M.d];
  dec = { s, K: [I, VT, SVT, MM] };
}
function syncVals() { for (const k of sIds) valEls[k].textContent = parseFloat(sliders[k].value).toFixed(2); }

for (const k of sIds) sliders[k].addEventListener('input', () => { syncVals(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  for (const k of sIds) sliders[k].value = String(DEF[k]);
  phase = 0; running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
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
    { name: 'diagnostic', weight: 1.35 },
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
    e1: '#ef476f',
    e2: '#5bc0eb',
    sig: '#67d98c',
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

const smooth = (t) => t * t * (3 - 2 * t);
function ap(m, x, y) { return [m[0] * x + m[1] * y, m[2] * x + m[3] * y]; }

function drawArrow(x0, y0, x1, y1, col, w) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  if (L < 1) return;
  const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 9 * ux + 5 * uy, y1 - 9 * uy - 5 * ux);
  ctx.lineTo(x1 - 9 * ux - 5 * uy, y1 - 9 * uy + 5 * ux);
  ctx.closePath(); ctx.fill();
}

const STAGE = ['rotate by Vᵀ', 'scale by Σ', 'rotate by U', 'M = U Σ Vᵀ'];

function drawScene(col, r) {
  panel(col, r, 'A unit circle becomes an ellipse, in three steps');

  const titleH = 24;
  const inner = { x: r.x + 8, y: r.y + titleH, w: r.w - 16, h: r.h - titleH - 8 };
  const leftW = inner.w * 0.66;
  const side = Math.min(leftW, inner.h);
  const plot = { x: inner.x, y: inner.y + (inner.h - side) / 2, w: side, h: side };

  const { s, K } = dec;
  // Current interpolated matrix along the morph.
  const seg = Math.floor(phase) % 4;
  const f = smooth(phase - Math.floor(phase));
  const Ka = K[seg], Kb = K[(seg + 1) % 4];
  const Mc = Ka.map((v, i) => v + (Kb[i] - v) * f);

  // World-to-screen for the square plot, centered on origin.
  const E = Math.max(1.6, Math.min(6, s.s1 * 1.45));
  const cx = plot.x + plot.w / 2, cy = plot.y + plot.h / 2;
  const sc = (plot.w * 0.46) / E;
  const SX = (x) => cx + x * sc;
  const SY = (y) => cy - y * sc;

  // Axes.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(plot.x, cy); ctx.lineTo(plot.x + plot.w, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, plot.y); ctx.lineTo(cx, plot.y + plot.h); ctx.stroke();

  // Faint start (unit circle) and target (final ellipse) outlines.
  const ringPt = (m, th) => { const [x, y] = ap(m, Math.cos(th), Math.sin(th)); return [SX(x), SY(y)]; };
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) { const [px, py] = ringPt([1, 0, 0, 1], i / 64 * 2 * Math.PI); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(103,217,140,0.4)';
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) { const [px, py] = ringPt(K[3], i / 64 * 2 * Math.PI); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke();
  ctx.restore();

  // Transformed unit square (its edges are the matrix columns).
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
  ctx.beginPath();
  sq.forEach((c, i) => { const [x, y] = ap(Mc, c[0], c[1]); const px = SX(x), py = SY(y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.closePath();
  ctx.stroke();

  // The morphing ring, colored by the original angle (so rotation shows).
  ctx.lineWidth = 3;
  let prev = ringPt(Mc, 0);
  for (let i = 1; i <= 96; i++) {
    const th = i / 96 * 2 * Math.PI;
    const cur = ringPt(Mc, th);
    const cc = viridis((i - 0.5) / 96);
    ctx.strokeStyle = `rgb(${cc.r | 0},${cc.g | 0},${cc.b | 0})`;
    ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
    prev = cur;
  }

  // Transformed standard basis vectors (the matrix columns).
  const e1 = ap(Mc, 1, 0), e2 = ap(Mc, 0, 1);
  drawArrow(cx, cy, SX(e1[0]), SY(e1[1]), col.e1, 2.5);
  drawArrow(cx, cy, SX(e2[0]), SY(e2[1]), col.e2, 2.5);

  // Stage label.
  ctx.fillStyle = col.accent;
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(STAGE[seg], cx, plot.y + 2);

  // Right-hand factorization panel.
  drawFactorPanel(col, { x: inner.x + leftW + 8, y: inner.y, w: inner.w - leftW - 10, h: inner.h }, s);
}

function drawFactorPanel(col, box, s) {
  const cond = s.s2 > 1e-9 ? s.s1 / s.s2 : Infinity;
  const det = M.a * M.d - M.b * M.c;
  let y = box.y + 4;
  const x = box.x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('M = U Σ Vᵀ', x, y);
  y += 24;

  // Singular value bars.
  const sMax = Math.max(s.s1, 1e-6);
  const barW = box.w - 8;
  const bar = (label, val, color) => {
    ctx.fillStyle = col.fg;
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.fillText(`${label} = ${val.toFixed(2)}`, x, y);
    y += 14;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, barW, 8);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW * Math.min(1, val / sMax), 8);
    y += 18;
  };
  bar('σ₁', s.s1, col.sig);
  bar('σ₂', s.s2, col.e2);

  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  const lines = [
    `cond = ${Number.isFinite(cond) ? cond.toFixed(2) : '∞'}`,
    `det M = ${det.toFixed(2)}`,
    '',
    `∠Vᵀ = ${(Math.atan2(s.v1.y, s.v1.x) * 180 / Math.PI).toFixed(0)}°`,
    `∠U  = ${(Math.atan2(s.u1.y, s.u1.x) * 180 / Math.PI).toFixed(0)}°`,
  ];
  for (const ln of lines) { ctx.fillText(ln, x, y); y += 15; }
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Stretch |M v| vs input direction: the singular values');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 14, h: r.h - 28 - 40 };
  const { s } = dec;
  const yMax = Math.max(s.s1 * 1.12, 0.1);
  const xOf = (deg) => inner.x + (deg / 360) * inner.w;
  const yOf = (g) => inner.y + inner.h - (g / yMax) * inner.h;
  const stretch = (th) => {
    const x = M.a * Math.cos(th) + M.b * Math.sin(th);
    const y = M.c * Math.cos(th) + M.d * Math.sin(th);
    return Math.hypot(x, y);
  };

  // Grid + y ticks.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const g of [0, s.s2, s.s1]) {
    const y = yOf(g);
    ctx.beginPath();
    ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y);
    ctx.stroke();
    ctx.fillText(g.toFixed(2), inner.x - 5, y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const d of [0, 90, 180, 270, 360]) ctx.fillText(String(d), xOf(d), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // sigma1, sigma2 reference lines.
  ctx.save();
  ctx.setLineDash([4, 4]);
  for (const [g, c] of [[s.s1, col.sig], [s.s2, col.e2]]) {
    ctx.strokeStyle = c; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(inner.x, yOf(g)); ctx.lineTo(inner.x + inner.w, yOf(g)); ctx.stroke();
  }
  ctx.restore();

  // Stretch curve.
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= 180; i++) {
    const th = i / 180 * 2 * Math.PI;
    const X = xOf(i / 180 * 360), Y = yOf(stretch(th));
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.stroke();

  // Markers at the input singular directions (peaks = sigma1, troughs = sigma2).
  const mark = (vec, val, color, lab) => {
    let deg = Math.atan2(vec.y, vec.x) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    if (deg > 360) deg -= 360;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(xOf(deg), yOf(val), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(lab, xOf(deg), yOf(val) - 6);
  };
  mark(s.v1, s.s1, col.sig, 'σ₁');
  mark(s.v2, s.s2, col.e2, 'σ₂');

  // Axis labels.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('input direction (deg)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save();
  ctx.translate(inner.x - 32, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('stretch |M v|', 0, 0);
  ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!dec) rebuild();
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
  if (running) phase = (phase + dt / 1.5) % 4;   // ~1.5 s per stage
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    phase = (f * 4) % 4;
  }
  syncVals();
  rebuild();
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
  const s = dec ? dec.s : svd2x2(M.a, M.b, M.c, M.d);
  const cond = s.s2 > 1e-9 ? s.s1 / s.s2 : Infinity;
  return {
    fields: [
      { key: 's1', label: 'singular value $\\sigma_1$', value: s.s1, format: 'float' },
      { key: 's2', label: 'singular value $\\sigma_2$', value: s.s2, format: 'float' },
      { key: 'cond', label: 'condition $\\sigma_1/\\sigma_2$', value: Number.isFinite(cond) ? cond : 1e9, format: 'float' },
      { key: 'det', label: 'det $M$', value: M.a * M.d - M.b * M.c, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const s = svd2x2(M.a, M.b, M.c, M.d);
    // Reconstruct M = U Sigma V^T and compare to the input entries.
    const rec00 = s.u1.x * s.s1 * s.v1.x + s.u2.x * s.s2 * s.v2.x;
    const rec01 = s.u1.x * s.s1 * s.v1.y + s.u2.x * s.s2 * s.v2.y;
    const rec10 = s.u1.y * s.s1 * s.v1.x + s.u2.y * s.s2 * s.v2.x;
    const rec11 = s.u1.y * s.s1 * s.v1.y + s.u2.y * s.s2 * s.v2.y;
    const err = Math.max(
      Math.abs(rec00 - M.a), Math.abs(rec01 - M.b),
      Math.abs(rec10 - M.c), Math.abs(rec11 - M.d),
    );
    return [{
      key: 'recon',
      label: 'U Σ Vᵀ reconstructs M (max err)',
      value: err.toExponential(2),
      status: err < 1e-9 ? 'pass' : (err < 1e-5 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
