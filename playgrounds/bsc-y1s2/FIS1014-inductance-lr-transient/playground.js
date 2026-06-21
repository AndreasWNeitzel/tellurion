// The LR circuit transient. A switch connects an inductor and resistor to a
// battery; the current rises as I(t) = (V/R)(1 - e^{-t/tau}) with tau = L/R while
// the inductor's back-EMF opposes the change and its magnetic field (and stored
// energy U = (1/2) L I^2) builds. Switch the battery out and the current decays,
// dumping the energy into the resistor. The diagnostic plots I(t) and the
// back-EMF. Canvas2D only.
//
// Reference: Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { timeConstant, steadyCurrent, backEMF, energy, createState, step } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sV = document.getElementById('slider-V'), vV = document.getElementById('value-V');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const btnSwitch = document.getElementById('btn-switch'), vSwitch = document.getElementById('value-switch');
const btnReset = document.getElementById('btn-reset');

const p = { V: 4, L: 2, R: 2, on: true };
let s = createState(0);
let phase = 0, hist = [], running = !DETERMINISTIC;

let view = { w: 800, h: 1020, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.3 }, { name: 'diag', weight: 0.95 }]);
}
function syncVals() { vV.textContent = `${p.V.toFixed(1)} V`; vL.textContent = `${p.L.toFixed(1)} H`; vR.textContent = `${p.R.toFixed(1)} ohm`; vSwitch.textContent = p.on ? 'on (charging)' : 'off (decaying)'; }
sV.addEventListener('input', () => { p.V = parseFloat(sV.value); syncVals(); });
sL.addEventListener('input', () => { p.L = parseFloat(sL.value); syncVals(); });
sR.addEventListener('input', () => { p.R = parseFloat(sR.value); syncVals(); });
btnSwitch.addEventListener('click', () => { p.on = !p.on; syncVals(); });
btnReset.addEventListener('click', () => { p.V = 4; p.L = 2; p.R = 2; p.on = true; s = createState(0); hist = []; sV.value = '4'; sL.value = '2'; sR.value = '2'; running = true; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', wire: '#9fb0c8', cur: '#67d98c', field: '#5b9bd5', emf: '#ff9d3c', res: '#ef5466', I: '#67d98c', VL: '#ff9d3c', energy: '#ffd166' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  panel(col, r, p.on ? 'Switch closed: current rises, the magnetic field and its energy build' : 'Switch open: the field collapses, dumping its energy into the resistor');
  const m = 64, titleH = 24, stripH = 28;
  const lx = r.x + m, rx = r.x + r.w - m, ty = r.y + titleH + 30, by = r.y + r.h - stripH - 40;
  const Iss = steadyCurrent(p.V, p.R);
  const In = Math.max(0, Math.min(1, s.I / (steadyCurrent(parseFloat(sV.max), parseFloat(sR.min)))));
  // perimeter points for current dots (clockwise: TL -> TR -> BR -> BL).
  const peri = [[lx, ty], [rx, ty], [rx, by], [lx, by]];
  const segLen = [rx - lx, by - ty, rx - lx, by - ty]; const total = segLen.reduce((a, b) => a + b, 0);
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });
  // wires.
  ctx.strokeStyle = col.wire; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(lx, ty); ctx.lineTo(rx, ty); ctx.moveTo(rx, ty); ctx.lineTo(rx, by); ctx.moveTo(rx, by); ctx.lineTo(lx, by); ctx.stroke();
  // left side: battery + switch (gap in the left wire).
  const my = (ty + by) / 2;
  ctx.beginPath(); ctx.moveTo(lx, by); ctx.lineTo(lx, my + 30); ctx.moveTo(lx, my - 30); ctx.lineTo(lx, ty); ctx.stroke();
  // battery (upper-left).
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx - 8, my - 18); ctx.lineTo(lx + 8, my - 18); ctx.moveTo(lx - 5, my - 24); ctx.lineTo(lx + 5, my - 24); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(`${p.V.toFixed(1)} V`, lx - 12, my - 21);
  // switch (lower-left): closed = horizontal, open = lifted.
  ctx.strokeStyle = p.on ? col.cur : col.muted; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(lx, my + 30, 2.5, 0, 6.28); ctx.moveTo(lx, my + 30);
  if (p.on) ctx.lineTo(lx, my + 6); else ctx.lineTo(lx + 16, my + 2);
  ctx.stroke(); ctx.fillStyle = p.on ? col.cur : col.muted; ctx.beginPath(); ctx.arc(lx, my + 6, 2.5, 0, 6.28); ctx.fill();
  // resistor (top, zigzag).
  ctx.strokeStyle = col.res; ctx.lineWidth = 2.4; const rc = (lx + rx) / 2; ctx.beginPath(); ctx.moveTo(rc - 30, ty);
  for (let i = 0; i < 6; i += 1) ctx.lineTo(rc - 30 + (i + 0.5) * 10, ty + (i % 2 ? 7 : -7));
  ctx.lineTo(rc + 30, ty); ctx.stroke();
  ctx.fillStyle = col.res; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`R ${p.R.toFixed(1)}`, rc, ty - 8);
  // inductor (right side, coil) + magnetic field.
  const coilY0 = my - 44, coilY1 = my + 44, nC = 5;
  ctx.strokeStyle = col.wire; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) { const tt = i / 60; const yy = coilY0 + tt * (coilY1 - coilY0); const xx = rx + 11 * Math.sin(tt * nC * 2 * Math.PI); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = col.field; ctx.textAlign = 'left'; ctx.fillText(`L ${p.L.toFixed(1)}`, rx + 18, coilY0 - 4);
  // field lines through the coil (count and brightness ~ current).
  const nLines = Math.round(5 * Math.min(1, s.I / (Iss + 1e-6)));
  for (let k = 1; k <= nLines; k += 1) {
    const rr = k / (nLines + 1) * 30; ctx.strokeStyle = `rgba(91,155,213,${0.3 + 0.5 * s.I / (Iss + 1e-6)})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(rx, my, 8 + rr * 0.3, (coilY1 - coilY0) / 2 + rr, 0, 0, 6.28); ctx.stroke();
  }
  // back-EMF arrow on the inductor (opposes the change in current).
  const VL = backEMF(p.on ? p.V : 0, p.R, s.I);
  if (Math.abs(VL) > 0.05) { ctx.strokeStyle = col.emf; ctx.fillStyle = col.emf; ctx.lineWidth = 2; const dir = VL > 0 ? -1 : 1; const ax = rx - 34; ctx.beginPath(); ctx.moveTo(ax, my); ctx.lineTo(ax, my + dir * 22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax, my + dir * 22); ctx.lineTo(ax - 4, my + dir * 16); ctx.lineTo(ax + 4, my + dir * 16); ctx.closePath(); ctx.fill(); ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('back-EMF', ax - 6, my + dir * 14); }
  // current dots (speed ~ I).
  ctx.fillStyle = col.cur; const nd = 26;
  for (let i = 0; i < nd; i += 1) {
    let d = ((i / nd + phase) % 1) * total; let e = 0; while (d > segLen[e]) { d -= segLen[e]; e += 1; }
    const [x0, y0] = peri[e], [x1, y1] = peri[(e + 1) % 4]; const f = d / segLen[e];
    ctx.globalAlpha = Math.min(1, 0.25 + s.I / (Iss + 1e-6)); ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 2.6, 0, 6.28); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // readout strip.
  const items = [[`I ${s.I.toFixed(3)} A`, col.cur], [`V_L ${VL.toFixed(2)} V`, col.emf], [`U ${energy(p.L, s.I).toFixed(3)} J`, col.energy], [`tau ${timeConstant(p.L, p.R).toFixed(2)} s`, col.muted]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 12); });
}

function drawDiag(col, r) {
  panel(col, r, 'Current and back-EMF vs time: the exponential rise to V/R, and the decay');
  const inner = { x: r.x + 46, y: r.y + 26, w: r.w - 46 - 46, h: r.h - 26 - 30 };
  const tNow = s.t, t0 = Math.max(0, tNow - 12);
  const Imax = Math.max(steadyCurrent(p.V, p.R), 0.1, ...hist.map((h) => h.I));
  const xOf = (t) => inner.x + (t - t0) / Math.max(1e-6, tNow - t0) * inner.w;
  const yI = (I) => inner.y + inner.h - I / (Imax * 1.1) * inner.h;
  const VLmax = Math.max(p.V, 0.1);
  const yV = (V) => inner.y + inner.h / 2 - V / (VLmax * 1.1) * (inner.h / 2);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // steady current line.
  ctx.strokeStyle = 'rgba(103,217,140,0.4)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yI(steadyCurrent(p.V, p.R))); ctx.lineTo(inner.x + inner.w, yI(steadyCurrent(p.V, p.R))); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(103,217,140,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('V/R', inner.x + inner.w - 4, yI(steadyCurrent(p.V, p.R)) - 2);
  if (hist.length > 1) {
    ctx.strokeStyle = col.I; ctx.lineWidth = 2.4; ctx.beginPath(); let st0 = true; for (const h of hist) { if (h.t < t0) continue; const X = xOf(h.t), Y = yI(h.I); st0 ? (ctx.moveTo(X, Y), st0 = false) : ctx.lineTo(X, Y); } ctx.stroke();
    ctx.strokeStyle = col.VL; ctx.lineWidth = 1.8; ctx.beginPath(); st0 = true; for (const h of hist) { if (h.t < t0) continue; const X = xOf(h.t), Y = yV(h.VL); st0 ? (ctx.moveTo(X, Y), st0 = false) : ctx.lineTo(X, Y); } ctx.stroke();
  }
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.I; ctx.fillText('current I', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.VL; ctx.fillText('back-EMF V_L', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('time t (s)', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function advance() {
  const dt = 1 / 120; let n = 0;
  while (n < 4) { step(s, dt, p); n += 1; }
  phase = (phase + 0.012 * s.I) % 1;
  hist.push({ t: s.t, I: s.I, VL: backEMF(p.on ? p.V : 0, p.R, s.I) }); if (hist.length > 1600) hist.shift();
}
function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}
function tick() { if (running) advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  syncVals(); relayout();
  if (CAPTURE_NAME) { for (let i = 0; i < 44; i += 1) advance(); }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const VL = backEMF(p.on ? p.V : 0, p.R, s.I);
  return { fields: [
    { key: 'on', label: 'switch', value: p.on ? 'closed' : 'open', format: 'text' },
    { key: 'tau', label: 'time constant L/R (s)', value: timeConstant(p.L, p.R), format: 'float' },
    { key: 'I', label: 'current I (A)', value: s.I, format: 'float' },
    { key: 'Iss', label: 'steady current V/R (A)', value: steadyCurrent(p.V, p.R), format: 'float' },
    { key: 'VL', label: 'back-EMF V_L (V)', value: VL, format: 'float' },
    { key: 'U', label: 'energy U = LI^2/2 (J)', value: energy(p.L, s.I), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const VL = backEMF(p.on ? p.V : 0, p.R, s.I);
  const kvl = Math.abs(p.R * s.I + VL - (p.on ? p.V : 0));
  return [
    { key: 'kvl', label: 'V_R + V_L = V (Kirchhoff)', value: kvl.toExponential(1), status: kvl < 1e-9 ? 'pass' : 'drift' },
    { key: 'tau', label: 'time constant = L/R', value: timeConstant(p.L, p.R).toFixed(3), status: 'pass' },
  ];
};
