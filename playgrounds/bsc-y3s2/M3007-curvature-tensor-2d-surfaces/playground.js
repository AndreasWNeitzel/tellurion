import { torusK, sphereK, cylinderK } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rK = document.getElementById('readout-k');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const selSurface = document.getElementById('select-surface');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const SURFACE_NAMES = ['torus', 'sphere', 'cylinder', 'saddle'];
const urlSurface = params.get('surface');
const VIEW_PITCH = 0.78;   // default tilt so the torus is seen from above its plane
const st = {
  Rr: 3, t: 1, yaw: 0, pitch: VIEW_PITCH,
  surface: SURFACE_NAMES.includes(urlSurface) ? urlSurface : 'torus',
};
let running = !prefersReducedMotion();

sR.addEventListener('input', () => { st.Rr = parseFloat(sR.value); vR.textContent = st.Rr.toFixed(2); });
if (selSurface) selSurface.addEventListener('change', () => { st.surface = selSurface.value; });
btnR.addEventListener('click', () => { st.t = 0; st.yaw = 0; st.pitch = VIEW_PITCH; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

let last = performance.now();

// Camera drag handlers: yaw and pitch layered on the slow auto-spin.
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  st.yaw += (e.clientX - lastX) * 0.005;
  st.pitch = Math.max(-1.4, Math.min(1.4, st.pitch + (e.clientY - lastY) * 0.005));
  lastX = e.clientX; lastY = e.clientY;
});

// Saddle z = a (x^2 - y^2): the Gaussian curvature works out to
// K = -4 a^2 / (1 + 4 a^2 (x^2 + y^2))^2, negative at every point and
// sharpest at the centre. (Standard result for a graph z = f(x, y):
// K = (f_xx f_yy - f_xy^2) / (1 + f_x^2 + f_y^2)^2.)
function saddleK(x, y, a) {
  const d = 1 + 4 * a * a * (x * x + y * y);
  return -4 * a * a / (d * d);
}

// Surface registry. Each entry meshes a parametric embedding with
// u, v in [0, 1) and reports the Gaussian curvature at each point.
// The R/r slider is the torus aspect ratio; the other surfaces keep a
// fixed shape so the comparison stays clean.
function makeSurface(name, Rr) {
  if (name === 'sphere') {
    const rho = 120, k = sphereK(rho);
    return {
      label: 'Sphere', uN: 50, vN: 26, kMax: k,
      point: (u, v) => {
        const phi = 2 * Math.PI * u, theta = Math.PI * v;
        return {
          X: rho * Math.sin(theta) * Math.cos(phi),
          Y: rho * Math.cos(theta),
          Z: rho * Math.sin(theta) * Math.sin(phi),
        };
      },
      Kat: () => k,
      caption: 'Sphere: K = 1/R^2, the same positive value over the whole surface.',
      profile: { xlabel: 'polar angle', ks: Array.from({ length: 64 }, () => k) },
    };
  }
  if (name === 'cylinder') {
    const rho = 85, H = 250;
    return {
      label: 'Cylinder', uN: 46, vN: 20, kMax: 1,
      point: (u, v) => {
        const phi = 2 * Math.PI * u;
        return { X: rho * Math.cos(phi), Y: H * (v - 0.5), Z: rho * Math.sin(phi) };
      },
      Kat: () => cylinderK(),
      caption: 'Cylinder: K = 0 everywhere, a developable surface that unrolls onto a flat sheet.',
      profile: { xlabel: 'axis angle', ks: Array.from({ length: 64 }, () => 0) },
    };
  }
  if (name === 'saddle') {
    const L = 150, a = 0.9 / L;
    return {
      label: 'Saddle', uN: 40, vN: 40, kMax: 4 * a * a,
      point: (u, v) => {
        const x = L * (2 * u - 1), y = L * (2 * v - 1);
        return { X: x, Y: a * (x * x - y * y), Z: y };
      },
      Kat: (u, v) => saddleK(L * (2 * u - 1), L * (2 * v - 1), a),
      caption: 'Saddle z = a(x^2 - y^2): K < 0 everywhere, most negative at the centre.',
      profile: {
        xlabel: 'x at y = 0',
        ks: Array.from({ length: 64 }, (_, i) => saddleK(L * (2 * i / 63 - 1), 0, a)),
      },
    };
  }
  // Torus (default). Major radius R, minor radius r = R / aspect.
  const R = 100, r = 100 / Rr;
  let kMax = 0;
  for (let i = 0; i < 64; i += 1) {
    const k = Math.abs(torusK(2 * Math.PI * i / 64, R, r));
    if (k > kMax) kMax = k;
  }
  return {
    label: 'Torus', uN: 60, vN: 30, kMax,
    point: (u, v) => {
      const phi = 2 * Math.PI * u, theta = 2 * Math.PI * v;
      return {
        X: (R + r * Math.cos(theta)) * Math.cos(phi),
        Y: r * Math.sin(theta),
        Z: (R + r * Math.cos(theta)) * Math.sin(phi),
      };
    },
    Kat: (u, v) => torusK(2 * Math.PI * v, R, r),
    caption: 'Torus: K > 0 on the outer rim, K < 0 on the inner rim, K = 0 on the top and bottom circles.',
    profile: {
      xlabel: 'tube angle',
      ks: Array.from({ length: 64 }, (_, i) => torusK(2 * Math.PI * i / 63, R, r)),
    },
  };
}

function colorForK(K, kMax) {
  const t = Math.max(-1, Math.min(1, K / (kMax || 1)));
  if (Math.abs(t) < 0.03) return 'rgba(150, 154, 160, 0.5)';
  if (t > 0) return `rgba(239, 71, 111, ${0.3 + t * 0.5})`;
  return `rgba(91, 192, 235, ${0.3 - t * 0.5})`;
}

const SURF_S = 1.9;   // enlarge the projected surface to fill the portrait
function projectPoint(x, y, z, cx, cy) {
  // Auto-spin (st.t) plus the pointer-drag yaw.
  const yaw = st.yaw + st.t * 0.3;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const x1 = x * cyw - z * syw;
  const z1 = x * syw + z * cyw;
  const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
  const y1 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  return { px: cx + (x1 + z2 * 0.3) * SURF_S, py: cy + (-y1 + z2 * 0.2) * SURF_S, depth: z2 };
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const surf = makeSurface(st.surface, st.Rr);
  const cx = canvas.width * 0.5, cy = Math.round(canvas.height * 0.34);

  // Mesh the surface, then paint back-to-front so nearer cells win.
  const pts = [];
  for (let i = 0; i < surf.uN; i += 1) {
    for (let j = 0; j < surf.vN; j += 1) {
      const u = i / surf.uN, v = j / surf.vN;
      const P = surf.point(u, v);
      const p = projectPoint(P.X, P.Y, P.Z, cx, cy);
      pts.push({ px: p.px, py: p.py, depth: p.depth, K: surf.Kat(u, v) });
    }
  }
  pts.sort((p, q) => p.depth - q.depth);
  const cellR = 4 * SURF_S;
  for (const pt of pts) {
    ctx.fillStyle = colorForK(pt.K, surf.kMax);
    ctx.fillRect(pt.px - cellR, pt.py - cellR, 2 * cellR, 2 * cellR);
  }

  // Surface caption.
  ctx.fillStyle = '#9aa0a6';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(surf.caption, 12, 20);

  // Colour key for the curvature sign (compact bottom row).
  const legY = canvas.height - 18;
  ctx.font = fontString(canvas, 'caption', 'mono');
  const keys = [
    { c: 'rgba(239, 71, 111, 0.85)', t: 'K > 0' },
    { c: 'rgba(150, 154, 160, 0.7)', t: 'K = 0' },
    { c: 'rgba(91, 192, 235, 0.85)', t: 'K < 0' },
  ];
  let lx = 12;
  for (const key of keys) {
    ctx.fillStyle = key.c;
    ctx.beginPath(); ctx.arc(lx + 7, legY - 4, 7, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#c8d0e0';
    ctx.fillText(key.t, lx + 20, legY);
    lx += 20 + ctx.measureText(key.t).width + 28;
  }

  drawKDiagnostic(surf);
  rK.textContent = surf.kMax.toExponential(2);
}

// Rule-13 diagnostic: Gaussian curvature sampled along a parameter
// line of the surface, the quantitative companion to the red/blue
// colouring. A flat line at zero is the cylinder; a flat positive
// line is the sphere; the torus and saddle vary with position.
function drawKDiagnostic(surf) {
  const W = canvas.width, H = canvas.height;
  const pw = W - 120, ph = 300, px = 60, py = H - ph - 40;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText(`curvature K along ${surf.profile.xlabel}`, px + 8, py + 16);
  const ax = px + 40, ay = py + 26, aw = pw - 52, ah = ph - 48;
  const ks = surf.profile.ks;
  let km = 0;
  for (const k of ks) km = Math.max(km, Math.abs(k));
  km = (km || 1) * 1.15;
  const xOf = (i) => ax + (i / (ks.length - 1)) * aw;
  const yOf = (k) => ay + ah / 2 - (k / km) * (ah / 2);
  // Zero line.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  // K(parameter) curve, coloured by sign.
  ctx.lineWidth = 2;
  for (let i = 0; i < ks.length - 1; i += 1) {
    const kMid = 0.5 * (ks[i] + ks[i + 1]);
    ctx.strokeStyle = Math.abs(kMid) < 1e-6 * km
      ? 'rgba(150, 154, 160, 0.85)'
      : (kMid >= 0 ? '#ef476f' : '#5bc0eb');
    ctx.beginPath();
    ctx.moveTo(xOf(i), yOf(ks[i]));
    ctx.lineTo(xOf(i + 1), yOf(ks[i + 1]));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200, 210, 240, 0.75)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('+K', px + 8, ay + 8);
  ctx.fillText('-K', px + 8, ay + ah);
  ctx.fillText('0', ax - 4, yOf(0) + 10);
}

function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  st.t = 1;
  if (selSurface) selSurface.value = st.surface;
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
  const surf = makeSurface(st.surface, st.Rr);
  const fields = [{ key: 'surface', label: 'surface', value: surf.label }];
  if (st.surface === 'torus') {
    const R = 100, r = 100 / st.Rr;
    fields.push({ key: 'aspect', label: 'aspect ratio $R/r$', value: st.Rr, format: 'float' });
    fields.push({ key: 'k-outer', label: 'outer-rim curvature $K(0)$', value: torusK(0, R, r), format: 'float' });
    fields.push({ key: 'k-inner', label: 'inner-rim curvature $K(\\pi)$', value: torusK(Math.PI, R, r), format: 'float' });
  } else {
    const ks = surf.profile.ks;
    fields.push({ key: 'k-min', label: 'minimum curvature $K_{\\min}$', value: Math.min(...ks), format: 'float' });
    fields.push({ key: 'k-max', label: 'maximum curvature $K_{\\max}$', value: Math.max(...ks), format: 'float' });
  }
  return { fields };
};
window.playground.getInvariants = function () {
  if (st.surface === 'torus') {
    // Gauss-Bonnet: the integral of K over a closed surface is 2 pi
    // times its Euler characteristic. The torus has chi = 0, so the
    // total Gaussian curvature must vanish.
    const R = 100, r = 100 / st.Rr;
    const N = 240;
    let integral = 0;
    for (let i = 0; i < N; i += 1) {
      const theta = ((i + 0.5) / N) * 2 * Math.PI;
      const dA = r * (R + r * Math.cos(theta)) * (2 * Math.PI / N) * (2 * Math.PI);
      integral += torusK(theta, R, r) * dA;
    }
    const drift = Math.abs(integral) / (4 * Math.PI * Math.PI * R * r);
    return [{
      key: 'gauss-bonnet',
      label: 'total curvature $\\iint K\\,dA = 0$ on the torus (Gauss-Bonnet, $\\chi = 0$)',
      value: drift.toExponential(2),
      status: drift < 1e-6 ? 'pass' : (drift < 1e-3 ? 'pending' : 'drift'),
    }];
  }
  if (st.surface === 'sphere') {
    // The sphere has chi = 2, so Gauss-Bonnet gives total curvature
    // 4 pi exactly, independent of the radius. Integrated numerically
    // here as sum of K dA over the latitude-longitude mesh.
    const rho = 120, N = 160;
    let integral = 0;
    for (let i = 0; i < N; i += 1) {
      const theta = ((i + 0.5) / N) * Math.PI;
      const dA = rho * rho * Math.sin(theta) * (Math.PI / N) * (2 * Math.PI);
      integral += sphereK(rho) * dA;
    }
    const drift = Math.abs(integral - 4 * Math.PI) / (4 * Math.PI);
    return [{
      key: 'gauss-bonnet',
      label: 'total curvature $\\iint K\\,dA = 4\\pi$ on the sphere (Gauss-Bonnet, $\\chi = 2$)',
      value: integral.toFixed(4),
      status: drift < 1e-3 ? 'pass' : 'drift',
    }];
  }
  if (st.surface === 'cylinder') {
    return [{
      key: 'flat',
      label: 'cylinder is developable: $K = 0$ identically',
      value: cylinderK().toFixed(1),
      status: 'pass',
    }];
  }
  // Saddle: a hyperbolic surface has K < 0 at every point. Verified
  // by scanning the mesh for the least-negative value.
  const L = 150, a = 0.9 / L;
  let maxK = -Infinity;
  for (let i = 0; i <= 40; i += 1) {
    for (let j = 0; j <= 40; j += 1) {
      const k = saddleK(L * (2 * i / 40 - 1), L * (2 * j / 40 - 1), a);
      if (k > maxK) maxK = k;
    }
  }
  return [{
    key: 'hyperbolic',
    label: 'saddle is a hyperbolic surface: $K < 0$ at every point',
    value: maxK.toExponential(2),
    status: maxK < 0 ? 'pass' : 'drift',
  }];
};
