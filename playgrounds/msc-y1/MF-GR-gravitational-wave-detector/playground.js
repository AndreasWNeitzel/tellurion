// Gravitational-wave detector. Panel A: a LIGO-type L interferometer
// whose 4 km arms stretch and squeeze by h L / 2 as the inspiral
// passes (displacement shown hugely magnified). Panel B: the chirp
// strain h(t) building to merger. Panel C: the matched-filter SNR vs
// lag, peaking at coalescence, with the recovered chirp mass.
// Gate-tested sim.js; deterministic. Peters 1964; Maggiore Vol. 1;
// Abbott et al. 2016.
import {
  chirpMass, recoverChirpMass, chirpRate, waveform,
  matchedFilter, MSUN, MPC,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rMc = document.getElementById('readout-mc');
const rF = document.getElementById('readout-f');
const rH = document.getElementById('readout-h');
const rSnr = document.getElementById('readout-snr');
const sM1 = document.getElementById('slider-m1'), vM1 = document.getElementById('value-m1');
const sM2 = document.getElementById('slider-m2'), vM2 = document.getElementById('value-m2');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_M1 = 30, DEF_M2 = 30, DEF_D = 400;
const st = { m1: DEF_M1, m2: DEF_M2, D: DEF_D, running: true, ph: 0, wf: null, mf: null };

function rebuild() {
  const m1 = st.m1 * MSUN, m2 = st.m2 * MSUN, D = st.D * MPC;
  st.wf = waveform(m1, m2, D);
  st.McSun = chirpMass(m1, m2) / MSUN;
  st.mf = matchedFilter(m1, m2, D, chirpMass(m1, m2));
  // recover Mc from the mid-inspiral (f, df/dt)
  const i = Math.floor(st.wf.f.length * 0.5), f = st.wf.f[i];
  st.recMc = recoverChirpMass(f, chirpRate(f, chirpMass(m1, m2))) / MSUN;
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawDetector(x, y, w, h) {
  panel(x, y, w, h, 'LIGO interferometer: the 4 km arms stretch and squeeze by h L / 2');
  const idx = Math.min(st.wf.h.length - 1, Math.floor(st.ph * (st.wf.h.length - 1)));
  const hNow = st.wf.h[idx];
  const L0 = Math.min(w, h) * 0.42;                     // nominal arm length (px) = 4 km
  const VIS = 6e18;                                     // magnify the ~2e-18 m wobble
  const dLx = 0.5 * hNow * 4000 * VIS;
  const dLy = -0.5 * hNow * 4000 * VIS;
  const bx = x + w * 0.30, by = y + h * 0.74;           // beamsplitter corner
  // laser + beamsplitter + photodetector
  ctx.fillStyle = '#9a3b3b'; ctx.fillRect(bx - 56, by - 7, 26, 14);
  ctx.fillStyle = 'rgba(220,160,160,0.85)'; ctx.font = '10px monospace'; ctx.fillText('laser', bx - 58, by - 12);
  ctx.strokeStyle = '#c0c8da'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 30, by); ctx.lineTo(bx, by); ctx.stroke();
  ctx.save(); ctx.translate(bx, by); ctx.rotate(-Math.PI / 4);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.fillText('beamsplitter', bx - 8, by + 22);
  ctx.fillStyle = '#3b6a9a'; ctx.fillRect(bx - 7, by + 30, 14, 12);
  ctx.fillStyle = 'rgba(160,190,230,0.8)'; ctx.fillText('photodiode', bx + 10, by + 42);
  // X arm (horizontal) and Y arm (vertical), mirrors at the far ends
  const lx = L0 + dLx, ly = L0 + dLy;
  ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + lx, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - ly); ctx.stroke();
  ctx.fillStyle = '#dfe6f4';
  ctx.fillRect(bx + lx, by - 12, 5, 24);                // X end mirror
  ctx.fillRect(bx - 12, by - ly - 5, 24, 5);            // Y end mirror
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.font = '10px monospace';
  ctx.fillText('arm X (4 km)', bx + lx * 0.4, by - 8);
  ctx.save(); ctx.translate(bx - 14, by - ly * 0.5); ctx.rotate(-Math.PI / 2); ctx.fillText('arm Y (4 km)', 0, 0); ctx.restore();
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText(`dL = ${(0.5 * Math.abs(hNow) * 4000).toExponential(2)} m  (shown x ${VIS.toExponential(0)})`, x + 12, y + h - 10);
  ctx.fillText(`h(t) = ${hNow.toExponential(2)}`, x + 12, y + h - 26);
}

function drawChirp(x, y, w, h) {
  panel(x, y, w, h, 'inspiral chirp strain h(t): rising frequency and amplitude to merger');
  const x0 = x + 14, x1 = x + w - 12, yc = y + h * 0.54, A = (h - 40) * 0.42;
  const W0 = st.wf.h, n = W0.length;
  let hmax = 1e-30; for (const v of W0) hmax = Math.max(hmax, Math.abs(v));
  const X = (i) => x0 + (x1 - x0) * i / (n - 1);
  const Y = (v) => yc - A * v / hmax;
  ctx.strokeStyle = 'rgba(150,170,210,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const xx = X(i), yy = Y(W0[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  const rev = Math.floor(st.ph * (n - 1));
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i <= rev; i += 1) { const xx = X(i), yy = Y(W0[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(rev), Y(W0[rev]), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.font = '10px monospace';
  ctx.fillText('time -> merger', x1 - 110, y + h - 10);
  ctx.fillText(`f_GW = ${st.wf.f[rev].toFixed(0)} Hz`, x0 + 4, y + h - 10);
}

function drawMatched(x, y, w, h) {
  panel(x, y, w, h, 'matched-filter SNR vs time lag: sharp peak recovers the signal');
  const s = st.mf.snr, x0 = x + 30, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  let mx = 1e-30; for (const p of s) mx = Math.max(mx, Math.abs(p.snr));
  const lagMax = s[s.length - 1].lag;
  const X = (lag) => x0 + (x1 - x0) * (lag + lagMax) / (2 * lagMax);
  const Y = (v) => y1 - (y1 - y0) * (v / mx * 0.5 + 0.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(X(0), y0); ctx.lineTo(X(0), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 1.8; ctx.beginPath();
  s.forEach((p, i) => { const xx = X(p.lag), yy = Y(p.snr); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(st.mf.peakLag), Y(st.mf.peak), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.font = '10px monospace';
  ctx.fillText(`peak at lag ${st.mf.peakLag}`, X(st.mf.peakLag) + 6, Y(st.mf.peak) - 6);
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText(`M_chirp = ${st.McSun.toFixed(2)} Msun (recovered ${st.recMc.toFixed(2)})`, x + 10, y + h - 10);
  ctx.fillText('time lag ->', x1 - 80, y1 + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawDetector(20, 22, W - 40, 232);
  drawChirp(20, 270, (W - 52) / 2, H - 270 - 16);
  drawMatched(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const idx = Math.min(st.wf.h.length - 1, Math.floor(st.ph * (st.wf.h.length - 1)));
  rMc.textContent = `${st.McSun.toFixed(2)} Msun`;
  rF.textContent = `${st.wf.f[idx].toFixed(0)} Hz`;
  rH.textContent = Math.max(...st.wf.amp).toExponential(2);
  rSnr.textContent = st.mf.peak.toExponential(2);
}

const LIVE = 1 / 320;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) { st.ph = 1; st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); } }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vM1.textContent = String(st.m1); vM2.textContent = String(st.m2); vD.textContent = String(st.D); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
sM1.addEventListener('input', () => { st.m1 = parseInt(sM1.value, 10); syncLabels(); rebuild(); draw(); });
sM2.addEventListener('input', () => { st.m2 = parseInt(sM2.value, 10); syncLabels(); rebuild(); draw(); });
sD.addEventListener('input', () => { st.D = parseInt(sD.value, 10); syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.m1 = DEF_M1; st.m2 = DEF_M2; st.D = DEF_D;
  sM1.value = String(DEF_M1); sM2.value = String(DEF_M2); sD.value = String(DEF_D);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { m1: String(st.m1), m2: String(st.m2), d: String(st.D) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.m1) { st.m1 = parseInt(s.m1, 10); sM1.value = String(st.m1); }
  if (s.m2) { st.m2 = parseInt(s.m2, 10); sM2.value = String(st.m2); }
  if (s.d) { st.D = parseInt(s.d, 10); sD.value = String(st.D); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
    draw();
  } else {
    draw();
  }
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
