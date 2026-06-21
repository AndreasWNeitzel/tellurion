import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for epsilon-delta continuity. Top region: the graph, the
// epsilon-band around f(x0), and the widest delta-interval whose image stays
// inside it, drawn as a box a moving test point never leaves. Bottom region:
// the largest delta versus epsilon, positive for a continuous point and zero
// at a jump until epsilon clears the gap.
//
// Reference: Spivak, Calculus, Ch. 5-6; Abbott, Understanding Analysis, Ch. 4.

import { FUNCTIONS, maxDeltaFor } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderX = document.getElementById('slider-x');
const sliderEps = document.getElementById('slider-eps');
const valueX = document.getElementById('value-x');
const valueEps = document.getElementById('value-eps');
const kindBtns = {
  sin: document.getElementById('btn-sin'),
  parabola: document.getElementById('btn-parabola'),
  jump: document.getElementById('btn-jump'),
};
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const DEF = { kind: 'sin', x0: 0.6, eps: 0.4 };
let kind = DEF.kind;
let running = !DETERMINISTIC;
let phase = 0;
let delta = 0;
let curve = [];               // {eps, delta} for the diagnostic

function fn() { return FUNCTIONS[kind].fn; }
function rebuild() {
  const x0 = parseFloat(sliderX.value), eps = parseFloat(sliderEps.value);
  delta = maxDeltaFor(fn(), x0, eps);
  const epsMax = parseFloat(sliderEps.max);
  curve = [];
  for (let i = 0; i <= 60; i++) {
    const e = (i / 60) * epsMax;
    curve.push({ eps: e, delta: e <= 0 ? 0 : maxDeltaFor(fn(), x0, e, 2.0, 500) });
  }
}
function syncVals() {
  valueX.textContent = parseFloat(sliderX.value).toFixed(2);
  valueEps.textContent = parseFloat(sliderEps.value).toFixed(2);
}
function setKindPressed() { for (const k of Object.keys(kindBtns)) kindBtns[k].setAttribute('aria-pressed', String(k === kind)); }

for (const s of [sliderX, sliderEps]) s.addEventListener('input', () => { syncVals(); rebuild(); render(); });
for (const k of Object.keys(kindBtns)) kindBtns[k].addEventListener('click', () => { kind = k; setKindPressed(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  kind = DEF.kind; sliderX.value = String(DEF.x0); sliderEps.value = String(DEF.eps);
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  setKindPressed(); syncVals(); rebuild(); render();
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
    { name: 'scene', weight: 1.7 },
    { name: 'diagnostic', weight: 1.35 },
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
    curve: '#7cc6ff',
    eps: '#67d98c',
    delta: '#b58cff',
    probe: '#ffd166',
    bad: '#ef476f',
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
  panel(col, r, 'For every ε-band, a δ-interval that fits inside it');

  const titleH = 22, stripH = 28;
  const box = { x: r.x + 40, y: r.y + titleH + 6, w: r.w - 40 - 14, h: r.h - titleH - 6 - stripH - 24 };

  const x0 = parseFloat(sliderX.value), eps = parseFloat(sliderEps.value);
  const F = fn();
  const f0 = F(x0);
  const Wx = Math.max(2.6, delta * 1.7);
  const H = Math.max(1.3, eps * 3.2);
  const xMin = x0 - Wx, xMax = x0 + Wx, yMin = f0 - H, yMax = f0 + H;
  const xOf = (x) => box.x + (x - xMin) / (xMax - xMin) * box.w;
  const yOf = (y) => box.y + box.h - (y - yMin) / (yMax - yMin) * box.h;

  // epsilon band (horizontal) and delta interval (vertical).
  ctx.fillStyle = 'rgba(103,217,140,0.12)';
  ctx.fillRect(box.x, yOf(f0 + eps), box.w, yOf(f0 - eps) - yOf(f0 + eps));
  if (delta > 1e-4) {
    ctx.fillStyle = 'rgba(181,140,255,0.12)';
    ctx.fillRect(xOf(x0 - delta), box.y, xOf(x0 + delta) - xOf(x0 - delta), box.h);
    // the box (intersection).
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(xOf(x0 - delta), yOf(f0 + eps), xOf(x0 + delta) - xOf(x0 - delta), yOf(f0 - eps) - yOf(f0 + eps));
  }

  // axes.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 1;
  if (0 >= yMin && 0 <= yMax) { ctx.beginPath(); ctx.moveTo(box.x, yOf(0)); ctx.lineTo(box.x + box.w, yOf(0)); ctx.stroke(); }
  if (0 >= xMin && 0 <= xMax) { ctx.beginPath(); ctx.moveTo(xOf(0), box.y); ctx.lineTo(xOf(0), box.y + box.h); ctx.stroke(); }
  ctx.strokeStyle = col.border;
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  // the curve (break across large jumps).
  ctx.save();
  clipTo(ctx, box);
  ctx.strokeStyle = col.curve;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  let started = false, prevY = null;
  const NS = 400;
  for (let i = 0; i <= NS; i++) {
    const x = xMin + (xMax - xMin) * i / NS;
    const y = F(x);
    if (prevY !== null && Math.abs(y - prevY) > 0.45 * (yMax - yMin)) started = false; // jump: lift pen
    const X = xOf(x), Y = yOf(y);
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    prevY = y;
  }
  ctx.stroke();
  ctx.restore();

  // point (x0, f0).
  ctx.fillStyle = col.bad;
  ctx.beginPath(); ctx.arc(xOf(x0), yOf(f0), 4.5, 0, 2 * Math.PI); ctx.fill();

  // moving test point sweeping the delta interval (only if delta exists).
  if (delta > 1e-4) {
    const xp = x0 + delta * Math.sin(phase * 2 * Math.PI);
    const yp = F(xp);
    ctx.strokeStyle = 'rgba(255,209,102,0.4)';
    ctx.lineWidth = 1;
    ctx.save(); ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xOf(xp), box.y + box.h); ctx.lineTo(xOf(xp), yOf(yp)); ctx.lineTo(box.x, yOf(yp)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = col.probe;
    ctx.beginPath(); ctx.arc(xOf(xp), yOf(yp), 4, 0, 2 * Math.PI); ctx.fill();
  } else {
    ctx.fillStyle = col.bad;
    ctx.font = fontString(canvas, 'caption', 'mono', 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('no δ exists: discontinuous here', box.x + box.w / 2, box.y + box.h * 0.22);
  }

  // band / interval labels.
  ctx.fillStyle = col.eps;
  ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('ε', box.x + 4, yOf(f0 + eps) - 7);
  if (delta > 1e-4) {
    ctx.fillStyle = col.delta;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('δ', xOf(x0), yOf(f0 - eps) + 4);
  }
  // y label f(x0).
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('f(x₀)', box.x - 4, yOf(f0));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('x₀', xOf(x0), box.y + box.h + 4);

  // Readout strip.
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [FUNCTIONS[kind].label, col.curve],
    [`x₀ = ${x0.toFixed(2)}`, col.fg],
    [`ε = ${eps.toFixed(2)}`, col.eps],
    [delta > 1e-4 ? `δ = ${delta.toFixed(3)}` : 'δ = 0', delta > 1e-4 ? col.delta : col.bad],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Largest δ as a function of ε');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 14, h: r.h - 28 - 40 };
  const epsMax = parseFloat(sliderEps.max);
  let dMaxObs = 0.1;
  for (const p of curve) dMaxObs = Math.max(dMaxObs, p.delta);
  const yMax = dMaxObs * 1.1;
  const xOf = (e) => inner.x + (e / epsMax) * inner.w;
  const yOf = (d) => inner.y + inner.h - (d / yMax) * inner.h;

  // Grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const d of [0, yMax / 2, yMax]) { const y = yOf(d); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(d.toFixed(2), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= 3; i++) { const e = i / 3 * epsMax; ctx.fillText(e.toFixed(1), xOf(e), inner.y + inner.h + 4); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // delta(eps) curve.
  ctx.strokeStyle = col.delta; ctx.lineWidth = 2.6;
  ctx.beginPath();
  curve.forEach((p, i) => { const X = xOf(p.eps), Y = yOf(p.delta); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.stroke();

  // Cursor at current eps.
  const eps = parseFloat(sliderEps.value);
  const cxp = xOf(eps);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  ctx.save(); ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(cxp, inner.y); ctx.lineTo(cxp, inner.y + inner.h); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = delta > 1e-4 ? col.delta : col.bad;
  ctx.beginPath(); ctx.arc(cxp, yOf(delta), 4, 0, 2 * Math.PI); ctx.fill();

  // Note for the discontinuous case.
  if (!FUNCTIONS[kind].continuous && delta <= 1e-4) {
    ctx.fillStyle = col.bad;
    ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('δ = 0 until ε clears the gap', inner.x + 8, inner.y + 8);
  }

  // Axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('ε (output tolerance)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('largest δ', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!curve.length) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) phase = (phase + dt * 0.3) % 1;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    phase = f % 1;
  }
  setKindPressed();
  syncVals();
  rebuild();
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
  const x0 = parseFloat(sliderX.value), eps = parseFloat(sliderEps.value);
  return {
    fields: [
      { key: 'fn', label: 'function', value: FUNCTIONS[kind].label, format: 'text' },
      { key: 'x0', label: 'point $x_0$', value: x0, format: 'float' },
      { key: 'eps', label: 'tolerance $\\varepsilon$', value: eps, format: 'float' },
      { key: 'delta', label: 'largest $\\delta$', value: delta, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const x0 = parseFloat(sliderX.value), eps = parseFloat(sliderEps.value);
    const F = fn();
    const f0 = F(x0);
    // Verify the found delta keeps the image inside the epsilon band.
    let maxAbs = 0;
    const N = 400;
    for (let k = 0; k <= N; k++) {
      const x = x0 - delta + (2 * delta) * k / N;
      maxAbs = Math.max(maxAbs, Math.abs(F(x) - f0));
    }
    const ratio = maxAbs / Math.max(1e-9, eps);
    return [{
      key: 'box',
      label: 'image of δ-interval ⊂ ε-band',
      value: ratio.toFixed(3),
      status: ratio <= 1.001 ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
