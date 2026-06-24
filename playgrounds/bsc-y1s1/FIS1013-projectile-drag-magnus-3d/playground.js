import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for projectile motion with quadratic drag and the
// Magnus force, Canvas2D only. Top region: a ball flying along its real
// trajectory over a ground grid in orthographic pseudo-3D, with a faint
// reference path showing where the same ball would land with no spin, so
// the bend is the spin alone. Bottom region: the range and the lateral
// deflection at landing swept against the spin rate, with the live point.
//
// Reference: Marion and Thornton, Classical Dynamics, 5th ed., Ch. 2;
// R. K. Adair, The Physics of Baseball, 3rd ed.

import { trajectory, spinVector, magnusForce } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selSpin = document.getElementById('select-spin');
const sliderRate = document.getElementById('slider-rate');
const sliderSpeed = document.getElementById('slider-speed');
const sliderElev = document.getElementById('slider-elev');
const valueSpin = document.getElementById('value-spin');
const valueRate = document.getElementById('value-rate');
const valueSpeed = document.getElementById('value-speed');
const valueElev = document.getElementById('value-elev');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const DRAG = 0.005, MAGNUS = 0.0038;
let running = !DETERMINISTIC;
let cur = null, ref = null, sweep = null;
let idxF = 0;

function opts(rate) {
  return {
    speed: parseFloat(sliderSpeed.value),
    elevDeg: parseFloat(sliderElev.value),
    omega: spinVector(rate, selSpin.value),
    c: DRAG, cM: MAGNUS,
  };
}
function recompute() {
  const rate = parseFloat(sliderRate.value);
  cur = trajectory(opts(rate));
  ref = trajectory({ ...opts(0), omega: [0, 0, 0], cM: 0 });
  const rates = [], ranges = [], sides = [];
  for (let r = 0; r <= 80; r += 5) { const t = trajectory(opts(r)); rates.push(r); ranges.push(t.range); sides.push(Math.abs(t.side)); }
  sweep = { rates, ranges, sides };
}
function syncVals() {
  valueSpin.textContent = { side: 'sidespin', back: 'backspin', top: 'topspin', none: 'no spin' }[selSpin.value];
  valueRate.textContent = parseFloat(sliderRate.value).toFixed(0);
  valueSpeed.textContent = parseFloat(sliderSpeed.value).toFixed(0);
  valueElev.textContent = `${parseFloat(sliderElev.value).toFixed(0)}°`;
}
[selSpin, sliderRate, sliderSpeed, sliderElev].forEach((el) => el.addEventListener('input', () => { syncVals(); recompute(); idxF = 0; render(); }));
selSpin.addEventListener('change', () => { syncVals(); recompute(); idxF = 0; render(); });
btnReset.addEventListener('click', () => {
  selSpin.value = 'side'; sliderRate.value = '46'; sliderSpeed.value = '30'; sliderElev.value = '34';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); recompute(); idxF = 0; render();
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
    { name: 'scene', weight: 1.95 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
}

// orthographic camera: world x downrange, y lateral, z up.
const AZ = 0.48, EL = 0.34;
const CA = Math.cos(AZ), SAz = Math.sin(AZ), CE = Math.cos(EL), SE = Math.sin(EL);
function project(p) {
  const x1 = p[0] * CA - p[1] * SAz;
  const y1 = p[0] * SAz + p[1] * CA;
  return [x1, p[2] * CE - y1 * SE];
}
// Screen basis vectors for a world direction, and the camera view normal
// (for front/back culling of the spinning ball texture).
const CAM_U = [CA, -SAz, 0];
const CAM_V = [-SAz * SE, -CA * SE, CE];
const CAM_N = [-SAz * CE, -CA * CE, -SE];
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm3(a) { const m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; }

// A spinning, shaded, seamed ball: the texture rotates about the spin
// axis omega so the spin direction is visible, not just a dot.
let ballPhase = 0;
function drawBall(bp, col, omega, Rpx) {
  const spinning = omega[0] !== 0 || omega[1] !== 0 || omega[2] !== 0;
  const n = spinning ? norm3(omega) : [0, 0, 1];
  const ref = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1 = norm3(cross3(n, ref));
  const e2 = cross3(n, e1);
  const surf = (theta, phi) => {
    const ct = Math.cos(theta), st = Math.sin(theta), cp = Math.cos(phi), sp = Math.sin(phi);
    const dir = [
      ct * cp * e1[0] + ct * sp * e2[0] + st * n[0],
      ct * cp * e1[1] + ct * sp * e2[1] + st * n[1],
      ct * cp * e1[2] + ct * sp * e2[2] + st * n[2],
    ];
    return { x: bp[0] + Rpx * dot3(dir, CAM_U), y: bp[1] - Rpx * dot3(dir, CAM_V), front: dot3(dir, CAM_N) > 0 };
  };
  // shaded body
  const g = ctx.createRadialGradient(bp[0] - Rpx * 0.35, bp[1] - Rpx * 0.42, Rpx * 0.12, bp[0], bp[1], Rpx);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#e6ebf6'); g.addColorStop(1, '#97a3c1');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bp[0], bp[1], Rpx, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(40,50,72,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bp[0], bp[1], Rpx, 0, 2 * Math.PI); ctx.stroke();
  // seams: meridians + parallels, front hemisphere only, rotating with phase
  const drawCurve = (pts, color, w) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
    let started = false;
    for (const p of pts) { if (!p.front) { started = false; continue; } started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); started = true; }
    ctx.stroke();
  };
  for (let mi = 0; mi < 6; mi += 1) {
    const phi = ballPhase + mi * Math.PI / 3;
    const pts = []; for (let t = -90; t <= 90; t += 6) pts.push(surf(t * Math.PI / 180, phi));
    drawCurve(pts, mi % 3 === 0 ? 'rgba(28,38,58,0.9)' : 'rgba(70,84,112,0.5)', mi % 3 === 0 ? 2 : 1.1);
  }
  for (const lat of [-45, 0, 45]) {
    const pts = []; for (let f = 0; f <= 360; f += 6) pts.push(surf(lat * Math.PI / 180, ballPhase + f * Math.PI / 180));
    drawCurve(pts, lat === 0 ? 'rgba(28,38,58,0.9)' : 'rgba(70,84,112,0.45)', lat === 0 ? 1.8 : 1);
  }
  // spin axis through the poles
  if (spinning) {
    const pole = (s) => ({ x: bp[0] + Rpx * 1.55 * s * dot3(n, CAM_U), y: bp[1] - Rpx * 1.55 * s * dot3(n, CAM_V) });
    const pA = pole(1), pB = pole(-1);
    ctx.strokeStyle = col.defl; ctx.lineWidth = 2; ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col.defl; ctx.beginPath(); ctx.arc(pA.x, pA.y, 2.6, 0, 2 * Math.PI); ctx.fill();
  }
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    ball: '#f4f6ff', path: '#5bc0eb', ref: 'rgba(150,160,175,0.55)',
    range: '#ffce4d', defl: '#34e0c8',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
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

function lerpPt(pts, f) {
  const n = pts.length - 1;
  const x = Math.max(0, Math.min(n, f));
  const i = Math.floor(x), t = x - i, a = pts[i], b = pts[Math.min(n, i + 1)];
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
}

function drawScene(col, r) {
  panel(col, r, 'The ball flies its real arc; the faint path is no-spin');

  const titleH = 22, stripH = 28, pad = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };

  // ground extent and grid.
  const xMax = Math.max(cur.range, ref.range, 1);
  let yHalf = 5;
  for (const p of cur.pts) yHalf = Math.max(yHalf, Math.abs(p[1]) * 1.35);
  const gx = xMax <= 40 ? 10 : xMax <= 90 ? 20 : 30;

  // fit: project everything (paths + ground corners), scale isotropically.
  const all = [];
  for (const p of cur.pts) all.push(p);
  for (const p of ref.pts) all.push(p);
  for (const cx of [0, xMax]) for (const cy of [-yHalf, yHalf]) all.push([cx, cy, 0]);
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const p of all) { const q = project(p); if (q[0] < minx) minx = q[0]; if (q[0] > maxx) maxx = q[0]; if (q[1] < miny) miny = q[1]; if (q[1] > maxy) maxy = q[1]; }
  const bw = (maxx - minx) || 1, bh = (maxy - miny) || 1;
  const sc = Math.min((draw.w - 2 * pad) / bw, (draw.h - 2 * pad) / bh);
  const cxr = (minx + maxx) / 2, cyr = (miny + maxy) / 2;
  const ox = draw.x + draw.w / 2, oy = draw.y + draw.h / 2;
  const P = (p) => { const q = project(p); return [ox + (q[0] - cxr) * sc, oy - (q[1] - cyr) * sc]; };

  ctx.save();
  clipTo(ctx, draw);

  // ground grid.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  for (let x = 0; x <= xMax + 1e-6; x += gx) { const a = P([x, -yHalf, 0]), b = P([x, yHalf, 0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (let y = -yHalf; y <= yHalf + 1e-6; y += yHalf) { const a = P([0, y, 0]), b = P([xMax, y, 0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  // downrange tick labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let x = 0; x <= xMax + 1e-6; x += gx) { const a = P([x, -yHalf, 0]); ctx.fillText(`${x.toFixed(0)}m`, a[0], a[1] + 3); }

  // ground shadows (trajectory projected onto z = 0): the lateral curve
  // reads unambiguously as a track across the grid.
  ctx.strokeStyle = 'rgba(150,160,175,0.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ref.pts.forEach((p, i) => { const s = P([p[0], p[1], 0]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(52,224,200,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); cur.pts.forEach((p, i) => { const s = P([p[0], p[1], 0]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();

  // reference path (no spin), dashed.
  ctx.strokeStyle = col.ref; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
  ctx.beginPath(); ref.pts.forEach((p, i) => { const s = P(p); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
  ctx.setLineDash([]);
  { const e = P(ref.pts[ref.pts.length - 1]); ctx.fillStyle = col.ref; ctx.beginPath(); ctx.arc(e[0], e[1], 3.5, 0, 2 * Math.PI); ctx.fill(); }

  // actual path: traveled portion bright, ahead dim.
  const n = cur.pts.length - 1;
  for (let i = 1; i < cur.pts.length; i++) {
    const ahead = i > idxF;
    const c = viridis(0.25 + 0.6 * (i / n));
    ctx.strokeStyle = ahead ? `rgba(${c.r},${c.g},${c.b},0.30)` : `rgba(${c.r},${c.g},${c.b},0.95)`;
    ctx.lineWidth = ahead ? 1.6 : 3;
    const a = P(cur.pts[i - 1]), b = P(cur.pts[i]);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }

  // landing markers.
  const land = P(cur.pts[cur.pts.length - 1]);
  ctx.strokeStyle = col.path; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(land[0], land[1], 5, 0, 2 * Math.PI); ctx.stroke();
  const O = P([0, 0, 0]); ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(O[0], O[1], 4, 0, 2 * Math.PI); ctx.fill();

  // the spinning ball, its spin axis, and the Magnus force vector.
  const bp3 = lerpPt(cur.pts, idxF);
  const bp = P(bp3);
  const rate = parseFloat(sliderRate.value);
  const omega = (selSpin.value !== 'none' && rate > 0) ? spinVector(rate, selSpin.value) : [0, 0, 0];
  // Magnus force direction F ~ omega x v, drawn as an arrow from the ball.
  if (omega[0] || omega[1] || omega[2]) {
    const i0 = Math.max(0, Math.min(cur.pts.length - 2, Math.floor(idxF)));
    const v = [cur.pts[i0 + 1][0] - cur.pts[i0][0], cur.pts[i0 + 1][1] - cur.pts[i0][1], cur.pts[i0 + 1][2] - cur.pts[i0][2]];
    const F = cross3(omega, v); const fm = Math.hypot(F[0], F[1], F[2]);
    if (fm > 1e-9) {
      const L = 0.075 * xMax;
      const tip = P([bp3[0] + F[0] / fm * L, bp3[1] + F[1] / fm * L, bp3[2] + F[2] / fm * L]);
      ctx.strokeStyle = '#ff8a5c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bp[0], bp[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
      const ang = Math.atan2(tip[1] - bp[1], tip[0] - bp[0]);
      ctx.fillStyle = '#ff8a5c'; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(tip[0] - 8 * Math.cos(ang - 0.4), tip[1] - 8 * Math.sin(ang - 0.4));
      ctx.lineTo(tip[0] - 8 * Math.cos(ang + 0.4), tip[1] - 8 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
      ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textBaseline = 'middle';
      const leftward = tip[0] < bp[0];
      ctx.textAlign = leftward ? 'right' : 'left';
      ctx.fillText('Magnus', tip[0] + (leftward ? -6 : 6), tip[1] - 9);
    }
  }
  drawBall(bp, col, omega, 16);

  ctx.restore();

  // readout strip.
  const items = [
    [{ side: 'sidespin', back: 'backspin', top: 'topspin', none: 'no spin' }[selSpin.value], col.path],
    [`range ${cur.range.toFixed(1)}m`, col.range],
    [`bend ${cur.side.toFixed(1)}m`, col.defl],
    [`apex ${cur.apex.toFixed(1)}m`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Range and sideways bend vs spin rate');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 16, h: r.h - 28 - 42 };
  let yMax = 1;
  for (const v of sweep.ranges) yMax = Math.max(yMax, v);
  for (const v of sweep.sides) yMax = Math.max(yMax, v);
  yMax *= 1.08;
  const xOf = (rate) => inner.x + rate / 80 * inner.w;
  const yOf = (m) => inner.y + inner.h - (m / yMax) * inner.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 2; k++) { const m = yMax * k / 2; const y = yOf(m); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(m.toFixed(0), inner.x - 6, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const rr of [0, 20, 40, 60, 80]) ctx.fillText(String(rr), xOf(rr), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const plot = (arr, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath();
    sweep.rates.forEach((rt, i) => { const X = xOf(rt), Y = yOf(arr[i]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
  };
  plot(sweep.ranges, col.range);
  plot(sweep.sides, col.defl);

  // current operating point.
  const rate = parseFloat(sliderRate.value);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(rate), inner.y); ctx.lineTo(xOf(rate), inner.y + inner.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.range; ctx.beginPath(); ctx.arc(xOf(rate), yOf(cur.range), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.defl; ctx.beginPath(); ctx.arc(xOf(rate), yOf(Math.abs(cur.side)), 4.5, 0, 2 * Math.PI); ctx.fill();

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('spin rate (rad/s)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('distance (m)', 0, 0); ctx.restore();
  const leg = [['range', col.range], ['bend', col.defl]];
  let lx = inner.x + 10; const ly = inner.y + 12;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const [lab, c] of leg) { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke(); ctx.fillStyle = col.fg; ctx.fillText(lab, lx + 18, ly); lx += 64; }
}

function render() {
  if (!REG) relayout();
  if (!cur) recompute();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

const LOOP_S = 2.6;
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    const n = cur.pts.length - 1;
    idxF += (n / LOOP_S) * dt;
    if (idxF > n + n * 0.12) idxF = 0;        // brief hold at landing, then relaunch
    const rate = parseFloat(sliderRate.value);
    if (selSpin.value !== 'none' && rate > 0) ballPhase += (0.7 + rate / 24) * dt * 2.0;
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  recompute();
  idxF = CAPTURE_NAME ? (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0.6) * (cur.pts.length - 1) : 0.62 * (cur.pts.length - 1);
  ballPhase = 0.7;
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
  return {
    fields: [
      { key: 'spin', label: 'spin', value: { side: 'sidespin', back: 'backspin', top: 'topspin', none: 'no spin' }[selSpin.value], format: 'text' },
      { key: 'range', label: 'range (m)', value: cur.range, format: 'float' },
      { key: 'bend', label: 'lateral bend (m)', value: cur.side, format: 'float' },
      { key: 'apex', label: 'apex height (m)', value: cur.apex, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Magnus force does no work: it is perpendicular to the velocity, so
    // it steers the ball without changing its speed.
    const speed = parseFloat(sliderSpeed.value), el = parseFloat(sliderElev.value) * Math.PI / 180;
    const v = [speed * Math.cos(el), 0, speed * Math.sin(el)];
    const w = spinVector(parseFloat(sliderRate.value), selSpin.value);
    const F = magnusForce(w, v, MAGNUS);
    const fMag = Math.hypot(F[0], F[1], F[2]);
    const cosVF = fMag < 1e-12 ? 0 : Math.abs(F[0] * v[0] + F[1] * v[1] + F[2] * v[2]) / (fMag * Math.hypot(v[0], v[1], v[2]));
    return [{
      key: 'magnus-perp',
      label: 'Magnus force ⟂ velocity (cos)',
      value: cosVF.toExponential(2),
      status: cosVF < 1e-9 ? 'pass' : (cosVF < 1e-4 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
