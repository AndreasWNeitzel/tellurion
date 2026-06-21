// Green's theorem in circulation form: the line integral around a closed curve
// equals the area integral of the curl inside it. The scene shows the vector
// field, a curl heatmap, and a draggable, resizable circle whose boundary is
// coloured by the tangential component F.t; the circulation and the area integral
// of the curl are computed live and agree. The diagnostic sweeps the radius.
// Canvas2D only.
//
// Reference: Stewart, Calculus, 8e, Sec. 16.4.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { FIELDS, circulationCircle, curlIntegralCircle, enclosesOrigin } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const btnField = document.getElementById('btn-field'), vField = document.getElementById('value-field');
const btnReset = document.getElementById('btn-reset');

const KEYS = Object.keys(FIELDS);
const EXT = 2.5;
const st = { field: 'vortex', cx: 0.5, cy: 0.3, R: 1.0 };
function fld() { return FIELDS[st.field]; }

let view = { w: 820, h: 1040, dpr: 1 }, REG = null, heat = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.4 }, { name: 'diag', weight: 0.82 }]);
}
function syncVals() { vR.textContent = st.R.toFixed(2); vField.textContent = fld().label; }
sR.addEventListener('input', () => { st.R = parseFloat(sR.value); syncVals(); render(); });
btnField.addEventListener('click', () => { st.field = KEYS[(KEYS.indexOf(st.field) + 1) % KEYS.length]; syncVals(); render(); });
btnReset.addEventListener('click', () => { st.field = 'vortex'; st.cx = 0.5; st.cy = 0.3; st.R = 1.0; sR.value = '1'; syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)', arrow: 'rgba(210,218,235,0.6)', curve: '#ffd166', ccw: '#ef5466', cw: '#5b8def', circ: '#ef5466', area: '#67d98c' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

let SCN = null;
function drawScene(col, r) {
  panel(col, r, 'Circulation around the curve equals the area integral of curl F inside');
  const titleH = 24, stripH = 30;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h) - 16;
  const ox = draw.x + (draw.w - size) / 2, oy = draw.y + (draw.h - size) / 2;
  const X = (wx) => ox + (wx + EXT) / (2 * EXT) * size, Y = (wy) => oy + (EXT - wy) / (2 * EXT) * size;
  const wX = (sx) => (sx - ox) / size * (2 * EXT) - EXT, wY = (sy) => EXT - (sy - oy) / size * (2 * EXT);
  SCN = { ox, oy, size, X, Y, wX, wY };
  const f = fld();

  // curl heatmap.
  const NH = 90;
  if (!heat) heat = document.createElement('canvas');
  heat.width = NH; heat.height = NH; const hctx = heat.getContext('2d'); const img = hctx.createImageData(NH, NH);
  for (let j = 0; j < NH; j += 1) for (let i = 0; i < NH; i += 1) {
    const wx = -EXT + (i + 0.5) / NH * 2 * EXT, wy = EXT - (j + 0.5) / NH * 2 * EXT;
    const cu = f.singular ? 0 : f.curl(wx, wy);
    const c = rdbu(0.5 - Math.max(-1, Math.min(1, cu / 4)) * 0.5);
    const k = (j * NH + i) * 4; img.data[k] = c.r; img.data[k + 1] = c.g; img.data[k + 2] = c.b; img.data[k + 3] = 150;
  }
  hctx.putImageData(img, 0, 0);
  ctx.save(); clipTo(ctx, { x: ox, y: oy, w: size, h: size });
  ctx.imageSmoothingEnabled = true; ctx.drawImage(heat, ox, oy, size, size);

  // vector field arrows.
  const NG = 15; ctx.strokeStyle = col.arrow; ctx.fillStyle = col.arrow; ctx.lineWidth = 1.2;
  for (let gj = 0; gj < NG; gj += 1) for (let gi = 0; gi < NG; gi += 1) {
    const wx = -EXT + (gi + 0.5) / NG * 2 * EXT, wy = EXT - (gj + 0.5) / NG * 2 * EXT;
    const [fx, fy] = f.F(wx, wy); const mag = Math.hypot(fx, fy) || 1e-9;
    const L = Math.min(size / NG * 0.42, mag * size / (2 * EXT) * 0.35);
    const ux = fx / mag, uy = fy / mag; const x0 = X(wx), y0 = Y(wy), x1 = x0 + ux * L, y1 = y0 - uy * L;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 4 * Math.cos(a - 0.5), y1 - 4 * Math.sin(a - 0.5)); ctx.lineTo(x1 - 4 * Math.cos(a + 0.5), y1 - 4 * Math.sin(a + 0.5)); ctx.closePath(); ctx.fill();
  }
  // singular point (point vortex).
  if (f.singular) { ctx.fillStyle = enclosesOrigin(st.cx, st.cy, st.R) ? col.ccw : col.muted; ctx.beginPath(); ctx.arc(X(0), Y(0), 5, 0, 6.28); ctx.fill(); }

  // the closed curve, boundary coloured by F.t (tangential, CCW).
  const Rpix = st.R / (2 * EXT) * size; const n = 160;
  for (let i = 0; i < n; i += 1) {
    const th = i / n * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th);
    const [fx, fy] = f.F(st.cx + st.R * c, st.cy + st.R * s); const ft = fx * (-s) + fy * c;
    ctx.strokeStyle = ft >= 0 ? col.ccw : col.cw; ctx.globalAlpha = Math.min(1, 0.35 + Math.abs(ft) * 0.5); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(X(st.cx), Y(st.cy), Rpix, -th - Math.PI / n, -th + Math.PI / n, false); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = col.curve; ctx.beginPath(); ctx.arc(X(st.cx), Y(st.cy), 3.5, 0, 6.28); ctx.fill();
  ctx.restore();

  // readout strip.
  const circ = circulationCircle(f, st.cx, st.cy, st.R);
  const area = f.singular ? (enclosesOrigin(st.cx, st.cy, st.R) ? 2 * Math.PI : 0) : curlIntegralCircle(f, st.cx, st.cy, st.R);
  const items = [[`circulation ${circ.toFixed(3)}`, col.circ], [`integral curl ${area.toFixed(3)}`, col.area], [f.singular ? (enclosesOrigin(st.cx, st.cy, st.R) ? 'vortex enclosed' : 'vortex outside') : `|circ - integral| ${Math.abs(circ - area).toExponential(0)}`, col.curve]];
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 3, r.y + r.h - 28); });
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('drag to move the circle; red boundary = counterclockwise flow, blue = clockwise', r.x + r.w / 2, r.y + r.h - 10);
}

function drawDiag(col, r) {
  panel(col, r, 'Circulation and the area integral of curl F versus the circle radius: they coincide');
  const inner = { x: r.x + 46, y: r.y + 26, w: r.w - 46 - 16, h: r.h - 26 - 30 };
  const f = fld(); const Rmax = 2.2;
  const xs = [];
  for (let i = 1; i <= 60; i += 1) { const R = Rmax * i / 60; const circ = circulationCircle(f, st.cx, st.cy, R); const area = f.singular ? (enclosesOrigin(st.cx, st.cy, R) ? 2 * Math.PI : 0) : curlIntegralCircle(f, st.cx, st.cy, R, 90); xs.push({ R, circ, area }); }
  let lo = 0, hi = 0.1; for (const p of xs) { lo = Math.min(lo, p.circ, p.area); hi = Math.max(hi, p.circ, p.area); }
  const pad = 0.12 * (hi - lo || 1); lo -= pad; hi += pad;
  const xOf = (R) => inner.x + R / Rmax * inner.w;
  const yOf = (v) => inner.y + inner.h - (v - lo) / (hi - lo) * inner.h;
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('0', inner.x - 5, yOf(0));
  ctx.strokeStyle = col.area; ctx.lineWidth = 3; ctx.beginPath(); xs.forEach((p, i) => { const X = xOf(p.R), Y = yOf(p.area); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  ctx.strokeStyle = col.circ; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]); ctx.beginPath(); xs.forEach((p, i) => { const X = xOf(p.R), Y = yOf(p.circ); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.R), inner.y); ctx.lineTo(xOf(st.R), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.area; ctx.fillText('integral of curl', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.circ; ctx.fillText('circulation (dashed)', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('circle radius R', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

let dragging = false;
function ptr(ev) { const rect = canvas.getBoundingClientRect(); return [(ev.clientX - rect.left) * (view.w / rect.width), (ev.clientY - rect.top) * (view.h / rect.height)]; }
canvas.addEventListener('pointerdown', (e) => { if (!SCN) return; const [sx, sy] = ptr(e); if (sx >= SCN.ox && sx <= SCN.ox + SCN.size && sy >= SCN.oy && sy <= SCN.oy + SCN.size) { dragging = true; st.cx = Math.max(-EXT, Math.min(EXT, SCN.wX(sx))); st.cy = Math.max(-EXT, Math.min(EXT, SCN.wY(sy))); render(); } });
canvas.addEventListener('pointermove', (e) => { if (!dragging || !SCN) return; const [sx, sy] = ptr(e); st.cx = Math.max(-EXT, Math.min(EXT, SCN.wX(sx))); st.cy = Math.max(-EXT, Math.min(EXT, SCN.wY(sy))); render(); });
window.addEventListener('pointerup', () => { dragging = false; });

function boot() {
  if (params.get('field') && FIELDS[params.get('field')]) st.field = params.get('field');
  syncVals(); relayout();
  if (CAPTURE_NAME) { if (!params.get('field')) st.field = 'varying'; st.cx = 0.4; st.cy = 0.2; st.R = 1.4; syncVals(); }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = fld(); const circ = circulationCircle(f, st.cx, st.cy, st.R);
  const area = f.singular ? (enclosesOrigin(st.cx, st.cy, st.R) ? 2 * Math.PI : 0) : curlIntegralCircle(f, st.cx, st.cy, st.R);
  return { fields: [
    { key: 'field', label: 'field', value: f.label, format: 'text' },
    { key: 'R', label: 'circle radius', value: st.R, format: 'float' },
    { key: 'circ', label: 'circulation', value: circ, format: 'float' },
    { key: 'area', label: 'integral of curl', value: area, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const f = fld(); const circ = circulationCircle(f, st.cx, st.cy, st.R);
  if (f.singular) {
    const inside = enclosesOrigin(st.cx, st.cy, st.R);
    return [{ key: 'stokes', label: inside ? 'circulation = 2 pi (vortex enclosed)' : 'circulation = 0 (vortex outside)', value: circ.toFixed(3), status: Math.abs(circ - (inside ? 2 * Math.PI : 0)) < 0.05 ? 'pass' : 'drift' }];
  }
  const area = curlIntegralCircle(f, st.cx, st.cy, st.R);
  const err = Math.abs(circ - area) / (Math.abs(area) + 0.2);
  return [{ key: 'green', label: 'circulation = integral of curl F', value: err.toExponential(1), status: err < 0.02 ? 'pass' : 'drift' }];
};
