// Relativistic Doppler playground. Two panels: f(theta) curve on
// linear axes (left) and polar plot (right). Marker at current theta.

import { gamma, dopplerFactor } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutG     = document.getElementById('readout-g');
const readoutF     = document.getElementById('readout-f');

const sliderBeta  = document.getElementById('slider-beta');
const sliderTheta = document.getElementById('slider-theta');
const valueBeta   = document.getElementById('value-beta');
const valueTheta  = document.getElementById('value-theta');

let beta = parseFloat(sliderBeta.value);
let thetaDeg = parseFloat(sliderTheta.value);

sliderBeta.addEventListener('input', () => { beta = parseFloat(sliderBeta.value); valueBeta.textContent = beta.toFixed(3); });
sliderTheta.addEventListener('input', () => { thetaDeg = parseFloat(sliderTheta.value); valueTheta.textContent = String(thetaDeg); });

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

function drawCartesian(c, x0, y0, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);
  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Find max for vertical scaling.
  let yMax = 0, yMin = Infinity;
  for (let i = 0; i <= 200; i += 1) {
    const t = Math.PI * i / 200;
    const f = dopplerFactor(beta, t);
    if (f > yMax) yMax = f;
    if (f < yMin) yMin = f;
  }
  yMax = Math.max(yMax, 1.1);
  yMin = Math.min(yMin, 0.5);

  function xFor(t) { return x0 + padL + plotW * (t / Math.PI); }
  function yFor(v) { return y0 + padT + plotH * (1 - (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = x0 + padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
  }

  // Line at f = 1 (no shift).
  ctx.strokeStyle = c.red;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0 + padL, yFor(1)); ctx.lineTo(x0 + padL + plotW, yFor(1)); ctx.stroke();
  ctx.setLineDash([]);

  // Doppler curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const t = Math.PI * i / 200;
    const f = dopplerFactor(beta, t);
    const xx = xFor(t);
    const yy = yFor(f);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Marker at current theta.
  const thr = thetaDeg * Math.PI / 180;
  const fNow = dopplerFactor(beta, thr);
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(xFor(thr), yFor(fNow), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', x0 + padL - 6, y0 + padT + plotH + 14);
  ctx.fillText('pi/2', x0 + padL + plotW / 2 - 12, y0 + padT + plotH + 14);
  ctx.fillText('pi', x0 + padL + plotW - 8, y0 + padT + plotH + 14);
  ctx.fillText(yMax.toFixed(2), x0 + padL - 32, y0 + padT + 6);
  ctx.fillText('1.00', x0 + padL - 28, yFor(1) + 3);
  ctx.fillText(yMin.toFixed(2), x0 + padL - 32, y0 + padT + plotH);
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('theta (rad)', x0 + padL + plotW - 60, y0 + padT + plotH + 26);
  ctx.save(); ctx.translate(x0 + 12, y0 + padT + plotH / 2 + 30); ctx.rotate(-Math.PI / 2);
  ctx.fillText('f_obs / f_src (log)', 0, 0); ctx.restore();
  ctx.fillStyle = c.accent;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`beta = ${beta.toFixed(3)}, gamma = ${gamma(beta).toFixed(2)}`, x0 + padL + 8, y0 + 14);
}

function drawPolar(c, x0, y0, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  const cxPx = x0 + w / 2;
  const cyPx = y0 + h / 2;
  const Rmax = Math.min(w, h) * 0.36;

  // Concentric circles.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (const r of [0.25, 0.5, 0.75, 1.0]) {
    ctx.beginPath(); ctx.arc(cxPx, cyPx, Rmax * r, 0, 2 * Math.PI); ctx.stroke();
  }
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (const r of [0.25, 0.5, 0.75]) {
    ctx.fillText(`r=${r.toFixed(2)}`, cxPx + Rmax * r + 4, cyPx + 4);
  }

  // Determine scale.
  let scale = 1;
  for (let i = 0; i <= 200; i += 1) {
    const t = 2 * Math.PI * i / 200;
    const f = dopplerFactor(beta, t);
    if (f > scale) scale = f;
  }

  // Polar Doppler curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const t = 2 * Math.PI * i / 400;
    const f = dopplerFactor(beta, t);
    const r = (f / scale) * Rmax;
    const px = cxPx + r * Math.cos(t);
    const py = cyPx - r * Math.sin(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Motion direction arrow.
  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cxPx, cyPx); ctx.lineTo(cxPx + Rmax * 0.9, cyPx);
  ctx.stroke();
  ctx.fillStyle = c.blue;
  ctx.beginPath();
  ctx.moveTo(cxPx + Rmax * 0.9, cyPx);
  ctx.lineTo(cxPx + Rmax * 0.9 - 8, cyPx - 4);
  ctx.lineTo(cxPx + Rmax * 0.9 - 8, cyPx + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('v', cxPx + Rmax * 0.9 + 6, cyPx + 4);

  // Marker at current theta.
  const thr = thetaDeg * Math.PI / 180;
  const f = dopplerFactor(beta, thr);
  const r = (f / scale) * Rmax;
  const px = cxPx + r * Math.cos(thr);
  const py = cyPx - r * Math.sin(thr);
  ctx.fillStyle = c.red;
  ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawCartesian(c, 0, 0, W * 0.5, H);
  drawPolar(c, W * 0.5, 0, W * 0.5, H);
}

function updateReadout() {
  readoutG.textContent = gamma(beta).toFixed(3);
  readoutF.textContent = dopplerFactor(beta, thetaDeg * Math.PI / 180).toFixed(4);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    beta = frac * 0.95;
    sliderBeta.value = String(beta);
    valueBeta.textContent = beta.toFixed(3);
  }
  valueBeta.textContent = beta.toFixed(3);
  valueTheta.textContent = String(thetaDeg);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, beta, thetaDeg };
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
