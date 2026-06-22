// Landau quantization. The scene animates the cyclotron orbit of a charged particle in
// a magnetic field beside the Landau energy ladder filled to the Fermi level. The
// diagnostic is the Landau fan, E_n = (n+1/2) hbar omega_c against B, whose lines sweep
// past the Fermi energy as the field grows (de Haas-van Alphen oscillations). Canvas2D.
//
// Reference: Ashcroft and Mermin, Solid State Physics, Ch. 14.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { cyclotronFreq, landauEnergy, magneticLength, classicalRadius, filledCount, highestFilledLevel } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sB = document.getElementById('s-b'), vB = document.getElementById('v-b');
const sF = document.getElementById('s-f'), vF = document.getElementById('v-f');
const btnReset = document.getElementById('btn-reset');

const BLO = 0.3, BHI = 4, EMAX = 13;
const st = { B: 1.5, EF: 8, phi: 0 };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.18 }, { name: 'diag', weight: 0.92 }]); }
function syncVals() { sB.value = st.B; vB.textContent = st.B.toFixed(2); sF.value = st.EF; vF.textContent = st.EF.toFixed(1); }
btnReset.addEventListener('click', () => { st.B = 1.5; st.EF = 8; syncVals(); if (!running) render(); });
sB.addEventListener('input', () => { st.B = +sB.value; syncVals(); if (!running) render(); });
sF.addEventListener('input', () => { st.EF = +sF.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    field: 'rgba(94,168,255,0.4)', orbit: '#5ec8ff', particle: '#ffd24a', vel: '#8de08a', filled: '#5ea8ff', empty: 'rgba(255,255,255,0.18)', ef: '#ff9d3c', fan: '#5ec8ff', fanF: '#5ea8ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const wc = cyclotronFreq(st.B), nF = highestFilledLevel(st.EF, st.B), nFilled = filledCount(st.EF, st.B);
  panel(col, r, `Landau levels:  B = ${st.B.toFixed(2)},  omega_c = ${wc.toFixed(2)},  level spacing hbar omega_c = ${st.B.toFixed(2)},  ${nFilled} levels filled`);
  const inner = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 10 };
  // cyclotron orbit (left).
  const orb = { x: inner.x, y: inner.y, w: inner.w * 0.46, h: inner.h };
  const ocx = orb.x + orb.w / 2, ocy = orb.y + orb.h / 2;
  // B field dots out of page (circle with a centre dot).
  ctx.lineWidth = 1; for (let gx = orb.x + 24; gx < orb.x + orb.w - 8; gx += 34) for (let gy = orb.y + 22; gy < orb.y + orb.h - 18; gy += 34) { ctx.strokeStyle = col.field; ctx.beginPath(); ctx.arc(gx, gy, 5, 0, 6.2832); ctx.stroke(); ctx.fillStyle = col.field; ctx.beginPath(); ctx.arc(gx, gy, 1.4, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('B out of page', orb.x + 4, orb.y + 4);
  // orbit radius (shrinks as B grows; l_B = 1/sqrt(B)).
  const pR = Math.max(12, Math.min(orb.w, orb.h) * 0.42 * (BLO / st.B));
  ctx.strokeStyle = col.orbit; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ocx, ocy, pR, 0, 6.2832); ctx.stroke();
  const px = ocx + pR * Math.cos(st.phi), py = ocy + pR * Math.sin(st.phi);
  // velocity (tangent, clockwise for electron).
  const vx = Math.sin(st.phi), vy = -Math.cos(st.phi);
  ctx.strokeStyle = col.vel; ctx.fillStyle = col.vel; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + vx * 22, py + vy * 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px + vx * 22, py + vy * 22); ctx.lineTo(px + vx * 22 - vy * 4 - vx * 6, py + vy * 22 + vx * 4 - vy * 6); ctx.lineTo(px + vx * 22 + vy * 4 - vx * 6, py + vy * 22 - vx * 4 - vy * 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col.particle; ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`l_B = ${magneticLength(st.B).toFixed(2)}`, ocx, orb.y + orb.h - 16);
  ctx.fillText('orbit tightens as B grows', ocx, orb.y + orb.h - 2);

  // Landau ladder (right).
  const lad = { x: inner.x + inner.w * 0.54, y: inner.y + 14, w: inner.w * 0.46 - 8, h: inner.h - 14 - 22 };
  const yOf = (E) => lad.y + lad.h * (1 - E / EMAX);
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lad.x, lad.y); ctx.lineTo(lad.x, lad.y + lad.h); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let E = 0; E <= EMAX; E += 4) { ctx.fillText(`${E}`, lad.x - 5, yOf(E)); }
  // levels.
  for (let n = 0; landauEnergy(n, st.B) <= EMAX; n += 1) {
    const E = landauEnergy(n, st.B), Y = yOf(E), filled = n <= nF;
    ctx.strokeStyle = filled ? col.filled : col.empty; ctx.lineWidth = filled ? 3 : 1.4; ctx.beginPath(); ctx.moveTo(lad.x + 2, Y); ctx.lineTo(lad.x + lad.w, Y); ctx.stroke();
    if (st.B > 0.8 && n <= 6) { ctx.fillStyle = filled ? col.filled : col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(`n=${n}`, lad.x + lad.w - 34, Y - 2); }
  }
  // Fermi level.
  ctx.strokeStyle = col.ef; ctx.lineWidth = 1.6; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(lad.x, yOf(st.EF)); ctx.lineTo(lad.x + lad.w, yOf(st.EF)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.ef; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`E_F = ${st.EF.toFixed(1)}`, lad.x + lad.w, yOf(st.EF) - 3);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('E_n = (n+1/2) hbar omega_c', lad.x + lad.w / 2, lad.y + lad.h + 6);
}

function drawDiag(col, r) {
  panel(col, r, 'Landau fan E_n vs B: levels fan from the origin and sweep past E_F as B grows (quantum oscillations)');
  const inner = { x: r.x + 40, y: r.y + 30, w: r.w - 40 - 16, h: r.h - 30 - 34 };
  const xOf = (B) => inner.x + (B - 0) / BHI * inner.w, yOf = (E) => inner.y + inner.h * (1 - E / EMAX);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let E = 0; E <= EMAX; E += 4) { const Y = yOf(E); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`${E}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  // fan lines.
  for (let n = 0; n < 60; n += 1) { if (landauEnergy(n, BLO) > EMAX && landauEnergy(n, 0.05) > EMAX) break; ctx.strokeStyle = 'rgba(94,200,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0)); ctx.lineTo(xOf(BHI), yOf(landauEnergy(n, BHI))); ctx.stroke(); }
  // Fermi level.
  ctx.strokeStyle = col.ef; ctx.lineWidth = 1.8; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(st.EF)); ctx.lineTo(inner.x + inner.w, yOf(st.EF)); ctx.stroke(); ctx.setLineDash([]);
  // current B and filled crossings.
  ctx.strokeStyle = col.particle; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.B), inner.y); ctx.lineTo(xOf(st.B), inner.y + inner.h); ctx.stroke();
  for (let n = 0; landauEnergy(n, st.B) <= EMAX; n += 1) { const E = landauEnergy(n, st.B); ctx.fillStyle = E <= st.EF ? col.fanF : 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(xOf(st.B), yOf(E), E <= st.EF ? 4.5 : 3, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = col.ef; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('E_F', inner.x + 6, yOf(st.EF) - 3);
  ctx.fillStyle = col.particle; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`B = ${st.B.toFixed(2)}: ${filledCount(st.EF, st.B)} filled`, xOf(st.B), inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (let B = 0; B <= BHI; B += 1) ctx.fillText(`${B}`, xOf(B), inner.y + inner.h + 6); ctx.fillText('magnetic field B', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.save(); ctx.translate(inner.x - 28, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('energy E', 0, 0); ctx.restore();
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; st.phi += cyclotronFreq(st.B) * 0.03; render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('B')) st.B = Math.max(BLO, Math.min(BHI, +params.get('B')));
  if (params.get('EF')) st.EF = Math.max(3, Math.min(12, +params.get('EF')));
  syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.phi = -0.9; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'B', label: 'magnetic field B', value: st.B, format: 'float' },
    { key: 'wc', label: 'cyclotron frequency omega_c', value: cyclotronFreq(st.B), format: 'float' },
    { key: 'lB', label: 'magnetic length l_B', value: magneticLength(st.B), format: 'float' },
    { key: 'EF', label: 'Fermi energy E_F', value: st.EF, format: 'float' },
    { key: 'nf', label: 'filled Landau levels', value: filledCount(st.EF, st.B), format: 'int' },
    { key: 'E0', label: 'lowest level E_0 = B/2', value: landauEnergy(0, st.B), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const spacing = landauEnergy(1, st.B) - landauEnergy(0, st.B);
  return [
    { key: 'spacing', label: 'level spacing = hbar omega_c', value: spacing.toFixed(3), status: Math.abs(spacing - cyclotronFreq(st.B)) < 1e-9 ? 'pass' : 'drift' },
    { key: 'zero', label: 'lowest level at B/2 (zero-point)', value: landauEnergy(0, st.B).toFixed(3), status: Math.abs(landauEnergy(0, st.B) - st.B / 2) < 1e-9 ? 'pass' : 'drift' },
  ];
};
