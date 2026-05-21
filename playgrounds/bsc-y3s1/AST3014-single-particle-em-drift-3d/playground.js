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
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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
const st = { preset: 'cyclotron', B0: 1, q: 1, speed: 3, running: !prefersReducedMotion() };
let s, scale = 70;
// Guiding centre (EMA of position: averages out the gyration, leaving
// the slow drift) and a camera that follows it, so the orbit never
// drifts out of view for any preset and you literally watch the
// particle gyrate about its drifting guiding centre.
const gc = { x: 0, y: 0, z: 0, init: false };
const cam = { x: 0, y: 0, z: 0 };
const az = 0.62, el = 0.42;                          // fixed view angles
const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
function proj(p) {
  // orthographic: translate by the camera, rotate about z (az), tilt (el)
  const X0 = p[0] - cam.x, Y0 = p[1] - cam.y, Z0 = p[2] - cam.z;
  const x = X0 * ca - Y0 * sa;
  const y = X0 * sa + Y0 * ca;
  return [W / 2 + x * scale, H / 2 + (y * se - Z0 * ce) * scale];
}

function rebuild() {
  const cfg = PRESETS[st.preset];
  scale = cfg.scale;
  s = createState({ q: st.q, m: 1, r0: cfg.r0.slice(), v0: cfg.v0.slice(), preset: st.preset, params: { B0: st.B0, E0: 0.4 * st.B0, grad: 0.06, mirror: 0.05 } });
  s.trail = [];
  gc.init = false; cam.x = cam.y = cam.z = 0;
}

function advance() {
  const dt = PRESETS[st.preset].dt;
  for (let k = 0; k < st.speed; k += 1) {
    step(s, dt);
    s.trail.push(s.r.slice());
    if (s.trail.length > 2600) s.trail.shift();
    // Guiding centre = slow EMA of position (gyration averages out).
    if (!gc.init) { gc.x = s.r[0]; gc.y = s.r[1]; gc.z = s.r[2]; gc.init = true; }
    else { const a = 0.02; gc.x += a * (s.r[0] - gc.x); gc.y += a * (s.r[1] - gc.y); gc.z += a * (s.r[2] - gc.z); }
  }
  // Camera eases toward the guiding centre so the orbit stays framed.
  cam.x += 0.12 * (gc.x - cam.x);
  cam.y += 0.12 * (gc.y - cam.y);
  cam.z += 0.12 * (gc.z - cam.z);
}

function axes() {
  ctx.strokeStyle = 'rgba(120,140,170,0.35)'; ctx.lineWidth = 1;
  const O = proj([0, 0, 0]);
  for (const [ax, col, lab] of [[[3.4, 0, 0], '#c98', 'x'], [[0, 3.4, 0], '#9c8', 'y'], [[0, 0, 3.4], '#89c', 'z']]) {
    const P = proj(ax);
    ctx.strokeStyle = 'rgba(150,160,190,0.30)';
    ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
    ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(lab, P[0] + 3, P[1]);
  }
}

function arrow3(a, b, color, label) {
  const A = proj(a), B = proj(b);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  const an = Math.atan2(B[1] - A[1], B[0] - A[0]);
  ctx.beginPath(); ctx.moveTo(B[0], B[1]);
  ctx.lineTo(B[0] - 9 * Math.cos(an - 0.4), B[1] - 9 * Math.sin(an - 0.4));
  ctx.lineTo(B[0] - 9 * Math.cos(an + 0.4), B[1] - 9 * Math.sin(an + 0.4));
  ctx.closePath(); ctx.fill();
  if (label) { ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(label, B[0] + 5, B[1] - 4); }
  ctx.lineWidth = 1;
}
const DRIFT_LABEL = {
  cyclotron: 'cyclotron: pure gyration, no drift',
  exb: 'E x B drift: v_d = E x B / B^2 (charge-independent)',
  gradB: 'grad-B drift: v_d ~ (m v_perp^2 / 2qB^3) B x grad B',
  curvature: 'curvature drift: v_d ~ (m v_||^2 / qB) along R_c x B',
  mirror: 'magnetic mirror: mu = m v_perp^2 / 2B invariant; v_|| reflects',
};

function render() {
  ctx.fillStyle = 'rgba(7,8,12,0.16)'; ctx.fillRect(0, 0, W, H);  // persistence fade
  axes();
  // B-field hint: a faint grid of +z arrows around the camera (B is
  // predominantly along z for these presets) so the field is visible.
  for (let gx = -1; gx <= 1; gx += 1) {
    for (let gy = -1; gy <= 1; gy += 1) {
      arrow3([cam.x + gx * 1.7, cam.y + gy * 1.7, cam.z - 1.1],
        [cam.x + gx * 1.7, cam.y + gy * 1.7, cam.z + 1.1], 'rgba(110,140,200,0.30)', null);
    }
  }
  const blab = proj([cam.x + 1.7, cam.y + 1.7, cam.z + 1.15]);
  ctx.fillStyle = 'rgba(150,175,230,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('B', blab[0] + 4, blab[1]);
  // helix trail
  ctx.strokeStyle = st.q >= 0 ? 'rgba(255,150,90,0.75)' : 'rgba(110,170,255,0.75)';
  ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < s.trail.length; i += 1) {
    const P = proj(s.trail[i]);
    if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
  }
  ctx.stroke();
  // guiding centre marker
  if (gc.init) {
    const G = proj([gc.x, gc.y, gc.z]);
    ctx.strokeStyle = 'rgba(150,255,200,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(G[0] - 5, G[1]); ctx.lineTo(G[0] + 5, G[1]);
    ctx.moveTo(G[0], G[1] - 5); ctx.lineTo(G[0], G[1] + 5); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(150,255,200,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('guiding centre', G[0] + 7, G[1] + 11);
  }
  // particle + its velocity and (E x B) drift vectors
  const P = proj(s.r);
  const vmag = speed(s) || 1;
  arrow3(s.r, [s.r[0] + s.v[0] / vmag * 0.9, s.r[1] + s.v[1] / vmag * 0.9, s.r[2] + s.v[2] / vmag * 0.9],
    'rgba(245,245,255,0.85)', 'v');
  if (st.preset === 'exb') {
    const d = exbDrift(s); const dm = Math.hypot(d[0], d[1], d[2]) || 1;
    arrow3([gc.x, gc.y, gc.z], [gc.x + d[0] / dm * 1.2, gc.y + d[1] / dm * 1.2, gc.z + d[2] / dm * 1.2],
      '#ffd24a', 'v_d');
  }
  ctx.fillStyle = st.q >= 0 ? '#ffcaa0' : '#a8ccff';
  ctx.beginPath(); ctx.arc(P[0], P[1], 4, 0, 2 * Math.PI); ctx.fill();
  // active-drift explanation (educational, not just a projection note)
  ctx.fillStyle = 'rgba(220,228,245,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(DRIFT_LABEL[st.preset] || '', 12, H - 12);

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
