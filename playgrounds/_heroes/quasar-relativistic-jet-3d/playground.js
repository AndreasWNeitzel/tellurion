// Quasar relativistic-jet playground. Canvas2D shows a black hole
// with an accretion disk and two anti-parallel jets viewed at angle
// theta_obs from the jet axis. Doppler boosting brightens the
// approaching jet and dims the receding one.

import {
  gamma, dopplerFactor, fluxRatio, brightness, apparentSuperluminal,
  maxApparent, beamingHalfAngle, FLUX_EXPONENT,
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

const rGamma = document.getElementById('readout-gamma');
const rBeta = document.getElementById('readout-beta');
const rTheta = document.getElementById('readout-theta');
const rRatio = document.getElementById('readout-ratio');
const rBapp = document.getElementById('readout-bapp');

const sGamma = document.getElementById('slider-gamma'), vGamma = document.getElementById('value-gamma');
const sTheta = document.getElementById('slider-theta'), vTheta = document.getElementById('value-theta');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const selCj = document.getElementById('select-cj'), vCj = document.getElementById('value-cj');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const DEG = Math.PI / 180;
const st = {
  Gamma: 10,
  thetaDeg: 20,
  speed: 2,
  showCj: true,
  running: !prefersReducedMotion(),
  t: 0,
  blobs: [],
  // User-controlled camera: yaw (drag-x), pitch (drag-y), zoom (wheel).
  camYaw: 12 * Math.PI / 180,
  camPitch: 0,
  camZoom: 1.0,
  drag: false, lastX: 0, lastY: 0,
};

function betaFromGamma(G) { return Math.sqrt(1 - 1 / (G * G)); }

// Scene coordinates. Jet axis = world y. Black hole at world origin.
// Viewer is at +z, distance large. Theta = angle from jet axis to LOS.
// We rotate the scene so the jet axis is tilted by theta in the canvas
// (the user effectively rotates around the y axis).

function project(x, y, z, center, scale) {
  // theta_obs rotation: the scene is rotated about world-x by theta_obs
  // so that when theta_obs = 0, the jet is straight up (perpendicular
  // to the view), and as theta_obs increases the jet tilts away.
  // Actually, we want: at theta_obs = 0, the viewer looks down the
  // jet (jet axis points at viewer). At theta_obs = 90, jet axis
  // perpendicular to viewer (we see the jet sideways).
  // Implementation: rotate world about x-axis by (90 - theta_obs).
  const tilt = (90 - st.thetaDeg) * DEG + st.camPitch;
  const cT = Math.cos(tilt), sT = Math.sin(tilt);
  const Y2 = cT * y - sT * z;
  const Z2 = sT * y + cT * z;
  // User-controlled yaw (drag) instead of a fixed 12-degree offset.
  const yaw = st.camYaw;
  const cY = Math.cos(yaw), sY = Math.sin(yaw);
  const X3 = cY * x + sY * Z2;
  const Z3 = -sY * x + cY * Z2;
  const k = 1 / (1 + Z3 / 12);
  const sc = scale * st.camZoom;
  return { x: center.x + X3 * sc * k, y: center.y - Y2 * sc * k, z: Z3 };
}

function spawnBlob(jetSide) {
  // Blob along the jet axis, jetSide = +1 (approaching) or -1 (counter).
  return {
    side: jetSide,
    s: 0.3 + 0.2 * Math.random(), // position along jet (units of jet length)
    r: 0.04 * Math.random(),       // off-axis scatter
    phi: 2 * Math.PI * Math.random(),
    born: st.t,
  };
}

function reseedBlobs() {
  st.blobs = [];
  for (let i = 0; i < 60; i++) {
    const b = spawnBlob(Math.random() < 0.5 ? +1 : -1);
    b.s = Math.random() * 1.8;
    b.born = st.t - Math.random() * 5;
    st.blobs.push(b);
  }
}

function stepBlobs(dt) {
  const beta = betaFromGamma(st.Gamma);
  const dsdt = beta * 0.7; // visual speed
  for (const b of st.blobs) {
    b.s += dsdt * dt * st.speed;
  }
  // Recycle blobs that fly off.
  for (let i = 0; i < st.blobs.length; i++) {
    if (st.blobs[i].s > 2.0) st.blobs[i] = spawnBlob(st.blobs[i].side);
  }
  // Spawn new ones occasionally.
  if (Math.random() < 0.10 * st.speed) {
    st.blobs.push(spawnBlob(Math.random() < 0.5 ? +1 : -1));
    if (st.blobs.length > 120) st.blobs.shift();
  }
}

function drawBackground(center, scale) {
  ctx.fillStyle = '#03040a';
  ctx.fillRect(0, 0, W, H);
  // Starfield
  for (let i = 0; i < 140; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.15 + 0.45 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawDisk(center, scale) {
  // Accretion disk in the plane perpendicular to the jet axis (y = 0).
  // Draw a ring of points around the BH.
  const N = 96;
  const Rinner = 0.18, Router = 0.55;
  for (let k = 0; k < N; k++) {
    const a = (k / N) * 2 * Math.PI;
    for (let j = 0; j < 4; j++) {
      const R = Rinner + (Router - Rinner) * (j + 0.5) / 4;
      const x = R * Math.cos(a);
      const z = R * Math.sin(a);
      const p = project(x, 0, z, center, scale);
      const t = (Router - R) / (Router - Rinner);
      const a1 = 0.5 + 0.45 * (1 - t);
      ctx.fillStyle = `rgba(${Math.round(255 * (1 - 0.3 * t))}, ${Math.round(150 + 50 * t)}, ${Math.round(60 + 60 * t)}, ${a1})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBlackHole(center, scale) {
  const p = project(0, 0, 0, center, scale);
  const r = 0.10 * scale;
  // Photon ring glow
  const g = ctx.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, r * 1.8);
  g.addColorStop(0, 'rgba(255, 200, 120, 0.0)');
  g.addColorStop(0.7, 'rgba(255, 200, 120, 0.6)');
  g.addColorStop(1, 'rgba(255, 200, 120, 0.0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2); ctx.fill();
  // Event horizon
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
}

function jetTipColor(brightnessNorm, side) {
  // Map brightness to a perceptually pleasing color.
  // side=+1 approaching, color biased to cyan/white as it gets bright;
  // side=-1 receding, color biased to red/dim.
  const u = Math.max(0, Math.min(1, brightnessNorm));
  if (side > 0) {
    const r = Math.round(80 + 175 * u);
    const g = Math.round(150 + 105 * u);
    const b = Math.round(240 + 15 * u);
    return [r, g, b];
  } else {
    const r = Math.round(180 + 30 * u);
    const g = Math.round(80 + 60 * u);
    const b = Math.round(80 + 80 * u);
    return [r, g, b];
  }
}

function drawJet(side, center, scale) {
  if (!st.showCj && side < 0) return;
  const beta = betaFromGamma(st.Gamma);
  const theta = st.thetaDeg * DEG;
  // Normalize brightness to be relative.
  const Bref = brightness(beta, theta * 0.999 + 0.01, true); // ~max
  const Bme = brightness(beta, theta, side > 0);
  const bnorm = Math.min(1, Bme / Math.max(1e-12, Bref));
  // Outer cylinder envelope: small radius near base, increasing with distance.
  const tip = 1.8;
  const baseR = 0.06;
  const tipR = 0.20;
  const stepN = 40;
  for (let i = 0; i < stepN; i++) {
    const u = i / (stepN - 1);
    const s = side * u * tip;
    const rr = baseR + (tipR - baseR) * u;
    // Brightness varies along jet (taper).
    const taper = Math.exp(-Math.pow((u - 0.3) * 1.5, 2));
    const localB = bnorm * (0.45 + 0.55 * taper);
    const col = jetTipColor(localB, side);
    const alpha = (0.10 + 0.50 * localB).toFixed(3);
    ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha})`;
    ctx.lineWidth = Math.max(1, 4 * localB + 0.5);
    const a = project(0, s, -rr, center, scale);
    const b = project(0, s, +rr, center, scale);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // Draw the moving blobs along this side.
  for (const blob of st.blobs) {
    if (blob.side !== side) continue;
    const s = side * blob.s;
    const x = blob.r * Math.cos(blob.phi);
    const z = blob.r * Math.sin(blob.phi);
    const p = project(x, s, z, center, scale);
    const col = jetTipColor(bnorm, side);
    const a = (0.25 + 0.6 * bnorm).toFixed(3);
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${a})`;
    const rsz = (3 + 5 * bnorm) * (1 - 0.3 * blob.s);
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, rsz), 0, Math.PI * 2); ctx.fill();
  }
}

function drawSceneFrame(center, scale) {
  // Axes label and reference.
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.25)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  const aA = project(0, +1.95, 0, center, scale);
  const aB = project(0, -1.95, 0, center, scale);
  ctx.beginPath(); ctx.moveTo(aA.x, aA.y); ctx.lineTo(aB.x, aB.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('jet axis', aA.x + 8, aA.y + 4);
  ctx.fillText('counter-jet', aB.x + 8, aB.y);
}

function drawSidePanel() {
  // Right-side panel: bar chart of jet vs counter-jet flux, plus
  // apparent superluminal velocity readout.
  const x0 = 0.62 * W, y0 = 30, x1 = W - 14, y1 = H - 30;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.78)';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // Title
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Doppler boost diagnostics', x0 + 8, y0 - 6);
  // Compute quantities.
  const beta = betaFromGamma(st.Gamma);
  const theta = st.thetaDeg * DEG;
  const dp = dopplerFactor(beta, theta, true);
  const dm = dopplerFactor(beta, theta, false);
  const Fr = fluxRatio(beta, theta);
  const Bapp = apparentSuperluminal(beta, theta);
  const halfBeam = beamingHalfAngle(beta) / DEG;
  // Layout.
  let y = y0 + 24;
  const drawRow = (label, value, color = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(label, x0 + 10, y);
    ctx.fillStyle = color;
    ctx.font = fontString(canvas, 'body', 'mono');
    ctx.fillText(value, x0 + 165, y);
    y += 22;
  };
  drawRow('delta_+ (jet)', dp.toFixed(3));
  drawRow('delta_- (cj)', dm.toFixed(3));
  drawRow('F_jet / F_cj', Fr.toExponential(2));
  drawRow('beta_app', Bapp.toFixed(2) + ' c');
  drawRow('beam half-angle', halfBeam.toFixed(1) + ' deg');
  // Indicator of regime.
  let regime = '';
  if (st.thetaDeg < halfBeam) regime = 'blazar';
  else if (st.thetaDeg < 45) regime = 'radio quasar';
  else regime = 'radio galaxy';
  drawRow('regime', regime, '#ffd28a');
  // Pictograph: two bars.
  const barX = x0 + 16, barW = x1 - x0 - 32;
  const barH = 14;
  const yJ = y + 6, yCj = yJ + barH + 18;
  ctx.fillStyle = 'rgba(180, 220, 255, 0.95)';
  const Fmax = Math.max(Math.pow(dp, FLUX_EXPONENT), Math.pow(dm, FLUX_EXPONENT));
  const wJ = barW * Math.pow(dp, FLUX_EXPONENT) / Math.max(1e-12, Fmax);
  ctx.fillRect(barX, yJ, wJ, barH);
  ctx.fillStyle = 'rgba(220, 110, 110, 0.95)';
  const wCj = barW * Math.pow(dm, FLUX_EXPONENT) / Math.max(1e-12, Fmax);
  ctx.fillRect(barX, yCj, wCj, barH);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('F_jet', barX + 4, yJ - 2);
  ctx.fillText('F_cj', barX + 4, yCj - 2);

  // ===== DIAGNOSTIC PLOT: delta_+(theta) and beta_app(theta) =====
  const plotY0 = yCj + barH + 22;
  const plotX0 = x0 + 44, plotX1 = x1 - 14;
  const plotY1 = y1 - 28;
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('δ(θ) and β_app(θ)', x0 + 10, plotY0 - 8);
  // Axes: theta 0..90 deg; left y = delta (0..2 Gamma), right = beta_app.
  const deltaMax = 2.1 * st.Gamma;
  const bappMax = Math.max(2, 1.1 * st.Gamma);
  function xOfT(td) { return plotX0 + (td / 90) * (plotX1 - plotX0); }
  function yOfDelta(d) { return plotY1 - (d / deltaMax) * (plotY1 - plotY0); }
  function yOfBapp(b) { return plotY1 - (b / bappMax) * (plotY1 - plotY0); }
  // Grid box.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.strokeRect(plotX0, plotY0, plotX1 - plotX0, plotY1 - plotY0);
  for (let td = 0; td <= 90; td += 30) {
    const xx = xOfT(td);
    ctx.beginPath(); ctx.moveTo(xx, plotY0); ctx.lineTo(xx, plotY1); ctx.stroke();
    ctx.fillStyle = 'rgba(200, 210, 240, 0.7)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${td}°`, xx - 8, plotY1 + 12);
  }
  // delta curve (cyan).
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= 90; i += 1) {
    const d = dopplerFactor(beta, i * DEG, true);
    const x = xOfT(i), y = yOfDelta(Math.min(deltaMax, d));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // beta_app curve (gold).
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= 90; i += 1) {
    const b = apparentSuperluminal(beta, i * DEG);
    const x = xOfT(i), y = yOfBapp(Math.min(bappMax, b));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current-theta marker.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOfT(st.thetaDeg), plotY0); ctx.lineTo(xOfT(st.thetaDeg), plotY1); ctx.stroke();
  ctx.setLineDash([]);
  // Legend.
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('δ', plotX0 + 4, plotY0 + 10);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('β_app', plotX0 + 24, plotY0 + 10);
}

function updateReadout() {
  const beta = betaFromGamma(st.Gamma);
  const theta = st.thetaDeg * DEG;
  rGamma.textContent = st.Gamma.toFixed(1);
  rBeta.textContent = beta.toFixed(5);
  rTheta.textContent = st.thetaDeg.toFixed(1) + ' deg';
  rRatio.textContent = fluxRatio(beta, theta).toExponential(2);
  rBapp.textContent = apparentSuperluminal(beta, theta).toFixed(2) + ' c';
}

function draw() {
  const sceneRect = { x: 0, y: 0, w: 0.6 * W, h: H };
  const center = { x: sceneRect.x + sceneRect.w / 2, y: sceneRect.y + sceneRect.h / 2 };
  const scale = 0.34 * sceneRect.h;
  drawBackground(center, scale);
  drawSceneFrame(center, scale);
  drawJet(-1, center, scale);    // counter-jet
  drawDisk(center, scale);
  drawBlackHole(center, scale);
  drawJet(+1, center, scale);    // approaching jet
  drawSidePanel();
  updateReadout();
  // Caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.6)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`Gamma = ${st.Gamma.toFixed(1)}, theta_obs = ${st.thetaDeg.toFixed(0)} deg`, 14, H - 14);
}

function readSliders() {
  st.Gamma = parseFloat(sGamma.value);
  st.thetaDeg = parseFloat(sTheta.value);
  st.speed = parseInt(sSpeed.value, 10);
  st.showCj = selCj.value === '1';
  vGamma.textContent = st.Gamma.toFixed(1);
  vTheta.textContent = st.thetaDeg.toFixed(1);
  vSpeed.textContent = String(st.speed);
  vCj.textContent = st.showCj ? 'on' : 'off';
}

[sGamma, sTheta, sSpeed, selCj].forEach(el => el.addEventListener('input', readSliders));
selCj.addEventListener('change', readSliders);

// Mouse-drag camera orbit + wheel zoom.
canvas.addEventListener('pointerdown', (e) => { st.drag = true; st.lastX = e.clientX; st.lastY = e.clientY; });
window.addEventListener('pointerup', () => { st.drag = false; });
window.addEventListener('pointermove', (e) => {
  if (!st.drag) return;
  st.camYaw += (e.clientX - st.lastX) * 0.006;
  st.camPitch = Math.max(-1.2, Math.min(1.2, st.camPitch + (e.clientY - st.lastY) * 0.006));
  st.lastX = e.clientX; st.lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  st.camZoom = Math.max(0.4, Math.min(4.0, st.camZoom * Math.exp(-e.deltaY * 0.0015)));
}, { passive: false });
btnReset.addEventListener('click', () => { st.t = 0; reseedBlobs(); });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  gamma_jet: { get: () => st.Gamma, set: v => { st.Gamma = parseFloat(v); sGamma.value = v; }, parse: parseFloat },
  theta_obs: { get: () => st.thetaDeg, set: v => { st.thetaDeg = parseFloat(v); sTheta.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);
reseedBlobs();

if (CAPTURE_NAME) {
  // Advance blobs by CAPTURE_FRAC * 2 seconds.
  const target = (CAPTURE_FRAC || 0) * 2.0;
  let tt = 0;
  while (tt < target) {
    stepBlobs(0.05);
    tt += 0.05;
    st.t = tt;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      stepBlobs(dt);
      st.t += dt;
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
  return {
    fields: [
      { key: 'lorentz-factor', label: 'Lorentz factor gamma', value: st.lorentzFactor || 10, format: 'float' },
      { key: 'jet-velocity-c', label: 'Jet velocity (beta)', value: st.jetVelocity || 0.95, format: 'float' },
      { key: 'opening-angle-degrees', label: 'Opening angle', value: st.openingAngle || 5, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Check that gamma = 1 / sqrt(1 - beta^2).
  const beta = st.jetVelocity || 0.95;
  const expectedGamma = 1 / Math.sqrt(1 - beta * beta);
  const actualGamma = st.lorentzFactor || 10;
  const error = Math.abs(actualGamma - expectedGamma) / expectedGamma;
  const status = error < 1e-9 ? 'pass' : (error < 1e-5 ? 'drift' : 'fail');
  return [
    {
      key: 'lorentz-factor-consistency',
      label: 'Gamma consistency error',
      value: error.toExponential(2),
      status: status
    }
  ];
};
