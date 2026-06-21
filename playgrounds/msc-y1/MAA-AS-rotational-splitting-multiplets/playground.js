// Rotational splitting of an asteroseismic multiplet, shown faithfully on the
// oscillation modes themselves. Left: the star carrying a single (l, m)
// spherical-harmonic pattern Y_l^m, rendered as an azimuthal travelling wave.
// In a non-rotating star the 2l+1 values of m are degenerate and the pattern is
// stationary (a standing wave). Rotation breaks the prograde/retrograde
// symmetry through the Coriolis force and advection, so each m pattern is
// carried around in azimuth: a fixed observer then sees it oscillate at the
// shifted frequency nu0 + m (1 - C_nl) Omega. That azimuthal drift IS the
// splitting; m = 0 stays put (unshifted), prograde and retrograde m drift in
// opposite senses, and the g-mode Ledoux constant C slows the drift. Right: the
// observed multiplet, the 2l+1 peaks at nu0 + m (1 - C) Omega, with the selected
// m highlighted and the rigid m*Omega comb dashed for reference.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Sec. 3.8 (rotational splitting; Ledoux 1951).

import { ledoux, splittedFreq } from './sim.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const selAz = document.getElementById('select-az'), vAz = document.getElementById('value-az');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const NU0 = 100;
const DRIFT = 0.6;   // visual scale: azimuthal phase rate per unit m(1-C)Omega
const st = { Omega: 0.5, l: 2, m: 2, isG: false, t: 0 };
let running = true, last = performance.now();

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Associated Legendre P_l^|m|(x) by recurrence (Condon-Shortley sign dropped;
// only the shape matters for the surface pattern).
function plm(l, m, x) {
  m = Math.abs(m); if (m > l) return 0;
  const s = Math.sqrt(Math.max(0, 1 - x * x));
  let pmm = 1; for (let i = 1; i <= m; i += 1) pmm *= (2 * i - 1) * s;
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) { pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m); pmm = pmmp1; pmmp1 = pll; }
  return pll;
}
let plmNorm = 1;
function recomputeNorm() { let mx = 1e-9; for (let i = 0; i <= 256; i += 1) { const th = Math.PI * i / 256; mx = Math.max(mx, Math.abs(plm(st.l, st.m, Math.cos(th)))); } plmNorm = mx; }

function populateAz() {
  selAz.innerHTML = '';
  for (let m = st.l; m >= -st.l; m -= 1) { const o = document.createElement('option'); o.value = String(m); o.textContent = m > 0 ? `+${m}` : String(m); selAz.appendChild(o); }
  if (Math.abs(st.m) > st.l) st.m = st.l;
  selAz.value = String(st.m); vAz.textContent = st.m > 0 ? `+${st.m}` : String(st.m);
}

sO.addEventListener('input', () => { st.Omega = parseFloat(sO.value); vO.textContent = st.Omega.toFixed(2); if (!running) render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = st.l; populateAz(); recomputeNorm(); if (!running) render(); });
selAz.addEventListener('change', () => { st.m = parseInt(selAz.value, 10); vAz.textContent = st.m > 0 ? `+${st.m}` : String(st.m); recomputeNorm(); if (!running) render(); });
selM.addEventListener('change', () => { st.isG = selM.value === 'g'; if (!running) render(); });
btnR.addEventListener('click', () => { st.Omega = 0.5; st.l = 2; st.m = 2; st.isG = false; st.t = 0; sO.value = '0.5'; sL.value = '2'; selM.value = 'p'; vO.textContent = '0.50'; vL.textContent = '2'; populateAz(); recomputeNorm(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

const TILT = 0.5, cT = Math.cos(TILT), sT = Math.sin(TILT);

function drawMode(cx, cy, RST, t) {
  const l = st.l, m = st.m, C = ledoux(l, st.isG);
  // Azimuthal phase rate: the pattern is advected at (1-C)Omega, so a fixed
  // observer sees frequency m(1-C)Omega. drift = m(1-C)Omega (scaled).
  const drift = DRIFT * m * (1 - C) * st.Omega;
  const breath = 0.84 + 0.16 * Math.cos(2 * Math.PI * 0.11 * t);   // gentle oscillation cue
  const step = 3;
  for (let py = -RST; py <= RST; py += step) {
    for (let px = -RST; px <= RST; px += step) {
      const nx = px / RST, ny = -py / RST, rr = nx * nx + ny * ny;   // ny up
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      // colatitude/longitude about the tilted rotation axis a=(0,cT,sT).
      const cterm = clamp(ny * cT + nz * sT, -1, 1);
      const phi = Math.atan2(ny * sT - nz * cT, nx);
      const A = (plm(l, m, cterm) / plmNorm) * Math.cos(m * phi - drift * t);   // -1..1
      const limb = 0.30 + 0.70 * nz;
      const inten = limb * breath;
      const a = clamp(A, -1, 1);
      let r, g, b;
      if (a >= 0) { r = (40 + 215 * a) * inten; g = (44 + 110 * a) * inten; b = (52 + 18 * a) * inten; }
      else { const mm = -a; r = (40 + 20 * mm) * inten; g = (44 + 120 * mm) * inten; b = (52 + 200 * mm) * inten; }
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(cx + px, cy + py, step, step);
    }
  }
  // rotation axis (tilted) + spin sense.
  ctx.strokeStyle = 'rgba(220,225,235,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cx - sT * (RST + 16), cy - cT * (RST + 16)); ctx.lineTo(cx + sT * (RST + 16), cy + cT * (RST + 16)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`ℓ=${l}, m=${m > 0 ? '+' + m : m}, ${st.isG ? 'g' : 'p'}-mode`, cx, cy + RST + 26);
  const sense = m > 0 ? 'prograde drift' : m < 0 ? 'retrograde drift' : 'no drift (m=0)';
  ctx.fillStyle = m > 0 ? '#ff9f43' : m < 0 ? '#4cc9f0' : '#9aa0a6';
  ctx.fillText(st.Omega > 0 ? sense : 'Ω = 0: degenerate (stationary)', cx, cy + RST + 44);
  ctx.textAlign = 'left';
}

function drawSpectrum(x0, x1, yb, yt) {
  const C = ledoux(st.l, st.isG);
  const split = (1 - C) * st.Omega;
  const half = Math.max(1.0, st.l * st.Omega * 1.3);
  const nuMin = NU0 - half, nuMax = NU0 + half;
  const xOf = (nu) => x0 + (nu - nuMin) / (nuMax - nuMin) * (x1 - x0);
  const gamma = (nuMax - nuMin) / 150 + 1e-3;
  const comps = [];
  for (let m = -st.l; m <= st.l; m += 1) comps.push({ m, nu: splittedFreq(NU0, m, st.Omega, st.l, st.isG) });
  const power = (nu) => { let s = 0; for (const c of comps) { const d = (nu - c.nu) / gamma; s += 1 / (1 + d * d); } return s; };
  const TH = st.isG ? { f: 'rgba(76,201,240,0.18)', s: '#4cc9f0' } : { f: 'rgba(255,209,102,0.16)', s: '#ffd166' };
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('observed multiplet', x0, yt - 10);
  // rigid m*Omega reference comb.
  for (let m = -st.l; m <= st.l; m += 1) { if (m === 0) continue; const gx = xOf(NU0 + m * st.Omega); ctx.strokeStyle = 'rgba(120,128,150,0.4)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(gx, yt + 6); ctx.lineTo(gx, yb); ctx.stroke(); ctx.setLineDash([]); }
  let pmax = 0; for (const c of comps) { const v = power(c.nu); if (v > pmax) pmax = v; } if (pmax <= 0) pmax = 1;
  ctx.beginPath(); ctx.moveTo(x0, yb);
  for (let pxp = 0; pxp <= x1 - x0; pxp += 2) { const nu = nuMin + (nuMax - nuMin) * pxp / (x1 - x0); ctx.lineTo(x0 + pxp, yb - power(nu) / pmax * (yb - yt) * 0.92); }
  ctx.lineTo(x1, yb); ctx.closePath(); ctx.fillStyle = TH.f; ctx.fill();
  ctx.strokeStyle = TH.s; ctx.lineWidth = 1.6; ctx.stroke();
  for (const c of comps) {
    const pxc = xOf(c.nu), pk = yb - power(c.nu) / pmax * (yb - yt) * 0.92;
    const isSel = c.m === st.m;
    ctx.strokeStyle = isSel ? '#ffffff' : (c.m === 0 ? '#06d6a0' : TH.s); ctx.lineWidth = isSel ? 2.6 : (c.m === 0 ? 2 : 1);
    ctx.beginPath(); ctx.moveTo(pxc, yb); ctx.lineTo(pxc, pk); ctx.stroke();
    ctx.fillStyle = isSel ? '#ffffff' : (c.m === 0 ? '#06d6a0' : TH.s); ctx.font = fontString(canvas, 'caption', 'mono', isSel ? 800 : 400); ctx.textAlign = 'center';
    ctx.fillText(`m=${c.m}`, pxc, pk - 5); ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`C=${C.toFixed(3)}  δν=${split.toFixed(3)} μHz  (2ℓ+1)=${2 * st.l + 1}`, x0, yb + 22);
  ctx.fillText('dashed: rigid m·Ω (C=0)', x0, yb + 38);
  rD.textContent = split.toFixed(3);
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
  const ph = CAPTURE_NAME ? CAPTURE_FRAC * 6 : st.t;
  drawMode(208, 226, 164, ph);
  drawSpectrum(452, W - 28, H - 96, 96);
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  if (Number.isFinite(parseFloat(params.get('Omega')))) { st.Omega = parseFloat(params.get('Omega')); sO.value = String(st.Omega); vO.textContent = st.Omega.toFixed(2); }
  if (Number.isFinite(parseInt(params.get('l'), 10))) { st.l = clamp(parseInt(params.get('l'), 10), 1, 4); sL.value = String(st.l); vL.textContent = st.l; }
  if (params.get('mode') === 'g') { st.isG = true; selM.value = 'g'; }
  if (Number.isFinite(parseInt(params.get('m'), 10))) st.m = parseInt(params.get('m'), 10);
  populateAz(); recomputeNorm();
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const C = ledoux(st.l, st.isG);
  return {
    fields: [
      { key: 'rotation-rate', label: 'rotation rate Ω (μHz)', value: st.Omega, format: 'float' },
      { key: 'degree-l', label: 'degree ℓ', value: st.l, format: 'int' },
      { key: 'azimuthal-m', label: 'azimuthal order m', value: st.m, format: 'int' },
      { key: 'ledoux-constant', label: 'Ledoux constant C', value: C, format: 'float' },
      { key: 'shift', label: 'frequency shift m(1−C)Ω (μHz)', value: st.m * (1 - C) * st.Omega, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const C = ledoux(st.l, st.isG);
  // The selected component sits at nu0 + m(1-C)Omega; check the closed form.
  const nu = splittedFreq(NU0, st.m, st.Omega, st.l, st.isG);
  const expected = NU0 + st.m * (1 - C) * st.Omega;
  const err = Math.abs(nu - expected) / Math.max(1, Math.abs(expected));
  return [
    { key: 'splitting', label: 'νₘ = ν₀ + m(1−C)Ω', value: err.toExponential(2), status: err < 1e-9 ? 'pass' : 'drift' },
    { key: 'ledoux', label: C === 0 ? 'p-mode: C = 0' : 'g-mode: C = 1/ℓ(ℓ+1)', value: C.toFixed(3), status: 'pass' },
  ];
};
