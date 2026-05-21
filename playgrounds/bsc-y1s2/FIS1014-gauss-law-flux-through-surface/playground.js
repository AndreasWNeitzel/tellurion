// Gauss's law 2D playground. Draws the loop, the charge, and a sampling
// of E-field arrows; reports the flux numerically.

import { ellipse, blob, flux, insideEllipse, EPS0 } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutF     = document.getElementById('readout-f');
const readoutR     = document.getElementById('readout-r');

const selectShape = document.getElementById('select-shape');
const sliderA     = document.getElementById('slider-a');
const sliderB     = document.getElementById('slider-b');
const sliderCx    = document.getElementById('slider-cx');
const valueShape  = document.getElementById('value-shape');
const valueA      = document.getElementById('value-a');
const valueB      = document.getElementById('value-b');
const valueCx     = document.getElementById('value-cx');

let shape = selectShape.value;
let a = parseFloat(sliderA.value);
let b = parseFloat(sliderB.value);
let cx = parseFloat(sliderCx.value);
const cy = 0;
const Q = 1e-9;

selectShape.addEventListener('change', () => { shape = selectShape.value; valueShape.textContent = shape; });
sliderA.addEventListener('input', () => { a = parseFloat(sliderA.value); valueA.textContent = a.toFixed(2); });
sliderB.addEventListener('input', () => { b = parseFloat(sliderB.value); valueB.textContent = b.toFixed(2); });
sliderCx.addEventListener('input', () => { cx = parseFloat(sliderCx.value); valueCx.textContent = cx.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function arrow(c, x0, y0, x1, y1) {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = 4;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(a - 0.32), y1 - head * Math.sin(a - 0.32));
  ctx.lineTo(x1 - head * Math.cos(a + 0.32), y1 - head * Math.sin(a + 0.32));
  ctx.closePath();
  ctx.fill();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cxPx = canvas.width / 2;
  const cyPx = canvas.height / 2;
  const scale = 90;

  // Axes.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cyPx); ctx.lineTo(canvas.width, cyPx); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cxPx, 0); ctx.lineTo(cxPx, canvas.height); ctx.stroke();

  // E-field arrows.
  for (let ix = -3; ix <= 3; ix += 0.5) {
    for (let iy = -2; iy <= 2; iy += 0.5) {
      const x = ix, y = iy;
      const dx = x - cx, dy = y - cy;
      const r2 = dx * dx + dy * dy;
      if (r2 < 0.04) continue;
      const r = Math.sqrt(r2);
      const len = Math.min(0.4, 0.3 / r);
      const ex = (dx / r) * len;
      const ey = (dy / r) * len;
      const px = cxPx + scale * x;
      const py = cyPx - scale * y;
      const px2 = cxPx + scale * (x + ex);
      const py2 = cyPx - scale * (y + ey);
      arrow(c.muted, px, py, px2, py2);
    }
  }

  // Loop, coloured by the local flux density E . n_hat (the Gauss
  // integrand): outward flux warm/red, inward cool/blue, tangential
  // grey. Net = sum of these = q/eps0 (inside) or 0 (outside, equal
  // red and blue cancelling) -- the integral made visible.
  const curve = shape === 'blob' ? blob(0, 0, a, b, 0.3, 3) : ellipse(0, 0, a, b);
  const inside = (shape === 'blob') ? insideEllipse(cx, cy, 0, 0, a - 0.3, b - 0.3) : insideEllipse(cx, cy, 0, 0, a, b);
  const N = 220;
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const t = 2 * Math.PI * i / N;
    pts.push([curve.x(t), curve.y(t)]);
  }
  const fluxColor = (v) => {
    const m = Math.max(-1, Math.min(1, v));
    if (m >= 0) return `rgb(${(120 + 135 * m) | 0},${(70 - 30 * m) | 0},${(80 - 40 * m) | 0})`;
    return `rgb(${(70 + 20 * m) | 0},${(150 + 60 * -m) | 0},${(200 + 55 * -m) | 0})`;
  };
  ctx.lineWidth = 4;
  for (let i = 0; i < N; i += 1) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    let tx = x2 - x1, ty = y2 - y1;
    let nx = ty, ny = -tx;                                  // perp
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }      // outward
    const dx = mx - cx, dy = my - cy, r = Math.hypot(dx, dy) || 1e-6;
    const eDotN = (dx / r) * nx + (dy / r) * ny;            // sign of E.n
    ctx.strokeStyle = fluxColor(eDotN);
    ctx.beginPath();
    ctx.moveTo(cxPx + scale * x1, cyPx - scale * y1);
    ctx.lineTo(cxPx + scale * x2, cyPx - scale * y2);
    ctx.stroke();
    if (i % 14 === 0) {
      const E = Math.min(0.5, 0.35 / (r * r));
      const px = cxPx + scale * mx, py = cyPx - scale * my;
      ctx.strokeStyle = fluxColor(eDotN); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(px, py);
      ctx.lineTo(px + nx * scale * (0.12 + E) * Math.sign(eDotN || 1) * Math.abs(eDotN),
                 py - ny * scale * (0.12 + E) * Math.sign(eDotN || 1) * Math.abs(eDotN));
      ctx.stroke();
      ctx.lineWidth = 4;
    }
  }

  // Charge.
  ctx.fillStyle = c.red;
  ctx.beginPath(); ctx.arc(cxPx + scale * cx, cyPx - scale * cy, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`charge at (${cx.toFixed(2)}, 0)`, 12, 20);
  ctx.fillStyle = inside ? c.accent : c.muted;
  ctx.fillText(inside ? 'inside: flux = q / eps_0' : 'outside: flux = 0', 12, 38);
}

function updateReadout() {
  const curve = shape === 'blob' ? blob(0, 0, a, b, 0.3, 3) : ellipse(0, 0, a, b);
  const f = flux(curve, cx, cy, Q);
  readoutF.textContent = f.toExponential(3);
  readoutR.textContent = (f / (Q / EPS0)).toFixed(4);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep charge from inside (0) to outside (2) over capture.
    cx = -1 + frac * 3;
    sliderCx.value = String(cx);
    valueCx.textContent = cx.toFixed(2);
  }
  valueShape.textContent = shape;
  valueA.textContent = a.toFixed(2);
  valueB.textContent = b.toFixed(2);
  valueCx.textContent = cx.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, shape, a, b, cx };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
