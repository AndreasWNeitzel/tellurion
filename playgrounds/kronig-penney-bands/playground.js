// playground.js
// Kronig-Penney: f(qa) and band structure side-by-side.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { fKP, bandIntervals, dispersionCurves } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderP      = document.getElementById('slider-P');
const sliderEmax   = document.getElementById('slider-emax');
const valueP       = document.getElementById('value-P');
const valueEmax    = document.getElementById('value-emax');

const W = canvas.width, H = canvas.height;
const state = { P: 4.0, eMax: 60 };

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const LX0 = 40, LX1 = 420;
  const LY0 = 40, LY1 = H - 60;
  const RX0 = 470, RX1 = W - 40;
  const RY0 = 40, RY1 = H - 60;

  // Left: f(qa) curve and +/- 1 lines.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(LX0, LY0, LX1 - LX0, LY1 - LY0);
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
  ctx.lineWidth = 0.8;
  // f = +1 and f = -1
  const fMin = -3, fMax = 3;
  function toLeftPx(eps, f) {
    return {
      px: LX0 + (LX1 - LX0) * (eps / state.eMax),
      py: LY1 - (LY1 - LY0) * (f - fMin) / (fMax - fMin),
    };
  }
  ctx.beginPath();
  const p1 = toLeftPx(0, 1), q1 = toLeftPx(state.eMax, 1);
  const p2 = toLeftPx(0, -1), q2 = toLeftPx(state.eMax, -1);
  ctx.moveTo(p1.px, p1.py); ctx.lineTo(q1.px, q1.py);
  ctx.moveTo(p2.px, p2.py); ctx.lineTo(q2.px, q2.py);
  ctx.stroke();

  // Allowed band shading
  const intervals = bandIntervals(state.P, state.eMax);
  ctx.fillStyle = 'rgba(110, 165, 215, 0.15)';
  for (const [eLo, eHi] of intervals) {
    const a = toLeftPx(eLo, fMax);
    const b = toLeftPx(eHi, fMin);
    ctx.fillRect(a.px, LY0, b.px - a.px, LY1 - LY0);
  }

  // f(eps) curve
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const N = 800;
  for (let i = 0; i < N; i += 1) {
    const eps = state.eMax * (i / (N - 1));
    const qa = Math.sqrt(Math.max(0, eps));
    const f = fKP(qa, state.P);
    const p = toLeftPx(eps, Math.max(fMin, Math.min(fMax, f)));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  // Left panel labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('f(q a) vs epsilon = (q a)^2', LX0, LY0 - 8);
  ctx.textAlign = 'center';
  ctx.fillText('epsilon', (LX0 + LX1) / 2, LY1 + 20);

  // Right: band structure E(k) reduced zone, ka in [0, pi]
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.strokeRect(RX0, RY0, RX1 - RX0, RY1 - RY0);
  function toRightPx(ka, eps) {
    return {
      px: RX0 + (RX1 - RX0) * (ka / Math.PI),
      py: RY1 - (RY1 - RY0) * (eps / state.eMax),
    };
  }
  // Band gaps as shaded strips
  ctx.fillStyle = 'rgba(255, 80, 80, 0.10)';
  let prevHi = 0;
  for (let i = 0; i < intervals.length; i += 1) {
    const [lo, hi] = intervals[i];
    if (lo > prevHi) {
      const a = toRightPx(0, prevHi);
      const b = toRightPx(Math.PI, lo);
      ctx.fillRect(RX0, b.py, RX1 - RX0, a.py - b.py);
    }
    prevHi = hi;
  }
  if (prevHi < state.eMax) {
    const a = toRightPx(0, prevHi);
    const b = toRightPx(Math.PI, state.eMax);
    ctx.fillRect(RX0, b.py, RX1 - RX0, a.py - b.py);
  }

  // Dispersion bands
  const curves = dispersionCurves(state.P, 6, 80);
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.6;
  for (let b = 0; b < curves.length; b += 1) {
    ctx.beginPath();
    const pts = curves[b];
    let started = false;
    for (let i = 0; i < pts.length; i += 1) {
      const [ka, eps] = pts[i];
      if (eps > state.eMax) continue;
      const p = toRightPx(ka, eps);
      if (!started) { ctx.moveTo(p.px, p.py); started = true; }
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Right panel labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('epsilon(k a) band structure (reduced zone)', RX0, RY0 - 8);
  ctx.textAlign = 'center';
  ctx.fillText('0', RX0, RY1 + 14);
  ctx.fillText('pi', RX1, RY1 + 14);
  ctx.fillText('k a', (RX0 + RX1) / 2, RY1 + 30);

  // Tick marks on epsilon axis (right)
  for (let i = 0; i <= 5; i += 1) {
    const e = state.eMax * (i / 5);
    const p = toRightPx(0, e);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(String(Math.round(e)), RX0 - 4, p.py + 3);
  }
  // Tick marks on f axis (left)
  for (const ftk of [-2, -1, 0, 1, 2]) {
    const p = toLeftPx(0, ftk);
    ctx.textAlign = 'right';
    ctx.fillText(String(ftk), LX0 - 4, p.py + 3);
  }
}

sliderP.addEventListener('input', () => {
  state.P = parseFloat(sliderP.value);
  valueP.textContent = state.P.toFixed(1);
  drawAll();
});
sliderEmax.addEventListener('input', () => {
  state.eMax = parseFloat(sliderEmax.value);
  valueEmax.textContent = String(state.eMax);
  drawAll();
});

function bootSync() {
  drawAll();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const Ps = [1.0, 2.5, 4.0, 7.0, 12.0];
    state.P = Ps[Math.min(Ps.length - 1, Math.round(frac * (Ps.length - 1)))];
    sliderP.value = state.P.toFixed(1);
    valueP.textContent = state.P.toFixed(1);
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

// Animate P slowly so the bands evolve visibly.
let animTime = 0;
let paused = false;
let userOverride = false;
sliderP.addEventListener('input', () => { userOverride = true; });
sliderEmax.addEventListener('input', () => { userOverride = true; });
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
    animTime += 0.006;
    state.P = 5 + 4.5 * Math.sin(animTime);
    sliderP.value = state.P.toFixed(1);
    valueP.textContent = state.P.toFixed(1);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
