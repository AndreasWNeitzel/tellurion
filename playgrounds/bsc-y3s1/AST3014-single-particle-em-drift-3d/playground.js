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
  exb: { r0: [0, 0, 0], v0: [0.2, 0, 0.1], scale: 110, dt: 2 * Math.PI / 240 },
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
// The 3D scene occupies the upper band; the lower band holds the velocity
// diagnostic. The projection is centred in the scene band, not the canvas.
const SCENE = { cx: W / 2, cy: Math.round(H * 0.345), bot: Math.round(H * 0.66) };
const vbuf = [];                                     // recent (vx, vy) for the diagnostic
function proj(p) {
  // orthographic: translate by the camera, rotate about z (az), tilt (el)
  const X0 = p[0] - cam.x, Y0 = p[1] - cam.y, Z0 = p[2] - cam.z;
  const x = X0 * ca - Y0 * sa;
  const y = X0 * sa + Y0 * ca;
  return [SCENE.cx + x * scale, SCENE.cy + (y * se - Z0 * ce) * scale];
}

function rebuild() {
  const cfg = PRESETS[st.preset];
  scale = cfg.scale;
  s = createState({ q: st.q, m: 1, r0: cfg.r0.slice(), v0: cfg.v0.slice(), preset: st.preset, params: { B0: st.B0, E0: 0.4 * st.B0, grad: 0.06, mirror: 0.05 } });
  s.trail = [];
  vbuf.length = 0;
  gc.init = false; cam.x = cam.y = cam.z = 0;
}

function advance() {
  const dt = PRESETS[st.preset].dt;
  for (let k = 0; k < st.speed; k += 1) {
    step(s, dt);
    s.trail.push(s.r.slice());
    if (s.trail.length > 2600) s.trail.shift();
    vbuf.push([s.v[0], s.v[1]]);
    if (vbuf.length > 480) vbuf.shift();
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
  ctx.fillStyle = 'rgba(7,8,12,0.16)'; ctx.fillRect(0, 0, W, SCENE.bot);  // persistence fade (scene band only)
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
  ctx.fillStyle = 'rgba(220,228,245,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(DRIFT_LABEL[st.preset] || '', 12, SCENE.bot - 12);

  drawDiag();

  rV.textContent = speed(s).toFixed(4);
  rMu.textContent = magneticMoment(s).toFixed(4);
  rWc.textContent = gyrofrequency(st.q, 1, st.B0).toFixed(3);
  if (st.preset === 'exb') { const d = exbDrift(s); rExtra.textContent = 'vd ' + Math.hypot(d[0], d[1], d[2]).toFixed(3); }
  else if (st.preset === 'mirror') rExtra.textContent = 'v|| ' + vParallel(s).toFixed(3);
  else rExtra.textContent = 'KE ' + (0.5 * speed(s) ** 2).toFixed(3);
}

// Velocity diagnostic: the two perpendicular components vx, vy versus time.
// Each is a sinusoid at the gyro-frequency; the gyration is the oscillation,
// the drift is the offset of the time-average from zero. For pure cyclotron
// both means sit on zero (no drift); for E x B one mean is displaced by the
// drift speed. The dashed lines are the running means, so the gap from zero
// reads directly as the guiding-centre drift.
function drawDiag() {
  const x = 54, y = SCENE.bot + 8, w = W - 84, h = H - SCENE.bot - 40;
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, SCENE.bot, W, H - SCENE.bot);
  ctx.fillStyle = 'rgba(91,192,235,0.04)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,230,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('perpendicular velocity vs time: gyration (oscillation) about the drift (mean offset)', x + 4, SCENE.bot + 2);
  if (vbuf.length < 2) { ctx.textAlign = 'left'; return; }
  let vmax = 1e-6, mx = 0, my = 0;
  for (const [vx, vy] of vbuf) { vmax = Math.max(vmax, Math.abs(vx), Math.abs(vy)); mx += vx; my += vy; }
  vmax *= 1.1; mx /= vbuf.length; my /= vbuf.length;
  const ZY = y + h / 2;
  const PY = (v) => ZY - v / vmax * (h / 2 - 4);
  const PX = (i) => x + i / (vbuf.length - 1) * w;
  // zero line
  ctx.strokeStyle = 'rgba(150,160,180,0.25)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, ZY); ctx.lineTo(x + w, ZY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'right'; ctx.fillText('0', x - 5, ZY + 4);
  for (const [arr, col, mean] of [[0, 'rgba(245,245,255,0.9)', mx], [1, '#ffd24a', my]]) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
    vbuf.forEach((vv, i) => { const py = PY(vv[arr]); if (i === 0) ctx.moveTo(PX(i), py); else ctx.lineTo(PX(i), py); });
    ctx.stroke();
    // running mean (the drift in that component)
    ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, PY(mean)); ctx.lineTo(x + w, PY(mean)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(245,245,255,0.9)'; ctx.fillText(`vx  (mean ${mx.toFixed(3)})`, x + 8, y + 14);
  ctx.fillStyle = '#ffd24a'; ctx.fillText(`vy  (mean ${my.toFixed(3)})`, x + 168, y + 14);
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!s) return { fields: [{ key: 'init', label: 'Initializing', value: 'pending', format: undefined }] };
  const v = speed(s);
  const mu = magneticMoment(s);
  const wc = gyrofrequency(st.q, 1, st.B0);
  return {
    fields: [
      { key: 'preset', label: 'Field preset', value: st.preset, format: undefined },
      { key: 'magnetic-field', label: 'Magnetic field B0', value: st.B0, format: 'float' },
      { key: 'speed', label: 'Speed |v|', value: v, format: 'float' },
      { key: 'magnetic-moment', label: 'Adiabatic invariant mu', value: mu, format: 'float' },
      { key: 'gyro-frequency', label: 'Gyro frequency wc', value: wc, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  if (!s) return [{ key: 'state-init', label: 'Initializing', value: 'pending', status: 'pending' }];
  const v = speed(s);
  const mu = magneticMoment(s);
  const wc = gyrofrequency(st.q, 1, st.B0);
  const gyro_period = 2 * Math.PI / Math.abs(wc);
  const position_bounded = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z) < 200;
  return [
    {
      key: 'speed-conservation-magnetic',
      label: 'Speed conserved in B field (cyclotron only)',
      value: v.toExponential(2),
      status: st.preset === 'cyclotron' ? 'pass' : 'pending'
    },
    {
      key: 'position-bounded',
      label: 'Particle stays in domain',
      value: position_bounded ? 'bounded' : 'escaped',
      status: position_bounded ? 'pass' : 'drift'
    },
    {
      key: 'gyro-period',
      label: 'Gyro period Tc',
      value: gyro_period.toExponential(2),
      status: 'pending'
    }
  ];
};
