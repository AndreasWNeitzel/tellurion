// Gauss's law 2D playground. Draws the loop, the charge, and a sampling
// of E-field arrows; reports the flux numerically.

import { ellipse, blob, flux, insideEllipse, EPS0 } from './sim.js';

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

  // Loop.
  const curve = shape === 'blob' ? blob(0, 0, a, b, 0.3, 3) : ellipse(0, 0, a, b);
  const inside = (shape === 'blob') ? insideEllipse(cx, cy, 0, 0, a - 0.3, b - 0.3) : insideEllipse(cx, cy, 0, 0, a, b);
  ctx.strokeStyle = inside ? c.accent : c.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const t = 2 * Math.PI * i / 200;
    const px = cxPx + scale * curve.x(t);
    const py = cyPx - scale * curve.y(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Charge.
  ctx.fillStyle = c.red;
  ctx.beginPath(); ctx.arc(cxPx + scale * cx, cyPx - scale * cy, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
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
