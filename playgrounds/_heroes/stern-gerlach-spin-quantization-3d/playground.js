// Stern-Gerlach 3D apparatus. Canvas2D rendering with depth-sorted
// trajectories, atom-by-atom emission from the oven, deflection by
// the magnet, and a live histogram on the screen.

import {
  mJValues, deflection, quantumDensity, classicalDensity, makeRng,
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

const rJ = document.getElementById('readout-J');
const rSpots = document.getElementById('readout-spots');
const rGrad = document.getElementById('readout-grad');
const rN = document.getElementById('readout-N');
const rMode = document.getElementById('readout-mode');

const selJ = document.getElementById('select-J'), vJ = document.getElementById('value-J');
const sGrad = document.getElementById('slider-grad'), vGrad = document.getElementById('value-grad');
const sRate = document.getElementById('slider-rate'), vRate = document.getElementById('value-rate');
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  J: 0.5,
  dBdz: 0.20,
  rate: 6,
  mode: 'quantum',
  running: !prefersReducedMotion(),
  t: 0,
  atoms: [],         // in-flight atom positions
  hits: [],          // z-positions on screen
  rng: makeRng(0xC0FFEE),
  hitsMax: 4000,
};

// Apparatus geometry in world space (x, y, z):
//   x: beam direction (0 at oven, 1.6 at screen).
//   z: vertical (gradient axis).
//   y: depth.
const OVEN_X = -0.1, MAGNET_X0 = 0.20, MAGNET_X1 = 0.80, SCREEN_X = 1.40;
const BEAM_VX = 1.6;                              // beam speed, world units / s
// Screen deflection per unit m_J. The atom gains vz linearly across
// the magnet, then drifts to the screen. Integrating the equations
// of motion the trajectory integrator uses gives
//   z = (3 dBdz) (L_mag / vx^2) (L_mag/2 + L_drift)  per unit m_J.
// The histogram curve must use this same scale as the simulation, or
// the bars and the theoretical curve will not overlay.
const SG_L_MAG = MAGNET_X1 - MAGNET_X0;
const SG_L_DRIFT = SCREEN_X - MAGNET_X1;
const DEFLECT_PER_MJ = 3.0 * (SG_L_MAG / (BEAM_VX * BEAM_VX)) * (SG_L_MAG / 2 + SG_L_DRIFT);

function projectScene(p, center, scale) {
  // Camera at (0.6, 0.4, 0.1) looking toward (0.7, 0, 0).
  // Implement a simple yaw + pitch + perspective.
  const yaw = -0.30, pitch = 0.30;
  const cY = Math.cos(yaw), sY = Math.sin(yaw);
  const cP = Math.cos(pitch), sP = Math.sin(pitch);
  // Translate so beam axis is centered.
  const x = p.x - 0.65, y = p.y, z = p.z;
  const X = cY * x + sY * y;
  let Y = -sY * x + cY * y;
  const Zw = cP * z - sP * Y;
  Y = sP * z + cP * Y;
  const k = 1 / (1 + Y / 2.5);
  return { x: center.x + X * scale * k, y: center.y - Zw * scale * k, k };
}

function drawAxesGuide(center, scale) {
  ctx.strokeStyle = 'rgba(180, 200, 240, 0.20)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  // beam axis
  const a = projectScene({ x: OVEN_X, y: 0, z: 0 }, center, scale);
  const b = projectScene({ x: SCREEN_X, y: 0, z: 0 }, center, scale);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.setLineDash([]);
}

function drawOven(center, scale) {
  // A small box on the left labeled "atom oven".
  const corners = [
    { x: OVEN_X - 0.05, y: -0.05, z: -0.06 },
    { x: OVEN_X - 0.05, y: +0.05, z: -0.06 },
    { x: OVEN_X - 0.05, y: +0.05, z: +0.06 },
    { x: OVEN_X - 0.05, y: -0.05, z: +0.06 },
    { x: OVEN_X + 0.10, y: -0.05, z: -0.06 },
    { x: OVEN_X + 0.10, y: +0.05, z: -0.06 },
    { x: OVEN_X + 0.10, y: +0.05, z: +0.06 },
    { x: OVEN_X + 0.10, y: -0.05, z: +0.06 },
  ];
  const proj = corners.map(c => projectScene(c, center, scale));
  ctx.fillStyle = 'rgba(180, 180, 200, 0.55)';
  ctx.strokeStyle = 'rgba(220, 220, 240, 0.6)';
  ctx.lineWidth = 1.2;
  const faces = [
    [0, 1, 2, 3], [4, 5, 6, 7], [0, 4, 7, 3], [1, 5, 6, 2], [3, 7, 6, 2], [0, 4, 5, 1],
  ];
  for (const f of faces) {
    ctx.beginPath();
    ctx.moveTo(proj[f[0]].x, proj[f[0]].y);
    for (let k = 1; k < f.length; k++) ctx.lineTo(proj[f[k]].x, proj[f[k]].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Hole at the right (collimator)
  const cen = projectScene({ x: OVEN_X + 0.10, y: 0, z: 0 }, center, scale);
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cen.x, cen.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.8)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('oven', Math.max(8, cen.x - 16), cen.y + 26);
}

function drawMagnet(center, scale) {
  // Two pole pieces (north red on top, south blue on bottom). The
  // top pole is wedge-shaped (concentrates field lines); bottom is
  // flat. This is the canonical SG geometry.
  const drawPole = (yPole, polarity) => {
    const yTopBot = yPole > 0 ? 0.30 : -0.30;
    const yBot = yPole > 0 ? 0.10 : -0.10;
    const wedge = yPole > 0 ? 0.02 : 0.10;  // top is sharper
    // 8 vertices of a trapezoid-prism.
    const v = [
      { x: MAGNET_X0, y: -0.08, z: yBot },
      { x: MAGNET_X0, y: +0.08, z: yBot },
      { x: MAGNET_X0, y: +0.08, z: yTopBot - (yPole > 0 ? -wedge : wedge) * 0.5 },
      { x: MAGNET_X0, y: -0.08, z: yTopBot - (yPole > 0 ? -wedge : wedge) * 0.5 },
      { x: MAGNET_X1, y: -0.08, z: yBot },
      { x: MAGNET_X1, y: +0.08, z: yBot },
      { x: MAGNET_X1, y: +0.08, z: yTopBot - (yPole > 0 ? -wedge : wedge) * 0.5 },
      { x: MAGNET_X1, y: -0.08, z: yTopBot - (yPole > 0 ? -wedge : wedge) * 0.5 },
    ];
    const p = v.map(q => projectScene(q, center, scale));
    const col = (polarity === 'N')
      ? 'rgba(225, 70, 60, 0.75)'
      : 'rgba(70, 110, 220, 0.75)';
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    const faces = [
      [0, 1, 2, 3], [4, 5, 6, 7], [0, 4, 7, 3], [1, 5, 6, 2], [3, 7, 6, 2], [0, 4, 5, 1],
    ];
    for (const f of faces) {
      ctx.beginPath();
      ctx.moveTo(p[f[0]].x, p[f[0]].y);
      for (let k = 1; k < f.length; k++) ctx.lineTo(p[f[k]].x, p[f[k]].y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    // Pole label
    const lab = projectScene({ x: (MAGNET_X0 + MAGNET_X1) / 2, y: 0, z: yTopBot - 0.05 }, center, scale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = fontString(canvas, 'body', 'sans', 600);
    ctx.fillText(polarity, lab.x - 4, lab.y + 5);
  };
  drawPole(+1, 'N');
  drawPole(-1, 'S');
}

function drawScreen(center, scale) {
  // Vertical sheet at SCREEN_X with corners at z in [-0.5, 0.5], y in [-0.10, 0.10].
  const v = [
    { x: SCREEN_X, y: -0.10, z: -0.5 },
    { x: SCREEN_X, y: +0.10, z: -0.5 },
    { x: SCREEN_X, y: +0.10, z: +0.5 },
    { x: SCREEN_X, y: -0.10, z: +0.5 },
  ];
  const p = v.map(q => projectScene(q, center, scale));
  ctx.fillStyle = 'rgba(40, 50, 70, 0.75)';
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  for (let k = 1; k < 4; k++) ctx.lineTo(p[k].x, p[k].y);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Label
  const lab = projectScene({ x: SCREEN_X, y: 0, z: -0.56 }, center, scale);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('screen', lab.x - 18, lab.y);
}

function colorForMJ(m_J, J) {
  const u = (m_J + J) / Math.max(1e-9, 2 * J);
  // Yellow-cyan-magenta sequence by m_J ordering.
  const stops = [
    [255, 200, 80],
    [80, 230, 220],
    [220, 100, 255],
  ];
  const t = u * (stops.length - 1);
  // Clamp the stop index at both ends: m_J outside [-J, J] (bins
  // between or beyond the spots) would otherwise index stops[] out
  // of range and read a property of undefined.
  const i = Math.max(0, Math.min(stops.length - 2, Math.floor(t)));
  const f = Math.max(0, Math.min(1, t - i));
  const r = Math.round(stops[i][0] * (1 - f) + stops[i + 1][0] * f);
  const g = Math.round(stops[i][1] * (1 - f) + stops[i + 1][1] * f);
  const b = Math.round(stops[i][2] * (1 - f) + stops[i + 1][2] * f);
  return [r, g, b];
}

function spawnAtom() {
  // Pick m_J uniformly over allowed values (quantum) or a continuous
  // cos theta in [-1, 1] (classical).
  if (st.mode === 'classical') {
    const cos = (st.rng() - 0.5) * 2;          // uniform on sphere projection
    return { x: OVEN_X + 0.10, y: (st.rng() - 0.5) * 0.02, z: (st.rng() - 0.5) * 0.02, m_J: cos * st.J, classical: true, age: 0 };
  }
  // Quantum
  const ms = mJValues(st.J);
  const m = ms[Math.floor(st.rng() * ms.length)];
  return { x: OVEN_X + 0.10, y: (st.rng() - 0.5) * 0.02, z: (st.rng() - 0.5) * 0.02, m_J: m, classical: false, age: 0 };
}

function stepAtoms(dt) {
  const v_x = BEAM_VX;     // beam speed in world units / sec
  for (let i = st.atoms.length - 1; i >= 0; i--) {
    const a = st.atoms[i];
    const x0 = a.x;
    a.x += v_x * dt;
    a.age += dt;
    // Force kicks in only inside the magnet region.
    // We track z by an accumulated velocity, modelled as: while
    // inside magnet, v_z grows linearly with elapsed magnet time;
    // outside, v_z is constant.
    if (a.x >= MAGNET_X0 && x0 < MAGNET_X1) {
      const t_in = Math.min(a.x, MAGNET_X1) - Math.max(x0, MAGNET_X0);
      const acc = a.m_J * st.dBdz * 3.0;
      a.vz = (a.vz || 0) + acc * (t_in / v_x);
    }
    a.z += (a.vz || 0) * dt;
    // Record hit when atom passes SCREEN_X.
    if (a.x >= SCREEN_X) {
      st.hits.push(a.z);
      if (st.hits.length > st.hitsMax) st.hits.shift();
      st.atoms.splice(i, 1);
    }
  }
  // Spawn new atoms based on rate.
  const spawnInterval = 1 / (st.rate * 6);
  st._spawnAcc = (st._spawnAcc || 0) + dt;
  while (st._spawnAcc > spawnInterval) {
    st._spawnAcc -= spawnInterval;
    st.atoms.push(spawnAtom());
  }
}

function drawAtoms(center, scale) {
  // Sort by depth (y) descending so far ones drawn first.
  const sorted = st.atoms.slice().sort((u, v) => u.y - v.y);
  for (const a of sorted) {
    const p = projectScene({ x: a.x, y: a.y, z: a.z }, center, scale);
    const col = a.classical
      ? [200, 230, 255]
      : colorForMJ(a.m_J, st.J);
    const alpha = 0.85;
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha})`;
    const r = 2.0;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    // Short trail in the direction of motion (project a small step back).
    const p2 = projectScene({ x: a.x - 0.02, y: a.y, z: a.z - (a.vz || 0) * 0.02 }, center, scale);
    ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.35)`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
}

function drawScreenHistogram(center, scale) {
  // Build a 1D histogram of z hits.
  const nBins = 200;
  const zMax = 0.6;
  const bins = new Float64Array(nBins);
  for (const z of st.hits) {
    const idx = Math.floor(((z + zMax) / (2 * zMax)) * nBins);
    if (idx >= 0 && idx < nBins) bins[idx]++;
  }
  const maxB = Math.max(1, ...bins);
  // Right panel rendering: bars going outward from the screen line.
  const xPanel = 0.66 * W, yPanel0 = 30, yPanel1 = H - 50;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.78)';
  ctx.fillRect(xPanel, yPanel0, W - xPanel - 14, yPanel1 - yPanel0);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(xPanel + 0.5, yPanel0 + 0.5, W - xPanel - 15, yPanel1 - yPanel0 - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Screen histogram', xPanel + 8, yPanel0 - 6);
  // Draw bars
  const barX0 = xPanel + 50;
  const barW = (W - xPanel - 14) - 60;
  const allowedMJ = mJValues(st.J);
  const z_per_mJ = st.dBdz * DEFLECT_PER_MJ;
  for (let i = 0; i < nBins; i++) {
    const yMid = yPanel0 + ((nBins - 1 - i) / (nBins - 1)) * (yPanel1 - yPanel0);
    const w = bins[i] / maxB * barW;
    if (w < 1) continue;
    // Color by the nearest allowed m_J spot (half-integer for half-
    // integer J), not the nearest integer.
    const z = -zMax + 2 * zMax * (i / nBins);
    const m_J_est = z / Math.max(1e-9, z_per_mJ);
    const m_J = allowedMJ.reduce((a, b) => (Math.abs(b - m_J_est) < Math.abs(a - m_J_est) ? b : a));
    const col = colorForMJ(m_J, st.J);
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.85)`;
    ctx.fillRect(barX0, yMid - 1, w, 2);
  }
  // Theoretical curves overlaid.
  const drawCurve = (densityFn, color, dashed = false) => {
    // The histogram bars are peak-normalised (tallest bin -> barW).
    // The theoretical density must use the SAME normalisation or the
    // two will not overlay: sample it, find its peak, scale to barW.
    const dens = new Float64Array(nBins);
    let dMax = 1e-12;
    for (let i = 0; i < nBins; i++) {
      const z = -zMax + 2 * zMax * (i / nBins);
      dens[i] = densityFn(z);
      if (dens[i] > dMax) dMax = dens[i];
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    if (dashed) ctx.setLineDash([3, 4]);
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < nBins; i++) {
      const yMid = yPanel0 + ((nBins - 1 - i) / (nBins - 1)) * (yPanel1 - yPanel0);
      const x = barX0 + (dens[i] / dMax) * barW;
      if (first) { ctx.moveTo(x, yMid); first = false; } else ctx.lineTo(x, yMid);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  if (st.mode === 'quantum' || st.mode === 'both') {
    drawCurve(z => quantumDensity(z, z_per_mJ, st.J, 0.04), 'rgba(255, 255, 255, 0.55)');
  }
  if (st.mode === 'classical' || st.mode === 'both') {
    drawCurve(z => classicalDensity(z, z_per_mJ, st.J), 'rgba(255, 180, 100, 0.7)', true);
  }
  // Label the m_J ticks.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (const m of mJValues(st.J)) {
    const z = m * z_per_mJ;
    const yMid = yPanel0 + ((nBins - 1 - ((z + zMax) / (2 * zMax) * nBins)) / nBins) * (yPanel1 - yPanel0);
    ctx.fillText(`m=${m.toFixed(m % 1 === 0 ? 0 : 1)}`, xPanel + 6, yMid + 4);
  }
  // Legend
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`hits: ${st.hits.length}`, xPanel + 8, yPanel1 - 8);
}

function draw() {
  ctx.fillStyle = '#050709';
  ctx.fillRect(0, 0, W, H);
  // Sparse starfield
  for (let i = 0; i < 50; i++) {
    const ix = (i * 23.7) % (0.62 * W);
    const iy = (i * 31.1) % H;
    const sb = 0.10 + 0.30 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  const sceneRect = { x: 0, y: 0, w: 0.62 * W, h: H };
  const center = { x: sceneRect.x + sceneRect.w / 2, y: sceneRect.y + sceneRect.h / 2 };
  const scale = 360;
  drawAxesGuide(center, scale);
  drawOven(center, scale);
  drawMagnet(center, scale);
  drawScreen(center, scale);
  drawAtoms(center, scale);
  drawScreenHistogram(center, scale);
  // Caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`J = ${st.J}, dB/dz = ${st.dBdz.toFixed(2)}, mode = ${st.mode}, atoms fired = ${st.hits.length}`, 14, H - 14);
  updateReadout();
}

function updateReadout() {
  rJ.textContent = String(st.J);
  rSpots.textContent = String(Math.round(2 * st.J + 1));
  rGrad.textContent = st.dBdz.toFixed(2);
  rN.textContent = String(st.hits.length);
  rMode.textContent = st.mode;
}

function readSliders() {
  st.J = parseFloat(selJ.value);
  st.dBdz = parseFloat(sGrad.value);
  st.rate = parseInt(sRate.value, 10);
  st.mode = selMode.value;
  const labelMap = { 0.5: '1/2', 1.0: '1', 1.5: '3/2', 2.0: '2' };
  vJ.textContent = labelMap[st.J] || String(st.J);
  vGrad.textContent = st.dBdz.toFixed(2);
  vRate.textContent = String(st.rate);
  vMode.textContent = st.mode === 'quantum' ? 'Q' : (st.mode === 'classical' ? 'C' : 'Q+C');
}

[selJ, sGrad, sRate, selMode].forEach(el => el.addEventListener('input', readSliders));
selJ.addEventListener('change', () => { readSliders(); st.hits = []; });
selMode.addEventListener('change', () => { readSliders(); st.hits = []; });
btnReset.addEventListener('click', () => {
  st.t = 0;
  st.atoms = [];
  st.hits = [];
  st.rng = makeRng(0xC0FFEE);
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  J: { get: () => st.J, set: v => { st.J = parseFloat(v); selJ.value = v; }, parse: parseFloat },
  dBdz: { get: () => st.dBdz, set: v => { st.dBdz = parseFloat(v); sGrad.value = v; }, parse: parseFloat },
  rate: { get: () => st.rate, set: v => { st.rate = parseInt(v, 10); sRate.value = v; }, parse: parseInt },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  const target = 0.8 + 4.0 * (CAPTURE_FRAC || 0);
  let tt = 0;
  while (tt < target) {
    stepAtoms(0.05);
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
      stepAtoms(dt);
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
  const nSpots = Math.round(2 * st.J + 1);
  return {
    fields: [
      { key: 'j-quantum', label: 'Angular momentum J', value: st.J, format: 'float' },
      { key: 'num-spots', label: 'Expected spots (2J+1)', value: nSpots, format: 'float' },
      { key: 'gradient', label: 'Gradient dB/dz', value: st.dBdz, format: 'float' },
      { key: 'hits', label: 'Atoms fired', value: st.hits.length, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const nSpots = Math.round(2 * st.J + 1);
  const j_positive = st.J >= 0;
  return [
    {
      key: 'spin-validity',
      label: 'J >= 0',
      value: j_positive ? 'pass' : `J=${st.J}`,
      status: j_positive ? 'pass' : 'drift'
    }
  ];
};
