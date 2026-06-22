// The determinant as the signed area scaling of a 2x2 linear map. The scene shows
// the plane warped by the matrix (the integer grid sheared), the image of the
// unit square as a parallelogram coloured by the sign of the determinant, and the
// two draggable column vectors; the determinant equals the signed area, flips
// when the map reverses orientation, and is zero when the columns are collinear.
// The diagnostic sweeps the second column around to trace the signed area.
// Canvas2D only.
//
// Reference: Strang, Linear Algebra and its Applications, Ch. 5.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { det2, parallelogramArea, angleBetween, apply, PRESETS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selPreset = document.getElementById('select-preset');
const sA = document.getElementById('s-a'), sB = document.getElementById('s-b'), sC = document.getElementById('s-c'), sD = document.getElementById('s-d');
const vA = document.getElementById('v-a'), vB = document.getElementById('v-b'), vC = document.getElementById('v-c'), vD = document.getElementById('v-d');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(PRESETS);
const EXT = 3;
// an asymmetric motif (an "F") on the unit square, carried into the parallelogram
// so the orientation flip at det < 0 is visible as a mirror image.
const FMOTIF = [[[0.30, 0.22], [0.30, 0.80]], [[0.30, 0.80], [0.64, 0.80]], [[0.30, 0.54], [0.56, 0.54]]];
const st = { preset: 'custom', a: 1, b: 0.4, c: -0.5, d: 1.3, playing: false, phase: 0 };   // columns v1=(a,b), v2=(c,d)
const btnPlay = document.getElementById('btn-play');
function setPlaying(on) { st.playing = on; if (btnPlay) { btnPlay.textContent = on ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!on)); } }
function applyPreset(k) { const p = PRESETS[k]; st.preset = k; st.a = p.a; st.b = p.b; st.c = p.c; st.d = p.d; }
function matchPreset() { for (const k of KEYS) { const p = PRESETS[k]; if (Math.abs(p.a - st.a) < 1e-6 && Math.abs(p.b - st.b) < 1e-6 && Math.abs(p.c - st.c) < 1e-6 && Math.abs(p.d - st.d) < 1e-6) return k; } return 'custom'; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.42 }, { name: 'diag', weight: 0.82 }]);
}
function syncVals() {
  sA.value = st.a; vA.textContent = st.a.toFixed(2);
  sB.value = st.b; vB.textContent = st.b.toFixed(2);
  sC.value = st.c; vC.textContent = st.c.toFixed(2);
  sD.value = st.d; vD.textContent = st.d.toFixed(2);
  st.preset = matchPreset(); selPreset.value = st.preset;
}
function setEntry(k, val) { st[k] = val; syncVals(); render(); }
sA.addEventListener('input', () => { setPlaying(false); setEntry('a', +sA.value); });
sB.addEventListener('input', () => { setPlaying(false); setEntry('b', +sB.value); });
sC.addEventListener('input', () => { setPlaying(false); setEntry('c', +sC.value); });
sD.addEventListener('input', () => { setPlaying(false); setEntry('d', +sD.value); });
selPreset.addEventListener('change', () => { if (selPreset.value !== 'custom' && PRESETS[selPreset.value]) { applyPreset(selPreset.value); syncVals(); render(); } });
btnReset.addEventListener('click', () => { st.a = 1; st.b = 0.4; st.c = -0.5; st.d = 1.3; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.07)', warp: 'rgba(120,150,210,0.35)', pos: '#5b8def', neg: '#ef5466', v1: '#67d98c', v2: '#ffd166', orient: '#ffffff' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function vec(col, x0, y0, x1, y1, w) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const an = Math.atan2(y1 - y0, x1 - x0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 9 * Math.cos(an - 0.45), y1 - 9 * Math.sin(an - 0.45)); ctx.lineTo(x1 - 9 * Math.cos(an + 0.45), y1 - 9 * Math.sin(an + 0.45)); ctx.closePath(); ctx.fill();
}

let SCN = null;
function drawScene(col, r) {
  const det = det2(st.a, st.b, st.c, st.d);
  panel(col, r, 'The unit square maps to a parallelogram of signed area = det');
  const titleH = 24, stripH = 30;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h) - 16;
  const ox = draw.x + (draw.w - size) / 2, oy = draw.y + (draw.h - size) / 2;
  const X = (wx) => ox + (wx + EXT) / (2 * EXT) * size, Y = (wy) => oy + (EXT - wy) / (2 * EXT) * size;
  const wX = (sx) => (sx - ox) / size * (2 * EXT) - EXT, wY = (sy) => EXT - (sy - oy) / size * (2 * EXT);
  SCN = { ox, oy, size, wX, wY };
  ctx.save(); clipTo(ctx, { x: ox, y: oy, w: size, h: size });

  // faint original grid.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  for (let k = -EXT; k <= EXT; k += 1) { ctx.beginPath(); ctx.moveTo(X(k), Y(-EXT)); ctx.lineTo(X(k), Y(EXT)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X(-EXT), Y(k)); ctx.lineTo(X(EXT), Y(k)); ctx.stroke(); }
  // warped grid: images of the integer lines under M.
  ctx.strokeStyle = col.warp; ctx.lineWidth = 1;
  for (let k = -EXT; k <= EXT; k += 1) {
    let p = apply(st.a, st.b, st.c, st.d, k, -EXT), q = apply(st.a, st.b, st.c, st.d, k, EXT);
    ctx.beginPath(); ctx.moveTo(X(p[0]), Y(p[1])); ctx.lineTo(X(q[0]), Y(q[1])); ctx.stroke();
    p = apply(st.a, st.b, st.c, st.d, -EXT, k); q = apply(st.a, st.b, st.c, st.d, EXT, k);
    ctx.beginPath(); ctx.moveTo(X(p[0]), Y(p[1])); ctx.lineTo(X(q[0]), Y(q[1])); ctx.stroke();
  }
  // input unit square (area 1) for the area-scaling comparison, with an "F" motif.
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(0)); ctx.lineTo(X(1), Y(1)); ctx.lineTo(X(0), Y(1)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('area 1', X(0.7), Y(0.16));
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
  for (const seg of FMOTIF) { ctx.beginPath(); seg.forEach((pt, i) => { i ? ctx.lineTo(X(pt[0]), Y(pt[1])) : ctx.moveTo(X(pt[0]), Y(pt[1])); }); ctx.stroke(); }
  // image of the unit square (the parallelogram), filled by sign.
  const C = [[0, 0], [st.a, st.b], [st.a + st.c, st.b + st.d], [st.c, st.d]];
  ctx.beginPath(); ctx.moveTo(X(C[0][0]), Y(C[0][1])); for (let i = 1; i < 4; i += 1) ctx.lineTo(X(C[i][0]), Y(C[i][1])); ctx.closePath();
  ctx.fillStyle = det >= 0 ? 'rgba(91,141,239,0.30)' : 'rgba(239,84,102,0.30)'; ctx.fill();
  ctx.strokeStyle = det >= 0 ? col.pos : col.neg; ctx.lineWidth = 2; ctx.stroke();
  // the same "F" carried by M into the parallelogram (mirrored when det < 0).
  ctx.strokeStyle = det >= 0 ? '#bcd2ff' : '#ffc2cc'; ctx.lineWidth = 2.4;
  for (const seg of FMOTIF) { ctx.beginPath(); seg.forEach((pt, i) => { const w = apply(st.a, st.b, st.c, st.d, pt[0], pt[1]); i ? ctx.lineTo(X(w[0]), Y(w[1])) : ctx.moveTo(X(w[0]), Y(w[1])); }); ctx.stroke(); }
  // orientation arc (v1 -> v2 sense), inside the parallelogram near the origin.
  const ang1 = Math.atan2(st.b, st.a), ang2 = Math.atan2(st.d, st.c); const rad = size * 0.07;
  ctx.strokeStyle = col.orient; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(X(0), Y(0), rad, -ang1, -ang2, det < 0); ctx.stroke();
  // column vectors.
  vec(col.v1, X(0), Y(0), X(st.a), Y(st.b), 3);
  vec(col.v2, X(0), Y(0), X(st.c), Y(st.d), 3);
  ctx.fillStyle = col.v1; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('v1', X(st.a) + 6, Y(st.b));
  ctx.fillStyle = col.v2; ctx.fillText('v2', X(st.c) + 6, Y(st.d));
  ctx.restore();

  // readout strip.
  const items = [[`det ${det.toFixed(3)}`, det >= 0 ? col.pos : col.neg], [`area x ${Math.abs(det).toFixed(2)}`, col.fg], [det > 1e-4 ? 'orientation kept' : det < -1e-4 ? 'orientation flipped' : 'collapsed (det 0)', det > 1e-4 ? col.pos : det < -1e-4 ? col.neg : col.muted]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 11); });
}

function drawDiag(col, r) {
  panel(col, r, 'Signed area as the second column rotates: det = |v1||v2| sin(angle from v1 to v2)');
  const inner = { x: r.x + 44, y: r.y + 26, w: r.w - 44 - 16, h: r.h - 26 - 30 };
  const r1 = Math.hypot(st.a, st.b), r2 = Math.hypot(st.c, st.d), ang1 = Math.atan2(st.b, st.a);
  const amp = r1 * r2 * 1.12 + 1e-9;
  const xOf = (t) => inner.x + t / (2 * Math.PI) * inner.w;
  const yOf = (v) => inner.y + inner.h / 2 - v / amp * (inner.h / 2);
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // det(theta) = r1 r2 sin(theta - ang1) as v2 angle theta sweeps 0..2pi.
  ctx.strokeStyle = col.v2; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i <= 220; i += 1) { const th = 2 * Math.PI * i / 220; const v = r1 * r2 * Math.sin(th - ang1); const Xp = xOf(th), Yp = yOf(v); i ? ctx.lineTo(Xp, Yp) : ctx.moveTo(Xp, Yp); }
  ctx.stroke();
  // current v2 angle marker.
  const th2 = (Math.atan2(st.d, st.c) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const detNow = det2(st.a, st.b, st.c, st.d);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(th2), inner.y); ctx.lineTo(xOf(th2), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = detNow >= 0 ? col.pos : col.neg; ctx.beginPath(); ctx.arc(xOf(th2), yOf(detNow), 4, 0, 6.28); ctx.fill();
  // zero crossings (collinear) labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('v2 angle 0', xOf(0.02), inner.y + inner.h + 4); ctx.fillText('pi', xOf(Math.PI), inner.y + inner.h + 4); ctx.fillText('2pi', xOf(2 * Math.PI) - 8, inner.y + inner.h + 4);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col.v2; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('det (signed area)', inner.x + 6, inner.y + 4);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = null;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => {
  if (!SCN) return; const [sx, sy] = ptr(e); const X = (wx) => SCN.ox + (wx + EXT) / (2 * EXT) * SCN.size, Y = (wy) => SCN.oy + (EXT - wy) / (2 * EXT) * SCN.size;
  const d1 = Math.hypot(sx - X(st.a), sy - Y(st.b)), d2 = Math.hypot(sx - X(st.c), sy - Y(st.d));
  if (Math.min(d1, d2) < 26) { drag = d1 <= d2 ? 1 : 2; setVec(sx, sy); render(); }
});
function setVec(sx, sy) { setPlaying(false); const wx = Math.max(-EXT, Math.min(EXT, SCN.wX(sx))), wy = Math.max(-EXT, Math.min(EXT, SCN.wY(sy))); if (drag === 1) { st.a = wx; st.b = wy; } else { st.c = wx; st.d = wy; } syncVals(); }
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [sx, sy] = ptr(e); setVec(sx, sy); render(); });
window.addEventListener('pointerup', () => { drag = null; });

// Sweep the second column so the determinant runs through zero: the
// parallelogram shears, collapses to a line (area 0), then flips orientation.
let lastT = performance.now();
function tick(now) {
  const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.playing) { st.phase = (st.phase + dt * 0.4) % 1; st.c = 3.4 * Math.sin(st.phase * 2 * Math.PI); syncVals(); render(); }
  requestAnimationFrame(tick);
}
if (btnPlay) btnPlay.addEventListener('click', () => setPlaying(!st.playing));

function boot() {
  if (params.get('preset') && PRESETS[params.get('preset')]) applyPreset(params.get('preset'));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) { setPlaying(false); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { setPlaying(true); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const det = det2(st.a, st.b, st.c, st.d);
  return { fields: [
    { key: 'v1', label: 'column v1', value: `(${st.a.toFixed(2)}, ${st.b.toFixed(2)})`, format: 'text' },
    { key: 'v2', label: 'column v2', value: `(${st.c.toFixed(2)}, ${st.d.toFixed(2)})`, format: 'text' },
    { key: 'det', label: 'determinant', value: det, format: 'float' },
    { key: 'area', label: 'area scaling |det|', value: Math.abs(det), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const det = det2(st.a, st.b, st.c, st.d);
  const area = parallelogramArea(st.a, st.b, st.c, st.d);
  const err = Math.abs(Math.abs(det) - area);
  const r1 = Math.hypot(st.a, st.b), r2 = Math.hypot(st.c, st.d);
  const sinForm = Math.abs(det - r1 * r2 * Math.sin(angleBetween(st.a, st.b, st.c, st.d)));
  return [
    { key: 'area', label: '|det| = parallelogram area', value: err.toExponential(1), status: err < 1e-9 ? 'pass' : 'drift' },
    { key: 'sin', label: 'det = |v1||v2| sin(angle)', value: sinForm.toExponential(1), status: sinForm < 1e-9 ? 'pass' : 'drift' },
  ];
};
