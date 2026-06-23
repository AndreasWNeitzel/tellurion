import { fontString } from '../../../shared/js/canvas-type.js';
// Fabry-Perot etalon spectrometer (Canvas2D). Transmitted intensity
// of the sodium doublet as the plate spacing is scanned: the Airy
// comb of each line and their sum. Raising the reflectance sharpens
// the peaks until the doublet splits. Static (recomputed per control
// change). sim.js is the gate-tested closed-form engine.

import {
  airyT, phase, reflFinesse, fsrNm, resolvingPower, resolves, NA_D2,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rFin = document.getElementById('readout-fin');
const rRp = document.getElementById('readout-rp');
const rFsr = document.getElementById('readout-fsr');
const rNeed = document.getElementById('readout-need');
const rRes = document.getElementById('readout-res');

const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sDL = document.getElementById('slider-dl'), vDL = document.getElementById('value-dl');
const bR = document.getElementById('btn-reset');

const st = { R: 0.6, d_um: 80, dl: 0.60 };
// the spectrum plot now sits below the physical-representation band
const PX0 = 60, PX1 = W - 28, PY0 = 196, PY1 = H - 50;

// Etalon schematic: two partial mirrors and the cascade of internal
// reflections. Each pass loses a factor R, so the number of beams
// that still carry appreciable intensity, and therefore the
// sharpness of the Airy fringes, grows with R: multiple-beam
// interference made literal.
function drawEtalon(R) {
  const x0 = 198, x1 = 348, yIn = 92, span = 128;
  ctx.strokeStyle = 'rgba(150,160,180,0.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, yIn - span / 2); ctx.lineTo(x0, yIn + span / 2);
  ctx.moveTo(x1, yIn - span / 2); ctx.lineTo(x1, yIn + span / 2); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('partial mirrors  R', (x0 + x1) / 2, yIn - span / 2 - 8);
  // incident beam
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(x0 - 32, yIn - 24); ctx.lineTo(x0, yIn - 14); ctx.stroke();
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('in', x0 - 30, yIn - 30);
  // the zig-zag inside and the transmitted partial beams out the right
  const nB = Math.max(2, Math.min(16, Math.ceil(Math.log(0.015) / Math.log(Math.max(0.06, R)))));
  let yhit = yIn - 14, amp = (1 - R);
  ctx.lineWidth = 1.6;
  for (let n = 0; n < nB; n += 1) {
    const yNext = yhit + 16;
    ctx.strokeStyle = `rgba(91,192,235,${Math.max(0.12, 0.85 * amp / (1 - R)).toFixed(3)})`;
    ctx.beginPath(); ctx.moveTo(x0, yhit); ctx.lineTo(x1, yNext); ctx.stroke();      // to far mirror
    // transmitted partial beam exits right, intensity ~ (1-R)^2 R^{2n}
    const tA = Math.max(0.08, 0.95 * (1 - R) * (1 - R) * R ** (2 * n) / ((1 - R) * (1 - R)));
    ctx.strokeStyle = `rgba(239,71,111,${tA.toFixed(3)})`; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x1, yNext); ctx.lineTo(x1 + 40, yNext + 6); ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = `rgba(91,192,235,${Math.max(0.1, 0.7 * R ** (2 * n + 1)).toFixed(3)})`;
    ctx.beginPath(); ctx.moveTo(x1, yNext); ctx.lineTo(x0, yNext + 16); ctx.stroke();  // back to near mirror
    yhit = yNext + 16; amp *= R;
    if (yhit > yIn + span / 2 - 6) break;
  }
  ctx.fillStyle = 'rgba(239,71,111,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('transmitted', x1 + 6, yIn + span / 2 + 14);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'left';
  ctx.fillText(`${nB} beams interfere (> 1.5%)`, 40, yIn + span / 2 + 14);
}

// The ring fringe pattern a real Fabry-Perot spectrometer shows:
// transmission versus angle, T(theta) = Airy(delta(theta)). The
// rings sharpen into thin bright circles as R (the finesse) rises.
function drawRings(R, d0, lam) {
  const cx = 580, cy = 90, rad = 64;
  // pick the angular fan so a fixed handful (about 5) of orders span
  // the disk for any d, otherwise an 80 um etalon packs hundreds of
  // fringes into the fan and they alias into a flat blank
  const NR = 5;
  const cosm = Math.max(-1, 1 - NR * lam / (2 * d0));
  const thetaMax = Math.acos(cosm);
  const img = ctx.createImageData(2 * rad, 2 * rad);
  for (let py = 0; py < 2 * rad; py += 1) {
    for (let px = 0; px < 2 * rad; px += 1) {
      const dx = px - rad, dy = py - rad, rr = Math.hypot(dx, dy);
      const j = (py * 2 * rad + px) * 4;
      if (rr > rad) { img.data[j + 3] = 0; continue; }
      const theta = (rr / rad) * thetaMax;
      const T = airyT(phase(lam, d0, 1, theta), R);
      const v = Math.round(255 * T);
      img.data[j] = v; img.data[j + 1] = Math.round(v * 0.55); img.data[j + 2] = Math.round(v * 0.32); img.data[j + 3] = 255;
    }
  }
  ctx.putImageData(img, cx - rad, cy - rad);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.78)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('ring fringes (eyepiece view)', cx, cy + rad + 15);
  ctx.fillText('sharpen as R rises', cx, cy + rad + 28);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const lam1 = NA_D2 * 1e-9;                       // D2 (fixed)
  const lam2 = (NA_D2 + st.dl) * 1e-9;             // second line
  const d0 = st.d_um * 1e-6;
  drawEtalon(st.R);
  drawRings(st.R, d0, lam1);
  const win = 1.6 * (NA_D2 * 1e-9) / 2;            // about 3 orders wide
  const dA = d0 - win, dB = d0 + win;
  const xOf = (d) => PX0 + (d - dA) / (dB - dA) * (PX1 - PX0);
  const yOf = (T) => PY1 - T * (PY1 - PY0);

  // axes
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.fillText('plate spacing  d  (scanned, micrometres)', (PX0 + PX1) / 2, H - 16);
  ctx.save(); ctx.translate(22, (PY0 + PY1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('transmittance  T', 0, 0); ctx.restore();
  ctx.textAlign = 'right';
  for (let g = 0; g <= 4; g += 1) {
    const yy = PY1 - (g / 4) * (PY1 - PY0);
    ctx.strokeStyle = 'rgba(120,130,150,0.15)'; ctx.beginPath(); ctx.moveTo(PX0, yy); ctx.lineTo(PX1, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(150,160,180,0.5)'; ctx.fillText((g / 4).toFixed(2), PX0 - 6, yy + 4);
  }

  const NP = 900;
  const drawCurve = (lam, color, lw) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i <= NP; i += 1) {
      const d = dA + (i / NP) * (dB - dA);
      const T = airyT(phase(lam, d), st.R);
      const X = xOf(d), Y = yOf(T);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  // sum first (so the individual lines sit on top), scaled by 1/2 to
  // keep it in [0,1]
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i <= NP; i += 1) {
    const d = dA + (i / NP) * (dB - dA);
    const T = 0.5 * (airyT(phase(lam1, d), st.R) + airyT(phase(lam2, d), st.R));
    const X = xOf(d), Y = yOf(T);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  drawCurve(lam1, '#ef476f', 2);
  drawCurve(lam2, '#5bc0eb', 2);

  // legend (top-left inside the plot, clear of the ring panel)
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = '#ef476f'; ctx.fillText('D2 588.995 nm', PX0 + 12, PY0 + 16);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`line 2 (+${st.dl.toFixed(2)} nm)`, PX0 + 12, PY0 + 33);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('sum / 2', PX0 + 12, PY0 + 50);

  const Fstar = reflFinesse(st.R);
  const Rp = resolvingPower(lam1, d0, st.R);
  const info = resolves(NA_D2, st.dl, d0, st.R);
  rFin.textContent = Fstar.toFixed(1);
  rRp.textContent = Math.round(Rp).toString();
  rFsr.textContent = fsrNm(NA_D2, d0).toFixed(3);
  rNeed.textContent = Math.round(info.need).toString();
  rRes.textContent = info.resolved ? 'yes' : 'no';
}

function syncLabels() { vR.textContent = st.R.toFixed(2); vD.textContent = String(st.d_um); vDL.textContent = st.dl.toFixed(2); }

// Auto-sweep the mirror reflectance so the finesse story plays on load: the
// Airy peaks sharpen, the etalon shows more interfering beams, the rings
// tighten, and the sodium doublet resolves. Any control input pauses it.
let playing = false, raf = 0, rDir = 1, last = 0;
function animate(now) {
  if (!playing) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  st.R += rDir * dt * 0.14;                               // ~6 s each way over 0.1..0.95
  if (st.R >= 0.95) { st.R = 0.95; rDir = -1; } else if (st.R <= 0.1) { st.R = 0.1; rDir = 1; }
  sR.value = st.R.toFixed(2); syncLabels(); render();
  raf = requestAnimationFrame(animate);
}
function setPlaying(on) { playing = on; if (on) { last = performance.now(); raf = requestAnimationFrame(animate); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } }
function pause() { if (playing) setPlaying(false); }

sR.addEventListener('input', () => { pause(); st.R = parseFloat(sR.value); syncLabels(); render(); });
sD.addEventListener('input', () => { pause(); st.d_um = parseInt(sD.value, 10); syncLabels(); render(); });
sDL.addEventListener('input', () => { pause(); st.dl = parseFloat(sDL.value); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.R = 0.6; st.d_um = 80; st.dl = 0.60;
  sR.value = '0.6'; sD.value = '80'; sDL.value = '0.6'; syncLabels();
  if (!prefersReducedMotion()) setPlaying(true); else render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.R = 0.10 + f * 0.88;                         // low -> high R: doublet splits
    sR.value = String(st.R);
    syncLabels();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  } else if (!prefersReducedMotion()) {
    setPlaying(true);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); }, { once: true });
} else {
  bootSync();
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const d0 = st.d_um * 1e-6;
  const fsr = fsrNm(NA_D2, d0);                         // match render: fsrNm(NA_D2, d0)
  const fin = reflFinesse(st.R);
  const rp = resolvingPower(NA_D2 * 1e-9, d0, st.R);
  const fields = [
    { key: 'reflectance', label: 'mirror reflectance R', value: parseFloat(st.R.toFixed(3)), format: 'float' },
    { key: 'spacing-um', label: 'plate spacing (um)', value: parseFloat(st.d_um.toFixed(1)), format: 'float' },
    { key: 'finesse', label: 'finesse (FSR/FWHM)', value: parseFloat(fin.toFixed(1)), format: 'float' },
    { key: 'fsr-nm', label: 'FSR (nm)', value: parseFloat(fsr.toFixed(2)), format: 'float' },
  ];
  return { fields };
};
window.playground.getInvariants = function () {
  const inv = [];
  const fin = reflFinesse(st.R);
  const fsr = fsrNm(st.d_um, NA_D2[0]);
  inv.push({
    key: 'fsr-positive',
    label: 'FSR > 0',
    value: fsr > 0 ? 'pass' : 'drift',
    status: fsr > 0 ? 'pass' : 'drift',
  });
  inv.push({
    key: 'finesse-valid',
    label: 'finesse > 1',
    value: fin > 1 ? 'pass' : 'drift',
    status: fin > 1 ? 'pass' : 'drift',
  });
  inv.push({
    key: 'reflectance-bounds',
    label: 'R in [0,1)',
    value: (st.R >= 0 && st.R < 1) ? 'pass' : 'drift',
    status: (st.R >= 0 && st.R < 1) ? 'pass' : 'drift',
  });
  return inv;
};
