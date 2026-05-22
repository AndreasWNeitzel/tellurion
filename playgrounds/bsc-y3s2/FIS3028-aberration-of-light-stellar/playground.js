import { fontString } from '../../../shared/js/canvas-type.js';
// Stellar aberration playground. The primary scene is now a 3D POV
// sky as the observer accelerates: a procedural star field on a unit
// sphere is boosted along +x by speed beta = v/c, and each star's
// apparent angle in the observer's frame is mapped onto the screen.
// As beta grows, stars STREAM forward into a tight cone (the visible
// effect on a relativistic ship). The original polar plot is demoted
// to a small inset diagnostic.

import {
  thetaObs, aberrationShift, BETA_EARTH_ORBIT,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutAs    = document.getElementById('readout-as');
const readoutAp    = document.getElementById('readout-ap');

const sliderLogB = document.getElementById('slider-logb');
const valueLogB  = document.getElementById('value-logb');

let logBeta = parseFloat(sliderLogB.value);
sliderLogB.addEventListener('input', () => { logBeta = parseFloat(sliderLogB.value); valueLogB.textContent = logBeta.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    grid:   '#23252a',
  };
}

const RAD_TO_AS = 180 * 3600 / Math.PI;

// Deterministic procedural star field on a unit sphere. Mulberry32
// seeded once so the goldens are stable.
function mulb(seed) { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const STAR_FIELD = (() => {
  const rnd = mulb(0xAB17AB5);
  const stars = [];
  for (let i = 0; i < 360; i += 1) {
    // Uniform on the sphere
    const u = 2 * rnd() - 1, phi = 2 * Math.PI * rnd();
    const s = Math.sqrt(1 - u * u);
    stars.push({
      x: s * Math.cos(phi), y: s * Math.sin(phi), z: u,
      mag: 0.3 + 0.7 * rnd(),
      hue: 0.5 + 0.5 * rnd(),
    });
  }
  return stars;
})();

// Relativistic aberration of a star whose rest-frame direction (in
// the lab frame, with motion along +x) is (sx, sy, sz). For an
// observer moving at speed beta along +x the boosted direction is
//   cos(theta') = (cos(theta) + beta) / (1 + beta cos(theta)),
// where cos(theta) = sx (angle from +x). This is the forward
// transform: as beta grows the stars stream toward +x and crowd
// into the direction of motion. (The minus-sign form is the inverse
// de-aberration and made the stars stream backward.)
// The (sy, sz) components are scaled so the unit vector stays
// normalised in the boosted frame.
function aberrate(sx, sy, sz, beta) {
  const cosTheta = sx;
  const cosThetaP = (cosTheta + beta) / (1 + beta * cosTheta);
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  const sinThetaP = Math.sqrt(Math.max(0, 1 - cosThetaP * cosThetaP));
  // Preserve azimuth around the +x axis
  const aziScale = sinTheta > 1e-9 ? sinThetaP / sinTheta : 0;
  return [cosThetaP, sy * aziScale, sz * aziScale];
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width, H = canvas.height;
  const beta = Math.pow(10, logBeta);

  // 3D POV sky: each star is aberrated by beta toward +x (direction of
  // motion), then projected with a wide-FOV perspective onto the screen.
  // Stars behind the observer (cos(theta') < some threshold) are
  // culled. Forward streaming is the visible effect.
  const fovDeg = 70, fov = fovDeg * Math.PI / 180;
  const f = 1 / Math.tan(fov / 2);                       // focal length
  const pxK = Math.min(W, H) * 0.5;                      // pixel scale
  ctx.save();
  for (const s of STAR_FIELD) {
    const [bx, by, bz] = aberrate(s.x, s.y, s.z, beta);
    if (bx <= 0.05) continue;                            // behind the observer
    // Project onto screen with the +x axis pointing into the page.
    // Screen-x is the +y world component (azimuth around motion axis),
    // screen-y is the +z component (height above the motion plane).
    const screenX = W / 2 + pxK * f * by / bx;
    const screenY = H / 2 - pxK * f * bz / bx;
    if (screenX < -20 || screenX > W + 20 || screenY < -20 || screenY > H + 20) continue;
    // Brightness scales with the Doppler factor cubed (intensity boost
    // for forward-moving sources) so the on-axis sky brightens at
    // high beta. Cap at the rendering range.
    const D = 1 / (Math.sqrt(Math.max(1e-9, 1 - beta * beta)) * (1 - beta * bx));
    const bright = Math.min(1.0, s.mag * Math.pow(D, 0.6));
    const blue = Math.round(180 + 75 * s.hue);
    const red  = Math.round(220 - 80 * (1 - s.hue));
    ctx.fillStyle = `rgba(${red}, ${Math.round(200 + 30 * s.hue)}, ${blue}, ${bright})`;
    const r = 1.0 + 1.2 * bright;
    ctx.beginPath(); ctx.arc(screenX, screenY, r, 0, 6.2832); ctx.fill();
    // For inner stars, draw a glow halo.
    if (bright > 0.55) {
      const g = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r * 4);
      g.addColorStop(0, `rgba(${red}, ${Math.round(220 * s.hue + 220 * (1 - s.hue))}, ${blue}, ${0.25 * bright})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(screenX, screenY, r * 4, 0, 6.2832); ctx.fill();
    }
  }
  ctx.restore();

  // Crosshair marking the direction of motion (+x): the point on the
  // sky directly ahead of the ship.
  ctx.strokeStyle = 'rgba(255, 220, 130, 0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 14, H / 2); ctx.lineTo(W / 2 + 14, H / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 14); ctx.lineTo(W / 2, H / 2 + 14); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 220, 130, 0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('+v (direction of motion)', W / 2 + 18, H / 2 + 4);

  // INSET: tiny polar diagnostic of rest-vs-observer angles for a
  // few stars. Kept as a quantitative cross-check, demoted to inset.
  const inX = 18, inY = H - 138, inR = 56;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.85)'; ctx.fillRect(inX - 8, inY - 70, inR * 2 + 28, inR * 2 + 26);
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(inX + inR, inY, inR, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('polar diagnostic', inX, inY - 56);
  for (let i = 0; i < 12; i += 1) {
    const tr = 2 * Math.PI * i / 12;
    const to = thetaObs(tr, beta) * (tr > Math.PI ? -1 : 1);
    const trD = tr > Math.PI ? -(2 * Math.PI - tr) : tr;
    const xr = inX + inR + inR * Math.cos(trD), yr = inY - inR * Math.sin(trD);
    const xo = inX + inR + inR * Math.cos(to), yo = inY - inR * Math.sin(to);
    ctx.strokeStyle = 'rgba(255, 210, 100, 0.4)';
    ctx.beginPath(); ctx.moveTo(xr, yr); ctx.lineTo(xo, yo); ctx.stroke();
    ctx.fillStyle = c.blue; ctx.beginPath(); ctx.arc(xr, yr, 1.6, 0, 6.2832); ctx.fill();
    ctx.fillStyle = c.orange; ctx.beginPath(); ctx.arc(xo, yo, 2, 0, 6.2832); ctx.fill();
  }

  // Legend / readout
  ctx.fillStyle = c.fg;
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('3D POV: stars stream forward as v/c grows', 12, 20);
  ctx.fillStyle = c.muted;
  ctx.fillText(`beta = ${beta.toExponential(2)}`, 12, 38);
  ctx.fillStyle = c.accent;
  ctx.fillText(`max aberration = ${(aberrationShift(Math.PI / 2, beta) * RAD_TO_AS).toFixed(2)} arcsec`, 12, 56);
  if (Math.abs(logBeta - Math.log10(BETA_EARTH_ORBIT)) < 0.05) {
    ctx.fillStyle = c.accent;
    ctx.fillText('(this is Earth\'s annual orbital beta)', 12, 74);
  }
}

function updateReadout() {
  const beta = Math.pow(10, logBeta);
  const shift = aberrationShift(Math.PI / 2, beta) * RAD_TO_AS;
  readoutAs.textContent = shift.toFixed(2);
  // Small-beta validity: shift / (beta sin theta) close to 1.
  const ratio = aberrationShift(0.5, beta) / (beta * Math.sin(0.5));
  readoutAp.textContent = Math.abs(ratio - 1) < 0.05 ? 'yes' : 'no';
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logBeta = -6 + 6 * frac;
    sliderLogB.value = String(logBeta);
    valueLogB.textContent = logBeta.toFixed(2);
  }
  valueLogB.textContent = logBeta.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logBeta };
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
  const beta = Math.pow(10, logBeta);
  return { fields: [
    { key: 'observer-velocity', label: 'Observer velocity beta = v/c', value: beta, format: 'float' },
    { key: 'max-aberration-arcsec', label: 'Max aberration (arcsec)', value: aberrationShift(Math.PI / 2, beta) * RAD_TO_AS, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const beta = Math.pow(10, logBeta);
  const abErr = Math.abs(aberrationShift(0.5, beta) / (beta * Math.sin(0.5)) - 1);
  return [
    { key: 'small-angle-approx', label: 'Small-angle approximation holds', value: abErr < 0.05 ? 'pass' : 'drift', status: abErr < 0.05 ? 'pass' : 'drift' },
  ];
}
