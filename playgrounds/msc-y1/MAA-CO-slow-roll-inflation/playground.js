// Slow-roll inflation made physical: the inflaton rolls down V(phi)
// under Hubble friction; while it slow-rolls (epsilon < 1) the universe
// inflates, so a comoving patch of galaxies balloons exponentially as
// e-folds N = integral H dt accumulate. Inflation ends at epsilon = 1.
// The (n_s, r) plane shows whether the chosen potential lands in the
// Planck-favoured region. The V/Vp/Vpp, epsilon, eta and the equation
// of motion (step) and __physicsCheck are unchanged.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { V as simV, Vp as simVp, Vpp as simVpp, epsilon as simEpsilon, eta as simEta, nsR_atN as simNsRatN } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const state = { model: 'phi2', phi: 8.0, phid: 0, t: 0, N: 0 };
const trail = [];

// Pure physics lives in sim.js (model-parameterised, with the corrected
// Starobinsky V''); these thin wrappers close over state.model so every
// existing call site stays unchanged and the invariants test the same code.
const V       = (phi) => simV(phi, state.model);
const Vp      = (phi) => simVp(phi, state.model);
const Vpp     = (phi) => simVpp(phi, state.model);
const epsilon = (phi) => simEpsilon(phi, state.model);
const eta     = (phi) => simEta(phi, state.model);
const nsR_atN = (N)   => simNsRatN(N, state.model);

function step(dt) {
  const H_Hubble = Math.sqrt(Math.max(V(state.phi) / 3, 1e-12));
  state.phid += (-3 * H_Hubble * state.phid - Vp(state.phi)) * dt;
  state.phi  += state.phid * dt;
  state.t    += dt;
  if (state.phi < 0.05) { state.phi = 8; state.phid = 0; state.t = 0; }
}

// e-fold accumulation N = integral H dt while inflating (epsilon < 1).
// Reads the same H as step(); does not alter the physics.
function advance(dt) {
  const phiBefore = state.phi;
  if (epsilon(state.phi) < 1) {
    state.N += Math.sqrt(Math.max(V(state.phi) / 3, 1e-12)) * dt;
  }
  step(dt);
  if (state.phi === 8 && phiBefore < 8) { state.N = 0; trail.length = 0; }
}

// Deterministic comoving galaxy field for the expanding-universe panel.
const grng = makeRng(0xC0FFEE);
const GAL = Array.from({ length: 150 }, () => ({
  x: grng() * 2 - 1, y: grng() * 2 - 1, s: 0.6 + grng() * 1.4,
}));

// The field rolls from large phi toward 0; inflation ends at the LARGEST
// phi where epsilon reaches 1 (slow-roll holds for phi above it).
function phiEndOfInflation() {
  for (let i = 300; i >= 1; i -= 1) {
    const phi = (i / 300) * 12;
    if (epsilon(phi) >= 1) return phi;
  }
  return -1;
}

function drawPotential() {
  const x0 = 46, y0 = H * 0.60, plotW = W * 0.52, plotH = H * 0.50;
  const PHIMAX = 12;
  let mxV = 1e-9;
  for (let i = 0; i <= 120; i += 1) mxV = Math.max(mxV, V((i / 120) * PHIMAX));
  const xFor = (phi) => x0 + (phi / PHIMAX) * plotW;
  const yFor = (v) => y0 - (v / mxV) * (plotH - 24);

  // Filled potential well.
  ctx.beginPath();
  ctx.moveTo(xFor(0), y0);
  for (let i = 0; i <= 160; i += 1) { const phi = (i / 160) * PHIMAX; ctx.lineTo(xFor(phi), yFor(V(phi))); }
  ctx.lineTo(xFor(PHIMAX), y0); ctx.closePath();
  const g = ctx.createLinearGradient(0, y0 - plotH, 0, y0);
  g.addColorStop(0, 'rgba(124,156,255,0.30)'); g.addColorStop(1, 'rgba(124,156,255,0.04)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= 160; i += 1) { const phi = (i / 160) * PHIMAX; const x = xFor(phi), y = yFor(V(phi)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();

  // Slow-roll plateau (epsilon < 0.02) shaded.
  ctx.fillStyle = 'rgba(6,214,160,0.10)';
  for (let i = 0; i < 160; i += 1) {
    const phi = (i / 160) * PHIMAX;
    if (epsilon(phi) < 0.02 && V(phi) > 1e-6) ctx.fillRect(xFor(phi), y0 - plotH, plotW / 160 + 1, plotH);
  }

  // epsilon = 1 cliff (inflation ends).
  const phiEnd = phiEndOfInflation();
  if (phiEnd > 0) {
    const ex = xFor(phiEnd);
    ctx.strokeStyle = '#ff5d5d'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ex, y0 - plotH); ctx.lineTo(ex, y0); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ff5d5d'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('epsilon = 1: inflation ends -> reheating', ex + 6, y0 - plotH + 26);
  }

  // Inflaton trail + glowing ball.
  trail.push({ x: xFor(state.phi), y: yFor(V(state.phi)) - 5 });
  if (trail.length > 80) trail.shift();
  ctx.strokeStyle = 'rgba(255,213,127,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath();
  trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.stroke();
  const bx = xFor(state.phi), by = yFor(V(state.phi)) - 5;
  const gl = ctx.createRadialGradient(bx, by, 0, bx, by, 16);
  gl.addColorStop(0, 'rgba(255,225,150,0.9)'); gl.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bx, by, 16, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd57f'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('inflaton rolling down V(phi)', x0 + 8, y0 - plotH + 14);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px sans-serif';
  ctx.fillText('phi', x0 + plotW - 18, y0 + 16);
  const inflating = epsilon(state.phi) < 1;
  ctx.fillStyle = inflating ? '#06d6a0' : '#ff5d5d';
  ctx.fillText(inflating ? 'SLOW ROLL: universe inflating' : 'reheating (inflation over)', x0 + 8, y0 + 16);
}

function drawUniverse() {
  const px0 = W * 0.60, py0 = 34, pw = W - px0 - 20, ph = H * 0.52;
  ctx.fillStyle = '#04050a'; ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220,220,240,0.30)'; ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  // Space stretches: a comoving lattice whose spacing grows like exp(N).
  // Positions are taken modulo the panel so the grid keeps re-tiling as
  // it expands (it never empties) while galaxies visibly drift apart.
  const aDisp = Math.exp(Math.min(state.N, 60) / 9);     // gentle, capped
  const cell = Math.min(pw, ph) * 0.16 * aDisp;
  ctx.save();
  ctx.beginPath(); ctx.rect(px0, py0, pw, ph); ctx.clip();
  // Stretching grid lines.
  ctx.strokeStyle = 'rgba(124,156,255,0.18)'; ctx.lineWidth = 1;
  const phase = (state.N * 40) % cell;
  for (let gx = px0 - phase; gx < px0 + pw; gx += cell) {
    ctx.beginPath(); ctx.moveTo(gx, py0); ctx.lineTo(gx, py0 + ph); ctx.stroke();
  }
  for (let gy = py0 - phase; gy < py0 + ph; gy += cell) {
    ctx.beginPath(); ctx.moveTo(px0, gy); ctx.lineTo(px0 + pw, gy); ctx.stroke();
  }
  // Galaxies pinned to lattice cells, drifting apart with the expansion.
  for (let gi = 0; gi < GAL.length; gi += 1) {
    const gp = GAL[gi];
    const x = px0 + (((gp.x + 1) * 0.5 * pw + state.N * 40) % pw + pw) % pw;
    const y = py0 + (((gp.y + 1) * 0.5 * ph + state.N * 26) % ph + ph) % ph;
    ctx.fillStyle = 'rgba(190,212,255,0.65)';
    ctx.beginPath(); ctx.arc(x, y, gp.s + 0.3 * Math.min(3, aDisp), 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('comoving patch of the universe', px0 + 8, py0 + 16);
  ctx.font = '22px ui-monospace, monospace'; ctx.fillStyle = '#ffd57f';
  ctx.fillText(`N = ${state.N.toFixed(1)} e-folds`, px0 + 8, py0 + ph - 36);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#9aa0a6';
  ctx.fillText('~60 e-folds solve the horizon/flatness problems', px0 + 8, py0 + ph - 14);
}

function drawNsR() {
  const x0 = 46, y0 = H * 0.66, pw = W - 92, ph = H - y0 - 28;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0, y0, pw, ph);
  ctx.strokeStyle = 'rgba(220,220,240,0.30)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, pw - 1, ph - 1);
  const nsMin = 0.84, nsMax = 1.0, rMax = 0.60;
  const sx = (ns) => x0 + ((ns - nsMin) / (nsMax - nsMin)) * pw;
  const sy = (r) => y0 + ph - (r / rMax) * ph;

  // Planck-favoured region (schematic): n_s ~ 0.965, low r.
  ctx.fillStyle = 'rgba(6,214,160,0.16)';
  ctx.beginPath(); ctx.ellipse(sx(0.965), sy(0.02), pw * 0.10, ph * 0.16, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(6,214,160,0.5)'; ctx.stroke();
  ctx.fillStyle = '#06d6a0'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Planck-favoured', sx(0.965) - 36, sy(0.02) - ph * 0.16 - 4);

  // Inflation track: the slow-roll prediction versus the number of
  // e-folds N before the end of inflation, over the observationally
  // relevant CMB window N = 40..70. (The previous code plotted the raw
  // epsilon(phi)/eta(phi) of the live rolling field, which diverges in
  // the reheating region, so the track was clamped off-window and the
  // panel rendered empty with nonsensical n_s/r for phi4.)
  ctx.strokeStyle = '#fdb56a'; ctx.lineWidth = 1.8; ctx.beginPath();
  let started = false;
  for (let Nf = 40; Nf <= 70; Nf += 1) {
    const { ns, r } = nsR_atN(Nf);
    const x = sx(Math.max(nsMin, Math.min(nsMax, ns))), y = sy(Math.min(rMax, r));
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Observable point at the CMB pivot, N = 55 e-folds.
  const { ns: nsC, r: rC } = nsR_atN(55);
  const cxp = sx(Math.max(nsMin, Math.min(nsMax, nsC))), cyp = sy(Math.min(rMax, rC));
  ctx.fillStyle = '#ffd57f'; ctx.beginPath(); ctx.arc(cxp, cyp, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dcdde2'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`(n_s, r) at N=55   model: ${state.model}   n_s=${nsC.toFixed(3)} r=${rC.toFixed(3)}`, x0 + 8, y0 + 16);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('n_s ->', x0 + pw - 6, y0 + ph - 6);
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  drawPotential();
  drawUniverse();
  drawNsR();
  const eCur = epsilon(state.phi), nCur = eta(state.phi);
  readoutInv.textContent = `phi=${state.phi.toFixed(2)}  eps=${eCur.toFixed(4)}  eta=${nCur.toFixed(4)}  N=${state.N.toFixed(1)}`;
  readoutFrame.textContent = state.t.toFixed(2);
}

let raf;
function tick() {
  for (let s = 0; s < 4; s += 1) advance(0.02);
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'model'; lab.textContent = 'Model';
  const sel = document.createElement('select'); sel.id = 'model';
  sel.setAttribute('aria-label', 'Inflaton potential');
  for (const [v, t] of [['phi2', 'V = phi^2 / 2'], ['phi4', 'V = phi^4 / 4'], ['starobinsky', 'Starobinsky']]) {
    const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o);
  }
  sel.value = state.model;
  sel.addEventListener('change', () => {
    state.model = sel.value; state.phi = 8; state.phid = 0; state.t = 0; state.N = 0; trail.length = 0;
  });
  row.appendChild(lab); row.appendChild(sel);
  controlsEl.appendChild(row);
}

buildControls();
if (DETERMINISTIC || CAPTURE_NAME) {
  // Stage frames across models and inflation progress.
  if (Number.isFinite(CAPTURE_FRAC)) {
    const models = ['phi2', 'phi2', 'starobinsky', 'starobinsky', 'phi4'];
    state.model = models[Math.min(models.length - 1, Math.round(CAPTURE_FRAC * (models.length - 1)))];
    const steps = Math.round(30 + CAPTURE_FRAC * 220);
    for (let i = 0; i < steps; i += 1) advance(0.02);
  } else {
    for (let i = 0; i < 60; i += 1) advance(0.02);
  }
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // For V = phi^2/2 at phi=8: epsilon = 1/(2*32) = 1/64 ~ 0.0156.
  const expected = 1 / 64;
  const e = epsilon(8);
  if (Math.abs(e - expected) > 1e-4) return { name: 'epsilon', pass: false, msg: `e(8) = ${e}` };
  return { name: 'slow-roll epsilon', pass: true, msg: `epsilon_phi2(8) = ${e.toFixed(4)} (expected 0.0156)` };
};
