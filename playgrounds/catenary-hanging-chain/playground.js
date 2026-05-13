// playground.js
// Catenary curve with parabolic approximation, animated by sweeping a.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { y, slope, arclen, parabolaApprox, sampleCurve, sag, HALF_SPAN } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const A_MIN = 0.4, A_MAX = 3.0;

const state = {
  a: 0.6,
  speed: 2,
  sweepDir: 1,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

// World coords: x in [-HALF_SPAN - 0.1, HALF_SPAN + 0.1]; y in [-0.05, ymaxScene].
const Y_MAX_SCENE = 1.3;     // viewing height
function worldToPx(x, yWorld) {
  const wx = 2 * (HALF_SPAN + 0.1);
  const padL = 60, padR = 30, padT = 60, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const scaleX = drawW / wx;
  const scaleY = drawH / Y_MAX_SCENE;
  const scale = Math.min(scaleX, scaleY);
  const px = padL + drawW / 2 + x * scale;
  const py = padT + drawH - yWorld * scale;
  return { px, py };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Title bar
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`a = ${state.a.toFixed(3)}   sag = ${sag(state.a).toFixed(3)}   arc-length L = ${(2 * arclen(HALF_SPAN, state.a)).toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`y(x) = a cosh(x / a) - a   (taut limit: y -> x^2 / 2a)`, 30, 40);

  // Pegs
  const peg1 = worldToPx(-HALF_SPAN, 0);
  const peg2 = worldToPx(HALF_SPAN, 0);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath(); ctx.arc(peg1.px, peg1.py, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(peg2.px, peg2.py, 5, 0, Math.PI * 2); ctx.fill();

  // Horizontal reference line at y = 0
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(peg1.px - 20, peg1.py);
  ctx.lineTo(peg2.px + 20, peg2.py);
  ctx.stroke();

  // Parabolic approximation (dashed)
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const N = 200;
  for (let i = 0; i <= N; i += 1) {
    const x = -HALF_SPAN + 2 * HALF_SPAN * i / N;
    const yp = parabolaApprox(x, state.a);
    const p = worldToPx(x, yp);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Catenary (solid)
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = -HALF_SPAN + 2 * HALF_SPAN * i / N;
    const yc = y(x, state.a);
    const p = worldToPx(x, yc);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  // Chain bead markers along the curve (uniformly spaced in arc length)
  const totalLen = 2 * arclen(HALF_SPAN, state.a);
  const beadCount = 21;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  for (let i = 0; i < beadCount; i += 1) {
    const sTarget = -arclen(HALF_SPAN, state.a) + totalLen * i / (beadCount - 1);
    // Invert arclen: s = a sinh(x / a) -> x = a arcsinh(s / a).
    const x = state.a * Math.asinh(sTarget / state.a);
    const yc = y(x, state.a);
    const p = worldToPx(x, yc);
    ctx.beginPath();
    ctx.arc(p.px, p.py, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Slope at endpoints (tangent arrows)
  for (const xx of [-HALF_SPAN, HALF_SPAN]) {
    const m = slope(xx, state.a);
    const yc = y(xx, state.a);
    const p0 = worldToPx(xx, yc);
    const dx = 0.18;
    const p1 = worldToPx(xx + dx * Math.sign(-xx || 1), yc - dx * m * Math.sign(xx));
    ctx.strokeStyle = tok.accentWarm;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p0.px, p0.py); ctx.lineTo(p1.px, p1.py);
    ctx.stroke();
  }

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('catenary  y = a cosh(x/a) - a', 60, H - 24);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('parabola  y = x^2 / 2a', 350, H - 24);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    state.a += state.sweepDir * 0.01;
    if (state.a > A_MAX) { state.a = A_MAX; state.sweepDir = -1; }
    if (state.a < A_MIN) { state.a = A_MIN; state.sweepDir = +1; }
  }
  sliderA.value = state.a.toFixed(2);
  valueA.textContent = state.a.toFixed(2);
}

sliderA.addEventListener('input', () => { state.a = parseFloat(sliderA.value); valueA.textContent = state.a.toFixed(2); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.a = 0.6; state.sweepDir = 1; sliderA.value = '0.60'; valueA.textContent = '0.60'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.a = A_MIN + (A_MAX - A_MIN) * frac;
    sliderA.value = state.a.toFixed(2); valueA.textContent = state.a.toFixed(2);
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
    if (state.speed > 0) tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
