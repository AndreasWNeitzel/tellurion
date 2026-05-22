// Lattice-Boltzmann fluid painter. Click-drag to draw obstacles; the flow
// past them visualizes velocity magnitude. The D2Q9 BGK solver lives in
// sim.js (DOM-free, also exercised by invariants.test.mjs).

import { createLBM, step as lbmStep, macro, addCircle, reset as lbmReset, fluidMass } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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

const s = createLBM(NX, NY, { tau: 0.57, uIn: 0.10, uClamp: 0.17 });
function freshFlow() {
  lbmReset(s);
  s.obstacle.fill(0);
  addCircle(s, NX / 4, NY / 2, 9);                    // larger -> clear Karman wake
}
freshFlow();

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      const idx = y * NX + x;
      if (s.obstacle[idx]) {
        ctx.fillStyle = '#e8e9ee';
      } else if (x > 0 && x < NX - 1 && y > 0 && y < NY - 1
                 && !s.obstacle[idx - 1] && !s.obstacle[idx + 1]
                 && !s.obstacle[idx - NX] && !s.obstacle[idx + NX]) {
        // Vorticity omega = d(uy)/dx - d(ux)/dy by central differences.
        // A blue<->red diverging map makes the alternating shed
        // vortices (the von Karman street) unmistakable; faint speed
        // tint keeps the free stream visible.
        const e = macro(s, idx + 1), w = macro(s, idx - 1);
        const n = macro(s, idx + NX), so = macro(s, idx - NX);
        const omega = 0.5 * ((e.uy - w.uy) - (n.ux - so.ux));
        const v = Math.max(-1, Math.min(1, omega / 0.06));
        const sp = Math.min(1, Math.hypot(macro(s, idx).ux, macro(s, idx).uy) / 0.22);
        const base = 18 + 26 * sp;
        const r = Math.floor(base + (v > 0 ? 200 * v : 0));
        const g = Math.floor(base + 70 * (1 - Math.abs(v)));
        const b = Math.floor(base + (v < 0 ? 210 * -v : 40));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else {
        const { ux, uy } = macro(s, idx);
        const t = Math.min(1, Math.hypot(ux, uy) / 0.22);
        ctx.fillStyle = `rgb(${18 + 40 * t | 0},${44 + 120 * t | 0},${90 + 90 * t | 0})`;
      }
      ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
    }
  }
  recordWakeProbe();
  drawWakeDiagnostic();
}

// Rule-13 diagnostic: transverse velocity u_y(t) at a fixed probe in
// the wake. Once the von Karman street forms, u_y oscillates at the
// vortex-shedding frequency; the period sets the Strouhal number. The
// time series is the quantitative signature of the shed vortices.
const wakeHistory = [];
function recordWakeProbe() {
  const pxr = Math.min(NX - 2, Math.floor(NX * 0.62));
  const pyr = Math.floor(NY / 2);
  const m = macro(s, pyr * NX + pxr);
  wakeHistory.push(m.uy);
  if (wakeHistory.length > 320) wakeHistory.shift();
}
function drawWakeDiagnostic() {
  const pw = 280, ph = 110, px0 = W - pw - 14, py0 = 14;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('wake transverse velocity  u_y(t)', px0 + 8, py0 + 14);
  if (wakeHistory.length < 2) return;
  const ax = px0 + 12, ay = py0 + 22, aw = pw - 24, ah = ph - 36;
  let amp = 1e-4;
  for (const v of wakeHistory) amp = Math.max(amp, Math.abs(v));
  const xOf = (i) => ax + (i / (wakeHistory.length - 1)) * aw;
  const yOf = (v) => ay + ah / 2 - (v / (amp * 1.15)) * (ah / 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  wakeHistory.forEach((v, i) => { const x = xOf(i), y = yOf(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,240,0.72)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('shedding oscillation -> Strouhal frequency', ax, py0 + ph - 5);
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
  // Floor tau at 0.56 (nu = 0.02): below this BGK LBM is unconditionally
  // unstable for the user-drawn high-Re geometry and diverges.
  slider('tau', 'tau (visc)', 0.56, 1.0, 0.01, Math.max(0.56, s.tau), v => { s.tau = Math.max(0.56, v); });
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
  // Self-heal: if the field ever goes non-finite (extreme user
  // geometry), reset the flow instead of rendering an exploded NaN
  // field. The tau floor + velocity limiter make this rare.
  if (s.steps % 16 === 0) {
    const m = fluidMass(s);
    if (!Number.isFinite(m) || m <= 0) freshFlow();
  }
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const rho_avg = fluidMass(s) / (s.NX * s.NY);
  return {
    fields: [
      { key: 'inlet-velocity', label: 'Inlet velocity uIn', value: s.uIn, format: 'float' },
      { key: 'relaxation-tau', label: 'Relaxation time tau', value: s.tau, format: 'float' },
      { key: 'grid-x', label: 'Grid NX', value: s.NX, format: 'float' },
      { key: 'grid-y', label: 'Grid NY', value: s.NY, format: 'float' },
      { key: 'average-density', label: 'Average density rho', value: rho_avg, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const rho_total = fluidMass(s);
  const rho_expected = s.NX * s.NY;
  const rho_drift = Math.abs(rho_total - rho_expected) / rho_expected;
  const viscosity = (s.tau - 0.5) / 3;
  return [
    {
      key: 'mass-conservation',
      label: 'Mass conserved (rho total)',
      value: rho_drift.toExponential(2),
      status: rho_drift < 0.05 ? 'pass' : 'drift'
    },
    {
      key: 'stability-criterion',
      label: 'Stability tau > 0.5 (viscosity > 0)',
      value: viscosity > 0 ? 'stable' : 'unstable',
      status: s.tau > 0.5 ? 'pass' : 'drift'
    }
  ];
};
