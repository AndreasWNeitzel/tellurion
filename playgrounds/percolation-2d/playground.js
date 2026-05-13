// playground.js
// 2D site percolation: occupy a lattice with probability p, label clusters,
// highlight the largest cluster, indicate percolation.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { occupy, cluster, largestClusterFraction, spans, P_C } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderP      = document.getElementById('slider-p');
const sliderL      = document.getElementById('slider-L');
const valueP       = document.getElementById('value-p');
const valueL       = document.getElementById('value-L');
const btnResample  = document.getElementById('btn-resample');
const btnPc        = document.getElementById('btn-pc');

const W = canvas.width, H = canvas.height;
const state = { p: 0.59, L: 80, seedSalt: 0 };

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  const grid = occupy(state.L, state.p, SEED ^ state.seedSalt);
  const { labels, sizes } = cluster(grid, state.L);
  // Find largest
  let maxLabel = 0, maxSize = 0;
  for (const [lab, sz] of sizes.entries()) {
    if (sz > maxSize) { maxSize = sz; maxLabel = lab; }
  }
  const cell = Math.floor((W - 40) / state.L);
  const x0 = (W - state.L * cell) / 2, y0 = 20;
  for (let j = 0; j < state.L; j += 1) {
    for (let i = 0; i < state.L; i += 1) {
      const k = j * state.L + i;
      if (!grid[k]) continue;
      ctx.fillStyle = labels[k] === maxLabel ? '#f1d28a' : '#69a8d6';
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell, cell);
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, cell * state.L - 1, cell * state.L - 1);

  const Pinf = maxSize / (state.L * state.L);
  const hasSpan = spans(grid, state.L);
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['p',         state.p.toFixed(3)],
    ['p_c',       P_C.toFixed(5)],
    ['L',         String(state.L)],
    ['largest',   Pinf.toFixed(3)],
    ['spans',     hasSpan ? 'yes' : 'no'],
    ['n clusters', String(sizes.size)],
  ];
  let y = H - 100;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 20, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 260, y);
    y += 14;
  }
}

sliderP.addEventListener('input', () => {
  state.p = parseFloat(sliderP.value);
  valueP.textContent = state.p.toFixed(3);
  drawAll();
});
sliderL.addEventListener('change', () => {
  state.L = parseInt(sliderL.value, 10);
  valueL.textContent = String(state.L);
  drawAll();
});
btnResample.addEventListener('click', () => {
  state.seedSalt += 17;
  drawAll();
});
btnPc.addEventListener('click', () => {
  state.p = P_C;
  sliderP.value = P_C.toFixed(3);
  valueP.textContent = P_C.toFixed(3);
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const ps = [0.40, 0.50, P_C, 0.65, 0.80];
    state.p = ps[Math.min(ps.length - 1, Math.round(frac * (ps.length - 1)))];
    sliderP.value = state.p.toFixed(3);
    valueP.textContent = state.p.toFixed(3);
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
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
