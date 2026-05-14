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
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${(1 - i / 4).toFixed(2)}`, padL - 28, y + 3);
  }
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
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

  // Mark L = 0.
  const x0 = xFor(0);
  ctx.strokeStyle = c.blue;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, padT); ctx.lineTo(x0, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.blue;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('L = 0', x0 + 4, padT + 14);
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}
