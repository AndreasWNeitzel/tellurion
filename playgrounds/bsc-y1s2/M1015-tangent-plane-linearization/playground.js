// The tangent plane and linear approximation of a surface. The scene shows the
// surface in oblique 3D with the tangent plane touching it at a draggable point;
// the diagnostic plots f and its tangent line along a cross-section, showing the
// linear approximation matching f in value and slope at the point and diverging
// quadratically away. Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 14.4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { SURFS, tangentPlane, approxError, gradMag } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selSurf = document.getElementById('select-surf');
const btnReset = document.getElementById('btn-reset');

const EXT = 1.8;
const DEF = { x0: 0.7, y0: 0.7 };
const st = { surf: 'bump', x0: DEF.x0, y0: DEF.y0 };
function sf() { return SURFS[st.surf]; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.42 }, { name: 'diag', weight: 0.8 }]);
}
function syncVals() { selSurf.value = st.surf; }
selSurf.addEventListener('change', () => { st.surf = selSurf.value; st.x0 = DEF.x0; st.y0 = DEF.y0; syncVals(); render(); });
btnReset.addEventListener('click', () => { st.surf = 'bump'; st.x0 = DEF.x0; st.y0 = DEF.y0; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', plane: 'rgba(255,209,102,0.17)', planeEdge: '#ffd166', point: '#ffffff', grad: '#ff9d3c', fcurve: '#5b9bd5', tline: '#67d98c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let PRJ = null;
function zRange() { const s = sf(); let lo = Infinity, hi = -Infinity; for (let j = 0; j <= 16; j += 1) for (let i = 0; i <= 16; i += 1) { const v = s.f(-EXT + 2 * EXT * i / 16, -EXT + 2 * EXT * j / 16); lo = Math.min(lo, v); hi = Math.max(hi, v); } return [lo, hi]; }
function setProj(r) {
  const cx = r.x + r.w * 0.5, cy = r.y + r.h * 0.44, s = Math.min(r.w, r.h) * 0.2;
  const [zlo, zhi] = zRange(); const zmid = (zlo + zhi) / 2, zg = (zhi - zlo) > 1e-6 ? (s * 0.8) / (zhi - zlo) : 0;
  PRJ = { cx, cy, sxy: s * 0.82, syy: s * 0.42, zmid, zg };
}
function proj(x, y, z) { return [PRJ.cx + (x - y) * PRJ.sxy, PRJ.cy + (x + y) * PRJ.syy - (z - PRJ.zmid) * PRJ.zg]; }

function drawScene(col, r) {
  panel(col, r, 'The tangent plane touches the surface at the point (drag it)');
  setProj({ x: r.x, y: r.y + 22, w: r.w, h: r.h - 22 });
  const s = sf(); const [zlo, zhi] = zRange();
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 20, w: r.w, h: r.h - 20 });
  // surface wireframe drawn segment by segment, coloured by height (viridis) with
  // a depth cue: nearer rows (larger x + y) are brighter.
  const N = 24; const gx = (i) => -EXT + 2 * EXT * i / N;
  const Z = []; const P = [];
  for (let j = 0; j <= N; j += 1) { Z[j] = []; P[j] = []; for (let i = 0; i <= N; i += 1) { const x = gx(i), y = gx(j); const z = s.f(x, y); Z[j][i] = z; P[j][i] = proj(x, y, z); } }
  ctx.lineWidth = 1.1; ctx.lineCap = 'round';
  const seg = (a, b, za, zb, xa, ya, xb, yb) => { const z = 0.5 * (za + zb), c = viridis((z - zlo) / (zhi - zlo + 1e-9)); const depth = (xa + ya + xb + yb) / 4; const al = 0.42 + 0.4 * (depth + 2 * EXT) / (4 * EXT); ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${al.toFixed(3)})`; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  for (let j = 0; j <= N; j += 1) for (let i = 0; i < N; i += 1) seg(P[j][i], P[j][i + 1], Z[j][i], Z[j][i + 1], gx(i), gx(j), gx(i + 1), gx(j));
  for (let i = 0; i <= N; i += 1) for (let j = 0; j < N; j += 1) seg(P[j][i], P[j + 1][i], Z[j][i], Z[j + 1][i], gx(i), gx(j), gx(i), gx(j + 1));
  ctx.lineCap = 'butt';
  // tangent plane patch (square in xy around the point).
  const pw = 1.0; const cn = [[st.x0 - pw, st.y0 - pw], [st.x0 + pw, st.y0 - pw], [st.x0 + pw, st.y0 + pw], [st.x0 - pw, st.y0 + pw]];
  ctx.fillStyle = col.plane; ctx.strokeStyle = col.planeEdge; ctx.lineWidth = 1.6; ctx.beginPath();
  cn.forEach((c, i) => { const p = proj(c[0], c[1], tangentPlane(s, st.x0, st.y0, c[0], c[1])); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the point of tangency.
  const f0 = s.f(st.x0, st.y0); const pp = proj(st.x0, st.y0, f0);
  ctx.fillStyle = col.point; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pp[0], pp[1], 5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  // readout strip.
  const items = [[`point (${st.x0.toFixed(2)}, ${st.y0.toFixed(2)})`, col.point], [`f = ${f0.toFixed(3)}`, col.fcurve], [`grad (${s.fx(st.x0, st.y0).toFixed(2)}, ${s.fy(st.x0, st.y0).toFixed(2)})`, col.grad]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 10); });
}

function drawDiag(col, r) {
  panel(col, r, 'Cross-section along the gradient: the tangent line matches f, then diverges quadratically');
  const inner = { x: r.x + 40, y: r.y + 26, w: r.w - 40 - 16, h: r.h - 26 - 30 };
  const s = sf(); const g = gradMag(s, st.x0, st.y0);
  let ux = 1, uy = 0; if (g > 1e-6) { ux = s.fx(st.x0, st.y0) / g; uy = s.fy(st.x0, st.y0) / g; }
  const T = 1.5; const fs = [], ls = [];
  for (let i = 0; i <= 200; i += 1) { const t = -T + 2 * T * i / 200; const x = st.x0 + t * ux, y = st.y0 + t * uy; fs.push([t, s.f(x, y)]); ls.push([t, tangentPlane(s, st.x0, st.y0, x, y)]); }
  // scale the vertical axis to the surface curve so the tangency is prominent; the
  // straight tangent line is allowed to run off the top or bottom (clipped).
  let lo = Infinity, hi = -Infinity; for (const [, v] of fs) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const span = Math.max(hi - lo, 0.35); const mid = 0.5 * (lo + hi); lo = mid - 0.62 * span; hi = mid + 0.62 * span;
  const xOf = (t) => inner.x + (t + T) / (2 * T) * inner.w;
  const yOf = (v) => inner.y + inner.h - (v - lo) / (hi - lo) * inner.h;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = col.grid; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); clipTo(ctx, inner);
  // shade the gap between curve and tangent line (the approximation error).
  ctx.fillStyle = 'rgba(255,157,60,0.16)'; ctx.beginPath();
  fs.forEach(([t, v], i) => { const X = xOf(t), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  for (let i = ls.length - 1; i >= 0; i -= 1) { const X = xOf(ls[i][0]), Y = yOf(ls[i][1]); ctx.lineTo(X, Y); }
  ctx.closePath(); ctx.fill();
  // tangent line (straight).
  ctx.strokeStyle = col.tline; ctx.lineWidth = 2; ctx.beginPath(); ls.forEach(([t, v], i) => { const X = xOf(t), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  // f curve.
  ctx.strokeStyle = col.fcurve; ctx.lineWidth = 2.6; ctx.beginPath(); fs.forEach(([t, v], i) => { const X = xOf(t), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  // tangency point.
  ctx.fillStyle = col.point; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(xOf(0), yOf(s.f(st.x0, st.y0)), 4.5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.fcurve; ctx.fillText('f along the gradient', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.tline; ctx.fillText('tangent line (linear approx)', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.grad; ctx.fillText('shaded gap = approximation error', inner.x + 6, inner.y + 32);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('step along the gradient direction', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

// drag the point: grid-search for the surface point whose projection is nearest.
let dragging = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function nearest(sx, sy) {
  const s = sf(); let bd = Infinity, bx = st.x0, by = st.y0;
  for (let j = 0; j <= 44; j += 1) for (let i = 0; i <= 44; i += 1) { const x = -EXT + 2 * EXT * i / 44, y = -EXT + 2 * EXT * j / 44; const p = proj(x, y, s.f(x, y)); const d = (p[0] - sx) ** 2 + (p[1] - sy) ** 2; if (d < bd) { bd = d; bx = x; by = y; } }
  st.x0 = bx; st.y0 = by;
}
canvas.addEventListener('pointerdown', (e) => { if (!PRJ) return; const [sx, sy] = ptr(e); if (sy < REG.scene.y + REG.scene.h) { dragging = true; nearest(sx, sy); render(); } });
canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const [sx, sy] = ptr(e); nearest(sx, sy); render(); });
window.addEventListener('pointerup', () => { dragging = false; });

function boot() {
  if (params.get('surf') && SURFS[params.get('surf')]) st.surf = params.get('surf');
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = sf();
  return { fields: [
    { key: 'surf', label: 'surface', value: s.label, format: 'text' },
    { key: 'pt', label: 'point (x0, y0)', value: `(${st.x0.toFixed(2)}, ${st.y0.toFixed(2)})`, format: 'text' },
    { key: 'f', label: 'f at point', value: s.f(st.x0, st.y0), format: 'float' },
    { key: 'fx', label: 'f_x', value: s.fx(st.x0, st.y0), format: 'float' },
    { key: 'fy', label: 'f_y', value: s.fy(st.x0, st.y0), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const s = sf();
  const eAtPt = Math.abs(approxError(s, st.x0, st.y0, st.x0, st.y0));
  // second-order: halving the offset quarters the error.
  const e1 = Math.abs(approxError(s, st.x0, st.y0, st.x0 + 0.1, st.y0 + 0.1));
  const e2 = Math.abs(approxError(s, st.x0, st.y0, st.x0 + 0.05, st.y0 + 0.05));
  const ratio = e2 > 1e-12 ? e1 / e2 : 4;
  return [
    { key: 'touch', label: 'error = 0 at the point', value: eAtPt.toExponential(1), status: eAtPt < 1e-9 ? 'pass' : 'drift' },
    { key: 'order', label: 'error ~ distance^2 (ratio 4)', value: ratio.toFixed(2), status: Math.abs(ratio - 4) < 0.5 || e2 < 1e-10 ? 'pass' : 'pending' },
  ];
};

// Auto-orbit the probe so the local quantity is always in motion; drag to take over.
let __aphase = 0, __alast = performance.now();
function __autoOrbit(now) {
  const dt = Math.min((now - __alast) / 1000, 0.05); __alast = now;
  if (!DETERMINISTIC && typeof dragging !== 'undefined' && !dragging) {
    __aphase += dt * 0.45;
    st.x0 = 0 + 1.3 * Math.cos(__aphase);
    st.y0 = 0 + 1 * Math.sin(__aphase * 1.3);
    render();
  }
  requestAnimationFrame(__autoOrbit);
}
if (!DETERMINISTIC) requestAnimationFrame(__autoOrbit);
