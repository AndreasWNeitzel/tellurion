// The CMB power spectrum, shown as the sky it describes. The toy D_l
// is no longer a bare curve: it is used to synthesize the actual
// microwave-background temperature patch, a Gaussian random field
// built as a running sum of frozen acoustic modes. The acoustic-peak
// multipole l_peak sets the dominant hot/cold spot size (l ~ 220 is
// the famous one-degree mottling); the Silk-damping scale l_damp
// smooths the small scales. The modes stream in (the sky sharpens),
// hold, and regrow, so the picture is alive and shows that the CMB
// sky IS a superposition of standing sound waves. The D_l vs l curve
// is demoted to a thin strip. sim.js Dl / firstPeakL are unchanged;
// clFromDl / synthModes / fieldValue are appended. Reference: Liddle,
// An Introduction to Modern Cosmology, Ch. 12; Dodelson, Modern
// Cosmology.
import { Dl, synthModes } from './sim.js';
import { rdbu, fieldToImageData } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rL = document.getElementById('readout-l');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const GRID = 300;                       // synthesis grid (px)
const SKY = 392;                        // displayed sky square (px)
const SX = 22, SY = 46;                 // sky top-left on the canvas
const MTOT = 260;                       // total acoustic modes per realisation
const LSCALE = 90;                      // l -> ripples-across-patch

const st = { lPeak: 220, lDamp: 2000, seed: 0xC0FFEE };
let running = !prefersReducedMotion();

const off = document.createElement('canvas'); off.width = GRID; off.height = GRID;
const offCtx = off.getContext('2d');
let imgData = null;
const field = new Float64Array(GRID * GRID);
let modes = [], built = 0, holdFrames = 0, dirty = true;

function rebuildModes() {
  modes = synthModes(MTOT, st.lPeak, st.lDamp, st.seed);
  field.fill(0); built = 0; holdFrames = 0; dirty = true;
}
sL.addEventListener('input', () => { st.lPeak = parseFloat(sL.value); vL.textContent = st.lPeak.toFixed(0); rebuildModes(); });
sD.addEventListener('input', () => { st.lDamp = parseFloat(sD.value); vD.textContent = st.lDamp.toFixed(0); rebuildModes(); });
btnR.addEventListener('click', () => { st.lPeak = 220; st.lDamp = 2000; sL.value = '220'; vL.textContent = '220'; sD.value = '2000'; vD.textContent = '2000'; st.seed = (Math.imul(st.seed, 31) + 7) >>> 0; rebuildModes(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Add `add` more modes' contribution to every grid cell.
function accumulate(add) {
  const end = Math.min(MTOT, built + add);
  for (let mi = built; mi < end; mi += 1) {
    const md = modes[mi];
    const cyc = (md.l / LSCALE) * 2 * Math.PI;
    const ax = cyc * md.kx, ay = cyc * md.ky, ps = md.psi;
    for (let gy = 0; gy < GRID; gy += 1) {
      const v = gy / (GRID - 1), ayv = ay * v + ps;
      const row = gy * GRID;
      for (let gx = 0; gx < GRID; gx += 1) {
        field[row + gx] += Math.cos(ax * (gx / (GRID - 1)) + ayv);
      }
    }
  }
  built = end; dirty = true;
}

function paintSky() {
  const inv = built > 0 ? 1 / Math.sqrt(built) : 0;
  let mean = 0;
  for (let i = 0; i < field.length; i += 1) mean += field[i];
  mean = (mean / field.length) * inv;
  let varr = 0;
  for (let i = 0; i < field.length; i += 1) { const d = field[i] * inv - mean; varr += d * d; }
  const sd = Math.sqrt(varr / field.length) || 1;
  const lo = mean - 2.7 * sd, hi = mean + 2.7 * sd;
  const norm = new Float64Array(field.length);
  for (let i = 0; i < field.length; i += 1) norm[i] = field[i] * inv;
  imgData = fieldToImageData(norm, GRID, GRID, lo, hi, rdbu, imgData);
  offCtx.putImageData(imgData, 0, 0);
}

function render() {
  if (!CAPTURE_NAME && running) {
    if (built < MTOT) accumulate(5);
    else if (holdFrames < 46) holdFrames += 1;
    else { field.fill(0); built = 0; holdFrames = 0; dirty = true; }
  }
  if (dirty) { paintSky(); dirty = false; }

  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('The CMB sky is a sum of frozen acoustic standing waves', 18, 26);

  // the synthesized microwave-background patch
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, GRID, GRID, SX, SY, SKY, SKY);
  ctx.strokeStyle = 'rgba(226,232,240,0.22)'; ctx.lineWidth = 1;
  ctx.strokeRect(SX + 0.5, SY + 0.5, SKY - 1, SKY - 1);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('synthetic CMB temperature patch (flat-sky)', SX + 6, SY + SKY + 18);

  // right column: colour key + readouts
  const rx = SX + SKY + 26;
  ctx.fillStyle = '#e2e8f0'; ctx.font = '13px sans-serif';
  ctx.fillText('hotter / colder than the', rx, SY + 16);
  ctx.fillText('2.725 K average', rx, SY + 34);
  const cbY = SY + 52, cbH = 150, cbW = 22;
  for (let i = 0; i < cbH; i += 1) {
    const c = rdbu(1 - i / (cbH - 1));
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
    ctx.fillRect(rx, cbY + i, cbW, 1);
  }
  ctx.strokeStyle = 'rgba(226,232,240,0.3)'; ctx.strokeRect(rx + 0.5, cbY + 0.5, cbW, cbH);
  ctx.fillStyle = '#f08a8a'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('hot', rx + cbW + 8, cbY + 10);
  ctx.fillStyle = '#7aa6e8'; ctx.fillText('cold', rx + cbW + 8, cbY + cbH);

  const spotDeg = 180 / st.lPeak;
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px ui-monospace, monospace';
  let ty = cbY + cbH + 34;
  ctx.fillText(`l_peak  = ${st.lPeak.toFixed(0)}`, rx, ty); ty += 18;
  ctx.fillText(`l_damp  = ${st.lDamp.toFixed(0)}`, rx, ty); ty += 18;
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`spot ~ ${spotDeg.toFixed(2)} deg`, rx, ty); ty += 18;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`modes  = ${built} / ${MTOT}`, rx, ty); ty += 24;
  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('l_peak sets the spot', rx, ty); ty += 15;
  ctx.fillText('size; l_damp smooths', rx, ty); ty += 15;
  ctx.fillText('the fine structure.', rx, ty);

  // demoted diagnostic: the toy D_l vs l curve, with the peak marked
  const dx0 = SX, dx1 = W - 22, dy0 = H - 64, dy1 = H - 10;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('diagnostic: power spectrum  D_l vs l', dx0 + 8, dy0 + 12);
  const lMin = 2, lMax = 2600, NS = 360;
  const vals = new Float64Array(NS); let dmax = 1e-30;
  for (let i = 0; i < NS; i += 1) { const l = lMin + (lMax - lMin) * i / (NS - 1); vals[i] = Dl(l, st.lPeak, st.lDamp); if (vals[i] > dmax) dmax = vals[i]; }
  const xP = (l) => dx0 + 8 + (l - lMin) / (lMax - lMin) * (dx1 - dx0 - 16);
  const yP = (d) => dy1 - 6 - d / dmax * (dy1 - dy0 - 22);
  ctx.strokeStyle = 'rgba(91,192,235,0.6)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xP(st.lPeak), dy0 + 16); ctx.lineTo(xP(st.lPeak), dy1 - 5); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i < NS; i += 1) { const l = lMin + (lMax - lMin) * i / (NS - 1); const p = { x: xP(l), y: yP(vals[i]) }; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`acoustic scale  l ~ ${st.lPeak.toFixed(0)}`, xP(st.lPeak) + 5, dy0 + 24);

  rL.textContent = st.lPeak.toFixed(0);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  rebuildModes();
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    accumulate(Math.max(6, Math.round(frac * MTOT)));
  } else {
    accumulate(28);                      // a recognisable sky on first paint
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
