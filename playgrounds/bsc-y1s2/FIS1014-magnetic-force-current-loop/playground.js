// Torque on a current loop in a uniform field, the electric-motor principle. A
// real loop rotates about a vertical axis under tau = m x B; the two
// axis-parallel sides carry the force couple F = I L x B (zero net force, pure
// torque). Free mode is a magnetic pendulum settling to m aligned with B; motor
// mode adds a commutator that reverses the current each half turn so the loop
// spins continuously. The diagnostic plots torque versus orientation and the
// time series. Canvas2D only.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 6.1.3.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { createState, step, torqueFree, torqueMotor, terminalOmegaMotor } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sI = document.getElementById('slider-I'), vI = document.getElementById('value-I');
const sG = document.getElementById('slider-G'), vG = document.getElementById('value-G');
const btnMode = document.getElementById('btn-mode'), vMode = document.getElementById('value-mode');
const btnReset = document.getElementById('btn-reset'), btnPlay = document.getElementById('btn-playpause');

const W = 1.0, H = 1.25;                  // loop width, height; area A = W*H
const p = { N: 1, I: 1.4, A: W * H, B: 1.1, Im: 0.16, gamma: 0.25, mode: 'free' };
let s = createState(0.8, 0);
let running = !DETERMINISTIC;
let hist = [];
let acc = 0;

function relaunchSim() { s = createState(p.mode === 'motor' ? 0.25 : 0.9, 0); hist = []; acc = 0; }

let view = { w: 820, h: 1020, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.32 }, { name: 'tq', weight: 0.62 }, { name: 'ts', weight: 0.56 }]);
}

function syncVals() { vB.textContent = p.B.toFixed(1); vI.textContent = p.I.toFixed(1); vG.textContent = p.gamma.toFixed(2); vMode.textContent = p.mode === 'motor' ? 'motor (commutator)' : 'free (pendulum)'; }
sB.addEventListener('input', () => { p.B = parseFloat(sB.value); syncVals(); });
sI.addEventListener('input', () => { p.I = parseFloat(sI.value); syncVals(); });
sG.addEventListener('input', () => { p.gamma = parseFloat(sG.value); syncVals(); });
btnMode.addEventListener('click', () => { p.mode = p.mode === 'motor' ? 'free' : 'motor'; relaunchSim(); syncVals(); });
btnReset.addEventListener('click', () => { p.B = 1.1; p.I = 1.4; p.gamma = 0.25; p.mode = 'free'; sB.value = '1.1'; sI.value = '1.4'; sG.value = '0.25'; running = true; btnPlay.textContent = 'Pause'; relaunchSim(); syncVals(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.10)', field: '#5b9bd5', loop: '#e8b341', cur: '#67d98c', force: '#ef5466', mom: '#c8a6ff', tq: '#67d98c', ts: '#ff9d6f' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}
function arrow(x0, y0, x1, y1, head) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - head * Math.cos(a - 0.42), y1 - head * Math.sin(a - 0.42)); ctx.lineTo(x1 - head * Math.cos(a + 0.42), y1 - head * Math.sin(a + 0.42)); ctx.closePath(); ctx.fill();
}

function drawScene(col, r) {
  panel(col, r, p.mode === 'motor' ? 'Current loop driven by a commutator: a continuous DC motor' : 'Current loop in a uniform field: torque tau = m x B rotates it toward B');
  const cx = r.x + r.w * 0.46, cy = r.y + r.h * 0.55;
  const sc = Math.min(r.w, r.h) * 0.30;
  const th = s.theta;
  const proj = (P) => [cx + sc * (P[0] - 0.5 * P[2]), cy + sc * (-P[1] - 0.32 * P[2])];
  ctx.save(); clipTo(ctx, { x: r.x, y: r.y + 20, w: r.w, h: r.h - 20 });

  // uniform B field: rows of horizontal arrows (along +x), faint, depth-shaded.
  ctx.strokeStyle = col.field; ctx.fillStyle = col.field; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.5;
  for (let zi = -1; zi <= 1; zi += 1) for (let yi = -1; yi <= 1; yi += 1) {
    const a = proj([-1.5, yi * 0.9, zi * 0.9]), b = proj([1.5, yi * 0.9, zi * 0.9]);
    arrow(a[0], a[1], b[0], b[1], 5);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = col.field; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('B', proj([1.5, 0.9, -0.9])[0] + 6, proj([1.5, 0.9, -0.9])[1]);

  // rotation axis (vertical, dashed).
  ctx.strokeStyle = col.grid; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; const ax0 = proj([0, -1.3, 0]), ax1 = proj([0, 1.3, 0]); ctx.beginPath(); ctx.moveTo(ax0[0], ax0[1]); ctx.lineTo(ax1[0], ax1[1]); ctx.stroke(); ctx.setLineDash([]);

  // loop geometry: normal m at angle th from B (x) in the horizontal plane.
  const d = [-Math.sin(th), 0, Math.cos(th)];          // in-plane horizontal direction
  const corner = (su, sh) => [su * W / 2 * d[0], sh * H / 2, su * W / 2 * d[2]];
  const C = [corner(1, 1), corner(1, -1), corner(-1, -1), corner(-1, 1)].map(proj);
  // loop face.
  ctx.fillStyle = 'rgba(232,179,65,0.13)'; ctx.beginPath(); ctx.moveTo(C[0][0], C[0][1]); for (let k = 1; k < 4; k += 1) ctx.lineTo(C[k][0], C[k][1]); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col.loop; ctx.lineWidth = 3; ctx.stroke();
  // current direction arrows along the edges.
  const cflip = (p.mode === 'motor' && Math.sin(th) < 0) ? -1 : 1;
  ctx.strokeStyle = col.cur; ctx.fillStyle = col.cur; ctx.lineWidth = 2;
  for (let k = 0; k < 4; k += 1) {
    const a = C[k], b = C[(k + 1) % 4];
    const mx = a[0] + (b[0] - a[0]) * (cflip > 0 ? 0.62 : 0.38), my = a[1] + (b[1] - a[1]) * (cflip > 0 ? 0.62 : 0.38);
    const ex = a[0] + (b[0] - a[0]) * (cflip > 0 ? 0.72 : 0.28), ey = a[1] + (b[1] - a[1]) * (cflip > 0 ? 0.72 : 0.28);
    arrow(mx, my, ex, ey, 5);
  }
  // force couple on the two vertical sides (F = I L x B, along +-z), |F| ~ I B.
  const fLen = 0.42 * p.I * p.B / (1.4 * 1.1);
  const sideMid = (su) => [su * W / 2 * d[0], 0, su * W / 2 * d[2]];
  ctx.strokeStyle = col.force; ctx.fillStyle = col.force; ctx.lineWidth = 3;
  for (const su of [1, -1]) {
    const base = sideMid(su); const fz = su * cflip * fLen;        // opposite on the two sides
    const a = proj(base), b = proj([base[0], base[1], base[2] + fz]);
    arrow(a[0], a[1], b[0], b[1], 7);
  }
  // magnetic moment vector m (normal to loop).
  const mvec = [Math.cos(th), 0, Math.sin(th)];
  const o = proj([0, 0, 0]), mt = proj([mvec[0] * 0.85, 0, mvec[2] * 0.85]);
  ctx.strokeStyle = col.mom; ctx.fillStyle = col.mom; ctx.lineWidth = 2.5; arrow(o[0], o[1], mt[0], mt[1], 7);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('m', mt[0] + 4, mt[1]);
  ctx.restore();

  // readout strip.
  const tq = p.mode === 'motor' ? torqueMotor(p.N, p.I, p.A, p.B, th) : torqueFree(p.N, p.I, p.A, p.B, th);
  const items = [[`theta ${(((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * 180 / Math.PI).toFixed(0)} deg`, col.loop], [`torque ${tq.toFixed(2)}`, col.tq], [`omega ${s.omega.toFixed(2)}`, col.ts], [`|m| ${(p.N * p.I * p.A).toFixed(2)}`, col.mom]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 9); });
}

function drawTorque(col, r) {
  panel(col, r, p.mode === 'motor' ? 'Torque vs orientation: N I A B |sin(theta)|, commutated to always drive' : 'Torque vs orientation: N I A B sin(theta), zero at aligned (stable)');
  const inner = { x: r.x + 46, y: r.y + 24, w: r.w - 46 - 14, h: r.h - 24 - 26 };
  const amp = p.N * p.I * p.A * p.B * 1.12;
  const xOf = (t) => inner.x + t / (2 * Math.PI) * inner.w;
  const yOf = (v) => inner.y + inner.h / 2 - v / amp * (inner.h / 2);
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.strokeStyle = col.border; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  // torque curve.
  ctx.strokeStyle = col.tq; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const t = 2 * Math.PI * i / 200; const v = p.mode === 'motor' ? torqueMotor(p.N, p.I, p.A, p.B, t) : torqueFree(p.N, p.I, p.A, p.B, t); const X = xOf(t), Y = yOf(v); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  // operating point.
  const thN = ((s.theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const vv = p.mode === 'motor' ? torqueMotor(p.N, p.I, p.A, p.B, thN) : torqueFree(p.N, p.I, p.A, p.B, thN);
  ctx.fillStyle = col.ts; ctx.beginPath(); ctx.arc(xOf(thN), yOf(vv), 4, 0, 6.28); ctx.fill();
  // stable / unstable markers (free mode).
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const [t, lab] of [[0, '0 (stable)'], [Math.PI, 'pi (unstable)'], [2 * Math.PI, '2pi']]) ctx.fillText(lab, xOf(t), inner.y + inner.h + 4);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('torque', 0, 0); ctx.restore();
}

function drawSeries(col, r) {
  const motor = p.mode === 'motor';
  panel(col, r, motor ? 'Angular speed omega(t) spinning up to terminal (load = gamma)' : 'Orientation theta(t) settling to alignment (damped magnetic pendulum)');
  const inner = { x: r.x + 46, y: r.y + 24, w: r.w - 46 - 14, h: r.h - 24 - 22 };
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  if (hist.length < 2) return;
  const tMax = hist[hist.length - 1].t, t0 = Math.max(0, tMax - 14);
  const vals = hist.filter((h) => h.t >= t0).map((h) => motor ? h.omega : h.theta);
  let vmin = Math.min(...vals), vmax = Math.max(...vals);
  if (motor) { vmin = 0; vmax = Math.max(vmax, terminalOmegaMotor(p) * 1.15, 0.1); } else { vmax = Math.max(Math.abs(vmin), Math.abs(vmax), 0.1); vmin = -vmax; }
  const xOf = (t) => inner.x + (t - t0) / Math.max(1e-6, tMax - t0) * inner.w;
  const yOf = (v) => inner.y + inner.h - (v - vmin) / (vmax - vmin) * inner.h;
  // zero / terminal reference.
  ctx.strokeStyle = col.grid; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  const refV = motor ? terminalOmegaMotor(p) : 0; ctx.beginPath(); ctx.moveTo(inner.x, yOf(refV)); ctx.lineTo(inner.x + inner.w, yOf(refV)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = col.ts; ctx.lineWidth = 2; ctx.beginPath();
  let first = true;
  for (const h of hist) { if (h.t < t0) continue; const X = xOf(h.t), Y = yOf(motor ? h.omega : h.theta); first ? (ctx.moveTo(X, Y), first = false) : ctx.lineTo(X, Y); }
  ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(motor ? `terminal omega = ${terminalOmegaMotor(p).toFixed(2)}` : 'aligned (theta=0)', inner.x + 6, inner.y + 4);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('time t', inner.x + inner.w / 2, inner.y + inner.h + 4);
}

function advance() {
  const dt = 1 / 120;
  acc += 1 / 60;
  let n = 0;
  while (acc >= dt && n < 8) { step(s, dt, p); acc -= dt; n += 1; }
  hist.push({ t: s.t, theta: s.theta, omega: s.omega }); if (hist.length > 1400) hist.shift();
}
function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawTorque(col, REG.tq); drawSeries(col, REG.ts);
}
function tick() { if (running) advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  syncVals(); relayout();
  if (CAPTURE_NAME) { p.mode = 'motor'; syncVals(); relaunchSim(); for (let i = 0; i < 137; i += 1) advance(); }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const th = ((s.theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const tq = p.mode === 'motor' ? torqueMotor(p.N, p.I, p.A, p.B, th) : torqueFree(p.N, p.I, p.A, p.B, th);
  return { fields: [
    { key: 'mode', label: 'mode', value: p.mode, format: 'text' },
    { key: 'B', label: 'field B', value: p.B, format: 'float' },
    { key: 'I', label: 'current I', value: p.I, format: 'float' },
    { key: 'theta', label: 'orientation (deg)', value: th * 180 / Math.PI, format: 'float' },
    { key: 'torque', label: 'torque', value: tq, format: 'float' },
    { key: 'omega', label: 'angular speed', value: s.omega, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const th = s.theta;
  const tqMax = p.N * p.I * p.A * p.B;
  const tq = Math.abs(torqueFree(p.N, p.I, p.A, p.B, th));
  const ratio = tq / (tqMax * Math.abs(Math.sin(th)) + 1e-9);
  return [
    { key: 'law', label: 'torque = N I A B sin(theta)', value: ratio.toFixed(3), status: Math.abs(ratio - 1) < 1e-3 || Math.abs(Math.sin(th)) < 1e-6 ? 'pass' : 'drift' },
  ];
};
