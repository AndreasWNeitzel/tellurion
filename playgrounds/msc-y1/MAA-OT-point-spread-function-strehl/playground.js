// Airy PSF and Strehl ratio, reworked so every control does
// something. The old version mapped the angular scale as
// firstNull(lambda,D)/80 px, which normalised lambda and D straight
// out of the picture: those two sliders changed only a number, never
// the image (the user's "two sliders do nothing"). Here the sky
// field of view is FIXED, so the Airy disk physically shrinks with a
// bigger aperture or shorter wavelength. Two stars sit at a fixed
// angular separation: dial D / lambda and watch them resolve or
// merge (the Rayleigh limit, made concrete); dial the RMS wavefront
// error and watch the cores drain into a boiling speckle halo while
// the Strehl ratio tracks the Marechal law. sim.js (airyIntensity /
// strehl / firstNullArcsec) is unchanged. Reference: Born and Wolf,
// Principles of Optics, Ch. 8; Mahajan, JOSA 72, 1258 (1982).
import { airyIntensity, strehl, firstNullArcsec } from './sim.js';
import { viridis, fieldToImageData } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sD = document.getElementById('slider-D'), vD = document.getElementById('value-D');
const sSg = document.getElementById('slider-s'), vSg = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { lambda: 650, D: 8, sigma: 0.05, t: 0 };
let running = !prefersReducedMotion();
const FOV = 0.18;                 // fixed half field of view (arcsec)
const SEP = 0.10;                 // fixed binary separation (arcsec)
const ARC2RAD = Math.PI / 180 / 3600;
const GW = 260, GH = 260;
const off = document.createElement('canvas'); off.width = GW; off.height = GH;
const offCtx = off.getContext('2d');
let idata = null;
const field = new Float64Array(GW * GH);

sL.addEventListener('input', () => { st.lambda = parseFloat(sL.value); vL.textContent = st.lambda.toFixed(0); });
sD.addEventListener('input', () => { st.D = parseFloat(sD.value); vD.textContent = st.D.toFixed(1); });
sSg.addEventListener('input', () => { st.sigma = parseFloat(sSg.value); vSg.textContent = st.sigma.toFixed(3); });
btnR.addEventListener('click', () => { st.lambda = 650; st.D = 8; st.sigma = 0.05; sL.value = '650'; vL.textContent = '650'; sD.value = '8'; vD.textContent = '8.0'; sSg.value = '0.05'; vSg.textContent = '0.050'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function srnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
// Organic boiling speckle: smoothed hashed value-noise on a coarse
// lattice, animated by a per-cell drifting phase. Deterministic.
function hash2(ix, iy) { return srnd(ix * 57.31 + iy * 113.7); }
function speckle(ax, ay, phase) {
  const sc = 26;                              // speckle grains across the FOV
  const X = (ax + FOV) / (2 * FOV) * sc, Y = (ay + FOV) / (2 * FOV) * sc;
  const ix = Math.floor(X), iy = Math.floor(Y);
  const fx = X - ix, fy = Y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const cell = (cx, cy) => 0.5 + 0.5 * Math.sin(phase + 6.2832 * hash2(cx, cy));
  const a = cell(ix, iy), b = cell(ix + 1, iy), c = cell(ix, iy + 1), d = cell(ix + 1, iy + 1);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

// Two stars on the sky at +/- SEP/2 in x; each is an Airy PSF for
// the current lambda, D. Aberration: Strehl-scaled core plus a broad
// boiling speckle halo carrying the (1-S) scattered energy.
function buildField(phase) {
  const S = strehl(st.sigma);
  const sx = SEP / 2;
  let mx = 1e-9;
  for (let gy = 0; gy < GH; gy += 1) {
    const ay = (gy / (GH - 1) - 0.5) * 2 * FOV;
    for (let gx = 0; gx < GW; gx += 1) {
      const ax = (gx / (GW - 1) - 0.5) * 2 * FOV;
      const t1 = Math.hypot(ax + sx, ay) * ARC2RAD;
      const t2 = Math.hypot(ax - sx, ay) * ARC2RAD;
      const core = airyIntensity(t1, st.lambda, st.D) + airyIntensity(t2, st.lambda, st.D);
      // halo: a few-resel-wide blur per source + animated speckle
      const hw = 0.045 + 0.5 * st.sigma;
      const halo = Math.exp(-((ax + sx) ** 2 + ay * ay) / (2 * hw * hw))
                 + Math.exp(-((ax - sx) ** 2 + ay * ay) / (2 * hw * hw));
      const spk = 0.35 + 1.5 * speckle(ax, ay, phase);
      const v = S * core + (1 - S) * 0.3 * halo * spk;
      field[gy * GW + gx] = v;
      if (v > mx) mx = v;
    }
  }
  // asinh stretch -> viridis
  const q = mx / 26;
  const str = new Float64Array(field.length);
  let smin = Infinity, smax = -Infinity;
  for (let i = 0; i < field.length; i += 1) { const s = Math.asinh(field[i] / q); str[i] = s; if (s < smin) smin = s; if (s > smax) smax = s; }
  idata = fieldToImageData(str, GW, GH, smin, smax, viridis, idata);
  offCtx.putImageData(idata, 0, 0);
  return S;
}

function render() {
  if (!CAPTURE_NAME && running) st.t += 0.04;
  const S = buildField(st.t);
  const fn = firstNullArcsec(st.lambda, st.D);
  const resolved = fn <= SEP / 1.0 && S > 0.35;     // Rayleigh: sources resolved if first null <= separation

  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('Two stars through one telescope: resolve them, or lose them', 18, 24);

  // the sky image (fixed FOV; PSF size is physical)
  const IMG = 332, x0 = 22, y0 = 42;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, GW, GH, x0, y0, IMG, IMG);
  ctx.strokeStyle = 'rgba(226,232,240,0.22)'; ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, IMG - 1, IMG - 1);
  // scale bar = the first-null (Rayleigh) angle
  const barPx = Math.min(IMG - 20, fn / (2 * FOV) * IMG);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0 + 12, y0 + IMG - 14); ctx.lineTo(x0 + 12 + Math.max(2, barPx), y0 + IMG - 14); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`1.22 lambda/D = ${fn.toFixed(3)}"`, x0 + 12, y0 + IMG - 20);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`FOV ${(2 * FOV).toFixed(2)}"   sep ${SEP.toFixed(2)}"`, x0 + 8, y0 + IMG + 16);

  // right column: readouts + verdict
  const rx = x0 + IMG + 26;
  ctx.font = fontString(canvas, 'body', 'mono');
  let yy = y0 + 16;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`lambda = ${st.lambda} nm`, rx, yy); yy += 20;
  ctx.fillText(`D      = ${st.D.toFixed(1)} m`, rx, yy); yy += 20;
  ctx.fillText(`1.22 l/D = ${fn.toFixed(3)} arcsec`, rx, yy); yy += 20;
  ctx.fillText(`sigma  = ${st.sigma.toFixed(3)} lambda`, rx, yy); yy += 20;
  ctx.fillStyle = S > 0.8 ? '#34d399' : (S > 0.4 ? '#ffd166' : '#f87272');
  ctx.fillText(`Strehl S = ${S.toFixed(3)}${S > 0.8 ? '  (diffraction-limited)' : ''}`, rx, yy); yy += 26;
  ctx.fillStyle = resolved ? '#34d399' : '#f87272';
  ctx.font = fontString(canvas, 'body', 'mono', 600);
  ctx.fillText(resolved ? 'PAIR RESOLVED' : 'PAIR NOT RESOLVED', rx, yy); yy += 22;
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (const ln of ['Bigger D or shorter', 'lambda shrinks the', 'Airy disk: the pair', 'splits. Wavefront', 'error drains the core', 'into the speckle halo', 'and S collapses.']) { ctx.fillText(ln, rx, yy); yy += 14; }

  // demoted diagnostic: log radial cut through both stars
  const dx0 = x0, dx1 = W - 22, dy0 = H - 96, dy1 = H - 12;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('diagnostic: log I along the line through the two stars (dashed = star positions)', dx0 + 8, dy0 + 12);
  const xP = (ax) => dx0 + 12 + (ax + FOV) / (2 * FOV) * (dx1 - dx0 - 24);
  const yP = (logI) => dy1 - 6 - (logI + 5) / 5 * (dy1 - dy0 - 24);
  for (const sgn of [-1, 1]) {
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xP(sgn * SEP / 2), dy0 + 16); ctx.lineTo(xP(sgn * SEP / 2), dy1 - 4); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.7; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const ax = (i / 300 - 0.5) * 2 * FOV;
    const t1 = Math.abs(ax + SEP / 2) * ARC2RAD, t2 = Math.abs(ax - SEP / 2) * ARC2RAD;
    const I = S * (airyIntensity(t1, st.lambda, st.D) + airyIntensity(t2, st.lambda, st.D)) + (1 - S) * 0.02;
    const p = { x: xP(ax), y: yP(Math.log10(I + 1e-5)) };
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  rS.textContent = S.toFixed(3);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.sigma = 0.0 + f * 0.34;                 // sweep aberration: clean -> washed out
    sSg.value = st.sigma.toFixed(3); vSg.textContent = st.sigma.toFixed(3);
    st.t = f * 5;
  }
  render();
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
