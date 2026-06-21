// Gradient and directional derivative. The scene is a scalar field f(x,y) as a
// heatmap with contours and the gradient field; a draggable probe shows the
// gradient (steepest ascent, perpendicular to the contour) and a chosen
// direction u, with the directional derivative D_u f = grad f . u read off as
// the projection of the gradient onto u. The diagnostic is D_u f versus the
// direction angle, a cosine peaking along the gradient. Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 14.6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { FIELDS, directionalDerivative, gradInfo } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selField = document.getElementById('select-field');
const sTheta = document.getElementById('slider-theta'), vTheta = document.getElementById('value-theta');
const btnReset = document.getElementById('btn-reset');

const DOM = 2.2;                                  // domain is [-DOM, DOM]^2
const st = { field: 'twohills', px: -0.2, py: 0.5, theta: 0.5 };
let heat = null, contours = [], heatKey = '';

let view = { w: 760, h: 980, dpr: 1 }, REG = null, SQ = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.55 },
    { name: 'diag', weight: 1.0 },
  ]);
  const r = REG.scene, titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const s = Math.min(draw.w, draw.h) * 0.92;
  SQ = { cx: draw.x + draw.w / 2, cy: draw.y + draw.h / 2, half: s / 2, draw };
}
const DX = (x) => SQ.cx + x / DOM * SQ.half;
const DY = (y) => SQ.cy - y / DOM * SQ.half;
const invX = (sx) => (sx - SQ.cx) / SQ.half * DOM;
const invY = (sy) => (SQ.cy - sy) / SQ.half * DOM;

function field() { return FIELDS[st.field]; }

// heatmap (viridis, normalised) + contour segments, cached per field/size.
function buildField() {
  if (!SQ) return;
  const F = field();
  const N = 96;
  const key = `${st.field}:${N}`;
  const grid = new Float64Array(N * N);
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
    const x = -DOM + 2 * DOM * (i + 0.5) / N, y = DOM - 2 * DOM * (j + 0.5) / N;
    const v = F.f(x, y); grid[j * N + i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
  }
  if (!heat) heat = document.createElement('canvas');
  heat.width = N; heat.height = N;
  const hctx = heat.getContext('2d'); const img = hctx.createImageData(N, N);
  for (let k = 0; k < N * N; k += 1) { const t = (grid[k] - lo) / (hi - lo || 1); const c = viridis(t); img.data[k * 4] = c.r; img.data[k * 4 + 1] = c.g; img.data[k * 4 + 2] = c.b; img.data[k * 4 + 3] = 255; }
  hctx.putImageData(img, 0, 0);
  // contours via marching squares at evenly spaced levels.
  contours = [];
  const xs = (i) => -DOM + 2 * DOM * (i + 0.5) / N, ys = (j) => DOM - 2 * DOM * (j + 0.5) / N;
  for (let s = 1; s <= 7; s += 1) {
    const L = lo + (hi - lo) * s / 8;
    for (let j = 0; j < N - 1; j += 1) for (let i = 0; i < N - 1; i += 1) {
      const a = grid[j * N + i], b = grid[j * N + i + 1], c = grid[(j + 1) * N + i + 1], d = grid[(j + 1) * N + i];
      const pts = []; const cr = (va, vb, x1, y1, x2, y2) => { if ((va > L) !== (vb > L)) { const t = (L - va) / (vb - va); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
      cr(a, b, xs(i), ys(j), xs(i + 1), ys(j)); cr(b, c, xs(i + 1), ys(j), xs(i + 1), ys(j + 1)); cr(c, d, xs(i + 1), ys(j + 1), xs(i), ys(j + 1)); cr(d, a, xs(i), ys(j + 1), xs(i), ys(j));
      if (pts.length >= 2) contours.push([pts[0], pts[1]]);
      if (pts.length === 4) contours.push([pts[2], pts[3]]);
    }
  }
  heatKey = key;
}

selField.addEventListener('change', () => { st.field = selField.value; buildField(); render(); });
sTheta.addEventListener('input', () => { st.theta = parseFloat(sTheta.value); vTheta.textContent = `${(st.theta * 180 / Math.PI).toFixed(0)} deg`; render(); });
btnReset.addEventListener('click', () => { st.field = 'twohills'; st.px = -0.2; st.py = 0.5; st.theta = 0.5; selField.value = 'twohills'; sTheta.value = '0.5'; vTheta.textContent = '29 deg'; buildField(); render(); });

let dragging = false;
function pScreen(ev) { const r = canvas.getBoundingClientRect(); return [(ev.clientX - r.left) * (view.w / r.width), (ev.clientY - r.top) * (view.h / r.height)]; }
canvas.addEventListener('pointerdown', (ev) => { if (!SQ) return; const [sx, sy] = pScreen(ev); if (sx > SQ.cx - SQ.half && sx < SQ.cx + SQ.half && sy > SQ.cy - SQ.half && sy < SQ.cy + SQ.half) { dragging = true; canvas.setPointerCapture(ev.pointerId); setProbe(sx, sy); } });
canvas.addEventListener('pointermove', (ev) => { if (!dragging) return; const [sx, sy] = pScreen(ev); setProbe(sx, sy); });
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
function setProbe(sx, sy) { st.px = Math.max(-DOM, Math.min(DOM, invX(sx))); st.py = Math.max(-DOM, Math.min(DOM, invY(sy))); render(); }

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', grad: '#ffd166', dir: '#ff6f9d', proj: '#67d98c', contour: 'rgba(255,255,255,0.18)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}
function vec(color, x0, y0, x1, y1, w = 2.6) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0), a = 8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - a * Math.cos(ang - 0.4), y1 - a * Math.sin(ang - 0.4)); ctx.lineTo(x1 - a * Math.cos(ang + 0.4), y1 - a * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
}

function drawScene(col, r) {
  if (heatKey !== `${st.field}:96`) buildField();
  panel(col, r, 'Scalar field f(x,y): gradient is steepest ascent, perpendicular to the contour');
  const F = field();
  ctx.save(); clipTo(ctx, SQ.draw);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, SQ.cx - SQ.half, SQ.cy - SQ.half, 2 * SQ.half, 2 * SQ.half);
  // contours.
  ctx.strokeStyle = col.contour; ctx.lineWidth = 1; ctx.beginPath();
  for (const s of contours) { ctx.moveTo(DX(s[0][0]), DY(s[0][1])); ctx.lineTo(DX(s[1][0]), DY(s[1][1])); }
  ctx.stroke();
  // gradient field on a coarse grid (short normalised arrows).
  ctx.globalAlpha = 0.5;
  for (let gy = -1.7; gy <= 1.71; gy += 0.5) for (let gx = -1.7; gx <= 1.71; gx += 0.5) {
    const g = gradInfo(F, gx, gy); if (g.mag < 1e-4) continue;
    const ux = g.gx / g.mag, uy = g.gy / g.mag, len = 13;
    vec('rgba(230,236,250,0.7)', DX(gx), DY(gy), DX(gx) + ux * len, DY(gy) - uy * len, 1.2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.strokeStyle = col.border; ctx.strokeRect(SQ.cx - SQ.half + 0.5, SQ.cy - SQ.half + 0.5, 2 * SQ.half - 1, 2 * SQ.half - 1);

  // probe and its vectors.
  const g = gradInfo(F, st.px, st.py);
  const px = DX(st.px), py = DY(st.py);
  const VS = SQ.half * 0.34;                      // pixels per unit of |grad f| for the gradient arrow
  const gScale = VS / Math.max(g.mag, 0.4);
  // chosen direction u (unit), drawn at a fixed length.
  const uLen = SQ.half * 0.30;
  const ux = Math.cos(st.theta), uy = Math.sin(st.theta);
  vec(col.dir, px, py, px + ux * uLen, py - uy * uLen, 2.4);
  // gradient vector.
  vec(col.grad, px, py, px + g.gx * gScale, py - g.gy * gScale, 3);
  // projection of grad onto u = D_u f: drop a perpendicular from grad tip to the u line.
  const Du = directionalDerivative(F, st.px, st.py, st.theta);
  const projLen = Du * gScale;                    // signed length along u (same scale as gradient)
  const pjx = px + ux * projLen, pjy = py - uy * projLen;
  ctx.strokeStyle = col.proj; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(pjx, pjy); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(px + g.gx * gScale, py - g.gy * gScale); ctx.lineTo(pjx, pjy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 6.28); ctx.fill();
  // labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textBaseline = 'middle';
  ctx.fillStyle = col.grad; ctx.textAlign = 'left'; ctx.fillText('grad f', px + g.gx * gScale + 5, py - g.gy * gScale);
  ctx.fillStyle = col.dir; ctx.fillText('u', px + ux * uLen + 5, py - uy * uLen);

  // readout strip.
  const items = [
    [`f ${F.f(st.px, st.py).toFixed(2)}`, col.fg],
    [`|grad f| ${g.mag.toFixed(2)}`, col.grad],
    [`u ${(st.theta * 180 / Math.PI).toFixed(0)} deg`, col.dir],
    [`D_u f ${Du.toFixed(2)}`, col.proj],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiag(col, r) {
  panel(col, r, 'Directional derivative D_u f vs direction: a cosine peaking along the gradient');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 32 };
  const F = field();
  const g = gradInfo(F, st.px, st.py);
  const amp = Math.max(g.mag, 0.2);
  const xOf = (deg) => inner.x + (deg / 360) * inner.w;
  const yOf = (D) => inner.y + inner.h / 2 - (D / amp) * (inner.h / 2 - 6);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const D of [-amp, -amp / 2, 0, amp / 2, amp]) { const y = yOf(D); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(D.toFixed(1), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // zero line emphasised.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();

  // the cosine curve.
  ctx.strokeStyle = col.proj; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let deg = 0; deg <= 360; deg += 2) { const t = deg * Math.PI / 180; const D = directionalDerivative(F, st.px, st.py, t); const X = xOf(deg), Y = yOf(D); deg === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // gradient-direction marker (the peak) and the level-set zeros.
  const gd = ((g.ang * 180 / Math.PI) % 360 + 360) % 360;
  ctx.strokeStyle = col.grad; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xOf(gd), inner.y); ctx.lineTo(xOf(gd), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.grad; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('along grad f (max)', xOf(gd), yOf(amp) + 12);
  // current direction marker.
  const cd = ((st.theta * 180 / Math.PI) % 360 + 360) % 360;
  const Dnow = directionalDerivative(F, st.px, st.py, st.theta);
  ctx.strokeStyle = col.dir; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(cd), inner.y); ctx.lineTo(xOf(cd), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(cd), yOf(Dnow), 4, 0, 6.28); ctx.fill(); ctx.strokeStyle = col.dir; ctx.lineWidth = 1.4; ctx.stroke();

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const d of [0, 90, 180, 270, 360]) ctx.fillText(`${d}`, xOf(d), inner.y + inner.h + 6);
  ctx.fillText('direction angle (deg)', inner.x + inner.w / 2, inner.y + inner.h + 18);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiag(col, REG.diag);
}

function boot() {
  vTheta.textContent = `${(st.theta * 180 / Math.PI).toFixed(0)} deg`;
  relayout(); buildField(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();

window.addEventListener('resize', () => { relayout(); buildField(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); buildField(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const F = field(), g = gradInfo(F, st.px, st.py);
  return { fields: [
    { key: 'field', label: 'field', value: F.label, format: 'text' },
    { key: 'point', label: 'point (x, y)', value: `${st.px.toFixed(2)}, ${st.py.toFixed(2)}`, format: 'text' },
    { key: 'gradmag', label: 'max slope |grad f|', value: g.mag, format: 'float' },
    { key: 'gradang', label: 'gradient angle (deg)', value: g.ang * 180 / Math.PI, format: 'float' },
    { key: 'dir', label: 'direction u (deg)', value: st.theta * 180 / Math.PI, format: 'float' },
    { key: 'Du', label: 'directional deriv D_u f', value: directionalDerivative(F, st.px, st.py, st.theta), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const F = field(), g = gradInfo(F, st.px, st.py);
  const Dmax = directionalDerivative(F, st.px, st.py, g.ang);
  const Dperp = directionalDerivative(F, st.px, st.py, g.ang + Math.PI / 2);
  return [
    { key: 'maxalong', label: 'max D_u f along grad = |grad f|', value: Math.abs(Dmax - g.mag).toExponential(1), status: Math.abs(Dmax - g.mag) < 1e-6 ? 'pass' : 'drift' },
    { key: 'perpzero', label: 'D_u f = 0 perpendicular (level set)', value: Math.abs(Dperp).toExponential(1), status: Math.abs(Dperp) < 1e-6 ? 'pass' : 'drift' },
  ];
};
