// Sturm-Liouville playground. Shows the first N eigenfunctions and a
// target function reconstructed by them.

import { eigenfunction, projectCoefficients, reconstruct, L } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutN    = document.getElementById('readout-n');
const readoutErr  = document.getElementById('readout-err');

const sliderN = document.getElementById('slider-N');
const valueN  = document.getElementById('value-N');

let N = parseInt(sliderN.value, 10);
sliderN.addEventListener('input', () => { N = parseInt(sliderN.value, 10); valueN.textContent = String(N); });

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

const target = (x) => x * (L - x);

function drawEigen(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const padL = 50, padR = 12, padT = 22, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  function xFor(x) { return x0 + padL + plotW * x / L; }
  function yFor(v, M = 1.2) { return y_off + padT + plotH * (1 - (v + M) / (2 * M)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const x = x0 + padL + plotW * i / 4;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
  }
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + padL, yFor(0)); ctx.lineTo(x0 + padL + plotW, yFor(0)); ctx.stroke();

  // Draw first min(5, N) eigenfunctions.
  for (let n = 1; n <= Math.min(5, N); n += 1) {
    const t = n / 5;
    const r = 70 + Math.round(180 * t), g = 110 + Math.round(140 * t), b = 235 - Math.round(180 * t);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 300; i += 1) {
      const x = L * i / 300;
      const v = eigenfunction(n, x);
      const xx = xFor(x);
      const yy = yFor(v);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`first ${Math.min(5, N)} eigenfunctions phi_n(x)`, x0 + padL, y_off + 14);
}

function drawReconstruction(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const padL = 50, padR = 12, padT = 22, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const fMax = L * L / 4 * 1.1; // peak of x(L-x) is L^2/4 at x = L/2
  function xFor(x) { return x0 + padL + plotW * x / L; }
  function yFor(v) { return y_off + padT + plotH * (1 - v / fMax); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const x = x0 + padL + plotW * i / 4;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
  }

  // Target.
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const x = L * i / 300;
    if (i === 0) ctx.moveTo(xFor(x), yFor(target(x))); else ctx.lineTo(xFor(x), yFor(target(x)));
  }
  ctx.stroke();

  // Reconstruction.
  const c_coeff = projectCoefficients(target, N);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const x = L * i / 300;
    const v = reconstruct(c_coeff, x, N);
    if (i === 0) ctx.moveTo(xFor(x), yFor(v)); else ctx.lineTo(xFor(x), yFor(v));
  }
  ctx.stroke();

  ctx.fillStyle = c.fg;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`f(x) = x (pi - x)`, x0 + padL, y_off + 14);
  ctx.fillStyle = c.accent;
  ctx.fillText(`reconstruction with N = ${N}`, x0 + padL + 180, y_off + 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawEigen(c, 0, 0, W, H / 2);
  drawReconstruction(c, 0, H / 2, W, H / 2);
}

function updateReadout() {
  const c_coeff = projectCoefficients(target, N);
  let maxErr = 0;
  for (let i = 0; i < 100; i += 1) {
    const x = L * i / 99;
    const err = Math.abs(target(x) - reconstruct(c_coeff, x, N));
    if (err > maxErr) maxErr = err;
  }
  readoutN.textContent = String(N);
  readoutErr.textContent = maxErr.toExponential(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    N = Math.max(1, Math.round(1 + frac * 19));
    sliderN.value = String(N);
    valueN.textContent = String(N);
  }
  valueN.textContent = String(N);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, N };
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
