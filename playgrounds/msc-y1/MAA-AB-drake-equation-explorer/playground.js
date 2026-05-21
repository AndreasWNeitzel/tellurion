// Drake equation playground. Point estimate at user's central values,
// plus a Monte Carlo histogram drawn from log-uniform ranges around
// each factor (range = +/- 0.5 dex from the slider).

import { drakeN, monteCarlo, DEFAULTS } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutN     = document.getElementById('readout-n');
const readoutMed   = document.getElementById('readout-med');

const sliderR  = document.getElementById('slider-R');
const sliderFl = document.getElementById('slider-fl');
const sliderFi = document.getElementById('slider-fi');
const sliderL  = document.getElementById('slider-L');
const valueR   = document.getElementById('value-R');
const valueFl  = document.getElementById('value-fl');
const valueFi  = document.getElementById('value-fi');
const valueL   = document.getElementById('value-L');

let logR  = parseFloat(sliderR.value);
let logFl = parseFloat(sliderFl.value);
let logFi = parseFloat(sliderFi.value);
let logL  = parseFloat(sliderL.value);

sliderR.addEventListener('input', () => { logR = parseFloat(sliderR.value); valueR.textContent = logR.toFixed(2); });
sliderFl.addEventListener('input', () => { logFl = parseFloat(sliderFl.value); valueFl.textContent = logFl.toFixed(2); });
sliderFi.addEventListener('input', () => { logFi = parseFloat(sliderFi.value); valueFi.textContent = logFi.toFixed(2); });
sliderL.addEventListener('input', () => { logL = parseFloat(sliderL.value); valueL.textContent = logL.toFixed(2); });

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

  const padL = 56, padR = 16, padT = 30, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const R_star_c = Math.pow(10, logR);
  const f_l_c    = Math.pow(10, logFl);
  const f_i_c    = Math.pow(10, logFi);
  const L_c      = Math.pow(10, logL);

  const pointParams = { ...DEFAULTS, R_star: R_star_c, f_l: f_l_c, f_i: f_i_c, L: L_c };
  const pointN = drakeN(pointParams);

  // Monte Carlo with +/- 0.5 dex range around each factor.
  const rng = makeRng(DEFAULT_SEED);
  const samples = monteCarlo(rng, {
    R_star: [R_star_c / 3, R_star_c * 3],
    f_p:    [0.5, 1.0],
    n_e:    [0.1, 1.0],
    f_l:    [f_l_c / 3, f_l_c * 3],
    f_i:    [f_i_c / 3, f_i_c * 3],
    f_c:    [0.01, 1.0],
    L:      [L_c / 3, L_c * 3],
  }, 2000);

  // Histogram in log10 N.
  const xMinLog = -10, xMaxLog = 12;
  const NBINS = 44;
  const bins = new Int32Array(NBINS);
  const sortedLog = [];
  for (const s of samples) {
    if (s <= 0) continue;
    const l = Math.log10(s);
    sortedLog.push(l);
    if (l < xMinLog || l > xMaxLog) continue;
    const i = Math.min(NBINS - 1, Math.floor((l - xMinLog) / (xMaxLog - xMinLog) * NBINS));
    bins[i] += 1;
  }
  sortedLog.sort((a, b) => a - b);
  const median = sortedLog.length > 0 ? sortedLog[Math.floor(sortedLog.length / 2)] : 0;

  function xFor(l) { return padL + plotW * (l - xMinLog) / (xMaxLog - xMinLog); }
  let maxCount = 1;
  for (const b of bins) if (b > maxCount) maxCount = b;
  function yFor(count) { return padT + plotH * (1 - count / maxCount); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let l = xMinLog; l <= xMaxLog; l += 4) {
    const x = xFor(l);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`1e${l}`, x - 14, padT + plotH + 14);
  }

  // Bars.
  const binW = plotW / NBINS;
  for (let i = 0; i < NBINS; i += 1) {
    if (bins[i] === 0) continue;
    const x = padL + binW * i;
    const y = yFor(bins[i]);
    ctx.fillStyle = c.blue;
    ctx.fillRect(x + 1, y, binW - 2, padT + plotH - y);
  }

  // Median line.
  if (median !== 0) {
    const xm = xFor(median);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xm, padT); ctx.lineTo(xm, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.accent;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`median 1e${median.toFixed(1)}`, xm + 4, padT + 14);
  }

  // Point estimate line.
  if (pointN > 0) {
    const xp = xFor(Math.log10(pointN));
    ctx.strokeStyle = c.fg;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xp, padT); ctx.lineTo(xp, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.fg;
    ctx.fillText(`point N = ${pointN.toExponential(2)}`, xp + 4, padT + 30);
  }

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('log10 N (number of detectable civilizations)', padL + plotW - 200, padT + plotH + 28);
  ctx.fillText('Monte Carlo N = 2000, +/- 0.5 dex around each slider', padL + 8, padT + 14);
}

function updateReadout() {
  const R_star_c = Math.pow(10, logR);
  const f_l_c    = Math.pow(10, logFl);
  const f_i_c    = Math.pow(10, logFi);
  const L_c      = Math.pow(10, logL);
  const pointParams = { ...DEFAULTS, R_star: R_star_c, f_l: f_l_c, f_i: f_i_c, L: L_c };
  const pointN = drakeN(pointParams);
  readoutN.textContent = pointN.toExponential(3);
  // Approximate median by reusing the seeded MC.
  const rng = makeRng(DEFAULT_SEED);
  const samples = monteCarlo(rng, {
    R_star: [R_star_c / 3, R_star_c * 3],
    f_p:    [0.5, 1.0],
    n_e:    [0.1, 1.0],
    f_l:    [f_l_c / 3, f_l_c * 3],
    f_i:    [f_i_c / 3, f_i_c * 3],
    f_c:    [0.01, 1.0],
    L:      [L_c / 3, L_c * 3],
  }, 500);
  const sorted = Array.from(samples).filter(v => v > 0).sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  readoutMed.textContent = median > 0 ? Math.log10(median).toFixed(2) : 'NA';
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logL = 2 + frac * 7;
    sliderL.value = String(logL);
    valueL.textContent = logL.toFixed(2);
  }
  valueR.textContent = logR.toFixed(2);
  valueFl.textContent = logFl.toFixed(2);
  valueFi.textContent = logFi.toFixed(2);
  valueL.textContent = logL.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logR, logFl, logFi, logL };
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
