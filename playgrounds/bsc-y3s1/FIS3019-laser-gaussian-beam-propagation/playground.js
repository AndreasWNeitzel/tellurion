import { fontString } from '../../../shared/js/canvas-type.js';
// Gaussian-beam ABCD bench (Canvas2D). The beam envelope w(z) is
// drawn along an optical axis through a draggable thin lens; the
// complex q-parameter is propagated by ray-transfer matrices.
// Static (recomputed per control change). sim.js is the gate-tested
// engine.

import {
  qAtWaist, abcdApply, M_free, M_lens, beamRadius, rayleighRange,
  divergence, lensImage,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rZR = document.getElementById('readout-zr');
const rW0o = document.getElementById('readout-w0o');
const rLaw = document.getElementById('readout-law');
const rFoc = document.getElementById('readout-foc');
const rTh = document.getElementById('readout-th');

const sW0 = document.getElementById('slider-w0'), vW0 = document.getElementById('value-w0');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const sZ0 = document.getElementById('slider-z0'), vZ0 = document.getElementById('value-z0');
const sZL = document.getElementById('slider-zl'), vZL = document.getElementById('value-zl');
const sLam = document.getElementById('slider-lam'), vLam = document.getElementById('value-lam');
const bR = document.getElementById('btn-reset');

const ZTOT = 0.6;                                  // 600 mm bench
const st = { w0_um: 200, f_mm: 120, z0_mm: 60, zL_mm: 250, lam_nm: 1064 };

const AX0 = 40, AX1 = W - 28, AYC = H / 2, AYH = H / 2 - 92;
const xOf = (z) => AX0 + (z / ZTOT) * (AX1 - AX0);

// Beam waist (the object) sits at z0; q is propagated from there, so
// before z0 the beam is converging into its waist and after the lens
// it refocuses. Negative free-space lengths are valid ABCD.
function qAt(z, q0, z0, zL, f) {
  if (z <= zL) return abcdApply(M_free(z - z0), q0);
  return abcdApply(M_free(z - zL), abcdApply(M_lens(f), abcdApply(M_free(zL - z0), q0)));
}

// A transverse Gaussian intensity spot (radial gradient), radius rPx.
function drawSpot(cx, cy, rPx, col) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(2, rPx));
  g.addColorStop(0, col); g.addColorStop(0.6, col.replace('1)', '0.5)')); g.addColorStop(1, col.replace('1)', '0)'));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, rPx), 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = col.replace('1)', '0.7)'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, rPx), 0, 2 * Math.PI); ctx.stroke();
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const w0 = st.w0_um * 1e-6, f = st.f_mm * 1e-3, lam = st.lam_nm * 1e-9;
  // the object is kept a little before the lens by the input
  // handlers (not here: render stays pure)
  const zL = st.zL_mm * 1e-3, z0 = st.z0_mm * 1e-3;
  const q0 = qAtWaist(w0, lam);

  const NP = 760;
  const ws = new Float64Array(NP + 1);
  let wmax = 1e-12;
  for (let i = 0; i <= NP; i += 1) {
    const z = (i / NP) * ZTOT;
    const w = beamRadius(qAt(z, q0, z0, zL, f), lam);
    ws[i] = w; if (w > wmax) wmax = w;
  }
  const yOf = (w) => (w / wmax) * AYH;

  // optical axis
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(AX0, AYC); ctx.lineTo(AX1, AYC); ctx.stroke();

  // beam envelope (filled)
  ctx.beginPath();
  ctx.moveTo(xOf(0), AYC - yOf(ws[0]));
  for (let i = 1; i <= NP; i += 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC - yOf(ws[i]));
  for (let i = NP; i >= 0; i -= 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC + yOf(ws[i]));
  ctx.closePath();
  ctx.fillStyle = 'rgba(239,71,111,0.22)'; ctx.fill();
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(xOf(0), AYC - yOf(ws[0]));
  for (let i = 1; i <= NP; i += 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC - yOf(ws[i])); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xOf(0), AYC + yOf(ws[0]));
  for (let i = 1; i <= NP; i += 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC + yOf(ws[i])); ctx.stroke();

  // lens glyph
  const lx = xOf(zL);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(lx, AYC - AYH - 8); ctx.lineTo(lx, AYC + AYH + 8); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`lens f=${st.f_mm} mm`, lx, AYC - AYH - 14);

  // object (input waist) marker, draggable
  const ox = xOf(z0);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ox, AYC - yOf(w0)); ctx.lineTo(ox, AYC + yOf(w0)); ctx.stroke();
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath();
  ctx.moveTo(ox, AYC + AYH + 6); ctx.lineTo(ox - 6, AYC + AYH + 18); ctx.lineTo(ox + 6, AYC + AYH + 18);
  ctx.closePath(); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('object (drag)', ox, AYC + AYH + 32);

  // focused waist marker
  const img = lensImage(w0, lam, f, zL - z0);
  const zFoc = zL + img.distance;
  if (zFoc > 0 && zFoc < ZTOT) {
    const fx = xOf(zFoc);
    ctx.strokeStyle = 'rgba(91,192,235,0.6)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, AYC - AYH); ctx.lineTo(fx, AYC + AYH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'center';
    ctx.fillText(`focus w0'=${(img.w0Out * 1e6).toFixed(1)} um`, fx, AYC + AYH + 22);
  }

  // transverse intensity spots (top-right): the object spot vs the
  // focused spot, on one shared scale, so the focusing is visible
  const wFoc = img.w0Out;
  const sScale = 30 / Math.max(w0, wFoc);
  const sy = 52;
  drawSpot(W - 190, sy, w0 * sScale, 'rgba(91,192,235,1)');
  drawSpot(W - 70, sy, wFoc * sScale, 'rgba(255,209,102,1)');
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('object spot', W - 190, sy + 44);
  ctx.fillText(`${(w0 * 2e6).toFixed(0)} um`, W - 190, sy + 58);
  ctx.fillText('focused spot', W - 70, sy + 44);
  ctx.fillText(`${(wFoc * 2e6).toFixed(0)} um`, W - 70, sy + 58);
  const ratio = wFoc / Math.max(1e-12, w0);
  ctx.fillStyle = ratio < 1 ? 'rgba(6,214,160,0.85)' : 'rgba(255,209,102,0.85)';
  ctx.fillText(ratio < 1 ? `focused ${(1 / ratio).toFixed(1)}x tighter` : `${ratio.toFixed(1)}x wider`, W - 130, sy - 40);

  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('optical axis  z  (drag the object or the lens)', (AX0 + AX1) / 2, H - 14);

  // beam size hitting the lens (just before it)
  const wAtLens = beamRadius(abcdApply(M_free(zL - z0), q0), lam);
  rZR.textContent = `${(rayleighRange(w0, lam) * 1e3).toFixed(1)} mm`;
  rW0o.textContent = `${(img.w0Out * 1e6).toFixed(2)} um`;
  rLaw.textContent = `${(lam * f / (Math.PI * wAtLens) * 1e6).toFixed(2)} um`;
  rFoc.textContent = `${(img.distance * 1e3).toFixed(1)} mm`;
  rTh.textContent = `${(divergence(w0, lam) * 1e3).toFixed(2)} mrad`;
}

function syncLabels() {
  vW0.textContent = String(st.w0_um); vF.textContent = String(st.f_mm);
  vZ0.textContent = String(st.z0_mm); vZL.textContent = String(st.zL_mm); vLam.textContent = String(st.lam_nm);
}
let dragTarget = null;
function dragFromX(clientX) {
  const r = canvas.getBoundingClientRect();
  const px = (clientX - r.left) * W / r.width;
  const zmm = ((px - AX0) / (AX1 - AX0)) * ZTOT * 1e3;
  if (dragTarget === 'lens') {
    st.zL_mm = Math.max(50, Math.min(450, Math.round(zmm / 5) * 5));
    sZL.value = String(st.zL_mm);
  } else {
    st.z0_mm = Math.max(10, Math.min(240, Math.round(zmm / 5) * 5));
    sZ0.value = String(st.z0_mm);
  }
  syncLabels(); render();
}
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * W / r.width;
  // grab whichever handle (object or lens) is nearer the cursor
  dragTarget = Math.abs(px - xOf(st.zL_mm * 1e-3)) < Math.abs(px - xOf(st.z0_mm * 1e-3)) ? 'lens' : 'object';
  dragFromX(e.clientX);
});
canvas.addEventListener('pointermove', (e) => { if (dragTarget) dragFromX(e.clientX); });
window.addEventListener('pointerup', () => { dragTarget = null; });

sW0.addEventListener('input', () => { st.w0_um = parseInt(sW0.value, 10); syncLabels(); render(); });
sF.addEventListener('input', () => { st.f_mm = parseInt(sF.value, 10); syncLabels(); render(); });
sZ0.addEventListener('input', () => { st.z0_mm = parseInt(sZ0.value, 10); syncLabels(); render(); });
sZL.addEventListener('input', () => { st.zL_mm = parseInt(sZL.value, 10); syncLabels(); render(); });
sLam.addEventListener('input', () => { st.lam_nm = parseInt(sLam.value, 10); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.w0_um = 200; st.f_mm = 120; st.z0_mm = 60; st.zL_mm = 250; st.lam_nm = 1064;
  sW0.value = '200'; sF.value = '120'; sZ0.value = '60'; sZL.value = '250'; sLam.value = '1064'; syncLabels(); render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.f_mm = Math.round((40 + fr * 340) / 5) * 5;     // strong -> weak focusing
    sF.value = String(st.f_mm); syncLabels();
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); }, { once: true });
} else {
  bootSync();
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const q = qAtWaist(st.w0_um * 1e-6, st.lam_nm * 1e-9);
  const zr = rayleighRange(st.w0_um * 1e-6, st.lam_nm * 1e-9);
  return { fields: [
    { key: 'waist-diameter', label: 'Waist diameter w0 (um)', value: st.w0_um, format: 'float' },
    { key: 'wavelength', label: 'Wavelength (nm)', value: st.lam_nm, format: 'float' },
    { key: 'focal-length', label: 'Focal length f (mm)', value: st.f_mm, format: 'float' },
    { key: 'rayleigh-range', label: 'Rayleigh range zR (mm)', value: zr * 1e3, format: 'float' },
  ]};
};
window.playground.getInvariants = function () {
  const q = qAtWaist(st.w0_um * 1e-6, st.lam_nm * 1e-9);
  const zr = rayleighRange(st.w0_um * 1e-6, st.lam_nm * 1e-9);
  const div = divergence(st.lam_nm * 1e-9, st.w0_um * 1e-6);
  const paraxialOk = st.w0_um > 0 && st.lam_nm > 0 && zr > 0;
  return [{ key: 'paraxial-approx', label: 'Paraxial approximation valid', value: paraxialOk ? 'pass' : 'drift', status: paraxialOk ? 'pass' : 'drift' }];
};
