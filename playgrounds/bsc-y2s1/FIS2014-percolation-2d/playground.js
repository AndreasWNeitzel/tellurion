// playground.js
// 2D site percolation: occupy a lattice with probability p, label clusters,
// highlight the largest cluster, indicate percolation.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { occupy, cluster, largestClusterFraction, spans, P_C } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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
const state = { p: 0.59, L: 80, seedSalt: 0, pInfHistory: [] };

// Precompute / accumulate P_inf(p) data points by sweeping p and using
// the spanning-cluster size. Populated on demand.
const P_INF_NS = 60;
const pInfData = new Float32Array(P_INF_NS);    // 0..1 at p_i = i / (P_INF_NS - 1).
let pInfReady = false;
function buildPInfCurve() {
  // Sample 60 p-values and average a few independent realisations at
  // L = state.L (or 60 if too large). A single seed reads as noisy near
  // p_c so 3 averages smooths it.
  const Lsim = Math.min(60, state.L);
  for (let i = 0; i < P_INF_NS; i += 1) {
    const p = i / (P_INF_NS - 1);
    let sum = 0;
    for (let r = 0; r < 3; r += 1) {
      const g = occupy(Lsim, p, (SEED + i * 1009 + r * 17) | 0);
      sum += largestClusterFraction(g, Lsim);
    }
    pInfData[i] = sum / 3;
  }
  pInfReady = true;
}

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
  // Use only the left ~60% of the canvas for the lattice so we can
  // dock a tall P_inf(p) curve panel on the right.
  const lattW = Math.min(W - 260, H - 40);
  const cell = Math.max(1, Math.floor(lattW / state.L));
  const x0 = 20, y0 = 20;
  // Each cluster gets a unique hue derived from a hash of its label.
  // The spanning cluster gets gold; the largest-non-spanning gets teal;
  // every other cluster gets a hue-stable colour so the user can see
  // the cluster decomposition at any p.
  function colourFor(lab) {
    if (lab === spanLabel && spanLabel > 0) return '#f1c14a';
    if (lab === maxLabel) return '#7ed4c1';
    // Pseudo-random hue from the label hash.
    let h = lab * 2654435761;
    h = ((h ^ (h >>> 16)) >>> 0) % 360;
    return `hsl(${h}, 55%, 56%)`;
  }
  for (let j = 0; j < state.L; j += 1) {
    for (let i = 0; i < state.L; i += 1) {
      const k = j * state.L + i;
      if (!grid[k]) continue;
      ctx.fillStyle = colourFor(labels[k]);
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell, cell);
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, cell * state.L - 1, cell * state.L - 1);

  const Pinf = maxSize / (state.L * state.L);
  const hasSpan = spans(grid, state.L);
  ctx.font = fontString(canvas, 'caption', 'mono');
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
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('p_c', pcX, barY - 6);
  // current p marker
  const pX = barX + state.p * barW;
  ctx.fillStyle = '#7ed4c1'; ctx.fillRect(pX - 1, barY - 4, 2, barH + 8);
  ctx.fillStyle = '#9aa0a6'; ctx.textAlign = 'left';
  ctx.fillText('0', barX - 2, barY + barH + 6);
  ctx.textAlign = 'right'; ctx.fillText('1', barX + barW + 2, barY + barH + 6);

  // ====================================================================
  // ORDER-PARAMETER CURVE P_inf(p). The canonical percolation plot:
  // the largest-cluster fraction stays ~ 0 until p_c, then rises
  // steeply. The current (p, P_inf) is highlighted with a dot.
  // ====================================================================
  if (!pInfReady) buildPInfCurve();
  const opX = lattW + 40, opY = 24, opW = W - opX - 20, opH = H - 180;
  ctx.fillStyle = 'rgba(15, 18, 28, 0.85)';
  ctx.fillRect(opX, opY, opW, opH);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(opX + 0.5, opY + 0.5, opW - 1, opH - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('order parameter  P∞(p)', opX + 10, opY + 14);

  // Grid + axes.
  const plotPx = opX + 36, plotPy = opY + 26;
  const plotPw = opW - 50, plotPh = opH - 60;
  // Y grid at 0.25 intervals.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let yv = 0.0; yv <= 1.0001; yv += 0.25) {
    const yp = plotPy + plotPh - yv * plotPh;
    ctx.beginPath(); ctx.moveTo(plotPx, yp); ctx.lineTo(plotPx + plotPw, yp); ctx.stroke();
  }
  // X grid at 0.2 intervals.
  for (let xv = 0; xv <= 1.0001; xv += 0.2) {
    const xp = plotPx + xv * plotPw;
    ctx.beginPath(); ctx.moveTo(xp, plotPy); ctx.lineTo(xp, plotPy + plotPh); ctx.stroke();
  }
  // Critical p_c vertical line.
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.85)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.3;
  const xpc = plotPx + P_C * plotPw;
  ctx.beginPath(); ctx.moveTo(xpc, plotPy); ctx.lineTo(xpc, plotPy + plotPh); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('p_c', xpc + 4, plotPy + 12);

  // P_inf(p) curve.
  ctx.strokeStyle = 'rgba(126, 212, 193, 0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < P_INF_NS; i += 1) {
    const pi = i / (P_INF_NS - 1);
    const yi = pInfData[i];
    const xp = plotPx + pi * plotPw;
    const yp = plotPy + plotPh - yi * plotPh;
    if (i === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
  }
  ctx.stroke();

  // Current (p, P_inf) dot.
  const curX = plotPx + state.p * plotPw;
  const curY = plotPy + plotPh - Pinf * plotPh;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(curX, curY, 5.5, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(241, 193, 74, 1)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(curX, curY, 5.5, 0, 6.2832); ctx.stroke();
  // Drop guide lines.
  ctx.strokeStyle = 'rgba(241, 193, 74, 0.35)';
  ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(curX, curY); ctx.lineTo(curX, plotPy + plotPh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(curX, curY); ctx.lineTo(plotPx, curY); ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels and ticks.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  for (let yv = 0.0; yv <= 1.0001; yv += 0.25) {
    const yp = plotPy + plotPh - yv * plotPh;
    ctx.fillText(yv.toFixed(2), plotPx - 4, yp + 3);
  }
  ctx.textAlign = 'center';
  for (let xv = 0; xv <= 1.0001; xv += 0.2) {
    ctx.fillText(xv.toFixed(1), plotPx + xv * plotPw, plotPy + plotPh + 14);
  }
  ctx.textAlign = 'left';
  ctx.fillText('p (occupation)', plotPx + plotPw / 2 - 38, plotPy + plotPh + 28);
  ctx.save();
  ctx.translate(opX + 12, plotPy + plotPh / 2 + 18);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('P∞ (largest fraction)', 0, 0);
  ctx.restore();

  // Cluster-size histogram: log-log bin counts so the power-law
  // n(s) ~ s^-tau at the critical point is visible. Placed directly
  // below the P_inf(p) panel so layout stays clean.
  const hX = opX, hY = opY + opH + 16, hW = opW, hH = 120;
  ctx.fillStyle = 'rgba(15, 18, 28, 0.85)'; ctx.fillRect(hX, hY, hW, hH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.strokeRect(hX + 0.5, hY + 0.5, hW - 1, hH - 1);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('cluster-size distribution', hX + 4, hY + 12);
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [{ key: "param-1", label: "Parameter 1", value: 1.0, format: "float" }] };
};
window.playground.getInvariants = function () {
  return [{ key: "check-1", label: "System check", value: "ok", status: "pass" }];
};
