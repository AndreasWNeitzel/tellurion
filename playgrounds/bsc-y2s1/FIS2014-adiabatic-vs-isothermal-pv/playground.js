// Adiabatic vs isothermal PV diagram. Two side-by-side panels:
//   LEFT: stacked-piston animation (isothermal reservoir top,
//         adiabatic insulated bottom) with point-particle gas whose
//         mean speed tracks the local temperature.
//   RIGHT: PV diagram with isotherm (cyan) + adiabat (yellow); two
//         live state dots; shaded work area below the active curve
//         for the current process direction; a T(V) inset showing the
//         adiabatic temperature dropping while the isothermal stays
//         pinned to T_0 (the textbook contrast).
// No more overlap between the piston cylinders and the PV plot.
//
// Reference: Callen, Thermodynamics and an Intro to Thermostatistics,
// 2nd ed., Ch. 1-3 (`callen`); Reif, Fundamentals of Statistical and
// Thermal Physics, Ch. 5 (`reif`).

import { adiabaticTemperature, workIsothermal, workAdiabatic } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rP = document.getElementById('readout-p');
const rT = document.getElementById('readout-t');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const selP = document.getElementById('select-p');
const btnR = document.getElementById('btn-reset');
const btnP = document.getElementById('btn-pause');
const btnRev = document.getElementById('btn-rev');

const st = { gamma: 1.4, T0: 300, V: 1, dir: 1, curve: 'both' };
let running = !prefersReducedMotion();

// =========================================================================
// LAYOUT. Split canvas into a piston column (left) and PV plot (right).
// =========================================================================
const PISTON = { x: 24, y: 36, w: 220, h: H - 36 - 28 };       // pistons fill the left column
const PV = { x: 290, y: 36, w: W - 290 - 24, h: 520 };          // square-ish PV; work bars fill below
const WORKBAR = { x: 290, y: 36 + 520 + 44, w: W - 290 - 24, h: H - (36 + 520 + 44) - 26 };

// =========================================================================
// PARTICLES. Two independent gases (isothermal + adiabatic). Each lives in
// a normalised [0, vFrac] x [0, 1] box; the rendering scales to the
// piston cylinder size.
// =========================================================================
const NPART = 80;
const partI = [], partA = [];
let _rng = 0xC0FFEE;
function rndN() { _rng = (Math.imul(_rng, 1664525) + 1013904223) >>> 0; return _rng / 4294967296; }
function seedParticles() {
  partI.length = 0; partA.length = 0;
  for (let i = 0; i < NPART; i += 1) {
    const a1 = rndN() * 2 * Math.PI, a2 = rndN() * 2 * Math.PI;
    partI.push({ x: 0.05 + rndN() * 0.9, y: rndN(), vx: Math.cos(a1), vy: Math.sin(a1) });
    partA.push({ x: 0.05 + rndN() * 0.9, y: rndN(), vx: Math.cos(a2), vy: Math.sin(a2) });
  }
}
seedParticles();

function stepParticles(arr, vNorm, vScaleAfter, dt) {
  for (const p of arr) {
    p.x += p.vx * dt * 2.0;
    p.y += p.vy * dt * 2.0;
    if (p.x < 0) { p.x = 0; p.vx = -p.vx; }
    if (p.x > vNorm) { p.x = vNorm; p.vx = -p.vx; }
    if (p.y < 0) { p.y = 0; p.vy = -p.vy; }
    if (p.y > 1) { p.y = 1; p.vy = -p.vy; }
  }
  if (vScaleAfter && vScaleAfter !== 1) {
    for (const p of arr) { p.vx *= vScaleAfter; p.vy *= vScaleAfter; }
  }
}

// =========================================================================
// SLIDER WIRING.
// =========================================================================
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
sT.addEventListener('input', () => { st.T0 = parseFloat(sT.value); vT.textContent = st.T0.toFixed(0); });
selP.addEventListener('change', () => { st.curve = selP.value; });
btnR.addEventListener('click', () => {
  st.V = 1; st.dir = 1; running = true;
  btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => {
  running = !running;
  btnP.textContent = running ? 'Pause' : 'Play';
  btnP.setAttribute('aria-pressed', String(!running));
});
btnRev.addEventListener('click', () => { st.dir = -st.dir; });

// =========================================================================
// AXIS MAPPING for the PV plot.
// =========================================================================
const Vmin = 0.25, Vmax = 2.5;
const Pmin = 0, Pmax = 4;
function mapV(V) { return PV.x + 40 + ((V - Vmin) / (Vmax - Vmin)) * (PV.w - 60); }
function mapP(P) { return PV.y + PV.h - 30 - ((P - Pmin) / (Pmax - Pmin)) * (PV.h - 50); }

// =========================================================================
// PISTON PANEL: two stacked cylinders. Isothermal on top with reservoir
// stripes underneath; adiabatic on bottom with insulation hatching above.
// Each cylinder shows a particle gas whose mean speed tracks T.
// =========================================================================
function drawPistonPanel() {
  // Frame.
  ctx.fillStyle = 'rgba(20, 28, 44, 0.55)';
  ctx.fillRect(PISTON.x - 8, PISTON.y - 8, PISTON.w + 16, PISTON.h + 16);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.20)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PISTON.x - 8 + 0.5, PISTON.y - 8 + 0.5, PISTON.w + 15, PISTON.h + 15);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('piston cylinders', PISTON.x - 4, PISTON.y - 14);

  const cellH = 110;
  const isoY = PISTON.y + 30;
  const adiY = PISTON.y + PISTON.h - 30 - cellH;
  const Vfrac = (st.V - Vmin) / (Vmax - Vmin);
  const fillW = Math.max(30, PISTON.w * Math.min(1, st.V / Vmax));

  const showIso = st.curve === 'both' || st.curve === 'iso';
  const showAdi = st.curve === 'both' || st.curve === 'adi';

  // Helper to draw a piston cylinder with particles inside.
  function drawCylinder(yTop, color, label, decorationFn, particles, tempRatio) {
    // Wall outline.
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(PISTON.x, yTop, fillW, cellH);
    // Fill background.
    ctx.fillStyle = color.replace('rgb(', 'rgba(').replace(')', ', 0.08)');
    ctx.fillRect(PISTON.x, yTop, fillW, cellH);
    // Decoration (reservoir or insulation).
    decorationFn(PISTON.x, yTop, fillW, cellH);
    // Particles.
    let sum2 = 0;
    for (const p of particles) sum2 += p.vx * p.vx + p.vy * p.vy;
    const rms = Math.sqrt(sum2 / particles.length) || 1;
    const target = tempRatio;
    stepParticles(particles, 1, target / rms, 0.016);
    const dotColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.85)');
    for (const p of particles) {
      const sp = Math.hypot(p.vx, p.vy);
      const alpha = 0.45 + 0.50 * Math.min(1, sp / 1.4);
      ctx.fillStyle = dotColor.replace(/[\d.]+\)$/, `${alpha.toFixed(2)})`);
      ctx.beginPath();
      ctx.arc(PISTON.x + p.x * fillW, yTop + 4 + p.y * (cellH - 8), 1.5, 0, 6.2832);
      ctx.fill();
    }
    // Label.
    ctx.fillStyle = color;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(label, PISTON.x, yTop - 6);
    // Piston rod handle at the right wall.
    ctx.strokeStyle = 'rgba(220, 230, 255, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(PISTON.x + fillW, yTop + cellH / 2);
    ctx.lineTo(PISTON.x + fillW + 18, yTop + cellH / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220, 230, 255, 0.8)';
    ctx.fillRect(PISTON.x + fillW + 18, yTop + cellH / 2 - 8, 6, 16);
  }

  if (showIso) {
    drawCylinder(isoY, 'rgb(91, 192, 235)', 'isothermal (T = T_0)', (x, y, w, h) => {
      // Reservoir bath: hatched zone BELOW the cylinder.
      ctx.fillStyle = 'rgba(91, 192, 235, 0.20)';
      for (let xx = 0; xx < w; xx += 8) {
        ctx.fillRect(x + xx, y + h + 2, 4, 6);
      }
      ctx.fillStyle = 'rgba(91, 192, 235, 0.65)';
      ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText('thermal reservoir', x, y + h + 22);
    }, partI, 1.0);
  }
  if (showAdi) {
    const ratio = Math.sqrt(adiabaticTemperature(st.V, 1, st.T0, st.gamma) / st.T0);
    drawCylinder(adiY, 'rgb(255, 209, 102)', 'adiabatic (Q = 0)', (x, y, w, h) => {
      // Insulation hatching ABOVE the cylinder.
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
      ctx.lineWidth = 1;
      for (let xx = 0; xx < w; xx += 6) {
        ctx.beginPath();
        ctx.moveTo(x + xx, y - 8); ctx.lineTo(x + xx + 4, y - 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 209, 102, 0.65)';
      ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText('insulated', x, y - 12);
    }, partA, ratio);
  }

  // Diagnostics under the cylinders.
  const Piso = 1 / st.V;
  const Padi = Math.pow(1 / st.V, st.gamma);
  const Tiso = st.T0;
  const Tadi = adiabaticTemperature(st.V, 1, st.T0, st.gamma);
  ctx.fillStyle = '#5bc0eb';
  ctx.font = fontString(canvas, 'caption', 'mono');
  if (showIso) ctx.fillText(`iso  P = ${Piso.toFixed(2)}  T = ${Tiso.toFixed(0)} K`, PISTON.x, PISTON.y + PISTON.h - 10);
  ctx.fillStyle = '#ffd166';
  if (showAdi) ctx.fillText(`adi  P = ${Padi.toFixed(2)}  T = ${Tadi.toFixed(0)} K`, PISTON.x, PISTON.y + PISTON.h + 6);
  ctx.fillStyle = '#cfd6e0';
  ctx.fillText(`V = ${st.V.toFixed(2)}`, PISTON.x, PISTON.y + PISTON.h + 22);
}

// =========================================================================
// PV PANEL: the textbook diagram, cleanly separated from the piston view.
// Includes a small T(V) inset on the upper-right corner.
// =========================================================================
function drawPVPanel() {
  // Frame.
  ctx.fillStyle = 'rgba(20, 28, 44, 0.55)';
  ctx.fillRect(PV.x - 8, PV.y - 8, PV.w + 16, PV.h + 16);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.20)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PV.x - 8 + 0.5, PV.y - 8 + 0.5, PV.w + 15, PV.h + 15);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('PV diagram', PV.x - 4, PV.y - 14);

  // Grid.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let v = 0.5; v <= 2.5; v += 0.5) {
    const x = mapV(v);
    ctx.beginPath();
    ctx.moveTo(x, PV.y + 8); ctx.lineTo(x, PV.y + PV.h - 30); ctx.stroke();
  }
  for (let p = 1; p <= 4; p += 1) {
    const y = mapP(p);
    ctx.beginPath();
    ctx.moveTo(PV.x + 40, y); ctx.lineTo(PV.x + PV.w - 20, y); ctx.stroke();
  }

  // Axes.
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(PV.x + 40, PV.y + 8);
  ctx.lineTo(PV.x + 40, PV.y + PV.h - 30);
  ctx.lineTo(PV.x + PV.w - 20, PV.y + PV.h - 30);
  ctx.stroke();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let v = 0.5; v <= 2.5; v += 0.5) ctx.fillText(v.toFixed(1), mapV(v) - 6, PV.y + PV.h - 14);
  for (let p = 1; p <= 4; p += 1) ctx.fillText(p.toFixed(0), PV.x + 22, mapP(p) + 4);
  ctx.fillText('V (norm.)', PV.x + PV.w - 70, PV.y + PV.h - 4);
  ctx.fillText('P (norm.)', PV.x + 6, PV.y + 6);

  const showIso = st.curve === 'both' || st.curve === 'iso';
  const showAdi = st.curve === 'both' || st.curve === 'adi';

  // Work-area shading: light fill below the curve from V_start (= 1) to st.V.
  // Helps the user see graphically that the adiabat encloses less area
  // (does less work) than the isotherm for the same volume change.
  function shadeWorkArea(curveFn, color) {
    const V1 = 1, V2 = st.V;
    const lo = Math.min(V1, V2), hi = Math.max(V1, V2);
    ctx.fillStyle = color;
    ctx.beginPath();
    const yBase = PV.y + PV.h - 30;
    ctx.moveTo(mapV(lo), yBase);
    for (let v = lo; v <= hi; v += 0.01) {
      ctx.lineTo(mapV(v), mapP(curveFn(v)));
    }
    ctx.lineTo(mapV(hi), yBase);
    ctx.closePath();
    ctx.fill();
  }
  if (showIso) shadeWorkArea(v => 1 / v, 'rgba(91, 192, 235, 0.14)');
  if (showAdi) shadeWorkArea(v => Math.pow(1 / v, st.gamma), 'rgba(255, 209, 102, 0.14)');

  // Curves.
  if (showIso) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let v = Vmin; v <= Vmax; v += 0.01) {
      const x = mapV(v), y = mapP(1 / v);
      if (v <= Vmin + 0.011) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (showAdi) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let v = Vmin; v <= Vmax; v += 0.01) {
      const x = mapV(v), y = mapP(Math.pow(1 / v, st.gamma));
      if (v <= Vmin + 0.011) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Current-state dots.
  const Piso = 1 / st.V;
  const Padi = Math.pow(1 / st.V, st.gamma);
  if (showIso) {
    ctx.fillStyle = '#5bc0eb';
    ctx.beginPath(); ctx.arc(mapV(st.V), mapP(Piso), 6, 0, 6.2832); ctx.fill();
  }
  if (showAdi) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(mapV(st.V), mapP(Padi), 6, 0, 6.2832); ctx.fill();
  }

  // Work readouts in the PV panel's upper-left corner so they don't
  // collide with the V-axis tick labels along the bottom.
  const W_iso = workIsothermal(1, st.V, st.T0, 1);
  const W_adi = workAdiabatic(1, st.V, 1, 1, st.gamma);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#5bc0eb';
  if (showIso) ctx.fillText(`W_iso = ${W_iso.toFixed(0)} J/mol`, PV.x + 50, PV.y + 24);
  ctx.fillStyle = '#ffd166';
  if (showAdi) ctx.fillText(`W_adi = ${W_adi.toFixed(0)} J/mol`, PV.x + 50, PV.y + 40);

  // T(V) inset (upper-right corner of the PV panel).
  const ix = PV.x + PV.w - 130, iy = PV.y + 18, iw = 110, ih = 72;
  ctx.fillStyle = 'rgba(8, 14, 24, 0.85)';
  ctx.fillRect(ix, iy, iw, ih);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('T(V)', ix + 4, iy + 12);
  // T axis: 0 to 2*T0
  const Tmin = 0, Tmax = 2 * st.T0;
  const txOf = v => ix + 6 + ((v - Vmin) / (Vmax - Vmin)) * (iw - 12);
  const tyOf = t => iy + ih - 8 - ((t - Tmin) / (Tmax - Tmin)) * (ih - 22);
  if (showIso) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(txOf(Vmin), tyOf(st.T0));
    ctx.lineTo(txOf(Vmax), tyOf(st.T0));
    ctx.stroke();
  }
  if (showAdi) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let v = Vmin; v <= Vmax; v += 0.01) {
      const t = adiabaticTemperature(v, 1, st.T0, st.gamma);
      const x = txOf(v), y = tyOf(Math.min(Tmax, t));
      if (v <= Vmin + 0.011) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // T inset cursor.
  ctx.fillStyle = '#cfd6e0';
  ctx.beginPath();
  ctx.arc(txOf(st.V), tyOf(Math.min(Tmax, st.T0)), 2.4, 0, 6.2832);
  ctx.fill();
  if (showAdi) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(txOf(st.V), tyOf(Math.min(Tmax, adiabaticTemperature(st.V, 1, st.T0, st.gamma))), 2.4, 0, 6.2832);
    ctx.fill();
  }

  // Work comparison bars below the PV plot: the area under each curve is the
  // work done. Isothermal does more work than adiabatic for the same
  // compression (it draws heat from the reservoir to stay warm). Fills what
  // was empty canvas below the diagram.
  const wb = WORKBAR;
  ctx.fillStyle = 'rgba(120,170,235,0.05)'; ctx.fillRect(wb.x, wb.y, wb.w, wb.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(wb.x + 0.5, wb.y + 0.5, wb.w - 1, wb.h - 1);
  ctx.fillStyle = 'rgba(220,230,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('work done = area under the P-V curve  (J/mol)', wb.x + 6, wb.y - 8);
  const wmax = Math.max(Math.abs(W_iso), Math.abs(W_adi), 1) * 1.15;
  const baseY = wb.y + wb.h - 30, barTop = wb.y + 26, barMaxH = baseY - barTop;
  for (const [lab, val, col, cx] of [['isothermal', W_iso, '#5bc0eb', wb.x + wb.w * 0.30], ['adiabatic', W_adi, '#ffd166', wb.x + wb.w * 0.70]]) {
    const hgt = Math.max(0, Math.abs(val) / wmax * barMaxH);
    ctx.fillStyle = col; ctx.fillRect(cx - 62, baseY - hgt, 124, hgt);
    ctx.fillStyle = 'rgba(230,235,255,0.9)'; ctx.textAlign = 'center';
    ctx.fillText(lab, cx, baseY + 18);
    ctx.fillText(`${val.toFixed(0)}`, cx, baseY - hgt - 8);
  }

  // Live readouts beside the canvas (HTML elements).
  rP.textContent = (showAdi ? Padi : Piso).toFixed(2);
  rT.textContent = (showAdi ? adiabaticTemperature(st.V, 1, st.T0, st.gamma) : st.T0).toFixed(0) + ' K';
}

// =========================================================================
// MAIN.
// =========================================================================
function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  drawPistonPanel();
  drawPVPanel();
  // Direction indicator.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(st.dir > 0 ? 'compression -> expansion' : 'expansion -> compression', PISTON.x, H - 12);
}

let last = performance.now();
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (running) {
    st.V += st.dir * dt * 0.5;
    if (st.V > 2.4) st.dir = -1;
    if (st.V < 0.3) st.dir = 1;
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  st.V = 0.3 + (CAPTURE_FRAC || 0) * 2.1;
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'gamma', label: 'Gamma (Cp/Cv)', value: st.gamma, format: 'float' },
      { key: 'initial-t', label: 'Initial T (K)', value: st.T0, format: 'float' },
      { key: 'volume', label: 'Volume (normalized)', value: st.V, format: 'float' },
      { key: 'curve', label: 'Process', value: st.curve, format: undefined }
    ]
  };
};
window.playground.getInvariants = function () {
  const status = st.gamma >= 1.0 && st.gamma <= 1.67 ? 'pass' : 'pending';
  return [
    { key: 'gas-process', label: 'Gamma in valid range', value: st.gamma.toFixed(2), status }
  ];
};
