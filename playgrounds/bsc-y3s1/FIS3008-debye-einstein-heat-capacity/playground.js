// Lattice specific heat of a solid. The scene plots the Debye and Einstein heat
// capacities against temperature with the Dulong-Petit plateau, a sweeping temperature
// cursor reading both. The diagnostic is the same curves on log-log axes, where the
// Debye low-T behaviour is the straight T^3 line and the Einstein model peels away
// exponentially. Canvas2D only.
//
// Reference: Ashcroft and Mermin, Solid State Physics, Ch. 23.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { einsteinC, debyeC, debyeT3 } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sTD = document.getElementById('s-td'), vTD = document.getElementById('v-td');
const sTE = document.getElementById('s-te'), vTE = document.getElementById('v-te');
const btnSweep = document.getElementById('btn-sweep'), btnReset = document.getElementById('btn-reset');

const st = { TD: 400, TE: 320, Tcur: 200, sweep: true };
let frame = 0, running = true;
function tmax() { return 2.2 * Math.max(st.TD, st.TE); }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.12 }, { name: 'diag', weight: 0.98 }]); }
function syncVals() { sTD.value = st.TD; vTD.textContent = `${st.TD.toFixed(0)} K`; sTE.value = st.TE; vTE.textContent = `${st.TE.toFixed(0)} K`; }
function setSweep(on) { st.sweep = on; btnSweep.textContent = `Sweep T: ${on ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(on)); }
btnReset.addEventListener('click', () => { st.TD = 400; st.TE = 320; st.Tcur = 200; setSweep(false); syncVals(); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sTD.addEventListener('input', () => { st.TD = +sTD.value; syncVals(); if (!running) render(); });
sTE.addEventListener('input', () => { st.TE = +sTE.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    debye: '#ff9d3c', einstein: '#5ea8ff', dp: '#9aa0a6', cursor: '#ffd24a', t3: 'rgba(255,157,60,0.5)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  const dC = debyeC(st.Tcur, st.TD), eC = einsteinC(st.Tcur, st.TE);
  panel(col, r, `Specific heat C / 3Nk vs temperature:  Debye T = ${st.TD.toFixed(0)} K,  Einstein T = ${st.TE.toFixed(0)} K`);
  const inner = { x: r.x + 46, y: r.y + 30, w: r.w - 46 - 16, h: r.h - 30 - 34 };
  const Tm = tmax();
  const xOf = (T) => inner.x + T / Tm * inner.w, yOf = (c) => inner.y + inner.h * (1 - c / 1.12);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const c of [0, 0.25, 0.5, 0.75, 1.0]) { const Y = yOf(c); ctx.strokeStyle = c === 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(c.toFixed(2), inner.x - 5, Y); }
  // Dulong-Petit label.
  ctx.fillStyle = col.dp; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('Dulong-Petit (3Nk)', inner.x + inner.w - 6, yOf(1) - 3);
  ctx.save(); clipTo(ctx, inner);
  const curve = (fn, p, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const T = Tm * i / 300; const Y = yOf(fn(T, p)); i ? ctx.lineTo(xOf(T), Y) : ctx.moveTo(xOf(T), Y); } ctx.stroke(); };
  curve(debyeC, st.TD, col.debye);
  curve(einsteinC, st.TE, col.einstein);
  // characteristic-temperature ticks.
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.strokeStyle = col.debye; ctx.beginPath(); ctx.moveTo(xOf(st.TD), inner.y + inner.h); ctx.lineTo(xOf(st.TD), inner.y + inner.h - 14); ctx.stroke();
  ctx.strokeStyle = col.einstein; ctx.beginPath(); ctx.moveTo(xOf(st.TE), inner.y + inner.h); ctx.lineTo(xOf(st.TE), inner.y + inner.h - 14); ctx.stroke();
  ctx.setLineDash([]);
  // cursor.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.Tcur), inner.y); ctx.lineTo(xOf(st.Tcur), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.debye; ctx.beginPath(); ctx.arc(xOf(st.Tcur), yOf(dC), 4.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.einstein; ctx.beginPath(); ctx.arc(xOf(st.Tcur), yOf(eC), 4.5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.debye; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('Debye', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.einstein; ctx.fillText('Einstein', inner.x + 64, inner.y + 6);
  // cursor readout in the empty lower-right (high T, low C) corner.
  ctx.fillStyle = col.cursor; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`T = ${st.Tcur.toFixed(0)} K:  Debye ${dC.toFixed(3)},  Einstein ${eC.toFixed(3)}`, inner.x + inner.w - 6, inner.y + inner.h - 8); ctx.textBaseline = 'top';
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= 4; k += 1) { const T = Tm * k / 4; ctx.fillText(`${T.toFixed(0)}`, xOf(T), inner.y + inner.h + 6); }
  ctx.fillText('temperature T (K), drag or sweep', inner.x + inner.w / 2, inner.y + inner.h + 19);
  SC = { inner, Tm };
}

function drawDiag(col, r) {
  panel(col, r, 'Log-log: the Debye heat capacity is a straight T^3 line at low T; Einstein dies exponentially');
  const inner = { x: r.x + 46, y: r.y + 30, w: r.w - 46 - 16, h: r.h - 30 - 34 };
  const xlo = -1.5, xhi = 0.5;   // log10(T/TD)
  const ylo = -3, yhi = 0.1;     // log10(C/3Nk)
  const xOf = (lx) => inner.x + (lx - xlo) / (xhi - xlo) * inner.w, yOf = (ly) => inner.y + inner.h * (yhi - Math.max(ylo, Math.min(yhi, ly))) / (yhi - ylo);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let d = 0; d >= ylo; d -= 1) { const Y = yOf(d); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let lx = -1; lx <= 0; lx += 1) { const X = xOf(lx); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(X, inner.y); ctx.lineTo(X, inner.y + inner.h); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${lx}`, X, inner.y + inner.h + 6); }
  ctx.save(); clipTo(ctx, inner);
  // T^3 reference (slope 3).
  ctx.strokeStyle = col.t3; ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]); ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) { const lx = xlo + (xhi - xlo) * i / 100; const ly = Math.log10(debyeT3(Math.pow(10, lx), 1)); i ? ctx.lineTo(xOf(lx), yOf(ly)) : ctx.moveTo(xOf(lx), yOf(ly)); } ctx.stroke(); ctx.setLineDash([]);
  // Debye (universal in T/TD).
  ctx.strokeStyle = col.debye; ctx.lineWidth = 2.6; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 240; i += 1) { const lx = xlo + (xhi - xlo) * i / 240; const c = debyeC(Math.pow(10, lx), 1); if (c <= 0) { pen = false; continue; } const X = xOf(lx), Y = yOf(Math.log10(c)); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke();
  // Einstein (depends on TE/TD).
  const ratio = st.TE / st.TD;
  ctx.strokeStyle = col.einstein; ctx.lineWidth = 2.6; ctx.beginPath(); pen = false;
  for (let i = 0; i <= 240; i += 1) { const lx = xlo + (xhi - xlo) * i / 240; const c = einsteinC(Math.pow(10, lx), ratio); if (c <= 0) { pen = false; continue; } const X = xOf(lx), Y = yOf(Math.log10(c)); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke();
  // cursor at T/TD.
  const lxc = Math.log10(st.Tcur / st.TD); ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(lxc), inner.y); ctx.lineTo(xOf(lxc), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  ctx.fillStyle = col.t3; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('slope 3 (T^3)', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('T / T_Debye', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (st.sweep) st.Tcur = Math.max(8, tmax() * (0.5 + 0.46 * Math.sin(frame * 0.012))); render(); if (running) requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setCur(px) { if (!SC) return; st.Tcur = Math.max(2, Math.min(SC.Tm, (px - SC.inner.x) / SC.inner.w * SC.Tm)); }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || py > REG.scene.y + REG.scene.h) return; setSweep(false); drag = true; setCur(px); if (!running) render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [px] = ptr(e); setCur(px); if (!running) render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('TD')) st.TD = Math.max(80, Math.min(600, +params.get('TD')));
  if (params.get('TE')) st.TE = Math.max(80, Math.min(600, +params.get('TE')));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.sweep = false; setSweep(false); st.Tcur = 0.18 * st.TD; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'TD', label: 'Debye temperature (K)', value: st.TD, format: 'float' },
    { key: 'TE', label: 'Einstein temperature (K)', value: st.TE, format: 'float' },
    { key: 'T', label: 'cursor temperature (K)', value: st.Tcur, format: 'float' },
    { key: 'cd', label: 'Debye C/3Nk', value: debyeC(st.Tcur, st.TD), format: 'float' },
    { key: 'ce', label: 'Einstein C/3Nk', value: einsteinC(st.Tcur, st.TE), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const dHigh = debyeC(15 * st.TD, st.TD);
  const Tlow = st.TD / 20, ratioT3 = debyeC(Tlow, st.TD) / debyeT3(Tlow, st.TD);
  return [
    { key: 'dp', label: 'Dulong-Petit limit C/3Nk -> 1', value: dHigh.toFixed(3), status: Math.abs(dHigh - 1) < 0.02 ? 'pass' : 'drift' },
    { key: 't3', label: 'Debye T^3 law at low T', value: ratioT3.toFixed(3), status: Math.abs(ratioT3 - 1) < 0.05 ? 'pass' : 'drift' },
  ];
};
