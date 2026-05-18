// Scanning-probe microscopy: a sharp tip scans an atomically
// corrugated surface. AFM senses the Lennard-Jones tip-sample force;
// STM senses the tunnelling current I ~ V exp(-2 kappa d), a decade
// per angstrom for a metallic work function. Physics is the
// gate-tested closed-form sim.js. Canvas2D, deterministic.
import {
  ljPotential, ljForce, ljMinDistance, kappa, stmCurrent, decadePerAngstrom,
  surfaceProfile, stmConstantHeight, stmTopograph, afmForceScan,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rGap = document.getElementById('readout-gap');
const rKap = document.getElementById('readout-kappa');
const rDec = document.getElementById('readout-decade');
const rSig = document.getElementById('readout-signal');
const selMode = document.getElementById('select-mode');
const sGap = document.getElementById('slider-gap'), vGap = document.getElementById('value-gap');
const sPhi = document.getElementById('slider-phi'), vPhi = document.getElementById('value-phi');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const LAT = 4, AMP = 0.6, EPS = 0.02, SIG = 3, BIAS = 0.1, ISET = 2e-3;
const XMAX = 24;                                     // angstrom scan range
const st = { mode: 'stm-cc', gap: 5, phi: 5, running: true, tipX: 0 };

function X(xa) { return 40 + (W - 70) * (xa / XMAX); }

function drawSurface(y0, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText('surface (atomic corrugation) and the scanning tip', 40, y0 - 6);
  // surface fill
  ctx.beginPath(); ctx.moveTo(X(0), y0 + h);
  for (let xa = 0; xa <= XMAX; xa += 0.1) {
    const zs = surfaceProfile(xa, AMP, LAT);
    ctx.lineTo(X(xa), y0 + h * 0.55 - zs * 26);
  }
  ctx.lineTo(X(XMAX), y0 + h); ctx.closePath();
  ctx.fillStyle = 'rgba(70,110,160,0.30)'; ctx.fill();
  ctx.strokeStyle = '#6f9bd0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let xa = 0; xa <= XMAX; xa += 0.1) ctx[xa === 0 ? 'moveTo' : 'lineTo'](X(xa), y0 + h * 0.55 - surfaceProfile(xa, AMP, LAT) * 26);
  ctx.stroke();
  // atom centres
  for (let xa = 0; xa <= XMAX; xa += LAT) {
    ctx.fillStyle = 'rgba(150,190,235,0.7)';
    ctx.beginPath(); ctx.arc(X(xa), y0 + h * 0.55 - surfaceProfile(xa, AMP, LAT) * 26, 7, 0, 2 * Math.PI); ctx.fill();
  }
  // tip
  const tx = st.tipX;
  const zs = surfaceProfile(tx, AMP, LAT);
  let tipZ;
  if (st.mode === 'stm-cc') tipZ = stmTopograph(tx, ISET, BIAS, st.phi, AMP, LAT);
  else tipZ = st.gap + (st.mode === 'stm-ch' ? 0 : 0) + zs; // constant height: tip at fixed h above mean
  const tipPx = X(tx);
  const surfPy = y0 + h * 0.55 - zs * 26;
  const tipPy = st.mode === 'stm-cc' ? (y0 + h * 0.55 - tipZ * 26) : (surfPy - st.gap * 26 * 0 - st.gap * 10);
  const apexY = st.mode === 'stm-cc' ? tipPy : (y0 + h * 0.55 - (AMP) * 26 - st.gap * 10);
  ctx.strokeStyle = '#ffcf6b'; ctx.fillStyle = '#ffcf6b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(tipPx - 10, apexY - 40); ctx.lineTo(tipPx, apexY); ctx.lineTo(tipPx + 10, apexY - 40); ctx.stroke();
  ctx.beginPath(); ctx.arc(tipPx, apexY, 3, 0, 2 * Math.PI); ctx.fill();
}

function drawLaw(y0, h) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(40, y0, W - 70, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(40.5, y0 + 0.5, W - 71, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  if (st.mode === 'afm') {
    ctx.fillText('Lennard-Jones force F(d): repulsive inside, attractive outside, F=0 at 2^(1/6) sigma', 48, y0 + 14);
    const dMin = 1.5, dMax = 9;
    let fmax = 1e-9; for (let d = dMin; d < dMax; d += 0.02) fmax = Math.max(fmax, Math.abs(ljForce(d, EPS, SIG)));
    const px = (d) => 40 + (W - 70) * (d - dMin) / (dMax - dMin);
    const py = (f) => y0 + h / 2 - (h / 2 - 16) * Math.max(-1, Math.min(1, f / fmax));
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(40, py(0)); ctx.lineTo(W - 30, py(0)); ctx.stroke();
    ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let d = dMin; d < dMax; d += 0.02) ctx[d === dMin ? 'moveTo' : 'lineTo'](px(d), py(ljForce(d, EPS, SIG)));
    ctx.stroke();
    const dm = ljMinDistance(SIG);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(px(dm), py(0), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,120,0.8)'; ctx.fillText('F=0 at d=' + dm.toFixed(2) + ' A', px(dm) - 30, py(0) - 8);
  } else {
    ctx.fillText('STM tunnelling current I ~ V exp(-2 kappa d): a decade per angstrom', 48, y0 + 14);
    const dMin = 2, dMax = 12;
    const px = (d) => 40 + (W - 70) * (d - dMin) / (dMax - dMin);
    const I0 = stmCurrent(dMin, BIAS, st.phi);
    const py = (I) => y0 + h - 16 - (h - 34) * (Math.log10(Math.max(1e-12, I)) - Math.log10(I0 * 1e-6)) / (Math.log10(I0) - Math.log10(I0 * 1e-6));
    ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let d = dMin; d <= dMax; d += 0.05) ctx[d === dMin ? 'moveTo' : 'lineTo'](px(d), py(stmCurrent(d, BIAS, st.phi)));
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,210,120,0.8)';
    ctx.fillText('x' + decadePerAngstrom(st.phi).toFixed(1) + ' per 1 A  (log scale)', W - 230, y0 + h - 8);
  }
}

function drawScan(y0, h) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(40, y0, W - 70, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(40.5, y0 + 0.5, W - 71, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  const lbl = st.mode === 'afm' ? 'AFM force vs scan position'
    : st.mode === 'stm-ch' ? 'STM constant-height current vs scan position (atomic contrast)'
      : 'STM constant-current tip height vs scan position (the topograph)';
  ctx.fillText(lbl, 48, y0 + 14);
  const samp = [];
  for (let xa = 0; xa <= XMAX; xa += 0.1) {
    let v;
    if (st.mode === 'afm') v = afmForceScan(xa, ljMinDistance(SIG) + st.gap, EPS, SIG, AMP, LAT);
    else if (st.mode === 'stm-ch') v = stmConstantHeight(xa, st.gap + AMP, BIAS, st.phi, AMP, LAT);
    else v = stmTopograph(xa, ISET, BIAS, st.phi, AMP, LAT);
    samp.push(v);
  }
  let lo = Infinity, hi = -Infinity;
  for (const v of samp) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (hi - lo < 1e-12) hi = lo + 1;
  ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 1.6; ctx.beginPath();
  samp.forEach((v, i) => { const x = X(i * 0.1), yy = y0 + h - 14 - (h - 28) * (v - lo) / (hi - lo); i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); });
  ctx.stroke();
  // current tip marker
  const ix = Math.round(st.tipX / 0.1);
  if (ix >= 0 && ix < samp.length) {
    const yy = y0 + h - 14 - (h - 28) * (samp[ix] - lo) / (hi - lo);
    ctx.fillStyle = '#ffcf6b'; ctx.beginPath(); ctx.arc(X(st.tipX), yy, 4, 0, 2 * Math.PI); ctx.fill();
  }
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawSurface(34, 150);
  drawLaw(224, 120);
  drawScan(370, H - 370 - 16);

  const d = (st.mode === 'afm') ? ljMinDistance(SIG) + st.gap : st.gap;
  rGap.textContent = d.toFixed(2) + ' A';
  rKap.textContent = kappa(st.phi).toFixed(3) + ' /A';
  rDec.textContent = 'x' + decadePerAngstrom(st.phi).toFixed(1) + ' /A';
  if (st.mode === 'afm') rSig.textContent = afmForceScan(st.tipX, ljMinDistance(SIG) + st.gap, EPS, SIG, AMP, LAT).toExponential(2) + ' eV/A';
  else rSig.textContent = stmCurrent(st.gap, BIAS, st.phi).toExponential(2);
}

function tick() {
  if (st.running) { st.tipX += 0.12; if (st.tipX > XMAX) st.tipX = 0; }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vGap.textContent = st.gap.toFixed(2); vPhi.textContent = st.phi.toFixed(2); }
selMode.addEventListener('change', () => { st.mode = selMode.value; draw(); });
sGap.addEventListener('input', () => { st.gap = parseFloat(sGap.value) / 100; syncLabels(); draw(); });
sPhi.addEventListener('input', () => { st.phi = parseFloat(sPhi.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.mode = 'stm-cc'; st.gap = 5; st.phi = 5; st.running = true; st.tipX = 0;
  selMode.value = 'stm-cc'; sGap.value = '500'; sPhi.value = '500';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { spm_mode: st.mode, gap: st.gap.toFixed(2), work_function: st.phi.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.spm_mode) { st.mode = s.spm_mode; selMode.value = s.spm_mode; }
  if (s.gap) { st.gap = parseFloat(s.gap); sGap.value = String(Math.round(st.gap * 100)); }
  if (s.work_function) { st.phi = parseFloat(s.work_function); sPhi.value = String(Math.round(st.phi * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) { st.mode = 'stm-cc'; st.gap = 5; st.phi = 5; st.tipX = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * XMAX; }
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
