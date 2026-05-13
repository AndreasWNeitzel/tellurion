// playground.js
// FitzHugh-Nagumo voltage trace and (v, w) phase portrait with nullclines.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createFHN, stepFHN, restState, A_FN, B_FN, EPS_FN,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderI      = document.getElementById('slider-I');
const sliderSpeed  = document.getElementById('slider-speed');
const valueI       = document.getElementById('value-I');
const valueSpeed   = document.getElementById('value-speed');
const btnKick      = document.getElementById('btn-kick');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  I: 0,
  speed: 3,
  sim: null,
  trace: [],
  phase: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  const r = restState(state.I);
  state.sim = createFHN({ v: r.v, w: r.w, I: state.I });
  state.trace = [];
  state.phase = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`I = ${state.I.toFixed(2)}   t = ${state.sim.t.toFixed(1)}   v = ${state.sim.v.toFixed(3)}   w = ${state.sim.w.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`I = 0: excitable rest. I > 0.4: limit cycle (periodic spikes).`, 30, 40);

  const padL = 30, padR = 30;
  const gap = 30;
  const panelW = (W - padL - padR - gap) / 2;
  const panelY = 60;
  const panelH = H - panelY - 80;

  // Left: v(t) and w(t) traces (stacked or overlaid)
  const traceX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(traceX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(traceX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  // Zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(traceX, panelY + panelH / 2);
  ctx.lineTo(traceX + panelW, panelY + panelH / 2);
  ctx.stroke();
  const tWin = 50;
  if (state.trace.length >= 2) {
    const tNow = state.sim.t;
    const tStart = Math.max(0, tNow - tWin);
    for (const [key, color] of [['v', tok.accentCool], ['w', tok.accentWarm]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let first = true;
      for (const pt of state.trace) {
        if (pt.t < tStart) continue;
        const px = traceX + 4 + (panelW - 8) * (pt.t - tStart) / tWin;
        const py = panelY + panelH / 2 - pt[key] * (panelH * 0.35);
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('v(t) voltage', traceX + 6, panelY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('w(t) recovery', traceX + 130, panelY + 14);

  // Right: phase portrait
  const phaseX = traceX + panelW + gap;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(phaseX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(phaseX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const vMin = -2.5, vMax = 2.5, wMin = -1.5, wMax = 2.5;
  function ppX(v) { return phaseX + 4 + (panelW - 8) * (v - vMin) / (vMax - vMin); }
  function ppY(w) { return panelY + panelH - 4 - (panelH - 12) * (w - wMin) / (wMax - wMin); }
  // Nullclines
  // v-nullcline: w = v - v^3/3 + I
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.55)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < 200; i += 1) {
    const v = vMin + (vMax - vMin) * i / 199;
    const w = v - v ** 3 / 3 + state.I;
    if (w < wMin || w > wMax) continue;
    if (i === 0) ctx.moveTo(ppX(v), ppY(w)); else ctx.lineTo(ppX(v), ppY(w));
  }
  ctx.stroke();
  // w-nullcline: w = (v + a) / b
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.beginPath();
  for (let i = 0; i < 200; i += 1) {
    const v = vMin + (vMax - vMin) * i / 199;
    const w = (v + A_FN) / B_FN;
    if (w < wMin || w > wMax) continue;
    if (i === 0) ctx.moveTo(ppX(v), ppY(w)); else ctx.lineTo(ppX(v), ppY(w));
  }
  ctx.stroke();
  // Trajectory
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < state.phase.length; i += 1) {
    const pt = state.phase[i];
    if (i === 0) ctx.moveTo(ppX(pt.v), ppY(pt.w)); else ctx.lineTo(ppX(pt.v), ppY(pt.w));
  }
  ctx.stroke();
  if (state.phase.length > 0) {
    ctx.fillStyle = '#f1d28a';
    ctx.beginPath();
    ctx.arc(ppX(state.sim.v), ppY(state.sim.w), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('phase (v, w)', phaseX + 6, panelY + 14);
}

function tickN(n) {
  if (!state.sim) return;
  state.sim.I = state.I;
  for (let i = 0; i < n; i += 1) {
    stepFHN(state.sim, 0.05);
    state.trace.push({ t: state.sim.t, v: state.sim.v, w: state.sim.w });
    state.phase.push({ v: state.sim.v, w: state.sim.w });
    if (state.trace.length > 2000) state.trace.shift();
    if (state.phase.length > 2000) state.phase.shift();
  }
}

sliderI.addEventListener('input', () => { state.I = parseFloat(sliderI.value); valueI.textContent = state.I.toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnKick.addEventListener('click', () => { state.sim.v = 0; });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.I = frac;
    sliderI.value = state.I.toFixed(2); valueI.textContent = state.I.toFixed(2);
    rebuild();
    const target = Math.round(frac * 1000) + 200;
    tickN(target);
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
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
