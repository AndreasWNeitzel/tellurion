// Brewster + Fresnel + TIR playground.

import {
  snellAngle, brewsterAngle, criticalAngle, fresnel_rs, fresnel_rp,
  fresnel_unpol, regime, MATERIALS,
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
const DEG = Math.PI / 180;

const rTheta = document.getElementById('readout-theta');
const rB = document.getElementById('readout-B');
const rC = document.getElementById('readout-C');
const rRs = document.getElementById('readout-Rs');
const rRp = document.getElementById('readout-Rp');

const sTheta = document.getElementById('slider-theta'), vTheta = document.getElementById('value-theta');
const selN1 = document.getElementById('select-n1'), vN1 = document.getElementById('value-n1');
const selN2 = document.getElementById('select-n2'), vN2 = document.getElementById('value-n2');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const NMAP = { air: 1.000, water: 1.333, glass: 1.520, diamond: 2.417 };

const st = {
  theta_deg: 50,
  n1_key: 'water',
  n2_key: 'air',
  speed: 0,
  running: !prefersReducedMotion(),
  t: 0,
};

function n1() { return NMAP[st.n1_key]; }
function n2() { return NMAP[st.n2_key]; }
function theta_rad() { return st.theta_deg * DEG; }

// Scene: left 55% = ray diagram; right 45% = R_s/R_p plot.
// Portrait: ray diagram on top, Fresnel reflectance curves full-width below.
const SCENE = { x: 0, y: 0, w: W, h: 0.58 * H };
const PLOT = { x: 40, y: 0.60 * H + 20, w: W - 80, h: 0.36 * H };

function drawSky() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Subtle starfield
  for (let i = 0; i < 60; i++) {
    const ix = (i * 23.7) % SCENE.w;
    const iy = (i * 31.1) % SCENE.h;
    ctx.fillStyle = `rgba(190, 200, 255, ${0.10 + 0.30 * ((i * 7) % 17) / 17})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawInterface() {
  const cx = SCENE.x + SCENE.w * 0.5;
  const cy = SCENE.y + SCENE.h * 0.5;
  // Medium 1 (top): tint
  const top = ctx.createLinearGradient(0, 0, 0, cy);
  top.addColorStop(0, 'rgba(120, 200, 255, 0.10)');
  top.addColorStop(1, 'rgba(120, 200, 255, 0.04)');
  ctx.fillStyle = top;
  ctx.fillRect(SCENE.x, SCENE.y, SCENE.w, cy);
  // Medium 2 (bottom): tint
  const bot = ctx.createLinearGradient(0, cy, 0, H);
  bot.addColorStop(0, 'rgba(180, 130, 220, 0.08)');
  bot.addColorStop(1, 'rgba(180, 130, 220, 0.18)');
  ctx.fillStyle = bot;
  ctx.fillRect(SCENE.x, cy, SCENE.w, H - cy);
  // Interface line
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(SCENE.x, cy); ctx.lineTo(SCENE.x + SCENE.w, cy); ctx.stroke();
  // Normal
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.35)';
  ctx.beginPath(); ctx.moveTo(cx, SCENE.y + 30); ctx.lineTo(cx, H - 30); ctx.stroke();
  ctx.setLineDash([]);
  // Labels
  ctx.fillStyle = 'rgba(180, 210, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`n_1 = ${n1().toFixed(3)} (${st.n1_key})`, SCENE.x + 14, cy - 14);
  ctx.fillStyle = 'rgba(220, 180, 240, 0.85)';
  ctx.fillText(`n_2 = ${n2().toFixed(3)} (${st.n2_key})`, SCENE.x + 14, cy + 22);
}

function drawRays() {
  const cx = SCENE.x + SCENE.w * 0.5;
  const cy = SCENE.y + SCENE.h * 0.5;
  const ti = theta_rad();
  const tt = snellAngle(ti, n1(), n2());
  const isTIR = tt === null;
  const Rs = fresnel_rs(ti, n1(), n2()).R;
  const Rp = fresnel_rp(ti, n1(), n2()).R;
  const Ru = fresnel_unpol(ti, n1(), n2());
  const Tu = 1 - Ru;

  const RAY_LEN = 200;
  // Incident ray from upper-left.
  const inc_dx = Math.sin(ti);
  const inc_dy = -Math.cos(ti);
  const inc_start_x = cx - RAY_LEN * inc_dx;
  const inc_start_y = cy - RAY_LEN * inc_dy;
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 3;
  drawRayWithArrow(inc_start_x, inc_start_y, cx, cy);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`incident (theta_i = ${st.theta_deg.toFixed(1)} deg)`, inc_start_x + 6, inc_start_y - 6);

  // Reflected ray (mirror about normal: angle = theta_i, on the other side).
  const refl_dx = Math.sin(ti);
  const refl_dy = -Math.cos(ti);     // upward
  const refl_end_x = cx + RAY_LEN * refl_dx;
  const refl_end_y = cy - RAY_LEN * Math.cos(ti);
  ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.15, Math.sqrt(Ru)).toFixed(3)})`;
  ctx.lineWidth = 1 + 4 * Math.sqrt(Ru);
  drawRayWithArrow(cx, cy, refl_end_x, refl_end_y);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(`reflected R = ${Ru.toFixed(3)}`, refl_end_x + 6, refl_end_y - 6);

  // Refracted ray (downward), thickness ~ T.
  if (!isTIR) {
    const trans_end_x = cx + RAY_LEN * Math.sin(tt);
    const trans_end_y = cy + RAY_LEN * Math.cos(tt);
    ctx.strokeStyle = `rgba(120, 220, 255, ${Math.max(0.2, Math.sqrt(Tu)).toFixed(3)})`;
    ctx.lineWidth = 1 + 4 * Math.sqrt(Tu);
    drawRayWithArrow(cx, cy, trans_end_x, trans_end_y);
    ctx.fillStyle = 'rgba(120, 220, 255, 0.9)';
    ctx.fillText(`refracted T = ${Tu.toFixed(3)}, theta_t = ${(tt / DEG).toFixed(1)} deg`, trans_end_x + 6, trans_end_y + 14);
  } else {
    // TIR indicator.
    ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
    ctx.font = fontString(canvas, 'body', 'sans', 600);
    ctx.fillText('TOTAL INTERNAL REFLECTION', cx + 30, cy + 24);
  }

  // Regime label.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'body');
  const reg = regime(ti, n1(), n2());
  ctx.fillText(`regime: ${reg}`, SCENE.x + 14, SCENE.y + 24);

  // R_s and R_p numerical labels.
  ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`R_s = ${Rs.toFixed(4)}`, refl_end_x + 6, refl_end_y + 14);
  ctx.fillStyle = 'rgba(120, 220, 255, 0.95)';
  ctx.fillText(`R_p = ${Rp.toFixed(4)}`, refl_end_x + 6, refl_end_y + 30);
}

function drawRayWithArrow(x0, y0, x1, y1) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ah = 9;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ah * ux + (ah / 2) * uy, y1 - ah * uy - (ah / 2) * ux);
  ctx.lineTo(x1 - ah * ux - (ah / 2) * uy, y1 - ah * uy + (ah / 2) * ux);
  ctx.closePath();
  ctx.fill();
}

function drawPlot() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('R_s, R_p vs theta_i', PLOT.x + 8, PLOT.y - 6);

  // Plot R_s (red) and R_p (cyan) curves.
  const N = 180;
  const drawCurve = (color, fn) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const th = (k / (N - 1)) * 89.9 * DEG;
      const R = fn(th, n1(), n2()).R;
      const x = PLOT.x + 40 + (th / (89.9 * DEG)) * (PLOT.w - 60);
      const y = PLOT.y + PLOT.h - 30 - R * (PLOT.h - 50);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  drawCurve('rgba(255, 130, 110, 0.95)', fresnel_rs);
  drawCurve('rgba(120, 220, 255, 0.95)', fresnel_rp);

  // Brewster marker.
  const tB = brewsterAngle(n1(), n2());
  const xB = PLOT.x + 40 + (tB / (89.9 * DEG)) * (PLOT.w - 60);
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.75)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xB, PLOT.y + 12); ctx.lineTo(xB, PLOT.y + PLOT.h - 30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`theta_B = ${(tB / DEG).toFixed(1)} deg`, xB + 4, PLOT.y + 28);

  // Critical-angle marker (if applicable).
  const tC = criticalAngle(n1(), n2());
  if (tC !== null) {
    const xC = PLOT.x + 40 + (tC / (89.9 * DEG)) * (PLOT.w - 60);
    ctx.strokeStyle = 'rgba(255, 130, 110, 0.85)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(xC, PLOT.y + 12); ctx.lineTo(xC, PLOT.y + PLOT.h - 30); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
    ctx.fillText(`theta_c = ${(tC / DEG).toFixed(1)} deg`, xC + 4, PLOT.y + 44);
  }

  // Current theta marker.
  const xCur = PLOT.x + 40 + (theta_rad() / (89.9 * DEG)) * (PLOT.w - 60);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.setLineDash([2, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xCur, PLOT.y + 12); ctx.lineTo(xCur, PLOT.y + PLOT.h - 30); ctx.stroke();
  ctx.setLineDash([]);

  // Legend
  ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('R_s (s-polarized)', PLOT.x + 8, PLOT.y + PLOT.h - 12);
  ctx.fillStyle = 'rgba(120, 220, 255, 0.95)';
  ctx.fillText('R_p (p-polarized)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h - 12);

  // Axes labels
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', PLOT.x + 38, PLOT.y + PLOT.h - 32);
  ctx.fillText('90 deg', PLOT.x + PLOT.w - 50, PLOT.y + PLOT.h - 32);
  ctx.fillText('R = 0', PLOT.x + 8, PLOT.y + PLOT.h - 32);
  ctx.fillText('R = 1', PLOT.x + 8, PLOT.y + 18);
}

function updateReadout() {
  rTheta.textContent = st.theta_deg.toFixed(1);
  rB.textContent = (brewsterAngle(n1(), n2()) / DEG).toFixed(2);
  const tC = criticalAngle(n1(), n2());
  rC.textContent = (tC === null) ? 'n/a' : (tC / DEG).toFixed(2);
  rRs.textContent = fresnel_rs(theta_rad(), n1(), n2()).R.toFixed(4);
  rRp.textContent = fresnel_rp(theta_rad(), n1(), n2()).R.toFixed(4);
}

function readSliders() {
  st.theta_deg = parseFloat(sTheta.value);
  st.n1_key = selN1.value;
  st.n2_key = selN2.value;
  st.speed = parseInt(sSpeed.value, 10);
  vTheta.textContent = st.theta_deg.toFixed(1);
  vN1.textContent = st.n1_key.slice(0, 5);
  vN2.textContent = st.n2_key.slice(0, 5);
  vSpeed.textContent = String(st.speed);
}

[sTheta, selN1, selN2, sSpeed].forEach(el => el.addEventListener('input', readSliders));
selN1.addEventListener('change', readSliders);
selN2.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.theta_deg = 50; sTheta.value = '50'; readSliders(); });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  theta_deg: { get: () => st.theta_deg, set: v => { st.theta_deg = parseFloat(v); sTheta.value = v; }, parse: parseFloat },
  n1: { get: () => st.n1_key, set: v => { st.n1_key = v; selN1.value = v; }, parse: x => x },
  n2: { get: () => st.n2_key, set: v => { st.n2_key = v; selN2.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function draw() {
  drawSky();
  drawInterface();
  drawRays();
  drawPlot();
  updateReadout();
}

if (CAPTURE_NAME) {
  // Sweep theta from 10 deg to 80 deg as capture frac.
  st.theta_deg = 10 + 70 * (CAPTURE_FRAC || 0);
  sTheta.value = String(st.theta_deg);
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running && st.speed > 0) {
      st.theta_deg += dt * 6 * st.speed;
      if (st.theta_deg > 88) st.theta_deg = 5;
      sTheta.value = st.theta_deg.toFixed(1);
      vTheta.textContent = st.theta_deg.toFixed(1);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
// The defining property of Brewster's angle: p-polarised light is
// perfectly transmitted, R_p = 0. Checking it ties the Brewster
// formula to the Fresnel equations.
window.playground = window.playground || {};
window.playground.getState = function () {
  const ti = theta_rad(), a = n1(), b = n2();
  return {
    fields: [
      { key: 'theta-i', label: 'incidence angle', value: `${st.theta_deg.toFixed(1)} deg` },
      { key: 'n1', label: 'n1 (incident medium)', value: a.toFixed(3), format: 'float' },
      { key: 'n2', label: 'n2 (transmit medium)', value: b.toFixed(3), format: 'float' },
      { key: 'reflectance-s', label: 'R_s', value: fresnel_rs(ti, a, b).R.toFixed(4), format: 'float' },
      { key: 'reflectance-p', label: 'R_p', value: fresnel_rp(ti, a, b).R.toFixed(4), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const a = n1(), b = n2();
  const thB = brewsterAngle(a, b);
  const RpB = fresnel_rp(thB, a, b).R;
  return [
    {
      key: 'brewster',
      label: 'R_p vanishes at the Brewster angle',
      value: RpB.toExponential(2),
      status: RpB < 1e-6 ? 'pass' : (RpB < 1e-3 ? 'pending' : 'drift'),
    },
  ];
};
