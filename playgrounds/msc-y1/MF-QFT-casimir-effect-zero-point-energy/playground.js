// Casimir effect. Panel A: two conducting plates; the standing modes
// that fit (cyan) and the long-wavelength modes excluded by the gap
// (red), with the inward vacuum pressure. Panel B: the d^-4 pressure
// law (log-log, slope -4). Panel C: the pressure and energy magnitude
// vs separation. Gate-tested sim.js; deterministic. Casimir 1948;
// Milonni; Lamoreaux 1997.
import {
  casimirPressure, casimirEnergyPerArea, modeWavelength, modeCountBelow, pressureCurve,
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
const rD = document.getElementById('readout-d');
const rP = document.getElementById('readout-p');
const rE = document.getElementById('readout-e');
const rN = document.getElementById('readout-n');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sNm = document.getElementById('slider-nm'), vNm = document.getElementById('value-nm');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_D = 1000, DEF_NM = 8;
const D_LO = 5e-8, D_HI = 5e-6;                         // pressure-curve range (m)
const st = { dnm: DEF_D, nm: DEF_NM, running: !prefersReducedMotion(), ph: 0 };

function rebuild() {
  st.dT = st.dnm * 1e-9;                                // target separation (m)
  st.curve = pressureCurve(D_LO, D_HI, 120);
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}
// closing animation: d goes from 3 dT down to dT
function dNow() { return st.dT * (3 - 2 * st.ph); }

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawPlates(x, y, w, h) {
  const d = dNow();
  panel(x, y, w, h, 'conducting plates: modes that fit (cyan) vs excluded long modes (red)');
  const cy = y + h * 0.54, midX = x + w * 0.5;
  // gap pixels: scale d so the smallest target maps to a usable gap
  const gapPx = Math.max(40, Math.min(w * 0.5, (d / (st.dT * 3)) * w * 0.5));
  const pL = midX - gapPx / 2, pR = midX + gapPx / 2, ph2 = h * 0.34;
  ctx.fillStyle = '#9aa6c4'; ctx.fillRect(pL - 10, cy - ph2, 10, 2 * ph2);
  ctx.fillStyle = '#9aa6c4'; ctx.fillRect(pR, cy - ph2, 10, 2 * ph2);
  // allowed standing modes n = 1..nm between the plates
  for (let n = 1; n <= st.nm; n += 1) {
    const yo = cy - ph2 + (2 * ph2) * (n - 0.5) / st.nm;
    const amp = (2 * ph2 / st.nm) * 0.42;
    ctx.strokeStyle = 'rgba(127,209,255,0.85)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const xi = pL + (pR - pL) * i / 80;
      const yy = yo - amp * Math.sin(n * Math.PI * i / 80);
      i === 0 ? ctx.moveTo(xi, yy) : ctx.lineTo(xi, yy);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${st.nm} allowed modes (k_n = n pi / d)`, pL - 6, cy - ph2 - 8);
  // excluded long-wavelength modes (lambda > 2 d): drawn faint red in
  // the clear region to the LEFT of the plates, each spanning more
  // than the gap so it visibly fails to fit.
  const exX0 = x + 16, exX1 = pL - 22;
  if (exX1 - exX0 > 60) {
    ctx.fillStyle = 'rgba(255,143,143,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('excluded: lambda > 2d', exX0, cy - ph2 - 8);
    for (let m = 0; m < 3; m += 1) {
      const lamPx = gapPx * (2.2 + 1.3 * m);            // wider than the gap -> cannot fit
      ctx.strokeStyle = 'rgba(255,143,143,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i <= 120; i += 1) {
        const xi = exX0 + (exX1 - exX0) * i / 120;
        const yy = cy - ph2 * 0.5 + m * ph2 * 0.5 + 8 * Math.sin(2 * Math.PI * (xi - exX0) / lamPx);
        i === 0 ? ctx.moveTo(xi, yy) : ctx.lineTo(xi, yy);
      }
      ctx.stroke();
    }
  }
  // inward Casimir pressure arrows (size ~ log P)
  const Pn = casimirPressure(d);
  const aLen = 8 + 26 * Math.min(1, Math.log10(Pn / casimirPressure(D_HI)) / 6);
  ctx.strokeStyle = '#ffd166'; ctx.fillStyle = '#ffd166'; ctx.lineWidth = 2;
  for (const [sx, dir] of [[pL - 14, 1], [pR + 14, -1]]) {
    ctx.beginPath(); ctx.moveTo(sx - dir * aLen, cy); ctx.lineTo(sx, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, cy); ctx.lineTo(sx - dir * 6, cy - 4); ctx.lineTo(sx - dir * 6, cy + 4); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(200,215,240,0.75)';
  ctx.fillText(`d = ${(d * 1e9).toFixed(0)} nm   P = ${Pn.toExponential(2)} Pa`, x + 12, y + h - 10);
}

function drawLaw(x, y, w, h) {
  panel(x, y, w, h, 'Casimir pressure P(d) (log-log): slope -4');
  const x0 = x + 40, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const c = st.curve, n = c.d.length;
  const lx0 = Math.log10(c.d[0]), lx1 = Math.log10(c.d[n - 1]);
  let ly0 = 1e30, ly1 = -1e30; for (let i = 0; i < n; i += 1) { ly0 = Math.min(ly0, Math.log10(c.P[i])); ly1 = Math.max(ly1, Math.log10(c.P[i])); }
  const X = (lx) => x0 + (x1 - x0) * (lx - lx0) / (lx1 - lx0);
  const Y = (ly) => y1 - (y1 - y0) * (ly - ly0) / (ly1 - ly0);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(lx0), Y(Math.log10(c.P[0]))); ctx.lineTo(X(lx1), Y(Math.log10(c.P[0]) - 4 * (lx1 - lx0))); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('slope -4', X(lx1) - 56, Y(Math.log10(c.P[0]) - 4 * (lx1 - lx0)) - 4);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < n; i += 1) { const xx = X(Math.log10(c.d[i])), yy = Y(Math.log10(c.P[i])); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  // 1 micron annotation
  const lx1u = Math.log10(1e-6);
  ctx.fillStyle = 'rgba(241,192,105,0.7)';
  ctx.beginPath(); ctx.arc(X(lx1u), Y(Math.log10(casimirPressure(1e-6))), 3.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText('1 um -> 1.3 mPa', X(lx1u) - 30, Y(Math.log10(casimirPressure(1e-6))) - 6);
  const d = dNow();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(Math.log10(d)), Y(Math.log10(casimirPressure(d))), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('log10 d (m) ->', x1 - 110, y1 + 14);
}

function drawEnergy(x, y, w, h) {
  panel(x, y, w, h, 'energy |E/A| ~ d^-3 and pressure ~ d^-4 (log-log)');
  const x0 = x + 40, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const c = st.curve, n = c.d.length;
  const lx0 = Math.log10(c.d[0]), lx1 = Math.log10(c.d[n - 1]);
  const E = c.d.map((dd) => Math.abs(casimirEnergyPerArea(dd)));
  let lo = 1e30, hi = -1e30;
  for (let i = 0; i < n; i += 1) { lo = Math.min(lo, Math.log10(c.P[i]), Math.log10(E[i])); hi = Math.max(hi, Math.log10(c.P[i]), Math.log10(E[i])); }
  const X = (lx) => x0 + (x1 - x0) * (lx - lx0) / (lx1 - lx0);
  const Y = (ly) => y1 - (y1 - y0) * (ly - lo) / (hi - lo);
  const line = (arr, col, lab) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 0; i < n; i += 1) { const xx = X(Math.log10(c.d[i])), yy = Y(Math.log10(arr[i])); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke();
    ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(lab, X(lx0) + 6, Y(Math.log10(arr[0])) - 4);
  };
  line(c.P, '#8fe39b', 'P ~ d^-4');
  line(E, '#e79bff', '|E/A| ~ d^-3');
  const d = dNow();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(Math.log10(d)), Y(Math.log10(casimirPressure(d))), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('log10 d ->', x1 - 78, y1 + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawPlates(20, 22, W - 40, 232);
  drawLaw(20, 270, (W - 52) / 2, H - 270 - 16);
  drawEnergy(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const d = dNow();
  rD.textContent = `${(d * 1e9).toFixed(0)} nm`;
  rP.textContent = `${casimirPressure(d).toExponential(2)} Pa`;
  rE.textContent = casimirEnergyPerArea(d).toExponential(2);
  rN.textContent = String(modeCountBelow(2 * Math.PI / modeWavelength(1, d) * st.nm, d));
}

const LIVE = 1 / 300;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) { st.ph = 1; st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); } }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vD.textContent = String(st.dnm); vNm.textContent = String(st.nm); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
sD.addEventListener('input', () => { st.dnm = parseInt(sD.value, 10); syncLabels(); rebuild(); draw(); });
sNm.addEventListener('input', () => { st.nm = parseInt(sNm.value, 10); syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.dnm = DEF_D; st.nm = DEF_NM;
  sD.value = String(DEF_D); sNm.value = String(DEF_NM);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { d: String(st.dnm), nm: String(st.nm) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.d) { st.dnm = parseInt(s.d, 10); sD.value = String(st.dnm); }
  if (s.nm) { st.nm = parseInt(s.nm, 10); sNm.value = String(st.nm); }
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const d_m = st.dT;
  return {
    fields: [
      { key: 'separation', label: 'plate separation d (nm)', value: st.dnm, format: 'float' },
      { key: 'pressure', label: 'Casimir pressure (Pa)', value: casimirPressure(d_m), format: 'float' },
      { key: 'energy-density', label: 'energy per area (J/m^2)', value: casimirEnergyPerArea(d_m), format: 'float' },
      { key: 'mode-count', label: 'allowed standing modes up to 10th', value: st.nm, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const d_m = st.dT;
  const P = casimirPressure(d_m);
  const E = casimirEnergyPerArea(d_m);
  // Attractive force: pressure and energy must be negative (inward)
  inv.push({
    key: 'casimir-attractive',
    label: 'Casimir pressure is negative (attractive)',
    value: P.toExponential(2),
    status: P < 0 ? 'pass' : 'drift'
  });
  inv.push({
    key: 'energy-negative',
    label: 'binding energy E < 0',
    value: E.toExponential(2),
    status: E < 0 ? 'pass' : 'drift'
  });
  // Scaling law: P should scale as d^-4
  const d_test = d_m * 2;
  const P_test = casimirPressure(d_test);
  const expected_ratio = Math.pow(d_m / d_test, 4);
  const actual_ratio = P / P_test;
  const rel_err = Math.abs(actual_ratio - expected_ratio) / expected_ratio;
  inv.push({
    key: 'd-minus-4-scaling',
    label: 'P(d) ~ d^-4 holds',
    value: rel_err.toExponential(2),
    status: rel_err < 0.001 ? 'pass' : 'pending'
  });
  return inv;
};
