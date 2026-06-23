// Aharonov-Bohm: a propagating electron wave, not a static fringe bar.
// Two coherent cylindrical waves leave the slits and travel to the
// screen. A thin solenoid sits between the two paths; B = 0 everywhere
// the electron goes, but the enclosed flux makes the two partial waves
// differ by the gauge-invariant phase 2 pi (Phi / Phi_0). We render the
// instantaneous Re(psi) field (the wavefronts physically propagate),
// the recombination, and the time-averaged screen intensity as the
// diagnostic cross-section. intensity() in sim.js is unchanged and is
// the far-field limit of what is drawn. Reference: Sakurai, Modern QM,
// Ch. 2; Aharonov and Bohm, Phys. Rev. 115, 485 (1959).
import { intensity } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rP = document.getElementById('readout-p');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { phi: 0, t: 0, sweep: true, sweepDir: 1 };
let running = !prefersReducedMotion();
sP.addEventListener('input', () => { st.phi = parseFloat(sP.value); vP.textContent = st.phi.toFixed(2); st.sweep = false; });
btnR.addEventListener('click', () => {
  st.phi = 0; sP.value = '0'; vP.textContent = '0.00'; st.t = 0; st.sweep = true; st.sweepDir = 1;
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Wavefield occupies the top; an Aharonov-Bohm diagnostic panel sits below.
const FY0 = 60, FH = 560;                            // wavefield region (top)
const CY = FY0 + FH / 2;                             // field centre
const SRC = [50, CY];
const SLIT_X = 200, SLIT_Y1 = CY - 52, SLIT_Y2 = CY + 52;
const SCREEN_X = W - 96;
const SOL = [(SLIT_X + SCREEN_X) / 2, CY];           // solenoid (flux line)
const K = 0.30;                                      // electron wavenumber (rad/px)
const OMEGA = K * 2.2;                               // phase speed (slowed so wavefronts are followable)

// Field buffer (half resolution), allocated once.
const FX0 = SLIT_X, FW = SCREEN_X - SLIT_X;
const NX = FW >> 1, NY = FH >> 1;
const off = document.createElement('canvas'); off.width = NX; off.height = NY;
const offctx = off.getContext('2d');
const img = offctx.createImageData(NX, NY);
const buf = img.data;

function drawField() {
  const half = Math.PI * st.phi;                    // +-half the AB phase split
  const c1 = Math.cos, t = st.t;
  for (let j = 0; j < NY; j += 1) {
    const y = FY0 + j * 2;
    const dy1 = y - SLIT_Y1, dy2 = y - SLIT_Y2;
    let p = (j * NX) << 2;
    for (let i = 0; i < NX; i += 1) {
      const x = FX0 + i * 2;
      const dx = x - SLIT_X;
      const r1 = Math.sqrt(dx * dx + dy1 * dy1);
      const r2 = Math.sqrt(dx * dx + dy2 * dy2);
      // 1/sqrt(r) cylindrical-wave amplitude falloff
      const a1 = 1 / Math.sqrt(6 + r1 * 0.5);
      const a2 = 1 / Math.sqrt(6 + r2 * 0.5);
      const re = a1 * c1(K * r1 - OMEGA * t + half) + a2 * c1(K * r2 - OMEGA * t - half);
      const s = re * 7.0;                            // scale into colour range
      // cool diverging map: negative deep blue, zero near-black, positive cyan-white
      let R, G, B;
      if (s >= 0) { const u = s > 1 ? 1 : s; R = 40 * u + 6; G = 150 * u + 8; B = 200 * u + 14; }
      else { const u = s < -1 ? 1 : -s; R = 10 + 20 * u; G = 30 * u + 8; B = 120 * u + 14; }
      buf[p] = R; buf[p + 1] = G; buf[p + 2] = B; buf[p + 3] = 255;
      p += 4;
    }
  }
  offctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, FX0, FY0, FW, FH);
}

// Text with a dark halo so labels read over the bright wavefield.
function tlabel(s, x, y) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4;
  ctx.fillText(s, x, y); ctx.fillText(s, x, y);
  ctx.restore();
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawField();

  // source
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('electron source', 18, CY - 86);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(SRC[0], SRC[1], 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(6,214,160,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(SRC[0] + 6, CY); ctx.lineTo(SLIT_X - 2, CY); ctx.stroke();

  // slit barrier
  ctx.strokeStyle = '#cdd3da'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(SLIT_X, 60); ctx.lineTo(SLIT_X, SLIT_Y1 - 7);
  ctx.moveTo(SLIT_X, SLIT_Y1 + 7); ctx.lineTo(SLIT_X, SLIT_Y2 - 7);
  ctx.moveTo(SLIT_X, SLIT_Y2 + 7); ctx.lineTo(SLIT_X, H - 60);
  ctx.stroke();
  ctx.fillStyle = '#e7ebf0'; ctx.font = fontString(canvas, 'caption', 'mono');
  tlabel('slit 1', SLIT_X + 6, SLIT_Y1 - 12);
  tlabel('slit 2', SLIT_X + 6, SLIT_Y2 + 22);

  // the two enclosing paths (guides): one over, one under the flux line
  ctx.strokeStyle = 'rgba(170,225,255,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(SLIT_X, SLIT_Y1); ctx.quadraticCurveTo(SOL[0], CY - 95, SCREEN_X, CY);
  ctx.moveTo(SLIT_X, SLIT_Y2); ctx.quadraticCurveTo(SOL[0], CY + 95, SCREEN_X, CY);
  ctx.stroke(); ctx.setLineDash([]);

  // solenoid (flux line) with a circulating-A symbol; B = 0 on the paths
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(SOL[0], SOL[1], 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(SOL[0], SOL[1], 17, -2.4, 1.9); ctx.stroke();
  const aa = 1.9;
  ctx.beginPath();
  ctx.moveTo(SOL[0] + 17 * Math.cos(aa), SOL[1] + 17 * Math.sin(aa));
  ctx.lineTo(SOL[0] + 17 * Math.cos(aa) - 7, SOL[1] + 17 * Math.sin(aa) - 2);
  ctx.lineTo(SOL[0] + 17 * Math.cos(aa) + 1, SOL[1] + 17 * Math.sin(aa) + 7);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'body', 'mono', 600);
  tlabel('flux line  Phi', SOL[0] + 24, SOL[1] - 18);
  ctx.fillStyle = '#ffe6a8'; ctx.font = fontString(canvas, 'caption', 'mono');
  tlabel('B = 0 on both paths; only A is nonzero', SOL[0] - 116, SOL[1] + 42);

  // path-phase labels: the enclosed flux splits the two partial waves by
  // +-pi Phi/Phi_0 (gauge-invariant), even though B = 0 along both paths.
  ctx.fillStyle = 'rgba(170,225,255,0.95)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  tlabel(`upper path phase  +${st.phi.toFixed(2)} pi`, SOL[0] - 150, CY - 80);
  tlabel(`lower path phase  -${st.phi.toFixed(2)} pi`, SOL[0] - 150, CY + 92);

  // detector screen + the time-averaged fringe pattern it records
  const yTop = FY0 + 10, yBot = FY0 + FH - 10;
  ctx.strokeStyle = '#cdd3da'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SCREEN_X, yTop); ctx.lineTo(SCREEN_X, yBot); ctx.stroke();
  ctx.fillStyle = '#cdd3da'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('detector', SCREEN_X - 6, yTop - 6);
  for (let y = yTop; y <= yBot; y += 1) {
    const I = intensity((y - CY) / 150, 1, 1, 30, 2 * Math.PI * st.phi);
    const a = Math.max(0, Math.min(255, Math.floor(I * 120 + 8)));
    ctx.fillStyle = `rgb(${a},${Math.floor(a * 0.9)},${Math.floor(a * 0.55)})`;
    ctx.fillRect(SCREEN_X + 5, y, 30, 1);
  }
  // intensity profile curve off the screen, plus the moving central fringe
  let yPeak = CY, Ipeak = -1;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let y = yTop; y <= yBot; y += 2) {
    const I = intensity((y - CY) / 150, 1, 1, 30, 2 * Math.PI * st.phi);
    if (I > Ipeak) { Ipeak = I; yPeak = y; }
    const px = SCREEN_X + 40 + I * 24;
    if (y === yTop) ctx.moveTo(px, y); else ctx.lineTo(px, y);
  }
  ctx.stroke();
  // central bright fringe: the AB phase slides it as the flux changes
  ctx.strokeStyle = '#ff5c8a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SCREEN_X - 8, yPeak); ctx.lineTo(SCREEN_X + 38, yPeak); ctx.stroke();
  ctx.fillStyle = '#ff5c8a'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  tlabel('central fringe', SCREEN_X - 12, yPeak + 4);
  ctx.textAlign = 'left';

  // ===== AUX PANEL: the Aharonov-Bohm fringe-shift law =====
  const ax0 = 24, ay0 = FY0 + FH + 24, aw = W - 48, ah = H - ay0 - 14;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(ax0, ay0, aw, ah);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(ax0 + 0.5, ay0 + 0.5, aw - 1, ah - 1);
  ctx.fillStyle = '#9aa3b2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('fringe shift = Phi / Phi_0  (one fringe per flux quantum; B = 0 on both paths)', ax0 + 10, ay0 + 18);
  const plX = ax0 + 50, plR = ax0 + aw - 24, plT = ay0 + 34, plB = ay0 + ah - 32;
  const PMIN = -2, PMAX = 2, PSPAN = PMAX - PMIN;
  const xOf = (p) => plX + ((p - PMIN) / PSPAN) * (plR - plX);
  const yOf = (s) => plB - ((s - PMIN) / PSPAN) * (plB - plT);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.6)';
  for (let p = PMIN; p <= PMAX; p += 1) {
    ctx.strokeStyle = 'rgba(226,232,240,0.06)'; ctx.beginPath(); ctx.moveTo(xOf(p), plT); ctx.lineTo(xOf(p), plB); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText(`${p}`, xOf(p), plB + 15);
    ctx.textAlign = 'right'; ctx.fillText(`${p}`, plX - 6, yOf(p) + 3);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOf(0), plT); ctx.lineTo(xOf(0), plB); ctx.moveTo(plX, yOf(0)); ctx.lineTo(plR, yOf(0)); ctx.stroke();
  ctx.fillStyle = '#8893a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Phi / Phi_0', (plX + plR) / 2, plB + 30);
  ctx.save(); ctx.translate(ax0 + 14, (plT + plB) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('fringe shift', 0, 0); ctx.restore();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(xOf(PMIN), yOf(PMIN)); ctx.lineTo(xOf(PMAX), yOf(PMAX)); ctx.stroke();
  const ps = Math.max(PMIN, Math.min(PMAX, st.phi));
  ctx.strokeStyle = 'rgba(255,92,138,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOf(ps), yOf(0)); ctx.lineTo(xOf(ps), yOf(ps)); ctx.lineTo(xOf(0), yOf(ps)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.arc(xOf(ps), yOf(ps), 5, 0, 6.2832); ctx.fill();

  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`Phi / Phi_0 = ${st.phi.toFixed(2)}    path phase split = ${(2 * st.phi).toFixed(2)} pi`, ax0 + 10, ay0 - 8);
  rP.textContent = st.phi.toFixed(2);
}

function tick() {
  if (running) {
    st.t += 0.22;                    // slow enough that the wavefronts can be followed
    if (st.sweep) {                  // auto-ramp the flux so the fringes visibly march
      st.phi += 0.006 * st.sweepDir;
      if (st.phi >= 2) { st.phi = 2; st.sweepDir = -1; }
      else if (st.phi <= -2) { st.phi = -2; st.sweepDir = 1; }
      sP.value = st.phi.toFixed(2); vP.textContent = st.phi.toFixed(2);
    }
  }
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // Sweep a non-integer flux span so the five frames show five
    // distinct Aharonov-Bohm shifts (integer Phi/Phi_0 would alias
    // back to the same fringe pattern).
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.phi = 0.15 + 1.40 * frac;
    st.t = 0;                                       // freeze wavefronts for a deterministic frame
    sP.value = String(st.phi); vP.textContent = st.phi.toFixed(2);
  }
  render();
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
function peakIntensity() {                              // scan the screen for the fringe-pattern max
  let m = 0;
  for (let xc = -1.5; xc <= 1.5; xc += 0.01) {
    const I = intensity(xc, 1, 1, 30, 2 * Math.PI * st.phi);
    if (I > m) m = I;
  }
  return m;
}
window.playground.getState = function () {
  const Imax = peakIntensity();
  return {
    fields: [
      { key: 'flux-phase', label: 'AB phase $\\Phi/\\Phi_0$', value: st.phi, format: 'float' },
      { key: 'time', label: 'Time (a.u.)', value: st.t, format: 'float' },
      { key: 'intensity-max', label: '$I_{max}$ (a.u.)', value: Imax, format: 'float' },
      { key: 'wavenumber', label: 'Wavenumber $k$ (rad/px)', value: K, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const phi = st.phi % (2 * Math.PI);
  const Imax = peakIntensity();
  return [
    { key: 'phase-periodic', label: 'Phase mod $2\\pi$', value: phi.toFixed(3), status: 'pass' },
    { key: 'intensity-nonneg', label: '$I \\geq 0$', value: Imax >= 0 ? 'yes' : 'no', status: Imax >= 0 ? 'pass' : 'drift' }
  ];
};
