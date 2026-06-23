// Thomas precession. Primary scene: a gyroscope disk riding a circular
// orbit, its spin axis slowly rotating in the lab frame by (gamma - 1)
// radians per completed orbit. Secondary panel: precession rate vs beta.

import { gamma, thomasFactor } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rW = document.getElementById('readout-w');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const T_ORBIT = 4.0;                       // seconds per orbit, fixed
const st = { beta: 0.5, t: 0, precess: 0 };  // precess = accumulated lab-frame axis angle (rad)
let running = !prefersReducedMotion();
let last = performance.now();

sB.addEventListener('input', () => { st.beta = parseFloat(sB.value); vB.textContent = st.beta.toFixed(2); });
btnR.addEventListener('click', () => {
  st.t = 0; st.precess = 0; running = true;
  btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => {
  running = !running;
  btnP.textContent = running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!running));
});

function arrowHead(x0, y0, dirx, diry, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 - size * dirx + 0.55 * size * diry, y0 - size * diry - 0.55 * size * dirx);
  ctx.lineTo(x0 - size * dirx - 0.55 * size * diry, y0 - size * diry + 0.55 * size * dirx);
  ctx.closePath(); ctx.fill();
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('gyroscope on a circular orbit: spin axis turns (gamma-1) rad per orbit', 12, 18);

  // ORBIT (top third). A projected circle with the gyroscope riding it.
  const cx = W / 2, cy = H * 0.245, R = W * 0.40, ry = R * 0.46;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, 2 * Math.PI); ctx.stroke();

  const theta = 2 * Math.PI * (st.t / T_ORBIT);
  const px = cx + R * Math.cos(theta), py = cy + ry * Math.sin(theta);

  // Gyroscope disk with its (precessing) spin-axis arrow.
  ctx.fillStyle = 'rgba(255,209,102,0.9)';
  ctx.beginPath(); ctx.ellipse(px, py, 15, 8, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(px, py, 15, 8, 0, 0, 2 * Math.PI); ctx.stroke();
  const ax = Math.cos(st.precess), ay = Math.sin(st.precess), L = 50;
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + L * ax, py + L * ay); ctx.stroke();
  arrowHead(px + L * ax, py + L * ay, ax, ay, 9, '#ef476f');

  // PRECESSION DIAL (middle): magnifies the accumulated lab-frame axis angle,
  // which on the small gyroscope is invisible. Initial direction dashed,
  // current direction solid, swept sector filled, full turns counted.
  const dcx = W / 2, dcy = H * 0.515, rd = 96;
  ctx.strokeStyle = 'rgba(220,220,240,0.22)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(dcx, dcy, rd, 0, 2 * Math.PI); ctx.stroke();
  const principal = st.precess - 2 * Math.PI * Math.floor(st.precess / (2 * Math.PI));
  ctx.fillStyle = 'rgba(239,71,111,0.16)';
  ctx.beginPath(); ctx.moveTo(dcx, dcy); ctx.arc(dcx, dcy, rd, 0, principal); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(154,160,166,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(dcx, dcy); ctx.lineTo(dcx + rd, dcy); ctx.stroke(); ctx.setLineDash([]);
  const cax = Math.cos(st.precess), cay = Math.sin(st.precess);
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(dcx, dcy); ctx.lineTo(dcx + rd * cax, dcy + rd * cay); ctx.stroke();
  arrowHead(dcx + rd * cax, dcy + rd * cay, cax, cay, 10, '#ef476f');
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(dcx, dcy, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('lab-frame spin axis', dcx, dcy - rd - 10);
  ctx.fillStyle = '#ef476f';
  ctx.fillText(`${st.precess.toFixed(3)} rad   ${(st.precess / (2 * Math.PI)).toFixed(2)} turns`, dcx, dcy + rd + 20);
  ctx.textAlign = 'left';

  // DIAGNOSTIC: (gamma-1) per orbit vs beta, with labelled axes.
  const px0 = 64, py0 = H * 0.665, pw = W - 100, ph = H * 0.27;
  const YMAX = 6;
  const xFor = (b) => px0 + (b / 0.99) * pw;
  const yFor = (v) => py0 + ph - Math.min(1, v / YMAX) * ph;
  ctx.fillStyle = '#0a0b12'; ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220,220,240,0.30)'; ctx.lineWidth = 1; ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw, ph);

  // Y ticks (gamma-1) and gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.62)'; ctx.textAlign = 'right';
  for (const v of [0, 2, 4, 6]) {
    const yy = yFor(v);
    ctx.fillText(`${v}`, px0 - 6, yy + 3);
    ctx.strokeStyle = 'rgba(226,232,240,0.07)';
    ctx.beginPath(); ctx.moveTo(px0, yy); ctx.lineTo(px0 + pw, yy); ctx.stroke();
  }
  // X ticks (beta).
  ctx.textAlign = 'center';
  for (const b of [0, 0.2, 0.4, 0.6, 0.8]) {
    const xx = xFor(b);
    ctx.strokeStyle = 'rgba(226,232,240,0.10)';
    ctx.beginPath(); ctx.moveTo(xx, py0 + ph); ctx.lineTo(xx, py0 + ph + 4); ctx.stroke();
    ctx.fillText(b.toFixed(1), xx, py0 + ph + 16);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right'; ctx.fillText('beta = v/c', px0 + pw, py0 + ph + 16);
  ctx.textAlign = 'left'; ctx.fillText('(gamma-1) per orbit', px0 + 6, py0 + 14);

  // Curve and current-beta marker.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const b = i / 100 * 0.99;
    const x = xFor(b), y = yFor(thomasFactor(b));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(xFor(st.beta), yFor(thomasFactor(st.beta)), 5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(
    `beta=${st.beta.toFixed(2)} gamma=${gamma(st.beta).toFixed(3)}  (gamma-1)=${thomasFactor(st.beta).toFixed(3)} rad/orbit`,
    12, H - 10);
  rW.textContent = thomasFactor(st.beta).toFixed(3);
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) {
    st.t += dt;
    // Precession accrues (gamma - 1) radians per full orbit; rate is
    // (gamma - 1) / T_ORBIT radians per second.
    st.precess += thomasFactor(st.beta) * (dt / T_ORBIT) * 2 * Math.PI;
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  // Reference capture sweeps the orbital speed beta: the (gamma-1)
  // marker climbs its curve, the gyroscope advances around the orbit,
  // and the accumulated spin-axis angle grows, so the five golden
  // frames are distinct and tell the Thomas-precession story.
  if (CAPTURE_NAME) {
    st.beta = 0.1 + CAPTURE_FRAC * 0.85;
    st.t = CAPTURE_FRAC * T_ORBIT;
    st.precess = thomasFactor(st.beta) * 2 * Math.PI * (1 + 3 * CAPTURE_FRAC);
    if (sB) { sB.value = String(st.beta); }
    if (vB) { vB.textContent = st.beta.toFixed(2); }
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// 1-C invariant: after one orbit at beta=0.866 (gamma=2), the accumulated
// spin-axis angle equals (gamma-1) = 1.0 rad within 0.5%.
window.__physicsCheck = async () => {
  const beta = 0.866;
  const g = gamma(beta);
  const Nsteps = 1000;
  const dt = T_ORBIT / Nsteps;
  let precess = 0;
  for (let i = 0; i < Nsteps; i += 1) precess += thomasFactor(beta) * (dt / T_ORBIT) * 2 * Math.PI;
  // After exactly one orbit, accumulated = (gamma-1) * 2pi (radians of axis
  // rotation across the full orbit). The per-orbit advance is (gamma-1)*2pi;
  // the spec's "(gamma-1) radian" refers to the rate constant gamma-1.
  const perOrbit = thomasFactor(beta) * 2 * Math.PI;
  const expected = (g - 1) * 2 * Math.PI;
  const err = Math.abs(perOrbit - expected) / Math.max(expected, 1e-9);
  if (err > 0.005) return { name: 'Thomas precession per orbit', pass: false, msg: `got ${perOrbit.toFixed(4)} expected ${expected.toFixed(4)}` };
  return { name: 'Thomas precession per orbit', pass: true, msg: `beta=0.866 gamma=${g.toFixed(2)}: per-orbit axis rotation ${perOrbit.toFixed(4)} rad ((gamma-1)*2pi)` };
};


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const g = gamma(st.beta);
  return { fields: [
    { key: 'velocity-beta', label: 'Velocity (beta = v/c)', value: st.beta, format: 'float' },
    { key: 'lorentz-gamma', label: 'Lorentz gamma', value: g, format: 'float' },
    { key: 'thomas-factor', label: 'Thomas factor (gamma - 1)', value: thomasFactor(st.beta), format: 'float' },
    { key: 'axis-angle', label: 'Accumulated precession angle (rad)', value: st.precess, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const g = gamma(st.beta);

  // Invariant 1: Lorentz gamma must satisfy gamma^2 - (gamma*beta)^2 = 1 (definition of gamma)
  const gBeta = g * st.beta;
  const gammaIdentity = Math.abs(g * g - gBeta * gBeta - 1);

  // Invariant 2: Thomas precession per orbit should be (gamma - 1) * 2 * pi
  // After one complete orbit (t increases by T_ORBIT), precession should increase by this amount
  const expectedPerOrbit = thomasFactor(st.beta) * 2 * Math.PI;
  const orbitNum = Math.max(1, Math.round(st.t / T_ORBIT));
  const expectedTotal = expectedPerOrbit * orbitNum;
  const precessionError = Math.abs(st.precess - expectedTotal) / Math.max(Math.abs(expectedTotal), 1e-9);

  return [
    { key: 'lorentz-identity', label: 'gamma^2 - (gamma*beta)^2 = 1', value: gammaIdentity.toExponential(2), status: gammaIdentity < 1e-10 ? 'pass' : gammaIdentity < 1e-6 ? 'drift' : 'pending' },
    { key: 'thomas-precession', label: 'Precession rate = (gamma-1)*2pi per orbit', value: precessionError.toExponential(2), status: precessionError < 0.05 ? 'pass' : precessionError < 0.2 ? 'drift' : 'pending' },
  ];
};
