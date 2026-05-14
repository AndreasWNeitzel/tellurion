// Earth axial precession + nutation hero.
// Real elapsed-years time accumulator (not slider*frame). 3D axis line in
// world space, Earth as a lit textured sphere, shared orbit-camera.

import { precessionLongitude, nutation, obliquity, EPS0_DEG } from '../../../shared/js/engine/earth-rotation-cpu.js';
import { setupEarthGL } from '../../../shared/js/engine-gl/earth-rotation.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['ε (deg)', 'ψ (deg)', 'year', 'Δψ (″)'];
const rEls = {};
for (const k of READOUTS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val);
  rEls[k] = val;
}

function buildSlider(label, min, max, step, value, onInput, formatter = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = formatter(+value);
  inp.addEventListener('input', () => { val.textContent = formatter(+inp.value); onInput(parseFloat(inp.value)); });
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

// Time model: yearsElapsed is a clean accumulator. log10TimeAccel is the
// simulated-years-per-real-second exponent. The "year" readout = epoch + yearsElapsed.
const st = { yearsElapsed: 0, log10TimeAccel: 6, epochYear: 2000 };
let running = true;

buildSlider('log₁₀(yr/s)', 0, 9, 0.1, st.log10TimeAccel, v => { st.log10TimeAccel = v; }, v => v.toFixed(1));
buildSlider('epoch (CE)', -5000, 30000, 100, st.epochYear, v => { st.epochYear = v; }, v => v.toFixed(0));
const btns = buildButtons();

let engine = null;
try { engine = setupEarthGL(canvas); } catch (e) { console.warn('earth GL init failed', e); }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 3.0,
  minRadius: 1.5,
  maxRadius: 8.0,
  azimuthDeg: 30, elevationDeg: 18, fovDeg: 45,
});
window.__camera = camera;

btns.reset.addEventListener('click', () => {
  st.yearsElapsed = 0; st.epochYear = 2000; st.log10TimeAccel = 6;
  running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

const TO_RAD = Math.PI / 180;

function axisDirFromState() {
  const yr = st.epochYear + st.yearsElapsed - 2000;
  const eps = obliquity(yr);
  const psi = precessionLongitude(yr) / 3600;
  const epsR = eps * TO_RAD, psiR = psi * TO_RAD;
  // Axis tilted by eps from world +y, swept around by psi about world +y.
  return [
    Math.sin(epsR) * Math.cos(psiR),
    Math.cos(epsR),
    Math.sin(epsR) * Math.sin(psiR),
  ];
}

function sunDirFromState() {
  // Sun position on the ecliptic at the simulated date.
  const yr = st.epochYear + st.yearsElapsed - 2000;
  const lon = (yr % 1) * 2 * Math.PI;
  return [Math.cos(lon), 0, Math.sin(lon)];
}

function identityMat4() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }

// Rotate matrix about an arbitrary unit axis k by angle a (Rodrigues 4x4).
function rotMat4(axis, angle) {
  const [x, y, z] = axis;
  const c = Math.cos(angle), s = Math.sin(angle), C = 1 - c;
  return new Float32Array([
    c + x*x*C,     x*y*C + z*s,   x*z*C - y*s,   0,
    x*y*C - z*s,   c + y*y*C,     y*z*C + x*s,   0,
    x*z*C + y*s,   y*z*C - x*s,   c + z*z*C,     0,
    0,             0,             0,             1,
  ]);
}

const traceTips = [];           // flat [x0,y0,z0, x1,y1,z1, ...]
const TRACE_MAX_POINTS = 320;

let last = performance.now(), fpsLast = last, fpsFrames = 0;
const aspect = () => canvas.width / canvas.height;

function readouts() {
  const yr = st.epochYear + st.yearsElapsed;
  const eps = obliquity(yr - 2000);
  const psi = precessionLongitude(yr - 2000) / 3600;
  const nut = nutation(yr - 2000);
  rEls['ε (deg)'].textContent = eps.toFixed(3);
  rEls['ψ (deg)'].textContent = (((psi % 360) + 360) % 360).toFixed(2);
  rEls.year.textContent = yr.toFixed(0);
  rEls['Δψ (″)'].textContent = nut.dPsi.toFixed(1);
}

function render() {
  if (!engine) return;
  const view = camera.viewMatrix();
  const proj = camera.projMatrix(aspect());
  const axis = axisDirFromState();
  // Earth daily rotation about its instantaneous axis. The accumulator is
  // in simulated years; spin angle = 2 pi * 365.25 * yearsElapsed gives the
  // daily turn count (visually capped by time-accel slider; at high accel
  // we see the spin blur as the year sweeps past). Modulo 2 pi to keep it
  // bounded.
  const spinTurns = 365.25 * (st.epochYear + st.yearsElapsed - 2000);
  const spinAngle = ((spinTurns % 1) + 1) % 1 * 2 * Math.PI;
  const model = rotMat4(axis, spinAngle);
  // Record the rotation-axis tip every render.
  const tip = [axis[0] * 1.6, axis[1] * 1.6, axis[2] * 1.6];
  traceTips.push(tip[0], tip[1], tip[2]);
  while (traceTips.length > TRACE_MAX_POINTS * 3) traceTips.splice(0, 3);
  engine.render(view, proj, axis, sunDirFromState(), model, traceTips);
  readouts();
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { fpsLast = now; fpsFrames = 0; }
  if (running) {
    const yearsPerSec = Math.pow(10, st.log10TimeAccel);
    st.yearsElapsed += dt * yearsPerSec;
  }
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    // Show different phases of the precession circle across capture frames.
    st.yearsElapsed = CAPTURE_FRAC * 25772 * 0.5;  // up to half a circuit
  }
  readouts();
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

// Physics: over a simulated 25772 yr, ψ advances 360 deg within 1%.
window.__physicsCheck = async () => {
  const yr0 = 0, yr1 = 25772;
  const psi0 = precessionLongitude(yr0) / 3600;
  const psi1 = precessionLongitude(yr1) / 3600;
  const advance = psi1 - psi0;
  if (Math.abs(advance - 360) > 3.6) return { name: 'precession period', pass: false, msg: `ψ advances ${advance.toFixed(2)} deg in 25772 yr (target 360 ± 1%)` };
  // 18.6 yr nutation amplitude.
  let maxDpsi = 0;
  for (let yr = 0; yr < 30; yr += 0.5) {
    const dpsi = Math.abs(nutation(yr).dPsi);
    if (dpsi > maxDpsi) maxDpsi = dpsi;
  }
  if (Math.abs(maxDpsi - 17.2) > 1.0) return { name: 'nutation amplitude', pass: false, msg: `max |Δψ| = ${maxDpsi.toFixed(1)}″ outside 17.2 ± 1.0` };
  return { name: 'precession + nutation', pass: true, msg: `ψ360 in 25772 yr = ${advance.toFixed(2)} deg; nutation peak ${maxDpsi.toFixed(1)}″` };
};

window.__cpuVsGpu = () => ({ skip: true, reason: 'earth hero has no GPU physics path; geometry only' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
