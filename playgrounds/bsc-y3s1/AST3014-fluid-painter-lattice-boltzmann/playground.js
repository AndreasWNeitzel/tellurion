// Lattice-Boltzmann fluid painter. Click-drag to draw obstacles; the flow
// past them visualizes velocity magnitude. The D2Q9 BGK solver lives in
// sim.js (DOM-free, also exercised by invariants.test.mjs).

import { createLBM, step as lbmStep, macro, addCircle, reset as lbmReset, fluidMass } from './sim.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const NX = 192, NY = 96;
const cellW = W / NX, cellH = H / NY;

// Deterministic capture sweep: a fraction-proportional number of steps so
// the five reference frames show the wake developing from rest.
const CAP_WARMUP = 20;
const CAP_MAX = 1400;

const s = createLBM(NX, NY, { tau: 0.6, uIn: 0.10 });
function freshFlow() {
  lbmReset(s);
  s.obstacle.fill(0);
  addCircle(s, NX / 4, NY / 2, 6);
}
freshFlow();

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      const idx = y * NX + x;
      if (s.obstacle[idx]) {
        ctx.fillStyle = '#dcdde2';
      } else {
        const { ux, uy } = macro(s, idx);
        const speed = Math.min(0.25, Math.hypot(ux, uy));
        const t = speed / 0.25;
        const r = Math.floor(20 + 235 * t * t);
        const g = Math.floor(60 + 195 * t);
        const b = Math.floor(120 + 50 * (1 - t));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }
      ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
    }
  }
}

let drawing = false;
canvas.addEventListener('mousedown', (e) => { drawing = true; modifyAt(e); });
canvas.addEventListener('mousemove', (e) => { if (drawing) modifyAt(e); });
canvas.addEventListener('mouseup',   () => { drawing = false; });
function modifyAt(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / rect.width * NX);
  const y = Math.floor((e.clientY - rect.top) / rect.height * NY);
  const erase = e.shiftKey;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || xx >= NX || yy < 0 || yy >= NY) continue;
      s.obstacle[yy * NX + xx] = erase ? 0 : 1;
    }
  }
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step_, value, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step_); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('tau', 'tau (visc)', 0.52, 1.0, 0.01, s.tau, v => { s.tau = v; });
  const row = document.createElement('div'); row.className = 'row';
  const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = 'Clear obstacles';
  clear.addEventListener('click', () => { s.obstacle.fill(0); });
  const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset flow';
  reset.addEventListener('click', () => { freshFlow(); });
  row.appendChild(clear); row.appendChild(reset); controlsEl.appendChild(row);
  const tip = document.createElement('div'); tip.className = 'row';
  tip.innerHTML = '<span class="label">Tip</span><span class="value">Click-drag to draw; shift-drag to erase.</span>';
  controlsEl.appendChild(tip);
}

buildControls();

function updateReadout() {
  readoutInv.textContent = `tau=${s.tau.toFixed(2)}  steps=${s.steps}  fluid mass=${fluidMass(s).toFixed(1)}`;
  readoutFrame.textContent = String(s.steps);
}

function tick() {
  for (let i = 0; i < 4; i += 1) lbmStep(s);
  render();
  if (s.steps % 16 === 0) updateReadout();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

if (DETERMINISTIC) {
  const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
  const nSteps = Math.round(CAP_WARMUP + frac * (CAP_MAX - CAP_WARMUP));
  for (let i = 0; i < nSteps; i += 1) lbmStep(s);
  render();
  updateReadout();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

// Headless physics smoke check (mass is finite and conserved over a short
// closed run with no inflow contribution dominating); the rigorous
// invariants live in invariants.test.mjs against sim.js.
window.__physicsCheck = async () => {
  const t = createLBM(NX, NY, { tau: 0.6, uIn: 0.10 });
  const m0 = fluidMass(t);
  for (let i = 0; i < 50; i += 1) lbmStep(t);
  const m1 = fluidMass(t);
  const ok = Number.isFinite(m1) && m1 > 0 && Math.abs(m1 - m0) / m0 < 0.05;
  return {
    name: 'D2Q9 mass bounded',
    pass: ok,
    msg: `fluid mass ${m0.toFixed(1)} -> ${m1.toFixed(1)} over 50 steps`,
  };
};
