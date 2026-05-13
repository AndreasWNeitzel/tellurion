// playground.js
// Hard-disk gas with speed histogram + MB curve overlay.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  createGas, stepGas, totalKE, meanSpeed, speedHistogram, maxwellBoltzmann2D,
  BOX, RADIUS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const V0 = 1.0;

const state = {
  speed: 3,
  sim: null,
  KE0: 0,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createGas({ N: 1000, v0: V0, seed: SEED });
  state.KE0 = totalKE(state.sim);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`N = ${state.sim.N}   v_0 = ${V0.toFixed(2)}   t = ${state.sim.t.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  const KE = totalKE(state.sim);
  const mv = meanSpeed(state.sim);
  ctx.fillText(`<v> = ${mv.toFixed(3)} (MB pred = ${(V0 / Math.sqrt(2) * Math.sqrt(Math.PI / 2)).toFixed(3)})   KE drift = ${((KE - state.KE0) / state.KE0).toExponential(2)}`, 30, 40);

  // Top: gas box
  const boxSize = 320;
  const boxX = 30, boxY = 60;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(boxX, boxY, boxSize, boxSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxSize - 1, boxSize - 1);
  const scale = boxSize / BOX;
  for (let i = 0; i < state.sim.N; i += 1) {
    const px = boxX + state.sim.x[i] * scale;
    const py = boxY + state.sim.y[i] * scale;
    const v = Math.sqrt(state.sim.vx[i] ** 2 + state.sim.vy[i] ** 2);
    const tFast = Math.min(1, v / (V0 * 2));
    const r = 0x7f + Math.round((0xd6 - 0x7f) * tFast);
    const g = 0xb1 + Math.round((0x8a - 0xb1) * tFast);
    const b = 0xd8 + Math.round((0x69 - 0xd8) * tFast);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(px, py, RADIUS * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('gas box (color = speed)', boxX + 6, boxY + 14);

  // Right: histogram
  const histX = boxX + boxSize + 30;
  const histW = W - histX - 30;
  const histH = 240;
  const histY = boxY;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(histX, histY, histW, histH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(histX + 0.5, histY + 0.5, histW - 1, histH - 1);
  const NBINS = 32;
  const VMAX = 2.5;
  const { bins, dv } = speedHistogram(state.sim, NBINS, VMAX);
  let pMax = 0;
  for (let k = 0; k < bins.length; k += 1) if (bins[k] > pMax) pMax = bins[k];
  pMax = Math.max(pMax, 1.4);
  // Bars
  for (let k = 0; k < bins.length; k += 1) {
    const x0 = histX + 4 + (histW - 8) * k / NBINS;
    const x1 = histX + 4 + (histW - 8) * (k + 1) / NBINS;
    const y0 = histY + histH - 4 - (histH - 24) * bins[k] / pMax;
    ctx.fillStyle = 'rgba(127, 177, 216, 0.55)';
    ctx.fillRect(x0, y0, x1 - x0 - 1, histY + histH - 4 - y0);
  }
  // MB curve
  const sigma = V0 / Math.sqrt(2);
  ctx.strokeStyle = tok.accentWarm;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = 200;
  for (let i = 0; i < NPTS; i += 1) {
    const v = VMAX * i / (NPTS - 1);
    const fmb = maxwellBoltzmann2D(v, sigma);
    const px = histX + 4 + (histW - 8) * (v / VMAX);
    const py = histY + histH - 4 - (histH - 24) * fmb / pMax;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('histogram (bars) vs MB pred (orange)', histX + 6, histY + 14);
  // x ticks
  ctx.textAlign = 'center';
  for (let v = 0; v <= 2; v += 0.5) {
    const px = histX + 4 + (histW - 8) * (v / VMAX);
    ctx.fillText(v.toFixed(1), px, histY + histH - 8);
  }
  ctx.fillText('speed |v|', histX + histW / 2, histY + histH - 22);

  // Bottom: legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
  ctx.fillText('slow disks', 60, H - 32);
  ctx.fillStyle = 'rgba(214, 138, 105, 0.85)';
  ctx.fillText('fast disks', 180, H - 32);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('2D Maxwell-Boltzmann analytic', 300, H - 32);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) stepGas(state.sim, 0.01);
}

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 2500);
    tickN(target);
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
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
