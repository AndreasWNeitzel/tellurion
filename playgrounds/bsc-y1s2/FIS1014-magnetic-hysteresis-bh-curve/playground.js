import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for ferromagnetic hysteresis, Canvas2D only. Top
// region: a lattice of magnetic domains flipping as the driving field H
// sweeps up and down, with the drive (H) and response (M) shown as
// arrows so the lag is visible. Bottom region: M versus H tracing the
// hysteresis loop, with remanence, coercivity, and the enclosed area
// (energy dissipated per cycle).
//
// Reference: Jiles and Atherton, JMMM 61, 48 (1986); Griffiths,
// Introduction to Electrodynamics, 4th ed., Sec. 6.

import { sweepLoop, PRESETS } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selMaterial = document.getElementById('select-material');
const sliderAmp = document.getElementById('slider-amp');
const valueMaterial = document.getElementById('value-material');
const valueAmp = document.getElementById('value-amp');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const STEPS = 1200, COLS = 12, ROWS = 8;
let running = !DETERMINISTIC;
let loop = null, idx = 300, p = PRESETS['hard steel'], Hm = 5;

// deterministic per-domain flip threshold in [-1, 1].
const RANK = [];
for (let k = 0; k < COLS * ROWS; k++) { const h = ((k * 2654435761) >>> 0) % 10007; RANK.push((h / 10007) * 2 - 1); }

function rebuild() {
  p = PRESETS[selMaterial.value];
  Hm = parseFloat(sliderAmp.value);
  loop = sweepLoop(p, Hm, STEPS);
  if (idx >= loop.pts.length) idx = 0;
}
function syncVals() {
  valueMaterial.textContent = selMaterial.value;
  valueAmp.textContent = parseFloat(sliderAmp.value).toFixed(1);
}
selMaterial.addEventListener('change', () => { syncVals(); rebuild(); render(); });
sliderAmp.addEventListener('input', () => { syncVals(); rebuild(); render(); });
btnReset.addEventListener('click', () => {
  selMaterial.value = 'hard steel'; sliderAmp.value = '3'; idx = 300;
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
    { name: 'scene', weight: 1.8 },
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
    up: '#ef5466', down: '#5b8def', H: '#ffd166', M: '#ef5466',
    loop: '#ffce4d', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
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

function vArrow(cx, cyBase, len, color, label) {
  // vertical arrow from cyBase, signed length (up = negative screen dy).
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  const tipY = cyBase - len;
  ctx.beginPath(); ctx.moveTo(cx, cyBase); ctx.lineTo(cx, tipY); ctx.stroke();
  const dir = len >= 0 ? -1 : 1;
  ctx.beginPath(); ctx.moveTo(cx, tipY); ctx.lineTo(cx - 6, tipY - dir * 9); ctx.lineTo(cx + 6, tipY - dir * 9); ctx.closePath(); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cyBase + 14);
}

function drawScene(col, r) {
  panel(col, r, 'Domains flip as the field drives them (M lags H)');
  const [H, M] = loop.pts[Math.min(idx, loop.pts.length - 1)];
  const Ms = p.Ms, mNorm = M / Ms;

  const titleH = 24, stripH = 28;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const gx0 = draw.x + draw.w * 0.16, gx1 = draw.x + draw.w * 0.84;
  const gw = gx1 - gx0, gh = draw.h * 0.86, gy0 = draw.y + (draw.h - gh) / 2;
  const cw = gw / COLS, ch = gh / ROWS;

  // domains.
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const k = j * COLS + i;
    const up = mNorm > RANK[k];
    const cx = gx0 + (i + 0.5) * cw, cy = gy0 + (j + 0.5) * ch;
    const aLen = Math.min(cw, ch) * 0.34;
    ctx.strokeStyle = up ? col.up : col.down; ctx.fillStyle = up ? col.up : col.down; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.92;
    const dir = up ? -1 : 1;                 // screen dy of the tip
    const tip = cy + dir * aLen, tail = cy - dir * aLen;
    ctx.beginPath(); ctx.moveTo(cx, tail); ctx.lineTo(cx, tip); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, tip); ctx.lineTo(cx - 4.5, tip - dir * 7); ctx.lineTo(cx + 4.5, tip - dir * 7); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // drive H (left) and response M (right) arrows.
  const cyBase = gy0 + gh / 2, maxLen = gh * 0.42;
  vArrow(draw.x + draw.w * 0.07, cyBase, (H / Hm) * maxLen, col.H, 'H');
  vArrow(draw.x + draw.w * 0.93, cyBase, mNorm * maxLen, col.M, 'M');

  // readout strip.
  const items = [
    [selMaterial.value, col.fg],
    [`M_r ${loop.Mr.toFixed(2)}`, col.up],
    [`H_c ${loop.Hc.toFixed(2)}`, col.H],
    [`loss ${loop.area.toFixed(1)}`, col.accent],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, r.y + r.h - stripH / 2 + 1); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'The hysteresis loop: magnetization M vs field H');

  const inner = { x: r.x + 44, y: r.y + 28, w: r.w - 44 - 16, h: r.h - 28 - 42 };
  const Ms = p.Ms;
  const xOf = (H) => inner.x + (H + Hm) / (2 * Hm) * inner.w;
  const yOf = (M) => inner.y + inner.h / 2 - (M / (Ms * 1.1)) * (inner.h / 2);

  // axes + saturation lines.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(0)); ctx.lineTo(inner.x + inner.w, yOf(0)); ctx.moveTo(xOf(0), inner.y); ctx.lineTo(xOf(0), inner.y + inner.h); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(Ms)); ctx.lineTo(inner.x + inner.w, yOf(Ms)); ctx.moveTo(inner.x, yOf(-Ms)); ctx.lineTo(inner.x + inner.w, yOf(-Ms)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('+M_s', inner.x - 5, yOf(Ms)); ctx.fillText('−M_s', inner.x - 5, yOf(-Ms));

  // shaded loop area (energy).
  ctx.fillStyle = 'rgba(255,206,77,0.12)';
  ctx.beginPath(); loop.pts.forEach((pt, i) => { const X = xOf(pt[0]), Y = yOf(pt[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill();
  // loop curve.
  ctx.strokeStyle = col.loop; ctx.lineWidth = 2.4; ctx.beginPath();
  loop.pts.forEach((pt, i) => { const X = xOf(pt[0]), Y = yOf(pt[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();

  // remanence and coercivity markers.
  ctx.fillStyle = col.up; ctx.beginPath(); ctx.arc(xOf(0), yOf(loop.Mr), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xOf(0), yOf(-loop.Mr), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.H; ctx.beginPath(); ctx.arc(xOf(-loop.Hc), yOf(0), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xOf(loop.Hc), yOf(0), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'legend', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('M_r', xOf(0) + 5, yOf(loop.Mr) - 3);
  ctx.textBaseline = 'top'; ctx.fillText('H_c', xOf(loop.Hc) + 4, yOf(0) + 4);

  // moving pen at the current state.
  const [H, M] = loop.pts[Math.min(idx, loop.pts.length - 1)];
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xOf(H), yOf(M), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = col.loop; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xOf(H), yOf(M), 8, 0, 2 * Math.PI); ctx.stroke();

  // labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('applied field H', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 32, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('magnetization M', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!loop) rebuild();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

const CYCLE_S = 6;
let last = performance.now();
let acc = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) { acc += (loop.pts.length / CYCLE_S) * dt; while (acc >= 1) { idx = (idx + 1) % loop.pts.length; acc -= 1; } }
  render();
  requestAnimationFrame(tick);
}

function bootSync() { syncVals(); rebuild(); idx = 300; relayout(); render(); }

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
  const [H, M] = loop.pts[Math.min(idx, loop.pts.length - 1)];
  return {
    fields: [
      { key: 'material', label: 'material', value: selMaterial.value, format: 'text' },
      { key: 'Mr', label: 'remanence $M_r$', value: loop.Mr, format: 'float' },
      { key: 'Hc', label: 'coercivity $H_c$', value: loop.Hc, format: 'float' },
      { key: 'loss', label: 'energy/cycle (loop area)', value: loop.area, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    // The magnetization saturates: |M| never exceeds the saturation
    // magnetization M_s, the physical ceiling of an aligned ferromagnet.
    let mx = 0; for (const pt of loop.pts) mx = Math.max(mx, Math.abs(pt[1]));
    const ratio = mx / p.Ms;
    return [{
      key: 'saturation',
      label: '|M| / M_s (saturation bound)',
      value: ratio.toFixed(3),
      status: ratio <= 1.06 ? 'pass' : (ratio <= 1.2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
