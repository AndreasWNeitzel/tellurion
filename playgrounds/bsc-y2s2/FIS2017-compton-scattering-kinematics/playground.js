import { fontString } from '../../../shared/js/canvas-type.js';
// Compton scattering kinematics playground.
// Left half: kinematic diagram (incident photon, scattered photon at theta,
// recoil electron at phi). Right half: delta_lambda(theta) curve with the
// current theta marked. Closed-form, no time integration.

import {
  comptonShift, scatteredWavelength, electronKE, electronRecoilAngle,
  LAMBDA_C_NM, HC_EV_NM, maxShift,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutSh   = document.getElementById('readout-shift');
const readoutTe   = document.getElementById('readout-te');

const sliderLam   = document.getElementById('slider-lam');
const sliderTheta = document.getElementById('slider-theta');
const valueLam    = document.getElementById('value-lam');
const valueTheta  = document.getElementById('value-theta');
const btnSweep    = document.getElementById('btn-sweep');
const btnReset    = document.getElementById('btn-reset');

let lambdaPm = parseFloat(sliderLam.value);
let thetaDeg = parseFloat(sliderTheta.value);
let sweeping = false;
let sweepT0  = 0;

function lambdaNm() { return lambdaPm * 1e-3; }
function thetaRad() { return thetaDeg * Math.PI / 180; }

sliderLam.addEventListener('input', () => {
  lambdaPm = parseFloat(sliderLam.value);
  valueLam.textContent = lambdaPm.toFixed(2);
});
sliderTheta.addEventListener('input', () => {
  thetaDeg = parseFloat(sliderTheta.value);
  valueTheta.textContent = String(thetaDeg);
});
btnSweep.addEventListener('click', () => {
  sweeping = !sweeping;
  btnSweep.textContent = sweeping ? 'Stop sweep' : 'Sweep theta';
  btnSweep.setAttribute('aria-pressed', String(sweeping));
  sweepT0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
});
btnReset.addEventListener('click', () => {
  lambdaPm = 2.5; sliderLam.value = '2.5'; valueLam.textContent = '2.50';
  thetaDeg = 60;  sliderTheta.value = '60'; valueTheta.textContent = '60';
  sweeping = false;
  btnSweep.textContent = 'Sweep theta';
  btnSweep.setAttribute('aria-pressed', 'false');
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function drawDiagram(c, x0, y0, w, h) {
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const R = Math.min(w, h) * 0.36;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = c.muted;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - R - 30, cy);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  drawArrow(c.blue, cx - 12, cy, cx, cy);

  const th = thetaRad();
  const sx = cx + R * Math.cos(th);
  const sy = cy - R * Math.sin(th);
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  drawArrow(c.orange, sx - 0.15 * (sx - cx), sy - 0.15 * (sy - cy), sx, sy);

  const phi = electronRecoilAngle(lambdaNm(), th);
  const ex = cx + R * 0.65 * Math.cos(-phi);
  const ey = cy - R * 0.65 * Math.sin(-phi);
  ctx.strokeStyle = c.red;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  drawArrow(c.red, ex - 0.15 * (ex - cx), ey - 0.15 * (ey - cy), ex, ey);

  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.28, 0, -th, true);
  ctx.stroke();
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('theta', cx + R * 0.32 * Math.cos(-th / 2), cy + R * 0.32 * Math.sin(-th / 2));

  ctx.fillStyle = c.blue;   ctx.fillText('photon in (lambda)', x0 + 12, y0 + 16);
  ctx.fillStyle = c.orange; ctx.fillText('photon out (lambda prime)', x0 + 12, y0 + 32);
  ctx.fillStyle = c.red;    ctx.fillText('recoil electron (phi)', x0 + 12, y0 + 48);
}

function drawArrow(color, ax, ay, bx, by) {
  const a = Math.atan2(by - ay, bx - ax);
  const head = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - head * Math.cos(a - 0.35), by - head * Math.sin(a - 0.35));
  ctx.lineTo(bx - head * Math.cos(a + 0.35), by - head * Math.sin(a + 0.35));
  ctx.closePath();
  ctx.fill();
}

function drawShiftPlot(c, x0, y0, w, h) {
  const padL = 44, padR = 12, padT = 18, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  const yMax = maxShift() * 1000 * 1.1; // in pm
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = y0 + padT + plotH * i / 4;
    ctx.beginPath();
    ctx.moveTo(x0 + padL, y);
    ctx.lineTo(x0 + padL + plotW, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const x = x0 + padL + plotW * i / 4;
    ctx.beginPath();
    ctx.moveTo(x, y0 + padT);
    ctx.lineTo(x, y0 + padT + plotH);
    ctx.stroke();
  }

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('theta (deg)', x0 + padL + plotW - 84, y0 + h - 8);
  ctx.save(); ctx.translate(x0 + 12, y0 + padT + 60); ctx.rotate(-Math.PI / 2);
  ctx.fillText('delta lambda (pm)', 0, 0); ctx.restore();
  ctx.fillText('0', x0 + padL - 12, y0 + padT + plotH + 4);
  ctx.fillText('180', x0 + padL + plotW - 18, y0 + padT + plotH + 14);
  ctx.fillText(yMax.toFixed(2), x0 + padL - 38, y0 + padT + 8);

  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 200;
  for (let i = 0; i <= N; i += 1) {
    const t = Math.PI * i / N;
    const dl = comptonShift(t) * 1000; // pm
    const xx = x0 + padL + plotW * (i / N);
    const yy = y0 + padT + plotH - (dl / yMax) * plotH;
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  const th = thetaRad();
  const dlNow = comptonShift(th) * 1000;
  const px = x0 + padL + plotW * (th / Math.PI);
  const py = y0 + padT + plotH - (dlNow / yMax) * plotH;
  ctx.fillStyle = c.red;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.fillText(`(${thetaDeg.toFixed(0)} deg, ${dlNow.toFixed(3)} pm)`, px + 8, py - 4);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawDiagram(c, 0, 0, W * 0.5, H);
  drawShiftPlot(c, W * 0.5, 0, W * 0.5, H);
}

function updateReadout() {
  const th = thetaRad();
  const shift_pm = comptonShift(th) * 1000;
  const T_keV = electronKE(lambdaNm(), th) / 1000;
  readoutSh.textContent = shift_pm.toFixed(4);
  readoutTe.textContent = T_keV.toFixed(3);
}

function tick(now) {
  if (sweeping) {
    const elapsed = (now - sweepT0) / 1000;
    const period = 8.0; // seconds for a full 0 to 180 sweep
    const phase = (elapsed % period) / period;
    thetaDeg = phase * 180;
    sliderTheta.value = String(Math.round(thetaDeg));
    valueTheta.textContent = String(Math.round(thetaDeg));
  }
  render();
  updateReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Frame 0..1 maps to theta 0..180 in capture mode.
    thetaDeg = 180 * frac;
    sliderTheta.value = String(Math.round(thetaDeg));
    valueTheta.textContent = String(Math.round(thetaDeg));
  }
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, theta: thetaDeg };
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
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// State reports the scattering angle, the wavelength shift and the
// electron recoil energy. The invariant verifies energy-momentum
// conservation: the scattered-photon and recoil-electron momenta
// (built from the separate Compton-shift, electron-KE and recoil-
// angle formulas) must sum back to the incident photon momentum.
window.playground = window.playground || {};
window.playground.getState = function () {
  const lam = lambdaNm(), th = thetaRad();
  return {
    fields: [
      { key: 'theta', label: 'scattering angle (deg)', value: thetaDeg, format: 'float' },
      { key: 'shift', label: 'wavelength shift (pm)', value: comptonShift(th) * 1e3, format: 'float' },
      { key: 'electron-ke', label: 'electron recoil energy (eV)', value: electronKE(lam, th), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const lam = lambdaNm(), th = thetaRad();
  const mec2 = HC_EV_NM / LAMBDA_C_NM;                 // electron rest energy, eV
  const eg0 = HC_EV_NM / lam;                          // incident photon energy = momentum (eV, eV/c)
  const egP = HC_EV_NM / scatteredWavelength(lam, th); // scattered photon
  const ke = electronKE(lam, th);
  const phi = electronRecoilAngle(lam, th);
  const pe = Math.sqrt(ke * ke + 2 * ke * mec2);       // relativistic electron momentum, eV/c
  // Photon enters along +x; the electron recoils opposite the photon.
  const px = egP * Math.cos(th) + pe * Math.cos(phi);
  const py = egP * Math.sin(th) - pe * Math.sin(phi);
  const drift = Math.hypot(px - eg0, py) / Math.max(1e-9, eg0);
  return [{
    key: 'momentum',
    label: 'energy-momentum conserved (Compton kinematics)',
    value: drift.toExponential(2),
    status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
  }];
};
