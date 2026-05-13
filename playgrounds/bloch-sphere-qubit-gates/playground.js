// playground.js
// Render the Bloch sphere as a 2D orthographic projection (looking down the
// +y axis from the user). The state vector is drawn as an arrow from the
// origin to the (r_x, r_y, r_z) point. Buttons apply standard gates;
// continuous rotations come from the angle slider.

import { makeRng } from '../../shared/js/render/rng.js';
import { GATES, Rx, Ry, Rz, applyGate, ampsToBloch, blochToAmps, unitarityNorm } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas        = document.getElementById('stage');
const ctx           = canvas.getContext('2d', { alpha: false });
const sliderAngle   = document.getElementById('slider-angle');
const valueAngle    = document.getElementById('value-angle');
const W = canvas.width, H = canvas.height;

const CENTER = { x: W * 0.42, y: H * 0.5 };
const R_SPHERE = Math.min(W * 0.32, H * 0.42);

const rng = makeRng(0xC0FFEE);

const state = {
  a: [1, 0], b: [0, 0],       // |0>
  trail: [],                  // recent Bloch points
  lastUnitary: 0,
  history: [],                // last applied gate names
};

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const COL = {
  fg: cssVar('--fg', '#1A1B1C'),
  accent: cssVar('--accent', '#1B6CA8'),
  warm: cssVar('--accent-warm', '#C13B27'),
  cat1: cssVar('--cat-1', '#4C72B0'),
  cat2: cssVar('--cat-2', '#DD8452'),
  cat3: cssVar('--cat-3', '#55A868'),
};

// Project a Bloch point (x, y, z) into screen coords. We rotate slightly
// for a 3/4 view: camera at (0, -1, 0.3) ish. Use a simple orthographic
// projection with a tilt.
const TILT = 0.40;   // radians
function project(rx, ry, rz) {
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  const screenX = rx;
  const screenY = -rz * cosT + ry * sinT;
  const depth   = ry * cosT + rz * sinT;
  return {
    px: CENTER.x + R_SPHERE * screenX,
    py: CENTER.y + R_SPHERE * screenY,
    depth,
  };
}

function drawSphere() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, R_SPHERE, 0, 2 * Math.PI);
  ctx.stroke();

  // equator (ry = 0 line projected)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const t = i / 60 * 2 * Math.PI;
    const p = project(Math.cos(t), 0, Math.sin(t));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  // meridian phi = 0 (ry = 0, rx-rz arc)
  ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) {
    const t = i / 60 * 2 * Math.PI;
    const p = project(0, Math.sin(t), Math.cos(t));
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // axis labels
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  const xPos = project(1.05, 0, 0);
  const yPos = project(0, 1.05, 0);
  const zPos = project(0, 0, 1.10);
  const zNeg = project(0, 0, -1.10);
  ctx.textAlign = 'left'; ctx.fillText('x', xPos.px + 4, xPos.py);
  ctx.textAlign = 'left'; ctx.fillText('y', yPos.px + 4, yPos.py - 4);
  ctx.textAlign = 'center';
  ctx.fillText('|0>', zPos.px, zPos.py - 4);
  ctx.fillText('|1>', zNeg.px, zNeg.py + 14);
}

function drawTrailAndState() {
  // trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = COL.accent;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    const p0 = project(state.trail[0].x, state.trail[0].y, state.trail[0].z);
    ctx.moveTo(p0.px, p0.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const p = project(state.trail[i].x, state.trail[i].y, state.trail[i].z);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // current state arrow
  const { theta, phi } = ampsToBloch(state.a, state.b);
  const rx = Math.sin(theta) * Math.cos(phi);
  const ry = Math.sin(theta) * Math.sin(phi);
  const rz = Math.cos(theta);
  const tip = project(rx, ry, rz);
  const ori = project(0, 0, 0);
  ctx.strokeStyle = COL.warm;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(ori.px, ori.py); ctx.lineTo(tip.px, tip.py);
  ctx.stroke();
  ctx.fillStyle = COL.warm;
  ctx.beginPath();
  ctx.arc(tip.px, tip.py, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawReadout() {
  const { theta, phi } = ampsToBloch(state.a, state.b);
  const rx = Math.sin(theta) * Math.cos(phi);
  const ry = Math.sin(theta) * Math.sin(phi);
  const rz = Math.cos(theta);
  const rows = [
    ['theta', `${(theta * 180 / Math.PI).toFixed(1)} deg`],
    ['phi',   `${(phi   * 180 / Math.PI).toFixed(1)} deg`],
    ['r_x', rx.toFixed(3)],
    ['r_y', ry.toFixed(3)],
    ['r_z', rz.toFixed(3)],
    ['|r|', Math.hypot(rx, ry, rz).toFixed(6)],
    ['last U-norm', state.lastUnitary.toExponential(2)],
    ['history', state.history.slice(-6).join(' ')],
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  const xL = CENTER.x + R_SPHERE + 30, xR = W - 16;
  let y = 32;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.fillText(k, xL, y);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; ctx.fillText(v, xR, y);
    y += 16;
  }
}

function drawAll() {
  drawSphere();
  drawTrailAndState();
  drawReadout();
}

function pushTrail() {
  const { theta, phi } = ampsToBloch(state.a, state.b);
  state.trail.push({
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.sin(theta) * Math.sin(phi),
    z: Math.cos(theta),
  });
  if (state.trail.length > 500) state.trail.shift();
}

function applyNamed(name) {
  let U = null;
  if (name in GATES) U = GATES[name];
  else if (name === 'Rx') U = Rx(parseFloat(sliderAngle.value) * Math.PI / 180);
  else if (name === 'Ry') U = Ry(parseFloat(sliderAngle.value) * Math.PI / 180);
  else if (name === 'Rz') U = Rz(parseFloat(sliderAngle.value) * Math.PI / 180);
  if (!U) return;
  const r = applyGate(U, state.a, state.b);
  state.a = r.a; state.b = r.b;
  state.lastUnitary = unitarityNorm(U);
  state.history.push(name);
  pushTrail();
}

function reset() {
  state.a = [1, 0]; state.b = [0, 0];
  state.trail = [];
  state.lastUnitary = 0;
  state.history = [];
  pushTrail();
}

function randomSequence() {
  reset();
  const gates = ['X', 'Y', 'Z', 'H', 'S', 'T'];
  const N = 6;
  for (let i = 0; i < N; i += 1) {
    const g = gates[Math.floor(rng() * gates.length)];
    applyNamed(g);
  }
}

document.querySelectorAll('.pg-controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    const g = btn.getAttribute('data-gate');
    if (g === 'reset') reset();
    else if (g === 'random') randomSequence();
    else if (g === 'invert') {
      // re-apply the last gate (X X = I, etc.) is not a true inverse for S/T,
      // but it is a re-application that demonstrates non-involution.
      if (state.history.length > 0) applyNamed(state.history[state.history.length - 1]);
    }
    else applyNamed(g);
    drawAll();
  });
});

sliderAngle.addEventListener('input', () => {
  valueAngle.textContent = sliderAngle.value;
});

function bootSync() {
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Deterministic gate sequence per captureFraction.
    const sequence = ['H', 'X', 'Y', 'Z', 'H', 'S', 'T'];
    const N = Math.round(frac * sequence.length);
    for (let i = 0; i < N; i += 1) applyNamed(sequence[i]);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  drawAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
