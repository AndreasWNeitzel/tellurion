import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the Biot-Savart field of current coils, Canvas2D
// only. Top region: a slice through the symmetry axis showing the
// magnetic field lines (streamlines of the in-plane field) over a
// field-strength colour map, with the wire crossings marked. Bottom
// region: the axial field Bz along the symmetry axis, where the loop
// peak, the Helmholtz flat spot, and the solenoid plateau each show up.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec.
// 5.2; Jackson, Classical Electrodynamics, Sec. 5.3.

import { biotSavart, divergence } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selCoil = document.getElementById('select-coil');
const sliderCurrent = document.getElementById('slider-current');
const sliderRadius = document.getElementById('slider-radius');
const sliderGeom = document.getElementById('slider-geom');
const valueCoil = document.getElementById('value-coil');
const valueCurrent = document.getElementById('value-current');
const valueRadius = document.getElementById('value-radius');
const valueGeom = document.getElementById('value-geom');
const labelGeom = document.getElementById('label-geom');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const Z = 2.6;
let R = 1;                          // coil radius (slider)
let geom = 1;                       // Helmholtz separation, or solenoid length factor
let running = !DETERMINISTIC;
let segs = [];
let lines = [], heat = null, axial = [], bzMax = 1;
let phase = 0;

function current() { return parseFloat(sliderCurrent.value); }
function readGeom() { R = parseFloat(sliderRadius.value); geom = parseFloat(sliderGeom.value); }

// coarse coil geometry (I = 1) for fast field evaluation.
function circle(z0, n = 72) { const pts = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; pts.push([R * Math.cos(t), R * Math.sin(t), z0]); } return { pts, I: 1 }; }
function solenoidLen() { return (2 + 2 * geom) * R; }     // geom = 1 -> 4R (a long solenoid)
function coilSegments(name) {
  if (name === 'helmholtz') return [circle(-geom / 2), circle(geom / 2)];
  if (name === 'solenoid') { const N = 28, L = solenoidLen(), out = []; for (let k = 0; k < N; k++) out.push(circle(-L / 2 + L * k / (N - 1))); return out; }
  return [circle(0)];
}
function ringZs(name) {
  if (name === 'helmholtz') return [-geom / 2, geom / 2];
  if (name === 'solenoid') { const N = 28, L = solenoidLen(), zs = []; for (let k = 0; k < N; k++) zs.push(-L / 2 + L * k / (N - 1)); return zs; }
  return [0];
}
function Bplane(x, z) { const b = biotSavart(segs, [x, 0, z]); return [b[0], b[2]]; }

function syncVals() {
  valueCoil.textContent = selCoil.value;
  valueCurrent.textContent = current().toFixed(1);
  valueRadius.textContent = R.toFixed(2);
  valueGeom.textContent = geom.toFixed(2);
  const c = selCoil.value;
  labelGeom.textContent = c === 'solenoid' ? 'length' : 'separation';
  sliderGeom.disabled = (c === 'loop');                 // a single loop has no second geometry parameter
  sliderGeom.parentElement.style.opacity = (c === 'loop') ? '0.4' : '1';
}
selCoil.addEventListener('change', () => { syncVals(); rebuild(); render(); });
sliderCurrent.addEventListener('input', () => { syncVals(); render(); });
sliderRadius.addEventListener('input', () => { readGeom(); syncVals(); rebuild(); render(); });
sliderGeom.addEventListener('input', () => { readGeom(); syncVals(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  selCoil.value = 'loop'; sliderCurrent.value = '1.5'; sliderRadius.value = '1'; sliderGeom.value = '1'; readGeom();
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); rebuild(); render();
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
  const titleH = 22, stripH = 26, pad = 14;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h) - 2 * pad;
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale: size / (2 * Z) };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.95 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
  computeSceneTransform();
  rebuild();
}
const WX = (x) => SCN.ox + x * SCN.scale;
const WY = (z) => SCN.oy - z * SCN.scale;

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    line: 'rgba(232,237,247,0.78)', wire: '#ffd166', bz: '#5bc0eb',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// trace one streamline of the in-plane field from (x0,z0) in direction sgn.
function streamline(x0, z0, sgn) {
  const pts = [[x0, z0]]; let x = x0, z = z0; const ds = 0.05;
  for (let s = 0; s < 360; s++) {
    const [bx, bz] = Bplane(x, z); const m = Math.hypot(bx, bz); if (m < 1e-9) break;
    x += sgn * bx / m * ds; z += sgn * bz / m * ds;
    if (Math.abs(x) > Z * 1.05 || Math.abs(z) > Z * 1.05) break;
    let hitWire = false;
    for (const rz of ringZs(selCoil.value)) { if (Math.hypot(Math.abs(x) - R, z - rz) < 0.07) hitWire = true; }
    if (hitWire) { pts.push([x, z]); break; }
    pts.push([x, z]);
  }
  return pts;
}

function rebuild() {
  if (!SCN) return;
  segs = coilSegments(selCoil.value);
  // streamlines: seed near the axis at z=0 and a couple outside, mirror in x.
  lines = [];
  const seedsX = [0.18, 0.45, 0.72, 0.95], outer = [1.45, 2.0];
  for (const sx of seedsX) {
    for (const mir of [1, -1]) { lines.push(streamline(mir * sx, 0, 1).concat(streamline(mir * sx, 0, -1).slice(1).reverse().concat().reverse())); }
  }
  // simpler: build each line as forward + backward separately.
  lines = [];
  for (const sx of seedsX.concat(outer)) for (const mir of [1, -1]) {
    const f = streamline(mir * sx, 0, 1), b = streamline(mir * sx, 0, -1);
    lines.push(b.slice(1).reverse().concat(f));
  }

  // heatmap of |B| (I = 1).
  const { draw } = SCN;
  const nx = 40, ny = Math.max(40, Math.round(40 * draw.h / draw.w));
  if (!heat) heat = document.createElement('canvas');
  heat.width = nx; heat.height = ny;
  const hctx = heat.getContext('2d');
  const img = hctx.createImageData(nx, ny);
  let mmax = 1e-9; const mags = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = -Z + 2 * Z * (i + 0.5) / nx, z = Z - 2 * Z * (j + 0.5) / ny;
    const [bx, bz] = Bplane(x, z); const m = Math.hypot(bx, bz); mags.push(m); mmax = Math.max(mmax, m);
  }
  const sc = mags.slice().sort((a, b) => a - b)[Math.floor(mags.length * 0.75)] || 1;
  for (let k = 0; k < nx * ny; k++) {
    const t = mags[k] / (mags[k] + 1.5 * sc);
    const c = viridis(0.08 + 0.85 * t);
    const a = Math.min(0.5, 0.6 * Math.pow(t, 0.8));
    img.data[k * 4] = c.r; img.data[k * 4 + 1] = c.g; img.data[k * 4 + 2] = c.b; img.data[k * 4 + 3] = a * 255;
  }
  hctx.putImageData(img, 0, 0);

  // axial Bz (I = 1).
  axial = []; bzMax = 1e-9;
  for (let i = 0; i <= 160; i++) { const z = -Z + 2 * Z * i / 160; const bz = biotSavart(segs, [0, 0, z])[2]; axial.push([z, bz]); bzMax = Math.max(bzMax, Math.abs(bz)); }
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
  panel(col, r, 'Field lines through the coil (axial slice)');
  const { draw, scale } = SCN;

  ctx.save();
  clipTo(ctx, { x: SCN.ox - Z * scale, y: SCN.oy - Z * scale, w: 2 * Z * scale, h: 2 * Z * scale });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heat, SCN.ox - Z * scale, SCN.oy - Z * scale, 2 * Z * scale, 2 * Z * scale);

  // axis line.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(WX(0), WY(-Z)); ctx.lineTo(WX(0), WY(Z)); ctx.stroke(); ctx.setLineDash([]);

  // field lines.
  ctx.strokeStyle = col.line; ctx.lineWidth = 1.5;
  for (const ln of lines) { if (ln.length < 2) continue; ctx.beginPath(); ln.forEach((p, i) => { const X = WX(p[0]), Y = WY(p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); }
  // marching arrowheads along field lines (brighter with more current).
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.5 + 0.16 * current())})`; const spacing = 0.9;
  for (const ln of lines) {
    if (ln.length < 4) continue; const len = (ln.length - 1) * 0.05;
    for (let sdist = (phase % spacing); sdist < len - 0.05; sdist += spacing) {
      const idx = Math.max(1, Math.min(ln.length - 1, Math.round(sdist / 0.05)));
      const a = ln[idx - 1], b = ln[idx]; const ang = Math.atan2(WY(b[1]) - WY(a[1]), WX(b[0]) - WX(a[0]));
      const X = WX(b[0]), Y = WY(b[1]), h = 4.5;
      ctx.beginPath(); ctx.moveTo(X + h * Math.cos(ang), Y + h * Math.sin(ang)); ctx.lineTo(X + h * Math.cos(ang + 2.5), Y + h * Math.sin(ang + 2.5)); ctx.lineTo(X + h * Math.cos(ang - 2.5), Y + h * Math.sin(ang - 2.5)); ctx.closePath(); ctx.fill();
    }
  }

  // wire crossings: +R out of page (dot), -R into page (cross).
  for (const rz of ringZs(selCoil.value)) {
    for (const side of [1, -1]) {
      const X = WX(side * R), Y = WY(rz), rad = 5;
      ctx.fillStyle = '#11151c'; ctx.strokeStyle = col.wire; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X, Y, rad, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = col.wire; ctx.lineWidth = 1.6;
      if (side === 1) { ctx.fillStyle = col.wire; ctx.beginPath(); ctx.arc(X, Y, 1.6, 0, 2 * Math.PI); ctx.fill(); }   // out of page
      else { ctx.beginPath(); ctx.moveTo(X - 3, Y - 3); ctx.lineTo(X + 3, Y + 3); ctx.moveTo(X + 3, Y - 3); ctx.lineTo(X - 3, Y + 3); ctx.stroke(); } // into page
    }
  }

  ctx.restore();

  // readout strip.
  const I = current();
  const bcenter = Math.abs(biotSavart(segs, [0, 0, 0])[2]) * I;
  const items = [
    [selCoil.value, col.fg],
    [`I ${I.toFixed(1)}`, col.wire],
    [`B(0) ${bcenter.toFixed(1)}`, col.bz],
    ['div B = 0', col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Axial field Bz along the symmetry axis');

  const inner = { x: r.x + 54, y: r.y + 28, w: r.w - 54 - 16, h: r.h - 28 - 42 };
  const I = current();
  const ymax = bzMax * I * 1.12;
  const xOf = (z) => inner.x + (z + Z) / (2 * Z) * inner.w;
  const yOf = (bz) => inner.y + inner.h - (bz / ymax) * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const frac of [0, 0.5, 1]) { const y = inner.y + inner.h - frac * inner.h; ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((ymax * frac).toFixed(1), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const z of [-2, -1, 0, 1, 2]) ctx.fillText(String(z), xOf(z), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // coil location markers on the z axis.
  for (const rz of ringZs(selCoil.value)) { ctx.strokeStyle = 'rgba(255,209,102,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xOf(rz), inner.y); ctx.lineTo(xOf(rz), inner.y + inner.h); ctx.stroke(); }

  ctx.strokeStyle = col.bz; ctx.lineWidth = 2.6; ctx.beginPath();
  axial.forEach((pt, i) => { const X = xOf(pt[0]), Y = yOf(pt[1] * I); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.stroke();
  // centre value dot.
  ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(xOf(0), yOf(biotSavart(segs, [0, 0, 0])[2] * I), 4.5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('position along axis  z', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 42, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('axial field Bz', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!segs.length) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) phase += 1.7 * current() * dt;            // arrow speed grows with the current
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  const pc = params.get('coil'); if (pc) selCoil.value = pc;
  const pr = params.get('r'); if (pr) sliderRadius.value = pr;
  const pg = params.get('geom'); if (pg) sliderGeom.value = pg;
  readGeom(); syncVals(); relayout(); render();
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
  const I = current();
  return {
    fields: [
      { key: 'coil', label: 'coil', value: selCoil.value, format: 'text' },
      { key: 'I', label: 'current I', value: I, format: 'float' },
      { key: 'R', label: 'coil radius R', value: R, format: 'float' },
      { key: 'geom', label: selCoil.value === 'solenoid' ? 'solenoid length' : 'separation d', value: selCoil.value === 'solenoid' ? solenoidLen() : geom, format: 'float' },
      { key: 'Bc', label: 'axial field at centre', value: biotSavart(segs, [0, 0, 0])[2] * I, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // No magnetic monopoles: div B = 0 everywhere off the wire.
    let worst = 0;
    for (const P of [[0.4, 0.3, 0.2], [0.7, -0.2, 0.5], [0.2, 0.5, -0.3]]) {
      const dv = Math.abs(divergence(segs, P, 0.02));
      const scale = Math.hypot(...biotSavart(segs, P)) + 1e-6;
      worst = Math.max(worst, dv / scale);
    }
    return [{
      key: 'divB',
      label: 'div B = 0 (no monopoles)',
      value: worst.toExponential(2),
      status: worst < 1e-2 ? 'pass' : (worst < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
