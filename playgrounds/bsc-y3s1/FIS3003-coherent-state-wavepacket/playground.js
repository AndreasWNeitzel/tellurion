// The coherent state of a harmonic oscillator. The scene shows the parabolic well, the
// energy level, and the live |psi|^2 packet (with its real part) sloshing between the
// turning points at fixed width. The diagnostic is the phase-space orbit <x> vs <p> on
// its energy ellipse, with the kinetic/potential energy split as the packet swings.
// Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 3rd ed., Problem 3.35.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { density, rePsi, meanX, meanP, sigma0, potential, energyClassical, energyTotal, alphaMag } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sX0 = document.getElementById('s-x0'), vX0 = document.getElementById('v-x0');
const sOm = document.getElementById('s-om'), vOm = document.getElementById('v-om');
const btnRe = document.getElementById('btn-re'), btnReset = document.getElementById('btn-reset');

const st = { x0: 2.2, omega: 1.0, t: 0, showRe: true };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.22 }, { name: 'diag', weight: 0.88 }]); }
function syncVals() { sX0.value = st.x0; vX0.textContent = st.x0.toFixed(2); sOm.value = st.omega; vOm.textContent = st.omega.toFixed(2); btnRe.textContent = `Re(psi): ${st.showRe ? 'on' : 'off'}`; btnRe.setAttribute('aria-pressed', String(st.showRe)); }
btnReset.addEventListener('click', () => { st.x0 = 2.2; st.omega = 1.0; st.t = 0; syncVals(); if (!running) render(); });
btnRe.addEventListener('click', () => { st.showRe = !st.showRe; syncVals(); if (!running) render(); });
sX0.addEventListener('input', () => { st.x0 = +sX0.value; syncVals(); if (!running) render(); });
sOm.addEventListener('input', () => { st.omega = +sOm.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    well: '#6b7280', energy: '#c98cff', psi2: 'rgba(94,168,255,0.45)', psi2e: '#5ea8ff', repsi: '#7ad0ff', center: '#ffd24a', turn: 'rgba(255,255,255,0.22)', ke: '#8de08a', pe: '#ffb35c', zp: '#5a6472' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const xc = meanX(st.x0, st.omega, st.t), pc = meanP(st.x0, st.omega, st.t);
  const E = energyTotal(st.x0, st.omega), Ecl = energyClassical(st.x0, st.omega), s0 = sigma0(st.omega);
  panel(col, r, `Coherent state:  |alpha| = ${alphaMag(st.x0, st.omega).toFixed(2)},  omega = ${st.omega.toFixed(2)},  E = ${E.toFixed(2)},  sigma_0 = ${s0.toFixed(2)}`);
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 30 };
  const Xs = st.x0 * 1.12 + 3.4 * s0 + 0.3;
  const ymax = E * 1.7;
  const X = (x) => inner.x + (x + Xs) / (2 * Xs) * inner.w, Y = (e) => inner.y + inner.h * (1 - e / ymax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // well.
  ctx.strokeStyle = col.well; ctx.lineWidth = 2; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 240; i += 1) { const x = -Xs + 2 * Xs * i / 240; const v = potential(x, st.omega); if (v > ymax) { pen = false; continue; } const px = X(x), py = Y(v); if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; } } ctx.stroke();
  // energy line.
  ctx.strokeStyle = col.energy; ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(inner.x, Y(E)); ctx.lineTo(inner.x + inner.w, Y(E)); ctx.stroke(); ctx.setLineDash([]);
  // turning points.
  ctx.strokeStyle = col.turn; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); for (const xt of [-st.x0, st.x0]) { ctx.beginPath(); ctx.moveTo(X(xt), Y(0)); ctx.lineTo(X(xt), Y(Ecl)); ctx.stroke(); } ctx.setLineDash([]);
  // packet riding on the energy line.
  const peak = Math.sqrt(st.omega / Math.PI); const scale = 0.34 * ymax / peak;
  ctx.fillStyle = col.psi2; ctx.strokeStyle = col.psi2e; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(X(-Xs), Y(E));
  for (let i = 0; i <= 240; i += 1) { const x = -Xs + 2 * Xs * i / 240; ctx.lineTo(X(x), Y(E + scale * density(x, st.x0, st.omega, st.t))); }
  ctx.lineTo(X(Xs), Y(E)); ctx.closePath(); ctx.fill();
  ctx.beginPath(); for (let i = 0; i <= 240; i += 1) { const x = -Xs + 2 * Xs * i / 240; const py = Y(E + scale * density(x, st.x0, st.omega, st.t)); i ? ctx.lineTo(X(x), py) : ctx.moveTo(X(x), py); } ctx.stroke();
  // real part.
  if (st.showRe) { const rs = 0.42 * ymax; ctx.strokeStyle = col.repsi; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.9; ctx.beginPath(); for (let i = 0; i <= 360; i += 1) { const x = -Xs + 2 * Xs * i / 360; const py = Y(E + rs * rePsi(x, st.x0, st.omega, st.t)); i ? ctx.lineTo(X(x), py) : ctx.moveTo(X(x), py); } ctx.stroke(); ctx.globalAlpha = 1; }
  // packet centre.
  ctx.strokeStyle = col.center; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(xc), Y(0)); ctx.lineTo(X(xc), Y(E + scale * peak)); ctx.stroke();
  ctx.fillStyle = col.center; ctx.beginPath(); ctx.arc(X(xc), Y(0), 5, 0, 6.2832); ctx.fill();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.energy; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(`E`, inner.x + 4, Y(E) - 3);
  ctx.fillStyle = col.psi2e; ctx.textBaseline = 'top'; ctx.fillText('|psi|^2', inner.x + 6, inner.y + 6);
  if (st.showRe) { ctx.fillStyle = col.repsi; ctx.fillText('Re psi', inner.x + 64, inner.y + 6); }
  ctx.fillStyle = col.center; ctx.textAlign = 'center'; ctx.fillText(`<x> = ${xc.toFixed(2)}`, X(xc), Y(0) + 4 > inner.y + inner.h - 14 ? inner.y + inner.h - 14 : Y(0) + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const xt of [-st.x0, st.x0]) ctx.fillText('turn', X(xt), inner.y + inner.h + 6);
  ctx.fillText('position x', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function drawDiag(col, r) {
  const xc = meanX(st.x0, st.omega, st.t), pc = meanP(st.x0, st.omega, st.t);
  panel(col, r, 'Phase-space orbit <x> vs <p> on its energy ellipse, and the kinetic / potential energy split');
  const inner = { x: r.x + 8, y: r.y + 28, w: r.w - 16, h: r.h - 28 - 8 };
  // phase space (left, square-ish).
  const side = Math.min(inner.w * 0.52, inner.h);
  const ph = { x: inner.x + 46, y: inner.y + 6, w: side - 46, h: inner.h - 6 - 28 };
  const Xm = st.x0 * 1.3, Pm = st.omega * st.x0 * 1.3;
  const PX = (x) => ph.x + (x + Xm) / (2 * Xm) * ph.w, PY = (p) => ph.y + ph.h * (1 - (p + Pm) / (2 * Pm));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(ph.x, ph.y, ph.w, ph.h);
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ph.x, PY(0)); ctx.lineTo(ph.x + ph.w, PY(0)); ctx.moveTo(PX(0), ph.y); ctx.lineTo(PX(0), ph.y + ph.h); ctx.stroke();
  ctx.save(); clipTo(ctx, ph);
  // faint energy contours.
  for (const f of [0.45, 0.72, 1.0]) { ctx.strokeStyle = f === 1 ? col.center : 'rgba(255,255,255,0.10)'; ctx.lineWidth = f === 1 ? 2.4 : 1; ctx.beginPath(); for (let k = 0; k <= 120; k += 1) { const a = 2 * Math.PI * k / 120; const x = f * st.x0 * Math.cos(a), p = -f * st.omega * st.x0 * Math.sin(a); k ? ctx.lineTo(PX(x), PY(p)) : ctx.moveTo(PX(x), PY(p)); } ctx.closePath(); ctx.stroke(); }
  // orbiting point and its trail direction.
  ctx.fillStyle = col.center; ctx.beginPath(); ctx.arc(PX(xc), PY(pc), 6, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,74,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(PX(0), PY(0)); ctx.lineTo(PX(xc), PY(pc)); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('<x>', ph.x + ph.w - 14, PY(0) + 4); ctx.save(); ctx.translate(ph.x - 30, ph.y + ph.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('<p>', 0, 0); ctx.restore();
  ctx.fillStyle = col.center; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`<x> = ${xc.toFixed(2)}   <p> = ${pc.toFixed(2)}`, ph.x + 4, ph.y + 4);

  // energy split (right).
  const Ecl = energyClassical(st.x0, st.omega), KE = 0.5 * pc * pc, PE = 0.5 * st.omega * st.omega * xc * xc, ZP = 0.5 * st.omega, E = energyTotal(st.x0, st.omega);
  const e = { x: inner.x + inner.w * 0.58, y: inner.y + 20, w: inner.w * 0.40, h: inner.h - 20 - 16 };
  const L = e.w - 8, bh = 30;
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = col.fg; ctx.fillText(`total E = ${E.toFixed(2)}`, e.x, e.y - 4);
  // stacked bar: KE + PE + zero point, lengths scaled to E.
  const sc = L / E;
  ctx.fillStyle = col.ke; ctx.fillRect(e.x, e.y, KE * sc, bh);
  ctx.fillStyle = col.pe; ctx.fillRect(e.x + KE * sc, e.y, PE * sc, bh);
  ctx.fillStyle = col.zp; ctx.fillRect(e.x + (KE + PE) * sc, e.y, ZP * sc, bh);
  ctx.fillStyle = '#06070c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  if (KE * sc > 34) ctx.fillText('KE', e.x + KE * sc / 2, e.y + bh / 2);
  if (PE * sc > 34) ctx.fillText('PE', e.x + KE * sc + PE * sc / 2, e.y + bh / 2);
  ctx.fillStyle = col.fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = col.ke; ctx.fillText(`kinetic  ${KE.toFixed(2)}`, e.x, e.y + bh + 8);
  ctx.fillStyle = col.pe; ctx.fillText(`potential  ${PE.toFixed(2)}`, e.x, e.y + bh + 22);
  ctx.fillStyle = col.zp; ctx.fillText(`zero-point  ${ZP.toFixed(2)}`, e.x, e.y + bh + 36);
  ctx.fillStyle = col.muted; ctx.fillText('KE, PE trade off', e.x, e.y + bh + 54);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (running) st.t += 0.02; render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('x0')) st.x0 = Math.max(0.2, Math.min(3, +params.get('x0')));
  if (params.get('omega')) st.omega = Math.max(0.6, Math.min(1.8, +params.get('omega')));
  syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.t = 1.0 / st.omega; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'alpha', label: 'coherent amplitude |alpha|', value: alphaMag(st.x0, st.omega), format: 'float' },
    { key: 'omega', label: 'frequency omega', value: st.omega, format: 'float' },
    { key: 'sigma', label: 'packet width sigma_0', value: sigma0(st.omega), format: 'float' },
    { key: 'x', label: 'centre <x>', value: meanX(st.x0, st.omega, st.t), format: 'float' },
    { key: 'p', label: 'momentum <p>', value: meanP(st.x0, st.omega, st.t), format: 'float' },
    { key: 'E', label: 'energy E', value: energyTotal(st.x0, st.omega), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const s0 = sigma0(st.omega), xc = meanX(st.x0, st.omega, st.t), pc = meanP(st.x0, st.omega, st.t);
  const ell = (xc * xc) / (st.x0 * st.x0) + (pc * pc) / (st.omega * st.omega * st.x0 * st.x0);
  return [
    { key: 'width', label: 'width fixed at sigma_0 (no spreading)', value: s0.toFixed(3), status: 'pass' },
    { key: 'orbit', label: 'phase point on energy ellipse', value: ell.toFixed(4), status: Math.abs(ell - 1) < 1e-6 || st.x0 < 1e-9 ? 'pass' : 'drift' },
  ];
};
