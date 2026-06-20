// Exoplanet transit hero. Physics: shared transit engine via ./sim.js
// (Keplerian orbit + limb-darkened transit light curve). Render:
// shared/js/engine-gl/transit-3d.js (limb-darkened star imposter +
// dark planet on the orbit ring). Secondary Canvas2D: the light
// curve (the observable).

import { makeTransit, planetSkyPos, transitFlux, periodFromAxis } from './sim.js';
import { setupTransitGL } from '../../../shared/js/engine-gl/transit-3d.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const diagCanvas = document.getElementById('diag');
const dctx = diagCanvas.getContext('2d');
// Layout: the 3D scene (WebGL, 760x580) sits atop, and below it the
// diagnostic canvas (760x370) contains the light curve and transmission
// spectrum split 50-50. Compute regions within the diagnostic canvas.
let regions = {};
function layoutRegions() {
  regions = stack(diagCanvas, [
    { name: 'plot', weight: 1 },
    { name: 'spectrum', weight: 1 },
  ]);
}
layoutRegions();

// Toy atmospheric model for transmission spectroscopy. The effective
// transit radius depends on wavelength because Rayleigh scattering and
// molecular lines (Na D 589 nm, K 770 nm, H2O bands around 950, 1380,
// 1900 nm) make the atmosphere opaque at those wavelengths so the
// planet looks bigger:
//   Rp(lambda) = Rp + N_atm * H_atm * sigma(lambda)
// with H_atm the atmospheric scale height and N_atm the column-density
// scale. Reference: Seager and Sasselov, ApJ 537 (2000) 916; Madhusudhan,
// ARAA 57 (2019) 617.
const ATMOSPHERE = {
  // wavelength bins, nm
  lam0: 400, lam1: 2000, nBins: 96,
  // cross section "spikes" at known features (centre nm, width nm, strength)
  features: [
    { c: 589,  w: 8,   s: 0.6 },        // Na D doublet
    { c: 770,  w: 10,  s: 0.5 },        // K I
    { c: 950,  w: 60,  s: 0.4 },        // H2O band
    { c: 1380, w: 80,  s: 0.6 },        // H2O band
    { c: 1900, w: 100, s: 0.7 },        // H2O band
  ],
  // Rayleigh scattering: optical depth ~ lambda^{-4}
  rayleighA: 0.18,
};
function sigmaLambda(lambda) {
  let sig = 0;
  for (const f of ATMOSPHERE.features) {
    const z = (lambda - f.c) / f.w;
    sig += f.s * Math.exp(-0.5 * z * z);
  }
  // Rayleigh slope.
  sig += ATMOSPHERE.rayleighA * Math.pow(500 / lambda, 4);
  return sig;
}
function transmissionDepth(lambda, Rp, H_atm_units) {
  // R_eff = Rp + H_atm * sigma(lambda); depth = (R_eff)^2
  const R_eff = Rp + H_atm_units * sigmaLambda(lambda);
  return R_eff * R_eff;
}
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

let engine = null;
try { engine = setupTransitGL(canvas); } catch (e) { console.warn('[transit] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 14, minRadius: 4, maxRadius: 120,
  azimuthDeg: 0, elevationDeg: 0, fovDeg: 35,
  near: 0.05, far: 400,
});
// User feedback: 'star too small'. Star world radius stays at 1 (one
// Rs); the fix is to pull the camera CLOSER so the star takes up
// more screen. We still preserve the (Rp/Rs)^2 transit ratio because
// the planet world radius is also one Rp/Rs world unit and the orbit
// is at one a/Rs world unit (apart from the log compression for
// huge a/Rs).
// View-orbit radius: identity for compact orbits (a/Rs <= 12), gentle
// log compression beyond so an Earth-analogue at a/Rs = 215 still fits.
function viewOrbitRadius(aOverRs) {
  if (aOverRs <= 12) return aOverRs;
  return 12 + 5 * Math.log10(aOverRs / 12);
}
function fitCamera() {
  const A = viewOrbitRadius(ui.aOverRs);
  camera.setRadius(Math.max(8, Math.min(100, A * 2.3)));
}
window.__camera = camera;

const ui = { Rp: 0.1, aOverRs: 6, inc: Math.PI / 2, period: 4, u1: 0.45, u2: 0.20, running: !prefersReducedMotion(), hoverPhase: -1, H_atm: 0.020 };
let sim = makeTransit({ Rp: ui.Rp, a: ui.aOverRs, inc: ui.inc, period: ui.period, u1: ui.u1, u2: ui.u2 });
function resolve() {
  sim = makeTransit({ Rp: ui.Rp, a: ui.aOverRs, inc: ui.inc, period: ui.period, u1: ui.u1, u2: ui.u2 });
  rebuildCurve();
  fitCamera();
}
fitCamera();

const RKEYS = ['phase', 'flux', 'depth (Rp/Rs)^2', 'period', 'inclination', 'transit?'];
const rEls = {};
for (const k of RKEYS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.append(lab, val); rEls[k] = val;
}

function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return inp;
}
const sRp = slider('Rp / Rs', 0.02, 0.25, 0.005, ui.Rp, (v) => v.toFixed(3), (v) => { ui.Rp = v; resolve(); });
const sA = slider('a / Rs', 2, 20, 0.1, ui.aOverRs, (v) => v.toFixed(1), (v) => { ui.aOverRs = v; resolve(); });
const sI = slider('inclination', 0.02, Math.PI / 2, 0.005, ui.inc, (v) => `${(v * 57.3).toFixed(1)} deg`, (v) => { ui.inc = v; resolve(); });
const sP = slider('period', 1.0, 10.0, 0.1, ui.period, (v) => v.toFixed(1), (v) => { ui.period = v; resolve(); });
slider('limb u1', 0, 0.9, 0.02, ui.u1, (v) => v.toFixed(2), (v) => { ui.u1 = v; resolve(); });
slider('limb u2', 0, 0.6, 0.02, ui.u2, (v) => v.toFixed(2), (v) => { ui.u2 = v; resolve(); });
function selRow(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
selRow('preset', ['central transit', 'grazing transit', 'no transit', 'hot Jupiter', 'Earth analogue'], (p) => {
  if (p === 'central transit') Object.assign(ui, { Rp: 0.10, aOverRs: 6, inc: Math.PI / 2, period: 4, u1: 0.45, u2: 0.20 });
  else if (p === 'grazing transit') Object.assign(ui, { Rp: 0.10, aOverRs: 8, inc: Math.PI / 2 - 0.115, period: 4, u1: 0.45, u2: 0.20 });
  else if (p === 'no transit') Object.assign(ui, { Rp: 0.10, aOverRs: 8, inc: Math.PI / 2 - 0.22, period: 4, u1: 0.45, u2: 0.20 });
  else if (p === 'hot Jupiter') Object.assign(ui, { Rp: 0.10, aOverRs: 3.5, inc: Math.PI / 2, period: 2.0, u1: 0.45, u2: 0.20 });
  else Object.assign(ui, { Rp: 0.0092, aOverRs: 215, inc: Math.PI / 2, period: 8.0, u1: 0.45, u2: 0.20 });
  sRp.value = ui.Rp.toFixed(3); sA.value = ui.aOverRs.toFixed(1);
  sP.value = ui.period.toFixed(1); sI.value = ui.inc.toFixed(3);
  resolve();
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bEdge = document.createElement('button'); bEdge.type = 'button'; bEdge.textContent = 'Edge-on';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
btnRow.append(bPause, bEdge, bReset); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bEdge.addEventListener('click', () => { camera.setAzimuthDeg(0); camera.setElevationDeg(0); });
bReset.addEventListener('click', () => { sim.t = 0; });

diagCanvas.addEventListener('pointermove', (e) => {
  const r = diagCanvas.getBoundingClientRect();
  const relY = e.clientY - r.top;
  if (relY >= regions.plot.y && relY < regions.plot.y + regions.plot.h) {
    const relX = e.clientX - r.left;
    ui.hoverPhase = (relX - regions.plot.x) / regions.plot.w;
    ui.hoverPhase = Math.max(0, Math.min(1, ui.hoverPhase));
  } else {
    ui.hoverPhase = -1;
  }
});
diagCanvas.addEventListener('pointerleave', () => { ui.hoverPhase = -1; });

// Light curve over one full period, sampled and cached when params change.
let curve = null;
function rebuildCurve() {
  const N = 600;
  curve = new Float64Array(N);
  for (let i = 0; i < N; i += 1) curve[i] = transitFlux(sim, (i / N) * sim.period);
}

function drawDiagnostics() {
  if (!curve) rebuildCurve();
  const W = diagCanvas.width, H = diagCanvas.height;
  dctx.fillStyle = '#060608'; dctx.fillRect(0, 0, W, H);

  drawLightCurve();
  drawTransmissionSpectrum();
}

function drawLightCurve() {
  const p = regions.plot;
  const x0 = p.x + 8, x1 = p.x + p.w - 8;
  const y0 = p.y + 12, y1 = p.y + p.h - 16;

  dctx.fillStyle = '#060608'; dctx.fillRect(p.x, p.y, p.w, p.h);

  // Axes
  dctx.strokeStyle = '#23252a'; dctx.lineWidth = 0.8;
  dctx.beginPath(); dctx.moveTo(x0, y0); dctx.lineTo(x0, y1); dctx.lineTo(x1, y1); dctx.stroke();

  let fmin = 1, fmax = 1;
  for (let i = 0; i < curve.length; i += 1) {
    if (curve[i] < fmin) fmin = curve[i];
    if (curve[i] > fmax) fmax = curve[i];
  }

  const depth = 1 - fmin;
  const real = depth > 1e-7;
  const fLo = real ? Math.max(0, 1 - 1.4 * depth) : 0.985;
  const fHi = real ? 1 + Math.max(0.12 * depth, 6e-5) : 1.003;
  const yOf = (f) => y0 + (1 - (f - fLo) / (fHi - fLo)) * (y1 - y0);

  // Light curve line
  dctx.strokeStyle = '#5fd0e0'; dctx.lineWidth = 1.6; dctx.beginPath();
  for (let i = 0; i < curve.length; i += 1) {
    const X = x0 + (i / curve.length) * (x1 - x0);
    const Y = yOf(curve[i]);
    if (i === 0) dctx.moveTo(X, Y); else dctx.lineTo(X, Y);
  }
  dctx.stroke();

  // Current phase marker
  const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
  const Xp = x0 + phase * (x1 - x0);
  const Yp = yOf(transitFlux(sim, phase * sim.period));
  dctx.strokeStyle = '#ffd166'; dctx.lineWidth = 0.9;
  dctx.beginPath(); dctx.moveTo(Xp, y0); dctx.lineTo(Xp, y1); dctx.stroke();
  dctx.fillStyle = '#ffd166'; dctx.beginPath();
  dctx.arc(Xp, Yp, 3.5, 0, 6.28); dctx.fill();

  // Hover marker
  if (ui.hoverPhase >= 0 && ui.hoverPhase <= 1) {
    const ph = ui.hoverPhase, hF = transitFlux(sim, ph * sim.period);
    const Xh = x0 + ph * (x1 - x0);
    dctx.strokeStyle = 'rgba(255,255,255,0.4)'; dctx.setLineDash([2, 2]);
    dctx.beginPath(); dctx.moveTo(Xh, y0); dctx.lineTo(Xh, y1); dctx.stroke();
    dctx.setLineDash([]);
  }

  // Labels
  dctx.fillStyle = '#7a818c'; dctx.font = fontString(canvas, 'caption', 'mono');
  dctx.textAlign = 'left'; dctx.fillText('flux vs phase', x0 + 2, p.y + 10);
  dctx.textAlign = 'right'; dctx.fillText(fHi.toFixed(4), x0 - 4, y0 + 3);
  dctx.fillText(fLo.toFixed(4), x0 - 4, y1 + 3);
}

function refreshReadout() {
  const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
  const f = transitFlux(sim, phase * sim.period);
  const p = planetSkyPos(sim, phase * sim.period);
  rEls.phase.textContent = phase.toFixed(3);
  rEls.flux.textContent = f.toFixed(5);
  rEls['depth (Rp/Rs)^2'].textContent = (ui.Rp * ui.Rp).toExponential(2);
  rEls.period.textContent = ui.period.toFixed(2);
  rEls.inclination.textContent = (ui.inc * 57.296).toFixed(2) + ' deg';
  rEls['transit?'].textContent = (p.infront && (p.x * p.x + p.y * p.y) < (1 + sim.Rp) ** 2) ? 'yes' : 'no';
}

function frame() {
  if (engine) {
    const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
    const theta = 2 * Math.PI * phase;
    const A_view = viewOrbitRadius(ui.aOverRs);
    engine.update(theta, A_view, ui.inc, ui.Rp, [1.0, 0.78, 0.50]);
    engine.render(camera.viewMatrix(), camera.projMatrix(canvas.width / canvas.height), ui.u1, ui.u2, camera.state.fovDeg);
  }
  drawDiagnostics(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) sim.t += dt * (ui.period / 14);    // one orbit in ~14 s (slower so the transit is watchable)
  camera.tickIdle(now);
  frame();
  requestAnimationFrame(tick);
}

function drawTransmissionSpectrum() {
  const s = regions.spectrum;
  if (!s) return;

  const ax = s.x + 8, ay = s.y + 10;
  const aw = s.w - 16, ah = s.h - 20;

  dctx.fillStyle = '#060608'; dctx.fillRect(s.x, s.y, s.w, s.h);

  // Axes
  dctx.strokeStyle = '#23252a'; dctx.lineWidth = 0.8;
  dctx.beginPath();
  dctx.moveTo(ax, ay); dctx.lineTo(ax, ay + ah); dctx.lineTo(ax + aw, ay + ah);
  dctx.stroke();

  // Sample spectrum
  const Rp = ui.Rp;
  const H_atm = ui.H_atm;
  let dMin = Infinity, dMax = -Infinity;
  const depths = new Float64Array(ATMOSPHERE.nBins + 1);
  const lams = new Float64Array(ATMOSPHERE.nBins + 1);
  for (let i = 0; i <= ATMOSPHERE.nBins; i += 1) {
    const lambda = ATMOSPHERE.lam0 + (i / ATMOSPHERE.nBins) * (ATMOSPHERE.lam1 - ATMOSPHERE.lam0);
    const d = transmissionDepth(lambda, Rp, H_atm);
    lams[i] = lambda; depths[i] = d;
    if (d < dMin) dMin = d; if (d > dMax) dMax = d;
  }
  const dPad = 0.1 * (dMax - dMin) || 1e-4;
  dMin -= dPad; dMax += dPad;
  const xToPx = (lam) => ax + (lam - ATMOSPHERE.lam0) / (ATMOSPHERE.lam1 - ATMOSPHERE.lam0) * aw;
  const yToPx = (d) => ay + (1 - (d - dMin) / (dMax - dMin)) * ah;

  // Y-axis labels
  dctx.fillStyle = '#7a818c'; dctx.font = fontString(canvas, 'caption', 'mono');
  dctx.textAlign = 'right'; dctx.fillText(dMax.toExponential(1), ax - 4, ay + 3);
  dctx.fillText(dMin.toExponential(1), ax - 4, ay + ah + 3);

  // X-axis ticks at key wavelengths
  dctx.textAlign = 'center'; dctx.fillStyle = '#7a818c';
  for (const xv of [500, 700, 1100, 1500, 1900]) {
    const px = xToPx(xv);
    if (px >= ax && px <= ax + aw) {
      dctx.fillText(String(xv), px, ay + ah + 12);
    }
  }

  // Spectrum curve
  dctx.strokeStyle = '#5bc0eb'; dctx.lineWidth = 1.4;
  dctx.beginPath();
  for (let i = 0; i <= ATMOSPHERE.nBins; i += 1) {
    const px = xToPx(lams[i]), py = yToPx(depths[i]);
    if (i === 0) dctx.moveTo(px, py); else dctx.lineTo(px, py);
  }
  dctx.stroke();

  // Feature markers
  for (const f of ATMOSPHERE.features) {
    const x = xToPx(f.c);
    if (x >= ax && x <= ax + aw) {
      dctx.strokeStyle = 'rgba(255,209,102,0.25)'; dctx.setLineDash([2, 2]);
      dctx.beginPath(); dctx.moveTo(x, ay); dctx.lineTo(x, ay + ah); dctx.stroke();
      dctx.setLineDash([]);
    }
  }

  // Label
  dctx.fillStyle = '#7a818c'; dctx.font = fontString(canvas, 'caption', 'mono');
  dctx.textAlign = 'left';
  dctx.fillText('transmission (λ)', s.x + 2, s.y + 10);
}

function bootSync() {
  if (CAPTURE_NAME) {
    sim.t = CAPTURE_FRAC * sim.period;
    camera.setAzimuthDeg(CAPTURE_FRAC * 18);
    camera.setElevationDeg(18);
    rebuildCurve();
    frame();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  rebuildCurve();
  frame();
}

window.__physicsCheck = async () => {
  const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0, u2: 0, Nr: 200, Nphi: 280 });
  const f = transitFlux(s, s.period * 0.25);
  return {
    name: 'central transit depth = (Rp/Rs)^2',
    pass: Math.abs(1 - f - 0.01) < 1e-4,
    msg: `1 - f = ${(1 - f).toFixed(5)} vs 0.01`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; transit physics validated by __physicsCheck and invariants' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
  const f = transitFlux(sim, phase * sim.period);
  const p = planetSkyPos(sim, phase * sim.period);
  const inTransit = p.infront && (p.x * p.x + p.y * p.y) < (1 + sim.Rp) ** 2;
  return {
    fields: [
      { key: 'planet-radius-ratio', label: 'Rp/Rs', value: ui.Rp, format: 'float' },
      { key: 'transit-depth-percent', label: 'Transit depth', value: (ui.Rp * ui.Rp * 100).toFixed(2) + '%', format: 'string' },
      { key: 'orbital-period', label: 'Period', value: ui.period, format: 'float' },
      { key: 'inclination-deg', label: 'Inclination', value: (ui.inc * 57.296).toFixed(1), format: 'string' },
      { key: 'current-flux', label: 'Current flux', value: f.toFixed(5), format: 'string' },
      { key: 'in-transit', label: 'In transit', value: inTransit ? 'yes' : 'no', format: 'string' }
    ]
  };
};
window.playground.getInvariants = function () {
  const depth = ui.Rp * ui.Rp;
  const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
  const f = transitFlux(sim, phase * sim.period);
  const outOfTransitFlux = (phase < 0.2 || phase > 0.8);
  const fluxOkay = !outOfTransitFlux || Math.abs(f - 1.0) < 1e-5;
  return [
    {
      key: 'transit-depth-physical',
      label: 'Depth $(R_p/R_s)^2$ within bounds',
      value: (depth * 100).toFixed(2) + '%',
      status: (depth > 0 && depth < 0.3) ? 'pass' : 'warn'
    },
    {
      key: 'out-of-transit-unity',
      label: 'Out-of-transit flux = 1.0',
      value: f.toFixed(6),
      status: fluxOkay ? 'pass' : 'warn'
    }
  ];
};
