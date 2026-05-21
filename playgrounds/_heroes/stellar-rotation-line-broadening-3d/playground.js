// Stellar rotation + line broadening playground. Canvas2D render of a
// rotating limb-darkened sphere coloured by line-of-sight velocity,
// next to the broadened-line profile. See sim.js for the closed-form
// summation and references.

import { broadenedLine, gaussianLine, limbDarkening, halfWidthHalfDepth } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rVsini = document.getElementById('readout-vsini');
const rHW = document.getElementById('readout-hw');
const sVsini = document.getElementById('slider-vsini'), vVsiniLab = document.getElementById('value-vsini');
const sSigma = document.getElementById('slider-sigma'), vSigmaLab = document.getElementById('value-sigma');
const sDepth = document.getElementById('slider-depth'), vDepthLab = document.getElementById('value-depth');
const sInc = document.getElementById('slider-inc'), vIncLab = document.getElementById('value-inc');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  vsiniKmS: 30, sigma: 0.012, depth: 0.7, inc: 90, running: !prefersReducedMotion(),
  phase: 0, profile: null, wavelengths: null,
};

const NL = 121;
const LAMBDA_RANGE = 0.10;
function initWavelengths() {
  st.wavelengths = new Float64Array(NL);
  for (let i = 0; i < NL; i += 1) {
    st.wavelengths[i] = -LAMBDA_RANGE + (i / (NL - 1)) * 2 * LAMBDA_RANGE;
  }
}
initWavelengths();

function recomputeProfile() {
  // Convert v sin i in km/s to dimensionless v/c. c = 2.998e5 km/s.
  const vsini_c = st.vsiniKmS / 2.998e5;
  st.profile = broadenedLine(st.wavelengths, vsini_c * 30, {
    sigma: st.sigma, depth: st.depth, nx: 48,
  });
  // The factor 30 above maps the sky-x [-1, 1] to the unitless v/c
  // chosen for the model: at vsini_c = 1e-4 (=30 km/s) we want a
  // broadening of order 3e-3 wavelength units, so amplify the
  // dimensionless rotation by 3000 -> shift range +/- 3e-3 * 1 = 3e-3.
  // (Actual scaling is set so the visualization at 30 km/s is visibly
  // broader than the intrinsic sigma=0.012 line.)
}
recomputeProfile();

function drawStar(cx, cy, R) {
  // Render the visible disk colored by Doppler shift v(x) where x is
  // sky-x normalized to [-1, 1] of the disk radius. Limb darkening
  // multiplies the saturation so the limb fades gracefully.
  const inc = (st.inc * Math.PI) / 180;
  const sinI = Math.sin(inc);
  // Doppler colour scale: tie it to the ACTUAL v sin i so the
  // v sin i slider visibly changes the disc colour gradient.
  // 350 km/s maps to the full red/blue endpoints.
  const vsiniNorm = (st.vsiniKmS * sinI) / 350;
  for (let yy = -R; yy <= R; yy += 1) {
    for (let xx = -R; xx <= R; xx += 1) {
      const rr = Math.sqrt(xx * xx + yy * yy);
      if (rr >= R) continue;
      const xn = xx / R, yn = yy / R;
      const mu = Math.sqrt(Math.max(0, 1 - xn * xn - yn * yn));
      const I = limbDarkening(mu);
      // v_LOS along the line of sight = (v sin i) * x_normalised.
      const vLOS = xn * vsiniNorm;
      // Color: red side (+v) hot orange, blue side cool blue.
      const t = Math.max(-1, Math.min(1, vLOS * 1.8));
      let r, g, b;
      if (t >= 0) {
        const u = t;
        r = Math.round(180 + 75 * u);
        g = Math.round(110 + 60 * (1 - u));
        b = Math.round(70 + 30 * (1 - u));
      } else {
        const u = -t;
        r = Math.round(80 + 60 * (1 - u));
        g = Math.round(140 + 90 * (1 - u));
        b = Math.round(220 + 35 * u);
      }
      // Limb darken via brightness.
      const k = 0.35 + 0.65 * I;
      ctx.fillStyle = `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
      ctx.fillRect(cx + xx, cy + yy, 1, 1);
    }
  }
  // Rotating star spots: small dark patches carried around the
  // rotation axis at an angular rate proportional to v sin i. They
  // make the rotation speed directly visible (the disc itself is
  // otherwise axisymmetric). Spots near the limb foreshorten.
  const spotPhase = st.spotPhase || 0;
  for (let s = 0; s < 4; s += 1) {
    const lat = [-0.4, 0.1, 0.45, -0.15][s];        // spot latitudes
    const lon0 = (s / 4) * 2 * Math.PI;
    const lon = lon0 + spotPhase;
    // Spherical -> sky: x = cos(lat) sin(lon), depth = cos(lat) cos(lon).
    const sx = Math.cos(lat) * Math.sin(lon);
    const depth = Math.cos(lat) * Math.cos(lon);
    if (depth < 0) continue;                         // on far side
    const syv = Math.sin(lat) * sinI - Math.cos(lat) * Math.cos(lon) * Math.cos(inc) * 0 + Math.sin(lat);
    const skyY = Math.sin(lat);
    const px = cx + sx * R;
    const py = cy - skyY * R;
    const spotR = (3 + 2 * depth) * (0.5 + 0.5 * depth);
    ctx.fillStyle = `rgba(40, 25, 20, ${(0.35 * depth).toFixed(2)})`;
    ctx.beginPath(); ctx.ellipse(px, py, spotR * depth, spotR, 0, 0, 2 * Math.PI); ctx.fill();
  }
  // Equator and rotation axis indicators.
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.05); ctx.lineTo(cx, cy + R * 1.05); ctx.stroke();
}

function drawProfilePanel(x0, y0, w, h) {
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const pad = { l: 50, r: 12, t: 18, b: 30 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('F / F_continuum', x0 + 10, ay - 4);
  ctx.textAlign = 'center';
  ctx.fillText('Δλ (nm)', ax + aw / 2, y0 + h - 8);

  const xToPx = (lam) => ax + (lam + LAMBDA_RANGE) / (2 * LAMBDA_RANGE) * aw;
  const yToPx = (f) => ay + (1 - (f - 0.2) / 0.8) * ah;     // y range 0.2 - 1.0

  // Y-axis ticks.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  for (const y of [0.4, 0.6, 0.8, 1.0]) {
    ctx.fillText(y.toFixed(1), ax - 4, yToPx(y) + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.moveTo(ax, yToPx(y)); ctx.lineTo(ax + aw, yToPx(y)); ctx.stroke();
  }

  // Non-rotating Gaussian reference (gold).
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < NL; i += 1) {
    const lam = st.wavelengths[i];
    const f = gaussianLine(lam, 0, st.sigma, st.depth);
    if (i === 0) ctx.moveTo(xToPx(lam), yToPx(f)); else ctx.lineTo(xToPx(lam), yToPx(f));
  }
  ctx.stroke();

  // Broadened profile (red).
  ctx.strokeStyle = 'rgba(255, 130, 130, 0.95)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < NL; i += 1) {
    const lam = st.wavelengths[i];
    if (i === 0) ctx.moveTo(xToPx(lam), yToPx(st.profile[i])); else ctx.lineTo(xToPx(lam), yToPx(st.profile[i]));
  }
  ctx.stroke();

  // Legend.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 209, 102, 0.95)';
  ctx.fillText('non-rotating', ax + aw - 110, ay + 14);
  ctx.fillStyle = 'rgba(255, 130, 130, 1)';
  ctx.fillText('rotating', ax + aw - 110, ay + 28);
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Star on the left.
  const R = 130;
  drawStar(220, 200, R);

  // Top-left small labels.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`v sin i = ${st.vsiniKmS.toFixed(0)} km/s    i = ${st.inc.toFixed(0)}°`, 24, 22);
  ctx.fillText('blue limb approaches → blueshift; red limb recedes → redshift', 24, 40);

  // Profile panel right + below.
  drawProfilePanel(420, 30, 460, 360);

  // HWHD readout.
  const hw = halfWidthHalfDepth(st.wavelengths, st.profile, st.depth);
  rVsini.textContent = `${st.vsiniKmS.toFixed(0)} km/s`;
  rHW.textContent = `${(hw / st.sigma).toFixed(2)}`;

  // Caption strip at bottom.
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('the line shape is the limb-darkened sum of every disk element\'s Doppler-shifted Gaussian', W / 2, H - 14);
}

function tick() {
  if (st.running) {
    st.phase += 0.02;
    // Advance the star-spot rotation phase at a rate proportional to
    // v sin i, so the v sin i slider visibly speeds up the surface
    // rotation (the spots carried around the disc).
    st.spotPhase = (st.spotPhase || 0) + 0.0006 * st.vsiniKmS;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vVsiniLab.textContent = String(st.vsiniKmS);
  vSigmaLab.textContent = st.sigma.toFixed(3);
  vDepthLab.textContent = st.depth.toFixed(2);
  vIncLab.textContent = String(st.inc);
}

sVsini.addEventListener('input', () => { st.vsiniKmS = parseInt(sVsini.value, 10); recomputeProfile(); syncLabels(); });
sSigma.addEventListener('input', () => { st.sigma = parseFloat(sSigma.value); recomputeProfile(); syncLabels(); });
sDepth.addEventListener('input', () => { st.depth = parseFloat(sDepth.value); recomputeProfile(); syncLabels(); });
sInc.addEventListener('input', () => { st.inc = parseInt(sInc.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.vsiniKmS = 30; st.sigma = 0.012; st.depth = 0.7; st.inc = 90; st.running = true;
  sVsini.value = '30'; sSigma.value = '0.012'; sDepth.value = '0.7'; sInc.value = '90';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  recomputeProfile(); syncLabels(); render();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { vsini: st.vsiniKmS, sigma: st.sigma, inclination: st.inc }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.vsini) { st.vsiniKmS = parseInt(s.vsini, 10); sVsini.value = String(st.vsiniKmS); }
  if (s.sigma) { st.sigma = parseFloat(s.sigma); sSigma.value = String(st.sigma); }
  if (s.inclination) { st.inc = parseInt(s.inclination, 10); sInc.value = String(st.inc); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep v sin i across the 5 captures so the line visibly widens.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.vsiniKmS = Math.round(5 + f * 100);
    sVsini.value = String(st.vsiniKmS);
    syncLabels();
    recomputeProfile();
  }
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
