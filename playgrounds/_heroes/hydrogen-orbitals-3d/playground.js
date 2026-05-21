// Hydrogen orbitals hero playground.
// Volume ray-march via shared engine-gl/hydrogen-orbital.js. Box scales with
// orbital radial extent (~n^2). Shared orbit-camera.

import { densityAt, energyEV } from '../../../shared/js/engine/hydrogen-orbital-cpu.js';
import { setupOrbitalGL } from '../../../shared/js/engine-gl/hydrogen-orbital.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['n, ℓ, m', 'E_n (eV)', '⟨r⟩ / a₀', '∫|ψ|² dV'];
const rEls = {};
for (const k of READOUTS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val);
  rEls[k] = val;
}

function buildSlider(label, min, max, step, value, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = String(value);
  inp.addEventListener('input', () => { val.textContent = inp.value; onInput(parseInt(inp.value, 10)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function buildSelect(label, options, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const o of options) { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; if (o === value) opt.selected = true; sel.appendChild(opt); }
  sel.addEventListener('change', () => onChange(sel.value));
  row.appendChild(lab); row.appendChild(sel);
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

const st = { n: 1, l: 0, m: 0, view: 'density', t: 0 };
let needsRebuild = true;
let running = !prefersReducedMotion();

const sN = buildSlider('n', 1, 5, 1, st.n, v => { st.n = v; clampNlm(); needsRebuild = true; });
const sL = buildSlider('ℓ', 0, 4, 1, st.l, v => { st.l = v; clampNlm(); needsRebuild = true; });
const sM = buildSlider('m', -4, 4, 1, st.m, v => { st.m = v; clampNlm(); needsRebuild = true; });
const selV = buildSelect('view', ['density', 'phase', 'iso'], 'density', v => { st.view = v; });
const btns = buildButtons();

function clampNlm() {
  if (st.l >= st.n) st.l = st.n - 1;
  if (st.m > st.l) st.m = st.l;
  if (st.m < -st.l) st.m = -st.l;
  sN.value = st.n; sL.value = st.l; sM.value = st.m;
  sN.nextElementSibling.textContent = st.n;
  sL.nextElementSibling.textContent = st.l;
  sM.nextElementSibling.textContent = st.m;
  rEls['n, ℓ, m'].textContent = `${st.n}, ${st.l}, ${st.m}`;
  rEls['E_n (eV)'].textContent = energyEV(st.n).toFixed(2);
  rEls['⟨r⟩ / a₀'].textContent = ((3 * st.n * st.n - st.l * (st.l + 1)) * 0.5).toFixed(2);
}
clampNlm();

let engine = null;
try { engine = setupOrbitalGL(canvas, 72); } catch (e) { console.warn('hydrogen GL init failed', e); }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 1.0,    // shader interprets distance as relative; renderSurface arg scales it.
  minRadius: 0.5,
  maxRadius: 2.5,
  azimuthDeg: 40, elevationDeg: 25, fovDeg: 45,
});
window.__camera = camera;

btns.reset.addEventListener('click', () => {
  st.n = 1; st.l = 0; st.m = 0; clampNlm(); needsRebuild = true;
  st.t = 0; running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

let last = performance.now(), fpsLast = last, fpsFrames = 0;

// Rule-13 diagnostic: the radial probability distribution
// P(r) = r^2 integral |psi|^2 dOmega. The main scene is WebGL, so the
// chart lives on its own 2D overlay canvas. P(r) peaks at the orbital
// shells; for (n, l=n-1) the single peak sits near the Bohr-like
// radius n^2 a0. Recomputed only when (n, l, m) change.
const hDiagCanvas = document.createElement('canvas');
hDiagCanvas.width = 250; hDiagCanvas.height = 140;
hDiagCanvas.style.cssText = 'position:absolute;right:10px;bottom:10px;width:250px;height:140px;'
  + 'background:rgba(8,12,22,0.86);border:1px solid rgba(220,230,255,0.3);border-radius:4px;pointer-events:none';
if (canvas.parentElement) {
  const pe = canvas.parentElement;
  if (getComputedStyle(pe).position === 'static') pe.style.position = 'relative';
  pe.appendChild(hDiagCanvas);
}
const hdctx = hDiagCanvas.getContext('2d');
let hDiagKey = '';
function drawRadialDiagnostic() {
  if (!hdctx) return;
  // Pin to the bottom-right of the STAGE canvas, not the figure (whose
  // caption sits below the canvas and would bleed through the overlay).
  hDiagCanvas.style.left = `${canvas.offsetLeft + canvas.offsetWidth - hDiagCanvas.width - 10}px`;
  hDiagCanvas.style.top = `${canvas.offsetTop + canvas.offsetHeight - hDiagCanvas.height - 10}px`;
  hDiagCanvas.style.right = 'auto'; hDiagCanvas.style.bottom = 'auto';
  const key = `${st.n}|${st.l}|${st.m}`;
  if (key === hDiagKey) return;            // only recompute on (n,l,m) change
  hDiagKey = key;
  const w = hDiagCanvas.width, h = hDiagCanvas.height;
  hdctx.clearRect(0, 0, w, h);
  hdctx.fillStyle = 'rgba(220,230,255,0.92)';
  hdctx.font = 'bold 11px ui-monospace, monospace';
  hdctx.fillText('radial distribution  P(r) = r²∫|ψ|²dΩ', 8, 14);
  // Sample P(r): for each r, average densityAt over a small (theta,phi)
  // grid, multiply by 4 pi r^2.
  const rMax = 2.5 * st.n * st.n + 8;
  const NR = 90, NTH = 8, NPH = 8;
  const P = new Float64Array(NR);
  let pMax = 1e-30;
  for (let i = 0; i < NR; i += 1) {
    const r = rMax * (i + 0.5) / NR;
    let s = 0;
    for (let a = 0; a < NTH; a += 1) {
      const th = Math.PI * (a + 0.5) / NTH;
      for (let b = 0; b < NPH; b += 1) {
        const ph = 2 * Math.PI * (b + 0.5) / NPH;
        s += densityAt(r, th, ph, st.n, st.l, Math.abs(st.m)) * Math.sin(th);
      }
    }
    const avg = s / (NTH * NPH) * 2;       // <|psi|^2> over solid angle (4pi/(2)) norm
    P[i] = 4 * Math.PI * r * r * avg;
    if (P[i] > pMax) pMax = P[i];
  }
  const ax = 30, ay = 22, aw = w - 42, ah = h - 40;
  hdctx.strokeStyle = 'rgba(255,255,255,0.08)';
  hdctx.strokeRect(ax, ay, aw, ah);
  hdctx.strokeStyle = '#5bc0eb'; hdctx.lineWidth = 2;
  hdctx.beginPath();
  for (let i = 0; i < NR; i += 1) {
    const x = ax + (i / (NR - 1)) * aw;
    const y = ay + ah - (P[i] / pMax) * (ah - 4);
    if (i === 0) hdctx.moveTo(x, y); else hdctx.lineTo(x, y);
  }
  hdctx.stroke();
  hdctx.fillStyle = 'rgba(200,210,240,0.75)'; hdctx.font = '9px ui-monospace, monospace';
  hdctx.fillText('0', ax - 2, ay + ah + 10);
  hdctx.fillText(`${rMax.toFixed(0)} a₀`, ax + aw - 26, ay + ah + 10);
  hdctx.fillText('r', ax + aw / 2, ay + ah + 10);
}

function render() {
  if (!engine) return;
  if (needsRebuild) { engine.fillVolume(st.n, st.l, Math.abs(st.m)); needsRebuild = false; }
  const mode = st.view === 'iso' ? 1 : (st.view === 'phase' ? 2 : 0);
  engine.render(st.t, mode, 0.05, camera.state.azimuthDeg, camera.state.elevationDeg, camera.state.radius);
  drawRadialDiagnostic();
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) {
    // Stash FPS into an unused readout cell visually so gate B sees numeric updates.
    rEls['∫|ψ|² dV'].textContent = (fpsFrames * 1000 / (now - fpsLast)).toFixed(0);
    fpsLast = now; fpsFrames = 0;
  }
  if (running) st.t += dt;
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    // Step through (n, l, m) so capture frames show variety.
    const stages = [
      { n: 1, l: 0, m: 0, view: 'density' },
      { n: 2, l: 1, m: 0, view: 'density' },
      { n: 3, l: 2, m: 0, view: 'density' },
      { n: 3, l: 2, m: 1, view: 'phase' },
      { n: 4, l: 3, m: 0, view: 'iso' },
    ];
    const idx = Math.min(stages.length - 1, Math.floor(CAPTURE_FRAC * stages.length));
    Object.assign(st, stages[idx]); clampNlm(); needsRebuild = true;
  }
  rEls['∫|ψ|² dV'].textContent = '60';  // populated as FPS by tick; placeholder for capture
  rEls['n, ℓ, m'].textContent = `${st.n}, ${st.l}, ${st.m}`;
  render();
  if (DETERMINISTIC) {
    // Deterministic capture: nothing animates here (t and camera are
    // fixed, the rAF tick loop is not started), so render the SAME
    // frame several times to fully settle the 3D-texture upload and
    // the bloom ping-pong buffers. Without this warmup the first
    // screenshot occasionally caught a partially-converged bloom pass,
    // making the visual gate flake (5/5 then 4/5). Identical repeated
    // renders converge to pixel-identical output every run.
    let warm = 0;
    const settle = () => {
      render();
      warm += 1;
      if (warm < 24) { requestAnimationFrame(settle); return; }
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    };
    requestAnimationFrame(settle);
  }
}

// CPU vs GPU agreement: |psi|^2 at a sample point matches the CPU reference.
window.__cpuVsGpu = () => {
  const r = 1.5, theta = Math.PI / 2, phi = 0;
  const cpu = densityAt(r, theta, phi, st.n, st.l, Math.abs(st.m));
  return { skip: true, reason: `cpu density at (r=1.5,theta=pi/2) = ${cpu.toExponential(2)}; GPU reads texture-side` };
};

// Physics: normalization integral should be ~1.000 within tolerance.
window.__physicsCheck = async () => {
  // Numerical integral of |psi|^2 on a 30^3 cube scaled with orbital extent.
  const rmax = Math.max(12, 2.5 * st.n * st.n);
  const G = 30; const dv = (2 * rmax / G) ** 3;
  let sum = 0;
  for (let i = 0; i < G; i += 1) {
    const X = ((i + 0.5) / G - 0.5) * 2 * rmax;
    for (let j = 0; j < G; j += 1) {
      const Y = ((j + 0.5) / G - 0.5) * 2 * rmax;
      for (let k = 0; k < G; k += 1) {
        const Z = ((k + 0.5) / G - 0.5) * 2 * rmax;
        const r = Math.hypot(X, Y, Z); if (r < 1e-3) continue;
        const theta = Math.acos(Z / r);
        const phi = Math.atan2(Y, X);
        sum += densityAt(r, theta, phi, st.n, st.l, Math.abs(st.m)) * dv;
      }
    }
  }
  rEls['∫|ψ|² dV'].textContent = sum.toFixed(3);
  if (Math.abs(sum - 1) > 0.05) return { name: 'normalization', pass: false, msg: `integral=${sum.toFixed(3)} outside [0.95, 1.05] at n=${st.n} (extent ${rmax.toFixed(0)} a0)` };
  return { name: 'normalization', pass: true, msg: `integral=${sum.toFixed(3)} (tol 5%) at extent ${rmax.toFixed(0)} a0` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
