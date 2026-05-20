// Gram-Schmidt 2D playground.
// Draws v1, v2, the projection of v2 onto u1, the residual, and the
// orthonormal pair u1, u2.

import { gramSchmidt, dot, norm, project, residual } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutOrth = document.getElementById('readout-orth');
const readoutRes  = document.getElementById('readout-res');

const sliderA1 = document.getElementById('slider-a1');
const sliderL1 = document.getElementById('slider-l1');
const sliderA2 = document.getElementById('slider-a2');
const sliderL2 = document.getElementById('slider-l2');
const valueA1 = document.getElementById('value-a1');
const valueL1 = document.getElementById('value-l1');
const valueA2 = document.getElementById('value-a2');
const valueL2 = document.getElementById('value-l2');

let a1 = parseFloat(sliderA1.value);
let l1 = parseFloat(sliderL1.value);
let a2 = parseFloat(sliderA2.value);
let l2 = parseFloat(sliderL2.value);

sliderA1.addEventListener('input', () => { a1 = parseFloat(sliderA1.value); valueA1.textContent = String(a1); });
sliderL1.addEventListener('input', () => { l1 = parseFloat(sliderL1.value); valueL1.textContent = l1.toFixed(2); });
sliderA2.addEventListener('input', () => { a2 = parseFloat(sliderA2.value); valueA2.textContent = String(a2); });
sliderL2.addEventListener('input', () => { l2 = parseFloat(sliderL2.value); valueL2.textContent = l2.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function drawArrow(color, x0, y0, x1, y1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = 9;
  ctx.fillStyle = color;
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

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 80;

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i += 1) {
    if (i === 0) continue;
    ctx.beginPath(); ctx.moveTo(cx + i * scale, cy - 3 * scale); ctx.lineTo(cx + i * scale, cy + 3 * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 3 * scale, cy + i * scale); ctx.lineTo(cx + 3 * scale, cy + i * scale); ctx.stroke();
  }
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();

  // Compute vectors.
  const v1 = [l1 * Math.cos(a1 * Math.PI / 180), l1 * Math.sin(a1 * Math.PI / 180)];
  const v2 = [l2 * Math.cos(a2 * Math.PI / 180), l2 * Math.sin(a2 * Math.PI / 180)];
  const u = gramSchmidt([v1, v2]);
  const u1 = u[0];
  const u2 = u[1];

  // Projection of v2 onto u1.
  const proj = project(v2, u1);
  const res = residual(v2, u1);

  function toPx(v) { return [cx + v[0] * scale, cy - v[1] * scale]; }

  // Draw v1 (faded blue), v2 (faded orange).
  let p = toPx(v1);
  drawArrow(c.blue, cx, cy, p[0], p[1]);
  p = toPx(v2);
  drawArrow(c.orange, cx, cy, p[0], p[1]);

  // Draw projection vector (dashed cyan).
  const projPx = toPx(proj);
  ctx.strokeStyle = c.blue;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(projPx[0], projPx[1]); ctx.stroke();
  ctx.setLineDash([]);

  // Draw residual vector from tip of projection to tip of v2 (orange dashed).
  const v2Px = toPx(v2);
  ctx.strokeStyle = c.orange;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(projPx[0], projPx[1]); ctx.lineTo(v2Px[0], v2Px[1]); ctx.stroke();
  ctx.setLineDash([]);

  // Draw orthonormal u1, u2 (bold accent and red).
  const u1Px = toPx(u1);
  const u2Px = toPx(u2);
  if (norm(u1) > 1e-12) drawArrow(c.accent, cx, cy, u1Px[0], u1Px[1]);
  if (norm(u2) > 1e-12) drawArrow(c.red, cx, cy, u2Px[0], u2Px[1]);

  // Legend.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('Inputs (faded) and orthonormal output (bold)', 12, 20);
  ctx.fillStyle = c.blue;
  ctx.fillText('v_1 (input)', 12, 38);
  ctx.fillStyle = c.orange;
  ctx.fillText('v_2 (input)', 12, 54);
  ctx.fillStyle = c.accent;
  ctx.fillText('u_1 (unit)', 12, 70);
  ctx.fillStyle = c.red;
  ctx.fillText('u_2 (unit, orthogonal to u_1)', 12, 86);
}

function updateReadout() {
  const v1 = [l1 * Math.cos(a1 * Math.PI / 180), l1 * Math.sin(a1 * Math.PI / 180)];
  const v2 = [l2 * Math.cos(a2 * Math.PI / 180), l2 * Math.sin(a2 * Math.PI / 180)];
  const u = gramSchmidt([v1, v2]);
  const d = dot(u[0], u[1]);
  readoutOrth.textContent = Math.abs(d).toExponential(2);
  const res = residual(v2, u[0]);
  readoutRes.textContent = norm(res).toFixed(4);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep v2 angle from 90 to 10 (collapsing onto v1).
    a2 = 90 - frac * 70;
    sliderA2.value = String(Math.round(a2));
    valueA2.textContent = String(Math.round(a2));
  }
  valueA1.textContent = String(a1);
  valueL1.textContent = l1.toFixed(2);
  valueA2.textContent = String(a2);
  valueL2.textContent = l2.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, a1, l1, a2, l2 };
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
