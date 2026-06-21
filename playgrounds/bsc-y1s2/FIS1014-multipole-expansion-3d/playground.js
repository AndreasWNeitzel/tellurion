import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the multipole expansion, Canvas2D only. Top
// region: the exact potential of a small charge cluster on the z = 0
// slice (diverging colour map with contours) and a movable probe at
// distance r. Bottom region: the absolute error of each truncated
// expansion (monopole, +dipole, +quadrupole) versus distance on a
// log-log scale, where each added term buys a steeper falloff.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec.
// 3.4; Jackson, Classical Electrodynamics, Sec. 4.1.

import { exactPotential, multipolePotential, buildDist } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selDist = document.getElementById('select-dist');
const selOrder = document.getElementById('select-order');
const valueDist = document.getElementById('value-dist');
const valueOrder = document.getElementById('value-order');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const VIEW = 3.2, SCALE = 0.3;
let running = !DETERMINISTIC;
let charges = [];
let probe = { r: 2.2, th: 0.6 };
let heat = null, hiE = 0;

function order() { return parseInt(selOrder.value, 10); }
function loadDist() { charges = buildDist(selDist.value, SCALE); }
function syncVals() {
  valueDist.textContent = selDist.value;
  valueOrder.textContent = ['mono', '+dipole', '+quad'][order()];
}
selDist.addEventListener('change', () => { syncVals(); loadDist(); rebuild(); render(); });
selOrder.addEventListener('change', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selDist.value = 'dipole'; selOrder.value = '1'; probe = { r: 2.2, th: 0.6 };
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); loadDist(); rebuild(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h);
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale: size / (2 * VIEW) };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.9 },
    { name: 'diagnostic', weight: 1.1 },
  ]);
  computeSceneTransform();
  rebuild();
}
const WX = (x) => SCN.ox + x * SCN.scale;
const WY = (y) => SCN.oy - y * SCN.scale;
const invX = (sx) => (sx - SCN.ox) / SCN.scale;
const invY = (sy) => (SCN.oy - sy) / SCN.scale;

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    pos: '#ef5466', neg: '#5b8def', probe: '#ffd166',
    o0: '#9aa0a6', o1: '#5bc0eb', o2: '#67d98c',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// exact potential grid (z = 0) -> heatmap + scale for contours.
let grid = null, gnx = 0, gny = 0, gxs = null, gys = null, Vsc = 1;
function rebuild() {
  if (!SCN) return;
  const { draw } = SCN;
  gnx = Math.max(36, Math.round(draw.w / 12)); gny = Math.max(36, Math.round(draw.h / 12));
  gxs = []; gys = [];
  for (let i = 0; i < gnx; i++) gxs.push(invX(draw.x + (i + 0.5) / gnx * draw.w));
  for (let j = 0; j < gny; j++) gys.push(invY(draw.y + (j + 0.5) / gny * draw.h));
  grid = new Float64Array(gnx * gny);
  for (let j = 0; j < gny; j++) for (let i = 0; i < gnx; i++) grid[j * gnx + i] = exactPotential(charges, [gxs[i], gys[j], 0]);
  const sorted = Array.from(grid).map(Math.abs).sort((a, b) => a - b);
  Vsc = Math.max(0.2, sorted[Math.floor(sorted.length * 0.7)]);

  if (!heat) heat = document.createElement('canvas');
  heat.width = gnx; heat.height = gny;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(gnx, gny);
  for (let k = 0; k < gnx * gny; k++) {
    const t = 0.5 + 0.5 * Math.tanh(grid[k] / (2.2 * Vsc));
    const c = rdbu(t);
    img.data[k * 4] = c.r; img.data[k * 4 + 1] = c.g; img.data[k * 4 + 2] = c.b; img.data[k * 4 + 3] = 235;
  }
  hctx.putImageData(img, 0, 0);

  // fixed log window for the error plot, from the worst case near r = 0.6.
  let mx = 1e-9;
  for (let o = 0; o <= 2; o++) { const P = [0.6, 0.18, 0]; mx = Math.max(mx, Math.abs(multipolePotential(charges, o, P) - exactPotential(charges, P))); }
  hiE = Math.ceil(Math.log10(mx) + 0.5);
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function drawScene(col, r) {
  panel(col, r, 'The exact potential of the cloud (drag the probe)');
  const { draw } = SCN;

  ctx.save();
  clipTo(ctx, draw);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, draw.x, draw.y, draw.w, draw.h);

  // contours (marching squares on the exact grid).
  const at = (i, j) => grid[j * gnx + i];
  ctx.strokeStyle = 'rgba(255,255,255,0.26)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let L = -2; L <= 2; L++) {
    if (L === 0) continue;
    const lev = L * 0.45 * Vsc;
    for (let j = 0; j < gny - 1; j++) for (let i = 0; i < gnx - 1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const pts = [];
      const cr = (va, vb, x1, y1, x2, y2) => { if ((va > lev) !== (vb > lev)) { const t = (lev - va) / (vb - va); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
      cr(a, b, gxs[i], gys[j], gxs[i + 1], gys[j]); cr(b, c, gxs[i + 1], gys[j], gxs[i + 1], gys[j + 1]);
      cr(c, d, gxs[i + 1], gys[j + 1], gxs[i], gys[j + 1]); cr(d, a, gxs[i], gys[j + 1], gxs[i], gys[j]);
      if (pts.length >= 2) { ctx.moveTo(WX(pts[0][0]), WY(pts[0][1])); ctx.lineTo(WX(pts[1][0]), WY(pts[1][1])); }
      if (pts.length === 4) { ctx.moveTo(WX(pts[2][0]), WY(pts[2][1])); ctx.lineTo(WX(pts[3][0]), WY(pts[3][1])); }
    }
  }
  ctx.stroke();

  // charges.
  for (const c of charges) {
    const X = WX(c.r[0]), Y = WY(c.r[1]);
    ctx.beginPath(); ctx.arc(X, Y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = c.q > 0 ? col.pos : col.neg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
  }

  // probe circle + point.
  const px = probe.r * Math.cos(probe.th), py = probe.r * Math.sin(probe.th);
  ctx.strokeStyle = 'rgba(255,209,102,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(WX(0), WY(0), probe.r * SCN.scale, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(WX(0), WY(0)); ctx.lineTo(WX(px), WY(py)); ctx.stroke();
  ctx.fillStyle = col.probe; ctx.beginPath(); ctx.arc(WX(px), WY(py), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore();

  // readout strip.
  const P = [px, py, 0];
  const ve = exactPotential(charges, P), va = multipolePotential(charges, order(), P);
  const rel = Math.abs(ve) > 1e-9 ? Math.abs(va - ve) / Math.abs(ve) : 0;
  const items = [
    [selDist.value, col.fg],
    [`r ${probe.r.toFixed(1)}`, col.probe],
    [`V ${ve.toFixed(3)}`, col.fg],
    [`err ${(rel * 100).toFixed(rel < 0.1 ? 1 : 0)}%`, [col.o0, col.o1, col.o2][order()]],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Error of each truncation vs distance (log-log)');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 16, h: r.h - 28 - 42 };
  const rMin = 0.6, rMax = 24, loE = hiE - 7;
  const lr = (rr) => Math.log10(rr);
  const xOf = (rr) => inner.x + (lr(rr) - lr(rMin)) / (lr(rMax) - lr(rMin)) * inner.w;
  const yOf = (e) => inner.y + inner.h - (Math.max(loE, Math.min(hiE, e)) - loE) / (hiE - loE) * inner.h;

  // grid.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = hiE; e >= loE; e -= 1) { const y = yOf(e); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(`1e${e}`, inner.x - 4, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const rr of [1, 3, 10, 24]) ctx.fillText(String(rr), xOf(rr), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // error curves along the current probe direction.
  const cth = Math.cos(probe.th), sth = Math.sin(probe.th);
  const ocol = [col.o0, col.o1, col.o2];
  const N = 80;
  for (let o = 0; o <= 2; o++) {
    ctx.strokeStyle = ocol[o]; ctx.lineWidth = (o === order()) ? 3 : 1.6; ctx.globalAlpha = (o === order()) ? 1 : 0.7;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const rr = rMin * Math.pow(rMax / rMin, i / N);
      const P = [rr * cth, rr * sth, 0];
      const e = Math.abs(multipolePotential(charges, o, P) - exactPotential(charges, P));
      const X = xOf(rr), Y = yOf(Math.log10(Math.max(1e-12, e)));
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // current-r marker.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(probe.r), inner.y); ctx.lineTo(xOf(probe.r), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('distance r (log)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('absolute error', 0, 0); ctx.restore();
  const leg = [['mono', col.o0], ['+dip', col.o1], ['+quad', col.o2]];
  let lx = inner.x + 8; const ly = inner.y + 11;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 15, ly); lx += 56; }
}

function render() {
  if (!REG) relayout();
  if (!charges.length) { loadDist(); rebuild(); }
  if (!heat) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- drag the probe ---
let dragging = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  const px = probe.r * Math.cos(probe.th), py = probe.r * Math.sin(probe.th);
  if ((WX(px) - sx) ** 2 + (WY(py) - sy) ** 2 < 28 * 28) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return; const { sx, sy } = pScreen(ev);
  const wx = invX(sx), wy = invY(sy);
  probe.r = Math.max(0.6, Math.min(VIEW * 1.25, Math.hypot(wx, wy)));
  probe.th = Math.atan2(wy, wx);
  render();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running && !dragging) probe.th += 0.3 * dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); loadDist(); relayout(); render(); }

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const px = probe.r * Math.cos(probe.th), py = probe.r * Math.sin(probe.th), P = [px, py, 0];
  const ve = exactPotential(charges, P), va = multipolePotential(charges, order(), P);
  return {
    fields: [
      { key: 'cloud', label: 'distribution', value: selDist.value, format: 'text' },
      { key: 'r', label: 'probe distance r', value: probe.r, format: 'float' },
      { key: 'V', label: 'exact potential V', value: ve, format: 'float' },
      { key: 'err', label: 'relative error (kept order)', value: Math.abs(ve) > 1e-9 ? Math.abs(va - ve) / Math.abs(ve) : 0, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Each extra term improves the approximation: the error is monotone
    // non-increasing in the truncation order (outside the cluster).
    const px = probe.r * Math.cos(probe.th), py = probe.r * Math.sin(probe.th), P = [px, py, 0];
    const ve = exactPotential(charges, P);
    const e0 = Math.abs(multipolePotential(charges, 0, P) - ve);
    const e1 = Math.abs(multipolePotential(charges, 1, P) - ve);
    const e2 = Math.abs(multipolePotential(charges, 2, P) - ve);
    const ok = e1 <= e0 * 1.001 + 1e-12 && e2 <= e1 * 1.001 + 1e-12;
    const rel = Math.abs(ve) > 1e-9 ? e2 / Math.abs(ve) : 0;
    return [{
      key: 'converge',
      label: 'error drops with each order (rel @ probe)',
      value: rel.toExponential(2),
      status: ok ? 'pass' : 'pending',
    }];
  } catch (e) {
    return [];
  }
};
