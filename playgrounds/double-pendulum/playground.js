// playground.js
// UI binding for the double-pendulum playground. Wires shared/js/engine/symplectic.js
// to a Canvas2D rendering, drag-and-drop bob positioning, slider parameter editing,
// and a live readout panel. All numerics live in ./sim.js and the shared engine.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  create as engineCreate,
  step as engineStep,
  diagnostics as engineDiagnostics,
} from '../../shared/js/engine/symplectic.js';
import {
  makeAccel,
  makeEnergy,
  makeAngularMomentum,
  envelopeCap,
  potentialAtRest,
  bobPositions,
  PoincareCounter,
  PHYSICS_DT,
} from './sim.js';

// URL parameters
const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

// DOM handles
const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  theta1:   document.getElementById('readout-theta1'),
  theta2:   document.getElementById('readout-theta2'),
  E:        document.getElementById('readout-E'),
  dE:       document.getElementById('readout-dE'),
  poincare: document.getElementById('readout-poincare'),
};
const sliders = {
  m1: document.getElementById('slider-m1'),
  m2: document.getElementById('slider-m2'),
  l1: document.getElementById('slider-l1'),
  l2: document.getElementById('slider-l2'),
};
const sliderValues = {
  m1: document.getElementById('value-m1'),
  m2: document.getElementById('value-m2'),
  l1: document.getElementById('value-l1'),
  l2: document.getElementById('value-l2'),
};
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

// Layout: pendulum lives on the left half, phase trajectory on the right.
// Canvas is 880x500. Pendulum at SUPPORT_X = 220 leaves x in [40, 400] for
// the bob extent; phase panel sits at x in [470, 850].
const W = canvas.width, H = canvas.height;
const SUPPORT_X = 220;
const SUPPORT_Y = 90;
const PPM       = 90;

// Phase trajectory panel: theta1 on x in [-pi, pi], omega1 on y in [-8, 8].
const PHASE = { x: 470, y: 60, w: 380, h: 380,
                tMin: -Math.PI, tMax: Math.PI,
                wMin: -8,       wMax: 8 };
const PHASE_TRAIL_MAX = 4000;     // last 4 s of (theta1, omega1) samples

const TRAIL_MAX = 2400;    // number of (x2, y2) samples to keep (~2.4 s of motion at PHYSICS_DT=1ms)
const TRAIL_DECAY = 0.55;  // peak alpha at the head of the trail; linear decay toward the tail

// Default IC (rad) and parameters (kg, m), per spec.
const DEFAULT_IC = {
  theta1: 0.5,
  theta2: -0.3,
  omega1: 0,
  omega2: 0,
};

// Live state.
const state = {
  m1: 1.0,
  m2: 1.0,
  l1: 1.0,
  l2: 1.0,
  inst: null,
  poincare: new PoincareCounter(),
  trail: [],            // ring buffer of {x, y} for bob 2 (physical-space trail)
  phaseTrail: [],       // ring buffer of {t1, w1} for the phase panel
  playing: !DETERMINISTIC,
  dragging: null,       // 'bob1' | 'bob2' | null
  dragVelocityReset: false,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:          cssVar('--bg', '#FBFBF9'),
  surface:     cssVar('--surface', '#FFFFFF'),
  fg:          cssVar('--fg', '#1A1B1C'),
  fgMuted:     cssVar('--fg-muted', '#5C5E61'),
  fgFaint:     cssVar('--fg-faint', '#9A9C9F'),
  accent:      cssVar('--accent', '#1B6CA8'),
  accentSoft:  cssVar('--accent-soft', '#1B6CA822'),
  accentWarm:  cssVar('--accent-warm', '#C13B27'),
  grid:        cssVar('--grid', '#9A9C9F4D'),
};

//
// Engine instantiation, reset, and parameter updates.
//

function rebuildEngine(ic) {
  const params = { l1: state.l1, l2: state.l2 };
  const masses = Float64Array.from([state.m1, state.m2]);
  state.inst = engineCreate({
    positions:  Float64Array.from([ic.theta1, ic.theta2]),
    velocities: Float64Array.from([ic.omega1, ic.omega2]),
    masses,
    accelerationFn:     makeAccel(params),
    energyFn:           makeEnergy(params),
    angularMomentumFn:  makeAngularMomentum(params),
    integrator: 'verlet',
  });
  state.poincare.reset();
  state.trail.length      = 0;
  state.phaseTrail.length = 0;
}

function clampToEnvelope(theta1, theta2) {
  // If the IC at rest would exceed the energy cap, scale both angles toward zero.
  const cap = envelopeCap(state.m1, state.m2, state.l1, state.l2);
  let lo = 0, hi = 1;
  for (let it = 0; it < 24; it += 1) {
    const mid = 0.5 * (lo + hi);
    const V = potentialAtRest(mid * theta1, mid * theta2, state.m1, state.m2, state.l1, state.l2);
    if (V > cap) hi = mid; else lo = mid;
  }
  const s = 0.5 * (lo + hi);
  return { theta1: s * theta1, theta2: s * theta2 };
}

function reset() {
  rebuildEngine(DEFAULT_IC);
  updateReadouts(true);
  drawAll();
}

//
// Rendering.
//

function thetaToBobPx(t1, t2) {
  const { x1, y1, x2, y2 } = bobPositions(t1, t2, state.l1, state.l2);
  return {
    p1: { x: SUPPORT_X + PPM * x1, y: SUPPORT_Y - PPM * y1 },
    p2: { x: SUPPORT_X + PPM * x2, y: SUPPORT_Y - PPM * y2 },
  };
}

function drawSupport() {
  ctx.fillStyle = tokens.fgMuted;
  ctx.fillRect(SUPPORT_X - 20, SUPPORT_Y - 6, 40, 6);
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.5;
  for (let i = -16; i <= 16; i += 4) {
    ctx.beginPath();
    ctx.moveTo(SUPPORT_X + i, SUPPORT_Y - 6);
    ctx.lineTo(SUPPORT_X + i - 4, SUPPORT_Y - 12);
    ctx.stroke();
  }
}

function drawPendulum(t1, t2) {
  const { p1, p2 } = thetaToBobPx(t1, t2);
  const center = { x: SUPPORT_X, y: SUPPORT_Y };
  ctx.strokeStyle = tokens.fg;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  // pivot
  ctx.fillStyle = tokens.fg;
  ctx.beginPath(); ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI); ctx.fill();
  // bob 1
  const r1 = bobRadius(state.m1);
  ctx.fillStyle = tokens.surface;
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(p1.x, p1.y, r1, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  // bob 2
  const r2 = bobRadius(state.m2);
  ctx.fillStyle = tokens.accent;
  ctx.strokeStyle = tokens.accent;
  ctx.beginPath(); ctx.arc(p2.x, p2.y, r2, 0, 2 * Math.PI); ctx.fill();
  return { p1, p2 };
}

function bobRadius(mass) {
  // Map mass 0.1..5 to radius 4..14 px (rough perceptual scaling).
  return 4 + 10 * Math.cbrt(mass / 5);
}

function drawTrail() {
  if (state.trail.length < 2) return;
  ctx.strokeStyle = tokens.accent;
  ctx.lineWidth = 1.0;
  ctx.lineCap = 'round';
  // Linear alpha decay from TRAIL_DECAY at the head to 0 at the tail.
  const N = state.trail.length;
  for (let i = 1; i < N; i += 1) {
    ctx.globalAlpha = TRAIL_DECAY * (i / (N - 1));
    ctx.beginPath();
    ctx.moveTo(state.trail[i - 1].x, state.trail[i - 1].y);
    ctx.lineTo(state.trail[i].x, state.trail[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function phaseToPx(t1, w1) {
  return {
    px: PHASE.x + (t1 - PHASE.tMin) / (PHASE.tMax - PHASE.tMin) * PHASE.w,
    py: PHASE.y + (1 - (w1 - PHASE.wMin) / (PHASE.wMax - PHASE.wMin)) * PHASE.h,
  };
}

function drawPhasePanel() {
  // panel background
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(PHASE.x, PHASE.y, PHASE.w, PHASE.h);
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PHASE.x + 0.5, PHASE.y + 0.5, PHASE.w - 1, PHASE.h - 1);

  // axes through (0, 0)
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.5;
  const o = phaseToPx(0, 0);
  ctx.beginPath();
  ctx.moveTo(PHASE.x, o.py); ctx.lineTo(PHASE.x + PHASE.w, o.py);
  ctx.moveTo(o.px, PHASE.y); ctx.lineTo(o.px, PHASE.y + PHASE.h);
  ctx.stroke();

  // tick labels
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const [t, lbl] of [[-Math.PI, '-pi'], [0, '0'], [Math.PI, 'pi']]) {
    const { px: x } = phaseToPx(t, 0);
    ctx.fillText(lbl, x, PHASE.y + PHASE.h + 13);
  }
  ctx.textAlign = 'right';
  for (const w of [-6, -3, 0, 3, 6]) {
    const { py } = phaseToPx(0, w);
    ctx.fillText(String(w), PHASE.x - 4, py + 3);
  }

  // trajectory
  const N = state.phaseTrail.length;
  if (N >= 2) {
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = tokens.accent;
    ctx.lineCap = 'round';
    // Draw segments only when consecutive samples are within the panel
    // (skip the wrap discontinuity at +/- pi).
    ctx.beginPath();
    let drawing = false;
    for (let i = 1; i < N; i += 1) {
      const a = state.phaseTrail[i - 1];
      const b = state.phaseTrail[i];
      if (Math.abs(a.t1 - b.t1) > Math.PI * 0.5) {
        drawing = false;
        continue;
      }
      const pa = phaseToPx(a.t1, a.w1);
      const pb = phaseToPx(b.t1, b.w1);
      if (!drawing) { ctx.moveTo(pa.px, pa.py); drawing = true; }
      ctx.lineTo(pb.px, pb.py);
    }
    ctx.stroke();
  }

  // current point
  if (N >= 1) {
    const last = state.phaseTrail[N - 1];
    const { px, py } = phaseToPx(last.t1, last.w1);
    ctx.fillStyle = tokens.accentWarm;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = tokens.fg;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // labels
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Phase trajectory (theta1 mod 2pi, omega1)', PHASE.x, PHASE.y - 8);
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tokens.fgFaint;
  ctx.textAlign = 'center';
  ctx.fillText('theta1 (rad)', PHASE.x + PHASE.w / 2, PHASE.y + PHASE.h + 26);
  ctx.save();
  ctx.translate(PHASE.x - 32, PHASE.y + PHASE.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('omega1 (rad/s)', 0, 0);
  ctx.restore();
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSupport();
  drawTrail();
  const t1 = state.inst.q[0], t2 = state.inst.q[1];
  drawPendulum(t1, t2);
  drawPhasePanel();
}

//
// Physics stepping.
//

function stepOnce() {
  engineStep(state.inst, PHYSICS_DT);
  const t1 = state.inst.q[0];
  const w1 = state.inst.qdot[0];
  state.poincare.observe(t1, w1);
  // append physical-space trail
  const { p2 } = thetaToBobPx(state.inst.q[0], state.inst.q[1]);
  state.trail.push(p2);
  if (state.trail.length > TRAIL_MAX) state.trail.shift();
  // append phase-space sample (theta1 mod 2pi, omega1)
  let theta1 = t1;
  while (theta1 >   Math.PI) theta1 -= 2 * Math.PI;
  while (theta1 <= -Math.PI) theta1 += 2 * Math.PI;
  state.phaseTrail.push({ t1: theta1, w1 });
  if (state.phaseTrail.length > PHASE_TRAIL_MAX) state.phaseTrail.shift();
}

//
// Readouts (10 Hz throttle on the live path, immediate on resets).
//

let lastReadoutTime = -Infinity;

function updateReadouts(force) {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (!force && now - lastReadoutTime < 100) return;
  lastReadoutTime = now;
  const d = engineDiagnostics(state.inst);
  readouts.theta1.textContent = state.inst.q[0].toFixed(4);
  readouts.theta2.textContent = state.inst.q[1].toFixed(4);
  readouts.E.textContent      = d.energy.toFixed(4);
  readouts.dE.textContent     = Math.abs(d.energyDrift).toExponential(2);
  readouts.poincare.textContent = String(state.poincare.count);
  // warn when |dE/E| exceeds the spec invariant gate
  readouts.dE.classList.toggle('warn', Math.abs(d.energyDrift) > 1e-3);
}

//
// Drag handling on the canvas: pick the nearest bob within HIT_RADIUS_PX,
// set theta from the cursor angle relative to support (bob 1) or first bob (bob 2),
// and snap to the energy envelope at rest.
//

const HIT_RADIUS_PX = 22;

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function pixelToTheta1(px, py) {
  const dx = px - SUPPORT_X;
  const dy = py - SUPPORT_Y;
  return Math.atan2(dx, dy);
}

function pixelToTheta2(px, py) {
  const { p1 } = thetaToBobPx(state.inst.q[0], state.inst.q[1]);
  const dx = px - p1.x;
  const dy = py - p1.y;
  return Math.atan2(dx, dy);
}

function pickBob(p) {
  const { p1, p2 } = thetaToBobPx(state.inst.q[0], state.inst.q[1]);
  const d1 = Math.hypot(p.x - p1.x, p.y - p1.y);
  const d2 = Math.hypot(p.x - p2.x, p.y - p2.y);
  if (Math.min(d1, d2) > HIT_RADIUS_PX) return null;
  return d2 < d1 ? 'bob2' : 'bob1';
}

function onPointerDown(e) {
  if (!state.inst) return;
  const p = canvasPos(e);
  const which = pickBob(p);
  if (which) {
    state.dragging = which;
    canvas.setPointerCapture?.(e.pointerId);
    applyDrag(p);
    e.preventDefault();
  }
}

function applyDrag(p) {
  let t1 = state.inst.q[0], t2 = state.inst.q[1];
  if (state.dragging === 'bob1') t1 = pixelToTheta1(p.x, p.y);
  else                            t2 = pixelToTheta2(p.x, p.y);
  const clamped = clampToEnvelope(t1, t2);
  // Reset velocities while the user is positioning the system.
  rebuildEngine({ theta1: clamped.theta1, theta2: clamped.theta2, omega1: 0, omega2: 0 });
  drawAll();
  updateReadouts(true);
}

function onPointerMove(e) {
  if (!state.dragging) return;
  applyDrag(canvasPos(e));
}

function onPointerUp() {
  state.dragging = null;
}

canvas.addEventListener('pointerdown',   onPointerDown);
canvas.addEventListener('pointermove',   onPointerMove);
canvas.addEventListener('pointerup',     onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);
canvas.addEventListener('dblclick', () => {
  state.inst.qdot[0] = 0; state.inst.qdot[1] = 0;
  state.poincare.reset();
  state.trail.length = 0;
  drawAll();
  updateReadouts(true);
});

//
// Slider wiring.
//

function readSlider(key) {
  const v = parseFloat(sliders[key].value);
  return Number.isFinite(v) ? v : state[key];
}

function bindSlider(key, unit, decimals) {
  sliders[key].addEventListener('input', () => {
    state[key] = readSlider(key);
    sliderValues[key].textContent = `${state[key].toFixed(decimals)} ${unit}`;
    // Re-build the engine preserving angles and velocities (but rescaled potential
    // and inertia parameters). Use current state as the new IC.
    const ic = {
      theta1: state.inst.q[0],
      theta2: state.inst.q[1],
      omega1: state.inst.qdot[0],
      omega2: state.inst.qdot[1],
    };
    rebuildEngine(ic);
    drawAll();
    updateReadouts(true);
  });
}

bindSlider('m1', 'kg', 1);
bindSlider('m2', 'kg', 1);
bindSlider('l1', 'm',  2);
bindSlider('l2', 'm',  2);

btnReset.addEventListener('click', reset);
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', state.playing ? 'false' : 'true');
});

//
// Capture mode and main loop.
//
// The capture script sets captureFraction in [0, 1]; we map it to integration time:
// frac=0 to frac=1 spans 0 to 6 seconds. Five frames at frac 0, 0.25, 0.5, 0.75, 1
// give t = 0, 1.5, 3, 4.5, 6 s; enough to show coupled-pendulum motion in the
// default quasi-periodic IC.
//
const CAPTURE_TOTAL_T = 6.0;

function bootSync() {
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target_t = CAPTURE_TOTAL_T * frac;
    const stepsNeeded = Math.round(target_t / PHYSICS_DT);
    for (let i = 0; i < stepsNeeded; i += 1) stepOnce();
    drawAll();
    updateReadouts(true);
    state.playing = false;
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = {
          capture: CAPTURE_NAME ?? null,
          seed: SEED,
          theta1: state.inst.q[0],
          theta2: state.inst.q[1],
        };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

//
// Render loop (only used in live mode).
//
let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let accumulator   = 0;

function tick(now) {
  if (!state.playing) {
    lastFrameTime = now;
    drawAll();
    requestAnimationFrame(tick);
    return;
  }
  const frameDt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  accumulator += frameDt;
  let safety = 0;
  while (accumulator >= PHYSICS_DT && safety < 240) {
    stepOnce();
    accumulator -= PHYSICS_DT;
    safety += 1;
  }
  drawAll();
  updateReadouts(false);
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
