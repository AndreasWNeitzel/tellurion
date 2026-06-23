// Mode trapping in evolved stars. A sharp glitch in the buoyancy frequency
// N(r) partially reflects g-modes; both the trapped eigenfunctions and the dips
// in the period spacing come out of one eigenvalue solve (sim.js). The top
// panel shows N(r) and the current mode's displacement eigenfunction (trapped
// modes ring loudly on one side of the glitch); the bottom panel is the
// observable period-spacing diagram Delta P(P) whose dips mark the trapped
// modes. Canvas2D only.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3.4; Cunha et al., ApJ 805 (2015) 127; Mosser et al., A&A 618 (2018) A109.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { solveGModes, bruntProfile, X_IN, X_ENV, DPI1_SECONDS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sX = document.getElementById('slider-xg'), vX = document.getElementById('value-xg');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { A: 0.45, xg: 0.22, l: 1, mi: 1, t: 0 };
let running = !DETERMINISTIC;

let view = { w: 800, h: 1000, dpr: 1 };
let REG = null, sol = null;
function resolve() { sol = solveGModes(st.A, st.xg, st.l); if (st.mi > sol.count - 1) st.mi = 1; }

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.45 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#06070c',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)',
    nCol: '#5bc0eb', glitch: '#ef476f', env: '#94a3b8',
    trap: '#ffd166', prop: '#06d6a0', pi: '#06d6a0', dot: '#22d3ee',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function curMode() { return Math.max(0, Math.min(sol.count - 1, Math.round(st.mi))); }

function drawScene(col, r) {
  panel(col, r, 'A buoyancy glitch traps some g-modes: the eigenfunction shows which');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x + 12, y: r.y + titleH, w: r.w - 24, h: r.h - titleH - stripH };
  const XP = (x) => draw.x + x * draw.w;
  const mode = curMode();
  const trap = sol.trapping[mode];
  const isTrapped = trap > 0.45;

  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH });

  // convective envelope region (x > X_ENV) shaded.
  ctx.fillStyle = 'rgba(148,163,184,0.06)'; ctx.fillRect(XP(X_ENV), draw.y, draw.w * (1 - X_ENV), draw.h);

  // N(x) buoyancy profile in the upper band.
  const nTop = draw.y + 14, nBot = draw.y + draw.h * 0.40;
  ctx.beginPath(); ctx.moveTo(XP(0), nBot);
  for (let s = 0; s <= 320; s += 1) { const x = s / 320; ctx.lineTo(XP(x), nBot - bruntProfile(x, st.A, st.xg) / 1.5 * (nBot - nTop)); }
  ctx.lineTo(XP(1), nBot); ctx.closePath();
  const g = ctx.createLinearGradient(0, nTop, 0, nBot);
  g.addColorStop(0, 'rgba(91,192,235,0.55)'); g.addColorStop(1, 'rgba(91,192,235,0.05)');
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = col.nCol; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('buoyancy frequency N(r)', XP(0) + 6, nTop + 2);

  // glitch and convective-boundary markers.
  ctx.strokeStyle = col.glitch; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(XP(st.xg), draw.y); ctx.lineTo(XP(st.xg), draw.y + draw.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.glitch; ctx.fillText('composition glitch', XP(st.xg) + 5, nTop + 18);
  ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(XP(X_ENV), draw.y); ctx.lineTo(XP(X_ENV), draw.y + draw.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.env; ctx.textAlign = 'left'; ctx.fillText('convective envelope', XP(X_ENV) + 5, draw.y + draw.h - 14);

  // current eigenfunction in the lower band.
  const mid = draw.y + draw.h * 0.72;
  ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(XP(X_IN), mid); ctx.lineTo(XP(X_ENV), mid); ctx.stroke();
  const ef = sol.eigfns[mode]; const osc = Math.cos(2 * Math.PI * st.t * 0.7);
  const amp = draw.h * 0.22;
  const lineCol = isTrapped ? col.trap : col.prop;
  ctx.strokeStyle = lineCol; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i < ef.x.length; i += 1) { const X = XP(ef.x[i]), Y = mid - ef.psi[i] * osc * amp; i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  ctx.strokeStyle = isTrapped ? 'rgba(255,209,102,0.22)' : 'rgba(6,214,160,0.20)'; ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();

  ctx.fillStyle = lineCol; ctx.font = fontString(canvas, 'caption', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(isTrapped ? 'mode TRAPPED: rings against the glitch (a deltaP dip)' : 'mode propagating across the cavity', draw.x + 4, draw.y + draw.h * 0.44);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('displacement xi(r)    centre | fractional radius r/R | surface', draw.x + 4, draw.y + draw.h - 2);

  // readout strip.
  const items = [
    [`mode n = ${mode + 1}`, col.fg],
    [`P = ${sol.periods[mode].toFixed(0)} s`, col.dot],
    [`Pi_1 = ${DPI1_SECONDS} s`, col.pi],
    [`trapping ${(trap * 100).toFixed(0)}%`, isTrapped ? col.trap : col.prop],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Period-spacing diagram  deltaP(P)  (what Kepler and TESS observe)');
  const inner = { x: r.x + 48, y: r.y + 28, w: r.w - 48 - 16, h: r.h - 28 - 44 };
  const P = sol.periods, dP = sol.deltaP;
  const Pmin = P[0], Pmax = P[P.length - 1];
  const dLo = DPI1_SECONDS * (1 - 0.30), dHi = DPI1_SECONDS * (1 + 0.30);
  const xOf = (p) => inner.x + (p - Pmin) / (Pmax - Pmin) * inner.w;
  const yOf = (d) => inner.y + inner.h - (Math.max(dLo, Math.min(dHi, d)) - dLo) / (dHi - dLo) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const d of [DPI1_SECONDS * 0.8, DPI1_SECONDS, DPI1_SECONDS * 1.2]) { const y = yOf(d); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(d.toFixed(0), inner.x - 6, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // asymptotic Pi_1.
  ctx.strokeStyle = 'rgba(6,214,160,0.5)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(DPI1_SECONDS)); ctx.lineTo(inner.x + inner.w, yOf(DPI1_SECONDS)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(6,214,160,0.85)'; ctx.textAlign = 'left'; ctx.fillText('Pi_1', inner.x + inner.w - 26, yOf(DPI1_SECONDS) - 8);

  // deltaP(P): plotted at the midpoint period of each pair.
  ctx.strokeStyle = col.trap; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i < dP.length; i += 1) { const px = xOf(0.5 * (P[i] + P[i + 1])), py = yOf(dP[i]); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.stroke();
  for (let i = 0; i < dP.length; i += 1) { ctx.fillStyle = sol.trapping[i + 1] > 0.45 ? col.trap : 'rgba(255,209,102,0.5)'; ctx.beginPath(); ctx.arc(xOf(0.5 * (P[i] + P[i + 1])), yOf(dP[i]), 2.6, 0, 6.2832); ctx.fill(); }

  // current mode marker.
  const mode = curMode();
  if (mode < dP.length) { ctx.fillStyle = col.dot; ctx.beginPath(); ctx.arc(xOf(0.5 * (P[mode] + P[mode + 1])), yOf(dP[mode]), 4.5, 0, 6.2832); ctx.fill(); }

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('period P (s)', inner.x + inner.w / 2, inner.y + inner.h + 8);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('spacing deltaP (s)', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!sol) resolve();
  if (running && !CAPTURE_NAME) { st.t += 0.05; st.mi += 0.04; if (st.mi > sol.count - 1.5) st.mi = 1; }
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// --- controls --------------------------------------------------------------
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); resolve(); render(); });
sX.addEventListener('input', () => { st.xg = parseFloat(sX.value); vX.textContent = st.xg.toFixed(2); resolve(); render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = String(st.l); resolve(); render(); });
btnR.addEventListener('click', () => {
  st.A = 0.45; st.xg = 0.22; st.l = 1; st.mi = 1; st.t = 0;
  sA.value = '0.45'; vA.textContent = '0.45'; sX.value = '0.22'; vX.textContent = '0.22'; sL.value = '1'; vL.textContent = '1';
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); resolve(); render();
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

st.A = parseFloat(sA.value); st.xg = parseFloat(sX.value); st.l = parseInt(sL.value, 10);
vA.textContent = st.A.toFixed(2); vX.textContent = st.xg.toFixed(2); vL.textContent = String(st.l);
relayout(); resolve(); render();

if (DETERMINISTIC) {
  const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0.4;
  st.mi = 1 + frac * (sol.count - 3); st.t = 0.0; render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const m = curMode();
  return { fields: [
    { key: 'glitch-A', label: 'Glitch strength A', value: st.A, format: 'float' },
    { key: 'glitch-x', label: 'Glitch position r/R', value: st.xg, format: 'float' },
    { key: 'degree', label: 'Degree l', value: st.l, format: 'float' },
    { key: 'mode', label: 'Mode n', value: m + 1, format: 'float' },
    { key: 'period', label: 'Period (s)', value: sol ? sol.periods[m] : 0, format: 'float' },
    { key: 'trap', label: 'Trapping', value: sol ? sol.trapping[m] : 0, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  if (!sol) return [];
  const mean = sol.deltaP.reduce((a, b) => a + b, 0) / sol.deltaP.length;
  const rel = Math.abs(mean - DPI1_SECONDS) / DPI1_SECONDS;
  // With no glitch the spacing is uniform; with a glitch it modulates.
  const spread = Math.sqrt(sol.deltaP.reduce((a, b) => a + (b - mean) ** 2, 0) / sol.deltaP.length) / mean;
  return [
    { key: 'mean-spacing', label: 'Mean spacing = Pi_1', value: mean.toFixed(1) + ' s', status: rel < 0.02 ? 'pass' : 'drift' },
    { key: 'modulation', label: st.A > 0.05 ? 'Glitch modulates deltaP' : 'No glitch: deltaP uniform', value: (spread * 100).toFixed(1) + '%', status: 'pass' },
  ];
};
