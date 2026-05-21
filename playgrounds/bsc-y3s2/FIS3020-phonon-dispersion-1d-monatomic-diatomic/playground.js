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
let st = { m1: 1, m2: 2, K: 1, pol: 'transverse' }; let running = true;
sM1.addEventListener('input', () => { st.m1 = parseFloat(sM1.value); vM1.textContent = st.m1.toFixed(2); });
sM2.addEventListener('input', () => { st.m2 = parseFloat(sM2.value); vM2.textContent = st.m2.toFixed(2); });
sK.addEventListener('input', () => { st.K = parseFloat(sK.value); vK.textContent = st.K.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
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
// atoms never overlap the axis or the readout. The y-axis uses a FIXED
// omega scale (not auto-scaled by the data), so raising K visibly
// pushes the branches up instead of rescaling the whole plot to look
// unchanged. OMEGA_MAX covers the slider extremes (K=3, m=0.5).
const PLOT_B = 150;                 // px reserved below the plot
const LAT_TOP = () => canvas.height - 118;
const LAT_BOT = () => canvas.height - 40;
const OMEGA_MAX = 5.0;
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: PLOT_B };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('ω(k)', 12, pad.t + 10); ctx.fillText('k a / π', W - 60, H - pad.b + 16);
  const xToPx = (k) => pad.l + (k + Math.PI) / (2 * Math.PI) * (W - pad.l - pad.r);
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
  const clickedOmega = (H - pad.b - py) / (H - pad.t - pad.b) * OMEGA_MAX;
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

function tick() { render(); renderLattice(); requestAnimationFrame(tick); }
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
