// Bound states of the finite square well. The scene draws the well, the discrete
// energy levels, and the wavefunctions stacked at their energies with the
// exponential tails in the forbidden region; the diagnostic is the graphical
// transcendental solution, the even and odd branches meeting the circle at the
// bound states. Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { z0of, boundStates, countStates, waveAt, evenBranch, oddBranch, circle } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sV = document.getElementById('s-V'), vV = document.getElementById('v-V');
const sL = document.getElementById('s-L'), vL = document.getElementById('v-L');
const btnReset = document.getElementById('btn-reset');

const DEF = { V0: 30, L: 2.4 };
const st = { V0: DEF.V0, L: DEF.L, sel: 0 };
function states() { return boundStates(st.V0, st.L); }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.92 }]); }
function syncVals() { sV.value = st.V0; vV.textContent = `${st.V0.toFixed(0)}`; sL.value = st.L; vL.textContent = `${st.L.toFixed(1)}`; st.sel = Math.max(0, Math.min(states().length - 1, st.sel)); }
btnReset.addEventListener('click', () => { st.V0 = DEF.V0; st.L = DEF.L; st.sel = 0; syncVals(); render(); });
sV.addEventListener('input', () => { st.V0 = +sV.value; syncVals(); render(); });
sL.addEventListener('input', () => { st.L = +sL.value; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', well: '#6f7b91', forbid: 'rgba(255,93,93,0.05)', level: 'rgba(255,255,255,0.25)', even: '#4ea8ff', odd: '#ff9d3c', sel: '#8de08a', circ: '#b487ff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function drawScene(col, r) {
  const ss = states(); const nb = ss.length;
  panel(col, r, `Finite square well: ${nb} bound state${nb === 1 ? '' : 's'} (click a level)`);
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 26 };
  const X = Math.max(1.7, st.L * 0.62 + 0.9); const Etop = st.V0 * 1.15;
  const xOf = (x) => inner.x + (x + X) / (2 * X) * inner.w;
  const yOf = (E) => inner.y + inner.h * (1 - E / Etop);
  SC = { inner, xOf, yOf, ss };
  const h = st.L / 2;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // forbidden regions tint.
  ctx.fillStyle = col.forbid; ctx.fillRect(inner.x, inner.y, xOf(-h) - inner.x, inner.h); ctx.fillRect(xOf(h), inner.y, inner.x + inner.w - xOf(h), inner.h);
  // the potential well.
  ctx.strokeStyle = col.well; ctx.lineWidth = 2.4; ctx.beginPath();
  ctx.moveTo(inner.x, yOf(st.V0)); ctx.lineTo(xOf(-h), yOf(st.V0)); ctx.lineTo(xOf(-h), yOf(0)); ctx.lineTo(xOf(h), yOf(0)); ctx.lineTo(xOf(h), yOf(st.V0)); ctx.lineTo(inner.x + inner.w, yOf(st.V0)); ctx.stroke();
  // energy levels (all) and the wavefunction (selected level only, on top).
  ss.forEach((s, i) => {
    const sel = i === st.sel; const Ey = yOf(s.E);
    ctx.strokeStyle = sel ? col.sel : col.level; ctx.lineWidth = sel ? 1.8 : 1; ctx.setLineDash(sel ? [] : [4, 4]); ctx.beginPath(); ctx.moveTo(xOf(-X), Ey); ctx.lineTo(xOf(X), Ey); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = sel ? col.sel : col.muted; ctx.font = fontString(canvas, 'tick', 'mono', sel ? 700 : 400); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`n=${s.n}`, xOf(X) - 4, Ey - 2);
  });
  const s = ss[st.sel];
  if (s) { const amp = st.V0 * 0.16, color = s.parity === 'even' ? col.even : col.odd;
    ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.beginPath();
    for (let p = 0; p <= 320; p += 1) { const x = -X + 2 * X * p / 320; const Y = yOf(s.E + amp * waveAt(s, x, st.V0, st.L)); p ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke(); }
  ctx.restore();
  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('V0', inner.x - 5, yOf(st.V0)); ctx.fillText('0', inner.x - 5, yOf(0));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('-L/2', xOf(-h), inner.y + inner.h + 4); ctx.fillText('+L/2', xOf(h), inner.y + inner.h + 4); ctx.fillText('x', inner.x + inner.w - 6, inner.y + inner.h + 4);
  ctx.save(); ctx.translate(r.x + 12, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('energy', 0, 0); ctx.restore();
  // selected-level readout.
  const sr = ss[st.sel];
  if (sr) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillStyle = sr.parity === 'even' ? col.even : col.odd; ctx.fillText(`n = ${sr.n} (${sr.parity}):  E = ${sr.E.toFixed(2)} = ${(sr.EoverV0 * 100).toFixed(1)}% of V0`, inner.x + 6, inner.y + 4); }
}

function drawDiag(col, r) {
  panel(col, r, 'Graphical solution: even/odd branches meet the circle at the bound states');
  const z0 = z0of(st.V0, st.L); const ss = states();
  const inner = { x: r.x + 36, y: r.y + 28, w: r.w - 36 - 16, h: r.h - 28 - 34 };
  const zMax = z0 + 0.6, yMax = z0 * 1.12;
  const xOf = (z) => inner.x + z / zMax * inner.w;
  const yOf = (y) => inner.y + inner.h * (1 - y / yMax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // legend, drawn first so the curves and dots sit on top of it.
  ctx.fillStyle = col.even; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('z tan z (even)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.odd; ctx.fillText('-z cot z (odd)', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.circ; ctx.fillText(`circle r = z0 = ${z0.toFixed(2)}`, inner.x + 6, inner.y + 32);
  ctx.save(); clipTo(ctx, inner);
  // pi/2 gridlines.
  ctx.strokeStyle = col.grid; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 1; k * Math.PI / 2 < zMax; k += 1) { ctx.beginPath(); ctx.moveTo(xOf(k * Math.PI / 2), inner.y); ctx.lineTo(xOf(k * Math.PI / 2), inner.y + inner.h); ctx.stroke(); }
  // branch curves, drawn in pole-free segments.
  const drawBranch = (fnz, color, evenParity) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; let pen = false; ctx.beginPath();
    for (let i = 0; i <= 600; i += 1) { const z = zMax * i / 600; const v = fnz(z); if (z < 0.02 || v < 0 || v > yMax * 1.4 || !isFinite(v)) { pen = false; continue; } const X = xOf(z), Y = yOf(v); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke();
  };
  drawBranch(evenBranch, col.even, true); drawBranch(oddBranch, col.odd, false);
  // the circle (radius z0).
  ctx.strokeStyle = col.circ; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 200; i += 1) { const z = z0 * i / 200; const Y = yOf(circle(z, z0)); i ? ctx.lineTo(xOf(z), Y) : ctx.moveTo(xOf(z), Y); } ctx.stroke();
  // intersections = bound states.
  ss.forEach((s, i) => { const sel = i === st.sel; ctx.fillStyle = sel ? col.sel : (s.parity === 'even' ? col.even : col.odd); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(xOf(s.z), yOf(circle(s.z, z0)), sel ? 6 : 4.5, 0, 6.28); ctx.fill(); ctx.stroke(); });
  ctx.restore();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('z = kL/2', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SC) return; const [sx, sy] = ptr(e); if (sy > REG.scene.y + REG.scene.h) return;
  const ss = SC.ss; let bi = -1, bd = 22; ss.forEach((s, i) => { const d = Math.abs(sy - SC.yOf(s.E)); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0) { st.sel = bi; render(); }
});

function boot() {
  if (params.get('V0')) st.V0 = Math.max(2, Math.min(80, +params.get('V0')));
  if (params.get('L')) st.L = Math.max(0.8, Math.min(4, +params.get('L')));
  if (params.get('sel')) st.sel = +params.get('sel');
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const ss = states(); const s = ss[st.sel];
  return { fields: [
    { key: 'V0', label: 'well depth V0', value: st.V0, format: 'float' },
    { key: 'L', label: 'well width L', value: st.L, format: 'float' },
    { key: 'z0', label: 'z0 = (L/2) sqrt(2 V0)', value: z0of(st.V0, st.L), format: 'float' },
    { key: 'count', label: 'bound states', value: ss.length, format: 'int' },
    { key: 'E', label: 'selected E / V0', value: s ? s.EoverV0 : 0, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const ss = states(); const z0 = z0of(st.V0, st.L); const s = ss[st.sel];
  let matchErr = 0; if (s) { const w = Math.sqrt(Math.max(0, z0 * z0 - s.z * s.z)); matchErr = s.parity === 'even' ? Math.abs(s.z * Math.tan(s.z) - w) : Math.abs(s.z / Math.tan(s.z) + w); }
  return [
    { key: 'count', label: 'count = floor(z0 / (pi/2)) + 1', value: `${ss.length}`, status: ss.length === countStates(st.V0, st.L) ? 'pass' : 'drift' },
    { key: 'match', label: 'selected level solves the matching condition', value: matchErr.toExponential(1), status: matchErr < 1e-4 ? 'pass' : 'drift' },
  ];
};
