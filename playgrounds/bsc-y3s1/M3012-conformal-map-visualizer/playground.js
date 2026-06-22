// Conformal maps. The scene shows the z-plane grid and its image in the w-plane
// under an analytic map, with a draggable probe whose perpendicular direction
// cross stays perpendicular (conformal) except at critical points; the diagnostic
// is the local magnification |f'(z)| along the probe's row. Canvas2D only.
//
// Reference: Needham, Visual Complex Analysis, Ch. 4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { FUNCS, cadd, cabs, cmul } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const btnFn = document.getElementById('btn-fn'), vFn = document.getElementById('value-fn');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(FUNCS);
const st = { fn: 'square', z0: [0.7, 0.5] };
function fn() { return FUNCS[st.fn]; }
let wECache = {};

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.28 }, { name: 'diag', weight: 0.84 }]); }
function syncVals() { vFn.textContent = fn().label; }
function pickFn(k) { st.fn = k; st.z0 = [0.7, 0.5]; syncVals(); }
btnFn.addEventListener('click', () => { pickFn(KEYS[(KEYS.indexOf(st.fn) + 1) % KEYS.length]); render(); });
btnReset.addEventListener('click', () => { pickFn('square'); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.28)', vline: '#4ea8ff', hline: '#ff9d3c', probe: '#8de08a', crit: '#ff5d5d', mag: '#b487ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function wExtent() {
  if (wECache[st.fn]) return wECache[st.fn];
  const f = fn(), zE = f.zE; const vals = [];
  for (let i = -10; i <= 10; i += 1) for (let j = -10; j <= 10; j += 1) { const z = [zE * i / 10, zE * j / 10]; if (cabs(z) < 0.06) continue; const w = f.f(z); const m = cabs(w); if (isFinite(m)) vals.push(m); }
  vals.sort((a, b) => a - b); const p = vals[Math.floor(vals.length * 0.86)] || 2; const wE = Math.max(1.2, Math.min(10, p * 1.15));
  wECache[st.fn] = wE; return wE;
}

let ZP = null;
function panelMap(box, ext) { const side = Math.min(box.w, box.h); const cx = box.x + box.w / 2, cy = box.y + box.h / 2; const s = side / 2 / ext; return { cx, cy, s, ext, w2s: (c) => [cx + c[0] * s, cy - c[1] * s], side }; }

function drawComplexPanel(box, ext, f, isImage, col) {
  const M = panelMap(box, ext);
  ctx.save(); clipTo(ctx, box);
  // axes.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; let a = M.w2s([-ext, 0]), b = M.w2s([ext, 0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = M.w2s([0, -ext]); b = M.w2s([0, ext]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  const zE = fn().zE, step = 0.4, NS = 80;
  const line = (paramFn, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.beginPath(); let pen = false;
    for (let t = 0; t <= NS; t += 1) { const z = paramFn(-zE + 2 * zE * t / NS); if (cabs(z) < 0.04) { pen = false; continue; } const c = isImage ? f.f(z) : z; if (!isFinite(c[0]) || !isFinite(c[1]) || cabs(c) > ext * 6) { pen = false; continue; } const p = M.w2s(c); if (pen) ctx.lineTo(p[0], p[1]); else { ctx.moveTo(p[0], p[1]); pen = true; } }
    ctx.stroke();
  };
  for (let k = -Math.round(zE / step) * step; k <= zE + 1e-6; k += step) { line((t) => [k, t], col.vline); line((t) => [t, k], col.hline); }
  ctx.restore();
  return M;
}

function drawScene(col, r) {
  const f = fn();
  panel(col, r, 'z-plane and its image w = f(z): the grid maps, angles stay (drag the probe)');
  const top = r.y + 28, gap = 26; const side = Math.min((r.w - 24 - gap) / 2, r.h - 28 - 40);
  const zbox = { x: r.x + 12, y: top, w: side, h: side }, wbox = { x: r.x + 12 + side + gap, y: top, w: side, h: side };
  ctx.strokeStyle = col.border; ctx.strokeRect(zbox.x, zbox.y, zbox.w, zbox.h); ctx.strokeRect(wbox.x, wbox.y, wbox.w, wbox.h);
  const Mz = drawComplexPanel(zbox, f.zE, f, false, col);
  const Mw = drawComplexPanel(wbox, wExtent(), f, true, col);
  ZP = Mz;
  // critical points and poles in the z-plane.
  for (const c of (f.critical || [])) { const p = Mz.w2s(c); ctx.fillStyle = col.crit; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 6.28); ctx.fill(); }
  for (const c of (f.poles || [])) { const p = Mz.w2s(c); ctx.strokeStyle = col.crit; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0] - 4, p[1] - 4); ctx.lineTo(p[0] + 4, p[1] + 4); ctx.moveTo(p[0] + 4, p[1] - 4); ctx.lineTo(p[0] - 4, p[1] + 4); ctx.stroke(); }
  // probe and its angle cross in both planes.
  const z0 = st.z0, w0 = f.f(z0); const dz = f.zE * 0.16;
  const pz = Mz.w2s(z0); ctx.fillStyle = col.probe; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(pz[0], pz[1], 5, 0, 6.28); ctx.fill(); ctx.stroke();
  const segZ = (dir, color) => { const e = Mz.w2s([z0[0] + dir[0] * dz, z0[1] + dir[1] * dz]); ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pz[0], pz[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); };
  segZ([1, 0], col.vline); segZ([0, 1], col.hline);
  if (isFinite(w0[0]) && isFinite(w0[1])) {
    const pw = Mw.w2s(w0); ctx.fillStyle = col.probe; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(pw[0], pw[1], 5, 0, 6.28); ctx.fill(); ctx.stroke();
    const dfz = f.df(z0); const L = Mw.side * 0.11;
    const segW = (dir, color) => { const id = cmul(dfz, dir); const n = Math.hypot(id[0], id[1]) || 1; const e = [pw[0] + id[0] / n * L, pw[1] - id[1] / n * L]; ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pw[0], pw[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); };
    segW([1, 0], col.vline); segW([0, 1], col.hline);
  }
  // plane labels and readout.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('z-plane', zbox.x + side / 2, zbox.y + side + 4); ctx.fillText('w-plane', wbox.x + side / 2, wbox.y + side + 4);
  const mag = cabs(f.df(z0));
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillStyle = col.probe;
  ctx.fillText(`z = ${z0[0].toFixed(2)} + ${z0[1].toFixed(2)}i   |f'| = ${mag.toFixed(2)}   (angle preserved)`, r.x + r.w / 2, r.y + r.h - 8);
}

function drawDiag(col, r) {
  const f = fn();
  panel(col, r, "Local magnification |f'(z)| along the probe's row (log): zero at critical points, large at poles");
  const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 34 };
  const zE = f.zE, y0 = st.z0[1];
  const xOf = (re) => inner.x + (re + zE) / (2 * zE) * inner.w;
  const lt = 1.4, lb = -2.4;
  const yOf = (m) => inner.y + inner.h * (lt - Math.log10(Math.max(m, 1e-6))) / (lt - lb);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let d = Math.ceil(lb); d <= Math.floor(lt); d += 1) { const Y = yOf(Math.pow(10, d)); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  // |f'| = 1 reference (no magnification).
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(1)); ctx.lineTo(inner.x + inner.w, yOf(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = col.mag; ctx.lineWidth = 2.4; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 360; i += 1) { const re = -zE + 2 * zE * i / 360; const m = cabs(f.df([re, y0])); const Y = yOf(m); if (!isFinite(m)) { pen = false; continue; } if (pen) ctx.lineTo(xOf(re), Y); else { ctx.moveTo(xOf(re), Y); pen = true; } } ctx.stroke();
  // probe marker.
  const mp = cabs(f.df(st.z0)); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.z0[0]), inner.y); ctx.lineTo(xOf(st.z0[0]), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  if (mp > 1e-6) { ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(xOf(st.z0[0]), yOf(mp), 5, 0, 6.28); ctx.fill(); }
  // critical points on this row (if y0 ~ their Im).
  for (const c of (f.critical || [])) if (Math.abs(c[1] - y0) < 0.05) { ctx.strokeStyle = col.crit; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(c[0]), inner.y); ctx.lineTo(xOf(c[0]), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const re of [-zE, 0, zE]) ctx.fillText(re.toFixed(1), xOf(re), inner.y + inner.h + 6);
  ctx.fillText('Re(z) along the probe row', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText("|f'(z)|", 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { if (!ZP) return; const [sx, sy] = ptr(e); if (Math.abs(sx - ZP.cx) < ZP.side / 2 && Math.abs(sy - ZP.cy) < ZP.side / 2) { drag = true; setFrom(sx, sy); } });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; setFrom(...ptr(e)); });
window.addEventListener('pointerup', () => { drag = false; });
function setFrom(sx, sy) { const e = fn().zE; const re = Math.max(-e, Math.min(e, (sx - ZP.cx) / ZP.s)), im = Math.max(-e, Math.min(e, (ZP.cy - sy) / ZP.s)); st.z0 = [re, im]; render(); }

function boot() {
  if (params.get('fn') && FUNCS[params.get('fn')]) pickFn(params.get('fn'));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn(), w0 = f.f(st.z0);
  return { fields: [
    { key: 'fn', label: 'map', value: f.label, format: 'text' },
    { key: 'z', label: 'probe z', value: `${st.z0[0].toFixed(2)} + ${st.z0[1].toFixed(2)}i`, format: 'text' },
    { key: 'w', label: 'image w', value: `${w0[0].toFixed(2)} + ${w0[1].toFixed(2)}i`, format: 'text' },
    { key: 'mag', label: "magnification |f'|", value: cabs(f.df(st.z0)), format: 'float' },
    { key: 'rot', label: "rotation arg(f') deg", value: Math.atan2(f.df(st.z0)[1], f.df(st.z0)[0]) * 180 / Math.PI, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn(); const h = 1e-4;
  const i1 = [f.f(cadd(st.z0, [h, 0]))[0] - f.f(st.z0)[0], f.f(cadd(st.z0, [h, 0]))[1] - f.f(st.z0)[1]];
  const i2 = [f.f(cadd(st.z0, [0, h]))[0] - f.f(st.z0)[0], f.f(cadd(st.z0, [0, h]))[1] - f.f(st.z0)[1]];
  let ang = Math.atan2(i2[1], i2[0]) - Math.atan2(i1[1], i1[0]); while (ang > Math.PI) ang -= 2 * Math.PI; while (ang < -Math.PI) ang += 2 * Math.PI;
  const mag = cabs(f.df(st.z0));
  return [
    { key: 'angle', label: 'right angle preserved (conformal)', value: `${(Math.abs(ang) * 180 / Math.PI).toFixed(1)} deg`, status: Math.abs(Math.abs(ang) - Math.PI / 2) < 0.05 ? 'pass' : 'pending' },
    { key: 'mag', label: "magnification |f'| (0 = critical point)", value: mag.toFixed(3), status: mag > 1e-3 ? 'pass' : 'pending' },
  ];
};
