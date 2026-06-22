// Gaia parallaxes: distance, the inversion bias, and extinction. A measured
// parallax is noisy; inverting it (d = 1/pi) is biased and skewed once the
// fractional error is not small. The top panel runs a live Monte Carlo of the
// naive estimator (sampling pi and inverting) against the proper Bayesian
// posterior with a distance prior; the middle panel propagates the distance to
// an absolute magnitude and shows how neglecting extinction misplaces the star;
// the bottom panel sweeps the fractional error to show when the bias matters.
// Canvas2D only. Data: real Gaia DR3 stars (no fabricated values).
//
// References: Bailer-Jones 2015, PASP 127, 994; Luri et al. 2018, A&A 616, A9.

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { naiveDistanceKpc, posterior, sampleNaive, distanceModulus, absMagG, priorEDSD, priorFlat, likelihood } from './sim.js';
import { GAIA_STARS } from './data-stars.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sPlx = document.getElementById('slider-plx'), vPlx = document.getElementById('value-plx');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const btnPrior = document.getElementById('btn-prior'), vPrior = document.getElementById('value-prior');
const btnStar = document.getElementById('btn-star'), vStar = document.getElementById('value-star');
const btnPlay = document.getElementById('btn-playpause'), btnReset = document.getElementById('btn-reset');

// deterministic RNG for the Monte Carlo (seeded; varies per draw).
let rngS = 0x2545f491 >>> 0;
function rnd() { rngS = (Math.imul(rngS, 1664525) + 1013904223) >>> 0; return (rngS >>> 8) / 16777216; }

const st = { plx: 0.5, f: 0.25, prior: 'edsd', L: 1.35, star: 0, G: 12, aG: 0.4, bprp: 1.2 };
let running = !DETERMINISTIC;
const NBIN = 80;
let hist = new Float64Array(NBIN), histMax = 0, nSamp = 0, histDmax = 8;

function sigma() { return st.f * st.plx; }
// Reset the Monte Carlo and lock the histogram range to the current posterior, so
// draws are always binned against the same distance axis the panel is drawn with.
function resetMC() { hist = new Float64Array(NBIN); histMax = 0; nSamp = 0; histDmax = plotDmax(currentPost()); }

function applyStar(i) {
  const s = GAIA_STARS[((i % GAIA_STARS.length) + GAIA_STARS.length) % GAIA_STARS.length];
  st.star = ((i % GAIA_STARS.length) + GAIA_STARS.length) % GAIA_STARS.length;
  st.plx = s[0]; st.f = Math.min(0.6, Math.max(0.01, s[1] / s[0])); st.aG = s[3] == null ? 0 : s[3]; st.G = s[4]; st.bprp = s[5] == null ? 1.2 : s[5];
  sPlx.value = String(st.plx); sF.value = String(st.f);
  resetMC();
}

let view = { w: 820, h: 1180, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'post', weight: 1.25 }, { name: 'mag', weight: 0.72 }, { name: 'bias', weight: 0.72 }]);
}
function syncVals() {
  vPlx.textContent = `${st.plx.toFixed(3)} mas`; vF.textContent = `${(st.f * 100).toFixed(0)} %`;
  vL.textContent = `${st.L.toFixed(2)} kpc`; vPrior.textContent = st.prior === 'edsd' ? 'EDSD (Bailer-Jones)' : 'flat in distance';
  vStar.textContent = `#${st.star + 1} of ${GAIA_STARS.length}`;
}
sPlx.addEventListener('input', () => { st.plx = parseFloat(sPlx.value); resetMC(); syncVals(); });
sF.addEventListener('input', () => { st.f = parseFloat(sF.value); resetMC(); syncVals(); });
sL.addEventListener('input', () => { st.L = parseFloat(sL.value); resetMC(); syncVals(); });
btnPrior.addEventListener('click', () => { st.prior = st.prior === 'edsd' ? 'flat' : 'edsd'; resetMC(); syncVals(); });
btnStar.addEventListener('click', () => { applyStar(st.star + 1); syncVals(); });
btnReset.addEventListener('click', () => { applyStar(0); st.prior = 'edsd'; st.L = 1.35; sL.value = '1.35'; running = true; btnPlay.textContent = 'Pause'; syncVals(); });
btnPlay.addEventListener('click', () => { running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running)); });

function colors() {
  return { bg: '#06070c', panel: '#0a0c12', fg: '#e8e8e8', muted: '#9aa0a6', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)', mc: 'rgba(91,155,213,0.55)', post: '#ffd166', naive: '#ef5466', median: '#67d98c', dust: '#c98a4a', star: '#ffe39a' };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
}

function currentPost() { return posterior(st.plx, sigma(), { mode: st.prior, L: st.L }); }

// Adaptive distance-axis upper bound: the 98th percentile of the posterior, framed
// with the naive estimate. A sharp nearby posterior then fills the panel instead of
// hugging the far left, while a broad high-error posterior still shows its skewed tail.
function plotDmax(post) {
  const dd = post.d[1] - post.d[0]; let cum = 0, p98 = post.d[post.d.length - 1];
  for (let i = 0; i < post.d.length; i += 1) { cum += post.p[i] * dd; if (cum >= 0.98) { p98 = post.d[i]; break; } }
  const naive = naiveDistanceKpc(st.plx);
  return Math.min(60, Math.max(0.05, p98 * 1.18, post.hi * 1.25, naive > 0 && Number.isFinite(naive) ? naive * 1.4 : 0));
}
// A round tick step giving ~5 ticks across the range.
function niceStep(range) {
  const raw = range / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

function drawPosterior(col, r, post) {
  panel(col, r, 'Distance from a noisy parallax: naive inversion (histogram) vs the Bayesian posterior');
  const pad = { l: 16, r: 16, t: 26, b: 34 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const dMax = histDmax;
  const xOf = (d) => box.x + Math.min(1, d / dMax) * box.w;
  ctx.save(); clipTo(ctx, box);
  // Monte Carlo histogram of the naive 1/pi estimator.
  if (histMax > 0) {
    ctx.fillStyle = col.mc;
    for (let b = 0; b < NBIN; b += 1) {
      const h = hist[b] / histMax; if (h <= 0) continue;
      const x0 = box.x + (b / NBIN) * box.w, w = box.w / NBIN;
      ctx.fillRect(x0, box.y + box.h - h * box.h, w, h * box.h);
    }
  }
  // prior and likelihood shapes (each normalised to its own peak) so the update
  // posterior = prior x likelihood is visible: the gold posterior is their product.
  const pri = post.d.map((d) => (st.prior === 'flat' ? priorFlat() : priorEDSD(d, st.L)));
  const lik = post.d.map((d) => likelihood(st.plx, sigma(), d));
  let priMax = 0; for (const v of pri) if (v > priMax) priMax = v;
  let likMax = 0; for (const v of lik) if (v > likMax) likMax = v;
  const drawShape = (arr, mx, style, dash) => {
    if (mx <= 0) return;
    ctx.strokeStyle = style; ctx.lineWidth = 1.3; ctx.setLineDash(dash); ctx.beginPath();
    for (let i = 0; i < post.d.length; i += 1) { const X = xOf(post.d[i]), Y = box.y + box.h - (arr[i] / mx) * box.h * 0.84; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke(); ctx.setLineDash([]);
  };
  drawShape(pri, priMax, 'rgba(180,140,255,0.6)', [4, 3]);
  drawShape(lik, likMax, 'rgba(120,200,255,0.55)', [2, 3]);
  // analytic posterior curve (scaled to the box).
  let pMax = 0; for (const v of post.p) if (v > pMax) pMax = v;
  ctx.strokeStyle = col.post; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i < post.d.length; i += 1) { const X = xOf(post.d[i]), Y = box.y + box.h - (post.p[i] / pMax) * box.h * 0.96; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  // 68% credible band + median.
  ctx.fillStyle = 'rgba(103,217,140,0.16)'; ctx.fillRect(xOf(post.lo), box.y, xOf(post.hi) - xOf(post.lo), box.h);
  ctx.strokeStyle = col.median; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(xOf(post.median), box.y); ctx.lineTo(xOf(post.median), box.y + box.h); ctx.stroke();
  // naive 1/pi line.
  const dn = naiveDistanceKpc(st.plx);
  ctx.strokeStyle = col.naive; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(xOf(dn), box.y); ctx.lineTo(xOf(dn), box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  // axis + labels (adaptive tick step, so a zoomed-in nearby posterior is still legible).
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const step = niceStep(dMax), dec = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  for (let d = 0; d <= dMax + step * 0.01; d += step) ctx.fillText(d.toFixed(dec), xOf(d), box.y + box.h + 5);
  ctx.fillText('distance (kpc)', box.x + box.w / 2, box.y + box.h + 19);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.naive; ctx.fillText(`naive 1/ϖ = ${dn.toFixed(2)}`, box.x + 6, box.y + 4);
  ctx.fillStyle = col.median; ctx.fillText(`posterior ${post.median.toFixed(2)} (+${(post.hi - post.median).toFixed(2)}/-${(post.median - post.lo).toFixed(2)})`, box.x + 6, box.y + 18);
  ctx.fillStyle = col.mc; ctx.fillText(`Monte Carlo of 1/ϖ (${nSamp} draws)`, box.x + 6, box.y + 32);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(180,140,255,0.92)'; ctx.fillText('prior', box.x + box.w - 6, box.y + 4);
  ctx.fillStyle = 'rgba(120,200,255,0.92)'; ctx.fillText('likelihood', box.x + box.w - 6, box.y + 18);
  ctx.fillStyle = col.post; ctx.fillText('posterior = prior x likelihood', box.x + box.w - 6, box.y + 32);
}

function drawMag(col, r, post) {
  panel(col, r, 'Absolute magnitude M_G: the parallax error and the extinction both blur the luminosity');
  const pad = { l: 16, r: 16, t: 24, b: 30 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  // M_G from each distance-posterior sample (real G, real A_G).
  const mLo = absMagG(st.G, post.hi, st.aG), mHi = absMagG(st.G, post.lo, st.aG);   // far d -> brighter (smaller M)
  const mMed = absMagG(st.G, post.median, st.aG);
  const mNoExt = absMagG(st.G, post.median, 0);            // ignoring extinction (too faint)
  const lo = Math.min(mLo, mNoExt) - 0.6, hi = Math.max(mHi, mNoExt) + 0.6;
  const xOf = (m) => box.x + (m - lo) / (hi - lo) * box.w;
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
  // credible band in M_G (from the distance posterior).
  ctx.fillStyle = 'rgba(103,217,140,0.16)'; ctx.fillRect(xOf(mLo), box.y + 6, xOf(mHi) - xOf(mLo), box.h - 12);
  ctx.strokeStyle = col.median; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xOf(mMed), box.y + 6); ctx.lineTo(xOf(mMed), box.y + box.h - 6); ctx.stroke();
  // marker for ignoring extinction.
  ctx.strokeStyle = col.dust; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(xOf(mNoExt), box.y + 6); ctx.lineTo(xOf(mNoExt), box.y + box.h - 6); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let m = Math.ceil(lo); m <= hi; m += 1) ctx.fillText(`${m}`, xOf(m), box.y + box.h + 4);
  ctx.fillText('absolute magnitude M_G  (brighter ->)', box.x + box.w / 2, box.y + box.h + 16);
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.median; ctx.fillText(`M_G = ${mMed.toFixed(2)} (A_G = ${st.aG.toFixed(2)})`, box.x + 6, box.y + 4);
  ctx.fillStyle = col.dust; ctx.fillText(`ignoring extinction: ${mNoExt.toFixed(2)}`, box.x + 6, box.y + 18);
}

function drawBias(col, r) {
  panel(col, r, 'When does the bias matter: posterior vs naive distance across fractional parallax error');
  const pad = { l: 44, r: 14, t: 24, b: 30 };
  const box = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const fMax = 0.6;
  const samples = [];
  for (let i = 0; i <= 60; i += 1) { const f = fMax * i / 60; const p = posterior(st.plx, Math.max(1e-4, f * st.plx), { mode: st.prior, L: st.L }); samples.push({ f, rel: (p.median - naiveDistanceKpc(st.plx)) / naiveDistanceKpc(st.plx) }); }
  let amax = 0.05; for (const s of samples) amax = Math.max(amax, Math.abs(s.rel)); amax *= 1.15;
  const xOf = (f) => box.x + f / fMax * box.w;
  const yOf = (rel) => box.y + box.h / 2 - rel / amax * (box.h / 2);
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(box.x, yOf(0)); ctx.lineTo(box.x + box.w, yOf(0)); ctx.stroke();
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(`+${(amax * 100).toFixed(0)}%`, box.x - 4, box.y + 6); ctx.fillText('0', box.x - 4, yOf(0)); ctx.fillText(`-${(amax * 100).toFixed(0)}%`, box.x - 4, box.y + box.h - 6);
  ctx.strokeStyle = col.post; ctx.lineWidth = 2.2; ctx.beginPath(); samples.forEach((s, i) => { const X = xOf(s.f), Y = yOf(s.rel); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  // current f marker + 20% guide.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xOf(st.f), box.y); ctx.lineTo(xOf(st.f), box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(239,84,102,0.5)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xOf(0.2), box.y); ctx.lineTo(xOf(0.2), box.y + box.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const f of [0, 0.2, 0.4, 0.6]) ctx.fillText(`${(f * 100).toFixed(0)}`, xOf(f), box.y + box.h + 4);
  ctx.fillText('fractional parallax error sigma/ϖ (%)', box.x + box.w / 2, box.y + box.h + 16);
  ctx.textAlign = 'left'; ctx.fillStyle = col.post; ctx.fillText('(posterior - naive) / naive', box.x + 6, box.y + 4);
}

function advance() {
  for (let k = 0; k < 25; k += 1) {
    const d = sampleNaive(st.plx, sigma(), rnd(), rnd());
    if (d == null || d <= 0) continue;
    nSamp += 1;                                   // every positive inversion counts
    const b = Math.floor(d / histDmax * NBIN);    // out-of-range draws (the heavy tail) are not binned, no edge spike
    if (b >= 0 && b < NBIN) { hist[b] += 1; if (hist[b] > histMax) histMax = hist[b]; }
  }
}
function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  const post = currentPost();
  histDmax = plotDmax(post);
  drawPosterior(col, REG.post, post); drawMag(col, REG.mag, post); drawBias(col, REG.bias);
}
function tick() { if (running) advance(); render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function boot() {
  applyStar(0);
  if (params.get('plx')) st.plx = parseFloat(params.get('plx'));
  if (params.get('f')) st.f = parseFloat(params.get('f'));
  if (params.get('prior') === 'flat') st.prior = 'flat';
  sPlx.value = String(st.plx); sF.value = String(st.f); resetMC();
  syncVals(); relayout();
  if (CAPTURE_NAME) {
    if (!params.get('plx')) { st.plx = 0.4; st.f = 0.3; sPlx.value = '0.4'; sF.value = '0.3'; }
    syncVals(); resetMC(); for (let i = 0; i < 160; i += 1) advance();
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); else { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const post = currentPost();
  return { fields: [
    { key: 'plx', label: 'parallax (mas)', value: st.plx, format: 'float' },
    { key: 'f', label: 'fractional error', value: st.f, format: 'float' },
    { key: 'naive', label: 'naive distance (kpc)', value: naiveDistanceKpc(st.plx), format: 'float' },
    { key: 'post', label: 'posterior distance (kpc)', value: post.median, format: 'float' },
    { key: 'aG', label: 'extinction A_G (mag)', value: st.aG, format: 'float' },
    { key: 'MG', label: 'absolute M_G', value: absMagG(st.G, post.median, st.aG), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const post = currentPost();
  const dd = post.d[1] - post.d[0];
  const area = post.p.reduce((s, v) => s + v * dd, 0);
  const naive = naiveDistanceKpc(st.plx);
  const corr = Math.abs(post.median - naive) / naive;
  return [
    { key: 'norm', label: 'posterior normalised', value: area.toFixed(3), status: Math.abs(area - 1) < 0.05 ? 'pass' : 'drift' },
    { key: 'ci', label: '68% interval brackets median', value: `${post.lo.toFixed(2)}-${post.hi.toFixed(2)}`, status: post.lo < post.median && post.hi > post.median ? 'pass' : 'drift' },
    { key: 'corr', label: 'Bayesian correction to 1/ϖ', value: `${(corr * 100).toFixed(0)} %`, status: 'pass' },
  ];
};
