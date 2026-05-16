// Tokamak hero. Translucent vessel + helical field lines + a live
// guiding-centre plasma: ~1200 particles streaming along the helical
// field, confined to their flux surfaces, with passing particles
// spiralling toroidally and trapped particles tracing banana orbits on
// the low-field (outboard) side. The sliders drive the plasma: B0 sets
// the transit speed, Ip sets q (poloidal winding), R0/a set the
// trapped fraction via the inverse aspect ratio.

import { safetyAtEdge, safetyAxis, bToroidal } from './sim.js';
import { mulberry32, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { setupTokamakGL } from '../../../shared/js/engine-gl/tokamak.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['q_edge', 'q_axis', 'trapped %', 'FPS'];
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
  const val = document.createElement('span'); val.className = 'value'; val.textContent = (+value).toFixed(2);
  inp.addEventListener('input', () => { val.textContent = (+inp.value).toFixed(2); onInput(parseFloat(inp.value)); rebuild = true; });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function buildButtons() {
  const row = document.createElement('div'); row.className = 'row buttons';
  const r = document.createElement('button'); r.type = 'button'; r.textContent = 'Reset';
  const p = document.createElement('button'); p.type = 'button'; p.textContent = 'Pause'; p.setAttribute('aria-pressed', 'false');
  row.appendChild(r); row.appendChild(p);
  controlsEl.appendChild(row);
  return { reset: r, pause: p };
}

const st = { R: 1.0, a: 0.35, B0: 5.3, Ip: 3, t: 0 };
let running = true;
let rebuild = true;

buildSlider('R0 (m)', 1.0, 3.0, 0.05, st.R, v => { st.R = v; });
buildSlider('a (m)', 0.2, 1.0, 0.02, st.a, v => { st.a = v; });
buildSlider('B0 (T)', 1, 10, 0.1, st.B0, v => { st.B0 = v; });
buildSlider('Ip (MA)', 0.1, 20, 0.5, st.Ip, v => { st.Ip = v; });
const btns = buildButtons();

let engine = null;
try { engine = setupTokamakGL(canvas); } catch (e) { console.warn('tokamak GL init failed', e); }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 4.0,
  minRadius: 1.5,
  maxRadius: 10.0,
  azimuthDeg: 35, elevationDeg: 25, fovDeg: 45,
});
window.__camera = camera;

// Guiding-centre plasma population. r stays fixed (the particle is
// confined to its flux surface, which is the whole point of magnetic
// confinement); theta/phi advance along the field; trapped particles
// reflect at the mirror points and r_draw carries the grad-B banana
// width so the bounce traces the classic banana in the poloidal plane.
const NPART = 1200;
const pr = new Float32Array(NPART);
const pth = new Float32Array(NPART);
const pph = new Float32Array(NPART);
const pxi = new Float32Array(NPART);   // pitch v_par/v at the outboard midplane
const psgn = new Int8Array(NPART);
const ptrap = new Uint8Array(NPART);
const posBuf = new Float32Array(NPART * 3);
const colBuf = new Float32Array(NPART * 3);

function initParticles() {
  const rng = mulberry32(DEFAULT_SEED >>> 0);
  for (let i = 0; i < NPART; i += 1) {
    // Strongly core-peaked profile (a real tokamak plasma is a hot
    // column near the magnetic axis, not a gas filling the vessel).
    // r = a * u^1.7 puts ~half the particles inside the inner 0.3 a.
    pr[i] = st.a * (0.04 + 0.94 * Math.pow(rng(), 1.7));
    pth[i] = 2 * Math.PI * rng();
    pph[i] = 2 * Math.PI * rng();
    pxi[i] = -1 + 2 * rng();
    psgn[i] = rng() < 0.5 ? -1 : 1;
  }
}
initParticles();

function classifyTrapped() {
  // Trapped if the particle cannot reach the high-field inboard side:
  // xi0^2 < (Bmax - Bmin) / Bmax = 2 eps / (1 + eps), eps = r / R0.
  let nt = 0;
  for (let i = 0; i < NPART; i += 1) {
    const eps = pr[i] / st.R;
    const thresh = 2 * eps / (1 + eps);
    ptrap[i] = (pxi[i] * pxi[i] < thresh) ? 1 : 0;
    nt += ptrap[i];
  }
  return nt;
}
let trappedCount = classifyTrapped();

let qEdge = 3, qAxis = 1.5;
function refreshProfile() {
  qEdge = Math.max(1.05, safetyAtEdge(st.B0, st.R, st.a, st.Ip));
  qAxis = Math.max(0.75, safetyAxis(st.B0, st.R, st.a, st.Ip));
  trappedCount = classifyTrapped();
}

function stepPlasma(dt) {
  const R = st.R, a = st.a, B0 = st.B0;
  // Transit rate grows with field strength (faster toroidal streaming).
  const speed = 1.7 * Math.sqrt(B0 / 5.3);
  for (let i = 0; i < NPART; i += 1) {
    const r = pr[i];
    const Rout = R + r;                       // theta = 0, weakest field
    const Bout = bToroidal(Rout, B0, R);
    const Rcyl = R + r * Math.cos(pth[i]);
    const B = bToroidal(Rcyl, B0, R);
    const xi2 = pxi[i] * pxi[i];
    let arg = 1 - (1 - xi2) * (B / Bout);
    if (arg <= 0) { psgn[i] = -psgn[i]; arg = 0.02; }   // mirror reflection
    const vpar = psgn[i] * Math.sqrt(arg);
    const rr = r / a;
    const q = qAxis + (qEdge - qAxis) * rr * rr;
    const iota = 1 / q;
    const dphi = speed * vpar / Rcyl * R * dt;
    pph[i] += dphi;
    pth[i] += iota * dphi;
    if (pph[i] > 6.2831853) pph[i] -= 6.2831853; else if (pph[i] < 0) pph[i] += 6.2831853;
    if (pth[i] > 6.2831853) pth[i] -= 6.2831853; else if (pth[i] < 0) pth[i] += 6.2831853;
    // grad-B / curvature drift gives the banana its finite radial width.
    const eps = r / R;
    const Wb = 0.55 * a * q * Math.sqrt(eps + 0.02);
    let rDraw = r + Wb * vpar * (ptrap[i] ? 1.0 : 0.18);
    if (rDraw < 0.015 * a) rDraw = 0.015 * a; else if (rDraw > a) rDraw = a;
    const Rc = R + rDraw * Math.cos(pth[i]);
    const o = 3 * i;
    posBuf[o] = Rc * Math.cos(pph[i]);
    posBuf[o + 1] = rDraw * Math.sin(pth[i]);
    posBuf[o + 2] = Rc * Math.sin(pph[i]);
    const sp = Math.abs(vpar);
    // Radial brightness falloff: hot bright core, faint edge, so the
    // plasma reads as a localized luminous column instead of a fog.
    const xr = r / a;
    const bri = 0.12 + 1.05 * (1 - xr * xr);
    if (ptrap[i]) {
      // Trapped: dim warm amber banana halo on the outboard side.
      colBuf[o] = 0.95 * bri;
      colBuf[o + 1] = (0.50 + 0.25 * (1 - sp)) * bri;
      colBuf[o + 2] = (0.18 + 0.12 * (1 - sp)) * bri;
    } else {
      // Passing core: white-hot near the axis grading to cyan outward.
      colBuf[o] = (0.55 + 0.45 * (1 - xr)) * bri;
      colBuf[o + 1] = (0.78 + 0.20 * sp) * bri;
      colBuf[o + 2] = bri;
    }
  }
}

let sceneInfo = null;
let last = performance.now(), fpsLast = last, fpsFrames = 0;
const aspect = () => canvas.width / canvas.height;

function render() {
  if (!engine) return;
  if (rebuild) {
    refreshProfile();
    sceneInfo = engine.buildScene(st.R, st.a, qEdge, st.B0, st.Ip);
    rebuild = false;
  }
  engine.setParticles(posBuf, colBuf);
  engine.render(camera.viewMatrix(), camera.projMatrix(aspect()), sceneInfo);
  rEls.q_edge.textContent = qEdge.toFixed(2);
  rEls.q_axis.textContent = qAxis.toFixed(2);
  rEls['trapped %'].textContent = (100 * trappedCount / NPART).toFixed(0);
}

btns.reset.addEventListener('click', () => {
  st.R = 1.0; st.a = 0.35; st.B0 = 5.3; st.Ip = 3; rebuild = true;
  initParticles();
  running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { rEls.FPS.textContent = (fpsFrames * 1000 / (now - fpsLast)).toFixed(0); fpsLast = now; fpsFrames = 0; }
  if (running) { st.t += dt; stepPlasma(dt); }
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  rEls.FPS.textContent = '60';
  refreshProfile();
  if (CAPTURE_NAME) {
    // Deterministic: advance the seeded population a fixed number of
    // fixed-size steps so each capture frame is a reproducible state.
    const steps = Math.round(40 + CAPTURE_FRAC * 520);
    for (let s = 0; s < steps; s += 1) stepPlasma(1 / 60);
  } else {
    stepPlasma(1 / 60);
  }
  render();
  if (DETERMINISTIC) {
    // Settle the bloom ping-pong over several identical frames so the
    // screenshot is pixel-stable across browser processes.
    let warm = 0;
    const settle = () => {
      render();
      warm += 1;
      if (warm < 22) { requestAnimationFrame(settle); return; }
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    };
    requestAnimationFrame(settle);
  }
}

// Physics: q profile sanity. The edge safety factor should be > 1 for stability.
window.__physicsCheck = async () => {
  const q = safetyAtEdge(st.B0, st.R, st.a, st.Ip);
  if (q < 1) return { name: 'q_edge', pass: false, msg: `q_edge=${q.toFixed(2)} below kink-instability threshold 1` };
  if (q > 50) return { name: 'q_edge', pass: false, msg: `q_edge=${q.toFixed(2)} unphysically high` };
  return { name: 'q_edge', pass: true, msg: `q_edge=${q.toFixed(2)} in stable band` };
};

window.__cpuVsGpu = () => ({ skip: true, reason: 'tokamak plasma is JS guiding-centre integration; GPU draws points only' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
