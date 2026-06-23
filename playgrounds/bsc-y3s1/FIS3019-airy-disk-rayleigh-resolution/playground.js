// Airy disks and the Rayleigh resolution criterion. A physical double
// star of fixed angular separation is imaged through a circular aperture.
// The Rayleigh angle theta_R = 1.22 lambda / D shrinks as the aperture
// grows, so the normalised separation s = delta_theta / theta_R rises and
// the merged blob splits into two stars. Top panel: the combined Airy
// image (two incoherent patterns added). Bottom panel: the intensity cut
// along the separation axis, with the central dip and the Rayleigh
// threshold. The aperture auto-sweeps (a growing telescope); every control
// pauses it.
// Reference: Hecht, Optics (2017), Sec. 10.2.5.

import {
  airyAtRayleigh, axialIntensity, dipRatio, verdict, rayleighAngle,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const ARCSEC = 206265;                                  // radians -> arcsec

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sSep = document.getElementById('slider-sep'), vSep = document.getElementById('value-sep');
const sD = document.getElementById('slider-D'), vD = document.getElementById('value-D');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { sepAS: 0.10, D: 0.6, lamNm: 550 };        // arcsec, metres, nm
const st = { ...DEF };
let running = !prefersReducedMotion();
const D_LO = 0.15, D_HI = 3.0;

const W = canvas.width, H = canvas.height;
const IMG = 540, IMGX = (W - IMG) / 2, IMGY = 96;       // display square
const IMGRES = 300, UWIN = 3.2;                         // internal res, half-window (Rayleigh units)
const DIAG = { x0: 74, x1: W - 28, yt: 712, yb: 986 };

// offscreen image buffer
const off = document.createElement('canvas'); off.width = IMGRES; off.height = IMGRES;
const offCtx = off.getContext('2d');
const imageData = offCtx.createImageData(IMGRES, IMGRES);

// radial Airy LUT in Rayleigh units (shape is fixed; only the source
// centres move), so the per-frame image is two cheap table lookups/pixel.
const LUT_N = 700, LUT_RMAX = 5.2;
const LUT = new Float32Array(LUT_N + 1);
for (let i = 0; i <= LUT_N; i += 1) LUT[i] = airyAtRayleigh((LUT_RMAX * i) / LUT_N);
function lut(r) {
  if (r >= LUT_RMAX) return 0;
  const x = (r / LUT_RMAX) * LUT_N, i = x | 0, f = x - i;
  return LUT[i] + (LUT[i + 1] - LUT[i]) * f;
}

// explicit sequential "hot" map (black -> red -> orange -> yellow -> white)
function hot(t) {
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const r = Math.min(1, t * 3), g = Math.min(1, Math.max(0, t * 3 - 1)), b = Math.min(1, Math.max(0, t * 3 - 2));
  return { r: (r * 255) | 0, g: (g * 255) | 0, b: (b * 255) | 0 };
}

function sepRayleigh() {
  const thetaR = rayleighAngle(st.lamNm * 1e-9, st.D);  // radians
  return (st.sepAS / ARCSEC) / thetaR;
}

function pausePlay() { running = false; btnP.textContent = 'Play'; btnP.setAttribute('aria-pressed', 'true'); }
function resume() { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); }

sSep.addEventListener('input', () => { pausePlay(); st.sepAS = parseFloat(sSep.value); vSep.textContent = `${st.sepAS.toFixed(2)}″`; render(); });
sD.addEventListener('input', () => { pausePlay(); st.D = parseFloat(sD.value); vD.textContent = `${st.D.toFixed(2)} m`; render(); });
sL.addEventListener('input', () => { pausePlay(); st.lamNm = parseFloat(sL.value); vL.textContent = `${st.lamNm.toFixed(0)} nm`; render(); });
btnR.addEventListener('click', () => {
  Object.assign(st, DEF);
  sSep.value = String(st.sepAS); vSep.textContent = `${st.sepAS.toFixed(2)}″`;
  sD.value = String(st.D); vD.textContent = `${st.D.toFixed(2)} m`;
  sL.value = String(st.lamNm); vL.textContent = `${st.lamNm.toFixed(0)} nm`;
  resume(); render();
});
btnP.addEventListener('click', () => { if (running) pausePlay(); else resume(); });

function render() {
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
  const s = sepRayleigh();
  drawHeader(s);
  drawImage(s);
  drawProfile(s);
}

function drawHeader(s) {
  const thetaR = rayleighAngle(st.lamNm * 1e-9, st.D) * ARCSEC;
  const dip = dipRatio(s);
  const vd = verdict(s);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f2f4f8'; ctx.font = fontString(canvas, 'title', 'sans', 600);
  ctx.fillText('Airy disks and the Rayleigh limit', 20, 34);

  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#aeb6c2';
  ctx.fillText(`binary Δθ = ${st.sepAS.toFixed(2)}″   D = ${st.D.toFixed(2)} m   λ = ${st.lamNm.toFixed(0)} nm`, 20, 60);
  ctx.fillStyle = '#9fb6ff';
  ctx.fillText(`θ_R = 1.22 λ/D = ${thetaR.toFixed(3)}″    s = Δθ/θ_R = ${s.toFixed(2)}`, 20, 80);

  const col = vd === 'RESOLVED' ? '#5fe39a' : vd === 'UNRESOLVED' ? '#ff7a7a' : '#ffd166';
  ctx.textAlign = 'right'; ctx.font = fontString(canvas, 'title', 'sans', 600);
  ctx.fillStyle = col; ctx.fillText(vd, W - 24, 34);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#aeb6c2';
  ctx.fillText(`central dip = ${((1 - dip) * 100).toFixed(0)}%`, W - 24, 60);
  ctx.textAlign = 'left';
}

function drawImage(s) {
  // build the combined Airy field into the offscreen buffer
  const d = imageData.data;
  for (let j = 0; j < IMGRES; j += 1) {
    const v = -UWIN + (2 * UWIN) * (j / (IMGRES - 1));
    for (let i = 0; i < IMGRES; i += 1) {
      const u = -UWIN + (2 * UWIN) * (i / (IMGRES - 1));
      const I = lut(Math.hypot(u + s / 2, v)) + lut(Math.hypot(u - s / 2, v));
      const t = Math.pow(Math.min(1, I), 0.45);          // display stretch to reveal the rings
      const c = hot(t);
      const k = (j * IMGRES + i) * 4;
      d[k] = c.r; d[k + 1] = c.g; d[k + 2] = c.b; d[k + 3] = 255;
    }
  }
  offCtx.putImageData(imageData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, IMGX, IMGY, IMG, IMG);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(IMGX + 0.5, IMGY + 0.5, IMG, IMG);

  // source-centre markers
  const uToPx = (u) => IMGX + ((u + UWIN) / (2 * UWIN)) * IMG;
  const cy = IMGY + IMG / 2;
  [-s / 2, s / 2].forEach((uc) => {
    const x = uToPx(uc);
    ctx.strokeStyle = 'rgba(160,200,255,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, cy - 9); ctx.lineTo(x, cy + 9); ctx.moveTo(x - 9, cy); ctx.lineTo(x + 9, cy); ctx.stroke();
  });

  // scale bar = 1 Rayleigh angle
  const barPx = (1 / (2 * UWIN)) * IMG;
  const bx = IMGX + 18, by = IMGY + IMG - 22;
  ctx.strokeStyle = '#e6e8ec'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + barPx, by); ctx.stroke();
  ctx.fillStyle = '#e6e8ec'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('θ_R', bx + barPx + 8, by + 4);

  ctx.fillStyle = '#9aa2ae'; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'center';
  ctx.fillText('combined image of the two stars (Airy intensity, stretched)', W / 2, IMGY + IMG + 24);
}

function drawProfile(s) {
  const { x0, x1, yt, yb } = DIAG;
  ctx.fillStyle = '#080a10'; ctx.fillRect(x0, yt, x1 - x0, yb - yt);
  const yMax = 1.12;
  const uToX = (u) => x0 + ((u + UWIN) / (2 * UWIN)) * (x1 - x0);
  const yOf = (I) => yb - (Math.max(0, Math.min(yMax, I)) / yMax) * (yb - yt);

  // gridlines
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  for (let I = 0; I <= 1.0001; I += 0.25) {
    const yy = yOf(I);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(I.toFixed(2), x0 - 6, yy + 3);
  }
  ctx.textAlign = 'center';
  for (let u = -3; u <= 3; u += 1) {
    const xx = uToX(u);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(xx, yt); ctx.lineTo(xx, yb); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(`${u}`, xx, yb + 18);
  }

  // individual source profiles (faint)
  ctx.strokeStyle = 'rgba(120,170,255,0.45)'; ctx.lineWidth = 1;
  for (const sign of [-1, 1]) {
    ctx.beginPath(); let started = false;
    for (let u = -UWIN; u <= UWIN; u += 0.02) {
      const I = airyAtRayleigh(Math.abs(u - sign * s / 2));
      const X = uToX(u), Y = yOf(I); started ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); started = true;
    }
    ctx.stroke();
  }
  // combined profile
  ctx.strokeStyle = '#ffae3b'; ctx.lineWidth = 2.4; ctx.beginPath();
  let started = false;
  for (let u = -UWIN; u <= UWIN; u += 0.01) {
    const I = axialIntensity(u, s);
    const X = uToX(u), Y = yOf(I); started ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); started = true;
  }
  ctx.stroke();

  // central dip marker
  const mid = axialIntensity(0, s);
  ctx.fillStyle = '#ff7a7a'; ctx.beginPath(); ctx.arc(uToX(0), yOf(mid), 4.5, 0, 2 * Math.PI); ctx.fill();
  // Rayleigh dip reference line (0.735 of peak for an equal pair)
  const yR = yOf(0.735);
  ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, yR); ctx.lineTo(x1, yR); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.textAlign = 'left'; ctx.fillText('Rayleigh dip (0.735)', x0 + 8, yR - 5);

  // labels
  ctx.fillStyle = '#9aa2ae'; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'center';
  ctx.fillText('position along the separation axis  (units of θ_R)', (x0 + x1) / 2, yb + 38);
  ctx.save(); ctx.translate(20, (yt + yb) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('relative intensity', 0, 0); ctx.restore();
  ctx.fillStyle = '#e6e8ec'; ctx.font = fontString(canvas, 'body', 'sans', 500); ctx.textAlign = 'left';
  ctx.fillText('Intensity cut through both stars', x0, yt - 12);
}

// ---- animation: grow the aperture (telescope) so the pair resolves ----
let rafOn = false, dir = 1, last = (typeof performance !== 'undefined' ? performance.now() : 0);
function tick(now) {
  if (running) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    st.D += dir * dt * ((D_HI - D_LO) / 8);
    if (st.D >= D_HI) { st.D = D_HI; dir = -1; } else if (st.D <= D_LO) { st.D = D_LO; dir = 1; }
    sD.value = String(st.D); vD.textContent = `${st.D.toFixed(2)} m`;
  }
  last = now;
  render();
  if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false;
}
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = (typeof performance !== 'undefined' ? performance.now() : 0); requestAnimationFrame(tick); } }

function boot() {
  vSep.textContent = `${st.sepAS.toFixed(2)}″`; vD.textContent = `${st.D.toFixed(2)} m`; vL.textContent = `${st.lamNm.toFixed(0)} nm`;
  sSep.value = String(st.sepAS); sD.value = String(st.D); sL.value = String(st.lamNm);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { boot(); startLoop(); }, { once: true }); } else { boot(); startLoop(); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = sepRayleigh();
  const thetaR = rayleighAngle(st.lamNm * 1e-9, st.D) * ARCSEC;
  return { fields: [
    { key: 'sep-as', label: 'binary $\\Delta\\theta$ (arcsec)', value: st.sepAS, format: 'float' },
    { key: 'aperture', label: 'aperture $D$ (m)', value: st.D, format: 'float' },
    { key: 'lambda', label: 'wavelength $\\lambda$ (nm)', value: st.lamNm, format: 'float' },
    { key: 'theta-r', label: 'Rayleigh angle $\\theta_R$ (arcsec)', value: thetaR, format: 'float' },
    { key: 's-ratio', label: '$s=\\Delta\\theta/\\theta_R$', value: s, format: 'float' },
    { key: 'dip', label: 'central dip (%)', value: (1 - dipRatio(s)) * 100, format: 'float' },
    { key: 'verdict', label: 'status', value: verdict(s), format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const s = sepRayleigh();
  const dip = dipRatio(s);
  // the central saddle can never exceed the peak intensity.
  const saddleOk = dip <= 1 + 1e-9;
  // at the Rayleigh separation the equal-pair saddle is ~0.735 of the peak.
  const atRay = Math.abs(s - 1) < 0.02 ? dip : null;
  return [
    { key: 'saddle-le-peak', label: 'central saddle $\\le$ peak', value: dip.toFixed(3), status: saddleOk ? 'pass' : 'drift' },
    { key: 'rayleigh-dip', label: 'saddle $\\approx 0.735$ at $s=1$', value: atRay === null ? 'sweep to s=1' : atRay.toFixed(3), status: atRay === null ? 'pass' : (Math.abs(atRay - 0.735) < 0.02 ? 'pass' : 'drift') },
  ];
};
