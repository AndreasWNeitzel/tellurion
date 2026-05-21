// playground.js
// Fubini made legible: the same double integral done both ways. Left,
// the inner integral is over x (a horizontal slab sweeps up in y) and
// the profile g(y) = int_0^A f dx builds; right, the inner integral is
// over y (a vertical slab sweeps in x) and h(x) = int_0^B f dy builds.
// Both accumulated volumes converge to the same number. sim.js core is
// unchanged.

import { dxDy, dyDx, innerX, innerY, fAt } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutX = document.getElementById('readout-x');
const readoutY = document.getElementById('readout-y');
const sliderA = document.getElementById('slider-A');
const sliderB = document.getElementById('slider-B');
const valueA = document.getElementById('value-A');
const valueB = document.getElementById('value-B');

const W = canvas.width, H = canvas.height;
const st = { A: parseFloat(sliderA.value), B: parseFloat(sliderB.value), s: 0, playing: !(DETERMINISTIC || prefersReducedMotion()) };

function diverge(v) {
  const t = Math.max(-1, Math.min(1, v));
  if (t >= 0) return `rgb(${(30 + 225 * t) | 0},${(40 + 120 * t) | 0},${(60 - 30 * t) | 0})`;
  return `rgb(${(30 + 20 * t) | 0},${(40 - 60 * t) | 0},${(60 - 180 * t) | 0})`;
}

function panel(px, py, pw, ph, orient) {
  const A = st.A, B = st.B, DOM = 6;
  const xOf = (x) => px + pw * x / DOM;
  const yOf = (y) => py + ph * (1 - y / DOM);
  const NX = 64, NY = 64;
  for (let i = 0; i < NX; i += 1) {
    for (let j = 0; j < NY; j += 1) {
      const x = DOM * (i + 0.5) / NX, y = DOM * (j + 0.5) / NY;
      ctx.fillStyle = diverge(fAt(x, y));
      ctx.fillRect(xOf(x) - pw / NX / 2 - 0.5, yOf(y) - ph / NY / 2 - 0.5, pw / NX + 1, ph / NY + 1);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(xOf(0), yOf(B), xOf(A) - xOf(0), yOf(0) - yOf(B));

  let partial = 0;
  if (orient === 'x') {
    const ys = B * st.s;
    ctx.fillStyle = 'rgba(6,214,160,0.14)';
    ctx.fillRect(xOf(0), yOf(ys), xOf(A) - xOf(0), yOf(0) - yOf(ys));
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(xOf(0), yOf(ys) - 1, xOf(A) - xOf(0), 2);
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
    const gMax = Math.max(0.6, A);
    for (let k = 0; k <= 80; k += 1) {
      const y = B * k / 80;
      const gx = px + pw + 10 + (innerX(y, A, 60) / gMax) * 44;
      const gy = yOf(y);
      if (k === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
    }
    ctx.stroke();
    let acc = 0; const M = 64;
    for (let k = 1; k <= M; k += 1) {
      const y0 = B * (k - 1) / M, y1 = B * k / M;
      if (y1 > ys) break;
      acc += 0.5 * (innerX(y0, A, 50) + innerX(y1, A, 50)) * (y1 - y0);
    }
    partial = acc;
  } else {
    const xs = A * st.s;
    ctx.fillStyle = 'rgba(244,162,97,0.14)';
    ctx.fillRect(xOf(0), yOf(B), xOf(xs) - xOf(0), yOf(0) - yOf(B));
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(xOf(xs) - 1, yOf(B), 2, yOf(0) - yOf(B));
    ctx.strokeStyle = '#f4a261'; ctx.lineWidth = 2; ctx.beginPath();
    const hMax = Math.max(0.6, B);
    for (let k = 0; k <= 80; k += 1) {
      const x = A * k / 80;
      const hx = xOf(x);
      const hy = py + ph + 10 + (Math.abs(innerY(x, B, 60)) / hMax) * 38;
      if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.stroke();
    let acc = 0; const M = 64;
    for (let k = 1; k <= M; k += 1) {
      const x0 = A * (k - 1) / M, x1 = A * k / M;
      if (x1 > xs) break;
      acc += 0.5 * (innerY(x0, B, 50) + innerY(x1, B, 50)) * (x1 - x0);
    }
    partial = acc;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('0', xOf(0) - 9, yOf(0) + 12);
  ctx.fillText('x', xOf(DOM) - 6, yOf(0) + 12);
  ctx.fillText('y', xOf(0) - 16, yOf(DOM) + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(orient === 'x' ? 'order 1: inner over x, then y' : 'order 2: inner over y, then x', px, py - 20);
  ctx.fillStyle = orient === 'x' ? '#06d6a0' : '#f4a261';
  ctx.fillText(`accumulated volume = ${partial.toFixed(4)}`, px, py - 5);
  return partial;
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const pad = 56, pw = (W - 3 * pad - 50) / 2, ph = H - 150;
  panel(pad, 60, pw, ph, 'x');
  panel(pad * 2 + pw + 50, 60, pw, ph, 'y');

  const I1 = dxDy(80, 0, st.A, 0, st.B);
  const I2 = dyDx(80, 0, st.A, 0, st.B);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'body', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`f(x,y) = sin x cos y   region [0, ${st.A.toFixed(2)}] x [0, ${st.B.toFixed(2)}]`, pad, 26);
  ctx.fillStyle = '#06d6a0'; ctx.fillText(`integral dx dy = ${I1.toFixed(6)}`, pad, H - 44);
  ctx.fillStyle = '#f4a261'; ctx.fillText(`integral dy dx = ${I2.toFixed(6)}`, pad, H - 26);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`Fubini: same volume both ways (diff ${Math.abs(I1 - I2).toExponential(1)})`, pad + 320, H - 35);

  readoutX.textContent = I1.toFixed(6);
  readoutY.textContent = I2.toFixed(6);
}

sliderA.addEventListener('input', () => { st.A = parseFloat(sliderA.value); valueA.textContent = st.A.toFixed(2); if (!st.playing) render(); });
sliderB.addEventListener('input', () => { st.B = parseFloat(sliderB.value); valueB.textContent = st.B.toFixed(2); if (!st.playing) render(); });

function tick() {
  if (st.playing) { st.s += 0.006; if (st.s > 1) st.s = 0; render(); }
  requestAnimationFrame(tick);
}

function bootSync() {
  valueA.textContent = st.A.toFixed(2);
  valueB.textContent = st.B.toFixed(2);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.s = f;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
