// Gravitational waves from a compact-binary inspiral. Primary view:
// two black holes spiral together on a shrinking Keplerian orbit and
// radiate a two-arm quadrupole ripple of spacetime that tightens and
// brightens into the merger, then rings down. Diagnostic strips: the
// chirp strain h(t), the matched-filter SNR with the recovered chirp
// mass, and a magnified LIGO arm-strain indicator. Gate-tested sim.js
// (Peters 1964; Maggiore Vol. 1; Abbott et al. 2016).
import {
  chirpMass, recoverChirpMass, chirpRate, waveform,
  matchedFilter, G, C, MSUN, MPC,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

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
const st = { m1: DEF_M1, m2: DEF_M2, D: DEF_D, running: !prefersReducedMotion(), ph: 0, wf: null, mf: null };

function rebuild() {
  const m1 = st.m1 * MSUN, m2 = st.m2 * MSUN, D = st.D * MPC;
  st.wf = waveform(m1, m2, D);
  st.McSun = chirpMass(m1, m2) / MSUN;
  st.mf = matchedFilter(m1, m2, D, chirpMass(m1, m2));
  const n = st.wf.f.length;
  const i = Math.floor(n * 0.5), f = st.wf.f[i];
  st.recMc = recoverChirpMass(f, chirpRate(f, chirpMass(m1, m2))) / MSUN;
  // Orbital separation from Kepler at the GW frequency, and the
  // accumulated orbital phase (cumulative, so the bodies spin up into
  // the merger). a = (G Mtot / omega_orb^2)^(1/3), omega_orb = pi f_GW.
  const Mtot = m1 * 0 + (st.m1 + st.m2) * MSUN;
  st.aRel = new Float64Array(n);
  st.cum = new Float64Array(n);
  let a0 = 0, ph = 0;
  for (let k = 0; k < n; k += 1) {
    const fk = Math.max(1, st.wf.f[k]);
    const wOrb = Math.PI * fk;
    const a = Math.cbrt(G * Mtot / (wOrb * wOrb));
    if (k === 0) a0 = a;
    st.aRel[k] = a / a0;                                // 1 -> ~0 at merger
    ph += wOrb * (1 / n) * 6.0;                          // visual orbital phase
    st.cum[k] = ph;
  }
  st.ratio = st.m2 / (st.m1 + st.m2);                    // mass ratio for body sizes
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

// Primary: the inspiral and its two-arm quadrupole ripple field.
const BL = 5;
function drawInspiral(x, y, w, h) {
  panel(x, y, w, h, 'compact-binary inspiral: two black holes radiating gravitational waves to merger');
  const cx = x + w / 2, cy = y + h / 2 + 6;
  const n = st.wf.f.length;
  const idx = Math.min(n - 1, Math.max(0, Math.floor(st.ph * (n - 1))));
  const aR = st.aRel[idx];                               // current separation (relative)
  const fNow = st.wf.f[idx];
  const merged = st.ph >= 0.985;
  const orbPx = Math.min(w, h) * 0.30 * Math.max(0.0, aR);
  const Rmax = Math.min(w, h) * 0.48;
  // ripple wavenumber rises with the chirp; envelope grows to merger
  // then rings down. h(r, phi) ~ env * cos(2 phi - k r + Phi).
  const k = 0.018 + 0.052 * Math.min(1, fNow / 300);
  const Phi = st.cum[idx];
  const env = merged
    ? Math.exp(-(st.ph - 0.985) * 90)                    // ringdown decay
    : 0.55 + 0.45 * (1 - aR);                             // grows as it tightens
  ctx.save();
  ctx.beginPath(); ctx.rect(x + 1, y + 16, w - 2, h - 18); ctx.clip();
  for (let py = y + 16; py < y + h; py += BL) {
    for (let px = x + 1; px < x + w; px += BL) {
      const dx = px - cx, dy = py - cy;
      const r = Math.hypot(dx, dy);
      if (r > Rmax) continue;
      const phi = Math.atan2(dy, dx);
      // Wave-zone strain: quadrupole (2 phi), outgoing (- k r), and a
      // 1/r amplitude falloff softened near the source.
      const fall = 1 / (0.35 + r * 0.012);
      const hh = env * fall * Math.cos(2 * phi - k * r + Phi);
      const v = Math.max(-1, Math.min(1, hh * 2.4));
      if (Math.abs(v) < 0.015) continue;
      const a = Math.abs(v);
      const rC = v > 0 ? 255 : 70, gC = 110 + 70 * (1 - a), bC = v < 0 ? 255 : 90;
      ctx.fillStyle = `rgba(${rC | 0},${gC | 0},${bC | 0},${(0.62 * a + 0.05).toFixed(3)})`;
      ctx.fillRect(px, py, BL, BL);
    }
  }
  ctx.restore();
  // the two bodies (or the merged remnant)
  const R1 = 5 + 16 * (1 - st.ratio), R2 = 5 + 16 * st.ratio;
  function hole(bx, by, rad, glow) {
    const g = ctx.createRadialGradient(bx, by, rad * 0.4, bx, by, rad * 2.4);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(20,16,30,0.9)');
    g.addColorStop(0.75, glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, rad * 2.4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#05040a'; ctx.beginPath(); ctx.arc(bx, by, rad, 0, 2 * Math.PI); ctx.fill();
  }
  if (merged) {
    const fl = Math.exp(-(st.ph - 0.985) * 60);
    hole(cx, cy, R1 + R2, `rgba(${200},${180 + 60 * fl | 0},255,${0.5 + 0.5 * fl})`);
  } else {
    const th = st.cum[idx];
    const b1x = cx + Math.cos(th) * orbPx * (st.ratio), b1y = cy + Math.sin(th) * orbPx * (st.ratio);
    const b2x = cx - Math.cos(th) * orbPx * (1 - st.ratio), b2y = cy - Math.sin(th) * orbPx * (1 - st.ratio);
    hole(b2x, b2y, R2, 'rgba(120,150,255,0.55)');
    hole(b1x, b1y, R1, 'rgba(255,170,120,0.55)');
  }
  ctx.fillStyle = 'rgba(210,220,240,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`f_GW = ${fNow.toFixed(0)} Hz   separation ${(aR).toFixed(2)} a0   ${merged ? 'MERGED: ringdown' : 'inspiral'}`, x + 10, y + h - 10);
}

function drawChirp(x, y, w, h) {
  panel(x, y, w, h, 'strain h(t)');
  const x0 = x + 10, x1 = x + w - 10, yc = y + h * 0.56, A = (h - 36) * 0.42;
  const W0 = st.wf.h, n = W0.length;
  let hmax = 1e-30; for (const v of W0) hmax = Math.max(hmax, Math.abs(v));
  const X = (i) => x0 + (x1 - x0) * i / (n - 1);
  const Y = (v) => yc - A * v / hmax;
  ctx.strokeStyle = 'rgba(150,170,210,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const xx = X(i), yy = Y(W0[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  const rev = Math.min(n - 1, Math.floor(st.ph * (n - 1)));
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i <= rev; i += 1) { const xx = X(i), yy = Y(W0[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(rev), Y(W0[rev]), 3.5, 0, 2 * Math.PI); ctx.fill();
}

function drawMatched(x, y, w, h) {
  panel(x, y, w, h, 'matched-filter SNR (recovers M_chirp)');
  const s = st.mf.snr, x0 = x + 12, x1 = x + w - 10, y0 = y + 24, y1 = y + h - 22;
  let mx = 1e-30; for (const p of s) mx = Math.max(mx, Math.abs(p.snr));
  const lagMax = s[s.length - 1].lag;
  const X = (lag) => x0 + (x1 - x0) * (lag + lagMax) / (2 * lagMax);
  const Y = (v) => y1 - (y1 - y0) * (v / mx * 0.5 + 0.5);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 1.6; ctx.beginPath();
  s.forEach((p, i) => { const xx = X(p.lag), yy = Y(p.snr); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(st.mf.peakLag), Y(st.mf.peak), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.72)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`M_chirp ${st.McSun.toFixed(1)} (rec ${st.recMc.toFixed(1)}) Msun`, x + 10, y + h - 9);
}

function drawDetector(x, y, w, h) {
  panel(x, y, w, h, 'LIGO arm strain');
  const idx = Math.min(st.wf.h.length - 1, Math.floor(st.ph * (st.wf.h.length - 1)));
  const hNow = st.wf.h[idx];
  const bx = x + w * 0.30, by = y + h * 0.66, L0 = Math.min(w, h) * 0.5;
  const VIS = 6e18;
  const lx = L0 + 0.5 * hNow * 4000 * VIS, ly = L0 - 0.5 * hNow * 4000 * VIS;
  ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + lx, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - ly); ctx.stroke();
  ctx.fillStyle = '#dfe6f4'; ctx.fillRect(bx + lx, by - 8, 4, 16); ctx.fillRect(bx - 8, by - ly - 4, 16, 4);
  ctx.fillStyle = '#9a3b3b'; ctx.fillRect(bx - 34, by - 5, 16, 10);
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`dL ${(0.5 * Math.abs(hNow) * 4000).toExponential(1)} m  (x${VIS.toExponential(0)})`, x + 8, y + h - 8);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const primH = Math.round(H * 0.60);
  drawInspiral(16, 16, W - 32, primH - 24);
  const sy = primH, sh = H - primH - 12, sw = (W - 16 * 4) / 3;
  drawChirp(16, sy, sw, sh);
  drawMatched(16 + sw + 16, sy, sw, sh);
  drawDetector(16 + 2 * (sw + 16), sy, sw, sh);
  const idx = Math.min(st.wf.h.length - 1, Math.floor(st.ph * (st.wf.h.length - 1)));
  rMc.textContent = `${st.McSun.toFixed(2)} Msun`;
  rF.textContent = `${st.wf.f[idx].toFixed(0)} Hz`;
  rH.textContent = Math.max(...st.wf.amp).toExponential(2);
  rSnr.textContent = st.mf.peak.toExponential(2);
}

const LIVE = 1 / 360;
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
    st.ph = f * 0.999;
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
