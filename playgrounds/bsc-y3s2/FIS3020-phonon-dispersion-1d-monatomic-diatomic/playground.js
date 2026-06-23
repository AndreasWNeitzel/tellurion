import { monatomic, diatomic, gapAtZoneBoundary } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rG = document.getElementById('readout-g');
const sM1 = document.getElementById('slider-m1'), vM1 = document.getElementById('value-m1');
const sM2 = document.getElementById('slider-m2'), vM2 = document.getElementById('value-m2');
const sK = document.getElementById('slider-K'), vK = document.getElementById('value-K');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const st = { m1: 1, m2: 2, K: 1.8, pol: 'transverse' }; let running = true;
sM1.addEventListener('input', () => { st.m1 = parseFloat(sM1.value); vM1.textContent = st.m1.toFixed(2); });
sM2.addEventListener('input', () => { st.m2 = parseFloat(sM2.value); vM2.textContent = st.m2.toFixed(2); });
sK.addEventListener('input', () => { st.K = parseFloat(sK.value); vK.textContent = st.K.toFixed(2); });
btnR.addEventListener('click', () => { running = true; autoK = !prefersReducedMotion(); btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
// Polarization toggle (transverse / longitudinal). Both share the
// same dispersion in a 1D chain; the difference is the direction of
// the atomic displacement, which is what the user sees in the strip.
const btnPol = document.getElementById('btn-polarization');
if (btnPol) {
  btnPol.addEventListener('click', () => {
    st.pol = (st.pol === 'transverse') ? 'longitudinal' : 'transverse';
    btnPol.textContent = `Polarization: ${st.pol}`;
  });
}
// Plot occupies the top; a dedicated lattice band sits below it so the
// atoms never overlap the axis or the readout. The y-axis ceiling tracks the
// masses (sized for K at its 3.0 maximum) but is INDEPENDENT of K, so raising
// K still visibly pushes the branches up instead of rescaling the plot, while
// a typical K fills most of the panel. The old fixed 5.0 was sized for the
// lightest-mass extreme and left the default masses squashed into the bottom
// third of the panel.
const PLOT_B = 150;                 // px reserved below the plot
const LAT_TOP = () => canvas.height - 118;
const LAT_BOT = () => canvas.height - 40;
const K_MAX = 3;
function omegaMax() { return Math.sqrt(2 * K_MAX * (1 / st.m1 + 1 / st.m2)) * 1.08; }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: PLOT_B };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('ω(k)', 12, pad.t + 10); ctx.fillText('k a / π', W - 60, H - pad.b + 16);
  const xToPx = (k) => pad.l + (k + Math.PI) / (2 * Math.PI) * (W - pad.l - pad.r);
  const OMEGA_MAX = omegaMax();
  const yToPx = (o) => H - pad.b - Math.min(o, OMEGA_MAX) / OMEGA_MAX * (H - pad.t - pad.b);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const w = monatomic(k, st.K, (st.m1 + st.m2) / 2);
    if (i === -100) ctx.moveTo(xToPx(k), yToPx(w)); else ctx.lineTo(xToPx(k), yToPx(w));
  }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const d = diatomic(k, st.K, st.m1, st.m2);
    if (i === -100) ctx.moveTo(xToPx(k), yToPx(d.acoustic)); else ctx.lineTo(xToPx(k), yToPx(d.acoustic));
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const d = diatomic(k, st.K, st.m1, st.m2);
    if (i === -100) ctx.moveTo(xToPx(k), yToPx(d.optical)); else ctx.lineTo(xToPx(k), yToPx(d.optical));
  }
  ctx.stroke();
  const gap = gapAtZoneBoundary(st.K, st.m1, st.m2);
  ctx.strokeStyle = 'rgba(239,71,111,0.4)'; ctx.fillStyle = 'rgba(239,71,111,0.1)';
  ctx.fillRect(xToPx(Math.PI) - 4, yToPx(gap.high), 8, yToPx(gap.low) - yToPx(gap.high));
  ctx.fillStyle = '#ef476f'; ctx.fillText('GAP', xToPx(Math.PI) - 10, (yToPx(gap.high) + yToPx(gap.low)) / 2);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('Monatomic (dashed)', pad.l + 10, pad.t + 40);
  ctx.fillStyle = '#06d6a0'; ctx.fillText('Acoustic', pad.l + 10, pad.t + 56);
  ctx.fillStyle = '#ffd166'; ctx.fillText('Optical', pad.l + 10, pad.t + 72);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`m₁ = ${st.m1.toFixed(2)}, m₂ = ${st.m2.toFixed(2)}, K = ${st.K.toFixed(2)}  (raise K -> branches rise)`, pad.l + 10, pad.t + 92);
  // Swept mode marker on the selected branch: glides along the dispersion
  // (the big moving element) while the lattice strip below shows that mode.
  const mkx = xToPx(selected.k), mky = yToPx(Math.min(selected.omega, OMEGA_MAX));
  ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(mkx, pad.t); ctx.lineTo(mkx, H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mkx, mky, 5.5, 0, 2 * Math.PI); ctx.fill();

  rG.textContent = (gap.high - gap.low).toFixed(2);
}
// Upgrade 1-A: a 24-atom strip below the dispersion curve. Clicking any
// point on a dispersion branch selects (k, omega) and the atoms animate
// transversely as y_i(t) = A sin(k i a - omega t). Acoustic and optical
// branches look qualitatively different (in-phase vs anti-phase per cell).
const NATOMS = 24;
const AMP = 12;          // px transverse amplitude
let _t0 = performance.now();
// Default selected mode: mid-zone acoustic so the strip autoplays.
let selected = { k: Math.PI / 2, omega: monatomic(Math.PI / 2, 1, 1.5), branch: 'monatomic' };

// Invert the plot mapping to recover (k, omega) from a canvas click, then
// snap omega to the nearest dispersion branch at that k.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: PLOT_B };
  if (px < pad.l || px > W - pad.r || py < pad.t || py > H - pad.b) return;
  const k = (px - pad.l) / (W - pad.l - pad.r) * 2 * Math.PI - Math.PI;
  const clickedOmega = (H - pad.b - py) / (H - pad.t - pad.b) * omegaMax();
  const mono = monatomic(k, st.K, (st.m1 + st.m2) / 2);
  const di = diatomic(k, st.K, st.m1, st.m2);
  const cand = [
    { omega: mono, branch: 'monatomic' },
    { omega: di.acoustic, branch: 'acoustic' },
    { omega: di.optical, branch: 'optical' },
  ];
  cand.sort((a, b) => Math.abs(a.omega - clickedOmega) - Math.abs(b.omega - clickedOmega));
  selected = { k, omega: Math.max(cand[0].omega, 1e-3), branch: cand[0].branch };
  _t0 = performance.now();
  autoK = false;                                 // user picked a fixed mode; stop the k-sweep
});

function renderLattice() {
  const W = canvas.width;
  // Dedicated band well below the dispersion plot, so atoms never
  // overlap the axis label or the parameter readout.
  const bandTop = LAT_TOP(), bandBot = LAT_BOT();
  const stripY = (bandTop + bandBot) / 2;
  const dx = W / (NATOMS + 4), x0 = dx * 2;
  // Scale omega so one period is ~3 s real time.
  let phase;
  if (CAPTURE_NAME) {
    phase = CAPTURE_FRAC * 2 * Math.PI;          // deterministic per frame
  } else {
    const tReal = (performance.now() - _t0) / 1000;
    phase = running ? (2 * Math.PI / 3) * tReal : 0;
  }
  ctx.fillStyle = 'rgba(220,220,240,0.07)';
  ctx.fillRect(0, stripY - 16, W, 32);
  const k = selected.k;
  // Equilibrium-position markers (faint) so longitudinal compression
  // shows up as a visible bunching.
  ctx.strokeStyle = 'rgba(180, 185, 210, 0.18)'; ctx.lineWidth = 1;
  for (let i = 0; i < NATOMS; i += 1) {
    const xe = x0 + i * dx;
    ctx.beginPath(); ctx.moveTo(xe, stripY - 8); ctx.lineTo(xe, stripY + 8); ctx.stroke();
  }
  for (let i = 0; i < NATOMS; i += 1) {
    let disp;
    if (selected.branch === 'monatomic') {
      disp = AMP * Math.sin(k * i - phase);
    } else {
      const cell = Math.floor(i / 2);
      const isM2 = (i & 1) === 1;
      const cellPhase = k * cell - phase;
      const sub = (selected.branch === 'optical' && isM2) ? -1 : 1;
      disp = AMP * sub * Math.sin(cellPhase);
    }
    const isA = (i & 1) === 0;
    const xe = x0 + i * dx;
    // Longitudinal: shift atom along x; Transverse: shift along y.
    const px = (st.pol === 'longitudinal') ? xe + disp : xe;
    const py = (st.pol === 'longitudinal') ? stripY : stripY + disp;
    ctx.fillStyle = isA ? '#7c9cff' : '#ffd57f';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`Lattice: ${selected.branch} mode, k=${selected.k.toFixed(2)}, ${st.pol}  (click the curve to change)`, 12, stripY - 20);
}

// Auto-sweep the selected wavevector across the zone so the mode marker
// glides along its branch and the lattice wavelength changes; clicking the
// curve picks a fixed mode (pauses the sweep), reset resumes it.
let autoK = !prefersReducedMotion(), kDir = 1, _kLast = performance.now();
function omegaForBranch(k, br) {
  if (br === 'acoustic') return diatomic(k, st.K, st.m1, st.m2).acoustic;
  if (br === 'optical') return diatomic(k, st.K, st.m1, st.m2).optical;
  return monatomic(k, st.K, (st.m1 + st.m2) / 2);
}
function tick(now) {
  if (running && autoK) {
    const dt = Math.min(0.05, (now - _kLast) / 1000 || 0);
    selected.k += kDir * dt * 0.6;
    if (selected.k >= Math.PI - 0.05) { selected.k = Math.PI - 0.05; kDir = -1; }
    else if (selected.k <= 0.1) { selected.k = 0.1; kDir = 1; }
    selected.omega = Math.max(omegaForBranch(selected.k, selected.branch), 1e-3);
  }
  _kLast = now;
  render(); renderLattice(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    // Vary K across capture frames so the gate exercises the now-fixed
    // K dependence (raising K visibly lifts the branches).
    st.K = 0.5 + CAPTURE_FRAC * 2.5;
    vK.textContent = st.K.toFixed(2);
    // Pick a representative mode per frame for the lattice band.
    selected = CAPTURE_FRAC < 0.5
      ? { k: Math.PI / 2, omega: 1, branch: 'acoustic' }
      : { k: Math.PI / 2, omega: 1, branch: 'optical' };
  }
  render(); renderLattice();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const gap = gapAtZoneBoundary(st.K, st.m1, st.m2);
  const monoAtMid = monatomic(Math.PI / 2, st.K, (st.m1 + st.m2) / 2);
  const diaAtMid = diatomic(Math.PI / 2, st.K, st.m1, st.m2);
  return {
    fields: [
      { key: 'mass-1', label: 'Mass 1', value: st.m1, format: 'float' },
      { key: 'mass-2', label: 'Mass 2', value: st.m2, format: 'float' },
      { key: 'spring-constant', label: 'Spring constant K', value: st.K, format: 'float' },
      { key: 'band-gap', label: 'Optical-acoustic gap', value: gap.high - gap.low, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const gap = gapAtZoneBoundary(st.K, st.m1, st.m2);
  const diaAtBoundary = diatomic(Math.PI, st.K, st.m1, st.m2);
  const gapIsNonNeg = gap.high >= gap.low && gap.low >= 0;
  const opticalAboveAcoustic = diaAtBoundary.optical >= diaAtBoundary.acoustic;
  return [
    {
      key: 'acoustic-optical-order',
      label: 'Optical branch >= acoustic at zone boundary',
      value: opticalAboveAcoustic ? 'pass' : 'fail',
      status: opticalAboveAcoustic ? 'pass' : 'drift'
    },
    {
      key: 'gap-sign',
      label: 'Band gap magnitude >= 0',
      value: gapIsNonNeg ? 'pass' : 'fail',
      status: gapIsNonNeg ? 'pass' : 'drift'
    }
  ];
};
