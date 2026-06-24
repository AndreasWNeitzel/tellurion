// Slit-Experiment LEGEND. One playground covers wave-mode interference
// pattern, single-photon/electron accumulator, multi-slit grating, and
// Davisson-Germer Bragg scattering from a nickel crystal.

import {
  intensity, sampleHit, deBroglieElectron_m, makeRng,
  WAVELENGTH_PRESETS, NICKEL_LATTICE_M, sinc2, multiSlitFactor,
  principalMaximumAngle, braggAngle, singleSlitFirstMinAngle,
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
const DEG = Math.PI / 180;

const rMode = document.getElementById('readout-mode');
const rN = document.getElementById('readout-N');
const rLam = document.getElementById('readout-lam');
const rAD = document.getElementById('readout-ad');
const rMax = document.getElementById('readout-max');

const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const selParticle = document.getElementById('select-particle'), vParticle = document.getElementById('value-particle');
const sLambda = document.getElementById('slider-lambda'), vLambda = document.getElementById('value-lambda');
const sE = document.getElementById('slider-E'), vE = document.getElementById('value-E');
const sRate = document.getElementById('slider-rate'), vRate = document.getElementById('value-rate');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  mode: 'wave',
  N: 2,
  a_um: 2.0,
  d_um: 10,
  particle: 'photon',
  lambda_nm: 532,
  E_eV: 54,
  rate: 15,
  running: !prefersReducedMotion(),
  rng: makeRng(0xC0FFEE),
  hits: [],
  maxHits: 6000,
  t: 0,
  particles: [],
};

function a_m() { return st.a_um * 1e-6; }
function d_m() { return Math.max(a_m() * 1.05, st.d_um * 1e-6); }
function lambda_m() {
  if (st.particle === 'electron') return deBroglieElectron_m(st.E_eV);
  return st.lambda_nm * 1e-9;
}
function screen_D_m() { return 0.5; }
function effectiveN() { return (st.mode === 'grating') ? Math.max(st.N, 5) : st.N; }
function effectiveD_m() {
  if (st.mode === 'davisson') return NICKEL_LATTICE_M;
  return d_m();
}

const SRC_X = 80;
const MASK_X = 350;
// Portrait canvas: the beam runs left to right across the upper region; the
// I(theta) profile curve extends to SCREEN_X + 184, so SCREEN_X must leave that
// margin inside W (820). The readout sits in a bottom strip, not a right box,
// so the screen and its profile are never occluded.
const SCREEN_X = 600;
const AXIS_Y = 448;
const SCREEN_HALF = 348;

function thetaToYpx(theta_rad) {
  const y_m = screen_D_m() * Math.tan(theta_rad);
  const theta_max = visualThetaMax();
  const y_max_m = screen_D_m() * Math.tan(theta_max);
  return AXIS_Y - SCREEN_HALF * (y_m / y_max_m);
}

function visualThetaMax() {
  const lam = lambda_m();
  const env = 4 * lam / Math.max(a_m(), 1e-12);
  const fringes = 4 * lam / Math.max(d_m(), 1e-12);
  if (st.mode === 'davisson') return Math.min(Math.PI * 0.45, Math.max(0.7, 1.0));
  return Math.min(0.45, Math.max(env, fringes));
}

function drawBackground() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    ctx.fillStyle = `rgba(190, 200, 255, ${0.10 + 0.30 * ((i * 7) % 17) / 17})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawSource() {
  const grad = ctx.createRadialGradient(SRC_X, AXIS_Y, 3, SRC_X, AXIS_Y, 22);
  grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
  grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(SRC_X, AXIS_Y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  const lines = (st.particle === 'electron')
    ? [`electron source`, `${st.E_eV} eV`, `lambda = ${(lambda_m() * 1e9).toFixed(3)} nm`]
    : [`photon source`, `lambda = ${st.lambda_nm} nm`];
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], SRC_X - 28, AXIS_Y + 36 + 12 * i);
}

function slitYsPx() {
  const PX_PER_UM = 7;
  const N = effectiveN();
  const slitW = Math.max(2, st.a_um * PX_PER_UM);
  const pitch = Math.max(slitW + 1, st.d_um * PX_PER_UM);
  const total_h = (N - 1) * pitch + slitW;
  const top = AXIS_Y - total_h / 2;
  const out = [];
  for (let i = 0; i < N; i++) out.push(top + i * pitch + slitW / 2);
  return out;
}

function drawMask() {
  const PX_PER_UM = 7;
  if (st.mode === 'davisson') {
    drawCrystal();
    return;
  }
  const mask_h = 360;
  const slitW_px = Math.max(2, st.a_um * PX_PER_UM);
  const pitch_px = Math.max(slitW_px + 1, st.d_um * PX_PER_UM);
  const N = effectiveN();
  const total_h = (N - 1) * pitch_px + slitW_px;
  const top = AXIS_Y - total_h / 2;
  ctx.fillStyle = 'rgba(60, 70, 90, 0.95)';
  ctx.fillRect(MASK_X - 8, AXIS_Y - mask_h / 2, 16, mask_h);
  ctx.fillStyle = '#04060c';
  for (let i = 0; i < N; i++) {
    const y0 = top + i * pitch_px;
    ctx.fillRect(MASK_X - 8, y0, 16, slitW_px);
  }
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < N; i++) {
    const y0 = top + i * pitch_px;
    ctx.strokeRect(MASK_X - 8.5, y0 - 0.5, 17, slitW_px + 1);
  }
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${N} slits, a=${st.a_um.toFixed(1)} um, d=${st.d_um.toFixed(1)} um`, MASK_X - 70, AXIS_Y + mask_h / 2 + 16);
}

function drawCrystal() {
  ctx.strokeStyle = 'rgba(100, 200, 240, 0.65)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const x = MASK_X - 60 + i * 15;
      const y = AXIS_Y - 60 + j * 15;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(120, 220, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Ni (111) lattice, d = 2.15 Angstrom', MASK_X - 78, AXIS_Y + 90);
}

function drawScreen() {
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(SCREEN_X, AXIS_Y - SCREEN_HALF);
  ctx.lineTo(SCREEN_X, AXIS_Y + SCREEN_HALF);
  ctx.stroke();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('screen', SCREEN_X + 6, AXIS_Y - SCREEN_HALF - 8);
}

// Incident spherical wavefronts from the point source to the slit mask: the
// coherent illumination that makes the slits secondary Huygens sources. Fills
// the source-to-mask gap and motivates why all slits radiate in phase.
function drawIncidentWave() {
  const lam = lambda_m();
  const col = wavelengthRGB(lam);
  const max_r = MASK_X - SRC_X;
  const r0 = ((st.t * 200) % 50 + 50) % 50;
  ctx.lineWidth = 1;
  for (let r = r0; r < max_r; r += 50) {
    if (r < 0.5) continue;
    const alpha = 0.13 - 0.08 * (r / max_r);
    if (alpha <= 0) continue;
    ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(SRC_X, AXIS_Y, r, -Math.PI / 2.4, Math.PI / 2.4);
    ctx.stroke();
  }
}

function drawWaveField() {
  const N = effectiveN();
  const lam = lambda_m();
  const a = a_m();
  const d = effectiveD_m();
  const thetaMax = visualThetaMax();
  const N_PTS = 220;
  let Imax = 0.001;
  const Is = [];
  for (let k = 0; k < N_PTS; k++) {
    const theta = -thetaMax + 2 * thetaMax * (k / (N_PTS - 1));
    const I = intensity(theta, N, a, d, lam);
    Is.push({ theta, I });
    if (I > Imax) Imax = I;
  }
  const ribbonW = 16;
  for (const p of Is) {
    const y = thetaToYpx(p.theta);
    const u = Math.min(1, p.I / Imax);
    const col = wavelengthRGB(lam);
    ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${(0.15 + 0.85 * u).toFixed(3)})`;
    ctx.fillRect(SCREEN_X - ribbonW, y - 1, ribbonW * 2, 2);
  }
  ctx.strokeStyle = `rgba(${wavelengthRGB(lam).r}, ${wavelengthRGB(lam).g}, ${wavelengthRGB(lam).b}, 0.95)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k < N_PTS; k++) {
    const u = Math.min(1, Is[k].I / Imax);
    const xx = SCREEN_X + 24 + u * 160;
    const yy = thetaToYpx(Is[k].theta);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('I(θ)', SCREEN_X + 120, AXIS_Y - SCREEN_HALF - 8);

  const slitYs = slitYsPx();
  ctx.lineWidth = 1;
  const r0 = ((st.t * 200) % 50 + 50) % 50;     // always in [0, 50)
  for (const ys of slitYs) {
    const max_r = SCREEN_X - MASK_X + 80;
    for (let r = r0; r < max_r; r += 50) {
      if (r < 0.5) continue;       // skip degenerate small radii
      const alpha = 0.15 - 0.10 * (r / max_r);
      if (alpha <= 0) continue;
      const col = wavelengthRGB(lam);
      ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(MASK_X, ys, r, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  }
}

function drawHits() {
  ctx.fillStyle = 'rgba(255, 240, 200, 0.85)';
  for (const y_m of st.hits) {
    const theta = Math.atan(y_m / screen_D_m());
    const y_px = thetaToYpx(theta);
    ctx.fillRect(SCREEN_X - 1.5, y_px - 0.7, 3, 1.4);
  }
  if (st.hits.length === 0) return;
  const N_BINS = 80;
  const thetaMax = visualThetaMax();
  const bins = new Array(N_BINS).fill(0);
  for (const y_m of st.hits) {
    const theta = Math.atan(y_m / screen_D_m());
    const u = (theta + thetaMax) / (2 * thetaMax);
    const idx = Math.floor(u * N_BINS);
    if (idx >= 0 && idx < N_BINS) bins[idx]++;
  }
  const maxBin = Math.max(1, ...bins);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.7)';
  for (let k = 0; k < N_BINS; k++) {
    const y_top = (k / N_BINS) * 2 * SCREEN_HALF + AXIS_Y - SCREEN_HALF;
    const y_bot = ((k + 1) / N_BINS) * 2 * SCREEN_HALF + AXIS_Y - SCREEN_HALF;
    const w = (bins[k] / maxBin) * 160;
    ctx.fillRect(SCREEN_X + 24, y_top, w, y_bot - y_top - 1);
  }
  const N = effectiveN();
  const lam = lambda_m();
  const a = a_m();
  const d = effectiveD_m();
  let Imax = 0.001;
  const ths = [];
  for (let k = 0; k < N_BINS; k++) {
    const u = (k + 0.5) / N_BINS;
    const theta = -thetaMax + 2 * thetaMax * u;
    const I = intensity(theta, N, a, d, lam);
    ths.push({ theta, I });
    if (I > Imax) Imax = I;
  }
  ctx.strokeStyle = 'rgba(255, 255, 220, 0.95)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < ths.length; k++) {
    const u = Math.min(1, ths[k].I / Imax);
    const xx = SCREEN_X + 24 + u * 160;
    const yy = thetaToYpx(ths[k].theta);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${st.hits.length} hits`, SCREEN_X + 120, AXIS_Y - SCREEN_HALF + 10);
}

function drawParticles() {
  ctx.fillStyle = 'rgba(255, 240, 200, 0.95)';
  for (const p of st.particles) {
    const u = p.s;
    const x = SRC_X + u * (SCREEN_X - SRC_X);
    let y = AXIS_Y;
    if (u < 0.4) y = AXIS_Y + (p.startY - AXIS_Y) * (u / 0.4);
    else if (u < 0.6) y = p.startY;
    else {
      const v = (u - 0.6) / 0.4;
      y = p.startY + (p.targetY - p.startY) * v;
    }
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

function stepParticles(dt) {
  if (st.mode !== 'particles' && st.mode !== 'davisson') return;
  st._spawnAcc = (st._spawnAcc || 0) + dt * st.rate;
  while (st._spawnAcc > 1) {
    st._spawnAcc -= 1;
    spawnOneParticle();
  }
  for (const p of st.particles) p.s += dt * 0.9;
  for (let i = st.particles.length - 1; i >= 0; i--) {
    if (st.particles[i].s >= 1) {
      st.hits.push(st.particles[i].y_m_hit);
      if (st.hits.length > st.maxHits) st.hits.shift();
      st.particles.splice(i, 1);
    }
  }
}

function spawnOneParticle() {
  const N = effectiveN();
  const a = a_m();
  const d = effectiveD_m();
  const lam = lambda_m();
  const y_m = sampleHit(N, a, d, lam, screen_D_m(), st.rng);
  const slitYs = slitYsPx();
  const startY = slitYs[Math.floor(st.rng() * slitYs.length)];
  const targetY = thetaToYpx(Math.atan(y_m / screen_D_m()));
  st.particles.push({ s: 0, startY, targetY, y_m_hit: y_m });
}

function wavelengthRGB(lam_m) {
  const lam_nm = lam_m * 1e9;
  if (lam_nm < 200) return { r: 180, g: 100, b: 255 };
  if (lam_nm < 380) return { r: 130, g: 90, b: 255 };
  if (lam_nm < 440) {
    const t = (lam_nm - 380) / 60;
    return { r: Math.round(255 * (1 - t) + 50 * t), g: 0, b: 255 };
  }
  if (lam_nm < 490) {
    const t = (lam_nm - 440) / 50;
    return { r: 0, g: Math.round(255 * t), b: 255 };
  }
  if (lam_nm < 510) {
    const t = (lam_nm - 490) / 20;
    return { r: 0, g: 255, b: Math.round(255 * (1 - t)) };
  }
  if (lam_nm < 580) {
    const t = (lam_nm - 510) / 70;
    return { r: Math.round(255 * t), g: 255, b: 0 };
  }
  if (lam_nm < 645) {
    const t = (lam_nm - 580) / 65;
    return { r: 255, g: Math.round(255 * (1 - t)), b: 0 };
  }
  if (lam_nm < 780) return { r: 255, g: 0, b: 0 };
  return { r: 200, g: 0, b: 0 };
}

function drawDavissonRays() {
  const lam = lambda_m();
  const thetaB = braggAngle(1, NICKEL_LATTICE_M, lam);
  if (!isFinite(thetaB)) return;
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SRC_X + 22, AXIS_Y); ctx.lineTo(MASK_X, AXIS_Y); ctx.stroke();
  for (const sign of [+1, -1]) {
    const theta = sign * thetaB;
    const y_end = AXIS_Y - (SCREEN_X - MASK_X) * Math.tan(theta);
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(MASK_X, AXIS_Y); ctx.lineTo(SCREEN_X, y_end); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 240, 200, 0.95)';
    ctx.beginPath(); ctx.arc(SCREEN_X, y_end, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`theta_B = ${(thetaB / DEG).toFixed(1)} deg`, SCREEN_X - 80, y_end + (sign > 0 ? -12 : 18));
  }
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`E = ${st.E_eV} eV gives lambda = ${(lam * 1e10).toFixed(2)} Angstrom`, MASK_X - 80, AXIS_Y + 110);
  ctx.fillText('Davisson and Germer 1927: 54 eV gives theta_B near 23 deg', MASK_X - 80, AXIS_Y + 124);
}

function drawHeader() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 360, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 8.5, 359, 25);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  const labels = {
    wave: 'WAVE FIELD  (continuous intensity)',
    particles: 'PARTICLE ACCUMULATOR  (one at a time)',
    grating: 'GRATING  (N large, principal maxima)',
    davisson: 'DAVISSON & GERMER  (electron crystal)',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

function drawSidePanel() {
  // Bottom readout strip (full width), clear of the beam in the upper region.
  const px = 14, pw = W - 28, ph = 138, py = H - ph - 12;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.textAlign = 'left';
  ctx.fillText('Slit-experiment readout', px + 12, py + 20);

  const theta1 = principalMaximumAngle(1, effectiveD_m(), lambda_m());
  const theta_min = singleSlitFirstMinAngle(a_m(), lambda_m());
  const fields = [
    ['mode', st.mode, '#ffd28a'],
    ['particle', st.particle],
    ['N slits', String(effectiveN())],
    ['lambda (nm)', (lambda_m() * 1e9).toFixed(2)],
    ['a (um)', st.a_um.toFixed(2)],
    ['d (um)', st.d_um.toFixed(2)],
    ['theta_1 (deg)', isFinite(theta1) ? (theta1 / DEG).toFixed(2) : 'n/a'],
    ['env_min (deg)', isFinite(theta_min) ? (theta_min / DEG).toFixed(2) : 'n/a'],
    ['hits', String(st.hits.length)],
  ];
  const cols = 5, colW = (pw - 24) / cols, gridY = py + 52;
  fields.forEach((f, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const cx = px + 14 + c * colW;
    const cy = gridY + r * 44;
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(f[0], cx, cy);
    ctx.fillStyle = f[2] || '#e0e8ff';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(f[1], cx, cy + 16);
  });
}

function updateReadout() {
  rMode.textContent = st.mode;
  rN.textContent = String(effectiveN());
  rLam.textContent = (lambda_m() * 1e9).toFixed(2);
  rAD.textContent = `${st.a_um.toFixed(1)}, ${st.d_um.toFixed(1)}`;
  const theta1 = principalMaximumAngle(1, effectiveD_m(), lambda_m());
  rMax.textContent = isFinite(theta1) ? (theta1 / DEG).toFixed(2) : 'n/a';
}

function draw() {
  drawBackground();
  drawSource();
  drawMask();
  drawScreen();
  if (st.mode === 'wave' || st.mode === 'grating') drawIncidentWave();
  if (st.mode === 'wave' || st.mode === 'grating') drawWaveField();
  if (st.mode === 'particles' || st.mode === 'grating') drawHits();
  if (st.mode === 'particles') drawParticles();
  if (st.mode === 'davisson') drawDavissonRays();
  drawSidePanel();
  drawHeader();
  updateReadout();
}

function readSliders() {
  st.mode = selMode.value;
  st.N = parseInt(sN.value, 10);
  st.a_um = parseFloat(sA.value);
  st.d_um = parseFloat(sD.value);
  st.particle = selParticle.value;
  st.lambda_nm = parseFloat(sLambda.value);
  st.E_eV = parseFloat(sE.value);
  st.rate = parseInt(sRate.value, 10);
  vMode.textContent = st.mode.slice(0, 5);
  vN.textContent = String(st.N);
  vA.textContent = st.a_um.toFixed(1);
  vD.textContent = st.d_um.toFixed(1);
  vParticle.textContent = (st.particle === 'electron') ? 'e' : 'ph';
  vLambda.textContent = String(st.lambda_nm);
  vE.textContent = String(st.E_eV);
  vRate.textContent = String(st.rate);
}

[selMode, sN, sA, sD, selParticle, sLambda, sE, sRate].forEach(el => el.addEventListener('input', () => { readSliders(); }));
selMode.addEventListener('change', () => { readSliders(); st.hits = []; st.particles = []; });
selParticle.addEventListener('change', () => { readSliders(); st.hits = []; });
btnReset.addEventListener('click', () => { st.hits = []; st.particles = []; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  n_slits: { get: () => st.N, set: v => { st.N = parseInt(v, 10); sN.value = v; }, parse: parseInt },
  slit_width_um: { get: () => st.a_um, set: v => { st.a_um = parseFloat(v); sA.value = v; }, parse: parseFloat },
  slit_pitch_um: { get: () => st.d_um, set: v => { st.d_um = parseFloat(v); sD.value = v; }, parse: parseFloat },
  wavelength_nm: { get: () => st.lambda_nm, set: v => { st.lambda_nm = parseFloat(v); sLambda.value = v; }, parse: parseFloat },
  particle: { get: () => st.particle, set: v => { st.particle = v; selParticle.value = v; }, parse: x => x },
  mode: { get: () => st.mode, set: v => { st.mode = v; selMode.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function captureModeForFraction(f) {
  if (f < 0.1) return 'wave';
  if (f < 0.35) return 'particles';
  if (f < 0.6) return 'grating';
  if (f < 0.85) return 'davisson';
  return 'wave';
}

if (CAPTURE_NAME) {
  st.mode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = st.mode;
  if (st.mode === 'davisson') {
    st.particle = 'electron';
    selParticle.value = 'electron';
  }
  readSliders();
  if (st.mode === 'particles' || st.mode === 'grating') {
    for (let i = 0; i < 1500; i++) {
      const y_m = sampleHit(effectiveN(), a_m(), effectiveD_m(), lambda_m(), screen_D_m(), st.rng);
      st.hits.push(y_m);
    }
  }
  st.t = 1.2;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      st.t += dt;
      stepParticles(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const theta1 = principalMaximumAngle(1, effectiveD_m(), lambda_m());
  return {
    fields: [
      { key: 'mode', label: 'Experiment mode', value: st.mode, format: undefined },
      { key: 'wavelength', label: 'Wavelength (nm)', value: lambda_m() * 1e9, format: 'float' },
      { key: 'n-slits', label: 'Number of slits', value: effectiveN(), format: 'float' },
      { key: 'theta-1', label: 'First max (deg)', value: isFinite(theta1) ? theta1 / DEG : 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const lam = lambda_m();
  const N = effectiveN();
  const a = a_m();
  const d = effectiveD_m();
  const theta1 = principalMaximumAngle(1, d, lam);
  const wavelength_reasonable = lam > 1e-12 && lam < 1e-5;
  return [
    {
      key: 'wavelength-physical',
      label: 'Wavelength in [1 pm, 10 um]',
      value: wavelength_reasonable ? 'pass' : `${(lam * 1e12).toFixed(2)} pm`,
      status: wavelength_reasonable ? 'pass' : 'drift'
    }
  ];
};
