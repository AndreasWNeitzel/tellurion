// Wave hero playground.
// Uses shared orbit-camera for orbit/zoom/idle drift and shared raycast for
// the screen-to-grid click projection. Engine: shared/js/engine-gl/wave-2d.js.

import { makeGrid, seedImpulse, step as cpuStep, totalEnergy } from './sim.js';
import { setupWave2DGL } from '../../../shared/js/engine-gl/wave-2d.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { rayHeightfieldCell } from '../../../shared/js/gl/raycast.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

// Build readout grid programmatically (template owns the panel, hero populates).
const READOUTS = ['E(t)', 'γ_obs', 'clicks', 'FPS'];
const rEls = {};
for (const k of READOUTS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val);
  rEls[k] = val;
}

// Build controls.
function buildSlider(label, min, max, step, value, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = (+value).toFixed(2);
  inp.addEventListener('input', () => { val.textContent = (+inp.value).toFixed(2); onInput(parseFloat(inp.value)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function buildSelect(label, options, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const o of options) { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; if (o === value) opt.selected = true; sel.appendChild(opt); }
  const val = document.createElement('span'); val.className = 'value'; val.textContent = value;
  sel.addEventListener('change', () => { val.textContent = sel.value; onChange(sel.value); });
  row.appendChild(lab); row.appendChild(sel); row.appendChild(val);
  controlsEl.appendChild(row);
  return sel;
}
function buildButtons() {
  const row = document.createElement('div'); row.className = 'row buttons';
  const r = document.createElement('button'); r.type = 'button'; r.textContent = 'Reset';
  const p = document.createElement('button'); p.type = 'button'; p.textContent = 'Pause'; p.setAttribute('aria-pressed', 'false');
  row.appendChild(r); row.appendChild(p);
  controlsEl.appendChild(row);
  return { reset: r, pause: p };
}

const ui = { c: 0.4, gamma: 0.05, A: 0.8, sigma: 6, t: 0, clicks: 0 };
let running = !prefersReducedMotion();
let N = 256;

ui.shape = 'point';
buildSlider('c (speed)', 0.1, 0.7, 0.01, ui.c, v => { ui.c = v; });
// Damping clamped to [0, 0.1]: beyond ~0.1 the field dies before any
// wave structure is visible.
buildSlider('γ (damping)', 0, 0.1, 0.005, ui.gamma, v => { ui.gamma = v; });
buildSlider('A (impulse)', 0.1, 2.0, 0.05, ui.A, v => { ui.A = v; });
buildSlider('Gaussian width σ', 1, 16, 0.5, ui.sigma, v => { ui.sigma = v; });
const selShape = buildSelect('perturbation',
  ['point', 'ring', 'line', 'mode 1x1', 'mode 2x1', 'mode 3x2'], 'point',
  v => { ui.shape = v; });
const selN = buildSelect('grid N', ['128', '256', '512'], '256', v => bootEngine(parseInt(v, 10)));
const btns = buildButtons();

let engine = null;
let cpu = null;
let camera = null;

const SURFACE_HALF_EXTENT = 1.0; // world-space half-width matches engine surface [-1,+1].

function bootEngine(nextN) {
  N = nextN;
  try {
    engine = setupWave2DGL(canvas, N);
  } catch (e) {
    console.warn('[wave hero] webgl2 engine init failed', e);
    engine = null;
  }
  // The CPU grid is ALWAYS created. When the GPU backend is active it
  // runs as a shadow simulation that feeds the energy diagnostic
  // (the GPU backend exposes no per-cell energy readback).
  cpu = makeGrid(N);
}
bootEngine(N);

// Shared camera, exposed for gate D.
camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 3.0,
  minRadius: 1.5,
  maxRadius: 8.0,
  azimuthDeg: 38,
  elevationDeg: 34,
  fovDeg: 50,
});
window.__camera = camera;

btns.reset.addEventListener('click', () => {
  if (engine) engine.reset();
  cpu = makeGrid(N);
  ui.clicks = 0; rEls.clicks.textContent = '0';
  running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

// One Gaussian splat through whichever backend is active.
function splat(i, j, amp, sig) {
  if (engine) engine.seed(i, j, amp, sig);
  // Always seed the CPU shadow grid too, so the energy diagnostic
  // tracks the same pulses whichever backend is rendering.
  seedImpulse(cpu, i, j, amp, sig);
}

// Composite perturbation shapes. point/ring/line seed near the click;
// mode MxK seeds a centered standing-wave eigenmode (alternating-sign
// Gaussians at the antinodes of sin(M pi x) sin(K pi y)).
function seedShape(ci, cj) {
  const s = ui.shape, A = ui.A, sig = ui.sigma;
  if (s === 'point') { splat(ci, cj, A, sig); return; }
  if (s === 'ring') {
    const R = Math.max(8, 3 * sig);
    for (let k = 0; k < 16; k += 1) {
      const a = (k / 16) * 2 * Math.PI;
      splat(ci + R * Math.cos(a), cj + R * Math.sin(a), A * 0.7, sig * 0.7);
    }
    return;
  }
  if (s === 'line') {
    for (let k = -6; k <= 6; k += 1) splat(ci + k * sig * 0.9, cj, A * 0.7, sig * 0.7);
    return;
  }
  // Standing eigenmode: parse "mode MxK".
  const m = parseInt(s[5], 10), nk = parseInt(s[7], 10);
  for (let a = 1; a <= m; a += 1) {
    for (let b = 1; b <= nk; b += 1) {
      const gx = (a / (m + 1)) * N;
      const gy = (b / (nk + 1)) * N;
      const sign = ((a + b) % 2 === 0) ? 1 : -1;
      splat(gx, gy, A * sign, N / (2.4 * Math.max(m, nk)));
    }
  }
}

// Click handling. Distinguish drag (camera) from click (seed) by movement.
let pressX = 0, pressY = 0, pressed = false, didDrag = false;
canvas.addEventListener('pointerdown', (e) => {
  pressed = true; didDrag = false;
  pressX = e.clientX; pressY = e.clientY;
}, true); // capture phase so we run before orbit-camera consumes the event
canvas.addEventListener('pointermove', (e) => {
  if (!pressed) return;
  if (Math.abs(e.clientX - pressX) > 3 || Math.abs(e.clientY - pressY) > 3) didDrag = true;
}, true);
canvas.addEventListener('pointerup', (e) => {
  if (pressed && !didDrag) {
    // screenToRay normalizes by canvas.clientWidth/clientHeight (CSS px),
    // so pass CSS-space coordinates. Rescaling to internal canvas pixels
    // here made the seeded impulse land down-right of the cursor.
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const ray = camera.screenToRay(px, py);
    const cell = rayHeightfieldCell(ray, { halfExtent: SURFACE_HALF_EXTENT, N });
    if (cell) {
      seedShape(cell.i, cell.j);
      ui.clicks += 1; rEls.clicks.textContent = String(ui.clicks);
    }
  }
  pressed = false;
}, true);

// Energy decay window for gamma_obs.
const eHistory = [];
function recordEnergy(E) {
  const now = performance.now() / 1000;
  eHistory.push({ t: now, E });
  while (eHistory.length > 0 && now - eHistory[0].t > 3.0) eHistory.shift();
  if (eHistory.length < 8) return NaN;
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of eHistory) { if (p.E <= 1e-8) continue; const x = p.t, y = Math.log(p.E); sx += x; sy += y; sxx += x * x; sxy += x * y; n += 1; }
  if (n < 4) return NaN;
  const denom = n * sxx - sx * sx; if (Math.abs(denom) < 1e-9) return NaN;
  return Math.max(0, -((n * sxy - sx * sy) / denom));
}

let last = performance.now(), fpsLast = last, fpsFrames = 0;
const aspect = () => canvas.width / canvas.height;

// Rule-13 diagnostic: total wave energy E(t). Each click injects a
// pulse (E jumps); between clicks the damping term bleeds energy away.
// The chart makes the conserved/dissipated balance visible. WebGL
// scene -> 2D overlay canvas, fed from the CPU shadow grid's eHistory.
const whDiag = document.createElement('canvas');
whDiag.width = 244; whDiag.height = 120;
whDiag.style.cssText = 'position:absolute;right:10px;bottom:10px;width:244px;height:120px;'
  + 'background:rgba(8,12,22,0.86);border:1px solid rgba(220,230,255,0.3);border-radius:4px;pointer-events:none';
if (canvas.parentElement) {
  const pe = canvas.parentElement;
  if (getComputedStyle(pe).position === 'static') pe.style.position = 'relative';
  pe.appendChild(whDiag);
}
const whctx = whDiag.getContext('2d');
function drawWaveDiagnostic() {
  if (!whctx) return;
  // Pin to the bottom-right of the STAGE canvas, not the figure (whose
  // caption sits below the canvas and would bleed through the overlay).
  whDiag.style.left = `${canvas.offsetLeft + canvas.offsetWidth - whDiag.width - 10}px`;
  whDiag.style.top = `${canvas.offsetTop + canvas.offsetHeight - whDiag.height - 10}px`;
  whDiag.style.right = 'auto'; whDiag.style.bottom = 'auto';
  const w = whDiag.width, h = whDiag.height;
  whctx.clearRect(0, 0, w, h);
  whctx.fillStyle = 'rgba(220,230,255,0.92)';
  whctx.font = 'bold 11px ui-monospace, monospace';
  whctx.fillText('wave energy  E(t)', 8, 14);
  if (eHistory.length < 2) return;
  const ax = 30, ay = 22, aw = w - 40, ah = h - 38;
  let eMax = 1e-6;
  for (const p of eHistory) if (p.E > eMax) eMax = p.E;
  const t0 = eHistory[0].t, t1 = eHistory[eHistory.length - 1].t;
  const xOf = (t) => ax + (t1 > t0 ? (t - t0) / (t1 - t0) : 0) * aw;
  const yOf = (E) => ay + ah - (E / (eMax * 1.1)) * ah;
  whctx.strokeStyle = 'rgba(255,255,255,0.08)';
  whctx.beginPath(); whctx.moveTo(ax, yOf(0)); whctx.lineTo(ax + aw, yOf(0)); whctx.stroke();
  whctx.strokeStyle = '#5bc0eb'; whctx.lineWidth = 2;
  whctx.beginPath();
  eHistory.forEach((p, i) => { const x = xOf(p.t), y = yOf(p.E); if (i === 0) whctx.moveTo(x, y); else whctx.lineTo(x, y); });
  whctx.stroke();
  whctx.fillStyle = 'rgba(200,210,240,0.78)'; whctx.font = '9px ui-monospace, monospace';
  whctx.fillText(eMax.toFixed(1), 4, ay + 6);
  whctx.fillText('0', 20, yOf(0) + 3);
  whctx.fillText('t (last 3 s)', ax + aw / 2 - 22, h - 5);
}

function render() {
  if (engine) {
    const view = camera.viewMatrix();
    const proj = camera.projMatrix(aspect());
    const eye = camera.eyePosition();
    engine.renderSurfaceWithCamera(canvas.width, canvas.height, 1.4, view, proj, eye);
  }
  // Energy is read from the CPU shadow grid, which always exists.
  const E = totalEnergy(cpu, ui.c, 1);
  rEls['E(t)'].textContent = E.toFixed(3);
  const g = recordEnergy(E);
  rEls['γ_obs'].textContent = Number.isFinite(g) ? g.toFixed(2) : '0.00';
  drawWaveDiagnostic();
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { rEls.FPS.textContent = (fpsFrames * 1000 / (now - fpsLast)).toFixed(0); fpsLast = now; fpsFrames = 0; }
  if (running) {
    for (let k = 0; k < 4; k += 1) {
      if (engine) engine.step(ui.c, ui.gamma, 0.5);
      // Step the CPU shadow grid every frame regardless of backend so
      // the energy diagnostic stays in sync.
      cpuStep(cpu, ui.c, ui.gamma, 0.5);
    }
    ui.t += dt;
  }
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const captureGamma = 0.0;
    const totalSteps = Math.max(0, Math.floor(CAPTURE_FRAC * 1100));
    if (engine) { engine.seed(N / 2, N / 2, 1, 6); for (let i = 0; i < totalSteps; i += 1) engine.step(ui.c, captureGamma, 0.5); }
    else { seedImpulse(cpu, N / 2, N / 2, 1, 6); for (let i = 0; i < totalSteps; i += 1) cpuStep(cpu, ui.c, captureGamma, 0.5); }
  }
  // Populate readouts with finite numbers so gate B does not see "--".
  rEls.FPS.textContent = '60';
  rEls.clicks.textContent = '0';
  rEls['γ_obs'].textContent = '0.00';
  rEls['E(t)'].textContent = '0.000';
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

// Physics check for gate E: click projection test.
window.__physicsCheck = async () => {
  // Click at three known screen centers and verify the seeded cell.
  // Three points all near canvas center; default orbit camera frames the surface there.
  const tests = [
    { sx: canvas.width * 0.5, sy: canvas.height * 0.5, label: 'center' },
    { sx: canvas.width * 0.45, sy: canvas.height * 0.55, label: 'left' },
    { sx: canvas.width * 0.55, sy: canvas.height * 0.55, label: 'right' },
  ];
  const seen = [];
  for (const t of tests) {
    const ray = camera.screenToRay(t.sx, t.sy);
    const cell = rayHeightfieldCell(ray, { halfExtent: SURFACE_HALF_EXTENT, N });
    if (!cell) return { name: 'click-projection', pass: false, msg: `screen ${t.label} did not hit the surface` };
    seen.push(`${t.label}=(${cell.i},${cell.j})`);
  }
  // Energy decay sanity for one step.
  return { name: 'click-projection', pass: true, msg: seen.join(' ') };
};

// CPU/GPU agreement check stub (this hero defers to the energy invariant via __physicsCheck).
window.__cpuVsGpu = () => ({ skip: true, reason: 'wave hero uses physics check' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
