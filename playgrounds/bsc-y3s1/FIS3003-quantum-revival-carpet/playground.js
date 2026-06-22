// Quantum wavepacket revivals in an infinite well. The scene paints the quantum carpet,
// |psi(x,t)|^2 over position and time, with the live density at the current instant in a
// strip above it and a marker line tracking "now". The diagnostic is the survival
// probability, peaking at the full and fractional revivals. Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { eigenstate, energy, decompose, density, autocorrelation, T_REV } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sX = document.getElementById('s-x0'), vX = document.getElementById('v-x0');
const sK = document.getElementById('s-k0'), vK = document.getElementById('v-k0');
const btnPlay = document.getElementById('btn-play'), btnReset = document.getElementById('btn-reset');

const NMAX = 40, CX = 240, CY = 200, SIGMA = 0.05;
const st = { x0: 0.5, k0: 18, t: 0, playing: true };
let frame = 0, running = true;
let coeff = null, carpet = null, cctx = null, carpetMax = 1, eigTab = null;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.34 }, { name: 'diag', weight: 0.78 }]); }
function syncVals() { sX.value = st.x0; vX.textContent = st.x0.toFixed(2); sK.value = st.k0; vK.textContent = st.k0.toFixed(0); btnPlay.textContent = st.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(st.playing)); }

function buildEigTable() { eigTab = []; for (let n = 0; n <= NMAX; n += 1) { const row = new Float64Array(CX); for (let j = 0; j < CX; j += 1) row[j] = eigenstate(n, (j + 0.5) / CX); eigTab.push(row); } }
function recompute() {
  coeff = decompose(st.x0, st.k0, SIGMA, NMAX);
  if (!carpet) { carpet = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(CX, CY) : Object.assign(document.createElement('canvas'), { width: CX, height: CY }); cctx = carpet.getContext('2d'); }
  if (!eigTab) buildEigTable();
  const dens = new Float64Array(CX * CY); let mx = 0;
  const cosN = new Float64Array(NMAX + 1), sinN = new Float64Array(NMAX + 1);
  for (let i = 0; i < CY; i += 1) {
    const t = i / (CY - 1) * T_REV;
    for (let n = 1; n <= NMAX; n += 1) { const ph = -energy(n) * t; cosN[n] = Math.cos(ph); sinN[n] = Math.sin(ph); }
    for (let j = 0; j < CX; j += 1) {
      let re = 0, im = 0;
      for (let n = 1; n <= NMAX; n += 1) { const e = eigTab[n][j], cr = coeff.cRe[n], ci = coeff.cIm[n]; re += e * (cr * cosN[n] - ci * sinN[n]); im += e * (cr * sinN[n] + ci * cosN[n]); }
      const d = re * re + im * im; dens[i * CX + j] = d; if (d > mx) mx = d;
    }
  }
  carpetMax = mx || 1;
  const img = cctx.createImageData(CX, CY); const data = img.data;
  for (let k = 0; k < CX * CY; k += 1) { const t = Math.pow(Math.min(1, dens[k] / carpetMax), 0.5); const c = viridis(t); const o = k * 4; data[o] = c.r; data[o + 1] = c.g; data[o + 2] = c.b; data[o + 3] = 255; }
  cctx.putImageData(img, 0, 0);
}

btnReset.addEventListener('click', () => { st.x0 = 0.5; st.k0 = 18; st.t = 0; st.playing = true; if (!running) { running = true; requestAnimationFrame(tick); } recompute(); syncVals(); });
btnPlay.addEventListener('click', () => { st.playing = !st.playing; if (st.playing && !running) { running = true; requestAnimationFrame(tick); } syncVals(); if (!st.playing) render(); });
sX.addEventListener('input', () => { st.x0 = +sX.value; coeff = decompose(st.x0, st.k0, SIGMA, NMAX); syncVals(); if (!running) render(); });
sX.addEventListener('change', () => { recompute(); if (!running) render(); });
sK.addEventListener('input', () => { st.k0 = +sK.value; coeff = decompose(st.x0, st.k0, SIGMA, NMAX); syncVals(); if (!running) render(); });
sK.addEventListener('change', () => { recompute(); if (!running) render(); });

function colors() { return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)', now: '#ffd24a', slice: '#8de08a', surv: '#5ec8ff', rev: 'rgba(255,210,74,0.5)' }; }
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  if (!coeff) recompute();
  panel(col, r, `Quantum carpet: |psi(x,t)|^2 in an infinite well, t / T_rev = ${(st.t / T_REV).toFixed(3)}  (T_rev = 2 pi)`);
  const inner = { x: r.x + 40, y: r.y + 30, w: r.w - 40 - 16, h: r.h - 30 - 28 };
  const sliceH = 70, gap = 10;
  const slice = { x: inner.x, y: inner.y, w: inner.w, h: sliceH };
  const carp = { x: inner.x, y: inner.y + sliceH + gap, w: inner.w, h: inner.h - sliceH - gap };
  // live density slice at t now.
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(slice.x, slice.y, slice.w, slice.h);
  ctx.fillStyle = 'rgba(141,224,138,0.18)'; ctx.strokeStyle = col.slice; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(slice.x, slice.y + slice.h);
  for (let j = 0; j <= CX; j += 1) { const x = j / CX; const d = density(x, st.t, coeff.cRe, coeff.cIm, NMAX); const Y = slice.y + slice.h - Math.min(1, d / carpetMax) * (slice.h - 6); ctx.lineTo(slice.x + x * slice.w, Y); }
  ctx.lineTo(slice.x + slice.w, slice.y + slice.h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col.slice; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('|psi(x, t now)|^2', slice.x + 6, slice.y + 5);
  // carpet image.
  ctx.imageSmoothingEnabled = true; ctx.drawImage(carpet, carp.x, carp.y, carp.w, carp.h);
  ctx.strokeStyle = col.border; ctx.strokeRect(carp.x, carp.y, carp.w, carp.h);
  // now line.
  const ny = carp.y + (st.t / T_REV) * carp.h;
  ctx.strokeStyle = col.now; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(carp.x, ny); ctx.lineTo(carp.x + carp.w, ny); ctx.stroke();
  // axes labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('position x (0 to L)', carp.x + carp.w / 2, carp.y + carp.h + 6);
  ctx.save(); ctx.translate(carp.x - 26, carp.y + carp.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('time t (0 to T_rev, downward)', 0, 0); ctx.restore();
  ctx.fillStyle = col.now; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('now', carp.x + carp.w - 4, ny - 7);
}

function drawDiag(col, r) {
  if (!coeff) recompute();
  panel(col, r, 'Survival probability |<psi(0)|psi(t)>|^2: full revival at T_rev, fractional revivals between');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const xOf = (tf) => inner.x + tf * inner.w, yOf = (a) => inner.y + inner.h * (1 - a);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const a of [0, 0.5, 1]) { const Y = yOf(a); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(a.toFixed(1), inner.x - 5, Y); }
  // fractional revival markers.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const [num, den] of [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]]) { const tf = num / den; ctx.strokeStyle = col.rev; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(xOf(tf), inner.y); ctx.lineTo(xOf(tf), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.rev; ctx.fillText(`${num}/${den}`, xOf(tf), inner.y + 4); }
  ctx.save(); clipTo(ctx, inner);
  ctx.strokeStyle = col.surv; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 600; i += 1) { const tf = i / 600; const a = autocorrelation(tf * T_REV, coeff.p2, NMAX); const Y = yOf(a); i ? ctx.lineTo(xOf(tf), Y) : ctx.moveTo(xOf(tf), Y); } ctx.stroke();
  const tfn = st.t / T_REV; ctx.strokeStyle = col.now; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(tfn), inner.y); ctx.lineTo(xOf(tfn), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.now; ctx.beginPath(); ctx.arc(xOf(tfn), yOf(autocorrelation(st.t, coeff.p2, NMAX)), 4.5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const tf of [0, 0.25, 0.5, 0.75, 1]) ctx.fillText(tf.toFixed(2), xOf(tf), inner.y + inner.h + 6);
  ctx.fillText('time t / T_rev', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (st.playing) { st.t += T_REV * 0.0016; if (st.t > T_REV) st.t -= T_REV; } render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('x0')) st.x0 = Math.max(0.2, Math.min(0.8, +params.get('x0')));
  if (params.get('k0')) st.k0 = Math.max(0, Math.min(40, +params.get('k0')));
  syncVals(); relayout(); recompute();
  if (DETERMINISTIC) { running = false; st.playing = false; st.t = T_REV * 0.5; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'x0', label: 'initial position x0', value: st.x0, format: 'float' },
    { key: 'k0', label: 'initial momentum k0', value: st.k0, format: 'float' },
    { key: 't', label: 't / T_rev', value: st.t / T_REV, format: 'float' },
    { key: 'surv', label: 'survival probability', value: coeff ? autocorrelation(st.t, coeff.p2, NMAX) : 1, format: 'float' },
    { key: 'modes', label: 'eigenstates summed', value: NMAX, format: 'int' },
  ] };
};
window.playground.getInvariants = function () {
  const s0 = coeff ? autocorrelation(0, coeff.p2, NMAX) : 1;
  const sRev = coeff ? autocorrelation(T_REV, coeff.p2, NMAX) : 1;
  return [
    { key: 'revival', label: 'survival returns to 1 at T_rev', value: sRev.toFixed(3), status: Math.abs(sRev - 1) < 1e-3 ? 'pass' : 'drift' },
    { key: 'start', label: 'survival is 1 at t=0', value: s0.toFixed(3), status: Math.abs(s0 - 1) < 1e-6 ? 'pass' : 'drift' },
  ];
};
