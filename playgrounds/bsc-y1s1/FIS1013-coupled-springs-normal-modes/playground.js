import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for two masses coupled by three springs between walls.
// Top region: three stacked copies of the system. The first is the actual
// motion; below it are its two normal-mode parts, the slow in-phase mode at
// omega+ (both masses together) and the fast out-of-phase mode at omega-
// (masses opposed). The actual motion is exactly their sum. Bottom region:
// the two mass displacements versus time (one frequency in a pure mode, a
// beat in a generic mix).

import {
  createSprings, stepVerlet, totalEnergy, modeAmplitudes,
  OMEGA_PLUS, OMEGA_MINUS,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderX1 = document.getElementById('slider-x1');
const sliderX2 = document.getElementById('slider-x2');
const valueX1 = document.getElementById('value-x1');
const valueX2 = document.getElementById('value-x2');
const btnPlus = document.getElementById('btn-plus');
const btnMinus = document.getElementById('btn-minus');
const btnGeneric = document.getElementById('btn-generic');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

// Spring-system world layout (units of displacement). Walls bracket the two
// equilibrium positions with enough room that the masses do not cross.
const WALL_R = 5.4, EQ1 = 1.8, EQ2 = 3.6;

const PHYSICS_DT = 0.005;
const WINDOW = 14.0;            // diagnostic time window (s)
const PREROLL = 7.0;            // seconds advanced on load so traces show a beat
let running = !DETERMINISTIC;
let modeScale = 0.6;
let e0 = null;
const hist = [];

function makeSim() {
  const x1 = parseFloat(sliderX1.value);
  const x2 = parseFloat(sliderX2.value);
  const s = createSprings({ x1_0: x1, x2_0: x2 });
  modeScale = Math.max(Math.abs((x1 + x2) / 2), Math.abs((x1 - x2) / 2), 0.1);
  e0 = null;
  hist.length = 0;
  return s;
}
let sim = makeSim();

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.25 },
  ]);
}

function syncValues() {
  valueX1.textContent = parseFloat(sliderX1.value).toFixed(2);
  valueX2.textContent = parseFloat(sliderX2.value).toFixed(2);
}
function reinit() { sim = makeSim(); }

[sliderX1, sliderX2].forEach((sl) => sl.addEventListener('input', () => {
  syncValues();
  reinit();
  render();
}));
function setStart(a, b) {
  sliderX1.value = String(a);
  sliderX2.value = String(b);
  syncValues();
  reinit();
  running = true;
  btnPlay.textContent = 'Pause';
  btnPlay.setAttribute('aria-pressed', 'false');
  render();
}
btnPlus.addEventListener('click', () => setStart(0.6, 0.6));
btnMinus.addEventListener('click', () => setStart(0.6, -0.6));
btnGeneric.addEventListener('click', () => setStart(0.6, 0.0));
btnReset.addEventListener('click', () => { reinit(); render(); });
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
    m1: '#5bc0eb',
    m2: '#ff9d6e',
    plus: '#67d98c',
    minus: '#b58cff',
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

function roundRect(x, y, w, h, rad) {
  const rr = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawSpring(xA, xB, y, col, amp) {
  const n = 14;
  const lead = Math.min(10, (xB - xA) * 0.18);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xA, y);
  const x0 = xA + lead, x1 = xB - lead;
  ctx.lineTo(x0, y);
  for (let i = 1; i < n; i++) {
    const xx = x0 + (x1 - x0) * i / n;
    ctx.lineTo(xx, y + (i % 2 === 0 ? amp : -amp));
  }
  ctx.lineTo(x1, y);
  ctx.lineTo(xB, y);
  ctx.stroke();
}

function drawSpringSystem(col, rect, x1, x2, label, labelCol) {
  const pad = 16;
  const sx = (wx) => rect.x + pad + (wx / WALL_R) * (rect.w - 2 * pad);
  const yTrack = rect.y + rect.h * 0.60;
  const pos1 = EQ1 + x1, pos2 = EQ2 + x2;
  const wallH = rect.h * 0.52;

  if (label) {
    ctx.fillStyle = labelCol || col.muted;
    ctx.font = fontString(canvas, 'tick', 'mono', 600);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, rect.x + 4, rect.y + 2);
  }

  // Walls.
  ctx.fillStyle = '#23262f';
  ctx.fillRect(sx(0) - 7, yTrack - wallH / 2, 7, wallH);
  ctx.fillRect(sx(WALL_R), yTrack - wallH / 2, 7, wallH);

  // Equilibrium markers.
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  for (const eq of [EQ1, EQ2]) {
    ctx.beginPath();
    ctx.moveTo(sx(eq), yTrack - wallH / 2);
    ctx.lineTo(sx(eq), yTrack + wallH / 2);
    ctx.stroke();
  }
  ctx.restore();

  // Springs.
  const amp = Math.min(8, rect.h * 0.06);
  drawSpring(sx(0), sx(pos1), yTrack, col.muted, amp);
  drawSpring(sx(pos1), sx(pos2), yTrack, col.muted, amp);
  drawSpring(sx(pos2), sx(WALL_R), yTrack, col.muted, amp);

  // Masses.
  const bs = Math.max(18, Math.min(34, rect.h * 0.32));
  for (const [pos, color, name] of [[pos1, col.m1, 'm₁'], [pos2, col.m2, 'm₂']]) {
    const bx = sx(pos);
    ctx.fillStyle = color;
    roundRect(bx - bs / 2, yTrack - bs / 2, bs, bs, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#0a0c12';
    ctx.font = fontString(canvas, 'tick', 'sans', 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, bx, yTrack);
  }
}

function drawScene(col, r) {
  panel(col, r, 'Any motion is the sum of two normal modes');

  const titleH = 22, stripH = 28;
  const top = r.y + titleH + 4;
  const usable = r.h - titleH - 4 - stripH - 6;
  const rowH = usable / 3;
  const qPlus = (sim.x1 + sim.x2) / 2;
  const qMinus = (sim.x1 - sim.x2) / 2;

  drawSpringSystem(col, { x: r.x + 6, y: top, w: r.w - 12, h: rowH },
    sim.x1, sim.x2, 'actual motion', col.fg);
  drawSpringSystem(col, { x: r.x + 6, y: top + rowH, w: r.w - 12, h: rowH },
    qPlus, qPlus, `=  in-phase mode    ω₊ = ${OMEGA_PLUS.toFixed(2)}`, col.plus);
  drawSpringSystem(col, { x: r.x + 6, y: top + 2 * rowH, w: r.w - 12, h: rowH },
    qMinus, -qMinus, `+  out-of-phase mode    ω₋ = ${OMEGA_MINUS.toFixed(2)}`, col.minus);

  // Faint separators between the rows.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 1;
  for (let k = 1; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(r.x + 8, top + k * rowH);
    ctx.lineTo(r.x + r.w - 8, top + k * rowH);
    ctx.stroke();
  }

  // Readout strip.
  const { Aplus, Aminus } = modeAmplitudes(sim);
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [`x₁ = ${sim.x1.toFixed(2)}`, col.m1],
    [`x₂ = ${sim.x2.toFixed(2)}`, col.m2],
    [`A₊ = ${Aplus.toFixed(2)}`, col.plus],
    [`A₋ = ${Aminus.toFixed(2)}`, col.minus],
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
  panel(col, r, 'Displacements vs time');

  const inner = {
    x: r.x + 44,
    y: r.y + 28,
    w: r.w - 44 - 14,
    h: r.h - 28 - 38,
  };
  const yHalf = Math.max(Math.abs(sim.x1), Math.abs(sim.x2), modeScale, 0.2) * 1.1;
  const tNow = sim.t;
  const t0 = Math.max(0, tNow - WINDOW);
  const tSpan = Math.max(WINDOW, tNow) - t0 || 1;
  const xOf = (t) => inner.x + ((t - t0) / tSpan) * inner.w;
  const yOf = (v) => inner.y + inner.h / 2 - (v / yHalf) * (inner.h / 2);

  // Grid + y ticks.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const v of [-yHalf, 0, yHalf]) {
    const y = yOf(v);
    ctx.beginPath();
    ctx.moveTo(inner.x, y);
    ctx.lineTo(inner.x + inner.w, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(1), inner.x - 5, y);
  }
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  const plot = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (const h of hist) {
      if (h.t < t0) continue;
      const X = xOf(h.t), Y = yOf(h[key]);
      if (!started) { ctx.moveTo(X, Y); started = true; } else { ctx.lineTo(X, Y); }
    }
    ctx.stroke();
  };
  plot('x1', col.m1);
  plot('x2', col.m2);

  if (hist.length) {
    const cur = hist[hist.length - 1];
    const dot = (yy, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xOf(cur.t), yy, 3.5, 0, 2 * Math.PI); ctx.fill(); };
    dot(yOf(cur.x1), col.m1);
    dot(yOf(cur.x2), col.m2);
  }

  // Axis labels.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('time (s)', inner.x + inner.w / 2, inner.y + inner.h + 18);
  ctx.save();
  ctx.translate(inner.x - 32, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('displacement', 0, 0);
  ctx.restore();

  // Legend.
  const legend = [['x₁', col.m1], ['x₂', col.m2]];
  ctx.fillStyle = 'rgba(10,12,18,0.72)';
  ctx.fillRect(inner.x + 6, inner.y + 6, 96, 18);
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
    ctx.lineTo(lx + 14, ly);
    ctx.stroke();
    ctx.fillStyle = col.fg;
    ctx.fillText(lab, lx + 17, ly);
    lx += 44;
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

function recordHistory() {
  hist.push({ t: sim.t, x1: sim.x1, x2: sim.x2 });
  while (hist.length && hist[0].t < sim.t - WINDOW - 0.5) hist.shift();
}

let last = performance.now();
let accum = 0;
let sample = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    while (accum >= PHYSICS_DT) {
      stepVerlet(sim, PHYSICS_DT);
      accum -= PHYSICS_DT;
      if ((sample++ % 6) === 0) recordHistory();
    }
  }
  render();
  requestAnimationFrame(tick);
}

function preroll(seconds) {
  const n = Math.round(seconds / PHYSICS_DT);
  for (let i = 0; i < n; i++) {
    stepVerlet(sim, PHYSICS_DT);
    if ((i % 6) === 0) recordHistory();
  }
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    preroll(f * WINDOW);
  } else {
    preroll(PREROLL);
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
  const { Aplus, Aminus } = modeAmplitudes(sim);
  return {
    fields: [
      { key: 'x1', label: 'mass 1 $x_1$', value: sim.x1, format: 'float' },
      { key: 'x2', label: 'mass 2 $x_2$', value: sim.x2, format: 'float' },
      { key: 'aplus', label: 'in-phase $A_+$', value: Aplus, format: 'float' },
      { key: 'aminus', label: 'out-of-phase $A_-$', value: Aminus, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const E = totalEnergy(sim);
    if (!Number.isFinite(E)) return [];
    if (e0 === null) e0 = E;
    const dE = Math.abs(E - e0) / Math.max(1e-6, Math.abs(e0));
    return [{
      key: 'energy',
      label: 'total energy conserved (rel. drift)',
      value: dE.toExponential(2),
      status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
