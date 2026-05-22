import { fontString } from '../../../shared/js/canvas-type.js';
// Maximum-entropy zoo, made interactive. Samples rain from the chosen
// maximum-entropy distribution and pile into a histogram that converges
// to the analytic pdf (now a diagnostic overlay, not the main object).
// The "added structure" control morphs in a competing density with the
// same support: it is visibly lumpier and its entropy drops below the
// maximum, which is the whole point of the principle. Numerics in
// sim.js. Reference: MacKay 2003, Sec. 22.2; Cover and Thomas 2006,
// Sec. 12.1.
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  pdf, analyticEntropy, numericEntropy, gridX, chooseSupport, CONSTRAINTS,
  structuredPdf, sampleFamily,
} from './sim.js';

const urlParams = new URLSearchParams(location.search);
const SEED = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selFamily = document.getElementById('select-family');
const sliderMu = document.getElementById('slider-mu');
const sliderScale = document.getElementById('slider-scale');
const sliderSupp = document.getElementById('slider-supp');
const valueMu = document.getElementById('value-mu');
const valueScale = document.getElementById('value-scale');
const valueSupp = document.getElementById('value-supp');
const rowMu = document.getElementById('row-mu');
const rowSigma = document.getElementById('row-sigma');
const rowSupport = document.getElementById('row-support');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const NMAX = 4000, BINS = 64;
// Track h_empirical(n) as samples accumulate so the diagnostic plot
// (entropy convergence) can be drawn. We sample at n increments to
// keep the time-series tractable; analyticEntropy and numericEntropy
// give the target/struct entropy levels.
const ENTROPY_HISTORY_MAX = 240;
const entropyHistory = [];
let lastEntropyN = -1;
const state = { family: 'gaussian', mu: 0, scale: 1.0, struct: 0, n: 0 };
let samples = new Float64Array(0), running = true;

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const ACCENT = cssVar('--accent', '#5bc0eb'), WARM = cssVar('--accent-warm', '#f5a35b');

function paramsFor() {
  switch (state.family) {
    case 'gaussian': return { mu: state.mu, sigma: state.scale };
    case 'uniform': return { a: -state.scale, b: state.scale };
    case 'exponential': return { mean: state.scale };
    case 'laplace': return { mu: state.mu, b: state.scale };
    default: throw new Error();
  }
}
function showRows() {
  rowMu.style.display = (state.family === 'gaussian' || state.family === 'laplace') ? '' : 'none';
  rowSigma.style.display = '';
  rowSupport.style.display = '';                 // "added structure": always available
}
function resample() {
  samples = sampleFamily(state.family, paramsFor(), NMAX, SEED);
  state.n = 0;
}

// Compute the empirical entropy of the current histogram in nats. We
// add Laplace smoothing (+ 0.5 per bin) so an empty bin doesn't break
// the log; for converged samples this is negligible.
function empiricalEntropyNats(samples, n, xmin, xmax) {
  if (n <= 1) return null;
  const hist = new Float64Array(BINS);
  const dx = (xmax - xmin) / BINS;
  for (let i = 0; i < n; i += 1) {
    const b = Math.floor((samples[i] - xmin) / (xmax - xmin) * BINS);
    if (b >= 0 && b < BINS) hist[b] += 1;
  }
  // Convert to density per bin, plus tiny smoothing.
  let S = 0;
  for (let b = 0; b < BINS; b += 1) {
    const p = (hist[b] + 0.5) / (n + 0.5 * BINS) / dx;     // density
    if (p > 0) S -= p * Math.log(p) * dx;
  }
  return S;
}

function drawAll() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  // Reserved row at the bottom for the entropy-convergence diagnostic.
  const DIAG_H = 86;
  const X0 = 56, X1 = W - 56, Y0 = 54, Y1 = H - 78 - DIAG_H;
  const xs = gridX(state.family), params = paramsFor();
  const pMax = pdf(state.family, params, xs);
  const pStr = state.struct > 0 ? structuredPdf(state.family, params, xs, state.struct) : null;
  const { xmin, xmax } = chooseSupport(state.family);

  let yMax = 0;
  for (let i = 0; i < pMax.length; i += 1) if (pMax[i] > yMax) yMax = pMax[i];
  if (pStr) for (let i = 0; i < pStr.length; i += 1) if (pStr[i] > yMax) yMax = pStr[i];
  yMax = yMax > 0 ? yMax * 1.25 : 1;
  const toPx = (x, y) => ({ px: X0 + (X1 - X0) * (x - xmin) / (xmax - xmin), py: Y1 - (Y1 - Y0) * (y / yMax) });

  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
  if (xmin <= 0 && xmax >= 0) { const z = toPx(0, 0); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(z.px, Y0); ctx.lineTo(z.px, Y1); ctx.stroke(); }

  // accumulated-sample histogram (the primary object: empirical draws)
  const hist = new Int32Array(BINS);
  for (let i = 0; i < state.n; i += 1) {
    const b = Math.floor((samples[i] - xmin) / (xmax - xmin) * BINS);
    if (b >= 0 && b < BINS) hist[b] += 1;
  }
  let hmaxCount = 1; for (let b = 0; b < BINS; b += 1) if (hist[b] > hmaxCount) hmaxCount = hist[b];
  const binW = (X1 - X0) / BINS;
  // scale the histogram so a converged sample matches the pdf height
  const histScale = (state.n > 50) ? (yMax * 0.80) / ((hmaxCount / state.n) * BINS / (xmax - xmin)) : (Y1 - Y0) / hmaxCount * 0.8;
  for (let b = 0; b < BINS; b += 1) {
    if (hist[b] === 0) continue;
    const dens = hist[b] / state.n * BINS / (xmax - xmin);
    const hpx = state.n > 50 ? (Y1 - Y0) * (dens / yMax) : hist[b] * histScale;
    ctx.fillStyle = 'rgba(120,170,215,0.45)';
    ctx.fillRect(X0 + b * binW + 1, Y1 - hpx, binW - 2, hpx);
  }

  // analytic max-entropy pdf (diagnostic overlay)
  ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i < xs.length; i += 1) { const q = toPx(xs[i], pMax[i]); i === 0 ? ctx.moveTo(q.px, q.py) : ctx.lineTo(q.px, q.py); }
  ctx.stroke();
  if (pStr) {
    ctx.strokeStyle = WARM; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
    for (let i = 0; i < xs.length; i += 1) { const q = toPx(xs[i], pStr[i]); i === 0 ? ctx.moveTo(q.px, q.py) : ctx.lineTo(q.px, q.py); }
    ctx.stroke(); ctx.setLineDash([]);
  }

  // a few in-flight samples dropping into the histogram (liveliness)
  if (running && !CAPTURE_NAME && state.n > 0) {
    ctx.fillStyle = '#ffe46b';
    for (let q = 0; q < 7; q += 1) {
      const idx = (state.n + q * 137) % NMAX, xv = samples[idx];
      const px = X0 + (X1 - X0) * (xv - xmin) / (xmax - xmin);
      const f = ((state.n * 0.05) + q / 7) % 1;
      ctx.beginPath(); ctx.arc(px, Y0 + 6 + f * (Y1 - Y0 - 12), 2.6, 0, 6.2832); ctx.fill();
    }
  }

  // x ticks
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i += 1) { const x = xmin + (xmax - xmin) * (i / 5); ctx.fillText(x.toFixed(1), toPx(x, 0).px, Y1 + 16); }

  // title + constraint
  const titleMap = { gaussian: 'Gaussian  (support R, fixed mean and variance)', uniform: 'Uniform  (support [a, b], no moment constraint)', exponential: 'Exponential  (support [0, infty), fixed mean)', laplace: 'Laplace  (support R, fixed mean and E|X - mu|)' };
  ctx.font = fontString(canvas, 'body'); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'left';
  ctx.fillText(titleMap[state.family], X0, Y0 - 28);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${CONSTRAINTS[state.family]}    -    drawn samples: ${state.n}`, X0, Y1 + 40);

  // entropy comparison panel: max-ent vs the structured competitor
  const hMax = analyticEntropy(state.family, params);
  const hCur = pStr ? numericEntropy(pStr, xs) : hMax;
  const bx = X1 - 246, by = Y0 + 8, bw = 238, bh = 86;
  ctx.fillStyle = 'rgba(8,10,16,0.74)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.strokeRect(bx, by, bw, bh);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = ACCENT; ctx.fillText(`max entropy  h* = ${hMax.toFixed(3)} nats`, bx + 10, by + 20);
  ctx.fillStyle = WARM; ctx.fillText(`this density  h  = ${hCur.toFixed(3)} nats`, bx + 10, by + 38);
  const span = Math.max(0.5, Math.abs(hMax) + 1);
  const barW = bw - 20;
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(bx + 10, by + 50, barW, 8);
  ctx.fillStyle = ACCENT; ctx.fillRect(bx + 10, by + 50, barW, 8);
  ctx.fillStyle = WARM; ctx.fillRect(bx + 10, by + 50, barW * Math.max(0, Math.min(1, (hCur + span / 2) / span)) / ((hMax + span / 2) / span), 8);
  ctx.fillStyle = state.struct > 0 ? WARM : ACCENT; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(state.struct > 0 ? `structure costs ${(hMax - hCur).toFixed(3)} nats` : 'the least-committal choice', bx + 10, by + 76);

  // ======================================================================
  // DIAGNOSTIC: empirical-entropy convergence (S vs samples drawn).
  // ======================================================================
  if (state.n !== lastEntropyN) {
    const S_emp = empiricalEntropyNats(samples, state.n, xmin, xmax);
    if (S_emp !== null) {
      entropyHistory.push({ n: state.n, S: S_emp });
      if (entropyHistory.length > ENTROPY_HISTORY_MAX) entropyHistory.shift();
    }
    lastEntropyN = state.n;
  }
  const dy0 = Y1 + 62, dy1 = H - 22;
  ctx.fillStyle = 'rgba(8, 10, 16, 0.74)'; ctx.fillRect(X0, dy0, X1 - X0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'; ctx.strokeRect(X0 + 0.5, dy0 + 0.5, X1 - X0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.82)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('empirical entropy S vs samples drawn  (converges to h*)', X0 + 6, dy0 + 14);
  // y range: between min(hMax, hCur) - 0.5 and max(hMax) + 0.5
  const sMin = Math.min(hMax, hCur) - 0.5;
  const sMax = Math.max(hMax, hCur) + 0.5;
  const xPlot0 = X0 + 36, xPlot1 = X1 - 16;
  const yPlot0 = dy0 + 22, yPlot1 = dy1 - 8;
  function xForN(n) { return xPlot0 + (xPlot1 - xPlot0) * Math.min(1, n / NMAX); }
  function yForS(s) { return yPlot1 - (yPlot1 - yPlot0) * (s - sMin) / Math.max(0.01, sMax - sMin); }
  // h* target line.
  ctx.strokeStyle = ACCENT; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(xPlot0, yForS(hMax)); ctx.lineTo(xPlot1, yForS(hMax)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ACCENT; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`h* = ${hMax.toFixed(3)}`, xPlot1 - 80, yForS(hMax) - 4);
  // Structured-density entropy line (if structure > 0).
  if (pStr) {
    ctx.strokeStyle = WARM; ctx.setLineDash([2, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(xPlot0, yForS(hCur)); ctx.lineTo(xPlot1, yForS(hCur)); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Empirical S curve.
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.95)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < entropyHistory.length; i += 1) {
    const p = entropyHistory[i];
    const x = xForN(p.n), y = yForS(p.S);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Axis ticks.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.70)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  ctx.fillText(sMin.toFixed(2), xPlot0 - 4, yPlot1 + 3);
  ctx.fillText(sMax.toFixed(2), xPlot0 - 4, yPlot0 + 3);
  ctx.textAlign = 'center';
  ctx.fillText('0', xPlot0, yPlot1 + 12);
  ctx.fillText(`${NMAX}`, xPlot1, yPlot1 + 12);
  ctx.fillText('samples n', (xPlot0 + xPlot1) / 2, yPlot1 + 12);
  ctx.textAlign = 'left';
}

function syncLabels() {
  valueMu.textContent = state.mu.toFixed(2);
  valueScale.textContent = state.scale.toFixed(2);
  valueSupp.textContent = state.struct.toFixed(2);
}
function resetEntropy() { entropyHistory.length = 0; lastEntropyN = -1; }
selFamily.addEventListener('change', () => { state.family = selFamily.value; showRows(); resetEntropy(); resample(); drawAll(); });
sliderMu.addEventListener('input', () => { state.mu = parseFloat(sliderMu.value); valueMu.textContent = state.mu.toFixed(2); resetEntropy(); resample(); drawAll(); });
sliderScale.addEventListener('input', () => { state.scale = parseFloat(sliderScale.value); valueScale.textContent = state.scale.toFixed(2); resetEntropy(); resample(); drawAll(); });
sliderSupp.addEventListener('input', () => { state.struct = parseFloat(sliderSupp.value); valueSupp.textContent = state.struct.toFixed(2); drawAll(); });
if (btnPlayPause) btnPlayPause.addEventListener('click', () => {
  running = !running; btnPlayPause.textContent = running ? 'Pause' : 'Play'; btnPlayPause.setAttribute('aria-pressed', String(!running));
  if (running) resample();
});

function tick() {
  if (running && !CAPTURE_NAME && state.n < NMAX) { state.n = Math.min(NMAX, state.n + 22); drawAll(); }
  requestAnimationFrame(tick);
}
function bootSync() {
  showRows(); syncLabels();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const fams = ['gaussian', 'uniform', 'exponential', 'laplace', 'gaussian'];
    state.family = fams[Math.min(fams.length - 1, Math.round(frac * (fams.length - 1)))];
    selFamily.value = state.family;
    if (frac === 1.0) { state.struct = 0.6; sliderSupp.value = '0.6'; }      // last frame shows the principle
    showRows(); syncLabels(); resample(); state.n = NMAX; drawAll();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
    }));
    return;
  }
  resample(); drawAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const fam = family;
  const xs = gridX(fam);
  const p = pdf(fam, params, xs);
  const h_analytic = analyticEntropy(fam, params);
  return {
    fields: [
      { key: 'distribution-family', label: 'maxent family', value: fam, format: undefined },
      { key: 'sample-count', label: 'samples collected', value: samples.length, format: 'float' },
      { key: 'entropy-analytic', label: 'differential entropy H (nats)', value: h_analytic, format: 'float' },
      { key: 'entropy-numeric', label: 'entropy from current samples', value: numericEntropy(xs, p), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const fam = family;
  const h_a = analyticEntropy(fam, params);
  // Entropy must be non-negative (nats)
  inv.push({
    key: 'entropy-nonneg',
    label: 'H(p) >= 0 (nats)',
    value: h_a.toFixed(3),
    status: h_a >= -1e-10 ? 'pass' : 'drift'
  });
  // Structured distribution (added lumpiness) must have lower entropy
  const xs = gridX(fam);
  const p_max = pdf(fam, params, xs);
  const p_struct = structuredPdf(fam, params, xs);
  const h_max = numericEntropy(xs, p_max);
  const h_struct = numericEntropy(xs, p_struct);
  const rel_diff = (h_max - h_struct) / Math.max(Math.abs(h_max), 1e-10);
  inv.push({
    key: 'maxent-principle',
    label: 'H(structured) < H(maxent)',
    value: rel_diff.toFixed(3),
    status: rel_diff > -0.01 ? 'pass' : 'drift'
  });
  return inv;
};
