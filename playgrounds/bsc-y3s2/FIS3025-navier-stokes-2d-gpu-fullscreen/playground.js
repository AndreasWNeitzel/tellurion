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
  createState, setBlockObstacle, step, vorticity, divergenceMax,
  cellVelocity, advectScalar,
} from '../../../shared/js/engine/chorin-2d-cpu.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
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

const GX = 180, GY = 100, DT = 0.06, VMAX = 1.1, YSHIFT = 2;
const REGIME_RE = { stokes: 2, steady: 80, vonkarman: 700, turbulent: 950 };
const LIVE = { tol: 8e-3, maxIter: 18 };
const st = { regime: 'vonkarman', Re: 150, obs: 'cylinder', tracer: false, running: true };

let state, dye, off, probe = [], stText = '-';
const offCanvas = document.createElement('canvas');
offCanvas.width = GX; offCanvas.height = GY;
const offCtx = offCanvas.getContext('2d');

// Vivid signed-vorticity over the dark theme: zero -> background
// (not white), glowing red for +omega and blue for -omega, a mild
// gamma so the wake reads even when weak. Reuses the tested rdbu LUT
// but composites it over the page background by intensity.
function paintVorticity(w) {
  if (!off) off = offCtx.createImageData(GX, GY);
  const d = off.data;
  for (let k = 0; k < GX * GY; k += 1) {
    const t = Math.max(-1, Math.min(1, w[k] / VMAX));
    const m = Math.pow(Math.abs(t), 0.55);
    const c = rdbu(0.5 + 0.5 * t);
    const j = k * 4;
    d[j] = 7 + (c.r - 7) * m;
    d[j + 1] = 8 + (c.g - 8) * m;
    d[j + 2] = 12 + (c.b - 12) * m;
    d[j + 3] = 255;
  }
}

function seedDye() {
  for (let j = 0; j < GY; j += 1) if (((j / 6) | 0) % 2 === 0) dye[j * GX + 2] = 1;
}

function build(warm) {
  state = createState(GX, GY, st.Re);
  if (st.obs === 'cylinder') setBlockObstacle(state, 0.26, 4, 5, YSHIFT);
  else if (st.obs === 'square') setBlockObstacle(state, 0.26, 6, 6, YSHIFT);
  dye = new Float64Array(GX * GY);
  probe = []; stText = '-';
  for (let n = 0; n < warm; n += 1) {
    step(state, DT, { diffuseSweeps: 8, projOpts: LIVE });
    if (st.tracer) { seedDye(); advectScalar(state, dye, DT); }
  }
}

function probeStrouhal() {
  const { vc } = cellVelocity(state);
  probe.push(vc[Math.round(GY / 2) * GX + Math.round(GX * 0.62)]);
  if (probe.length > 360) probe.shift();
  if (probe.length === 360) {
    let mean = 0; for (const x of probe) mean += x; mean /= probe.length;
    let bestF = 0, bestP = -1, amp = 0;
    const N = probe.length, fmin = 1 / (N * DT), fmax = 0.5 / DT;
    for (let q = 1; q <= 200; q += 1) {
      const f = fmin + (fmax - fmin) * (q / 200);
      let re = 0, im = 0;
      for (let i = 0; i < N; i += 1) { const ph = 2 * Math.PI * f * i * DT, x = probe[i] - mean; re += x * Math.cos(ph); im -= x * Math.sin(ph); }
      const pw = re * re + im * im;
      if (pw > bestP) { bestP = pw; bestF = f; }
    }
    for (const x of probe) amp = Math.max(amp, Math.abs(x - mean));
    stText = amp > 0.02 ? bestF.toFixed(3) : '-';
  }
}

function render() {
  const w = vorticity(state);
  paintVorticity(w);
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
  rSt.textContent = stText;
  rRe.textContent = String(st.Re);
  rReg.textContent = st.regime;
}

function tick() {
  if (st.running) {
    step(state, DT, { diffuseSweeps: 8, projOpts: LIVE });
    if (st.tracer) { seedDye(); advectScalar(state, dye, DT); }
    probeStrouhal();
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
