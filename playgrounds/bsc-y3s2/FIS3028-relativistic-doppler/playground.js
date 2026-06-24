// Relativistic Doppler playground. Two panels: f(theta) curve on
// linear axes (left) and polar plot (right). Marker at current theta.

import { gamma, dopplerFactor } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutG     = document.getElementById('readout-g');
const readoutF     = document.getElementById('readout-f');

const sliderBeta  = document.getElementById('slider-beta');
const sliderTheta = document.getElementById('slider-theta');
const valueBeta   = document.getElementById('value-beta');
const valueTheta  = document.getElementById('value-theta');

let beta = parseFloat(sliderBeta.value);
let thetaDeg = parseFloat(sliderTheta.value);
// Auto-sweep the source speed so the Doppler shift plays on load (red at
// recession through blue at approach, with relativistic beaming). Either
// slider pauses it.
let playing = !prefersReducedMotion(), betaDir = 1, lastT = 0, tau = 0;
const betaLo = parseFloat(sliderBeta.min) || 0, betaHi = parseFloat(sliderBeta.max) || 0.95;

sliderBeta.addEventListener('input', () => { playing = false; beta = parseFloat(sliderBeta.value); valueBeta.textContent = beta.toFixed(3); });
sliderTheta.addEventListener('input', () => { playing = false; thetaDeg = parseFloat(sliderTheta.value); valueTheta.textContent = String(thetaDeg); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function drawCartesian(c, x0, y0, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);
  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Find max for vertical scaling.
  let yMax = 0, yMin = Infinity;
  for (let i = 0; i <= 200; i += 1) {
    const t = Math.PI * i / 200;
    const f = dopplerFactor(beta, t);
    if (f > yMax) yMax = f;
    if (f < yMin) yMin = f;
  }
  yMax = Math.max(yMax, 1.1);
  yMin = Math.min(yMin, 0.5);

  function xFor(t) { return x0 + padL + plotW * (t / Math.PI); }
  function yFor(v) { return y0 + padT + plotH * (1 - (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = x0 + padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
  }

  // Line at f = 1 (no shift).
  ctx.strokeStyle = c.red;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0 + padL, yFor(1)); ctx.lineTo(x0 + padL + plotW, yFor(1)); ctx.stroke();
  ctx.setLineDash([]);

  // Doppler curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const t = Math.PI * i / 200;
    const f = dopplerFactor(beta, t);
    const xx = xFor(t);
    const yy = yFor(f);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Marker at current theta.
  const thr = thetaDeg * Math.PI / 180;
  const fNow = dopplerFactor(beta, thr);
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(xFor(thr), yFor(fNow), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', x0 + padL - 6, y0 + padT + plotH + 14);
  ctx.fillText('π/2', x0 + padL + plotW / 2 - 12, y0 + padT + plotH + 14);
  ctx.fillText('π', x0 + padL + plotW - 8, y0 + padT + plotH + 14);
  ctx.fillText(yMax.toFixed(2), x0 + padL - 32, y0 + padT + 6);
  ctx.fillText('1.00', x0 + padL - 28, yFor(1) + 3);
  ctx.fillText(yMin.toFixed(2), x0 + padL - 32, y0 + padT + plotH);
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('θ (rad)', x0 + padL + plotW - 60, y0 + padT + plotH + 26);
  ctx.save(); ctx.translate(x0 + 12, y0 + padT + plotH / 2 + 30); ctx.rotate(-Math.PI / 2);
  ctx.fillText('f_obs / f_src (log)', 0, 0); ctx.restore();
  ctx.fillStyle = c.accent;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`beta = ${beta.toFixed(3)}, gamma = ${gamma(beta).toFixed(2)}`, x0 + padL + 8, y0 + 14);
}

// Moving-source wavefronts: each crest is a circle centred where the source
// was when it emitted it; the source motion bunches them ahead (blueshift) and
// spreads them behind (redshift). An observer ray at theta shows the shift seen
// in that direction. This is the intuitive picture; the relativistic f(theta)
// curve below carries the transverse-Doppler subtlety.
function drawWavefronts(c, x0, y0, w, h) {
  ctx.fillStyle = c.bg; ctx.fillRect(x0, y0, w, h);
  const cy = y0 + h * 0.52, xs = x0 + w * 0.5;     // source at the scene centre
  const cPx = Math.min(w, h) * 0.072;              // wave-crest expansion per emit interval (px)
  const N = 9;                                     // visible crests
  const sub = tau % 1;                             // sub-interval phase in [0,1)

  // region tints: ahead (right) blue, behind (left) red
  ctx.fillStyle = 'rgba(91,160,235,0.05)'; ctx.fillRect(xs, y0, x0 + w - xs, h);
  ctx.fillStyle = 'rgba(239,71,111,0.05)'; ctx.fillRect(x0, y0, xs - x0, h);

  for (let i = N; i >= 1; i -= 1) {
    const age = i - 1 + sub;                        // crest age in emit intervals
    const rad = cPx * age;
    const cxw = xs - beta * cPx * age;              // centre shifts back as the source advanced
    if (rad < 2) continue;
    const ahead = 1 - Math.exp(-age * 0.2);
    ctx.strokeStyle = `rgba(${Math.round(120 + 90 * (1 - beta))}, 190, 235, ${(0.7 - 0.05 * age).toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cxw, cy, rad, 0, 2 * Math.PI); ctx.stroke();
  }

  // source velocity arrow
  ctx.strokeStyle = c.fg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(xs, cy); ctx.lineTo(xs + 54, cy); ctx.stroke();
  ctx.fillStyle = c.fg; ctx.beginPath();
  ctx.moveTo(xs + 58, cy); ctx.lineTo(xs + 48, cy - 5); ctx.lineTo(xs + 48, cy + 5); ctx.closePath(); ctx.fill();
  // source
  ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(xs, cy, 6, 0, 2 * Math.PI); ctx.fill();

  // observer ray at theta (measured from the motion direction)
  const thr = thetaDeg * Math.PI / 180;
  const f = dopplerFactor(beta, thr);
  const L = Math.min(w, h) * 0.42;
  const ox = xs + L * Math.cos(thr), oy = cy - L * Math.sin(thr);
  const obsCol = f >= 1 ? '#5bc0eb' : '#ef476f';
  ctx.strokeStyle = obsCol; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(xs, cy); ctx.lineTo(ox, oy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = obsCol; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  // Anchor the label inward so it never runs off the right/left scene edge.
  const labelLeft = ox < x0 + w * 0.60;
  ctx.textAlign = labelLeft ? 'left' : 'right';
  ctx.fillText(`observer  f_obs/f_src = ${f.toFixed(3)}  (${f >= 1 ? 'blueshift' : 'redshift'})`, ox + (labelLeft ? 8 : -8), oy - 8);

  // labels
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right'; ctx.fillText('blueshift: crests bunch ahead', x0 + w - 14, y0 + 22);
  ctx.textAlign = 'left'; ctx.fillText('redshift: crests spread behind', x0 + 14, y0 + 22);
  ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText(`source moving at beta = ${beta.toFixed(2)}c`, x0 + 14, y0 + h - 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  // Portrait stack: polar source/aberration scene on top, Doppler-factor curve below.
  const sceneH = Math.round(H * 0.52);
  drawWavefronts(c, 0, 0, W, sceneH);
  drawCartesian(c, 0, sceneH, W, H - sceneH);
}

function updateReadout() {
  readoutG.textContent = gamma(beta).toFixed(3);
  readoutF.textContent = dopplerFactor(beta, thetaDeg * Math.PI / 180).toFixed(4);
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
  if (playing) {
    beta += betaDir * dt * ((betaHi - betaLo) / 13);
    if (beta >= betaHi) { beta = betaHi; betaDir = -1; } else if (beta <= betaLo) { beta = betaLo; betaDir = 1; }
    sliderBeta.value = String(beta); valueBeta.textContent = beta.toFixed(3);
  }
  tau += dt * 1.3;          // wavefront emission clock (always runs)
  lastT = now;
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    beta = frac * 0.95;
    sliderBeta.value = String(beta);
    valueBeta.textContent = beta.toFixed(3);
  }
  valueBeta.textContent = beta.toFixed(3);
  valueTheta.textContent = String(thetaDeg);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, beta, thetaDeg };
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
  const g = gamma(beta);
  const thetaRad = thetaDeg * Math.PI / 180;
  const doppler = dopplerFactor(beta, thetaRad);
  return { fields: [
    { key: 'velocity-beta', label: 'Velocity (beta = v/c)', value: beta, format: 'float' },
    { key: 'lorentz-gamma', label: 'Lorentz gamma', value: g, format: 'float' },
    { key: 'observation-angle', label: 'Observation angle (degrees)', value: thetaDeg, format: 'float' },
    { key: 'doppler-factor', label: 'Doppler factor f_obs / f_src', value: doppler, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const g = gamma(beta);
  const thetaRad = thetaDeg * Math.PI / 180;
  const doppler = dopplerFactor(beta, thetaRad);

  // Invariant 1: Formula check: f_obs = f_src / (gamma * (1 - beta * cos(theta)))
  const expectedDoppler = 1 / (g * (1 - beta * Math.cos(thetaRad)));
  const formulaError = Math.abs(doppler - expectedDoppler) / Math.max(expectedDoppler, 1e-9);

  // Invariant 2: Physical bounds: Doppler factor must be positive (frequency always positive)
  const isPositive = doppler > 0;

  // Invariant 3: At beta = 0 (no motion), doppler factor = 1 (no shift)
  let staticCorrect = true;
  if (beta < 0.01) {
    if (Math.abs(doppler - 1) > 0.1) staticCorrect = false;
  }

  return [
    { key: 'doppler-formula', label: 'Doppler formula f_obs = f_src / (gamma*(1-beta*cos(theta)))', value: formulaError.toExponential(2), status: formulaError < 1e-10 ? 'pass' : formulaError < 1e-6 ? 'drift' : 'pending' },
    { key: 'positivity', label: 'Doppler factor > 0', value: isPositive ? 'yes' : 'no', status: isPositive ? 'pass' : 'drift' },
  ];
};
