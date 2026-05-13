// playground.js
// Redshift factor curve and color visualization.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
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

const state = {
  rRatio: 2.0,     // r_em / 2M
  speed: 2,
  sweepDir: 1,
  playing: !DETERMINISTIC,
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

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`r_em / 2M = ${state.rRatio.toFixed(2)}   f_obs / f_em = ${f.toFixed(5)}   z = ${z.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`clock rate = sqrt(1 - 2M/r) = ${cr.toFixed(5)}`, 30, 40);

  const padL = 30, padR = 30;
  const PW = W - padL - padR;

  // Top: redshift factor curve
  const topY = 60, topH = 220;
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
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('f_obs / f_em = sqrt(1 - 2M / r)', padL + 6, topY + 14);
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('horizon', padL + 6, topY + 28);
  // x ticks
  ctx.textAlign = 'center';
  for (const ratio of [1, 5, 10, 15, 20]) {
    const px = padL + 4 + (PW - 8) * (ratio - 1.001) / (rMax - 1.001);
    ctx.fillText(`${ratio}`, px, topY + topH - 4);
  }
  ctx.fillText('r_em / 2M', padL + PW / 2, topY + topH + 14);

  // Bottom: source and observer wavelength bars
  const botY = topY + topH + 40;
  const botH = 70;
  const LAMBDA_EM = 530;
  const lambdaObs = Math.min(2000, LAMBDA_EM / Math.max(f, 1e-6));
  // Source swatch (left)
  const [r0, g0, b0] = wavelengthToRGB(LAMBDA_EM);
  ctx.fillStyle = `rgb(${r0}, ${g0}, ${b0})`;
  ctx.fillRect(padL, botY, 100, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, 99, botH - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`source: ${LAMBDA_EM} nm`, padL, botY - 6);
  // Observed swatch (right)
  const [r1, g1, b1] = wavelengthToRGB(Math.min(780, lambdaObs));
  ctx.fillStyle = `rgb(${r1}, ${g1}, ${b1})`;
  ctx.fillRect(W - padR - 100, botY, 100, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.strokeRect(W - padR - 100 + 0.5, botY + 0.5, 99, botH - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  if (lambdaObs > 780) ctx.fillText(`observed: ${lambdaObs.toFixed(0)} nm (infrared)`, W - padR - 100, botY - 6);
  else                 ctx.fillText(`observed: ${lambdaObs.toFixed(0)} nm`, W - padR - 100, botY - 6);
  // Arrow between
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL + 105, botY + botH / 2);
  ctx.lineTo(W - padR - 105, botY + botH / 2);
  ctx.stroke();
  ctx.fillStyle = '#f1d28a';
  ctx.beginPath();
  ctx.moveTo(W - padR - 105, botY + botH / 2);
  ctx.lineTo(W - padR - 113, botY + botH / 2 - 5);
  ctx.lineTo(W - padR - 113, botY + botH / 2 + 5);
  ctx.closePath();
  ctx.fill();
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
