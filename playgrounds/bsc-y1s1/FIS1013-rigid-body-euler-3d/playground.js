import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for torque-free rigid-body rotation (Poinsot
// construction), Canvas2D only. Top region: the inertia ellipsoid
// tumbling under Euler's equations in orthographic pseudo-3D, with the
// instantaneous spin axis (white), the conserved angular momentum
// (gold, fixed in space), the three principal axes, and the polhode
// painted on the body. Bottom region: the polhode traced in the
// omega1-omega3 principal plane, a tight loop for stable axes and a
// separatrix bowtie for the intermediate axis.
//
// Reference: Goldstein, Poole, Safko, Classical Mechanics, 3rd ed.,
// Sec. 5.6; Landau and Lifshitz, Mechanics, 3rd ed., Sec. 37.

import { createRigidBody, step, energy, angularMomentumSq, bodyToWorld, angularMomentumWorld } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selAxis = document.getElementById('select-axis');
const sliderShape = document.getElementById('slider-shape');
const sliderSpin = document.getElementById('slider-spin');
const sliderPerturb = document.getElementById('slider-perturb');
const valueAxis = document.getElementById('value-axis');
const valueShape = document.getElementById('value-shape');
const valueSpin = document.getElementById('value-spin');
const valuePerturb = document.getElementById('value-perturb');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const PHYSICS_DT = 1 / 240;
let running = !DETERMINISTIC;
let body = null;
let sa = [1, 1, 1];          // ellipsoid semi-axes (body frame)
const polhode = [];          // body-frame omega-tip history (unit dirs)
const trace = [];            // body-frame (w1, w3) history for the diagnostic
const TRAIL = 900;

// --- ellipsoid mesh (unit-sphere directions, recomputed each frame) ---
const NU = 26, NV = 14;
const dirs = [];             // (NU+1)*(NV+1) unit directions
for (let v = 0; v <= NV; v++) {
  const th = v / NV * Math.PI;
  for (let u = 0; u <= NU; u++) {
    const ph = u / NU * 2 * Math.PI;
    dirs.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]);
  }
}
const quads = [];
for (let v = 0; v < NV; v++) for (let u = 0; u < NU; u++) {
  const a = v * (NU + 1) + u, b = a + NU + 1;
  quads.push([a, b, b + 1, a + 1]);
}

function semiAxes(I) {
  const [I1, I2, I3] = I;
  const a2 = 0.5 * (-I1 + I2 + I3), b2 = 0.5 * (I1 - I2 + I3), c2 = 0.5 * (I1 + I2 - I3);
  const f = 1.2;
  return [Math.sqrt(Math.max(0.16, a2)) * f, Math.sqrt(Math.max(0.16, b2)) * f, Math.sqrt(Math.max(0.16, c2)) * f];
}
function inertia() {
  const d = parseFloat(sliderShape.value);   // asymmetry: I = [3-d, 3, 3+d]
  return [3 - d, 3, 3 + d];
}
function initialOmega(I) {
  const axis = parseInt(selAxis.value, 10);
  const rate = parseFloat(sliderSpin.value);
  const eps = parseFloat(sliderPerturb.value) * rate;
  const w = [eps, eps, eps];
  w[axis] = rate;
  // perturb the two transverse components slightly off-axis
  w[(axis + 1) % 3] = eps;
  w[(axis + 2) % 3] = eps * 0.6;
  return w;
}
function rebuild() {
  const I = inertia();
  body = createRigidBody({ I, omega: initialOmega(I) });
  sa = semiAxes(I);
  polhode.length = 0; trace.length = 0;
}
function syncVals() {
  valueAxis.textContent = ['minor', 'middle', 'major'][parseInt(selAxis.value, 10)];
  valueShape.textContent = parseFloat(sliderShape.value).toFixed(2);
  valueSpin.textContent = parseFloat(sliderSpin.value).toFixed(1);
  valuePerturb.textContent = parseFloat(sliderPerturb.value).toFixed(2);
}
[selAxis, sliderShape, sliderSpin, sliderPerturb].forEach((el) => el.addEventListener('input', () => { syncVals(); rebuild(); render(); }));
selAxis.addEventListener('change', () => { syncVals(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  selAxis.value = '1'; sliderShape.value = '1.0'; sliderSpin.value = '4'; sliderPerturb.value = '0.05';
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
    { name: 'diagnostic', weight: 1.15 },
  ]);
}

// fixed camera: tilt about x then rotate about y. Camera looks toward +z.
const CAM = (() => {
  const ax = -0.42, ay = 0.62;
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
function toCam(vBody) { return mv3(CAM, bodyToWorld(body.q, vBody)); }
function surfPoint(d) {
  // ellipsoid surface point in unit-direction d.
  const rho = 1 / Math.sqrt((d[0] / sa[0]) ** 2 + (d[1] / sa[1]) ** 2 + (d[2] / sa[2]) ** 2);
  return [d[0] * rho, d[1] * rho, d[2] * rho];
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    ax0: '#ef476f', ax1: '#67d98c', ax2: '#5bc0eb',
    omega: '#f4f6ff', L: '#ffce4d', polh: '#34e0c8',
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

const LIGHT = (() => { const v = [0.35, 0.5, 0.78]; const n = Math.hypot(...v); return [v[0] / n, v[1] / n, v[2] / n]; })();

function drawScene(col, r) {
  panel(col, r, 'The inertia ellipsoid tumbling, with ω and a fixed L');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const scale = Math.min(draw.w, draw.h) * 0.165;
  const SX = (cp) => cx + cp[0] * scale;
  const SY = (cp) => cy - cp[1] * scale;

  ctx.save();
  clipTo(ctx, draw);

  // transform mesh vertices to camera space.
  const cverts = dirs.map((d) => toCam([sa[0] * d[0], sa[1] * d[1], sa[2] * d[2]]));

  // body-axis tint per vertex (so the tumble reads): blend toward the
  // principal-axis colours by |direction component|.
  const tintFor = (d) => {
    const ax = d[0] * d[0], ay = d[1] * d[1], az = d[2] * d[2];
    const r0 = 0.30 + 0.62 * ax + 0.12 * az;
    const g0 = 0.36 + 0.55 * ay + 0.10 * ax;
    const b0 = 0.42 + 0.60 * az + 0.12 * ay;
    return [r0, g0, b0];
  };

  // front faces only, depth sorted.
  const faces = [];
  for (const q of quads) {
    const p0 = cverts[q[0]], p1 = cverts[q[1]], p2 = cverts[q[2]], p3 = cverts[q[3]];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const e2 = [p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const ctr = [(p0[0] + p1[0] + p2[0] + p3[0]) / 4, (p0[1] + p1[1] + p2[1] + p3[1]) / 4, (p0[2] + p1[2] + p2[2] + p3[2]) / 4];
    if (n[0] * ctr[0] + n[1] * ctr[1] + n[2] * ctr[2] < 0) n = [-n[0], -n[1], -n[2]];
    const nn = Math.hypot(...n) || 1;
    const nz = n[2] / nn;
    if (nz <= 0.02) continue;            // backface cull
    const lit = Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / nn);
    const di = dirs[q[0]];
    faces.push({ q: [p0, p1, p2, p3], z: ctr[2], sh: 0.28 + 0.72 * lit, tint: tintFor(di) });
  }
  faces.sort((a, b) => a.z - b.z);
  for (const f of faces) {
    const [tr, tg, tb] = f.tint;
    ctx.fillStyle = `rgb(${Math.round(tr * f.sh * 255)},${Math.round(tg * f.sh * 255)},${Math.round(tb * f.sh * 255)})`;
    ctx.beginPath();
    f.q.forEach((p, i) => { const X = SX(p), Y = SY(p); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.fill();
  }

  // seam rings on the three principal planes (front half only).
  const ringCols = [col.ax0, col.ax1, col.ax2];
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = ringCols[k]; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80 * 2 * Math.PI;
      const d = [0, 0, 0];
      d[(k + 1) % 3] = Math.cos(t); d[(k + 2) % 3] = Math.sin(t);
      const sp = surfPoint(d);
      const nb = [sp[0] / (sa[0] * sa[0]), sp[1] / (sa[1] * sa[1]), sp[2] / (sa[2] * sa[2])];
      const ncam = mv3(CAM, bodyToWorld(body.q, nb));
      const cp = toCam([sp[0] * 1.01, sp[1] * 1.01, sp[2] * 1.01]);
      if (ncam[2] > 0) { const X = SX(cp), Y = SY(cp); if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; } }
      else pen = false;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // polhode painted on the body (front half only), coloured by recency.
  if (polhode.length > 2) {
    ctx.lineWidth = 2.6;
    for (let i = 1; i < polhode.length; i++) {
      const d0 = polhode[i - 1], d1 = polhode[i];
      const sp = surfPoint(d1);
      const nb = [sp[0] / (sa[0] * sa[0]), sp[1] / (sa[1] * sa[1]), sp[2] / (sa[2] * sa[2])];
      const ncam = mv3(CAM, bodyToWorld(body.q, nb));
      if (ncam[2] <= 0) continue;
      const a = toCam([surfPoint(d0)[0] * 1.02, surfPoint(d0)[1] * 1.02, surfPoint(d0)[2] * 1.02]);
      const b = toCam([sp[0] * 1.02, sp[1] * 1.02, sp[2] * 1.02]);
      const t = i / polhode.length;
      const c = viridis(0.45 + 0.5 * t);
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.35 + 0.6 * t})`;
      ctx.beginPath(); ctx.moveTo(SX(a), SY(a)); ctx.lineTo(SX(b), SY(b)); ctx.stroke();
    }
  }

  // principal-axis stubs (dominant one emphasised).
  const dom = body.w.map((v) => Math.abs(v)).indexOf(Math.max(...body.w.map((v) => Math.abs(v))));
  const axCols = [col.ax0, col.ax1, col.ax2];
  for (let k = 0; k < 3; k++) {
    const e = [0, 0, 0]; e[k] = 1;
    const tip = toCam(e.map((v) => v * (sa[k] + 0.5)));
    ctx.strokeStyle = axCols[k]; ctx.lineWidth = (k === dom) ? 3 : 1.4; ctx.globalAlpha = (k === dom) ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(SX(tip), SY(tip)); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // angular momentum L (gold, fixed in space) and spin axis omega (white).
  const arrow = (vWorldCam, color, len, label, dash) => {
    const n = Math.hypot(...vWorldCam) || 1;
    const tip = [vWorldCam[0] / n * len, vWorldCam[1] / n * len, vWorldCam[2] / n * len];
    ctx.strokeStyle = color; ctx.lineWidth = 3; if (dash) ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(SX(tip), SY(tip)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(SX(tip), SY(tip), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lp = [tip[0] * 1.16, tip[1] * 1.16, tip[2] * 1.16];
    ctx.fillText(label, SX(lp), SY(lp));
  };
  const Lcam = mv3(CAM, angularMomentumWorld(body));
  const wcam = mv3(CAM, bodyToWorld(body.q, body.w));
  arrow(Lcam, col.L, 2.7, 'L', false);
  arrow(wcam, col.omega, 2.3, 'ω', false);

  ctx.restore();

  // readout strip.
  const dE = energyDrift();
  const items = [
    [['minor', 'middle', 'major'][parseInt(selAxis.value, 10)] + ' axis', parseInt(selAxis.value, 10) === 1 ? col.ax1 : col.muted],
    [`|ω| ${Math.hypot(...body.w).toFixed(1)}`, col.omega],
    [`|L| ${Math.sqrt(angularMomentumSq(body)).toFixed(1)}`, col.L],
    [`E drift ${dE.toExponential(0)}`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

// Analytic polhode projected to the (w1, w3) plane: sweep w2 over its
// allowed range and solve the two conserved quadratics for w1^2, w3^2,
// emitting the four sign branches. Returns {branches:[[ [w1,w3],... ]], m}.
function polhodeGuide() {
  const [I1, I2, I3] = body.I;
  const E = energy(body), L2 = angularMomentumSq(body);
  const det = I1 * I3 * (I3 - I1) || 1e-9;
  const w2max = Math.sqrt(Math.max(0, 2 * E / I2));
  const N = 160;
  const raw = [];
  for (let i = 0; i <= N; i++) {
    const w2 = -w2max + 2 * w2max * i / N, w2s = w2 * w2;
    const w1s = ((2 * E - I2 * w2s) * I3 * I3 - (L2 - I2 * I2 * w2s) * I3) / det;
    const w3s = ((L2 - I2 * I2 * w2s) * I1 - (2 * E - I2 * w2s) * I1 * I1) / det;
    raw.push([w1s, w3s]);
  }
  const signs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const branches = []; let m = 0.3;
  for (const [s1, s3] of signs) {
    const br = [];
    for (const [w1s, w3s] of raw) {
      if (w1s < -1e-4 || w3s < -1e-4) { if (br.length > 1) branches.push(br.slice()); br.length = 0; continue; }
      const w1 = s1 * Math.sqrt(Math.max(0, w1s)), w3 = s3 * Math.sqrt(Math.max(0, w3s));
      m = Math.max(m, Math.abs(w1), Math.abs(w3));
      br.push([w1, w3]);
    }
    if (br.length > 1) branches.push(br);
  }
  return { branches, m };
}

function drawDiagnostic(col, r) {
  panel(col, r, 'The polhode: spin axis traced in the ω₁-ω₃ plane');

  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 42 };
  const guide = polhodeGuide();
  const m = guide.m * 1.14;
  const cx = inner.x + inner.w / 2, cy = inner.y + inner.h / 2;
  const sx = (inner.w / 2) / m, sy = (inner.h / 2) / m;
  const xOf = (w1) => cx + w1 * sx;
  const yOf = (w3) => cy - w3 * sy;

  // axes.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, cy); ctx.lineTo(inner.x + inner.w, cy); ctx.moveTo(cx, inner.y); ctx.lineTo(cx, inner.y + inner.h); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(m.toFixed(1), inner.x + inner.w - 3, cy - 3);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(m.toFixed(1), cx + 3, inner.y + 3);

  // analytic polhode (faint guide showing the whole curve).
  ctx.strokeStyle = 'rgba(120,140,200,0.45)'; ctx.lineWidth = 1.3;
  for (const br of guide.branches) {
    ctx.beginPath();
    br.forEach((p, i) => { const X = xOf(p[0]), Y = yOf(p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke();
  }

  // live polhode trace, coloured by recency.
  if (trace.length > 2) {
    ctx.lineWidth = 2.4;
    for (let i = 1; i < trace.length; i++) {
      const t = i / trace.length;
      const c = viridis(0.4 + 0.55 * t);
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.3 + 0.65 * t})`;
      ctx.beginPath(); ctx.moveTo(xOf(trace[i - 1][0]), yOf(trace[i - 1][1])); ctx.lineTo(xOf(trace[i][0]), yOf(trace[i][1])); ctx.stroke();
    }
    const last = trace[trace.length - 1];
    ctx.fillStyle = col.omega; ctx.beginPath(); ctx.arc(xOf(last[0]), yOf(last[1]), 4.2, 0, 2 * Math.PI); ctx.fill();
  }

  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('ω₁  (minor-axis rate)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ω₃ (major-axis rate)', 0, 0); ctx.restore();

  const axis = parseInt(selAxis.value, 10);
  ctx.fillStyle = axis === 1 ? col.accent : col.muted;
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(axis === 1 ? 'separatrix bowtie: it flips' : 'closed loop: steady tumble', inner.x + 7, inner.y + inner.h - 7);
}

let __E0 = null, __L0 = null, __Eprev = null;
function energyDrift() {
  const E = energy(body);
  if (__Eprev !== null && Math.abs(E - __Eprev) > 0.02 * Math.max(1e-9, Math.abs(__Eprev))) { __E0 = E; __L0 = angularMomentumSq(body); }
  __Eprev = E;
  if (__E0 === null) { __E0 = E; __L0 = angularMomentumSq(body); }
  const dE = Math.abs(E - __E0) / Math.max(1e-12, Math.abs(__E0));
  const dL = Math.abs(angularMomentumSq(body) - __L0) / Math.max(1e-12, Math.abs(__L0));
  return Math.max(dE, dL);
}

function render() {
  if (!REG) relayout();
  if (!body) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function recordTrace() {
  const wn = Math.hypot(...body.w) || 1;
  polhode.push([body.w[0] / wn, body.w[1] / wn, body.w[2] / wn]);
  while (polhode.length > TRAIL) polhode.shift();
  trace.push([body.w[0], body.w[2]]);
  while (trace.length > TRAIL) trace.shift();
}

let last = performance.now();
let accum = 0, sample = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt * 1.3;
    let guard = 0;
    while (accum >= PHYSICS_DT && guard < 800) { step(body, PHYSICS_DT); accum -= PHYSICS_DT; guard++; if ((sample++ % 4) === 0) recordTrace(); }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  rebuild();
  const pre = CAPTURE_NAME ? (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 9 + 1.5 : 3.0;
  for (let i = 0; i < Math.round(pre / PHYSICS_DT); i++) { step(body, PHYSICS_DT); if ((i % 4) === 0) recordTrace(); }
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
  const dom = body.w.map((v) => Math.abs(v)).indexOf(Math.max(...body.w.map((v) => Math.abs(v))));
  return {
    fields: [
      { key: 'axis', label: 'dominant axis', value: ['minor (1)', 'middle (2)', 'major (3)'][dom], format: 'text' },
      { key: 'w', label: 'angular speed $|\\omega|$', value: Math.hypot(...body.w), format: 'float' },
      { key: 'E', label: 'rotational energy $E$', value: energy(body), format: 'float' },
      { key: 'L', label: 'angular momentum $|L|$', value: Math.sqrt(angularMomentumSq(body)), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    const d = energyDrift();
    if (!Number.isFinite(d)) return [];
    return [{
      key: 'conserved',
      label: 'energy and |L| conserved (rel. drift)',
      value: d.toExponential(2),
      status: d < 1e-3 ? 'pass' : (d < 1e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
