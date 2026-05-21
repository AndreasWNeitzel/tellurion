// Aperture photometry on a synthetic star, with the trade-off the
// spec promises actually shown. The old version was a frozen still
// (the frame only changed when a slider moved) with a hand-rolled
// amber ramp and no growth curve. Here the CCD frame shimmers with a
// fresh photon-noise realisation a few times a second (successive
// exposures), rendered through the shared viridis map with an asinh
// stretch so the Moffat wings and sky are visible like a real frame.
// A demoted strip traces the smooth growth curve F(r_ap) and the CCD
// signal-to-noise SNR(r_ap) from the noiseless model and marks the
// SNR-optimal aperture (the "couple of seeing radii" sweet spot from
// Howell), while your live measurement on the noisy frame scatters
// around it. sim.js (moffat / generateImage / aperturePhot) is
// unchanged. Reference: Howell, Handbook of CCD Astronomy; Carroll
// and Ostlie, Sec. 1.3.
import { generateImage, aperturePhot, moffat } from './sim.js';
import { viridis, fieldToImageData } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rF = document.getElementById('readout-f');
const ids = ['a', 's', 'w', 'F', 'sk'];
const sliders = ids.map((k) => ({ k, s: document.getElementById('slider-' + k), v: document.getElementById('value-' + k) }));
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const N = 64, CXP = 32, CYP = 32, RN = 1;     // grid, star centre, read noise
const st = { a: 6, s: 14, w: 2.5, F: 8000, sk: 100, seed: 0xC0FFEE };
let running = true, frame = 0, img, model;

const off = document.createElement('canvas'); off.width = N; off.height = N;
const offCtx = off.getContext('2d');
let idata = null;

// Noiseless expected image (same model generateImage samples from):
// gives a smooth growth curve and a stable SNR-optimal aperture.
function buildModel() {
  const sigma = st.w / (2 * Math.sqrt(Math.pow(2, 1 / 3) - 1));
  let totalPSF = 0;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) totalPSF += moffat(Math.hypot(x - CXP, y - CYP), sigma);
  model = new Float64Array(N * N);
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    model[y * N + x] = st.sk + st.F * moffat(Math.hypot(x - CXP, y - CYP), sigma) / totalPSF;
  }
}
function refresh() { img = generateImage(N, CXP, CYP, st.F, st.w, st.sk, 1, RN, st.seed); buildModel(); }
refresh();

sliders.forEach(({ k, s, v }) => s.addEventListener('input', () => {
  st[k] = parseFloat(s.value);
  v.textContent = (k === 'F' || k === 'sk') ? st[k].toFixed(0) : st[k].toFixed(1);
  refresh();
}));
btnR.addEventListener('click', () => { st.seed = (Math.imul(st.seed, 1664525) + 1013904223) >>> 0; refresh(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// CCD signal-to-noise for an aperture of n_ap pixels (Howell CCD eqn,
// gain = 1): the sky term grows with the aperture, the star term
// saturates, so SNR peaks at an intermediate radius.
function snrOf(flux, sky, nAp) {
  return flux / Math.sqrt(Math.max(1e-6, flux + nAp * (sky + RN * RN)));
}
function apPixels(rIn) {
  let n = 0;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    if (Math.hypot(x - CXP, y - CYP) < rIn) n += 1;
  }
  return n;
}
// The sky ring must sit outside the aperture, else aperturePhot finds
// no annulus pixels and the background is 0/0 = NaN. Push it out with
// the aperture when the user widens past the slider value.
function skyRing(rap) {
  const inR = Math.max(st.s, rap + 2);
  return [inR, inR + 4];
}

function paintFrame() {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < img.length; i += 1) { const v = img[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
  const q = Math.max(1e-3, (hi - lo) / 28);
  const str = new Float64Array(img.length);
  for (let i = 0; i < img.length; i += 1) str[i] = Math.asinh((img[i] - lo) / q);
  let smin = Infinity, smax = -Infinity;
  for (let i = 0; i < str.length; i += 1) { if (str[i] < smin) smin = str[i]; if (str[i] > smax) smax = str[i]; }
  idata = fieldToImageData(str, N, N, smin, smax, viridis, idata);
  offCtx.putImageData(idata, 0, 0);
}

function render() {
  if (!CAPTURE_NAME && running) {
    frame += 1;
    if (frame % 14 === 0) { st.seed = (Math.imul(st.seed, 1664525) + 1013904223) >>> 0; img = generateImage(N, CXP, CYP, st.F, st.w, st.sk, 1, RN, st.seed); }
  }
  paintFrame();

  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('Sum the light in a circle, subtract the sky: pick the radius well', 18, 24);

  const IMG = 318, x0 = 20, y0 = 40;
  const p2i = IMG / N;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, N, N, x0, y0, IMG, IMG);
  ctx.strokeStyle = 'rgba(226,232,240,0.22)'; ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, IMG - 1, IMG - 1);
  const cx = x0 + (CXP + 0.5) * p2i, cy = y0 + (CYP + 0.5) * p2i;
  const [skyIn, rOut] = skyRing(st.a);
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, st.a * p2i, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, skyIn * p2i, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, rOut * p2i, 0, 6.2832); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('synthetic CCD frame (photon + read noise; new exposure ~3/s)', x0, y0 + IMG + 15);

  // your measurement on the current noisy frame
  const r = aperturePhot(img, N, CXP, CYP, st.a, st.a, skyIn, rOut);
  const nAp = apPixels(st.a);
  const snr = snrOf(r.flux, r.sky, nAp);
  const errPct = (r.flux - st.F) / st.F * 100;

  const rx = x0 + IMG + 24;
  ctx.font = '13px ui-monospace, monospace';
  let yy = y0 + 14;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`F_true  = ${st.F.toFixed(0)}`, rx, yy); yy += 20;
  ctx.fillText(`F_meas  = ${r.flux.toFixed(0)}`, rx, yy); yy += 20;
  ctx.fillText(`sky/pix = ${r.sky.toFixed(1)}  (true ${st.sk})`, rx, yy); yy += 20;
  ctx.fillStyle = Math.abs(errPct) < 3 ? '#34d399' : '#f87272';
  ctx.fillText(`error   = ${errPct >= 0 ? '+' : ''}${errPct.toFixed(1)} %`, rx, yy); yy += 20;
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`SNR     = ${snr.toFixed(1)}`, rx, yy); yy += 20;
  ctx.fillStyle = '#64748b'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`n_ap    = ${nAp} px`, rx, yy); yy += 24;
  ctx.font = '11px ui-monospace, monospace';
  for (const line of ['Too small loses the', 'Moffat wings; too', 'large piles in sky', 'noise. SNR peaks', 'between them. The', 'frame reshuffles to', 'show photon scatter.']) { ctx.fillText(line, rx, yy); yy += 14; }

  // demoted diagnostic: smooth growth curve F(r) and SNR(r) from the
  // noiseless model, the stable SNR-optimal aperture, and your r
  const dx0 = x0, dx1 = W - 20, dy0 = H - 118, dy1 = H - 14;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('growth curve: F (yellow, plateaus at F_true) and SNR (cyan, peaks) vs aperture radius r', dx0 + 8, dy0 + 13);
  const rLo = 2, rHi = 22, NSR = 90;
  const Fv = new Float64Array(NSR), Sv = new Float64Array(NSR);
  let sMax = 1e-9, rStar = rLo;
  for (let i = 0; i < NSR; i += 1) {
    const rad = rLo + (rHi - rLo) * i / (NSR - 1);
    const [si, so] = skyRing(rad);
    const mm = aperturePhot(model, N, CXP, CYP, rad, rad, si, so);
    Fv[i] = mm.flux; Sv[i] = snrOf(mm.flux, st.sk, apPixels(rad));
    if (Sv[i] > sMax) { sMax = Sv[i]; rStar = rad; }
  }
  const xP = (rad) => dx0 + 12 + (rad - rLo) / (rHi - rLo) * (dx1 - dx0 - 24);
  const yF = (f) => dy1 - 8 - Math.max(0, f) / (st.F * 1.12) * (dy1 - dy0 - 30);
  const yS = (s) => dy1 - 8 - Math.max(0, s) / (sMax * 1.12) * (dy1 - dy0 - 30);
  ctx.strokeStyle = 'rgba(255,209,102,0.4)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xP(rLo), yF(st.F)); ctx.lineTo(xP(rHi), yF(st.F)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,209,102,0.7)'; ctx.fillText('F_true', xP(rHi) - 38, yF(st.F) - 4);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i < NSR; i += 1) { const rad = rLo + (rHi - rLo) * i / (NSR - 1); const p = { x: xP(rad), y: yF(Fv[i]) }; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i < NSR; i += 1) { const rad = rLo + (rHi - rLo) * i / (NSR - 1); const p = { x: xP(rad), y: yS(Sv[i]) }; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(52,211,153,0.8)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xP(rStar), dy0 + 18); ctx.lineTo(xP(rStar), dy1 - 4); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#34d399'; ctx.fillText(`SNR-optimal r ~ ${rStar.toFixed(1)} px`, xP(rStar) + 6, dy0 + 26);
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(xP(st.a), dy0 + 18); ctx.lineTo(xP(st.a), dy1 - 4); ctx.stroke();
  ctx.fillStyle = '#e2e8f0'; ctx.fillText('your r', xP(st.a) + 5, dy1 - 8);

  rF.textContent = r.flux.toFixed(0);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.a = 2.5 + frac * 13;                     // sweep the aperture for the goldens
    sliders[0].s.value = st.a.toFixed(1); sliders[0].v.textContent = st.a.toFixed(1);
    refresh();
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
