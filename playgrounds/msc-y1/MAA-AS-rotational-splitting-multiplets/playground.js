// Rotational splitting of an asteroseismic multiplet, shown on the star
// itself. Left: a tilted, shaded 3D star carrying the sectoral
// oscillation pattern Y_l^l ~ sin^l(theta) cos(l phi); it pulses in and
// out at the mode frequency and the whole pattern is carried around by
// rotation at rate Omega. Right: the observed multiplet, a degenerate
// mode of degree l split into 2l+1 Lorentzian components at
// nu0 + m (1 - C_nl) Omega; the rigid m*Omega comb is drawn as a dashed
// reference so the g-mode Ledoux contraction is visible. Faster Omega
// spins the pattern and widens the splitting; higher l adds sectors and
// components; the p/g selector sets the Ledoux constant (and slows the
// g-mode pulsation).
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology
// (2010), Sec. 3.8.

import { ledoux, splittedFreq } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const NU0 = 100;
const st = { Omega: 0.5, l: 2, isG: false, t: 0 }; let running = true;
let last = performance.now();

sO.addEventListener('input', () => { st.Omega = parseFloat(sO.value); vO.textContent = st.Omega.toFixed(2); if (!running) render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = st.l; if (!running) render(); });
selM.addEventListener('change', () => { st.isG = selM.value === 'g'; if (!running) render(); });
btnR.addEventListener('click', () => { st.Omega = 0.5; st.l = 2; st.isG = false; st.t = 0; sO.value = '0.5'; sL.value = '2'; selM.value = 'p'; vO.textContent = '0.50'; vL.textContent = '2'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

// View tilt: rotation axis tilted toward the viewer so the spin reads.
const TILT = 0.46, cT = Math.cos(TILT), sT = Math.sin(TILT);

function drawStar(cx, cy, RST, ph) {
  const l = st.l;
  // User feedback: 'flashing effect is irritating, would be nice to
  // see actual deformation of the surface'. The flat brightness-only
  // pulse was 0.45 -> 1.0 (2x range, ~1 Hz), which strobed; the new
  // visualization displaces the surface RADIALLY by xi(t) Y_l^l so
  // the lobes physically push out and pull in, and brightness now
  // varies only gently (0.75 .. 1.0) to indicate compression.
  const fPuls = (st.isG ? 0.55 : 1.0) * (1 + 0.12 * l);
  const xi = Math.cos(2 * Math.PI * fPuls * ph);                  // -1 .. +1
  const pulse = 0.85 + 0.15 * (0.5 + 0.5 * xi);                   // 0.85 .. 1.0 (gentle)
  const lon = st.Omega * ph * 0.8;
  const latP = Math.min(l, 3);
  const step = 3;
  // Maximum radial displacement of the surface, in screen pixels.
  const DEFORM = Math.max(2.5, RST * 0.06) * xi;
  for (let py = -RST; py <= RST; py += step) {
    for (let px = -RST; px <= RST; px += step) {
      const nx = px / RST, ny = py / RST; const rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const theta = Math.acos(Math.max(-1, Math.min(1, ny)));
      const phi = Math.atan2(nz, nx) - lon;
      const sector = Math.cos(l * phi);
      const lat = 0.32 + 0.68 * Math.pow(Math.sin(theta), latP);
      const I = lat * pulse * (0.45 + 0.55 * Math.sqrt(Math.abs(sector)));
      const shade = (0.32 + 0.68 * nz) * I;
      // Radial surface displacement scaled by the local Y_l^l (sectoral)
      // amplitude. The lobes physically extrude when sector > 0 and
      // recess when sector < 0, alternating in lockstep with xi(t).
      const d = DEFORM * sector * Math.pow(Math.sin(theta), latP);
      const drawX = cx + px + nx * d;
      const drawY = cy + py + ny * d;
      let r, g, b;
      if (sector >= 0) { r = 255; g = 145; b = 60; } else { r = 70; g = 150; b = 255; }
      ctx.fillStyle = `rgb(${(r * shade) | 0},${(g * shade) | 0},${(b * shade) | 0})`;
      ctx.fillRect(drawX, drawY, step, step);
    }
  }
  // Rotation axis and spin arrow.
  ctx.strokeStyle = 'rgba(220,225,235,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cx, cy - RST * cT - 18); ctx.lineTo(cx, cy + RST * cT + 18); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`Ω = ${st.Omega.toFixed(2)} μHz`, cx, cy + RST + 30);
  ctx.fillText(`ℓ = ${l},  m = ±ℓ sectoral,  ${st.isG ? 'g' : 'p'}-mode`, cx, cy + RST + 48);
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
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('observed multiplet', x0, yt - 10);
  // Rigid m*Omega reference comb.
  for (let m = -st.l; m <= st.l; m += 1) {
    if (m === 0) continue;
    const gx = xOf(NU0 + m * st.Omega);
    ctx.strokeStyle = 'rgba(120,128,150,0.4)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(gx, yt + 6); ctx.lineTo(gx, yb); ctx.stroke(); ctx.setLineDash([]);
  }
  let pmax = 0; for (const c of comps) { const v = power(c.nu); if (v > pmax) pmax = v; } if (pmax <= 0) pmax = 1;
  ctx.beginPath(); ctx.moveTo(x0, yb);
  for (let pxp = 0; pxp <= x1 - x0; pxp += 2) { const nu = nuMin + (nuMax - nuMin) * pxp / (x1 - x0); ctx.lineTo(x0 + pxp, yb - power(nu) / pmax * (yb - yt) * 0.92); }
  ctx.lineTo(x1, yb); ctx.closePath(); ctx.fillStyle = TH.f; ctx.fill();
  ctx.strokeStyle = TH.s; ctx.lineWidth = 1.6; ctx.stroke();
  for (const c of comps) {
    const pxc = xOf(c.nu), pk = yb - power(c.nu) / pmax * (yb - yt) * 0.92;
    ctx.strokeStyle = c.m === 0 ? '#06d6a0' : TH.s; ctx.lineWidth = c.m === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(pxc, yb); ctx.lineTo(pxc, pk); ctx.stroke();
    ctx.fillStyle = c.m === 0 ? '#06d6a0' : TH.s; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(`m=${c.m}`, pxc, pk - 5); ctx.textAlign = 'left';
  }
  ctx.fillStyle = 'rgba(6,214,160,0.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOf(NU0), yt - 4); ctx.lineTo(xOf(NU0), yb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('ν₀', xOf(NU0) + 4, yt + 4);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`C=${C.toFixed(3)}  δν=${split.toFixed(3)} μHz  (2ℓ+1)=${2 * st.l + 1}`, x0, yb + 22);
  ctx.fillText('dashed: rigid m·Ω (C=0)', x0, yb + 38);
  rD.textContent = split.toFixed(3);
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
  const ph = CAPTURE_NAME ? CAPTURE_FRAC * 6 : st.t;
  drawStar(212, 234, 168, ph);
  drawSpectrum(452, W - 28, H - 96, 96);
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }


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
