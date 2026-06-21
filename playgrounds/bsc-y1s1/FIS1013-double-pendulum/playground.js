import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// UI binding for the double-pendulum playground. Wires shared/js/engine/symplectic.js
// to a Canvas2D rendering, drag-and-drop bob positioning, slider parameter editing,
// and a live readout panel. All numerics live in ./sim.js and the shared engine.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import {
  create as engineCreate,
  step as engineStep,
  diagnostics as engineDiagnostics,
} from '../../../shared/js/engine/symplectic.js';
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
  theta0: document.getElementById('slider-theta0'),
  pend: document.getElementById('slider-pend'),
};
const sliderValues = {
  m1: document.getElementById('value-m1'),
  m2: document.getElementById('value-m2'),
  l1: document.getElementById('value-l1'),
  l2: document.getElementById('value-l2'),
  theta0: document.getElementById('value-theta0'),
  pend: document.getElementById('value-pend'),
};
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

// Portrait layout: the pendulum (with its chaos ensemble) fills the top, the
// divergence-vs-time plot sits below. Support/scale derive from the scene
// region and the arm lengths (fitScene), recomputed on resize and on length
// changes.
let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
let SUPPORT_X = 380, SUPPORT_Y = 200, PPM = 90;
function fitScene() {
  const s = REG.scene;
  SUPPORT_X = s.x + s.w / 2;
  SUPPORT_Y = s.y + s.h * 0.46;
  PPM = Math.min(s.w * 0.46, s.h * 0.46) / (state.l1 + state.l2 + 0.1);
}
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.6 },
    { name: 'diag', weight: 1.4 },
  ]);
  fitScene();
  state.trail.length = 0;
}

const TRAIL_MAX = 2400;    // number of (x2, y2) samples to keep (~2.4 s of motion at PHYSICS_DT=1ms)
const TRAIL_DECAY = 0.55;  // peak alpha at the head of the trail; linear decay toward the tail
const DIV_MAX = 12000;     // divergence samples (~12 s at 1 ms)
const LOOP_T = 20.0;       // re-converge the ensemble after this many seconds

// Default IC (rad) and parameters (kg, m), per spec.
// Chaotic regime by default: both arms well raised so the motion is
// strongly chaotic and the 1 ppm ensemble fans apart on screen (the
// whole point of the demo). Low-amplitude ICs are quasi-periodic and
// never diverge.
const DEFAULT_IC = {
  theta1: 2.9,
  theta2: 2.9,
  omega1: 0,
  omega2: 0,
};

// Live state.
const state = {
  m1: 1.0,
  m2: 1.0,
  l1: 1.0,
  l2: 1.0,
  nPend: 18,            // ensemble size (slider)
  theta0: 2.9,          // initial release angle for both arms (slider)
  inst: null,
  poincare: new PoincareCounter(),
  trail: [],            // ring buffer of {x, y} for bob 2 (physical-space trail)
  divergence: [],       // {t, spread} ensemble spread over time (chaos signature)
  simT: 0,              // accumulated sim time for the divergence plot
  playing: !(DETERMINISTIC || prefersReducedMotion()),
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

// 10-member chaos ensemble: identical except theta1 offset by k * 1 ppm.
// They track the primary at first, then diverge exponentially (the
// signature of deterministic chaos / sensitive dependence).
// A 1e-3 rad seed (a thousandth of a radian, ~0.06 deg): invisible at first so
// the members look like one pendulum, then they fan apart within a few seconds
// into the colored spray, and the divergence plot climbs from the seed to
// chaotic saturation.
const ENSEMBLE_DTHETA = 1e-3;
const ENS_TRAIL_MAX = 90;     // per-member bob-2 trail length (the colored fan)
// Kept as a module-scope array (not on `state`) so the existing drag and
// phase-panel logic, which only reads state.inst, is untouched.
let ensemble = [];
function ensembleColor(k, n) {
  const c = viridis(0.06 + 0.9 * (k - 1) / Math.max(1, n - 1));
  return { rgb: `rgb(${c.r},${c.g},${c.b})`, r: c.r, g: c.g, b: c.b };
}

function makeInst(theta1, theta2, omega1, omega2) {
  const params = { l1: state.l1, l2: state.l2 };
  return engineCreate({
    positions:  Float64Array.from([theta1, theta2]),
    velocities: Float64Array.from([omega1, omega2]),
    masses:     Float64Array.from([state.m1, state.m2]),
    accelerationFn:     makeAccel(params),
    energyFn:           makeEnergy(params),
    angularMomentumFn:  makeAngularMomentum(params),
    integrator: 'verlet',
  });
}

function rebuildEngine(ic) {
  state.inst = makeInst(ic.theta1, ic.theta2, ic.omega1, ic.omega2);
  ensemble = [];
  const n = Math.max(1, Math.round(state.nPend));
  for (let k = 1; k <= n; k += 1) {
    const c = ensembleColor(k, n);
    ensemble.push({
      inst: makeInst(ic.theta1 + k * ENSEMBLE_DTHETA, ic.theta2, ic.omega1, ic.omega2),
      color: c.rgb, r: c.r, g: c.g, b: c.b,
      trail: [],
    });
  }
  state.poincare.reset();
  state.trail.length      = 0;
  state.divergence.length = 0;
  state.simT = 0;
}
// IC from the current release-angle slider.
function currentIC() { return { theta1: state.theta0, theta2: state.theta0, omega1: 0, omega2: 0 }; }

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
  state.theta0 = DEFAULT_IC.theta1;
  state.nPend = 18;
  if (sliders.theta0) { sliders.theta0.value = String(state.theta0); sliderValues.theta0.textContent = `${(state.theta0 * 180 / Math.PI).toFixed(0)}°`; }
  if (sliders.pend) { sliders.pend.value = String(state.nPend); sliderValues.pend.textContent = String(state.nPend); }
  rebuildEngine(currentIC());
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

function drawDivergence() {
  const r = REG.diag;
  ctx.fillStyle = tokens.surface; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = tokens.fgFaint; ctx.lineWidth = 0.6; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.fillStyle = tokens.fgMuted; ctx.font = fontString(canvas, 'caption'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('separation between the pendulums (rad)', r.x + 8, r.y + 6);

  const padL = 52, padR = 14, padT = 28, padB = 28;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  const tMax = Math.max(8, state.simT);
  const yLo = -4, yHi = 0.6;                 // log10 separation: 1e-4 rad .. ~pi
  const fx = (t) => x0 + (t / tMax) * pw;
  const fy = (l) => y1 - (l - yLo) / (yHi - yLo) * ph;

  // Decade gridlines with real radian labels.
  ctx.font = fontString(canvas, 'tick'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const lab = { '-4': '1e-4', '-3': '1e-3', '-2': '1e-2', '-1': '0.1', '0': '1 rad' };
  for (const l of [-4, -3, -2, -1, 0]) {
    const py = fy(l);
    ctx.strokeStyle = tokens.grid; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillStyle = tokens.fgFaint; ctx.fillText(lab[String(l)], x0 - 4, py);
  }

  // Least-squares fit of ln(separation) vs t over the exponential-growth window
  // (above the 1e-6 seed, below saturation). The slope is the local Lyapunov
  // exponent: e^{lambda t} growth plots as a straight line here.
  let lam = null, c0 = 0, nFit = 0, sumT = 0, sumL = 0, sumTT = 0, sumTL = 0, tLo = Infinity, tHi = 0;
  for (const d of state.divergence) {
    if (d.s < 3e-6 || d.s > 0.5) continue;
    const L = Math.log(d.s);
    sumT += d.t; sumL += L; sumTT += d.t * d.t; sumTL += d.t * L; nFit += 1;
    if (d.t < tLo) tLo = d.t; if (d.t > tHi) tHi = d.t;
  }
  if (nFit >= 8) {
    const denom = nFit * sumTT - sumT * sumT;
    if (Math.abs(denom) > 1e-9) { lam = (nFit * sumTL - sumT * sumL) / denom; c0 = (sumL - lam * sumT) / nFit; }
  }
  lastLambda = (lam && lam > 0) ? lam : null;

  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
  // Lyapunov fit line.
  if (lam && lam > 0) {
    const k = 1 / Math.LN10;
    ctx.strokeStyle = tokens.accent; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(fx(tLo), fy((c0 + lam * tLo) * k)); ctx.lineTo(fx(tHi), fy((c0 + lam * tHi) * k)); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Separation curve.
  if (state.divergence.length >= 2) {
    ctx.strokeStyle = tokens.accentWarm; ctx.lineWidth = 1.8; ctx.beginPath();
    let first = true;
    for (const d of state.divergence) {
      const px = fx(d.t), py = fy(Math.log10(d.s));
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // x ticks.
  ctx.fillStyle = tokens.fgFaint; ctx.font = fontString(canvas, 'tick'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const dt = Math.max(2, Math.round(tMax / 4));
  for (let s = 0; s <= tMax + 1e-9; s += dt) ctx.fillText(`${s}s`, fx(s), y1 + 4);

  // Lyapunov annotation.
  ctx.font = fontString(canvas, 'caption'); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  if (lam && lam > 0) {
    ctx.fillStyle = tokens.accent;
    ctx.fillText(`lambda ~ ${lam.toFixed(2)}/s, doubles every ${(Math.LN2 / lam).toFixed(2)} s`, x1, r.y + 6);
  } else {
    ctx.fillStyle = tokens.fgMuted;
    ctx.fillText('low energy: no blow-up (regular motion)', x1, r.y + 6);
  }
  ctx.fillStyle = tokens.fgMuted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('a straight climb is exponential; the dashed slope is the Lyapunov rate', (x0 + x1) / 2, r.y + r.h - 3);
}

function drawAll() {
  if (!REG) relayout();
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  if (!state.inst) return;
  // Scene panel.
  const s = REG.scene;
  ctx.fillStyle = tokens.surface; ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = tokens.fgFaint; ctx.lineWidth = 0.6; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
  drawSupport();
  // The colored fan: each member's bob-2 trail, glowing (additive) and fading
  // along its length. This is the hero of the animation, the many near-identical
  // pendulums tracing wildly different paths from the same start.
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  for (const e of ensemble) {
    const tr = e.trail;
    if (!tr || tr.length < 2) continue;
    const n = tr.length;
    for (let i = 1; i < n; i += 1) {
      const a = i / n;
      ctx.strokeStyle = `rgba(${e.r},${e.g},${e.b},${(0.04 + 0.5 * a).toFixed(3)})`;
      ctx.lineWidth = 0.5 + 1.9 * a;
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'butt';
  // Member arms (thin, faint) + bob, fainter than the primary.
  for (const e of ensemble) {
    const { p1, p2 } = thetaToBobPx(e.inst.q[0], e.inst.q[1]);
    ctx.strokeStyle = e.color; ctx.globalAlpha = 0.30; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(SUPPORT_X, SUPPORT_Y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.globalAlpha = 0.85; ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(p2.x, p2.y, 2.6, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Primary trail + the lead pendulum, brightest and on top.
  drawTrail();
  const t1 = state.inst.q[0], t2 = state.inst.q[1];
  drawPendulum(t1, t2);
  // Title + chaos caption on the scene.
  ctx.fillStyle = tokens.fgMuted; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`${ensemble.length} pendulums, started a thousandth of a radian apart`, s.x + 8, s.y + 7);
  drawDivergence();
}

//
// Physics stepping.
//

let ensStep = 0;
let lastLambda = null;   // most recent fitted Lyapunov exponent (1/s) or null
function stepOnce() {
  engineStep(state.inst, PHYSICS_DT);
  for (const e of ensemble) engineStep(e.inst, PHYSICS_DT);
  const t1 = state.inst.q[0];
  const w1 = state.inst.qdot[0];
  state.poincare.observe(t1, w1);
  // append physical-space trail
  const { p2 } = thetaToBobPx(state.inst.q[0], state.inst.q[1]);
  state.trail.push(p2);
  if (state.trail.length > TRAIL_MAX) state.trail.shift();
  // Per-member bob-2 trails (the colored fan), subsampled to span ~1.5 s.
  ensStep = (ensStep + 1) % 8;
  if (ensStep === 0) {
    for (const e of ensemble) {
      const ep2 = thetaToBobPx(e.inst.q[0], e.inst.q[1]).p2;
      e.trail.push(ep2);
      if (e.trail.length > ENS_TRAIL_MAX) e.trail.shift();
    }
  }
  // Track the ensemble's spread from the primary: the configuration-space
  // distance of the farthest member. This grows exponentially (sensitive
  // dependence) then saturates, the quantitative signature of chaos.
  state.simT += PHYSICS_DT;
  let spread = 0;
  for (const e of ensemble) {
    const d = Math.hypot(angDiff(e.inst.q[0], t1), angDiff(e.inst.q[1], state.inst.q[1]));
    if (d > spread) spread = d;
  }
  state.divergence.push({ t: state.simT, s: Math.max(spread, 1e-9) });
  if (state.divergence.length > DIV_MAX) state.divergence.shift();
}
function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
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
  const sx   = view.w / rect.width;
  const sy   = view.h / rect.height;
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
    fitScene();
    drawAll();
    updateReadouts(true);
  });
}

bindSlider('m1', 'kg', 1);
bindSlider('m2', 'kg', 1);
bindSlider('l1', 'm',  2);
bindSlider('l2', 'm',  2);

if (sliders.theta0) sliders.theta0.addEventListener('input', () => {
  state.theta0 = parseFloat(sliders.theta0.value);
  sliderValues.theta0.textContent = `${(state.theta0 * 180 / Math.PI).toFixed(0)}°`;
  rebuildEngine(currentIC()); fitScene(); drawAll(); updateReadouts(true);
});
if (sliders.pend) sliders.pend.addEventListener('input', () => {
  state.nPend = parseInt(sliders.pend.value, 10);
  sliderValues.pend.textContent = String(state.nPend);
  rebuildEngine(currentIC()); drawAll(); updateReadouts(true);
});

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
const CAPTURE_TOTAL_T = 11.0;

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); drawAll(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
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
  // Loop: once the ensemble has fully diverged, re-converge it and replay
  // the start-together-then-fan-apart story.
  if (state.simT > LOOP_T) { rebuildEngine(currentIC()); }
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!state.inst) return { fields: [] };
  const i = state.inst;
  return {
    fields: [
      { key: 'theta1', label: 'upper angle $\\theta_1$', value: i.q[0], format: 'float' },
      { key: 'theta2', label: 'lower angle $\\theta_2$', value: i.q[1], format: 'float' },
      { key: 'npend', label: 'pendulums', value: ensemble.length, format: 'int' },
      { key: 'lyap', label: 'Lyapunov $\\lambda$ (1/s)', value: lastLambda || 0, format: 'float' },
      { key: 'doubling', label: 'separation doubles every (s)', value: lastLambda ? Math.LN2 / lastLambda : 0, format: 'float' },
    ],
  };
};
// The double pendulum is Hamiltonian; the velocity-Verlet integrator
// is symplectic, so the total mechanical energy stays bounded. The
// engine already tracks the relative energy drift.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const d = engineDiagnostics(state.inst);
      const drift = Math.abs(d.energyDrift);
      return [{
        key: 'energy',
        label: 'total energy conserved (symplectic)',
        value: drift.toExponential(2),
        status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
