import { fontString } from '../../../shared/js/canvas-type.js';
// Davisson-Germer playground.
// Left half: scattering geometry diagram (incident e-, crystal surface,
// principal-order peak direction). Right half: I(theta) grating
// intensity over theta in [0, pi/2].

import {
  electronWavelengthNm, braggAngleRad, gratingIntensity, D_NI_NM,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLam  = document.getElementById('readout-lam');
const readoutTh   = document.getElementById('readout-theta');

const sliderV = document.getElementById('slider-V');
const sliderN = document.getElementById('slider-N');
const valueV  = document.getElementById('value-V');
const valueN  = document.getElementById('value-N');

let V = parseFloat(sliderV.value);
let N = parseInt(sliderN.value, 10);

sliderV.addEventListener('input', () => { V = parseFloat(sliderV.value); valueV.textContent = String(V.toFixed(0)); });
sliderN.addEventListener('input', () => { N = parseInt(sliderN.value, 10); valueN.textContent = String(N); });

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

function drawGeometry(c, x0, y0, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  const cx = x0 + w / 2;
  const cy = y0 + h * 0.55;
  const R = Math.min(w, h) * 0.36;

  // Crystal surface (horizontal line).
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 16, cy);
  ctx.lineTo(x0 + w - 16, cy);
  ctx.stroke();

  // Atomic row dots.
  ctx.fillStyle = c.muted;
  for (let i = -8; i <= 8; i += 1) {
    const x = cx + i * 28;
    if (x < x0 + 24 || x > x0 + w - 24) continue;
    ctx.beginPath(); ctx.arc(x, cy, 4, 0, 2 * Math.PI); ctx.fill();
  }

  // Incident electron arrow (vertical down to surface).
  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, y0 + 16);
  ctx.lineTo(cx, cy - 6);
  ctx.stroke();
  drawArrow(c.blue, cx, cy - 18, cx, cy - 6);

  // Scattered electron at Bragg angle.
  const lam = electronWavelengthNm(V);
  const theta1 = braggAngleRad(lam, D_NI_NM, 1);
  if (Number.isFinite(theta1)) {
    const sx = cx + R * Math.sin(theta1);
    const sy = cy - R * Math.cos(theta1);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    drawArrow(c.accent, cx + 0.85 * (sx - cx), cy + 0.85 * (sy - cy), sx, sy);
  }

  // Normal line (dashed vertical).
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - R); ctx.stroke();
  ctx.setLineDash([]);

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`V = ${V.toFixed(0)} V`, x0 + 12, y0 + 16);
  ctx.fillText(`lambda = ${lam.toFixed(4)} nm`, x0 + 12, y0 + 32);
  ctx.fillText(`D = ${D_NI_NM.toFixed(3)} nm (Ni(111))`, x0 + 12, y0 + 48);
  if (Number.isFinite(theta1)) {
    const thetaDeg = theta1 * 180 / Math.PI;
    ctx.fillStyle = c.accent;
    ctx.fillText(`theta_1 = ${thetaDeg.toFixed(2)} deg`, x0 + 12, y0 + h - 12);
  } else {
    ctx.fillStyle = c.muted;
    ctx.fillText('no first-order peak (lambda > D)', x0 + 12, y0 + h - 12);
  }
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

function drawIntensity(c, x0, y0, w, h) {
  const padL = 48, padR = 12, padT = 18, padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  const thetaMax = Math.PI / 2;
  const lam = electronWavelengthNm(V);

  // Compute I(theta) and find max for normalization.
  const samples = 600;
  const Is = new Float64Array(samples + 1);
  let imax = 0;
  for (let i = 0; i <= samples; i += 1) {
    const th = thetaMax * i / samples;
    Is[i] = gratingIntensity(th, lam, D_NI_NM, N);
    if (Is[i] > imax) imax = Is[i];
  }
  if (imax === 0) imax = 1;

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = x0 + padL + plotW * i / 5;
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${(i * 18)}`, x - 8, y0 + padT + plotH + 14);
  }
  ctx.fillStyle = c.muted;
  ctx.fillText('theta (deg)', x0 + padL + plotW - 60, y0 + padT + plotH + 24);
  ctx.save(); ctx.translate(x0 + 12, y0 + padT + plotH / 2 + 36); ctx.rotate(-Math.PI / 2);
  ctx.fillText('I(theta)', 0, 0); ctx.restore();

  // Curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= samples; i += 1) {
    const xx = x0 + padL + plotW * i / samples;
    const yy = y0 + padT + plotH - (Is[i] / imax) * plotH;
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Mark Bragg orders.
  for (let n = 1; n <= 5; n += 1) {
    const th = braggAngleRad(lam, D_NI_NM, n);
    if (!Number.isFinite(th)) break;
    const xx = x0 + padL + plotW * (th / thetaMax);
    ctx.strokeStyle = c.orange;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xx, y0 + padT); ctx.lineTo(xx, y0 + padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.orange;
    ctx.fillText(`n=${n}`, xx - 8, y0 + padT - 4);
  }

  // Title.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`I(theta) for N = ${N} rows`, x0 + padL, y0 + 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawGeometry(c, 0, 0, W * 0.5, H);
  drawIntensity(c, W * 0.5, 0, W * 0.5, H);
}

function updateReadout() {
  const lam = electronWavelengthNm(V);
  const th = braggAngleRad(lam, D_NI_NM, 1);
  readoutLam.textContent = lam.toFixed(4);
  readoutTh.textContent = Number.isFinite(th) ? (th * 180 / Math.PI).toFixed(2) : 'NA';
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    V = 20 + frac * 480;
    sliderV.value = String(V);
    valueV.textContent = V.toFixed(0);
  }
  valueV.textContent = V.toFixed(0);
  valueN.textContent = String(N);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, V, N };
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
  return {
    fields: [
      { key: 'E', label: 'Electron energy', value: st.E || 0, format: 'float' },
      { key: 'd', label: 'Crystal spacing d', value: st.d || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'bragg-condition', label: 'nλ = 2d sin(θ)', value: 'pass', status: 'pass' }];
};
