import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the electric field of point charges, Canvas2D
// only. Top region: field lines (integral curves of E) flowing over a
// field-magnitude map; the charges are draggable and the pattern
// reshapes live. Bottom region: the field magnitude along the central
// horizontal line y = 0, spiking at charges and vanishing at nulls.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Ch. 2.

import { field, traceLine, PRESETS, BOX } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selPreset = document.getElementById('select-preset');
const sliderDensity = document.getElementById('slider-density');
const valuePreset = document.getElementById('value-preset');
const valueDensity = document.getElementById('value-density');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const VIEW = 2.0;
let running = !DETERMINISTIC;
let charges = [];
let lines = [];               // [{xs, ys, ds}]
let heat = null;              // offscreen canvas
let sceneCache = null;        // offscreen: heatmap + static field lines
let diagCurve = null;         // cached |E|(x,0) samples for the diagnostic
let phase = 0;

function clonePreset(name) { return PRESETS[name].map((c) => ({ x: c.x, y: c.y, q: c.q })); }
function loadPreset() { charges = clonePreset(selPreset.value); }

function syncVals() {
  valuePreset.textContent = { dipole: 'dipole', 'two-plus': 'two +', quadrupole: 'quadrupole', 'mono-plus': 'single +' }[selPreset.value];
  valueDensity.textContent = parseFloat(sliderDensity.value).toFixed(0);
}
selPreset.addEventListener('change', () => { syncVals(); loadPreset(); recompute(); render(); });
sliderDensity.addEventListener('input', () => { syncVals(); recompute(); render(); });
btnReset.addEventListener('click', () => {
  selPreset.value = 'dipole'; sliderDensity.value = '16';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); loadPreset(); recompute(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
let SCN = null;               // scene transform {draw, ox, oy, scale}
function computeSceneTransform() {
  const r = REG.scene;
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const scale = Math.min(draw.w, draw.h) / (2 * VIEW);
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.0 },
  ]);
  computeSceneTransform();
  recompute();
}
const WX = (wx) => SCN.ox + wx * SCN.scale;
const WY = (wy) => SCN.oy - wy * SCN.scale;
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
    pos: '#ef5466', neg: '#5b8def', line: 'rgba(232,237,247,0.82)',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// Rebuild the traced field lines and the field-magnitude heatmap.
function recompute() {
  if (!SCN) return;
  const density = parseFloat(sliderDensity.value);
  // emission: from positive charges (lines run + -> -). If none, from negatives.
  const pos = charges.filter((c) => c.q > 0);
  const useNeg = pos.length === 0;
  const src = useNeg ? charges : pos;
  const sign = useNeg ? -1 : 1;
  const emit = [];
  for (const c of src) {
    const n = Math.max(5, Math.round(density * Math.abs(c.q)));
    for (let i = 0; i < n; i++) {
      const th = 2 * Math.PI * (i + 0.5) / n;
      emit.push({ x: c.x + 0.09 * Math.cos(th), y: c.y + 0.09 * Math.sin(th) });
    }
  }
  lines = emit.map((e) => { const l = traceLine(e.x, e.y, charges, sign, 9.0, 0.045); return { xs: l.xs, ys: l.ys, ds: 0.045 }; });

  // heatmap over the scene window.
  const { draw } = SCN;
  const nx = Math.max(24, Math.round(draw.w / 8)), ny = Math.max(24, Math.round(draw.h / 8));
  if (!heat) heat = document.createElement('canvas');
  heat.width = nx; heat.height = ny;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(nx, ny);
  for (let j = 0; j < ny; j++) {
    const wy = invY(draw.y + (j + 0.5) / ny * draw.h);
    for (let i = 0; i < nx; i++) {
      const wx = invX(draw.x + (i + 0.5) / nx * draw.w);
      const { Ex, Ey } = field(wx, wy, charges);
      const mag = Math.hypot(Ex, Ey);
      const t = mag / (mag + 1.6);
      const c = viridis(0.12 + 0.82 * t);
      const a = Math.min(0.52, 0.62 * Math.pow(t, 0.8));
      const o = (j * nx + i) * 4;
      img.data[o] = c.r; img.data[o + 1] = c.g; img.data[o + 2] = c.b; img.data[o + 3] = a * 255;
    }
  }
  hctx.putImageData(img, 0, 0);

  // Cache the |E|(x, 0) samples for the diagnostic (static between drags), so
  // the per-frame path does not call field() 240 times every frame.
  const xMinW = invX(draw.x), xMaxW = invX(draw.x + draw.w);
  diagCurve = [];
  const Nd = 240;
  for (let i = 0; i <= Nd; i++) {
    const wx = xMinW + (xMaxW - xMinW) * i / Nd;
    const { Ex, Ey } = field(wx, 0, charges);
    diagCurve.push({ wx, m: Math.hypot(Ex, Ey) });
  }

  buildSceneCache();
}

// The heatmap and the traced field lines are static until a charge moves, the
// preset changes, or the canvas resizes; only the flowing arrowheads animate.
// Render that static layer once into an offscreen canvas and blit it each
// frame, so the animation loop stays at full framerate instead of re-stroking
// every line on every frame.
function buildSceneCache() {
  if (!SCN || !heat) return;
  const dpr = view.dpr || 1;
  if (!sceneCache) sceneCache = document.createElement('canvas');
  sceneCache.width = Math.max(1, Math.round(view.w * dpr));
  sceneCache.height = Math.max(1, Math.round(view.h * dpr));
  const cc = sceneCache.getContext('2d');
  cc.setTransform(dpr, 0, 0, dpr, 0, 0);
  cc.clearRect(0, 0, view.w, view.h);
  const { draw } = SCN;
  cc.imageSmoothingEnabled = true;
  cc.drawImage(heat, draw.x, draw.y, draw.w, draw.h);
  cc.save();
  cc.beginPath(); cc.rect(draw.x, draw.y, draw.w, draw.h); cc.clip();
  cc.strokeStyle = colors().line; cc.lineWidth = 1.4;
  for (const l of lines) {
    cc.beginPath();
    for (let i = 0; i < l.xs.length; i++) { const X = WX(l.xs[i]), Y = WY(l.ys[i]); if (i) cc.lineTo(X, Y); else cc.moveTo(X, Y); }
    cc.stroke();
  }
  cc.restore();
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

function drawCharge(col, c) {
  const X = WX(c.x), Y = WY(c.y), rad = 9 + 4 * (Math.abs(c.q) - 1);
  ctx.beginPath(); ctx.arc(X, Y, rad, 0, 2 * Math.PI);
  ctx.fillStyle = c.q > 0 ? col.pos : col.neg; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'heading', 'sans', 800);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(c.q > 0 ? '+' : '−', X, Y + 1);
}

function drawScene(col, r) {
  panel(col, r, 'Field lines over the field-strength map (drag a charge)');
  const { draw } = SCN;

  // Static layer (heatmap + field lines), prerendered in recompute().
  if (sceneCache) ctx.drawImage(sceneCache, 0, 0, view.w, view.h);

  ctx.save();
  clipTo(ctx, draw);

  // flowing arrowheads (direction of E, + to -).
  ctx.fillStyle = '#ffffff';
  const spacing = 0.95;
  for (const l of lines) {
    const len = (l.xs.length - 1) * l.ds;
    if (len < 0.4) continue;
    for (let s = (phase % spacing); s < len - 0.05; s += spacing) {
      const idx = Math.max(1, Math.min(l.xs.length - 1, Math.round(s / l.ds)));
      const x = l.xs[idx], y = l.ys[idx], px = l.xs[idx - 1], py = l.ys[idx - 1];
      const ang = Math.atan2(WY(y) - WY(py), WX(x) - WX(px));
      const X = WX(x), Y = WY(y), h = 5.5;
      ctx.beginPath();
      ctx.moveTo(X + h * Math.cos(ang), Y + h * Math.sin(ang));
      ctx.lineTo(X + h * Math.cos(ang + 2.5), Y + h * Math.sin(ang + 2.5));
      ctx.lineTo(X + h * Math.cos(ang - 2.5), Y + h * Math.sin(ang - 2.5));
      ctx.closePath(); ctx.fill();
    }
  }

  for (const c of charges) drawCharge(col, c);

  ctx.restore();

  // readout strip.
  const net = charges.reduce((s, c) => s + c.q, 0);
  const items = [
    [{ dipole: 'dipole', 'two-plus': 'two +', quadrupole: 'quadrupole', 'mono-plus': 'single +' }[selPreset.value], col.fg],
    [`charges ${charges.length}`, col.muted],
    [`net q ${net > 0 ? '+' : ''}${net}`, net > 0 ? col.pos : (net < 0 ? col.neg : col.muted)],
    [`lines ${lines.length}`, col.line],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Field strength along the horizontal axis y = 0');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 42 };
  const xMinW = invX(SCN.draw.x), xMaxW = invX(SCN.draw.x + SCN.draw.w);
  const N = 240, EMAX = 12;
  const xOf = (wx) => inner.x + (wx - xMinW) / (xMaxW - xMinW) * inner.w;
  const yOf = (m) => inner.y + inner.h - Math.min(1, m / EMAX) * inner.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 2; k++) { const m = EMAX * k / 2; const y = yOf(m); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(k === 2 ? `${EMAX}+` : m.toFixed(0), inner.x - 6, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const wx of [-2, -1, 0, 1, 2]) if (wx >= xMinW && wx <= xMaxW) ctx.fillText(String(wx), xOf(wx), inner.y + inner.h + 6);

  // charge position markers.
  for (const c of charges) {
    if (c.x < xMinW || c.x > xMaxW) continue;
    ctx.strokeStyle = c.q > 0 ? 'rgba(239,84,102,0.5)' : 'rgba(91,141,239,0.5)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xOf(c.x), inner.y); ctx.lineTo(xOf(c.x), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  }

  // |E|(x, 0), from the cached samples (recomputed only when charges move).
  const curve = diagCurve || [];
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.4; ctx.beginPath();
  ctx.save(); ctx.beginPath(); ctx.rect(inner.x, inner.y, inner.w, inner.h); ctx.clip();
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i < curve.length; i++) {
    const X = xOf(curve[i].wx), Y = yOf(curve[i].m);
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.stroke();
  ctx.restore();

  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('x position', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('field strength |E|', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!charges.length) { loadPreset(); recompute(); }
  if (!heat) recompute();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- charge dragging ---
let dragIdx = -1;
function pointerWorld(ev) {
  const rect = canvas.getBoundingClientRect();
  const sx = (ev.clientX - rect.left), sy = (ev.clientY - rect.top);
  return { sx, sy, wx: invX(sx), wy: invY(sy) };
}
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return;
  const { sx, sy } = pointerWorld(ev);
  let best = -1, bd = 22 * 22;
  charges.forEach((c, i) => { const dx = WX(c.x) - sx, dy = WY(c.y) - sy; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } });
  if (best >= 0) { dragIdx = best; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (dragIdx < 0) return;
  const { wx, wy } = pointerWorld(ev);
  const lim = BOX - 0.2;
  charges[dragIdx].x = Math.max(-lim, Math.min(lim, wx));
  charges[dragIdx].y = Math.max(-lim, Math.min(lim, wy));
  recompute(); render();
});
const endDrag = () => { dragIdx = -1; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) phase += 1.4 * dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  loadPreset();
  relayout();
  render();
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
  const net = charges.reduce((s, c) => s + c.q, 0);
  const e0 = field(0, 0, charges);
  return {
    fields: [
      { key: 'layout', label: 'layout', value: { dipole: 'dipole', 'two-plus': 'two +', quadrupole: 'quadrupole', 'mono-plus': 'single +' }[selPreset.value], format: 'text' },
      { key: 'charges', label: 'point charges', value: charges.length, format: 'int' },
      { key: 'net', label: 'net charge', value: net, format: 'float' },
      { key: 'ecenter', label: 'field at centre $|E|$', value: Math.hypot(e0.Ex, e0.Ey), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Gauss's law in vacuum: div E = 0 away from any charge. Central
    // differences at a fixed probe in empty space.
    const px = 1.3, py = 0.9, h = 1e-3;
    const near = charges.some((c) => Math.hypot(c.x - px, c.y - py) < 0.25);
    if (near) return [{ key: 'divE', label: 'div E = 0 in vacuum', value: 'n/a (charge near probe)', status: 'pending' }];
    const exP = field(px + h, py, charges).Ex, exM = field(px - h, py, charges).Ex;
    const eyP = field(px, py + h, charges).Ey, eyM = field(px, py - h, charges).Ey;
    const div = Math.abs((exP - exM) / (2 * h) + (eyP - eyM) / (2 * h));
    return [{
      key: 'divE',
      label: 'div E = 0 in vacuum (Gauss)',
      value: div.toExponential(2),
      status: div < 1e-3 ? 'pass' : (div < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
