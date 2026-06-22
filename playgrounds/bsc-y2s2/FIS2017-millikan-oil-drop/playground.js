// Millikan's oil-drop experiment. The scene shows a charged oil drop between capacitor
// plates with gravity, drag, and the electric force as arrows; tune the voltage to float
// it and read off the charge. The diagnostic is the charge ladder: every drop's measured
// charge lands on an integer multiple of e. Canvas2D only.
//
// Reference: Eisberg and Resnick, Quantum Physics, 2nd ed., Ch. 2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { E_CHARGE, PLATE_GAP, charge, dropWeight, balanceVoltage, terminalVelocity, radiusFromFall, chargeFromBalance } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sV = document.getElementById('s-v'), vV = document.getElementById('v-v');
const btnField = document.getElementById('btn-field'), btnNext = document.getElementById('btn-next'), btnReset = document.getElementById('btn-reset');

// Illustrative drop set (UI demo, not measured data): each carries an exact integer charge.
const DROPS = [
  { r: 1.10e-6, n: 4 }, { r: 0.80e-6, n: 1 }, { r: 1.00e-6, n: 3 }, { r: 0.95e-6, n: 2 },
  { r: 0.90e-6, n: 5 }, { r: 1.30e-6, n: 6 }, { r: 0.85e-6, n: 2 }, { r: 1.05e-6, n: 3 },
];
const st = { idx: 0, V: balanceVoltage(DROPS[0].r, DROPS[0].n), field: true, y: 0.5 };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.3 }, { name: 'diag', weight: 0.8 }]); }
function drop() { return DROPS[st.idx]; }
function syncVals() { sV.value = st.V; vV.textContent = `${st.V.toFixed(0)} V`; btnField.textContent = `Field: ${st.field ? 'on' : 'off'}`; btnField.setAttribute('aria-pressed', String(st.field)); }
btnReset.addEventListener('click', () => { st.idx = 0; st.V = balanceVoltage(DROPS[0].r, DROPS[0].n); st.field = true; st.y = 0.5; syncVals(); if (!running) render(); });
btnField.addEventListener('click', () => { st.field = !st.field; syncVals(); if (!running) render(); });
btnNext.addEventListener('click', () => { st.idx = (st.idx + 1) % DROPS.length; st.V = balanceVoltage(drop().r, drop().n); st.y = 0.5; syncVals(); if (!running) render(); });
sV.addEventListener('input', () => { st.V = +sV.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    platePos: '#ff6f6f', plateNeg: '#5ea8ff', field: 'rgba(94,168,255,0.18)', oil: '#ffcf6b', grav: '#5ea8ff', elec: '#ff9d3c', drag: '#9aa0a6', ladder: '#8de08a', cur: '#ffd24a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function arrow(x, y0, y1, color, label, side) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
  const dir = Math.sign(y1 - y0) || 1; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 4, y1 - dir * 8); ctx.lineTo(x + 4, y1 - dir * 8); ctx.closePath(); ctx.fill();
  if (label) { ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = side < 0 ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + side * 8, (y0 + y1) / 2); }
}

function drawScene(col, r) {
  const d = drop(), Veff = st.field ? st.V : 0;
  const v = terminalVelocity(d.r, d.n, Veff);             // m/s, up positive
  const q = charge(d.n), Vbal = balanceVoltage(d.r, d.n);
  const balanced = st.field && Math.abs(st.V - Vbal) < 2.5;
  panel(col, r, `Oil drop:  charge q = ${(q / 1e-19).toFixed(2)} x10^-19 C = ${d.n} e,  V = ${Veff.toFixed(0)} V,  ${st.field ? (balanced ? 'balanced (floating)' : v > 0 ? 'rising' : 'falling') : 'field off (falling)'}`);
  const inner = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 10 };
  const cap = { x: inner.x + 30, y: inner.y + 16, w: inner.w * 0.50, h: inner.h - 40 };
  // plates.
  const topCol = st.field ? col.platePos : col.muted, botCol = st.field ? col.plateNeg : col.muted;
  ctx.fillStyle = topCol; ctx.fillRect(cap.x, cap.y, cap.w, 6); ctx.fillStyle = botCol; ctx.fillRect(cap.x, cap.y + cap.h - 6, cap.w, 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(st.field ? '+  (high V)' : 'plate', cap.x + 4, cap.y - 2);
  ctx.textBaseline = 'top'; ctx.fillText(st.field ? '-  (ground)' : 'plate', cap.x + 4, cap.y + cap.h + 4);
  // field lines.
  if (st.field) { ctx.strokeStyle = col.field; ctx.lineWidth = 1; for (let i = 1; i <= 7; i += 1) { const fx = cap.x + cap.w * i / 8; ctx.beginPath(); ctx.moveTo(fx, cap.y + 7); ctx.lineTo(fx, cap.y + cap.h - 7); ctx.stroke(); } }
  // drop position (y in [0,1], 1 = top).
  const dyTop = cap.y + 14, dyBot = cap.y + cap.h - 14;
  const cy = dyBot - st.y * (dyBot - dyTop), cx = cap.x + cap.w / 2;
  const rad = 7 + (d.r - 0.7e-6) / (1.3e-6 - 0.7e-6) * 8;   // visual radius (enlarged, not to scale)
  // force arrows.
  const wgt = dropWeight(d.r), elec = q * Veff / PLATE_GAP;
  const gscale = 26 / wgt;   // gravity arrow length reference
  arrow(cx - 26, cy, cy + Math.min(40, wgt * gscale), col.grav, 'mg', -1);
  if (st.field) arrow(cx + 26, cy, cy - Math.min(40, elec * gscale), col.elec, 'qE', 1);
  if (Math.abs(v) > 1e-7) { const ds = -Math.sign(v); arrow(cx, cy, cy + ds * 22, col.drag, 'drag', 1); }
  // drop.
  ctx.fillStyle = col.oil; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#1a1205'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${d.n >= 0 ? '+' : ''}${d.n}e`, cx, cy);
  if (balanced) { ctx.strokeStyle = col.cur; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, rad + 5, 0, 6.2832); ctx.stroke(); }

  // readouts (right).
  const bx = inner.x + inner.w * 0.57;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = col.fg; ctx.fillText(`drop ${st.idx + 1} of ${DROPS.length}`, bx, inner.y + 10);
  ctx.fillStyle = col.muted; ctx.fillText(`r = ${(d.r * 1e6).toFixed(2)} um`, bx, inner.y + 28);
  ctx.fillText(`m'g = ${(wgt / 1e-14).toFixed(2)} e-14 N`, bx, inner.y + 44);
  ctx.fillStyle = col.elec; ctx.fillText(`balance V = ${Vbal.toFixed(0)} V`, bx, inner.y + 64);
  ctx.fillStyle = col.fg; ctx.fillText(`velocity = ${(v * 1e6).toFixed(1)} um/s`, bx, inner.y + 84);
  ctx.fillStyle = col.ladder; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText(`q/e = ${(chargeFromBalance(d.r, Vbal) / E_CHARGE).toFixed(2)} (integer)`, bx, inner.y + 108);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillText(balanced ? 'floating: qE = mg' : st.field ? 'tune V to float drop' : 'field off: fall fixes r', bx, inner.y + 128);
  ctx.fillStyle = col.grav; ctx.fillText('mg down', bx, inner.y + 150);
  ctx.fillStyle = col.elec; ctx.fillText('qE up (field on)', bx, inner.y + 166);
  ctx.fillStyle = col.drag; ctx.fillText('drag opposes motion', bx, inner.y + 182);
}

function drawDiag(col, r) {
  panel(col, r, 'Charge ladder: every drop sits on an integer multiple of e (no charge in between)');
  const inner = { x: r.x + 46, y: r.y + 30, w: r.w - 46 - 16, h: r.h - 30 - 34 };
  const maxN = 7;
  const xOf = (i) => inner.x + (i + 0.5) / DROPS.length * inner.w, yOf = (qe) => inner.y + inner.h * (1 - qe / maxN);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // integer e lines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 1; k <= maxN; k += 1) { const Y = yOf(k); ctx.strokeStyle = 'rgba(141,224,138,0.22)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`${k}e`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  DROPS.forEach((d, i) => {
    const qe = chargeFromBalance(d.r, balanceVoltage(d.r, d.n)) / E_CHARGE;   // recovered charge in units of e
    const cur = i === st.idx;
    // a faint stem to the axis.
    ctx.strokeStyle = cur ? 'rgba(255,210,74,0.5)' : 'rgba(141,224,138,0.25)'; ctx.lineWidth = cur ? 2 : 1; ctx.beginPath(); ctx.moveTo(xOf(i), inner.y + inner.h); ctx.lineTo(xOf(i), yOf(qe)); ctx.stroke();
    ctx.fillStyle = cur ? col.cur : col.ladder; ctx.beginPath(); ctx.arc(xOf(i), yOf(qe), cur ? 6.5 : 5, 0, 6.2832); ctx.fill();
  });
  ctx.restore();
  ctx.fillStyle = col.cur; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`current drop: q = ${drop().n} e`, inner.x + 8, inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i < DROPS.length; i += 1) ctx.fillText(`${i + 1}`, xOf(i), inner.y + inner.h + 6);
  ctx.fillText('drop number (charge measured by balancing)', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() {
  frame += 1;
  if (running) {
    const d = drop(), Veff = st.field ? st.V : 0;
    const v = terminalVelocity(d.r, d.n, Veff);
    st.y += (v / PLATE_GAP) * 0.9;   // gap-fractions per frame, scaled for visibility
    if (st.y < 0.04) st.y = 0.04; if (st.y > 0.96) st.y = 0.96;
  }
  render(); if (running) requestAnimationFrame(tick);
}

function boot() {
  if (params.get('drop')) st.idx = Math.max(0, Math.min(DROPS.length - 1, +params.get('drop') | 0));
  st.V = balanceVoltage(drop().r, drop().n);
  if (params.get('V')) st.V = Math.max(50, Math.min(750, +params.get('V')));
  syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.field = true; st.V = balanceVoltage(drop().r, drop().n); st.y = 0.5; syncVals(); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const d = drop(), Veff = st.field ? st.V : 0;
  return { fields: [
    { key: 'drop', label: 'drop number', value: st.idx + 1, format: 'int' },
    { key: 'r', label: 'radius (um)', value: d.r * 1e6, format: 'float' },
    { key: 'V', label: 'applied voltage (V)', value: Veff, format: 'float' },
    { key: 'q', label: 'charge (1e-19 C)', value: charge(d.n) / 1e-19, format: 'float' },
    { key: 'qe', label: 'charge / e', value: charge(d.n) / E_CHARGE, format: 'float' },
    { key: 'v', label: 'velocity (um/s)', value: terminalVelocity(d.r, d.n, Veff) * 1e6, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const d = drop(), Vbal = balanceVoltage(d.r, d.n);
  const qe = chargeFromBalance(d.r, Vbal) / E_CHARGE;
  const intErr = Math.abs(qe - Math.round(qe));
  return [
    { key: 'quant', label: 'charge is an integer multiple of e', value: qe.toFixed(3), status: intErr < 1e-6 ? 'pass' : 'drift' },
    { key: 'balance', label: 'zero velocity at balance voltage', value: `${(terminalVelocity(d.r, d.n, Vbal) * 1e9).toExponential(1)} nm/s`, status: Math.abs(terminalVelocity(d.r, d.n, Vbal)) < 1e-12 ? 'pass' : 'drift' },
  ];
};
