// Pulsar lighthouse playground. Canvas2D rendering of a rotating
// neutron star with spin axis, magnetic dipole, two emission cones,
// the line of sight, and a live pulse profile.
//
// Layout: left panel is the 3D scene; right panel is the I(phi) plot.

import {
  magneticPoleVector, losVector, pulseIntensity, pulseProfile,
  visibilityRegime, DEFAULT_OBLIQUITY, DEFAULT_INCLINATION, DEFAULT_RHO, DEFAULT_PERIOD,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rP = document.getElementById('readout-P');
const rAlpha = document.getElementById('readout-alpha');
const rIncl = document.getElementById('readout-incl');
const rRho = document.getElementById('readout-rho');
const rRegime = document.getElementById('readout-regime');

const sAlpha = document.getElementById('slider-alpha'), vAlpha = document.getElementById('value-alpha');
const sIncl = document.getElementById('slider-incl'), vIncl = document.getElementById('value-incl');
const sRho = document.getElementById('slider-rho'), vRho = document.getElementById('value-rho');
const sPeriod = document.getElementById('slider-period'), vPeriod = document.getElementById('value-period');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const DEG = Math.PI / 180;
const st = {
  alpha: DEFAULT_OBLIQUITY,
  incl: DEFAULT_INCLINATION,
  rho: DEFAULT_RHO,
  period: DEFAULT_PERIOD,
  running: !prefersReducedMotion(),
  phase: 0,
  pulseHistory: [],
};

// Camera: orbit a point at origin; use a small fixed view to give 3D
// impression. We'll rotate the scene with a fixed perspective.
const VIEW = {
  pitchDeg: -22,   // tilt toward the camera
  yawDeg: 18,
  fov: 1.7,
  zoom: 1.4,
};

function project(x, y, z, center, scale) {
  // First rotate the scene about world y (yaw), then about world x (pitch).
  const yaw = VIEW.yawDeg * DEG;
  const pitch = VIEW.pitchDeg * DEG;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  let X = cy * x + sy * z;
  let Z = -sy * x + cy * z;
  let Y = cp * y - sp * Z;
  Z = sp * y + cp * Z;
  // simple weak-perspective: scale by (1 + 0.2 Z)
  const k = 1 / (1 + Z / 6);
  return { x: center.x + X * scale * k * VIEW.zoom, y: center.y - Y * scale * k * VIEW.zoom, z: Z };
}

function drawScene() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  const sceneRect = { x: 0, y: 0, w: 0.6 * W, h: H };
  const center = { x: sceneRect.x + sceneRect.w / 2, y: sceneRect.y + sceneRect.h / 2 };
  const scale = 0.30 * sceneRect.h;

  // Starfield (light, sparse)
  for (let i = 0; i < 80; i++) {
    const ix = (i * 23.7) % sceneRect.w;
    const iy = (i * 31.1) % sceneRect.h;
    ctx.fillStyle = `rgba(190, 200, 255, ${0.15 + 0.4 * ((i * 7) % 17) / 17})`;
    ctx.fillRect(sceneRect.x + ix, sceneRect.y + iy, 1, 1);
  }

  // Spin axis (white, vertical).
  drawSegment3D({ x: 0, y: -1.4, z: 0 }, { x: 0, y: 1.4, z: 0 }, center, scale, 'rgba(240, 240, 250, 0.55)', 1.4);

  // Magnetic dipole (cyan), tilted by alpha, rotated by phase.
  const poleN = magneticPoleVector(st.alpha, st.phase);
  const poleS = { x: -poleN.x, y: -poleN.y, z: -poleN.z };
  drawSegment3D({ x: 1.4 * poleS.x, y: 1.4 * poleS.y, z: 1.4 * poleS.z }, { x: 1.4 * poleN.x, y: 1.4 * poleN.y, z: 1.4 * poleN.z }, center, scale, 'rgba(120, 220, 255, 0.85)', 2.0);

  // Two emission cones (orange).
  drawEmissionCone(poleN, center, scale, 'rgba(255, 170, 100, 0.40)');
  drawEmissionCone(poleS, center, scale, 'rgba(255, 170, 100, 0.40)');

  // Pole-trace circles at the obliquity radius.
  drawPoleTrace(+1, center, scale);
  drawPoleTrace(-1, center, scale);

  // Neutron star: a glowing sphere at origin.
  drawNeutronStar(center, scale);

  // Line of sight (yellow dashed).
  const los = losVector(st.incl);
  drawSegment3D({ x: 0, y: 0, z: 0 }, { x: 1.8 * los.x, y: 1.8 * los.y, z: 1.8 * los.z }, center, scale, 'rgba(255, 230, 120, 0.95)', 1.8, [6, 4]);
  drawArrowhead3D({ x: 1.8 * los.x, y: 1.8 * los.y, z: 1.8 * los.z }, los, center, scale, 'rgba(255, 230, 120, 0.95)');

  // Earth icon at the tip of LOS.
  const eP = project(1.8 * los.x, 1.8 * los.y, 1.8 * los.z, center, scale);
  ctx.fillStyle = 'rgba(120, 180, 255, 0.95)';
  ctx.beginPath(); ctx.arc(eP.x, eP.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220, 240, 255, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Earth', eP.x + 8, eP.y + 4);

  // Pole label (current).
  const pN = project(1.4 * poleN.x, 1.4 * poleN.y, 1.4 * poleN.z, center, scale);
  ctx.fillStyle = 'rgba(120, 220, 255, 0.85)';
  ctx.fillText('B', pN.x + 6, pN.y - 6);
  ctx.fillStyle = 'rgba(240, 240, 250, 0.7)';
  const sA = project(0, 1.4, 0, center, scale);
  ctx.fillText('Omega', sA.x + 6, sA.y);

  // Caption strip.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.78)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`alpha = ${st.alpha} deg, i = ${st.incl} deg, rho = ${st.rho} deg, P = ${st.period.toFixed(2)} s`, 14, H - 16);
}

function drawNeutronStar(center, scale) {
  const c = project(0, 0, 0, center, scale);
  const r = 0.16 * scale;
  const g = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.2, c.x, c.y, r);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  g.addColorStop(0.6, 'rgba(180, 210, 255, 0.85)');
  g.addColorStop(1, 'rgba(60, 100, 180, 0.0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.6, 0, Math.PI * 2); ctx.fill();
}

function drawSegment3D(a, b, center, scale, color, lw, dash = null) {
  const pa = project(a.x, a.y, a.z, center, scale);
  const pb = project(b.x, b.y, b.z, center, scale);
  if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  ctx.setLineDash([]);
}

function drawArrowhead3D(tip, dir, center, scale, color) {
  // Project tip and tip - 0.06 * dir.
  const back = { x: tip.x - 0.10 * dir.x, y: tip.y - 0.10 * dir.y, z: tip.z - 0.10 * dir.z };
  const pT = project(tip.x, tip.y, tip.z, center, scale);
  const pB = project(back.x, back.y, back.z, center, scale);
  const dx = pT.x - pB.x, dy = pT.y - pB.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ah = 9;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pT.x, pT.y);
  ctx.lineTo(pT.x - ah * ux + (ah / 2) * uy, pT.y - ah * uy - (ah / 2) * ux);
  ctx.lineTo(pT.x - ah * ux - (ah / 2) * uy, pT.y - ah * uy + (ah / 2) * ux);
  ctx.closePath(); ctx.fill();
}

function drawEmissionCone(axisVec, center, scale, color) {
  // Cone of half-angle rho, axis along axisVec, apex at origin,
  // length 1.6. Draw the lateral surface as a sequence of triangle
  // strips around the rim.
  const len = 1.6;
  const rim = len * Math.tan(st.rho * DEG);
  // Build orthonormal basis (u, v, w) where w = axisVec.
  const w = { x: axisVec.x, y: axisVec.y, z: axisVec.z };
  const helper = Math.abs(w.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = cross(helper, w);
  norm(u);
  const v = cross(w, u);
  // Draw outline of the cone (two edges) and the rim ellipse.
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0;
  ctx.fillStyle = color.replace('0.40', '0.10');
  const N = 36;
  const rim3 = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * 2 * Math.PI;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    const px = len * w.x + rim * (cosA * u.x + sinA * v.x);
    const py = len * w.y + rim * (cosA * u.y + sinA * v.y);
    const pz = len * w.z + rim * (cosA * u.z + sinA * v.z);
    rim3.push(project(px, py, pz, center, scale));
  }
  // Filled cone surface (polygon from apex to rim).
  ctx.beginPath();
  const apex = project(0, 0, 0, center, scale);
  for (let k = 0; k < N; k++) {
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(rim3[k].x, rim3[k].y);
    ctx.lineTo(rim3[(k + 1) % N].x, rim3[(k + 1) % N].y);
    ctx.closePath();
  }
  ctx.fill();
  // Rim outline.
  ctx.beginPath();
  ctx.moveTo(rim3[0].x, rim3[0].y);
  for (let k = 1; k < N; k++) ctx.lineTo(rim3[k].x, rim3[k].y);
  ctx.closePath();
  ctx.stroke();
  // Highlight edges (two lateral lines closest to camera).
  ctx.lineWidth = 1.5;
  // Pick the two rim points with largest screen-y projection difference.
  let idxL = 0, idxR = 0, maxL = -Infinity, maxR = -Infinity;
  for (let k = 0; k < N; k++) {
    const p = rim3[k];
    if (-p.x > maxL) { maxL = -p.x; idxL = k; }
    if (p.x > maxR) { maxR = p.x; idxR = k; }
  }
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y); ctx.lineTo(rim3[idxL].x, rim3[idxL].y);
  ctx.moveTo(apex.x, apex.y); ctx.lineTo(rim3[idxR].x, rim3[idxR].y);
  ctx.stroke();
}

function drawPoleTrace(side, center, scale) {
  // Circle at z = side * cos(alpha) with radius sin(alpha).
  const a = st.alpha * DEG;
  const r = Math.sin(a);
  const z = side * Math.cos(a);
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.25)';
  ctx.lineWidth = 1.0;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  for (let k = 0; k <= 64; k++) {
    const ang = (k / 64) * 2 * Math.PI;
    const p = project(r * Math.cos(ang), z, r * Math.sin(ang), center, scale);
    if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function norm(v) { const m = Math.hypot(v.x, v.y, v.z) || 1; v.x /= m; v.y /= m; v.z /= m; }

function drawProfile() {
  const x0 = 0.62 * W, y0 = 60, x1 = W - 20, y1 = H - 60;
  // Frame
  ctx.fillStyle = 'rgba(20, 28, 44, 0.8)';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // Title
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Pulse profile I(phi)', x0 + 8, y0 - 6);
  // Curve
  const prof = pulseProfile(st.alpha, st.incl, st.rho, 256);
  const maxI = Math.max(...prof, 0.05);
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k < prof.length; k++) {
    const x = x0 + (k / (prof.length - 1)) * (x1 - x0);
    const y = y1 - (prof[k] / maxI) * (y1 - y0 - 10);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current phase marker.
  const phaseFrac = (st.phase / (2 * Math.PI)) % 1;
  const xp = x0 + phaseFrac * (x1 - x0);
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(xp, y0); ctx.lineTo(xp, y1); ctx.stroke();
  ctx.setLineDash([]);
  // Current intensity dot.
  const Inow = pulseIntensity(st.phase, st.alpha, st.incl, st.rho);
  const yNow = y1 - (Inow / maxI) * (y1 - y0 - 10);
  ctx.fillStyle = 'rgba(255, 220, 140, 1)';
  ctx.beginPath(); ctx.arc(xp, yNow, 4, 0, Math.PI * 2); ctx.fill();
  // Axes labels (curve is normalized to its peak, so the y-axis is
  // relative flux I/I_peak; max I_peak is shown to the right).
  ctx.fillStyle = 'rgba(220, 230, 255, 0.5)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('0', x0 + 2, y1 + 14);
  ctx.fillText('phase = 1', x1 - 60, y1 + 14);
  ctx.fillText('0', x0 - 14, y1);
  ctx.fillText('I_peak', x0 - 34, y0 + 10);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.85)';
  ctx.fillText(`I_peak = ${maxI.toFixed(2)}`, x1 - 96, y0 + 16);
}

function updateReadout() {
  rP.textContent = st.period.toFixed(2) + ' s';
  rAlpha.textContent = String(st.alpha);
  rIncl.textContent = String(st.incl);
  rRho.textContent = String(st.rho);
  rRegime.textContent = visibilityRegime(st.alpha, st.incl, st.rho);
}

function readSliders() {
  st.alpha = parseInt(sAlpha.value, 10);
  st.incl = parseInt(sIncl.value, 10);
  st.rho = parseInt(sRho.value, 10);
  st.period = parseFloat(sPeriod.value);
  vAlpha.textContent = String(st.alpha);
  vIncl.textContent = String(st.incl);
  vRho.textContent = String(st.rho);
  vPeriod.textContent = st.period.toFixed(2);
}

[sAlpha, sIncl, sRho, sPeriod].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => { st.phase = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  alpha: { get: () => st.alpha, set: v => { st.alpha = parseInt(v, 10); sAlpha.value = v; }, parse: parseInt },
  incl: { get: () => st.incl, set: v => { st.incl = parseInt(v, 10); sIncl.value = v; }, parse: parseInt },
  rho: { get: () => st.rho, set: v => { st.rho = parseInt(v, 10); sRho.value = v; }, parse: parseInt },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function draw() {
  drawScene();
  drawProfile();
  updateReadout();
}

if (CAPTURE_NAME) {
  st.phase = CAPTURE_FRAC * 2 * Math.PI;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.phase += (2 * Math.PI / Math.max(0.1, st.period)) * dt;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
