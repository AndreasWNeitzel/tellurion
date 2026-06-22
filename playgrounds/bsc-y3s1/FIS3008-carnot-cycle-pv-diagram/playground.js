// The Carnot cycle of an ideal gas. The scene shows the P-V diagram with the enclosed
// work area shaded, a working point circulating the loop, and a piston-cylinder whose
// volume and temperature colour track the gas while a reservoir bar shows the current
// thermal contact. The diagnostic plots the efficiency against T_c/T_h and breaks the
// heat input into work plus rejected heat (Q_h = W + Q_c). Canvas2D only.
//
// Reference: Callen, Thermodynamics and an Introduction to Thermostatistics, 2nd ed., Ch. 4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { cycleStates, legVolumes, pressureAt, temperatureAt, heatHot, heatCold, netWork, efficiency } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sTh = document.getElementById('s-th'), vTh = document.getElementById('v-th');
const sTc = document.getElementById('s-tc'), vTc = document.getElementById('v-tc');
const sR = document.getElementById('s-r'), vR = document.getElementById('v-r');
const btnGamma = document.getElementById('btn-gamma'), btnReset = document.getElementById('btn-reset');

const st = { Th: 2.0, Tc: 1.0, r: 2.0, gamma: 5 / 3, s: 0.5 };
let frame = 0, running = true;
const LEGNAME = ['isothermal expansion (T_h)', 'adiabatic expansion', 'isothermal compression (T_c)', 'adiabatic compression'];

const RMAX = 2.7;  // cap on the adiabatic volume ratio V3/V2 so the linear P-V loop stays readable
let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.3 }, { name: 'diag', weight: 0.8 }]); }
function tcFloor() { return st.Th / Math.pow(RMAX, st.gamma - 1); }
function effTc() { return Math.min(Math.max(st.Tc, tcFloor()), st.Th - 0.15); }
function syncVals() { sTh.value = st.Th; vTh.textContent = st.Th.toFixed(2); sTc.value = st.Tc; vTc.textContent = effTc().toFixed(2); sR.value = st.r; vR.textContent = st.r.toFixed(2); btnGamma.textContent = st.gamma > 1.5 ? 'gamma = 5/3 (monatomic)' : 'gamma = 7/5 (diatomic)'; }
btnReset.addEventListener('click', () => { st.Th = 2.0; st.Tc = 1.0; st.r = 2.0; st.gamma = 5 / 3; syncVals(); if (!running) render(); });
btnGamma.addEventListener('click', () => { st.gamma = st.gamma > 1.5 ? 7 / 5 : 5 / 3; syncVals(); if (!running) render(); });
sTh.addEventListener('input', () => { st.Th = +sTh.value; syncVals(); if (!running) render(); });
sTc.addEventListener('input', () => { st.Tc = +sTc.value; syncVals(); if (!running) render(); });
sR.addEventListener('input', () => { st.r = +sR.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    hot: '#ff6f5c', cold: '#5ea8ff', adia: '#9aa0a6', work: 'rgba(141,224,138,0.16)', workEdge: '#8de08a', point: '#ffd24a', qh: '#ff6f5c', qc: '#5ea8ff', w: '#8de08a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function tcol(T) { const t = Math.max(0, Math.min(1, (T - effTc()) / (st.Th - effTc() + 1e-9))); const a = [80, 140, 235], b = [240, 110, 50]; return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; }
function legPoints(S, leg, n) { const [va, vb] = legVolumes(S, leg); const pts = []; for (let i = 0; i <= n; i += 1) { const V = va + (vb - va) * i / n; pts.push([V, pressureAt(S, leg, V)]); } return pts; }
function arrow(x1, y1, x2, y2, head) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4)); ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill(); }

function drawScene(col, r) {
  const S = cycleStates(st.Th, effTc(), st.r, st.gamma);
  const leg = Math.floor(st.s) % 4, frac = st.s - Math.floor(st.s);
  const [va, vb] = legVolumes(S, leg); const Vc = va + (vb - va) * frac, Pc = pressureAt(S, leg, Vc), Tc_cur = temperatureAt(S, leg, Vc);
  panel(col, r, `Carnot cycle:  T_h = ${st.Th.toFixed(2)},  T_c = ${effTc().toFixed(2)},  eta = ${(efficiency(S) * 100).toFixed(1)}%  (currently ${LEGNAME[leg]})`);

  const inner = { x: r.x + 8, y: r.y + 26, w: r.w - 16, h: r.h - 26 - 8 };
  const pv = { x: inner.x + 44, y: inner.y + 8, w: inner.w * 0.6 - 44, h: inner.h - 8 - 30 };
  // auto-scaled axes.
  const Vlo = S.V1, Vhi = S.V3, Plo = Math.min(S.P3, S.P4), Phi = Math.max(S.P1, S.P2);
  const VL = Vlo - 0.06 * (Vhi - Vlo), VH = Vhi + 0.06 * (Vhi - Vlo), PL = Math.max(0, Plo - 0.34 * (Phi - Plo)), PH = Phi + 0.10 * (Phi - Plo);
  const X = (V) => pv.x + (V - VL) / (VH - VL) * pv.w, Y = (P) => pv.y + pv.h * (1 - (P - PL) / (PH - PL));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(pv.x, pv.y, pv.w, pv.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted;
  ctx.save(); ctx.translate(pv.x - 32, pv.y + pv.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('pressure P', 0, 0); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('volume V', pv.x + pv.w / 2, pv.y + pv.h + 14);

  // shaded work area (full loop).
  ctx.save(); clipTo(ctx, pv);
  ctx.beginPath(); let first = true;
  for (let lg = 0; lg < 4; lg += 1) for (const [V, P] of legPoints(S, lg, 48)) { if (first) { ctx.moveTo(X(V), Y(P)); first = false; } else ctx.lineTo(X(V), Y(P)); }
  ctx.closePath(); ctx.fillStyle = col.work; ctx.fill();
  // legs.
  const legColor = [col.hot, col.adia, col.cold, col.adia];
  for (let lg = 0; lg < 4; lg += 1) { ctx.strokeStyle = legColor[lg]; ctx.lineWidth = lg % 2 === 0 ? 2.8 : 2.0; if (lg % 2 === 1) ctx.setLineDash([7, 4]); ctx.beginPath(); const pts = legPoints(S, lg, 64); pts.forEach(([V, P], i) => { i ? ctx.lineTo(X(V), Y(P)) : ctx.moveTo(X(V), Y(P)); }); ctx.stroke(); ctx.setLineDash([]); }
  // heat arrows on the isotherms.
  ctx.fillStyle = col.qh; ctx.strokeStyle = col.qh; ctx.lineWidth = 2; { const Vm = (S.V1 + S.V2) / 2, Pm = pressureAt(S, 0, Vm); arrow(X(Vm), Y(Pm) - 24, X(Vm), Y(Pm) - 6, 7); }
  ctx.fillStyle = col.qc; ctx.strokeStyle = col.qc; { const Vm = (S.V3 + S.V4) / 2, Pm = pressureAt(S, 2, Vm); arrow(X(Vm), Y(Pm) + 6, X(Vm), Y(Pm) + 24, 7); }
  // corner points.
  const corners = [[S.V1, S.P1], [S.V2, S.P2], [S.V3, S.P3], [S.V4, S.P4]];
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  corners.forEach(([V, P], i) => { ctx.fillStyle = '#cfd3da'; ctx.beginPath(); ctx.arc(X(V), Y(P), 3.2, 0, 6.2832); ctx.fill(); ctx.textAlign = i === 0 || i === 3 ? 'right' : 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(`${i + 1}`, X(V) + (i === 0 || i === 3 ? -5 : 5), Y(P) - 3); });
  // working point.
  ctx.fillStyle = col.point; ctx.beginPath(); ctx.arc(X(Vc), Y(Pc), 5.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgba(255,210,74,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(Vc), Y(Pc), 9, 0, 6.2832); ctx.stroke();
  ctx.restore();
  // isotherm / heat labels.
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  { const Vm = (S.V1 + S.V2) / 2; ctx.fillStyle = col.qh; ctx.fillText('Q_h in', X(Vm), Y(pressureAt(S, 0, Vm)) - 25); }
  { const Vm = (S.V3 + S.V4) / 2; ctx.fillStyle = col.qc; ctx.textBaseline = 'top'; ctx.fillText('Q_c out', X(Vm), Y(pressureAt(S, 2, Vm)) + 25); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = col.workEdge; ctx.fillText(`W = area = ${netWork(S).toFixed(3)}`, pv.x + 6, pv.y + 6);

  // piston cylinder (right).
  const cyl = { x: inner.x + inner.w * 0.64, y: inner.y + 18, w: inner.w * 0.36 - 8, h: inner.h * 0.5 };
  const fracV = (Vc - VL) / (VH - VL); const usable = cyl.w - 14;
  const gasW = Math.max(6, fracV * usable);
  ctx.fillStyle = tcol(Tc_cur); ctx.fillRect(cyl.x, cyl.y, gasW, cyl.h);
  // gas particles hint (static dots scaled by inverse density not needed); keep flat colour.
  ctx.strokeStyle = '#cfd3da'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cyl.x + gasW + 7, cyl.y - 4); ctx.lineTo(cyl.x + gasW + 7, cyl.y + cyl.h + 4); ctx.stroke();  // piston face
  ctx.fillStyle = '#cfd3da'; ctx.fillRect(cyl.x + gasW + 7, cyl.y + cyl.h / 2 - 2, cyl.w - gasW - 7, 4);  // rod
  ctx.strokeStyle = col.border; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cyl.x, cyl.y - 4); ctx.lineTo(cyl.x, cyl.y + cyl.h + 4); ctx.moveTo(cyl.x, cyl.y - 4); ctx.lineTo(cyl.x + cyl.w, cyl.y - 4); ctx.moveTo(cyl.x, cyl.y + cyl.h + 4); ctx.lineTo(cyl.x + cyl.w, cyl.y + cyl.h + 4); ctx.stroke();
  // reservoir bar under the cylinder.
  const resName = leg === 0 ? 'T_h (hot)' : leg === 2 ? 'T_c (cold)' : 'insulated';
  const resCol = leg === 0 ? col.hot : leg === 2 ? col.cold : col.adia;
  ctx.fillStyle = resCol; ctx.globalAlpha = 0.8; ctx.fillRect(cyl.x, cyl.y + cyl.h + 12, cyl.w, 12); ctx.globalAlpha = 1;
  ctx.fillStyle = '#06070c'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(resName, cyl.x + cyl.w / 2, cyl.y + cyl.h + 18);
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`V = ${Vc.toFixed(2)}   T = ${Tc_cur.toFixed(2)}`, cyl.x, cyl.y + cyl.h + 32);
  ctx.fillStyle = col.muted; ctx.fillText('width tracks volume', cyl.x, cyl.y + cyl.h + 46);
}

function drawDiag(col, r) {
  const S = cycleStates(st.Th, effTc(), st.r, st.gamma);
  panel(col, r, 'Efficiency eta = 1 - T_c/T_h, and the first law: heat in = work out + heat rejected');
  const inner = { x: r.x + 8, y: r.y + 28, w: r.w - 16, h: r.h - 28 - 8 };
  // left: eta vs Tc/Th.
  const g = { x: inner.x + 44, y: inner.y + 8, w: inner.w * 0.5 - 44, h: inner.h - 8 - 28 };
  const X = (x) => g.x + x * g.w, Y = (y) => g.y + g.h * (1 - y);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(g.x, g.y, g.w, g.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, 0.5, 1]) { const yy = Y(v); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(g.x, yy); ctx.lineTo(g.x + g.w, yy); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(v.toFixed(1), g.x - 5, yy); }
  ctx.save(); clipTo(ctx, g);
  ctx.strokeStyle = col.w; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 100; i += 1) { const x = i / 100; const yy = Y(1 - x); i ? ctx.lineTo(X(x), yy) : ctx.moveTo(X(x), yy); } ctx.stroke();
  const xc = effTc() / st.Th; ctx.strokeStyle = col.point; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(xc), g.y); ctx.lineTo(X(xc), g.y + g.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.point; ctx.beginPath(); ctx.arc(X(xc), Y(efficiency(S)), 5, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`eta = ${(efficiency(S) * 100).toFixed(1)}%`, g.x + 6, g.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (const v of [0, 0.5, 1]) ctx.fillText(v.toFixed(1), X(v), g.y + g.h + 6); ctx.fillText('T_c / T_h', g.x + g.w / 2, g.y + g.h + 19);

  // right: energy-flow bars Q_h = W + Q_c.
  const Qh = heatHot(S), Qc = heatCold(S), W = netWork(S), eta = efficiency(S);
  const e = { x: inner.x + inner.w * 0.56, y: inner.y + 16, w: inner.w * 0.42, h: inner.h - 16 - 12 };
  const L = e.w - 10; const bh = 26;
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = col.qh; ctx.fillText(`Q_h = ${Qh.toFixed(3)}  (heat in)`, e.x, e.y - 4);
  ctx.fillStyle = col.qh; ctx.globalAlpha = 0.85; ctx.fillRect(e.x, e.y, L, bh); ctx.globalAlpha = 1;
  const y2 = e.y + bh + 30;
  ctx.fillStyle = col.fg; ctx.textBaseline = 'bottom'; ctx.fillText('splits into', e.x, y2 - 4);
  ctx.fillStyle = col.w; ctx.globalAlpha = 0.9; ctx.fillRect(e.x, y2, L * eta, bh); ctx.globalAlpha = 1;
  ctx.fillStyle = col.qc; ctx.globalAlpha = 0.9; ctx.fillRect(e.x + L * eta, y2, L * (1 - eta), bh); ctx.globalAlpha = 1;
  ctx.fillStyle = '#06070c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  if (L * eta > 40) ctx.fillText(`W ${W.toFixed(2)}`, e.x + L * eta / 2, y2 + bh / 2);
  if (L * (1 - eta) > 40) ctx.fillText(`Q_c ${Qc.toFixed(2)}`, e.x + L * eta + L * (1 - eta) / 2, y2 + bh / 2);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`W/Q_h = eta = ${(eta * 100).toFixed(1)}%`, e.x, y2 + bh + 8);
  ctx.fillText('the rest is dumped as Q_c', e.x, y2 + bh + 22);
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (running) st.s = (st.s + 0.01) % 4; render(); if (running) requestAnimationFrame(tick); }

function boot() {
  if (params.get('Th')) st.Th = Math.max(1.4, Math.min(3, +params.get('Th')));
  if (params.get('Tc')) st.Tc = Math.max(0.4, Math.min(2.5, +params.get('Tc')));
  if (params.get('r')) st.r = Math.max(1.4, Math.min(2.3, +params.get('r')));
  syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.s = 1.5; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const S = cycleStates(st.Th, effTc(), st.r, st.gamma);
  return { fields: [
    { key: 'Th', label: 'hot temperature T_h', value: st.Th, format: 'float' },
    { key: 'Tc', label: 'cold temperature T_c', value: effTc(), format: 'float' },
    { key: 'eta', label: 'efficiency eta', value: efficiency(S), format: 'float' },
    { key: 'Qh', label: 'heat in Q_h', value: heatHot(S), format: 'float' },
    { key: 'Qc', label: 'heat rejected Q_c', value: heatCold(S), format: 'float' },
    { key: 'W', label: 'net work W', value: netWork(S), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const S = cycleStates(st.Th, effTc(), st.r, st.gamma);
  const fl = Math.abs(netWork(S) - (heatHot(S) - heatCold(S)));
  const ef = Math.abs(netWork(S) / heatHot(S) - efficiency(S));
  return [
    { key: 'firstlaw', label: 'W = Q_h - Q_c', value: fl.toExponential(1), status: fl < 1e-9 ? 'pass' : 'drift' },
    { key: 'carnot', label: 'W/Q_h = 1 - T_c/T_h', value: ef.toExponential(1), status: ef < 1e-9 ? 'pass' : 'drift' },
  ];
};
