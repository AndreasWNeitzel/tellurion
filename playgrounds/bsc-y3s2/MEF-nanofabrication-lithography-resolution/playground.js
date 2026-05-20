// Projection-lithography aerial image: a multi-pitch reticle imaged
// through a lens of numerical aperture NA at wavelength lambda. The
// pupil low-pass (|f| <= NA/lambda) blurs out the pitches finer than
// the Rayleigh limit R = k1 lambda / NA. Physics is the gate-tested
// closed-form sim.js. Canvas2D, deterministic.
import {
  WAVELENGTHS, cutoffFreq, rayleigh, reticleTestPattern, aerialImage, contrast,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rLam = document.getElementById('readout-lam');
const rCut = document.getElementById('readout-cut');
const rRay = document.getElementById('readout-ray');
const rRes = document.getElementById('readout-res');
const selLam = document.getElementById('select-lam');
const sNA = document.getElementById('slider-na'), vNA = document.getElementById('value-na');
const sK1 = document.getElementById('slider-k1'), vK1 = document.getElementById('value-k1');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

// Multi-zone reticle: half-pitches from coarse (left) to fine (right).
const PITCHES = [220, 160, 120, 90, 65, 45, 30, 18];   // nm half-pitch
const NSAMP = 1024, DX = 2.5;                            // nm/sample (window ~2.56 um)
const st = { lam: 'arf', NA: 1.0, k1: 0.5, running: !prefersReducedMotion(), phase: 0 };

function lamNm() { return WAVELENGTHS[st.lam]; }

function band(y0, h, label) {
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(label, 30, y0 - 4);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const X0 = 30, PW = W - 60;
  const px = (n) => X0 + PW * (n / (NSAMP - 1));
  const lam = lamNm();
  const reticle = reticleTestPattern(NSAMP, DX, PITCHES);
  const I = aerialImage(reticle, DX, lam, st.NA);
  let Imax = 1e-9; for (let n = 0; n < NSAMP; n += 1) if (I[n] > Imax) Imax = I[n];

  // Reticle strip
  const RY = 40, RH = 90;
  band(RY, RH, 'reticle (mask): line/space, half-pitch 220 -> 18 nm left to right');
  for (let n = 0; n < NSAMP; n += 1) {
    ctx.fillStyle = reticle[n] > 0.5 ? '#cdd6e0' : '#13151b';
    ctx.fillRect(px(n), RY, PW / NSAMP + 0.8, RH);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(X0 + 0.5, RY + 0.5, PW - 1, RH - 1);

  // Aerial image strip (grayscale intensity)
  const AY = RY + RH + 40, AH = 100;
  band(AY, AH, 'aerial image: pupil-filtered intensity (fine pitches blur to grey)');
  for (let n = 0; n < NSAMP; n += 1) {
    const v = Math.max(0, Math.min(1, I[n] / Imax));
    const g = Math.round(255 * v);
    ctx.fillStyle = `rgb(${g},${Math.round(g * 0.95)},${Math.round(g * 0.8)})`;
    ctx.fillRect(px(n), AY, PW / NSAMP + 0.8, AH);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(X0 + 0.5, AY + 0.5, PW - 1, AH - 1);

  // Per-zone contrast bars + Rayleigh marker
  const CY = AY + AH + 44, CH = H - CY - 70;
  band(CY, CH, 'per-zone Michelson contrast; bar red once below the Rayleigh limit');
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(X0, CY, PW, CH);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(X0 + 0.5, CY + 0.5, PW - 1, CH - 1);
  const R = rayleigh(st.k1, lam, st.NA);
  const zoneW = PW / PITCHES.length;
  for (let z = 0; z < PITCHES.length; z += 1) {
    const z0 = Math.floor(z * NSAMP / PITCHES.length), z1 = Math.floor((z + 1) * NSAMP / PITCHES.length);
    const seg = I.slice(z0 + Math.floor((z1 - z0) * 0.15), z1 - Math.floor((z1 - z0) * 0.15));
    const c = contrast(seg);
    const resolved = PITCHES[z] >= R;
    const bx = X0 + z * zoneW + 6, bw = zoneW - 12;
    const bh = (CH - 30) * Math.max(0, Math.min(1, c));
    ctx.fillStyle = resolved ? '#7fd1ff' : '#ff6b6b';
    ctx.fillRect(bx, CY + CH - 16 - bh, bw, bh);
    ctx.fillStyle = 'rgba(220,228,240,0.75)'; ctx.font = '10px monospace';
    ctx.fillText(PITCHES[z] + 'nm', bx, CY + CH - 4);
  }
  ctx.fillStyle = 'rgba(255,210,120,0.85)'; ctx.font = '11px monospace';
  ctx.fillText('Rayleigh R = k1 lambda / NA = ' + R.toFixed(1) + ' nm  (zones < R: not resolved, red)', X0 + 8, CY + 14);

  rLam.textContent = lam.toFixed(1) + ' nm';
  rCut.textContent = (cutoffFreq(st.NA, lam) * 1000).toFixed(3) + ' /um';
  rRay.textContent = R.toFixed(1) + ' nm';
  let minRes = Infinity;
  for (const p of PITCHES) if (p >= R && p < minRes) minRes = p;
  rRes.textContent = Number.isFinite(minRes) ? minRes + ' nm' : '> 220 nm';
}

function tick() { if (st.running) st.phase += 1; draw(); requestAnimationFrame(tick); }

function syncLabels() { vNA.textContent = st.NA.toFixed(2); vK1.textContent = st.k1.toFixed(2); }
selLam.addEventListener('change', () => { st.lam = selLam.value; draw(); });
sNA.addEventListener('input', () => { st.NA = parseFloat(sNA.value) / 100; syncLabels(); draw(); });
sK1.addEventListener('input', () => { st.k1 = parseFloat(sK1.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.lam = 'arf'; st.NA = 1.0; st.k1 = 0.5; st.running = true;
  selLam.value = 'arf'; sNA.value = '100'; sK1.value = '50';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { wavelength: st.lam, na: st.NA.toFixed(2), k1: st.k1.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.wavelength && WAVELENGTHS[s.wavelength]) { st.lam = s.wavelength; selLam.value = s.wavelength; }
  if (s.na) { st.NA = parseFloat(s.na); sNA.value = String(Math.round(st.NA * 100)); }
  if (s.k1) { st.k1 = parseFloat(s.k1); sK1.value = String(Math.round(st.k1 * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) { st.lam = 'arf'; st.NA = 1.0; st.k1 = 0.5; }
  draw();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
