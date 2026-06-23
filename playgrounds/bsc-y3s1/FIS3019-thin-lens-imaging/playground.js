// Thin-lens imaging. The scene ray-traces the three principal rays from a draggable
// object through a converging or diverging lens to locate the image, with photons
// streaming along the physical ray paths; the diagnostic plots image distance and
// magnification against object distance, the lens-equation hyperbola with its real /
// virtual transition at d_o = f. Canvas2D only.
//
// Reference: Hecht, Optics, 5th ed., Ch. 5, Eq. 5.17.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { imageDistance, magnification, imageHeight, isReal } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sF = document.getElementById('s-f'), vF = document.getElementById('v-f');
const sD = document.getElementById('s-d'), vD = document.getElementById('v-d');
const btnReset = document.getElementById('btn-reset');

const HOBJ = 1.5;          // object height, world units
const WX = 13;             // half-width of the optical axis shown, world units
const WY = 5;              // half-height shown, world units
const st = { f: 4, dObj: 8 };
let frame = 0, running = true;

let view = { w: 820, h: 1040, dpr: 1 }, REG = null;
function relayout() { view = setupCanvas(canvas, ctx); REG = stack({ width: view.w, height: view.h }, [{ name: 'scene', weight: 1.28 }, { name: 'diag', weight: 0.82 }]); }
function clampF(f) { return Math.abs(f) < 0.5 ? (f >= 0 ? 0.5 : -0.5) : f; }
function syncVals() {
  st.f = clampF(+sF.value); sF.value = st.f; vF.textContent = (st.f > 0 ? '+' : '') + st.f.toFixed(1) + (st.f > 0 ? ' (converging)' : ' (diverging)');
  st.dObj = +sD.value; vD.textContent = st.dObj.toFixed(1);
}
btnReset.addEventListener('click', () => { st.f = 4; st.dObj = 8; sF.value = 4; sD.value = 8; syncVals(); render(); });
sF.addEventListener('input', () => { syncVals(); render(); });
sD.addEventListener('input', () => { syncVals(); render(); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', axis: 'rgba(255,255,255,0.30)',
    lens: '#5ec8ff', obj: '#ffd24a', img: '#ff6f6f', imgV: '#c98cff',
    rayA: '#7ad0ff', rayB: '#8de08a', rayC: '#ffb35c', focal: '#9aa0a6' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

// world -> screen for the scene panel.
let MAP = null;
function arrow(x1, y1, x2, y2, head) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1); ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4)); ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
}

let SC = null;
function drawScene(col, r) {
  const di = imageDistance(st.dObj, st.f), hi = imageHeight(st.dObj, st.f, HOBJ), m = magnification(st.dObj, st.f);
  const real = isReal(st.dObj, st.f), atInf = !isFinite(di) || Math.abs(di) > 1e4;
  const kind = atInf ? 'image at infinity' : real ? 'real, inverted' : 'virtual, upright';
  panel(col, r, `f = ${(st.f > 0 ? '+' : '') + st.f.toFixed(1)} (${st.f > 0 ? 'converging' : 'diverging'}),  object at d_o = ${st.dObj.toFixed(1)}  ->  ${kind}`);
  const plot = { x: r.x + 12, y: r.y + 28, w: r.w - 24, h: r.h - 28 - 12 };
  const cyp = plot.y + plot.h / 2, sclX = plot.w / (2 * WX), sclY = (plot.h / 2 - 8) / WY;
  const sx = (x) => plot.x + plot.w / 2 + x * sclX, sy = (y) => cyp - y * sclY;
  MAP = { plot, sx, sy, sclX };

  ctx.save(); clipTo(ctx, plot);
  // optical axis.
  ctx.strokeStyle = col.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(plot.x, cyp); ctx.lineTo(plot.x + plot.w, cyp); ctx.stroke();
  // lens at x = 0.
  const lh = WY * 0.86; const lx = sx(0);
  ctx.strokeStyle = col.lens; ctx.fillStyle = 'rgba(94,200,255,0.10)'; ctx.lineWidth = 2;
  if (st.f > 0) { ctx.beginPath(); ctx.ellipse(lx, cyp, 9, lh * sclY, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); }
  else {
    const hh = lh * sclY; ctx.beginPath();
    ctx.moveTo(lx - 8, cyp - hh); ctx.quadraticCurveTo(lx + 5, cyp, lx - 8, cyp + hh);
    ctx.lineTo(lx + 8, cyp + hh); ctx.quadraticCurveTo(lx - 5, cyp, lx + 8, cyp - hh); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.strokeStyle = col.lens; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(lx, cyp - lh * sclY); ctx.lineTo(lx, cyp + lh * sclY); ctx.stroke(); ctx.setLineDash([]);
  // focal and 2f markers.
  ctx.fillStyle = col.focal; ctx.font = fontString(canvas, 'tick', 'mono');
  for (const [xx, lab] of [[-st.f, 'F'], [st.f, "F'"], [-2 * st.f, '2F'], [2 * st.f, "2F'"]]) {
    if (Math.abs(xx) > WX) continue; const px = sx(xx);
    ctx.strokeStyle = col.focal; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, cyp - 5); ctx.lineTo(px, cyp + 5); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(lab, px, cyp + 7);
  }

  // object arrow.
  const P = { x: -st.dObj, y: HOBJ };
  ctx.strokeStyle = col.obj; ctx.fillStyle = col.obj; ctx.lineWidth = 2.4; arrow(sx(P.x), sy(0), sx(P.x), sy(P.y), 9);

  // principal rays. each: incident P->lensPt, refracted lensPt->forward edge.
  const Q = { x: di, y: hi };
  const lensPts = [{ x: 0, y: HOBJ, c: col.rayA }, { x: 0, y: 0, c: col.rayB }, { x: 0, y: hi, c: col.rayC }];
  // forward refracted direction (always +x); rays pass through Q (real) or diverge from it (virtual).
  function fdir(L) {
    if (atInf) { const d = Math.hypot(st.dObj, HOBJ); return { x: st.dObj / d, y: -HOBJ / d }; } // chief-ray direction
    let dx = Q.x - L.x, dy = Q.y - L.y; if (Q.x < 0) { dx = -dx; dy = -dy; } const n = Math.hypot(dx, dy) || 1; return { x: dx / n, y: dy / n };
  }
  const paths = [];
  for (const L of lensPts) {
    const d = fdir(L); const far = 2 * WX; const end = { x: L.x + d.x * far, y: L.y + d.y * far };
    // incident.
    ctx.strokeStyle = L.c; ctx.lineWidth = 1.7; ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.moveTo(sx(P.x), sy(P.y)); ctx.lineTo(sx(L.x), sy(L.y)); ctx.stroke();
    // refracted forward.
    ctx.beginPath(); ctx.moveTo(sx(L.x), sy(L.y)); ctx.lineTo(sx(end.x), sy(end.y)); ctx.stroke();
    ctx.globalAlpha = 1;
    paths.push([P, L, end]);
  }
  // virtual back-extensions (dashed) from each lens point through Q.
  if (!real && !atInf) {
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
    for (const L of lensPts) { ctx.strokeStyle = L.c; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(sx(L.x), sy(L.y)); ctx.lineTo(sx(Q.x), sy(Q.y)); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.setLineDash([]);
  }

  // photons streaming along the physical paths.
  for (let k = 0; k < paths.length; k += 1) {
    const seg = paths[k]; const segLen = [Math.hypot(seg[1].x - seg[0].x, seg[1].y - seg[0].y), Math.hypot(seg[2].x - seg[1].x, seg[2].y - seg[1].y)];
    const tot = segLen[0] + segLen[1];
    for (let q = 0; q < 3; q += 1) {
      const p = ((frame * 0.006) + k * 0.13 + q / 3) % 1; const dpos = p * tot; let pt;
      if (dpos < segLen[0]) { const u = dpos / segLen[0]; pt = { x: seg[0].x + (seg[1].x - seg[0].x) * u, y: seg[0].y + (seg[1].y - seg[0].y) * u }; }
      else { const u = (dpos - segLen[0]) / segLen[1]; pt = { x: seg[1].x + (seg[2].x - seg[1].x) * u, y: seg[1].y + (seg[2].y - seg[1].y) * u }; }
      ctx.fillStyle = lensPts[k].c; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(sx(pt.x), sy(pt.y), 2.6, 0, 6.2832); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // image arrow.
  if (!atInf && Math.abs(Q.x) <= WX && Math.abs(Q.y) <= WY * 1.2) {
    const c = real ? col.img : col.imgV; ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.4;
    if (real) arrow(sx(Q.x), sy(0), sx(Q.x), sy(Q.y), 9);
    else { ctx.setLineDash([5, 4]); arrow(sx(Q.x), sy(0), sx(Q.x), sy(Q.y), 9); ctx.setLineDash([]); }
  }
  ctx.restore();

  // labels.
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.obj; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('object', sx(P.x) - 14, sy(P.y) - 16);
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'tick', 'mono');
  const mTxt = atInf ? '+/- infinity' : `${m.toFixed(2)}x`;
  const diTxt = atInf ? 'infinity' : di.toFixed(2);
  ctx.fillText(`d_i = ${diTxt}   M = ${mTxt}   h_i = ${atInf ? '-' : hi.toFixed(2)}`, plot.x + 8, plot.y + plot.h - 18);
  // legend.
  ctx.textAlign = 'right';
  ctx.fillStyle = col.rayA; ctx.fillText('parallel ray', plot.x + plot.w - 8, plot.y + 4);
  ctx.fillStyle = col.rayB; ctx.fillText('chief ray', plot.x + plot.w - 8, plot.y + 18);
  ctx.fillStyle = col.rayC; ctx.fillText('focal ray', plot.x + plot.w - 8, plot.y + 32);

  SC = { plot, sclX, x0: sx(0) };
}

function drawDiag(col, r) {
  panel(col, r, 'Image distance d_i and magnification M vs object distance d_o (lens-equation hyperbola)');
  const inner = { x: r.x + 50, y: r.y + 30, w: r.w - 50 - 50, h: r.h - 30 - 34 };
  const dlo = 0.5, dhi = 13; const dilim = 16;
  const xOf = (d) => inner.x + (d - dlo) / (dhi - dlo) * inner.w;
  const yOf = (v) => inner.y + inner.h * (1 - (v + dilim) / (2 * dilim));   // maps [-dilim, dilim] over the panel
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // gridlines and left axis (d_i).
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'middle';
  for (let v = -dilim; v <= dilim; v += 8) { const Y = yOf(v); ctx.strokeStyle = v === 0 ? col.axis : 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(inner.x, Y); ctx.lineTo(inner.x + inner.w, Y); ctx.stroke(); ctx.fillStyle = col.img; ctx.textAlign = 'right'; ctx.fillText(`${v}`, inner.x - 5, Y); }
  // d_o = f asymptote.
  if (st.f > dlo && st.f < dhi) { ctx.strokeStyle = col.focal; ctx.setLineDash([3, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xOf(st.f), inner.y); ctx.lineTo(xOf(st.f), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.focal; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('d_o = f', xOf(st.f), inner.y + 3); }
  ctx.save(); clipTo(ctx, inner);
  // d_i(d_o) curve, split at the asymptote.
  ctx.strokeStyle = col.img; ctx.lineWidth = 2.6; ctx.beginPath(); let pen = false;
  for (let i = 0; i <= 400; i += 1) { const d = dlo + (dhi - dlo) * i / 400; if (Math.abs(d - st.f) < 0.06) { pen = false; continue; } const di = imageDistance(d, st.f); if (!isFinite(di) || Math.abs(di) > dilim) { pen = false; continue; } const X = xOf(d), Y = yOf(di); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke();
  // M(d_o) curve.
  ctx.strokeStyle = col.rayB; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.beginPath(); pen = false;
  for (let i = 0; i <= 400; i += 1) { const d = dlo + (dhi - dlo) * i / 400; if (Math.abs(d - st.f) < 0.06) { pen = false; continue; } const mm = magnification(d, st.f); if (!isFinite(mm) || Math.abs(mm) > dilim) { pen = false; continue; } const X = xOf(d), Y = yOf(mm); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } } ctx.stroke(); ctx.setLineDash([]);
  // current d_o marker.
  const di = imageDistance(st.dObj, st.f), mm = magnification(st.dObj, st.f);
  ctx.strokeStyle = col.obj; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.dObj), inner.y); ctx.lineTo(xOf(st.dObj), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  if (isFinite(di) && Math.abs(di) <= dilim) { ctx.fillStyle = col.img; ctx.beginPath(); ctx.arc(xOf(st.dObj), yOf(di), 4.5, 0, 6.2832); ctx.fill(); }
  if (isFinite(mm) && Math.abs(mm) <= dilim) { ctx.fillStyle = col.rayB; ctx.beginPath(); ctx.arc(xOf(st.dObj), yOf(mm), 4.5, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  // labels.
  ctx.fillStyle = col.img; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('image distance d_i', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.rayB; ctx.fillText('magnification M', inner.x + 6, inner.y + 18);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let d = 2; d <= 12; d += 2) ctx.fillText(`${d}`, xOf(d), inner.y + inner.h + 6); ctx.fillText('object distance d_o', inner.x + inner.w / 2, inner.y + inner.h + 19);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene); drawDiag(col, REG.diag);
}

function tick() { frame += 1; render(); if (running) requestAnimationFrame(tick); }

let drag = false;
function ptr(e) { const rect = canvas.getBoundingClientRect(); return [(e.clientX - rect.left) * (view.w / rect.width), (e.clientY - rect.top) * (view.h / rect.height)]; }
function setObjFrom(sxp) { if (!SC) return; const wx = (sxp - SC.x0) / SC.sclX; st.dObj = Math.max(0.5, Math.min(13, -wx)); sD.value = st.dObj; vD.textContent = st.dObj.toFixed(1); }
canvas.addEventListener('pointerdown', (e) => { const [px, py] = ptr(e); if (!REG || py > REG.scene.y + REG.scene.h) return; drag = true; setObjFrom(px); if (!running) render(); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; const [px] = ptr(e); setObjFrom(px); if (!running) render(); });
window.addEventListener('pointerup', () => { drag = false; });

function boot() {
  if (params.get('f')) st.f = clampF(Math.max(-6, Math.min(6, +params.get('f'))));
  if (params.get('do')) st.dObj = Math.max(0.5, Math.min(13, +params.get('do')));
  sF.value = st.f; sD.value = st.dObj; syncVals(); relayout();
  if (DETERMINISTIC) {
    running = false; frame = 80; render();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
  } else { requestAnimationFrame(tick); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
window.addEventListener('resize', () => { relayout(); if (!running) render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); if (!running) render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const di = imageDistance(st.dObj, st.f), m = magnification(st.dObj, st.f);
  return { fields: [
    { key: 'f', label: 'focal length f', value: st.f, format: 'float' },
    { key: 'do', label: 'object distance d_o', value: st.dObj, format: 'float' },
    { key: 'di', label: 'image distance d_i', value: isFinite(di) ? di : Infinity, format: 'float' },
    { key: 'M', label: 'magnification M', value: isFinite(m) ? m : Infinity, format: 'float' },
    { key: 'kind', label: 'image', value: isReal(st.dObj, st.f) ? 'real, inverted' : 'virtual, upright', format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const di = imageDistance(st.dObj, st.f), m = magnification(st.dObj, st.f);
  const res = isFinite(di) ? Math.abs(1 / st.dObj + 1 / di - 1 / st.f) : 0;
  const mrel = isFinite(di) ? Math.abs(m - (-di / st.dObj)) : 0;
  return [
    { key: 'lenseq', label: '1/d_o + 1/d_i - 1/f = 0', value: res.toExponential(1), status: res < 1e-9 ? 'pass' : 'drift' },
    { key: 'magdef', label: 'M = -d_i/d_o', value: mrel.toExponential(1), status: mrel < 1e-9 ? 'pass' : 'drift' },
  ];
};
