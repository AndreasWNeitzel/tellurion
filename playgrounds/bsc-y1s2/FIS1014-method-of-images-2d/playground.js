import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the method of images, Canvas2D only. Top region:
// a point charge above a grounded conducting plane, its field lines
// bending in to strike the surface perpendicular, the induced surface
// charge pooling beneath it, and an optional image charge that
// reproduces the same field above the plane. Bottom region: the induced
// surface charge density along the plane, a bell whose integral is minus
// the real charge.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec. 3.2.

import { inducedSigma, totalInducedCharge } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selView = document.getElementById('select-view');
const selSign = document.getElementById('select-sign');
const valueView = document.getElementById('value-view');
const valueSign = document.getElementById('value-sign');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const W = 2.6, PLANE_FRAC = 0.72;
let running = !DETERMINISTIC;
let chg = { a: 0.0, b: 1.4 };       // real charge position (b > 0 above plane)
let q = 1;                          // sign
let lines = [];
let phase = 0;

function syncVals() {
  valueView.textContent = selView.value === 'image' ? 'image' : 'conductor';
  valueSign.textContent = selSign.value === 'neg' ? '−' : '+';
  q = selSign.value === 'neg' ? -1 : 1;
}
selView.addEventListener('change', () => { syncVals(); retrace(); render(); });
selSign.addEventListener('change', () => { syncVals(); retrace(); render(); });
btnReset.addEventListener('click', () => {
  selView.value = 'conductor'; selSign.value = 'pos'; chg = { a: 0.0, b: 1.4 };
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); retrace(); render();
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
  const scale = draw.w / (2 * W);
  SCN = { draw, ox: draw.x + draw.w / 2, planeY: draw.y + draw.h * PLANE_FRAC, scale };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.0 },
  ]);
  computeSceneTransform();
  retrace();
}
const WX = (x) => SCN.ox + x * SCN.scale;
const WY = (y) => SCN.planeY - y * SCN.scale;
const invX = (sx) => (sx - SCN.ox) / SCN.scale;
const invY = (sy) => (SCN.planeY - sy) / SCN.scale;

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    pos: '#ef5466', neg: '#5b8def', line: 'rgba(232,237,247,0.8)',
    metal: '#3a4150', sigma: '#5b8def',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// Full field of the real charge q at (a,b) and image -q at (a,-b).
function dipField(x, y) {
  const a = chg.a, b = chg.b;
  const dx1 = x - a, dy1 = y - b, r1 = Math.hypot(dx1, dy1) + 1e-6, r13 = r1 * r1 * r1;
  const dx2 = x - a, dy2 = y + b, r2 = Math.hypot(dx2, dy2) + 1e-6, r23 = r2 * r2 * r2;
  return { ex: q * dx1 / r13 - q * dx2 / r23, ey: q * dy1 / r13 - q * dy2 / r23 };
}
function retrace() {
  const NL = 24, ds = 0.04, maxSteps = 600;
  const conductor = selView.value !== 'image';
  lines = [];
  for (let i = 0; i < NL; i++) {
    const th = 2 * Math.PI * (i + 0.5) / NL;
    let x = chg.a + 0.12 * Math.cos(th), y = chg.b + 0.12 * Math.sin(th);
    const pts = [[x, y]];
    for (let s = 0; s < maxSteps; s++) {
      const f = dipField(x, y); const m = Math.hypot(f.ex, f.ey); if (m < 1e-7) break;
      x += q * f.ex / m * ds; y += q * f.ey / m * ds;
      if (conductor && y <= 0.0) { // clip to the plane crossing
        const yp = pts[pts.length - 1][1]; const t = yp / (yp - y);
        pts.push([pts[pts.length - 1][0] + t * (x - pts[pts.length - 1][0]), 0]); break;
      }
      pts.push([x, y]);
      // terminate near the image (opposite-sign sink) in reveal mode.
      if (!conductor && Math.hypot(x - chg.a, y + chg.b) < 0.06) break;
      if (Math.abs(x) > W * 1.4 || Math.abs(y) > 3.6) break;
    }
    lines.push(pts);
  }
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

function drawDisc(col, x, y, sgn, ghost) {
  const X = WX(x), Y = WY(y);
  ctx.globalAlpha = ghost ? 0.5 : 1;
  ctx.beginPath(); ctx.arc(X, Y, 12, 0, 2 * Math.PI);
  ctx.fillStyle = sgn > 0 ? col.pos : col.neg; ctx.fill();
  ctx.strokeStyle = ghost ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
  if (ghost) ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'heading', 'sans', 800);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sgn > 0 ? '+' : '−', X, Y + 1);
  ctx.globalAlpha = 1;
}

function drawScene(col, r) {
  const conductor = selView.value !== 'image';
  panel(col, r, conductor ? 'A charge above a grounded conductor' : 'The image: conductor replaced by a mirror charge');
  const { draw } = SCN;

  ctx.save();
  clipTo(ctx, draw);

  // conductor body (below the plane) in conductor mode.
  if (conductor) {
    ctx.fillStyle = col.metal; ctx.fillRect(draw.x, SCN.planeY, draw.w, draw.y + draw.h - SCN.planeY);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    for (let hx = draw.x - draw.h; hx < draw.x + draw.w; hx += 12) { ctx.beginPath(); ctx.moveTo(hx, draw.y + draw.h); ctx.lineTo(hx + (draw.y + draw.h - SCN.planeY), SCN.planeY); ctx.stroke(); }
  }
  // the plane line / mirror.
  ctx.strokeStyle = conductor ? 'rgba(220,228,240,0.9)' : 'rgba(150,160,175,0.5)';
  ctx.lineWidth = conductor ? 3 : 1.5; if (!conductor) ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(draw.x, SCN.planeY); ctx.lineTo(draw.x + draw.w, SCN.planeY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(conductor ? 'grounded plane  V = 0' : 'mirror plane', draw.x + 6, SCN.planeY - 4);

  // field lines.
  ctx.strokeStyle = col.line; ctx.lineWidth = 1.4;
  for (const pts of lines) {
    ctx.beginPath();
    pts.forEach((p, i) => { const X = WX(p[0]), Y = WY(p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
  }
  // marching arrowheads.
  ctx.fillStyle = '#fff'; const spacing = 0.85;
  for (const pts of lines) {
    const len = (pts.length - 1) * 0.04;
    for (let sdist = (phase % spacing); sdist < len - 0.05; sdist += spacing) {
      const idx = Math.max(1, Math.min(pts.length - 1, Math.round(sdist / 0.04)));
      const x = pts[idx][0], y = pts[idx][1], px = pts[idx - 1][0], py = pts[idx - 1][1];
      const ang = Math.atan2(WY(y) - WY(py), WX(x) - WX(px)); const X = WX(x), Y = WY(y), h = 5;
      ctx.beginPath(); ctx.moveTo(X + h * Math.cos(ang), Y + h * Math.sin(ang));
      ctx.lineTo(X + h * Math.cos(ang + 2.5), Y + h * Math.sin(ang + 2.5));
      ctx.lineTo(X + h * Math.cos(ang - 2.5), Y + h * Math.sin(ang - 2.5));
      ctx.closePath(); ctx.fill();
    }
  }

  // induced surface charge sigma(x) drawn on the plane.
  const sigPeak = Math.abs(inducedSigma(0, q, chg.b)) || 1e-6;
  const kSig = 0.5 / sigPeak;
  ctx.fillStyle = q > 0 ? 'rgba(91,141,239,0.55)' : 'rgba(239,84,102,0.55)';
  ctx.beginPath(); ctx.moveTo(WX(-W), SCN.planeY);
  for (let i = 0; i <= 120; i++) { const x = -W + 2 * W * i / 120; const sig = inducedSigma(x - chg.a, q, chg.b); ctx.lineTo(WX(x), WY(sig * kSig)); }
  ctx.lineTo(WX(W), SCN.planeY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(q > 0 ? 'induced − charge' : 'induced + charge', WX(chg.a), SCN.planeY + 6);

  // image charge (reveal mode).
  if (!conductor) drawDisc(col, chg.a, -chg.b, -q, true);

  // attraction (image force) on the real charge, toward the plane.
  const Fmag = 1 / (4 * chg.b * chg.b);
  const L = Math.min(0.7, 0.2 + 0.5 * Math.tanh(Fmag));
  const tX = WX(chg.a), tY = WY(chg.b), eY = WY(chg.b - L);
  ctx.strokeStyle = col.accent; ctx.fillStyle = col.accent; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(tX, eY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tX, eY); ctx.lineTo(tX - 5, eY - 8); ctx.lineTo(tX + 5, eY - 8); ctx.closePath(); ctx.fill();

  // real charge.
  drawDisc(col, chg.a, chg.b, q, false);

  ctx.restore();

  // readout strip.
  const items = [
    [conductor ? 'conductor' : 'image', col.fg],
    [`height ${chg.b.toFixed(2)}`, col.accent],
    [`pull ${Fmag.toFixed(2)}`, col.accent],
    [`induced ${q > 0 ? '−' : '+'}q`, col.sigma],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Induced surface charge σ(x) along the plane');

  const inner = { x: r.x + 48, y: r.y + 28, w: r.w - 48 - 16, h: r.h - 28 - 42 };
  const N = 220;
  const sig = [];
  let mx = 1e-9;
  for (let i = 0; i <= N; i++) { const x = -W + 2 * W * i / N; const s = inducedSigma(x - chg.a, q, chg.b); sig.push([x, s]); mx = Math.max(mx, Math.abs(s)); }
  const cy = inner.y + inner.h / 2;
  const xOf = (x) => inner.x + (x + W) / (2 * W) * inner.w;
  const yOf = (s) => cy - (s / mx) * (inner.h / 2) * 0.88;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, cy); ctx.lineTo(inner.x + inner.w, cy); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of [-2, -1, 0, 1, 2]) ctx.fillText(String(x), xOf(x), inner.y + inner.h + 6);

  // filled curve.
  ctx.fillStyle = q > 0 ? 'rgba(91,141,239,0.30)' : 'rgba(239,84,102,0.30)';
  ctx.beginPath(); ctx.moveTo(xOf(-W), cy);
  for (const [x, s] of sig) ctx.lineTo(xOf(x), yOf(s));
  ctx.lineTo(xOf(W), cy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = q > 0 ? col.sigma : col.pos; ctx.lineWidth = 2.4; ctx.beginPath();
  sig.forEach(([x, s], i) => { const X = xOf(x), Y = yOf(s); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.stroke();

  // marker under the charge.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(chg.a), inner.y); ctx.lineTo(xOf(chg.a), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);

  // labels + total.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('position along the plane  x', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('charge density σ', 0, 0); ctx.restore();
  const tot = totalInducedCharge(q, chg.b);
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`total induced charge = ${tot.toFixed(2)}  =  ${q > 0 ? '−' : '+'}q`, inner.x + 6, inner.y + 6);
}

function render() {
  if (!REG) relayout();
  if (!lines.length) retrace();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- drag the real charge ---
let dragging = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  if ((WX(chg.a) - sx) ** 2 + (WY(chg.b) - sy) ** 2 < 26 * 26) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return; const { sx, sy } = pScreen(ev);
  chg.a = Math.max(-W + 0.2, Math.min(W - 0.2, invX(sx)));
  chg.b = Math.max(0.3, Math.min(2.7, invY(sy)));
  retrace(); render();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) phase += 0.55 * dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals(); relayout(); render();
}

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
  return {
    fields: [
      { key: 'height', label: 'charge height $b$', value: chg.b, format: 'float' },
      { key: 'x', label: 'charge position $a$', value: chg.a, format: 'float' },
      { key: 'force', label: 'image force (attractive)', value: 1 / (4 * chg.b * chg.b), format: 'float' },
      { key: 'induced', label: 'total induced charge', value: totalInducedCharge(q, chg.b), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // The induced surface charge integrates to exactly minus the real charge.
    const tot = totalInducedCharge(q, chg.b);
    const rel = Math.abs(tot + q) / Math.abs(q);
    return [{
      key: 'induced',
      label: 'total induced charge = −q (rel.)',
      value: rel.toExponential(2),
      status: rel < 5e-2 ? 'pass' : (rel < 1.5e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
