// playground.js
// Shapiro time delay, shown as a RACE: two photons leave the emitter
// at the same instant. The reference photon travels as if spacetime
// were flat; the real photon's path dips into the Sun's potential
// well, where the coordinate speed of light (1 - 2M/r) is reduced, so
// it falls behind. The lag at the receiver is the Shapiro delay.
// Panels: animated ray race (top), delay-vs-b curve (bottom-left),
// accumulated-delay clock (bottom-right).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { shapiroDelay, shapiroDelayFull, M_GEOM } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderB      = document.getElementById('slider-b');
const sliderR      = document.getElementById('slider-r');
const sliderSpeed  = document.getElementById('slider-speed');
const valueB       = document.getElementById('value-b');
const valueR       = document.getElementById('value-r');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  b: 20,
  r: 1000,
  speed: 2,
  tau: 0,            // race clock
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

// =========================================================================
// PHOTON-PATH MODEL. The path runs from emitter (-r, b) to receiver
// (+r, b), bending toward the Sun near closest approach. We sample it
// and build two cumulative-time arrays:
//   tRef(s)   flat-spacetime travel time (path length / c)
//   tReal(s)  with the (1 + 2M/r) Shapiro factor folded in.
// =========================================================================
const NPATH = 400;
let pathCache = null;
function buildPath() {
  const r = state.r, b = state.b;
  // Path: a gentle curve. We use y(x) = b + bend(x) where bend pulls
  // the ray slightly toward the Sun near x = 0. The deflection scale
  // is exaggerated for visibility (the true deflection 4M/b is tiny).
  const xs = new Float64Array(NPATH);
  const ys = new Float64Array(NPATH);
  const rr = new Float64Array(NPATH);
  for (let i = 0; i < NPATH; i += 1) {
    const x = -r + (2 * r) * i / (NPATH - 1);
    // Visual bend: a Lorentzian dip toward the Sun, amplitude ~ 8 M.
    const bendAmp = 8 * M_GEOM;
    const bend = -bendAmp / (1 + (x / (3 * b)) ** 2);
    const y = b + bend;
    xs[i] = x; ys[i] = y;
    rr[i] = Math.sqrt(x * x + y * y);
  }
  // Cumulative times.
  const tRef = new Float64Array(NPATH);
  const tReal = new Float64Array(NPATH);
  for (let i = 1; i < NPATH; i += 1) {
    const ds = Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    tRef[i] = tRef[i - 1] + ds;
    // Coordinate light speed is reduced near the Sun: dt = ds (1 + 2M/r).
    const rMid = 0.5 * (rr[i] + rr[i - 1]);
    tReal[i] = tReal[i - 1] + ds * (1 + 2 * M_GEOM / Math.max(1, rMid));
  }
  pathCache = { xs, ys, rr, tRef, tReal, tRefTotal: tRef[NPATH - 1], tRealTotal: tReal[NPATH - 1] };
}

// Position along the path for a given cumulative-time value, using the
// chosen time array.
function posAtTime(tArr, tQuery) {
  const { xs, ys } = pathCache;
  if (tQuery >= tArr[NPATH - 1]) return { x: xs[NPATH - 1], y: ys[NPATH - 1], done: true };
  let lo = 0, hi = NPATH - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (tArr[mid] < tQuery) lo = mid; else hi = mid;
  }
  const dt = tArr[hi] - tArr[lo];
  const f = dt > 0 ? (tQuery - tArr[lo]) / dt : 0;
  return { x: xs[lo] + f * (xs[hi] - xs[lo]), y: ys[lo] + f * (ys[hi] - ys[lo]), done: false };
}

// =========================================================================
// RENDER.
// =========================================================================
function drawAll() {
  if (!pathCache) buildPath();
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const delay = shapiroDelay(state.r, state.r, state.b);
  const delayFull = shapiroDelayFull(state.r, state.r, state.b);

  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`b / M = ${state.b.toFixed(1)}   r_E = r_R = ${state.r.toFixed(0)} M`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`Δt = 2M ln(4r²/b²) = ${delay.toFixed(2)} M   (full Schwarzschild: ${delayFull.toFixed(2)} M)`, 30, 40);

  const padL = 30, padR = 30, PW = W - padL - padR;

  // ---- TOP: animated ray race ----
  const topY = 56, topH = 230;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, topY, PW, topH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, topY + 0.5, PW - 1, topH - 1);
  // World-to-screen for the ray sketch.
  const r = state.r;
  const sx = (x) => padL + 30 + (PW - 60) * (x + r) / (2 * r);
  const yScale = (topH - 80) / (state.b + 10 * M_GEOM);
  const cy = topY + topH - 46;       // y = 0 (Sun centre) line
  const sy = (y) => cy - y * yScale;
  // Sun.
  const sunX = sx(0), sunY = sy(0);
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 30);
  sunGlow.addColorStop(0, 'rgba(255, 230, 150, 1)');
  sunGlow.addColorStop(1, 'rgba(255, 230, 150, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath(); ctx.arc(sunX, sunY, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1d28a';
  ctx.beginPath(); ctx.arc(sunX, sunY, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Sun', sunX + 16, sunY + 4);
  // Reference (flat) path: straight line at y = b.
  ctx.strokeStyle = 'rgba(160, 170, 190, 0.45)';
  ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sx(-r), sy(state.b)); ctx.lineTo(sx(r), sy(state.b)); ctx.stroke();
  ctx.setLineDash([]);
  // Real (curved) path.
  ctx.strokeStyle = tok.accentCool; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < NPATH; i += 4) {
    const x = sx(pathCache.xs[i]), y = sy(pathCache.ys[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Emitter / receiver markers.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(sx(-r), sy(state.b), 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx(r), sy(pathCache.ys[NPATH - 1]), 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillText('emitter', sx(-r) + 8, sy(state.b) - 8);
  ctx.textAlign = 'right';
  ctx.fillText('receiver', sx(r) - 8, sy(pathCache.ys[NPATH - 1]) - 8);
  ctx.textAlign = 'left';
  // The two photons at the current race clock tau.
  const refP = posAtTime(pathCache.tRef, state.tau);
  const realP = posAtTime(pathCache.tReal, state.tau);
  function photon(p, col) {
    const x = sx(p.x), y = sy(p.y);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  photon(refP, 'rgba(200, 210, 230, 0.95)');     // reference photon
  photon(realP, '#ffd166');                       // real (delayed) photon
  // Legend.
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(200, 210, 230, 0.9)';
  ctx.fillText('● reference photon (flat spacetime)', padL + 10, topY + 18);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('● real photon (Shapiro-delayed)', padL + 10, topY + 34);

  // ---- BOTTOM LEFT: delay vs b ----
  const botY = topY + topH + 36;
  const botH = H - botY - 70;
  const blW = PW * 0.60;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, botY, blW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, botY + 0.5, blW - 1, botH - 1);
  const bMin = 1, bMax = 100;
  const dMax = shapiroDelay(state.r, state.r, bMin) * 1.05;
  ctx.strokeStyle = tok.accentCool; ctx.lineWidth = 1.8;
  ctx.beginPath();
  const NC = Math.floor(blW - 12);
  for (let i = 0; i < NC; i += 1) {
    const bb = bMin + (bMax - bMin) * i / (NC - 1);
    const d = shapiroDelay(state.r, state.r, bb);
    const px = padL + 6 + i;
    const py = botY + botH - 20 - (botH - 36) * d / dMax;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const cPx = padL + 6 + (blW - 12) * (state.b - bMin) / (bMax - bMin);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cPx, botY + 8); ctx.lineTo(cPx, botY + botH - 18); ctx.stroke();
  ctx.fillStyle = tok.accentCool; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Δt vs impact parameter b', padL + 8, botY + 16);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (const bb of [10, 25, 50, 75, 100]) {
    ctx.fillText(`${bb}`, padL + 6 + (blW - 12) * (bb - bMin) / (bMax - bMin), botY + botH - 4);
  }
  ctx.fillText('b / M', padL + blW / 2, botY + botH + 14);
  ctx.textAlign = 'left';

  // ---- BOTTOM RIGHT: accumulated-delay readout ----
  const brX = padL + blW + 20;
  const brW = PW - blW - 20;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(brX, botY, brW, botH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(brX + 0.5, botY + 0.5, brW - 1, botH - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('race status', brX + 10, botY + 18);
  // Current gap between the photons (in M).
  const refDone = state.tau >= pathCache.tRefTotal;
  const realDone = state.tau >= pathCache.tRealTotal;
  // The lag is how far behind (in cumulative real-time) the real
  // photon is at the moment the reference arrives.
  const lagNow = Math.max(0, Math.min(state.tau, pathCache.tRealTotal) - Math.min(state.tau, pathCache.tRefTotal));
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(200, 210, 230, 0.85)';
  ctx.fillText(`reference: ${refDone ? 'ARRIVED' : 'in transit'}`, brX + 10, botY + 44);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`real: ${realDone ? 'ARRIVED' : 'in transit'}`, brX + 10, botY + 64);
  // Big delay number.
  const finalDelay = pathCache.tRealTotal - pathCache.tRefTotal;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = 'bold 26px ui-monospace, monospace';
  ctx.fillText(`${finalDelay.toFixed(1)} M`, brX + 10, botY + 104);
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(200, 210, 230, 0.7)';
  ctx.fillText('total Shapiro delay (path model)', brX + 10, botY + 120);
  // Gap bar.
  const gapFrac = Math.min(1, lagNow / Math.max(1e-6, finalDelay));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(brX + 10, botY + 132, brW - 20, 10);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(brX + 10, botY + 132, (brW - 20) * gapFrac, 10);
}

// =========================================================================
function tick() {
  if (state.playing && state.speed > 0) {
    state.tau += state.speed * 2.2;
    // Loop once the slower (real) photon has arrived, with a pause.
    if (state.tau > pathCache.tRealTotal * 1.15) state.tau = 0;
  }
  drawAll();
  requestAnimationFrame(tick);
}

sliderB.addEventListener('input', () => {
  state.b = parseFloat(sliderB.value);
  valueB.textContent = state.b.toFixed(1);
  buildPath(); state.tau = 0; drawAll();
});
sliderR.addEventListener('input', () => {
  state.r = parseFloat(sliderR.value);
  valueR.textContent = state.r.toFixed(0);
  buildPath(); state.tau = 0; drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnReset.addEventListener('click', () => {
  state.b = 20; sliderB.value = '20'; valueB.textContent = '20.0';
  buildPath(); state.tau = 0; drawAll();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  buildPath();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.b = 1 + frac * 99;
    sliderB.value = state.b.toFixed(1); valueB.textContent = state.b.toFixed(1);
    buildPath();
    state.tau = frac * pathCache.tRealTotal;
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
