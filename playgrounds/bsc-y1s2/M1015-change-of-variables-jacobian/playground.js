// Change of variables and the Jacobian. A real grid on the source (u,v) region
// is pushed through a real map to the (x,y) plane; each mapped cell is coloured
// by its local |J|, the area-scaling factor, and a draggable probe shows the
// infinitesimal parallelogram spanned by the Jacobian columns. The diagnostic
// accumulates the area with and without the |J| factor, showing the
// change-of-variables theorem numerically. Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 15.10.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { MAPS, numericJac, accumulate } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const btnMap = document.getElementById('btn-map'), vMap = document.getElementById('value-map');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(MAPS);
const st = { mapKey: params.get('map') && MAPS[params.get('map')] ? params.get('map') : 'polar', N: 10, pu: 0.6, pv: 0.55 };

function m() { return MAPS[st.mapKey]; }
function probeUV() { const M = m(); return [M.u[0] + st.pu * (M.u[1] - M.u[0]), M.v[0] + st.pv * (M.v[1] - M.v[0])]; }

let view = { w: 800, h: 1040, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'src', weight: 0.92 }, { name: 'dst', weight: 1.18 }, { name: 'diag', weight: 0.9 }]);
}

function syncVals() { vN.textContent = String(st.N); vMap.textContent = m().label; }
sN.addEventListener('input', () => { st.N = parseInt(sN.value, 10); syncVals(); render(); });
btnMap.addEventListener('click', () => { st.mapKey = KEYS[(KEYS.indexOf(st.mapKey) + 1) % KEYS.length]; st.pu = 0.6; st.pv = 0.55; syncVals(); render(); });
btnReset.addEventListener('click', () => { st.mapKey = 'polar'; st.N = 10; sN.value = '10'; st.pu = 0.6; st.pv = 0.55; syncVals(); render(); });

function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#07080d', panel: '#0a0c12', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.10)', probe: '#ff9d6f', jacInt: '#67d98c', naive: '#ef5466', refline: 'rgba(255,255,255,0.55)' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

// world->screen fit for a panel, equal aspect, y up.
function fitBox(b, p, pad) {
  const ww = Math.max(1e-6, b.x1 - b.x0), wh = Math.max(1e-6, b.y1 - b.y0);
  const s = Math.min((p.w - 2 * pad) / ww, (p.h - 2 * pad) / wh);
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const ox = p.x + p.w / 2 - s * cx, oy = p.y + p.h / 2 + s * cy;
  return { s, X: (x) => ox + s * x, Y: (y) => oy - s * y, invX: (sx) => (sx - ox) / s, invY: (sy) => (oy - sy) / s };
}
function mappedBounds(M) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i <= 24; i += 1) for (let j = 0; j <= 24; j += 1) {
    const [x, y] = M.map(M.u[0] + i / 24 * (M.u[1] - M.u[0]), M.v[0] + j / 24 * (M.v[1] - M.v[0]));
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
}

let uvFit = null; // for inverse hit-testing of the probe
function drawSource(col, r) {
  panel(col, r, `Source region (${m().uName}, ${m().vName})  with an ${st.N} x ${st.N} grid`);
  const M = m();
  const p = { x: r.x + 12, y: r.y + 24, w: r.w - 24, h: r.h - 36 };
  const fit = fitBox({ x0: M.u[0], x1: M.u[1], y0: M.v[0], y1: M.v[1] }, p, 8);
  uvFit = { fit, p };
  ctx.save(); clipTo(ctx, p);
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= st.N; i += 1) { const u = M.u[0] + i / st.N * (M.u[1] - M.u[0]); ctx.beginPath(); ctx.moveTo(fit.X(u), fit.Y(M.v[0])); ctx.lineTo(fit.X(u), fit.Y(M.v[1])); ctx.stroke(); }
  for (let j = 0; j <= st.N; j += 1) { const v = M.v[0] + j / st.N * (M.v[1] - M.v[0]); ctx.beginPath(); ctx.moveTo(fit.X(M.u[0]), fit.Y(v)); ctx.lineTo(fit.X(M.u[1]), fit.Y(v)); ctx.stroke(); }
  // probe + its cell.
  const [pu, pv] = probeUV();
  const du = (M.u[1] - M.u[0]) / st.N, dv = (M.v[1] - M.v[0]) / st.N;
  const ci = Math.floor((pu - M.u[0]) / du), cj = Math.floor((pv - M.v[0]) / dv);
  ctx.strokeStyle = col.probe; ctx.lineWidth = 2;
  ctx.strokeRect(fit.X(M.u[0] + ci * du), fit.Y(M.v[0] + (cj + 1) * dv), du * fit.s, dv * fit.s);
  ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(fit.X(pu), fit.Y(pv), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  // axes labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText(`${M.uName} ->`, r.x + r.w - 8, r.y + r.h - 4);
}

function drawDest(col, r) {
  panel(col, r, 'Mapped region (x, y), cells coloured by |J| (area scaling); drag the probe');
  const M = m();
  const p = { x: r.x + 12, y: r.y + 24, w: r.w - 24, h: r.h - 36 };
  const fit = fitBox(mappedBounds(M), p, 10);
  const du = (M.u[1] - M.u[0]) / st.N, dv = (M.v[1] - M.v[0]) / st.N;
  // normalise |J| over the grid centres.
  let jmin = Infinity, jmax = -Infinity;
  for (let i = 0; i < st.N; i += 1) for (let j = 0; j < st.N; j += 1) { const J = M.jac(M.u[0] + (i + 0.5) * du, M.v[0] + (j + 0.5) * dv); jmin = Math.min(jmin, J); jmax = Math.max(jmax, J); }
  const span = Math.max(1e-9, jmax - jmin);
  ctx.save(); clipTo(ctx, p);
  for (let i = 0; i < st.N; i += 1) {
    for (let j = 0; j < st.N; j += 1) {
      const u0 = M.u[0] + i * du, v0 = M.v[0] + j * dv;
      const q = [M.map(u0, v0), M.map(u0 + du, v0), M.map(u0 + du, v0 + dv), M.map(u0, v0 + dv)];
      const J = M.jac(u0 + du / 2, v0 + dv / 2);
      const c = viridis((J - jmin) / span);
      ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
      ctx.beginPath(); ctx.moveTo(fit.X(q[0][0]), fit.Y(q[0][1]));
      for (let k = 1; k < 4; k += 1) ctx.lineTo(fit.X(q[k][0]), fit.Y(q[k][1]));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.6; ctx.stroke();
    }
  }
  // probe image + Jacobian parallelogram (columns scaled by the cell size).
  const [pu, pv] = probeUV();
  const [px, py] = M.map(pu, pv);
  const cu = M.map(pu + du, pv), cv = M.map(pu, pv + dv);
  const aU = [cu[0] - px, cu[1] - py], aV = [cv[0] - px, cv[1] - py];
  ctx.strokeStyle = col.probe; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,157,111,0.28)';
  ctx.beginPath(); ctx.moveTo(fit.X(px), fit.Y(py));
  ctx.lineTo(fit.X(px + aU[0]), fit.Y(py + aU[1]));
  ctx.lineTo(fit.X(px + aU[0] + aV[0]), fit.Y(py + aU[1] + aV[1]));
  ctx.lineTo(fit.X(px + aV[0]), fit.Y(py + aV[1]));
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(fit.X(px), fit.Y(py), 4, 0, 6.28); ctx.fill();
  ctx.restore();
  // colorbar.
  const cbx = r.x + r.w - 60, cby = r.y + 28, cbw = 12, cbh = r.h - 60;
  for (let k = 0; k < cbh; k += 1) { const c = viridis(1 - k / cbh); ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`; ctx.fillRect(cbx, cby + k, cbw, 1); }
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(jmax.toFixed(2), cbx + cbw + 4, cby + 5); ctx.fillText(jmin.toFixed(2), cbx + cbw + 4, cby + cbh - 5);
  ctx.textBaseline = 'bottom'; ctx.fillText('|J|', cbx, cby - 4);
}

function drawDiag(col, r) {
  panel(col, r, 'Area accumulated with |J| (correct) and without (wrong) vs grid resolution');
  const M = m();
  const Ns = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28, 32];
  const ref = accumulate(M, 96).mappedArea;
  const data = Ns.map((N) => ({ N, ...accumulate(M, N) }));
  const cur = accumulate(M, st.N);
  let amin = ref, amax = ref;
  for (const d of data) { amin = Math.min(amin, d.jacInt, d.naive); amax = Math.max(amax, d.jacInt, d.naive); }
  const pad = 0.1 * (amax - amin || 1); amin -= pad; amax += pad;
  const inner = { x: r.x + 48, y: r.y + 26, w: r.w - 48 - 14, h: r.h - 26 - 30 };
  const xOf = (N) => inner.x + (N - Ns[0]) / (Ns[Ns.length - 1] - Ns[0]) * inner.w;
  const yOf = (a) => inner.y + inner.h - (a - amin) / (amax - amin) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k += 1) { const a = amin + k / 4 * (amax - amin); const y = yOf(a); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(a.toFixed(2), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // reference (true mapped area).
  ctx.strokeStyle = col.refline; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(inner.x, yOf(ref)); ctx.lineTo(inner.x + inner.w, yOf(ref)); ctx.stroke(); ctx.setLineDash([]);
  // naive (no Jacobian, wrong).
  ctx.strokeStyle = col.naive; ctx.lineWidth = 2; ctx.beginPath(); data.forEach((d, i) => { const X = xOf(d.N), Y = yOf(d.naive); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }); ctx.stroke();
  // jacInt (with Jacobian, converges to ref).
  ctx.strokeStyle = col.jacInt; ctx.lineWidth = 2.4; ctx.beginPath(); data.forEach((d, i) => { const X = xOf(d.N), Y = yOf(d.jacInt); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }); ctx.stroke();
  data.forEach((d) => { ctx.fillStyle = col.jacInt; ctx.beginPath(); ctx.arc(xOf(d.N), yOf(d.jacInt), 2, 0, 6.28); ctx.fill(); });
  // current N marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.N), inner.y); ctx.lineTo(xOf(st.N), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);

  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.jacInt; ctx.fillText(`with |J|: ${cur.jacInt.toFixed(3)}`, inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.naive; ctx.fillText(`no |J|: ${cur.naive.toFixed(3)}`, inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.refline; ctx.fillText(`true area: ${ref.toFixed(3)}`, inner.x + 6, inner.y + 32);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('grid resolution N', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawSource(col, REG.src);
  drawDest(col, REG.dst);
  drawDiag(col, REG.diag);
}

// drag the probe in the source panel.
function pointerToUV(ev) {
  if (!uvFit) return null;
  const rect = canvas.getBoundingClientRect();
  const sx = (ev.clientX - rect.left) * (view.w / rect.width);
  const sy = (ev.clientY - rect.top) * (view.h / rect.height);
  if (sx < uvFit.p.x || sx > uvFit.p.x + uvFit.p.w || sy < uvFit.p.y || sy > uvFit.p.y + uvFit.p.h) return null;
  const M = m();
  const u = Math.min(M.u[1], Math.max(M.u[0], uvFit.fit.invX(sx)));
  const v = Math.min(M.v[1], Math.max(M.v[0], uvFit.fit.invY(sy)));
  return [(u - M.u[0]) / (M.u[1] - M.u[0]), (v - M.v[0]) / (M.v[1] - M.v[0])];
}
let dragging = false;
canvas.addEventListener('pointerdown', (e) => { const uv = pointerToUV(e); if (uv) { dragging = true; st.pu = uv[0]; st.pv = uv[1]; render(); } });
canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const uv = pointerToUV(e); if (uv) { st.pu = uv[0]; st.pv = uv[1]; render(); } });
window.addEventListener('pointerup', () => { dragging = false; });

function boot() {
  syncVals(); relayout();
  if (CAPTURE_NAME) { st.N = 10; st.pu = 0.62; st.pv = 0.58; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const [pu, pv] = probeUV();
  return { fields: [
    { key: 'map', label: 'map', value: m().label, format: 'text' },
    { key: 'N', label: 'grid resolution', value: st.N, format: 'int' },
    { key: 'Jprobe', label: '|J| at probe', value: m().jac(pu, pv), format: 'float' },
    { key: 'jacInt', label: 'area with |J|', value: accumulate(m(), st.N).jacInt, format: 'float' },
    { key: 'naive', label: 'area without |J|', value: accumulate(m(), st.N).naive, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const [pu, pv] = probeUV();
  const errJ = Math.abs(m().jac(pu, pv) - numericJac(m().map, pu, pv)) / (m().jac(pu, pv) + 1e-9);
  const acc = accumulate(m(), Math.max(24, st.N));
  const errA = Math.abs(acc.jacInt - acc.mappedArea) / acc.mappedArea;
  return [
    { key: 'jac', label: '|J| analytic = numeric', value: errJ.toExponential(1), status: errJ < 1e-3 ? 'pass' : 'drift' },
    { key: 'area', label: 'integral of |J| = mapped area', value: errA.toExponential(1), status: errA < 5e-3 ? 'pass' : 'drift' },
  ];
};
