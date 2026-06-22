// Geodesic-deviation playground. Two nearby geodesics are launched on
// a selectable surface and their separation xi is tracked. The Jacobi
// equation xi'' = -K xi sets the behaviour: on the sphere (K > 0) the
// geodesics converge, on a flat plane (K = 0) they stay parallel, on a
// saddle (K < 0) they diverge.

import { greatCircle, angularSeparation } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const selSurface = document.getElementById('select-surface');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const SURFACES = ['sphere', 'plane', 'saddle'];
const urlSurface = params.get('surface');
let st = {
  dphi: 0.3,
  t: 0,
  surface: SURFACES.includes(urlSurface) ? urlSurface : 'sphere',
};
let running = !prefersReducedMotion();
let lastSep = 0, lastInit = 0, lastProg = 0;

sD.addEventListener('input', () => { st.dphi = parseFloat(sD.value); vD.textContent = st.dphi.toFixed(2); });
if (selSurface) selSurface.addEventListener('change', () => { st.surface = selSurface.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

let last = performance.now();
let yaw = 0, pitch = 0.32;
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture?.(e.pointerId); });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  yaw += (e.clientX - lastX) * 0.006;
  pitch = Math.max(-1.3, Math.min(1.3, pitch + (e.clientY - lastY) * 0.006));
  lastX = e.clientX; lastY = e.clientY;
});

let centerX = canvas.width * 0.5;
const SURF_SCALE = 290;
const SURF_CY = () => canvas.height * 0.37;
function project(x, y, z) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y1 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  return { px: centerX + x1 * SURF_SCALE + z2 * 82, py: SURF_CY() - y1 * SURF_SCALE + z2 * 82, depth: z2 };
}

// Saddle z = a u v: a hyperbolic paraboloid. The lines u = const are
// straight, hence geodesics, and the curvature K = -a^2 / (...)^2 is
// negative everywhere.
const SADDLE_A = 0.9;
function saddlePoint(u, v) { return { x: u, y: SADDLE_A * u * v, z: v }; }
function saddleSep(d, v) { return 2 * d * Math.hypot(1, SADDLE_A * v); }

function moveLine(a, b) { const A = project(a.x, a.y, a.z), B = project(b.x, b.y, b.z); ctx.moveTo(A.px, A.py); ctx.lineTo(B.px, B.py); }

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (st.surface === 'plane') renderPlane();
  else if (st.surface === 'saddle') renderSaddle();
  else renderSphere();
}

function renderSphere() {
  const cx = centerX, cy = SURF_CY();
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, SURF_SCALE, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const phi = 2 * Math.PI * i / 60;
    const p = project(Math.cos(phi), 0, Math.sin(phi));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  // latitude/longitude graticule for a fuller globe.
  ctx.strokeStyle = 'rgba(120,150,200,0.16)'; ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const cl = Math.cos(lat * Math.PI / 180), sl = Math.sin(lat * Math.PI / 180);
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) { const ph = 2 * Math.PI * i / 60; const p = project(cl * Math.cos(ph), sl, cl * Math.sin(ph)); i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py); }
    ctx.stroke();
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const co = Math.cos(lon * Math.PI / 180), so = Math.sin(lon * Math.PI / 180);
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) { const th = -Math.PI / 2 + Math.PI * i / 60; const p = project(Math.cos(th) * co, Math.sin(th), Math.cos(th) * so); i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py); }
    ctx.stroke();
  }
  const prog = Math.min(1, st.t / 3);
  const colors = ['#ffd166', '#ef476f'];
  [0, st.dphi].forEach((phi0, k) => {
    ctx.strokeStyle = colors[k]; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const tt = (i / 100) * (Math.PI / 2) * prog;
      const g = greatCircle(tt, Math.PI / 2, phi0, Math.PI / 2);
      const p = project(g.x, g.z, g.y);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  });
  const tt = prog * (Math.PI / 2);
  [0, st.dphi].forEach((phi0, k) => {
    const g = greatCircle(tt, Math.PI / 2, phi0, Math.PI / 2);
    const p = project(g.x, g.z, g.y);
    ctx.fillStyle = colors[k]; ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI); ctx.fill();
  });
  // deviation-vector ladder: connect the two geodesics at intervals so the
  // shrinking separation (the geodesic-deviation vector) is visible directly.
  ctx.strokeStyle = 'rgba(225,228,248,0.55)'; ctx.lineWidth = 1.3;
  for (let r = 1; r <= 9; r += 1) {
    const trr = (r / 9) * tt;
    const ga = greatCircle(trr, Math.PI / 2, 0, Math.PI / 2);
    const gb = greatCircle(trr, Math.PI / 2, st.dphi, Math.PI / 2);
    const pa = project(ga.x, ga.z, ga.y), pb = project(gb.x, gb.z, gb.y);
    ctx.beginPath(); ctx.moveTo(pa.px, pa.py); ctx.lineTo(pb.px, pb.py); ctx.stroke();
  }
  const sep = angularSeparation(
    greatCircle(tt, Math.PI / 2, 0, Math.PI / 2),
    greatCircle(tt, Math.PI / 2, st.dphi, Math.PI / 2),
  );
  lastSep = sep; lastInit = st.dphi; lastProg = prog;
  drawReadouts('Sphere, K > 0: geodesics converge', sep, st.dphi);
  drawDeviationPlot({
    title: 'separation xi vs arc length',
    xlabel: 'arc length',
    sMax: Math.PI / 2,
    sCur: tt,
    fn: (s) => angularSeparation(
      greatCircle(s, Math.PI / 2, 0, Math.PI / 2),
      greatCircle(s, Math.PI / 2, st.dphi, Math.PI / 2),
    ),
  });
  rD.textContent = sep.toFixed(3);
}

function renderPlane() {
  const prog = Math.min(1, st.t / 3);
  // Flat plane grid in y = 0.
  ctx.strokeStyle = '#23252a'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -5; i <= 5; i += 1) {
    moveLine({ x: -1, y: 0, z: i / 5 }, { x: 1, y: 0, z: i / 5 });
    moveLine({ x: i / 5, y: 0, z: -1 }, { x: i / 5, y: 0, z: 1 });
  }
  ctx.stroke();
  // Two parallel straight geodesics at z = +/- d, advancing in x.
  const d = st.dphi;
  const colors = ['#ffd166', '#ef476f'];
  const x1 = -1 + 2 * prog;
  [d, -d].forEach((z0, k) => {
    ctx.strokeStyle = colors[k]; ctx.lineWidth = 2.5;
    ctx.beginPath(); moveLine({ x: -1, y: 0, z: z0 }, { x: x1, y: 0, z: z0 }); ctx.stroke();
    const p = project(x1, 0, z0);
    ctx.fillStyle = colors[k];
    ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI); ctx.fill();
  });
  // The separation rung between the two markers.
  ctx.strokeStyle = 'rgba(225,225,245,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); moveLine({ x: x1, y: 0, z: d }, { x: x1, y: 0, z: -d }); ctx.stroke();
  const sep = 2 * d;
  lastSep = sep; lastInit = sep; lastProg = prog;
  drawReadouts('Plane, K = 0: geodesics stay parallel', sep, sep);
  drawDeviationPlot({
    title: 'separation xi vs arc length',
    xlabel: 'arc length',
    sMax: 2,
    sCur: 2 * prog,
    fn: () => sep,
  });
  rD.textContent = sep.toFixed(3);
}

function renderSaddle() {
  const prog = Math.min(1, st.t / 3);
  // Saddle wireframe (straight ruling lines in both directions).
  ctx.strokeStyle = '#23252a'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -5; i <= 5; i += 1) {
    moveLine(saddlePoint(i / 5, -1), saddlePoint(i / 5, 1));
    moveLine(saddlePoint(-1, i / 5), saddlePoint(1, i / 5));
  }
  ctx.stroke();
  // Two straight ruling-line geodesics at u = +/- d, growing in v.
  const d = st.dphi;
  const colors = ['#ffd166', '#ef476f'];
  const vEnd = prog;
  [d, -d].forEach((u0, k) => {
    ctx.strokeStyle = colors[k]; ctx.lineWidth = 2.5;
    ctx.beginPath(); moveLine(saddlePoint(u0, 0), saddlePoint(u0, vEnd)); ctx.stroke();
    const p = project(saddlePoint(u0, vEnd).x, saddlePoint(u0, vEnd).y, saddlePoint(u0, vEnd).z);
    ctx.fillStyle = colors[k];
    ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.strokeStyle = 'rgba(225,225,245,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); moveLine(saddlePoint(d, vEnd), saddlePoint(-d, vEnd)); ctx.stroke();
  const sep = saddleSep(d, vEnd);
  lastSep = sep; lastInit = 2 * d; lastProg = prog;
  drawReadouts('Saddle, K < 0: geodesics diverge', sep, 2 * d);
  drawDeviationPlot({
    title: 'separation xi vs arc length',
    xlabel: 'arc length',
    sMax: 1,
    sCur: vEnd,
    fn: (v) => saddleSep(d, v),
  });
  rD.textContent = sep.toFixed(3);
}

function drawReadouts(headline, sep, init) {
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText(headline, 12, 20);
  ctx.fillStyle = '#06d6a0';
  ctx.fillText(`separation xi = ${sep.toFixed(3)}   (initial ${init.toFixed(3)})`, 12, 40);
  ctx.fillStyle = 'rgba(150,160,175,0.7)';
  ctx.textAlign = 'right';
  ctx.fillText('drag to rotate', canvas.width - 12, 20);
  ctx.textAlign = 'left';
}

// Rule-13 diagnostic: the geodesic separation xi as a function of arc
// length. Sinusoidal (converging) on the sphere, flat on the plane,
// growing on the saddle, exactly as the Jacobi equation predicts.
function drawDeviationPlot(spec) {
  const px = 40, pw = canvas.width - 80, py = Math.round(canvas.height * 0.66), ph = Math.round(canvas.height * 0.30);
  ctx.fillStyle = 'rgba(8,12,22,0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220,230,255,0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220,230,255,0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(spec.title, px + 8, py + 16);
  const ax = px + 30, ay = py + 26, aw = pw - 44, ah = ph - 48;
  let xiMax = 1e-9;
  for (let i = 0; i <= 60; i += 1) xiMax = Math.max(xiMax, spec.fn(spec.sMax * i / 60));
  xiMax *= 1.12;
  const xOf = (s) => ax + (s / spec.sMax) * aw;
  const yOf = (xi) => ay + ah - (xi / xiMax) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const s = spec.sMax * i / 60;
    const xx = xOf(s), yy = yOf(spec.fn(s));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  const sc = Math.max(0, Math.min(spec.sMax, spec.sCur));
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(xOf(sc), yOf(spec.fn(sc)), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('ξ', px + 8, ay + 8);
  ctx.fillText(spec.xlabel, ax + aw - ctx.measureText(spec.xlabel).width, ay + ah + 12);
}

function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (running) st.t += dt * 1.2;
  if (st.t > 3) st.t = 0;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (selSurface) selSurface.value = st.surface;
  st.t = 1.5;
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
window.playground = window.playground || {};
window.playground.getState = function () {
  const label = st.surface === 'plane' ? 'Plane' : (st.surface === 'saddle' ? 'Saddle' : 'Sphere');
  return {
    fields: [
      { key: 'surface', label: 'surface', value: label },
      { key: 'initial-separation', label: 'initial separation $\\xi_0$', value: lastInit, format: 'float' },
      { key: 'separation', label: 'geodesic separation $\\xi$', value: lastSep, format: 'float' },
      { key: 'progress', label: 'arc length travelled', value: lastProg, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (st.surface === 'plane') {
    // On a flat surface the Jacobi equation is xi'' = 0; geodesics
    // launched parallel keep a constant separation.
    const drift = Math.abs(lastSep - lastInit) / (lastInit + 1e-9);
    return [{
      key: 'parallel',
      label: 'flat surface ($K = 0$): separation $\\xi$ stays constant',
      value: lastSep.toFixed(3),
      status: drift < 1e-6 ? 'pass' : 'drift',
    }];
  }
  if (st.surface === 'saddle') {
    // On a hyperbolic surface K < 0, so xi'' = -K xi > 0 and the
    // separation grows; it never falls below its initial value.
    return [{
      key: 'diverge',
      label: 'hyperbolic surface ($K < 0$): separation $\\xi$ grows, never refocuses',
      value: (lastSep / (lastInit + 1e-9)).toFixed(3),
      status: lastSep >= lastInit - 1e-6 ? 'pass' : 'drift',
    }];
  }
  // Sphere: two geodesics dphi apart at the equator refocus at the pole.
  const sepAtPole = angularSeparation(
    greatCircle(Math.PI / 2, Math.PI / 2, 0, Math.PI / 2),
    greatCircle(Math.PI / 2, Math.PI / 2, st.dphi, Math.PI / 2),
  );
  return [{
    key: 'jacobi',
    label: 'Jacobi equation $\\ddot{\\xi} + \\xi = 0$: parallel geodesics refocus at the pole',
    value: sepAtPole.toExponential(2),
    status: sepAtPole < 1e-3 ? 'pass' : (sepAtPole < 1e-1 ? 'pending' : 'drift'),
  }];
};
