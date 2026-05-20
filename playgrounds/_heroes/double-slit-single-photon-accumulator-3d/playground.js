// Double-slit single-photon accumulator. Canvas2D side-view of the
// source, slit barrier, and detector screen, with each photon's flight
// path briefly visible. The detector accumulates hits as a 1D
// histogram below, with the closed-form sinc^2 cos^2 intensity
// overlaid in yellow.

import { intensity, samplePhoton, fringeSpacing } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rN = document.getElementById('readout-n');
const rFring = document.getElementById('readout-fring');
const rDLam = document.getElementById('readout-dlambda');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sLam = document.getElementById('slider-lam'), vLam = document.getElementById('value-lam');
const sRate = document.getElementById('slider-rate'), vRate = document.getElementById('value-rate');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const D_screen = 10;             // distance to detector (world units)
const Y_HALF = 4;                // detector y-extent (+/- Y_HALF)

const st = {
  d: 0.6, a: 0.12, lambda: 0.40, rate: 20,
  running: !prefersReducedMotion(),
  nPhotons: 0, NBINS: 120, hist: null,
  lastFlights: [],     // recent in-flight photons for the flash animation
};
st.hist = new Uint32Array(st.NBINS);

let _seed = 0xC0FFEE;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return ((_seed >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
}

function emitPhoton() {
  const opts = { d: st.d, a: st.a, lambda: st.lambda, D: D_screen, yRange: Y_HALF };
  const y = samplePhoton(rand, opts);
  // Histogram
  const bin = Math.floor((y / Y_HALF + 1) * 0.5 * st.NBINS);
  if (bin >= 0 && bin < st.NBINS) st.hist[bin] += 1;
  st.nPhotons += 1;
  // Add a brief flight indicator
  st.lastFlights.push({ y, age: 0 });
  if (st.lastFlights.length > 40) st.lastFlights.shift();
}

const SRC_X = 80;
const SLIT_X = 280;
const SCR_X = 740;

function w2sX(worldX) {
  // worldX = 0 at source, D_screen at detector
  return SRC_X + (worldX / D_screen) * (SCR_X - SRC_X);
}
function w2sY(worldY) {
  // worldY in [-Y_HALF, Y_HALF] maps to a centered band on canvas
  const cy = 270;
  const halfH = 200;
  return cy - (worldY / Y_HALF) * halfH;
}

function drawBarrier() {
  // Slit barrier at SLIT_X
  ctx.fillStyle = '#1a1f30';
  ctx.fillRect(SLIT_X - 6, 50, 12, H - 100);
  // Cut two slits at +/- d/2.
  const dPix = (st.d / Y_HALF) * 200;
  const aPix = Math.max(2, (st.a / Y_HALF) * 200);
  ctx.fillStyle = '#060608';
  ctx.fillRect(SLIT_X - 6, w2sY(st.d / 2) - aPix / 2, 12, aPix);
  ctx.fillRect(SLIT_X - 6, w2sY(-st.d / 2) - aPix / 2, 12, aPix);
  // Outline
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(SLIT_X - 6, 50, 12, H - 100);
  // Labels
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`d = ${st.d.toFixed(2)}`, SLIT_X + 16, w2sY(0));
}

function drawSource() {
  // Source on the left
  const cx = SRC_X, cy = w2sY(0);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
  g.addColorStop(0, 'rgba(255, 230, 130, 0.9)');
  g.addColorStop(1, 'rgba(255, 230, 130, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI); ctx.fill();
  // "photon" label
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('photon source', cx, cy + 36);
}

function drawScreen() {
  // Detector strip
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(SCR_X, 50, 8, H - 100);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.strokeRect(SCR_X + 0.5, 50.5, 7, H - 101);
  // Recent photon hits as bright pixels on the strip
  for (const f of st.lastFlights) {
    const y = w2sY(f.y);
    const a = Math.max(0, 1 - f.age / 30);
    ctx.fillStyle = `rgba(255, 255, 220, ${a.toFixed(3)})`;
    ctx.fillRect(SCR_X + 1, y - 1, 6, 2);
  }
  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('detector', SCR_X + 4, H - 60);
}

function drawFlightPaths() {
  ctx.strokeStyle = 'rgba(255, 255, 220, 0.20)';
  ctx.lineWidth = 0.8;
  for (const f of st.lastFlights) {
    f.age += 1;
    const a = Math.max(0, 1 - f.age / 30);
    if (a < 0.02) continue;
    ctx.strokeStyle = `rgba(255, 255, 220, ${(0.2 * a).toFixed(3)})`;
    // Path: source -> nearest slit -> hit
    const sx = SRC_X, sy = w2sY(0);
    const slitY = (Math.abs(f.y - st.d / 2) < Math.abs(f.y + st.d / 2)) ? st.d / 2 : -st.d / 2;
    const mx = SLIT_X, my = w2sY(slitY);
    const ex = SCR_X, ey = w2sY(f.y);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}

function drawHistogramAndOverlay() {
  // Bottom strip: histogram bars and intensity overlay.
  const hX = 60, hY = H - 30, hW = W - 120, hH = 90;
  // Background
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(hX, hY - hH, hW, hH);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(hX + 0.5, hY - hH + 0.5, hW - 1, hH - 1);

  // Histogram: counts -> bar heights
  let maxCount = 1;
  for (let k = 0; k < st.NBINS; k += 1) if (st.hist[k] > maxCount) maxCount = st.hist[k];
  for (let k = 0; k < st.NBINS; k += 1) {
    const c = st.hist[k];
    const x0 = hX + (k / st.NBINS) * hW;
    const x1 = hX + ((k + 1) / st.NBINS) * hW;
    const bh = (c / maxCount) * hH;
    ctx.fillStyle = 'rgba(220, 220, 240, 0.65)';
    ctx.fillRect(x0, hY - bh, Math.max(1, x1 - x0 - 0.5), bh);
  }

  // Intensity overlay: closed-form profile (scaled to same max).
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const NPTS = 200;
  for (let i = 0; i <= NPTS; i += 1) {
    const y = -Y_HALF + (i / NPTS) * 2 * Y_HALF;
    const I = intensity(y, { d: st.d, a: st.a, lambda: st.lambda, D: D_screen });
    const px = hX + (i / NPTS) * hW;
    const py = hY - I * hH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('detector histogram vs Fraunhofer intensity profile', hX + 6, hY - hH + 14);
  ctx.textAlign = 'right';
  ctx.fillText(`N = ${st.nPhotons}`, hX + hW - 6, hY - hH + 14);
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Tracks (drawn first so they sit behind everything)
  drawFlightPaths();
  drawBarrier();
  drawSource();
  drawScreen();
  drawHistogramAndOverlay();

  // Top label band
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`fringe spacing Δy = λ D / d = ${fringeSpacing(st.d, st.lambda, D_screen).toFixed(2)}`, 24, 22);
  ctx.fillText(`a = ${st.a.toFixed(2)}    d = ${st.d.toFixed(2)}    λ = ${st.lambda.toFixed(2)}    D = ${D_screen}`, 24, 40);

  rN.textContent = String(st.nPhotons);
  rFring.textContent = fringeSpacing(st.d, st.lambda, D_screen).toFixed(2);
  rDLam.textContent = (st.d / st.lambda).toFixed(1);
}

function tick() {
  if (st.running) {
    for (let i = 0; i < st.rate; i += 1) emitPhoton();
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vD.textContent = st.d.toFixed(2);
  vA.textContent = st.a.toFixed(2);
  vLam.textContent = st.lambda.toFixed(2);
  vRate.textContent = String(st.rate);
}

function resetHistogram() {
  st.hist = new Uint32Array(st.NBINS);
  st.nPhotons = 0;
  st.lastFlights.length = 0;
}

sD.addEventListener('input', () => { st.d = parseFloat(sD.value); resetHistogram(); syncLabels(); });
sA.addEventListener('input', () => { st.a = parseFloat(sA.value); resetHistogram(); syncLabels(); });
sLam.addEventListener('input', () => { st.lambda = parseFloat(sLam.value); resetHistogram(); syncLabels(); });
sRate.addEventListener('input', () => { st.rate = parseInt(sRate.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.d = 0.6; st.a = 0.12; st.lambda = 0.40; st.rate = 20;
  sD.value = '0.6'; sA.value = '0.12'; sLam.value = '0.40'; sRate.value = '20';
  _seed = 0xC0FFEE;
  resetHistogram(); syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { d: st.d, a: st.a, lambda: st.lambda }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.d) { st.d = parseFloat(s.d); sD.value = String(st.d); }
  if (s.a) { st.a = parseFloat(s.a); sA.value = String(st.a); }
  if (s.lambda) { st.lambda = parseFloat(s.lambda); sLam.value = String(st.lambda); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Accumulate photons proportional to capture fraction to show the
    // fringes emerging.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const N = Math.round(50 + f * 4000);
    for (let i = 0; i < N; i += 1) emitPhoton();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
