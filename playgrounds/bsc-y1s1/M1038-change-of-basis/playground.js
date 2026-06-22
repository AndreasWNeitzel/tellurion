// Change of basis. The scene draws a vector with the standard grid and a draggable
// skew-basis grid, decomposing v = c1 b1 + c2 b2; the diagnostic plots the
// coordinates of a rotating vector in each basis, showing the same arrow gets
// different (still sinusoidal) coordinates. Canvas2D only.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Sec. 7.2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { det2, coordsInBasis, reconstruct } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selPre = document.getElementById('select-preset');
const btnReset = document.getElementById('btn-reset');

const PRESETS = [
  { label: 'skew', b1: [1.3, 0.4], b2: [-0.3, 1.1] },
  { label: 'rotated orthonormal', b1: [0.92, 0.38], b2: [-0.38, 0.92] },
  { label: 'stretched', b1: [1.8, 0], b2: [0, 0.7] },
  { label: 'sheared', b1: [1, 0], b2: [0.9, 1] },
];
let pre = 0;
const st = { b1: [...PRESETS[0].b1], b2: [...PRESETS[0].b2], v: [1.7, 1.25] };

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.42 }, { name: 'diag', weight: 0.82 }]); }
function syncVals() { selPre.value = pre >= 0 ? String(pre) : 'custom'; }
selPre.addEventListener('change', () => { if (selPre.value === 'custom') return; pre = +selPre.value; st.b1 = [...PRESETS[pre].b1]; st.b2 = [...PRESETS[pre].b2]; syncVals(); render(); });
btnReset.addEventListener('click', () => { pre = 0; st.b1 = [...PRESETS[0].b1]; st.b2 = [...PRESETS[0].b2]; st.v = [1.7, 1.25]; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', stdgrid: 'rgba(255,255,255,0.06)', bgrid: 'rgba(120,150,200,0.32)', axis: 'rgba(255,255,255,0.3)', v: '#ffd166', b1: '#ff5d5d', b2: '#5bd6a8', comp: 'rgba(255,209,102,0.55)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, 'The same vector in two bases (drag the red/green basis vectors or the vector)');
  const cx = r.x + r.w * 0.5, cy = r.y + 26 + (r.h - 26) * 0.5, S = Math.min(r.w, r.h - 26) * 0.13;
  SC = { cx, cy, S };
  const w2s = (p) => [cx + p[0] * S, cy - p[1] * S];
  const R = 5;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 20, w: r.w, h: r.h - 20 });
  // standard grid (faint).
  ctx.strokeStyle = col.stdgrid; ctx.lineWidth = 1; for (let k = -R; k <= R; k += 1) { let a = w2s([k, -R]), b = w2s([k, R]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = w2s([-R, k]); b = w2s([R, k]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  // skew-basis grid: lines of constant B-coordinate.
  ctx.strokeStyle = col.bgrid; ctx.lineWidth = 1; const T = 7;
  for (let m = -T; m <= T; m += 1) {
    let a = [m * st.b1[0] - T * st.b2[0], m * st.b1[1] - T * st.b2[1]], b = [m * st.b1[0] + T * st.b2[0], m * st.b1[1] + T * st.b2[1]]; let pa = w2s(a), pb = w2s(b); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    a = [m * st.b2[0] - T * st.b1[0], m * st.b2[1] - T * st.b1[1]]; b = [m * st.b2[0] + T * st.b1[0], m * st.b2[1] + T * st.b1[1]]; pa = w2s(a); pb = w2s(b); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
  }
  // axes.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1.1; let a = w2s([-R, 0]), b = w2s([R, 0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = w2s([0, -R]); b = w2s([0, R]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  // decomposition v = c1 b1 + c2 b2.
  const c = coordsInBasis(st.b1, st.b2, st.v); const o = w2s([0, 0]); const m1 = w2s([c[0] * st.b1[0], c[0] * st.b1[1]]); const vp = w2s(st.v);
  ctx.strokeStyle = col.comp; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(m1[0], m1[1]); ctx.lineTo(vp[0], vp[1]); ctx.stroke(); ctx.setLineDash([]);
  // basis vectors and v.
  arrow(col.b1, o, w2s(st.b1), 'b1'); arrow(col.b2, o, w2s(st.b2), 'b2'); arrow(col.v, o, vp, 'v', 3);
  ctx.restore();
  // readout strip.
  const d = det2(st.b1, st.b2);
  const items = [[`v_std = (${st.v[0].toFixed(2)}, ${st.v[1].toFixed(2)})`, col.v], [`v_B = (${c[0].toFixed(2)}, ${c[1].toFixed(2)})`, '#9fc0ff'], [`det P = ${d.toFixed(2)}`, col.muted]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, cc], i) => { ctx.fillStyle = cc; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 9); });
}
function arrow(color, o, tip, label, lw) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.4;
  ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  const ang = Math.atan2(tip[1] - o[1], tip[0] - o[0]);
  ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(tip[0] - 10 * Math.cos(ang - 0.4), tip[1] - 10 * Math.sin(ang - 0.4)); ctx.lineTo(tip[0] - 10 * Math.cos(ang + 0.4), tip[1] - 10 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(tip[0], tip[1], 6, 0, 6.28); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = color; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, tip[0] + 8, tip[1] - 6);
}

function drawDiag(col, r) {
  panel(col, r, 'Coordinates of a rotating vector: skew-basis components vs standard');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 34 };
  const rad = Math.hypot(st.v[0], st.v[1]) || 1;
  const N = 240; const c1s = [], c2s = [];
  let mx = rad; for (let i = 0; i <= N; i += 1) { const phi = 2 * Math.PI * i / N; const c = coordsInBasis(st.b1, st.b2, [rad * Math.cos(phi), rad * Math.sin(phi)]); c1s.push(c[0]); c2s.push(c[1]); mx = Math.max(mx, Math.abs(c[0]), Math.abs(c[1])); }
  mx *= 1.12;
  const xOf = (i) => inner.x + i / N * inner.w; const yOf = (v) => inner.y + inner.h * (1 - (v + mx) / (2 * mx));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.save(); clipTo(ctx, inner);
  // standard coords (faint reference): r cos, r sin.
  ctx.strokeStyle = 'rgba(255,209,102,0.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); for (let i = 0; i <= N; i += 1) { const Y = yOf(rad * Math.cos(2 * Math.PI * i / N)); i ? ctx.lineTo(xOf(i), Y) : ctx.moveTo(xOf(i), Y); } ctx.stroke();
  ctx.beginPath(); for (let i = 0; i <= N; i += 1) { const Y = yOf(rad * Math.sin(2 * Math.PI * i / N)); i ? ctx.lineTo(xOf(i), Y) : ctx.moveTo(xOf(i), Y); } ctx.stroke(); ctx.setLineDash([]);
  // B coords.
  ctx.strokeStyle = col.b1; ctx.lineWidth = 2.4; ctx.beginPath(); c1s.forEach((v, i) => { const Y = yOf(v); i ? ctx.lineTo(xOf(i), Y) : ctx.moveTo(xOf(i), Y); }); ctx.stroke();
  ctx.strokeStyle = col.b2; ctx.lineWidth = 2.4; ctx.beginPath(); c2s.forEach((v, i) => { const Y = yOf(v); i ? ctx.lineTo(xOf(i), Y) : ctx.moveTo(xOf(i), Y); }); ctx.stroke();
  // current vector angle marker.
  let phi0 = Math.atan2(st.v[1], st.v[0]); if (phi0 < 0) phi0 += 2 * Math.PI; const i0 = phi0 / (2 * Math.PI) * N;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(i0), inner.y); ctx.lineTo(xOf(i0), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  const cc = coordsInBasis(st.b1, st.b2, st.v);
  ctx.fillStyle = col.b1; ctx.beginPath(); ctx.arc(xOf(i0), yOf(cc[0]), 4, 0, 6.28); ctx.fill(); ctx.fillStyle = col.b2; ctx.beginPath(); ctx.arc(xOf(i0), yOf(cc[1]), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.b1; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('c1 (along b1)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.b2; ctx.fillText('c2 (along b2)', inner.x + 6, inner.y + 18);
  ctx.fillStyle = 'rgba(255,209,102,0.7)'; ctx.fillText('standard x, y (dashed)', inner.x + 6, inner.y + 32);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('direction of v swept around the circle', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = null;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function w2s(p) { return [SC.cx + p[0] * SC.S, SC.cy - p[1] * SC.S]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return;
  const cand = [['b1', st.b1], ['b2', st.b2], ['v', st.v]]; let best = null, bd = 18;
  for (const [k, vec] of cand) { const s = w2s(vec); const d = Math.hypot(sx - s[0], sy - s[1]); if (d < bd) { bd = d; best = k; } }
  if (best) { drag = best; setFrom(sx, sy); }
});
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [sx, sy] = ptr(e); setFrom(sx, sy); });
window.addEventListener('pointerup', () => { drag = null; });
function setFrom(sx, sy) { const wx = (sx - SC.cx) / SC.S, wy = (SC.cy - sy) / SC.S; const p = [Math.max(-5, Math.min(5, wx)), Math.max(-5, Math.min(5, wy))]; if (drag === 'b1') { st.b1 = p; pre = -1; selPre.value = 'custom'; } else if (drag === 'b2') { st.b2 = p; pre = -1; selPre.value = 'custom'; } else st.v = p; render(); }

function boot() {
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const c = coordsInBasis(st.b1, st.b2, st.v);
  return { fields: [
    { key: 'v', label: 'v (standard)', value: `(${st.v[0].toFixed(2)}, ${st.v[1].toFixed(2)})`, format: 'text' },
    { key: 'b1', label: 'b1', value: `(${st.b1[0].toFixed(2)}, ${st.b1[1].toFixed(2)})`, format: 'text' },
    { key: 'b2', label: 'b2', value: `(${st.b2[0].toFixed(2)}, ${st.b2[1].toFixed(2)})`, format: 'text' },
    { key: 'vB', label: 'v in basis B', value: `(${c[0].toFixed(2)}, ${c[1].toFixed(2)})`, format: 'text' },
    { key: 'det', label: 'det P (cell area)', value: det2(st.b1, st.b2), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const c = coordsInBasis(st.b1, st.b2, st.v); const rc = reconstruct(st.b1, st.b2, c);
  const err = Math.hypot(rc[0] - st.v[0], rc[1] - st.v[1]); const d = det2(st.b1, st.b2);
  return [
    { key: 'recon', label: 'c1 b1 + c2 b2 = v', value: err.toExponential(1), status: err < 1e-9 ? 'pass' : 'drift' },
    { key: 'basis', label: 'basis is non-degenerate (det P != 0)', value: d.toFixed(2), status: Math.abs(d) > 1e-3 ? 'pass' : 'drift' },
  ];
};
