// Legendre multipoles. The scene draws the angular shape P_l(cos theta) as a polar
// lobe diagram (axisymmetric about the vertical axis), coloured by sign, with the
// nodal cones; a sweeping probe ties the lobe radius to the polynomial. The
// diagnostic is P_l(x) on [-1,1] with its l roots. Canvas2D only.
//
// Reference: Jackson, Classical Electrodynamics, 3rd ed., Sec. 3.2-3.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { legendreP, legendreRoots, angular, nodalAngles } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selL = document.getElementById('select-l');
const btnReset = document.getElementById('btn-reset');

const NAMES = ['monopole', 'dipole', 'quadrupole', 'octupole', 'hexadecapole', 'l = 5'];
const st = { l: 2 };
let sweep = 0;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.4 }, { name: 'diag', weight: 0.72 }]); }
function syncVals() { selL.value = String(st.l); }
selL.addEventListener('change', () => { st.l = +selL.value; syncVals(); });
btnReset.addEventListener('click', () => { st.l = 2; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.25)', pos: '#ff5d5d', neg: '#5b8cff', node: 'rgba(255,255,255,0.4)', probe: '#8de08a', curve: '#b487ff', root: '#ffd166' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, `Angular shape P_${st.l}(cos theta): the ${NAMES[st.l]} (lobes around the vertical axis)`);
  const side = Math.min(r.w - 28, r.h - 28 - 34); const cx = r.x + r.w / 2, cy = r.y + 28 + (r.h - 28 - 34) / 2; const S = side * 0.42;
  SC = { cx, cy, S, side };
  const pt = (th, sgn) => [cx + sgn * Math.abs(legendreP(st.l, Math.cos(th))) * Math.sin(th) * S, cy - Math.abs(legendreP(st.l, Math.cos(th))) * Math.cos(th) * S];
  ctx.save(); clipTo(ctx, { x: cx - side / 2, y: cy - side / 2, w: side, h: side });
  // symmetry axis (z).
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, cy - side / 2); ctx.lineTo(cx, cy + side / 2); ctx.stroke(); ctx.setLineDash([]);
  // build sign runs over theta in [0, pi].
  const NS = 260; const runs = []; let cur = null;
  for (let i = 0; i <= NS; i += 1) { const th = Math.PI * i / NS; const v = legendreP(st.l, Math.cos(th)); const s = v >= 0 ? 1 : -1; if (!cur || cur.s !== s) { if (cur) runs.push(cur); cur = { s, th: [] }; } cur.th.push(th); }
  if (cur) runs.push(cur);
  // draw lobes (both sides), filled by sign.
  for (const sgn of [1, -1]) for (const run of runs) {
    ctx.fillStyle = run.s > 0 ? 'rgba(255,93,93,0.5)' : 'rgba(91,140,255,0.5)'; ctx.strokeStyle = run.s > 0 ? col.pos : col.neg; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, cy); for (const th of run.th) { const p = pt(th, sgn); ctx.lineTo(p[0], p[1]); } ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // nodal cones.
  for (const th of nodalAngles(st.l)) for (const sgn of [1, -1]) { ctx.strokeStyle = col.node; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sgn * Math.sin(th) * side * 0.5, cy - Math.cos(th) * side * 0.5); ctx.stroke(); ctx.setLineDash([]); }
  // sweep probe.
  const ps = pt(sweep, 1); ctx.strokeStyle = col.probe; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(sweep) * side * 0.48, cy - Math.cos(sweep) * side * 0.48); ctx.stroke();
  ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(ps[0], ps[1], 5, 0, 6.28); ctx.fill();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('z (axis)', cx, cy - side / 2 - 0);
  ctx.fillStyle = col.pos; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('+ lobe', cx - side / 2 + 4, cy - side / 2 + 2); ctx.fillStyle = col.neg; ctx.fillText('- lobe', cx - side / 2 + 4, cy - side / 2 + 16);
  ctx.fillStyle = col.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText(`${nodalAngles(st.l).length} nodal cone${nodalAngles(st.l).length === 1 ? '' : 's'},  ${st.l + 1} lobes`, cx, r.y + r.h - 9);
}

function drawDiag(col, r) {
  panel(col, r, 'Legendre polynomial P_l(x), x = cos theta: its l roots are the nodal cones');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 34 };
  const xOf = (x) => inner.x + (x + 1) / 2 * inner.w; const yOf = (v) => inner.y + inner.h * (1.15 - v) / 2.3;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.save(); clipTo(ctx, inner);
  // roots.
  for (const x of legendreRoots(st.l)) { ctx.strokeStyle = col.root; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(x), inner.y); ctx.lineTo(xOf(x), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.root; ctx.beginPath(); ctx.arc(xOf(x), yOf(0), 4, 0, 6.28); ctx.fill(); }
  // curve.
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 240; i += 1) { const x = -1 + 2 * i / 240; const X = xOf(x), Y = yOf(legendreP(st.l, x)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  // endpoints P(1)=1, P(-1)=(-1)^l.
  ctx.fillStyle = col.fg; ctx.beginPath(); ctx.arc(xOf(1), yOf(1), 3.5, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.arc(xOf(-1), yOf((-1) ** st.l), 3.5, 0, 6.28); ctx.fill();
  // sweep marker at x = cos(sweep).
  const xs = Math.cos(sweep); ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(xOf(xs), yOf(legendreP(st.l, xs)), 5, 0, 6.28); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.curve; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`P_${st.l}(x)`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.root; ctx.fillText(`${legendreRoots(st.l).length} roots`, inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of [-1, 0, 1]) ctx.fillText(`${x}`, xOf(x), inner.y + inner.h + 6);
  ctx.fillText('x = cos theta', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let running = true, last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) { sweep += dt * 0.9; if (sweep > Math.PI) sweep -= Math.PI; } render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('l') !== null) st.l = Math.max(0, Math.min(5, +params.get('l')));
  syncVals(); relayout();
  if (DETERMINISTIC) { sweep = Math.PI * 0.3; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'l', label: 'multipole l', value: st.l, format: 'int' },
    { key: 'name', label: 'name', value: NAMES[st.l], format: 'text' },
    { key: 'cones', label: 'nodal cones', value: nodalAngles(st.l).length, format: 'int' },
    { key: 'lobes', label: 'lobes', value: st.l + 1, format: 'int' },
    { key: 'val', label: 'P_l(cos theta) at probe', value: angular(st.l, sweep), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const roots = legendreRoots(st.l);
  return [
    { key: 'cones', label: 'P_l has l nodal cones', value: `${roots.length}`, status: roots.length === st.l ? 'pass' : 'drift' },
    { key: 'ends', label: 'P_l(1) = 1, P_l(-1) = (-1)^l', value: `${legendreP(st.l, 1).toFixed(2)}, ${legendreP(st.l, -1).toFixed(2)}`, status: Math.abs(legendreP(st.l, 1) - 1) < 1e-6 && Math.abs(legendreP(st.l, -1) - (-1) ** st.l) < 1e-6 ? 'pass' : 'drift' },
  ];
};
