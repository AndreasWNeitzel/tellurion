import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the path-dependence of a line integral, Canvas2D
// only. Top region: a vector field with two endpoints and three routes
// between them (straight, arc, and a draggable bent path), or a closed
// loop. Bottom region: the running integral of F.dr along each route
// versus progress, ending at the same value for a conservative field or
// splitting apart otherwise.
//
// Reference: Riley, Hobson, Bence, Mathematical Methods for Physics and
// Engineering, 3rd ed., Ch. 11.

import { FIELDS, arcPath, bezierPath, closedLoopIntegral } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selField = document.getElementById('select-field');
const selRoutes = document.getElementById('select-routes');
const valueField = document.getElementById('value-field');
const valueRoutes = document.getElementById('value-routes');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const VIEW = 2.6, M = 160;
let running = !DETERMINISTIC;
let A = { x: -1.5, y: -0.7 }, B = { x: 1.5, y: 0.6 }, C = { x: 0.1, y: 1.7 };
let tphase = 0;

function field() { return FIELDS[selField.value]; }
function isLoop() { return selRoutes.value === 'loop'; }
function syncVals() {
  valueField.textContent = { rotation: 'rotation', shear: 'shear', conservative1: 'grad φ', conservative2: 'grad φ' }[selField.value];
  valueRoutes.textContent = isLoop() ? 'loop' : 'all';
}
selField.addEventListener('change', () => { syncVals(); render(); });
selRoutes.addEventListener('change', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selField.value = 'rotation'; selRoutes.value = 'all';
  A = { x: -1.5, y: -0.7 }; B = { x: 1.5, y: 0.6 }; C = { x: 0.1, y: 1.7 };
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); render();
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
    { name: 'scene', weight: 1.95 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
  computeSceneTransform();
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
    A: '#67d98c', B: '#ef5466', C: '#ffd166',
    straight: '#5bc0eb', arc: '#ff9f43', bent: '#c77dff',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// sample positions of each route as a polyline of M+1 points.
function samplePts(kind) {
  const pts = [];
  if (kind === 'straight') { for (let i = 0; i <= M; i++) { const t = i / M; pts.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t }); } }
  else if (kind === 'arc') { const ap = arcPath(A, B); for (let i = 0; i <= M; i++) { const t = i / M; pts.push({ x: ap.x(t), y: ap.y(t) }); } }
  else if (kind === 'bent') { const bz = bezierPath(A, C, B); for (let i = 0; i <= M; i++) { const t = i / M; pts.push({ x: bz.x(t), y: bz.y(t) }); } }
  else if (kind === 'loop') {
    for (let i = 0; i <= M; i++) { const t = i / M; pts.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t }); }   // A->B straight
    const ap = arcPath(A, B);
    for (let i = 1; i <= M; i++) { const s = 1 - i / M; pts.push({ x: ap.x(s), y: ap.y(s) }); }                            // B->A arc
  }
  return pts;
}
// cumulative integral of F.dr along a polyline.
function cumulative(f, pts) {
  const G = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const mx = 0.5 * (a.x + b.x), my = 0.5 * (a.y + b.y);
    G.push(G[i - 1] + f.P(mx, my) * (b.x - a.x) + f.Q(mx, my) * (b.y - a.y));
  }
  return G;
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

let routeData = [];   // [{kind,color,pts,G}]
function buildRoutes(f) {
  routeData = [];
  if (isLoop()) {
    const pts = samplePts('loop');
    routeData.push({ kind: 'loop', color: colors().straight, pts, G: cumulative(f, pts) });
  } else {
    for (const [kind, color] of [['straight', colors().straight], ['arc', colors().arc], ['bent', colors().bent]]) {
      const pts = samplePts(kind);
      routeData.push({ kind, color, pts, G: cumulative(f, pts) });
    }
  }
}

function drawArrow(x1, y1, x2, y2, color, lw) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1), h = 6;
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4)); ctx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
}

function drawScene(col, r) {
  const f = field();
  panel(col, r, isLoop() ? 'A round trip: out straight, back by the arc' : 'Same endpoints, different routes (drag them)');
  const { draw } = SCN;

  ctx.save();
  clipTo(ctx, draw);

  // field quiver.
  const NG = 11; let fmax = 1e-6;
  const samp = [];
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
    const x = -VIEW + 2 * VIEW * (i + 0.5) / NG, y = -VIEW + 2 * VIEW * (j + 0.5) / NG;
    const fx = f.P(x, y), fy = f.Q(x, y), m = Math.hypot(fx, fy);
    samp.push({ x, y, fx, fy, m }); fmax = Math.max(fmax, m);
  }
  const cell = 2 * VIEW / NG * SCN.scale;
  for (const s of samp) {
    const m = s.m / fmax; if (m < 1e-3) continue;
    const ux = s.fx / (s.m || 1), uy = s.fy / (s.m || 1), L = cell * 0.42;
    const c = viridis(0.2 + 0.7 * m);
    ctx.globalAlpha = 0.5 + 0.4 * m;
    drawArrow(WX(s.x) - ux * L, WY(s.y) + uy * L, WX(s.x) + ux * L, WY(s.y) - uy * L, `rgb(${c.r},${c.g},${c.b})`, 1.4);
  }
  ctx.globalAlpha = 1;

  // enclosed area shade for loop mode.
  if (isLoop()) {
    ctx.fillStyle = 'rgba(91,192,235,0.10)';
    ctx.beginPath(); routeData[0].pts.forEach((p, i) => { const X = WX(p.x), Y = WY(p.y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill();
  }

  // routes.
  for (const rt of routeData) {
    ctx.strokeStyle = rt.color; ctx.lineWidth = 3; ctx.beginPath();
    rt.pts.forEach((p, i) => { const X = WX(p.x), Y = WY(p.y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
    // moving marker.
    const k = Math.min(rt.pts.length - 1, Math.round(tphase * (rt.pts.length - 1)));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(WX(rt.pts[k].x), WY(rt.pts[k].y), 4, 0, 2 * Math.PI); ctx.fill();
  }

  // bent-path handle (only in all mode).
  if (!isLoop()) {
    ctx.strokeStyle = 'rgba(199,125,255,0.4)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(WX(A.x), WY(A.y)); ctx.lineTo(WX(C.x), WY(C.y)); ctx.lineTo(WX(B.x), WY(B.y)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.C; ctx.beginPath(); ctx.arc(WX(C.x), WY(C.y), 6, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // endpoints.
  for (const [pt, c, lab] of [[A, col.A, 'A'], [B, col.B, 'B']]) {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(WX(pt.x), WY(pt.y), 8, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'tick', 'mono', 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, WX(pt.x), WY(pt.y) + 1);
  }

  ctx.restore();

  // readout strip.
  const cons = f.isConservative;
  let items;
  if (isLoop()) {
    const cl = routeData[0].G[routeData[0].G.length - 1];
    items = [
      [valueField.textContent, col.fg],
      [`loop ∮ ${cl.toFixed(2)}`, col.straight],
      [cons ? 'conservative' : 'has curl', cons ? col.A : col.accent],
      [Math.abs(cl) < 1e-3 ? 'round trip = 0' : 'net circulation', col.muted],
    ];
  } else {
    const gs = routeData[0].G[M], ga = routeData[1].G[M];
    items = [
      [valueField.textContent, col.fg],
      [`straight ${gs.toFixed(2)}`, col.straight],
      [`arc ${ga.toFixed(2)}`, col.arc],
      [cons ? 'path-independent' : 'path-dependent', cons ? col.A : col.accent],
    ];
  }
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, isLoop() ? 'Running integral around the loop' : 'Running integral ∫F·dr along each route');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 42 };
  let mx = 1e-6;
  for (const rt of routeData) for (const g of rt.G) mx = Math.max(mx, Math.abs(g));
  mx *= 1.12;
  const cy = inner.y + inner.h / 2;
  const xOf = (frac) => inner.x + frac * inner.w;
  const yOf = (g) => cy - (g / mx) * (inner.h / 2);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, cy); ctx.lineTo(inner.x + inner.w, cy); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(mx.toFixed(1), inner.x - 5, yOf(mx)); ctx.fillText('0', inner.x - 5, cy);

  for (const rt of routeData) {
    ctx.strokeStyle = rt.color; ctx.lineWidth = 2.6; ctx.beginPath();
    rt.G.forEach((g, i) => { const X = xOf(i / (rt.G.length - 1)), Y = yOf(g); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
    // endpoint dot.
    ctx.fillStyle = rt.color; ctx.beginPath(); ctx.arc(xOf(1), yOf(rt.G[rt.G.length - 1]), 4.5, 0, 2 * Math.PI); ctx.fill();
  }

  // current-progress cursor.
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(tphase), inner.y); ctx.lineTo(xOf(tphase), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(isLoop() ? 'progress around loop' : 'progress A → B', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('accumulated ∫F·dr', 0, 0); ctx.restore();
  if (!isLoop()) {
    const leg = [['straight', col.straight], ['arc', col.arc], ['bent', col.bent]];
    let lx = inner.x + 8; const ly = inner.y + 11;
    ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 12, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 15, ly); lx += 66; }
  }
}

function render() {
  if (!REG) relayout();
  buildRoutes(field());
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- drag A, B, C ---
let drag = null;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  const cand = isLoop() ? [['A', A], ['B', B]] : [['A', A], ['B', B], ['C', C]];
  let best = null, bd = 24 * 24;
  for (const [name, pt] of cand) { const d = (WX(pt.x) - sx) ** 2 + (WY(pt.y) - sy) ** 2; if (d < bd) { bd = d; best = name; } }
  if (best) { drag = best; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return; const { sx, sy } = pScreen(ev);
  const wx = Math.max(-VIEW + 0.1, Math.min(VIEW - 0.1, invX(sx))), wy = Math.max(-VIEW + 0.1, Math.min(VIEW - 0.1, invY(sy)));
  const pt = drag === 'A' ? A : drag === 'B' ? B : C; pt.x = wx; pt.y = wy;
  render();
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) { tphase += 0.28 * dt; if (tphase > 1) tphase -= 1; }
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); relayout(); tphase = 0.6; render(); }

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
  const f = field();
  const gs = cumulative(f, samplePts('straight'))[M], ga = cumulative(f, samplePts('arc'))[M];
  return {
    fields: [
      { key: 'field', label: 'field', value: f.label, format: 'text' },
      { key: 'straight', label: '∫ straight', value: gs, format: 'float' },
      { key: 'arc', label: '∫ arc', value: ga, format: 'float' },
      { key: 'spread', label: 'path dependence |Δ|', value: Math.abs(gs - ga), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Stokes' theorem: the closed-loop integral equals the curl flux
    // through the enclosed half-disk (curl is constant for these fields).
    const f = field();
    const h = 1e-3, mx = 0.5 * (A.x + B.x), my = 0.5 * (A.y + B.y);
    const curl = (f.Q(mx + h, my) - f.Q(mx - h, my)) / (2 * h) - (f.P(mx, my + h) - f.P(mx, my - h)) / (2 * h);
    const rad = 0.5 * Math.hypot(B.x - A.x, B.y - A.y);
    const area = 0.5 * Math.PI * rad * rad;
    const cl = closedLoopIntegral(selField.value, A, B);
    const stokes = curl * area;
    const denom = Math.max(1e-6, Math.abs(stokes));
    const rel = Math.abs(Math.abs(cl) - Math.abs(stokes)) / denom;
    return [{
      key: 'stokes',
      label: '∮F·dr = curl × area (Stokes)',
      value: rel.toExponential(2),
      status: rel < 5e-2 ? 'pass' : (rel < 2e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
