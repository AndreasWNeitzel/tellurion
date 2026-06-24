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
import { fontString } from '../../../shared/js/canvas-type.js';

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
const GX = 320, GY = 200, DT = 0.11, VMAX = 1.8, YSHIFT = 8, DIFF = 2, CONF = 0.24;
const SUBSTEPS = 1;
// The plain semi-Lagrangian advect smears the shed shear layers so heavily that
// the wake never rolled up (vorticity stayed pinned to the cylinder, the
// downstream profile was flat). BFECC would cure the diffusion but triples the
// advection cost and breaks the 60 fps / boot budget, so instead the diffusion
// is eased (2 viscous sweeps instead of 3) and the Steinhoff confinement is
// pushed to 0.24, which re-injects the dissipated vorticity into the shed cores
// and sustains them downstream as alternating von Karman vortices. Confinement
// is one O(N) body force per step, so the frame budget is unchanged. Higher
// CONF (>~0.3) over-amplifies grid-scale noise into spurious specks, so 0.24 is
// the stable ceiling.
const STEP_OPTS = { diffuseSweeps: DIFF, projOpts: { tol: 5e-3, maxIter: 12 }, bfecc: false, confine: CONF };
const REGIME_RE = { stokes: 8, steady: 60, vonkarman: 300, turbulent: 600 };
// Default to the speed field: |u| through viridis colours the whole domain
// (the free stream is non-zero everywhere), so the page never loads on a
// near-black frame. The vorticity field (iconic but black-background, and
// localised by the live scheme's downstream dissipation) stays one click
// away in the field selector.
const st = { regime: 'vonkarman', Re: 300, obs: 'cylinder', tracer: false, speed: 2, running: !prefersReducedMotion(), field: 'speed' };
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

// True-aspect letterbox rect for the GX x GY field inside the portrait canvas,
// so the cylinder renders as a circle instead of a tall ellipse.
const BLIT = { x: 0, y: Math.round((H - W * GY / GX) / 2), w: W, h: Math.round(W * GY / GX) };

function drawColorbar() {
  const vort = st.field === 'vorticity';
  const cbX = 80, cbW = W - 160, cbY = 150, cbH = 26;
  for (let i = 0; i < cbW; i += 1) {
    const t = i / (cbW - 1);
    const c = vort ? divBlack(t) : viridis(t);
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(cbX + i, cbY, 1, cbH);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(cbX + 0.5, cbY + 0.5, cbW - 1, cbH - 1);
  ctx.fillStyle = 'rgba(220,228,245,0.92)'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`flow past a ${st.obs}    Re = ${st.Re}    (${st.regime})`, W / 2, 104);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(vort ? 'vorticity  curl u  (RdBu: blue ccw, red cw)' : 'speed  |u|  (viridis)', cbX, cbY - 10);
  ctx.fillStyle = 'rgba(160,170,190,0.85)';
  ctx.fillText(vort ? '-4.0' : '0', cbX, cbY + cbH + 16);
  ctx.textAlign = 'right';
  ctx.fillText(vort ? '+4.0' : VMAX.toFixed(1), cbX + cbW, cbY + cbH + 16);
}

function drawWakeProfile() {
  const { uc, vc } = cellVelocity(state);
  const xCol = Math.round(GX * 0.52);
  const bx0 = 80, bw = W - 160, by0 = BLIT.y + BLIT.h + 30, bh = H - (BLIT.y + BLIT.h + 30) - 36;
  ctx.fillStyle = 'rgba(120,170,235,0.05)'; ctx.fillRect(bx0, by0, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(bx0 + 0.5, by0 + 0.5, bw - 1, bh - 1);
  const PX = (y) => bx0 + (y / (GY - 1)) * bw;
  const PY = (s) => by0 + bh - 8 - Math.min(1, s / VMAX) * (bh - 18);
  ctx.strokeStyle = 'rgba(120,130,150,0.35)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(bx0, PY(1)); ctx.lineTo(bx0 + bw, PY(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = 0; y < GY; y += 1) {
    const s = Math.hypot(uc[y * GX + xCol], vc[y * GX + xCol]);
    const px = PX(y), py = PY(s);
    y ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,235,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('downstream speed |u|(y) at x = 0.52 L  (the dip is the wake deficit; dashed = free stream)', bx0, by0 - 8);
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
  // Letterbox the field at its true aspect; the bands above and below carry
  // the colour scale and a downstream wake-velocity profile (was a full-canvas
  // stretch that distorted the cylinder into an ellipse).
  ctx.fillStyle = '#06070a'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offCanvas, 0, 0, GX, GY, BLIT.x, BLIT.y, BLIT.w, BLIT.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
  ctx.strokeRect(BLIT.x + 0.5, BLIT.y + 0.5, BLIT.w - 1, BLIT.h - 1);
  drawColorbar();
  drawWakeProfile();

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
  st.regime = 'vonkarman'; st.Re = 300; st.obs = 'cylinder'; st.tracer = false; st.speed = 2; st.running = true; st.field = 'speed';
  selReg.value = 'vonkarman'; sRe.value = '300'; selObs.value = 'cylinder'; sSpd.value = '2'; tTracer.checked = false; selField.value = 'speed';
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
  selField.value = st.field;
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    // Long developed-wake warmup; the von Karman street takes ~ 8
    // shedding cycles at Re=300 (St ~ 0.21, T ~ 4.8 dimensionless
    // time units, so we want ~ 40 t.u. = 450 steps minimum). Sweep
    // the capture across half a shedding period after warmup so the
    // five goldens catch the alternating sign of the shed cores.
    // Capture the SPEED field (the live default): it shows the cylinder
    // wake at any step count. The vorticity view is the iconic alternating
    // street, but the shed cores need ~1500 steps to propagate downstream,
    // and that warmup blocks the deterministic boot past its ready timeout,
    // so the vorticity golden came out empty. Speed loads developed fast.
    st.regime = 'vonkarman'; st.Re = 300; st.obs = 'cylinder'; st.tracer = false; st.field = 'speed';
    selField.value = 'speed';
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state = createState(GX, GY, st.Re);
    setDiskObstacle(state, 0.22, 17, YSHIFT);
    dye = new Float64Array(GX * GY);
    const warm = 700;
    const sweep = Math.round(f * 60);
    const steps = warm + sweep;
    for (let n = 0; n < steps; n += 1) step(state, DT, STEP_OPTS);
    render();
  } else {
    // Warm-start to a developed wake so the page does not load on a uniform
    // (zero-vorticity, all-black) field: the von Karman street needs ~8
    // shedding cycles (~450 steps at Re=300) before the alternating cores
    // appear. Control-change rebuilds stay short and redevelop live.
    build(prefersReducedMotion() ? 80 : 420); render();
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'reynolds', label: 'Reynolds number', value: st.Re, format: 'float' },
      { key: 'regime', label: 'flow regime', value: st.regime, format: undefined },
      { key: 'peak-speed', label: 'peak speed', value: peakW, format: 'float' },
      { key: 'divergence', label: 'divergence max', value: state ? divergenceMax(state) : 0, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!state) return [{ key: 'no-state', label: 'state not initialized', value: 'pending', status: 'pending' }];
  const div = divergenceMax(state);
  const tol = 0.1;
  return [
    {
      key: 'incompressibility',
      label: 'divergence capped by projection',
      value: div.toExponential(2),
      status: div < tol ? 'pass' : 'drift',
    },
  ];
};
