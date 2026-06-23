// The matrix exponential as a flow. The scene is the phase portrait of x' = A x:
// streamlines, flowing markers along exp(At), the eigenvector directions, and a
// draggable initial condition; the diagnostic places the eigenvalues in the
// complex plane, whose position classifies the fixed point. Canvas2D only.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Sec. 6.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { eigen, expAt, flow, apply, classify, eigvecs, trace, det, PRESETS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selPre = document.getElementById('select-preset');
const sA = document.getElementById('s-a'), sB = document.getElementById('s-b'), sC = document.getElementById('s-c'), sD = document.getElementById('s-d');
const vA = document.getElementById('v-a'), vB = document.getElementById('v-b'), vC = document.getElementById('v-c'), vD = document.getElementById('v-d');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(PRESETS);
const W = 3;
let preKey = 'stableSpiral';
const st = { A: PRESETS[preKey].A.map((r) => [...r]), x0: [2.2, 1.4] };
// a unit circle of tracers, carried by exp(A t) to make the matrix exponential
// visible: it stretches into an ellipse (node), rotates (centre), or spirals.
const CIRC0 = []; for (let i = 0; i < 60; i += 1) { const a = i / 60 * 6.2832; CIRC0.push([1.6 * Math.cos(a), 1.6 * Math.sin(a)]); }
let flowT = 0;
let markers = [], icT = 0, rngS = 0x1234;
function rng() { rngS = (rngS + 0x6d2b79f5) | 0; let t = Math.imul(rngS ^ (rngS >>> 15), 1 | rngS); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.42 }, { name: 'diag', weight: 0.72 }]); }
function matchPreset() { for (const k of KEYS) { const A = PRESETS[k].A; if (Math.abs(A[0][0] - st.A[0][0]) < 1e-6 && Math.abs(A[0][1] - st.A[0][1]) < 1e-6 && Math.abs(A[1][0] - st.A[1][0]) < 1e-6 && Math.abs(A[1][1] - st.A[1][1]) < 1e-6) return k; } return 'custom'; }
function syncVals() {
  sA.value = st.A[0][0]; vA.textContent = st.A[0][0].toFixed(2);
  sB.value = st.A[0][1]; vB.textContent = st.A[0][1].toFixed(2);
  sC.value = st.A[1][0]; vC.textContent = st.A[1][0].toFixed(2);
  sD.value = st.A[1][1]; vD.textContent = st.A[1][1].toFixed(2);
  selPre.value = matchPreset();
}
function seedMarker() { const a = rng() * 6.2832, r = 0.3 + rng() * (W * 1.15); return { p: [r * Math.cos(a), r * Math.sin(a)], age: rng() * 6 }; }
function reseed() { markers = []; for (let i = 0; i < 34; i += 1) markers.push(seedMarker()); flowT = 0; }
function pickPreset(k) { preKey = k; st.A = PRESETS[k].A.map((r) => [...r]); reseed(); syncVals(); }
function setEntry(i, j, val) { st.A[i][j] = val; reseed(); syncVals(); render(); }
sA.addEventListener('input', () => setEntry(0, 0, +sA.value));
sB.addEventListener('input', () => setEntry(0, 1, +sB.value));
sC.addEventListener('input', () => setEntry(1, 0, +sC.value));
sD.addEventListener('input', () => setEntry(1, 1, +sD.value));
selPre.addEventListener('change', () => { if (selPre.value !== 'custom') { pickPreset(selPre.value); render(); } });
btnReset.addEventListener('click', () => { st.x0 = [2.2, 1.4]; pickPreset('stableSpiral'); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.28)', field: 'rgba(120,150,200,0.25)', stream: 'rgba(120,150,200,0.32)', marker: '#4ea8ff', eig: '#ff9d3c', ic: '#8de08a', stable: 'rgba(141,224,138,0.09)', unstable: 'rgba(255,93,93,0.09)', lam: '#ffd166' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SC = null;
function rk4(x, dt) { const f = (v) => apply(st.A, v); const k1 = f(x), k2 = f([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]]), k3 = f([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]]), k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]]); return [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; }
function streamline(seed, w2s) { const pts = []; for (const dir of [1, -1]) { let x = [...seed]; const seg = []; for (let i = 0; i < 320; i += 1) { seg.push(x); const sp = Math.hypot(...apply(st.A, x)) || 1e-6; x = rk4(x, dir * 0.02 / Math.min(2, Math.max(0.3, sp)) * 1.4); if (Math.hypot(x[0], x[1]) > W * 1.5 || Math.hypot(x[0], x[1]) < 0.01) break; } if (dir === 1) pts.push(...seg.reverse()); else pts.push(...seg); } return pts; }

function drawScene(col, r) {
  panel(col, r, `Phase portrait of x' = A x: trajectories are exp(A t) x0 (drag the green point)`);
  const side = Math.min(r.w - 28, r.h - 28 - 30); const cx = r.x + r.w / 2, cy = r.y + 28 + (r.h - 28 - 30) / 2; const s = side / (2 * W);
  const w2s = (p) => [cx + p[0] * s, cy - p[1] * s]; const s2w = (sx, sy) => [(sx - cx) / s, (cy - sy) / s];
  SC = { cx, cy, s, side, w2s, s2w };
  ctx.save(); clipTo(ctx, { x: cx - side / 2, y: cy - side / 2, w: side, h: side });
  // axes.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; let a = w2s([-W, 0]), b = w2s([W, 0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = w2s([0, -W]); b = w2s([0, W]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  // vector field arrows.
  ctx.strokeStyle = col.field; ctx.fillStyle = col.field; ctx.lineWidth = 1;
  for (let gx = -W + 0.5; gx <= W; gx += 0.75) for (let gy = -W + 0.5; gy <= W; gy += 0.75) { const v = apply(st.A, [gx, gy]); const n = Math.hypot(v[0], v[1]) || 1; const L = 0.26; const p0 = w2s([gx, gy]), p1 = w2s([gx + v[0] / n * L, gy + v[1] / n * L]); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); ctx.beginPath(); ctx.arc(p1[0], p1[1], 1.3, 0, 6.28); ctx.fill(); }
  // the unit circle carried by exp(A t): the matrix exponential deforming space.
  ctx.strokeStyle = 'rgba(180,135,255,0.28)'; ctx.lineWidth = 1; ctx.beginPath();
  CIRC0.forEach((c, i) => { const sp = w2s(c); i ? ctx.lineTo(sp[0], sp[1]) : ctx.moveTo(sp[0], sp[1]); }); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = '#c08bff'; ctx.lineWidth = 2.4; ctx.beginPath();
  CIRC0.forEach((c, i) => { const p = flow(st.A, c, flowT); const sp = w2s(p); i ? ctx.lineTo(sp[0], sp[1]) : ctx.moveTo(sp[0], sp[1]); }); ctx.closePath(); ctx.stroke();
  // eigenvector lines (real case).
  const evs = eigvecs(st.A);
  if (evs) for (const { l, v } of evs) { ctx.strokeStyle = col.eig; ctx.lineWidth = 1.8; ctx.setLineDash([7, 5]); const aa = w2s([-W * v[0], -W * v[1]]), bb = w2s([W * v[0], W * v[1]]); ctx.beginPath(); ctx.moveTo(aa[0], aa[1]); ctx.lineTo(bb[0], bb[1]); ctx.stroke(); ctx.setLineDash([]); }
  // flowing markers.
  for (const m of markers) { const sp = w2s(m.p); const v = Math.hypot(...apply(st.A, m.p)); const al = Math.min(1, 0.4 + v / 4); ctx.fillStyle = `rgba(78,168,255,${al.toFixed(2)})`; ctx.beginPath(); ctx.arc(sp[0], sp[1], 2.4, 0, 6.28); ctx.fill(); }
  // draggable IC trajectory + animated marker.
  const tr = streamline(st.x0, w2s); ctx.strokeStyle = col.ic; ctx.lineWidth = 2.2; ctx.beginPath(); tr.forEach((p, i) => { const sp = w2s(p); i ? ctx.lineTo(sp[0], sp[1]) : ctx.moveTo(sp[0], sp[1]); }); ctx.stroke();
  const xt = flow(st.A, st.x0, icT); const sp0 = w2s(st.x0), spt = w2s(xt);
  ctx.fillStyle = col.ic; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(sp0[0], sp0[1], 5, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(spt[0], spt[1], 4, 0, 6.28); ctx.fill();
  // fixed point.
  const o = w2s([0, 0]); ctx.fillStyle = col.fg; ctx.beginPath(); ctx.arc(o[0], o[1], 3, 0, 6.28); ctx.fill();
  ctx.restore();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = col.muted; ctx.fillText('violet ring: the unit circle carried by exp(A t)', r.x + r.w / 2, r.y + r.h - 9);
}

function drawDiag(col, r) {
  panel(col, r, 'Eigenvalues of A in the complex plane: their position classifies the flow');
  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 34 }; const L = 3;
  const xOf = (re) => inner.x + (re + L) / (2 * L) * inner.w; const yOf = (im) => inner.y + inner.h * (L - im) / (2 * L);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // stable (Re<0) / unstable (Re>0) half-planes.
  ctx.fillStyle = col.stable; ctx.fillRect(inner.x, inner.y, xOf(0) - inner.x, inner.h);
  ctx.fillStyle = col.unstable; ctx.fillRect(xOf(0), inner.y, inner.x + inner.w - xOf(0), inner.h);
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke();
  // eigenvalues.
  const e = eigen(st.A); const pts = e.real ? [[e.l1, 0], [e.l2, 0]] : [[e.alpha, e.beta], [e.alpha, -e.beta]];
  for (const p of pts) { ctx.fillStyle = col.lam; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(xOf(Math.max(-L, Math.min(L, p[0]))), yOf(Math.max(-L, Math.min(L, p[1]))), 6, 0, 6.28); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('Re', inner.x + inner.w - 14, yOf(0) + 4); ctx.textAlign = 'left'; ctx.fillText('Im', xOf(0) + 4, inner.y + 2);
  ctx.fillStyle = 'rgba(141,224,138,0.8)'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('stable (Re < 0)', inner.x + 6, inner.y + inner.h - 16);
  ctx.fillStyle = 'rgba(255,93,93,0.8)'; ctx.textAlign = 'right'; ctx.fillText('unstable (Re > 0)', inner.x + inner.w - 6, inner.y + inner.h - 16);
  const eg = eigen(st.A); const lamtxt = eg.real ? `lambda = ${eg.l1.toFixed(2)}, ${eg.l2.toFixed(2)}` : `lambda = ${eg.alpha.toFixed(2)} +/- ${eg.beta.toFixed(2)} i`;
  ctx.fillStyle = col.lam; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`${classify(st.A)}:  ${lamtxt}`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.fillText(`tr A = ${trace(st.A).toFixed(2)},  det A = ${det(st.A).toFixed(2)}`, inner.x + 6, inner.y + 18);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

const running = true; let last = 0;
function advance(dt) {
  for (const m of markers) { const sp = Math.hypot(...apply(st.A, m.p)) || 1e-6; m.p = rk4(m.p, dt * 1.1); m.age += dt; const rr = Math.hypot(m.p[0], m.p[1]); if (rr > W * 1.4 || rr < 0.02 || m.age > 14) Object.assign(m, seedMarker()); }
  icT += dt; const xt = flow(st.A, st.x0, icT); const rr = Math.hypot(xt[0], xt[1]); if (rr > W * 1.5 || rr < 0.02 || icT > 18) icT = 0;
  // advance the deforming circle; reset when it grows past the box or collapses.
  flowT += dt; let mx = 0, mn = 1e9; for (const c of CIRC0) { const p = flow(st.A, c, flowT); const rc = Math.hypot(p[0], p[1]); if (rc > mx) mx = rc; if (rc < mn) mn = rc; }
  if (mx > W * 1.3 || mn < 0.06 || flowT > 9) flowT = 0;
}
function tick(ts) { if (!last) last = ts; let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (running) advance(dt); render(); requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { if (!SC) return; const [sx, sy] = ptr(e); if (Math.abs(sx - SC.cx) < SC.side / 2 && Math.abs(sy - SC.cy) < SC.side / 2) { drag = true; st.x0 = SC.s2w(sx, sy); icT = 0; render(); } });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [sx, sy] = ptr(e); st.x0 = SC.s2w(sx, sy); icT = 0; render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('preset') && PRESETS[params.get('preset')]) preKey = params.get('preset');
  st.A = PRESETS[preKey].A.map((r) => [...r]); reseed(); syncVals(); relayout();
  if (DETERMINISTIC) { for (const m of markers) m.age = 0; for (let i = 0; i < 80; i += 1) advance(0.03); icT = 1.6; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else { render(); requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const e = eigen(st.A);
  return { fields: [
    { key: 'type', label: 'fixed point', value: classify(st.A), format: 'text' },
    { key: 'tr', label: 'trace A', value: trace(st.A), format: 'float' },
    { key: 'det', label: 'det A', value: det(st.A), format: 'float' },
    { key: 'lam', label: 'eigenvalues', value: e.real ? `${e.l1.toFixed(2)}, ${e.l2.toFixed(2)}` : `${e.alpha.toFixed(2)}+/-${e.beta.toFixed(2)}i`, format: 'text' },
    { key: 'x0', label: 'initial x0', value: `(${st.x0[0].toFixed(2)}, ${st.x0[1].toFixed(2)})`, format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const A = st.A; const M0 = expAt(A, 0); const idErr = Math.abs(M0[0][0] - 1) + Math.abs(M0[0][1]) + Math.abs(M0[1][0]) + Math.abs(M0[1][1] - 1);
  const t = 0.7, h = 1e-5; const num = [(flow(A, st.x0, t + h)[0] - flow(A, st.x0, t - h)[0]) / (2 * h), (flow(A, st.x0, t + h)[1] - flow(A, st.x0, t - h)[1]) / (2 * h)]; const Ax = apply(A, flow(A, st.x0, t));
  const flowErr = Math.hypot(num[0] - Ax[0], num[1] - Ax[1]);
  return [
    { key: 'id', label: 'exp(A 0) = I', value: idErr.toExponential(1), status: idErr < 1e-9 ? 'pass' : 'drift' },
    { key: 'flow', label: "flow solves x' = A x", value: flowErr.toExponential(1), status: flowErr < 1e-4 ? 'pass' : 'drift' },
  ];
};
