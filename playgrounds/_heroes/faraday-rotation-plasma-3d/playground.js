// Faraday rotation playground. Three-column visualization: a
// schematic of the plasma column with the polarization vector
// rotating along its length, a multi-wavelength comparison (L/S/C
// bands), and a chi-vs-lambda^2 line plot.

import {
  rotationMeasure, rotationAngle, rotationAngleDeg,
  polarizationAlongPath, PRESET_WAVELENGTHS, KNOWN_SOURCES, TWO_PI,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rRM = document.getElementById('readout-RM');
const rLam = document.getElementById('readout-lam');
const rChi = document.getElementById('readout-chi');
const rB = document.getElementById('readout-B');
const rNe = document.getElementById('readout-ne');

const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sNe = document.getElementById('slider-ne'), vNe = document.getElementById('value-ne');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const sLam = document.getElementById('slider-lam'), vLam = document.getElementById('value-lam');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  B_uG: 3.0,
  n_e: 0.030,
  L_pc: 1000,
  lambda_cm: 21,
  running: !prefersReducedMotion(),
  phase: 0,
};

function currentRM() {
  // sliders in microgauss; convert to gauss.
  return rotationMeasure(st.B_uG * 1e-6, st.n_e, st.L_pc);
}
function lambda_m() { return st.lambda_cm * 1e-2; }

const COL = { LEFT: 30, MID: 320, RIGHT: 600 };
const COL_W = 270;

function drawHelixColumn() {
  // The plasma column: depicted top-to-bottom with a rectangle
  // shaded purple (magnetized plasma) and the polarization
  // vector rotating along z.
  const x = COL.LEFT, y = 40, w = COL_W, h = H - 80;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('plasma column (B || k)', x + 8, y - 6);

  // Plasma shading (subtle gradient + B-field arrows).
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, 'rgba(100, 60, 180, 0.10)');
  grad.addColorStop(1, 'rgba(180, 60, 130, 0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

  // B-field arrows (down the column).
  ctx.strokeStyle = 'rgba(180, 100, 220, 0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const xx = x + 30 + i * (w - 60) / 4;
    drawArrowY(xx, y + 20, xx, y + h - 20);
  }
  ctx.fillStyle = 'rgba(180, 100, 220, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('B', x + w - 14, y + h / 2);

  // Polarization vector along z.
  const N = 40;
  const RM = currentRM();
  const phis = polarizationAlongPath(N, RM, lambda_m(), st.phase * 0.4);
  const midX = x + w / 2;
  const arrowLen = (w - 60) / 3;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const yy = y + 20 + t * (h - 40);
    const phi = phis[i];
    const ex = arrowLen * Math.cos(phi);
    const ey = arrowLen * Math.sin(phi) * 0.55; // foreshortened for "into page"
    // Color by depth (light to dark).
    const u = 0.4 + 0.5 * (1 - t);
    ctx.strokeStyle = `rgba(120, 220, 255, ${u.toFixed(3)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(midX - ex, yy - ey);
    ctx.lineTo(midX + ex, yy + ey);
    ctx.stroke();
    if (i === 0 || i === N - 1) {
      ctx.fillStyle = `rgba(120, 220, 255, ${u.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(midX + ex, yy + ey, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(midX - ex, yy - ey, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Endpoint labels.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.8)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('phi_in', midX + arrowLen + 10, y + 24);
  const chiTot = rotationAngleDeg(RM, lambda_m());
  ctx.fillText(`phi_out = phi_in + ${chiTot.toFixed(0)} deg`, x + 8, y + h - 8);
}

function drawArrowY(x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  // arrowhead
  const ah = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ah / 2, y1 - ah);
  ctx.lineTo(x1 + ah / 2, y1 - ah);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
}

function drawMultiwavelength() {
  // Show 3 wavelengths (L, S, C) as 3 helices side-by-side, each
  // rotated by chi(lambda_i).
  const x = COL.MID, y = 40, w = COL_W, h = H - 80;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('multi-wavelength rotation', x + 8, y - 6);

  const RM = currentRM();
  const bands = [
    { name: 'L (21 cm)', lam: 0.21, color: 'rgba(255, 90, 90, 0.95)' },
    { name: 'S (13 cm)', lam: 0.13, color: 'rgba(255, 200, 90, 0.95)' },
    { name: 'C (6 cm)',  lam: 0.06, color: 'rgba(120, 240, 200, 0.95)' },
  ];
  const N = 30;
  const colWidth = (w - 30) / 3;
  for (let bi = 0; bi < bands.length; bi++) {
    const band = bands[bi];
    const cx = x + 15 + bi * colWidth + colWidth / 2;
    const arrowLen = colWidth * 0.35;
    ctx.fillStyle = band.color;
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(band.name, cx - 24, y + 22);
    const chiTot = rotationAngle(RM, band.lam);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const yy = y + 36 + t * (h - 56);
      const phi = t * chiTot + st.phase * 0.4;
      const ex = arrowLen * Math.cos(phi);
      const ey = arrowLen * Math.sin(phi) * 0.55;
      const u = 0.4 + 0.5 * (1 - t);
      ctx.strokeStyle = band.color.replace(/[\d.]+\)/, `${u.toFixed(3)})`);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - ex, yy - ey);
      ctx.lineTo(cx + ex, yy + ey);
      ctx.stroke();
    }
    // Label rotation total
    ctx.fillStyle = band.color;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${rotationAngleDeg(RM, band.lam).toFixed(0)} deg`, cx - 18, y + h - 8);
  }
}

function drawChiLambda2() {
  // Right panel: chi vs lambda^2 line plot demonstrating linearity.
  const x = COL.RIGHT, y = 40, w = W - x - 20, h = H - 80;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('χ(λ^2) line fit', x + 8, y - 6);

  const RM = currentRM();
  // Plot lambda^2 from 0 to 0.05 m^2 (lambda 0 to ~ 22 cm).
  const lam2_max = 0.05;
  let chiMax = Math.abs(RM * lam2_max);
  // We'll normalize chi axis to the abs(chi) at lambda = 21 cm baseline.
  const Y_RANGE_DEG = 720;     // plot up to 2 wraps.
  const chiMaxDeg = Math.min(Y_RANGE_DEG, Math.abs(rotationAngleDeg(RM, Math.sqrt(lam2_max))));
  const PY_RANGE = Math.max(180, chiMaxDeg);
  const px = (l2) => x + 36 + (l2 / lam2_max) * (w - 50);
  const py = (chi_deg) => y + h - 30 - (chi_deg / PY_RANGE) * (h - 50);
  // Axes
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 36, y + 20);
  ctx.lineTo(x + 36, y + h - 30);
  ctx.lineTo(x + w - 14, y + h - 30);
  ctx.stroke();
  // Slope line.
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k <= 100; k++) {
    const l2 = (k / 100) * lam2_max;
    const chi_deg = (RM * l2 * 180 / Math.PI) % 360;
    // Use absolute value with wrap-aware projection: actually just
    // wrap to [-180, 180] for clarity.
    let cd = (RM * l2 * 180 / Math.PI);
    cd = ((cd % 360) + 540) % 360 - 180;   // O(1) wrap; never spins
    const xx = px(l2);
    const yy = y + h / 2 - cd * (h - 50) / 360;
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // Mark VLA bands.
  const bands = [
    { name: 'L', lam: 0.21, color: 'rgba(255, 90, 90, 0.95)' },
    { name: 'S', lam: 0.13, color: 'rgba(255, 200, 90, 0.95)' },
    { name: 'C', lam: 0.06, color: 'rgba(120, 240, 200, 0.95)' },
    { name: 'X', lam: 0.03, color: 'rgba(180, 180, 255, 0.95)' },
  ];
  for (const band of bands) {
    const l2 = band.lam * band.lam;
    let cd = RM * l2 * 180 / Math.PI;
    cd = ((cd % 360) + 540) % 360 - 180;   // O(1) wrap; never spins
    const xx = px(l2);
    const yy = y + h / 2 - cd * (h - 50) / 360;
    ctx.fillStyle = band.color;
    ctx.beginPath(); ctx.arc(xx, yy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(band.name, xx + 8, yy + 4);
  }
  // Axis labels
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', x + 30, y + h - 16);
  ctx.fillText(`${lam2_max.toFixed(2)}`, x + w - 30, y + h - 16);
  ctx.fillText('λ^2 (m^2)', x + w / 2 - 30, y + h - 4);
  ctx.fillText('χ (deg, wrapped)', x + 8, y + 18);
}

function updateReadout() {
  const RM = currentRM();
  rRM.textContent = RM.toExponential(2);
  rLam.textContent = lambda_m().toFixed(3) + ' m';
  rChi.textContent = rotationAngleDeg(RM, lambda_m()).toFixed(1) + ' deg';
  rB.textContent = st.B_uG.toFixed(2) + ' uG';
  rNe.textContent = st.n_e.toFixed(3);
}

function readSliders() {
  st.B_uG = parseFloat(sB.value);
  st.n_e = parseFloat(sNe.value);
  st.L_pc = parseFloat(sL.value);
  st.lambda_cm = parseFloat(sLam.value);
  vB.textContent = st.B_uG.toFixed(2);
  vNe.textContent = st.n_e.toFixed(3);
  vL.textContent = String(st.L_pc);
  vLam.textContent = st.lambda_cm.toFixed(1);
}

function applyPreset(name) {
  if (name === 'pulsar') {
    st.B_uG = 3.0; st.n_e = 0.030; st.L_pc = 1000;
  } else if (name === 'sgr') {
    st.B_uG = 3e4; st.n_e = 30; st.L_pc = 1;       // central engine scale
  } else if (name === 'agn') {
    st.B_uG = 100; st.n_e = 0.01; st.L_pc = 10000;
  }
  sB.value = String(st.B_uG);
  sNe.value = String(st.n_e);
  sL.value = String(st.L_pc);
  readSliders();
  vPreset.textContent = name.slice(0, 3);
}

[sB, sNe, sL, sLam].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', () => applyPreset(selPreset.value));
btnReset.addEventListener('click', () => { st.phase = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  b_par_uG: { get: () => st.B_uG, set: v => { st.B_uG = parseFloat(v); sB.value = v; }, parse: parseFloat },
  n_e: { get: () => st.n_e, set: v => { st.n_e = parseFloat(v); sNe.value = v; }, parse: parseFloat },
  length_pc: { get: () => st.L_pc, set: v => { st.L_pc = parseFloat(v); sL.value = v; }, parse: parseFloat },
  wavelength_m: { get: () => st.lambda_cm * 1e-2, set: v => { st.lambda_cm = parseFloat(v) * 100; sLam.value = st.lambda_cm; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function draw() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Starfield (small)
  for (let i = 0; i < 60; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.10 + 0.30 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  drawHelixColumn();
  drawMultiwavelength();
  drawChiLambda2();
  updateReadout();
  // Bottom caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`RM = ${currentRM().toExponential(2)} rad/m^2, lambda = ${lambda_m().toFixed(3)} m, chi = ${rotationAngleDeg(currentRM(), lambda_m()).toFixed(1)} deg`, 14, H - 14);
}

if (CAPTURE_NAME) {
  st.phase = (CAPTURE_FRAC || 0) * Math.PI;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.phase += dt * 1.0;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const RM = rotationMeasure(st.B_uG * 1e-6, st.n_e, st.L_pc);
  return {
    fields: [
      { key: 'b-field', label: 'magnetic field $B$ ($\\mu$G)', value: st.B_uG, format: 'float' },
      { key: 'density', label: 'electron density $n_e$', value: st.n_e, format: 'float' },
      { key: 'rotation-measure', label: 'rotation measure RM', value: RM, format: 'float' },
      { key: 'rotation-angle', label: 'rotation angle (deg)', value: rotationAngleDeg(RM, lambda_m()), format: 'float' },
    ],
  };
};
// Faraday rotation grows as the square of the wavelength,
// delta-chi = RM * lambda^2, so doubling the wavelength quadruples
// the rotation angle. That lambda^2 scaling is the invariant.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const RM = currentRM();
      const lam = lambda_m();
      const a1 = rotationAngle(RM, lam);
      const a2 = rotationAngle(RM, 2 * lam);
      if (!(Math.abs(a1) > 1e-30)) return [];
      const ratio = a2 / a1;
      const dev = Math.abs(ratio - 4) / 4;
      return [{
        key: 'lambda-squared',
        label: 'rotation scales as lambda^2 (ratio at 2x)',
        value: ratio.toFixed(4),
        status: dev < 1e-6 ? 'pass' : (dev < 1e-3 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
