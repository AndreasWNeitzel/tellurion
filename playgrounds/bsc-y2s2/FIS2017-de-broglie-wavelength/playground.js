// de Broglie wavelength made physical: a matter-wave double-slit
// experiment. Particles of the chosen species and kinetic energy are
// fired one at a time at a double slit; each lands stochastically with
// probability set by the two-slit intensity for lambda = h/p, so the
// interference pattern builds up dot by dot. Heavier or faster particles
// have a shorter lambda and tighter (eventually unresolvable) fringes.
// A compact lambda(T) strip keeps the quantitative curve. sim.js is
// unchanged; deBroglieNm drives the fringe spacing.

import { PARTICLES, deBroglieNm } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const SEED           = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLam  = document.getElementById('readout-lam');
const readoutRel  = document.getElementById('readout-rel');
const selectSpecies = document.getElementById('select-species');
const sliderLogT    = document.getElementById('slider-logT');
const valueSpecies  = document.getElementById('value-species');
const valueLogT     = document.getElementById('value-logT');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);

let species = selectSpecies.value;
let logT    = parseFloat(sliderLogT.value);

// Apparatus (fixed): slit separation d and width a, in nm; the angular
// half-range of the detector. Fringe structure then depends only on lambda.
const D_NM = 52, A_NM = 13, THETA_MAX = 0.05;
const NBIN = 220;
let hist = new Float64Array(NBIN);
let total = 0;
const flyers = [];

function currentParticle() { return PARTICLES.find(p => p.name === species) || PARTICLES[1]; }
function lambdaNm() { return deBroglieNm(Math.pow(10, logT), currentParticle().mEv); }

// Two-slit intensity (single-slit envelope x cosine fringes) at fractional
// screen position u in [-1, 1] for the current wavelength.
function intensity(u, lam) {
  const s = u * THETA_MAX;                       // sin(theta) ~ theta
  const beta = Math.PI * A_NM * s / lam;
  const delta = Math.PI * D_NM * s / lam;
  const env = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
  return env * Math.cos(delta) * Math.cos(delta);
}

function resetPattern() { hist = new Float64Array(NBIN); total = 0; flyers.length = 0; }

selectSpecies.addEventListener('change', () => {
  species = selectSpecies.value; valueSpecies.textContent = species; resetPattern();
});
sliderLogT.addEventListener('input', () => {
  logT = parseFloat(sliderLogT.value); valueLogT.textContent = logT.toFixed(2); resetPattern();
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:    css.getPropertyValue('--bg').trim() || '#060608',
    fg:    css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent:css.getPropertyValue('--accent').trim() || '#ffd166',
    grid:  '#23252a',
  };
}

// Sample a landing position from the interference distribution.
function sampleLanding(lam) {
  for (let it = 0; it < 60; it += 1) {
    const u = 2 * rng() - 1;
    if (rng() < intensity(u, lam)) return u;
  }
  return 2 * rng() - 1;
}

function spawnFlyer(lam, instant) {
  const u = sampleLanding(lam);
  const slit = rng() < 0.5 ? -1 : 1;
  flyers.push({ u, slit, t: instant ? 1 : 0 });
}

const SCENE_H = H * 0.66;
const SX = 46, XB = W * 0.40, XS = W * 0.80;
const CY = SCENE_H * 0.5;

function landY(u) { return CY + u * (SCENE_H * 0.42); }

function drawScene(c, lam, part) {
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, W, SCENE_H);

  // Source.
  const sg = ctx.createRadialGradient(SX, CY, 0, SX, CY, 14);
  sg.addColorStop(0, part.color); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(SX, CY, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = part.color; ctx.beginPath(); ctx.arc(SX, CY, 4, 0, 2 * Math.PI); ctx.fill();

  // Incoming plane matter-wave (wavefronts) up to the barrier. Pixel
  // wavelength is a log-compressed view of the true lambda so the change
  // with energy and species is visible across the huge dynamic range.
  const lamPx = Math.max(4, Math.min(60, 10 * (Math.log10(lam) + 7)));
  ctx.strokeStyle = `${part.color}55`; ctx.lineWidth = 1;
  for (let x = SX + 10; x < XB; x += lamPx) {
    ctx.beginPath(); ctx.moveTo(x, CY - SCENE_H * 0.34); ctx.lineTo(x, CY + SCENE_H * 0.34); ctx.stroke();
  }

  // Double-slit barrier.
  const slitY = [CY - 22, CY + 22];
  ctx.fillStyle = '#2a2d36';
  ctx.fillRect(XB - 4, 8, 8, SCENE_H - 16);
  ctx.fillStyle = '#05060c';
  for (const sy of slitY) ctx.fillRect(XB - 4, sy - 6, 8, 12);

  // Detector screen.
  ctx.fillStyle = '#1a1c22';
  ctx.fillRect(XS, 8, 6, SCENE_H - 16);

  // Accumulated hits as a glow column on the screen.
  let hmax = 1;
  for (let i = 0; i < NBIN; i += 1) if (hist[i] > hmax) hmax = hist[i];
  for (let i = 0; i < NBIN; i += 1) {
    if (hist[i] === 0) continue;
    const u = (i / (NBIN - 1)) * 2 - 1;
    const y = landY(u);
    const a = hist[i] / hmax;
    ctx.fillStyle = `rgba(${hexToRgb(part.color)},${0.15 + 0.8 * a})`;
    ctx.fillRect(XS + 7, y - 1.5, 6 + 26 * a, 3);
  }

  // Analytic intensity overlay (the limiting fringe pattern).
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k <= 200; k += 1) {
    const u = (k / 200) * 2 - 1;
    const I = intensity(u, lam);
    const x = XS + 7 + 32 * I;
    const y = landY(u);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Particles in flight: source -> a slit -> its landing point.
  for (const f of flyers) {
    const sy = f.slit < 0 ? slitY[0] : slitY[1];
    let x, y;
    if (f.t < 0.5) { const r = f.t / 0.5; x = SX + (XB - SX) * r; y = CY + (sy - CY) * r; }
    else { const r = (f.t - 0.5) / 0.5; x = XB + (XS - XB) * r; y = sy + (landY(f.u) - sy) * r; }
    ctx.fillStyle = part.color;
    ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 2 * Math.PI); ctx.fill();
  }

  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`${part.name} matter-wave double slit  lambda = ${lam.toExponential(2)} nm`, 12, 18);
  ctx.fillStyle = c.muted; ctx.textAlign = 'right';
  ctx.fillText(`detections: ${total}`, W - 12, 18);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(total < 40 ? 'single hits look random...' :
               (lam < D_NM * THETA_MAX * 0.04 ? 'lambda too short: fringes unresolved (classical)'
                                              : 'an interference pattern emerges'),
               12, SCENE_H - 12);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const TMIN_LOG = -3, TMAX_LOG = 12, LMIN_LOG = -8, LMAX_LOG = 4;
function drawCurve(c) {
  const top = SCENE_H;
  ctx.fillStyle = c.bg; ctx.fillRect(0, top, W, H - top);
  const padL = 56, padR = 14, padT = 12, padB = 26;
  const x0 = padL, x1 = W - padR, y0 = top + padT, y1 = H - padB;
  const xFor = (lT) => x0 + (x1 - x0) * (lT - TMIN_LOG) / (TMAX_LOG - TMIN_LOG);
  const yFor = (lL) => y1 - (y1 - y0) * (lL - LMIN_LOG) / (LMAX_LOG - LMIN_LOG);

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let lT = TMIN_LOG; lT <= TMAX_LOG; lT += 3) {
    const x = xFor(lT);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(`1e${lT}`, x, y1 + 14);
  }
  ctx.textAlign = 'left'; ctx.fillStyle = c.muted;
  ctx.fillText('lambda (nm) vs T (eV)', 10, y0 + 8);

  for (const p of PARTICLES) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.name === species ? 2.4 : 1;
    ctx.globalAlpha = p.name === species ? 1 : 0.4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 200; i += 1) {
      const lT = TMIN_LOG + (TMAX_LOG - TMIN_LOG) * i / 200;
      const lam = deBroglieNm(Math.pow(10, lT), p.mEv);
      if (!Number.isFinite(lam) || lam <= 0) continue;
      const lL = Math.log10(lam);
      if (lL < LMIN_LOG || lL > LMAX_LOG) { started = false; continue; }
      const xx = xFor(lT), yy = yFor(lL);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const part = currentParticle();
  const lam = lambdaNm();
  if (Number.isFinite(lam) && lam > 0) {
    const lL = Math.log10(lam);
    if (lL >= LMIN_LOG && lL <= LMAX_LOG) {
      ctx.fillStyle = part.color;
      ctx.beginPath(); ctx.arc(xFor(logT), yFor(lL), 5, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = c.fg; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  const part = currentParticle();
  const lam = lambdaNm();
  drawScene(c, lam, part);
  drawCurve(c);
}

function updateReadout() {
  const part = currentParticle();
  const T = Math.pow(10, logT);
  const lam = deBroglieNm(T, part.mEv);
  readoutLam.textContent = Number.isFinite(lam) ? lam.toExponential(3) : '--';
  readoutRel.textContent = part.mEv === 0 ? 'photon' : (T / part.mEv).toExponential(2);
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const lam = lambdaNm();
  // Emit a steady stream; advance and retire flyers, recording detections.
  if (flyers.length < 7 && rng() < 0.6) spawnFlyer(lam, false);
  for (let k = flyers.length - 1; k >= 0; k -= 1) {
    const f = flyers[k];
    f.t += dt * 1.4;
    if (f.t >= 1) {
      const bin = Math.max(0, Math.min(NBIN - 1, Math.round((f.u + 1) / 2 * (NBIN - 1))));
      hist[bin] += 1; total += 1;
      flyers.splice(k, 1);
    }
  }
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const names = ['photon', 'electron', 'proton', 'neutron', 'C-12'];
    species = names[Math.min(names.length - 1, Math.round(frac * (names.length - 1)))];
    selectSpecies.value = species;
    logT = -3 + 15 * frac;
    sliderLogT.value = String(logT);
    valueSpecies.textContent = species;
    valueLogT.textContent = logT.toFixed(2);
    resetPattern();
    // Build a deterministic pattern so the still shows the fringes.
    const lam = lambdaNm();
    const Nsamp = 2400;
    for (let i = 0; i < Nsamp; i += 1) {
      const u = sampleLanding(lam);
      const bin = Math.max(0, Math.min(NBIN - 1, Math.round((u + 1) / 2 * (NBIN - 1))));
      hist[bin] += 1; total += 1;
    }
    for (let i = 0; i < 5; i += 1) spawnFlyer(lam, false);
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  valueSpecies.textContent = species;
  valueLogT.textContent = logT.toFixed(2);
  render();
  updateReadout();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const T = Math.pow(10, logT);
  const particle = PARTICLES.find(p => p.name === species) || PARTICLES[1];
  const lam = deBroglieNm(T, particle.mEv);
  const slit_sep = D_NM, slit_width = A_NM;
  return {
    fields: [
      { key: 'species', label: 'Particle species', value: species, format: undefined },
      { key: 'log-kinetic-energy', label: 'log10(T [eV])', value: logT, format: 'float' },
      { key: 'de-broglie-wavelength', label: 'de Broglie lambda (nm)', value: lam, format: 'float' },
      { key: 'slit-separation', label: 'Slit separation (nm)', value: slit_sep, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const T = Math.pow(10, logT);
  const particle = PARTICLES.find(p => p.name === species) || PARTICLES[1];
  const lam = deBroglieNm(T, particle.mEv);
  const fringe_count = (D_NM / lam) * THETA_MAX;
  const visible_fringes = fringe_count > 1 ? 'yes' : 'no';
  return [
    {
      key: 'double-slit-interference',
      label: 'Observable interference pattern',
      value: visible_fringes ? 'visible' : 'too-fine',
      status: fringe_count > 1 ? 'pass' : 'pending'
    }
  ];
};
