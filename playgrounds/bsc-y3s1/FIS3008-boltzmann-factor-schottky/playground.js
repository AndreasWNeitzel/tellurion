// The Boltzmann factor and the Schottky anomaly. The scene shows a two-level system
// with particles redistributing between the ground and excited levels as the
// temperature sweeps, beside the population bars. The diagnostic plots the heat
// capacity against kT/Delta, the Schottky peak, with the mean energy overlaid.
// Canvas2D only.
//
// Reference: Reif, Fundamentals of Statistical and Thermal Physics, Ch. 6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { popExcited, popGround, meanEnergy, heatCapacity, schottkyPeak } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sD = document.getElementById('s-d'), vD = document.getElementById('v-d');
const sG = document.getElementById('s-g'), vG = document.getElementById('v-g');
const btnSweep = document.getElementById('btn-sweep'), btnReset = document.getElementById('btn-reset');

const NPART = 18;
const st = { Delta: 1.0, g1: 1, g0: 1, T: 1.0, sweep: true };
let frame = 0, running = true;
function tmax() { return 2.3 * st.Delta; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.12 }, { name: 'diag', weight: 0.98 }]); }
function syncVals() { sD.value = st.Delta; vD.textContent = st.Delta.toFixed(2); sG.value = st.g1; vG.textContent = `${st.g1} : 1`; }
function setSweep(on) { st.sweep = on; btnSweep.textContent = `Sweep T: ${on ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(on)); }
btnReset.addEventListener('click', () => { st.Delta = 1.0; st.g1 = 1; st.T = 1.0; setSweep(false); syncVals(); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sD.addEventListener('input', () => { st.Delta = +sD.value; syncVals(); if (!running) render(); });
sG.addEventListener('input', () => { st.g1 = Math.round(+sG.value); syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    ground: '#5ea8ff', excited: '#ff9d3c', level: 'rgba(255,255,255,0.5)', C: '#8de08a', E: '#c98cff', cursor: '#ffd24a', peak: 'rgba(141,224,138,0.55)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function dotGrid(cx, yline, count, color, above) {
  // lay `count` dots in rows of up to 6, stacked away from the level line.
  const per = 6, gap = 13, rgap = 13;
  for (let k = 0; k < count; k += 1) {
    const row = Math.floor(k / per), inRow = Math.min(per, count - row * per);
    const col0 = k % per;
    const x = cx + (col0 - (inRow - 1) / 2) * gap;
    const y = yline + (above ? -1 : 1) * (10 + row * rgap);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fill();
  }
}

function drawScene(col, r) {
  const p1 = popExcited(st.T, st.Delta, st.g0, st.g1), p0 = popGround(st.T, st.Delta, st.g0, st.g1);
  panel(col, r, `Two-level system:  gap Delta = ${st.Delta.toFixed(2)},  degeneracy g1:g0 = ${st.g1}:1,  T = ${st.T.toFixed(2)} (kT/Delta = ${(st.T / st.Delta).toFixed(2)})`);
  const inner = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 10 };
  const diag = { x: inner.x + 40, y: inner.y + 8, w: inner.w * 0.6 - 40, h: inner.h - 8 };
  const yE = diag.y + diag.h * 0.30, yG = diag.y + diag.h * 0.82;
  // energy axis.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(diag.x, diag.y + 4); ctx.lineTo(diag.x, diag.y + diag.h); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('E', diag.x - 6, diag.y + 8);
  // level lines.
  ctx.strokeStyle = col.excited; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(diag.x + 6, yE); ctx.lineTo(diag.x + diag.w, yE); ctx.stroke();
  ctx.strokeStyle = col.ground; ctx.beginPath(); ctx.moveTo(diag.x + 6, yG); ctx.lineTo(diag.x + diag.w, yG); ctx.stroke();
  ctx.fillStyle = col.excited; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('E = Delta', diag.x + 8, yE - 4);
  ctx.fillStyle = col.ground; ctx.fillText('E = 0', diag.x + 8, yG - 4);
  ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.fillText(`g1 = ${st.g1}`, diag.x + diag.w - 22, yE - 4);
  // gap arrow.
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(diag.x + diag.w - 16, yE); ctx.lineTo(diag.x + diag.w - 16, yG); ctx.stroke(); ctx.setLineDash([]);
  // particles.
  const n1 = Math.round(NPART * p1), n0 = NPART - n1, cx = diag.x + diag.w * 0.6;
  dotGrid(cx, yG, n0, col.ground, true);
  dotGrid(cx, yE, n1, col.excited, false);

  // population bars (right).
  const bx = inner.x + inner.w * 0.66, bw = inner.w * 0.32;
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = col.excited; ctx.fillText(`p(excited) = ${p1.toFixed(3)}`, bx, inner.y + 24);
  ctx.fillStyle = col.excited; ctx.globalAlpha = 0.85; ctx.fillRect(bx, inner.y + 28, bw * p1, 26); ctx.globalAlpha = 1;
  ctx.strokeStyle = col.border; ctx.strokeRect(bx, inner.y + 28, bw, 26);
  ctx.fillStyle = col.ground; ctx.textBaseline = 'bottom'; ctx.fillText(`p(ground) = ${p0.toFixed(3)}`, bx, inner.y + 92);
  ctx.fillStyle = col.ground; ctx.globalAlpha = 0.85; ctx.fillRect(bx, inner.y + 96, bw * p0, 26); ctx.globalAlpha = 1;
  ctx.strokeStyle = col.border; ctx.strokeRect(bx, inner.y + 96, bw, 26);
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'top';
  ctx.fillText(`<E> / Delta = ${(meanEnergy(st.T, st.Delta, st.g0, st.g1) / st.Delta).toFixed(3)}`, bx, inner.y + 140);
  ctx.fillStyle = col.muted; ctx.fillText(`high-T: p1 -> ${(st.g1 / (st.g0 + st.g1)).toFixed(2)}`, bx, inner.y + 158);
  ctx.fillText('cold: all ground', bx, inner.y + 176);
  ctx.fillText('hot: g1:g0 ratio', bx, inner.y + 194);
}

function drawDiag(col, r) {
  panel(col, r, 'Heat capacity C/k vs kT/Delta: the Schottky anomaly (a peak), with the mean energy overlaid');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const xhi = 2.3, yhi = 1.3;
  const xOf = (xr) => inner.x + xr / xhi * inner.w, yOf = (v) => inner.y + inner.h * (1 - v / yhi);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, 0.25, 0.5, 0.75, 1.0, 1.25]) { const Y = yOf(v); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(v.toFixed(2), inner.x - 5, Y); }
  const pk = schottkyPeak(st.Delta, st.g0, st.g1);
  ctx.save(); clipTo(ctx, inner);
  // peak marker.
  ctx.strokeStyle = col.peak; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(pk.ratio), inner.y); ctx.lineTo(xOf(pk.ratio), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  // heat capacity.
  ctx.strokeStyle = col.C; ctx.lineWidth = 2.8; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const xr = xhi * i / 300; const T = xr * st.Delta; const Y = yOf(heatCapacity(T, st.Delta, st.g0, st.g1)); i ? ctx.lineTo(xOf(xr), Y) : ctx.moveTo(xOf(xr), Y); } ctx.stroke();
  // mean energy / Delta.
  ctx.strokeStyle = col.E; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const xr = xhi * i / 300; const T = xr * st.Delta; const Y = yOf(meanEnergy(T, st.Delta, st.g0, st.g1) / st.Delta); i ? ctx.lineTo(xOf(xr), Y) : ctx.moveTo(xOf(xr), Y); } ctx.stroke(); ctx.setLineDash([]);
  // cursor.
  const xc = st.T / st.Delta; ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(xc), inner.y); ctx.lineTo(xOf(xc), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.C; ctx.beginPath(); ctx.arc(xOf(xc), yOf(heatCapacity(st.T, st.Delta, st.g0, st.g1)), 4.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.E; ctx.beginPath(); ctx.arc(xOf(xc), yOf(meanEnergy(st.T, st.Delta, st.g0, st.g1) / st.Delta), 4.5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.C; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('C / k (heat capacity)', inner.x + inner.w - 8, inner.y + 6);
  ctx.fillStyle = col.E; ctx.fillText('<E> / Delta', inner.x + inner.w - 8, inner.y + 20);
  ctx.fillStyle = col.peak; ctx.textAlign = 'left'; ctx.fillText(`peak ${pk.ratio.toFixed(2)}`, xOf(pk.ratio) + 6, inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'top'; for (let k = 0; k <= 4; k += 1) { const xr = xhi * k / 4; ctx.fillText(xr.toFixed(1), xOf(xr), inner.y + inner.h + 6); } ctx.fillText('kT / Delta', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (st.sweep) st.T = Math.max(0.05, tmax() * (0.5 + 0.46 * Math.sin(frame * 0.012))); render(); if (running) requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { const [, py] = ptr(e); if (!REG || py < REG.diag.y) return; setSweep(false); drag = true; setTfromDiag(e); });
canvas.addEventListener('pointermove', (e) => { if (drag) setTfromDiag(e); });
window.addEventListener('pointerup', () => { drag = false; });
function setTfromDiag(e) { const [px] = ptr(e); const inner = { x: REG.diag.x + 44, w: REG.diag.w - 44 - 16 }; const xr = Math.max(0.02, Math.min(2.3, (px - inner.x) / inner.w * 2.3)); st.T = xr * st.Delta; if (!running) render(); }

function boot() {
  if (params.get('Delta')) st.Delta = Math.max(0.4, Math.min(3, +params.get('Delta')));
  if (params.get('g1')) st.g1 = Math.max(1, Math.min(4, Math.round(+params.get('g1'))));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.sweep = false; setSweep(false); st.T = 1.0 * st.Delta; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'Delta', label: 'gap Delta', value: st.Delta, format: 'float' },
    { key: 'g1', label: 'excited degeneracy g1', value: st.g1, format: 'float' },
    { key: 'T', label: 'temperature kT', value: st.T, format: 'float' },
    { key: 'p1', label: 'excited population', value: popExcited(st.T, st.Delta, st.g0, st.g1), format: 'float' },
    { key: 'E', label: 'mean energy <E>/Delta', value: meanEnergy(st.T, st.Delta, st.g0, st.g1) / st.Delta, format: 'float' },
    { key: 'C', label: 'heat capacity C/k', value: heatCapacity(st.T, st.Delta, st.g0, st.g1), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const p1 = popExcited(st.T, st.Delta, st.g0, st.g1), p0 = popGround(st.T, st.Delta, st.g0, st.g1);
  const pk = schottkyPeak(st.Delta, st.g0, st.g1);
  return [
    { key: 'norm', label: 'populations sum to 1', value: (p0 + p1).toFixed(4), status: Math.abs(p0 + p1 - 1) < 1e-9 ? 'pass' : 'drift' },
    { key: 'peak', label: 'Schottky peak kT/Delta', value: pk.ratio.toFixed(3), status: Math.abs(pk.ratio - 0.417) < 0.05 || st.g1 !== 1 ? 'pass' : 'drift' },
  ];
};
