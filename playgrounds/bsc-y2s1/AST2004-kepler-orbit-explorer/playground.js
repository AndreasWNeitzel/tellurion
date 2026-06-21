import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Kepler orbit explorer, Canvas2D only. Top
// region: a top-down view of the inner planets (real eccentricities) and
// a comet orbiting the Sun under the inverse-square force, integrated
// symplectically. Bottom region: Kepler's third law, period squared
// against semi-major axis cubed, every body on the same straight line.
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics,
// 2nd ed., Ch. 2.

import { PLANETS, createSwarm, stepSwarm, bodyPosition, keplerThirdLaw, DEFAULT_DT } from './sim.js';
import { snapshot } from '../../../shared/js/engine/symplectic.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderA = document.getElementById('slider-a');
const sliderSpeed = document.getElementById('slider-speed');
const valueA = document.getElementById('value-a');
const valueSpeed = document.getElementById('value-speed');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const COL = ['#9aa0a6', '#e0b070', '#5b8def', '#ef5466', '#67d98c'];   // Merc,Ven,Earth,Mars,comet
const NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'comet'];
let running = !DETERMINISTIC;
let swarm = null, bodies = [], trails = [], E0 = 0, VIEW = 3.4;

function cometA() { return parseFloat(sliderA.value); }
function speed() { return parseFloat(sliderSpeed.value); }

function totalEnergy() {
  const s = snapshot(swarm.inst); let E = 0;
  for (let i = 0; i < swarm.N; i++) {
    const x = s.q[2 * i], y = s.q[2 * i + 1], vx = s.qdot[2 * i], vy = s.qdot[2 * i + 1];
    E += 0.5 * (vx * vx + vy * vy) - 1 / Math.hypot(x, y);
  }
  return E;
}
function rebuild() {
  bodies = [...PLANETS.map((p) => ({ a: p.a, e: p.e, omega: p.omega })), { a: cometA(), e: 0.6, omega: 0.3 }];
  swarm = createSwarm(bodies);
  trails = bodies.map(() => []);
  E0 = totalEnergy();
  VIEW = 1.12 * Math.max(...bodies.map((b) => b.a * (1 + b.e)));
}
function syncVals() { valueA.textContent = cometA().toFixed(2); valueSpeed.textContent = speed().toFixed(1); }
sliderA.addEventListener('input', () => { syncVals(); rebuild(); render(); });
sliderSpeed.addEventListener('input', syncVals);
btnReset.addEventListener('click', () => {
  sliderA.value = '1.9'; sliderSpeed.value = '1';
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
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const size = Math.min(draw.w, draw.h);
  SCN = { draw, ox: draw.x + draw.w / 2, oy: draw.y + draw.h / 2, scale: size / (2 * VIEW) };
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.85 },
    { name: 'diagnostic', weight: 1.15 },
  ]);
  computeSceneTransform();
}
const WX = (x) => SCN.ox + x * SCN.scale;
const WY = (y) => SCN.oy - y * SCN.scale;

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    sun: '#ffd24a', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
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

function drawScene(col, r) {
  panel(col, r, 'The inner solar system, to scale and in motion');
  const { draw } = SCN;

  ctx.save();
  clipTo(ctx, draw);

  // orbit ellipses (analytic guide).
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    ctx.strokeStyle = COL[i]; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = 0; k <= 120; k++) { const nu = 2 * Math.PI * k / 120; const rr = b.a * (1 - b.e * b.e) / (1 + b.e * Math.cos(nu)); const x = rr * Math.cos(nu + b.omega), y = rr * Math.sin(nu + b.omega); if (k) ctx.lineTo(WX(x), WY(y)); else ctx.moveTo(WX(x), WY(y)); }
    ctx.closePath(); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // trails + planets.
  for (let i = 0; i < bodies.length; i++) {
    const tr = trails[i];
    if (tr.length > 1) { ctx.strokeStyle = COL[i]; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.6; ctx.beginPath(); tr.forEach((p, k) => { if (k) ctx.lineTo(WX(p[0]), WY(p[1])); else ctx.moveTo(WX(p[0]), WY(p[1])); }); ctx.stroke(); ctx.globalAlpha = 1; }
    const p = bodyPosition(swarm, i);
    ctx.fillStyle = COL[i]; ctx.beginPath(); ctx.arc(WX(p.x), WY(p.y), i === 4 ? 4 : 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = COL[i]; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(NAMES[i], WX(p.x) + 7, WY(p.y));
  }

  // Sun.
  ctx.fillStyle = col.sun; ctx.beginPath(); ctx.arc(WX(0), WY(0), 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.restore();

  // readout strip.
  const Tc = keplerThirdLaw(cometA()) / (2 * Math.PI);   // periods in Earth years (Earth T=2pi -> 1 yr)
  const drift = Math.abs(totalEnergy() - E0) / Math.abs(E0);
  const items = [
    [`comet a ${cometA().toFixed(2)}`, COL[4]],
    [`T ${Tc.toFixed(2)}yr`, col.fg],
    ['Earth 1.00yr', COL[2]],
    [`ΔE ${drift.toExponential(0)}`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawDiagnostic(col, r) {
  panel(col, r, "Kepler's third law: T² grows as a³");

  const inner = { x: r.x + 52, y: r.y + 28, w: r.w - 52 - 16, h: r.h - 28 - 42 };
  const aMax = Math.max(...bodies.map((b) => b.a));
  const x3Max = Math.pow(aMax, 3) * 1.12, y2Max = Math.pow(keplerThirdLaw(aMax), 2) * 1.12;
  const xOf = (a3) => inner.x + a3 / x3Max * inner.w;
  const yOf = (t2) => inner.y + inner.h - t2 / y2Max * inner.h;

  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0, 0.5, 1]) { const y = inner.y + inner.h - f * inner.h; ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((y2Max * f).toFixed(0), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // theoretical line T^2 = 4 pi^2 a^3.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0)); ctx.lineTo(xOf(x3Max), yOf(4 * Math.PI * Math.PI * x3Max)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('T² = 4π²a³', xOf(x3Max * 0.36) + 6, yOf(4 * Math.PI * Math.PI * x3Max * 0.36) + 6);

  // body points.
  for (let i = 0; i < bodies.length; i++) {
    const a3 = Math.pow(bodies[i].a, 3), t2 = Math.pow(keplerThirdLaw(bodies[i].a), 2);
    ctx.fillStyle = COL[i]; ctx.beginPath(); ctx.arc(xOf(a3), yOf(t2), i === 4 ? 6 : 5, 0, 2 * Math.PI); ctx.fill();
    if (i === 4 || i === 2) { ctx.fillStyle = COL[i]; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(NAMES[i], xOf(a3) + 6, yOf(t2) - 3); }
  }

  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('semi-major axis cubed  a³', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 40, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('period squared  T²', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!swarm) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function advance() {
  const n = Math.max(1, Math.round(speed() * 6));
  for (let s = 0; s < n; s++) stepSwarm(swarm, DEFAULT_DT);
  for (let i = 0; i < bodies.length; i++) { const p = bodyPosition(swarm, i); trails[i].push([p.x, p.y]); if (trails[i].length > 140) trails[i].shift(); }
}

let last = performance.now();
function tick(now) {
  last = now;
  if (running) advance();
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals(); rebuild(); relayout();
  for (let i = 0; i < 220; i++) advance();   // pre-roll so trails are populated
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
      { key: 'comet', label: 'comet semi-major a', value: cometA(), format: 'float' },
      { key: 'cometT', label: 'comet period (yr)', value: keplerThirdLaw(cometA()) / (2 * Math.PI), format: 'float' },
      { key: 'bodies', label: 'bodies', value: bodies.length, format: 'int' },
      { key: 'drift', label: 'energy drift (rel.)', value: Math.abs(totalEnergy() - E0) / Math.abs(E0), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // Symplectic integration conserves the total energy (bounded drift),
    // so the orbits stay closed indefinitely.
    const drift = Math.abs(totalEnergy() - E0) / Math.abs(E0);
    return [{
      key: 'energy',
      label: 'total energy conserved (rel. drift)',
      value: drift.toExponential(2),
      status: drift < 1e-2 ? 'pass' : (drift < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
