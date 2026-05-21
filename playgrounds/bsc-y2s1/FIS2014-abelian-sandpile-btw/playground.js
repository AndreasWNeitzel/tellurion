// playground.js
// BTW sandpile lattice + avalanche-size histogram.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createBTW, stepBTW, avalanchePLBins, L } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

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

const state = {
  speed: 3,
  sim: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createBTW({ L_size: L, seed: SEED });
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const totalGrains = state.sim.grid.reduce((a, b) => a + b, 0);
  const maxAv = state.sim.avalanches.length > 0 ? Math.max(...state.sim.avalanches) : 0;
  const meanAv = state.sim.avalanches.length > 0
    ? state.sim.avalanches.reduce((a, b) => a + b, 0) / state.sim.avalanches.length
    : 0;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.sim.t}   total grains = ${totalGrains}   last avalanche = ${state.sim.lastAvalanche}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`max avalanche = ${maxAv}   mean avalanche = ${meanAv.toFixed(2)}   samples = ${state.sim.avalanches.length}`, 30, 40);

  // Layout: lattice on left, histogram on right
  const padL = 30, padR = 30, gap = 30;
  const panelGap = 30;
  const panelTop = 60;
  // ISOMETRIC 3D rendering of the sandpile: each lattice cell is a
  // tower whose height equals the local grain count. The user sees the
  // pile literally build up and avalanche down. Reference toppling
  // threshold zc is read from state.sim.
  const latticeSize = Math.min(360, H - panelTop - 80);
  const latticeX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(latticeX, panelTop, latticeSize, latticeSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(latticeX + 0.5, panelTop + 0.5, latticeSize - 1, latticeSize - 1);
  const zc = state.sim.zc || 4;
  // Isometric projection: world (i, j, h) -> screen (sx, sy)
  // sx = ax * (i - j),  sy = ay * (i + j) - hz * h
  // with ax, ay, hz chosen so the projected square footprint fits the
  // panel and tall towers can extend up to height ~ 3 zc.
  const cells = L;
  const ax = (latticeSize * 0.46) / cells;
  const ay = ax * 0.55;
  const hz = ay * 0.85;
  const ox = latticeX + latticeSize / 2;
  const oy = panelTop + latticeSize * 0.30;
  // Render from BACK (large i + j) to FRONT (small i + j) so closer
  // towers correctly occlude distant ones.
  for (let s = 2 * (cells - 1); s >= 0; s -= 1) {
    for (let j = Math.max(0, s - (cells - 1)); j <= Math.min(cells - 1, s); j += 1) {
      const i = s - j;
      const h = state.sim.grid[j * L + i];
      if (h <= 0) continue;
      const sx = ox + ax * (i - j);
      const sy = oy + ay * (i + j) - hz * h;
      // Tower top diamond
      const A = [sx, sy], B = [sx + ax, sy + ay], C = [sx, sy + 2 * ay], D = [sx - ax, sy + ay];
      // Hue: green for sub-threshold (h < zc - 1), yellow approaching, red at threshold
      const ratio = Math.min(1, h / zc);
      const r = Math.round(70 + 180 * ratio);
      const g = Math.round(200 - 100 * ratio);
      const b = Math.round(110 - 60 * ratio);
      // Right face
      ctx.fillStyle = `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`;
      ctx.beginPath();
      ctx.moveTo(B[0], B[1]); ctx.lineTo(C[0], C[1]);
      ctx.lineTo(C[0], C[1] + hz * h); ctx.lineTo(B[0], B[1] + hz * h);
      ctx.closePath(); ctx.fill();
      // Left face
      ctx.fillStyle = `rgb(${Math.round(r * 0.5)}, ${Math.round(g * 0.5)}, ${Math.round(b * 0.5)})`;
      ctx.beginPath();
      ctx.moveTo(D[0], D[1]); ctx.lineTo(C[0], C[1]);
      ctx.lineTo(C[0], C[1] + hz * h); ctx.lineTo(D[0], D[1] + hz * h);
      ctx.closePath(); ctx.fill();
      // Top diamond
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText(`sandpile heights, toppling threshold z_c = ${zc}`, latticeX + 6, panelTop - 6);

  // Histogram panel
  const histX = latticeX + latticeSize + panelGap;
  const histW = W - histX - padR;
  const histY = panelTop;
  const histH = latticeSize;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(histX, histY, histW, histH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(histX + 0.5, histY + 0.5, histW - 1, histH - 1);
  const { bins, counts } = avalanchePLBins(state.sim, 16);
  // Determine log-log axes
  const logSmin = 0, logSmax = bins.length > 0 ? Math.log10(bins[bins.length - 1]) + 0.5 : 4;
  const logPmin = -4, logPmax = 2;
  function xLog(s) { return histX + 4 + (histW - 8) * (Math.log10(s) - logSmin) / (logSmax - logSmin); }
  function yLog(p) {
    const l = Math.log10(Math.max(1e-8, p));
    const c = Math.max(logPmin, Math.min(logPmax, l));
    return histY + histH - 4 - (histH - 12) * (c - logPmin) / (logPmax - logPmin);
  }
  // Bars
  for (let i = 0; i < bins.length; i += 1) {
    if (counts[i] <= 0) continue;
    const px = xLog(bins[i]);
    const py = yLog(counts[i]);
    const yBottom = yLog(1e-8);
    ctx.fillStyle = 'rgba(127, 177, 216, 0.55)';
    ctx.fillRect(px - 3, py, 6, yBottom - py);
  }
  // Reference power law: s^(-1.21)
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  const A = 0.5;     // arbitrary normalization
  for (let i = 0; i < 100; i += 1) {
    const lg = logSmin + (logSmax - logSmin) * i / 99;
    const s = Math.pow(10, lg);
    const p = A * Math.pow(s, -1.21);
    const px = xLog(s);
    const py = yLog(p);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(127, 177, 216, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('P(s) histogram', histX + 6, histY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('s^(-1.21) reference', histX + 130, histY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) stepBTW(state.sim);
}

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
// z_c slider: update toppling threshold and rebuild the pile so the
// new threshold takes effect from a clean state. Lower z_c gives
// faster cascades; higher z_c gives rarer but larger avalanches.
const sliderZc = document.getElementById('slider-zc'), valueZc = document.getElementById('value-zc');
if (sliderZc) {
  sliderZc.addEventListener('input', () => {
    const zc = parseInt(sliderZc.value, 10);
    valueZc.textContent = String(zc);
    state.sim = createBTW({ L_size: L, seed: SEED, zc });
    drawAll();
  });
}
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
    const target = 100 + Math.round(frac * 4000);
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
    tickN(state.speed * 4);
    drawAll();
  }
  requestAnimationFrame(tick);
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
