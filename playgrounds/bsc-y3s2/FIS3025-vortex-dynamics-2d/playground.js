// 2D point-vortex dynamics. Vortices advect each other (Biot-Savart);
// tracer particles ride the induced velocity field as streaklines.
// Physics is the gate-tested sim.js (Hamiltonian, conserved
// circulation and impulse, dipole speed Gamma/2 pi d). Canvas2D,
// deterministic in capture (index-seeded tracers).
import {
  createState, step, inducedVelocity, totalCirculation, linearImpulse,
  angularImpulse, hamiltonian, preset,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rH = document.getElementById('readout-h');
const rG = document.getElementById('readout-gamma');
const rP = document.getElementById('readout-p');
const rL = document.getElementById('readout-l');
const selPre = document.getElementById('select-preset');
const sStr = document.getElementById('slider-strength'), vStr = document.getElementById('value-strength');
const sSpd = document.getElementById('slider-speed'), vSpd = document.getElementById('value-speed');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const VIEW = 4.2;                                     // world half-extent (tighter framing)
const SX = W / (2 * VIEW), SY = SX;                   // isotropic world->pixel
const CXp = W / 2, CYp = H / 2;
function px(x) { return CXp + x * SX; }
function py(y) { return CYp - y * SY; }

const st = { presetName: 'dipole', strength: 1, speed: 3, running: true, t: 0, H0: 0 };
let s, tracers = [];

function buildTracers(deterministic) {
  tracers = [];
  const N = 2200;
  for (let i = 0; i < N; i += 1) {
    let rx, ry;
    if (deterministic) { rx = ((i * 73) % 100) / 100 * 2 * VIEW - VIEW; ry = ((i * 31) % 100) / 100 * 2 * VIEW - VIEW; }
    else { rx = (Math.random() * 2 - 1) * VIEW; ry = (Math.random() * 2 - 1) * VIEW; }
    tracers.push([rx, ry]);
  }
}
function build(deterministic) {
  const v = preset(st.presetName).map(o => ({ x: o.x, y: o.y, gamma: o.gamma * st.strength }));
  s = createState(v);
  st.H0 = hamiltonian(s) || 1e-12;
  buildTracers(deterministic);
}

function advance(dt) {
  step(s, dt);
  // Detect when ALL vortices have drifted out of view (the user
  // complaint was "dipole/quadrupole leave screen") and auto-restart
  // the simulation with the same preset so the pattern stays visible
  // indefinitely. Avoids breaking the Hamiltonian by torus-wrapping
  // the vortex positions, which would corrupt the 1/r interaction.
  let allOut = true;
  for (let i = 0; i < s.n; i += 1) {
    if (s.x[i] >= -VIEW * 1.2 && s.x[i] <= VIEW * 1.2
        && s.y[i] >= -VIEW * 1.2 && s.y[i] <= VIEW * 1.2) { allOut = false; break; }
  }
  if (allOut) { build(false); }
  for (const tr of tracers) {
    const [vx, vy] = inducedVelocity(s, tr[0], tr[1]);
    tr[0] += vx * dt; tr[1] += vy * dt;
    if (tr[0] < -VIEW || tr[0] > VIEW || tr[1] < -VIEW || tr[1] > VIEW) {
      tr[0] = (((tr[0] + 3 * VIEW) % (2 * VIEW)) - VIEW);
      tr[1] = (((tr[1] + 3 * VIEW) % (2 * VIEW)) - VIEW);
    }
  }
}

function render() {
  // Persistence fade: tracers accumulate into streaklines that reveal
  // the induced flow, then slowly fade (the standard dye technique).
  ctx.fillStyle = 'rgba(7,8,12,0.12)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(150,195,240,0.62)';
  for (const tr of tracers) {
    const X = px(tr[0]), Y = py(tr[1]);
    if (X >= 0 && X < W && Y >= 0 && Y < H) ctx.fillRect(X, Y, 2, 2);
  }
  // vortices
  for (let i = 0; i < s.n; i += 1) {
    const X = px(s.x[i]), Y = py(s.y[i]);
    const rad = 5 + 6 * Math.sqrt(Math.abs(s.g[i]));
    const pos = s.g[i] >= 0;
    const grd = ctx.createRadialGradient(X, Y, 0, X, Y, rad);
    grd.addColorStop(0, pos ? 'rgba(255,140,90,0.95)' : 'rgba(90,160,255,0.95)');
    grd.addColorStop(1, pos ? 'rgba(255,140,90,0)' : 'rgba(90,160,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(X, Y, rad, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = pos ? '#ffcaa0' : '#a8ccff';
    ctx.beginPath(); ctx.arc(X, Y, 3, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px monospace';
  ctx.fillText('warm = +circulation, cool = -circulation; tracers ride the induced flow', 14, H - 14);

  const drift = Math.abs((hamiltonian(s) - st.H0) / st.H0);
  rH.textContent = drift.toExponential(1);
  rG.textContent = totalCirculation(s).toFixed(3);
  const [ipx, ipy] = linearImpulse(s);
  rP.textContent = Math.hypot(ipx, ipy).toFixed(3);
  rL.textContent = angularImpulse(s).toFixed(3);
}

function tick() {
  if (st.running) {
    const dt = 0.004 * st.speed;
    for (let k = 0; k < 3; k += 1) advance(dt);
    st.t += 3 * dt;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vStr.textContent = st.strength.toFixed(2); vSpd.textContent = String(st.speed); }
selPre.addEventListener('change', () => { st.presetName = selPre.value; build(false); render(); });
sStr.addEventListener('input', () => { st.strength = parseFloat(sStr.value) / 100; syncLabels(); build(false); render(); });
sSpd.addEventListener('input', () => { st.speed = parseInt(sSpd.value, 10); syncLabels(); });
bR.addEventListener('click', () => {
  st.presetName = 'dipole'; st.strength = 1; st.speed = 3; st.running = true;
  selPre.value = 'dipole'; sStr.value = '100'; sSpd.value = '3';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
  syncLabels(); build(false); render();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { vortex_preset: st.presetName, strength: st.strength.toFixed(2) }; }
function restoreState() {
  const q = parseUrlState();
  if (!q) return;
  if (q.vortex_preset) { st.presetName = q.vortex_preset; selPre.value = q.vortex_preset; }
  if (q.strength) { st.strength = parseFloat(q.strength); sStr.value = String(Math.round(st.strength * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    st.presetName = 'dipole'; st.strength = 1;
    build(true);
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(f * 520);
    // render every step so the streakline persistence builds up
    // deterministically into the golden frame (matches the live look)
    for (let n = 0; n < steps; n += 1) { advance(0.004 * st.speed); render(); }
    if (steps === 0) render();
  } else {
    build(false); render();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
