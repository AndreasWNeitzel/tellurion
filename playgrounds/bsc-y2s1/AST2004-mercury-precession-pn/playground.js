import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Schwarzschild-effective-potential orbit with tunable GR-strength alpha.
// Orange: current orbit (last single revolution). Faint blue: four recent
// orbits, fading. Red dots: perihelion passages. Yellow disc: central body.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createMercury, stepMercury, mercuryDiagnostics,
  DEFAULT_DT, DEFAULT_ALPHA, DEFAULT_E,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderAlpha  = document.getElementById('slider-alpha');
const sliderE      = document.getElementById('slider-e');
const sliderSpeed  = document.getElementById('slider-speed');
const valueAlpha   = document.getElementById('value-alpha');
const valueE       = document.getElementById('value-e');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW_R = 1.25;                            // tightened so the orbit fills the scene
const SCENE_H = H - 225;                         // reserve a band below for the precession plot
const CX = W / 2, CY = SCENE_H / 2;
const PX_PER_UNIT = Math.min(W, SCENE_H) / (2 * VIEW_R);
const STEPS_PER_FRAME_BASE = 30;

const state = {
  merc: null,
  alpha: DEFAULT_ALPHA,
  e: DEFAULT_E,
  speed: 0.5,
  ringBuffer: [],
  recentOrbits: [],
  currentOrbit: [],
  perihelions: [],
  rPrev: Infinity, rCurr: Infinity, rNext: Infinity,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  rafId: null,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  fg:        cssVar('--fg', '#1A1B1C'),
  fgMuted:   cssVar('--fg-muted', '#5C5E61'),
  accent:    cssVar('--accent', '#1B6CA8'),
  accentWarm:cssVar('--accent-warm', '#C13B27'),
};

function toPx(x, y) {
  return { px: CX + x * PX_PER_UNIT, py: CY - y * PX_PER_UNIT };
}

function rebuild() {
  state.merc = createMercury({ alpha: state.alpha, e: state.e, integrator: 'verlet' });
  state.recentOrbits = [];
  state.currentOrbit = [];
  state.perihelions = [];
  state.rPrev = Infinity; state.rCurr = Infinity; state.rNext = Infinity;
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let k = 1; k <= 2; k += 1) {
    ctx.beginPath();
    ctx.arc(CX, CY, k * 0.5 * PX_PER_UNIT, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, CY); ctx.lineTo(W, CY);
  ctx.moveTo(CX, 0); ctx.lineTo(CX, SCENE_H);
  ctx.stroke();

  for (let oi = 0; oi < state.recentOrbits.length; oi += 1) {
    const orb = state.recentOrbits[oi];
    const fade = (oi + 1) / state.recentOrbits.length;
    ctx.strokeStyle = `rgba(120, 165, 220, ${0.10 + 0.25 * fade})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < orb.length; i += 1) {
      const p = toPx(orb[i][0], orb[i][1]);
      if (!started) { ctx.moveTo(p.px, p.py); started = true; }
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  if (state.currentOrbit.length >= 2) {
    ctx.strokeStyle = tokens.accentWarm;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const f = toPx(state.currentOrbit[0][0], state.currentOrbit[0][1]);
    ctx.moveTo(f.px, f.py);
    for (let i = 1; i < state.currentOrbit.length; i += 1) {
      const p = toPx(state.currentOrbit[i][0], state.currentOrbit[i][1]);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // apsidal line: from the centre through the latest perihelion, the direction
  // that slowly rotates as the orbit precesses
  if (state.perihelions.length) {
    const ph = state.perihelions[state.perihelions.length - 1];
    const ang = Math.atan2(ph.y, ph.x), rr = VIEW_R * 0.98;
    const a1 = toPx(rr * Math.cos(ang), rr * Math.sin(ang));
    const a2 = toPx(-rr * Math.cos(ang), -rr * Math.sin(ang));
    ctx.strokeStyle = 'rgba(255, 120, 120, 0.35)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(a1.px, a1.py); ctx.lineTo(a2.px, a2.py); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const ph of state.perihelions) {
    const p = toPx(ph.x, ph.y);
    ctx.fillStyle = '#ff5050';
    ctx.beginPath();
    ctx.arc(p.px, p.py, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = '#ffd96a';
  ctx.beginPath();
  ctx.arc(CX, CY, 6, 0, 2 * Math.PI);
  ctx.fill();

  if (state.merc) {
    const last = state.merc.inst.q;
    const p = toPx(last[0], last[1]);
    ctx.fillStyle = tokens.accent;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  drawReadout();
  drawPrecessionPlot();
}

// Quantitative diagnostic: the perihelion longitude advances by a fixed angle
// each orbit, so plotting it against perihelion number gives a straight line
// whose slope IS the precession rate. A pure Kepler orbit (alpha = 0) would sit
// flat; the post-Newtonian term tilts it.
function drawPrecessionPlot() {
  const ph = state.perihelions;
  const p = { x: 26, y: SCENE_H + 14, w: W - 52, h: H - SCENE_H - 32 };
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('perihelion longitude vs orbit: a straight line, slope = the precession rate', p.x + 8, p.y + 6);
  if (ph.length < 2) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('accumulating perihelia...', p.x + 8, p.y + 24); return; }
  // Unwrap the longitudes so the prograde advance is monotone.
  const lon = []; let prev = 0, off = 0;
  for (let i = 0; i < ph.length; i += 1) {
    let a = Math.atan2(ph[i].y, ph[i].x);
    if (i > 0) { while (a + off - prev < -Math.PI) off += 2 * Math.PI; while (a + off - prev > Math.PI) off -= 2 * Math.PI; }
    const v = a + off; lon.push(v); prev = v;
  }
  const n = lon.length;
  const ax = p.x + 42, ay = p.y + 26, aw = p.w - 42 - 14, ah = p.h - 26 - 24;
  let lonMin = Math.min(...lon), lonMax = Math.max(...lon);
  if (lonMax - lonMin < 1e-3) { lonMax += 1e-3; lonMin -= 1e-3; }
  const span = lonMax - lonMin;
  const xOf = (i) => ax + (n > 1 ? i / (n - 1) : 0) * aw;
  const yOf = (v) => ay + ah - (v - lonMin) / span * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.strokeRect(ax, ay, aw, ah);
  ctx.strokeStyle = '#ff7878'; ctx.lineWidth = 2; ctx.beginPath();
  lon.forEach((v, i) => { const X = xOf(i), Y = yOf(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
  lon.forEach((v, i) => { ctx.fillStyle = '#ff5050'; ctx.beginPath(); ctx.arc(xOf(i), yOf(v), 2.6, 0, 6.28); ctx.fill(); });
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(`${(lonMax * 180 / Math.PI).toFixed(0)}°`, ax - 5, yOf(lonMax));
  ctx.fillText(`${(lonMin * 180 / Math.PI).toFixed(0)}°`, ax - 5, yOf(lonMin));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('perihelion number', ax + aw / 2, ay + ah + 6);
  const perOrbit = (lon[n - 1] - lon[0]) / (n - 1) * 180 / Math.PI;
  ctx.fillStyle = '#ff9a9a'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText(`${perOrbit.toFixed(1)}° / orbit`, p.x + p.w - 10, p.y + 6);
}

function drawReadout() {
  if (!state.merc) return;
  const diag = mercuryDiagnostics(state.merc);
  const rows = [
    ['alpha',     state.alpha.toFixed(3)],
    ['e',         state.e.toFixed(2)],
    ['t',         diag.t.toFixed(2)],
    ['perihelia', String(state.perihelions.length)],
    ['dE/E',      diag.energyDrift.toExponential(2)],
    ['L',         diag.angularMomentum.toFixed(4)],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  let y = 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 18, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 220, y);
    y += 14;
  }
}

function trackPerihelion() {
  const y = state.merc.inst.q;
  const r = Math.hypot(y[0], y[1]);
  state.rPrev = state.rCurr;
  state.rCurr = state.rNext;
  state.rNext = r;
  if (Number.isFinite(state.rPrev) && state.rPrev > state.rCurr && state.rCurr < state.rNext) {
    state.perihelions.push({ x: y[0], y: y[1] });
    if (state.perihelions.length > 16) state.perihelions.shift();
    if (state.currentOrbit.length > 10) {
      state.recentOrbits.push(state.currentOrbit);
      if (state.recentOrbits.length > 4) state.recentOrbits.shift();
    }
    state.currentOrbit = [];
  }
}

function tickN(nSteps) {
  if (!state.merc) return;
  const y = state.merc.inst.q;
  for (let i = 0; i < nSteps; i += 1) {
    stepMercury(state.merc, DEFAULT_DT);
    state.currentOrbit.push([y[0], y[1]]);
    if (state.currentOrbit.length > 6000) state.currentOrbit.shift();
    trackPerihelion();
  }
}

function applyControls() {
  state.alpha = parseFloat(sliderAlpha.value);
  state.e     = parseFloat(sliderE.value);
  state.speed = parseFloat(sliderSpeed.value);
  valueAlpha.textContent = state.alpha.toFixed(3);
  valueE.textContent     = state.e.toFixed(2);
  valueSpeed.textContent = state.speed.toFixed(1);
  rebuild();
  drawAll();
}

sliderAlpha.addEventListener('change', applyControls);
sliderE.addEventListener('change', applyControls);
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(1);
});

btnReset.addEventListener('click', applyControls);
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();

  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const CAPTURE_TOTAL = 30_000;
    const target = Math.round(frac * CAPTURE_TOTAL);
    tickN(target);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', {
            detail: { capture: CAPTURE_NAME, seed: SEED, steps: target },
          }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED, steps: target };
        });
      });
    }
    return;
  }

  drawAll();
}

function tick() {
  if (state.playing) {
    const stepsThisFrame = Math.max(2, Math.round(STEPS_PER_FRAME_BASE * state.speed));
    tickN(stepsThisFrame);
    drawAll();
  }
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!state.merc) {
    return { fields: [{ key: 'init', label: 'Initializing', value: 'pending', format: undefined }] };
  }
  const diag = mercuryDiagnostics(state.merc);
  return {
    fields: [
      { key: 'post-newtonian-strength', label: 'GR strength alpha', value: state.alpha, format: 'float' },
      { key: 'eccentricity', label: 'Eccentricity e', value: state.e, format: 'float' },
      { key: 'orbital-energy', label: 'Orbital energy E', value: diag.energy || 0, format: 'float' },
      { key: 'angular-momentum', label: 'Angular momentum L', value: diag.angularMomentum || 0, format: 'float' },
      { key: 'perihelion-passages', label: 'Perihelion count', value: state.perihelions.length, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  if (!state.merc) {
    return [{ key: 'state-init', label: 'Initializing', value: 'pending', status: 'pending' }];
  }
  const diag = mercuryDiagnostics(state.merc);
  const E_drift = Math.abs(diag.energyDrift || 0);
  return [
    {
      key: 'energy-conservation',
      label: 'Relative energy drift',
      value: E_drift.toExponential(2),
      status: E_drift < 0.01 ? 'pass' : 'drift'
    },
    {
      key: 'orbit-closure-PN',
      label: 'Perihelion precession (GR)',
      value: state.perihelions.length > 2 ? 'yes' : 'accumulating',
      status: state.perihelions.length > 1 ? 'pending' : 'pending'
    }
  ];
};
