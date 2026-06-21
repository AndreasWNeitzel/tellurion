import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for Gauss's law in 2D, Canvas2D only. Top region: the
// field of point charges streaming (advected tracer dots) through a
// Gaussian loop that can be dragged, resized and deformed, with the
// outflow (red) and inflow (blue) marked along it. Bottom region: the
// flux contribution E.n around the loop, whose signed area is the total
// flux, equal to the enclosed charge over epsilon-zero.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Ch. 2.

import { field, ellipse, blob, flux, EPS0 } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selCharges = document.getElementById('select-charges');
const selShape = document.getElementById('select-shape');
const sliderSize = document.getElementById('slider-size');
const valueCharges = document.getElementById('value-charges');
const valueShape = document.getElementById('value-shape');
const valueSize = document.getElementById('value-size');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const Qe = 1e-9;                 // unit charge (1 nC)
const N0 = Qe / EPS0;            // flux per enclosed unit charge
const VIEW = 2.4;
let running = !DETERMINISTIC;
let charges = [];
let loop = { cx: 0, cy: 0, size: 1.15, shape: 'circle' };
let heat = null;
let tracers = [];
let spawnK = 0;

const CHARGE_SETS = {
  single: [{ x: 0, y: 0, q: 1 }],
  'two-plus': [{ x: -0.6, y: 0, q: 1 }, { x: 0.6, y: 0, q: 1 }],
  pair: [{ x: -0.65, y: 0, q: 1 }, { x: 0.65, y: 0, q: -1 }],
};
function loadCharges() { charges = CHARGE_SETS[selCharges.value].map((c) => ({ ...c })); }

function syncVals() {
  valueCharges.textContent = { single: 'one +', 'two-plus': 'two +', pair: '+ and -' }[selCharges.value];
  valueShape.textContent = selShape.value;
  valueSize.textContent = parseFloat(sliderSize.value).toFixed(2);
  loop.shape = selShape.value;
  loop.size = parseFloat(sliderSize.value);
}
selCharges.addEventListener('change', () => { loadCharges(); syncVals(); recomputeHeat(); render(); });
selShape.addEventListener('change', () => { syncVals(); render(); });
sliderSize.addEventListener('input', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selCharges.value = 'single'; selShape.value = 'circle'; sliderSize.value = '1.15';
  loop = { cx: 0, cy: 0, size: 1.15, shape: 'circle' };
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  loadCharges(); syncVals(); seedTracers(); recomputeHeat(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
let SCN = null;
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
  recomputeHeat();
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
    pos: '#ef5466', neg: '#5b8def', loop: '#ffd166',
    out: '#ff7a5c', in: '#5b9bff', tracer: 'rgba(200,232,255,0.92)',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

function sumField(x, y) {
  let Ex = 0, Ey = 0;
  for (const c of charges) { const f = field(x, y, c.x, c.y, c.q * Qe); Ex += f.Ex; Ey += f.Ey; }
  return { Ex, Ey };
}
function buildCurve() {
  const s = loop.size;
  if (loop.shape === 'blob') return blob(loop.cx, loop.cy, s, s, 0.32 * s, 3);
  if (loop.shape === 'ellipse') return ellipse(loop.cx, loop.cy, s * 1.35, s * 0.72);
  return ellipse(loop.cx, loop.cy, s, s);
}
function totalFlux(curve) {
  let f = 0;
  for (const c of charges) f += flux(curve, c.x, c.y, c.q * Qe, 400);
  return f;
}
function polyOfCurve(curve, n = 90) {
  const pts = [];
  for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n; pts.push([curve.x(t), curve.y(t)]); }
  return pts;
}
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function enclosedCount(poly) {
  let n = 0;
  for (const c of charges) if (pointInPoly(c.x, c.y, poly)) n += c.q;
  return n;
}

// --- tracers (advect along E to visualise flux as flow) ---
const GA = 2.39996;
function spawnPos() {
  const pos = charges.filter((c) => c.q > 0);
  if (pos.length) {
    const c = pos[spawnK % pos.length]; const a = spawnK * GA; spawnK++;
    return { x: c.x + 0.13 * Math.cos(a), y: c.y + 0.13 * Math.sin(a) };
  }
  const a = spawnK * GA; spawnK++;
  return { x: VIEW * 1.2 * Math.cos(a), y: VIEW * 1.2 * Math.sin(a) };
}
function seedTracers() {
  tracers = [];
  for (let i = 0; i < 200; i++) tracers.push(spawnPos());
}
function advance(dt) {
  const sp = 1.25;
  for (const tr of tracers) {
    const { Ex, Ey } = sumField(tr.x, tr.y);
    const m = Math.hypot(Ex, Ey) || 1;
    tr.x += (Ex / m) * sp * dt; tr.y += (Ey / m) * sp * dt;
    let dead = Math.hypot(tr.x, tr.y) > VIEW * 1.3;
    for (const c of charges) if (Math.hypot(tr.x - c.x, tr.y - c.y) < 0.1) dead = true;
    if (dead) { const p = spawnPos(); tr.x = p.x; tr.y = p.y; }
  }
}

function recomputeHeat() {
  if (!SCN) return;
  const { draw } = SCN;
  const nx = Math.max(24, Math.round(draw.w / 9)), ny = Math.max(24, Math.round(draw.h / 9));
  if (!heat) heat = document.createElement('canvas');
  heat.width = nx; heat.height = ny;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(nx, ny);
  for (let j = 0; j < ny; j++) {
    const wy = invY(draw.y + (j + 0.5) / ny * draw.h);
    for (let i = 0; i < nx; i++) {
      const wx = invX(draw.x + (i + 0.5) / nx * draw.w);
      const { Ex, Ey } = sumField(wx, wy);
      const mag = Math.hypot(Ex, Ey);
      const t = mag / (mag + 55);
      const c = viridis(0.1 + 0.82 * t);
      const a = Math.min(0.5, 0.6 * Math.pow(t, 0.85));
      const o = (j * nx + i) * 4;
      img.data[o] = c.r; img.data[o + 1] = c.g; img.data[o + 2] = c.b; img.data[o + 3] = a * 255;
    }
  }
  hctx.putImageData(img, 0, 0);
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

let lastCurve = null, lastPoly = null, lastFlux = 0, lastEncl = 0;
function drawScene(col, r) {
  panel(col, r, 'Field streaming through a Gaussian loop (drag it)');
  const { draw } = SCN;
  const curve = buildCurve();
  lastCurve = curve; lastPoly = polyOfCurve(curve);
  lastFlux = totalFlux(curve); lastEncl = enclosedCount(lastPoly);

  ctx.save();
  clipTo(ctx, draw);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, draw.x, draw.y, draw.w, draw.h);

  // tracers (the field made visible as flow).
  ctx.fillStyle = col.tracer;
  for (const tr of tracers) { const X = WX(tr.x), Y = WY(tr.y); ctx.beginPath(); ctx.arc(X, Y, 2.2, 0, 2 * Math.PI); ctx.fill(); }

  // Gaussian loop.
  ctx.strokeStyle = col.loop; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= 160; i++) { const t = 2 * Math.PI * i / 160; const X = WX(curve.x(t)), Y = WY(curve.y(t)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.closePath(); ctx.stroke();

  // outflow / inflow normals.
  const M = 40; let emax = 1e-9; const en = [];
  for (let i = 0; i < M; i++) {
    const t = 2 * Math.PI * i / M; const x = curve.x(t), y = curve.y(t);
    const dxt = curve.dx(t), dyt = curve.dy(t); const nl = Math.hypot(dxt, dyt) || 1;
    const nx = dyt / nl, ny = -dxt / nl;       // outward normal (CCW)
    const { Ex, Ey } = sumField(x, y); const E = Ex * nx + Ey * ny;
    en.push({ x, y, nx, ny, E }); emax = Math.max(emax, Math.abs(E));
  }
  for (const s of en) {
    const L = (s.E / emax) * 0.34;             // signed length in world units
    const X = WX(s.x), Y = WY(s.y), X2 = WX(s.x + s.nx * L), Y2 = WY(s.y + s.ny * L);
    ctx.strokeStyle = s.E >= 0 ? col.out : col.in; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X2, Y2); ctx.stroke();
  }

  // charges.
  for (const c of charges) {
    const X = WX(c.x), Y = WY(c.y);
    ctx.beginPath(); ctx.arc(X, Y, 11, 0, 2 * Math.PI);
    ctx.fillStyle = c.q > 0 ? col.pos : col.neg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'heading', 'sans', 800);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.q > 0 ? '+' : '−', X, Y + 1);
  }

  ctx.restore();

  // readout strip.
  const items = [
    [`enclosed ${lastEncl > 0 ? '+' : ''}${lastEncl}`, lastEncl > 0 ? col.pos : (lastEncl < 0 ? col.neg : col.muted)],
    [`Φ ${(lastFlux / N0).toFixed(2)} q/ε₀`, col.loop],
    [loop.shape, col.fg],
    [(lastEncl !== 0) ? 'charge inside' : 'none enclosed', col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Flux contribution around the loop; shaded area is Φ');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 42 };
  const curve = lastCurve || buildCurve();
  const N = 200;
  const g = [];                    // normalized per-dt flux contribution
  let gmax = 1e-9;
  for (let i = 0; i <= N; i++) {
    const t = 2 * Math.PI * i / N; const x = curve.x(t), y = curve.y(t);
    const { Ex, Ey } = sumField(x, y);
    const val = (Ex * curve.dy(t) - Ey * curve.dx(t)) / N0;   // d(Φ/N0)/dt
    g.push(val); gmax = Math.max(gmax, Math.abs(val));
  }
  const cx0 = inner.y + inner.h / 2;
  const xOf = (i) => inner.x + i / N * inner.w;
  const yOf = (v) => cx0 - (v / gmax) * (inner.h / 2) * 0.9;

  // grid + zero line.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, cx0); ctx.lineTo(inner.x + inner.w, cx0); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // shaded area (positive red, negative blue).
  for (let i = 0; i < N; i++) {
    const x1 = xOf(i), x2 = xOf(i + 1), v = (g[i] + g[i + 1]) / 2;
    ctx.fillStyle = v >= 0 ? 'rgba(255,122,92,0.35)' : 'rgba(91,155,255,0.35)';
    ctx.fillRect(x1, Math.min(cx0, yOf(g[i])), x2 - x1 + 0.6, Math.abs(yOf(g[i]) - cx0));
  }
  // curve.
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i <= N; i++) { const X = xOf(i), Y = yOf(g[i]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.stroke();

  // labels + total.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('around the loop  (0 to 2π)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('E·n contribution', 0, 0); ctx.restore();
  ctx.fillStyle = col.loop; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`area = Φ = ${(lastFlux / N0).toFixed(2)} q/ε₀  →  ${lastEncl} enclosed`, inner.x + 6, inner.y + 6);
}

function render() {
  if (!REG) relayout();
  if (!charges.length) loadCharges();
  if (!tracers.length) seedTracers();
  if (!heat) recomputeHeat();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- dragging (charges and loop centre) ---
let drag = null;        // {type:'charge', idx} or {type:'loop'}
function pointerScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return;
  const { sx, sy } = pointerScreen(ev);
  let best = -1, bd = 20 * 20;
  charges.forEach((c, i) => { const dx = WX(c.x) - sx, dy = WY(c.y) - sy; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } });
  if (best >= 0) { drag = { type: 'charge', idx: best }; }
  else { const dx = WX(loop.cx) - sx, dy = WY(loop.cy) - sy; if (dx * dx + dy * dy < 40 * 40) drag = { type: 'loop' }; }
  if (drag) { canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const { sx, sy } = pointerScreen(ev);
  const wx = invX(sx), wy = invY(sy), lim = VIEW - 0.1;
  if (drag.type === 'charge') { charges[drag.idx].x = Math.max(-lim, Math.min(lim, wx)); charges[drag.idx].y = Math.max(-lim, Math.min(lim, wy)); recomputeHeat(); }
  else { loop.cx = Math.max(-lim, Math.min(lim, wx)); loop.cy = Math.max(-lim, Math.min(lim, wy)); }
  render();
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) advance(dt);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  loadCharges(); syncVals(); seedTracers();
  relayout();
  for (let i = 0; i < 120; i++) advance(1 / 60);   // pre-roll the streams
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
  return {
    fields: [
      { key: 'enclosed', label: 'enclosed charge', value: lastEncl, format: 'int' },
      { key: 'flux', label: 'flux $\\Phi$ ($q/\\epsilon_0$)', value: lastFlux / N0, format: 'float' },
      { key: 'shape', label: 'surface', value: loop.shape, format: 'text' },
      { key: 'size', label: 'surface size', value: loop.size, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Gauss's law: the measured flux equals the enclosed charge over eps0,
    // independent of the loop shape and size.
    const err = Math.abs(lastFlux / N0 - lastEncl);
    return [{
      key: 'gauss',
      label: 'Φ = q_enclosed / ε₀ (abs err)',
      value: err.toExponential(2),
      status: err < 1e-2 ? 'pass' : (err < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
