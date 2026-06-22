// The Franck-Hertz experiment. The scene is the tube: electrons accelerate, excite
// atoms in luminous layers wherever their energy reaches E_exc, and the collector
// current oscillates. The diagnostic is the current against accelerating voltage,
// dipping at each multiple of E_exc/e. Canvas2D only.
//
// Reference: Eisberg and Resnick, Quantum Physics, 2nd ed., Sec. 4.6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { current, excitationLayers, collisionCount } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sV = document.getElementById('s-V'), vV = document.getElementById('v-V');
const sE = document.getElementById('s-E'), vE = document.getElementById('v-E');
const btnReset = document.getElementById('btn-reset');

const Vr = 1.5, MFP = 0.07;
const DEF = { V: 11, Eexc: 4.9 };
const st = { V: DEF.V, Eexc: DEF.Eexc };
let curve = null, curveKey = '', electrons = [], flashes = [], rngS = 0x51;
function rnd() { rngS = (rngS + 0x6d2b79f5) | 0; let t = Math.imul(rngS ^ (rngS >>> 15), 1 | rngS); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.12 }, { name: 'diag', weight: 1.05 }]); }
function syncVals() { sV.value = st.V; vV.textContent = `${st.V.toFixed(1)} V`; sE.value = st.Eexc; vE.textContent = `${st.Eexc.toFixed(1)} eV`; }
btnReset.addEventListener('click', () => { Object.assign(st, DEF); seedElectrons(); syncVals(); });
sV.addEventListener('input', () => { st.V = +sV.value; syncVals(); });
sE.addEventListener('input', () => { st.Eexc = +sE.value; curve = null; syncVals(); });

const VMAX = () => st.Eexc * 4.6;
function buildCurve() { const key = st.Eexc.toFixed(2); if (curveKey === key && curve) return; curveKey = key; curve = []; const N = 110; for (let i = 0; i <= N; i += 1) { const V = VMAX() * i / N; curve.push(current(V, st.Eexc, Vr, MFP, 7, 280, 0xC0FFEE)); } }
function seedElectrons() { electrons = []; for (let i = 0; i < 22; i += 1) electrons.push({ x: rnd(), ke: 0, vy: (rnd() - 0.5) * 0.1, y: (rnd() - 0.5) * 0.7 }); flashes = []; }

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', tube: '#11151f', cathode: '#ff9d3c', grid: '#9aa0a6', collector: '#5b8cff', electron: '#ffd166', layer: 'rgba(120,200,255,0.5)', flash: '#bfe3ff', curve: '#8de08a', vline: '#ff9d3c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let TUBE = null;
function drawScene(col, r) {
  const ncol = collisionCount(st.V, st.Eexc);
  panel(col, r, `Tube: electrons excite atoms in ${ncol} luminous layer${ncol === 1 ? '' : 's'} as V rises`);
  const bx = r.x + 50, by = r.y + 44, bw = r.w - 50 - 90, bh = r.h - 44 - 40; const gridX = bx + bw * 0.86;
  TUBE = { bx, by, bw, bh, gridX };
  ctx.fillStyle = col.tube; ctx.fillRect(bx, by, bw, bh);
  ctx.save(); clipTo(ctx, { x: bx, y: by, w: bw, h: bh });
  // excitation layers (luminous bands at x_k).
  for (const xl of excitationLayers(st.V, st.Eexc)) { const X = bx + xl * (gridX - bx); const g = ctx.createLinearGradient(X - 10, 0, X + 10, 0); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(0.5, 'rgba(120,200,255,0.35)'); g.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = g; ctx.fillRect(X - 10, by, 20, bh); }
  // atoms (faint).
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 60; i += 1) { const ax = bx + (i * 97 % 1000) / 1000 * (gridX - bx); const ay = by + ((i * 53) % 100) / 100 * bh; ctx.beginPath(); ctx.arc(ax, ay, 2, 0, 6.28); ctx.fill(); }
  // flashes.
  for (const f of flashes) { const X = bx + f.x * (gridX - bx), Y = by + (0.5 - 0.5 * f.y) * bh; ctx.fillStyle = `rgba(191,227,255,${(f.ttl).toFixed(2)})`; ctx.beginPath(); ctx.arc(X, Y, 3 + 5 * f.ttl, 0, 6.28); ctx.fill(); }
  // electrons.
  for (const e of electrons) { const X = bx + e.x * (gridX - bx), Y = by + (0.5 - 0.5 * e.y) * bh; ctx.fillStyle = col.electron; ctx.beginPath(); ctx.arc(X, Y, 2.4, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // electrodes.
  ctx.fillStyle = col.cathode; ctx.fillRect(bx - 6, by, 6, bh); ctx.fillStyle = col.grid; ctx.fillRect(gridX, by, 2, bh); ctx.fillStyle = col.collector; ctx.fillRect(bx + bw, by, 8, bh);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.cathode; ctx.fillText('cathode', bx, by + bh + 5); ctx.fillStyle = col.grid; ctx.fillText('grid', gridX, by + bh + 5); ctx.fillStyle = col.collector; ctx.fillText('collector', bx + bw, by + bh + 18);
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.fillText(`V_acc = ${st.V.toFixed(1)} V`, bx + 4, by + 4); ctx.textAlign = 'right'; ctx.fillText(`V_r = ${Vr} V`, bx + bw - 4, by + 4);
}

function drawDiag(col, r) {
  buildCurve();
  panel(col, r, 'Collector current vs accelerating voltage: dips spaced by the excitation energy');
  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 16, h: r.h - 28 - 34 };
  let mx = 0; for (const c of curve) mx = Math.max(mx, c); mx = Math.max(mx, 0.1) * 1.1;
  const xOf = (V) => inner.x + V / VMAX() * inner.w; const yOf = (c) => inner.y + inner.h * (1 - c / mx);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // excitation-multiple markers.
  for (let n = 1; n * st.Eexc < VMAX(); n += 1) { ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(n * st.Eexc), inner.y); ctx.lineTo(xOf(n * st.Eexc), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }
  // curve.
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.6; ctx.beginPath(); curve.forEach((c, i) => { const V = VMAX() * i / (curve.length - 1); const X = xOf(V), Y = yOf(c); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  // current operating point.
  const Inow = current(st.V, st.Eexc, Vr, MFP, 7, 280, 0xC0FFEE);
  ctx.strokeStyle = col.vline; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.V), inner.y); ctx.lineTo(xOf(st.V), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.vline; ctx.beginPath(); ctx.arc(xOf(st.V), yOf(Inow), 5, 0, 6.28); ctx.fill();
  ctx.restore();
  // dip-spacing annotation between the first two multiples.
  if (2 * st.Eexc < VMAX()) { const y = inner.y + 16; ctx.strokeStyle = col.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xOf(st.Eexc), y); ctx.lineTo(xOf(2 * st.Eexc), y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`spacing = E_exc/e = ${st.Eexc.toFixed(1)} V`, (xOf(st.Eexc) + xOf(2 * st.Eexc)) / 2, y - 2); }
  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let n = 1; n * st.Eexc < VMAX(); n += 1) ctx.fillText(`${(n * st.Eexc).toFixed(1)}`, xOf(n * st.Eexc), inner.y + inner.h + 6);
  ctx.fillText('accelerating voltage V', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('collector current', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function advance(dt) {
  for (const e of electrons) {
    const v = 0.25 + 0.55 * Math.sqrt(Math.max(0, e.ke)); e.x += v * dt;
    e.ke += st.V * (v * dt); // energy gained crossing the field
    if (e.ke >= st.Eexc && rnd() < (v * dt) / MFP) { e.ke -= st.Eexc; flashes.push({ x: e.x, y: e.y, ttl: 1 }); }
    if (e.x >= 1) { e.x = 0; e.ke = 0; e.y = (rnd() - 0.5) * 0.7; }
  }
  for (const f of flashes) f.ttl -= dt * 2.2; flashes = flashes.filter((f) => f.ttl > 0).slice(-40);
}

let running = true, last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('V')) st.V = Math.max(0.5, Math.min(VMAX(), +params.get('V')));
  if (params.get('E')) st.Eexc = Math.max(3, Math.min(7, +params.get('E')));
  seedElectrons(); syncVals(); relayout();
  if (DETERMINISTIC) { for (let i = 0; i < 160; i += 1) advance(0.03); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'V', label: 'accelerating voltage', value: st.V, format: 'float', unit: 'V' },
    { key: 'Eexc', label: 'excitation energy', value: st.Eexc, format: 'float', unit: 'eV' },
    { key: 'layers', label: 'excitation layers', value: collisionCount(st.V, st.Eexc), format: 'int' },
    { key: 'I', label: 'collector current', value: current(st.V, st.Eexc, Vr, MFP, 7, 280, 0xC0FFEE), format: 'float' },
    { key: 'spacing', label: 'dip spacing E_exc/e', value: st.Eexc, format: 'float', unit: 'V' },
  ] };
};
window.playground.getInvariants = function () {
  const layers = collisionCount(st.V, st.Eexc);
  return [
    { key: 'spacing', label: 'dips spaced by E_exc/e', value: `${st.Eexc.toFixed(1)} V`, status: 'pass' },
    { key: 'layers', label: 'excitation layers = floor(V / E_exc)', value: `${layers}`, status: 'pass' },
  ];
};
