// playground.js
// Kepler Solar System: the four inner planets orbiting a central mass with
// realistic (a, e), plus a fifth user-controllable test particle. A live
// Kepler-III plot (T^2 vs a^3) shows that every body lands on the same line.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  PLANETS, createSwarm, stepSwarm, bodyPosition,
  keplerThirdLaw, DEFAULT_DT,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderTestA  = document.getElementById('slider-test-a');
const sliderTestE  = document.getElementById('slider-test-e');
const valueTestA   = document.getElementById('value-test-a');
const valueTestE   = document.getElementById('value-test-e');
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

// World coordinate window: Mars semi-major axis 1.524 AU plus eccentricity
// gives apastron 1.66 AU; with a 5th user-test orbit up to a = 2.5, e = 0.6
// the system extends to ~ 4 AU. View [-3.5, 3.5] x [-2.2, 2.2].
const VIEW = { xmin: -3.5, xmax: 3.5, ymin: -2.2, ymax: 2.2 };

// Kepler-III inset (top-right).
const KPL = { x: 600, y: 40, w: 250, h: 180, log_a3_min: -2, log_a3_max: 1.6, log_T2_min: -1, log_T2_max: 2.6 };

const TRAIL_MAX = 6000;

const state = {
  test:    { a: 1.8, e: 0.45, omega: 0.7 * Math.PI },
  swarm:   null,
  trails:  [],            // array of arrays of {x,y}, one per body
  speed:   1.0,           // years/sec
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  t:       0,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:        cssVar('--bg', '#FBFBF9'),
  surface:   cssVar('--surface', '#FFFFFF'),
  fg:        cssVar('--fg', '#1A1B1C'),
  fgMuted:   cssVar('--fg-muted', '#5C5E61'),
  fgFaint:   cssVar('--fg-faint', '#9A9C9F'),
  accent:    cssVar('--accent', '#1B6CA8'),
  accentWarm:cssVar('--accent-warm', '#C13B27'),
  cat1:      cssVar('--cat-1', '#4C72B0'),
  cat2:      cssVar('--cat-2', '#DD8452'),
  cat3:      cssVar('--cat-3', '#55A868'),
  cat4:      cssVar('--cat-4', '#C44E52'),
  grid:      cssVar('--grid', '#9A9C9F4D'),
};
const PLANET_COLOR = {
  'cat-1': tokens.cat1,
  'cat-2': tokens.cat2,
  'cat-3': tokens.cat3,
  'cat-4': tokens.cat4,
};

function allBodies() {
  return [...PLANETS, {
    name: 'Test',
    a: state.test.a,
    e: state.test.e,
    omega: state.test.omega,
    color: 'accent-warm',
  }];
}

function rebuildSwarm() {
  const bodies = allBodies();
  state.swarm = createSwarm(bodies);
  state.trails = bodies.map(() => []);
  state.t = 0;
}

function pxWorld(x, y) {
  return {
    px: ((x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin)) * W,
    py: (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)) * H,
  };
}

function pxKepler(log_a3, log_T2) {
  return {
    px: KPL.x + (log_a3 - KPL.log_a3_min) / (KPL.log_a3_max - KPL.log_a3_min) * KPL.w,
    py: KPL.y + (1 - (log_T2 - KPL.log_T2_min) / (KPL.log_T2_max - KPL.log_T2_min)) * KPL.h,
  };
}

function drawBackground() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  // grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -3; x <= 3; x += 1) {
    const { px: xp } = pxWorld(x, 0);
    ctx.moveTo(xp, 0); ctx.lineTo(xp, H);
  }
  for (let y = -2; y <= 2; y += 1) {
    const { py: yp } = pxWorld(0, y);
    ctx.moveTo(0, yp); ctx.lineTo(W, yp);
  }
  ctx.stroke();
  // axes
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const o = pxWorld(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H);
  ctx.stroke();
}

function drawSun() {
  const o = pxWorld(0, 0);
  ctx.fillStyle = '#F2C641';
  ctx.beginPath();
  ctx.arc(o.px, o.py, 9, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = tokens.fg;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBodyTrailAndDot(idx, body, color) {
  // trail
  const trail = state.trails[idx];
  if (trail.length >= 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    const first = pxWorld(trail[0].x, trail[0].y);
    ctx.moveTo(first.px, first.py);
    for (let i = 1; i < trail.length; i += 1) {
      const p = pxWorld(trail[i].x, trail[i].y);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // current position
  const { x, y } = bodyPosition(state.swarm, idx);
  const p = pxWorld(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.px, p.py, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = tokens.fg;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

function drawKeplerThirdLawInset() {
  // Panel background uses a soft tinted surface so it reads as a real
  // subplot rather than a flat white box.
  ctx.fillStyle = 'rgba(26, 27, 28, 0.04)';
  ctx.fillRect(KPL.x, KPL.y, KPL.w, KPL.h);
  ctx.strokeStyle = tokens.fg;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(KPL.x + 0.5, KPL.y + 0.5, KPL.w - 1, KPL.h - 1);

  // gridlines at every integer in log space
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let v = Math.ceil(KPL.log_a3_min); v <= Math.floor(KPL.log_a3_max); v += 1) {
    const p = pxKepler(v, 0);
    ctx.moveTo(p.px, KPL.y); ctx.lineTo(p.px, KPL.y + KPL.h);
  }
  for (let v = Math.ceil(KPL.log_T2_min); v <= Math.floor(KPL.log_T2_max); v += 1) {
    const p = pxKepler(0, v);
    ctx.moveTo(KPL.x, p.py); ctx.lineTo(KPL.x + KPL.w, p.py);
  }
  ctx.stroke();
  // axis tick labels
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let v = Math.ceil(KPL.log_a3_min); v <= Math.floor(KPL.log_a3_max); v += 1) {
    const p = pxKepler(v, KPL.log_T2_min);
    ctx.fillText(`10^${v}`, p.px, KPL.y + KPL.h + 12);
  }
  ctx.textAlign = 'right';
  for (let v = Math.ceil(KPL.log_T2_min); v <= Math.floor(KPL.log_T2_max); v += 1) {
    const p = pxKepler(KPL.log_a3_min, v);
    ctx.fillText(`10^${v}`, KPL.x - 4, p.py + 3);
  }

  // Kepler-III line on log-log axes (slope 1 in the (log_a3, log_T2 / 4 pi^2) plane)
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  const p0 = pxKepler(KPL.log_a3_min, KPL.log_a3_min);
  const p1 = pxKepler(KPL.log_a3_max, KPL.log_a3_max);
  ctx.moveTo(p0.px, p0.py); ctx.lineTo(p1.px, p1.py);
  ctx.stroke();
  ctx.setLineDash([]);

  // data points with planet name labels
  const bodies = allBodies();
  for (let i = 0; i < bodies.length; i += 1) {
    const a = bodies[i].a;
    const T = keplerThirdLaw(a);
    const log_a3 = Math.log10(a * a * a);
    const log_T2 = Math.log10(T * T / (4 * Math.PI * Math.PI));
    const p = pxKepler(log_a3, log_T2);
    const c = bodies[i].color === 'accent-warm' ? tokens.accentWarm : PLANET_COLOR[bodies[i].color];
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = tokens.fg;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    // label
    ctx.fillStyle = tokens.fg;
    ctx.font = '10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(bodies[i].name, p.px + 8, p.py + 3);
  }

  // axis labels
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("Kepler's third law: T^2 proportional to a^3", KPL.x + KPL.w / 2, KPL.y - 8);
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tokens.fgFaint;
  ctx.fillText('a^3 (AU^3)', KPL.x + KPL.w / 2, KPL.y + KPL.h + 26);
  ctx.save();
  ctx.translate(KPL.x - 36, KPL.y + KPL.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('T^2 / (4 pi^2) (yr^2)', 0, 0);
  ctx.restore();
}

function drawLegendAndReadout() {
  const bodies = allBodies();
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  let y = 50;
  for (let i = 0; i < bodies.length; i += 1) {
    const b = bodies[i];
    const c = b.color === 'accent-warm' ? tokens.accentWarm : PLANET_COLOR[b.color];
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(28, y - 3, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = tokens.fg;
    // Kepler-III period in real years: T_yr = a^1.5 (one year per Earth orbit).
    const T_yr = Math.pow(b.a, 1.5);
    ctx.fillText(`${b.name}: a = ${b.a.toFixed(3)} AU, e = ${b.e.toFixed(3)}, T = ${T_yr.toFixed(2)} yr`,
                 42, y);
    y += 16;
  }

  // simulation time
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.t.toFixed(2)} yr`, 20, y + 6);
  ctx.fillText(`speed = ${state.speed.toFixed(1)} yr/s`, 20, y + 22);
}

function drawTitles() {
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Inner solar system. Yellow disc = Sun. Four real planets + one custom test orbit.',
               20, 22);
}

function drawAll() {
  drawBackground();
  drawTitles();
  drawLegendAndReadout();

  if (!state.swarm) return;
  const bodies = allBodies();
  for (let i = 0; i < bodies.length; i += 1) {
    const c = bodies[i].color === 'accent-warm' ? tokens.accentWarm : PLANET_COLOR[bodies[i].color];
    drawBodyTrailAndDot(i, bodies[i], c);
  }
  drawSun();
  drawKeplerThirdLawInset();
}

function stepN(nSteps) {
  if (!state.swarm) return;
  for (let i = 0; i < nSteps; i += 1) {
    stepSwarm(state.swarm, DEFAULT_DT);
    state.t += DEFAULT_DT / (2 * Math.PI);          // yr per step
    const bodies = allBodies();
    for (let b = 0; b < bodies.length; b += 1) {
      const { x, y } = bodyPosition(state.swarm, b);
      const trail = state.trails[b];
      trail.push({ x, y });
      if (trail.length > TRAIL_MAX) trail.shift();
    }
  }
}

function applyTestSliders() {
  state.test.a = parseFloat(sliderTestA.value);
  state.test.e = parseFloat(sliderTestE.value);
  valueTestA.textContent = state.test.a.toFixed(2);
  valueTestE.textContent = state.test.e.toFixed(2);
  rebuildSwarm();
}

sliderTestA.addEventListener('change', applyTestSliders);
sliderTestE.addEventListener('change', applyTestSliders);
sliderSpeed.addEventListener('input', () => {
  state.speed = parseFloat(sliderSpeed.value);
  valueSpeed.textContent = state.speed.toFixed(1);
});

btnReset.addEventListener('click', () => {
  sliderTestA.value = '1.8';
  sliderTestE.value = '0.45';
  sliderSpeed.value = '1.0';
  state.speed = 1.0;
  valueSpeed.textContent = '1.0';
  applyTestSliders();
});

btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuildSwarm();
  if (CAPTURE_NAME) {
    // Deterministic capture: integrate t (in yr) up to captureFraction * 2 yr
    // so the inner planets complete a few orbits and Mars completes ~ 1.
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const targetYears = frac * 2.0;
    const stepsNeeded = Math.round(targetYears * 2 * Math.PI / DEFAULT_DT);
    stepN(stepsNeeded);
    state.playing = false;
  }
  drawAll();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, t: state.t };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
function tick(now) {
  if (!state.playing) { lastFrameTime = now; requestAnimationFrame(tick); return; }
  const dtReal = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  // Years advanced this frame = dtReal * speed.
  // dt per step in GM=1 time = DEFAULT_DT; one orbit period at a=1 is
  // 2 pi GM=1 time = 1 yr. So years_step = DEFAULT_DT / (2 pi).
  const yearsToAdvance = dtReal * state.speed;
  const stepsNeeded = Math.round(yearsToAdvance * 2 * Math.PI / DEFAULT_DT);
  stepN(stepsNeeded);
  drawAll();
  requestAnimationFrame(tick);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
