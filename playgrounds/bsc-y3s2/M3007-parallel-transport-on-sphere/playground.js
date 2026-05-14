// Parallel-transport playground. Render a sphere wireframe with a
// Beltrami triangle and the holonomy readout.

import { holonomy, interiorAngleSum, sphericalToCartesian } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutOm    = document.getElementById('readout-om');
const readoutAbc   = document.getElementById('readout-abc');

const sliderAlpha = document.getElementById('slider-alpha');
const sliderBeta  = document.getElementById('slider-beta');
const valueAlpha  = document.getElementById('value-alpha');
const valueBeta   = document.getElementById('value-beta');

let alphaDeg = parseFloat(sliderAlpha.value);
let betaDeg = parseFloat(sliderBeta.value);

sliderAlpha.addEventListener('input', () => { alphaDeg = parseFloat(sliderAlpha.value); valueAlpha.textContent = String(alphaDeg); });
sliderBeta.addEventListener('input', () => { betaDeg = parseFloat(sliderBeta.value); valueBeta.textContent = String(betaDeg); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    green:  '#06d6a0',
    grid:   '#23252a',
  };
}

// Render: orthographic projection from a viewpoint above the equator
// looking down toward the north pole at an oblique angle.
function project(p, cxPx, cyPx, R) {
  // Rotate so y-axis points right, z-axis up, x-axis toward viewer.
  // Use simple rotation: from (x, y, z) view from (1, -1, 0.7) direction.
  const yaw = -0.4, pitch = 0.6;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  // Rotate around z by yaw.
  let x = p.x * cy - p.y * sy;
  let y = p.x * sy + p.y * cy;
  let z = p.z;
  // Rotate around y by pitch (tilt).
  const x2 = x * cp + z * sp;
  const z2 = -x * sp + z * cp;
  x = x2; z = z2;
  return { px: cxPx + R * y, py: cyPx - R * z, depth: x };
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cxPx = canvas.width * 0.4;
  const cyPx = canvas.height / 2;
  const R = Math.min(canvas.width * 0.6, canvas.height) * 0.4;

  // Sphere wireframe (latitude + longitude grid).
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const lon = (i / 8) * 2 * Math.PI;
    ctx.beginPath();
    for (let j = 0; j <= 60; j += 1) {
      const lat = -Math.PI / 2 + (j / 60) * Math.PI;
      const p = project(sphericalToCartesian(lat, lon), cxPx, cyPx, R);
      if (p.depth < -0.3) continue;
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  for (let i = 1; i < 7; i += 1) {
    const lat = -Math.PI / 2 + (i / 7) * Math.PI;
    ctx.beginPath();
    for (let j = 0; j <= 80; j += 1) {
      const lon = (j / 80) * 2 * Math.PI;
      const p = project(sphericalToCartesian(lat, lon), cxPx, cyPx, R);
      if (p.depth < -0.3) continue;
      if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Triangle vertices.
  const alphaR = alphaDeg * Math.PI / 180;
  const betaR = betaDeg * Math.PI / 180;
  // Vertex 1: north pole.
  const P1 = sphericalToCartesian(Math.PI / 2, 0);
  // Vertex 2: lat = pi/2 - alpha, lon = 0.
  const P2 = sphericalToCartesian(Math.PI / 2 - alphaR, 0);
  // Vertex 3: lat = pi/2 - alpha, lon = beta.
  const P3 = sphericalToCartesian(Math.PI / 2 - alphaR, betaR);

  // Draw the three great-circle arcs.
  function drawArc(A, B, color, samples = 100) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      // Spherical linear interpolation along the great circle.
      const dot = A.x * B.x + A.y * B.y + A.z * B.z;
      const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
      if (omega < 1e-6) continue;
      const sa = Math.sin((1 - t) * omega) / Math.sin(omega);
      const sb = Math.sin(t * omega) / Math.sin(omega);
      const pt = {
        x: sa * A.x + sb * B.x,
        y: sa * A.y + sb * B.y,
        z: sa * A.z + sb * B.z,
      };
      const p = project(pt, cxPx, cyPx, R);
      if (!started) { ctx.moveTo(p.px, p.py); started = true; } else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  drawArc(P1, P2, c.accent);
  drawArc(P2, P3, c.blue);
  drawArc(P3, P1, c.red);

  // Vertices.
  for (const [P, color, label] of [[P1, c.accent, 'pole'], [P2, c.blue, 'P2'], [P3, c.red, 'P3']]) {
    const p = project(P, cxPx, cyPx, R);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.px, p.py, 6, 0, 2 * Math.PI); ctx.fill();
  }

  // Readout text.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`alpha = ${alphaDeg} deg, beta = ${betaDeg} deg`, 12, 20);
  const om = holonomy(alphaR, betaR);
  ctx.fillStyle = c.accent;
  ctx.fillText(`Omega = (1 - cos alpha) beta = ${om.toFixed(4)} sr`, 12, 38);
  ctx.fillStyle = c.green;
  ctx.fillText(`holonomy = Omega = ${(om * 180 / Math.PI).toFixed(1)} deg`, 12, 56);
}

function updateReadout() {
  const alphaR = alphaDeg * Math.PI / 180;
  const betaR = betaDeg * Math.PI / 180;
  const om = holonomy(alphaR, betaR);
  readoutOm.textContent = om.toFixed(4);
  readoutAbc.textContent = (interiorAngleSum(alphaR, betaR) - Math.PI).toFixed(4);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    betaDeg = 30 + frac * 150;
    sliderBeta.value = String(Math.round(betaDeg));
    valueBeta.textContent = String(Math.round(betaDeg));
  }
  valueAlpha.textContent = String(alphaDeg);
  valueBeta.textContent = String(betaDeg);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, alphaDeg, betaDeg };
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
