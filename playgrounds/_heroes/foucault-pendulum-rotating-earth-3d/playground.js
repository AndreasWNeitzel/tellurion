// Foucault pendulum playground. Side-by-side: rotating Earth with
// suspension marker (left) and the bob's floor trace (right). The
// physics is the rotating-frame harmonic oscillator with Coriolis
// term, integrated by a Boris-style symplectic step (see sim.js).

import { step, planeAngle, energy, ic, precessionPeriod, PENDULUM_OMEGA, OMEGA_EARTH } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rLat = document.getElementById('readout-lat');
const rAng = document.getElementById('readout-ang');
const rT = document.getElementById('readout-T');
const sLat = document.getElementById('slider-lat'), vLat = document.getElementById('value-lat');
const sAmp = document.getElementById('slider-amp'), vAmp = document.getElementById('value-amp');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  latDeg: 49, amp: 1.0, speed: 2,
  running: !prefersReducedMotion(),
  state: null, traceX: [], traceY: [], TRACE: 4000,
  earthRot: 0, E0: 0,
};

function resetState() {
  st.state = ic(st.amp);
  st.E0 = energy(st.state);
  st.traceX = []; st.traceY = [];
  st.earthRot = 0;
}
resetState();

// Project from Earth-frame (x, y, z) with rotation about z by earthRot.
function projEarth(x, y, z, cx, cy, R) {
  const ca = Math.cos(st.earthRot), sa = Math.sin(st.earthRot);
  const xp = ca * x - sa * y;
  const yp = sa * x + ca * y;
  // Tilt 45 deg about x
  const tx = xp;
  const ty = yp * 0.7 - z * 0.7;
  const tz = yp * 0.7 + z * 0.7;
  const f = 1 / (1.0 - tz * 0.25);     // perspective
  return { x: cx + tx * R * f, y: cy - ty * R * f, depth: tz, scale: f };
}

function drawEarth() {
  // Top panel: 3D Earth with suspension marker (portrait stack).
  const cx = W / 2, cy = Math.round(H * 0.23), R = 150;
  // Globe gradient.
  const g = ctx.createRadialGradient(cx - 30, cy - 30, R * 0.2, cx, cy, R);
  g.addColorStop(0, '#3b6eb0');
  g.addColorStop(0.6, '#1a3a66');
  g.addColorStop(1, '#0b1e36');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();

  // Equator (projected)
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.20)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const phi = (k / 64) * 2 * Math.PI;
    const p = projEarth(Math.cos(phi), Math.sin(phi), 0, cx, cy, R);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Latitude circle of the pendulum
  const phi = st.latDeg * Math.PI / 180;
  const cosLat = Math.cos(phi);
  const sinLat = Math.sin(phi);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
  ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k <= 64; k += 1) {
    const lon = (k / 64) * 2 * Math.PI;
    const p = projEarth(cosLat * Math.cos(lon), cosLat * Math.sin(lon), sinLat, cx, cy, R);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Suspension marker at lon = 0 (rotating with Earth).
  const sp = projEarth(cosLat, 0, sinLat, cx, cy, R);
  // The earthRot rotation is applied in projEarth already, so this
  // marker correctly rides on the latitude circle as time advances.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(sp.x, sp.y, 5, 0, 2 * Math.PI); ctx.fill();

  // Polar axis
  const top = projEarth(0, 0, 1.2, cx, cy, R);
  const bot = projEarth(0, 0, -1.2, cx, cy, R);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();

  // Labels.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText(`φ = ${st.latDeg}°`, cx, cy - R - 14);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.fillText('suspension point', cx, cy + R + 16);
}

function drawTrace() {
  // Middle panel: floor trace of the bob (precessing rosette).
  const cx = W / 2, cy = Math.round(H * 0.57), R = 165;
  // Background framed disk.
  ctx.fillStyle = '#0a0a0e';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Cross axes
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
  ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
  ctx.stroke();
  // Compass labels
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - R - 4);
  ctx.fillText('S', cx, cy + R + 14);
  ctx.fillText('E', cx + R + 10, cy + 4);
  ctx.fillText('W', cx - R - 10, cy + 4);

  // Trace (fade older points)
  const N = st.traceX.length;
  if (N > 1) {
    for (let i = 1; i < N; i += 1) {
      const a = 0.15 + 0.85 * (i / N);
      ctx.strokeStyle = `rgba(120, 200, 255, ${a.toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx + st.traceX[i - 1] * (R / 1.6), cy - st.traceY[i - 1] * (R / 1.6));
      ctx.lineTo(cx + st.traceX[i] * (R / 1.6), cy - st.traceY[i] * (R / 1.6));
      ctx.stroke();
    }
  }

  // Current bob position
  if (st.state) {
    const bx = cx + st.state.x * (R / 1.6);
    const by = cy - st.state.y * (R / 1.6);
    ctx.fillStyle = '#ff8080';
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, 2 * Math.PI); ctx.fill();
    // Wire from suspension (top center)
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('local floor (bob trace)', cx, cy - R - 14);
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  drawEarth();
  drawTrace();

  // Bottom HUD: stats
  const phi = st.latDeg * Math.PI / 180;
  const T_prec = precessionPeriod(phi);
  const T_prec_str = Number.isFinite(T_prec) ? `${T_prec.toFixed(1)} t.u.` : 'infinite';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`Coriolis Ω = Ω_earth · sin(φ) = ${(OMEGA_EARTH * Math.sin(phi)).toFixed(3)}`, 24, 26);
  ctx.fillText(`precession period = ${T_prec_str}    (sidereal "day" = ${(2 * Math.PI / OMEGA_EARTH).toFixed(1)} t.u.)`, 24, 44);
  ctx.fillText(`Foucault 1851: at Paris (49°), the bob's plane rotates 11° per hour clockwise`, 24, H - 16);

  rLat.textContent = `${st.latDeg}°`;
  rAng.textContent = `${(planeAngle(st.state) * 180 / Math.PI).toFixed(1)}°`;
  rT.textContent = T_prec_str;

  // Rule-13 diagnostic: swing-plane azimuth vs time. For a Foucault
  // pendulum the plane precesses linearly at Omega_earth sin(phi);
  // the chart should be a straight ramp whose slope is that rate.
  const angNow = planeAngle(st.state) * 180 / Math.PI;
  const simT = st.state ? st.state.t : 0;
  if (angHistory.length === 0 || simT - angHistory[angHistory.length - 1].t > 0.15) {
    angHistory.push({ t: simT, a: angNow });
    if (angHistory.length > 360) angHistory.shift();
  }
  drawAngleDiagnostic();
}

const angHistory = [];
function drawAngleDiagnostic() {
  // Bottom panel: full-width swing-plane azimuth vs time (the Rule-13 ramp).
  const pw = W - 120, ph = 170, px = 60, py = Math.round(H * 0.80);
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('swing-plane azimuth vs time', px + 8, py + 14);
  if (angHistory.length < 2) return;
  const ax = px + 34, ay = py + 22, aw = pw - 46, ah = ph - 40;
  let aMin = Infinity, aMax = -Infinity;
  for (const p of angHistory) { if (p.a < aMin) aMin = p.a; if (p.a > aMax) aMax = p.a; }
  if (aMax - aMin < 10) { aMax = aMin + 10; }
  const t0 = angHistory[0].t, t1 = angHistory[angHistory.length - 1].t;
  const xOf = (t) => ax + (t1 > t0 ? (t - t0) / (t1 - t0) : 0) * aw;
  const yOf = (a) => ay + ah - ((a - aMin) / (aMax - aMin)) * ah;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < angHistory.length; i += 1) {
    const p = angHistory[i];
    const x = xOf(p.t), y = yOf(p.a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${aMax.toFixed(0)}°`, px + 4, ay + 8);
  ctx.fillText(`${aMin.toFixed(0)}°`, px + 4, ay + ah);
  ctx.fillText('t', ax + aw / 2, py + ph - 4);
}

function tick() {
  if (st.running) {
    const sub = Math.max(1, st.speed);
    const dt = 0.012 * sub;
    for (let k = 0; k < sub * 4; k += 1) {
      step(st.state, dt / (sub * 4), st.latDeg * Math.PI / 180);
    }
    // Push trace
    if (st.state) {
      st.traceX.push(st.state.x);
      st.traceY.push(st.state.y);
      if (st.traceX.length > st.TRACE) { st.traceX.shift(); st.traceY.shift(); }
    }
    // Advance Earth rotation
    st.earthRot += 0.005 * sub;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vLat.textContent = String(st.latDeg);
  vAmp.textContent = st.amp.toFixed(2);
  vSpeed.textContent = String(st.speed);
}

sLat.addEventListener('input', () => { st.latDeg = parseInt(sLat.value, 10); syncLabels(); });
sAmp.addEventListener('input', () => { st.amp = parseFloat(sAmp.value); syncLabels(); resetState(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.latDeg = 49; st.amp = 1.0; st.speed = 2;
  sLat.value = '49'; sAmp.value = '1.0'; sSpeed.value = '2';
  syncLabels(); resetState();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { latitude_deg: st.latDeg, amp: st.amp }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.latitude_deg) { st.latDeg = parseInt(s.latitude_deg, 10); sLat.value = String(st.latDeg); }
  if (s.amp) { st.amp = parseFloat(s.amp); sAmp.value = String(st.amp); resetState(); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep latitude across captures so the goldens span "no rotation" -> "pole".
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.latDeg = Math.round(5 + f * 80);
    sLat.value = String(st.latDeg); syncLabels();
    resetState();
    // March a few hundred steps so the trace populates.
    const phi = st.latDeg * Math.PI / 180;
    for (let n = 0; n < 600; n += 1) {
      step(st.state, 0.012, phi);
      if (n % 4 === 0) { st.traceX.push(st.state.x); st.traceY.push(st.state.y); }
      // Record the swing-plane azimuth so the Rule-13 ramp populates; without
      // this the capture draws once and the azimuth-vs-time panel is empty.
      if (n % 6 === 0) {
        angHistory.push({ t: st.state.t, a: planeAngle(st.state) * 180 / Math.PI });
        if (angHistory.length > 360) angHistory.shift();
      }
      st.earthRot += 0.005;
    }
  }
  render();
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
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// The Coriolis rotation does no work and the spring is conservative,
// so the pendulum's energy is the invariant the symplectic step must
// hold while the plane precesses.
window.playground = window.playground || {};
window.playground.getState = function () {
  const phi = st.latDeg * Math.PI / 180;
  return {
    fields: [
      { key: 'latitude', label: 'latitude', value: `${st.latDeg} deg` },
      { key: 'plane-angle', label: 'pendulum plane angle', value: `${(planeAngle(st.state) * 180 / Math.PI).toFixed(1)} deg` },
      { key: 'precession-rate', label: 'precession Omega sin(phi)', value: (OMEGA_EARTH * Math.sin(phi)).toFixed(3), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!st.state) return [];
  const dE = Math.abs(energy(st.state) - st.E0) / Math.max(1e-12, Math.abs(st.E0));
  return [
    {
      key: 'energy',
      label: 'pendulum energy conserved (rel. drift)',
      value: dE.toExponential(2),
      // The Strang-split step keeps energy in a bounded band a few
      // 1e-3 wide; that bounded oscillation is still conservation.
      status: dE < 6e-3 ? 'pass' : (dE < 3e-2 ? 'pending' : 'drift'),
    },
  ];
};
