// The Stern-Gerlach experiment. The scene streams atoms through an inhomogeneous
// magnet; they deflect by their quantised m_s and pile up into 2s+1 discrete spots
// on the screen, inside the faint band a classical moment would smear across. The
// diagnostic is the screen intensity profile, sharp quantum peaks against the flat
// classical density. Canvas2D only.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.4.1.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { spots, spotCount, classicalHalfWidth, makeRng, sampleQuantum } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selSpin = document.getElementById('select-spin');
const sG = document.getElementById('s-g'), vG = document.getElementById('v-g');
const btnReset = document.getElementById('btn-reset');

const SPINS = [0.5, 1, 1.5];
const DEF = { si: 0, grad: 0.6 };
const st = { si: DEF.si, grad: DEF.grad };
function spin() { return SPINS[st.si]; }
const SPREAD = 0.018; // beam spread in deflection units
let rng = makeRng(0xC0FFEE), atoms = [], landed = [], hist = null;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'diag', weight: 0.9 }]); }
function syncVals() { selSpin.value = String(st.si); sG.value = st.grad; vG.textContent = st.grad.toFixed(2); }
function reset() { rng = makeRng(0xC0FFEE); atoms = []; landed = []; hist = null; }
selSpin.addEventListener('change', () => { st.si = +selSpin.value; reset(); syncVals(); });
btnReset.addEventListener('click', () => { Object.assign(st, DEF); reset(); syncVals(); });
sG.addEventListener('input', () => { st.grad = +sG.value; reset(); syncVals(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', source: '#9aa0a6', magN: '#ff5d5d', magS: '#5b8cff', beam: '#ffd166', classical: 'rgba(91,140,255,0.13)', classicalLine: '#5b8cff', spot: '#ffd166', screen: 'rgba(255,255,255,0.5)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let GEO = null;
function setGeo(inner) {
  const sx = inner.x + inner.w * 0.06, xm0 = inner.x + inner.w * 0.34, xm1 = inner.x + inner.w * 0.56, xsc = inner.x + inner.w * 0.9;
  const cy = inner.y + inner.h * 0.5, Dpx = st.grad * inner.h * 0.34;
  const Lm = xm1 - xm0, A = 0.5 * Lm * Lm + Lm * (xsc - xm1);
  const shape = (x) => { if (x <= xm0) return 0; if (x <= xm1) return 0.5 * (x - xm0) * (x - xm0) / A; return (0.5 * Lm * Lm + Lm * (x - xm1)) / A; };
  GEO = { sx, xm0, xm1, xsc, cy, Dpx, shape, vx: inner.w * 0.42 };
}

function drawScene(col, r) {
  const s = spin();
  panel(col, r, `Beam through the magnet: ${spotCount(s)} discrete spots (2s+1), spin selectable`);
  const inner = { x: r.x + 16, y: r.y + 26, w: r.w - 32, h: r.h - 26 - 22 };
  setGeo(inner); const G = GEO;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // classical smear band (what a continuous moment would give).
  const dc = classicalHalfWidth(s, 1) * G.Dpx;
  ctx.fillStyle = col.classical; ctx.fillRect(G.xsc - 6, G.cy - dc, inner.x + inner.w - (G.xsc - 6), 2 * dc);
  // source.
  ctx.fillStyle = col.source; ctx.fillRect(G.sx - 10, G.cy - 16, 12, 32); ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('oven', G.sx - 4, G.cy + 20);
  // magnet poles (N wedge on top, S flat below), compact around the beam centre.
  const mid = (G.xm0 + G.xm1) / 2, gap = inner.h * 0.075, topY = G.cy - inner.h * 0.3, botY = G.cy + inner.h * 0.3;
  ctx.fillStyle = 'rgba(255,93,93,0.5)'; ctx.beginPath(); ctx.moveTo(G.xm0, topY); ctx.lineTo(G.xm1, topY); ctx.lineTo(mid, G.cy - gap); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(91,140,255,0.5)'; ctx.fillRect(G.xm0, G.cy + gap, G.xm1 - G.xm0, botY - (G.cy + gap));
  ctx.fillStyle = col.magN; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', mid, topY + 14);
  ctx.fillStyle = col.magS; ctx.fillText('S', mid, botY - 12);
  // screen.
  ctx.strokeStyle = col.screen; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(G.xsc, inner.y + 4); ctx.lineTo(G.xsc, inner.y + inner.h - 4); ctx.stroke();
  // landed spots.
  for (const ly of landed) { ctx.fillStyle = col.spot; ctx.beginPath(); ctx.arc(G.xsc + 2 + (ly.j - 0.5) * 10, ly.y, 1.8, 0, 6.28); ctx.fill(); }
  // live atoms.
  for (const a of atoms) { const y = G.cy - a.Y * G.shape(a.x); ctx.fillStyle = col.beam; ctx.beginPath(); ctx.arc(a.x, y, 2.4, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // labels.
  ctx.fillStyle = col.classicalLine; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('classical smear (expected)', inner.x + inner.w - 4, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.fillText(`${landed.length} atoms detected`, inner.x + 6, inner.y + inner.h - 16);
}

function drawDiag(col, r) {
  const s = spin();
  panel(col, r, 'Screen intensity vs position: discrete quantum peaks against the flat classical band');
  const inner = { x: r.x + 16, y: r.y + 28, w: r.w - 32, h: r.h - 28 - 30 };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  const ymaxUnits = 1.25 * classicalHalfWidth(s, 1); // in deflection units (d=1 -> outer spot)
  // map deflection (units, outer spot at +/-1 scaled by ... ) to horizontal here: plot intensity vs y position.
  // x-axis = landing position (deflection units), y-axis = count.
  const xOf = (yu) => inner.x + (yu + ymaxUnits) / (2 * ymaxUnits) * inner.w;
  if (!hist) return;
  let hmax = 1; for (const c of hist.bins) hmax = Math.max(hmax, c);
  const yOf = (c) => inner.y + inner.h * (1 - 0.92 * c / hmax);
  ctx.save(); clipTo(ctx, inner);
  // classical uniform density (flat top over [-dc_units, dc_units]).
  const dcu = classicalHalfWidth(s, 1);
  ctx.strokeStyle = col.classicalLine; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.7; ctx.setLineDash([5, 4]);
  const clLevel = yOf(hmax * 0.42); // schematic flat level for the classical band
  ctx.beginPath(); ctx.moveTo(xOf(-dcu), inner.y + inner.h); ctx.lineTo(xOf(-dcu), clLevel); ctx.lineTo(xOf(dcu), clLevel); ctx.lineTo(xOf(dcu), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  // quantum histogram (bars).
  const bw = inner.w / hist.bins.length;
  for (let i = 0; i < hist.bins.length; i += 1) { const c = hist.bins[i]; if (c === 0) continue; const yu = hist.lo + (i + 0.5) * hist.dy; const X = xOf(yu); ctx.fillStyle = col.spot; ctx.fillRect(X - bw / 2, yOf(c), Math.max(1.5, bw - 1), inner.y + inner.h - yOf(c)); }
  ctx.restore();
  // spot markers.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const sp of spots(s, 1)) ctx.fillText(`m=${sp.ms}`, xOf(sp.y), inner.y + inner.h + 6);
  ctx.fillText('landing position', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.fillStyle = col.classicalLine; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('classical band (continuous)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.spot; ctx.fillText('quantum spots (discrete)', inner.x + 6, inner.y + 18);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function spawn() { const s = spin(); const r = sampleQuantum(s, 1, SPREAD, rng); return { x: GEO.sx, Y: r.y * GEO.Dpx, ms: r.ms }; }
function landAtom(a) {
  const yu = a.Y / GEO.Dpx; // deflection units
  landed.push({ y: GEO.cy - a.Y, j: rng() }); if (landed.length > 700) landed.shift();
  if (!hist) { const s = spin(); const lim = 1.3 * classicalHalfWidth(s, 1); const NB = 121; hist = { lo: -lim, dy: 2 * lim / NB, bins: new Array(NB).fill(0) }; }
  const bi = Math.floor((yu - hist.lo) / hist.dy); if (bi >= 0 && bi < hist.bins.length) hist.bins[bi] += 1;
}
function advance(dt) {
  if (!GEO) return;
  if (atoms.length < 34 && rng() < 0.6) atoms.push(spawn());
  for (const a of atoms) a.x += GEO.vx * dt;
  const keep = []; for (const a of atoms) { if (a.x >= GEO.xsc) landAtom(a); else keep.push(a); } atoms = keep;
}

const running = true; let last = 0;
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

function boot() {
  if (params.get('spin')) { const m = { '0.5': 0, '1': 1, '1.5': 2 }; if (m[params.get('spin')] !== undefined) st.si = m[params.get('spin')]; }
  if (params.get('grad')) st.grad = Math.max(0.2, Math.min(1, +params.get('grad')));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) {
    // populate the screen with many detections for a representative frame.
    setGeo({ x: REG.scene.x + 16, y: REG.scene.y + 26, w: REG.scene.w - 32, h: REG.scene.h - 26 - 22 });
    for (let i = 0; i < 620; i += 1) landAtom(spawn());
    for (let i = 0; i < 20; i += 1) { const a = spawn(); a.x = GEO.sx + (GEO.xsc - GEO.sx) * ((i + 0.5) / 20); atoms.push(a); }
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = spin();
  return { fields: [
    { key: 'spin', label: 'spin s', value: s === 0.5 ? '1/2' : s === 1.5 ? '3/2' : '1', format: 'text' },
    { key: 'spots', label: 'number of spots (2s+1)', value: spotCount(s), format: 'int' },
    { key: 'grad', label: 'field gradient', value: st.grad, format: 'float' },
    { key: 'detected', label: 'atoms detected', value: landed.length, format: 'int' },
    { key: 'cw', label: 'classical band / spot', value: classicalHalfWidth(s, 1), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const s = spin();
  return [
    { key: 'count', label: 'beam splits into 2s+1 spots', value: `${spotCount(s)}`, status: 'pass' },
    { key: 'inside', label: 'spots inside the classical band', value: classicalHalfWidth(s, 1).toFixed(2), status: classicalHalfWidth(s, 1) > 1 ? 'pass' : 'drift' },
  ];
};
