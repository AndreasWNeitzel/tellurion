// The Lane-Emden polytrope. The scene shows the star as a disk coloured by density
// beside the density and enclosed-mass profiles, with a draggable radius cursor;
// the diagnostic plots the central concentration against polytropic index. The
// Lane-Emden ODE is solved by the shared polytrope engine. Canvas2D only.
//
// Reference: Chandrasekhar, An Introduction to the Study of Stellar Structure, Ch. 4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { model, surfaceRadius, theta, densityRatio, massFraction, centralConcentration } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('s-n'), vN = document.getElementById('v-n');
const selPreset = document.getElementById('select-preset');
const btnReset = document.getElementById('btn-reset');

const st = { n: 3, cursor: 0.4 };

// theta(r/R), density theta^n, pressure theta^(n+1) at fractional radius x.
function thetaProfile(x) { return Math.max(0, theta(M, x * M.xi1)); }
function pressureRatio(x) { return Math.pow(thetaProfile(x), M.nPoly + 1); }
// star colour ramp: dim deep-red envelope -> orange -> yellow -> white core, so the
// low-density outskirts stay visible (unlike a hot ramp that fades them to black).
const RAMP = [[0, [44, 10, 14]], [0.25, [150, 32, 22]], [0.5, [240, 110, 42]], [0.74, [255, 200, 110]], [1, [255, 250, 236]]];
function starRamp(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < RAMP.length; i += 1) if (t <= RAMP[i][0]) { const a = RAMP[i - 1], b = RAMP[i], f = (t - a[0]) / (b[0] - a[0]); return [a[1][0] + (b[1][0] - a[1][0]) * f, a[1][1] + (b[1][1] - a[1][1]) * f, a[1][2] + (b[1][2] - a[1][2]) * f]; }
  return RAMP[RAMP.length - 1][1];
}
let M = null, diskKey = '', off = null, offctx = null;
const DW = 220;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.36 }, { name: 'diag', weight: 0.78 }]); }
function syncVals() {
  sN.value = st.n; vN.textContent = st.n.toFixed(2); M = model(st.n);
  const pv = ['0.1', '1', '1.5', '3', '4', '4.9'].find((v) => Math.abs(parseFloat(v) - st.n) < 1e-6);
  selPreset.value = pv ?? '';
}
btnReset.addEventListener('click', () => { st.n = 3; st.cursor = 0.4; syncVals(); render(); });
sN.addEventListener('input', () => { st.n = +sN.value; syncVals(); render(); });
selPreset.addEventListener('change', () => { if (selPreset.value) { st.n = parseFloat(selPreset.value); syncVals(); render(); } });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.28)', theta: '#e8d59a', dens: '#ff8a4a', pres: '#ff6fae', mass: '#5aa9ff', cursor: '#8de08a', conc: '#b487ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function buildDisk() {
  const key = st.n.toFixed(3); if (diskKey === key && off) return; diskKey = key;
  if (!off) { off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(DW, DW) : Object.assign(document.createElement('canvas'), { width: DW, height: DW }); offctx = off.getContext('2d'); }
  const img = offctx.createImageData(DW, DW); const d = img.data; const half = DW / 2;
  for (let py = 0; py < DW; py += 1) for (let px = 0; px < DW; px += 1) {
    const dx = px - half, dy = py - half; const rr = Math.hypot(dx, dy); const o = (py * DW + px) * 4;
    if (rr > half) { d[o] = 6; d[o + 1] = 7; d[o + 2] = 12; d[o + 3] = 255; continue; }
    const x = rr / half; const dens = densityRatio(M, x);
    const [r, g, b] = starRamp(Math.pow(dens, 0.45));
    d[o] = r | 0; d[o + 1] = g | 0; d[o + 2] = b | 0; d[o + 3] = 255;
  }
  offctx.putImageData(img, 0, 0);
}

let SC = null;
function drawScene(col, r) {
  panel(col, r, `Polytrope n = ${st.n.toFixed(2)}: density cross-section and interior profiles`);
  buildDisk();
  const top = r.y + 30, availH = r.h - 30 - 30;
  const diskAreaW = r.w * 0.40;
  const disk = Math.min(diskAreaW * 0.96, availH * 0.96);
  const dcx = r.x + 12 + diskAreaW / 2, dcy = top + availH / 2;
  // soft outer glow filling the surrounding space (envelope colour, fading out).
  const sc = starRamp(0.2);
  const g = ctx.createRadialGradient(dcx, dcy, disk * 0.3, dcx, dcy, disk * 0.85);
  g.addColorStop(0, `rgba(${sc[0] | 0},${sc[1] | 0},${sc[2] | 0},0.32)`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(dcx, dcy, disk * 0.85, 0, 6.28); ctx.fill();
  // density disk.
  ctx.save(); ctx.beginPath(); ctx.arc(dcx, dcy, disk / 2, 0, 6.28); ctx.clip(); ctx.drawImage(off, dcx - disk / 2, dcy - disk / 2, disk, disk); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dcx, dcy, disk / 2, 0, 6.28); ctx.stroke();
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(dcx, dcy, st.cursor * disk / 2, 0, 6.28); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('density cross-section', dcx, dcy + disk / 2 + 8);
  // profiles plot on the right.
  const plot = { x: r.x + 12 + diskAreaW + 36, y: top + 2, w: r.x + r.w - 16 - (r.x + 12 + diskAreaW + 36), h: availH - 22 };
  const xOf = (x) => plot.x + x * plot.w, yOf = (v) => plot.y + plot.h * (1 - v);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) { const Y = yOf(v); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(plot.x, Y); ctx.lineTo(plot.x + plot.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(v.toFixed(2), plot.x - 4, Y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  ctx.save(); clipTo(ctx, plot);
  const curve = (fn, color, dash, lw) => { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); for (let i = 0; i <= 240; i += 1) { const x = i / 240; const Y = yOf(fn(x)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke(); ctx.setLineDash([]); };
  curve((x) => thetaProfile(x), col.theta, null, 2.0);                  // Lane-Emden theta, spans the full radius
  curve((x) => densityRatio(M, x), col.dens, null, 2.8);               // density theta^n
  curve((x) => pressureRatio(x), col.pres, [5, 4], 2.0);              // pressure theta^(n+1)
  curve((x) => massFraction(M, x), col.mass, [2, 3], 2.2);           // enclosed mass
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.cursor), plot.y); ctx.lineTo(xOf(st.cursor), plot.y + plot.h); ctx.stroke();
  for (const [fn, c] of [[(x) => thetaProfile(x), col.theta], [(x) => densityRatio(M, x), col.dens], [(x) => pressureRatio(x), col.pres], [(x) => massFraction(M, x), col.mass]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xOf(st.cursor), yOf(fn(st.cursor)), 3.2, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // legend + readout.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.theta; ctx.fillText('theta', plot.x + 6, plot.y + 4);
  ctx.fillStyle = col.dens; ctx.fillText('density theta^n', plot.x + 50, plot.y + 4);
  ctx.fillStyle = col.pres; ctx.fillText('pressure theta^(n+1)', plot.x + 6, plot.y + 18);
  ctx.fillStyle = col.mass; ctx.fillText('mass m(<r)/M', plot.x + 6, plot.y + 32);
  ctx.fillStyle = col.cursor; ctx.fillText(`r/R=${st.cursor.toFixed(2)}: rho/rho_c=${densityRatio(M, st.cursor).toFixed(3)}, m/M=${massFraction(M, st.cursor).toFixed(2)}`, plot.x + 6, plot.y + plot.h - 14);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of [0, 0.25, 0.5, 0.75, 1]) ctx.fillText(x.toFixed(2), xOf(x), plot.y + plot.h + 5);
  ctx.fillText('fractional radius r/R (drag)', plot.x + plot.w / 2, plot.y + plot.h + 18);
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
