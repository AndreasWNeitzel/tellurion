// Spin-1/2 on the Bloch sphere, Canvas2D with an explicit 3D
// projection (no WebGL: the project stack is Canvas2D/SVG only). The
// spin obeys dS/dt = Omega(t) x S with a static field along z and a
// circularly polarized RF drive; each step is an exact rotation so
// |S| stays 1. Larmor precession, resonant Rabi flopping, detuned
// (incomplete) inversion, and instantaneous pi / pi-half pulses.

import { stepBloch, rodrigues, norm, blochAngles } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rNorm = document.getElementById('readout-norm');
const rSz = document.getElementById('readout-sz');
const rTheta = document.getElementById('readout-theta');
const rReg = document.getElementById('readout-regime');

const sW0 = document.getElementById('slider-w0'), vW0 = document.getElementById('value-w0');
const sW1 = document.getElementById('slider-w1'), vW1 = document.getElementById('value-w1');
const sD = document.getElementById('slider-delta'), vD = document.getElementById('value-delta');
const selF = document.getElementById('select-frame');
const tTrail = document.getElementById('toggle-trail');
const bPi = document.getElementById('btn-pi'), bPih = document.getElementById('btn-pihalf');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { S: [0, 0, 1], t: 0, w0: 1.2, w1: 0.5, delta: 0, frame: 'lab', trail: true, running: !prefersReducedMotion(), traj: [], az: -0.62, el: 0.46 };
const wrf = () => st.w0 - st.delta;
const params3 = () => ({ w0: st.w0, w1: st.w1, wrf: wrf() });

// Interactive 3D view (drag to orbit). World axes: z up (poles |0>,
// |1>), x toward |+>. Trig is cached and refreshed on view change.
const R = 168, CX = W * 0.40, CY = H * 0.52;
let ca, sa, ce, se;
function updView() { ca = Math.cos(st.az); sa = Math.sin(st.az); ce = Math.cos(st.el); se = Math.sin(st.el); }
updView();
function proj(v) {
  const xr = v[0] * ca - v[1] * sa;
  const yr = v[0] * sa + v[1] * ca;
  return {
    x: CX + R * xr,
    y: CY - R * (v[2] * ce - yr * se),
    d: yr * ce + v[2] * se,                 // +d = toward viewer
  };
}

// Rotate a vector by -wrf*t about z (lab -> rotating frame).
function toFrame(v, t) {
  if (st.frame !== 'rot') return v;
  const a = -wrf() * t, c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}

function arrow(p0, p1, color, lw) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  const an = Math.atan2(p1.y - p0.y, p1.x - p0.x), hl = 11;
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p1.x - hl * Math.cos(an - 0.42), p1.y - hl * Math.sin(an - 0.42));
  ctx.lineTo(p1.x - hl * Math.cos(an + 0.42), p1.y - hl * Math.sin(an + 0.42));
  ctx.closePath(); ctx.fill();
}

function circle3(axis, nrm, phase, segs, near) {
  // Draw the great/small circle of points cos*u + sin*w where u,w span
  // the plane with the given normal; split into back/front by depth.
  const u = axis, w = nrm;
  ctx.lineWidth = 1;
  let prev = null;
  for (let i = 0; i <= segs; i += 1) {
    const a = phase + i / segs * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    const p = proj([u[0] * c + w[0] * s, u[1] * c + w[1] * s, u[2] * c + w[2] * s]);
    if (prev) {
      ctx.strokeStyle = (p.d + prev.d) / 2 > 0
        ? (near ? 'rgba(150,160,180,0.55)' : 'rgba(120,130,150,0.5)')
        : 'rgba(90,98,116,0.18)';
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    prev = p;
  }
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const t = st.t;

  // sphere silhouette
  ctx.strokeStyle = 'rgba(120,130,150,0.45)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, 2 * Math.PI); ctx.stroke();
  // equator + two meridians + two latitudes
  circle3([1, 0, 0], [0, 1, 0], 0, 96, true);                       // equator
  circle3([1, 0, 0], [0, 0, 1], 0, 96, false);                      // x-z meridian
  circle3([0, 1, 0], [0, 0, 1], 0, 96, false);                      // y-z meridian
  for (const lat of [0.6, -0.6]) {
    const r = Math.cos(lat), zz = Math.sin(lat);
    ctx.lineWidth = 1; let prev = null;
    for (let i = 0; i <= 80; i += 1) {
      const a = i / 80 * 2 * Math.PI;
      const p = proj([r * Math.cos(a), r * Math.sin(a), zz]);
      if (prev) { ctx.strokeStyle = (p.d + prev.d) / 2 > 0 ? 'rgba(110,120,140,0.30)' : 'rgba(90,98,116,0.12)'; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
      prev = p;
    }
  }

  // axes and kets
  const O = proj([0, 0, 0]);
  const axCol = 'rgba(150,160,180,0.5)';
  for (const [v, lab, col] of [
    [[0, 0, 1.18], '|0>', 'rgba(120,200,255,0.9)'],
    [[0, 0, -1.18], '|1>', 'rgba(120,200,255,0.9)'],
    [[1.18, 0, 0], '|+>', axCol],
    [[0, 1.18, 0], '|i>', axCol],
  ]) {
    const p = proj(v);
    ctx.strokeStyle = axCol; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(lab, p.x, p.y - 6);
  }

  // predicted orbit: the deterministic future path from the current
  // state under the current parameters, recomputed every frame. Its
  // whole shape changes at once with w0 (winding), w1 (nutation
  // depth) and the detuning (incomplete inversion), and it transforms
  // with the frame selector.
  {
    const pp = predictOrbit();
    ctx.strokeStyle = 'rgba(190,140,255,0.75)'; ctx.lineWidth = 2.4;
    let prev = null;
    for (let i = 0; i < pp.length; i += 1) {
      const p = proj(toFrame([pp[i][1], pp[i][2], pp[i][3]], pp[i][0]));
      if (prev) { ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
      prev = p;
    }
    // ring at the start of the predicted path: it is the current
    // state, so the green spin arrow tip sits exactly here and then
    // travels along this purple curve.
    const p0 = proj(toFrame([pp[0][1], pp[0][2], pp[0][3]], pp[0][0]));
    ctx.strokeStyle = 'rgba(190,140,255,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p0.x, p0.y, 8, 0, 2 * Math.PI); ctx.stroke();
  }

  // trajectory trail
  if (st.trail && st.traj.length > 1) {
    let prev = null;
    for (let i = 0; i < st.traj.length; i += 1) {
      const s = st.traj[i];
      const p = proj(toFrame([s[1], s[2], s[3]], s[0]));
      if (prev) {
        const a = 0.12 + 0.5 * (i / st.traj.length);
        ctx.strokeStyle = `rgba(6,214,160,${a.toFixed(3)})`;
        ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      prev = p;
    }
  }

  // drive axis: lab Omega(t) direction, or the static rotating-frame
  // effective field (w1, 0, delta).
  let drive;
  if (st.frame === 'rot') drive = [st.w1, 0, st.delta];
  else drive = [st.w1 * Math.cos(wrf() * t), st.w1 * Math.sin(wrf() * t), st.w0];
  const dm = Math.hypot(drive[0], drive[1], drive[2]) || 1;
  const du = [drive[0] / dm * 0.95, drive[1] / dm * 0.95, drive[2] / dm * 0.95];
  arrow(O, proj(du), 'rgba(255,209,102,0.85)', 2);

  // Bloch vector
  const Sd = toFrame(st.S, t);
  const tip = proj(Sd);
  arrow(O, tip, '#06d6a0', 3.2);
  ctx.fillStyle = '#0b0c10'; ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(tip.x, tip.y, 5.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

  // legend
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = '#06d6a0'; ctx.fillText('spin S', W - 168, 24);
  ctx.fillStyle = 'rgba(255,209,102,0.95)'; ctx.fillText('drive axis', W - 168, 42);
  ctx.fillStyle = 'rgba(190,140,255,0.95)'; ctx.fillText('predicted S(t)', W - 168, 60);
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.fillText(st.frame === 'rot' ? 'rotating frame' : 'lab frame', W - 168, 78);
  // why the path looks the way it does, and how to look around
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(st.frame === 'rot'
    ? 'the spin tip rides the purple path: a precession cone about the static effective field'
    : 'the spin tip rides the purple path: a Larmor + Rabi spiral (switch to the rotating frame for the cone)',
  W / 2, H - 26);
  ctx.fillText('drag the sphere to rotate the view', W / 2, H - 10);

  // readout
  const ang = blochAngles(st.S);
  rNorm.textContent = norm(st.S).toFixed(6);
  rSz.textContent = (st.S[2] >= 0 ? '+' : '') + st.S[2].toFixed(3);
  rTheta.textContent = (ang.theta * 180 / Math.PI).toFixed(1) + ' deg';
  rReg.textContent = st.w1 < 1e-6 ? 'Larmor'
    : Math.abs(st.delta) < 1e-6 ? 'resonant Rabi' : 'detuned Rabi';
}

// Future path from the current S under the current parameters. A few
// Larmor/Rabi periods, sampled, so the curve always spans a large,
// strongly parameter-dependent region of the sphere.
function predictOrbit() {
  const p = params3();
  const span = 2 * Math.PI / Math.max(0.15, Math.min(p.w0, p.wrf || p.w0));
  const flop = st.w1 > 1e-6 ? Math.PI / st.w1 : span;
  const T = Math.min(60, Math.max(2.5 * span, 2.2 * flop));
  const h = T / 360;
  let S = [st.S[0], st.S[1], st.S[2]], tt = st.t;
  const out = [[tt, S[0], S[1], S[2]]];
  for (let i = 0; i < 360; i += 1) { S = stepBloch(S, tt, h, p); tt += h; out.push([tt, S[0], S[1], S[2]]); }
  return out;
}

const PHYSICS_DT = 1 / 240;
let acc = 0, lastT = (typeof performance !== 'undefined' ? performance.now() : Date.now());
function pushTraj() {
  st.traj.push([st.t, st.S[0], st.S[1], st.S[2]]);
  if (st.traj.length > 900) st.traj.shift();
}
function physics(dt) { st.S = stepBloch(st.S, st.t, dt, params3()); st.t += dt; }

function tick(now) {
  const fdt = Math.min((now - lastT) / 1000, 0.1); lastT = now;
  if (st.running) {
    acc += fdt;
    let k = 0;
    while (acc >= PHYSICS_DT && k < 600) { physics(PHYSICS_DT); if (k % 4 === 0) pushTraj(); acc -= PHYSICS_DT; k += 1; }
  }
  render();
  requestAnimationFrame(tick);
}

// Instantaneous pulse: rotate S by `ang` about the in-phase RF axis
// (cos w_rf t, sin w_rf t, 0) in the lab frame, the axis a real
// resonant pulse drives about. From a pole, pi inverts and pi/2 lands
// on the equator.
function pulse(ang) {
  const a = [Math.cos(wrf() * st.t), Math.sin(wrf() * st.t), 0];
  st.S = rodrigues(st.S, a, ang);
  pushTraj(); render();
}

function syncLabels() { vW0.textContent = st.w0.toFixed(2); vW1.textContent = st.w1.toFixed(2); vD.textContent = st.delta.toFixed(2); }
sW0.addEventListener('input', () => { st.w0 = parseFloat(sW0.value); syncLabels(); });
sW1.addEventListener('input', () => { st.w1 = parseFloat(sW1.value); syncLabels(); });
sD.addEventListener('input', () => { st.delta = parseFloat(sD.value); syncLabels(); });
selF.addEventListener('change', () => { st.frame = selF.value; render(); });
tTrail.addEventListener('change', () => { st.trail = tTrail.checked; render(); });
bPi.addEventListener('click', () => pulse(Math.PI));
bPih.addEventListener('click', () => pulse(Math.PI / 2));
// drag to orbit the 3D view (mouse and touch via pointer events)
canvas.style.touchAction = 'none';
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ } });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const sens = (2 * Math.PI) / canvas.getBoundingClientRect().width;
  st.az -= (e.clientX - drag.x) * sens;
  st.el = Math.max(-1.45, Math.min(1.45, st.el + (e.clientY - drag.y) * sens));
  drag.x = e.clientX; drag.y = e.clientY; updView();
  if (!st.running) render();
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', endDrag);

bR.addEventListener('click', () => { st.S = [0, 0, 1]; st.t = 0; st.traj = []; st.running = true; st.az = -0.62; st.el = 0.46; updView(); bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); render(); });
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

const TOTAL_T = 22;
function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = frac * TOTAL_T;
    const n = Math.round(target / PHYSICS_DT);
    st.S = [0, 0, 1]; st.t = 0; st.traj = [[0, 0, 0, 1]];
    for (let i = 0; i < n; i += 1) { physics(PHYSICS_DT); if (i % 4 === 0) pushTraj(); }
    render();
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'sx', label: 'Bloch $S_x$', value: st.S[0], format: 'float' },
      { key: 'sy', label: 'Bloch $S_y$', value: st.S[1], format: 'float' },
      { key: 'sz', label: 'inversion $S_z$', value: st.S[2], format: 'float' },
    ],
  };
};
// Unitary spin precession is a pure rotation of the Bloch vector, so
// its length is conserved: the state stays on the unit sphere.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    const n = norm(st.S);
    if (!Number.isFinite(n)) return [];
    const dev = Math.abs(n - 1);
    return [{
      key: 'unit-bloch',
      label: 'Bloch vector stays on the unit sphere',
      value: n.toFixed(5),
      status: dev < 1e-3 ? 'pass' : (dev < 1e-2 ? 'pending' : 'drift'),
    }];
  };
}
