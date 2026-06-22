import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Redshift factor curve and color visualization.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  redshiftFactor, clockRate, redshift_z, wavelengthToRGB, HORIZON, M,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderR      = document.getElementById('slider-r');
const sliderSpeed  = document.getElementById('slider-speed');
const valueR       = document.getElementById('value-r');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const readoutR = document.getElementById('readout-r');
const readoutF = document.getElementById('readout-f');
const readoutZ = document.getElementById('readout-z');

const state = {
  rRatio: 2.0,     // r_em / 2M
  speed: 2,
  sweepDir: 1,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const r_em = state.rRatio * HORIZON;
  const f = redshiftFactor(r_em);
  const z = redshift_z(r_em);
  const cr = clockRate(r_em);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`r_em / 2M = ${state.rRatio.toFixed(2)}   f_obs / f_em = ${f.toFixed(5)}   z = ${z.toFixed(3)}`, 30, 22);
  if (readoutR) readoutR.textContent = state.rRatio.toFixed(2);
  if (readoutF) readoutF.textContent = f.toFixed(5);
  if (readoutZ) readoutZ.textContent = Number.isFinite(z) ? z.toFixed(3) : '∞';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`clock rate = sqrt(1 - 2M/r) = ${cr.toFixed(5)}`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: redshift factor curve
  const topY = 60, topH = 340;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  const rMax = 20;
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = PW - 8;
  for (let i = 0; i < NPTS; i += 1) {
    const ratio = 1.001 + (rMax - 1.001) * i / (NPTS - 1);
    const r = ratio * HORIZON;
    const fac = redshiftFactor(r);
    const px = padL + 4 + i;
    const py = topY + topH - 4 - (topH - 12) * fac;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // cursor
  const cPx = padL + 4 + (PW - 8) * (state.rRatio - 1.001) / (rMax - 1.001);
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cPx, topY + 6); ctx.lineTo(cPx, topY + topH - 6);
  ctx.stroke();
  // Horizon line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  const hPx = padL + 4;     // at ratio = 1
  ctx.moveTo(hPx, topY); ctx.lineTo(hPx, topY + topH);
  ctx.stroke();
  ctx.setLineDash([]);
  // labels
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('f_obs / f_em = sqrt(1 - 2M / r)', padL + 6, topY + 14);
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('horizon', padL + 6, topY + 28);
  // x ticks
  ctx.textAlign = 'center';
  for (const ratio of [1, 5, 10, 15, 20]) {
    const px = padL + 4 + (PW - 8) * (ratio - 1.001) / (rMax - 1.001);
    ctx.fillText(`${ratio}`, px, topY + topH - 4);
  }
  ctx.fillText('r_em / 2M', padL + PW / 2, topY + topH + 14);

  // Bottom: the spectral line shifting along the visible spectrum as the
  // photon climbs out of the gravity well (fills what was empty canvas).
  const LAMBDA_EM = 530;
  const lambdaObs = Math.min(2000, LAMBDA_EM / Math.max(f, 1e-6));
  const specY = topY + topH + 56;
  const LAM_MIN = 380, LAM_MAX = 920;
  const lamPx = (lam) => padL + (Math.max(LAM_MIN, Math.min(LAM_MAX, lam)) - LAM_MIN) / (LAM_MAX - LAM_MIN) * PW;

  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('the climbing photon loses energy, so its wavelength stretches toward the red', padL, specY - 14);

  // visible-to-near-IR rainbow strip
  const stripY = specY + 28, stripH = 150;
  for (let px = 0; px < PW; px += 1) {
    const lam = LAM_MIN + (LAM_MAX - LAM_MIN) * px / PW;
    const [rr, gg, bb] = wavelengthToRGB(lam);
    ctx.fillStyle = `rgb(${rr}, ${gg}, ${bb})`;
    ctx.fillRect(padL + px, stripY, 1, stripH);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(padL + 0.5, stripY + 0.5, PW - 1, stripH - 1);

  // emitted and observed spectral lines
  const emX = lamPx(LAMBDA_EM), obX = lamPx(lambdaObs);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(emX, stripY - 6); ctx.lineTo(emX, stripY + stripH + 6); ctx.stroke();
  ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(obX, stripY - 6); ctx.lineTo(obX, stripY + stripH + 6); ctx.stroke();
  // redshift arrow along the strip
  const ay = stripY + stripH / 2;
  if (obX > emX + 14) {
    ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(emX + 4, ay); ctx.lineTo(obX - 10, ay); ctx.stroke();
    ctx.fillStyle = '#f1d28a'; ctx.beginPath(); ctx.moveTo(obX - 10, ay); ctx.lineTo(obX - 20, ay - 7); ctx.lineTo(obX - 20, ay + 7); ctx.closePath(); ctx.fill();
  }
  // labels
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff'; ctx.fillText(`emitted ${LAMBDA_EM} nm`, Math.min(PW + padL - 70, Math.max(padL + 70, emX)), stripY - 12);
  ctx.fillStyle = '#f1d28a'; ctx.fillText(lambdaObs > 780 ? `observed ${lambdaObs.toFixed(0)} nm (IR)` : `observed ${lambdaObs.toFixed(0)} nm`, Math.min(PW + padL - 80, Math.max(padL + 80, obX)), stripY + stripH + 22);
  // wavelength axis
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = fontString(canvas, 'tick', 'mono');
  for (const lam of [400, 500, 600, 700, 800, 900]) ctx.fillText(`${lam}`, lamPx(lam), stripY + stripH + 44);
  ctx.fillText('wavelength (nm)', padL + PW / 2, stripY + stripH + 60);

  // large emitted vs observed colour swatches
  const swY = stripY + stripH + 82, swH = H - swY - 24, swW = 230;
  const [r0, g0, b0] = wavelengthToRGB(LAMBDA_EM);
  ctx.fillStyle = `rgb(${r0}, ${g0}, ${b0})`; ctx.fillRect(padL, swY, swW, swH);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(padL + 0.5, swY + 0.5, swW - 1, swH - 1);
  const [r1, g1, b1] = wavelengthToRGB(Math.min(780, lambdaObs));
  ctx.fillStyle = `rgb(${r1}, ${g1}, ${b1})`; ctx.fillRect(W - padR - swW, swY, swW, swH);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(W - padR - swW + 0.5, swY + 0.5, swW - 1, swH - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('source colour', padL + swW / 2, swY - 8);
  ctx.fillText('observed colour', W - padR - swW / 2, swY - 8);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.rRatio += state.sweepDir * 0.02;
    if (state.rRatio > 20)   { state.rRatio = 20;    state.sweepDir = -1; }
    if (state.rRatio < 1.05) { state.rRatio = 1.05;  state.sweepDir = 1; }
  }
  valueR.textContent = state.rRatio.toFixed(2);
  sliderR.value = state.rRatio.toFixed(2);
}

sliderR.addEventListener('input', () => { state.rRatio = parseFloat(sliderR.value); valueR.textContent = state.rRatio.toFixed(2); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.rRatio = 2; state.sweepDir = 1; sliderR.value = '2.00'; valueR.textContent = '2.00'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.rRatio = 1.05 + frac * 18.95;
    sliderR.value = state.rRatio.toFixed(2); valueR.textContent = state.rRatio.toFixed(2);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    if (state.speed > 0) tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const r_em = state.rRatio * HORIZON;
  const f = redshiftFactor(r_em);
  const z = redshift_z(r_em);
  const cr = clockRate(r_em);
  return {
    fields: [
      { key: 'radius-ratio', label: 'Radius (r_em / 2M)', value: state.rRatio, format: 'float' },
      { key: 'redshift-factor', label: 'Redshift factor f_obs/f_em', value: f, format: 'float' },
      { key: 'redshift-z', label: 'Redshift parameter z', value: z === Infinity ? 'inf' : z, format: z === Infinity ? undefined : 'float' },
      { key: 'clock-rate', label: 'Clock rate (proper/coordinate)', value: cr, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const r_em = state.rRatio * HORIZON;
  if (r_em <= HORIZON) {
    return [
      { key: 'schwarzschild-bound', label: 'Outside event horizon', value: 'breach', status: 'drift' }
    ];
  }
  const f = redshiftFactor(r_em);
  const cr = clockRate(r_em);
  const f_expected = Math.sqrt(1 - 2 * 1.0 / r_em);
  const f_drift = Math.abs(f - f_expected);
  return [
    {
      key: 'redshift-consistency',
      label: 'f = sqrt(1 - 2M/r)',
      value: f_drift > 1e-10 ? f_drift.toExponential(2) : 'pass',
      status: f_drift > 1e-10 ? 'drift' : 'pass'
    }
  ];
};
