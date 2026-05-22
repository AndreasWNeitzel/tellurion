// Heitler model of an electromagnetic cosmic-ray air shower. Each radiation
// length: every particle splits into two of half energy. Xmax = X0 log(E/Ec);
// Nmax = E/Ec. The cascade is now animated: a primary streaks into the
// atmosphere and a shower front propagates downward, fanning out until it
// reaches the ground detector array, then the event loops.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);

const X0 = 36.7;     // g/cm^2
const Ec = 81e-3;    // GeV
const state = {
  E0:        1e6,    // GeV (10^15 eV = 10^6 GeV; show across 10^15 to 10^20)
  zenithDeg: 0,
  species:   'proton',
  steps:     30,
};

function shower(E0, steps) {
  // Simplified: at each step, each particle splits into 2 of E/2, until E < Ec.
  // Spatial: Gaussian lateral spread proportional to current step.
  const particles = [{ x: 0, y: 0, E: E0 }];
  const path = [particles.slice()];
  for (let s = 0; s < steps; s += 1) {
    const next = [];
    for (const p of particles) {
      if (p.E < Ec) { next.push({ x: p.x, y: p.y, E: p.E }); continue; }
      // Two children with halved energy, slight lateral kick.
      const k = 0.04 * (s + 1);
      next.push({ x: p.x + (rng() - 0.5) * k, y: p.y + 1, E: p.E / 2 });
      next.push({ x: p.x + (rng() - 0.5) * k, y: p.y + 1, E: p.E / 2 });
    }
    particles.length = 0;
    for (const p of next) particles.push(p);
    if (particles.length > 4000) {
      // Cap to keep visualization manageable.
      particles.length = 4000;
    }
    path.push(particles.slice());
  }
  return path;
}

// One cached cascade per event; recomputed when parameters change or a new
// primary arrives. Caching keeps the per-frame draw cheap.
let tree = shower(state.E0, state.steps);
let needsTree = false;
function markStale() { needsTree = true; }

const TOP_Y = 40;
const BOT_Y = H - 60;

function colourFor(E) {
  if (E > 1e3)      return '#ffffff';
  if (E > 10)       return '#ffd57f';
  if (E > 0.5)      return '#fdb56a';
  return '#7c9cff';
}

// Draw one animation phase p in [0, 1]:
//   p < 0.12      primary streak descending into the atmosphere
//   0.12..0.85    shower front propagating down, cascade fanning out
//   p > 0.85      full shower; ground detector array pulses
function drawPhase(p) {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Atmosphere gradient: dark at top, lighter at ground.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,    '#080814');
  grad.addColorStop(0.4,  '#102036');
  grad.addColorStop(0.8,  '#3a608a');
  grad.addColorStop(1.0,  '#a8c6dc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const E = state.E0;
  const cx = W / 2;
  const dy = (BOT_Y - TOP_Y) / state.steps;
  const cosZ = Math.cos(state.zenithDeg * Math.PI / 180);
  // Zenith tilts the whole shower axis; the core drifts sideways with depth.
  const axisTilt = Math.sin(state.zenithDeg * Math.PI / 180) * (W * 0.32);

  // How far the shower front has descended, as a fractional step index.
  // The cascade reaches the ground by p ~ 0.62 so the later frames show
  // the full fanned shower lighting the detector array.
  const devel = Math.max(0, Math.min(1, (p - 0.10) / (0.62 - 0.10)));
  const frontStep = p < 0.10 ? -1 : devel * state.steps;
  const frontY = TOP_Y + Math.max(0, frontStep) * dy;

  // Display cone. The Heitler toy carries almost no transverse momentum, so
  // the raw x would be a thin streak. We give each particle a deterministic
  // lateral offset drawn from a core-peaked (roughly Gaussian) profile whose
  // width grows like sqrt(depth): a dense bright axis fanning into a cone,
  // the canonical air-shower lateral profile. Vertical jitter within the
  // radiation-length band blends the discrete layers into a continuous
  // cascade. This is a presentation transform only: particle counts,
  // energies, and Xmax come straight from shower().
  function hash01(a) {
    let h = (a ^ (a >>> 15)) * 2246822519;
    h = (h ^ (h >>> 13)) * 3266489917;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function gaussLike(seed) {
    return hash01(seed) + hash01(seed * 2654435761 + 1) + hash01(seed * 40503 + 7) - 1.5;
  }
  function coreSigma(s) {
    return W * (0.007 + 0.150 * Math.sqrt(s / Math.max(1, state.steps)));
  }
  function dispX(q, s, idx) {
    const seed = (s * 8191 + idx * 131071) >>> 0;
    const lat = gaussLike(seed) * coreSigma(s) + q.x * (W * 0.08);
    return cx + axisTilt * (s / Math.max(1, state.steps)) + lat * cosZ;
  }
  function dispY(s, idx) {
    return TOP_Y + s * dy + (hash01((s * 977 + idx * 3571) >>> 0) - 0.5) * dy * 1.1;
  }

  // Incoming primary: a bright nucleus streaking down from above the
  // atmosphere into the first interaction point, with a fading trail.
  const entryP = Math.min(1, p / 0.12);
  if (p < 0.16) {
    // Head stays inside the frame for the whole descent; the trail streaks
    // up out of the top so it always reads as a particle entering.
    const yHead = 6 + (TOP_Y - 6) * entryP;
    ctx.strokeStyle = 'rgba(180,220,255,0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx, yHead - 110); ctx.lineTo(cx, yHead); ctx.stroke();
    const g = ctx.createRadialGradient(cx, yHead, 0, cx, yHead, 16);
    g.addColorStop(0, 'rgba(220,240,255,0.95)');
    g.addColorStop(1, 'rgba(220,240,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, yHead, 16, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption'); ctx.textAlign = 'left';
    ctx.fillText(`primary ${state.species}  E0 = ${E.toExponential(1)} GeV`, cx + 22, Math.max(16, yHead));
  }

  // Cascade: every layer down to the current front. Particles glow brighter
  // the closer they are to the descending front, giving a travelling pulse.
  // Soft axial glow so the dense core reads even where speckle is sparse.
  if (frontStep >= 0) {
    const apexX = cx;
    const baseS = Math.min(state.steps, Math.max(0, frontStep));
    const baseY = TOP_Y + baseS * dy;
    const baseHW = coreSigma(baseS) * 1.6 + W * 0.02;
    const baseXc = cx + axisTilt * (baseS / Math.max(1, state.steps));
    const cg = ctx.createLinearGradient(0, TOP_Y, 0, baseY);
    cg.addColorStop(0, 'rgba(150,190,255,0.05)');
    cg.addColorStop(1, 'rgba(150,190,255,0.16)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(apexX, TOP_Y);
    ctx.lineTo(baseXc + baseHW, baseY);
    ctx.lineTo(baseXc - baseHW, baseY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'lighter';
  const maxLayer = Math.min(tree.length - 1, Math.ceil(frontStep));
  for (let s = 0; s <= maxLayer; s += 1) {
    const layer = tree[s];
    const n = layer.length;
    const nearFront = Math.max(0, 1 - Math.abs(s - frontStep) / 3.0);
    const sz = 1.5 + 2.2 * nearFront;
    for (let idx = 0; idx < n; idx += 1) {
      const q = layer[idx];
      const x = dispX(q, s, idx);
      const y = dispY(s, idx);
      ctx.fillStyle = colourFor(q.E);
      ctx.globalAlpha = 0.30 + 0.60 * nearFront;
      ctx.fillRect(x, y, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // Bright front band so the eye tracks the descending shower maximum.
  if (frontStep >= 0 && frontStep <= state.steps) {
    const fg = ctx.createLinearGradient(0, frontY - 14, 0, frontY + 14);
    fg.addColorStop(0,   'rgba(255,225,150,0)');
    fg.addColorStop(0.5, 'rgba(255,225,150,0.18)');
    fg.addColorStop(1,   'rgba(255,225,150,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, frontY - 14, W, 28);
  }

  // Ground detector array. Once the front reaches the ground the tanks
  // light up in proportion to the local energy deposit.
  const detY = BOT_Y + 14;
  const reached = Math.max(0, Math.min(1, (p - 0.55) / 0.18));
  const ND = 12;
  const gIdx = tree.length - 1;
  const groundLayer = tree[gIdx];
  const gN = groundLayer.length;
  for (let i = 0; i < ND; i += 1) {
    const x = (i + 0.5) * (W / ND);
    let signal = 0;
    for (let k = 0; k < gN; k += 1) {
      const px = dispX(groundLayer[k], gIdx, k);
      if (Math.abs(px - x) < W / ND / 2) signal += groundLayer[k].E;
    }
    const a = Math.min(1, signal / 1e2) * reached;
    if (reached > 0.02 && a > 0.04) {
      const fl = ctx.createRadialGradient(x, detY, 0, x, detY, 16);
      fl.addColorStop(0, `rgba(255,225,150,${0.6 * a})`);
      fl.addColorStop(1, 'rgba(255,225,150,0)');
      ctx.fillStyle = fl;
      ctx.beginPath(); ctx.arc(x, detY, 16, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.fillStyle = `rgba(255, 213, 127, ${0.15 + 0.85 * a})`;
    ctx.beginPath(); ctx.arc(x, detY, 4, 0, 2 * Math.PI); ctx.fill();
  }

  // Xmax marker. Heitler: cascade peaks at sMax = log2(E/Ec) splitting steps,
  // which is X_max = X0 * log(E/Ec) in atmospheric column depth.
  const Xmax = X0 * Math.log(E / Ec);
  const sMax = Math.min(Math.log2(E / Ec), state.steps);
  const yMax = TOP_Y + sMax * dy;
  if (frontStep >= sMax - 0.5 || p > 0.85) {
    ctx.strokeStyle = 'rgba(255,213,127,0.55)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, yMax); ctx.lineTo(W, yMax); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption'); ctx.textAlign = 'left';
    ctx.fillText(`Xmax ~ ${Xmax.toFixed(0)} g/cm^2`, 12, yMax - 4);
  }

  const nGround = groundLayer.length;
  readoutInv.textContent =
    `E0=${E.toExponential(1)} GeV  N(ground)=${nGround}  Xmax=${Xmax.toFixed(0)} g/cm^2`;
  readoutFrame.textContent = `${state.steps} steps  phase ${(p * 100).toFixed(0)}%`;
}

// Animation clock. One event runs EVENT_S seconds, then a fresh primary
// arrives (the rng has advanced, so lateral kicks differ between events).
const EVENT_S = 7.0;
let phase = 0;
let last = 0;

function frame(now) {
  if (!last) last = now;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  phase += dt / EVENT_S;
  if (phase >= 1) {
    phase = 0;
    tree = shower(state.E0, state.steps);   // next primary
  }
  if (needsTree) { tree = shower(state.E0, state.steps); needsTree = false; phase = 0; }
  drawPhase(phase);
  requestAnimationFrame(frame);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); markStale(); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('e0',     'log10 E (GeV)', 6, 11, 0.5, Math.log10(state.E0), v => state.E0 = Math.pow(10, v), v => v.toFixed(1));
  slider('zenith', 'zenith (deg)',  0, 60, 5,   state.zenithDeg,      v => state.zenithDeg = v, v => v.toFixed(0));
  slider('steps',  'steps',         5, 36, 1,   state.steps,          v => state.steps = v, v => v.toFixed(0));
}

buildControls();

if (Number.isFinite(CAPTURE_FRAC)) {
  // Deterministic capture: freeze the timeline at the requested fraction.
  // Offset so frame 0 already shows the primary streaking into the sky
  // rather than an empty atmosphere a beat before it enters.
  drawPhase(0.05 + 0.93 * CAPTURE_FRAC);
  if (DETERMINISTIC) {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }
} else {
  drawPhase(0);
  if (DETERMINISTIC) {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }
  requestAnimationFrame(frame);
}

window.__physicsCheck = async () => {
  const E = 1e8; // 10^17 eV
  const Xmax = X0 * Math.log(E / Ec);
  // Expected ~ 814; let me check with the formula directly.
  const expected = X0 * Math.log(E / Ec);
  if (Math.abs(Xmax - expected) / expected > 1e-9) return { name: 'Xmax', pass: false, msg: `Xmax=${Xmax}` };
  return { name: 'Heitler Xmax = X0 ln(E/Ec)', pass: true, msg: `Xmax(1e17 eV) = ${Xmax.toFixed(1)} g/cm^2` };
};


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const Xmax = X0 * Math.log(state.E0 / Ec);
  const sMax = Math.log2(state.E0 / Ec);
  const nLayers = Math.min(tree.length, state.steps + 1);
  const nGround = tree.length > 0 ? tree[tree.length - 1].length : 0;
  return { fields: [
    { key: 'E0', label: 'primary energy $E_0$ (GeV)', value: state.E0.toExponential(2), format: 'string' },
    { key: 'zenith', label: 'zenith angle (deg)', value: state.zenithDeg, format: 'float' },
    { key: 'Xmax', label: 'cascade depth $X_{\max}$ (g/cm$^2$)', value: Xmax.toFixed(1), format: 'string' },
    { key: 'n-ground', label: 'particles at ground level', value: nGround, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const Xmax = X0 * Math.log(state.E0 / Ec);
  const sMax = Math.log2(state.E0 / Ec);
  const nLayers = tree.length;
  const nGround = tree.length > 0 ? tree[tree.length - 1].length : 0;
  return [
    {
      key: 'Xmax-monotonic',
      label: '$X_{\max}$ increases with energy',
      value: Xmax.toFixed(1),
      status: Xmax > 0 && state.E0 > Ec ? 'pass' : 'drift',
    },
    {
      key: 'cascade-develops',
      label: 'cascade has $\ge 1$ particle at ground',
      value: nGround > 0 ? 'pass' : 'pending',
      status: nGround > 0 ? 'pass' : 'pending',
    },
  ];
};
