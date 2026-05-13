// playground.js
// Plane wave of photons incident on a Schwarzschild black hole, animated.
// The swarm advances at K substeps per requestAnimationFrame call so the
// user watches photons cross the photon sphere and split into swallowed
// and deflected. Capture mode steps a deterministic count synchronously
// so visual.test.mjs frames are reproducible.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createPhotonSwarm,
  stepSwarm,
  photonPosition,
  DEFAULT_DT,
  B_CRIT,
  R_HORIZON,
  R_PHOTON_SPHERE,
  SWALLOWED,
  DEFLECTED,
  RUNNING,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  N:          document.getElementById('readout-N'),
  bMax:       document.getElementById('readout-bMax'),
  bCrit:      document.getElementById('readout-bCrit'),
  swallowed:  document.getElementById('readout-swallowed'),
  deflected:  document.getElementById('readout-deflected'),
};
const sliderN      = document.getElementById('slider-N');
const sliderBmax   = document.getElementById('slider-bMax');
const valueN       = document.getElementById('value-N');
const valueBmax    = document.getElementById('value-bMax');
const btnReset     = document.getElementById('btn-reset');
const chkBcrit     = document.getElementById('chk-bcrit');

const W = canvas.width, H = canvas.height;
const VIEW = { xmin: -13, xmax: 13, ymin: -8.7, ymax: 8.7 };

// Animation tuning. SUBSTEPS_PER_FRAME advances roughly 0.12 affine units
// of simulation time per rAF tick (~10 sec for the wave to cross the field
// of view at 60 Hz). MAX_STEPS caps photons that loop the photon sphere
// indefinitely. CAPTURE_TOTAL_STEPS is the deterministic horizon for the
// captureFraction sweep; goldens cover the same total simulation time as
// before, only the live framerate has slowed.
const SUBSTEPS_PER_FRAME = 2;
const MAX_STEPS          = 4000;
const CAPTURE_TOTAL_STEPS = 1500;

const state = {
  N: 41,
  bMax: 9,
  swarm: null,
  stepsSoFar: 0,
  rafId: null,
  animating: false,
  showBcrit: true,
  criticalSwarm: null,           // tiny 2-photon swarm at +/- b_crit
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  accent:     cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};

function buildSwarm() {
  state.swarm      = createPhotonSwarm({ N: state.N, bMax: state.bMax, xInf: 12 });
  state.stepsSoFar = 0;
  // Independent two-photon "critical swarm" at b = +/- b_crit, used to mark
  // the boundary visually. These photons orbit the photon sphere near
  // indefinitely; we render them with extra weight.
  state.criticalSwarm = createPhotonSwarm({ N: 2, bMax: B_CRIT * 1.0001, xInf: 12 });
}

function stepN(nSteps) {
  if (!state.swarm) return false;
  for (let i = 0; i < nSteps; i += 1) {
    if (state.stepsSoFar >= MAX_STEPS) return true;
    const done = stepSwarm(state.swarm, DEFAULT_DT);
    if (state.criticalSwarm) stepSwarm(state.criticalSwarm, DEFAULT_DT);
    state.stepsSoFar += 1;
    if (done) return true;
  }
  return false;
}

function px(x, y) {
  return {
    px: ((x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin)) * W,
    py: (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)) * H,
  };
}

function drawCircle(rWorld, strokeStyle, lineWidth, dash) {
  const center = px(0, 0);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  if (dash) ctx.setLineDash(dash);
  const radiusPx = (rWorld / (VIEW.xmax - VIEW.xmin)) * W;
  ctx.beginPath();
  ctx.arc(center.px, center.py, radiusPx, 0, 2 * Math.PI);
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
}

function drawFrame() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -12; x <= 12; x += 3) {
    const { px: xp } = px(x, 0);
    ctx.moveTo(xp, 0); ctx.lineTo(xp, H);
  }
  for (let y = -6; y <= 6; y += 3) {
    const { py: yp } = px(0, y);
    ctx.moveTo(0, yp); ctx.lineTo(W, yp);
  }
  ctx.stroke();

  // axes
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const o = px(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H);
  ctx.stroke();

  // photon-sphere dashed circle r = 3
  drawCircle(R_PHOTON_SPHERE, tokens.fgFaint, 1.0, [4, 5]);

  // b_crit reference lines and critical trails (toggle)
  if (state.showBcrit) {
    // horizontal dashed reference lines at y = +/- b_crit on the incoming side
    const yTopPlus  = px(0,  B_CRIT).py;
    const yTopMinus = px(0, -B_CRIT).py;
    ctx.strokeStyle = tokens.fg;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    const xLeft  = px(VIEW.xmin, 0).px;
    const xRight = px(VIEW.xmax, 0).px;
    ctx.moveTo(xLeft, yTopPlus);  ctx.lineTo(xRight, yTopPlus);
    ctx.moveTo(xLeft, yTopMinus); ctx.lineTo(xRight, yTopMinus);
    ctx.stroke();
    ctx.setLineDash([]);
    // labels at left edge
    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = tokens.fg;
    ctx.textAlign = 'left';
    ctx.fillText('+b_crit', xLeft + 6, yTopPlus  - 4);
    ctx.fillText('-b_crit', xLeft + 6, yTopMinus + 14);
    // critical photons (drawn in fg, thick, before the main swarm so trails layer correctly)
    if (state.criticalSwarm) {
      const sw = state.criticalSwarm;
      ctx.strokeStyle = tokens.fg;
      ctx.lineWidth = 2.0;
      for (let i = 0; i < sw.N; i += 1) {
        const trail = sw.trails[i];
        if (trail.length < 2) continue;
        ctx.beginPath();
        const first = px(trail[0].x, trail[0].y);
        ctx.moveTo(first.px, first.py);
        for (let k = 1; k < trail.length; k += 1) {
          const p = px(trail[k].x, trail[k].y);
          ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      }
    }
  }

  // photon trails and current-position dots
  let nSwallowed = 0, nDeflected = 0, nRunning = 0;
  if (state.swarm) {
    const sw = state.swarm;
    for (let i = 0; i < sw.N; i += 1) {
      const trail = sw.trails[i];
      const fate = sw.fates[i];
      ctx.strokeStyle = fate === SWALLOWED ? tokens.accentWarm
                        : fate === DEFLECTED ? tokens.accent
                        : tokens.fgMuted;
      ctx.lineWidth = fate === RUNNING ? 1.2 : 1.5;
      if (trail.length >= 2) {
        ctx.beginPath();
        const first = px(trail[0].x, trail[0].y);
        ctx.moveTo(first.px, first.py);
        for (let k = 1; k < trail.length; k += 1) {
          const p = px(trail[k].x, trail[k].y);
          ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      }
      if (fate === SWALLOWED) nSwallowed += 1;
      else if (fate === DEFLECTED) nDeflected += 1;
      else nRunning += 1;
    }
    // leading-edge dots for photons still en route
    for (let i = 0; i < sw.N; i += 1) {
      if (sw.fates[i] !== RUNNING) continue;
      const p = photonPosition(sw, i);
      const pp = px(p.x, p.y);
      ctx.fillStyle = tokens.fg;
      ctx.beginPath();
      ctx.arc(pp.px, pp.py, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // central black hole (event horizon)
  const center = px(0, 0);
  const horizonPx = (R_HORIZON / (VIEW.xmax - VIEW.xmin)) * W;
  ctx.fillStyle = tokens.fg;
  ctx.beginPath();
  ctx.arc(center.px, center.py, horizonPx, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = tokens.accentWarm;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center.px, center.py, horizonPx, 0, 2 * Math.PI);
  ctx.stroke();

  // titles
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Plane wave of photons at Schwarzschild BH (M = 1, geometric units)', 20, 20);
  ctx.fillText('Red trails: swallowed.  Blue trails: deflected.  Dashed circle: photon sphere r = 3.', 20, 36);

  // live readout overlay (top-right)
  const lines = [
    `N         ${String(state.N).padStart(4)}`,
    `b_max     ${state.bMax.toFixed(2).padStart(4)}`,
    `b_crit    ${B_CRIT.toFixed(3)}`,
    `step      ${String(state.stepsSoFar).padStart(4)}`,
    `running   ${String(nRunning).padStart(4)}`,
    `swallow   ${String(nSwallowed).padStart(4)}`,
    `deflect   ${String(nDeflected).padStart(4)}`,
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = tokens.fg;
  const xRight = W - 16;
  let y = 20;
  for (const line of lines) {
    ctx.fillText(line, xRight, y);
    y += 14;
  }

  // mirror counts to DOM readouts
  readouts.N.textContent         = String(state.N);
  readouts.bMax.textContent      = state.bMax.toFixed(2);
  readouts.bCrit.textContent     = B_CRIT.toFixed(4);
  readouts.swallowed.textContent = String(nSwallowed);
  readouts.deflected.textContent = String(nDeflected);
}

function stopAnim() {
  if (state.rafId !== null) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  state.animating = false;
}

function startAnim() {
  if (state.animating) return;
  state.animating = true;
  const tick = () => {
    const done = stepN(SUBSTEPS_PER_FRAME);
    drawFrame();
    if (done || state.stepsSoFar >= MAX_STEPS) {
      stopAnim();
      return;
    }
    state.rafId = requestAnimationFrame(tick);
  };
  state.rafId = requestAnimationFrame(tick);
}

function applySliders() {
  state.N    = parseInt(sliderN.value, 10);
  state.bMax = parseFloat(sliderBmax.value);
  valueN.textContent    = String(state.N);
  valueBmax.textContent = state.bMax.toFixed(2);
  stopAnim();
  buildSwarm();
  drawFrame();
  startAnim();
}

sliderN.addEventListener('change', applySliders);
sliderBmax.addEventListener('change', applySliders);

btnReset.addEventListener('click', () => {
  sliderN.value    = '41';
  sliderBmax.value = '9';
  applySliders();
});

chkBcrit.addEventListener('change', () => {
  state.showBcrit = chkBcrit.checked;
  drawFrame();
});

function bootSync() {
  if (CAPTURE_NAME) {
    // Deterministic capture mode: hold (N, bMax) fixed at the default and
    // sweep simulation time via captureFraction. t-000 shows the plane wave
    // just released; t-100 shows the resolved fan.
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.N    = 41;
    state.bMax = 9;
    sliderN.value    = String(state.N);
    sliderBmax.value = state.bMax.toString();
    valueN.textContent    = String(state.N);
    valueBmax.textContent = state.bMax.toFixed(2);
    buildSwarm();
    const target = Math.round(frac * CAPTURE_TOTAL_STEPS);
    stepN(target);
    drawFrame();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const detail = { capture: CAPTURE_NAME, seed: SEED, N: state.N, bMax: state.bMax, steps: state.stepsSoFar };
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = detail;
        });
      });
    }
  } else {
    state.N    = parseInt(sliderN.value, 10);
    state.bMax = parseFloat(sliderBmax.value);
    valueN.textContent    = String(state.N);
    valueBmax.textContent = state.bMax.toFixed(2);
    buildSwarm();
    drawFrame();
    startAnim();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
