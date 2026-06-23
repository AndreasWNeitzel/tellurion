// Relativistic radiation pattern, rendered as a 3D wireframe lobe.
// The auto-rotating 2D version was a gimmick (and gave a phallic
// silhouette at high gamma). This version renders the angular
// intensity pattern dI/dOmega(theta, phi) on a 3D azimuthal mesh,
// shaded by depth, and lets the user orbit the camera with drag.
// Velocity (green arrow) and acceleration (red arrow) vectors are
// shown so the geometry is unambiguous.
//
// Reference: Jackson, Classical Electrodynamics, 3rd ed., Ch. 14.

import { lobeParallel, lobePerpendicular, betaFromGamma, openingAngle } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rG = document.getElementById('readout-g');
const rTh = document.getElementById('readout-th');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const selG = document.getElementById('select-geom');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = {
  gamma: 3,
  geom: 'perp',
  // Camera (orbit).
  az: 0.6, el: 0.25,
  drag: false, lastX: 0, lastY: 0,
  running: !prefersReducedMotion(),
};

sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
selG.addEventListener('change', () => { st.geom = selG.value; });
btnR.addEventListener('click', () => { st.az = 0.6; st.el = 0.25; st.running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { st.running = !st.running; btnP.textContent = st.running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!st.running)); });

canvas.addEventListener('pointerdown', (e) => { st.drag = true; st.lastX = e.clientX; st.lastY = e.clientY; });
window.addEventListener('pointerup', () => { st.drag = false; });
window.addEventListener('pointermove', (e) => {
  if (!st.drag) return;
  st.az += (e.clientX - st.lastX) * 0.005;
  st.el = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, st.el + (e.clientY - st.lastY) * 0.005));
  st.lastX = e.clientX; st.lastY = e.clientY;
});

// 3D projection.
function project(x, y, z) {
  // Origin in the upper-middle so the forward (+y) beam fills the top half and
  // leaves the lower half for the angular-distribution diagnostic.
  const cx = canvas.width / 2, cy = Math.round(canvas.height * 0.45);
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const ce = Math.cos(st.el), se = Math.sin(st.el);
  // Rotate about y by az, then about x by el.
  const xp = ca * x + sa * z;
  const zp = -sa * x + ca * z;
  const yp = ce * y - se * zp;
  const zr = se * y + ce * zp;
  return { x: cx + xp * 270, y: cy - yp * 270, depth: zr };
}

// Sample the radiation pattern as a function of (theta, phi), where theta
// from the velocity direction (here +y in world coords), phi azimuth.
// For "parallel" acceleration: pattern depends only on theta.
// For "perpendicular": depends on theta AND phi.
function rOfThPh(theta, phi) {
  if (st.geom === 'par') return lobeParallel(theta, betaFromGamma(st.gamma));
  return lobePerpendicular(theta, phi, betaFromGamma(st.gamma));
}

// Bottom diagnostic: the angular power distribution dP/dOmega versus angle
// theta from the velocity, the quantitative content of the 3D lobe. The
// forward peak narrows and sharpens as gamma rises; the 1/gamma beaming angle
// is marked so the half-width can be read off directly.
function drawDiagnostic(beta) {
  const W = canvas.width, H = canvas.height;
  const x0 = 56, x1 = W - 24, y0 = Math.round(H * 0.58), y1 = H - 42;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('radiated power vs angle from velocity:  dP/dOmega(theta)', x0 + 4, y0 - 8);
  const M = 260; const vals = new Float64Array(M + 1); let imax = 1e-30;
  for (let k = 0; k <= M; k += 1) {
    const th = Math.PI * k / M;
    const v = st.geom === 'par' ? lobeParallel(th, beta) : lobePerpendicular(th, 0, beta);
    vals[k] = v; if (v > imax) imax = v;
  }
  const ax = x0 + 44, aw = x1 - x0 - 60, ay = y0 + 14, ah = y1 - y0 - 40;
  const thX = (th) => ax + aw * th / Math.PI;
  const iY = (v) => ay + ah - (ah - 4) * (v / imax);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  const op = openingAngle(st.gamma);
  ctx.strokeStyle = 'rgba(91,192,235,0.6)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(thX(op), ay); ctx.lineTo(thX(op), ay + ah); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'left';
  ctx.fillText(`1/gamma = ${(op * 180 / Math.PI).toFixed(1)} deg`, Math.min(thX(op) + 5, x1 - 130), ay + 14);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let k = 0; k <= M; k += 1) { const px = thX(Math.PI * k / M), py = iY(vals[k]); if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'center';
  for (const td of [0, 45, 90, 135, 180]) ctx.fillText(String(td), thX(td * Math.PI / 180), ay + ah + 16);
  ctx.textAlign = 'right'; ctx.fillText('theta (deg)', x1 - 6, ay + ah + 16);
  ctx.textAlign = 'left'; ctx.fillText('dP/dOmega', ax - 40, ay + 8);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const beta = betaFromGamma(st.gamma);

  // Sample the (theta, phi) mesh.
  const NT = 24, NP = 48;
  const verts = new Float64Array(NT * NP * 3);
  const depths = new Float64Array(NT * NP);
  let maxR = 1e-30;
  for (let i = 0; i < NT; i += 1) {
    const theta = (i / (NT - 1)) * Math.PI;
    for (let j = 0; j < NP; j += 1) {
      const phi = (j / NP) * 2 * Math.PI;
      const r = Math.pow(Math.max(1e-12, rOfThPh(theta, phi)), 0.45);
      if (r > maxR) maxR = r;
    }
  }
  for (let i = 0; i < NT; i += 1) {
    const theta = (i / (NT - 1)) * Math.PI;
    const ct = Math.cos(theta), stt = Math.sin(theta);
    for (let j = 0; j < NP; j += 1) {
      const phi = (j / NP) * 2 * Math.PI;
      const r = Math.pow(Math.max(1e-12, rOfThPh(theta, phi)), 0.45) / maxR;
      const x = r * stt * Math.cos(phi);
      const y = r * ct;
      const z = r * stt * Math.sin(phi);
      const idx = (i * NP + j) * 3;
      verts[idx] = x; verts[idx + 1] = y; verts[idx + 2] = z;
      depths[i * NP + j] = project(x, y, z).depth;
    }
  }

  // Draw mesh as line segments, depth-shaded.
  // Sort line segments by midpoint depth so far-away lines render first.
  const segs = [];
  for (let i = 0; i < NT; i += 1) {
    for (let j = 0; j < NP; j += 1) {
      const a = i * NP + j;
      const b = i * NP + ((j + 1) % NP);
      const c = i < NT - 1 ? (i + 1) * NP + j : -1;
      if (a < verts.length && b * 3 < verts.length) {
        segs.push({ a, b, mid: (depths[a] + depths[b]) / 2 });
      }
      if (c >= 0) {
        segs.push({ a, b: c, mid: (depths[a] + depths[c]) / 2 });
      }
    }
  }
  segs.sort((s, t) => s.mid - t.mid);
  for (const s of segs) {
    const ia = s.a * 3, ib = s.b * 3;
    const pa = project(verts[ia], verts[ia + 1], verts[ia + 2]);
    const pb = project(verts[ib], verts[ib + 1], verts[ib + 2]);
    const shade = 0.25 + 0.65 * Math.max(0, Math.min(1, (s.mid + 1) / 2));
    ctx.strokeStyle = `rgba(255, 209, 102, ${shade.toFixed(2)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }

  // Axes: velocity (green +y), acceleration (red).
  function axisArrow(x0, y0, z0, x1, y1, z1, color, label) {
    const p0 = project(x0, y0, z0), p1 = project(x1, y1, z1);
    ctx.strokeStyle = color; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    const dx = p1.x - p0.x, dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    const nx = dx / len, ny = dy / len;
    const hx = p1.x - 10 * nx, hy = p1.y - 10 * ny;
    const px = -ny * 4, py = nx * 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(hx + px, hy + py);
    ctx.lineTo(hx - px, hy - py);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.font = fontString(canvas, 'caption', 'mono', 600);
    ctx.fillText(label, p1.x + 6, p1.y);
  }
  // Velocity along +y (north pole of the lobe).
  axisArrow(0, 0, 0, 0, 1.4, 0, '#06d6a0', 'v');
  // Acceleration: along +y for parallel; along +x for perpendicular.
  if (st.geom === 'par') {
    axisArrow(0, 0, 0, 0, 1.0, 0, '#ef476f', 'a (∥)');
  } else {
    axisArrow(0, 0, 0, 1.1, 0, 0, '#ef476f', 'a (⊥)');
  }

  // Opening-angle cone for the forward beam.
  const opAng = openingAngle(st.gamma);
  ctx.strokeStyle = 'rgba(91, 192, 235, 0.6)';
  ctx.setLineDash([5, 5]); ctx.lineWidth = 1.4;
  for (const phase of [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3]) {
    const tipX = 1.4 * Math.sin(opAng) * Math.cos(phase);
    const tipY = 1.4 * Math.cos(opAng);
    const tipZ = 1.4 * Math.sin(opAng) * Math.sin(phase);
    const p0 = project(0, 0, 0), p1 = project(tipX, tipY, tipZ);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  drawDiagnostic(beta);

  // HUD.
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`γ = ${st.gamma.toFixed(2)},  β = ${beta.toFixed(4)}`, 12, 22);
  ctx.fillText(`1/γ = ${(opAng * 180 / Math.PI).toFixed(1)}° (cyan cone)`, 12, 40);
  ctx.fillText(`acceleration: ${st.geom === 'par' ? 'parallel to v' : 'perpendicular to v'}`, 12, 58);
  ctx.fillText('drag to orbit the camera', 12, canvas.height - 14);
  rG.textContent = st.gamma.toFixed(2);
  rTh.textContent = `${(opAng * 180 / Math.PI).toFixed(1)}°`;
}

function tick() {
  // Slowly orbit the camera so the 3D beaming lobe reads as a solid; a pointer
  // drag takes over and Pause halts the spin.
  if (st.running && !st.drag) st.az += 0.006;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const beta = betaFromGamma(st.gamma);
  const theta_c = openingAngle(st.gamma);
  return {
    fields: [
      { key: 'lorentz-factor', label: 'Lorentz factor gamma', value: st.gamma, format: 'float' },
      { key: 'beta', label: 'Velocity (v/c)', value: beta, format: 'float' },
      { key: 'opening-angle', label: 'Beaming angle (deg)', value: theta_c * 180 / Math.PI, format: 'float' },
      { key: 'geometry', label: 'Geometry', value: st.geom === 'perp' ? 'perpendicular' : 'parallel', format: undefined }
    ]
  };
};
window.playground.getInvariants = function () {
  const beta = betaFromGamma(st.gamma);
  const beta_valid = beta >= 0 && beta < 1;
  const gamma_valid = st.gamma >= 1;
  const status = beta_valid && gamma_valid ? 'pass' : 'drift';
  return [
    {
      key: 'special-relativity-bounds',
      label: '0 <= beta < 1',
      value: beta_valid ? 'pass' : beta.toFixed(4),
      status: status
    }
  ];
};
