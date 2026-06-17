// Kelvin-Helmholtz instability playground.
// Two sheared fluid layers; Stuart 1967 cats-eye flow as A varies
// from 0 to 0.7; tracer particles advected via RK4 visualize the
// rollup.

import {
  streamFunction, velocity, vorticity, rk4Step, makeTracers,
  BOX_X, BOX_Y_HALF, makeRng, dispersion_sigma,
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

const rA = document.getElementById('readout-A');
const rLam = document.getElementById('readout-lam');
const rN = document.getElementById('readout-N');
const rSig = document.getElementById('readout-sig');
const rTr = document.getElementById('readout-tr');

const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const selStream = document.getElementById('select-stream'), vStream = document.getElementById('value-stream');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  A: 0.30,
  N: 2000,
  speed: 2,
  showStreamlines: true,
  running: !prefersReducedMotion(),
  rng: makeRng(0xC0FFEE),
  tracers: [],
  t: 0,
};

function world2screen(x, y) {
  // World x in [0, 2 pi]; world y in [-pi, pi].
  const sx = (x / BOX_X) * W;
  const sy = (1 - (y + BOX_Y_HALF) / (2 * BOX_Y_HALF)) * H;
  return { x: sx, y: sy };
}

function reseedTracers() {
  st.tracers = [];
  const n = Math.floor(st.N);
  for (let i = 0; i < n; i++) {
    const band = (i < n / 2) ? 1 : -1;
    const x = (st.rng() * BOX_X);
    const y = band * (0.20 + 0.65 * st.rng());
    st.tracers.push({ x, y, band });
  }
}

function stepTracers(dt) {
  const dts = dt * st.speed * 1.2;
  for (const p of st.tracers) {
    const r = rk4Step(p.x, p.y, st.A, dts);
    p.x = r.x;
    p.y = r.y;
  }
}

function drawBackground() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Optional: vorticity heatmap as faint backdrop.
  if (st.showStreamlines) drawStreamlines();
}

function drawStreamlines() {
  // Render closed streamlines by sampling 20 contour levels of psi
  // on a coarse grid, then drawing isolines via marching squares.
  // Simpler approach: trace a few seed points to draw open lines.
  const N_PSI = 18;
  for (let i = 0; i < N_PSI; i++) {
    const y0 = -BOX_Y_HALF + (i + 0.5) / N_PSI * 2 * BOX_Y_HALF;
    if (Math.abs(y0) < 0.2) continue;     // skip the unstable region
    const alpha = 0.18 - 0.06 * Math.abs(y0) / BOX_Y_HALF;
    ctx.strokeStyle = `rgba(120, 200, 255, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let x = 0, y = y0;
    const sStart = world2screen(x, y);
    ctx.moveTo(sStart.x, sStart.y);
    let dt = 0.04, steps = 320;
    for (let k = 0; k < steps; k++) {
      const r = rk4Step(x, y, st.A, dt);
      x = r.x; y = r.y;
      const s = world2screen(x, y);
      ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
  }
  // Streamlines inside the cats-eye (closed orbits around the vortex
  // centers at (pi, 0)).
  if (st.A > 0.05) {
    const centers = [{ x: Math.PI, y: 0 }];
    for (const c of centers) {
      for (let r = 0.15; r <= 0.7; r += 0.15) {
        ctx.strokeStyle = `rgba(255, 220, 140, ${(0.28 - r * 0.15).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        let x = c.x + r, y = c.y;
        const s0 = world2screen(x, y);
        ctx.moveTo(s0.x, s0.y);
        for (let k = 0; k < 200; k++) {
          const rr = rk4Step(x, y, st.A, 0.05);
          x = rr.x; y = rr.y;
          const s = world2screen(x, y);
          ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
      }
    }
  }
}

function drawTracers() {
  for (const p of st.tracers) {
    const s = world2screen(p.x, p.y);
    // Color by initial band.
    const col = p.band > 0 ? [255, 200, 100] : [120, 220, 255];
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.65)`;
    ctx.fillRect(s.x - 0.8, s.y - 0.8, 1.6, 1.6);
  }
}

function drawAxes() {
  // Interface centerline.
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.15)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  const mid = world2screen(0, 0);
  ctx.beginPath(); ctx.moveTo(0, mid.y); ctx.lineTo(W, mid.y); ctx.stroke();
  ctx.setLineDash([]);
  // Title strip.
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('upper layer (yellow)', 14, 22);
  ctx.fillStyle = 'rgba(120, 220, 255, 0.85)';
  ctx.fillText('lower layer (cyan)', 14, H - 14);
}

function updateReadout() {
  rA.textContent = st.A.toFixed(3);
  rLam.textContent = (2 * Math.PI).toFixed(3);
  // Count vortices visible: 1 per wavelength inside the box.
  rN.textContent = '1 per 2 pi';
  rSig.textContent = (1 / 2).toFixed(3);
  rTr.textContent = String(st.tracers.length);
}

function draw() {
  drawBackground();
  drawAxes();
  drawTracers();
  updateReadout();
  // Caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`Stuart A = ${st.A.toFixed(2)} (A = 0 plain shear, A approaching 1 sharp vortices)`, 14, H / 2 + 16);
}

function readSliders() {
  st.A = parseFloat(sA.value);
  st.N = parseInt(sN.value, 10);
  st.speed = parseInt(sSpeed.value, 10);
  st.showStreamlines = selStream.value === 'on';
  vA.textContent = st.A.toFixed(2);
  vN.textContent = String(st.N);
  vSpeed.textContent = String(st.speed);
  vStream.textContent = st.showStreamlines ? 'on' : 'off';
}

[sA, sN, sSpeed, selStream].forEach(el => el.addEventListener('input', readSliders));
selStream.addEventListener('change', readSliders);
sN.addEventListener('change', reseedTracers);
btnReset.addEventListener('click', () => { st.t = 0; reseedTracers(); });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  stuart_A: { get: () => st.A, set: v => { st.A = parseFloat(v); sA.value = v; }, parse: parseFloat },
  tracer_N: { get: () => st.N, set: v => { st.N = parseInt(v, 10); sN.value = v; }, parse: parseInt },
};
parseUrlState(SHARE_KEYS);
readSliders();
reseedTracers();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // For capture, sweep A from 0 to 0.6 with the fraction.
  st.A = 0.05 + 0.55 * (CAPTURE_FRAC || 0);
  sA.value = String(st.A);
  // Pre-advance tracers for visual interest.
  let tt = 0;
  while (tt < 3) {
    stepTracers(0.04);
    tt += 0.04;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      stepTracers(dt);
      st.t += dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
// The Stuart-vortex flow comes from a stream function, so it is
// incompressible: div(v) = 0 everywhere. The numerical divergence,
// sampled across the box, is the invariant.
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'stuart-a', label: 'Stuart amplitude A', value: st.A, format: 'float' },
      { key: 'vorticity-core', label: 'Peak vorticity $\\omega$ (core)', value: vorticity(Math.PI, 0, st.A), format: 'float' },
      { key: 'tracers', label: 'tracer particles', value: Math.floor(st.N) },
      { key: 'sim-time', label: 'time', value: st.t.toFixed(2), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const h = 1e-3;
  let maxDiv = 0;
  for (let i = 0; i < 24; i += 1) {
    const x = ((i * 0.6180339) % 1) * BOX_X;
    const y = (((i * 0.3819660) % 1) * 2 - 1) * BOX_Y_HALF * 0.9;
    const div = (velocity(x + h, y, st.A).u - velocity(x - h, y, st.A).u) / (2 * h)
      + (velocity(x, y + h, st.A).v - velocity(x, y - h, st.A).v) / (2 * h);
    if (Math.abs(div) > maxDiv) maxDiv = Math.abs(div);
  }
  return [
    {
      key: 'incompressible',
      label: 'flow is incompressible (max |div v|)',
      value: maxDiv.toExponential(2),
      status: maxDiv < 1e-3 ? 'pass' : (maxDiv < 1e-1 ? 'pending' : 'drift'),
    },
  ];
};
