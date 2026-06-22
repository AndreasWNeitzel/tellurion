// Rutherford scattering. The scene fires a beam of alpha particles past a nucleus
// along hyperbolic Coulomb orbits, deflecting hard at small impact parameter and
// barely at large; the diagnostic is the 1/sin^4 differential cross section.
// Canvas2D only.
//
// Reference: Krane, Introductory Nuclear Physics, Sec. 11.2.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { scatteringAngle, crossSection, closestApproach, integrateTrajectory } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sE = document.getElementById('s-E'), vE = document.getElementById('v-E');
const sZ = document.getElementById('s-Z'), vZ = document.getElementById('v-Z');
const sB = document.getElementById('s-b'), vB = document.getElementById('v-b');
const btnReset = document.getElementById('btn-reset');

const DEF = { E: 4, Z: 20, bsel: 0.8 };
const st = { E: DEF.E, Z: DEF.Z, bsel: DEF.bsel };
// D is the head-on closest approach D = k Z z e^2 / E: it GROWS with charge Z and
// SHRINKS with energy E, and the deflection of a beam at fixed impact parameter b
// depends on b/D. The scene is drawn at a fixed spatial scale with the beam at
// fixed absolute impact parameters, so changing E or Z changes D and visibly bends
// every trajectory (the earlier build scaled the picture by D, hiding the effect).
function Dval() { return 0.2 * st.Z / st.E; }
const YVIEW = 4.3;                                              // world half-height shown (fixed)
const BEAM = [0.18, 0.45, 0.8, 1.25, 1.8, 2.5, 3.4];           // fixed absolute impact parameters (both signs)
let paths = [], particles = [], geomKey = '';

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.36 }, { name: 'diag', weight: 0.82 }]); }
function syncVals() { sE.value = st.E; vE.textContent = st.E.toFixed(1); sZ.value = st.Z; vZ.textContent = `${st.Z}`; sB.value = st.bsel; vB.textContent = st.bsel.toFixed(2); }
btnReset.addEventListener('click', () => { Object.assign(st, DEF); syncVals(); render(); });
sE.addEventListener('input', () => { st.E = +sE.value; syncVals(); render(); });
sZ.addEventListener('input', () => { st.Z = +sZ.value; syncVals(); render(); });
sB.addEventListener('input', () => { st.bsel = +sB.value; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', nucleus: '#ff9d3c', track: 'rgba(130,170,225,0.5)', sel: '#8de08a', part: '#ffd166', xsec: '#4ea8ff', closest: 'rgba(255,93,93,0.6)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function dtFor(D) { return Math.min(0.02, 0.014 / Math.sqrt(D + 0.15)); }
function rebuild(inner) {
  const D = Dval();
  const S = inner.h * 0.46 / YVIEW;                             // fixed scale, independent of D
  const cx = inner.x + inner.w * 0.5, cy = inner.y + inner.h * 0.5;
  const Xview = (inner.w * 0.5) / S, farX = Xview + 34;         // integrate from far upstream (weak field at start)
  SC = { S, cx, cy, D, Xview, farX };
  const key = `${D.toFixed(4)}|${S.toFixed(2)}|${Xview.toFixed(2)}`;
  if (key === geomKey) return;
  geomKey = key;
  const bs = []; for (const b of BEAM) { bs.push(b); bs.push(-b); }
  paths = bs.map((b) => { const tr = integrateTrajectory(b, D, { xStart: -farX, xEnd: farX, dt: dtFor(D), maxN: 60000 }); return { b, pts: tr.pts, theta: tr.theta }; });
  particles = paths.map((p, i) => ({ path: i, idx: Math.floor(i / paths.length * p.pts.length) }));
}
function w2s(x, y) { return [SC.cx + x * SC.S, SC.cy - y * SC.S]; }

function drawScene(col, r) {
  panel(col, r, 'Alpha particles deflected by the nucleus (Coulomb hyperbolae)');
  const inner = { x: r.x + 14, y: r.y + 26, w: r.w - 28, h: r.h - 26 - 24 };
  rebuild(inner); const D = SC.D;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // beam axis.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x, SC.cy); ctx.lineTo(inner.x + inner.w, SC.cy); ctx.stroke();
  // head-on closest-approach circle (radius D).
  ctx.strokeStyle = col.closest; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(SC.cx, SC.cy, D * SC.S, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
  // static trajectories.
  for (const p of paths) { ctx.strokeStyle = col.track; ctx.lineWidth = 1.5; ctx.beginPath(); p.pts.forEach((pt, i) => { const s = w2s(pt[0], pt[1]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke(); }
  // highlighted trajectory at b_sel (absolute impact parameter).
  const bsel = st.bsel; const trSel = integrateTrajectory(bsel, D, { xStart: -SC.farX, xEnd: SC.farX, dt: dtFor(D), maxN: 60000 });
  ctx.strokeStyle = col.sel; ctx.lineWidth = 2.4; ctx.beginPath(); trSel.pts.forEach((pt, i) => { const s = w2s(pt[0], pt[1]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke();
  // closest-approach point on the selected path.
  let rm = Infinity, rmi = 0; trSel.pts.forEach((pt, i) => { const rr = Math.hypot(pt[0], pt[1]); if (rr < rm) { rm = rr; rmi = i; } }); const cpt = w2s(trSel.pts[rmi][0], trSel.pts[rmi][1]);
  ctx.fillStyle = col.sel; ctx.beginPath(); ctx.arc(cpt[0], cpt[1], 4, 0, 6.28); ctx.fill();
  // animated alpha particles.
  for (const q of particles) { const p = paths[q.path]; if (!p || q.idx >= p.pts.length) continue; const s = w2s(p.pts[q.idx][0], p.pts[q.idx][1]); ctx.fillStyle = col.part; ctx.beginPath(); ctx.arc(s[0], s[1], 3, 0, 6.28); ctx.fill(); }
  // the nucleus.
  const ns = w2s(0, 0); const g = ctx.createRadialGradient(ns[0], ns[1], 1, ns[0], ns[1], 16); g.addColorStop(0, '#ffd9a0'); g.addColorStop(1, 'rgba(255,157,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ns[0], ns[1], 16, 0, 6.28); ctx.fill();
  ctx.fillStyle = col.nucleus; ctx.beginPath(); ctx.arc(ns[0], ns[1], 6, 0, 6.28); ctx.fill();
  ctx.restore();
  // labels (report the exact analytic angle, not the finite-window estimate).
  const thSel = Math.abs(scatteringAngle(bsel, D)) * 180 / Math.PI;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.nucleus; ctx.fillText(`Z=${st.Z}  D=${D.toFixed(2)}`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.sel; ctx.textAlign = 'right'; ctx.fillText(`b=${st.bsel.toFixed(2)} -> theta=${thSel.toFixed(0)} deg`, inner.x + inner.w - 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('beam', inner.x + 6, SC.cy - 4);
}

function drawDiag(col, r) {
  panel(col, r, 'Differential cross section dsigma/dOmega vs angle: the 1/sin^4 law (log)');
  const D = Dval(); const inner = { x: r.x + 52, y: r.y + 28, w: r.w - 52 - 16, h: r.h - 28 - 34 };
  const thMin = 6 * Math.PI / 180, thMax = Math.PI;
  const top = Math.log10(crossSection(thMin, D)), bot = Math.log10(crossSection(thMax, D)) - 0.3;
  const xOf = (th) => inner.x + (th - thMin) / (thMax - thMin) * inner.w;
  const yOf = (v) => inner.y + inner.h * (top - Math.log10(v)) / (top - bot);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // decade gridlines.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let d = Math.ceil(bot); d <= Math.floor(top); d += 1) { const Y = yOf(Math.pow(10, d)); ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(`1e${d}`, inner.x - 5, Y); }
  ctx.save(); clipTo(ctx, inner);
  ctx.strokeStyle = col.xsec; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) { const th = thMin + (thMax - thMin) * i / 300; const X = xOf(th), Y = yOf(crossSection(th, D)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke();
  // highlighted angle.
  const thSel = Math.abs(scatteringAngle(st.bsel, D));
  ctx.strokeStyle = col.sel; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(thSel), inner.y); ctx.lineTo(xOf(thSel), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.sel; ctx.beginPath(); ctx.arc(xOf(thSel), yOf(crossSection(thSel, D)), 5, 0, 6.28); ctx.fill();
  ctx.restore();
  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const deg of [30, 60, 90, 120, 150, 180]) ctx.fillText(`${deg}`, xOf(deg * Math.PI / 180), inner.y + inner.h + 6);
  ctx.fillText('scattering angle theta (deg)', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('dsigma/dOmega', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let running = true, acc = 0;
function advance(dt) { acc += dt; if (acc < 0.018) return; acc = 0; for (const q of particles) { const p = paths[q.path]; if (!p) continue; q.idx += 1; if (q.idx >= p.pts.length) q.idx = 0; } }
let last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('E')) st.E = Math.max(1, Math.min(12, +params.get('E')));
  if (params.get('Z')) st.Z = Math.max(2, Math.min(92, +params.get('Z')));
  if (params.get('b')) st.bsel = Math.max(0.1, Math.min(4, +params.get('b')));
  syncVals(); relayout();
  if (DETERMINISTIC) { render(); for (const q of particles) q.idx = Math.floor(paths[q.path].pts.length * 0.46); render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const D = Dval(), bsel = st.bsel, th = Math.abs(scatteringAngle(bsel, D));
  return { fields: [
    { key: 'E', label: 'alpha energy E', value: st.E, format: 'float' },
    { key: 'Z', label: 'nuclear charge Z', value: st.Z, format: 'int' },
    { key: 'D', label: 'head-on approach D', value: D, format: 'float' },
    { key: 'b', label: 'impact parameter b', value: st.bsel, format: 'float' },
    { key: 'bD', label: 'ratio b/D', value: st.bsel / D, format: 'float' },
    { key: 'theta', label: 'scattering angle', value: th * 180 / Math.PI, format: 'float', unit: 'deg' },
  ] };
};
window.playground.getInvariants = function () {
  const D = Dval(), bsel = st.bsel, th = Math.abs(scatteringAngle(bsel, D));
  const cotRel = Math.abs(1 / Math.tan(th / 2) - 2 * bsel / D);
  return [
    { key: 'cot', label: 'cot(theta/2) = 2b/D', value: cotRel.toExponential(1), status: cotRel < 1e-6 ? 'pass' : 'drift' },
    { key: 'rmin', label: 'closest approach r_min >= D', value: closestApproach(bsel, D).toFixed(2), status: closestApproach(bsel, D) >= D - 1e-9 ? 'pass' : 'drift' },
  ];
};
