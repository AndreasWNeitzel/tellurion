import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Two-mass three-spring layout with stacked displacement traces and a
// (x1, x2) phase portrait.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createSprings, stepVerlet, totalEnergy, modeAmplitudes,
  purePlusMode, pureMinusMode, OMEGA_PLUS, OMEGA_MINUS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnPlus      = document.getElementById('btn-plus');
const btnMinus     = document.getElementById('btn-minus');
const btnGeneric   = document.getElementById('btn-generic');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const HISTORY_LEN = 600;

const state = {
  speed: 3,
  sim: null,
  history: [],   // {t, x1, x2}
  E0: 0,
  preset: 'generic',
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
  fg:         cssVar('--fg',          '#f3f3f0'),
};

function rebuild(preset = state.preset) {
  state.preset = preset;
  if (preset === '+')      state.sim = purePlusMode(0.6);
  else if (preset === '-') state.sim = pureMinusMode(0.6);
  else                     state.sim = createSprings({ x1_0: 0.7, x2_0: 0.0 });
  state.history = [{ t: 0, x1: state.sim.x1, x2: state.sim.x2 }];
  state.E0 = totalEnergy(state.sim);
}

function drawSpring(x0, y0, x1, coils, amp = 6) {
  // Draw a horizontal zigzag spring between x0 and x1 at y0.
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const span = x1 - x0;
  const segLen = span / coils;
  for (let i = 0; i < coils; i += 1) {
    const xa = x0 + (i + 0.25) * segLen;
    const xb = x0 + (i + 0.75) * segLen;
    const ya = y0 - amp;
    const yb = y0 + amp;
    ctx.lineTo(xa, ya);
    ctx.lineTo(xb, yb);
  }
  ctx.lineTo(x1, y0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  // Layout: top -- mechanical scene (springs + masses). Bottom-left: displacement traces. Bottom-right: phase portrait.
  const sceneH = 130;
  const sceneY = 40;
  const padX = 30;

  // Walls at x = 80 and x = W - 80.
  const wallLeftX  = 80;
  const wallRightX = W - 80;
  const railY      = sceneY + sceneH * 0.55;

  // Floor / rail
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(wallLeftX - 10, railY + 24);
  ctx.lineTo(wallRightX + 10, railY + 24);
  ctx.stroke();

  // Walls (vertical hatches)
  for (const wx of [wallLeftX, wallRightX]) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(wx, railY - 25);
    ctx.lineTo(wx, railY + 25);
    ctx.stroke();
    for (let h = -25; h <= 25; h += 8) {
      const sgn = wx === wallLeftX ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(wx, railY + h);
      ctx.lineTo(wx + sgn * 8, railY + h + 8);
      ctx.stroke();
    }
  }

  // Equilibrium positions for the two masses (evenly spaced)
  const eq1 = wallLeftX + (wallRightX - wallLeftX) / 3;
  const eq2 = wallLeftX + 2 * (wallRightX - wallLeftX) / 3;
  const DISPL_SCALE = 100;  // pixels per unit displacement
  const m1x = eq1 + state.sim.x1 * DISPL_SCALE;
  const m2x = eq2 + state.sim.x2 * DISPL_SCALE;

  // Springs
  drawSpring(wallLeftX, railY, m1x - 16, 10);
  drawSpring(m1x + 16, railY, m2x - 16, 10);
  drawSpring(m2x + 16, railY, wallRightX, 10);

  // Equilibrium markers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.setLineDash([3, 4]);
  for (const ex of [eq1, eq2]) {
    ctx.beginPath();
    ctx.moveTo(ex, railY - 18);
    ctx.lineTo(ex, railY + 26);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Masses
  for (const [mx, color] of [[m1x, tok.accentCool], [m2x, tok.accentWarm]]) {
    ctx.fillStyle = color;
    ctx.fillRect(mx - 16, railY - 16, 32, 32);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
    ctx.strokeRect(mx - 16 + 0.5, railY - 16 + 0.5, 31, 31);
  }

  // Title bar
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.sim.t.toFixed(2)}   step = ${state.sim.nSteps}   preset = ${state.preset}`, padX, 22);
  const Ec = totalEnergy(state.sim);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(`E / E_0 - 1 = ${((Ec - state.E0) / state.E0).toExponential(2)}`, W - padX, 22);

  // Mode amplitudes label
  const A = modeAmplitudes(state.sim);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`A_+ = ${A.Aplus.toFixed(3)}   A_- = ${A.Aminus.toFixed(3)}   omega_+ = ${OMEGA_PLUS.toFixed(3)}   omega_- = ${OMEGA_MINUS.toFixed(3)}`, padX, 38);

  // Lower panels: displacement traces + phase portrait
  const lowerY = sceneY + sceneH + 18;
  const lowerH = H - lowerY - 16;
  const traceW = (W - 3 * padX) * 0.62;
  const phaseW = (W - 3 * padX) * 0.38;

  // Trace panel
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padX, lowerY, traceW, lowerH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padX + 0.5, lowerY + 0.5, traceW - 1, lowerH - 1);

  // Zero line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(padX, lowerY + lowerH / 2);
  ctx.lineTo(padX + traceW, lowerY + lowerH / 2);
  ctx.stroke();

  if (state.history.length >= 2) {
    const tNow = state.sim.t;
    const tWindow = 20.0;
    const tStart = Math.max(0, tNow - tWindow);
    function xT(t) { return padX + 4 + (traceW - 8) * (t - tStart) / Math.min(tWindow, tNow - tStart + 1e-9); }
    function yX(x) { return lowerY + lowerH / 2 - x * (lowerH * 0.4); }
    for (const [key, color] of [['x1', tok.accentCool], ['x2', tok.accentWarm]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let first = true;
      for (const pt of state.history) {
        if (pt.t < tStart) continue;
        const px = xT(pt.t);
        const py = yX(pt[key]);
        if (first) { ctx.moveTo(px, py); first = false; }
        else        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('x_1(t)', padX + 6, lowerY + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('x_2(t)', padX + 60, lowerY + 14);

  // Phase portrait
  const phaseX = padX + traceW + padX;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(phaseX, lowerY, phaseW, lowerH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(phaseX + 0.5, lowerY + 0.5, phaseW - 1, lowerH - 1);
  const cx = phaseX + phaseW / 2;
  const cy = lowerY + lowerH / 2;
  const RR = Math.min(phaseW, lowerH) / 2 - 8;
  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(phaseX + 6, cy); ctx.lineTo(phaseX + phaseW - 6, cy);
  ctx.moveTo(cx, lowerY + 6); ctx.lineTo(cx, lowerY + lowerH - 6);
  ctx.stroke();
  // Trail
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.55)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  let first = true;
  for (const pt of state.history) {
    const px = cx + pt.x1 * RR;
    const py = cy - pt.x2 * RR;
    if (first) { ctx.moveTo(px, py); first = false; }
    else        ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Current point
  ctx.fillStyle = '#f1d28a';
  ctx.beginPath();
  ctx.arc(cx + state.sim.x1 * RR, cy - state.sim.x2 * RR, 3.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('phase (x_1, x_2)', phaseX + 6, lowerY + 14);
}

function tickN(n) {
  if (!state.sim) return;
  for (let i = 0; i < n; i += 1) {
    stepVerlet(state.sim, 0.01);
    if (state.sim.nSteps % 2 === 0) {
      state.history.push({ t: state.sim.t, x1: state.sim.x1, x2: state.sim.x2 });
      if (state.history.length > HISTORY_LEN) state.history.shift();
    }
  }
}

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnPlus.addEventListener('click',    () => { rebuild('+');       drawAll(); });
btnMinus.addEventListener('click',   () => { rebuild('-');       drawAll(); });
btnGeneric.addEventListener('click', () => { rebuild('generic'); drawAll(); });
btnReset.addEventListener('click',   () => { rebuild();          drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 800);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
window.playground.getState = function () {
  const A = modeAmplitudes(state.sim);
  return {
    fields: [
      { key: 'amp-symmetric', label: 'symmetric mode $A_+$', value: A.Aplus, format: 'float' },
      { key: 'amp-antisymmetric', label: 'antisymmetric mode $A_-$', value: A.Aminus, format: 'float' },
      { key: 'energy', label: 'total energy $E$', value: totalEnergy(state.sim), format: 'float' },
    ],
  };
};
// A conservative (Hamiltonian) system: total energy is the
// invariant. The baseline is the energy at the start of the run and
// is re-taken whenever a control change steps the energy.
let __energy0 = null, __energyPrev = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const E = totalEnergy(state.sim);
      if (!Number.isFinite(E)) return [];
      if (__energyPrev !== null
        && Math.abs(E - __energyPrev) > 0.02 * Math.max(1e-9, Math.abs(__energyPrev)) + 1e-9) {
        __energy0 = E;                    // discontinuity: a control changed the system
      }
      __energyPrev = E;
      if (__energy0 === null) __energy0 = E;
      const dE = Math.abs(E - __energy0) / Math.max(1e-12, Math.abs(__energy0));
      return [{
        key: 'energy',
        label: 'total energy conserved (rel. drift)',
        value: dE.toExponential(2),
        status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
