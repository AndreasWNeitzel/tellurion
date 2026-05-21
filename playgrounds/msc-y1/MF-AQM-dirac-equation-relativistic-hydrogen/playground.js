// Relativistic hydrogen. Panel A: the Schrodinger level ladder vs the
// exact Dirac-Coulomb levels (split by total angular momentum j, the
// fine structure magnified), normalised by Ry Z^2 so the relativistic
// deviation is the visible story and grows with Z. Panel B:
// Zitterbewegung, the Dirac position trembling at 2 m c^2/hbar over a
// classical drift. Panel C: the fine-structure splitting vs Z on
// log-log (slope 4). Gate-tested sim.js; deterministic. Dirac 1928;
// Bjorken and Drell 1964; Schrodinger 1930.
import {
  ALPHA, RY_EV, schrodingerLevel, diracLevel, allowedJ,
  fineStructureSplit, groupVelocity, zbOmega, zbPosition,
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
const rZ = document.getElementById('readout-z');
const rE1 = document.getElementById('readout-e1');
const rFS = document.getElementById('readout-fs');
const rZA = document.getElementById('readout-za');
const sZ = document.getElementById('slider-z'), vZ = document.getElementById('value-z');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const NMAX = 3, DEF_Z = 50, DEF_P = 0.6;
const st = { Z: DEF_Z, p: DEF_P, running: !prefersReducedMotion(), t: 0 };

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawLevels(x, y, w, h) {
  panel(x, y, w, h, 'energy levels: Schrodinger [blue] vs exact Dirac [amber] (n=2 fine structure inset)');
  const y0 = y + 30, y1 = y + h - 24;
  // normalised energy e = E / (Ry Z^2): Schrodinger sits at -1/n^2,
  // independent of Z; Dirac deviates (relativistic + j-splitting),
  // the deviation amplified by the magnification.
  const eMin = -1.30, eMax = 0;
  const Y = (e) => y0 + (y1 - y0) * (eMax - e) / (eMax - eMin);
  const xS = x + w * 0.30, xD = x + w * 0.66, colW = w * 0.18;
  const norm = RY_EV * st.Z * st.Z;
  ctx.fillStyle = 'rgba(127,160,210,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Schrodinger', xS - colW / 2, y0 - 6);
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.fillText('Dirac (n, j)', xD - colW / 2, y0 - 6);
  for (let n = 1; n <= NMAX; n += 1) {
    const eS = schrodingerLevel(n, st.Z) / norm;        // = -1/n^2
    ctx.strokeStyle = '#7fb0d8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xS - colW / 2, Y(eS)); ctx.lineTo(xS + colW / 2, Y(eS)); ctx.stroke();
    ctx.fillStyle = 'rgba(127,176,216,0.8)'; ctx.fillText(`n=${n}`, xS - colW / 2 - 30, Y(eS) + 3);
    // Dirac multiplet at true normalised scale (the gross relativistic
    // shift is the visible story; the j fine structure is resolved in
    // the inset below).
    const js = allowedJ(n);
    let yPrev = -1e9;
    js.forEach((j, idx) => {
      const eD = diracLevel(n, j, st.Z) / norm;
      const yy = Y(Math.max(eMin, eD));
      ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xD - colW / 2, yy); ctx.lineTo(xD + colW / 2, yy); ctx.stroke();
      if (idx === 0) {
        ctx.strokeStyle = 'rgba(150,170,210,0.25)';
        ctx.beginPath(); ctx.moveTo(xS + colW / 2, Y(eS)); ctx.lineTo(xD - colW / 2, yy); ctx.stroke();
      }
      const ly = Math.abs(yy - yPrev) < 11 ? yPrev + 11 : yy;   // de-collide labels
      ctx.fillStyle = 'rgba(241,192,105,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText(`j=${j}`, xD + colW / 2 + 5, ly + 3);
      yPrev = ly;
    });
  }
  // magnified n=2 fine-structure inset: j=1/2 vs j=3/2, placed in the
  // empty band between the upper (n=2,3) cluster and the n=1 level.
  const ix = x + w * 0.34, iy = y + h * 0.40, iw = 230, ih = 96;
  ctx.fillStyle = '#0d0f16'; ctx.fillRect(ix, iy, iw, ih);
  ctx.strokeStyle = 'rgba(241,192,105,0.4)'; ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
  ctx.fillStyle = 'rgba(241,192,105,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('n=2 fine structure (zoom)', ix + 6, iy + 12);
  const e12 = diracLevel(2, 0.5, st.Z), e32 = diracLevel(2, 1.5, st.Z);
  const lo = Math.min(e12, e32), hi = Math.max(e12, e32), pad = (hi - lo) * 0.5 + 1e-9;
  const IY = (e) => iy + 30 + (ih - 44) * (hi + pad - e) / (hi - lo + 2 * pad);
  for (const [e, lab] of [[e12, '2s1/2 = 2p1/2  (j=1/2)'], [e32, '2p3/2  (j=3/2)']]) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ix + 10, IY(e)); ctx.lineTo(ix + 110, IY(e)); ctx.stroke();
    ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.fillText(lab, ix + 114, IY(e) + 3);
  }
  const fsEv = fineStructureSplit(2, st.Z);
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText(`dE_FS = ${fsEv > 1 ? fsEv.toFixed(2) + ' eV' : (fsEv * 1e6).toFixed(1) + ' ueV'}`, ix + 6, iy + ih - 6);
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('E / (Ry Z^2), levels at true scale', x + 10, y1 + 14);
}

function drawZB(x, y, w, h) {
  panel(x, y, w, h, 'Zitterbewegung: Dirac <x>(t) [cyan] trembles over the drift [grey]');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 22;
  const cy = (y0 + y1) / 2;
  const Tw = 14;                                        // time window (hbar / m c^2)
  const X = (t) => x0 + (x1 - x0) * t / Tw;
  const vg = groupVelocity(st.p);
  const maxX = Math.max(1e-3, vg * Tw + 1 / Math.sqrt(1 + st.p * st.p));
  const Y = (xx) => cy - (y1 - y0) * 0.46 * xx / maxX;
  ctx.strokeStyle = 'rgba(150,170,210,0.45)'; ctx.setLineDash([4, 4]); ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) { const t = Tw * i / 200; const px = X(t), py = Y(zbPosition(t, st.p).drift); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  const tNow = st.t * Tw;
  for (let i = 0; i <= 400; i += 1) {
    const t = Tw * i / 400; if (t > tNow) break;
    const px = X(t), py = Y(zbPosition(t, st.p).x);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  const here = zbPosition(tNow, st.p);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(tNow), Y(here.x), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('t (hbar / m c^2) ->', x1 - 130, y1 + 14);
  ctx.fillText('x (Compton wavelengths)', x + 6, y0 + 4);
  ctx.fillStyle = 'rgba(255,209,102,0.85)';
  ctx.fillText(`omega_ZB = ${zbOmega(st.p).toFixed(2)} (=2 at rest),  v_g = ${vg.toFixed(3)} c`, x + 10, y1);
}

function drawScaling(x, y, w, h) {
  panel(x, y, w, h, 'fine-structure splitting vs Z (log-log, slope 4: proportional to Z^4)');
  const x0 = x + 34, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  const zMax = 118;
  const xs = [], ys = [];
  for (let Z = 1; Z <= zMax; Z += 1) { const fs = fineStructureSplit(2, Z); if (fs > 0) { xs.push(Math.log10(Z)); ys.push(Math.log10(fs)); } }
  let ymin = Infinity, ymax = -Infinity; for (const v of ys) { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); }
  const X = (lz) => x0 + (x1 - x0) * lz / Math.log10(zMax);
  const Y = (ly) => y1 - (y1 - y0) * (ly - ymin) / (ymax - ymin);
  // slope-4 guide line
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(0), Y(ys[0])); ctx.lineTo(X(Math.log10(zMax)), Y(ys[0] + 4 * Math.log10(zMax))); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('slope 4', X(Math.log10(zMax)) - 60, Y(ys[0] + 4 * Math.log10(zMax)) - 4);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < xs.length; i += 1) { const px = X(xs[i]), py = Y(ys[i]); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.stroke();
  const lz = Math.log10(st.Z), ly = Math.log10(Math.max(1e-12, fineStructureSplit(2, st.Z)));
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(lz), Y(ly), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('log10 Z ->', x1 - 70, y1 + 14);
  ctx.fillText('log10 dE_FS', x + 6, y0 + 2);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawLevels(20, 22, W - 40, 232);
  drawZB(20, 270, (W - 52) / 2, H - 270 - 16);
  drawScaling(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rZ.textContent = String(st.Z);
  const e1 = diracLevel(1, 0.5, st.Z);
  rE1.textContent = Math.abs(e1) > 1000 ? `${(e1 / 1000).toFixed(2)} keV` : `${e1.toFixed(2)} eV`;
  const fs = fineStructureSplit(2, st.Z);
  rFS.textContent = fs > 1 ? `${fs.toFixed(3)} eV` : `${(fs * 1e6).toFixed(2)} ueV`;
  rZA.textContent = (st.Z * ALPHA).toFixed(4);
}

const LIVE = 1 / 360;
function tick() {
  if (st.running) { st.t += LIVE; if (st.t >= 1) st.t = 0; }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vZ.textContent = String(st.Z); vP.textContent = st.p.toFixed(2); }
sZ.addEventListener('input', () => { st.Z = parseInt(sZ.value, 10); syncLabels(); draw(); });
sP.addEventListener('input', () => { st.p = parseFloat(sP.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.Z = DEF_Z; st.p = DEF_P; st.t = 0; st.running = true;
  sZ.value = String(DEF_Z); sP.value = String(DEF_P * 100);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
  syncLabels(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { Z: String(st.Z), p: st.p.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.Z) { st.Z = parseInt(s.Z, 10); sZ.value = String(st.Z); }
  if (s.p) { st.p = parseFloat(s.p); sP.value = String(Math.round(st.p * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.t = f;
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
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
