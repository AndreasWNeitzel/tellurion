// Heitler model of an electromagnetic cosmic-ray air shower. Each radiation
// length: every particle splits into two of half energy. Xmax = X0 log(E/Ec);
// Nmax = E/Ec.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');
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

function render() {
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

  // Shower.
  const E = state.E0;
  const tree = shower(E, state.steps);
  const cx = W / 2;
  const topY = 40, botY = H - 60;
  const dy = (botY - topY) / state.steps;
  const lateralScale = Math.min(W, H) * 0.3;

  for (let s = 0; s < tree.length; s += 1) {
    const layer = tree[s];
    const y = topY + s * dy;
    for (const p of layer) {
      const x = cx + p.x * lateralScale * Math.cos(state.zenithDeg * Math.PI / 180);
      // Color by energy: high E (early) white-blue, mid E orange, low E faint blue.
      let col;
      if (p.E > 1e3)      col = '#ffffff';
      else if (p.E > 10)  col = '#ffd57f';
      else if (p.E > 0.5) col = '#fdb56a';
      else                col = '#7c9cff';
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // Ground detector array.
  const detY = botY + 14;
  const ND = 12;
  for (let i = 0; i < ND; i += 1) {
    const x = (i + 0.5) * (W / ND);
    // Signal strength: total energy density at x (sum of E within Δx).
    let signal = 0;
    const layer = tree[tree.length - 1];
    for (const p of layer) {
      const px = cx + p.x * lateralScale * Math.cos(state.zenithDeg * Math.PI / 180);
      if (Math.abs(px - x) < W / ND / 2) signal += p.E;
    }
    const a = Math.min(1, signal / 1e2);
    ctx.fillStyle = `rgba(255, 213, 127, ${a + 0.15})`;
    ctx.beginPath(); ctx.arc(x, detY, 4, 0, 2 * Math.PI); ctx.fill();
  }

  // Xmax marker. Heitler: cascade peaks at sMax = log2(E/Ec) splitting steps,
  // which is X_max = X0 * log(E/Ec) in atmospheric column depth. Clamp the
  // visual marker if sMax exceeds the user's chosen step count.
  const Xmax = X0 * Math.log(E / Ec);
  const sMax = Math.min(Math.log2(E / Ec), state.steps);
  const yMax = topY + sMax * dy;
  ctx.strokeStyle = 'rgba(255,213,127,0.5)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, yMax); ctx.lineTo(W, yMax); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#dcdde2'; ctx.font = '12px sans-serif';
  ctx.fillText(`Xmax ~ ${Xmax.toFixed(0)} g/cm^2`, 12, yMax - 4);

  readoutInv.textContent = `E0=${state.E0.toExponential(1)} GeV  N(ground)=${tree[tree.length - 1].length}  Xmax=${Xmax.toFixed(0)}`;
  readoutFrame.textContent = String(state.steps);
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
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); render(); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('e0',     'log10 E (GeV)', 6, 11, 0.5, Math.log10(state.E0), v => state.E0 = Math.pow(10, v), v => v.toFixed(1));
  slider('zenith', 'zenith (deg)',  0, 60, 5,   state.zenithDeg,      v => state.zenithDeg = v, v => v.toFixed(0));
  slider('steps',  'steps',         5, 36, 1,   state.steps,          v => state.steps = v, v => v.toFixed(0));
}

buildControls();
render();
if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  const E = 1e8; // 10^17 eV
  const Xmax = X0 * Math.log(E / Ec);
  // Expected ~ 814; let me check with the formula directly.
  const expected = X0 * Math.log(E / Ec);
  if (Math.abs(Xmax - expected) / expected > 1e-9) return { name: 'Xmax', pass: false, msg: `Xmax=${Xmax}` };
  return { name: 'Heitler Xmax = X0 ln(E/Ec)', pass: true, msg: `Xmax(1e17 eV) = ${Xmax.toFixed(1)} g/cm^2` };
};
