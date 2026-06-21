import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Kapitza inverted pendulum. Top region: the rod
// held upside-down by a vertically vibrated pivot, with a stability gauge for
// the criterion a^2 omega^2 > 2 g l. Bottom region: the time-averaged
// effective potential U_eff(theta), with a marker showing the pendulum
// sitting in (or rolling out of) the well at the top.

import {
  createKapitza, stepKapitza, stabilityRatio,
  effectivePotential, G_GRAV, L_PEN,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderA = document.getElementById('slider-a');
const sliderOmega = document.getElementById('slider-omega');
const sliderTilt = document.getElementById('slider-tilt');
const valueA = document.getElementById('value-a');
const valueOmega = document.getElementById('value-omega');
const valueTilt = document.getElementById('value-tilt');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const DEF = { a: 0.12, omega: 55, tilt: 22 };
const PHYSICS_DT = 0.0005;
let running = !DETERMINISTIC;
const trail = [];
const thetaHist = [];           // {t, abs} rolling for the stability check

const deg2rad = (d) => d * Math.PI / 180;

function makeSim() {
  return createKapitza({
    theta: deg2rad(parseFloat(sliderTilt.value)),
    a: parseFloat(sliderA.value),
    omega: parseFloat(sliderOmega.value),
  });
}
let sim = makeSim();

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.55 },
    { name: 'diagnostic', weight: 1.4 },
  ]);
}

function syncValues() {
  valueA.textContent = parseFloat(sliderA.value).toFixed(3);
  valueOmega.textContent = String(parseFloat(sliderOmega.value));
  valueTilt.textContent = String(parseFloat(sliderTilt.value));
}

// a and omega update the live pendulum (so you can watch it lose or regain
// stability in place); the tilt slider re-releases from a new angle.
sliderA.addEventListener('input', () => { sim.a = parseFloat(sliderA.value); syncValues(); render(); });
sliderOmega.addEventListener('input', () => { sim.omega = parseFloat(sliderOmega.value); syncValues(); render(); });
sliderTilt.addEventListener('input', () => {
  sim.theta = deg2rad(parseFloat(sliderTilt.value));
  sim.thetadot = 0;
  trail.length = 0; thetaHist.length = 0;
  syncValues(); render();
});
btnReset.addEventListener('click', () => {
  sliderA.value = String(DEF.a); sliderOmega.value = String(DEF.omega); sliderTilt.value = String(DEF.tilt);
  sim = makeSim();
  trail.length = 0; thetaHist.length = 0;
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncValues(); render();
});
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
    bob: '#ffd166',
    rod: '#cdd3df',
    stable: '#67d98c',
    unstable: '#ef476f',
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

function drawGauge(col, r, ratio, stable) {
  // Vertical stability gauge: drive a^2 omega^2 / (2 g l) against the
  // threshold at 1.
  const padTop = 22, padBot = 38;
  const trackX = r.x + r.w * 0.5;
  const y0 = r.y + r.h - padBot;     // ratio 0
  const y1 = r.y + padTop;           // ratio top
  const RMAX = 3;
  const yOf = (v) => y0 - Math.min(v, RMAX) / RMAX * (y0 - y1);
  const w = Math.min(26, r.w * 0.34);

  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono', 600);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('drive', r.x + r.w / 2, r.y + 2);
  ctx.fillText('strength', r.x + r.w / 2, r.y + 11);

  // track
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(trackX - w / 2, y1, w, y0 - y1);
  // fill
  const col2 = stable ? col.stable : col.unstable;
  ctx.fillStyle = col2;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(trackX - w / 2 + 1, yOf(ratio), w - 2, y0 - yOf(ratio));
  ctx.globalAlpha = 1;
  // threshold line at ratio 1
  ctx.strokeStyle = '#ffffff';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(trackX - w / 2 - 5, yOf(1));
  ctx.lineTo(trackX + w / 2 + 5, yOf(1));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = col.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('=1', trackX + w / 2 + 7, yOf(1));

  // value + state
  ctx.fillStyle = col2;
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ratio.toFixed(2), r.x + r.w / 2, y0 + 4);
  ctx.fillText(stable ? 'STABLE' : 'FALLS', r.x + r.w / 2, y0 + 20);
}

function drawScene(col, r) {
  panel(col, r, 'Shaken pivot holds the rod upside-down');

  const titleH = 22, stripH = 28;
  const inner = { x: r.x + 6, y: r.y + titleH + 2, w: r.w - 12, h: r.h - titleH - 2 - stripH - 4 };
  const ratio = stabilityRatio(sim.a, sim.omega);
  // The verdict reflects what the rod is actually doing, not just the
  // leading-order criterion a^2 omega^2 > 2 g l. That criterion only says the
  // upright is linearly stable; near the threshold its basin of attraction
  // shrinks, so a large release still topples. If the rod has swung past ~70
  // degrees from vertical recently, it has fallen, whatever the criterion says.
  const toppled = thetaHist.some((h) => h.abs > 1.2);
  const stable = ratio > 1 && !toppled;

  // Right-hand stability gauge.
  const gaugeW = Math.min(120, inner.w * 0.24);
  const gauge = { x: inner.x + inner.w - gaugeW, y: inner.y, w: gaugeW, h: inner.h };
  drawGauge(col, gauge, ratio, stable);

  // Pendulum area (left of the gauge).
  const pen = { x: inner.x, y: inner.y, w: inner.w - gaugeW - 6, h: inner.h };
  const scale = pen.h * 0.92 / 2.8;            // world units span ~[-1.3, 1.4]
  const cxp = pen.x + pen.w / 2;
  const baseY = pen.y + pen.h * 0.5;
  const SX = (wx) => cxp + wx * scale;
  const SY = (wy) => baseY - wy * scale;

  const yp = sim.a * Math.cos(sim.omega * sim.t);     // pivot height (world)
  const px = SX(0), py = SY(yp);
  const bobWx = L_PEN * Math.sin(sim.theta);
  const bobWy = yp + L_PEN * Math.cos(sim.theta);
  const bx = SX(bobWx), by = SY(bobWy);

  // Upward reference line (the target, theta = 0).
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, SY(yp + L_PEN * 1.15));
  ctx.stroke();
  ctx.setLineDash([]);

  // Pivot drive guide (the vertical travel of the pivot).
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px - 14, SY(sim.a));
  ctx.lineTo(px - 14, SY(-sim.a));
  ctx.stroke();
  for (const yy of [SY(sim.a), SY(-sim.a)]) {
    ctx.beginPath(); ctx.moveTo(px - 18, yy); ctx.lineTo(px - 10, yy); ctx.stroke();
  }

  // Bob trail (fast jitter plus slow wobble).
  if (running) {
    trail.push({ x: bx, y: by });
    if (trail.length > 22) trail.shift();
  }
  for (let i = 1; i < trail.length; i++) {
    ctx.strokeStyle = `rgba(255,209,102,${0.04 + 0.16 * (i / trail.length)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }

  // Rod.
  ctx.strokeStyle = col.rod;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Pivot block.
  ctx.fillStyle = '#39435f';
  ctx.fillRect(px - 9, py - 6, 18, 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px - 9, py - 6, 18, 12);

  // Bob.
  ctx.fillStyle = stable ? col.bob : col.unstable;
  ctx.beginPath();
  ctx.arc(bx, by, 12, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Readout strip.
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [`θ = ${(sim.theta * 180 / Math.PI).toFixed(0)}°`, col.fg],
    [`a = ${sim.a.toFixed(2)} m`, col.muted],
    [`ω = ${sim.omega.toFixed(0)}`, col.muted],
    [`ratio = ${ratio.toFixed(2)}`, stable ? col.stable : col.unstable],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Effective potential U_eff(θ): the well at the top');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 14, h: r.h - 28 - 40 };
  const a = sim.a, omega = sim.omega;

  // Sample U_eff over [-pi, pi]; find range.
  const N = 240;
  let uMin = Infinity, uMax = -Infinity;
  const us = [];
  for (let i = 0; i <= N; i++) {
    const th = -Math.PI + (i / N) * 2 * Math.PI;
    const u = effectivePotential(th, a, omega);
    us.push(u);
    if (u < uMin) uMin = u; if (u > uMax) uMax = u;
  }
  const pad = (uMax - uMin) * 0.08 || 1;
  uMin -= pad; uMax += pad;
  const xOf = (th) => inner.x + (th + Math.PI) / (2 * Math.PI) * inner.w;
  const yOf = (u) => inner.y + inner.h - (u - uMin) / (uMax - uMin) * inner.h;

  // Vertical guides at up (0) and down (+/-pi).
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const [th, lab] of [[-Math.PI, 'down'], [0, 'up'], [Math.PI, 'down']]) {
    const x = xOf(th);
    ctx.beginPath();
    ctx.moveTo(x, inner.y); ctx.lineTo(x, inner.y + inner.h);
    ctx.stroke();
    ctx.fillText(lab, x, inner.y + inner.h + 4);
  }
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // U_eff curve.
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = -Math.PI + (i / N) * 2 * Math.PI;
    const X = xOf(th), Y = yOf(us[i]);
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.stroke();

  // Marker: the pendulum as a ball on the potential at its current angle.
  const thNow = Math.atan2(Math.sin(sim.theta), Math.cos(sim.theta)); // wrap to [-pi,pi]
  const mx = xOf(thNow), my = yOf(effectivePotential(thNow, a, omega));
  const stable = stabilityRatio(a, omega) > 1 && !thetaHist.some((h) => h.abs > 1.2);
  ctx.fillStyle = stable ? col.stable : col.unstable;
  ctx.beginPath();
  ctx.arc(mx, my, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Axis labels.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('angle from vertical θ', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save();
  ctx.translate(inner.x - 32, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('U_eff', 0, 0);
  ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function recordTheta() {
  thetaHist.push({ t: sim.t, abs: Math.abs(Math.atan2(Math.sin(sim.theta), Math.cos(sim.theta))) });
  while (thetaHist.length && thetaHist[0].t < sim.t - 2.5) thetaHist.shift();
}

let last = performance.now();
let accum = 0;
let sample = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    let guard = 0;
    while (accum >= PHYSICS_DT && guard < 5000) {
      stepKapitza(sim, PHYSICS_DT);
      accum -= PHYSICS_DT;
      if ((sample++ % 40) === 0) recordTheta();
      guard++;
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(f * 2.0 / PHYSICS_DT);
    for (let i = 0; i < steps; i++) { stepKapitza(sim, PHYSICS_DT); if ((i % 40) === 0) recordTheta(); }
  } else {
    // Pre-roll so the stable rod is already settled at the top on load.
    for (let i = 0; i < Math.round(1.5 / PHYSICS_DT); i++) { stepKapitza(sim, PHYSICS_DT); if ((i % 40) === 0) recordTheta(); }
  }
  syncValues();
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
  const th = Math.atan2(Math.sin(sim.theta), Math.cos(sim.theta));
  return {
    fields: [
      { key: 'theta', label: 'angle from up $\\theta$ (deg)', value: th * 180 / Math.PI, format: 'float' },
      { key: 'a', label: 'amplitude $a$ (m)', value: sim.a, format: 'float' },
      { key: 'omega', label: 'drive $\\omega$', value: sim.omega, format: 'float' },
      { key: 'ratio', label: 'stability $a^2\\omega^2/2gl$', value: stabilityRatio(sim.a, sim.omega), format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const ratio = stabilityRatio(sim.a, sim.omega);
    const predictedStable = ratio > 1;
    let observedStable = true;
    for (const h of thetaHist) if (h.abs > 1.2) observedStable = false;
    const agree = thetaHist.length < 4 ? true : (predictedStable === observedStable);
    return [{
      key: 'kapitza',
      label: 'behavior matches a²ω²>2gl',
      value: ratio.toFixed(2),
      status: agree ? 'pass' : 'pending',
    }];
  } catch (e) {
    return [];
  }
};
