// Critical points and the Hessian test. The scene shows f(x,y) as a heatmap with
// contours, the critical points classified as minima, maxima, and saddles, and a
// draggable probe showing grad f and the Hessian principal axes. The diagnostic
// plots f along the two principal directions through the probe: it curves up
// along a positive-eigenvalue axis and down along a negative one, which is the
// second-derivative test. Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 14.7.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { FUNCS, classify, eigvec } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const btnFunc = document.getElementById('btn-func'), vFunc = document.getElementById('value-func');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(FUNCS);
const EXT = 2.2;
const st = { func: 'four', px: 1, py: -1 };
function fn() { return FUNCS[st.func]; }
const TYPECOL = { min: '#5b8def', max: '#ef5466', saddle: '#ffd166', degenerate: '#9aa0a6' };

let view = { w: 820, h: 1040, dpr: 1 }, REG = null, heat = null, fRange = [0, 1];
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.42 }, { name: 'diag', weight: 0.82 }]);
}
function syncVals() { vFunc.textContent = fn().label; }
btnFunc.addEventListener('click', () => { st.func = KEYS[(KEYS.indexOf(st.func) + 1) % KEYS.length]; const c = fn().crit[0]; st.px = c[0]; st.py = c[1]; syncVals(); render(); });
btnReset.addEventListener('click', () => { st.func = 'four'; st.px = 1; st.py = -1; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', contour: 'rgba(255,255,255,0.22)', grad: '#ff9d3c', probe: '#ffffff', up: '#5b8def', down: '#ef5466' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SCN = null;
function drawScene(col, r) {
  panel(col, r, 'f(x,y): critical points classified by the Hessian (min, max, saddle)');
  const titleH = 24, stripH = 30;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h) - 16;
  const ox = draw.x + (draw.w - size) / 2, oy = draw.y + (draw.h - size) / 2;
  const X = (wx) => ox + (wx + EXT) / (2 * EXT) * size, Y = (wy) => oy + (EXT - wy) / (2 * EXT) * size;
  const wX = (sx) => (sx - ox) / size * (2 * EXT) - EXT, wY = (sy) => EXT - (sy - oy) / size * (2 * EXT);
  SCN = { ox, oy, size, wX, wY };
  const f = fn();
  // f range over the region.
  let fmin = Infinity, fmax = -Infinity;
  for (let j = 0; j <= 40; j += 1) for (let i = 0; i <= 40; i += 1) { const v = f.f(-EXT + i / 40 * 2 * EXT, -EXT + j / 40 * 2 * EXT); fmin = Math.min(fmin, v); fmax = Math.max(fmax, v); }
  fRange = [fmin, fmax];
  // heatmap.
  const NH = 96;
  if (!heat) heat = document.createElement('canvas');
  heat.width = NH; heat.height = NH; const hctx = heat.getContext('2d'); const img = hctx.createImageData(NH, NH);
  for (let j = 0; j < NH; j += 1) for (let i = 0; i < NH; i += 1) {
    const v = f.f(-EXT + (i + 0.5) / NH * 2 * EXT, EXT - (j + 0.5) / NH * 2 * EXT);
    const c = viridis((v - fmin) / (fmax - fmin + 1e-9)); const k = (j * NH + i) * 4;
    img.data[k] = c.r; img.data[k + 1] = c.g; img.data[k + 2] = c.b; img.data[k + 3] = 230;
  }
  hctx.putImageData(img, 0, 0);
  ctx.save(); clipTo(ctx, { x: ox, y: oy, w: size, h: size });
  ctx.imageSmoothingEnabled = true; ctx.drawImage(heat, ox, oy, size, size);
  // contours (marching squares on a grid).
  const NG = 64, vals = new Float64Array((NG + 1) * (NG + 1));
  for (let j = 0; j <= NG; j += 1) for (let i = 0; i <= NG; i += 1) vals[j * (NG + 1) + i] = f.f(-EXT + i / NG * 2 * EXT, EXT - j / NG * 2 * EXT);
  ctx.strokeStyle = col.contour; ctx.lineWidth = 1; ctx.beginPath();
  const gx = (i) => X(-EXT + i / NG * 2 * EXT), gy = (j) => oy + j / NG * size;
  for (let L = 1; L <= 6; L += 1) {
    const lev = fmin + (fmax - fmin) * L / 7;
    for (let j = 0; j < NG; j += 1) for (let i = 0; i < NG; i += 1) {
      const a = vals[j * (NG + 1) + i], b = vals[j * (NG + 1) + i + 1], c = vals[(j + 1) * (NG + 1) + i + 1], d = vals[(j + 1) * (NG + 1) + i];
      const pts = []; const ed = (va, vb, x1, y1, x2, y2) => { if ((va > lev) !== (vb > lev)) { const t = (lev - va) / (vb - va); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
      ed(a, b, gx(i), gy(j), gx(i + 1), gy(j)); ed(b, c, gx(i + 1), gy(j), gx(i + 1), gy(j + 1)); ed(c, d, gx(i + 1), gy(j + 1), gx(i), gy(j + 1)); ed(d, a, gx(i), gy(j + 1), gx(i), gy(j));
      if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
    }
  }
  ctx.stroke();
  // critical points.
  for (const [cx, cy] of f.crit) {
    const t = classify(f.hess(cx, cy)).type; ctx.fillStyle = TYPECOL[t]; ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(cx), Y(cy), 6, 0, 6.28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TYPECOL[t]; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(t, X(cx), Y(cy) - 8);
  }
  // probe: gradient + Hessian principal axes.
  const [gxv, gyv] = f.grad(st.px, st.py); const H = f.hess(st.px, st.py); const cl = classify(H);
  const pxs = X(st.px), pys = Y(st.py);
  const e1 = eigvec(H, cl.l1), e2 = eigvec(H, cl.l2); const axL = size * 0.09;
  for (const [e, lam] of [[e1, cl.l1], [e2, cl.l2]]) {
    ctx.strokeStyle = lam >= 0 ? col.up : col.down; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(pxs - e[0] * axL, pys + e[1] * axL); ctx.lineTo(pxs + e[0] * axL, pys - e[1] * axL); ctx.stroke();
  }
  // gradient arrow (uphill).
  const gmag = Math.hypot(gxv, gyv);
  if (gmag > 1e-4) { const s = Math.min(size * 0.11, gmag * size / (2 * EXT) * 0.18) / gmag; const x1 = pxs + gxv * s, y1 = pys - gyv * s; ctx.strokeStyle = col.grad; ctx.fillStyle = col.grad; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pxs, pys); ctx.lineTo(x1, y1); ctx.stroke(); const a = Math.atan2(y1 - pys, x1 - pxs); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 7 * Math.cos(a - 0.5), y1 - 7 * Math.sin(a - 0.5)); ctx.lineTo(x1 - 7 * Math.cos(a + 0.5), y1 - 7 * Math.sin(a + 0.5)); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = col.probe; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(pxs, pys, 4.5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();

  // readout strip.
  const items = [[`det H ${cl.det.toFixed(2)}`, col.fg], [`lambda ${cl.l1.toFixed(2)}, ${cl.l2.toFixed(2)}`, TYPECOL[cl.type]], [`|grad f| ${gmag.toFixed(2)}`, col.grad], [gmag < 0.02 ? `critical: ${cl.type}` : 'not critical', gmag < 0.02 ? TYPECOL[cl.type] : col.muted]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 11); });
}

function drawDiag(col, r) {
  panel(col, r, 'f along the two Hessian axes through the probe: up = positive curvature, down = negative');
  const inner = { x: r.x + 44, y: r.y + 26, w: r.w - 44 - 16, h: r.h - 26 - 30 };
  const f = fn(); const H = f.hess(st.px, st.py); const cl = classify(H);
  const e1 = eigvec(H, cl.l1), e2 = eigvec(H, cl.l2); const L = 1.0; const f0 = f.f(st.px, st.py);
  const curves = [[e1, cl.l1], [e2, cl.l2]].map(([e, lam]) => { const pts = []; for (let i = 0; i <= 80; i += 1) { const s = -L + 2 * L * i / 80; pts.push([s, f.f(st.px + s * e[0], st.py + s * e[1])]); } return { pts, lam }; });
  let lo = f0, hi = f0; for (const c of curves) for (const [, v] of c.pts) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const pad = 0.12 * (hi - lo || 1); lo -= pad; hi += pad;
  const xOf = (s) => inner.x + (s + L) / (2 * L) * inner.w;
  const yOf = (v) => inner.y + inner.h - (v - lo) / (hi - lo) * inner.h;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = col.grid; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  for (const c of curves) { ctx.strokeStyle = c.lam >= 0 ? col.up : col.down; ctx.lineWidth = 2.4; ctx.beginPath(); c.pts.forEach(([s, v], i) => { const X = xOf(s), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); }
  ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(xOf(0), yOf(f0), 4, 0, 6.28); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = curves[0].lam >= 0 ? col.up : col.down; ctx.fillText(`axis 1 (lambda=${cl.l1.toFixed(2)})`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = curves[1].lam >= 0 ? col.up : col.down; ctx.fillText(`axis 2 (lambda=${cl.l2.toFixed(2)})`, inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('step s along each principal axis', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let dragging = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setProbe(e) { const [sx, sy] = ptr(e); st.px = Math.max(-EXT, Math.min(EXT, SCN.wX(sx))); st.py = Math.max(-EXT, Math.min(EXT, SCN.wY(sy))); }
canvas.addEventListener('pointerdown', (e) => { if (!SCN) return; const [sx, sy] = ptr(e); if (sx >= SCN.ox && sx <= SCN.ox + SCN.size && sy >= SCN.oy && sy <= SCN.oy + SCN.size) { dragging = true; setProbe(e); render(); } });
canvas.addEventListener('pointermove', (e) => { if (dragging) { setProbe(e); render(); } });
window.addEventListener('pointerup', () => { dragging = false; });

function boot() {
  if (params.get('func') && FUNCS[params.get('func')]) { st.func = params.get('func'); const c = fn().crit[0]; st.px = c[0]; st.py = c[1]; }
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn(); const [gx, gy] = f.grad(st.px, st.py); const cl = classify(f.hess(st.px, st.py));
  return { fields: [
    { key: 'func', label: 'function', value: f.label, format: 'text' },
    { key: 'grad', label: '|grad f| at probe', value: Math.hypot(gx, gy), format: 'float' },
    { key: 'det', label: 'det Hessian', value: cl.det, format: 'float' },
    { key: 'l1', label: 'eigenvalue 1', value: cl.l1, format: 'float' },
    { key: 'l2', label: 'eigenvalue 2', value: cl.l2, format: 'float' },
    { key: 'type', label: 'type at probe', value: Math.hypot(gx, gy) < 0.02 ? cl.type : 'not critical', format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn();
  // every listed critical point has a vanishing gradient and a consistent class.
  let maxg = 0; for (const [x, y] of f.crit) { const [gx, gy] = f.grad(x, y); maxg = Math.max(maxg, Math.hypot(gx, gy)); }
  const cl = classify(f.hess(st.px, st.py));
  return [
    { key: 'crit', label: 'grad = 0 at the marked points', value: maxg.toExponential(1), status: maxg < 1e-9 ? 'pass' : 'drift' },
    { key: 'eig', label: 'lambda1 lambda2 = det H', value: (cl.l1 * cl.l2).toFixed(3), status: Math.abs(cl.l1 * cl.l2 - cl.det) < 1e-6 ? 'pass' : 'drift' },
  ];
};
