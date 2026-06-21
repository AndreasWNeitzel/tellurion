import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
// Vertical 4:5 hero for balls forming a shape and shattering into a concave
// bowl. Top region: the chosen bowl profile (filled) with the shape's balls
// falling, bouncing (tangent-plane restitution), and pooling. Bottom region:
// the total energy over time, flat at e = 1 and a descending staircase at
// e < 1.
//
// Reference: Kleppner and Kolenkow, An Introduction to Mechanics, 2nd ed., Ch. 4.

import { createSystem, step, SHAPES, diagnostics, totalEnergy } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selShape = document.getElementById('select-shape');
const selArrange = document.getElementById('select-arrange');
const sliderE = document.getElementById('slider-e');
const sliderA = document.getElementById('slider-a');
const sliderN = document.getElementById('slider-n');
const valueShape = document.getElementById('value-shape');
const valueArrange = document.getElementById('value-arrange');
const valueE = document.getElementById('value-e');
const valueA = document.getElementById('value-a');
const valueN = document.getElementById('value-n');
const btnDrop = document.getElementById('btn-drop');
const btnPlay = document.getElementById('btn-playpause');

const PHYSICS_DT = 1 / 240;
const SEED = 0xC0FFEE;
let running = !DETERMINISTIC;
let sys = null;
let dropCount = 0;
const hist = [];          // {t, E} for the diagnostic
let E0 = 1;

function drop() {
  sys = createSystem({
    shape: selShape.value, arrangement: selArrange.value,
    e: parseFloat(sliderE.value), a: parseFloat(sliderA.value),
    n: parseInt(sliderN.value, 10), mu: 0.02, seed: SEED + dropCount,
  });
  E0 = totalEnergy(sys);
  sys.E0 = E0;
  hist.length = 0;
}
function syncVals() {
  valueShape.textContent = selShape.value;
  valueArrange.textContent = selArrange.value;
  valueE.textContent = parseFloat(sliderE.value).toFixed(2);
  valueA.textContent = parseFloat(sliderA.value).toFixed(2);
  valueN.textContent = String(parseInt(sliderN.value, 10));
}
[selShape, selArrange, sliderE, sliderA, sliderN].forEach((el) => el.addEventListener('input', () => { syncVals(); dropCount += 1; drop(); render(); }));
selShape.addEventListener('change', () => { syncVals(); dropCount += 1; drop(); render(); });
selArrange.addEventListener('change', () => { syncVals(); dropCount += 1; drop(); render(); });
btnDrop.addEventListener('click', () => { dropCount += 1; drop(); running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false'); render(); });
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
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.05 },
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
    bowl: '#1b2230',
    energy: '#ffd166',
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

function drawScene(col, r) {
  panel(col, r, 'Gravity shatters the shape into the bowl');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x + 6, y: r.y + titleH + 4, w: r.w - 12, h: r.h - titleH - 4 - stripH - 4 };
  const XV = 3.4, yBot = -0.3, yTop = 4.45;
  const scale = Math.min(draw.w / (2 * XV), draw.h / (yTop - yBot));
  const cx = draw.x + draw.w / 2;
  const y0 = draw.y + draw.h - 4 + yBot * scale;     // screen y for world y=0 region
  const SX = (x) => cx + x * scale;
  const SY = (y) => y0 - y * scale;

  ctx.save();
  clipTo(ctx, draw);

  // Bowl: filled region below the profile curve.
  const fS = SHAPES[sys.shape].f;
  const a = sys.a;
  ctx.fillStyle = col.bowl;
  ctx.beginPath();
  ctx.moveTo(SX(-XV), draw.y + draw.h);
  for (let i = 0; i <= 120; i++) {
    const x = -XV + (2 * XV) * i / 120;
    ctx.lineTo(SX(x), SY(fS(x, a)));
  }
  ctx.lineTo(SX(XV), draw.y + draw.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = col.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const x = -XV + (2 * XV) * i / 120;
    const X = SX(x), Y = SY(fS(x, a));
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.stroke();

  // Balls, colored by their original column.
  for (const b of sys.balls) {
    const c = viridis(b.ci / 5);
    ctx.fillStyle = `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
    ctx.fillRect(SX(b.x) - 1.3, SY(b.y) - 1.3, 2.6, 2.6);
  }

  ctx.restore();

  // Readout strip.
  const d = diagnostics(sys);
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [selArrange.value, col.accent],
    [`e = ${sys.e.toFixed(2)}`, col.fg],
    [`KE+PE ${d.E.toFixed(1)}`, col.energy],
    [`loss ${((1 - d.E / E0) * 100).toFixed(0)}%`, col.muted],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Total energy over time: flat (e=1) or stepping down');

  const inner = { x: r.x + 44, y: r.y + 26, w: r.w - 44 - 14, h: r.h - 26 - 38 };
  const WINDOW = 16;
  const tNow = sys.t;
  const t0 = Math.max(0, tNow - WINDOW);
  const tSpan = Math.max(WINDOW, tNow) - t0 || 1;
  const yMax = E0 * 1.08;
  const xOf = (t) => inner.x + ((t - t0) / tSpan) * inner.w;
  const yOf = (E) => inner.y + inner.h - (E / yMax) * inner.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const f of [0, 0.5, 1]) { const y = yOf(f * yMax); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText((f * yMax).toFixed(0), inner.x - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // initial-energy reference.
  ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = col.muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(E0)); ctx.lineTo(inner.x + inner.w, yOf(E0)); ctx.stroke(); ctx.restore();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('E₀ (dropped)', inner.x + 4, yOf(E0) - 2);

  // energy curve.
  ctx.strokeStyle = col.energy; ctx.lineWidth = 2.4;
  ctx.beginPath();
  let started = false;
  for (const h of hist) {
    if (h.t < t0) continue;
    const X = xOf(h.t), Y = yOf(h.E);
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('time (s)', inner.x + inner.w / 2, inner.y + inner.h + 18);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('energy', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!sys) drop();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function recordE() { hist.push({ t: sys.t, E: totalEnergy(sys) }); while (hist.length && hist[0].t < sys.t - 17) hist.shift(); }

let last = performance.now();
let accum = 0, sample = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    let guard = 0;
    while (accum >= PHYSICS_DT && guard < 600) { step(sys, PHYSICS_DT); accum -= PHYSICS_DT; guard++; if ((sample++ % 8) === 0) recordE(); }
    // auto re-drop once settled or after a while.
    if (sys.t > 17 || (sys.t > 3 && diagnostics(sys).maxSpeed < 0.3)) { dropCount += 1; drop(); }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  drop();
  const pre = CAPTURE_NAME ? (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 4 : 0.26;
  for (let i = 0; i < Math.round(pre / PHYSICS_DT); i++) { step(sys, PHYSICS_DT); if ((i % 8) === 0) recordE(); }
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
  const d = diagnostics(sys);
  return {
    fields: [
      { key: 'shape', label: 'shape', value: selArrange.value, format: 'text' },
      { key: 'e', label: 'restitution $e$', value: sys.e, format: 'float' },
      { key: 'E', label: 'energy $KE+PE$', value: d.E, format: 'float' },
      { key: 'loss', label: 'energy lost', value: 1 - d.E / E0, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const d = diagnostics(sys);
    // Collisions never add energy: the drift is non-positive (zero at e=1,
    // negative when e<1 or with friction).
    return [{
      key: 'dissipative',
      label: 'collisions never add energy',
      value: d.energyDrift.toExponential(2),
      status: d.energyDrift <= 0.02 ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
