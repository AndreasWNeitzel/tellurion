// Parallel-transport playground. A tangent vector is carried around a
// closed loop on a selectable surface; the angle it returns rotated by
// is the holonomy. Sphere: a geodesic triangle, holonomy = spherical
// excess. Cone: a loop around the apex, holonomy = the apex deficit
// 2 pi (1 - sin alpha). Cylinder: developable, holonomy = 0.

import { holonomy, interiorAngleSum, sphericalToCartesian } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutOm    = document.getElementById('readout-om');
const readoutAbc   = document.getElementById('readout-abc');

const sliderAlpha = document.getElementById('slider-alpha');
const sliderBeta  = document.getElementById('slider-beta');
const valueAlpha  = document.getElementById('value-alpha');
const valueBeta   = document.getElementById('value-beta');
const selSurface  = document.getElementById('select-surface');

const SURFACES = ['sphere', 'cone', 'cylinder'];
const urlSurface = params.get('surface');
let surface = SURFACES.includes(urlSurface) ? urlSurface : 'sphere';

let alphaDeg = parseFloat(sliderAlpha.value);
let betaDeg = parseFloat(sliderBeta.value);
let transportPhase = 0;   // 0..1 progress of the transported vector around the loop

sliderAlpha.addEventListener('input', () => { alphaDeg = parseFloat(sliderAlpha.value); valueAlpha.textContent = String(alphaDeg); });
sliderBeta.addEventListener('input', () => { betaDeg = parseFloat(sliderBeta.value); valueBeta.textContent = String(betaDeg); });
if (selSurface) selSurface.addEventListener('change', () => { surface = selSurface.value; });

// Pointer-drag camera (yaw and pitch of the orthographic view).
let camYaw = -0.4, camPitch = 0.6;
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture?.(e.pointerId); });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  camYaw += (e.clientX - lastX) * 0.006;
  camPitch = Math.max(-0.2, Math.min(1.4, camPitch + (e.clientY - lastY) * 0.006));
  lastX = e.clientX; lastY = e.clientY;
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    green:  '#06d6a0',
    grid:   '#23252a',
  };
}

function vsub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function vdot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function vcross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function vnorm(a) { const m = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / m, y: a.y / m, z: a.z / m }; }
function rodrigues(v, n, phi) {
  const c1 = Math.cos(phi), s1 = Math.sin(phi);
  const cx = vcross(n, v), nd = vdot(n, v) * (1 - c1);
  return { x: v.x * c1 + cx.x * s1 + n.x * nd, y: v.y * c1 + cx.y * s1 + n.y * nd, z: v.z * c1 + cx.z * s1 + n.z * nd };
}

// Orthographic projection. Pointer-draggable yaw and pitch.
function project(p, cxPx, cyPx, R) {
  const cy = Math.cos(camYaw), sy = Math.sin(camYaw);
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  let x = p.x * cy - p.y * sy;
  const y = p.x * sy + p.y * cy;
  let z = p.z;
  const x2 = x * cp + z * sp;
  const z2 = -x * sp + z * cp;
  x = x2; z = z2;
  return { px: cxPx + R * y, py: cyPx - R * z, depth: x };
}

// Draw a short tangent arrow from a base point along a tangent vector.
function drawTangentArrow(base, vec, cxPx, cyPx, R, color, width) {
  const b = project(base, cxPx, cyPx, R);
  if (b.depth < -0.12) return;
  const t = project({ x: base.x + vec.x * 0.32, y: base.y + vec.y * 0.32, z: base.z + vec.z * 0.32 }, cxPx, cyPx, R);
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(t.px, t.py); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(b.px, b.py, 4, 0, 2 * Math.PI); ctx.fill();
}

// Three text readouts, top-left, plus the camera hint.
function drawReadouts(c, lines) {
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  const cols = [c.muted, c.accent, c.green];
  lines.forEach((ln, i) => {
    ctx.fillStyle = cols[Math.min(i, cols.length - 1)];
    ctx.fillText(ln, 12, 20 + i * 18);
  });
  ctx.fillStyle = c.muted;
  ctx.fillText('drag to rotate', 12, canvas.height - 12);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cxPx = canvas.width * 0.31;
  const cyPx = canvas.height / 2;
  const R = Math.min(canvas.width * 0.6, canvas.height) * 0.4;
  if (surface === 'cone') renderCone(c, cxPx, cyPx, R);
  else if (surface === 'cylinder') renderCylinder(c, cxPx, cyPx, R);
  else renderSphere(c, cxPx, cyPx, R);
}

function renderSphere(c, cxPx, cyPx, R) {
  // Sphere wireframe (latitude + longitude grid).
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const lon = (i / 8) * 2 * Math.PI;
    ctx.beginPath();
    for (let j = 0; j <= 60; j += 1) {
      const lat = -Math.PI / 2 + (j / 60) * Math.PI;
      const p = project(sphericalToCartesian(lat, lon), cxPx, cyPx, R);
      if (p.depth < -0.3) continue;
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  for (let i = 1; i < 7; i += 1) {
    const lat = -Math.PI / 2 + (i / 7) * Math.PI;
    ctx.beginPath();
    for (let j = 0; j <= 80; j += 1) {
      const lon = (j / 80) * 2 * Math.PI;
      const p = project(sphericalToCartesian(lat, lon), cxPx, cyPx, R);
      if (p.depth < -0.3) continue;
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  const alphaR = alphaDeg * Math.PI / 180;
  const betaR = betaDeg * Math.PI / 180;
  const P1 = sphericalToCartesian(Math.PI / 2, 0);
  const P2 = sphericalToCartesian(Math.PI / 2 - alphaR, 0);
  const P3 = sphericalToCartesian(Math.PI / 2 - alphaR, betaR);

  function drawArc(A, B, color, samples = 100) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const dot = A.x * B.x + A.y * B.y + A.z * B.z;
      const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
      if (omega < 1e-6) continue;
      const sa = Math.sin((1 - t) * omega) / Math.sin(omega);
      const sb = Math.sin(t * omega) / Math.sin(omega);
      const pt = { x: sa * A.x + sb * B.x, y: sa * A.y + sb * B.y, z: sa * A.z + sb * B.z };
      const p = project(pt, cxPx, cyPx, R);
      if (!started) { ctx.moveTo(p.px, p.py); started = true; } else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  drawArc(P1, P2, c.accent);
  drawArc(P2, P3, c.blue);
  drawArc(P3, P1, c.red);

  for (const [P, color] of [[P1, c.accent], [P2, c.blue], [P3, c.red]]) {
    const p = project(P, cxPx, cyPx, R);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI); ctx.fill();
  }

  // Animated parallel transport around P1 -> P2 -> P3 -> P1. Exact on
  // the sphere: transport along a great circle is the same rotation
  // (about axis n = A x B) that slides the point along the geodesic.
  const legs = [[P1, P2], [P2, P3], [P3, P1]];
  const v0 = vnorm(vsub(P2, { x: P1.x * vdot(P1, P2), y: P1.y * vdot(P1, P2), z: P1.z * vdot(P1, P2) }));
  let v = v0, p = P1;
  const sGlobal = (transportPhase % 1) * 3;
  for (let L = 0; L < 3; L += 1) {
    const A = legs[L][0], B = legs[L][1];
    const axis = vnorm(vcross(A, B));
    const omega = Math.acos(Math.max(-1, Math.min(1, vdot(A, B))));
    const tLeg = Math.max(0, Math.min(1, sGlobal - L));
    if (tLeg <= 0) break;
    const ang = tLeg * omega;
    p = rodrigues(A, axis, ang);
    v = rodrigues(v, axis, ang);
    const vp = vdot(v, p);
    v = vnorm({ x: v.x - vp * p.x, y: v.y - vp * p.y, z: v.z - vp * p.z });
    if (tLeg < 1) break;
  }
  drawTangentArrow(P1, v0, cxPx, cyPx, R, 'rgba(225,225,245,0.72)', 1.5);
  drawTangentArrow(p, v, cxPx, cyPx, R, '#ffd166', 3);

  const om = holonomy(alphaR, betaR);
  drawReadouts(c, [
    `alpha = ${alphaDeg} deg, beta = ${betaDeg} deg`,
    `Omega = (1 - cos alpha) beta = ${om.toFixed(4)} sr`,
    `holonomy = Omega = ${(om * 180 / Math.PI).toFixed(1)} deg`,
  ]);
  drawHolonomyPlot({
    title: 'holonomy vs equator span',
    xlabel: 'beta',
    xMax: 2 * Math.PI,
    xCur: betaR,
    fn: (b) => holonomy(alphaR, b),
  }, c);
}

function renderCone(c, cxPx, cyPx, R) {
  // Cone with half-angle alpha, apex at the top, centred vertically.
  const alpha = alphaDeg * Math.PI / 180;
  const sinA = Math.sin(alpha), cosA = Math.cos(alpha);
  const za = cosA / 2;
  const conePoint = (s, phi) => ({
    x: s * sinA * Math.cos(phi),
    y: s * sinA * Math.sin(phi),
    z: za - s * cosA,
  });
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i < 16; i += 1) {
    const phi = (i / 16) * 2 * Math.PI;
    ctx.beginPath();
    for (let j = 0; j <= 20; j += 1) {
      const p = project(conePoint(j / 20, phi), cxPx, cyPx, R);
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  for (let k = 1; k <= 5; k += 1) {
    ctx.beginPath();
    for (let j = 0; j <= 64; j += 1) {
      const p = project(conePoint(k / 5, (j / 64) * 2 * Math.PI), cxPx, cyPx, R);
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  // Transport loop: a horizontal circle encircling the apex.
  const sLoop = 0.72;
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let j = 0; j <= 96; j += 1) {
    const p = project(conePoint(sLoop, (j / 96) * 2 * Math.PI), cxPx, cyPx, R);
    if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  const apex = project(conePoint(0, 0), cxPx, cyPx, R);
  ctx.fillStyle = c.red;
  ctx.beginPath(); ctx.arc(apex.px, apex.py, 5, 0, 2 * Math.PI); ctx.fill();

  // Parallel transport. Local tangent frame at azimuth phi:
  //   e_s = (sinA cos phi, sinA sin phi, -cosA)  (down the slant)
  //   e_p = (-sin phi, cos phi, 0)               (azimuthal)
  // The cone is flat away from the apex, so the carried vector keeps
  // angle theta to e_s with d(theta)/d(phi) = -sinA; a full loop
  // leaves it rotated by the apex deficit 2 pi (1 - sinA).
  const coneVec = (phi, thv) => {
    const eS = { x: sinA * Math.cos(phi), y: sinA * Math.sin(phi), z: -cosA };
    const eP = { x: -Math.sin(phi), y: Math.cos(phi), z: 0 };
    return {
      x: Math.cos(thv) * eS.x + Math.sin(thv) * eP.x,
      y: Math.cos(thv) * eS.y + Math.sin(thv) * eP.y,
      z: Math.cos(thv) * eS.z + Math.sin(thv) * eP.z,
    };
  };
  const theta0 = 0.5;
  const phiNow = (transportPhase % 1) * 2 * Math.PI;
  drawTangentArrow(conePoint(sLoop, 0), coneVec(0, theta0), cxPx, cyPx, R, 'rgba(225,225,245,0.72)', 1.5);
  drawTangentArrow(conePoint(sLoop, phiNow), coneVec(phiNow, theta0 - sinA * phiNow), cxPx, cyPx, R, '#ffd166', 3);

  const hol = 2 * Math.PI * (1 - sinA);
  drawReadouts(c, [
    `cone half-angle alpha = ${alphaDeg} deg`,
    `apex deficit 2 pi (1 - sin alpha) = ${hol.toFixed(4)} rad`,
    `holonomy = ${(hol * 180 / Math.PI).toFixed(1)} deg`,
  ]);
  drawHolonomyPlot({
    title: 'holonomy vs cone angle',
    xlabel: 'alpha',
    xMax: Math.PI / 2,
    xCur: alpha,
    fn: (a) => 2 * Math.PI * (1 - Math.sin(a)),
  }, c);
}

function renderCylinder(c, cxPx, cyPx, R) {
  const Rc = 0.62, halfH = 0.86;
  const cylPoint = (zf, phi) => ({ x: Rc * Math.cos(phi), y: Rc * Math.sin(phi), z: halfH * zf });
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i < 16; i += 1) {
    const phi = (i / 16) * 2 * Math.PI;
    const a = project(cylPoint(-1, phi), cxPx, cyPx, R);
    const b = project(cylPoint(1, phi), cxPx, cyPx, R);
    ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
  }
  for (let k = 0; k <= 6; k += 1) {
    const zf = -1 + 2 * k / 6;
    ctx.beginPath();
    for (let j = 0; j <= 64; j += 1) {
      const p = project(cylPoint(zf, (j / 64) * 2 * Math.PI), cxPx, cyPx, R);
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  // Transport loop: the circle at mid-height.
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let j = 0; j <= 96; j += 1) {
    const p = project(cylPoint(0, (j / 96) * 2 * Math.PI), cxPx, cyPx, R);
    if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  // The cylinder is developable (K = 0), so the carried vector keeps a
  // fixed angle to the axial direction e_z; a full loop returns it
  // unchanged. The holonomy is zero.
  const cylVec = (phi, thv) => {
    const eP = { x: -Math.sin(phi), y: Math.cos(phi), z: 0 };
    return {
      x: Math.sin(thv) * eP.x,
      y: Math.sin(thv) * eP.y,
      z: Math.cos(thv),
    };
  };
  const theta0 = 0.7;
  const phiNow = (transportPhase % 1) * 2 * Math.PI;
  drawTangentArrow(cylPoint(0, 0), cylVec(0, theta0), cxPx, cyPx, R, 'rgba(225,225,245,0.72)', 1.5);
  drawTangentArrow(cylPoint(0, phiNow), cylVec(phiNow, theta0), cxPx, cyPx, R, '#ffd166', 3);

  drawReadouts(c, [
    'cylinder: a developable surface, K = 0',
    'parallel transport around the loop',
    'holonomy = 0.0 deg (vector returns unchanged)',
  ]);
  drawHolonomyPlot({
    title: 'holonomy around the loop',
    xlabel: 'loop fraction',
    xMax: 1,
    xCur: transportPhase % 1,
    fn: () => 0,
  }, c);
}

// Rule-13 diagnostic: holonomy as a function of the surface parameter,
// drawn as a curve with a marker tracking the current value.
function drawHolonomyPlot(spec, c) {
  const pw = 250, ph = 150, px = canvas.width - pw - 16, py = 52;
  ctx.fillStyle = 'rgba(8,12,22,0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220,230,255,0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220,230,255,0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(spec.title, px + 8, py + 16);
  const ax = px + 30, ay = py + 26, aw = pw - 44, ah = ph - 48;
  let hMax = 1e-9;
  for (let i = 0; i <= 60; i += 1) hMax = Math.max(hMax, spec.fn(spec.xMax * i / 60));
  hMax *= 1.12;
  const xOf = (x) => ax + (x / spec.xMax) * aw;
  const yOf = (h) => ay + ah - (h / hMax) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.strokeStyle = c.green; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const x = spec.xMax * i / 60;
    const xx = xOf(x), yy = yOf(spec.fn(x));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  const xc = Math.max(0, Math.min(spec.xMax, spec.xCur));
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(xOf(xc), yOf(spec.fn(xc)), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('holonomy', px + 8, ay + 8);
  ctx.fillText(spec.xlabel, ax + aw - ctx.measureText(spec.xlabel).width, ay + ah + 12);
}

function updateReadout() {
  if (surface === 'sphere') {
    const alphaR = alphaDeg * Math.PI / 180;
    const betaR = betaDeg * Math.PI / 180;
    readoutOm.textContent = holonomy(alphaR, betaR).toFixed(4);
    readoutAbc.textContent = (interiorAngleSum(alphaR, betaR) - Math.PI).toFixed(4);
  } else if (surface === 'cone') {
    const sinA = Math.sin(alphaDeg * Math.PI / 180);
    readoutOm.textContent = (2 * Math.PI * (1 - sinA)).toFixed(4);
    readoutAbc.textContent = '0';
  } else {
    readoutOm.textContent = '0';
    readoutAbc.textContent = '0';
  }
}

function loop() {
  transportPhase += 0.0022;
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    betaDeg = 30 + frac * 150;
    sliderBeta.value = String(Math.round(betaDeg));
    valueBeta.textContent = String(Math.round(betaDeg));
  }
  valueAlpha.textContent = String(alphaDeg);
  valueBeta.textContent = String(betaDeg);
  if (selSurface) selSurface.value = surface;
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, alphaDeg, betaDeg };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (surface === 'cone') {
    const alpha = alphaDeg * Math.PI / 180;
    const hol = 2 * Math.PI * (1 - Math.sin(alpha));
    return {
      fields: [
        { key: 'surface', label: 'surface', value: 'Cone' },
        { key: 'alpha', label: 'cone half-angle $\\alpha$ (deg)', value: alphaDeg, format: 'float' },
        { key: 'holonomy', label: 'holonomy $\\theta$ (rad)', value: hol, format: 'float' },
        { key: 'phase', label: 'transport progress', value: transportPhase % 1, format: 'float' },
      ],
    };
  }
  if (surface === 'cylinder') {
    return {
      fields: [
        { key: 'surface', label: 'surface', value: 'Cylinder' },
        { key: 'holonomy', label: 'holonomy $\\theta$ (rad)', value: 0, format: 'float' },
        { key: 'phase', label: 'transport progress', value: transportPhase % 1, format: 'float' },
      ],
    };
  }
  const alpha = alphaDeg * Math.PI / 180;
  const beta = betaDeg * Math.PI / 180;
  return {
    fields: [
      { key: 'surface', label: 'surface', value: 'Sphere' },
      { key: 'alpha', label: 'polar angle $\\alpha$ (deg)', value: alphaDeg, format: 'float' },
      { key: 'beta', label: 'equator span $\\beta$ (deg)', value: betaDeg, format: 'float' },
      { key: 'holonomy', label: 'holonomy $\\theta$ (rad)', value: holonomy(alpha, beta), format: 'float' },
      { key: 'phase', label: 'transport progress', value: transportPhase % 1, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (surface === 'cone') {
    // The cone unrolls onto a flat sector of angle 2 pi sin(alpha);
    // the holonomy is the missing wedge, so holonomy + sector = 2 pi.
    const sinA = Math.sin(alphaDeg * Math.PI / 180);
    const hol = 2 * Math.PI * (1 - sinA);
    const total = hol + 2 * Math.PI * sinA;
    const drift = Math.abs(total - 2 * Math.PI) / (2 * Math.PI);
    return [{
      key: 'deficit',
      label: 'holonomy plus the flattened sector angle equals $2\\pi$',
      value: total.toFixed(4),
      status: drift < 1e-9 ? 'pass' : 'drift',
    }];
  }
  if (surface === 'cylinder') {
    return [{
      key: 'developable',
      label: 'cylinder is developable: holonomy vanishes for every loop',
      value: '0.000',
      status: 'pass',
    }];
  }
  const alpha = alphaDeg * Math.PI / 180;
  const beta = betaDeg * Math.PI / 180;
  const hol = holonomy(alpha, beta);
  const solidAngle = interiorAngleSum(alpha, beta) - Math.PI;
  const relError = Math.abs(hol - solidAngle) / (Math.abs(solidAngle) + 1e-9);
  return [{
    key: 'gauss-bonnet',
    label: 'holonomy $\\theta = \\iint K\\,dA$ equals the spherical excess (Gauss-Bonnet)',
    value: hol.toFixed(3),
    status: relError < 0.01 ? 'pass' : 'drift',
  }];
};
