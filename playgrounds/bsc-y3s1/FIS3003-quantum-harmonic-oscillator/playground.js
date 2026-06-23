// The quantum harmonic oscillator. The scene draws the parabolic well with its
// equally spaced energy levels and the selected eigenstate riding on its level
// (oscillating in time), its n nodes and classical turning points marked. The
// diagnostic compares |psi_n|^2 with the classical probability density, which the
// quantum density tracks at high n. Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { psi, prob, energy, turningPoint, potential, classicalProb, nodeCount } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('s-n'), vN = document.getElementById('v-n');
const btnReset = document.getElementById('btn-reset');

const NMAX = 12, X = turningPoint(NMAX) + 1.6, EMAX = energy(NMAX) + 1.0;
const st = { n: 4 };
let phase = 0;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.9 }]); }
function syncVals() { sN.value = st.n; vN.textContent = `${st.n}`; }
btnReset.addEventListener('click', () => { st.n = 4; syncVals(); });
sN.addEventListener('input', () => { st.n = +sN.value; syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', well: '#6f7b91', level: 'rgba(255,255,255,0.16)', sel: '#8de08a', psi: '#4ea8ff', turn: '#ff9d3c', prob: '#4ea8ff', classical: '#ff9d3c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  panel(col, r, `Parabolic well: E_n = (n + 1/2) hbar omega, equally spaced (state n = ${st.n})`);
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 26 };
  const xOf = (x) => inner.x + (x + X) / (2 * X) * inner.w; const yOf = (E) => inner.y + inner.h * (1 - E / EMAX);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // potential well.
  ctx.strokeStyle = col.well; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 200; i += 1) { const x = -X + 2 * X * i / 200; const Y = yOf(Math.min(EMAX, potential(x))); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  // energy levels.
  for (let n = 0; n <= NMAX; n += 1) { const sel = n === st.n; const Ey = yOf(energy(n)); const xt = turningPoint(n); ctx.strokeStyle = sel ? col.sel : col.level; ctx.lineWidth = sel ? 1.8 : 1; ctx.setLineDash(sel ? [] : [4, 4]); ctx.beginPath(); ctx.moveTo(xOf(-xt), Ey); ctx.lineTo(xOf(xt), Ey); ctx.stroke(); ctx.setLineDash([]); }
  // selected eigenstate riding on its level (oscillating in time).
  const n = st.n, E = energy(n), amp = 0.92, ph = Math.cos(phase * 1.5);
  ctx.strokeStyle = col.psi; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= 320; i += 1) { const x = -X + 2 * X * i / 320; const Y = yOf(E + amp * psi(n, x) * ph); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  // turning points on the parabola.
  const xt = turningPoint(n); for (const sgn of [1, -1]) { ctx.fillStyle = col.turn; ctx.beginPath(); ctx.arc(xOf(sgn * xt), yOf(E), 4, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // axes labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('E', inner.x - 5, inner.y + 8); ctx.fillText('0', inner.x - 5, yOf(0));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('x', inner.x + inner.w - 6, inner.y + inner.h + 4);
  ctx.fillStyle = col.turn; ctx.fillText('turning points', xOf(xt), inner.y + inner.h + 4);
  ctx.fillStyle = col.fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText(`E_${n} = ${E.toFixed(1)} hbar omega,  ${nodeCount(n)} nodes`, inner.x + 6, inner.y + 4);
}

function drawDiag(col, r) {
  panel(col, r, '|psi_n|^2 vs the classical probability: quantum oscillations track the classical at high n');
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 34 };
  const n = st.n, xt = turningPoint(n);
  const xOf = (x) => inner.x + (x + X) / (2 * X) * inner.w;
  let pmax = 0; for (let i = 0; i <= 300; i += 1) pmax = Math.max(pmax, prob(n, -X + 2 * X * i / 300)); pmax *= 1.18;
  const yOf = (p) => inner.y + inner.h * (1 - p / pmax);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // turning points.
  for (const sgn of [1, -1]) { ctx.strokeStyle = 'rgba(255,157,60,0.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(sgn * xt), inner.y); ctx.lineTo(xOf(sgn * xt), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }
  // classical probability (clipped at the top where it diverges).
  ctx.strokeStyle = col.classical; ctx.lineWidth = 2; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 400; i += 1) { const x = -X + 2 * X * i / 400; const pc = classicalProb(n, x); if (pc <= 0) { pen = false; continue; } const Y = yOf(Math.min(pmax * 1.1, pc)); if (pen) ctx.lineTo(xOf(x), Y); else { ctx.moveTo(xOf(x), Y); pen = true; } } ctx.stroke();
  // quantum probability.
  ctx.fillStyle = 'rgba(78,168,255,0.16)'; ctx.strokeStyle = col.prob; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) { const x = -X + 2 * X * i / 400; const Y = yOf(prob(n, x)); i ? ctx.lineTo(xOf(x), Y) : ctx.moveTo(xOf(x), Y); } ctx.stroke();
  ctx.lineTo(xOf(X), yOf(0)); ctx.lineTo(xOf(-X), yOf(0)); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.prob; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('|psi_n|^2 (quantum)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.classical; ctx.fillText('classical (piles up at turning points)', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('x', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

const running = true; let last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) phase += dt; render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('n') !== null) st.n = Math.max(0, Math.min(NMAX, +params.get('n')));
  syncVals(); relayout();
  if (DETERMINISTIC) { phase = 0.4; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'n', label: 'level n', value: st.n, format: 'int' },
    { key: 'E', label: 'energy E_n', value: energy(st.n), format: 'float', unit: 'hbar omega' },
    { key: 'nodes', label: 'nodes', value: nodeCount(st.n), format: 'int' },
    { key: 'xt', label: 'turning point x_t', value: turningPoint(st.n), format: 'float' },
    { key: 'spacing', label: 'level spacing', value: 1, format: 'float', unit: 'hbar omega' },
  ] };
};
window.playground.getInvariants = function () {
  const n = st.n; const spacing = energy(n + 1) - energy(n); const tp = Math.abs(potential(turningPoint(n)) - energy(n));
  return [
    { key: 'spacing', label: 'levels equally spaced by hbar omega', value: spacing.toFixed(3), status: Math.abs(spacing - 1) < 1e-9 ? 'pass' : 'drift' },
    { key: 'nodes', label: 'state n has n nodes', value: `${nodeCount(n)}`, status: nodeCount(n) === n ? 'pass' : 'drift' },
  ];
};
