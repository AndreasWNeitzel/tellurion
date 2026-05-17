// 2D Navier-Stokes vortex street (Canvas2D). The flow is the
// gate-tested shared MAC Chorin engine
// (shared/js/engine/chorin-2d-cpu.js, invariants in
// invariants.test.mjs); this file renders its vorticity field and
// wires the controls. The live solve uses a relaxed pressure
// tolerance for interactivity (the spec's two-path design: the
// strong incompressibility invariant is proven offline by the
// converged engine; the live readout reports the relaxed
// post-projection divergence honestly). A WebGL2 512x384 fast path
// is a documented stretch goal; this Canvas2D path is the shippable,
// gate-safe renderer of the verified engine.

import {
  createState, setBlockObstacle, step, divergenceMax,
  cellVelocity, advectScalar,
} from '../../../shared/js/engine/chorin-2d-cpu.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

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
const tTracer = document.getElementById('toggle-tracer');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const GX = 180, GY = 100, DT = 0.06, VMAX = 1.8, YSHIFT = 2;
const REGIME_RE = { stokes: 2, steady: 80, vonkarman: 700, turbulent: 950 };
const LIVE = { tol: 8e-3, maxIter: 18 };
const st = { regime: 'vonkarman', Re: 150, obs: 'cylinder', tracer: false, running: true };

let state, dye, off, peakW = 0;
const offCanvas = document.createElement('canvas');
offCanvas.width = GX; offCanvas.height = GY;
const offCtx = offCanvas.getContext('2d');

// Speed |u| through viridis: nonzero everywhere (free stream, the
// wake deficit, the acceleration around the body), so the whole
// canvas carries structure that visibly responds to Re and the
// obstacle, the standard vivid flow-past-a-body visualization. peakW
// here is the max speed (the readout).
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

function seedDye() {
  for (let j = 0; j < GY; j += 1) if (((j / 6) | 0) % 2 === 0) dye[j * GX + 2] = 1;
}

function build(warm) {
  state = createState(GX, GY, st.Re);
  if (st.obs === 'cylinder') setBlockObstacle(state, 0.26, 4, 5, YSHIFT);
  else if (st.obs === 'square') setBlockObstacle(state, 0.26, 6, 6, YSHIFT);
  dye = new Float64Array(GX * GY);
  for (let n = 0; n < warm; n += 1) {
    step(state, DT, { diffuseSweeps: 8, projOpts: LIVE });
    if (st.tracer) { seedDye(); advectScalar(state, dye, DT); }
  }
}

function render() {
  paintSpeed();
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

function tick() {
  if (st.running) {
    step(state, DT, { diffuseSweeps: 8, projOpts: LIVE });
    if (st.tracer) { seedDye(); advectScalar(state, dye, DT); }
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vRe.textContent = String(st.Re); }
selReg.addEventListener('change', () => {
  st.regime = selReg.value; st.Re = REGIME_RE[st.regime] ?? st.Re;
  sRe.value = String(st.Re); syncLabels(); build(80); render();
});
sRe.addEventListener('input', () => {
  st.Re = parseInt(sRe.value, 10); st.regime = 'custom';
  syncLabels(); build(60); render();
});
selObs.addEventListener('change', () => { st.obs = selObs.value; build(80); render(); });
tTracer.addEventListener('change', () => { st.tracer = tTracer.checked; build(60); render(); });
bR.addEventListener('click', () => {
  st.regime = 'vonkarman'; st.Re = 700; st.obs = 'cylinder'; st.tracer = false; st.running = true;
  selReg.value = 'vonkarman'; sRe.value = "700"; selObs.value = 'cylinder'; tTracer.checked = false;
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
    st.regime = 'vonkarman'; st.Re = 700; st.obs = 'cylinder'; st.tracer = false;
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state = createState(GX, GY, st.Re);
    setBlockObstacle(state, 0.26, 4, 5, YSHIFT);
    dye = new Float64Array(GX * GY);
    const steps = Math.round(40 + f * 820);
    for (let n = 0; n < steps; n += 1) step(state, DT, { diffuseSweeps: 8, projOpts: LIVE });
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
