import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for Coulomb equilibrium and Earnshaw's theorem,
// Canvas2D only. Top region: the electric potential of fixed point
// charges as equipotential contours over a diverging colour map, with
// the force-free balance point marked and a draggable test charge that
// slides off it. Bottom region: two slices of the potential through the
// balance point, taken along the principal curvature directions, one a
// valley and one a hill, the saddle that Laplace's equation forces.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Ch. 2;
// Earnshaw 1842.

import { forceAt, potentialAt } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selPreset = document.getElementById('select-preset');
const selTest = document.getElementById('select-test');
const valuePreset = document.getElementById('value-preset');
const valueTest = document.getElementById('value-test');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const VIEW = 2.6;
let running = !DETERMINISTIC;
let charges = [];
let test = { x: 0, y: 0, vx: 0, vy: 0, alive: true };
let trail = [];
let eq = { x: 0, y: 0, ok: false, u1: [1, 0], u2: [0, 1] };  // balance point + principal dirs
let heat = null, contours = [];

const PRESETS = {
  square: [{ x: -1.2, y: -1.2 }, { x: 1.2, y: -1.2 }, { x: 1.2, y: 1.2 }, { x: -1.2, y: 1.2 }].map((p) => ({ ...p, q: 1 })),
  triangle: [90, 210, 330].map((d) => ({ x: 1.5 * Math.cos(d * Math.PI / 180), y: 1.5 * Math.sin(d * Math.PI / 180), q: 1 })),
  two: [{ x: -1.3, y: 0, q: 1 }, { x: 1.3, y: 0, q: 1 }],
  // Mixed-sign quadrupole: alternating +/- on a square. The centre is still a
  // zero-force equilibrium by symmetry, and still a saddle (one diagonal a
  // valley toward the negatives, the other a ridge toward the positives):
  // Earnshaw holds whatever the signs.
  quadrupole: [{ x: -1.2, y: -1.2, q: 1 }, { x: 1.2, y: -1.2, q: -1 }, { x: 1.2, y: 1.2, q: 1 }, { x: -1.2, y: 1.2, q: -1 }],
  // Five positives on a ring: centre equilibrium, still a saddle.
  pentagon: [90, 162, 234, 306, 18].map((d) => ({ x: 1.5 * Math.cos(d * Math.PI / 180), y: 1.5 * Math.sin(d * Math.PI / 180), q: 1 })),
};
function loadPreset() { charges = PRESETS[selPreset.value].map((c) => ({ ...c })); }
function qTest() { return selTest.value === 'neg' ? -1 : 1; }

function syncVals() {
  valuePreset.textContent = { square: 'square', triangle: 'triangle', two: 'two +', quadrupole: '± quadrupole', pentagon: 'five +' }[selPreset.value];
  valueTest.textContent = selTest.value === 'neg' ? '- test' : '+ test';
}
selPreset.addEventListener('change', () => { syncVals(); loadPreset(); rebuild(); resetTest(); render(); });
selTest.addEventListener('change', () => { syncVals(); resetTest(); render(); });
btnReset.addEventListener('click', () => {
  selPreset.value = 'square'; selTest.value = 'pos';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); loadPreset(); rebuild(); resetTest(); render();
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
  rebuild();
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
    pos: '#ef5466', neg: '#5b8def', test: '#ffd166',
    valley: '#67d98c', hill: '#ef476f',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

function Vpot(x, y) { return potentialAt(x, y, charges); }
function Efield(x, y) { return forceAt(x, y, charges); }   // field of the fixed charges (E up to k)

// --- balance point (E = 0) by coarse scan + Newton, then Hessian of V ---
function findEquilibrium() {
  let bx = 0, by = 0, bm = Infinity;
  for (let i = 0; i <= 36; i++) for (let j = 0; j <= 36; j++) {
    const x = -1.8 + 3.6 * i / 36, y = -1.8 + 3.6 * j / 36;
    const f = Efield(x, y); const m = f.fx * f.fx + f.fy * f.fy;
    if (m < bm) { bm = m; bx = x; by = y; }
  }
  let x = bx, y = by, ok = false;
  const h = 1e-3;
  for (let it = 0; it < 12; it++) {
    const f = Efield(x, y);
    const fx_x = (Efield(x + h, y).fx - Efield(x - h, y).fx) / (2 * h);
    const fx_y = (Efield(x, y + h).fx - Efield(x, y - h).fx) / (2 * h);
    const fy_x = (Efield(x + h, y).fy - Efield(x - h, y).fy) / (2 * h);
    const fy_y = (Efield(x, y + h).fy - Efield(x, y - h).fy) / (2 * h);
    const det = fx_x * fy_y - fx_y * fy_x;
    if (Math.abs(det) < 1e-9) break;
    const dx = (-f.fx * fy_y + f.fy * fx_y) / det;
    const dy = (-f.fy * fx_x + f.fx * fy_x) / det;
    x += dx; y += dy;
    if (Math.abs(x) > 2.4 || Math.abs(y) > 2.4) { x = bx; y = by; break; }
    if (Math.hypot(dx, dy) < 1e-7) { ok = true; break; }
  }
  // In-plane Hessian of V at (x,y) and the out-of-plane (z) curvature.
  // The 1/r potential is 3D-harmonic, so Vxx + Vyy + Vzz = 0: whatever the
  // in-plane curvatures do, the z direction makes the three sum to zero, so
  // there is always at least one hill. That is Earnshaw's theorem.
  const d = 0.02;
  const Vxx = (Vpot(x + d, y) - 2 * Vpot(x, y) + Vpot(x - d, y)) / (d * d);
  const Vyy = (Vpot(x, y + d) - 2 * Vpot(x, y) + Vpot(x, y - d)) / (d * d);
  const Vxy = (Vpot(x + d, y + d) - Vpot(x + d, y - d) - Vpot(x - d, y + d) + Vpot(x - d, y - d)) / (4 * d * d);
  const tr = Vxx + Vyy, R = Math.sqrt(((Vxx - Vyy) / 2) ** 2 + Vxy * Vxy);
  const l1 = tr / 2 + R, l2 = tr / 2 - R;     // l1 >= l2 (in-plane curvatures)
  const evec = (lam) => { let ex = Vxy, ey = lam - Vxx; const n = Math.hypot(ex, ey); if (n < 1e-9) { ex = 1; ey = 0; } else { ex /= n; ey /= n; } return [ex, ey]; };
  // out-of-plane curvature, computed independently from the z-cut, so the
  // Vxx + Vyy + Vzz = 0 check is a real test of 3D-harmonicity, not a tautology.
  const vzc = (s) => { let v = 0; for (const c of charges) v += c.q / Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2 + s * s + 1e-6); return v; };
  const lz = (vzc(d) - 2 * vzc(0) + vzc(-d)) / (d * d);
  eq = { x, y, ok, u1: evec(l1), u2: evec(l2), l1, l2, lz };
}

// Out-of-plane potential a distance s above the plane at the balance point.
function Vz(s) {
  let v = 0;
  for (const c of charges) v += c.q / Math.sqrt((eq.x - c.x) ** 2 + (eq.y - c.y) ** 2 + s * s + 1e-6);
  return v;
}

// --- potential grid -> heatmap + contour segments ---
function buildField() {
  if (!SCN) return;
  const { draw } = SCN;
  const nx = Math.max(40, Math.round(draw.w / 14)), ny = Math.max(48, Math.round(draw.h / 14));
  const xs = [], ys = [];
  for (let i = 0; i < nx; i++) xs.push(invX(draw.x + (i + 0.5) / nx * draw.w));
  for (let j = 0; j < ny; j++) ys.push(invY(draw.y + (j + 0.5) / ny * draw.h));
  const grid = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) grid[j * nx + i] = Vpot(xs[i], ys[j]);

  // robust scale (ignore near-charge spikes).
  const sorted = Array.from(grid).map(Math.abs).sort((a, b) => a - b);
  const Vsc = Math.max(0.5, sorted[Math.floor(sorted.length * 0.6)]);

  if (!heat) heat = document.createElement('canvas');
  heat.width = nx; heat.height = ny;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(nx, ny);
  for (let k = 0; k < nx * ny; k++) {
    const t = 0.5 + 0.5 * Math.tanh(grid[k] / (2 * Vsc));
    const c = rdbu(t);
    img.data[k * 4] = c.r; img.data[k * 4 + 1] = c.g; img.data[k * 4 + 2] = c.b; img.data[k * 4 + 3] = 150;
  }
  hctx.putImageData(img, 0, 0);

  // contour segments (marching squares, edge-crossing pairs).
  contours = [];
  const lo = -1.6 * Vsc, hi = 2.4 * Vsc;
  const levels = [];
  for (let L = 1; L <= 9; L++) levels.push(lo + (hi - lo) * L / 10);
  const at = (i, j) => grid[j * nx + i];
  const wxA = (i) => xs[i], wyA = (j) => ys[j];
  for (const L of levels) {
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), dd = at(i, j + 1);
      const pts = [];
      const cross = (va, vb, x1, y1, x2, y2) => { if ((va > L) !== (vb > L)) { const t = (L - va) / (vb - va); pts.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } };
      cross(a, b, wxA(i), wyA(j), wxA(i + 1), wyA(j));
      cross(b, c, wxA(i + 1), wyA(j), wxA(i + 1), wyA(j + 1));
      cross(c, dd, wxA(i + 1), wyA(j + 1), wxA(i), wyA(j + 1));
      cross(dd, a, wxA(i), wyA(j + 1), wxA(i), wyA(j));
      if (pts.length === 2) contours.push([pts[0], pts[1]]);
      else if (pts.length === 4) { contours.push([pts[0], pts[1]]); contours.push([pts[2], pts[3]]); }
    }
  }
}
function rebuild() { findEquilibrium(); buildField(); }

function resetTest() {
  // nudge along the in-plane unstable direction if one exists (so it
  // visibly rolls off); otherwise (in-plane stable) sit near the point.
  const o = 0.06, u = (eq.l2 < 0 ? eq.u2 : eq.u1);
  test = { x: eq.x + u[0] * o, y: eq.y + u[1] * o, vx: 0, vy: 0, alive: true };
  trail = [];
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
  panel(col, r, 'Potential landscape; no point can trap the charge');
  const { draw } = SCN;

  ctx.save();
  clipTo(ctx, draw);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, draw.x, draw.y, draw.w, draw.h);

  // equipotential contours.
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (const s of contours) { ctx.moveTo(WX(s[0][0]), WY(s[0][1])); ctx.lineTo(WX(s[1][0]), WY(s[1][1])); }
  ctx.stroke();

  // principal axes at the balance point (valley green, hill red).
  if (eq.ok) {
    const drawAxis = (u, c) => {
      const aX = WX(eq.x - u[0] * 0.7), aY = WY(eq.y - u[1] * 0.7), bX = WX(eq.x + u[0] * 0.7), bY = WY(eq.y + u[1] * 0.7);
      ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.stroke(); ctx.setLineDash([]);
    };
    drawAxis(eq.u1, col.valley);     // valley (stable)
    drawAxis(eq.u2, col.hill);       // hill (unstable)
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(WX(eq.x), WY(eq.y), 6, 0, 2 * Math.PI); ctx.stroke();
  }

  // fixed charges.
  for (const c of charges) {
    const X = WX(c.x), Y = WY(c.y);
    ctx.beginPath(); ctx.arc(X, Y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = c.q > 0 ? col.pos : col.neg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'heading', 'sans', 800);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.q > 0 ? '+' : '−', X, Y + 1);
  }

  // test-charge trail.
  if (trail.length > 1) {
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 2; ctx.beginPath();
    trail.forEach((p, i) => { const X = WX(p[0]), Y = WY(p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
  }
  // force arrow on the test charge.
  const f = Efield(test.x, test.y); const q = qTest();
  const Fx = q * f.fx, Fy = q * f.fy, fm = Math.hypot(Fx, Fy) || 1; const L = Math.min(0.6, 0.18 + 0.4 * Math.tanh(fm));
  const tX = WX(test.x), tY = WY(test.y), eX = WX(test.x + Fx / fm * L), eY = WY(test.y + Fy / fm * L);
  ctx.strokeStyle = col.test; ctx.fillStyle = col.test; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(eX, eY); ctx.stroke();
  const ang = Math.atan2(eY - tY, eX - tX);
  ctx.beginPath(); ctx.moveTo(eX, eY); ctx.lineTo(eX - 8 * Math.cos(ang - 0.4), eY - 8 * Math.sin(ang - 0.4)); ctx.lineTo(eX - 8 * Math.cos(ang + 0.4), eY - 8 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
  // test charge.
  ctx.beginPath(); ctx.arc(tX, tY, 8, 0, 2 * Math.PI);
  ctx.fillStyle = q > 0 ? col.pos : col.neg; ctx.fill(); ctx.strokeStyle = col.test; ctx.lineWidth = 2.5; ctx.stroke();

  ctx.restore();

  // readout strip.
  const v = Math.hypot(test.vx, test.vy);
  const items = [
    [{ square: 'square', triangle: 'triangle', two: 'two +', quadrupole: '± quadrupole', pentagon: 'five +' }[selPreset.value], col.fg],
    [`|F| ${(Math.hypot(Fx, Fy)).toFixed(2)}`, col.test],
    [test.alive ? (v < 0.06 ? 'balancing…' : 'sliding off') : 'escaped', col.muted],
    ['no stable trap', col.hill],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Potential through the balance point (in-plane and z)');

  const inner = { x: r.x + 44, y: r.y + 30, w: r.w - 44 - 16, h: r.h - 30 - 42 };
  const S = 0.9, N = 100;
  const v0 = Vpot(eq.x, eq.y);
  const cutInPlane = (u) => { const a = []; for (let i = 0; i <= N; i++) { const s = -S + 2 * S * i / N; a.push(Vpot(eq.x + u[0] * s, eq.y + u[1] * s) - v0); } return a; };
  const cutZ = () => { const a = []; for (let i = 0; i <= N; i++) { const s = -S + 2 * S * i / N; a.push(Vz(s) - v0); } return a; };
  const c1 = cutInPlane(eq.u1), c2 = cutInPlane(eq.u2), cz = cutZ();
  let mx = 1e-6; for (const a of [c1, c2, cz]) for (const v of a) mx = Math.max(mx, Math.abs(v));
  const xOf = (i) => inner.x + i / N * inner.w;
  const yOf = (v) => inner.y + inner.h / 2 - (v / mx) * (inner.h / 2) * 0.9;
  const sign = (lam) => (lam >= 0 ? col.valley : col.hill);

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, inner.y + inner.h / 2); ctx.lineTo(inner.x + inner.w, inner.y + inner.h / 2); ctx.moveTo(xOf(N / 2), inner.y); ctx.lineTo(xOf(N / 2), inner.y + inner.h); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const plot = (a, c, dash) => { ctx.strokeStyle = c; ctx.lineWidth = 2.6; if (dash) ctx.setLineDash([6, 4]); ctx.beginPath(); a.forEach((v, i) => { const X = xOf(i), Y = yOf(v); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]); };
  plot(c1, sign(eq.l1), false);
  plot(c2, sign(eq.l2), false);
  plot(cz, sign(eq.lz), true);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(N / 2), yOf(0), 4, 0, 2 * Math.PI); ctx.fill();

  // labels + legend.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('distance from balance point', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 30, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('potential V', 0, 0); ctx.restore();
  ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.valley; ctx.fillText('valley (stable)', inner.x + 6, inner.y + 6);
  ctx.fillStyle = col.hill; ctx.fillText('hill (unstable)', inner.x + 6, inner.y + 20);
  ctx.fillStyle = col.muted; ctx.fillText('z = dashed', inner.x + inner.w - 78, inner.y + 6);
}

function render() {
  if (!REG) relayout();
  if (!charges.length) { loadPreset(); rebuild(); resetTest(); }
  if (!heat) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

// --- dynamics ---
const PHYS_DT = 1 / 240;
let accum = 0;
function stepTest(dt) {
  if (!test.alive) return;
  accum += dt;
  let guard = 0;
  while (accum >= PHYS_DT && guard < 400) {
    accum -= PHYS_DT; guard++;
    const q = qTest();
    const a1 = Efield(test.x, test.y);
    test.vx += q * a1.fx * PHYS_DT; test.vy += q * a1.fy * PHYS_DT;
    const sp = Math.hypot(test.vx, test.vy); if (sp > 6) { test.vx *= 6 / sp; test.vy *= 6 / sp; }
    test.x += test.vx * PHYS_DT; test.y += test.vy * PHYS_DT;
    for (const c of charges) if (Math.hypot(test.x - c.x, test.y - c.y) < 0.12) { test.alive = false; }
    if (Math.hypot(test.x, test.y) > VIEW * 1.5) test.alive = false;
  }
  trail.push([test.x, test.y]); if (trail.length > 160) trail.shift();
}

let dragKind = null, dragIdx = -1;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  const dT = (WX(test.x) - sx) ** 2 + (WY(test.y) - sy) ** 2;
  let best = -1, bd = 22 * 22;
  charges.forEach((c, i) => { const d = (WX(c.x) - sx) ** 2 + (WY(c.y) - sy) ** 2; if (d < bd) { bd = d; best = i; } });
  if (dT < 22 * 22 && dT <= bd) { dragKind = 'test'; }
  else if (best >= 0) { dragKind = 'charge'; dragIdx = best; }
  if (dragKind) { canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragKind) return; const { sx, sy } = pScreen(ev);
  const wx = invX(sx), wy = invY(sy), lim = VIEW - 0.1;
  if (dragKind === 'test') { test.x = Math.max(-lim, Math.min(lim, wx)); test.y = Math.max(-lim, Math.min(lim, wy)); test.vx = 0; test.vy = 0; test.alive = true; trail = []; }
  else { charges[dragIdx].x = Math.max(-lim, Math.min(lim, wx)); charges[dragIdx].y = Math.max(-lim, Math.min(lim, wy)); rebuild(); }
  render();
});
const endDrag = () => { dragKind = null; dragIdx = -1; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running && dragKind !== 'test') stepTest(dt);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals(); loadPreset(); relayout(); resetTest();
  for (let i = 0; i < 90; i++) stepTest(1 / 120);   // pre-roll so the slide-off is visible
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
  const f = Efield(test.x, test.y);
  return {
    fields: [
      { key: 'layout', label: 'layout', value: { square: 'square', triangle: 'triangle', two: 'two +', quadrupole: '± quadrupole', pentagon: 'five +' }[selPreset.value], format: 'text' },
      { key: 'eq', label: 'balance point', value: `(${eq.x.toFixed(2)}, ${eq.y.toFixed(2)})`, format: 'text' },
      { key: 'force', label: 'force on test $|F|$', value: Math.hypot(qTest() * f.fx, qTest() * f.fy), format: 'float' },
      { key: 'state', label: 'test charge', value: test.alive ? 'in flight' : 'escaped/hit', format: 'text' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Earnshaw / Laplace: the three principal curvatures sum to zero in
    // vacuum (Vxx + Vyy + Vzz = 0), so there is always at least one hill.
    const sum = (eq.l1 || 0) + (eq.l2 || 0) + (eq.lz || 0);
    const scale = Math.max(1e-9, Math.abs(eq.l1 || 0) + Math.abs(eq.l2 || 0) + Math.abs(eq.lz || 0));
    const rel = Math.abs(sum) / scale;
    return [{
      key: 'laplace',
      label: '∇²V = 0 at balance (no trap)',
      value: rel.toExponential(2),
      status: rel < 5e-2 ? 'pass' : (rel < 2e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
