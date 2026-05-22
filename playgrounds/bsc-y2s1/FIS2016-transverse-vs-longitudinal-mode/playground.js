// Transverse vs longitudinal modes on a 1D spring chain, shown the
// way the spec asks: the longitudinal mode coloured by local
// compression so the travelling compression/rarefaction bands are
// unmistakable, the transverse mode as a string-like waveform, both
// driven by the SAME lattice dispersion omega(k) = 2 sqrt(K/m)
// |sin(ka/2)| which is drawn as a demoted Brillouin-zone strip with
// the current k, the long-wavelength sound asymptote and the
// zone-edge standing-wave limit marked. The live invariant readout
// is the mode energy drift from the exported totalEnergy. sim.js
// (omegaK / modePosition / totalEnergy) is unchanged. Reference:
// Crawford, Waves (Berkeley Physics Vol. 3), Ch. 5; Ashcroft and
// Mermin, Solid State Physics, Ch. 22; French, Vibrations and Waves,
// Ch. 7.
import { omegaK, modePosition, totalEnergy } from './sim.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rW = document.getElementById('readout-w');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const selV = document.getElementById('select-v');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { k: 1, A: 0.2, view: 'both', t: 0, N: 26 };
let running = true, last = performance.now();
let E0 = 0, eWarm = false, eDriftMax = 0;

sK.addEventListener('input', () => { st.k = parseFloat(sK.value); vK.textContent = st.k.toFixed(2); eWarm = false; eDriftMax = 0; });
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); eWarm = false; eDriftMax = 0; });
selV.addEventListener('change', () => { st.view = selV.value; });
btnR.addEventListener('click', () => { st.t = 0; eWarm = false; eDriftMax = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const PAD = 46;
const SPAN = W - 2 * PAD;
const ax = SPAN / (st.N - 1);                 // px per lattice spacing

function coil(x0, y0, x1, y1, turns, amp) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;            // unit normal
  ctx.beginPath(); ctx.moveTo(x0, y0);
  const seg = turns * 2;
  for (let s = 1; s < seg; s += 1) {
    const f = s / seg;
    const sgn = (s % 2 === 0) ? 0 : (Math.floor(s / 1) % 2 === 1 ? 1 : -1);
    ctx.lineTo(x0 + dx * f + nx * amp * sgn, y0 + dy * f + ny * amp * sgn);
  }
  ctx.lineTo(x1, y1); ctx.stroke();
}

function drawTransverse(cy) {
  ctx.strokeStyle = 'rgba(148,163,184,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, cy); ctx.lineTo(W - PAD, cy); ctx.stroke();
  // springs along the displaced chain
  const pts = [];
  for (let i = 0; i < st.N; i += 1) {
    const p = modePosition(i, st.t, 'transverse', st.k, st.A, st.N);
    pts.push([PAD + i * ax, cy - p.y * 70]);
  }
  ctx.strokeStyle = 'rgba(91,192,235,0.35)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < st.N - 1; i += 1) coil(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 6, 4);
  // smooth waveform
  ctx.strokeStyle = 'rgba(91,192,235,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let s = 0; s <= 240; s += 1) {
    const xx = s / 240 * (st.N - 1);
    const ph = st.k * xx - omegaK(st.k) * st.t;
    const px = PAD + xx * ax, py = cy - st.A * Math.cos(ph) * 70;
    s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  for (const [x, y] of pts) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
    g.addColorStop(0, '#bfe9ff'); g.addColorStop(1, '#2b7fb0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'body');
  ctx.fillText('Transverse: masses move across the chain (string, light, seismic S-wave)', PAD, cy - 78);
  // shake-direction arrow
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(W - PAD + 8, cy - 26); ctx.lineTo(W - PAD + 8, cy + 26); ctx.stroke();
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(W - PAD + 8, cy + 26 * s); ctx.lineTo(W - PAD + 4, cy + 26 * s - 6 * s); ctx.lineTo(W - PAD + 12, cy + 26 * s - 6 * s); ctx.fill(); }
}

function drawLongitudinal(cy) {
  // equilibrium ticks (rest lattice)
  ctx.strokeStyle = 'rgba(148,163,184,0.16)'; ctx.lineWidth = 1;
  for (let i = 0; i < st.N; i += 1) { const x = PAD + i * ax; ctx.beginPath(); ctx.moveTo(x, cy + 16); ctx.lineTo(x, cy + 22); ctx.stroke(); }
  const xs = [];
  for (let i = 0; i < st.N; i += 1) xs.push(modePosition(i, st.t, 'longitudinal', st.k, st.A, st.N).x);
  // local compression -> colour (compressed warm, rarefied cool)
  const col = [];
  for (let i = 0; i < st.N; i += 1) {
    const lo = i > 0 ? xs[i] - xs[i - 1] : xs[1] - xs[0];
    const hi = i < st.N - 1 ? xs[i + 1] - xs[i] : xs[st.N - 1] - xs[st.N - 2];
    const spacing = 0.5 * (lo + hi);            // 1 = rest
    col.push(Math.max(0, Math.min(1, 0.5 + (1 - spacing) * 2.2)));
  }
  // density band behind the atoms
  for (let i = 0; i < st.N - 1; i += 1) {
    const c = rdbu(0.5 + (0.5 - 0.5 * (col[i] + col[i + 1])));
    ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.16)`;
    ctx.fillRect(PAD + xs[i] * ax, cy - 30, (xs[i + 1] - xs[i]) * ax + 1, 60);
  }
  ctx.strokeStyle = 'rgba(255,209,102,0.3)'; ctx.lineWidth = 1.1;
  for (let i = 0; i < st.N - 1; i += 1) coil(PAD + xs[i] * ax, cy, PAD + xs[i + 1] * ax, cy, 5, 3.5);
  for (let i = 0; i < st.N; i += 1) {
    const x = PAD + xs[i] * ax;
    const c = rdbu(0.5 + (0.5 - col[i]));        // compressed -> red, rarefied -> blue
    const g = ctx.createRadialGradient(x, cy, 0, x, cy, 8);
    g.addColorStop(0, `rgb(${Math.min(255, c.r + 60)},${c.g},${c.b})`);
    g.addColorStop(1, `rgb(${c.r},${c.g},${c.b})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, 6, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'body');
  ctx.fillText('Longitudinal: masses move along it, compressions and rarefactions (sound, seismic P-wave)', PAD, cy - 78);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(W - PAD - 4, cy + 44); ctx.lineTo(W - PAD + 20, cy + 44); ctx.stroke();
  for (const s of [-1, 1]) { const ex = s < 0 ? W - PAD - 4 : W - PAD + 20; ctx.beginPath(); ctx.moveTo(ex, cy + 44); ctx.lineTo(ex - 5 * s, cy + 40); ctx.lineTo(ex - 5 * s, cy + 48); ctx.fill(); }
}

function energyDrift() {
  // mode energy from the exported helper; constant for a linear mode
  const dt = 0.012;
  const cur = [], prev = [];
  for (let i = 0; i < st.N; i += 1) {
    cur.push(modePosition(i, st.t, 'transverse', st.k, st.A, st.N));
    prev.push(modePosition(i, st.t - dt, 'transverse', st.k, st.A, st.N));
  }
  const E = totalEnergy(cur, prev, 1, 1, dt);
  if (!eWarm) { E0 = E; eWarm = true; }
  const d = E0 > 1e-9 ? Math.abs((E - E0) / E0) : 0;
  if (d > eDriftMax) eDriftMax = d;
  return { E, d };
}

function render() {
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('Same dispersion, two polarizations: a string vs a sound wave', 18, 24);

  if (st.view === 'both') { drawTransverse(132); drawLongitudinal(258); }
  else if (st.view === 'trans') drawTransverse(196);
  else drawLongitudinal(212);

  // wavelength ruler + phase-velocity arrow on the chain
  const lamAtoms = 2 * Math.PI / st.k;
  const yRul = st.view === 'both' ? 326 : (st.view === 'trans' ? 296 : 306);
  const x0 = PAD, x1 = PAD + Math.min(st.N - 1, lamAtoms) * ax;
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, yRul); ctx.lineTo(x1, yRul); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, yRul - 5); ctx.lineTo(x0, yRul + 5); ctx.moveTo(x1, yRul - 5); ctx.lineTo(x1, yRul + 5); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`wavelength lambda = 2pi/k = ${lamAtoms.toFixed(2)} a`, x0, yRul - 8);

  const w = omegaK(st.k);
  const vPh = st.k > 1e-6 ? w / st.k : 1;
  const vGr = Math.cos(st.k / 2);               // dω/dk for ω=2|sin(k/2)|
  const { E, d } = energyDrift();
  ctx.fillStyle = '#cbd5e1'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`k = ${st.k.toFixed(2)}/a   omega = ${w.toFixed(3)}   v_phase = ${vPh.toFixed(3)}   v_group = ${vGr.toFixed(3)}   E = ${E.toFixed(2)} (|dE/E| < ${eDriftMax.toExponential(1)})`, 18, 354);

  // demoted diagnostic: the lattice dispersion over the first Brillouin zone
  const dx0 = 60, dx1 = W - 24, dy0 = 366, dy1 = H - 12;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('dispersion  omega(k) = 2 sqrt(K/m) |sin(ka/2)|  over the first Brillouin zone', dx0 + 8, dy0 + 12);
  const kMax = Math.PI, wMax = 2;
  const xP = (kk) => dx0 + 12 + kk / kMax * (dx1 - dx0 - 24);
  const yP = (ww) => dy1 - 6 - ww / (wMax * 1.08) * (dy1 - dy0 - 22);
  // long-wavelength sound asymptote omega ~ c k, c = a sqrt(K/m) = 1
  ctx.strokeStyle = 'rgba(52,211,153,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xP(0), yP(0)); ctx.lineTo(xP(wMax), yP(wMax)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const kk = kMax * i / 120; const p = { x: xP(kk), y: yP(omegaK(kk)) }; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(xP(kMax), dy0 + 16); ctx.lineTo(xP(kMax), dy1 - 4); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#64748b'; ctx.fillText('sound limit', xP(0.35), yP(1.4));
  ctx.fillText('zone edge pi/a: v_group = 0 (standing wave)', xP(kMax) - 230, dy0 + 24);
  const kc = Math.min(kMax, st.k);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(xP(kc), yP(omegaK(kc)), 4, 0, 6.2832); ctx.fill();

  rW.textContent = d.toExponential(1);
}

function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += Math.min(0.05, dt) * 1.5; render(); requestAnimationFrame(tick); }
function bootSync() {
  st.t = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 2.2;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
// State reports the mode wavenumber, amplitude and the dispersion-
// relation frequency. The invariant checks that the normal mode
// conserves energy: a linear normal mode of the spring chain has a
// time-constant total energy, so the worst observed energy drift
// (eDriftMax, accumulated by the render loop) must stay small.
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'wavenumber', label: 'mode wavenumber k', value: st.k, format: 'float' },
      { key: 'amplitude', label: 'amplitude A', value: st.A, format: 'float' },
      { key: 'frequency', label: 'mode frequency omega(k)', value: omegaK(st.k), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  return [{
    key: 'energy',
    label: 'mode energy conserved (linear normal mode)',
    value: eDriftMax.toExponential(2),
    status: eDriftMax < 5e-3 ? 'pass' : (eDriftMax < 5e-2 ? 'pending' : 'drift'),
  }];
};
