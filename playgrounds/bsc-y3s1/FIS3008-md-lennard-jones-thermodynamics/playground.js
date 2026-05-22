// Lennard-Jones MD (Canvas2D). The periodic box of particles coloured
// by kinetic energy, beside the live radial distribution g(r). sim.js
// is the LJ layer over the verified shared symplectic (velocity-
// Verlet) engine; this file is rendering and controls only.

import {
  makeLJ, ljStep, temperature, pressure, kineticEnergy,
  radialDistribution, rescaleTo, diagnostics, totalMomentum,
} from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rT = document.getElementById('readout-t');
const rP = document.getElementById('readout-p');
const rE = document.getElementById('readout-e');
const rDE = document.getElementById('readout-de');
const rRho = document.getElementById('readout-rho');

const sTemp = document.getElementById('slider-temp'), vTemp = document.getElementById('value-temp');
const sRho = document.getElementById('slider-rho'), vRho = document.getElementById('value-rho');
const sSp = document.getElementById('slider-speed'), vSp = document.getElementById('value-speed');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const N = 300, SEED = 0xC0FFEE, DT = 0.004;
const st = { T: 1.0, rho: 0.55, speed: 4, running: !prefersReducedMotion() };
let state = makeLJ({ N, rho: st.rho, T0: st.T, seed: SEED });
let e0 = diagnostics(state.inst).energy;

const BX = 60, BY = 40, BS = 400;                       // particle box (square)
const PX0 = BX + BS + 56, PX1 = W - 24, PY0 = 70, PY1 = H - 70;

function drawBox() {
  const L = state.L, s = BS / L;
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(BX, BY, BS, BS);
  const rPix = Math.max(2, 0.5 * s);
  // colour scale: per-particle speed^2 mapped through viridis
  let vmax = 1e-6;
  for (let i = 0; i < state.N; i += 1) {
    const v2 = state.inst.qdot[2 * i] ** 2 + state.inst.qdot[2 * i + 1] ** 2;
    if (v2 > vmax) vmax = v2;
  }
  for (let i = 0; i < state.N; i += 1) {
    const x = BX + state.inst.q[2 * i] * s;
    const y = BY + BS - state.inst.q[2 * i + 1] * s;
    const v2 = state.inst.qdot[2 * i] ** 2 + state.inst.qdot[2 * i + 1] ** 2;
    const c = viridis(Math.min(1, v2 / vmax));
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.beginPath(); ctx.arc(x, y, rPix, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`${state.N} LJ particles, periodic box L = ${L.toFixed(1)}`, BX + BS / 2, BY - 14);
  // steps/frame bar (a dominant static element for the speed control)
  const by = BY + BS + 16;
  ctx.fillStyle = 'rgba(120,130,150,0.18)'; ctx.fillRect(BX, by, BS, 14);
  ctx.fillStyle = '#ffd166'; ctx.fillRect(BX, by, BS * (st.speed / 12), 14);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.strokeRect(BX, by, BS, 14);
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.textAlign = 'left';
  ctx.fillText(`steps / frame: ${st.speed}`, BX, by + 30);
}

function drawGofr() {
  const { r, g } = radialDistribution(state, 90);
  const rmax = r[r.length - 1];
  let gmax = 1.5;
  for (const v of g) if (v > gmax) gmax = v;
  const xOf = (rr) => PX0 + (rr / rmax) * (PX1 - PX0);
  const yOf = (gg) => PY1 - (gg / gmax) * (PY1 - PY0);

  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.fillText('r  (sigma)', (PX0 + PX1) / 2, H - 28);
  // plain-words caption (kept clear of the top-right readout box)
  ctx.fillStyle = 'rgba(150,160,180,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('g(r): neighbor density / bulk', (PX0 + PX1) / 2, H - 12);
  ctx.textAlign = 'left'; ctx.fillText('g(r)', PX0 - 28, PY0 - 6);
  // g = 1 reference: an ideal gas has no structure
  ctx.strokeStyle = 'rgba(120,130,150,0.3)'; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(PX0, yOf(1)); ctx.lineTo(PX1, yOf(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(150,160,180,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('g=1 ideal gas (uncorrelated)', PX1 - 4, yOf(1) - 5);

  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let b = 0; b < g.length; b += 1) {
    const X = xOf(r[b]), Y = yOf(Math.min(gmax, g[b]));
    if (b === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // annotate the physics: the excluded repulsive core (g = 0 at
  // small r) and the first coordination shell (the tallest peak)
  let pk = 0;
  for (let b = 0; b < g.length; b += 1) if (r[b] > 0.8 && g[b] > g[pk]) pk = b;
  if (g[pk] > 1.2) {
    const X = xOf(r[pk]), Y = yOf(Math.min(gmax, g[pk]));
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X, Y, 4, 0, 2 * Math.PI); ctx.fill();
    // label anchored low-left (clear of the readout box) with a
    // leader line up to the peak
    const lx = PX0 + 8, ly = PY0 + 46;
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(lx + 92, ly); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText(`1st neighbour shell  r=${r[pk].toFixed(2)} sigma`, lx, ly);
  }
  ctx.fillStyle = 'rgba(239,71,111,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('excluded core (repulsion, g=0)', PX0 + 6, PY1 - 8);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawBox();
  drawGofr();
  const T = temperature(state), P = pressure(state, T);
  const e = diagnostics(state.inst).energy;
  rT.textContent = T.toFixed(3);
  rP.textContent = P.toFixed(3);
  rE.textContent = (e / state.N).toFixed(3);
  rDE.textContent = ((e - e0) / state.N).toExponential(1);
  rRho.textContent = state.rho.toFixed(3);
}

let thermoCount = 0;
function tick() {
  if (st.running) {
    ljStep(state, DT, st.speed);
    thermoCount += st.speed;
    if (thermoCount >= 40) { rescaleTo(state, st.T); thermoCount = 0; }
  }
  render();
  requestAnimationFrame(tick);
}

// Deterministic rebuild + short equilibration so a control change
// shows its effect at once (and the probe sees it even if paused).
function rebuild(equil = 80) {
  state = makeLJ({ N, rho: st.rho, T0: st.T, seed: SEED });
  ljStep(state, DT, equil);
  rescaleTo(state, st.T);
  e0 = diagnostics(state.inst).energy;
}

sTemp.addEventListener('input', () => { st.T = parseFloat(sTemp.value); vTemp.textContent = st.T.toFixed(2); rebuild(); render(); });
sRho.addEventListener('input', () => { st.rho = parseFloat(sRho.value); vRho.textContent = st.rho.toFixed(2); rebuild(); render(); });
sSp.addEventListener('input', () => { st.speed = parseInt(sSp.value, 10); vSp.textContent = String(st.speed); render(); });
bR.addEventListener('click', () => {
  st.T = 1.0; st.rho = 0.55; st.speed = 4; st.running = true;
  sTemp.value = '1.0'; vTemp.textContent = '1.00'; sRho.value = '0.55'; vRho.textContent = '0.55';
  sSp.value = '4'; vSp.textContent = '4'; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
  state = makeLJ({ N, rho: st.rho, T0: st.T, seed: SEED }); e0 = diagnostics(state.inst).energy; render();
});
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function bootSync() {
  vTemp.textContent = st.T.toFixed(2); vRho.textContent = st.rho.toFixed(2); vSp.textContent = String(st.speed);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state = makeLJ({ N, rho: st.rho, T0: st.T, seed: SEED });
    const steps = Math.round(f * 1600);                 // lattice melts into a liquid
    let tc = 0;
    while (tc < steps) { const blk = Math.min(40, steps - tc); ljStep(state, DT, blk); rescaleTo(state, st.T); tc += blk; }
    e0 = diagnostics(state.inst).energy;
    render();
  } else {
    render();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const T = temperature(state);
  return {
    fields: [
      { key: 'temperature', label: 'temperature $T$', value: T, format: 'float' },
      { key: 'pressure', label: 'pressure $P$', value: pressure(state, T), format: 'float' },
      { key: 'density', label: 'number density $\\rho$', value: st.rho, format: 'float' },
      { key: 'energy', label: 'total energy $E$', value: diagnostics(state.inst).energy, format: 'float' },
    ],
  };
};
// Pairwise Lennard-Jones forces are symmetric and the thermostat
// rescales every velocity uniformly, so the box's total momentum is
// conserved; initialised at zero, it stays at the numerical floor.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    if (!state || !state.inst) return [];
    const p = totalMomentum(state);
    if (!Number.isFinite(p)) return [];
    return [{
      key: 'momentum',
      label: 'total momentum conserved (|P|)',
      value: p.toExponential(2),
      status: p < 1e-6 ? 'pass' : (p < 1e-3 ? 'pending' : 'drift'),
    }];
  };
}
