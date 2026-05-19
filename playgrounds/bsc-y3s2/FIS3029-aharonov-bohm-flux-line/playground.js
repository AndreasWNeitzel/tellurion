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

const st = { phi: 0, t: 0 };
let running = true;
sP.addEventListener('input', () => { st.phi = parseFloat(sP.value); vP.textContent = st.phi.toFixed(2); });
btnR.addEventListener('click', () => {
  st.phi = 0; sP.value = '0'; vP.textContent = '0.00'; st.t = 0;
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const CY = H / 2;
const SRC = [50, CY];
const SLIT_X = 200, SLIT_Y1 = CY - 50, SLIT_Y2 = CY + 50;
const SCREEN_X = W - 100;
const SOL = [(SLIT_X + SCREEN_X) / 2, CY];          // solenoid (flux line)
const K = 0.30;                                     // electron wavenumber (rad/px)
const OMEGA = K * 3.2;                               // phase speed for the animation

// Field buffer (half resolution), allocated once.
const FX0 = SLIT_X, FY0 = 70, FW = SCREEN_X - SLIT_X, FH = H - 140;
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
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
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
  ctx.fillStyle = '#e7ebf0'; ctx.font = '11px ui-monospace, monospace';
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
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 13px ui-monospace, monospace';
  tlabel('flux line  Phi', SOL[0] + 24, SOL[1] - 18);
  ctx.fillStyle = '#ffe6a8'; ctx.font = '11px ui-monospace, monospace';
  tlabel('B = 0 on both paths; only A is nonzero', SOL[0] - 116, SOL[1] + 42);

  // screen and the time-averaged intensity it records (diagnostic strip)
  ctx.strokeStyle = '#cdd3da'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SCREEN_X, 70); ctx.lineTo(SCREEN_X, H - 70); ctx.stroke();
  ctx.fillStyle = '#cdd3da'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('detector', SCREEN_X - 4, 62);
  ctx.beginPath();
  for (let y = 72; y <= H - 72; y += 1) {
    const xc = (y - CY) / 200;
    const I = intensity(xc, 1, 1, 30, 2 * Math.PI * st.phi);   // 0..2
    const a = Math.max(0, Math.min(255, Math.floor(I * 120 + 8)));
    ctx.fillStyle = `rgb(${a},${Math.floor(a * 0.9)},${Math.floor(a * 0.55)})`;
    ctx.fillRect(SCREEN_X + 5, y, 34, 1);
  }
  // intensity profile curve drawn off the screen line
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let y = 72; y <= H - 72; y += 2) {
    const xc = (y - CY) / 200;
    const I = intensity(xc, 1, 1, 30, 2 * Math.PI * st.phi);
    const px = SCREEN_X + 45 + I * 26;
    if (y === 72) ctx.moveTo(px, y); else ctx.lineTo(px, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`Phi / Phi_0 = ${st.phi.toFixed(2)}    fringe shift = ${st.phi.toFixed(2)} cycles    path phase split = ${(2 * st.phi).toFixed(2)} pi`, 14, H - 16);
  rP.textContent = st.phi.toFixed(2);
}

function tick() {
  if (running) st.t += 1;
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
