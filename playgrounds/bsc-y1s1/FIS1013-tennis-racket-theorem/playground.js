import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the tennis-racket / Dzhanibekov theorem. Top region:
// a rigid body (T-handle, book, phone, racket) tumbling in orthographic
// pseudo-3D under Euler's equations, with its three principal axes and the
// conserved angular-momentum direction; spun about the intermediate axis it
// periodically flips. Bottom region: the body-frame spin rates over time, the
// middle one reversing sign at each flip.
//
// Reference: Goldstein, Classical Mechanics, 3rd ed., Sec. 5.6; Marsden and
// Ratiu, Mechanics and Symmetry.

import { createRacket, step, rotationMatrix, energy, angularMomentumMag, diagnostics } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selObject = document.getElementById('select-object');
const selAxis = document.getElementById('select-axis');
const sliderSpin = document.getElementById('slider-spin');
const sliderPerturb = document.getElementById('slider-perturb');
const valueObject = document.getElementById('value-object');
const valueAxis = document.getElementById('value-axis');
const valueSpin = document.getElementById('value-spin');
const valuePerturb = document.getElementById('value-perturb');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const PHYSICS_DT = 1 / 240;
let I = [1, 2, 3];   // principal moments, recomputed per object from its shape
let running = !DETERMINISTIC;
let s = null;
let faces = [];          // body-frame geometry
let hist = [];           // {t, w:[..]}
let flips = 0, lastSign = 0;

// --- object geometry: lists of boxes -> faces ---
function boxFaces(c, h, color, sticker) {
  const out = [];
  for (let d = 0; d < 3; d++) {
    for (const sgn of [-1, 1]) {
      const o0 = (d + 1) % 3, o1 = (d + 2) % 3;
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        const v = [0, 0, 0];
        v[d] = c[d] + sgn * h[d]; v[o0] = c[o0] + a * h[o0]; v[o1] = c[o1] + b * h[o1];
        return v;
      });
      const normal = [0, 0, 0]; normal[d] = sgn;
      let col = color;
      if (d === 2 && sgn === 1 && sticker) col = sticker;
      else if (d === 2 && sgn === -1 && sticker) col = '#7a2f47';
      out.push({ pts, normal, col });
    }
  }
  return out;
}
// Each object is a small set of axis-aligned boxes (centre c, half-extents h).
function objectBoxes(kind) {
  if (kind === 'book') return [{ c: [0, 0, 0], h: [0.95, 0.62, 0.11], color: '#8a5a3b', sticker: '#ffd166' }];
  if (kind === 'phone') return [{ c: [0, 0, 0], h: [0.85, 0.42, 0.07], color: '#2a3340', sticker: '#5bc0eb' }];
  if (kind === 'racket') return [
    // Handle and head overlap slightly along x so the racket is one solid piece.
    { c: [-0.5, 0, 0], h: [0.55, 0.06, 0.05], color: '#7a5230' },
    { c: [0.55, 0, 0], h: [0.55, 0.46, 0.035], color: '#b07a3a', sticker: '#ffd166' },
  ];
  // T-handle (default): stem along x, crossbar along y, joined.
  return [
    { c: [0, 0, 0], h: [0.9, 0.12, 0.12], color: '#9aa3b2', sticker: '#ffd166' },
    { c: [0.78, 0, 0], h: [0.12, 0.6, 0.12], color: '#8893a4', sticker: '#67d98c' },
  ];
}
// Shift the boxes so the centre of mass sits at the origin: a free body
// tumbles about its COM, and the model must be drawn about the same point.
function centered(boxes) {
  let M = 0, cx = 0, cy = 0, cz = 0;
  for (const b of boxes) { const m = 8 * b.h[0] * b.h[1] * b.h[2]; M += m; cx += m * b.c[0]; cy += m * b.c[1]; cz += m * b.c[2]; }
  cx /= M; cy /= M; cz /= M;
  return boxes.map((b) => ({ ...b, c: [b.c[0] - cx, b.c[1] - cy, b.c[2] - cz] }));
}
function buildFaces(boxes) {
  const out = [];
  for (const b of boxes) out.push(...boxFaces(b.c, b.h, b.color, b.sticker));
  return out;
}
// Principal moments [Ixx, Iyy, Izz] about the COM from the box set (uniform
// density). The objects are axis-symmetric, so the body axes are principal.
// Each shape gives distinct inertias and so a distinct tumble (different flip
// period and wobble), instead of one shared dynamics for every object.
function objectInertia(boxes) {
  let Ixx = 0, Iyy = 0, Izz = 0;
  for (const b of boxes) {
    const [hx, hy, hz] = b.h, [cx, cy, cz] = b.c;
    const m = 8 * hx * hy * hz;   // density 1
    Ixx += m / 3 * (hy * hy + hz * hz) + m * (cy * cy + cz * cz);
    Iyy += m / 3 * (hx * hx + hz * hz) + m * (cx * cx + cz * cz);
    Izz += m / 3 * (hx * hx + hy * hy) + m * (cx * cx + cy * cy);
  }
  const mx = Math.max(Ixx, Iyy, Izz) || 1;       // normalise to keep a comparable time scale
  return [3 * Ixx / mx, 3 * Iyy / mx, 3 * Izz / mx];
}

function rebuild() {
  const boxes = centered(objectBoxes(selObject.value));
  I = objectInertia(boxes);
  s = createRacket({ I, spin: parseFloat(sliderSpin.value), axis: parseInt(selAxis.value, 10), perturb: parseFloat(sliderPerturb.value) });
  faces = buildFaces(boxes);
  hist = []; flips = 0; lastSign = Math.sign(s.w[parseInt(selAxis.value, 10)]) || 1;
}
function syncVals() {
  valueObject.textContent = selObject.options[selObject.selectedIndex].text;
  valueAxis.textContent = ['major', 'middle', 'minor'][parseInt(selAxis.value, 10)];
  valueSpin.textContent = parseFloat(sliderSpin.value).toFixed(1);
  valuePerturb.textContent = parseFloat(sliderPerturb.value).toFixed(3);
}
selObject.addEventListener('change', () => { syncVals(); rebuild(); render(); });
[selAxis, sliderSpin, sliderPerturb].forEach((el) => el.addEventListener('input', () => { syncVals(); rebuild(); render(); }));
selAxis.addEventListener('change', () => { syncVals(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  selObject.value = 'thandle'; selAxis.value = '1'; sliderSpin.value = '6'; sliderPerturb.value = '0.04';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); rebuild(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.85 },
    { name: 'diagnostic', weight: 1.2 },
  ]);
}

// fixed camera: tilt about x then rotate about y.
const CAM = (() => {
  const ax = -0.38, ay = 0.5;
  const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
  const Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]];
  const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  return mul3(Ry, Rx);
})();
function mul3(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
function mv3(M, v) { return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]; }

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    ax0: '#ef476f', ax1: '#67d98c', ax2: '#5bc0eb',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}
function shade(hex, f) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
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
  panel(col, r, 'A free body tumbling under Euler’s equations');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const scale = Math.min(draw.w, draw.h) * 0.30;
  const R = rotationMatrix(s);
  const M = mul3(CAM, R);                 // body -> camera
  const SX = (cp) => cx + cp[0] * scale;
  const SY = (cp) => cy - cp[1] * scale;
  const lightDir = [0.35, 0.55, 0.75];

  ctx.save();
  clipTo(ctx, draw);

  // angular-momentum reference (fixed in world: R * (I*w)).
  const Lb = [I[0] * s.w[0], I[1] * s.w[1], I[2] * s.w[2]];
  const Ln = Math.hypot(Lb[0], Lb[1], Lb[2]) || 1;
  const Lcam = mv3(CAM, mv3(R, [Lb[0] / Ln, Lb[1] / Ln, Lb[2] / Ln]));
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(SX(Lcam.map((v) => v * 1.7)), SY(Lcam.map((v) => v * 1.7))); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('L', SX(Lcam.map((v) => v * 1.85)), SY(Lcam.map((v) => v * 1.85)));

  // faces -> camera, depth sort, draw.
  const drawn = faces.map((f) => {
    const cpts = f.pts.map((p) => mv3(M, p));
    const ncam = mv3(M, f.normal);
    const depth = (cpts[0][2] + cpts[1][2] + cpts[2][2] + cpts[3][2]) / 4;
    const lit = Math.max(0, ncam[0] * lightDir[0] + ncam[1] * lightDir[1] + ncam[2] * lightDir[2]);
    return { cpts, depth, sh: 0.32 + 0.68 * lit, col: f.col };
  });
  drawn.sort((a, b) => a.depth - b.depth);
  for (const f of drawn) {
    ctx.fillStyle = shade(f.col, f.sh);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    f.cpts.forEach((p, i) => { const X = SX(p), Y = SY(p); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // principal axes (body axes through origin), spin axis highlighted.
  const spinAxis = parseInt(selAxis.value, 10);
  const axCols = [col.ax0, col.ax1, col.ax2];
  for (let k = 0; k < 3; k++) {
    const e = [0, 0, 0]; e[k] = 1;
    const tip = mv3(M, e.map((v) => v * 1.55));
    ctx.strokeStyle = axCols[k];
    ctx.lineWidth = (k === spinAxis) ? 3.5 : 1.6;
    ctx.globalAlpha = (k === spinAxis) ? 1 : 0.55;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(SX(tip), SY(tip)); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Readout strip.
  const d = diagnostics(s);
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [['major', 'middle', 'minor'][spinAxis], spinAxis === 1 ? col.ax1 : col.muted],
    [`ω ${parseFloat(sliderSpin.value).toFixed(1)}`, col.fg],
    [`flips ${flips}`, spinAxis === 1 ? col.accent : col.muted],
    [`|L| ${Math.abs(d.LDrift).toExponential(0)}`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Body-frame spin rates: the middle one flips sign');

  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 14, h: r.h - 28 - 40 };
  const WINDOW = 10;
  const tNow = s.t, t0 = Math.max(0, tNow - WINDOW), tSpan = Math.max(WINDOW, tNow) - t0 || 1;
  const wMax = parseFloat(sliderSpin.value) * 1.2;
  const xOf = (t) => inner.x + ((t - t0) / tSpan) * inner.w;
  const yOf = (w) => inner.y + inner.h / 2 - (w / wMax) * (inner.h / 2);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const w of [-wMax, 0, wMax]) { const y = yOf(w); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(w.toFixed(0), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const series = [[0, col.ax0], [1, col.ax1], [2, col.ax2]];
  for (const [k, c] of series) {
    ctx.strokeStyle = c; ctx.lineWidth = k === 1 ? 2.6 : 1.6;
    ctx.beginPath();
    let started = false;
    for (const h of hist) {
      if (h.t < t0) continue;
      const X = xOf(h.t), Y = yOf(h.w[k]);
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('time (s)', inner.x + inner.w / 2, inner.y + inner.h + 18);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('spin rate ω', 0, 0); ctx.restore();
  const leg = [['ω₁', col.ax0], ['ω₂', col.ax1], ['ω₃', col.ax2]];
  ctx.fillStyle = 'rgba(10,12,18,0.72)'; ctx.fillRect(inner.x + 6, inner.y + 6, 110, 18);
  let lx = inner.x + 12; const ly = inner.y + 15;
  ctx.font = fontString(canvas, 'legend', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 13, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 16, ly); lx += 32; }
}

function render() {
  if (!REG) relayout();
  if (!s) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function recordW() {
  hist.push({ t: s.t, w: s.w.slice() });
  while (hist.length && hist[0].t < s.t - 11) hist.shift();
  const a = parseInt(selAxis.value, 10);
  const sg = Math.sign(s.w[a]);
  if (sg !== 0 && sg !== lastSign) { flips += 1; lastSign = sg; }
}

let last = performance.now();
let accum = 0, sample = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    let guard = 0;
    while (accum >= PHYSICS_DT && guard < 800) { step(s, PHYSICS_DT); accum -= PHYSICS_DT; guard++; if ((sample++ % 6) === 0) recordW(); }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  const obj = params.get('object');
  if (obj && [...selObject.options].some((o) => o.value === obj)) selObject.value = obj;
  const ax = params.get('axis');
  if (ax !== null && ['0', '1', '2'].includes(ax)) selAxis.value = ax;
  syncVals();
  rebuild();
  const pre = CAPTURE_NAME ? (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 6 : 2.4;
  for (let i = 0; i < Math.round(pre / PHYSICS_DT); i++) { step(s, PHYSICS_DT); if ((i % 6) === 0) recordW(); }
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
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const a = parseInt(selAxis.value, 10);
  return {
    fields: [
      { key: 'axis', label: 'spin axis', value: ['major', 'middle', 'minor'][a], format: 'text' },
      { key: 'inertia', label: 'moments $I_1:I_2:I_3$', value: `${I[0].toFixed(2)} : ${I[1].toFixed(2)} : ${I[2].toFixed(2)}`, format: 'text' },
      { key: 'flips', label: 'flips so far', value: flips, format: 'int' },
      { key: 'w', label: 'spin |ω|', value: Math.hypot(s.w[0], s.w[1], s.w[2]), format: 'float' },
      { key: 'L', label: 'angular momentum |L|', value: angularMomentumMag(s), format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const d = diagnostics(s);
    const drift = Math.max(Math.abs(d.energyDrift), Math.abs(d.LDrift));
    return [{
      key: 'conserved',
      label: 'energy and |L| conserved (rel. drift)',
      value: drift.toExponential(2),
      status: drift < 1e-2 ? 'pass' : (drift < 5e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
