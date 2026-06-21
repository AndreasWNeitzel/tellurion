import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for series convergence. Top region: the partial sum S_N
// as N grows, approaching the limit for a convergent series or climbing
// without bound for the harmonic series. Bottom region: the term magnitudes
// |a_n| on a log axis, the decay rate that decides convergence.
//
// Reference: Spivak, Calculus, Ch. 23; Abbott, Understanding Analysis, Ch. 2.

import { SERIES } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const KEYS = ['geom_half', 'pseries_2', 'pseries_1', 'alt_log2'];
const btns = {};
for (const k of KEYS) btns[k] = document.getElementById('btn-' + k);
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const NMAX = 80;
const SWEEP = 6.5;            // seconds to sweep N from 1 to NMAX
const DEF = 'geom_half';
let name = DEF;
let running = !DETERMINISTIC;
let acc = 0, holding = false, holdT = 0;
let data = null;

function rebuild() {
  const t = SERIES[name].terms;
  const S = [0];
  const a = [0];
  for (let n = 1; n <= NMAX; n++) { a[n] = t(n); S[n] = S[n - 1] + a[n]; }
  const finite = Number.isFinite(SERIES[name].limit);
  let yLo = 0, yHi = 0;
  for (let n = 1; n <= NMAX; n++) { yLo = Math.min(yLo, S[n]); yHi = Math.max(yHi, S[n]); }
  if (finite) yHi = Math.max(yHi, SERIES[name].limit);
  const pad = (yHi - yLo) * 0.08 || 0.1;
  // term magnitudes for the log diagnostic.
  let aMin = Infinity;
  for (let n = 1; n <= NMAX; n++) aMin = Math.min(aMin, Math.abs(a[n]) || 1e-300);
  const logLo = Math.max(-9, Math.log10(Math.max(1e-300, aMin))) - 0.3;
  data = { S, a, finite, limit: SERIES[name].limit, yLo: yLo - pad, yHi: yHi + pad, logLo, logHi: 0.3 };
}

function setPressed() { for (const k of KEYS) btns[k].setAttribute('aria-pressed', String(k === name)); }
function curN() { return Math.max(1, Math.min(NMAX, Math.floor(1 + acc * (NMAX / SWEEP)))); }

for (const k of KEYS) btns[k].addEventListener('click', () => { name = k; acc = 0; holding = false; setPressed(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  name = DEF; acc = 0; holding = false; running = true;
  btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  setPressed(); rebuild(); render();
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
    { name: 'scene', weight: 1.6 },
    { name: 'diagnostic', weight: 1.4 },
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
    sum: '#ffd166',
    limit: '#67d98c',
    term: '#7cc6ff',
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

function niceTicks(lo, hi, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(lo + (hi - lo) * i / n);
  return out;
}

function drawScene(col, r) {
  panel(col, r, 'Partial sum S_N as more terms are added');

  const titleH = 22, stripH = 28;
  const inner = { x: r.x + 50, y: r.y + titleH + 8, w: r.w - 50 - 16, h: r.h - titleH - 8 - stripH - 24 };
  const { S, finite, limit, yLo, yHi } = data;
  const N = curN();
  const xOf = (n) => inner.x + (n / NMAX) * inner.w;
  const yOf = (y) => inner.y + inner.h - (y - yLo) / (yHi - yLo) * inner.h;

  // Grid + y ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of niceTicks(yLo, yHi, 4)) { const y = yOf(v); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(v.toFixed(2), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const nn of [0, 20, 40, 60, 80]) ctx.fillText(String(nn), xOf(nn), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // Limit line.
  if (finite) {
    ctx.save(); ctx.setLineDash([5, 5]);
    ctx.strokeStyle = col.limit; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(inner.x, yOf(limit)); ctx.lineTo(inner.x + inner.w, yOf(limit)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = col.limit; ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('limit', inner.x + inner.w - 4, yOf(limit) - 2);
  }

  // Partial-sum trace up to current N.
  ctx.save();
  clipTo(ctx, inner);
  ctx.strokeStyle = col.sum; ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let n = 1; n <= N; n++) { const X = xOf(n), Y = yOf(S[n]); if (n === 1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();
  ctx.restore();

  // Moving marker at current (N, S_N).
  ctx.fillStyle = col.sum;
  ctx.beginPath(); ctx.arc(xOf(N), yOf(S[N]), 4.5, 0, 2 * Math.PI); ctx.fill();

  // Axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('number of terms N', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 36, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('partial sum S_N', 0, 0); ctx.restore();

  // Readout strip.
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [SERIES[name].label.replace('sum_{n>=1} ', '').replace('sum ', ''), col.term],
    [`N = ${N}`, col.fg],
    [`S = ${S[N].toFixed(2)}`, col.sum],
    [finite ? `→ ${limit.toFixed(2)}` : 'diverges', finite ? col.limit : col.bad],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Term size |a_n| (log scale): the decay rate');

  const inner = { x: r.x + 50, y: r.y + 28, w: r.w - 50 - 16, h: r.h - 28 - 40 };
  const { a, logLo, logHi } = data;
  const N = curN();
  const xOf = (n) => inner.x + (n / NMAX) * inner.w;
  const yOf = (lg) => inner.y + inner.h - (lg - logLo) / (logHi - logLo) * inner.h;

  // Decade gridlines + labels.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let e = 0; e >= Math.ceil(logLo); e -= 2) {
    const y = yOf(e);
    if (y < inner.y || y > inner.y + inner.h) continue;
    ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke();
    ctx.fillText(`1e${e}`, inner.x - 5, y);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const nn of [0, 20, 40, 60, 80]) ctx.fillText(String(nn), xOf(nn), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // |a_n| curve (log) up to current N.
  ctx.save();
  clipTo(ctx, inner);
  ctx.strokeStyle = col.term; ctx.lineWidth = 2.4;
  ctx.beginPath();
  let started = false;
  for (let n = 1; n <= N; n++) {
    const lg = Math.log10(Math.max(1e-300, Math.abs(a[n])));
    const X = xOf(n), Y = Math.max(inner.y, Math.min(inner.y + inner.h, yOf(lg)));
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.restore();
  // marker.
  const lgN = Math.log10(Math.max(1e-300, Math.abs(a[N])));
  ctx.fillStyle = col.term;
  ctx.beginPath(); ctx.arc(xOf(N), Math.max(inner.y, Math.min(inner.y + inner.h, yOf(lgN))), 4, 0, 2 * Math.PI); ctx.fill();

  // Axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('term index n', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 38, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('|a_n|', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!data) rebuild();
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
  if (running) {
    if (!holding) {
      acc += dt;
      if (curN() >= NMAX) { holding = true; holdT = 0; }
    } else {
      holdT += dt;
      if (holdT > 2.5) { acc = 0; holding = false; }
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    acc = f * SWEEP;
  } else {
    acc = SWEEP;          // show the fully-swept curve on load
    holding = true; holdT = 0;
  }
  setPressed();
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
  if (!data) rebuild();
  const N = curN();
  return {
    fields: [
      { key: 'series', label: 'series', value: SERIES[name].label, format: 'text' },
      { key: 'N', label: 'terms $N$', value: N, format: 'int' },
      { key: 'sum', label: 'partial sum $S_N$', value: data.S[N], format: 'float' },
      { key: 'limit', label: 'limit', value: data.finite ? data.limit : Infinity, format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    if (!data) rebuild();
    const S = data.S;
    if (data.finite) {
      const err = Math.abs(S[NMAX] - data.limit);
      return [{
        key: 'converge',
        label: 'partial sum approaches the limit',
        value: err.toExponential(2),
        status: err < 0.1 ? 'pass' : (err < 0.3 ? 'pending' : 'drift'),
      }];
    }
    // Harmonic: confirm it keeps growing (diverges).
    const growth = S[NMAX] - S[NMAX >> 1];
    return [{
      key: 'diverge',
      label: 'harmonic keeps growing (diverges)',
      value: growth.toFixed(3),
      status: growth > 0.1 ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
