// playground.js
// UI binding for the liouvillian-flow playground. Single canvas showing the
// pendulum phase portrait (theta on x, p on y) with the tracer cloud and the
// separatrix curve.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createSwarm,
  stepSwarm,
  covarianceArea,
  tracerEnergy,
  DEFAULT_PHYSICS_DT,
  DEFAULT_OMEGA,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  theta:    document.getElementById('readout-theta'),
  p:        document.getElementById('readout-p'),
  area:     document.getElementById('readout-area'),
  dArea:    document.getElementById('readout-dArea'),
  E0:       document.getElementById('readout-E0'),
  N:        document.getElementById('readout-N'),
  t:        document.getElementById('readout-t'),
};
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PHASE = { x: 60, y: 30, w: 480, h: 400,
                thetaMin: -Math.PI, thetaMax: Math.PI,
                pMin: -3,           pMax: 3 };
// Physical pendulum panel on the right. Each tracer's angular position is
// shown as a faint bob hanging from the panel origin so the user can watch
// the cloud librate, rotate, and filament in physical space.
const PEND = { cx: 700, cy: 220, L: 140 };

const TRACER_RADIUS = 1.2;

const state = {
  blob: { theta: 0.6, p: 0 },
  swarm: null,
  A0: 1,
  E0: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  dragging: false,
  steps: 0,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  accent:     cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};

function rebuildSwarm() {
  state.swarm = createSwarm({
    N: 256,
    omega: DEFAULT_OMEGA,
    blobCenter: state.blob,
    seed: SEED,
  });
  state.A0 = covarianceArea(state.swarm.inst.q, state.swarm.inst.qdot);
  state.E0 = tracerEnergy(state.swarm.inst.q[0], state.swarm.inst.qdot[0], DEFAULT_OMEGA);
  state.steps = 0;
}

function px(theta, p) {
  return {
    px: PHASE.x + ((theta - PHASE.thetaMin) / (PHASE.thetaMax - PHASE.thetaMin)) * PHASE.w,
    py: PHASE.y + (1 - (p - PHASE.pMin) / (PHASE.pMax - PHASE.pMin)) * PHASE.h,
  };
}

function wrapTheta(t) {
  let x = t;
  while (x >  Math.PI) x -= 2 * Math.PI;
  while (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

function drawBackground() {
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(PHASE.x, PHASE.y, PHASE.w, PHASE.h);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(PHASE.x + 0.5, PHASE.y + 0.5, PHASE.w - 1, PHASE.h - 1);

  ctx.beginPath();
  const o = px(0, 0);
  ctx.moveTo(PHASE.x, o.py); ctx.lineTo(PHASE.x + PHASE.w, o.py);
  ctx.moveTo(o.px, PHASE.y); ctx.lineTo(o.px, PHASE.y + PHASE.h);
  ctx.stroke();

  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const [t, lbl] of [[-Math.PI, '-pi'], [-Math.PI / 2, '-pi/2'], [0, '0'], [Math.PI / 2, 'pi/2'], [Math.PI, 'pi']]) {
    const { px: tx } = px(t, 0);
    ctx.fillText(lbl, tx, PHASE.y + PHASE.h + 13);
  }
  ctx.textAlign = 'right';
  for (const pTick of [-3, -2, -1, 0, 1, 2, 3]) {
    const { py } = px(0, pTick);
    ctx.fillText(pTick.toFixed(0), PHASE.x - 4, py + 3);
  }
}

function drawSeparatrix() {
  const omega = DEFAULT_OMEGA;
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 4]);
  for (const sign of [+1, -1]) {
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= 200; i += 1) {
      const theta = PHASE.thetaMin + i * (PHASE.thetaMax - PHASE.thetaMin) / 200;
      const pVal = sign * 2 * omega * Math.cos(theta / 2);
      const { px: x, py: y } = px(theta, pVal);
      if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawTracers() {
  if (!state.swarm) return;
  const q = state.swarm.inst.q;
  const p = state.swarm.inst.qdot;
  ctx.fillStyle = tokens.accent;
  for (let i = 0; i < q.length; i += 1) {
    const thetaW = wrapTheta(q[i]);
    const { px: x, py: y } = px(thetaW, p[i]);
    if (x < PHASE.x || x > PHASE.x + PHASE.w || y < PHASE.y || y > PHASE.y + PHASE.h) continue;
    ctx.beginPath();
    ctx.arc(x, y, TRACER_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawBlobHandle() {
  const { px: x, py: y } = px(state.blob.theta, state.blob.p);
  ctx.strokeStyle = tokens.accentWarm;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPendulumPanel() {
  // panel background
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(PEND.cx - PEND.L - 30, PEND.cy - 30, 2 * PEND.L + 60, PEND.L + 120);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(PEND.cx - PEND.L - 30 + 0.5, PEND.cy - 30 + 0.5, 2 * PEND.L + 60 - 1, PEND.L + 120 - 1);

  // pivot point
  ctx.fillStyle = tokens.fg;
  ctx.beginPath();
  ctx.arc(PEND.cx, PEND.cy, 2.5, 0, 2 * Math.PI);
  ctx.fill();
  // reference vertical line
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(PEND.cx, PEND.cy); ctx.lineTo(PEND.cx, PEND.cy + PEND.L);
  ctx.stroke();
  ctx.setLineDash([]);
  // reference arc at L
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(PEND.cx, PEND.cy, PEND.L, Math.PI / 2 - Math.PI, Math.PI / 2 + Math.PI);
  ctx.stroke();

  // tracer bobs: each tracer i sits at (cx + L sin(theta), cy + L cos(theta)).
  // Render as semi-transparent dots so accumulation highlights cluster density.
  if (state.swarm) {
    const q = state.swarm.inst.q;
    const N = q.length;
    ctx.fillStyle = 'rgba(27, 108, 168, 0.40)';     // tokens.accent with alpha
    for (let i = 0; i < N; i += 1) {
      const theta = q[i];                            // can be unwrapped (rotation branch)
      const bx = PEND.cx + PEND.L * Math.sin(theta);
      const by = PEND.cy + PEND.L * Math.cos(theta);
      ctx.beginPath();
      ctx.arc(bx, by, 2.2, 0, 2 * Math.PI);
      ctx.fill();
    }
    // mean bob: bigger, opaque, accent-warm so the cloud centroid is obvious.
    let sumS = 0, sumC = 0;
    for (let i = 0; i < N; i += 1) { sumS += Math.sin(q[i]); sumC += Math.cos(q[i]); }
    const meanTheta = Math.atan2(sumS, sumC);
    const mbx = PEND.cx + PEND.L * Math.sin(meanTheta);
    const mby = PEND.cy + PEND.L * Math.cos(meanTheta);
    ctx.strokeStyle = tokens.accentWarm;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PEND.cx, PEND.cy); ctx.lineTo(mbx, mby);
    ctx.stroke();
    ctx.fillStyle = tokens.accentWarm;
    ctx.beginPath();
    ctx.arc(mbx, mby, 4.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // panel label
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Physical pendulums (red rod = mean angle)',
               PEND.cx, PEND.cy - 38);
}

function drawTitles() {
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pendulum phase space (drag the dashed circle to set the blob center)', PHASE.x, PHASE.y - 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillText('theta', PHASE.x + PHASE.w / 2, PHASE.y + PHASE.h + 26);
  ctx.save();
  ctx.translate(PHASE.x - 38, PHASE.y + PHASE.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('p', 0, 0);
  ctx.restore();
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawBackground();
  drawSeparatrix();
  drawTracers();
  drawBlobHandle();
  drawPendulumPanel();
  drawTitles();
}

let lastReadoutTime = -Infinity;
function updateReadouts(force) {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (!force && now - lastReadoutTime < 100) return;
  lastReadoutTime = now;
  readouts.theta.textContent = state.blob.theta.toFixed(4);
  readouts.p.textContent     = state.blob.p.toFixed(4);
  if (state.swarm) {
    const A = covarianceArea(state.swarm.inst.q, state.swarm.inst.qdot);
    const E = tracerEnergy(state.swarm.inst.q[0], state.swarm.inst.qdot[0], DEFAULT_OMEGA);
    readouts.area.textContent  = A.toFixed(4);
    const dA = (A - state.A0) / Math.max(Math.abs(state.A0), 1e-12);
    readouts.dArea.textContent = dA.toExponential(2);
    readouts.dArea.classList.toggle('warn', Math.abs(dA) > 0.05);
    readouts.E0.textContent    = E.toFixed(4);
    readouts.N.textContent     = String(state.swarm.N);
    readouts.t.textContent     = state.swarm.inst.t.toFixed(2);
  }
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function inPhase(p) {
  return p.x >= PHASE.x && p.x <= PHASE.x + PHASE.w
      && p.y >= PHASE.y && p.y <= PHASE.y + PHASE.h;
}

function pixelToBlob(p) {
  const t = (p.x - PHASE.x) / PHASE.w;
  const u = 1 - (p.y - PHASE.y) / PHASE.h;
  return {
    theta: PHASE.thetaMin + t * (PHASE.thetaMax - PHASE.thetaMin),
    p:     PHASE.pMin     + u * (PHASE.pMax     - PHASE.pMin),
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPos(e);
  if (inPhase(p)) {
    state.dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    state.blob = pixelToBlob(p);
    rebuildSwarm();
    drawAll();
    updateReadouts(true);
    e.preventDefault();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.dragging) return;
  state.blob = pixelToBlob(canvasPos(e));
  rebuildSwarm();
  drawAll();
  updateReadouts(true);
});
canvas.addEventListener('pointerup', () => { state.dragging = false; });
canvas.addEventListener('pointercancel', () => { state.dragging = false; });
canvas.addEventListener('dblclick', () => {
  state.blob = { theta: 0.6, p: 0 };
  rebuildSwarm();
  drawAll();
  updateReadouts(true);
});

btnReset.addEventListener('click', () => {
  state.blob = { theta: 0.6, p: 0 };
  rebuildSwarm();
  drawAll();
  updateReadouts(true);
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

const CAPTURE_TOTAL_T = 6.0;

function bootSync() {
  rebuildSwarm();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target_t = CAPTURE_TOTAL_T * frac;
    const stepsNeeded = Math.round(target_t / DEFAULT_PHYSICS_DT);
    for (let i = 0; i < stepsNeeded; i += 1) stepSwarm(state.swarm, DEFAULT_PHYSICS_DT);
    state.steps = stepsNeeded;
    state.playing = false;
  }
  drawAll();
  updateReadouts(true);

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, t: state.swarm.inst.t };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let accumulator   = 0;

function tick(now) {
  if (!state.playing) {
    lastFrameTime = now;
    requestAnimationFrame(tick);
    return;
  }
  const frameDt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  accumulator += frameDt;
  let safety = 0;
  while (accumulator >= DEFAULT_PHYSICS_DT && safety < 240) {
    stepSwarm(state.swarm, DEFAULT_PHYSICS_DT);
    accumulator -= DEFAULT_PHYSICS_DT;
    state.steps += 1;
    safety += 1;
  }
  drawAll();
  updateReadouts(false);
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
