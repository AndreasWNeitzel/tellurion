// playground.js
// 2D site percolation: occupy a lattice with probability p, label clusters,
// highlight the largest cluster, indicate percolation.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
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
  // Find largest cluster and the SPANNING cluster (a cluster that
  // touches both the top and bottom rows; the percolation order
  // parameter).
  let maxLabel = 0, maxSize = 0;
  for (const [lab, sz] of sizes.entries()) {
    if (sz > maxSize) { maxSize = sz; maxLabel = lab; }
  }
  // Identify the spanning cluster label by checking which labels
  // appear in BOTH the top row (j = 0) and the bottom row (j = L-1).
  const topLabels = new Set(), botLabels = new Set();
  for (let i = 0; i < state.L; i += 1) {
    const lt = labels[i];
    const lb = labels[(state.L - 1) * state.L + i];
    if (lt > 0) topLabels.add(lt);
    if (lb > 0) botLabels.add(lb);
  }
  let spanLabel = 0, spanSize = 0;
  for (const lab of topLabels) {
    if (botLabels.has(lab)) {
      const sz = sizes.get(lab) || 0;
      if (sz > spanSize) { spanSize = sz; spanLabel = lab; }
    }
  }
  const cell = Math.floor((W - 40) / state.L);
  const x0 = (W - state.L * cell) / 2, y0 = 20;
  for (let j = 0; j < state.L; j += 1) {
    for (let i = 0; i < state.L; i += 1) {
      const k = j * state.L + i;
      if (!grid[k]) continue;
      // Three-colour scheme: spanning cluster (warm gold) -> largest
      // non-spanning (cool teal) -> generic occupied (light blue).
      if (labels[k] === spanLabel && spanLabel > 0) ctx.fillStyle = '#f1c14a';
      else if (labels[k] === maxLabel) ctx.fillStyle = '#7ed4c1';
      else ctx.fillStyle = '#69a8d6';
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

  // P_c inline marker on a p-bar across the bottom: shows the current
  // p relative to the critical value 0.59275 so the user can see how
  // close they are to threshold.
  const barW = W - 360 - 20, barX = 280, barY = H - 18, barH = 10;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  // p_c tick (gold)
  const pcX = barX + (P_C - 0) / 1.0 * barW;
  ctx.fillStyle = '#f1c14a'; ctx.fillRect(pcX - 1, barY - 4, 2, barH + 8);
  ctx.font = '9px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('p_c', pcX, barY - 6);
  // current p marker
  const pX = barX + state.p * barW;
  ctx.fillStyle = '#7ed4c1'; ctx.fillRect(pX - 1, barY - 4, 2, barH + 8);
  ctx.fillStyle = '#9aa0a6'; ctx.textAlign = 'left';
  ctx.fillText('0', barX - 2, barY + barH + 11);
  ctx.textAlign = 'right'; ctx.fillText('1', barX + barW + 2, barY + barH + 11);

  // Cluster-size histogram inset (top-right): log-log bin counts so
  // the power-law n(s) ~ s^-tau at the critical point is visible.
  const hX = W - 200, hY = 24, hW = 180, hH = 96;
  ctx.fillStyle = 'rgba(15, 18, 28, 0.85)'; ctx.fillRect(hX, hY, hW, hH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.strokeRect(hX + 0.5, hY + 0.5, hW - 1, hH - 1);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '9px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('cluster sizes log10(n) vs log10(s)', hX + 4, hY + 12);
  const NB = 12;
  const bins = new Array(NB).fill(0);
  const maxLogS = Math.max(1, Math.log10(state.L * state.L));
  for (const sz of sizes.values()) {
    const bi = Math.min(NB - 1, Math.max(0, Math.floor(Math.log10(Math.max(1, sz)) / maxLogS * NB)));
    bins[bi] += 1;
  }
  let mx = 0; for (const b of bins) if (b > mx) mx = b;
  const logMx = Math.log10(Math.max(1, mx));
  const bw = (hW - 12) / NB;
  for (let i = 0; i < NB; i += 1) {
    const h = bins[i] > 0 ? (Math.log10(bins[i]) / Math.max(0.1, logMx)) * (hH - 28) : 0;
    ctx.fillStyle = (i + 1) / NB * maxLogS > Math.log10(spanSize) ? 'rgba(241, 193, 74, 0.7)' : 'rgba(105, 168, 214, 0.7)';
    ctx.fillRect(hX + 6 + i * bw, hY + hH - 8 - h, bw - 1, h);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('s', hX + hW - 12, hY + hH - 3);
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

// Animate p slowly from 0.35 to 0.80 so the user sees the percolation threshold.
let animTime = 0;
let paused = false;
let userOverride = false;
sliderP.addEventListener('input', () => { userOverride = true; });
sliderL.addEventListener('change', () => { userOverride = true; });
btnResample.addEventListener('click', () => { userOverride = true; });
btnPc.addEventListener('click', () => { userOverride = true; });
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    paused = !paused;
    btnPlayPause.textContent = paused ? 'Play' : 'Pause';
    if (!paused) userOverride = false;
  });
}
function tick() {
  if (!paused && !userOverride && !CAPTURE_NAME) {
    animTime += 0.003;
    state.p = 0.575 + 0.225 * Math.sin(animTime);
    sliderP.value = state.p.toFixed(3);
    valueP.textContent = state.p.toFixed(3);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
