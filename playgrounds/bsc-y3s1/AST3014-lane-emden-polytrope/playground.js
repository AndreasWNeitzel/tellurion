// The Lane-Emden polytrope. The scene shows the star as a disk coloured by density
// beside the density and enclosed-mass profiles, with a draggable radius cursor;
// the diagnostic plots the central concentration against polytropic index. The
// Lane-Emden ODE is solved by the shared polytrope engine. Canvas2D only.
//
// Reference: Chandrasekhar, An Introduction to the Study of Stellar Structure, Ch. 4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { model, surfaceRadius, densityRatio, massFraction, centralConcentration } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('s-n'), vN = document.getElementById('v-n');
const btnReset = document.getElementById('btn-reset');

const st = { n: 3, cursor: 0.4 };
let M = null, diskKey = '', off = null, offctx = null;
const DW = 220;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.36 }, { name: 'diag', weight: 0.78 }]); }
function syncVals() { sN.value = st.n; vN.textContent = st.n.toFixed(2); M = model(st.n); }
btnReset.addEventListener('click', () => { st.n = 3; st.cursor = 0.4; syncVals(); render(); });
sN.addEventListener('input', () => { st.n = +sN.value; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.28)', dens: '#ff9d3c', mass: '#4ea8ff', cursor: '#8de08a', conc: '#b487ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function hot(t) { t = Math.max(0, Math.min(1, t)); return [Math.round(255 * Math.min(1, t * 3)), Math.round(255 * Math.max(0, Math.min(1, t * 3 - 1))), Math.round(255 * Math.max(0, Math.min(1, t * 3 - 2)))]; }

function buildDisk() {
  const key = st.n.toFixed(3); if (diskKey === key && off) return; diskKey = key;
  if (!off) { off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(DW, DW) : Object.assign(document.createElement('canvas'), { width: DW, height: DW }); offctx = off.getContext('2d'); }
  const img = offctx.createImageData(DW, DW); const d = img.data; const half = DW / 2;
  for (let py = 0; py < DW; py += 1) for (let px = 0; px < DW; px += 1) { const dx = px - half, dy = py - half; const rho = Math.hypot(dx, dy); const o = (py * DW + px) * 4; if (rho > half) { d[o] = 10; d[o + 1] = 12; d[o + 2] = 18; d[o + 3] = 255; continue; } const x = rho / half; const dens = densityRatio(M, x); const [r, g, b] = hot(Math.pow(dens, 0.55)); d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; }
  offctx.putImageData(img, 0, 0);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, `Polytrope n = ${st.n.toFixed(2)}: density structure (left) and profiles (right)`);
  buildDisk();
  const disk = Math.min(r.w * 0.42, r.h - 28 - 30); const dcx = r.x + 16 + disk / 2, dcy = r.y + 28 + (r.h - 28 - 30) / 2;
  ctx.save(); ctx.beginPath(); ctx.arc(dcx, dcy, disk / 2, 0, 6.28); ctx.clip(); ctx.drawImage(off, dcx - disk / 2, dcy - disk / 2, disk, disk); ctx.restore();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dcx, dcy, disk / 2, 0, 6.28); ctx.stroke();
  // cursor ring on the disk.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(dcx, dcy, st.cursor * disk / 2, 0, 6.28); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('density rho/rho_c (hot = dense)', dcx, dcy + disk / 2 + 6);
  // profiles plot.
  const plot = { x: r.x + 16 + disk + 44, y: r.y + 32, w: r.x + r.w - 16 - (r.x + 16 + disk + 44), h: r.h - 28 - 38 };
  const xOf = (x) => plot.x + x * plot.w, yOf = (v) => plot.y + plot.h * (1 - v);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  ctx.save(); clipTo(ctx, plot);
  // density rho/rho_c.
  ctx.strokeStyle = col.dens; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 200; i += 1) { const x = i / 200; const Y = yOf(densityRatio(M, x)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  // enclosed mass fraction.
  ctx.strokeStyle = col.mass; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.beginPath(); for (let i = 0; i <= 200; i += 1) { const x = i / 200; const Y = yOf(massFraction(M, x)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke(); ctx.setLineDash([]);
  // cursor.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.cursor), plot.y); ctx.lineTo(xOf(st.cursor), plot.y + plot.h); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.dens; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('density rho/rho_c', plot.x + 6, plot.y + 4);
  ctx.fillStyle = col.mass; ctx.fillText('enclosed mass m(<r)/M', plot.x + 6, plot.y + 18);
  ctx.fillStyle = col.cursor; ctx.fillText(`r/R = ${st.cursor.toFixed(2)}:  rho/rho_c = ${densityRatio(M, st.cursor).toFixed(3)},  m/M = ${massFraction(M, st.cursor).toFixed(2)}`, plot.x + 6, plot.y + 32);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('fractional radius r/R (drag)', plot.x + plot.w / 2, plot.y + plot.h + 5);
  SC = { plot };
}

function drawDiag(col, r) {
  panel(col, r, 'Central concentration rho_c / mean density vs polytropic index n (log)');
  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 16, h: r.h - 28 - 34 };
  const nlo = 0, nhi = 4.9; const xOf = (n) => inner.x + (n - nlo) / (nhi - nlo) * inner.w;
  const lt = 3, lb = -0.05; const yOf = (c) => inner.y + inner.h * (lt - Math.log10(Math.max(c, 0.9))) / (lt - lb);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let d = 0; d <= lt; d += 1) { const Y = yOf(Math.pow(10, d)); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  ctx.strokeStyle = col.conc; ctx.lineWidth = 2.6; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 120; i += 1) { const n = nlo + (nhi - nlo) * i / 120; const c = centralConcentration(model(n)); if (!isFinite(c) || c <= 0) { pen = false; continue; } const X = xOf(n), Y = yOf(c); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke();
  // current n.
  const cc = centralConcentration(M); ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.n), inner.y); ctx.lineTo(xOf(st.n), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.cursor; ctx.beginPath(); ctx.arc(xOf(st.n), yOf(cc), 5, 0, 6.28); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`n = ${st.n.toFixed(2)}:  rho_c/<rho> = ${cc.toFixed(1)},  xi_1 = ${surfaceRadius(M).toFixed(2)}`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.fillText('n=0 uniform (1),  n=3 -> 54,  n=5 -> infinity', inner.x + 6, inner.y + 18);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (const n of [0, 1, 2, 3, 4]) ctx.fillText(`${n}`, xOf(n), inner.y + inner.h + 6);
  ctx.fillText('polytropic index n', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout(); if (!M) M = model(st.n);
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return; drag = true; st.cursor = Math.max(0, Math.min(1, (sx - SC.plot.x) / SC.plot.w)); render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [sx] = ptr(e); st.cursor = Math.max(0, Math.min(1, (sx - SC.plot.x) / SC.plot.w)); render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('n')) st.n = Math.max(0.1, Math.min(4.9, +params.get('n')));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'n', label: 'polytropic index n', value: st.n, format: 'float' },
    { key: 'xi1', label: 'surface radius xi_1', value: surfaceRadius(M), format: 'float' },
    { key: 'conc', label: 'central concentration rho_c/<rho>', value: centralConcentration(M), format: 'float' },
    { key: 'r', label: 'cursor r/R', value: st.cursor, format: 'float' },
    { key: 'mf', label: 'enclosed mass at cursor', value: massFraction(M, st.cursor), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const cc = centralConcentration(M);
  return [
    { key: 'surface', label: 'density 0 at surface, 1 at centre', value: `${densityRatio(M, 1).toFixed(2)}, ${densityRatio(M, 0).toFixed(2)}`, status: densityRatio(M, 1) < 1e-3 && Math.abs(densityRatio(M, 0) - 1) < 1e-6 ? 'pass' : 'drift' },
    { key: 'conc', label: 'central concentration > 1 (centrally peaked)', value: cc.toFixed(1), status: cc >= 1 - 1e-6 ? 'pass' : 'drift' },
  ];
};
