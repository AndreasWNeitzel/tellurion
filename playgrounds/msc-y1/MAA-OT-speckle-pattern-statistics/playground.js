// Atmospheric speckle. A short-exposure image of an unresolved star
// boils in real time (each turbulence mode's phase advances), the
// long-exposure accumulator smooths it into the seeing disk, and the
// intensity histogram converges onto the negative-exponential law
// p(I) = exp(-I/Ibar)/Ibar with speckle contrast V = sigma/mean -> 1.
// sim.js (speckleField, expectedSpeckleCount) is unchanged; boilField
// and negExpPdf are the added, gate-tested helpers. Reference:
// Goodman, Speckle Phenomena in Optics; Roddier, Adaptive Optics.
import { boilField, expectedSpeckleCount, negExpPdf } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rN = document.getElementById('readout-n');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const NP = 60, SCALE = 3, IMG = NP * SCALE;          // 180 px panels
const st = { Dr0: 6, seed: 0xC0FFEE, t: 0 };
let running = true;
let longSum = new Float64Array(NP * NP), longN = 0;

function modes() { return Math.min(90, Math.max(1, Math.round(st.Dr0 * st.Dr0))); }
function resetAccum() { longSum = new Float64Array(NP * NP); longN = 0; }

sD.addEventListener('input', () => { st.Dr0 = parseFloat(sD.value); vD.textContent = st.Dr0.toFixed(1); resetAccum(); });
btnR.addEventListener('click', () => { st.seed = (st.seed * 31 + 7) >>> 0; st.t = 0; resetAccum(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const off = document.createElement('canvas'); off.width = IMG; off.height = IMG;
const offc = off.getContext('2d');
const idShort = offc.createImageData(IMG, IMG);
const idLong = offc.createImageData(IMG, IMG);

function blit(I, target, x0, y0, gamma) {
  let mx = 1e-9; for (let i = 0; i < I.length; i += 1) if (I[i] > mx) mx = I[i];
  for (let py = 0; py < IMG; py += 1) {
    const iy = (py / SCALE) | 0;
    for (let px = 0; px < IMG; px += 1) {
      const v = Math.pow(I[iy * NP + ((px / SCALE) | 0)] / mx, gamma);
      const a = Math.max(0, Math.min(255, (v * 255) | 0));
      const k = (py * IMG + px) * 4;
      target.data[k] = a; target.data[k + 1] = (a * 0.92) | 0; target.data[k + 2] = (a * 0.7) | 0; target.data[k + 3] = 255;
    }
  }
  offc.putImageData(target, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, x0, y0, IMG, IMG);
}

function render() {
  if (!CAPTURE_NAME && running) st.t += 0.05;
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('A star through turbulence does not make a dot, it boils into speckles', 18, 26);

  const Deff = Math.sqrt(modes());
  const I = boilField(NP, Deff, 3, st.t, st.seed);
  for (let i = 0; i < I.length; i += 1) longSum[i] += I[i];
  longN += 1;

  const gy0 = 56, gx0 = 40, lxR = W - 40 - IMG;
  blit(I, idShort, gx0, gy0, 0.35);
  const longAvg = new Float64Array(NP * NP);
  for (let i = 0; i < longAvg.length; i += 1) longAvg[i] = longSum[i] / Math.max(1, longN);
  blit(longAvg, idLong, lxR, gy0, 0.5);
  ctx.fillStyle = '#64748b'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('short exposure (boiling speckle)', gx0, gy0 + IMG + 18);
  ctx.fillText(`long exposure (seeing disk, ${longN} frames)`, lxR, gy0 + IMG + 18);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`D / r0 = ${st.Dr0.toFixed(1)}    speckles ~ ${expectedSpeckleCount(st.Dr0, 1).toFixed(0)}`, gx0, 44);

  // intensity statistics: full-width histogram of I/mean vs exp(-x)
  let mean = 0; for (let i = 0; i < I.length; i += 1) mean += I[i]; mean /= I.length;
  let varr = 0; for (let i = 0; i < I.length; i += 1) varr += (I[i] - mean) ** 2; varr /= I.length;
  const V = mean > 0 ? Math.sqrt(varr) / mean : 0;
  const BINS = 40, HXMAX = 6, hist = new Float64Array(BINS);
  for (let i = 0; i < I.length; i += 1) { const b = ((I[i] / (mean + 1e-12)) / HXMAX * BINS) | 0; if (b >= 0 && b < BINS) hist[b] += 1; }
  let hmax = 1; for (let b = 0; b < BINS; b += 1) hmax = Math.max(hmax, hist[b]);
  const px0 = gx0, py0 = gy0 + IMG + 30, pw = W - 80, ph = H - py0 - 34;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('intensity statistics: histogram of I/Ibar vs the negative-exponential law exp(-I/Ibar)', px0 + 8, py0 + 15);
  const innerW = pw - 16, baseY = py0 + ph - 14, plotH = ph - 36;
  for (let b = 0; b < BINS; b += 1) {
    const bh = (hist[b] / hmax) * plotH;
    ctx.fillStyle = 'rgba(91,192,235,0.55)';
    ctx.fillRect(px0 + 8 + b * innerW / BINS, baseY - bh, innerW / BINS - 1, bh);
  }
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2; ctx.beginPath();
  for (let s = 0; s <= 120; s += 1) {
    const xx = s / 120 * HXMAX, yv = negExpPdf(xx, 1);
    const Xp = px0 + 8 + (xx / HXMAX) * innerW;
    const Yp = baseY - yv * plotH;
    if (s === 0) ctx.moveTo(Xp, Yp); else ctx.lineTo(Xp, Yp);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'right';
  ctx.fillText(`speckle contrast V = sigma/mean = ${V.toFixed(2)}  (fully developed -> 1)`, px0 + pw - 8, py0 + 15);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#94a3b8'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('short exposure freezes speckles; the long exposure averages them into the seeing disk', 18, H - 16);
  rN.textContent = expectedSpeckleCount(st.Dr0, 1).toFixed(0);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.Dr0 = 2 + frac * 12;                          // sweep D/r0 2..14
    vD.textContent = st.Dr0.toFixed(1); sD.value = String(st.Dr0);
    // deterministic long exposure: average a fixed set of boil times
    resetAccum();
    const Deff = Math.sqrt(modes());
    for (let m = 0; m < 24; m += 1) { const Im = boilField(NP, Deff, 3, m * 0.5, st.seed); for (let i = 0; i < Im.length; i += 1) longSum[i] += Im[i]; longN += 1; }
    st.t = 3.0;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
