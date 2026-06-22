// Lattice specific heat of a solid. The scene makes the mechanism visible: a lattice
// vibrating with thermal amplitude, and the phonon mode spectrum coloured by each
// mode's activation (its per-mode heat capacity, the Einstein function of hbar*omega/kT).
// As kT sweeps up in frequency, modes switch from frozen (cool) to active (warm), and
// the activation-weighted area of the density of states IS C/3Nk. The diagnostic plots
// the resulting Debye and Einstein heat capacities against temperature. Canvas2D only.
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
const sTcur = document.getElementById('s-tcur'), vTcur = document.getElementById('v-tcur');
const sTD = document.getElementById('s-td'), vTD = document.getElementById('v-td');
const sTE = document.getElementById('s-te'), vTE = document.getElementById('v-te');
const btnSweep = document.getElementById('btn-sweep'), btnReset = document.getElementById('btn-reset');

const st = { TD: 400, TE: 320, Tcur: 200, sweep: true };
let running = true, t = 0, lastTs = 0;
function tmax() { return 2.2 * Math.max(st.TD, st.TE); }

// lattice of atoms with per-atom thermal-mode phases (deterministic).
const NLX = 6, NLY = 5;
const lat = [];
(function seedLattice() {
  let s = 0x2545f491 >>> 0;
  const rnd = () => { s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) >>> 0; return ((s ^ (s >>> 14)) >>> 0) / 4294967296; };
  for (let j = 0; j < NLY; j += 1) for (let i = 0; i < NLX; i += 1) lat.push({ i, j, f1: 5 + 4 * rnd(), f2: 5 + 4 * rnd(), p1: 6.28 * rnd(), p2: 6.28 * rnd() });
})();

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.18 }, { name: 'diag', weight: 0.92 }]); }
function syncVals() {
  sTcur.value = Math.round(st.Tcur); vTcur.textContent = `${st.Tcur.toFixed(0)} K`;
  sTD.value = st.TD; vTD.textContent = `${st.TD.toFixed(0)} K`;
  sTE.value = st.TE; vTE.textContent = `${st.TE.toFixed(0)} K`;
}
function setSweep(on) { st.sweep = on; btnSweep.textContent = `Sweep T: ${on ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(on)); }
btnReset.addEventListener('click', () => { st.TD = 400; st.TE = 320; st.Tcur = 200; setSweep(false); syncVals(); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sTcur.addEventListener('input', () => { st.Tcur = +sTcur.value; setSweep(false); syncVals(); if (!running) render(); });
sTD.addEventListener('input', () => { st.TD = +sTD.value; syncVals(); if (!running) render(); });
sTE.addEventListener('input', () => { st.TE = +sTE.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    debye: '#ff9d3c', einstein: '#5ea8ff', dp: '#9aa0a6', cursor: '#ffd24a', t3: 'rgba(255,157,60,0.5)', atom: '#ffcaa0', spring: 'rgba(255,255,255,0.16)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

// a mode's activation a in [0,1] coloured frozen-blue -> active-orange -> hot-yellow.
function actColor(a) {
  a = Math.max(0, Math.min(1, a));
  let r, g, b;
  if (a < 0.6) { const u = a / 0.6; r = 52 + (255 - 52) * u; g = 74 + (165 - 74) * u; b = 120 + (55 - 120) * u; }
  else { const u = (a - 0.6) / 0.4; r = 255; g = 165 + (225 - 165) * u; b = 55 + (140 - 55) * u; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function drawLattice(col, box) {
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('lattice', box.x, box.y - 1);
  const gx = box.x, gy = box.y + 18, gw = box.w, gh = box.h - 18;
  const sx = gw / (NLX + 1), sy = gh / (NLY + 1);
  const amp01 = Math.min(1, Math.sqrt(st.Tcur / 650));
  const A = amp01 * Math.min(sx, sy) * 0.46;
  const pos = lat.map((a) => ({ x: gx + (a.i + 1) * sx + A * Math.sin(t * a.f1 + a.p1), y: gy + (a.j + 1) * sy + A * Math.cos(t * a.f2 + a.p2) }));
  const at = (i, j) => pos[j * NLX + i];
  // springs to right and down neighbours.
  ctx.strokeStyle = col.spring; ctx.lineWidth = 1.2;
  for (let j = 0; j < NLY; j += 1) for (let i = 0; i < NLX; i += 1) {
    const p = at(i, j);
    if (i < NLX - 1) { const q = at(i + 1, j); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    if (j < NLY - 1) { const q = at(i, j + 1); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  }
  for (const p of pos) { ctx.fillStyle = col.atom; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`RMS amplitude ~ ${(amp01).toFixed(2)} (of max)`, gx + gw / 2, gy + gh + 4);
}

function drawSpectrum(col, box) {
  const uE = st.TE / st.TD;
  const uMax = Math.max(1.18, uE * 1.12);
  const inner = { x: box.x + 30, y: box.y + 18, w: box.w - 30, h: box.h - 18 - 26 };
  const xOf = (u) => inner.x + u / uMax * inner.w;
  const base = inner.y + inner.h, yOf = (h) => base - h * inner.h * 0.96;     // h in [0,1] of DOS height
  ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('phonon modes', box.x, box.y - 1);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // Debye density of states g(omega) ~ omega^2 up to omega_D, coloured by each mode's activation.
  const NB = 48;
  for (let k = 0; k < NB; k += 1) {
    const u = (k + 0.5) / NB; if (u > 1) break;
    const a = einsteinC(st.Tcur, st.TD * u);
    const x0 = xOf(k / NB), x1 = xOf((k + 1) / NB);
    ctx.fillStyle = actColor(a); ctx.fillRect(x0, yOf(u * u), x1 - x0 + 0.6, base - yOf(u * u));
  }
  // DOS envelope outline.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let k = 0; k <= 60; k += 1) { const u = k / 60; const X = xOf(u), Y = yOf(u * u); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.lineTo(xOf(1), base); ctx.stroke();
  // Einstein spike: all 3N modes at one frequency.
  const aE = einsteinC(st.Tcur, st.TE);
  ctx.fillStyle = actColor(aE); ctx.fillRect(xOf(uE) - 6, yOf(0.96), 12, base - yOf(0.96));
  ctx.strokeStyle = col.einstein; ctx.lineWidth = 1.6; ctx.strokeRect(xOf(uE) - 6, yOf(0.96), 12, base - yOf(0.96));
  // kT marker: modes to the left (hbar*omega < kT) are active.
  const uTh = Math.min(uMax * 1.2, st.Tcur / st.TD);
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xOf(uTh), inner.y); ctx.lineTo(xOf(uTh), base); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  // labels.
  ctx.fillStyle = col.cursor; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  if (xOf(uTh) < inner.x + inner.w - 4) ctx.fillText('kT', Math.min(inner.x + inner.w - 12, Math.max(inner.x + 12, xOf(uTh))), inner.y + 12);
  ctx.fillStyle = col.einstein; ctx.textBaseline = 'top'; ctx.fillText('Einstein', xOf(uE), inner.y + 2);
  ctx.fillStyle = col.debye; ctx.textAlign = 'left'; ctx.fillText('Debye g~w^2', inner.x + 4, inner.y + 2);
  // axis.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const u of [0, 0.5, 1]) ctx.fillText(u.toFixed(1), xOf(u), base + 5);
  ctx.fillText('frequency omega / omega_Debye', inner.x + inner.w / 2, base + 16);
}

function drawScene(col, r) {
  panel(col, r, 'Modes activate as kT rises (warm fraction = C/3Nk)');
  const inner = { x: r.x + 12, y: r.y + 30, w: r.w - 24, h: r.h - 30 - 12 };
  const latW = inner.w * 0.34;
  drawLattice(col, { x: inner.x, y: inner.y + 6, w: latW - 16, h: inner.h - 6 });
  drawSpectrum(col, { x: inner.x + latW, y: inner.y + 6, w: inner.w - latW, h: inner.h - 6 });
}

let DC = null;
function drawDiag(col, r) {
  const dC = debyeC(st.Tcur, st.TD), eC = einsteinC(st.Tcur, st.TE);
  panel(col, r, 'Heat capacity C / 3Nk vs temperature (the activation-weighted area above)');
  const inner = { x: r.x + 46, y: r.y + 30, w: r.w - 46 - 16, h: r.h - 30 - 34 };
  const Tm = tmax();
  const xOf = (T) => inner.x + T / Tm * inner.w, yOf = (c) => inner.y + inner.h * (1 - c / 1.12);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const c of [0, 0.25, 0.5, 0.75, 1.0]) { const Y = yOf(c); ctx.strokeStyle = c === 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(c.toFixed(2), inner.x - 5, Y); }
  ctx.fillStyle = col.dp; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('Dulong-Petit (3Nk)', inner.x + inner.w - 6, yOf(1) - 3);
  ctx.save(); clipTo(ctx, inner);
  // Debye T^3 asymptote (dashed).
  ctx.strokeStyle = col.t3; ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]); ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const T = Tm * i / 120; const Y = yOf(Math.min(1.12, debyeT3(T, st.TD))); i ? ctx.lineTo(xOf(T), Y) : ctx.moveTo(xOf(T), Y); } ctx.stroke(); ctx.setLineDash([]);
  const curve = (fn, p, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 300; i += 1) { const T = Tm * i / 300; const Y = yOf(fn(T, p)); i ? ctx.lineTo(xOf(T), Y) : ctx.moveTo(xOf(T), Y); } ctx.stroke(); };
  curve(debyeC, st.TD, col.debye);
  curve(einsteinC, st.TE, col.einstein);
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.strokeStyle = col.debye; ctx.beginPath(); ctx.moveTo(xOf(st.TD), inner.y + inner.h); ctx.lineTo(xOf(st.TD), inner.y + inner.h - 14); ctx.stroke();
  ctx.strokeStyle = col.einstein; ctx.beginPath(); ctx.moveTo(xOf(st.TE), inner.y + inner.h); ctx.lineTo(xOf(st.TE), inner.y + inner.h - 14); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.Tcur), inner.y); ctx.lineTo(xOf(st.Tcur), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.debye; ctx.beginPath(); ctx.arc(xOf(st.Tcur), yOf(dC), 4.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.einstein; ctx.beginPath(); ctx.arc(xOf(st.Tcur), yOf(eC), 4.5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.debye; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('Debye', inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.einstein; ctx.fillText('Einstein', inner.x + 64, inner.y + 6);
  ctx.fillStyle = col.t3; ctx.fillText('T^3', inner.x + 132, inner.y + 6);
  ctx.fillStyle = col.cursor; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`T = ${st.Tcur.toFixed(0)} K:  Debye ${dC.toFixed(3)},  Einstein ${eC.toFixed(3)}`, inner.x + inner.w - 6, inner.y + inner.h - 8); ctx.textBaseline = 'top';
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k <= 4; k += 1) { const T = Tm * k / 4; ctx.fillText(`${T.toFixed(0)}`, xOf(T), inner.y + inner.h + 6); }
  ctx.fillText('temperature T (K), drag or sweep', inner.x + inner.w / 2, inner.y + inner.h + 19);
  DC = { inner, Tm };
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick(ts) {
  if (!lastTs) lastTs = ts; let dt = (ts - lastTs) / 1000; lastTs = ts; if (dt > 0.05) dt = 0.05;
  t += dt;
  if (st.sweep) { const hi = Math.min(1000, 1.6 * Math.max(st.TD, st.TE)); st.Tcur = 10 + (hi - 10) * (0.5 - 0.5 * Math.cos(t * 0.5)); sTcur.value = Math.round(st.Tcur); vTcur.textContent = `${st.Tcur.toFixed(0)} K`; }
  render();
  if (running) requestAnimationFrame(tick);
}

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setCur(px) { if (!DC) return; st.Tcur = Math.max(2, Math.min(DC.Tm, (px - DC.inner.x) / DC.inner.w * DC.Tm)); sTcur.value = Math.round(st.Tcur); vTcur.textContent = `${st.Tcur.toFixed(0)} K`; }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || py < REG.diag.y) return; setSweep(false); drag = true; setCur(px); if (!running) render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [px] = ptr(e); setCur(px); if (!running) render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('TD')) st.TD = Math.max(80, Math.min(600, +params.get('TD')));
  if (params.get('TE')) st.TE = Math.max(80, Math.min(600, +params.get('TE')));
  if (params.get('T')) st.Tcur = Math.max(5, Math.min(1000, +params.get('T')));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.sweep = false; setSweep(false); if (!params.get('T')) st.Tcur = 0.5 * st.TD; t = 1.6; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'T', label: 'temperature (K)', value: st.Tcur, format: 'float' },
    { key: 'TD', label: 'Debye temperature (K)', value: st.TD, format: 'float' },
    { key: 'TE', label: 'Einstein temperature (K)', value: st.TE, format: 'float' },
    { key: 'cd', label: 'Debye C/3Nk (warm fraction)', value: debyeC(st.Tcur, st.TD), format: 'float' },
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
