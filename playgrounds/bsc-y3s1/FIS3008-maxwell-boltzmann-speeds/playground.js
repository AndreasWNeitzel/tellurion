// The Maxwell-Boltzmann speed distribution. The scene is a box of gas molecules
// moving with MB-distributed speeds, coloured slow-blue to fast-red; the diagnostic
// accumulates sampled speeds into a histogram that converges to f(v), with the
// most-probable, mean, and rms speeds marked. Canvas2D only.
//
// Reference: Reif, Fundamentals of Statistical and Thermal Physics, Sec. 7.9-7.10.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { mbPdf, vMostProbable, vMean, vRms, speedScale, sampleSpeed, makeRng } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sT = document.getElementById('s-T'), vT = document.getElementById('v-T');
const sM = document.getElementById('s-m'), vM = document.getElementById('v-m');
const btnReset = document.getElementById('btn-reset');

const DEF = { T: 1.5, m: 1 };
const st = { T: DEF.T, m: DEF.m };
let mols = [], hist = null, rng = makeRng(0xC0FFEE);

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.16 }, { name: 'diag', weight: 1.04 }]); }
function syncVals() { sT.value = st.T; vT.textContent = st.T.toFixed(2); sM.value = st.m; vM.textContent = st.m.toFixed(2); }
function vmax() { return 4.2 * speedScale(st.T, st.m); }
function reseed() { mols = []; for (let i = 0; i < 54; i += 1) { const v = sampleSpeed(st.T, st.m, rng), th = rng() * 6.2832; mols.push({ x: rng(), y: rng(), vx: v * Math.cos(th), vy: v * Math.sin(th), v }); } hist = { bins: new Float64Array(64), total: 0, dv: vmax() / 64 }; }
btnReset.addEventListener('click', () => { Object.assign(st, DEF); rng = makeRng(0xC0FFEE); reseed(); syncVals(); });
sT.addEventListener('input', () => { st.T = +sT.value; reseed(); syncVals(); });
sM.addEventListener('input', () => { st.m = +sM.value; reseed(); syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', box: '#0c1018', hist: 'rgba(78,168,255,0.4)', histEdge: '#4ea8ff', curve: '#ffd166', vp: '#8de08a', vavg: '#ff9d3c', vrms: '#ff5d5d' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function speedColor(v) { const t = Math.max(0, Math.min(1, v / (2.6 * speedScale(st.T, st.m)))); const c = rdbu(1 - t); return `rgb(${c.r},${c.g},${c.b})`; }

function drawScene(col, r) {
  panel(col, r, 'A gas at temperature T: molecules coloured by speed (blue slow, red fast)');
  const side = Math.min(r.w - 28, r.h - 28 - 30); const bx = r.x + (r.w - side) / 2, by = r.y + 28; const B = { x: bx, y: by, s: side };
  ctx.fillStyle = col.box; ctx.fillRect(bx, by, side, side); ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(bx, by, side, side);
  ctx.save(); clipTo(ctx, { x: bx, y: by, w: side, h: side });
  for (const p of mols) { const X = bx + p.x * side, Y = by + p.y * side; const vsc = 0.06 * side / Math.max(1, speedScale(st.T, st.m)); ctx.strokeStyle = speedColor(p.v); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - p.vx * vsc, Y - p.vy * vsc); ctx.stroke(); ctx.fillStyle = speedColor(p.v); ctx.beginPath(); ctx.arc(X, Y, 2.6, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // speed colour legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`v_rms = ${vRms(st.T, st.m).toFixed(2)}  (a = sqrt(kT/m) = ${speedScale(st.T, st.m).toFixed(2)})`, bx + side / 2, by + side + 6);
}

function drawDiag(col, r) {
  panel(col, r, 'Speed distribution f(v): sampled histogram converging to Maxwell-Boltzmann');
  const inner = { x: r.x + 18, y: r.y + 28, w: r.w - 36, h: r.h - 28 - 36 };
  const vm = vmax(); const xOf = (v) => inner.x + v / vm * inner.w;
  // peak of f(v) for scaling.
  let fmax = 0; for (let i = 0; i <= 200; i += 1) fmax = Math.max(fmax, mbPdf(vm * i / 200, st.T, st.m)); fmax *= 1.18;
  const yOf = (d) => inner.y + inner.h * (1 - d / fmax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // histogram (density).
  if (hist && hist.total > 0) { const bw = inner.w / hist.bins.length; for (let i = 0; i < hist.bins.length; i += 1) { const d = hist.bins[i] / (hist.total * hist.dv); if (d <= 0) continue; ctx.fillStyle = col.hist; ctx.fillRect(inner.x + i * bw, yOf(d), Math.max(1, bw - 1), inner.y + inner.h - yOf(d)); } }
  // f(v) curve.
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const v = vm * i / 300; const Y = yOf(mbPdf(v, st.T, st.m)); i ? ctx.lineTo(xOf(v), Y) : ctx.moveTo(xOf(v), Y); } ctx.stroke();
  // characteristic speeds.
  const speeds = [[vMostProbable(st.T, st.m), col.vp, 'v_p'], [vMean(st.T, st.m), col.vavg, 'v_avg'], [vRms(st.T, st.m), col.vrms, 'v_rms']];
  for (const [v, c] of speeds) { ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xOf(v), inner.y); ctx.lineTo(xOf(v), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  // labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  speeds.forEach(([v, c, lab], i) => { ctx.fillStyle = c; ctx.fillText(lab, xOf(v), inner.y + inner.h + 6 + (i % 2) * 13); });
  ctx.fillStyle = col.curve; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Maxwell-Boltzmann f(v)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.histEdge; ctx.fillText(`sampled (${hist ? hist.total : 0})`, inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('speed v', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function advance(dt) {
  const sc = 0.42 / Math.max(1, speedScale(st.T, st.m));
  for (const p of mols) { p.x += p.vx * sc * dt; p.y += p.vy * sc * dt; if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); } if (p.x > 1) { p.x = 1; p.vx = -Math.abs(p.vx); } if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); } if (p.y > 1) { p.y = 1; p.vy = -Math.abs(p.vy); } }
  // accumulate sampled speeds into the histogram.
  if (hist) for (let i = 0; i < 28; i += 1) { const v = sampleSpeed(st.T, st.m, rng); const b = Math.floor(v / hist.dv); if (b >= 0 && b < hist.bins.length) hist.bins[b] += 1; hist.total += 1; }
}

let running = true, last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('T')) st.T = Math.max(0.3, Math.min(4, +params.get('T')));
  if (params.get('m')) st.m = Math.max(0.3, Math.min(3, +params.get('m')));
  reseed(); syncVals(); relayout();
  if (DETERMINISTIC) { for (let i = 0; i < 240; i += 1) advance(0.03); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'T', label: 'temperature T', value: st.T, format: 'float' },
    { key: 'm', label: 'molecular mass m', value: st.m, format: 'float' },
    { key: 'vp', label: 'most probable v_p', value: vMostProbable(st.T, st.m), format: 'float' },
    { key: 'vavg', label: 'mean v_avg', value: vMean(st.T, st.m), format: 'float' },
    { key: 'vrms', label: 'rms v_rms', value: vRms(st.T, st.m), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const vp = vMostProbable(st.T, st.m), va = vMean(st.T, st.m), vr = vRms(st.T, st.m);
  return [
    { key: 'order', label: 'v_p < v_avg < v_rms', value: `${vp.toFixed(2)} < ${va.toFixed(2)} < ${vr.toFixed(2)}`, status: vp < va && va < vr ? 'pass' : 'drift' },
    { key: 'ratio', label: 'ratios sqrt2 : sqrt(8/pi) : sqrt3', value: `${(va / vp).toFixed(3)}, ${(vr / vp).toFixed(3)}`, status: Math.abs(va / vp - Math.sqrt(4 / Math.PI)) < 1e-6 ? 'pass' : 'drift' },
  ];
};
