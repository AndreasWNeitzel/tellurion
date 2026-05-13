// playground.js
// Animated coherent state. |psi|^2 plus the parabolic V(x); time advances at
// speed * dt per frame so the user sees the wave packet sloshing in the well.

import { density, psiRealImag, classicalOrbit, meanOccupation, meanEnergy } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas        = document.getElementById('stage');
const ctx           = canvas.getContext('2d', { alpha: false });
const sliderAlpha   = document.getElementById('slider-alpha');
const sliderSpeed   = document.getElementById('slider-speed');
const valueAlpha    = document.getElementById('value-alpha');
const valueSpeed    = document.getElementById('value-speed');
const btnReset      = document.getElementById('btn-reset');
const btnPlayPause  = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PLOT = { x: 60, y: 30, w: 660, h: 440, xmin: -5, xmax: 5, ymin: -0.2, ymax: 1.6 };
const DT = 0.025;

const state = {
  alpha: 2.0,
  speed: 1.0,
  t: 0,
  playing: !DETERMINISTIC,
  rafId: null,
};

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const tok = {
  bg: cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  cat2: cssVar('--cat-2', '#DD8452'),
  grid: cssVar('--grid', '#9A9C9F4D'),
};

function px(x, y) {
  return {
    px: PLOT.x + (x - PLOT.xmin) / (PLOT.xmax - PLOT.xmin) * PLOT.w,
    py: PLOT.y + (1 - (y - PLOT.ymin) / (PLOT.ymax - PLOT.ymin)) * PLOT.h,
  };
}

function drawAxes() {
  ctx.fillStyle = tok.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = tok.surface; ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

  ctx.fillStyle = tok.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const xv of [-5, -3, -1, 0, 1, 3, 5]) {
    const p = px(xv, 0);
    ctx.fillText(String(xv), p.px, PLOT.y + PLOT.h + 13);
    ctx.strokeStyle = tok.grid;
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(p.px, PLOT.y); ctx.lineTo(p.px, PLOT.y + PLOT.h); ctx.stroke();
  }
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('x (oscillator units)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 32);
}

function drawPotential() {
  // V(x) = x^2 / 2. Scaled into the plot's y range so the well is visible.
  ctx.strokeStyle = tok.fgFaint;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const xv = PLOT.xmin + i / 200 * (PLOT.xmax - PLOT.xmin);
    const V = 0.5 * xv * xv;
    const Vscaled = Math.min(V / 12, PLOT.ymax);     // scale so the well rim is near the top
    const p = px(xv, Vscaled);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWavefunctionDensity() {
  ctx.strokeStyle = tok.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let first = true;
  for (let i = 0; i <= 600; i += 1) {
    const xv = PLOT.xmin + i / 600 * (PLOT.xmax - PLOT.xmin);
    const d = density(xv, state.alpha, state.t);
    const p = px(xv, d);
    if (first) { ctx.moveTo(p.px, p.py); first = false; } else { ctx.lineTo(p.px, p.py); }
  }
  ctx.stroke();
}

function drawRealPsi() {
  ctx.strokeStyle = tok.cat2;
  ctx.lineWidth = 1.0;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  let first = true;
  for (let i = 0; i <= 600; i += 1) {
    const xv = PLOT.xmin + i / 600 * (PLOT.xmax - PLOT.xmin);
    const { re } = psiRealImag(xv, state.alpha, state.t);
    // Shift down a bit so it sits visually under |psi|^2.
    const p = px(xv, re * 0.5 - 0.05);
    if (first) { ctx.moveTo(p.px, p.py); first = false; } else { ctx.lineTo(p.px, p.py); }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawClassicalMarker() {
  const { x0 } = classicalOrbit(state.alpha, state.t);
  const p = px(x0, 0);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(p.px, p.py, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = tok.fg;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

function drawReadout() {
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const rows = [
    ['alpha',   state.alpha.toFixed(3)],
    ['t',       state.t.toFixed(2)],
    ['<n>',     meanOccupation(state.alpha).toFixed(3)],
    ['<H>/hw',  meanEnergy(state.alpha).toFixed(3)],
    ['x_0(t)',  classicalOrbit(state.alpha, state.t).x0.toFixed(3)],
    ['p_0(t)',  classicalOrbit(state.alpha, state.t).p0.toFixed(3)],
  ];
  const xL = W - 200, xR = W - 16;
  let y = 24;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = tok.fgMuted; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = tok.fg; ctx.fillText(v, xR, y);
    y += 14;
  }
}

function drawAll() {
  drawAxes();
  drawPotential();
  drawRealPsi();
  drawWavefunctionDensity();
  drawClassicalMarker();
  drawReadout();
}

function tickFrame() {
  state.t += DT * state.speed;
  drawAll();
}

function applyControls() {
  state.alpha = parseFloat(sliderAlpha.value);
  state.speed = parseFloat(sliderSpeed.value);
  valueAlpha.textContent = state.alpha.toFixed(2);
  valueSpeed.textContent = state.speed.toFixed(1);
}
sliderAlpha.addEventListener('input', applyControls);
sliderSpeed.addEventListener('input', applyControls);
btnReset.addEventListener('click', () => { sliderAlpha.value = '2'; sliderSpeed.value = '1'; state.t = 0; applyControls(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // sweep t through one full period 2 pi for alpha = 2
    state.alpha = 2.0;
    state.t = frac * 2 * Math.PI;
    sliderAlpha.value = '2';
    valueAlpha.textContent = '2.00';
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  applyControls();
  drawAll();
}

function tick() {
  if (state.playing) tickFrame();
  state.rafId = requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
