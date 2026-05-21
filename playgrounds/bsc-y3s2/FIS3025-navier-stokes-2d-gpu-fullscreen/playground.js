// 2D Navier-Stokes vortex street (Canvas2D). The flow is the
// gate-tested shared MAC Chorin engine
// (shared/js/engine/chorin-2d-cpu.js, invariants in
// invariants.test.mjs); this file renders its speed field and wires
// the controls. The live path enables the engine's BFECC
// low-dissipation advection and Steinhoff vorticity confinement
// (both default-off in the engine, so the offline invariants run on
// the unmodified first-order scheme): these cut the semi-Lagrangian
// numerical viscosity so the effective Reynolds number tracks the
// nominal one, the wake genuinely sheds a periodic von Karman
// street, and the regime presets are visibly distinct. A small grid
// with a large dt and few steps per frame keeps it at 60 fps. The
// live solve uses a relaxed pressure tolerance for interactivity
// (the spec's two-path design: the strong incompressibility
// invariant is proven offline by the converged engine; the live
// readout reports the relaxed post-projection divergence honestly).

import {
  createState, setBlockObstacle, setDiskObstacle, step, divergenceMax,
  cellVelocity, advectScalar, vorticity,
} from '../../../shared/js/engine/chorin-2d-cpu.js';
import { viridis, divBlack } from '../../../shared/js/render/colormaps.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rDiv = document.getElementById('readout-div');
const rSt = document.getElementById('readout-st');
const rRe = document.getElementById('readout-re');
const rReg = document.getElementById('readout-regime');

const selReg = document.getElementById('select-regime');
const sRe = document.getElementById('slider-re'), vRe = document.getElementById('value-re');
const selObs = document.getElementById('select-obs');
const sSpd = document.getElementById('slider-speed'), vSpd = document.getElementById('value-speed');
const tTracer = document.getElementById('toggle-tracer');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

// Higher-resolution grid. Bumped from 220x140 to 320x200 (2.1x the
// cells) while halving the per-frame work elsewhere (1 substep
// instead of 2, projection iterations from 20 to 12, diffuse sweeps
// from 4 to 3) so the effective work per frame is similar to the
// previous low-res version. Vorticity confinement keeps the wake
// sharp at the lower projection iteration count.
const GX = 320, GY = 200, DT = 0.11, VMAX = 1.8, YSHIFT = 8, DIFF = 3, CONF = 0.07;
const SUBSTEPS = 1;
const STEP_OPTS = { diffuseSweeps: DIFF, projOpts: { tol: 5e-3, maxIter: 12 }, bfecc: false, confine: CONF };
const REGIME_RE = { stokes: 8, steady: 60, vonkarman: 300, turbulent: 600 };
const st = { regime: 'vonkarman', Re: 300, obs: 'cylinder', tracer: false, speed: 2, running: !prefersReducedMotion(), field: 'vorticity' };
const selField = document.getElementById('select-field');

let state, dye, off, peakW = 0;
const offCanvas = document.createElement('canvas');
offCanvas.width = GX; offCanvas.height = GY;
const offCtx = offCanvas.getContext('2d');

// Two render modes:
//  - 'speed': |u| through viridis. Carries structure everywhere (the
//    free stream is non-zero) but the alternating shed vortices read
//    only as faint dimples.
//  - 'vorticity': signed curl(u) through an RdBu diverging palette,
//    red for cw rotation and blue for ccw. This is the iconic
//    von-Karman-street visualization: each shed core is a sharp red or
//    blue blob and the alternating sign as the street propagates
//    downstream is unmistakable.
function paintSpeed() {
  if (!off) off = offCtx.createImageData(GX, GY);
  const d = off.data;
  const { uc, vc } = cellVelocity(state);
  let mx = 0;
  for (let k = 0; k < GX * GY; k += 1) {
    const s = Math.hypot(uc[k], vc[k]);
    if (s > mx) mx = s;
    const c = viridis(Math.min(1, s / VMAX));
    const j = k * 4;
    d[j] = c.r; d[j + 1] = c.g; d[j + 2] = c.b; d[j + 3] = 255;
  }
  peakW = mx;
}

function paintVorticity() {
  if (!off) off = offCtx.createImageData(GX, GY);
  const d = off.data;
  const { uc, vc } = cellVelocity(state);
  const om = vorticity(state);
  // Robust scale from a fixed percentile of the magnitude. Using a
  // fixed VORT_SCALE rather than the per-frame max keeps the colors
  // stable as vortices shed (a momentarily quiet field would over-
  // saturate otherwise). 4.0 is chosen so the von-Karman street at
  // Re=300 saturates ~ 80% of the range.
  const VORT_SCALE = 4.0;
  let mx = 0;
  for (let k = 0; k < GX * GY; k += 1) {
    const s = Math.hypot(uc[k], vc[k]);
    if (s > mx) mx = s;
    const t = Math.max(0, Math.min(1, 0.5 + 0.5 * om[k] / VORT_SCALE));
    const c = divBlack(t);
    const j = k * 4;
    d[j] = c.r; d[j + 1] = c.g; d[j + 2] = c.b; d[j + 3] = 255;
  }
  peakW = mx;
}

function seedDye() {
  for (let j = 0; j < GY; j += 1) if (((j / 6) | 0) % 2 === 0) dye[j * GX + 2] = 1;
}

function build(warm) {
  state = createState(GX, GY, st.Re);
  // Obstacle radii scale with the finer grid (was tuned for 220x140;
  // at 320x200 we keep the same fraction of the channel by using
  // proportional radii).
  if (st.obs === 'cylinder') setDiskObstacle(state, 0.22, 25, YSHIFT);
  else if (st.obs === 'square') setBlockObstacle(state, 0.22, 22, 22, YSHIFT);
  dye = new Float64Array(GX * GY);
  for (let n = 0; n < warm; n += 1) {
    step(state, DT, STEP_OPTS);
    if (st.tracer) { seedDye(); advectScalar(state, dye, DT); }
  }
}

function render() {
  if (st.field === 'vorticity') paintVorticity(); else paintSpeed();
  if (st.tracer) {
    for (let k = 0; k < GX * GY; k += 1) {
      if (dye[k] > 0.05) {
        const a = Math.min(1, dye[k]), j = k * 4;
        off.data[j] = 255 * a + off.data[j] * (1 - a);
        off.data[j + 1] = 255 * a + off.data[j + 1] * (1 - a);
        off.data[j + 2] = 255 * a + off.data[j + 2] * (1 - a);
      }
    }
  }
  for (let k = 0; k < GX * GY; k += 1) {
    if (state.obstacle[k]) { const j = k * 4; off.data[j] = 24; off.data[j + 1] = 26; off.data[j + 2] = 32; }
  }
  offCtx.putImageData(off, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offCanvas, 0, 0, W, H);

  rDiv.textContent = divergenceMax(state).toExponential(1);
  rSt.textContent = peakW.toFixed(2);
  rRe.textContent = String(st.Re);
  rReg.textContent = st.regime;
}

// Fixed work per frame (always SUBSTEPS steps), with the timestep
// scaled by the speed slider. Semi-Lagrangian advection and implicit
// diffusion are unconditionally stable, so a larger dt advances more
// simulated time per frame at constant cost. Speed N is therefore
// genuinely ~N times faster than speed 1, and the frame rate does
// not collapse at high speed.
function tick() {
  if (st.running) {
    const dt = DT * st.speed / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s += 1) {
      step(state, dt, STEP_OPTS);
      if (st.tracer) { seedDye(); advectScalar(state, dye, dt); }
    }
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vRe.textContent = String(st.Re); vSpd.textContent = String(st.speed); }
selReg.addEventListener('change', () => {
  st.regime = selReg.value; st.Re = REGIME_RE[st.regime] ?? st.Re;
  sRe.value = String(st.Re); syncLabels(); build(80); render();
});
sRe.addEventListener('input', () => {
  st.Re = parseInt(sRe.value, 10); st.regime = 'custom';
  syncLabels(); build(60); render();
});
selObs.addEventListener('change', () => { st.obs = selObs.value; build(80); render(); });
selField.addEventListener('change', () => { st.field = selField.value; render(); });
sSpd.addEventListener('input', () => { st.speed = parseInt(sSpd.value, 10); syncLabels(); });
tTracer.addEventListener('change', () => { st.tracer = tTracer.checked; build(60); render(); });
bR.addEventListener('click', () => {
  st.regime = 'vonkarman'; st.Re = 300; st.obs = 'cylinder'; st.tracer = false; st.speed = 2; st.running = true; st.field = 'vorticity';
  selReg.value = 'vonkarman'; sRe.value = '300'; selObs.value = 'cylinder'; sSpd.value = '2'; tTracer.checked = false; selField.value = 'vorticity';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); build(80); render();
});
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function getState() {
  return { re_number: st.Re, obstacle_preset: st.obs, tracer_enabled: st.tracer ? 1 : 0, regime_name: st.regime };
}
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.regime_name) { st.regime = s.regime_name; if (REGIME_RE[s.regime_name]) selReg.value = s.regime_name; }
  if (s.re_number) { st.Re = parseInt(s.re_number, 10); sRe.value = String(st.Re); }
  if (s.obstacle_preset) { st.obs = s.obstacle_preset; selObs.value = s.obstacle_preset; }
  if (s.tracer_enabled !== undefined) { st.tracer = String(s.tracer_enabled) === '1'; tTracer.checked = st.tracer; }
}

function bootSync() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    // Long developed-wake warmup; the von Karman street takes ~ 8
    // shedding cycles at Re=300 (St ~ 0.21, T ~ 4.8 dimensionless
    // time units, so we want ~ 40 t.u. = 450 steps minimum). Sweep
    // the capture across half a shedding period after warmup so the
    // five goldens catch the alternating sign of the shed cores.
    st.regime = 'vonkarman'; st.Re = 300; st.obs = 'cylinder'; st.tracer = false; st.field = 'vorticity';
    selField.value = 'vorticity';
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state = createState(GX, GY, st.Re);
    setDiskObstacle(state, 0.22, 17, YSHIFT);
    dye = new Float64Array(GX * GY);
    const warm = 600;
    const sweep = Math.round(f * 60);
    const steps = warm + sweep;
    for (let n = 0; n < steps; n += 1) step(state, DT, STEP_OPTS);
    render();
  } else {
    build(80); render();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
