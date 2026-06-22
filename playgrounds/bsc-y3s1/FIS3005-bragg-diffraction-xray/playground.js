// X-ray Bragg diffraction. The scene draws the crystal planes and the two reflected
// rays whose path difference 2 d sin(theta) is highlighted, brightening when the Bragg
// condition is met. The diagnostic plots the reflected intensity against angle, the
// sharp Bragg peaks. Sweep or drag the angle. Canvas2D only.
//
// Reference: Ashcroft and Mermin, Solid State Physics, Ch. 6.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { pathDifference, orderValue, braggAngle, maxOrder, braggPeaks, intensity } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sD = document.getElementById('s-d'), vD = document.getElementById('v-d');
const sL = document.getElementById('s-l'), vL = document.getElementById('v-l');
const btnSweep = document.getElementById('btn-sweep'), btnReset = document.getElementById('btn-reset');

const NPLANES = 30;   // planes used for the interference intensity
const st = { d: 2.5, lambda: 1.54, theta: 38 * Math.PI / 180, sweep: true };
let frame = 0, running = true;
const THLO = 6 * Math.PI / 180, THHI = 84 * Math.PI / 180;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.2 }, { name: 'diag', weight: 0.9 }]); }
function syncVals() { sD.value = st.d; vD.textContent = `${st.d.toFixed(2)} A`; sL.value = st.lambda; vL.textContent = `${st.lambda.toFixed(2)} A`; }
function setSweep(on) { st.sweep = on; btnSweep.textContent = `Sweep angle: ${on ? 'on' : 'off'}`; btnSweep.setAttribute('aria-pressed', String(on)); }
btnReset.addEventListener('click', () => { st.d = 2.5; st.lambda = 1.54; st.theta = 38 * Math.PI / 180; setSweep(false); syncVals(); render(); });
btnSweep.addEventListener('click', () => { setSweep(!st.sweep); if (st.sweep && !running) { running = true; requestAnimationFrame(tick); } });
sD.addEventListener('input', () => { st.d = +sD.value; syncVals(); if (!running) render(); });
sL.addEventListener('input', () => { st.lambda = +sL.value; syncVals(); if (!running) render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    plane: 'rgba(255,255,255,0.16)', atom: '#7f8794', beam: '#5ec8ff', path: '#ffd24a', wf: 'rgba(141,224,138,0.6)', intens: '#8de08a', peak: '#ff9d3c', cursor: '#ffd24a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function drawScene(col, r) {
  const th = st.theta, I = intensity(th, st.d, st.lambda, NPLANES), ov = orderValue(th, st.d, st.lambda);
  const nearN = Math.round(ov), constructive = Math.abs(ov - nearN) < 0.04 && nearN >= 1;
  panel(col, r, `Bragg diffraction:  d = ${st.d.toFixed(2)} A,  lambda = ${st.lambda.toFixed(2)} A,  glancing angle theta = ${(th * 180 / Math.PI).toFixed(1)} deg`);
  const inner = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 10 };
  const dpix = Math.max(26, Math.min(58, st.d * 17));
  const Ax = inner.x + inner.w * 0.42, Ay = inner.y + inner.h * 0.52;   // incidence point on top plane
  const di = [Math.cos(th), Math.sin(th)], dr = [Math.cos(th), -Math.sin(th)];
  const L = Math.min(inner.w * 0.4, (Ay - inner.y) / Math.max(0.18, Math.sin(th)) - 6);
  const A = [Ax, Ay], B = [Ax, Ay + dpix];
  // crystal planes with atoms.
  for (let p = 0; p < 5; p += 1) { const y = Ay + p * dpix; ctx.strokeStyle = col.plane; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x + 10, y); ctx.lineTo(inner.x + inner.w - 10, y); ctx.stroke(); ctx.fillStyle = col.atom; for (let x = inner.x + 18; x < inner.x + inner.w - 10; x += dpix) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.2832); ctx.fill(); } }
  ctx.save(); clipTo(ctx, inner);
  // incident and reflected rays (two parallel rays, hitting planes 1 and 2).
  const beamCol = `rgba(94,200,255,${(0.35 + 0.6 * I).toFixed(3)})`;
  const ray = (S, dir, color, w) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(S[0], S[1]); ctx.lineTo(S[0] + dir[0] * L, S[1] + dir[1] * L); ctx.stroke(); };
  // incident (coming in: draw from far point to the hit point), reflected (out).
  ray([A[0] - di[0] * L, A[1] - di[1] * L], di, col.beam, 2.2);
  ray([B[0] - di[0] * L, B[1] - di[1] * L], di, col.beam, 2.2);
  ray(A, dr, beamCol, 3);
  ray(B, dr, beamCol, 3);
  // path-difference segments PB (incident) and BQ (reflected).
  const sinth = Math.sin(th);
  const P = [B[0] - dpix * sinth * di[0], B[1] - dpix * sinth * di[1]];
  const Q = [B[0] + dpix * sinth * dr[0], B[1] + dpix * sinth * dr[1]];
  ctx.strokeStyle = col.path; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke();
  // wavefront perpendiculars from A to P and A to Q.
  ctx.strokeStyle = col.wf; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(P[0], P[1]); ctx.moveTo(A[0], A[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke(); ctx.setLineDash([]);
  // incidence points.
  ctx.fillStyle = col.beam; ctx.beginPath(); ctx.arc(A[0], A[1], 4, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.arc(B[0], B[1], 4, 0, 6.2832); ctx.fill();
  ctx.restore();
  // labels.
  ctx.fillStyle = col.beam; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('incident', A[0] - di[0] * L + 4, A[1] - di[1] * L); ctx.fillText('reflected', A[0] + dr[0] * L - 56, A[1] + dr[1] * L);
  ctx.fillStyle = col.path; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`path difference 2d sin(theta) = ${ov.toFixed(2)} lambda`, inner.x + 10, inner.y + 6);
  ctx.fillStyle = constructive ? col.intens : col.muted; ctx.fillText(constructive ? `in phase: constructive, order n = ${nearN}  (I = ${(I * 100).toFixed(0)}%)` : `off the Bragg condition: waves cancel  (I = ${(I * 100).toFixed(0)}%)`, inner.x + 10, inner.y + 22);
}

let SC = null;
function drawDiag(col, r) {
  panel(col, r, 'Reflected intensity vs glancing angle: sharp Bragg peaks at n lambda = 2d sin(theta)');
  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 34 };
  const xOf = (t) => inner.x + (t - THLO) / (THHI - THLO) * inner.w, yOf = (v) => inner.y + inner.h * (1 - v);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [0, 0.5, 1.0]) { const Y = yOf(v); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.muted; ctx.fillText(v.toFixed(1), inner.x - 5, Y); }
  const peaks = braggPeaks(st.d, st.lambda);
  ctx.save(); clipTo(ctx, inner);
  // peak order markers.
  for (const { n, theta } of peaks) { ctx.strokeStyle = 'rgba(255,157,60,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(xOf(theta), inner.y); ctx.lineTo(xOf(theta), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); }
  // intensity curve.
  ctx.strokeStyle = col.intens; ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i <= 800; i += 1) { const t = THLO + (THHI - THLO) * i / 800; const Y = yOf(intensity(t, st.d, st.lambda, NPLANES)); i ? ctx.lineTo(xOf(t), Y) : ctx.moveTo(xOf(t), Y); } ctx.stroke();
  // cursor.
  ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(st.theta), inner.y); ctx.lineTo(xOf(st.theta), inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.intens; ctx.beginPath(); ctx.arc(xOf(st.theta), yOf(intensity(st.theta, st.d, st.lambda, NPLANES)), 4.5, 0, 6.2832); ctx.fill();
  ctx.restore();
  // order labels.
  ctx.fillStyle = col.peak; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (const { n, theta } of peaks) ctx.fillText(`n=${n}`, xOf(theta), inner.y + 6);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let dgr = 10; dgr <= 80; dgr += 10) { const t = dgr * Math.PI / 180; if (t < THLO || t > THHI) continue; ctx.fillText(`${dgr}`, xOf(t), inner.y + inner.h + 6); }
  ctx.fillText('glancing angle theta (degrees), drag or sweep', inner.x + inner.w / 2, inner.y + inner.h + 19);
  SC = { inner };
}

function render() { if (!REG) relayout(); const col = colors(); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h); drawScene(col, REG.scene); drawDiag(col, REG.diag); }
function tick() { frame += 1; if (st.sweep) st.theta = THLO + (THHI - THLO) * (0.5 + 0.46 * Math.sin(frame * 0.01)); render(); if (running) requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setTheta(px) { if (!SC) return; const t = THLO + (px - SC.inner.x) / SC.inner.w * (THHI - THLO); st.theta = Math.max(THLO, Math.min(THHI, t)); }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || py < REG.diag.y) return; setSweep(false); drag = true; setTheta(px); if (!running) render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [px] = ptr(e); setTheta(px); if (!running) render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('d')) st.d = Math.max(1, Math.min(4, +params.get('d')));
  if (params.get('lambda')) st.lambda = Math.max(0.5, Math.min(3, +params.get('lambda')));
  if (params.get('theta')) st.theta = Math.max(THLO, Math.min(THHI, +params.get('theta') * Math.PI / 180));
  setSweep(!DETERMINISTIC && st.sweep); syncVals(); relayout();
  if (DETERMINISTIC) { running = false; st.sweep = false; setSweep(false); const t2 = braggAngle(2, st.d, st.lambda); st.theta = t2 || 38 * Math.PI / 180; render(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
  else requestAnimationFrame(tick);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'd', label: 'plane spacing d (A)', value: st.d, format: 'float' },
    { key: 'lambda', label: 'wavelength lambda (A)', value: st.lambda, format: 'float' },
    { key: 'theta', label: 'glancing angle (deg)', value: st.theta * 180 / Math.PI, format: 'float' },
    { key: 'path', label: 'path difference (A)', value: pathDifference(st.theta, st.d), format: 'float' },
    { key: 'order', label: '2d sin/lambda (order)', value: orderValue(st.theta, st.d, st.lambda), format: 'float' },
    { key: 'I', label: 'reflected intensity', value: intensity(st.theta, st.d, st.lambda, NPLANES), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const peaks = braggPeaks(st.d, st.lambda);
  const t1 = peaks.length ? peaks[0].theta : 0;
  const cond = peaks.length ? Math.abs(pathDifference(t1, st.d) - 1 * st.lambda) : 0;
  return [
    { key: 'bragg', label: 'first peak: 2d sin(theta) = lambda', value: cond.toExponential(1), status: cond < 1e-9 ? 'pass' : 'drift' },
    { key: 'orders', label: 'visible orders floor(2d/lambda)', value: `${maxOrder(st.d, st.lambda)}`, status: 'pass' },
  ];
};
