import { hamiltonian, leapfrog, rhs } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rN = document.getElementById('readout-n');
const selS = document.getElementById('select-s'); const tf = document.getElementById('toggle-f');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause'), btnSeed = document.getElementById('btn-seed');
let st = { system: 'pendulum', showFlow: true };
let tracers = []; let running = true;
selS.addEventListener('change', () => { st.system = selS.value; tracers = []; });
tf.addEventListener('change', () => { st.showFlow = tf.checked; });
btnR.addEventListener('click', () => { tracers = []; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnSeed.addEventListener('click', () => { tracers = []; for (let i = -3; i <= 3; i += 1) for (let j = -3; j <= 3; j += 1) tracers.push({ q: i * 0.7, p: j * 0.6, trail: [] }); });
function clientToWorld(cx, cy) { const rect = canvas.getBoundingClientRect(); const sx = canvas.width / rect.width, sy = canvas.height / rect.height; return { x: ((cx - rect.left) * sx - canvas.width / 2) / SC, y: -((cy - rect.top) * sy - canvas.height / 2) / SC }; }
canvas.addEventListener('click', (e) => { const w = clientToWorld(e.clientX, e.clientY); tracers.push({ q: w.x, p: w.y, trail: [] }); });
function colorForH(h, hmin, hmax) {
  const t = Math.min(1, Math.max(0, (h - hmin) / (hmax - hmin + 1e-9)));
  return `hsl(${260 - 260 * t}, 70%, ${50 + 20 * t}%)`;
}
// Fit the phase-space view to the canvas so the separatrix and orbits
// fill the full horizontal extent. The pendulum separatrix reaches
// q = +-pi, p = +-2; QHALF/PHALF add margin. A fixed sc=70 left the
// structure in a small central band of the wide canvas, which read as
// "only works in a horizontal region".
const SC = Math.min((canvas.width / 2 - 30) / 3.4, (canvas.height / 2 - 20) / 2.5);
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2, sc = SC;
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(canvas.width - 20, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, canvas.height - 20); ctx.stroke();
  if (st.showFlow) {
    const N = 24, step = canvas.width / N;
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < Math.floor(canvas.height / step); j += 1) {
        const px = (i + 0.5) * step, py = (j + 0.5) * step;
        const q = (px - cx) / sc, p = -(py - cy) / sc;
        const r = rhs(q, p, st.system);
        const mag = Math.hypot(r.dq, r.dp);
        if (mag < 1e-6) continue;
        const u = step * 0.35;
        const h = hamiltonian(q, p, st.system);
        ctx.strokeStyle = colorForH(h, -2, 2);
        ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + u * r.dq / mag, py - u * r.dp / mag); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  for (const tr of tracers) {
    if (running) {
      for (let k = 0; k < 3; k += 1) {
        const next = leapfrog(tr.q, tr.p, 0.05, st.system);
        tr.q = next.q; tr.p = next.p;
      }
      // q is a periodic angle ONLY for the pendulum. Wrapping it for
      // SHO / cubic chopped those trajectories at |q| > pi, which is why
      // only the central x region worked for the non-pendulum systems.
      if (st.system === 'pendulum') {
        if (tr.q > Math.PI) tr.q -= 2 * Math.PI;
        if (tr.q < -Math.PI) tr.q += 2 * Math.PI;
      }
      tr.trail.push([tr.q, tr.p]); if (tr.trail.length > 2000) tr.trail.shift();
    }
    const h = hamiltonian(tr.q, tr.p, st.system);
    ctx.strokeStyle = colorForH(h, -2, 2); ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    tr.trail.forEach((pt, i) => {
      const px = cx + pt[0] * sc, py = cy - pt[1] * sc;
      if (i === 0) ctx.moveTo(px, py); else if (Math.abs(pt[0] - tr.trail[i - 1][0]) > 2) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = colorForH(h, -2, 2);
    ctx.beginPath(); ctx.arc(cx + tr.q * sc, cy - tr.p * sc, 4, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`system = ${st.system}, click to seed, tracers = ${tracers.length}`, 12, canvas.height - 12);
  rN.textContent = tracers.length;
}
function tick(now) { const dt = (now - last) / 1000; last = now; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) { tracers = []; for (let i = -2; i <= 2; i += 1) for (let j = -2; j <= 2; j += 1) tracers.push({ q: i * 0.8, p: j * 0.8, trail: [] }); for (let n = 0; n < 200; n += 1) for (const tr of tracers) { const nx = leapfrog(tr.q, tr.p, 0.05, st.system); tr.q = nx.q; tr.p = nx.p; tr.trail.push([tr.q, tr.p]); } }
  render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  let avgH = 0;
  if (tracers.length > 0) {
    for (const tr of tracers) avgH += hamiltonian(tr.q, tr.p, st.system);
    avgH /= tracers.length;
  }
  return { fields: [
    { key: 'system', label: 'System', value: st.system, format: undefined },
    { key: 'num-tracers', label: 'Number of orbits', value: tracers.length, format: 'float' },
    { key: 'avg-hamiltonian', label: 'Average H', value: avgH, format: 'float' },
    { key: 'flow-field', label: 'Show flow field', value: st.showFlow ? 'on' : 'off', format: undefined },
  ] };
};
window.playground.getInvariants = function () {
  // Hamiltonian must be conserved along each tracer orbit (leapfrog is symplectic, energy-conservative)
  let maxEnergyDrift = 0, avgEnergyDrift = 0;
  let count = 0;
  for (const tr of tracers) {
    if (tr.trail.length >= 2) {
      const H0 = hamiltonian(tr.trail[0][0], tr.trail[0][1], st.system);
      const HN = hamiltonian(tr.q, tr.p, st.system);
      const drift = Math.abs(HN - H0) / Math.max(Math.abs(H0), 1);
      if (drift > maxEnergyDrift) maxEnergyDrift = drift;
      avgEnergyDrift += drift;
      count++;
    }
  }
  if (count > 0) avgEnergyDrift /= count;

  return [
    { key: 'max-energy-drift', label: 'Max relative energy drift', value: maxEnergyDrift.toExponential(2), status: maxEnergyDrift < 1e-3 ? 'pass' : maxEnergyDrift < 0.05 ? 'drift' : 'pending' },
    { key: 'avg-energy-drift', label: 'Average relative energy drift', value: avgEnergyDrift.toExponential(2), status: avgEnergyDrift < 1e-3 ? 'pass' : avgEnergyDrift < 0.05 ? 'drift' : 'pending' },
  ];
};
