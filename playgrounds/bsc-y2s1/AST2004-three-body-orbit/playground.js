import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Three-body figure-eight choreography UI. Three colored bodies with trails on
// the same canvas; one slider for the perturbation dv.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createThreeBodyFromIC,
  ORBIT_CATALOG,
  stepThreeBody,
  threeBodyDiagnostics,
  DEFAULT_DT,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  dv:       document.getElementById('readout-dv'),
  E:        document.getElementById('readout-E'),
  dE:       document.getElementById('readout-dE'),
  P:        document.getElementById('readout-P'),
  L:        document.getElementById('readout-L'),
  t:        document.getElementById('readout-t'),
};
const sliderDv     = document.getElementById('slider-dv');
const valueDv      = document.getElementById('value-dv');
const selOrbit     = document.getElementById('select-orbit');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PY0 = 26, PYH = 540;                     // orbit panel (top); separations diagnostic fills below
const ASPECT = PYH / W;
let VIEW = { xmin: -1.6, xmax: 1.6, ymin: -1.07, ymax: 1.07 };
const TRAIL_MAX = 6000;
const SEP = { x: 40, y: 588, w: W - 80, h: H - 588 - 16 };
const sepHist = [];                            // { t, r12, r23, r31 } over ~one period
const SEP_KEEP = 900;

const state = {
  orbit: 'figure-eight',
  dv: 0,
  tb: null,
  trails: [[], [], []],
  tElapsed: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function setView(half) {
  VIEW = { xmin: -half, xmax: half, ymin: -half * ASPECT, ymax: half * ASPECT };
}

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
  cat1:       cssVar('--cat-1', '#4C72B0'),
  cat2:       cssVar('--cat-2', '#DD8452'),
  cat3:       cssVar('--cat-3', '#55A868'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};
const colors = [tokens.cat1, tokens.cat2, tokens.cat3];

function rebuild() {
  const entry = ORBIT_CATALOG[state.orbit] || ORBIT_CATALOG['figure-eight'];
  const ic = entry.ic();
  ic.velocities = ic.velocities.slice();
  ic.velocities[4] += state.dv;                 // small perturbation on body 3 vx
  state.tb = createThreeBodyFromIC({ ic });
  setView(entry.view);
  state.trails = [[], [], []];
  state.tElapsed = 0;
  sepHist.length = 0;
}

function px(x, y) {
  return {
    px: ((x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin)) * W,
    py: PY0 + (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)) * PYH,
  };
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // grid (clipped to the orbit panel)
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -1.5; x <= 1.5; x += 0.5) {
    const { px: xp } = px(x, 0);
    ctx.moveTo(xp, PY0); ctx.lineTo(xp, PY0 + PYH);
  }
  for (let y = -1.5; y <= 1.5; y += 0.5) {
    const { py: yp } = px(0, y);
    if (yp < PY0 || yp > PY0 + PYH) continue;
    ctx.moveTo(0, yp); ctx.lineTo(W, yp);
  }
  ctx.stroke();

  // axes
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  const o = px(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, PY0); ctx.lineTo(o.px, PY0 + PYH);
  ctx.stroke();

  // trails (3 bodies)
  for (let i = 0; i < 3; i += 1) {
    const tr = state.trails[i];
    if (tr.length < 2) continue;
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const first = px(tr[0].x, tr[0].y);
    ctx.moveTo(first.px, first.py);
    for (let k = 1; k < tr.length; k += 1) {
      const q = px(tr[k].x, tr[k].y);
      ctx.lineTo(q.px, q.py);
    }
    ctx.stroke();
  }

  // bodies
  if (state.tb) {
    for (let i = 0; i < 3; i += 1) {
      const x = state.tb.inst.q[2 * i];
      const y = state.tb.inst.q[2 * i + 1];
      const p = px(x, y);
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(p.px, p.py, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  ctx.fillStyle = tokens.fgMuted;
  ctx.font = fontString(canvas, 'caption');
  ctx.textAlign = 'left';
  const entry = ORBIT_CATALOG[state.orbit] || ORBIT_CATALOG['figure-eight'];
  ctx.fillText(`${state.orbit}  (G = m_i = 1, T = ${entry.period.toFixed(3)})`, 20, 22);

  drawSeparations();
}

// The three pairwise separations vs time: for a periodic choreography they
// trace out a repeating pattern, and the deep dips are the close two-body
// passages that make these orbits so delicate.
function drawSeparations() {
  const { x: x0, y: y0, w, h } = SEP, x1 = x0 + w, y1 = y0 + h;
  ctx.fillStyle = '#0c0d12'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.lineWidth = 0.6; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.fillStyle = tokens.fgMuted; ctx.font = fontString(canvas, 'caption'); ctx.textAlign = 'left';
  ctx.fillText('pairwise separations vs time (dips = close passages)', x0 + 10, y0 + 16);
  if (sepHist.length < 2) return;
  const plT = y0 + 26, plB = y1 - 26, plL = x0 + 40, plR = x1 - 12;
  let hi = 0.1;
  for (const s of sepHist) hi = Math.max(hi, s.r12, s.r23, s.r31);
  hi *= 1.08;
  const t0 = sepHist[0].t, tSpan = Math.max(1e-6, sepHist[sepHist.length - 1].t - t0);
  const xt = (t) => plL + (t - t0) / tSpan * (plR - plL);
  const yr = (r) => plB - r / hi * (plB - plT);
  ctx.strokeStyle = tokens.fgFaint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(plL, plT); ctx.lineTo(plL, plB); ctx.lineTo(plR, plB); ctx.stroke();
  const keys = [['r12', colors[0]], ['r23', colors[2]], ['r31', colors[1]]];
  for (const [key, col] of keys) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
    sepHist.forEach((s, i) => { const X = xt(s.t), Y = yr(s[key]); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
    ctx.stroke();
  }
  ctx.font = fontString(canvas, 'tick'); ctx.textAlign = 'left';
  ctx.fillStyle = colors[0]; ctx.fillText('1-2', plL + 6, plT + 12);
  ctx.fillStyle = colors[2]; ctx.fillText('2-3', plL + 44, plT + 12);
  ctx.fillStyle = colors[1]; ctx.fillText('3-1', plL + 82, plT + 12);
  ctx.fillStyle = tokens.fgMuted; ctx.textAlign = 'center'; ctx.fillText('time', (plL + plR) / 2, plB + 15);
  ctx.save(); ctx.translate(x0 + 14, (plT + plB) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('separation', 0, 0); ctx.restore();
}

function updateReadouts() {
  readouts.dv.textContent = state.dv.toFixed(4);
  if (!state.tb) return;
  const d = threeBodyDiagnostics(state.tb);
  readouts.E.textContent  = d.energy.toFixed(6);
  readouts.dE.textContent = Math.abs(d.energyDrift).toExponential(2);
  readouts.P.textContent  = d.momentumMag.toExponential(2);
  readouts.L.textContent  = d.angularMomentum.toExponential(2);
  readouts.t.textContent  = d.t.toFixed(2);
  readouts.dE.classList.toggle('warn', Math.abs(d.energyDrift) > 1e-3);
}

// The Suvakov orbits have close two-body passages that fixed-step
// velocity-Verlet under-resolves at DEFAULT_DT (the orbit then fails
// to close). Sub-step the integrator so one visual step still advances
// DEFAULT_DT but with SUBSTEPS finer Verlet steps. sim.js unchanged.
const SUBSTEPS = 16;
function stepOnce() {
  const h = DEFAULT_DT / SUBSTEPS;
  for (let k = 0; k < SUBSTEPS; k += 1) stepThreeBody(state.tb, h);
  state.tElapsed += DEFAULT_DT;
  for (let i = 0; i < 3; i += 1) {
    const tr = state.trails[i];
    tr.push({ x: state.tb.inst.q[2 * i], y: state.tb.inst.q[2 * i + 1] });
    if (tr.length > TRAIL_MAX) tr.shift();
  }
  const q = state.tb.inst.q;
  sepHist.push({
    t: state.tElapsed,
    r12: Math.hypot(q[0] - q[2], q[1] - q[3]),
    r23: Math.hypot(q[2] - q[4], q[3] - q[5]),
    r31: Math.hypot(q[4] - q[0], q[5] - q[1]),
  });
  if (sepHist.length > SEP_KEEP) sepHist.shift();
  // Re-seed at each period so the delicate choreographies keep
  // redrawing as the recognizable closed orbit instead of drifting.
  const period = (ORBIT_CATALOG[state.orbit] || {}).period || 6.3;
  if (state.tElapsed >= 0.985 * period) {
    const keepOrbit = state.orbit, keepDv = state.dv;
    state.orbit = keepOrbit; state.dv = keepDv;
    rebuild();
  }
}

function applySlider() {
  state.dv = parseFloat(sliderDv.value);
  valueDv.textContent = state.dv.toFixed(4);
  rebuild();
  drawAll();
  updateReadouts();
}

sliderDv.addEventListener('input', applySlider);
selOrbit.addEventListener('change', () => {
  state.orbit = selOrbit.value;
  rebuild(); drawAll(); updateReadouts();
});
btnReset.addEventListener('click', () => {
  sliderDv.value = '0';
  applySlider();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  state.dv = parseFloat(sliderDv.value);
  valueDv.textContent = state.dv.toFixed(4);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(ORBIT_CATALOG);
    state.orbit = keys[Math.min(keys.length - 1, Math.round(frac * (keys.length - 1)))];
    if (selOrbit) selOrbit.value = state.orbit;
    rebuild();
    const period = (ORBIT_CATALOG[state.orbit] || {}).period || 6.3;
    // Draw just under one period: one clean closed choreography loop
    // before truncated-IC sensitivity becomes visible.
    const steps = Math.round(0.985 * period / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepOnce();
    state.playing = false;
  } else {
    rebuild();
  }
  drawAll();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, dv: state.dv };
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
  while (accumulator >= DEFAULT_DT && safety < 240) {
    stepOnce();
    accumulator -= DEFAULT_DT;
    safety += 1;
  }
  drawAll();
  updateReadouts();
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


// === Diagnostics interface (Layout System v2) ===
// State reports the total energy, angular momentum and linear-
// momentum magnitude. The invariants check the conserved quantities
// of the three-body Hamiltonian: total energy and total angular
// momentum must not drift under the symplectic flow (angular
// momentum drift is normalised so zero-L orbits like the figure-8
// are handled cleanly).
window.playground = window.playground || {};
let __L0 = null, __tbRef = null;
window.playground.getState = function () {
  const tb = state.tb;
  if (!tb) return { fields: [] };
  const d = threeBodyDiagnostics(tb);
  return {
    fields: [
      { key: 'energy', label: 'total energy', value: d.energy, format: 'float' },
      { key: 'angular-momentum', label: 'angular momentum', value: d.angularMomentum, format: 'float' },
      { key: 'momentum', label: 'total momentum |P|', value: d.momentumMag, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const tb = state.tb;
  if (!tb) return [];
  const d = threeBodyDiagnostics(tb);
  if (tb !== __tbRef) { __tbRef = tb; __L0 = d.angularMomentum; }   // re-baseline on orbit change
  const eDrift = Math.abs(d.energyDrift);
  const lDrift = Math.abs(d.angularMomentum - __L0) / Math.max(0.1, Math.abs(__L0));
  return [
    {
      key: 'energy',
      label: 'total energy conserved (three-body Hamiltonian)',
      value: eDrift.toExponential(2),
      status: eDrift < 1e-3 ? 'pass' : (eDrift < 1e-2 ? 'pending' : 'drift'),
    },
    {
      key: 'angular-momentum',
      label: 'total angular momentum conserved',
      value: lDrift.toExponential(2),
      status: lDrift < 1e-3 ? 'pass' : (lDrift < 1e-2 ? 'pending' : 'drift'),
    },
  ];
};
