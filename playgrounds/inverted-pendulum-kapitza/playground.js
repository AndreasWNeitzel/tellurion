// playground.js
// Kapitza pendulum with driven pivot, plus effective-potential panel.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createKapitza, stepKapitza, isStable, stabilityRatio,
  effectivePotential, G_GRAV, L_PEN,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderA      = document.getElementById('slider-a');
const sliderOmega  = document.getElementById('slider-omega');
const sliderSpeed  = document.getElementById('slider-speed');
const valueA       = document.getElementById('value-a');
const valueOmega   = document.getElementById('value-omega');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  a: 0.1,
  omega: 60,
  speed: 5,
  sim: null,
  trail: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createKapitza({ theta: 0.1, thetadot: 0, a: state.a, omega: state.omega });
  state.trail = [];
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const ratio = stabilityRatio(state.a, state.omega);
  const stable = isStable(state.a, state.omega);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`a = ${state.a.toFixed(3)} m   omega = ${state.omega}   theta = ${state.sim.theta.toFixed(3)}`, 30, 22);
  ctx.fillStyle = stable ? '#a3d4a3' : tok.accentWarm;
  ctx.fillText(`a^2 omega^2 / (2 g l) = ${ratio.toFixed(2)}   ${stable ? 'STABLE (criterion > 1)' : 'UNSTABLE (criterion < 1)'}`, 30, 40);

  // Layout: left mechanical scene, right effective potential
  const padL = 30, padR = 30, gap = 30;
  const panelW = (W - padL - padR - gap) / 2;
  const panelY = 60;
  const panelH = H - panelY - 80;

  // Scene
  const sceneX = padL;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(sceneX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(sceneX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const cx = sceneX + panelW / 2;
  const cyBase = panelY + panelH * 0.7;       // resting pivot position
  const scale = panelH / 3.5;
  // Pivot position with vertical drive
  const yPivot = state.a * Math.cos(state.omega * state.sim.t);
  const pivotY = cyBase - yPivot * scale * 2;
  // Bob position: pivot + l (sin theta, -cos theta) for theta = 0 = UP.
  const bobX = cx + L_PEN * scale * Math.sin(state.sim.theta);
  const bobY = pivotY - L_PEN * scale * Math.cos(state.sim.theta);
  // Vertical rail
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, panelY + 10); ctx.lineTo(cx, panelY + panelH - 10);
  ctx.stroke();
  ctx.setLineDash([]);
  // Pendulum rod
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, pivotY); ctx.lineTo(bobX, bobY);
  ctx.stroke();
  // Bob
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(bobX, bobY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1; ctx.stroke();
  // Pivot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(cx, pivotY, 5, 0, Math.PI * 2);
  ctx.fill();
  // Bob trail
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.40)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < state.trail.length; i += 1) {
    const p = state.trail[i];
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('driven inverted pendulum', sceneX + 6, panelY + 14);

  // Effective potential
  const potX = sceneX + panelW + gap;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(potX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(potX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const tMin = -Math.PI, tMax = Math.PI;
  function xT(t) { return potX + 4 + (panelW - 8) * (t - tMin) / (tMax - tMin); }
  let uMin = Infinity, uMax = -Infinity;
  for (let i = 0; i < 200; i += 1) {
    const t = tMin + (tMax - tMin) * i / 199;
    const u = effectivePotential(t, state.a, state.omega);
    if (u < uMin) uMin = u;
    if (u > uMax) uMax = u;
  }
  function yU(u) { return panelY + panelH - 4 - (panelH - 12) * (u - uMin) / (uMax - uMin); }
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 200; i += 1) {
    const t = tMin + (tMax - tMin) * i / 199;
    const u = effectivePotential(t, state.a, state.omega);
    const px = xT(t), py = yU(u);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Current theta marker
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(xT(state.sim.theta), yU(effectivePotential(state.sim.theta, state.a, state.omega)), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('U_eff(theta)', potX + 6, panelY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepKapitza(state.sim, 0.0005);
    if (state.sim.nSteps % 4 === 0) {
      const cx = 30 + (W - 60 - 30) / 4;
      const cyBase = 60 + (H - 60 - 80) * 0.7 + 60;
      const scale = (H - 60 - 80) / 3.5;
      const yPivot = state.a * Math.cos(state.omega * state.sim.t);
      const pivotY = cyBase - yPivot * scale * 2;
      state.trail.push({
        x: cx + L_PEN * scale * Math.sin(state.sim.theta),
        y: pivotY - L_PEN * scale * Math.cos(state.sim.theta),
      });
      if (state.trail.length > 500) state.trail.shift();
    }
  }
}

sliderA.addEventListener('change', () => { state.a = parseFloat(sliderA.value); valueA.textContent = state.a.toFixed(3); rebuild(); drawAll(); });
sliderA.addEventListener('input', () => { valueA.textContent = parseFloat(sliderA.value).toFixed(3); });
sliderOmega.addEventListener('change', () => { state.omega = parseInt(sliderOmega.value, 10); valueOmega.textContent = String(state.omega); rebuild(); drawAll(); });
sliderOmega.addEventListener('input', () => { valueOmega.textContent = String(parseInt(sliderOmega.value, 10)); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
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
    const target = Math.round(frac * 5000);
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
    tickN(state.speed * 10);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
