// Vibrating circular drumhead. The scene shows the (m,n) mode displacement as a
// diverging colormap on the disk, oscillating in time, with its nodal circles and
// diameters; the diagnostic is the radial Bessel profile J_m(kr) with its zeros
// (the nodal circles). Canvas2D only.
//
// Reference: Arfken, Weber, Harris, Mathematical Methods for Physicists, 7th ed.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { besselJ, besselZero, nodalRadii, frequencyRatio } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const btnM = document.getElementById('btn-m'), vM = document.getElementById('value-m');
const btnN = document.getElementById('btn-n'), vN = document.getElementById('value-n');
const btnReset = document.getElementById('btn-reset');

const st = { m: 1, n: 2 };
let phase = 0;
const W = 230;
let field = null, fieldKey = '', off = null, offctx = null, maxAbs = 1;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.34 }, { name: 'diag', weight: 0.78 }]); }
function syncVals() { vM.textContent = `m = ${st.m}`; vN.textContent = `n = ${st.n}`; }
btnM.addEventListener('click', () => { st.m = (st.m + 1) % 4; field = null; syncVals(); });
btnN.addEventListener('click', () => { st.n = st.n % 3 + 1; field = null; syncVals(); });
btnReset.addEventListener('click', () => { st.m = 1; st.n = 2; field = null; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', rim: '#e8e8e8', nodal: '#0a0c12', profile: '#b487ff', zero: '#ff5d5d' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function buildField() {
  const key = `${st.m}:${st.n}`; if (fieldKey === key && field) return; fieldKey = key;
  const kmn = besselZero(st.m, st.n); const prof = new Float64Array(257); for (let i = 0; i <= 256; i += 1) prof[i] = besselJ(st.m, kmn * i / 256);
  field = new Float32Array(W * W); maxAbs = 1e-6;
  for (let py = 0; py < W; py += 1) for (let px = 0; px < W; px += 1) {
    const x = (px + 0.5) / W * 2 - 1, y = 1 - (py + 0.5) / W * 2; const r = Math.hypot(x, y);
    if (r > 1) { field[py * W + px] = NaN; continue; }
    const u = prof[Math.min(256, Math.round(r * 256))] * Math.cos(st.m * Math.atan2(y, x)); field[py * W + px] = u; if (Math.abs(u) > maxAbs) maxAbs = Math.abs(u);
  }
  if (!off) { off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(W, W) : Object.assign(document.createElement('canvas'), { width: W, height: W }); offctx = off.getContext('2d'); }
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, `Drumhead mode (m, n) = (${st.m}, ${st.n}): ${st.m} nodal diameters, ${st.n - 1} nodal circles`);
  buildField();
  const side = Math.min(r.w - 28, r.h - 28 - 34); const cx = r.x + r.w / 2, cy = r.y + 28 + (r.h - 28 - 34) / 2; const R = side / 2;
  SC = { cx, cy, R };
  // render the oscillating field into the offscreen, then draw scaled.
  const pc = Math.cos(phase); const img = offctx.createImageData(W, W); const d = img.data;
  for (let i = 0; i < W * W; i += 1) { const u = field[i]; const o = i * 4; if (Number.isNaN(u)) { d[o] = 10; d[o + 1] = 12; d[o + 2] = 18; d[o + 3] = 255; continue; } const t = 0.5 + 0.5 * (u * pc) / maxAbs; const c = rdbu(Math.max(0, Math.min(1, t))); d[o] = c.r; d[o + 1] = c.g; d[o + 2] = c.b; d[o + 3] = 255; }
  offctx.putImageData(img, 0, 0);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off, cx - R, cy - R, side, side); ctx.restore();
  // nodal circles.
  ctx.strokeStyle = 'rgba(10,12,18,0.85)'; ctx.lineWidth = 1.6; for (const rr of nodalRadii(st.m, st.n)) { ctx.beginPath(); ctx.arc(cx, cy, rr * R, 0, 6.28); ctx.stroke(); }
  // nodal diameters (cos(m theta) = 0).
  for (let j = 0; j < 2 * st.m; j += 1) { const th = (Math.PI / 2 + j * Math.PI) / st.m; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(th), cy - R * Math.sin(th)); ctx.stroke(); }
  // rim.
  ctx.strokeStyle = col.rim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.stroke();
  // readout.
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`frequency f / f_01 = ${frequencyRatio(st.m, st.n).toFixed(3)}  (j[${st.m},${st.n}] = ${besselZero(st.m, st.n).toFixed(3)})`, r.x + r.w / 2, r.y + r.h - 9);
}

function drawDiag(col, r) {
  panel(col, r, 'Radial profile J_m(k r): its zeros are the nodal circles, and J_m(k a) = 0 clamps the rim');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 34 };
  const kmn = besselZero(st.m, st.n);
  let lo = Infinity, hi = -Infinity; const ys = []; for (let i = 0; i <= 240; i += 1) { const v = besselJ(st.m, kmn * i / 240); ys.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const pad = 0.12 * (hi - lo); lo -= pad; hi += pad;
  const xOf = (rr) => inner.x + rr * inner.w; const yOf = (v) => inner.y + inner.h * (hi - v) / (hi - lo);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.save(); clipTo(ctx, inner);
  // nodal-circle radii.
  for (const rr of nodalRadii(st.m, st.n)) { ctx.strokeStyle = col.zero; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(rr), inner.y); ctx.lineTo(xOf(rr), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.zero; ctx.beginPath(); ctx.arc(xOf(rr), yOf(0), 4, 0, 6.28); ctx.fill(); }
  // boundary zero at r = 1.
  ctx.fillStyle = col.zero; ctx.beginPath(); ctx.arc(xOf(1), yOf(0), 4, 0, 6.28); ctx.fill();
  // profile.
  ctx.strokeStyle = col.profile; ctx.lineWidth = 2.6; ctx.beginPath(); ys.forEach((v, i) => { const X = xOf(i / 240), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.profile; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`J_${st.m}(j[${st.m},${st.n}] r)`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.zero; ctx.fillText('zeros = nodal circles', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const rr of [0, 0.5, 1]) ctx.fillText(rr.toFixed(1), xOf(rr), inner.y + inner.h + 6);
  ctx.fillText('radius r / a', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let running = true, last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) phase += dt * 1.7; render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('m') !== null) st.m = Math.max(0, Math.min(3, +params.get('m')));
  if (params.get('n') !== null) st.n = Math.max(1, Math.min(3, +params.get('n')));
  syncVals(); relayout();
  if (DETERMINISTIC) { phase = 0.7; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'mode', label: 'mode (m, n)', value: `(${st.m}, ${st.n})`, format: 'text' },
    { key: 'diam', label: 'nodal diameters', value: st.m, format: 'int' },
    { key: 'circ', label: 'nodal circles', value: st.n - 1, format: 'int' },
    { key: 'jmn', label: 'Bessel zero j[m,n]', value: besselZero(st.m, st.n), format: 'float' },
    { key: 'freq', label: 'frequency f / f_01', value: frequencyRatio(st.m, st.n), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const rim = Math.abs(besselJ(st.m, besselZero(st.m, st.n)));
  const ratio = frequencyRatio(st.m, st.n);
  return [
    { key: 'rim', label: 'rim clamped: J_m(k a) = 0', value: rim.toExponential(1), status: rim < 1e-5 ? 'pass' : 'drift' },
    { key: 'inh', label: 'inharmonic: f / f_01 not an integer', value: ratio.toFixed(3), status: Math.abs(ratio - Math.round(ratio)) > 0.02 || (st.m === 0 && st.n === 1) ? 'pass' : 'pending' },
  ];
};
