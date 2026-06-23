// Quantum tunneling through a rectangular barrier. The scene shows the barrier,
// the time-evolving real part of the wave flowing in and leaking through, and the
// static probability-density envelope; the diagnostic plots transmission and
// reflection against energy, with the tunneling regime, the resonances above the
// barrier, and T + R = 1. Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { transmission, reflection, resonanceEnergies, waveProfile } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sE = document.getElementById('s-E'), vE = document.getElementById('v-E');
const sV = document.getElementById('s-V'), vV = document.getElementById('v-V');
const sL = document.getElementById('s-L'), vL = document.getElementById('v-L');
const btnReset = document.getElementById('btn-reset');

const DEF = { E: 1.0, V0: 2.0, L: 1.5 };
const st = { E: DEF.E, V0: DEF.V0, L: DEF.L };
let prof = null, phase = 0;
function recompute() { prof = waveProfile(st.E, st.V0, st.L, 760); }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.2 }, { name: 'diag', weight: 1.0 }]); }
function syncVals() {
  sE.value = st.E; vE.textContent = st.E.toFixed(2);
  sV.value = st.V0; vV.textContent = st.V0.toFixed(2);
  sL.value = st.L; vL.textContent = st.L.toFixed(2);
  recompute();
}
btnReset.addEventListener('click', () => { Object.assign(st, DEF); syncVals(); });
sE.addEventListener('input', () => { st.E = +sE.value; syncVals(); });
sV.addEventListener('input', () => { st.V0 = +sV.value; syncVals(); });
sL.addEventListener('input', () => { st.L = +sL.value; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', axis: 'rgba(255,255,255,0.3)', barrier: 'rgba(255,157,60,0.13)', barrierEdge: '#ff9d3c', wave: '#4ea8ff', env: 'rgba(141,224,138,0.5)', envFill: 'rgba(141,224,138,0.10)', T: '#8de08a', R: '#ff7a59' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const tunnel = st.E < st.V0;
  panel(col, r, `Wave on a barrier: ${tunnel ? 'E < V0, tunneling' : 'E > V0, over the barrier'}`);
  const [x0, x1] = prof.domain; const inner = { x: r.x + 30, y: r.y + 28, w: r.w - 30 - 16, h: r.h - 28 - 26 };
  let mx = 0; for (const v of prof.psi2) mx = Math.max(mx, v); const amp = Math.sqrt(mx) * 1.12;
  const xOf = (x) => inner.x + (x - x0) / (x1 - x0) * inner.w;
  const yMid = inner.y + inner.h * 0.52, yScale = inner.h * 0.42 / amp;
  const yOf = (v) => yMid - v * yScale;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // barrier region.
  ctx.fillStyle = col.barrier; ctx.fillRect(xOf(0), inner.y, xOf(st.L) - xOf(0), inner.h);
  ctx.strokeStyle = col.barrierEdge; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.moveTo(xOf(st.L), inner.y); ctx.lineTo(xOf(st.L), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  // zero axis.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x, yMid); ctx.lineTo(inner.x + inner.w, yMid); ctx.stroke();
  // |psi|^2 envelope (static): +/- sqrt(psi2).
  ctx.fillStyle = col.envFill; ctx.beginPath();
  for (let i = 0; i < prof.xs.length; i += 1) { const X = xOf(prof.xs[i]), Y = yOf(Math.sqrt(prof.psi2[i])); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  for (let i = prof.xs.length - 1; i >= 0; i -= 1) ctx.lineTo(xOf(prof.xs[i]), yOf(-Math.sqrt(prof.psi2[i]))); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col.env; ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i < prof.xs.length; i += 1) { const X = xOf(prof.xs[i]), Y = yOf(Math.sqrt(prof.psi2[i])); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  ctx.beginPath(); for (let i = 0; i < prof.xs.length; i += 1) { const X = xOf(prof.xs[i]), Y = yOf(-Math.sqrt(prof.psi2[i])); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  // time-evolving real part Re(psi e^{-iEt}) = re cos(phase) + im sin(phase).
  const cs = Math.cos(phase), sn = Math.sin(phase);
  ctx.strokeStyle = col.wave; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i < prof.xs.length; i += 1) { const v = prof.re[i] * cs + prof.im[i] * sn; const X = xOf(prof.xs[i]), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('barrier', (xOf(0) + xOf(st.L)) / 2, inner.y + inner.h + 4);
  ctx.textAlign = 'left'; ctx.fillText('incident + reflected', inner.x + 6, inner.y + inner.h + 4);
  ctx.textAlign = 'right'; ctx.fillText('transmitted', inner.x + inner.w - 4, inner.y + inner.h + 4);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillStyle = col.wave; ctx.fillText('Re(psi)', inner.x + 6, inner.y + 4); ctx.fillStyle = col.env; ctx.fillText('+/- |psi| envelope', inner.x + 70, inner.y + 4);
}

function drawDiag(col, r) {
  panel(col, r, 'Transmission and reflection vs energy: tunneling below V0, resonances above');
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 34 };
  const Emax = st.V0 * 3.6;
  const xOf = (E) => inner.x + E / Emax * inner.w;
  const yOf = (p) => inner.y + inner.h * (1 - p);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // gridlines at T = 0, 0.5, 1.
  ctx.strokeStyle = col.grid; for (const p of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(inner.x, yOf(p)); ctx.lineTo(inner.x + inner.w, yOf(p)); ctx.stroke(); }
  // V0 line (boundary of tunneling regime), with the tunneling region tinted.
  ctx.fillStyle = 'rgba(255,157,60,0.06)'; ctx.fillRect(inner.x, inner.y, xOf(st.V0) - inner.x, inner.h);
  ctx.strokeStyle = col.barrierEdge; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(st.V0), inner.y); ctx.lineTo(xOf(st.V0), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  // T and R curves.
  const curve = (fn, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 400; i += 1) { const E = Emax * i / 400; if (E <= 0) continue; const X = xOf(E), Y = yOf(fn(E, st.V0, st.L)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke(); };
  curve(transmission, col.T); curve(reflection, col.R);
  // resonance markers (T = 1 above the barrier).
  for (const E of resonanceEnergies(st.V0, st.L, Emax)) { ctx.fillStyle = col.T; ctx.beginPath(); ctx.arc(xOf(E), yOf(1), 3, 0, 6.28); ctx.fill(); }
  // operating point.
  const Tn = transmission(st.E, st.V0, st.L); ctx.strokeStyle = col.grid; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.E), inner.y); ctx.lineTo(xOf(st.E), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.T; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(xOf(st.E), yOf(Tn), 5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.T; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`T = ${(Tn * 100).toFixed(1)}%`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.R; ctx.fillText(`R = ${((1 - Tn) * 100).toFixed(1)}%`, inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.barrierEdge; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('E = V0', xOf(st.V0), inner.y + inner.h + 6);
  ctx.fillStyle = col.muted; ctx.fillText('energy E', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('1', inner.x - 4, yOf(1)); ctx.fillText('0', inner.x - 4, yOf(0));
}

function render() {
  if (!REG) relayout(); if (!prof) recompute();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

const running = true; let last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) phase += dt * Math.max(1.2, st.E) * 1.1; render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('E')) st.E = Math.max(0.05, Math.min(8, +params.get('E')));
  if (params.get('V0')) st.V0 = Math.max(0.5, Math.min(6, +params.get('V0')));
  if (params.get('L')) st.L = Math.max(0.4, Math.min(4, +params.get('L')));
  syncVals(); relayout();
  if (DETERMINISTIC) { phase = 0.6; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const T = transmission(st.E, st.V0, st.L);
  return { fields: [
    { key: 'E', label: 'energy E', value: st.E, format: 'float' },
    { key: 'V0', label: 'barrier height V0', value: st.V0, format: 'float' },
    { key: 'L', label: 'barrier width L', value: st.L, format: 'float' },
    { key: 'T', label: 'transmission T', value: T, format: 'float' },
    { key: 'R', label: 'reflection R', value: 1 - T, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const T = transmission(st.E, st.V0, st.L), R = reflection(st.E, st.V0, st.L);
  const sum = T + R;
  const regime = st.E < st.V0 ? 'tunneling (E < V0)' : 'over barrier (E > V0)';
  return [
    { key: 'cons', label: 'T + R = 1 (current conserved)', value: sum.toFixed(6), status: Math.abs(sum - 1) < 1e-9 ? 'pass' : 'drift' },
    { key: 'regime', label: regime, value: `${(T * 100).toFixed(1)}%`, status: 'pass' },
  ];
};
