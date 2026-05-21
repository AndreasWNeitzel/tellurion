import { fontString } from '../../../shared/js/canvas-type.js';
// Michelson interferometer playground. Plots I(L) and the envelope V(L).

import {
  intensity, visibilityGaussian, bandwidthFromCoherence,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLc   = document.getElementById('readout-lc');
const readoutBw   = document.getElementById('readout-bw');

const sliderLam  = document.getElementById('slider-lam');
const sliderLogLc = document.getElementById('slider-loglc');
const valueLam   = document.getElementById('value-lam');
const valueLogLc = document.getElementById('value-loglc');

let lam = parseFloat(sliderLam.value);
let logLc = parseFloat(sliderLogLc.value);
// Continuously-swept mirror displacement L. Cycles between -Lmax and
// +Lmax over ~ 6 seconds so the ring inset and the I(L) cursor both
// animate; that makes the playground feel like a working interferometer
// rather than a static plot.
let L_sweep = 0;
let lastWall = performance.now();

sliderLam.addEventListener('input', () => { lam = parseFloat(sliderLam.value); valueLam.textContent = String(lam); });
sliderLogLc.addEventListener('input', () => { logLc = parseFloat(sliderLogLc.value); valueLogLc.textContent = logLc.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    grid:   '#23252a',
  };
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 56, padR = 12, padT = 22, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const Lc = Math.pow(10, logLc);
  // Show 2*Lc on each side or 6*lambda min.
  const Lmax = Math.max(6 * lam, 1.5 * Lc);
  const Lmin = -Lmax;

  function xFor(L) { return padL + plotW * (L - Lmin) / (Lmax - Lmin); }
  function yFor(I) { return padT + plotH * (1 - I); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${(1 - i / 4).toFixed(2)}`, padL - 28, y + 3);
  }
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L (nm), -${Lmax.toFixed(0)} to ${Lmax.toFixed(0)}`, padL + plotW - 180, padT + plotH + 28);

  // Visibility envelope (dashed).
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 600;
  for (let i = 0; i <= N; i += 1) {
    const L = Lmin + (Lmax - Lmin) * i / N;
    const V = visibilityGaussian(L, Lc);
    const yy = yFor(0.5 + 0.5 * V);
    if (i === 0) ctx.moveTo(xFor(L), yy); else ctx.lineTo(xFor(L), yy);
  }
  ctx.stroke();
  // Negative envelope.
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const L = Lmin + (Lmax - Lmin) * i / N;
    const V = visibilityGaussian(L, Lc);
    const yy = yFor(0.5 - 0.5 * V);
    if (i === 0) ctx.moveTo(xFor(L), yy); else ctx.lineTo(xFor(L), yy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Intensity curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const L = Lmin + (Lmax - Lmin) * i / N;
    const I = intensity(L, lam, Lc);
    const xx = xFor(L);
    const yy = yFor(I);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Mark L = 0 (static reference).
  const x0 = xFor(0);
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, padT); ctx.lineTo(x0, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('L = 0', x0 + 4, padT + 14);
  // Animated current-L cursor (this is THE interactive element).
  const Lcur = Math.max(Lmin, Math.min(Lmax, L_sweep));
  const xCur = xFor(Lcur);
  ctx.strokeStyle = c.blue; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xCur, padT); ctx.lineTo(xCur, padT + plotH); ctx.stroke();
  ctx.fillStyle = '#fff';
  const Inow = intensity(Lcur, lam, Lc);
  ctx.beginPath(); ctx.arc(xCur, yFor(Inow), 5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(xCur, yFor(Inow), 5, 0, 6.28); ctx.stroke();
  ctx.fillStyle = c.blue; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L = ${Lcur.toFixed(1)} nm  I = ${Inow.toFixed(3)}`, xCur + 6, padT + 14);
}

function updateReadout() {
  const Lc = Math.pow(10, logLc);
  readoutLc.textContent = (Lc / 1000).toFixed(3); // um
  readoutBw.textContent = (bandwidthFromCoherence(Lc) / 1e12).toFixed(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logLc = 2 + frac * 7;
    sliderLogLc.value = String(logLc);
    valueLogLc.textContent = logLc.toFixed(2);
  }
  valueLam.textContent = String(lam);
  valueLogLc.textContent = logLc.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, lam, logLc };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

// Content merge from FIS1015-michelson-fringe-counter: small inset in the
// top-right that draws the 2D ring fringe pattern at the current path
// difference L. The user sees both the 1D I(L) curve (main plot) AND the
// experimentalist's 2D bullseye view (inset) in one playground.
function renderRingInset() {
  const insetW = 200, insetH = 200;
  const x0 = canvas.width - insetW - 16;
  const y0 = 16;
  ctx.strokeStyle = 'rgba(220,220,240,0.35)';
  ctx.strokeRect(x0, y0, insetW, insetH);
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Ring view (2D)', x0 + 8, y0 + 14);
  const cx = x0 + insetW / 2, cy = y0 + insetH / 2;
  // Visualize the ring pattern at the CURRENT animated path
  // difference L_sweep. As L crosses zero the central spot flips
  // from bright to dark and the ring count grows with |L|; that's
  // the experimentalist's view of the interferogram.
  const L = L_sweep;
  const Imgd = ctx.createImageData(insetW, insetH);
  const data = Imgd.data;
  const rgbR = lam < 500 ? 60  : (lam > 600 ? 220 : 200);
  const rgbG = lam < 500 ? 60  : (lam > 600 ? 80  : 200);
  const rgbB = lam < 500 ? 220 : (lam > 600 ? 80  : 100);
  for (let py = 0; py < insetH; py += 1) {
    for (let px = 0; px < insetW; px += 1) {
      const u = (px - insetW / 2) / (insetW / 2);
      const v = (py - insetH / 2) / (insetH / 2);
      const arg = 4 * Math.PI * L / lam * (1 - 0.5 * (u * u + v * v));
      const I = 0.5 * (1 + Math.cos(arg));
      const k = (py * insetW + px) * 4;
      data[k    ] = Math.floor(rgbR * I);
      data[k + 1] = Math.floor(rgbG * I);
      data[k + 2] = Math.floor(rgbB * I);
      data[k + 3] = 255;
    }
  }
  ctx.putImageData(Imgd, x0, y0);
  ctx.strokeStyle = 'rgba(220,220,240,0.35)';
  ctx.strokeRect(x0, y0, insetW, insetH);
}
const origRender = render;
const renderWithInset = function () { origRender(); renderRingInset(); };

function animatedLoop(now) {
  const dt = Math.min(0.05, (now - lastWall) / 1000);
  lastWall = now;
  // Sweep L sinusoidally from -Lmax (~ 6 lambdas + 1.5 Lc) to +Lmax.
  // Period ~ 8 s. The amplitude grows with both lambda and Lc so the
  // sweep range always covers the visibility envelope.
  const Lc = Math.pow(10, logLc);
  const amp = Math.max(6 * lam, 1.5 * Lc);
  L_sweep = amp * Math.sin(now * 0.0008);
  renderWithInset();
  requestAnimationFrame(animatedLoop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync(); renderWithInset();
    if (!CAPTURE_NAME) requestAnimationFrame(animatedLoop);
  }, { once: true });
} else {
  bootSync(); renderWithInset();
  if (!CAPTURE_NAME) requestAnimationFrame(animatedLoop);
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
