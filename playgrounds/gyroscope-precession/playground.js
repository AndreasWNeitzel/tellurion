// playground.js
// Gyroscope precession 3D pseudo-perspective + Omega_p(omega_s) curve.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createTop, stepTop, precessionRate, tipPosition, L_VIS,
  M_TOP, G_GRAV, R_COM, I_SPIN,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderOmega  = document.getElementById('slider-omega');
const sliderTheta  = document.getElementById('slider-theta');
const sliderSpeed  = document.getElementById('slider-speed');
const valueOmega   = document.getElementById('value-omega');
const valueTheta   = document.getElementById('value-theta');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  omega_s: 50,
  theta0: 0.6,
  speed: 3,
  sim: null,
  tipTrail: [],
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createTop({ theta: state.theta0, omega_spin: state.omega_s });
  state.tipTrail = [];
}

// Project 3D (x, y, z) -> 2D with simple isometric: x' = x - 0.4 y, y' = -z - 0.3 y.
function project(p) {
  return { x: p.x - 0.4 * p.y, y: -p.z - 0.3 * p.y };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const Omega_p = precessionRate(state.omega_s);
  const T_p = 2 * Math.PI / Omega_p;

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`omega_s = ${state.omega_s}   theta = ${state.theta0.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`Omega_p = M g r / (I_s omega_s) = ${Omega_p.toFixed(3)} rad/s   T_p = ${T_p.toFixed(2)} s`, 30, 40);

  // Layout: left 3D scene, right Omega_p(omega_s) curve.
  const padL = 30, padR = 30, gap = 30;
  const panelW = (W - padL - padR - gap) / 2;
  const panelY = 60;
  const panelH = H - panelY - 80;

  // 3D scene panel
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const cx = padL + panelW / 2;
  const cy = panelY + panelH * 0.72;
  const scale = Math.min(panelW, panelH) / 3.5;
  function pp(p) {
    const p2 = project(p);
    return { px: cx + p2.x * scale, py: cy + p2.y * scale };
  }
  // Ground circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const a = (i / 60) * 2 * Math.PI;
    const p = pp({ x: Math.cos(a), y: Math.sin(a), z: 0 });
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  // Vertical (z) axis
  const zTop = pp({ x: 0, y: 0, z: 1.5 });
  const zBot = pp({ x: 0, y: 0, z: 0 });
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(zBot.px, zBot.py); ctx.lineTo(zTop.px, zTop.py);
  ctx.stroke();
  ctx.setLineDash([]);
  // Cone (current circle traced by tip)
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.40)';
  ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const a = (i / 60) * 2 * Math.PI;
    const p = pp({
      x: L_VIS * Math.sin(state.theta0) * Math.cos(a),
      y: L_VIS * Math.sin(state.theta0) * Math.sin(a),
      z: L_VIS * Math.cos(state.theta0),
    });
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  // Body axis (pivot to tip)
  const tipP = pp(tipPosition(state.sim));
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(zBot.px, zBot.py); ctx.lineTo(tipP.px, tipP.py);
  ctx.stroke();
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath(); ctx.arc(tipP.px, tipP.py, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1; ctx.stroke();
  // Trail
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.50)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < state.tipTrail.length; i += 1) {
    const p = pp(state.tipTrail[i]);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('top axis precessing', padL + 6, panelY + 14);

  // Right: Omega_p vs omega_s curve.
  const curveX = padL + panelW + gap;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(curveX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(curveX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  const wMin = 10, wMax = 200;
  const opMin = 0, opMax = precessionRate(wMin) * 1.05;
  function xW(w) { return curveX + 4 + (panelW - 8) * (w - wMin) / (wMax - wMin); }
  function yOp(op) { return panelY + panelH - 4 - (panelH - 12) * (op - opMin) / (opMax - opMin); }
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const NPTS = panelW - 8;
  for (let i = 0; i < NPTS; i += 1) {
    const w = wMin + (wMax - wMin) * i / (NPTS - 1);
    const op = precessionRate(w);
    const px = xW(w), py = yOp(op);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Cursor
  const cP = xW(state.omega_s);
  ctx.strokeStyle = '#f1d28a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cP, panelY + 6); ctx.lineTo(cP, panelY + panelH - 6);
  ctx.stroke();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('Omega_p vs omega_s', curveX + 6, panelY + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepTop(state.sim, 0.01);
    state.tipTrail.push(tipPosition(state.sim));
    if (state.tipTrail.length > 400) state.tipTrail.shift();
  }
}

sliderOmega.addEventListener('change', () => { state.omega_s = parseInt(sliderOmega.value, 10); valueOmega.textContent = String(state.omega_s); rebuild(); drawAll(); });
sliderOmega.addEventListener('input', () => { valueOmega.textContent = String(parseInt(sliderOmega.value, 10)); });
sliderTheta.addEventListener('change', () => { state.theta0 = parseFloat(sliderTheta.value); valueTheta.textContent = state.theta0.toFixed(2); rebuild(); drawAll(); });
sliderTheta.addEventListener('input', () => { valueTheta.textContent = parseFloat(sliderTheta.value).toFixed(2); });
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
    const target = Math.round(frac * 500);
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
