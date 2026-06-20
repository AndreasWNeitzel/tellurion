import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for a block on an inclined plane with Coulomb friction.
// Top region: the ramp and the block, with the free-body diagram (weight,
// normal, friction) and gravity resolved into its slope-parallel and
// slope-normal parts. The block sits when the slope is below the critical
// angle theta_c = arctan(mu_s) and slides (looping) above it.
// Bottom region: the down-slope pull sin(theta) and the friction limit
// mu_s cos(theta) versus angle, normalised by m g. They cross at theta_c;
// past it the actual friction drops to the kinetic level mu_k cos(theta)
// and the gap up to the pull is the net force per unit weight, a / g.

import {
  createBlock, stepBlock,
  criticalAngle, kineticAcceleration, staticThresholdSatisfied,
  energyBudget, G, M,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderTheta = document.getElementById('slider-theta');
const sliderMus = document.getElementById('slider-mus');
const sliderMuk = document.getElementById('slider-muk');
const valueTheta = document.getElementById('value-theta');
const valueMus = document.getElementById('value-mus');
const valueMuk = document.getElementById('value-muk');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const degToRad = (d) => d * Math.PI / 180;
const radToDeg = (r) => r * 180 / Math.PI;

const SLOPE_LENGTH = 5.0;
const PHYSICS_DT = 1 / 240;
let running = !DETERMINISTIC;
let holdFrames = 0;
let e0 = null;            // energy baseline, captured at release (x = 0)
const trail = [];        // recent block screen positions for a motion streak

let sim = createBlock({
  theta: degToRad(parseFloat(sliderTheta.value)),
  muS: parseFloat(sliderMus.value),
  muK: parseFloat(sliderMuk.value),
  slopeLength: SLOPE_LENGTH,
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.4 },
  ]);
}

function reinitFromControls() {
  sim = createBlock({
    theta: degToRad(parseFloat(sliderTheta.value)),
    muS: parseFloat(sliderMus.value),
    muK: parseFloat(sliderMuk.value),
    slopeLength: SLOPE_LENGTH,
  });
  e0 = null;
  holdFrames = 0;
  trail.length = 0;
}

[sliderTheta, sliderMus, sliderMuk].forEach((sl) => sl.addEventListener('input', () => {
  valueTheta.textContent = parseFloat(sliderTheta.value).toFixed(1);
  valueMus.textContent = parseFloat(sliderMus.value).toFixed(2);
  valueMuk.textContent = parseFloat(sliderMuk.value).toFixed(2);
  reinitFromControls();
  render();
}));
btnReset.addEventListener('click', () => { reinitFromControls(); render(); });
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    weight: '#ef476f',
    normal: '#5bc0eb',
    friction: '#06d6a0',
    ramp: '#1b2230',
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

function arrow(x, y, dx, dy, col, w, label, labelCol) {
  const L = Math.hypot(dx, dy);
  if (L < 1.5) return;
  const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const head = 9;
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - head * ux + 5 * uy, y + dy - head * uy - 5 * ux);
  ctx.lineTo(x + dx - head * ux - 5 * uy, y + dy - head * uy + 5 * ux);
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.fillStyle = labelCol || col;
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + dx + 9 * ux, y + dy + 9 * uy);
  }
}

function dashedSeg(x, y, dx, dy, col, w) {
  if (Math.hypot(dx, dy) < 1.5) return;
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  ctx.restore();
}

function drawScene(col, r) {
  panel(col, r, 'Forces on the block');

  const titleH = 22, stripH = 30;
  const draw = {
    x: r.x + 14, y: r.y + titleH + 6,
    w: r.w - 28, h: r.h - titleH - 6 - stripH - 6,
  };

  const theta = sim.theta;
  const sliding = staticThresholdSatisfied(theta, sim.muS);
  const a = kineticAcceleration(theta, sim.muK);

  // Force scale (pixels per newton) and the inset that keeps vectors in frame.
  const mg = M * G;
  const maxArrow = Math.min(88, draw.h * 0.24);
  const fScale = maxArrow / mg;
  const inset = maxArrow * 1.15;
  const area = {
    x: draw.x + inset, y: draw.y + inset * 0.7,
    w: draw.w - inset * 1.5, h: draw.h - inset * 1.5,
  };

  // Fit the right-triangle ramp (apex top-left, base at bottom, angle theta
  // at the bottom-right corner) into the area.
  const tan = Math.tan(theta);
  let base = area.w;
  let height = base * tan;
  if (height > area.h) { height = area.h; base = tan > 1e-4 ? height / tan : area.w; }
  const offY = (area.h - height) / 2;
  const AP = { x: area.x, y: area.y + offY };               // apex (top of slope)
  const BL = { x: area.x, y: area.y + offY + height };      // bottom-left
  const BR = { x: area.x + base, y: area.y + offY + height };// bottom-right

  // Ramp body.
  ctx.fillStyle = col.ramp;
  ctx.beginPath();
  ctx.moveTo(AP.x, AP.y);
  ctx.lineTo(BR.x, BR.y);
  ctx.lineTo(BL.x, BL.y);
  ctx.closePath();
  ctx.fill();
  // Hatching under the base.
  ctx.strokeStyle = col.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let hx = BL.x; hx <= BR.x; hx += 12) {
    ctx.moveTo(hx, BR.y);
    ctx.lineTo(hx - 8, BR.y + 9);
  }
  ctx.stroke();
  // Incline surface.
  ctx.strokeStyle = col.fg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(AP.x, AP.y);
  ctx.lineTo(BR.x, BR.y);
  ctx.stroke();

  // Angle arc at the bottom-right corner.
  const arcR = Math.min(34, base * 0.4);
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(BR.x, BR.y, arcR, Math.PI - theta, Math.PI);
  ctx.stroke();
  ctx.fillStyle = col.accent;
  ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('θ', BR.x - arcR - 4, BR.y - arcR * 0.32);

  // Incline unit vectors (screen coords, y down): down-slope d, outward
  // normal n, up-slope u.
  const cs = Math.cos(theta), sn = Math.sin(theta);
  const d = { x: cs, y: sn };
  const n = { x: sn, y: -cs };
  const hypotLen = Math.hypot(base, height);
  const frac = Math.min(1, sim.x / SLOPE_LENGTH);
  const half = Math.max(11, Math.min(17, hypotLen * 0.05));
  const S = { x: AP.x + d.x * frac * hypotLen, y: AP.y + d.y * frac * hypotLen };
  const C = { x: S.x + n.x * half, y: S.y + n.y * half };   // block centre

  // Record the block's screen position while it slides, for a motion streak.
  if (running && sliding && sim.v > 0.2 && sim.x < sim.slopeLength) {
    trail.push({ x: C.x, y: C.y });
    if (trail.length > 9) trail.shift();
  }

  // Motion streak from the trail.
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = `rgba(255,209,102,${0.05 + 0.12 * (i / trail.length)})`;
      ctx.lineWidth = half * 1.4;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
  }

  // Block, aligned to the incline.
  ctx.save();
  ctx.translate(C.x, C.y);
  ctx.rotate(theta);
  ctx.fillStyle = sliding ? col.accent : col.normal;
  ctx.fillRect(-half, -half, 2 * half, 2 * half);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-half, -half, 2 * half, 2 * half);
  ctx.fillStyle = '#0a0c12';
  ctx.font = fontString(canvas, 'tick', 'sans', 700);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('m', 0, 0);
  ctx.restore();

  // Force magnitudes (newtons).
  const Nmag = mg * cs;
  const fricMag = sliding ? sim.muK * mg * cs : mg * sn;   // up-slope friction
  const wPar = mg * sn;                                     // gravity along slope
  const wPerp = mg * cs;                                    // gravity into slope

  // Gravity resolved into components (dashed, secondary).
  dashedSeg(C.x, C.y, d.x * wPar * fScale, d.y * wPar * fScale, 'rgba(239,71,111,0.55)', 1.5);
  dashedSeg(C.x, C.y, -n.x * wPerp * fScale, -n.y * wPerp * fScale, 'rgba(239,71,111,0.55)', 1.5);

  // Primary vectors: weight (down), normal (out), friction (up-slope).
  arrow(C.x, C.y, 0, mg * fScale, col.weight, 3, 'mg', col.weight);
  arrow(C.x, C.y, n.x * Nmag * fScale, n.y * Nmag * fScale, col.normal, 3, 'N', col.normal);
  arrow(C.x, C.y, -d.x * fricMag * fScale, -d.y * fricMag * fScale, col.friction, 3, 'f', col.friction);

  // Readout strip.
  const tc = criticalAngle(sim.muS);
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [`θ = ${radToDeg(theta).toFixed(1)}°`, col.fg],
    [`θc = ${radToDeg(tc).toFixed(1)}°`, col.muted],
    [sliding ? 'SLIDING' : 'STATIC', sliding ? col.accent : col.normal],
    [`a = ${(sliding ? Math.max(0, a) : 0).toFixed(2)} m/s²`, col.accent],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => {
    ctx.fillStyle = c;
    ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry);
  });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Down-slope pull vs friction limit, per unit weight');

  const inner = {
    x: r.x + 40,
    y: r.y + 28,
    w: r.w - 40 - 16,
    h: r.h - 28 - 40,
  };
  const TH_MAX = degToRad(85);
  const muS = sim.muS, muK = sim.muK;
  const tc = criticalAngle(muS);

  const xOf = (th) => inner.x + (th / TH_MAX) * inner.w;
  const yOf = (f) => inner.y + inner.h - f * inner.h;       // f in units of m g, 0..1

  // Horizontal grid + y ticks (0, 0.5, 1).
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const fv of [0, 0.5, 1]) {
    const y = yOf(fv);
    ctx.beginPath();
    ctx.moveTo(inner.x, y);
    ctx.lineTo(inner.x + inner.w, y);
    ctx.stroke();
    ctx.fillText(fv.toFixed(1), inner.x - 5, y);
  }

  // x ticks at 0, theta_c, 45, 85 degrees.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const dg of [0, 45, 85]) {
    const x = xOf(degToRad(dg));
    ctx.fillStyle = col.muted;
    ctx.fillText(String(dg), x, inner.y + inner.h + 4);
  }

  // Sliding region shading (theta > theta_c).
  if (tc < TH_MAX) {
    ctx.fillStyle = 'rgba(255,209,102,0.05)';
    ctx.fillRect(xOf(tc), inner.y, inner.w - (xOf(tc) - inner.x), inner.h);
  }

  // Net-force band (between the pull and the actual friction) for theta > tc.
  ctx.fillStyle = 'rgba(255,209,102,0.18)';
  ctx.beginPath();
  let started = false;
  for (let th = tc; th <= TH_MAX + 1e-6; th += TH_MAX / 200) {
    const x = xOf(th), y = yOf(Math.sin(th));
    if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
  }
  for (let th = TH_MAX; th >= tc - 1e-6; th -= TH_MAX / 200) {
    ctx.lineTo(xOf(th), yOf(muK * Math.cos(th)));
  }
  ctx.closePath();
  ctx.fill();
  // Label the band: its height is sinθ - μk cosθ = a / g, so band x m g = m a.
  if (tc < degToRad(70)) {
    const thMid = (tc + TH_MAX) / 2;
    const yMid = yOf((Math.sin(thMid) + muK * Math.cos(thMid)) / 2);
    ctx.fillStyle = 'rgba(255,209,102,0.9)';
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('net = m a', xOf(thMid), yMid);
  }

  // Curve: down-slope pull = sin(theta).
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const th = (i / 200) * TH_MAX;
    const x = xOf(th), y = yOf(Math.sin(th));
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();

  // Curve: max static friction = mu_s cos(theta) (dashed ceiling).
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = col.muted;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const th = (i / 200) * TH_MAX;
    const x = xOf(th), y = yOf(muS * Math.cos(th));
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // Actual friction (bold): follows the pull up to theta_c, then drops to
  // the kinetic level mu_k cos(theta).
  ctx.strokeStyle = col.friction;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const th = (i / 200) * TH_MAX;
    const f = th <= tc ? Math.sin(th) : muK * Math.cos(th);
    const x = xOf(th), y = yOf(f);
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  // The vertical drop at theta_c.
  if (tc < TH_MAX) {
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = col.friction;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(xOf(tc), yOf(Math.sin(tc)));
    ctx.lineTo(xOf(tc), yOf(muK * Math.cos(tc)));
    ctx.stroke();
    ctx.restore();
  }

  // theta_c marker.
  if (tc < TH_MAX) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xOf(tc), inner.y);
    ctx.lineTo(xOf(tc), inner.y + inner.h);
    ctx.stroke();
    ctx.fillStyle = col.fg;
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`θc ${radToDeg(tc).toFixed(0)}°`, xOf(tc), inner.y + inner.h + 4);
  }

  // Cursor at the current angle, dots on the pull and friction curves.
  const th0 = Math.min(sim.theta, TH_MAX);
  const cxp = xOf(th0);
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cxp, inner.y);
  ctx.lineTo(cxp, inner.y + inner.h);
  ctx.stroke();
  ctx.restore();
  const fActual = th0 <= tc ? Math.sin(th0) : muK * Math.cos(th0);
  const dot = (yy, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cxp, yy, 3.5, 0, 2 * Math.PI); ctx.fill(); };
  dot(yOf(Math.sin(th0)), col.accent);
  dot(yOf(fActual), col.friction);

  // Axis labels.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('slope angle θ (deg)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save();
  ctx.translate(inner.x - 30, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('force / m g', 0, 0);
  ctx.restore();

  // Legend.
  const legend = [
    ['pull', col.accent],
    ['static limit', col.muted],
    ['friction', col.friction],
  ];
  ctx.fillStyle = 'rgba(10,12,18,0.72)';
  ctx.fillRect(inner.x + 6, inner.y + 6, 150, 18);
  let lx = inner.x + 12;
  const ly = inner.y + 15;
  ctx.font = fontString(canvas, 'legend', 'mono');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const [lab, c] of legend) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 13, ly);
    ctx.stroke();
    ctx.fillStyle = col.fg;
    ctx.fillText(lab, lx + 16, ly);
    lx += ctx.measureText(lab).width + 30;
  }
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function physicsStep() {
  if (sim.x >= sim.slopeLength) {
    holdFrames += 1;
    if (holdFrames > 70) reinitFromControls();
    return;
  }
  stepBlock(sim, PHYSICS_DT);
}

let last = performance.now();
let accum = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    while (accum >= PHYSICS_DT) {
      physicsStep();
      accum -= PHYSICS_DT;
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(f * (SLOPE_LENGTH > 0 ? 600 : 0));
    for (let i = 0; i < steps; i++) stepBlock(sim, PHYSICS_DT);
  }
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
  const sliding = staticThresholdSatisfied(sim.theta, sim.muS);
  const a = kineticAcceleration(sim.theta, sim.muK);
  return {
    fields: [
      { key: 'theta', label: 'slope angle (deg)', value: radToDeg(sim.theta), format: 'float' },
      { key: 'thetac', label: 'critical angle (deg)', value: radToDeg(criticalAngle(sim.muS)), format: 'float' },
      { key: 'accel', label: 'acceleration $a$', value: sliding ? Math.max(0, a) : 0, format: 'float' },
      { key: 'speed', label: 'block speed $|v|$', value: sim.v, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const eb = energyBudget(sim);
    if (!Number.isFinite(eb.total)) return [];
    if (e0 === null) e0 = eb.total;
    const scale = Math.max(1e-6, Math.abs(e0));
    const dE = Math.abs(eb.total - e0) / scale;
    return [{
      key: 'energy',
      label: 'KE + PE + friction work (rel. drift)',
      value: dE.toExponential(2),
      status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
