// A charged particle in static E/B fields, F = q(E + v x B), pushed
// by the Boris integrator. The 3D helical orbit and its guiding-
// centre drift are drawn with a Canvas2D orthographic projection (no
// WebGL: a deterministic, gate-robust renderer; the 3D motion is
// honestly a 2D projection of the real 3D trajectory). Physics is the
// gate-tested sim.js. Presets: cyclotron, E x B, grad-B, curvature,
// magnetic mirror.
import {
  createState, step, speed, magneticMoment, vParallel, exbDrift, gyrofrequency,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rV = document.getElementById('readout-v');
const rMu = document.getElementById('readout-mu');
const rWc = document.getElementById('readout-wc');
const rExtra = document.getElementById('readout-extra');
const selPre = document.getElementById('select-preset');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const selQ = document.getElementById('select-charge');
const sSpd = document.getElementById('slider-speed'), vSpd = document.getElementById('value-speed');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const PRESETS = {
  cyclotron: { r0: [0, 0, 0], v0: [1, 0, 0.35], scale: 70, dt: 2 * Math.PI / 240 },
  exb: { r0: [0, 0, 0], v0: [0.2, 0, 0.1], scale: 26, dt: 2 * Math.PI / 240 },
  gradB: { r0: [-2, 0, 0], v0: [0.9, 0, 0.2], scale: 34, dt: 0.01 },
  curvature: { r0: [3, 0, 0], v0: [0.2, 0, 0.9], scale: 34, dt: 0.01 },
  mirror: { r0: [0, 0, -3], v0: [0.5, 0, 0.7], scale: 30, dt: 2 * Math.PI / 240 },
};
const st = { preset: 'cyclotron', B0: 1, q: 1, speed: 3, running: true };
let s, scale = 70;
const az = 0.62, el = 0.42;                          // fixed view angles
const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
function proj(p) {
  // orthographic: rotate about z (az) then tilt (el)
  const x = p[0] * ca - p[1] * sa;
  const y = p[0] * sa + p[1] * ca;
  const sx = x;
  const sy = y * se - p[2] * ce;
  return [W / 2 + sx * scale, H / 2 + sy * scale];
}

function rebuild() {
  const cfg = PRESETS[st.preset];
  scale = cfg.scale;
  s = createState({ q: st.q, m: 1, r0: cfg.r0.slice(), v0: cfg.v0.slice(), preset: st.preset, params: { B0: st.B0, E0: 0.4 * st.B0, grad: 0.06, mirror: 0.05 } });
  s.trail = [];
}

function advance() {
  const dt = PRESETS[st.preset].dt;
  for (let k = 0; k < st.speed; k += 1) {
    step(s, dt);
    s.trail.push(s.r.slice());
    if (s.trail.length > 2600) s.trail.shift();
  }
}

function axes() {
  ctx.strokeStyle = 'rgba(120,140,170,0.35)'; ctx.lineWidth = 1;
  const O = proj([0, 0, 0]);
  for (const [ax, col, lab] of [[[3.4, 0, 0], '#c98', 'x'], [[0, 3.4, 0], '#9c8', 'y'], [[0, 0, 3.4], '#89c', 'z']]) {
    const P = proj(ax);
    ctx.strokeStyle = 'rgba(150,160,190,0.30)';
    ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
    ctx.fillStyle = col; ctx.font = '11px monospace'; ctx.fillText(lab, P[0] + 3, P[1]);
  }
}

function render() {
  ctx.fillStyle = 'rgba(7,8,12,0.16)'; ctx.fillRect(0, 0, W, H);  // persistence fade
  axes();
  // helix trail
  ctx.strokeStyle = st.q >= 0 ? 'rgba(255,150,90,0.75)' : 'rgba(110,170,255,0.75)';
  ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < s.trail.length; i += 1) {
    const P = proj(s.trail[i]);
    if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
  }
  ctx.stroke();
  // particle
  const P = proj(s.r);
  ctx.fillStyle = st.q >= 0 ? '#ffcaa0' : '#a8ccff';
  ctx.beginPath(); ctx.arc(P[0], P[1], 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px monospace';
  ctx.fillText('Boris pusher, F = q(E + v x B); trail is the 3D orbit, orthographic projection', 12, H - 12);

  rV.textContent = speed(s).toFixed(4);
  rMu.textContent = magneticMoment(s).toFixed(4);
  rWc.textContent = gyrofrequency(st.q, 1, st.B0).toFixed(3);
  if (st.preset === 'exb') { const d = exbDrift(s); rExtra.textContent = 'vd ' + Math.hypot(d[0], d[1], d[2]).toFixed(3); }
  else if (st.preset === 'mirror') rExtra.textContent = 'v|| ' + vParallel(s).toFixed(3);
  else rExtra.textContent = 'KE ' + (0.5 * speed(s) ** 2).toFixed(3);
}

function tick() {
  if (st.running) advance();
  render();
  requestAnimationFrame(tick);
}

function syncLabels() { vB.textContent = st.B0.toFixed(2); vSpd.textContent = String(st.speed); }
selPre.addEventListener('change', () => { st.preset = selPre.value; rebuild(); render(); });
sB.addEventListener('input', () => { st.B0 = parseFloat(sB.value) / 100; syncLabels(); rebuild(); render(); });
selQ.addEventListener('change', () => { st.q = parseFloat(selQ.value); rebuild(); render(); });
sSpd.addEventListener('input', () => { st.speed = parseInt(sSpd.value, 10); syncLabels(); });
bR.addEventListener('click', () => {
  st.preset = 'cyclotron'; st.B0 = 1; st.q = 1; st.speed = 3; st.running = true;
  selPre.value = 'cyclotron'; sB.value = '100'; selQ.value = '1'; sSpd.value = '3';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
  syncLabels(); rebuild(); render();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { drift_preset: st.preset, b_field: st.B0.toFixed(2), charge: String(st.q) }; }
function restoreState() {
  const q = parseUrlState();
  if (!q) return;
  if (q.drift_preset && PRESETS[q.drift_preset]) { st.preset = q.drift_preset; selPre.value = q.drift_preset; }
  if (q.b_field) { st.B0 = parseFloat(q.b_field); sB.value = String(Math.round(st.B0 * 100)); }
  if (q.charge) { st.q = parseFloat(q.charge); selQ.value = String(st.q); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    // Capture the E x B drift (the playground's headline): the guiding
    // centre translates, so every frame is at a new position. Pure
    // cyclotron is a closed circle, so its trail saturates and the
    // frames stop differing.
    st.preset = 'exb'; st.B0 = 1; st.q = 1;
    if (selPre) selPre.value = 'exb';
    rebuild();
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(f * 520);
    for (let n = 0; n < steps; n += 1) { advance(); render(); }
    if (steps === 0) render();
  } else {
    render();
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
