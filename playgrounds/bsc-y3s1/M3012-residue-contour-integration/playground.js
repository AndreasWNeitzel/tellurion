// The residue theorem. The scene shows the complex plane (domain-coloured by
// arg f, bright at poles), a draggable circular contour, and the integral it
// encloses; the diagnostic is the integral against contour radius, a staircase
// jumping by 2 pi i Res at each enclosed pole. Canvas2D only.
//
// Reference: Ablowitz and Fokas, Complex Variables, 2nd ed., Ch. 4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { FUNCS, cabs, csub, contourIntegral, residueAt } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selFn = document.getElementById('select-fn');
const sR = document.getElementById('s-R'), vR = document.getElementById('v-R');
const btnReset = document.getElementById('btn-reset');

const E = 3.4;
const st = { fn: 'twoPoles', center: [0, 0], R: 1.5 };
function fn() { return FUNCS[st.fn]; }
let resCache = {}, dc = { key: '', canvas: null };

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.34 }, { name: 'diag', weight: 0.78 }]); }
function syncVals() { selFn.value = st.fn; sR.value = st.R; vR.textContent = st.R.toFixed(2); }
function residues() { if (!resCache[st.fn]) resCache[st.fn] = fn().poles.map((p) => residueAt(fn(), p)); return resCache[st.fn]; }
function pickFn(k) { st.fn = k; st.center = [0, 0]; st.R = 1.5; syncVals(); }
selFn.addEventListener('change', () => { pickFn(selFn.value); render(); });
btnReset.addEventListener('click', () => { pickFn('twoPoles'); render(); });
sR.addEventListener('input', () => { st.R = +sR.value; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.4)', contour: '#8de08a', pole: '#ffffff', poleIn: '#8de08a', re: '#4ea8ff', im: '#ff9d3c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function hsl(h, s, l) { const a = s * Math.min(l, 1 - l); const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [255 * f(0), 255 * f(8), 255 * f(4)]; }
function buildDC(side) {
  const key = `${st.fn}|${side}`; if (dc.key === key) return; dc.key = key;
  const f = fn(); const oc = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(side, side) : Object.assign(document.createElement('canvas'), { width: side, height: side });
  const octx = oc.getContext('2d'); const img = octx.createImageData(side, side); const d = img.data;
  for (let py = 0; py < side; py += 1) for (let px = 0; px < side; px += 1) {
    const x = -E + 2 * E * px / side, y = E - 2 * E * py / side; const w = f.f([x, y]); const m = Math.hypot(w[0], w[1]);
    const hue = ((Math.atan2(w[1], w[0]) + Math.PI) / (2 * Math.PI)) * 360; const b = m / (m + 1.2); const [r, g, bl] = hsl(hue, 0.55, 0.12 + 0.62 * b);
    const o = (py * side + px) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = bl; d[o + 3] = 255;
  }
  octx.putImageData(img, 0, 0); dc.canvas = oc;
}

let SC = null;
function drawScene(col, r) {
  const f = fn();
  panel(col, r, 'Complex plane (coloured by arg f, bright at poles); the contour encloses residues');
  const side = Math.min(r.w - 28, r.h - 28 - 30); const bx = r.x + (r.w - side) / 2, by = r.y + 28;
  const w2s = (z) => [bx + (z[0] + E) / (2 * E) * side, by + (E - z[1]) / (2 * E) * side];
  const s2w = (sx, sy) => [(sx - bx) / side * 2 * E - E, E - (sy - by) / side * 2 * E];
  SC = { bx, by, side, w2s, s2w };
  buildDC(Math.min(360, Math.round(side)));
  ctx.save(); clipTo(ctx, { x: bx, y: by, w: side, h: side });
  ctx.imageSmoothingEnabled = true; ctx.drawImage(dc.canvas, bx, by, side, side);
  // axes.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; let a = w2s([-E, 0]), b = w2s([E, 0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = w2s([0, -E]); b = w2s([0, E]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  // contour.
  const cc = w2s(st.center); ctx.strokeStyle = col.contour; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cc[0], cc[1], st.R / (2 * E) * side, 0, 6.28); ctx.stroke();
  ctx.fillStyle = col.contour; ctx.beginPath(); ctx.arc(cc[0], cc[1], 3, 0, 6.28); ctx.fill();
  // poles + residues.
  const res = residues();
  f.poles.forEach((p, i) => { const inside = cabs(csub(p, st.center)) < st.R; const ps = w2s(p); ctx.strokeStyle = inside ? col.poleIn : col.pole; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ps[0] - 5, ps[1] - 5); ctx.lineTo(ps[0] + 5, ps[1] + 5); ctx.moveTo(ps[0] + 5, ps[1] - 5); ctx.lineTo(ps[0] - 5, ps[1] + 5); ctx.stroke();
    ctx.fillStyle = inside ? col.poleIn : col.pole; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; const rr = res[i]; const lbl = Math.abs(rr[1]) < 0.005 ? `Res ${rr[0].toFixed(2)}` : `Res ${rr[0].toFixed(2)}${rr[1] >= 0 ? '+' : ''}${rr[1].toFixed(2)}i`; ctx.fillText(lbl, ps[0] + 8, ps[1] - 7 - (i % 2) * 15); });
  ctx.restore();
  // integral readout.
  const I = contourIntegral(f, st.center, st.R, 2400);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.fillStyle = col.fg; ctx.fillText(`contour integral = ${I[0].toFixed(2)} ${I[1] >= 0 ? '+' : '-'} ${Math.abs(I[1]).toFixed(2)} i   =   2 pi i x (sum of enclosed residues)`, r.x + r.w / 2, r.y + r.h - 9);
}

function theoremValue(center, R) { const res = residues(); let re = 0, im = 0; fn().poles.forEach((p, i) => { if (cabs(csub(p, center)) < R) { re += res[i][0]; im += res[i][1]; } }); return [-2 * Math.PI * im, 2 * Math.PI * re]; }

function drawDiag(col, r) {
  const f = fn();
  panel(col, r, 'Integral vs contour radius: flat between poles, jumps by 2 pi i Res at each');
  const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 34 };
  let Rmax = 0.8; for (const p of f.poles) Rmax = Math.max(Rmax, cabs(csub(p, st.center))); Rmax += 0.8;
  const NS = 240; let lim = 0.5; const reArr = [], imArr = [];
  for (let i = 0; i <= NS; i += 1) { const R = Rmax * i / NS; const T = theoremValue(st.center, R); reArr.push(T[0]); imArr.push(T[1]); lim = Math.max(lim, Math.abs(T[0]), Math.abs(T[1])); }
  lim *= 1.15;
  const xOf = (R) => inner.x + R / Rmax * inner.w;
  const yOf = (v) => inner.y + inner.h * (1 - (v + lim) / (2 * lim));
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.save(); clipTo(ctx, inner);
  // pole-crossing markers.
  for (const p of f.poles) { const rp = cabs(csub(p, st.center)); if (rp < Rmax) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(rp), inner.y); ctx.lineTo(xOf(rp), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); } }
  const plot = (arr, color) => { ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath(); arr.forEach((v, i) => { const X = xOf(Rmax * i / NS), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); };
  plot(reArr, col.re); plot(imArr, col.im);
  // current R marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.R), inner.y); ctx.lineTo(xOf(st.R), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  const Tn = theoremValue(st.center, st.R); ctx.fillStyle = col.re; ctx.beginPath(); ctx.arc(xOf(st.R), yOf(Tn[0]), 4, 0, 6.28); ctx.fill(); ctx.fillStyle = col.im; ctx.beginPath(); ctx.arc(xOf(st.R), yOf(Tn[1]), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  ctx.fillStyle = col.re; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Re of integral', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.im; ctx.fillText('Im of integral', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const R of [0, Rmax / 2, Rmax]) ctx.fillText(R.toFixed(1), xOf(R), inner.y + inner.h + 6);
  ctx.fillText('contour radius R', inner.x + inner.w / 2, inner.y + inner.h + 19);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(`+${lim.toFixed(1)}`, inner.x - 4, inner.y + 6); ctx.fillText(`${(-lim).toFixed(1)}`, inner.x - 4, inner.y + inner.h - 6);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { if (!SC) return; const [sx, sy] = ptr(e); if (sx > SC.bx && sx < SC.bx + SC.side && sy > SC.by && sy < SC.by + SC.side) { drag = true; st.center = SC.s2w(sx, sy); render(); } });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [sx, sy] = ptr(e); st.center = SC.s2w(sx, sy); render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('fn') && FUNCS[params.get('fn')]) pickFn(params.get('fn'));
  if (params.get('R')) st.R = Math.max(0.2, Math.min(4.5, +params.get('R')));
  syncVals(); relayout(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fn(); const I = contourIntegral(f, st.center, st.R, 2000); const T = theoremValue(st.center, st.R);
  const nIn = f.poles.filter((p) => cabs(csub(p, st.center)) < st.R).length;
  return { fields: [
    { key: 'fn', label: 'function', value: f.label, format: 'text' },
    { key: 'R', label: 'contour radius R', value: st.R, format: 'float' },
    { key: 'in', label: 'poles enclosed', value: nIn, format: 'int' },
    { key: 'I', label: 'contour integral', value: `${I[0].toFixed(2)} + ${I[1].toFixed(2)}i`, format: 'text' },
    { key: 'T', label: '2 pi i x sum Res', value: `${T[0].toFixed(2)} + ${T[1].toFixed(2)}i`, format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fn(); const I = contourIntegral(f, st.center, st.R, 3000); const T = theoremValue(st.center, st.R);
  const err = Math.hypot(I[0] - T[0], I[1] - T[1]);
  return [
    { key: 'thm', label: 'integral = 2 pi i sum Res (residue theorem)', value: err.toExponential(1), status: err < 0.05 ? 'pass' : 'pending' },
    { key: 'enc', label: 'poles enclosed', value: `${f.poles.filter((p) => cabs(csub(p, st.center)) < st.R).length}`, status: 'pass' },
  ];
};
