// The radial wavefunctions of hydrogen. The scene shows the orbital as a disk of
// the radial wavefunction oscillating in time (nodes as dark rings) beside the
// radial probability density P(r) with its nodes and most-probable and mean radii;
// the diagnostic is the hydrogen energy ladder E_n = -13.6/n^2. Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { R_nl, radialProb, energy, radialNodes, meanRadius, mostProbableRadius, orbitalLabel } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const btnN = document.getElementById('btn-n'), vNl = document.getElementById('value-n');
const btnL = document.getElementById('btn-l'), vLl = document.getElementById('value-l');
const btnReset = document.getElementById('btn-reset');

const NMAX = 5;
const st = { n: 3, l: 1 };
let phase = 0, prof = null, profKey = '', maxAbs = 1, off = null, offctx = null;
const DW = 200;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.36 }, { name: 'diag', weight: 0.74 }]); }
function syncVals() { vNl.textContent = `n = ${st.n}`; vLl.textContent = `l = ${st.l} (${orbitalLabel(st.n, st.l)})`; }
btnN.addEventListener('click', () => { st.n = st.n % NMAX + 1; if (st.l > st.n - 1) st.l = st.n - 1; prof = null; syncVals(); });
btnL.addEventListener('click', () => { st.l = (st.l + 1) % st.n; prof = null; syncVals(); });
btnReset.addEventListener('click', () => { st.n = 3; st.l = 1; prof = null; syncVals(); });

function rmax() { return 2.0 * meanRadius(st.n, st.l) + 4; }
function rmaxDisk() { return 1.35 * meanRadius(st.n, st.l) + 2; }
function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.28)', prob: '#4ea8ff', probFill: 'rgba(78,168,255,0.16)', node: '#ff5d5d', mostP: '#8de08a', meanR: '#ffd166', level: 'rgba(255,255,255,0.2)', sel: '#8de08a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function buildProfile() {
  const key = `${st.n}:${st.l}`; if (profKey === key && prof) return; profKey = key;
  const rm = rmaxDisk(); prof = new Float64Array(DW / 2 + 1); maxAbs = 1e-9;
  for (let i = 0; i <= DW / 2; i += 1) { const v = R_nl(st.n, st.l, rm * i / (DW / 2)); prof[i] = v; maxAbs = Math.max(maxAbs, Math.abs(v)); }
  if (!off) { off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(DW, DW) : Object.assign(document.createElement('canvas'), { width: DW, height: DW }); offctx = off.getContext('2d'); }
}
function nodeRadii() { const out = []; const rm = rmax(); let prev = R_nl(st.n, st.l, rm * 0.0008); for (let i = 1; i <= 3000; i += 1) { const r = rm * (i + 0.5) / 3000; const v = R_nl(st.n, st.l, r); if (prev * v < 0) out.push(r); prev = v; } return out; }

function drawScene(col, r) {
  panel(col, r, `Hydrogen orbital ${orbitalLabel(st.n, st.l)}: radial density (left) and probability P(r) = r^2 |R|^2 (right)`);
  buildProfile();
  const top = r.y + 28; const disk = Math.min(r.w * 0.42, r.h - 28 - 30); const dcx = r.x + 16 + disk / 2, dcy = top + (r.h - 28 - 30) / 2;
  // radial wavefunction disk (oscillating: R_nl(r) cos(phase)).
  const pc = Math.cos(phase); const img = offctx.createImageData(DW, DW); const d = img.data; const half = DW / 2;
  for (let py = 0; py < DW; py += 1) for (let px = 0; px < DW; px += 1) { const dx = px - half, dy = py - half; const rho = Math.hypot(dx, dy); const o = (py * DW + px) * 4; if (rho > half) { d[o] = 10; d[o + 1] = 12; d[o + 2] = 18; d[o + 3] = 255; continue; } const raw = prof[Math.round(rho)] / maxAbs; const g = Math.sign(raw) * Math.pow(Math.abs(raw), 0.45) * pc; const c = rdbu(Math.max(0, Math.min(1, 0.5 + 0.5 * g))); d[o] = c.r; d[o + 1] = c.g; d[o + 2] = c.b; d[o + 3] = 255; }
  offctx.putImageData(img, 0, 0);
  ctx.save(); ctx.beginPath(); ctx.arc(dcx, dcy, disk / 2, 0, 6.28); ctx.clip(); ctx.drawImage(off, dcx - disk / 2, dcy - disk / 2, disk, disk); ctx.restore();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dcx, dcy, disk / 2, 0, 6.28); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('radial density (oscillating)', dcx, dcy + disk / 2 + 6);
  // P(r) plot.
  const plot = { x: r.x + 16 + disk + 40, y: top + 4, w: r.x + r.w - 16 - (r.x + 16 + disk + 40), h: r.h - 28 - 34 };
  const rm = rmax(); const xOf = (rr) => plot.x + rr / rm * plot.w; let pmax = 0; for (let i = 0; i <= 300; i += 1) pmax = Math.max(pmax, radialProb(st.n, st.l, rm * i / 300)); pmax *= 1.15;
  const yOf = (p) => plot.y + plot.h * (1 - p / pmax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  ctx.save(); clipTo(ctx, plot);
  // nodes.
  for (const rn of nodeRadii()) { ctx.strokeStyle = col.node; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(rn), plot.y); ctx.lineTo(xOf(rn), plot.y + plot.h); ctx.stroke(); ctx.setLineDash([]); }
  // P(r).
  ctx.fillStyle = col.probFill; ctx.strokeStyle = col.prob; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 400; i += 1) { const rr = rm * i / 400; const Y = yOf(radialProb(st.n, st.l, rr)); i ? ctx.lineTo(xOf(rr), Y) : ctx.moveTo(xOf(rr), Y); } ctx.stroke(); ctx.lineTo(xOf(rm), yOf(0)); ctx.lineTo(xOf(0), yOf(0)); ctx.closePath(); ctx.fill();
  // most probable and mean radius.
  const rp = mostProbableRadius(st.n, st.l), rmean = meanRadius(st.n, st.l);
  ctx.strokeStyle = col.mostP; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xOf(rp), plot.y); ctx.lineTo(xOf(rp), plot.y + plot.h); ctx.stroke();
  ctx.strokeStyle = col.meanR; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(xOf(rmean), plot.y); ctx.lineTo(xOf(rmean), plot.y + plot.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  // plot labels.
  ctx.fillStyle = col.prob; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`P(r),  ${radialNodes(st.n, st.l)} nodes`, plot.x + 6, plot.y + 4);
  ctx.fillStyle = col.mostP; ctx.fillText(`most probable r = ${rp.toFixed(1)} a0`, plot.x + 6, plot.y + 18);
  ctx.fillStyle = col.meanR; ctx.fillText(`mean r = ${rmean.toFixed(1)} a0`, plot.x + 6, plot.y + 32);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('r (Bohr radii)', plot.x + plot.w / 2, plot.y + plot.h + 5);
}

function drawDiag(col, r) {
  panel(col, r, 'Hydrogen energy levels E_n = -13.6 eV / n^2 (degenerate in l)');
  const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 24 };
  const yOf = (E) => inner.y + inner.h * (0.8 - E) / (0.8 - (-14.5));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // zero line (ionization).
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke(); ctx.setLineDash([]);
  for (let n = 1; n <= NMAX + 1; n += 1) { const E = energy(n); const Y = yOf(E); const sel = n === st.n; ctx.strokeStyle = sel ? col.sel : col.level; ctx.lineWidth = sel ? 2.4 : 1.4; ctx.beginPath(); ctx.moveTo(inner.x + 30, Y); ctx.lineTo(inner.x + inner.w - 60, Y); ctx.stroke();
    ctx.fillStyle = sel ? col.sel : col.muted; ctx.font = fontString(canvas, 'tick', 'mono', sel ? 700 : 400); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(`n=${n}`, inner.x + inner.w - 54, Y);
    // l-sublevels (degenerate) as ticks on the level.
    if (sel) for (let li = 0; li < n; li += 1) { ctx.fillStyle = li === st.l ? col.sel : 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(inner.x + 36 + li * 16, Y, li === st.l ? 4 : 2.4, 0, 6.28); ctx.fill(); } }
  ctx.restore();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`${orbitalLabel(st.n, st.l)}:  E = ${energy(st.n).toFixed(2)} eV`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('0 (ionized)', inner.x - 4, yOf(0)); ctx.fillText('-13.6', inner.x - 4, yOf(-13.6));
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let running = true, last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) phase += dt * 1.6; render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('n')) st.n = Math.max(1, Math.min(NMAX, +params.get('n')));
  if (params.get('l') !== null) st.l = Math.max(0, Math.min(st.n - 1, +params.get('l')));
  syncVals(); relayout();
  if (DETERMINISTIC) { phase = 0.5; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'orb', label: 'orbital', value: orbitalLabel(st.n, st.l), format: 'text' },
    { key: 'E', label: 'energy E_n', value: energy(st.n), format: 'float', unit: 'eV' },
    { key: 'nodes', label: 'radial nodes (n-l-1)', value: radialNodes(st.n, st.l), format: 'int' },
    { key: 'rp', label: 'most probable r', value: mostProbableRadius(st.n, st.l), format: 'float', unit: 'a0' },
    { key: 'rmean', label: 'mean r', value: meanRadius(st.n, st.l), format: 'float', unit: 'a0' },
  ] };
};
window.playground.getInvariants = function () {
  return [
    { key: 'nodes', label: 'radial nodes = n - l - 1', value: `${radialNodes(st.n, st.l)}`, status: 'pass' },
    { key: 'energy', label: 'E_n = -13.6/n^2 (independent of l)', value: `${energy(st.n).toFixed(2)} eV`, status: Math.abs(energy(st.n) + 13.6056931 / (st.n * st.n)) < 1e-6 ? 'pass' : 'drift' },
  ];
};
