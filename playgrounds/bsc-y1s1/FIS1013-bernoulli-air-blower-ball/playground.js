import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for the air-blower ball. Top region: a turbulent jet,
// drawn as advected streaks colored by speed, levitating a light ball; tilt
// the nozzle and the ball follows. Bottom region: the upward drag on a still
// ball versus height along the jet, crossing the weight line at the stable
// levitation height.
//
// Reference: Massey, Mechanics of Fluids, 9th ed., Ch. 3, 8; Tritton,
// Physical Fluid Dynamics, 2nd ed.

import {
  createBlower, step, airVelocityAt, diagnostics, G, RHO_AIR, CD,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderPower = document.getElementById('slider-power');
const sliderTilt = document.getElementById('slider-tilt');
const sliderMass = document.getElementById('slider-mass');
const valuePower = document.getElementById('value-power');
const valueTilt = document.getElementById('value-tilt');
const valueMass = document.getElementById('value-mass');
const btnBlower = document.getElementById('btn-blower');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const PHYSICS_DT = 1 / 240;
const VISF = 0.16;              // visual slowdown for the advected streaks
let running = !DETERMINISTIC;
let s = createBlower();
let tracers = [];

function applyControls() {
  s.U0 = parseFloat(sliderPower.value);
  s.tiltDeg = parseFloat(sliderTilt.value);
  s.ballM = parseFloat(sliderMass.value) / 1000;
}
function syncVals() {
  valuePower.textContent = parseFloat(sliderPower.value).toFixed(0);
  valueTilt.textContent = parseFloat(sliderTilt.value).toFixed(0);
  valueMass.textContent = parseFloat(sliderMass.value).toFixed(1);
}
function seedTracers() {
  tracers = [];
  for (let i = 0; i < 240; i++) tracers.push(spawnTracer());
}
function spawnTracer() {
  // pseudo-random but deterministic-ish spread; vary by index-free counter.
  const r = (Math.sin(tracerSeed * 12.9898) * 43758.5453) % 1;
  tracerSeed += 1;
  const off = (Math.abs(r) - 0.5) * 2 * s.w0 * 1.5;
  const a = (s.tiltDeg * Math.PI) / 180;
  const px = Math.cos(a), py = -Math.sin(a);
  return {
    x: s.nozzle.x + px * off + (Math.abs((r * 7) % 1) - 0.5) * 0.01,
    y: s.nozzle.y + Math.abs((r * 13) % 1) * 0.05,
    px2: 0, py2: 0,
  };
}
let tracerSeed = 1;

[sliderPower, sliderTilt, sliderMass].forEach((sl) => sl.addEventListener('input', () => { syncVals(); applyControls(); render(); }));
btnBlower.addEventListener('click', () => {
  s.on = !s.on;
  btnBlower.textContent = s.on ? 'Blower: on' : 'Blower: off';
  btnBlower.setAttribute('aria-pressed', String(s.on));
});
btnReset.addEventListener('click', () => {
  s.x = 0; s.y = 0.6; s.vx = 0; s.vy = 0; s.t = 0;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  render();
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

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    ball: '#ffd166',
    weight: '#ef476f',
    drag: '#5bc0eb',
    eq: '#67d98c',
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

// Upward drag on a still ball at along-axis distance d from the nozzle.
function dragUpAt(d) {
  const a = (s.tiltDeg * Math.PI) / 180;
  const ax = Math.sin(a), ay = Math.cos(a);
  const u = airVelocityAt(s, s.nozzle.x + ax * d, s.nozzle.y + ay * d);
  const A = Math.PI * s.ballR * s.ballR;
  const k = 0.5 * RHO_AIR * CD * A;
  return k * u.speed * u.uy;          // vertical component
}
function equilibriumD() {
  const W = s.ballM * G;
  let lo = 0.01, hi = 4.0;
  if (dragUpAt(lo) < W) return null;
  for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (dragUpAt(m) > W) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

let map = null;   // world->screen for the scene (for pointer + draw)

function drawScene(col, r) {
  panel(col, r, 'A jet holds the ball, even tilted');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x + 8, y: r.y + titleH + 4, w: r.w - 16, h: r.h - titleH - 4 - stripH - 6 };
  const yViewTop = 1.15;          // metres shown above the nozzle
  const scale = Math.min(draw.h / yViewTop, draw.w / 1.05);
  const nozX = draw.x + draw.w / 2, nozY = draw.y + draw.h - 6;
  map = { scale, nozX, nozY };
  const SX = (wx) => nozX + wx * scale;
  const SY = (wy) => nozY - wy * scale;

  ctx.save();
  clipTo(ctx, draw);

  // Soft jet plume (translucent cone, shaded by speed) so the stream body
  // is visible even where streaks are sparse.
  if (s.on) {
    const a = (s.tiltDeg * Math.PI) / 180;
    const axx = Math.sin(a), ayy = Math.cos(a);
    const px = Math.cos(a), py = -Math.sin(a);
    const NSL = 26;
    for (let i = 0; i < NSL; i++) {
      const d0 = (i / NSL) * 1.45, d1 = ((i + 1) / NSL) * 1.45;
      const onAxis = airVelocityAt(s, s.nozzle.x + axx * 0.5 * (d0 + d1), s.nozzle.y + ayy * 0.5 * (d0 + d1)).speed;
      if (onAxis < 0.5) continue;
      const w0w = s.w0 + s.spread * d0, w1w = s.w0 + s.spread * d1;
      const cc = viridis(Math.min(1, onAxis / Math.max(6, s.U0)));
      ctx.fillStyle = `rgba(${cc.r | 0},${cc.g | 0},${cc.b | 0},${0.10 * Math.min(1, onAxis / s.U0) + 0.03})`;
      const ax0 = s.nozzle.x + axx * d0, ay0 = s.nozzle.y + ayy * d0;
      const ax1 = s.nozzle.x + axx * d1, ay1 = s.nozzle.y + ayy * d1;
      ctx.beginPath();
      ctx.moveTo(SX(ax0 + px * w0w), SY(ay0 + py * w0w));
      ctx.lineTo(SX(ax1 + px * w1w), SY(ay1 + py * w1w));
      ctx.lineTo(SX(ax1 - px * w1w), SY(ay1 - py * w1w));
      ctx.lineTo(SX(ax0 - px * w0w), SY(ay0 - py * w0w));
      ctx.closePath(); ctx.fill();
    }
  }

  // Jet streaks, colored by speed (a fixed visual length along the flow).
  for (const t of tracers) {
    const v = airVelocityAt(s, t.x, t.y);
    const spd = v.speed;
    if (spd < 0.4) continue;
    const sl = 0.06;
    const dirx = v.ux / spd, diry = v.uy / spd;
    const tcol = viridis(Math.min(1, spd / Math.max(6, s.U0)));
    ctx.strokeStyle = `rgba(${tcol.r | 0},${tcol.g | 0},${tcol.b | 0},${0.35 + 0.5 * Math.min(1, spd / s.U0)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(SX(t.x - dirx * sl), SY(t.y - diry * sl));
    ctx.lineTo(SX(t.x), SY(t.y));
    ctx.stroke();
  }

  // Nozzle.
  ctx.fillStyle = '#39435f';
  ctx.fillRect(nozX - 14, nozY, 28, 10);
  ctx.fillStyle = s.on ? col.eq : col.muted;
  ctx.fillRect(nozX - 8, nozY - 3, 16, 4);

  // Equilibrium-height marker on the axis.
  const dEq = s.on ? equilibriumD() : null;
  const a = (s.tiltDeg * Math.PI) / 180;
  const ax = Math.sin(a), ay = Math.cos(a);
  if (dEq) {
    const ex = s.nozzle.x + ax * dEq, ey = s.nozzle.y + ay * dEq;
    ctx.strokeStyle = 'rgba(103,217,140,0.5)';
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(SX(ex) - 26, SY(ey)); ctx.lineTo(SX(ex) + 26, SY(ey)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ball with force arrows.
  const bx = SX(s.x), by = SY(s.y);
  const br = Math.max(8, s.ballR * scale);
  // gravity (down) and net air force (up-ish) as short arrows.
  const W = s.ballM * G;
  const vUp = dragUpAt(Math.max(0.02, (s.x - s.nozzle.x) * ax + (s.y - s.nozzle.y) * ay));
  const fscale = 0.6 / Math.max(W, 1e-4) * br * 2.2;
  arrow(bx, by, 0, W * fscale, col.weight, 2.5);
  arrow(bx, by, 0, -Math.min(W * 1.6, vUp) * fscale, col.drag, 2.5);
  ctx.fillStyle = col.ball;
  ctx.beginPath(); ctx.arc(bx, by, br, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore();

  // Readout strip.
  const d = diagnostics(s);
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [s.on ? `U₀ = ${s.U0.toFixed(0)}` : 'off', s.on ? col.drag : col.muted],
    [`h = ${Math.max(0, d.height).toFixed(2)} m`, col.ball],
    [`off ${(d.offAxis * 100).toFixed(1)} cm`, col.fg],
    [`tilt ${s.tiltDeg.toFixed(0)}°`, col.accent],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function arrow(x, y, dx, dy, col, w) {
  const L = Math.hypot(dx, dy);
  if (L < 2) return;
  const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 8 * ux + 4 * uy, y + dy - 8 * uy - 4 * ux);
  ctx.lineTo(x + dx - 8 * ux - 4 * uy, y + dy - 8 * uy + 4 * ux);
  ctx.closePath(); ctx.fill();
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Upward drag vs height: where it balances gravity');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 14, h: r.h - 28 - 40 };
  const W = s.ballM * G;
  const dMax = 1.5;
  // sample drag(d).
  const pts = [];
  let fMax = W * 1.4;
  for (let i = 0; i <= 120; i++) { const d = 0.02 + (dMax - 0.02) * i / 120; const f = Math.max(0, dragUpAt(d)); pts.push({ d, f }); fMax = Math.max(fMax, f); }
  const xOf = (d) => inner.x + (d / dMax) * inner.w;
  const yOf = (f) => inner.y + inner.h - (f / fMax) * inner.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0, fMax / 2, fMax]) { const y = yOf(f); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((f * 1000).toFixed(1), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= 3; i++) { const d = i / 3 * dMax; ctx.fillText(d.toFixed(1), xOf(d), inner.y + inner.h + 4); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // weight line.
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = col.weight; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(W)); ctx.lineTo(inner.x + inner.w, yOf(W)); ctx.stroke(); ctx.restore();
  ctx.fillStyle = col.weight; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('weight m g', inner.x + inner.w - 4, yOf(W) - 2);

  // drag curve.
  ctx.strokeStyle = col.drag; ctx.lineWidth = 2.6;
  ctx.beginPath();
  pts.forEach((p, i) => { const X = xOf(p.d), Y = yOf(p.f); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.stroke();

  // equilibrium crossing.
  const dEq = s.on ? equilibriumD() : null;
  if (dEq && dEq <= dMax) {
    ctx.fillStyle = col.eq;
    ctx.beginPath(); ctx.arc(xOf(dEq), yOf(W), 5, 0, 2 * Math.PI); ctx.fill();
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('balance', xOf(dEq), yOf(W) - 7);
  }

  // current ball height cursor.
  const a = (s.tiltDeg * Math.PI) / 180;
  const dBall = (s.x - s.nozzle.x) * Math.sin(a) + (s.y - s.nozzle.y) * Math.cos(a);
  if (dBall > 0 && dBall <= dMax) {
    const cx = xOf(dBall);
    ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1;
    ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx, inner.y); ctx.lineTo(cx, inner.y + inner.h); ctx.stroke(); ctx.restore();
  }

  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('height along jet (m)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('upward force (mN)', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function advectTracers(dt) {
  for (let i = 0; i < tracers.length; i++) {
    const t = tracers[i];
    t.px2 = t.x; t.py2 = t.y;
    const v = airVelocityAt(s, t.x, t.y);
    if (!s.on || v.speed < 0.4 || t.y > 1.5 || Math.abs(t.x) > 0.6) { tracers[i] = spawnTracer(); continue; }
    t.x += v.ux * dt * VISF;
    t.y += v.uy * dt * VISF;
  }
}

let last = performance.now();
let accum = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    let guard = 0;
    while (accum >= PHYSICS_DT && guard < 600) { step(s, PHYSICS_DT); accum -= PHYSICS_DT; guard++; }
    advectTracers(dt);
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals(); applyControls(); seedTracers();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    for (let i = 0; i < Math.round(f * 480); i++) step(s, PHYSICS_DT);
    for (let i = 0; i < 60; i++) advectTracers(1 / 60);
  } else {
    for (let i = 0; i < 360; i++) step(s, PHYSICS_DT);   // let it settle into the jet
    for (let i = 0; i < 40; i++) advectTracers(1 / 60);
  }
  relayout(); render();
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
  const d = diagnostics(s);
  return {
    fields: [
      { key: 'height', label: 'height (m)', value: Math.max(0, d.height), format: 'float' },
      { key: 'offaxis', label: 'off-axis (m)', value: d.offAxis, format: 'float' },
      { key: 'speed', label: 'ball speed (m/s)', value: d.speed, format: 'float' },
      { key: 'yeq', label: 'balance height (m)', value: d.yeq == null ? 0 : d.yeq, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const dEq = equilibriumD();
    if (!s.on) return [{ key: 'lift', label: 'jet lifts the ball', value: 'off', status: 'pending' }];
    if (dEq == null) {
      return [{ key: 'lift', label: 'jet too weak to lift the ball', value: '0', status: 'drift' }];
    }
    const W = s.ballM * G;
    const ratio = Math.abs(dragUpAt(dEq) / W - 1);
    return [{
      key: 'balance',
      label: 'drag = weight at balance height',
      value: ratio.toExponential(2),
      status: ratio < 1e-2 ? 'pass' : 'pending',
    }];
  } catch (e) {
    return [];
  }
};
