import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// 2D PM disc render.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createDisk, stepPM, totalAngularMomentum, totalMass, NPARTICLES } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderR      = document.getElementById('slider-R');
const sliderSpeed  = document.getElementById('slider-speed');
const valueR       = document.getElementById('value-R');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  R: 1.0,
  speed: 1,
  sim: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function rebuild() {
  state.sim = createDisk({ N: NPARTICLES, M: 1.0, R: state.R, seed: SEED });
}

// Cool slow -> warm fast speed ramp (no rainbow).
function speedColor(t) {
  const u = t < 0 ? 0 : (t > 1 ? 1 : t);
  if (u < 0.5) { const s = u / 0.5; return [40 + 30 * s, 90 + 90 * s, 150 + 60 * s]; }
  const s = (u - 0.5) / 0.5;
  return [70 + 185 * s, 180 + 30 * s, 210 - 130 * s];
}

function drawAll() {
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const sim = state.sim, N = sim.N;
  const PLOT = { x: 24, y: 30, w: W - 48, h: H - 90 };
  const side = Math.min(PLOT.w, PLOT.h);
  const ox = PLOT.x + (PLOT.w - side) / 2, oy = PLOT.y + (PLOT.h - side) / 2;

  // Zoom to the disc: a window a few scale lengths across, centred on
  // the particle centre of mass, so the disc fills the frame instead of
  // sitting as a speck in the periodic box.
  let comx = 0, comy = 0;
  for (let p = 0; p < N; p += 1) { comx += sim.x[2 * p]; comy += sim.x[2 * p + 1]; }
  comx /= N; comy /= N;
  const HW = 3.4 * state.R;
  const toPx = (x, y) => ({
    px: ox + side * (0.5 + (x - comx) / (2 * HW)),
    py: oy + side * (0.5 - (y - comy) / (2 * HW)),
  });

  // Faint reference: one scale-length ring and the centre.
  const c0 = toPx(comx, comy), cR = toPx(comx + state.R, comy);
  ctx.strokeStyle = 'rgba(150,170,210,0.16)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c0.px, c0.py, Math.abs(cR.px - c0.px), 0, 2 * Math.PI); ctx.stroke();

  // Robust speed scale (track a smoothed max so the colour map is stable).
  let vmax = 1e-6;
  for (let p = 0; p < N; p += 1) {
    const sx = sim.v[2 * p], sy = sim.v[2 * p + 1];
    const sp = Math.sqrt(sx * sx + sy * sy);
    if (sp > vmax) vmax = sp;
  }
  state.vmaxSmooth = state.vmaxSmooth ? 0.92 * state.vmaxSmooth + 0.08 * vmax : vmax;
  const vs = state.vmaxSmooth * 0.85;

  // Additive soft points so the spiral arms and clumps bloom where the
  // disc is dense.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let p = 0; p < N; p += 1) {
    const x = sim.x[2 * p], y = sim.x[2 * p + 1];
    const dx = x - comx, dy = y - comy;
    if (Math.abs(dx) > HW || Math.abs(dy) > HW) continue;
    const sx = sim.v[2 * p], sy = sim.v[2 * p + 1];
    const sp = Math.sqrt(sx * sx + sy * sy);
    const c = speedColor(sp / vs);
    const pt = toPx(x, y);
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.5)`;
    ctx.beginPath(); ctx.arc(pt.px, pt.py, 1.7, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();

  // Scale bar (1 R).
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
  const b0 = ox + 14, b1 = b0 + side / (2 * HW) * state.R, by = oy + side - 14;
  ctx.beginPath(); ctx.moveTo(b0, by); ctx.lineTo(b1, by); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'left';
  ctx.fillText('1 scale length R', b0, by - 6);

  // Readout.
  const M = totalMass(sim);
  const Lz = totalAngularMomentum(sim);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.fillText(`t = ${sim.t.toFixed(2)}   N = ${N}   R = ${state.R.toFixed(2)}   M = ${M.toFixed(3)}   L_z = ${Lz.toFixed(3)}`, 24, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('colour = orbital speed (cool slow to warm fast); view zoomed to the disc', 24, H - 14);
}

function tickN(n) {
  if (!state.sim) return;
  for (let i = 0; i < n; i += 1) stepPM(state.sim, 0.02);
}

sliderR.addEventListener('change', () => { state.R = parseFloat(sliderR.value); valueR.textContent = state.R.toFixed(2); rebuild(); drawAll(); });
sliderR.addEventListener('input', () => { valueR.textContent = parseFloat(sliderR.value).toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 100);
    tickN(target);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// State reports the particle count, initial disk radius and the
// total angular momentum. The invariant checks total linear
// momentum: the particle-mesh force is internal (it sums to zero
// over all particles), so the disk's net momentum must not drift.
// (Angular momentum is only approximately conserved by the mesh, so
// it is reported in state but not used as a strict invariant.)
window.playground = window.playground || {};
let __P0x = null, __P0y = null, __simRef = null;
window.playground.getState = function () {
  const s = state.sim;
  if (!s) return { fields: [] };
  return {
    fields: [
      { key: 'particles', label: 'disk particles', value: String(s.N) },
      { key: 'disk-radius', label: 'initial disk radius', value: state.R, format: 'float' },
      { key: 'angular-momentum', label: 'total angular momentum Lz', value: totalAngularMomentum(s), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const s = state.sim;
  if (!s) return [];
  let px = 0, py = 0;
  for (let p = 0; p < s.N; p += 1) {
    px += s.m[p] * s.v[2 * p];
    py += s.m[p] * s.v[2 * p + 1];
  }
  if (s !== __simRef) { __simRef = s; __P0x = px; __P0y = py; }   // re-baseline on disk rebuild
  const drift = Math.hypot(px - __P0x, py - __P0y);
  return [{
    key: 'momentum',
    label: 'total linear momentum conserved (particle-mesh force)',
    value: drift.toExponential(2),
    status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
  }];
};
