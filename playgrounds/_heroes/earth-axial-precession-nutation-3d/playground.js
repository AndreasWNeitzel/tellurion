// Earth axial precession + nutation hero.
// Real elapsed-years time accumulator (not slider*frame). 3D axis line in
// world space, Earth as a lit textured sphere, shared orbit-camera.

import { precessionLongitude, nutation, obliquity, EPS0_DEG } from '../../../shared/js/engine/earth-rotation-cpu.js';
import { setupEarthGL } from '../../../shared/js/engine-gl/earth-rotation.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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
  // "Freeze epoch" toggle: when on, the cosmic year stops advancing
  // (so the precession axis halts) while the diurnal spin keeps
  // turning. Lets the user pick an epoch with the slider and then
  // simply watch the Earth rotate about that fixed precessed axis.
  const f = document.createElement('button'); f.type = 'button'; f.textContent = 'Freeze epoch'; f.setAttribute('aria-pressed', 'false');
  row.appendChild(r); row.appendChild(p); row.appendChild(f);
  controlsEl.appendChild(row);
  return { reset: r, pause: p, freeze: f };
}

// Time model: yearsElapsed is a clean accumulator. log10TimeAccel is the
// simulated-years-per-real-second exponent. The "year" readout = epoch + yearsElapsed.
// Safer animation defaults: a calm Earth spin (~15 s per rotation) and a
// precession time-accel that completes the 25,772 yr precession cycle in
// ~8 s. Previously the diurnal spin was rapid AND the precession-axis
// tracer flashed across the celestial sphere every frame, producing
// strobe-rate flicker that was uncomfortable and an epilepsy hazard.
const st = { yearsElapsed: 0, log10TimeAccel: 4.0, epochYear: 2000, spinPhase: 0, frozen: false };
let running = !prefersReducedMotion();
// Diurnal spin is driven by WALL-CLOCK time, not the (hugely
// accelerated) precession year clock. Tying it to yearsElapsed made
// 365.25 * accelerated-years alias to noise every frame, so the Earth
// never visibly rotated about its axis. One turn ~ every 5 s reads as
// a clear daily spin while precession proceeds on its own clock.
// SPIN_RATE: radians per wall-clock second. 2 pi / 15 = one Earth
// rotation every 15 s, a calm walking pace that does NOT strobe.
const SPIN_RATE = (2 * Math.PI) / 15;

// Slider references retained so the Reset button can sync DOM values.
const sliderAccel = buildSlider('log₁₀(yr/s)', 0, 6, 0.1, st.log10TimeAccel, v => { st.log10TimeAccel = v; }, v => v.toFixed(1));
const sliderEpoch = buildSlider('epoch (CE)', -5000, 30000, 100, st.epochYear, v => {
  // Moving the epoch slider RESETS the elapsed-time accumulator so the
  // epoch you set is the year actually shown. Without this the
  // accelerated time accumulator dominates and the slider has no
  // visible effect.
  st.epochYear = v;
  st.yearsElapsed = 0;
}, v => v.toFixed(0));
const btns = buildButtons();

let engine = null;
try { engine = setupEarthGL(canvas); } catch (e) { console.warn('earth GL init failed', e); }
// Load the real NASA Blue Marble equirectangular photo and hand it to
// the GL engine as a texture. Until it loads, the shader falls back
// to a procedural noise Earth so the page is never empty.
if (engine && engine.setEarthTexture) {
  const earthImg = new Image();
  earthImg.crossOrigin = 'anonymous';
  earthImg.onload = () => engine.setEarthTexture(earthImg);
  earthImg.src = '../../../assets/maps/earth_bluemarble_2048.jpg';
}

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 6.0,
  minRadius: 1.5,
  maxRadius: 10.0,
  azimuthDeg: 24, elevationDeg: 48, fovDeg: 45,
});
window.__camera = camera;

btns.reset.addEventListener('click', () => {
  st.yearsElapsed = 0; st.epochYear = 2000; st.log10TimeAccel = 4.0;
  sliderAccel.value = '4.0'; sliderEpoch.value = '2000';
  sliderAccel.dispatchEvent(new Event('input'));
  sliderEpoch.dispatchEvent(new Event('input'));
  // dispatchEvent above will mutate st via the handlers; re-set the
  // year-elapsed reset because the epoch onInput zeros it.
  st.yearsElapsed = 0;
  running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});
btns.freeze.addEventListener('click', () => {
  st.frozen = !st.frozen;
  btns.freeze.textContent = st.frozen ? 'Unfreeze' : 'Freeze epoch';
  btns.freeze.setAttribute('aria-pressed', String(st.frozen));
});

const TO_RAD = Math.PI / 180;

function axisAtYear(yr) {
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
function axisDirFromState() {
  return axisAtYear(st.epochYear + st.yearsElapsed - 2000);
}

// Sun + shadow removed (user feedback): the strobing day/night
// terminator and the orbiting sun marker were an epilepsy hazard and
// did not communicate precession or nutation. The Earth is now lit by
// a FIXED diagonal world-light so the texture remains visible without
// any sweeping shadow.
function sunDirFromState() {
  return [0.5, 0.5, 0.4];     // constant lighting direction (no animation).
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
// Trace at the same scale as the drawn axis tip (engine axScale = 2.4)
// so the red axis line is a generator of the precession cone and its
// tip rides exactly along the traced ring.
const TRACE_R = 2.4;

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

// Rule-13 diagnostic: the precession circle. The rotation axis sweeps
// a cone of half-angle = obliquity around the ecliptic pole; its tip,
// projected onto the ecliptic plane (x, z), traces a circle once per
// ~25,700-yr precession period. This phase portrait plots that path
// with the current pole position marked. WebGL scene -> 2D overlay.
const epDiag = document.createElement('canvas');
epDiag.width = 168; epDiag.height = 168;
epDiag.style.cssText = 'position:absolute;right:10px;bottom:10px;width:168px;height:168px;'
  + 'background:rgba(8,12,22,0.86);border:1px solid rgba(220,230,255,0.3);border-radius:4px;pointer-events:none';
if (canvas.parentElement) {
  const pe = canvas.parentElement;
  if (getComputedStyle(pe).position === 'static') pe.style.position = 'relative';
  pe.appendChild(epDiag);
}
const epctx = epDiag.getContext('2d');
function drawPrecessionDiagnostic(axis) {
  if (!epctx) return;
  // Pin to the bottom-right of the STAGE canvas, not the figure (whose
  // caption sits below the canvas and would bleed through the overlay).
  epDiag.style.left = `${canvas.offsetLeft + canvas.offsetWidth - epDiag.width - 10}px`;
  epDiag.style.top = `${canvas.offsetTop + canvas.offsetHeight - epDiag.height - 10}px`;
  epDiag.style.right = 'auto'; epDiag.style.bottom = 'auto';
  const w = epDiag.width, h = epDiag.height;
  epctx.clearRect(0, 0, w, h);
  epctx.fillStyle = 'rgba(220,230,255,0.92)';
  epctx.font = fontString(canvas, 'caption', 'mono', 600);
  epctx.fillText('precession circle', 8, 14);
  const cx = w / 2, cy = h / 2 + 8, rad = Math.min(w, h) * 0.34;
  epctx.strokeStyle = 'rgba(255,255,255,0.10)';
  epctx.beginPath(); epctx.arc(cx, cy, rad, 0, 6.28); epctx.stroke();
  epctx.strokeStyle = 'rgba(255,255,255,0.15)';
  epctx.beginPath(); epctx.moveTo(cx - 5, cy); epctx.lineTo(cx + 5, cy);
  epctx.moveTo(cx, cy - 5); epctx.lineTo(cx, cy + 5); epctx.stroke();
  epctx.strokeStyle = '#5bc0eb'; epctx.lineWidth = 1.6;
  epctx.beginPath();
  let started = false;
  for (let i = 0; i < traceTips.length; i += 3) {
    const x = cx + (traceTips[i] / TRACE_R) * rad;
    const y = cy + (traceTips[i + 2] / TRACE_R) * rad;
    if (!started) { epctx.moveTo(x, y); started = true; } else epctx.lineTo(x, y);
  }
  epctx.stroke();
  epctx.fillStyle = '#ffd166';
  epctx.beginPath();
  epctx.arc(cx + axis[0] * rad, cy + axis[2] * rad, 4, 0, 6.28);
  epctx.fill();
  epctx.fillStyle = 'rgba(200,210,240,0.7)';
  epctx.font = fontString(canvas, 'tick', 'mono');
  epctx.fillText('ecliptic-plane projection', 8, h - 6);
}

function render() {
  if (!engine) return;
  const view = camera.viewMatrix();
  const proj = camera.projMatrix(aspect());
  const axis = axisDirFromState();
  // Earth daily rotation about its instantaneous (precessing) axis,
  // driven by the wall-clock spinPhase so it is always visibly turning.
  const model = rotMat4(axis, st.spinPhase);
  // Record the rotation-axis tip every render.
  const tip = [axis[0] * TRACE_R, axis[1] * TRACE_R, axis[2] * TRACE_R];
  traceTips.push(tip[0], tip[1], tip[2]);
  while (traceTips.length > TRACE_MAX_POINTS * 3) traceTips.splice(0, 3);
  engine.render(view, proj, axis, sunDirFromState(), model, traceTips);
  drawPrecessionDiagnostic(axis);
  readouts();
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { fpsLast = now; fpsFrames = 0; }
  if (running) {
    // Freeze-epoch: stop advancing the cosmic year so the precession
    // axis halts, but keep the diurnal spin so the Earth continues to
    // rotate. Lets the user inspect a specific epoch in detail.
    if (!st.frozen) {
      const yearsPerSec = Math.pow(10, st.log10TimeAccel);
      st.yearsElapsed += dt * yearsPerSec;
    }
    st.spinPhase = (st.spinPhase + dt * SPIN_RATE) % (2 * Math.PI);
  }
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

// Pre-fill the axis-tip trace with one full precession circuit so the
// precession cone is drawn immediately, by default, without waiting
// for the (slow) clock to sweep it out.
function prefillTrace() {
  traceTips.length = 0;
  const yr0 = st.epochYear - 2000;
  for (let i = 0; i <= TRACE_MAX_POINTS; i += 1) {
    const a = axisAtYear(yr0 + (i / TRACE_MAX_POINTS) * 25772);
    traceTips.push(a[0] * TRACE_R, a[1] * TRACE_R, a[2] * TRACE_R);
  }
}

function bootSync() {
  prefillTrace();
  if (CAPTURE_NAME) {
    // Different precession phases AND a different diurnal spin angle
    // per frame, both deterministic functions of the capture fraction.
    st.yearsElapsed = CAPTURE_FRAC * 25772 * 0.5;  // up to half a circuit
    st.spinPhase = CAPTURE_FRAC * 2 * Math.PI;
  }
  readouts();
  render();
  if (DETERMINISTIC) {
    // Settle the GL scene + post-process over several identical frames
    // so the screenshot is pixel-stable across runs (same hardening as
    // the other WebGL heroes).
    let warm = 0;
    const settle = () => {
      render();
      warm += 1;
      if (warm < 28) { requestAnimationFrame(settle); return; }
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    };
    requestAnimationFrame(settle);
  }
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
