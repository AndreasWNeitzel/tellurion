import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Cauchy criterion. Top region: the sequence on a
// log index axis with a sliding tail window from N0 and its width (the
// largest gap between any two terms past N0) against the epsilon tolerance.
// Bottom region: that tail width versus N0, falling to zero for a Cauchy
// sequence and flattening for the harmonic.
//
// Reference: Abbott, Understanding Analysis, Ch. 2; Rudin, Principles of
// Mathematical Analysis, Ch. 3.

import { SEQUENCES } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selSeq = document.getElementById('select-seq');
const sliderN = document.getElementById('slider-n');
const sliderEps = document.getElementById('slider-eps');
const valueN = document.getElementById('value-n');
const valueEps = document.getElementById('value-eps');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const NMAX = 2000;
const TAILK = 10;            // tail window [N0, 10 N0]: "the next decade"
const N0_MAX = 200;
let running = !DETERMINISTIC;
let seq = null;
let yLo = 0, yHi = 1;
let n0Log = Math.log10(10);  // current N0 (log)
let dir = 1;

function name() { return selSeq.value; }
function eps() { return Math.pow(10, parseFloat(sliderEps.value)); }
function N0() { return Math.max(1, Math.min(N0_MAX, Math.round(Math.pow(10, n0Log)))); }

function buildSeq() {
  seq = new Float64Array(NMAX + 1);
  const nm = name();
  if (nm === 'geom') {
    for (let n = 1; n <= NMAX; n++) seq[n] = Math.pow(2, -n);
  } else if (nm === 'harm') {
    let s = 0; for (let n = 1; n <= NMAX; n++) { s += 1 / n; seq[n] = s; }
  } else if (nm === 'arctan') {
    let s = 1; for (let n = 1; n <= NMAX; n++) { s += (n % 2 === 0 ? 1 : -1) / (2 * n + 1); seq[n] = s; }
  } else { // zeta2
    let s = 0; for (let n = 1; n <= NMAX; n++) { s += 1 / (n * n); seq[n] = s; }
  }
  yLo = Infinity; yHi = -Infinity;
  for (let n = 1; n <= NMAX; n++) { if (seq[n] < yLo) yLo = seq[n]; if (seq[n] > yHi) yHi = seq[n]; }
  const pad = (yHi - yLo) * 0.08 || 0.1;
  yLo -= pad; yHi += pad;
}

function tailWidth(n0) {
  const hi = Math.min(NMAX, TAILK * n0);
  let mn = Infinity, mx = -Infinity;
  for (let n = n0; n <= hi; n++) { const v = seq[n]; if (v < mn) mn = v; if (v > mx) mx = v; }
  return { mn, mx, w: mx - mn };
}

function syncVals() {
  valueN.textContent = String(N0());
  valueEps.textContent = eps().toExponential(1);
}
selSeq.addEventListener('change', () => { buildSeq(); render(); });
sliderN.addEventListener('input', () => { n0Log = Math.log10(Math.max(1, parseFloat(sliderN.value))); syncVals(); render(); });
sliderEps.addEventListener('input', () => { syncVals(); render(); });
btnReset.addEventListener('click', () => {
  selSeq.value = 'arctan'; sliderEps.value = '-1.5'; n0Log = Math.log10(10); sliderN.value = '10';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  buildSeq(); syncVals(); render();
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
    seq: '#7cc6ff',
    width: '#67d98c',
    bad: '#ef476f',
    eps: '#b58cff',
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
  panel(col, r, 'Do the terms past N₀ bunch within ε?');

  const titleH = 22, stripH = 28;
  const inner = { x: r.x + 46, y: r.y + titleH + 8, w: r.w - 46 - 14, h: r.h - titleH - 8 - stripH - 22 };
  const n0 = N0();
  const hi = Math.min(NMAX, TAILK * n0);
  const tw = tailWidth(n0);
  const e = eps();
  const within = tw.w < e;

  const lnMax = Math.log(NMAX);
  const xOf = (n) => inner.x + (Math.log(Math.max(1, n)) / lnMax) * inner.w;
  const yOf = (v) => inner.y + inner.h - (v - yLo) / (yHi - yLo) * inner.h;

  // y grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of [0, 0.5, 1]) { const v = yLo + t * (yHi - yLo); const y = yOf(v); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(v.toFixed(2), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const n of [1, 10, 100, 1000]) ctx.fillText(String(n), xOf(n), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  ctx.save();
  clipTo(ctx, inner);

  // Tail window shading [N0, 10 N0].
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(xOf(n0), inner.y, xOf(hi) - xOf(n0), inner.h);

  // Cauchy-width strip over the tail (height = tail width).
  const wcol = within ? col.width : col.bad;
  ctx.fillStyle = within ? 'rgba(103,217,140,0.18)' : 'rgba(239,71,111,0.16)';
  ctx.fillRect(xOf(n0), yOf(tw.mx), xOf(hi) - xOf(n0), yOf(tw.mn) - yOf(tw.mx));
  ctx.strokeStyle = wcol; ctx.lineWidth = 1.4;
  ctx.strokeRect(xOf(n0), yOf(tw.mx), xOf(hi) - xOf(n0), yOf(tw.mn) - yOf(tw.mx));

  // The sequence.
  ctx.strokeStyle = col.seq; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let n = 1; n <= NMAX; n++) { const X = xOf(n), Y = yOf(seq[n]); if (n === 1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();

  ctx.restore();

  // width / epsilon labels.
  ctx.fillStyle = wcol; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`width ${tw.w.toExponential(1)}`, xOf(n0) + 3, yOf(tw.mx) - 3);
  // N0 marker label.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('N₀', xOf(n0), inner.y + 2);

  // Readout strip.
  const ry = r.y + r.h - stripH / 2 + 1;
  const shortName = { geom: '1/2ⁿ', harm: 'harmonic', arctan: 'Leibniz', zeta2: 'Σ1/k²' }[name()];
  const items = [
    [shortName, col.seq],
    [`N₀ = ${n0}`, col.fg],
    [`width ${tw.w.toExponential(1)}`, wcol],
    [within ? 'within ε' : 'wider than ε', within ? col.width : col.bad],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Tail width vs N₀: collapses (Cauchy) or floors (not)');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 14, h: r.h - 28 - 40 };
  const e = eps();
  // log-log: N0 in [1, N0_MAX], width in [~1e-6, ~10].
  const xLo = 0, xHi = Math.log10(N0_MAX);
  const yLoD = -6, yHiD = Math.log10(10);
  const xOf = (n0) => inner.x + (Math.log10(n0) - xLo) / (xHi - xLo) * inner.w;
  const yOf = (w) => inner.y + inner.h - (Math.log10(Math.max(1e-7, w)) - yLoD) / (yHiD - yLoD) * inner.h;

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let ex = 0; ex >= yLoD; ex -= 2) { const y = yOf(Math.pow(10, ex)); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(`1e${ex}`, inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const n0 of [1, 10, 100, 200]) ctx.fillText(String(n0), xOf(n0), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // epsilon line.
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = col.eps; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(e)); ctx.lineTo(inner.x + inner.w, yOf(e)); ctx.stroke(); ctx.restore();
  ctx.fillStyle = col.eps; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('ε', inner.x + inner.w - 4, yOf(e) - 2);

  // tail-width curve.
  ctx.strokeStyle = col.width; ctx.lineWidth = 2.6;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 80; i++) {
    const n0 = Math.round(Math.pow(10, (i / 80) * xHi));
    const w = tailWidth(n0).w;
    const X = xOf(Math.max(1, n0)), Y = yOf(w);
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // current N0 cursor.
  const n0 = N0();
  const cxN = xOf(n0);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cxN, inner.y); ctx.lineTo(cxN, inner.y + inner.h); ctx.stroke(); ctx.restore();
  const w0 = tailWidth(n0).w;
  ctx.fillStyle = w0 < e ? col.width : col.bad;
  ctx.beginPath(); ctx.arc(cxN, yOf(w0), 4, 0, 2 * Math.PI); ctx.fill();

  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('tail start N₀', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('tail width', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!seq) buildSeq();
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
    n0Log += dir * dt * (Math.log10(N0_MAX) / 7);   // ~7 s to sweep the range
    if (n0Log >= Math.log10(N0_MAX)) { n0Log = Math.log10(N0_MAX); dir = -1; }
    if (n0Log <= 0) { n0Log = 0; dir = 1; }
    sliderN.value = String(N0());
    valueN.textContent = String(N0());
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  buildSeq(); syncVals();
  if (CAPTURE_NAME) n0Log = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * Math.log10(N0_MAX);
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
  if (!seq) buildSeq();
  const tw = tailWidth(N0());
  return {
    fields: [
      { key: 'seq', label: 'sequence', value: SEQUENCES[name()].label, format: 'text' },
      { key: 'N0', label: 'tail start $N_0$', value: N0(), format: 'int' },
      { key: 'width', label: 'tail width', value: tw.w, format: 'float' },
      { key: 'eps', label: 'tolerance $\\varepsilon$', value: eps(), format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    if (!seq) buildSeq();
    // Cauchy iff the far-tail width vanishes: convergent sequences pass,
    // the harmonic floors near ln(10) and fails.
    const wFar = tailWidth(N0_MAX).w;
    return [{
      key: 'cauchy',
      label: 'far-tail width vanishes (Cauchy)',
      value: wFar.toExponential(2),
      status: wFar < 0.1 ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
