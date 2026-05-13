// playground.js
// Accretion-disc T(r) profile and face-on color rendering.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  temperature, temperatureBare, temperatureToRGB, R_IN, R_TMAX, T_MAX,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderView   = document.getElementById('slider-view');
const sliderRmax   = document.getElementById('slider-rmax');
const sliderSpeed  = document.getElementById('slider-speed');
const valueView    = document.getElementById('value-view');
const valueRmax    = document.getElementById('value-rmax');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW_NAMES = ['profile', 'disc'];

const state = {
  view: 0,
  rmax: 80,
  speed: 0,
  spin: 0,             // for the disc view animation
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawProfile() {
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`R_in = 1   R_out = ${state.rmax}   R_Tmax = ${R_TMAX.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`T(r) = T_in (R_in / r)^(3/4) [1 - sqrt(R_in / r)]^(1/4)`, 30, 40);

  const padL = 40, padR = 40, padT = 70, padB = 90;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);

  // X scale: r from R_IN to state.rmax (log)
  function xR(r) {
    const a = Math.log(r), b = Math.log(R_IN), c = Math.log(state.rmax);
    return padL + 4 + (drawW - 8) * (a - b) / (c - b);
  }
  const yMax = T_MAX * 1.1;
  function yT(t) { return padT + drawH - 4 - (drawH - 12) * (t / yMax); }

  // Bare power-law overlay
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  const NPTS = drawW;
  for (let i = 0; i < NPTS; i += 1) {
    const t = i / (NPTS - 1);
    const r = R_IN * Math.exp(t * Math.log(state.rmax / R_IN));
    const T = temperatureBare(r);
    const px = padL + 4 + (drawW - 8) * t;
    const py = yT(Math.min(yMax, T));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Full profile
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const t = i / (NPTS - 1);
    const r = R_IN * Math.exp(t * Math.log(state.rmax / R_IN));
    const T = temperature(r);
    const px = padL + 4 + (drawW - 8) * t;
    const py = yT(T);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Peak marker
  const peakX = xR(R_TMAX);
  ctx.strokeStyle = '#f1d28a';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(peakX, padT); ctx.lineTo(peakX, padT + drawH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('T(r) full', padL + 6, padT + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('bare r^(-3/4)', padL + 100, padT + 14);
  ctx.fillStyle = '#f1d28a';
  ctx.textAlign = 'center';
  ctx.fillText('peak at r = 49/36', peakX, padT - 4);
  // r ticks (log)
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const r of [1, 2, 5, 10, 20, 50, 100, 200]) {
    if (r > state.rmax) continue;
    const px = xR(r);
    if (px > padL && px < padL + drawW) ctx.fillText(`${r}`, px, padT + drawH + 14);
  }
  ctx.fillText('r / R_in (log)', padL + drawW / 2, padT + drawH + 30);
}

function drawDisc() {
  const cx = W / 2, cy = H / 2 + 10;
  const rPxOut = Math.min(W, H) * 0.42;
  // Background space (radial gradient)
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  // Disc annuli (back to front)
  const N = 200;
  for (let i = N; i >= 1; i -= 1) {
    const r = R_IN + (state.rmax - R_IN) * i / N;
    const rPrev = R_IN + (state.rmax - R_IN) * (i - 1) / N;
    const T = temperature(r);
    const [rC, gC, bC] = temperatureToRGB(T);
    const rPx = rPxOut * Math.sqrt(r / state.rmax);
    const rPxIn = rPxOut * Math.sqrt(rPrev / state.rmax);
    // Squash vertically to simulate tilt
    ctx.fillStyle = `rgb(${rC}, ${gC}, ${bC})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rPx, rPx * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#060608';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rPxIn, rPxIn * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Black hole at center
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rPxOut * Math.sqrt(R_IN / state.rmax), rPxOut * Math.sqrt(R_IN / state.rmax) * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rPxOut * Math.sqrt(R_IN / state.rmax), rPxOut * Math.sqrt(R_IN / state.rmax) * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Title bar
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`disc face-on (R_in = 1, R_out = ${state.rmax})`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`color = local blackbody temperature; hot ring at r ~ 1.36 R_in`, 30, 40);
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (state.view === 0) drawProfile(); else drawDisc();
}

function tickN(n) { /* no integrator; we only spin if needed */ }

sliderView.addEventListener('input', () => { state.view = parseInt(sliderView.value, 10); valueView.textContent = VIEW_NAMES[state.view]; drawAll(); });
sliderRmax.addEventListener('input', () => { state.rmax = parseFloat(sliderRmax.value); valueRmax.textContent = state.rmax.toFixed(0); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.rmax = 80; sliderRmax.value = '80'; valueRmax.textContent = '80'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Frame 0 = profile, frames 1..4 = disc with varying r_out
    if (frac < 0.2) {
      state.view = 0;
      state.rmax = 80;
    } else {
      state.view = 1;
      state.rmax = 20 + frac * 180;
    }
    sliderView.value = String(state.view); valueView.textContent = VIEW_NAMES[state.view];
    sliderRmax.value = state.rmax.toFixed(0); valueRmax.textContent = state.rmax.toFixed(0);
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
    // No-op; this is mostly static. Future: rotate disc texture for animation.
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
