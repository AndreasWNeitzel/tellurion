// Synchrotron radiation cone playground.

import {
  larmorFrequency_Hz, gyroRadius_m, beamingHalfAngle_rad,
  criticalFrequency_Hz, specShape, singleElectronPower_W,
  pulseWidth_s, orbitPeriod_s,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const DEG = Math.PI / 180;

const rGamma = document.getElementById('readout-gamma');
const rB = document.getElementById('readout-B');
const rBeam = document.getElementById('readout-beam');
const rNu = document.getElementById('readout-nu');
const rP = document.getElementById('readout-P');

const sGamma = document.getElementById('slider-gamma'), vGamma = document.getElementById('value-gamma');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const sTilt = document.getElementById('slider-tilt'), vTilt = document.getElementById('value-tilt');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  logGamma: 1.5,
  logB: -4.0,
  speed: 2,
  tilt: 40,
  running: !prefersReducedMotion(),
  phase: 0,
  pulseHistory: [],
};

function gamma() { return Math.pow(10, st.logGamma); }
function B_T() { return Math.pow(10, st.logB); }

// Scene layout: top = 3D scene, bottom = pulse + spectrum.
const SCENE = { x: 0, y: 0, w: W, h: 0.62 * H };
const PULSE = { x: 30, y: 0.66 * H, w: 0.45 * W, h: 0.30 * H };
const SPEC = { x: 0.50 * W, y: 0.66 * H, w: 0.46 * W, h: 0.30 * H };

function project3D(x, y, z) {
  // Tilt about world-x by st.tilt deg, then project.
  const t = st.tilt * DEG;
  const cT = Math.cos(t), sT = Math.sin(t);
  const yr = y * cT - z * sT;
  const zr = y * sT + z * cT;
  const k = 1 / (1 + zr / 4);
  return { x: SCENE.x + SCENE.w * 0.42 + x * 100 * k, y: SCENE.y + SCENE.h * 0.5 - yr * 100 * k, k };
}

function drawBackground() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {
    const ix = (i * 23.7) % SCENE.w;
    const iy = (i * 31.1) % SCENE.h;
    ctx.fillStyle = `rgba(190, 200, 255, ${0.10 + 0.30 * ((i * 7) % 17) / 17})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawBField() {
  // Magnetic field arrows along z (out of orbit plane). Show as
  // purple arrows in a small grid.
  ctx.strokeStyle = 'rgba(180, 100, 220, 0.4)';
  ctx.fillStyle = 'rgba(180, 100, 220, 0.4)';
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const x = i * 0.6, y = j * 0.6;
      const tail = project3D(x, y, -0.5);
      const head = project3D(x, y, +0.8);
      ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y); ctx.stroke();
      // arrowhead.
      const ah = 5;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(180, 100, 220, 0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  const Btxt = project3D(1.5, 1.5, 0.8);
  ctx.fillText(`B = ${B_T().toExponential(1)} T`, Btxt.x, Btxt.y);
}

function drawOrbit() {
  // Electron circular orbit (in xy plane, in scaled units; gyro radius
  // is irrelevant for visualization).
  const N = 80;
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * 2 * Math.PI;
    const p = project3D(Math.cos(a), Math.sin(a), 0);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // Electron
  const ePhase = st.phase;
  const ex = Math.cos(ePhase), ey = Math.sin(ePhase);
  const ep = project3D(ex, ey, 0);
  const glow = ctx.createRadialGradient(ep.x, ep.y, 1, ep.x, ep.y, 16);
  glow.addColorStop(0, 'rgba(180, 240, 255, 1)');
  glow.addColorStop(1, 'rgba(80, 120, 220, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(ep.x, ep.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.beginPath(); ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2); ctx.fill();
}

function drawBeamingCone() {
  const ePhase = st.phase;
  // Velocity vector tangent to orbit at the electron position.
  const vx = -Math.sin(ePhase), vy = Math.cos(ePhase), vz = 0;
  const ex = Math.cos(ePhase), ey = Math.sin(ePhase), ez = 0;
  const half = beamingHalfAngle_rad(gamma());
  const cone_len = 2.5;
  // Cone tip at electron position. Cone axis along v with half-angle "half".
  // Build orthonormal basis (u, w) perpendicular to v.
  const helper = Math.abs(vy) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = cross(helper, { x: vx, y: vy, z: vz });
  norm(u);
  const w = cross({ x: vx, y: vy, z: vz }, u);
  norm(w);
  const rim_r = cone_len * Math.tan(Math.min(half, Math.PI / 2));
  const N = 32;
  const rim2d = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * 2 * Math.PI;
    const c = Math.cos(a), s = Math.sin(a);
    const rx = ex + cone_len * vx + rim_r * (c * u.x + s * w.x);
    const ry = ey + cone_len * vy + rim_r * (c * u.y + s * w.y);
    const rz = ez + cone_len * vz + rim_r * (c * u.z + s * w.z);
    rim2d.push(project3D(rx, ry, rz));
  }
  // Lateral fill (faint).
  const apex = project3D(ex, ey, ez);
  ctx.fillStyle = 'rgba(255, 180, 100, 0.15)';
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(rim2d[k].x, rim2d[k].y);
    ctx.lineTo(rim2d[(k + 1) % N].x, rim2d[(k + 1) % N].y);
    ctx.closePath();
  }
  ctx.fill();
  // Rim.
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.9)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(rim2d[0].x, rim2d[0].y);
  for (let k = 1; k < N; k++) ctx.lineTo(rim2d[k].x, rim2d[k].y);
  ctx.closePath();
  ctx.stroke();
  // Center axis line.
  const axisEnd = project3D(ex + cone_len * vx, ey + cone_len * vy, ez + cone_len * vz);
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(axisEnd.x, axisEnd.y); ctx.stroke();
  // Label beaming half-angle.
  ctx.fillStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  const half_deg = (half * 180 / Math.PI).toFixed(2);
  ctx.fillText(`1/gamma = ${half_deg} deg`, axisEnd.x + 6, axisEnd.y);
}

function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function norm(v) { const m = Math.hypot(v.x, v.y, v.z) || 1; v.x /= m; v.y /= m; v.z /= m; }

function drawObserver() {
  // Observer indicator: a small camera icon to the right.
  const p = project3D(2.4, 0, 0);
  ctx.fillStyle = 'rgba(120, 200, 255, 0.85)';
  ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('observer', p.x + 12, p.y + 4);
  // Dotted line to electron.
  const ePhase = st.phase;
  const ep = project3D(Math.cos(ePhase), Math.sin(ePhase), 0);
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.35)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ep.x, ep.y); ctx.stroke();
  ctx.setLineDash([]);
}

// Pulse intensity as a function of phase: peak when velocity points at
// observer (which is at +x). The angular distance from cone axis to
// observer = orbit phase modulo 2pi, basically. Gaussian shape of
// width 1/gamma:
function pulseAtPhase(phase) {
  // Velocity direction in xy plane: angle = phase + pi/2 (tangent).
  // Observer at angle 0 from origin (along +x). Angle between v and
  // observer direction = phase + pi/2 - 0 = phase + pi/2, but we want
  // the angle wrapped to [-pi, pi].
  let dPhi = phase + Math.PI / 2;
  while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
  while (dPhi < -Math.PI) dPhi += 2 * Math.PI;
  const sigma = Math.max(1e-3, beamingHalfAngle_rad(gamma()));
  return Math.exp(-(dPhi * dPhi) / (2 * sigma * sigma));
}

function drawPulse() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(PULSE.x, PULSE.y, PULSE.w, PULSE.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PULSE.x + 0.5, PULSE.y + 0.5, PULSE.w - 1, PULSE.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('observed pulse I(φ)', PULSE.x + 8, PULSE.y - 6);

  const N = 200;
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const phi = -Math.PI + (k / (N - 1)) * 2 * Math.PI;
    const I = pulseAtPhase(phi);
    const x = PULSE.x + 32 + (k / (N - 1)) * (PULSE.w - 50);
    const y = PULSE.y + PULSE.h - 24 - I * (PULSE.h - 50);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current-phase marker.
  let dPhi = st.phase + Math.PI / 2;
  while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
  while (dPhi < -Math.PI) dPhi += 2 * Math.PI;
  const xc = PULSE.x + 32 + ((dPhi + Math.PI) / (2 * Math.PI)) * (PULSE.w - 50);
  const yc = PULSE.y + PULSE.h - 24 - pulseAtPhase(st.phase) * (PULSE.h - 50);
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.75)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xc, PULSE.y + 8); ctx.lineTo(xc, PULSE.y + PULSE.h - 24); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 240, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 4, 0, Math.PI * 2); ctx.fill();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('-π', PULSE.x + 32, PULSE.y + PULSE.h - 10);
  ctx.fillText('0', PULSE.x + PULSE.w / 2 - 4, PULSE.y + PULSE.h - 10);
  ctx.fillText('+π', PULSE.x + PULSE.w - 36, PULSE.y + PULSE.h - 10);
}

function drawSpectrum() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(SPEC.x, SPEC.y, SPEC.w, SPEC.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(SPEC.x + 0.5, SPEC.y + 0.5, SPEC.w - 1, SPEC.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('spectrum F(ν/nu_c)', SPEC.x + 8, SPEC.y - 6);

  // Log-log of F(x) for x in [0.01, 10].
  const N = 200;
  let logMin = -2, logMax = 1;
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.95)';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  let Fmax = 0;
  const samples = [];
  for (let k = 0; k < N; k++) {
    const lx = logMin + (k / (N - 1)) * (logMax - logMin);
    const x = Math.pow(10, lx);
    const F = specShape(x);
    samples.push({ lx, F });
    if (F > Fmax) Fmax = F;
  }
  for (let k = 0; k < N; k++) {
    const u = Math.max(0, Math.min(1, samples[k].F / Fmax));
    const x = SPEC.x + 36 + ((samples[k].lx - logMin) / (logMax - logMin)) * (SPEC.w - 56);
    const y = SPEC.y + SPEC.h - 24 - u * (SPEC.h - 50);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // nu_c marker (at x = 1).
  const xNuC = SPEC.x + 36 + ((0 - logMin) / (logMax - logMin)) * (SPEC.w - 56);
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.8)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xNuC, SPEC.y + 10); ctx.lineTo(xNuC, SPEC.y + SPEC.h - 24); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('nu_c', xNuC + 4, SPEC.y + 24);
  // Power-law indicator nu^(1/3) at low frequency.
  ctx.fillStyle = 'rgba(120, 240, 200, 0.85)';
  ctx.fillText('F ~ ν^(1/3)', SPEC.x + 40, SPEC.y + 24);
  ctx.fillText('exp cutoff', SPEC.x + SPEC.w - 90, SPEC.y + 24);
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0.01', SPEC.x + 30, SPEC.y + SPEC.h - 10);
  ctx.fillText('1', SPEC.x + SPEC.w / 2 - 4, SPEC.y + SPEC.h - 10);
  ctx.fillText('10', SPEC.x + SPEC.w - 24, SPEC.y + SPEC.h - 10);
}

function updateReadout() {
  const g = gamma();
  const B = B_T();
  rGamma.textContent = g.toExponential(2);
  rB.textContent = B.toExponential(2);
  rBeam.textContent = (beamingHalfAngle_rad(g) * 180 / Math.PI).toExponential(2);
  rNu.textContent = criticalFrequency_Hz(g, B).toExponential(2);
  rP.textContent = singleElectronPower_W(g, B).toExponential(2);
}

function draw() {
  drawBackground();
  drawBField();
  drawOrbit();
  drawBeamingCone();
  drawObserver();
  drawPulse();
  drawSpectrum();
  updateReadout();
  // Caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`gamma = ${gamma().toExponential(1)}, B = ${B_T().toExponential(1)} T, 1/gamma = ${(beamingHalfAngle_rad(gamma()) * 180 / Math.PI).toExponential(2)} deg`, 14, SCENE.h - 10);
}

function readSliders() {
  st.logGamma = parseFloat(sGamma.value);
  st.logB = parseFloat(sB.value);
  st.speed = parseInt(sSpeed.value, 10);
  st.tilt = parseFloat(sTilt.value);
  vGamma.textContent = st.logGamma.toFixed(2);
  vB.textContent = st.logB.toFixed(2);
  vSpeed.textContent = String(st.speed);
  vTilt.textContent = String(st.tilt);
}

[sGamma, sB, sSpeed, sTilt].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => { st.phase = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  gamma: { get: () => st.logGamma, set: v => { st.logGamma = parseFloat(v); sGamma.value = v; }, parse: parseFloat },
  b_field_T: { get: () => st.logB, set: v => { st.logB = parseFloat(v); sB.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  st.phase = (CAPTURE_FRAC || 0) * 2 * Math.PI;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.phase += dt * 1.0 * st.speed;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const g = gamma();
  const B = B_T();
  return {
    fields: [
      { key: 'gamma', label: 'Lorentz factor', value: g, format: 'float' },
      { key: 'b-field', label: 'Magnetic field (T)', value: B, format: 'float' },
      { key: 'critical-freq', label: 'Critical freq (Hz)', value: criticalFrequency_Hz(g, B), format: 'float' },
      { key: 'power-radiated', label: 'Power radiated (W)', value: singleElectronPower_W(g, B), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const g = gamma();
  const B = B_T();
  const half_angle_rad = beamingHalfAngle_rad(g);
  const expected_angle = 1 / g;
  const err = Math.abs(half_angle_rad - expected_angle) / Math.max(1e-10, expected_angle);
  return [
    {
      key: 'beaming-half-angle',
      label: 'Beaming angle = 1/gamma',
      value: (err < 1e-6 ? 'pass' : err.toExponential(2)),
      status: err < 1e-6 ? 'pass' : 'drift'
    }
  ];
};
