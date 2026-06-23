import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Cyclotron orbit visualization.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createCyclotron, stepCyclotron, speed,
  cyclotronRadius, cyclotronPeriod,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderB      = document.getElementById('slider-B');
const sliderV      = document.getElementById('slider-v');
const sliderQ      = document.getElementById('slider-q');
const sliderM      = document.getElementById('slider-m');
const sliderSpeed  = document.getElementById('slider-speed');
const valueB       = document.getElementById('value-B');
const valueV       = document.getElementById('value-v');
const valueQ       = document.getElementById('value-q');
const valueM       = document.getElementById('value-m');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  B: 1.0,
  v: 1.0,
  q: 1.0,
  m: 1.0,
  speed: 2,
  sim: null,
  trail: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  // Multi-particle mode: show 5 particles at different speeds to
  // visualize that period is independent of speed while radius scales with it.
  multiTrails: [],
};

function initMultiParticles() {
  const speeds = [0.4, 0.7, 1.0, 1.3, 1.6];
  state.multiTrails = speeds.map(sp => ({
    v: sp,
    sim: createCyclotron({ B: state.B, v: sp, q: state.q, m: state.m }),
    trail: [],
  }));
}

initMultiParticles();

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  state.sim = createCyclotron({ B: state.B, v: state.v, q: state.q, m: state.m });
  state.trail = [];
  initMultiParticles();
}

// View is centred on the orbit cluster (the swarm orbits are tangent at the
// launch point and bulge to one side, so centring on the origin wastes half
// the panel). Set per frame in drawAll from the largest swarm radius.
const VIEW = { cx: 1, cy: 0, scale: 120, ox: 400, oy: 320 };
function worldToPx(x, y) {
  return { px: VIEW.ox + (x - VIEW.cx) * VIEW.scale, py: VIEW.oy - (y - VIEW.cy) * VIEW.scale };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  const r = cyclotronRadius(state.v, state.B);
  const T = cyclotronPeriod(state.B);

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`B = ${state.B.toFixed(2)}   |v| = ${state.v.toFixed(2)}   t = ${state.sim.t.toFixed(2)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`r = m v / (q B) = ${r.toFixed(3)}   T = 2 pi m / (q B) = ${T.toFixed(3)}   omega_c = ${(2 * Math.PI / T).toFixed(3)}`, 30, 40);

  // Layout: square orbit scene on top, r(v)/T(v) diagnostic below.
  const padL = 30, padR = 30, padT = 56;
  const drawW = W - padL - padR;
  const sceneH = Math.round(H * 0.585);
  const rMaxSwarm = cyclotronRadius(1.6, state.B);
  const half = Math.max(0.35, rMaxSwarm) * 1.16;          // cluster half-extent (orbits span a 2 rMax box)
  VIEW.cx = rMaxSwarm; VIEW.cy = 0;
  VIEW.scale = Math.min(drawW, sceneH) / (2 * half);
  VIEW.ox = padL + drawW / 2; VIEW.oy = padT + sceneH / 2;

  // Scene frame
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, sceneH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, sceneH - 1);

  // B-field "dots" pattern (out-of-page B) tiling the visible world.
  ctx.save();
  ctx.beginPath(); ctx.rect(padL, padT, drawW, sceneH); ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  const wL = VIEW.cx - drawW / 2 / VIEW.scale, wR = VIEW.cx + drawW / 2 / VIEW.scale;
  const wB = VIEW.cy - sceneH / 2 / VIEW.scale, wT = VIEW.cy + sceneH / 2 / VIEW.scale;
  const ds = 0.4;
  for (let gx = Math.ceil(wL / ds) * ds; gx <= wR; gx += ds) {
    for (let gy = Math.ceil(wB / ds) * ds; gy <= wT; gy += ds) {
      const p = worldToPx(gx, gy);
      ctx.beginPath(); ctx.arc(p.px, p.py, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  // Analytic circle (cyan dashed)
  const cx_world = r, cy_world = 0;
  const cxp = worldToPx(cx_world, cy_world);
  ctx.strokeStyle = 'rgba(127, 177, 216, 0.50)';
  ctx.lineWidth = 1.0;
  ctx.setLineDash([4, 4]);
  const rPx = Math.abs(worldToPx(r, 0).px - worldToPx(0, 0).px);
  ctx.beginPath();
  ctx.arc(cxp.px, cxp.py, rPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Multi-particle trails (from swarm at different speeds).
  const colors = [
    'rgba(100, 200, 255, 0.3)',  // slow: blue
    'rgba(100, 220, 220, 0.4)',  // blue-cyan
    'rgba(241, 210, 138, 0.5)',  // medium: orange (the focused one)
    'rgba(255, 150, 100, 0.4)',  // orange-red
    'rgba(255, 100, 100, 0.3)',  // fast: red
  ];
  for (let i = 0; i < state.multiTrails.length; i += 1) {
    const mt = state.multiTrails[i];
    if (mt.trail.length >= 2) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let j = 0; j < mt.trail.length; j += 1) {
        const p = worldToPx(mt.trail[j][0], mt.trail[j][1]);
        if (j === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    }
  }

  // Trail (the main single particle, shown with emphasis).
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(241, 210, 138, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const p = worldToPx(state.trail[i][0], state.trail[i][1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Current particle
  const pPx = worldToPx(state.sim.x, state.sim.y);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath();
  ctx.arc(pPx.px, pPx.py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Velocity arrow
  const vMag = speed(state.sim);
  if (vMag > 1e-6) {
    const ux = state.sim.vx / vMag, uy = state.sim.vy / vMag;
    const arrowLenWorld = 0.5;
    const p2 = worldToPx(state.sim.x + arrowLenWorld * ux, state.sim.y + arrowLenWorld * uy);
    ctx.strokeStyle = tok.accentWarm;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pPx.px, pPx.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();
  }

  // Compact scene note (inside the scene box).
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('B out of page (dots); orange = main particle; dashed = analytic circle', padL + 10, padT + sceneH - 12);

  // r(v) / T(v) diagnostic in the lower band.
  drawDiagnostic(padL, drawW, padT + sceneH + 18, H - 28);
}

// Diagnostic: radius r = m v / (q B) and period T = 2 pi m / (q B) versus
// speed. The radius rises linearly with v while the period is flat (the
// defining cyclotron result), so the swarm of different speeds all close
// their loops in step. The coloured dots are the five swarm members.
function drawDiagnostic(padL, drawW, top, bot) {
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(padL, top, drawW, bot - top);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.strokeRect(padL + 0.5, top + 0.5, drawW - 1, bot - top - 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('radius r and period T vs speed v: r grows with v, T is fixed', padL + 10, top + 14);
  const vmax = 1.8, rmaxv = cyclotronRadius(vmax, state.B), Tval = cyclotronPeriod(state.B);
  const ax = padL + 54, aw = drawW - 54 - 18, ay = top + 30, ah = bot - top - 30 - 24;
  const PX = (v) => ax + v / vmax * aw;
  const PYr = (rr) => ay + ah - rr / (rmaxv * 1.15) * ah;
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  // period reference (flat)
  const Ty = ay + 14;
  ctx.strokeStyle = 'rgba(127,177,216,0.7)'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(ax, Ty); ctx.lineTo(ax + aw, Ty); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,177,216,0.9)'; ctx.textAlign = 'right'; ctx.fillText(`T = ${Tval.toFixed(2)} (independent of v)`, ax + aw - 6, Ty - 5);
  // radius line
  ctx.strokeStyle = 'rgba(241,210,138,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) { const v = vmax * i / 60; const p = PX(v), q = PYr(cyclotronRadius(v, state.B)); if (i === 0) ctx.moveTo(p, q); else ctx.lineTo(p, q); }
  ctx.stroke();
  // swarm members
  const speeds = [0.4, 0.7, 1.0, 1.3, 1.6], cols = ['#64c8ff', '#64dcdc', '#f1d28a', '#ff9664', '#ff6464'];
  speeds.forEach((sp, i) => { const p = PX(sp), q = PYr(cyclotronRadius(sp, state.B)); ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(p, q, 4, 0, 6.2832); ctx.fill(); });
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'center'; ctx.fillText('speed v', ax + aw / 2, ay + ah + 16);
  ctx.save(); ctx.translate(padL + 16, ay + ah / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(241,210,138,0.8)'; ctx.fillText('radius r', 0, 0); ctx.restore();
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    // Step the main particle.
    stepCyclotron(state.sim, 0.005);
    if (state.sim.nSteps % 2 === 0) {
      state.trail.push([state.sim.x, state.sim.y]);
      if (state.trail.length > 800) state.trail.shift();
    }
    // Step all multi-particle swarm members.
    for (const mt of state.multiTrails) {
      stepCyclotron(mt.sim, 0.005);
      if (mt.sim.nSteps % 4 === 0) {
        mt.trail.push([mt.sim.x, mt.sim.y]);
        if (mt.trail.length > 400) mt.trail.shift();
      }
    }
  }
}

// Sliders update the LIVE sim's parameters in place (state.sim.B,
// .q, .m get rewritten on every input event). The trail and the
// particle position are preserved so the user sees a continuous
// trajectory whose curvature shifts smoothly as the slider moves.
// Only the Reset button resets position + clears the trail.
function applyLiveParams() {
  if (!state.sim) return;
  state.sim.B = state.B;
  state.sim.q = state.q;
  state.sim.m = state.m;
  // Update multi-particle swarm as well.
  for (const mt of state.multiTrails) {
    mt.sim.B = state.B;
    mt.sim.q = state.q;
    mt.sim.m = state.m;
  }
}
sliderB.addEventListener('input', () => { state.B = parseFloat(sliderB.value); valueB.textContent = state.B.toFixed(2); applyLiveParams(); });
sliderV.addEventListener('input', () => {
  // Speed change rescales the current velocity vector to the new |v|
  // while preserving direction; this keeps the trajectory smooth.
  const newV = parseFloat(sliderV.value);
  valueV.textContent = newV.toFixed(2);
  if (state.sim) {
    const curV = Math.hypot(state.sim.vx, state.sim.vy) || 1;
    state.sim.vx *= newV / curV;
    state.sim.vy *= newV / curV;
  }
  state.v = newV;
});
sliderQ.addEventListener('input', () => { state.q = parseFloat(sliderQ.value); valueQ.textContent = state.q.toFixed(2); applyLiveParams(); });
sliderM.addEventListener('input', () => { state.m = parseFloat(sliderM.value); valueM.textContent = state.m.toFixed(2); applyLiveParams(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const T = cyclotronPeriod(state.B);
    const target = Math.round(frac * T / 0.005);
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
window.playground = window.playground || {};
window.playground.getState = function () {
  const qm = state.qm || 1;
  const B = state.B || 1;
  const v = state.v || 1;
  const omega_c = qm * B;
  const T_c = 2 * Math.PI / omega_c;
  const r_cyc = v / omega_c;
  return {
    fields: [
      { key: 'qm-ratio', label: 'q/m', value: qm, format: 'float' },
      { key: 'b-field', label: 'B field', value: B, format: 'float' },
      { key: 'velocity', label: 'v', value: v, format: 'float' },
      { key: 'period', label: 'T_c', value: T_c, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const qm = state.qm || 1;
  const B = state.B || 1;
  const v = state.v || 1;
  const omega_c = qm * B;
  const T_c = 2 * Math.PI / omega_c;
  const r_cyc = v / omega_c;
  const traj = state.trajectory || [];
  if (traj.length < 2) {
    return [{ key: 'init', label: 'computing', value: 'pending', status: 'pending' }];
  }
  let distSq = 0, count = 0;
  for (let i = 0; i < Math.min(traj.length, 100); i++) {
    const x = traj[i].x, y = traj[i].y;
    distSq += x * x + y * y;
    count++;
  }
  const meanR = Math.sqrt(distSq / count);
  const ratioDrift = Math.abs(meanR - r_cyc) / (r_cyc + 1e-6);
  return [
    {
      key: 'radius',
      label: 'cyclotron radius r = v/omega_c',
      value: ratioDrift.toExponential(2),
      status: ratioDrift < 0.05 ? 'pass' : 'drift'
    }
  ];
};
