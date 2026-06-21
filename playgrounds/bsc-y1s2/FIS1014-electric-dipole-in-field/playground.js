// An electric dipole in a uniform field. The scene shows the two charges pulled in
// opposite directions (a couple), the torque rotating the dipole toward alignment,
// and its libration; the diagnostic is the orientation-energy well U(theta) with
// the total energy line and the state oscillating between turning points. Canvas2D.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec. 4.1.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { torque, energyU, totalEnergy, smallAnglePeriod, step } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sE = document.getElementById('s-E'), vE = document.getElementById('v-E');
const sG = document.getElementById('s-g'), vG = document.getElementById('v-g');
const btnReset = document.getElementById('btn-reset');

const P = 1.4, I = 1.0; // dipole moment and moment of inertia (arb. units)
const DEF = { E: 1.6, gamma: 0.12, theta: 2.3 };
const st = { E: DEF.E, gamma: DEF.gamma };
let dip = { theta: DEF.theta, omega: 0 };
function par() { return { I, p: P, E: st.E, gamma: st.gamma }; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.2 }, { name: 'diag', weight: 1.0 }]); }
function syncVals() {
  sE.value = st.E; vE.textContent = `${st.E.toFixed(2)}`;
  sG.value = st.gamma; vG.textContent = st.gamma === 0 ? 'none' : st.gamma.toFixed(2);
}
btnReset.addEventListener('click', () => { st.E = DEF.E; st.gamma = DEF.gamma; dip = { theta: DEF.theta, omega: 0 }; syncVals(); });
sE.addEventListener('input', () => { st.E = +sE.value; syncVals(); });
sG.addEventListener('input', () => { st.gamma = +sG.value; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', field: '#3fb0c8', pos: '#ff5d5d', neg: '#5b8cff', rod: '#d8dde6', force: '#ffd166', torque: '#b487ff', well: '#8de08a', etot: '#ff9d3c', ke: 'rgba(141,224,138,0.18)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let CEN = null, ROD = 0;
function drawScene(col, r) {
  panel(col, r, 'The field torques the dipole toward alignment (drag to reorient)');
  const cx = r.x + r.w * 0.5, cy = r.y + 26 + (r.h - 26) * 0.5; CEN = { x: cx, y: cy };
  ROD = Math.min(r.w, r.h - 26) * 0.3;
  const th = dip.theta;
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 20, w: r.w, h: r.h - 20 });
  // uniform field: horizontal arrows pointing right (the E direction).
  const fa = Math.min(0.5, st.E / 3 * 0.5);
  ctx.strokeStyle = `rgba(63,176,200,${fa.toFixed(3)})`; ctx.fillStyle = `rgba(63,176,200,${fa.toFixed(3)})`; ctx.lineWidth = 1.3;
  for (let j = 0; j < 6; j += 1) { const y = r.y + 40 + (r.h - 60) * (j + 0.5) / 6;
    for (let i = 0; i < 5; i += 1) { const x0 = r.x + 24 + (r.w - 48) * i / 5, x1 = x0 + (r.w - 48) / 5 * 0.62;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 6, y - 3); ctx.lineTo(x1 - 6, y + 3); ctx.closePath(); ctx.fill(); } }
  // field label.
  ctx.fillStyle = col.field; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('E', r.x + r.w - 12, r.y + 28);

  // angle arc between the dipole axis and the field (+x).
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, ROD * 0.46, 0, -th, th > 0); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('theta', cx + ROD * 0.5 + 4, cy - Math.sin(th / 2) * ROD * 0.46);

  // charge end positions (+q along +p, -q opposite). screen y is down, so -sin.
  const ex = Math.cos(th), ey = -Math.sin(th);
  const pPos = { x: cx + ex * ROD, y: cy + ey * ROD };
  const nPos = { x: cx - ex * ROD, y: cy - ey * ROD };
  // force arrows: qE on +q (toward +x), -qE on -q (toward -x). They form the couple.
  const fl = Math.min(70, 26 + st.E * 16);
  drawArrow(col.force, pPos.x, pPos.y, pPos.x + fl, pPos.y, 7);
  drawArrow(col.force, nPos.x, nPos.y, nPos.x - fl, nPos.y, 7);
  ctx.fillStyle = col.force; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('qE', pPos.x + fl * 0.6, pPos.y - 6); ctx.fillText('qE', nPos.x - fl * 0.6, nPos.y - 6);
  // the rod and the p arrow.
  ctx.strokeStyle = col.rod; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(nPos.x, nPos.y); ctx.lineTo(pPos.x, pPos.y); ctx.stroke(); ctx.lineCap = 'butt';
  drawArrow(col.torque, cx, cy, cx + ex * ROD * 0.74, cy + ey * ROD * 0.74, 8, 2.4);
  ctx.fillStyle = col.torque; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillText('p', cx + ex * ROD * 0.5 - ey * 12, cy + ey * ROD * 0.5 - 8 - ex * 0);
  // charges.
  for (const [pp, fill, sym] of [[pPos, col.pos, '+'], [nPos, col.neg, '−']]) {
    ctx.fillStyle = fill; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pp.x, pp.y, 13, 0, 6.28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sym, pp.x, pp.y + 1);
  }
  ctx.restore();
  // readout strip.
  const tq = torque(P, st.E, th), KE = 0.5 * I * dip.omega * dip.omega;
  const items = [[`theta = ${(th * 180 / Math.PI).toFixed(0)} deg`, col.rod], [`torque = ${tq.toFixed(2)}`, col.torque], [`KE = ${KE.toFixed(2)}`, col.well]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 10); });
}
function drawArrow(color, x0, y0, x1, y1, head, lw) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - head * Math.cos(a - 0.4), y1 - head * Math.sin(a - 0.4)); ctx.lineTo(x1 - head * Math.cos(a + 0.4), y1 - head * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
}

function drawDiag(col, r) {
  panel(col, r, 'Orientation energy U(theta): the dipole librates in the well between turning points');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 18, h: r.h - 28 - 34 };
  const th = dip.theta; const Etot = totalEnergy(I, dip.omega, P, st.E, th);
  const Umax = P * st.E, lo = -Umax * 1.15, hi = Umax * 1.15;
  const xOf = (a) => inner.x + (a + Math.PI) / (2 * Math.PI) * inner.w;
  const yOf = (v) => inner.y + inner.h * (hi - v) / (hi - lo);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // kinetic-energy band between U(theta) and E_tot, over the accessible range.
  ctx.fillStyle = col.ke; ctx.beginPath(); let started = false;
  for (let i = 0; i <= 240; i += 1) { const a = -Math.PI + 2 * Math.PI * i / 240; const u = energyU(P, st.E, a); if (u <= Etot) { const X = xOf(a); if (!started) { ctx.moveTo(X, yOf(u)); started = true; } else ctx.lineTo(X, yOf(u)); } }
  for (let i = 240; i >= 0; i -= 1) { const a = -Math.PI + 2 * Math.PI * i / 240; const u = energyU(P, st.E, a); if (u <= Etot) ctx.lineTo(xOf(a), yOf(Math.min(Etot, hi))); }
  ctx.closePath(); ctx.fill();
  // E_tot line.
  ctx.strokeStyle = col.etot; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(Etot)); ctx.lineTo(inner.x + inner.w, yOf(Etot)); ctx.stroke(); ctx.setLineDash([]);
  // U(theta) well.
  ctx.strokeStyle = col.well; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) { const a = -Math.PI + 2 * Math.PI * i / 240; const X = xOf(a), Y = yOf(energyU(P, st.E, a)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  // current state as a ball on the U curve.
  ctx.fillStyle = col.rod; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(xOf(th), yOf(energyU(P, st.E, th)), 5.5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.etot; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('total energy', inner.x + 6, yOf(Etot) - 3);
  ctx.fillStyle = col.well; ctx.textBaseline = 'top'; ctx.fillText('U = -pE cos(theta)', inner.x + 6, yOf(-Umax) + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const [a, lab] of [[-Math.PI, '-180'], [0, '0 (aligned)'], [Math.PI, '+180']]) ctx.fillText(lab, xOf(a), inner.y + inner.h + 6);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('energy', 0, 0); ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`period (small) = ${smallAnglePeriod(I, P, st.E).toFixed(2)}`, inner.x + inner.w - 150, inner.y + 4);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let dragging = false, running = true;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setThetaFrom(sx, sy) { if (!CEN) return; dip = { theta: Math.atan2(-(sy - CEN.y), sx - CEN.x), omega: 0 }; }
canvas.addEventListener('pointerdown', (e) => { if (!CEN) return; const [sx, sy] = ptr(e); if (Math.hypot(sx - CEN.x, sy - CEN.y) < ROD * 1.5 && sy < REG.scene.y + REG.scene.h) { dragging = true; setThetaFrom(sx, sy); } });
canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const [sx, sy] = ptr(e); setThetaFrom(sx, sy); });
window.addEventListener('pointerup', () => { dragging = false; });

function advance(dt) { if (!dragging) dip = step(dip, dt, par()); }
let last = 0;
function tick(ts) {
  if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.04) dt = 0.04;
  if (running) { advance(dt); advance(dt); }
  render(); requestAnimationFrame(tick);
}

function boot() {
  if (params.get('E') !== null) st.E = Math.max(0.5, Math.min(3, +params.get('E')));
  if (params.get('theta') !== null) dip.theta = +params.get('theta');
  syncVals(); relayout(); render();
  if (DETERMINISTIC) {
    for (let i = 0; i < 70; i += 1) advance(0.02); render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'E', label: 'field E', value: st.E, format: 'float' },
    { key: 'gamma', label: 'damping', value: st.gamma, format: 'float' },
    { key: 'theta', label: 'angle theta', value: dip.theta * 180 / Math.PI, format: 'float', unit: 'deg' },
    { key: 'tau', label: 'torque', value: torque(P, st.E, dip.theta), format: 'float' },
    { key: 'U', label: 'orientation energy U', value: energyU(P, st.E, dip.theta), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const tq = torque(P, st.E, dip.theta);
  const restoring = dip.theta === 0 || Math.sign(tq) === -Math.sign(dip.theta);
  const Umin = energyU(P, st.E, 0);
  return [
    { key: 'restore', label: 'torque restores toward alignment', value: tq.toFixed(2), status: restoring ? 'pass' : 'pending' },
    { key: 'umin', label: 'U minimum at alignment (-pE)', value: Umin.toFixed(2), status: Math.abs(Umin + P * st.E) < 1e-9 ? 'pass' : 'drift' },
  ];
};
