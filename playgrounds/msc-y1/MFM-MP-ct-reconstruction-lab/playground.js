// CT reconstruction. Panel A: the Shepp-Logan phantom and its sinogram
// filled by a rotating gantry. Panel B: the image recovered by filtered
// back-projection (Ram-Lak / Shepp-Logan / none) or by MLEM. Panel C:
// the reconstruction error versus the number of angles and, for MLEM,
// versus iteration. Gate-tested sim.js; deterministic. Kak and Slaney
// 1988; Shepp and Vardi 1982.
import {
  makePhantom, radon, projectionAngles, fbp, mlem, rmse, snr,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rNa = document.getElementById('readout-na');
const rMeth = document.getElementById('readout-meth');
const rRmse = document.getElementById('readout-rmse');
const rSnr = document.getElementById('readout-snr');
const slNa = document.getElementById('slider-na'), vNa = document.getElementById('value-na');
const selF = document.getElementById('select-filt');
const selM = document.getElementById('select-meth');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const N = 80, A_MAX = 180;
const DEF = { na: 90, filt: 'ramlak', meth: 'fbp' };
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0 };

const PH = makePhantom(N);
const ANG_MAX = projectionAngles(A_MAX);
const SINO_FULL = radon(PH, N, ANG_MAX);                   // cached forward transform
const CURVE_NA = [3, 5, 10, 20, 40, 90, 180];

// offscreen image helpers
function imgCanvas(arr, n, vmin, vmax) {
  const c = document.createElement('canvas'); c.width = n; c.height = n;
  const cc = c.getContext('2d'); const id = cc.createImageData(n, n);
  const span = (vmax - vmin) || 1;
  for (let k = 0; k < n * n; k += 1) {
    const g = Math.max(0, Math.min(255, Math.round(255 * (arr[k] - vmin) / span)));
    id.data[4 * k] = g; id.data[4 * k + 1] = g; id.data[4 * k + 2] = g; id.data[4 * k + 3] = 255;
  }
  cc.putImageData(id, 0, 0);
  return c;
}
function sinoCanvas(sino, na) {
  const nd = sino[0].length;
  const c = document.createElement('canvas'); c.width = nd; c.height = na;
  const cc = c.getContext('2d'); const id = cc.createImageData(nd, na);
  let mn = Infinity, mx = -Infinity;
  for (let a = 0; a < na; a += 1) for (let d = 0; d < nd; d += 1) { const v = sino[a][d]; if (v < mn) mn = v; if (v > mx) mx = v; }
  const span = (mx - mn) || 1;
  for (let a = 0; a < na; a += 1) {
    for (let d = 0; d < nd; d += 1) {
      const g = Math.round(255 * (sino[a][d] - mn) / span);
      const k = 4 * (a * nd + d);
      id.data[k] = g; id.data[k + 1] = g; id.data[k + 2] = g; id.data[k + 3] = 255;
    }
  }
  cc.putImageData(id, 0, 0);
  return c;
}

const cache = {};
function rebuild() {
  const A = projectionAngles(st.na);
  const sino = radon(PH, N, A);
  let recon, mlemHist = null;
  if (st.meth === 'mlem') {
    const m = mlem(sino, N, A, N, 20, PH);
    recon = m.image; mlemHist = m.rmseHist;
  } else {
    recon = fbp(sino, N, A, N, st.filt);
  }
  // global least-squares scale to the phantom for fair display/metrics
  let num = 0, den = 0;
  for (let i = 0; i < recon.length; i += 1) { num += recon[i] * PH[i]; den += recon[i] * recon[i]; }
  const sc = den > 0 ? num / den : 1;
  const rscaled = Float64Array.from(recon, (v) => v * sc);
  // RMSE-vs-angles curve for the current FBP filter
  const naCurve = CURVE_NA.map((na) => {
    const Aa = projectionAngles(na);
    const r = fbp(radon(PH, N, Aa), N, Aa, N, st.filt === 'none' ? 'ramlak' : st.filt);
    let n2 = 0, d2 = 0; for (let i = 0; i < r.length; i += 1) { n2 += r[i] * PH[i]; d2 += r[i] * r[i]; }
    const s2 = d2 > 0 ? n2 / d2 : 1;
    return { na, rmse: rmse(Float64Array.from(r, (v) => v * s2), PH) };
  });
  cache.phC = imgCanvas(PH, N, Math.min(...PH), Math.max(...PH));
  cache.sinoC = sinoCanvas(SINO_FULL, A_MAX);
  cache.reconC = imgCanvas(rscaled, N, Math.min(...PH), Math.max(...PH));
  cache.rmse = rmse(rscaled, PH);
  cache.snr = snr(rscaled, PH);
  cache.naCurve = naCurve;
  cache.mlemHist = mlemHist;
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawAcq(x, y, w, h) {
  panel(x, y, w, h, 'phantom and sinogram (rotating-gantry acquisition)');
  // phantom (top) and sinogram (bottom) stacked, using the full height
  const sz = Math.min(w - 36, (h - 84) / 2);
  const phx = x + (w - sz) / 2, phy = y + 28;
  const syy = phy + sz + 26;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cache.phC, phx, phy, sz, sz);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(phx, phy, sz, sz);
  ctx.fillStyle = 'rgba(200,210,235,0.7)'; ctx.font = '10px monospace';
  ctx.fillText('phantom (Shepp-Logan)', phx, phy + sz + 14);
  // rotating gantry ray over the phantom
  const cx = phx + sz / 2, cy = phy + sz / 2, ga = st.ph * Math.PI;
  ctx.strokeStyle = 'rgba(255,209,102,0.85)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(ga) * sz * 0.66, cy - Math.sin(ga) * sz * 0.66);
  ctx.lineTo(cx + Math.cos(ga) * sz * 0.66, cy + Math.sin(ga) * sz * 0.66);
  ctx.stroke();
  // sinogram below, revealed up to the current swept angle
  const reveal = Math.max(1, Math.floor(st.ph * st.na));
  ctx.drawImage(cache.sinoC, 0, 0, cache.sinoC.width, Math.max(1, Math.floor(st.na)),
    phx, syy, sz, sz);
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(phx, syy + sz * reveal / st.na, sz, sz * (1 - reveal / st.na));
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(phx, syy, sz, sz);
  ctx.fillStyle = 'rgba(200,210,235,0.7)';
  ctx.fillText('sinogram: Radon transform (angle vs detector)', phx, syy + sz + 14);
}

function drawRecon(x, y, w, h) {
  const m = st.meth === 'mlem' ? 'MLEM' : `FBP ${st.filt}`;
  panel(x, y, w, h, `reconstruction: ${m}, ${st.na} angles`);
  const sz = Math.min(w - 28, h - 52);
  const ix = x + (w - sz) / 2, iy = y + 26;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cache.reconC, ix, iy, sz, sz);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(ix, iy, sz, sz);
  ctx.fillStyle = cache.rmse < 0.08 ? '#9be8b0' : '#ffd166'; ctx.font = '12px monospace';
  ctx.fillText(`RMSE = ${cache.rmse.toFixed(4)}   SNR = ${cache.snr.toFixed(2)}`, ix, iy + sz + 18);
}

function drawCurves(x, y, w, h) {
  panel(x, y, w, h, st.meth === 'mlem'
    ? 'MLEM convergence and FBP error vs angles'
    : 'reconstruction error vs number of angles');
  const px = x + 40, py = y + 26, pw = w - 54, ph = h - 50;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const cv = cache.naCurve;
  let rmax = 0; for (const c of cv) rmax = Math.max(rmax, c.rmse);
  if (cache.mlemHist) for (const v of cache.mlemHist) rmax = Math.max(rmax, v);
  const Xna = (na) => px + pw * (Math.log10(na) - Math.log10(3)) / (Math.log10(180) - Math.log10(3));
  const Y = (r) => py + ph * (1 - r / (rmax * 1.05));
  // FBP error vs angles (log-x)
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 2; ctx.beginPath();
  cv.forEach((c, i) => { const xx = Xna(c.na), yy = Y(c.rmse); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); });
  ctx.stroke();
  for (const c of cv) { ctx.fillStyle = '#6fb4ff'; ctx.beginPath(); ctx.arc(Xna(c.na), Y(c.rmse), 2.5, 0, 2 * Math.PI); ctx.fill(); }
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 4, py + 3, 130, 14);
  ctx.fillStyle = 'rgba(111,180,255,0.9)';
  ctx.fillText('FBP RMSE vs angles', px + 8, py + 13);
  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  for (const na of [3, 10, 40, 180]) ctx.fillText(`${na}`, Xna(na) - 6, py + ph + 14);
  ctx.fillText('projection angles (log)', px + pw / 2 - 50, py + ph + 26);
  // MLEM convergence (linear in iteration, overlaid)
  if (cache.mlemHist) {
    const hh = cache.mlemHist, Xit = (i) => px + pw * i / (hh.length - 1);
    ctx.strokeStyle = '#ff9d6f'; ctx.lineWidth = 2; ctx.beginPath();
    hh.forEach((v, i) => { const xx = Xit(i), yy = Y(v); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); });
    ctx.stroke();
    ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + pw - 172, py + 3, 168, 14);
    ctx.fillStyle = 'rgba(255,157,111,0.92)'; ctx.fillText('MLEM RMSE vs iteration', px + pw - 168, py + 13);
  }
  // current operating angle marker
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(Xna(st.na), py); ctx.lineTo(Xna(st.na), py + ph); ctx.stroke(); ctx.setLineDash([]);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawAcq(20, 20, half, H - 34);
  drawRecon(20 + half + 12, 20, half, (H - 46) / 2);
  drawCurves(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  rNa.textContent = String(st.na);
  rMeth.textContent = st.meth === 'mlem' ? 'MLEM' : `FBP ${st.filt}`;
  rRmse.textContent = cache.rmse.toFixed(4);
  rSnr.textContent = cache.snr.toFixed(2);
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 240) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vNa.textContent = String(st.na); }
slNa.addEventListener('change', () => { st.na = parseInt(slNa.value, 10); sync(); rebuild(); draw(); });
slNa.addEventListener('input', () => { vNa.textContent = slNa.value; });
selF.addEventListener('change', () => { st.filt = selF.value; rebuild(); draw(); });
selM.addEventListener('change', () => { st.meth = selM.value; rebuild(); draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true;
  slNa.value = String(DEF.na); selF.value = DEF.filt; selM.value = DEF.meth;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { na: String(st.na), filt: st.filt, meth: st.meth }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.na) { st.na = parseInt(s.na, 10); slNa.value = s.na; }
  if (s.filt) { st.filt = s.filt; selF.value = s.filt; }
  if (s.meth) { st.meth = s.meth; selM.value = s.meth; }
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync(); rebuild();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = fr; draw();
  } else { draw(); }
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
