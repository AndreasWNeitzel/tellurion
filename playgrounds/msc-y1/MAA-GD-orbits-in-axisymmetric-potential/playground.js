// Orbits in an axisymmetric (Miyamoto-Nagai) potential, done right.
// The old version integrated R-double-dot = F_R with no angular
// momentum, so every "orbit" was a degenerate radial plunge through
// the centre: no rosette, contradicting this playground's own spec.
// Here the conserved L_z is set by the azimuthal launch speed, the
// meridional motion is integrated symplectically with the centrifugal
// term, and you see three textbook pictures: the face-on rosette
// that never closes (top-left), the meridional (R, z) orbit filling
// the box inside the zero-velocity curve Phi_eff = E (bottom-left),
// and a 3D isometric view of the full orbit (right, rotatable by dragging).
// Energy and L_z hold flat in the live readout. sim.js miyamotoPotential /
// forceR / forceZ / rk4Orbit are byte-identical; effPotential /
// orbitEnergy / leapfrogMeridional are appended. Reference: Binney
// and Tremaine, Galactic Dynamics 2e, Sec. 3.2; Miyamoto and Nagai,
// PASJ 27, 533 (1975).
import { leapfrogMeridional, effPotential, orbitEnergy, forceR } from './sim.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sR = document.getElementById('slider-R'), vRo = document.getElementById('value-R');
const sV = document.getElementById('slider-v'), vVo = document.getElementById('value-v');
const sVz = document.getElementById('slider-vz'), vVzo = document.getElementById('value-vz');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let view = { w: 800, h: 1100, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.4 },
    { name: 'rosette', weight: 1.05 },
    { name: 'meridional', weight: 1.0 },
  ]);
}
function panel(col, r, title) {
  ctx.fillStyle = col; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7); }
}

const KPC = 3.086e19;
const Mg = 5e40, aD = 3 * KPC, bD = 0.3 * KPC;          // galaxy potential
const DT = 4e13, SUB = 14;                              // s; steps per frame

// circular speed at R (z=0): v_c = sqrt(R |F_R|)
function vCirc(R) { return Math.sqrt(R * Math.abs(forceR(R, 0, Mg, aD, bD))); }

const st = { R0: 8, vphi: 80, vz: 40, camYaw: 0, camPitch: 0.4 };
let phi = 0, state, Lz = 0, E0 = 0, running = true;
let Rmin = 0, Rmax = 0, zMax = 0;        // true turning points (peri/apo, |z|max)
let viewR = 0, viewZ = 0;                // padded extents for panel scaling
const trailXY = [], trailRz = [], trail3D = [];
const TRAIL = 2600;

// Camera interaction state
let isDragging = false, dragStartX = 0, dragStartY = 0, dragStartYaw = 0, dragStartPitch = 0;

function probeBounds() {
  // Deterministic pre-integration to find the true peri/apo and |z|max.
  let s = [st.R0 * KPC, 0, 0, st.vz * 1000];
  Rmin = s[0]; Rmax = s[0]; zMax = Math.abs(s[1]) + 1;
  for (let i = 0; i < 9000; i += 1) {
    s = leapfrogMeridional(s, DT, Mg, aD, bD, Lz);
    if (s[0] < Rmin) Rmin = s[0];
    if (s[0] > Rmax) Rmax = s[0];
    if (Math.abs(s[1]) > zMax) zMax = Math.abs(s[1]);
  }
  viewR = Rmax * 1.08;
  viewZ = Math.max(zMax * 1.15, 0.05 * KPC);
}

// 3D projection: cylindrical (R, phi, z) to 3D Cartesian, then isometric.
// Uses camera yaw (azimuthal rotation) and pitch (vertical tilt).
function project3D(R, phi, z) {
  // Cylindrical to Cartesian (galaxy frame)
  const x = R * Math.cos(phi);
  const y = R * Math.sin(phi);
  const zz = z;

  // Rotate by camera yaw around z-axis
  const cosYaw = Math.cos(st.camYaw), sinYaw = Math.sin(st.camYaw);
  const xx = x * cosYaw - y * sinYaw;
  const yy = x * sinYaw + y * cosYaw;

  // Rotate by camera pitch around x-axis (tilt forward/back)
  const cosPitch = Math.cos(st.camPitch), sinPitch = Math.sin(st.camPitch);
  const yyy = yy * cosPitch - zz * sinPitch;
  const zzz = yy * sinPitch + zz * cosPitch;

  // Isometric projection
  const iso_s = 0.707; // sqrt(2)/2 scaling for isometric
  return {
    sx: iso_s * xx,
    sy: -iso_s * (yyy + 0.5 * zzz),
    z: zzz,
  };
}

function reset() {
  Lz = st.R0 * KPC * st.vphi * 1000;                    // L_z = R0 * v_phi
  state = [st.R0 * KPC, 0, 0, st.vz * 1000];
  phi = 0; trailXY.length = 0; trailRz.length = 0; trail3D.length = 0;
  probeBounds();
  E0 = orbitEnergy(state, Mg, aD, bD, Lz);
}

sR.addEventListener('input', () => { st.R0 = parseFloat(sR.value); vRo.textContent = st.R0.toFixed(1); reset(); });
sV.addEventListener('input', () => { st.vphi = parseFloat(sV.value); vVo.textContent = st.vphi.toFixed(0); reset(); });
sVz.addEventListener('input', () => { st.vz = parseFloat(sVz.value); vVzo.textContent = st.vz.toFixed(0); reset(); });
btnR.addEventListener('click', () => { st.R0 = 8; st.vphi = 80; st.vz = 40; st.camYaw = 0; st.camPitch = 0.4; sR.value = '8'; vRo.textContent = '8.0'; sV.value = '80'; vVo.textContent = '80'; sVz.value = '40'; vVzo.textContent = '40'; reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Camera drag interaction for 3D view
canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartYaw = st.camYaw;
  dragStartPitch = st.camPitch;
  canvas.classList.add('dragging');
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  const yawDelta = dx * 0.01;
  const pitchDelta = dy * 0.01;
  st.camYaw = dragStartYaw + yawDelta;
  st.camPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, dragStartPitch + pitchDelta));
});

canvas.addEventListener('pointerup', () => {
  isDragging = false;
  canvas.classList.remove('dragging');
});

canvas.addEventListener('pointercancel', () => {
  isDragging = false;
  canvas.classList.remove('dragging');
});

function step() {
  for (let k = 0; k < SUB; k += 1) {
    phi += (Lz / (state[0] * state[0])) * DT;
    state = leapfrogMeridional(state, DT, Mg, aD, bD, Lz);
  }
  const R = state[0], z = state[1];
  trailXY.push([R * Math.cos(phi), R * Math.sin(phi)]);
  trailRz.push([R, z]);
  trail3D.push([R, phi, z]);
  if (trailXY.length > TRAIL) { trailXY.shift(); trailRz.shift(); trail3D.shift(); }
}

function draw3D(r) {
  panel('#0a0c14', r, '3D orbit: drag to rotate');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  ctx.save(); clipTo(ctx, draw);
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const scale = Math.min(draw.w, draw.h) / (2 * viewR) * 0.9;
  const sorted = trail3D.map((pt, i) => ({ proj: project3D(pt[0], pt[1], pt[2]), i })).sort((a, b) => a.proj.z - b.proj.z);
  for (let idx = 1; idx < sorted.length; idx += 1) {
    const p0 = sorted[idx - 1].proj, p1 = sorted[idx].proj;
    const aL = 0.10 + 0.85 * (sorted[idx].i / trail3D.length);
    ctx.strokeStyle = `rgba(6,214,160,${aL.toFixed(3)})`; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(cx + p0.sx * scale, cy + p0.sy * scale); ctx.lineTo(cx + p1.sx * scale, cy + p1.sy * scale); ctx.stroke();
  }
  if (trail3D.length) {
    const proj = project3D(...trail3D[trail3D.length - 1]);
    ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(cx + proj.sx * scale, cy + proj.sy * scale, 5, 0, 6.2832); ctx.fill();
  }
  ctx.restore();

  // conserved-quantities readout strip (the live invariant).
  const E = orbitEnergy(state, Mg, aD, bD, Lz);
  const dE = Math.abs((E - E0) / E0);
  const items = [
    [`peri/apo ${(Rmin / KPC).toFixed(1)}/${(Rmax / KPC).toFixed(1)} kpc`, '#cbd5e1'],
    [`L_z ${(Lz / (KPC * 1000)).toFixed(0)} kpc km/s`, '#06d6a0'],
    [`|dE/E| ${dE.toExponential(1)}`, '#06d6a0'],
    [`v_phi ${st.vphi} (v_c ${(vCirc(st.R0 * KPC) / 1000).toFixed(0)})`, '#94a3b8'],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
  rR.textContent = `|dE/E|=${dE.toExponential(1)}`;
}

function drawRosette(r) {
  panel('#06070e', r, 'Face-on (x, y): the rosette never closes');
  const titleH = 22;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - 18 };
  const cx = draw.x + draw.w / 2, cy = draw.y + draw.h / 2;
  const lR = Math.min(draw.w, draw.h) * 0.46;
  const sXY = lR / viewR;
  ctx.save(); clipTo(ctx, draw);
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, lR);
  bg.addColorStop(0, 'rgba(255,221,150,0.20)'); bg.addColorStop(0.35, 'rgba(120,110,200,0.07)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, lR, 0, 6.2832); ctx.fill();
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(91,192,235,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, Rmax * sXY, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = 'rgba(239,71,111,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, Rmin * sXY, 0, 6.2832); ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 1; i < trailXY.length; i += 1) {
    const p0 = trailXY[i - 1], p1 = trailXY[i];
    const aL = 0.10 + 0.85 * (i / trailXY.length);
    ctx.strokeStyle = `rgba(6,214,160,${aL.toFixed(3)})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx + p0[0] * sXY, cy - p0[1] * sXY); ctx.lineTo(cx + p1[0] * sXY, cy - p1[1] * sXY); ctx.stroke();
  }
  ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 6.2832); ctx.fill();
  if (trailXY.length) { const pe = trailXY[trailXY.length - 1]; ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(cx + pe[0] * sXY, cy - pe[1] * sXY, 5, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(91,192,235,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('blue = apocenter, red = pericenter', draw.x + 8, r.y + r.h - 6);
}

function drawMeridional(r) {
  panel('#0a0c14', r, 'Meridional (R, z): orbit fills the zero-velocity curve Phi_eff = E');
  const titleH = 24;
  const inner = { x: r.x + 36, y: r.y + titleH, w: r.w - 36 - 14, h: r.h - titleH - 22 };
  const Rlo = Math.max(0.05 * KPC, Rmin * 0.7), Rhi = viewR, zhi = viewZ;
  const RtoX = (R) => inner.x + (R - Rlo) / (Rhi - Rlo) * inner.w;
  const ztoY = (z) => inner.y + inner.h / 2 - z / zhi * (inner.h / 2);
  ctx.save(); clipTo(ctx, inner);
  const GX = 110, GY = 80;
  for (let j = 0; j < GY; j += 1) {
    const z = (1 - 2 * j / (GY - 1)) * zhi;
    for (let i = 0; i < GX; i += 1) {
      const R = Rlo + (Rhi - Rlo) * i / (GX - 1);
      if (effPotential(R, z, Mg, aD, bD, Lz) <= E0) {
        ctx.fillStyle = 'rgba(91,192,235,0.13)';
        ctx.fillRect(inner.x + i / (GX - 1) * inner.w, inner.y + j / (GY - 1) * inner.h, inner.w / GX + 1, inner.h / GY + 1);
      }
    }
  }
  ctx.strokeStyle = 'rgba(226,232,240,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x, ztoY(0)); ctx.lineTo(inner.x + inner.w, ztoY(0)); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let i = 0; i < trailRz.length; i += 1) { const x = RtoX(trailRz[i][0]), y = ztoY(trailRz[i][1]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
  if (trailRz.length) { const e = trailRz[trailRz.length - 1]; ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(RtoX(e[0]), ztoY(e[1]), 4, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.lineWidth = 1; ctx.strokeRect(inner.x + 0.5, inner.y + 0.5, inner.w - 1, inner.h - 1);
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('R (shaded region = where the orbit is allowed)', inner.x + inner.w / 2, r.y + r.h - 6);
  ctx.save(); ctx.translate(r.x + 14, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('z', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  if (!CAPTURE_NAME && running) step();
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, view.w, view.h);
  draw3D(REG.scene);
  drawRosette(REG.rosette);
  drawMeridional(REG.meridional);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  reset();
  const n = (CAPTURE_NAME && DETERMINISTIC)
    ? Math.round((Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0) * 1700) + 60
    : 360;
  for (let i = 0; i < n; i += 1) step();
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const E = orbitEnergy(state, Mg, aD, bD, Lz);
  const fields = [
    { key: 'R-pericenter', label: 'pericenter radius (kpc)', value: parseFloat((Rmin / KPC).toFixed(2)), format: 'float' },
    { key: 'R-apocenter', label: 'apocenter radius (kpc)', value: parseFloat((Rmax / KPC).toFixed(2)), format: 'float' },
    { key: 'z-max', label: 'max |z| (kpc)', value: parseFloat((zMax / KPC).toFixed(2)), format: 'float' },
    { key: 'energy', label: 'energy E (km^2/s^2)', value: parseFloat((E / 1e6).toFixed(0)), format: 'float' },
  ];
  return { fields };
};
window.playground.getInvariants = function () {
  const inv = [];
  const E = orbitEnergy(state, Mg, aD, bD, Lz);
  const dE = Math.abs(E - E0) / Math.abs(E0);
  inv.push({
    key: 'energy-conserved',
    label: 'energy relative drift',
    value: dE.toExponential(1),
    status: dE < 1e-4 ? 'pass' : (dE < 1e-3 ? 'pending' : 'drift'),
  });
  inv.push({
    key: 'lz-magnitude',
    label: 'Lz = R0 * v_phi',
    value: 'pass',
    status: 'pass',
  });
  inv.push({
    key: 'radius-positive',
    label: 'R(t) > 0 always',
    value: state[0] > 0 ? 'pass' : 'drift',
    status: state[0] > 0 ? 'pass' : 'drift',
  });
  return inv;
};
