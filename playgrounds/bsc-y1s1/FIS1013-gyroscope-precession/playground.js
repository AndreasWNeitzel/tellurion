import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the precession of a heavy symmetric top, Canvas2D
// only. Top region: a tilted flywheel on a pivot, spinning and precessing
// around the vertical in orthographic pseudo-3D, with its angular momentum
// L along the axis, the weight Mg at the centre of mass, and the sideways
// precession drift. Bottom region: the precession rate against the spin
// rate, Omega = Mgr / (I_s omega_s), with the live operating point.
//
// Reference: Marion and Thornton, Classical Dynamics, 5th ed., Ch. 11;
// Goldstein, Poole, Safko, Classical Mechanics, 3rd ed., Sec. 5.7.

import { createTop, stepTop, precessionRate, precConst, M_TOP, G_GRAV, R_COM, I_SPIN, L_VIS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderSpin = document.getElementById('slider-spin');
const sliderTilt = document.getElementById('slider-tilt');
const sliderMass = document.getElementById('slider-mass');
const sliderArm = document.getElementById('slider-arm');
const sliderGrav = document.getElementById('slider-grav');
const valueSpin = document.getElementById('value-spin');
const valueTilt = document.getElementById('value-tilt');
const valueMass = document.getElementById('value-mass');
const valueArm = document.getElementById('value-arm');
const valueGrav = document.getElementById('value-grav');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const PHYSICS_DT = 1 / 240;
let running = !DETERMINISTIC;
let s = null;
let psiVis = 0;                 // visual spin angle (decoupled from the fast true spin)

function rebuild() {
  s = createTop({
    theta: parseFloat(sliderTilt.value),
    omega_spin: parseFloat(sliderSpin.value),
    M: parseFloat(sliderMass.value),
    r: parseFloat(sliderArm.value),
    g: parseFloat(sliderGrav.value),
  });
  psiVis = 0;
}
function syncVals() {
  valueSpin.textContent = parseFloat(sliderSpin.value).toFixed(0);
  valueTilt.textContent = `${Math.round(parseFloat(sliderTilt.value) * 180 / Math.PI)}°`;
  valueMass.textContent = parseFloat(sliderMass.value).toFixed(1);
  valueArm.textContent = parseFloat(sliderArm.value).toFixed(2);
  valueGrav.textContent = parseFloat(sliderGrav.value).toFixed(1);
}
sliderSpin.addEventListener('input', () => { syncVals(); if (s) s.omega_spin = parseFloat(sliderSpin.value); render(); });
sliderTilt.addEventListener('input', () => { syncVals(); if (s) s.theta = parseFloat(sliderTilt.value); render(); });
sliderMass.addEventListener('input', () => { syncVals(); if (s) s.M = parseFloat(sliderMass.value); render(); });
sliderArm.addEventListener('input', () => { syncVals(); if (s) s.r = parseFloat(sliderArm.value); render(); });
sliderGrav.addEventListener('input', () => { syncVals(); if (s) s.g = parseFloat(sliderGrav.value); render(); });
btnReset.addEventListener('click', () => {
  sliderSpin.value = '50'; sliderTilt.value = '0.6';
  sliderMass.value = '1.0'; sliderArm.value = '0.5'; sliderGrav.value = '9.8';
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
    { name: 'scene', weight: 1.95 },
    { name: 'diagnostic', weight: 1.05 },
  ]);
}

// orthographic camera: world z is vertical (up). Rotate about z by AZ,
// then tilt down by elevation EL. Returns [screenX, screenUp, depth].
const AZ = 0.35, EL = 0.52;
const CA = Math.cos(AZ), SAz = Math.sin(AZ), CE = Math.cos(EL), SE = Math.sin(EL);
function project(p) {
  const x1 = p[0] * CA - p[1] * SAz;
  const y1 = p[0] * SAz + p[1] * CA;
  const z1 = p[2];
  return [x1, z1 * CE - y1 * SE, y1 * CE + z1 * SE];
}
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    L: '#ffce4d', grav: '#ef476f', prec: '#5bc0eb', disk: '#4a6fa5',
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

function drawArrow(SX, SY, a, b, color, label, lw) {
  const ax = SX(a), ay = SY(a), bx = SX(b), by = SY(b);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.5;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  const ang = Math.atan2(by - ay, bx - ax), h = 9;
  ctx.beginPath(); ctx.moveTo(bx, by);
  ctx.lineTo(bx - h * Math.cos(ang - 0.4), by - h * Math.sin(ang - 0.4));
  ctx.lineTo(bx - h * Math.cos(ang + 0.4), by - h * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  if (label) {
    ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + (bx - ax) * 0.12, by + (by - ay) * 0.12);
  }
}

function drawScene(col, r) {
  panel(col, r, 'A spinning top: gravity pulls down, the axis goes around');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const scale = Math.min(draw.w * 0.34, draw.h * 0.46);
  const ox = draw.x + draw.w * 0.5, oy = draw.y + draw.h * 0.76;
  const SX = (p) => ox + project(p)[0] * scale;
  const SY = (p) => oy - project(p)[1] * scale;

  const th = s.theta, ph = s.phi;
  const n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
  const u = [-Math.sin(ph), Math.cos(ph), 0];      // horizontal, perpendicular to axis
  const v = cross(n, u);
  const O = [0, 0, 0];
  const tip = [n[0] * L_VIS, n[1] * L_VIS, n[2] * L_VIS];
  const dcR = 0.52 * L_VIS;
  const dc = [n[0] * dcR, n[1] * dcR, n[2] * dcR];   // disk centre / COM
  const rd = 0.34 * L_VIS;

  ctx.save();
  clipTo(ctx, draw);

  // ground line + pivot.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(draw.x + 6, SY(O)); ctx.lineTo(draw.x + draw.w - 6, SY(O)); ctx.stroke();

  // swept cone: the surface the axis sweeps out as it precesses.
  const RcC = L_VIS * Math.sin(th), hzC = L_VIS * Math.cos(th);
  ctx.fillStyle = 'rgba(91,192,235,0.09)';
  ctx.beginPath(); ctx.moveTo(SX(O), SY(O));
  for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI; const P = [RcC * Math.cos(a), RcC * Math.sin(a), hzC]; ctx.lineTo(SX(P), SY(P)); }
  ctx.closePath(); ctx.fill();

  // vertical reference.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(SX(O), SY(O)); ctx.lineTo(SX([0, 0, L_VIS * 1.18]), SY([0, 0, L_VIS * 1.18])); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('vertical', SX([0, 0, L_VIS * 1.18]) + 6, SY([0, 0, L_VIS * 1.18]));

  // precession circle (the path the tip traces).
  const Rc = L_VIS * Math.sin(th), hz = L_VIS * Math.cos(th);
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI; const P = [Rc * Math.cos(a), Rc * Math.sin(a), hz]; const X = SX(P), Y = SY(P); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.stroke(); ctx.setLineDash([]);

  // axle (pivot to tip).
  ctx.strokeStyle = 'rgba(200,210,225,0.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(SX(O), SY(O)); ctx.lineTo(SX(tip), SY(tip)); ctx.stroke();

  // flywheel: filled ellipse from the rim, shaded by axis-vs-light.
  const light = [0.3, 0.4, 0.85];
  const litFace = Math.abs(n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);
  const sh = 0.45 + 0.5 * litFace;
  const rim = [];
  for (let i = 0; i < 64; i++) { const a = i / 64 * 2 * Math.PI; rim.push([dc[0] + rd * (Math.cos(a) * u[0] + Math.sin(a) * v[0]), dc[1] + rd * (Math.cos(a) * u[1] + Math.sin(a) * v[1]), dc[2] + rd * (Math.cos(a) * u[2] + Math.sin(a) * v[2])]); }
  const dk = col.disk;
  const dr = parseInt(dk.slice(1, 3), 16), dg = parseInt(dk.slice(3, 5), 16), db = parseInt(dk.slice(5, 7), 16);
  ctx.fillStyle = `rgb(${Math.round(dr * sh)},${Math.round(dg * sh)},${Math.round(db * sh)})`;
  ctx.beginPath(); rim.forEach((p, i) => { const X = SX(p), Y = SY(p); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(200,220,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();

  // spokes (rotate at the visual spin rate so it reads as spinning).
  ctx.strokeStyle = 'rgba(220,235,255,0.85)'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 6; k++) {
    const a = psiVis + k * Math.PI / 3;
    const P = [dc[0] + rd * (Math.cos(a) * u[0] + Math.sin(a) * v[0]), dc[1] + rd * (Math.cos(a) * u[1] + Math.sin(a) * v[1]), dc[2] + rd * (Math.cos(a) * u[2] + Math.sin(a) * v[2])];
    ctx.beginPath(); ctx.moveTo(SX(dc), SY(dc)); ctx.lineTo(SX(P), SY(P)); ctx.stroke();
  }
  ctx.fillStyle = '#dfeaff'; ctx.beginPath(); ctx.arc(SX(dc), SY(dc), 4, 0, 2 * Math.PI); ctx.fill();

  // angular momentum L along the axis (gold), beyond the tip.
  drawArrow(SX, SY, O, [n[0] * L_VIS * 1.32, n[1] * L_VIS * 1.32, n[2] * L_VIS * 1.32], col.L, 'L', 3);

  // weight Mg straight down at the COM (red).
  drawArrow(SX, SY, dc, [dc[0], dc[1], dc[2] - 0.5], col.grav, 'Mg', 2.5);

  // precession drift at the tip (blue), tangent to the circle (+u).
  const driftB = [tip[0] + u[0] * 0.42, tip[1] + u[1] * 0.42, tip[2] + u[2] * 0.42];
  drawArrow(SX, SY, tip, driftB, col.prec, 'precesses', 2.5);
  ctx.fillStyle = col.prec; ctx.beginPath(); ctx.arc(SX(tip), SY(tip), 4, 0, 2 * Math.PI); ctx.fill();

  ctx.restore();

  // readout strip.
  const Wp = precessionRate(s);
  const items = [
    [`ω_s ${s.omega_spin.toFixed(0)}`, col.fg],
    [`Ω_p ${Wp.toFixed(2)}`, col.prec],
    [`T_p ${(2 * Math.PI / Wp).toFixed(1)}s`, col.muted],
    [`Mgr ${(s.M * s.g * s.r).toFixed(1)}`, col.grav],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

const SPIN_MIN = 20, SPIN_MAX = 120;
function drawDiagnostic(col, r) {
  panel(col, r, 'Precession rate vs spin rate: a hyperbola');

  const inner = { x: r.x + 48, y: r.y + 28, w: r.w - 48 - 16, h: r.h - 28 - 42 };
  // Auto-scale to the current Mgr/I_s so the hyperbola fills the frame as the
  // mass, arm, or gravity sliders change.
  const yMax = (precConst(s) / SPIN_MIN) * 1.06;
  const xOf = (w) => inner.x + (w - SPIN_MIN) / (SPIN_MAX - SPIN_MIN) * inner.w;
  const yOf = (Wp) => inner.y + inner.h - (Wp / yMax) * inner.h;

  // gridlines + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 2; k++) { const Wp = yMax * k / 2; const y = yOf(Wp); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(Wp.toFixed(1), inner.x - 6, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const w of [20, 50, 80, 110]) ctx.fillText(String(w), xOf(w), inner.y + inner.h + 6);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // curve Omega = (Mgr/I_s) / omega, clipped to the frame.
  const pc = precConst(s);
  ctx.save();
  ctx.beginPath(); ctx.rect(inner.x, inner.y, inner.w, inner.h); ctx.clip();
  ctx.strokeStyle = col.prec; ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) { const w = SPIN_MIN + (SPIN_MAX - SPIN_MIN) * i / 120; const X = xOf(w), Y = yOf(pc / w); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
  ctx.stroke();
  ctx.restore();

  // current operating point + guide lines.
  const w0 = s.omega_spin, Wp0 = precessionRate(s);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(w0), yOf(Wp0)); ctx.lineTo(xOf(w0), inner.y + inner.h); ctx.moveTo(xOf(w0), yOf(Wp0)); ctx.lineTo(inner.x, yOf(Wp0)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(xOf(w0), yOf(Wp0), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.fg; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`Ω_p = ${Wp0.toFixed(2)} rad/s`, xOf(w0) + 9, yOf(Wp0) - 4);

  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('spin rate ω_s (rad/s)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 36, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('precession Ω_p (rad/s)', 0, 0); ctx.restore();
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

let last = performance.now();
let accum = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt * 1.4;
    let guard = 0;
    while (accum >= PHYSICS_DT && guard < 800) { stepTop(s, PHYSICS_DT); accum -= PHYSICS_DT; guard++; }
    psiVis += (1.4 + 0.04 * s.omega_spin) * dt;     // visual spin (compressed)
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  rebuild();
  const pre = CAPTURE_NAME ? (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * (2 * Math.PI / precessionRate(s)) : 1.2;
  const n = Math.round(pre / PHYSICS_DT);
  for (let i = 0; i < n; i++) stepTop(s, PHYSICS_DT);
  psiVis = pre * (1.4 + 0.04 * s.omega_spin);
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
  const Wp = precessionRate(s);
  return {
    fields: [
      { key: 'spin', label: 'spin rate $\\omega_s$ (rad/s)', value: s.omega_spin, format: 'float' },
      { key: 'prec', label: 'precession $\\Omega_p$ (rad/s)', value: Wp, format: 'float' },
      { key: 'torque', label: 'gravity torque $Mgr$', value: s.M * s.g * s.r, format: 'float' },
      { key: 'period', label: 'precession period (s)', value: 2 * Math.PI / Wp, format: 'float' },
      { key: 'tilt', label: 'tilt (deg)', value: s.theta * 180 / Math.PI, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Omega_p * omega_s should equal Mgr/I_s exactly (leading-order law).
    const prod = precessionRate(s) * s.omega_spin;
    const target = precConst(s);
    const rel = Math.abs(prod - target) / target;
    return [{
      key: 'product',
      label: 'Ω_p · ω_s = Mgr/I_s (rel. error)',
      value: rel.toExponential(2),
      status: rel < 1e-9 ? 'pass' : (rel < 1e-4 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
