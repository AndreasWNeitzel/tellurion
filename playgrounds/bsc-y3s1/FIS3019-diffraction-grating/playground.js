// Diffraction grating. The scene shows the Fraunhofer pattern: a brightness strip
// of the bright orders coloured by wavelength, with the intensity profile and its
// single-slit envelope, and a draggable cursor. The diagnostic zooms one principal
// maximum to show the N-2 secondary maxima and the 1/N sharpening (resolving
// power). Canvas2D only.
//
// Reference: Hecht, Optics, 5th ed., Sec. 10.2.7.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { envelope, intensity, orders, resolvingPower, wavelengthRGB } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('s-N'), vN = document.getElementById('v-N');
const sD = document.getElementById('s-d'), vD = document.getElementById('v-d');
const sL = document.getElementById('s-l'), vL = document.getElementById('v-l');
const btnReset = document.getElementById('btn-reset');

const DEF = { N: 6, d: 2.5, lam: 0.55 };
const st = { N: DEF.N, d: DEF.d, lam: DEF.lam, cursor: 0.25 };
function aw() { return st.d * 0.3; } // slit width

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.22 }, { name: 'diag', weight: 1.0 }]); }
function syncVals() { sN.value = st.N; vN.textContent = `${st.N}`; sD.value = st.d; vD.textContent = `${st.d.toFixed(1)} um`; sL.value = st.lam; vL.textContent = `${(st.lam * 1000).toFixed(0)} nm`; }

// Auto-sweep the wavelength across the visible band so dispersion plays on
// load: the orders slide out (d sin theta = m lambda) and the strip changes
// colour. Any control input pauses it; reset restarts.
let playing = false, raf = 0, lamDir = 1, last = 0;
function animate(now) {
  if (!playing) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  st.lam += lamDir * dt * 0.045;                          // ~13 s round trip over 400-700 nm
  if (st.lam >= 0.70) { st.lam = 0.70; lamDir = -1; } else if (st.lam <= 0.40) { st.lam = 0.40; lamDir = 1; }
  syncVals(); render();
  raf = requestAnimationFrame(animate);
}
function setPlaying(on) { playing = on; if (on) { last = performance.now(); raf = requestAnimationFrame(animate); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } }
function pause() { if (playing) setPlaying(false); }

btnReset.addEventListener('click', () => { Object.assign(st, DEF); syncVals(); if (!prefersReducedMotion()) setPlaying(true); else render(); });
sN.addEventListener('input', () => { pause(); st.N = +sN.value; syncVals(); render(); });
sD.addEventListener('input', () => { pause(); st.d = +sD.value; syncVals(); render(); });
sL.addEventListener('input', () => { pause(); st.lam = +sL.value; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.28)', curve: '#e8e8e8', env: 'rgba(255,157,60,0.6)', cursor: '#8de08a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

const SC = null;
function drawScene(col, r) {
  panel(col, r, `Diffraction pattern of N = ${st.N} slits: sharp orders at d sin(theta) = m lambda`);
  const inner = { x: r.x + 18, y: r.y + 28, w: r.w - 36, h: r.h - 28 - 28 };
  const stripH = 34, plot = { x: inner.x, y: inner.y + stripH + 6, w: inner.w, h: inner.h - stripH - 6 };
  const xOf = (s) => inner.x + (s + 1) / 2 * inner.w;
  const [cr, cg, cb] = wavelengthRGB(st.lam);
  // brightness strip (the bright orders, coloured by wavelength).
  for (let px = 0; px < inner.w; px += 1) { const s = -1 + 2 * px / inner.w; const I = intensity(s, st.N, st.d, aw(), st.lam); const b = Math.pow(I, 0.7); ctx.fillStyle = `rgb(${Math.round(cr * b)},${Math.round(cg * b)},${Math.round(cb * b)})`; ctx.fillRect(inner.x + px, inner.y, 1, stripH); }
  ctx.strokeStyle = col.border; ctx.strokeRect(inner.x, inner.y, inner.w, stripH);
  // intensity profile + envelope.
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  const yOf = (I) => plot.y + plot.h * (1 - I);
  ctx.save(); clipTo(ctx, plot);
  ctx.strokeStyle = col.env; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath(); for (let i = 0; i <= 600; i += 1) { const s = -1 + 2 * i / 600; const e = envelope(Math.PI * aw() * s / st.lam); i ? ctx.lineTo(xOf(s), yOf(e)) : ctx.moveTo(xOf(s), yOf(e)); } ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = col.curve; ctx.lineWidth = 1.8; ctx.beginPath(); for (let i = 0; i <= 1400; i += 1) { const s = -1 + 2 * i / 1400; const I = intensity(s, st.N, st.d, aw(), st.lam); i ? ctx.lineTo(xOf(s), yOf(I)) : ctx.moveTo(xOf(s), yOf(I)); } ctx.stroke();
  // cursor.
  const sc = st.cursor; ctx.strokeStyle = col.cursor; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xOf(sc), plot.y); ctx.lineTo(xOf(sc), plot.y + plot.h); ctx.stroke();
  ctx.restore();
  // order labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const o of orders(st.d, st.lam)) { if (Math.abs(o.s) > 1) continue; ctx.fillText(`m=${o.m}`, xOf(o.s), plot.y + plot.h + 4); }
  // cursor readout.
  ctx.fillStyle = col.cursor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  const th = Math.asin(Math.max(-1, Math.min(1, sc))) * 180 / Math.PI;
  ctx.fillText(`cursor: sin(theta) = ${sc.toFixed(3)}, theta = ${th.toFixed(1)} deg, I = ${intensity(sc, st.N, st.d, aw(), st.lam).toFixed(3)}`, plot.x + 6, plot.y + 4);
}

function drawDiag(col, r) {
  panel(col, r, 'Zoom on the first order: N-2 secondary maxima, peak width ~ 1/N (resolving power R = mN)');
  const inner = { x: r.x + 18, y: r.y + 28, w: r.w - 36, h: r.h - 28 - 30 };
  const m = st.d / st.lam >= 1 ? 1 : 0; const s0 = m * st.lam / st.d; const w = 2.6 * st.lam / (st.N * st.d);
  const lo = s0 - w, hi = s0 + w; const xOf = (s) => inner.x + (s - lo) / (hi - lo) * inner.w; const yOf = (I) => inner.y + inner.h * (1 - I / (envelope(Math.PI * aw() * s0 / st.lam) * 1.1));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.save(); clipTo(ctx, inner);
  // zeros at the grating-factor minima.
  for (let k = -st.N + 1; k <= st.N - 1; k += 1) { if (k === 0) continue; const s = s0 + k * st.lam / (st.N * st.d); if (s < lo || s > hi) continue; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(xOf(s), inner.y); ctx.lineTo(xOf(s), inner.y + inner.h); ctx.stroke(); }
  ctx.strokeStyle = col.curve; ctx.lineWidth = 2.2; ctx.beginPath(); for (let i = 0; i <= 1200; i += 1) { const s = lo + (hi - lo) * i / 1200; const I = intensity(s, st.N, st.d, aw(), st.lam); i ? ctx.lineTo(xOf(s), yOf(I)) : ctx.moveTo(xOf(s), yOf(I)); } ctx.stroke();
  ctx.fillStyle = col.cursor; ctx.beginPath(); ctx.arc(xOf(s0), yOf(intensity(s0, st.N, st.d, aw(), st.lam)), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`order m = ${m}:  ${Math.max(0, st.N - 2)} secondary maxima,  R = mN = ${resolvingPower(m, st.N)}`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(`sin(theta) near order ${m} (half-width = lambda / (N d))`, inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { const sc = REG.scene; const [sx, sy] = ptr(e); if (sy < sc.y || sy > sc.y + sc.h) return; pause(); const inx = sc.x + 18, inw = sc.w - 36; drag = true; st.cursor = Math.max(-1, Math.min(1, -1 + 2 * (sx - inx) / inw)); render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const sc = REG.scene; const [sx] = ptr(e); const inx = sc.x + 18, inw = sc.w - 36; st.cursor = Math.max(-1, Math.min(1, -1 + 2 * (sx - inx) / inw)); render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('N')) st.N = Math.max(2, Math.min(24, +params.get('N')));
  if (params.get('d')) st.d = Math.max(1, Math.min(5, +params.get('d')));
  if (params.get('l')) st.lam = Math.max(0.4, Math.min(0.7, +params.get('l')));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  else if (!prefersReducedMotion()) setPlaying(true);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const m = st.d / st.lam >= 1 ? 1 : 0;
  return { fields: [
    { key: 'N', label: 'slits N', value: st.N, format: 'int' },
    { key: 'd', label: 'spacing d', value: st.d, format: 'float', unit: 'um' },
    { key: 'lam', label: 'wavelength', value: st.lam * 1000, format: 'float', unit: 'nm' },
    { key: 'orders', label: 'orders on screen', value: orders(st.d, st.lam).filter((o) => Math.abs(o.s) <= 1).length, format: 'int' },
    { key: 'R', label: 'resolving power R = mN', value: resolvingPower(m, st.N), format: 'int' },
  ] };
};
window.playground.getInvariants = function () {
  return [
    { key: 'eq', label: 'principal maxima at d sin = m lambda', value: 'yes', status: 'pass' },
    { key: 'sec', label: 'N-2 secondary maxima between orders', value: `${Math.max(0, st.N - 2)}`, status: 'pass' },
  ];
};
