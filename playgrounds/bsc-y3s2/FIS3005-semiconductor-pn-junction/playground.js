import { fontString } from '../../../shared/js/canvas-type.js';
// The p-n junction (Canvas2D). Left: the band diagram (or the
// space-charge + field profile). Right: the ideal-diode I-V curve
// with the operating point. Static (recomputed per control change).
// sim.js is the gate-tested depletion-approximation engine.

import {
  builtInPotential, depletionEdges, depletionWidth, bands,
  chargeDensity, peakField, diodeCurrentOverI0, junctionCapacitance,
  thermalVoltage,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rVbi = document.getElementById('readout-vbi');
const rV = document.getElementById('readout-v');
const rW = document.getElementById('readout-w');
const rI = document.getElementById('readout-i');
const rC = document.getElementById('readout-c');

const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const sNA = document.getElementById('slider-na'), vNA = document.getElementById('value-na');
const sND = document.getElementById('slider-nd'), vND = document.getElementById('value-nd');
const selView = document.getElementById('select-view');
const bR = document.getElementById('btn-reset');

const st = { V: 0, lna: 22, lnd: 21.7, view: 'bands' };
const LX0 = 56, LX1 = 430, RY0 = 40, RY1 = H - 56;
const RX0 = 480, RX1 = W - 24;

function params3() { return { NA: 10 ** st.lna, ND: 10 ** st.lnd, V: st.V }; }

function drawLeft() {
  const { NA, ND, V } = params3();
  const { xp, xn, W: Wd } = depletionEdges(NA, ND, V);
  const span = Math.max(xp, xn) * 2.2 + 1e-9;
  const xOf = (x) => LX0 + (x + span / 2) / span * (LX1 - LX0);
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(LX0, RY0); ctx.lineTo(LX0, RY1); ctx.lineTo(LX1, RY1); ctx.stroke();
  // junction line
  ctx.strokeStyle = 'rgba(120,130,150,0.35)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOf(0), RY0); ctx.lineTo(xOf(0), RY1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('p', xOf(-span / 2.3), RY1 + 18); ctx.fillText('n', xOf(span / 2.3), RY1 + 18);
  ctx.fillText('position x  (depletion shaded)', (LX0 + LX1) / 2, H - 16);

  // depletion shading
  ctx.fillStyle = 'rgba(255,209,102,0.10)';
  ctx.fillRect(xOf(-xp), RY0, xOf(xn) - xOf(-xp), RY1 - RY0);

  if (st.view === 'bands') {
    const Eg = 1.12, Vbi = builtInPotential(NA, ND), drop = Vbi - V;
    // autoscale to the full band excursion: Ev(n) = -drop up to
    // Ec(p) = Eg, with margins, so it always fits at any bias.
    const lo = -drop - 0.35, hi = Eg + 0.35;
    const yOf = (E) => RY1 - (E - lo) / (hi - lo) * (RY1 - RY0);
    const NP = 240;
    for (const [field, col] of [['Ec', '#5bc0eb'], ['Ev', '#ef476f']]) {
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let i = 0; i <= NP; i += 1) {
        const x = (-span / 2) + (i / NP) * span;
        const Y = yOf(bands(x, NA, ND, V, Eg)[field]);
        const X = xOf(x);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
    // Equilibrium Fermi level: a single flat reference. The bias is
    // shown by how much the bands bend away from it (drop = Vbi - V),
    // which is the textbook reading; always on-screen.
    const yF = yOf(Eg / 2);
    ctx.strokeStyle = 'rgba(6,214,160,0.85)'; ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(LX0, yF); ctx.lineTo(LX1, yF); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'left'; ctx.fillText('Ec', LX1 - 26, yOf(Eg - drop) - 6);
    ctx.fillStyle = '#ef476f'; ctx.fillText('Ev', LX1 - 26, yOf(-drop) + 14);
    ctx.fillStyle = 'rgba(6,214,160,0.9)'; ctx.fillText('E_F', LX1 - 26, yF - 6);
  } else {
    // charge density (box) and field (triangle), shared axis
    const cy = (RY0 + RY1) / 2;
    ctx.strokeStyle = 'rgba(120,130,150,0.4)'; ctx.beginPath(); ctx.moveTo(LX0, cy); ctx.lineTo(LX1, cy); ctx.stroke();
    const rhoMax = Math.max(NA, ND);
    ctx.fillStyle = 'rgba(91,192,235,0.35)';
    ctx.fillRect(xOf(0), cy - (ND / rhoMax) * (cy - RY0), xOf(xn) - xOf(0), (ND / rhoMax) * (cy - RY0));
    ctx.fillStyle = 'rgba(239,71,111,0.35)';
    ctx.fillRect(xOf(-xp), cy, xOf(0) - xOf(-xp), (NA / rhoMax) * (RY1 - cy));
    // triangular field (negative, peak at junction)
    const Emax = peakField(NA, ND, V);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4; ctx.beginPath();
    ctx.moveTo(xOf(-xp), cy);
    ctx.lineTo(xOf(0), cy + 0.42 * (RY1 - RY0));
    ctx.lineTo(xOf(xn), cy); ctx.stroke();
    ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.textAlign = 'left';
    ctx.fillText('rho(x): -qNA (p), +qND (n)', LX0 + 6, RY0 + 14);
    ctx.fillStyle = '#ffd166'; ctx.fillText(`E(x) triangular, |E|max = ${(Emax / 1e6).toFixed(2)} MV/m`, LX0 + 6, RY1 - 8);
  }
}

// Small dot/glyph helpers for the device schematic.
function disc(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); }
function glyph(x, y, ch, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
  if (ch === '+') { ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); }
  ctx.stroke();
}
function arrow(x0, y0, x1, y1, col, lw) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0), s = 6;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - s * Math.cos(a - 0.4), y1 - s * Math.sin(a - 0.4));
  ctx.lineTo(x1 - s * Math.cos(a + 0.4), y1 - s * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}

// Right panel: an interactive device schematic. The bar is the
// physical p-n junction: mobile holes and electrons in the neutral
// regions, the depletion layer of exposed ionized dopant cores in
// the middle (width and asymmetric split from the depletion
// approximation, so every slider moves it), the built-in field, the
// applied battery, and the carrier flow it drives. A compact I-V
// inset keeps the diode law and the operating point in view.
function drawDevice() {
  const { NA, ND, V } = params3();
  const { xp, xn, W: Wd } = depletionEdges(NA, ND, V);
  const W0 = depletionWidth(NA, ND, 0) || Wd || 1e-9;
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('p-n junction device', (RX0 + RX1) / 2, RY0 - 8);

  const bx0 = RX0 + 6, bx1 = RX1 - 6, by0 = 64, by1 = 168, xc = (bx0 + bx1) / 2, barW = bx1 - bx0;
  // depletion pixel half-widths, asymmetric per charge balance
  const depPx = Math.max(5, Math.min(0.80 * barW, (Wd / W0) * 0.30 * barW));
  const dpx = depPx * (xp / (xp + xn || 1));     // into p (left)
  const dnx = depPx * (xn / (xp + xn || 1));     // into n (right)
  const dL = xc - dpx, dR = xc + dnx;

  ctx.fillStyle = 'rgba(239,71,111,0.16)'; ctx.fillRect(bx0, by0, xc - bx0, by1 - by0);   // p body
  ctx.fillStyle = 'rgba(91,192,235,0.16)'; ctx.fillRect(xc, by0, bx1 - xc, by1 - by0);    // n body
  ctx.fillStyle = 'rgba(255,209,102,0.16)'; ctx.fillRect(dL, by0, dR - dL, by1 - by0);    // depletion
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx0, by0, barW, by1 - by0);
  ctx.strokeStyle = 'rgba(120,130,150,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xc, by0); ctx.lineTo(xc, by1); ctx.stroke(); ctx.setLineDash([]);

  // dopant cores (fixed) everywhere; mobile carriers only outside the
  // depletion layer, so the middle reads as exposed space charge
  const nP = Math.round(4 + (st.lna - 21) * 4), nN = Math.round(4 + (st.lnd - 21) * 4);
  const yA = by0 + 30, yB = by0 + 64;
  for (let i = 0; i < nP; i += 1) {
    const x = bx0 + 8 + (i + 0.5) / nP * (xc - bx0 - 12);
    glyph(x, yB, '-', 'rgba(239,71,111,0.55)');                      // acceptor core
    if (x < dL - 2) disc(x, yA, 3.2, '#f6a5b8');                     // mobile hole
  }
  for (let i = 0; i < nN; i += 1) {
    const x = xc + 8 + (i + 0.5) / nN * (bx1 - xc - 12);
    glyph(x, yB, '+', 'rgba(91,192,235,0.6)');                       // donor core
    if (x > dR + 2) disc(x, yA, 3.2, '#8fd4f2');                     // mobile electron
  }
  ctx.fillStyle = 'rgba(150,160,180,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.fillText('p', bx0 + 16, by1 + 16); ctx.fillText('n', bx1 - 16, by1 + 16);
  ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.fillText(`depletion W = ${(Wd * 1e9).toFixed(0)} nm`, xc, by0 - 0.5);

  // built-in field inside the depletion layer (points n -> p)
  for (let k = 0; k < 3; k += 1) {
    const yy = by0 + 78 + k * 0;
    arrow(dR - 3, by1 - 14, dL + 3, by1 - 14, 'rgba(255,209,102,0.85)', 2);
  }
  ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('E_internal', xc, by1 - 20);

  // contacts + battery; polarity and carrier flow follow the bias
  const cy = by1 + 60;
  ctx.strokeStyle = 'rgba(150,160,180,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx0, by1); ctx.lineTo(bx0, cy); ctx.lineTo(xc - 22, cy);
  ctx.moveTo(bx1, by1); ctx.lineTo(bx1, cy); ctx.lineTo(xc + 22, cy); ctx.stroke();
  const fwd = V > 0.02, rev = V < -0.02;
  // battery: long bar = +, short bar = -; + to p for forward bias
  const pPos = fwd;                                  // p terminal positive when forward
  const longL = pPos ? xc - 12 : xc + 12, shortL = pPos ? xc + 12 : xc - 12;
  ctx.strokeStyle = '#e8ebf2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(longL, cy - 13); ctx.lineTo(longL, cy + 13); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(shortL, cy - 8); ctx.lineTo(shortL, cy + 8); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(fwd ? 'forward: barrier low, current on'
    : rev ? 'reverse: barrier high, layer wide'
      : 'equilibrium: drift = diffusion', (RX0 + RX1) / 2, cy + 34);
  // carrier-flow arrows across the junction
  if (fwd) {
    const m = Math.min(1, V / 0.55);
    arrow(xc - 26, yA, xc + 26, yA, 'rgba(246,165,184,0.95)', 1.5 + 2 * m);   // holes -> n
    arrow(xc + 26, yA + 12, xc - 26, yA + 12, 'rgba(143,212,242,0.95)', 1.5 + 2 * m); // electrons -> p
  } else if (rev) {
    arrow(xc - 6, yA, xc + 6, yA, 'rgba(150,160,180,0.5)', 1);                // tiny drift only
  }

  // compact I-V inset with the operating point
  const ix0 = RX0 + 14, ix1 = RX1 - 10, iy0 = cy + 54, iy1 = RY1 - 4;
  const Vt = thermalVoltage(), vLo = -8 * Vt, vHi = 0.55;
  const iHi = diodeCurrentOverI0(vHi);
  const xOf = (v) => ix0 + (v - vLo) / (vHi - vLo) * (ix1 - ix0);
  const yOf = (ii) => iy1 - (ii + 1) / (iHi + 1) * (iy1 - iy0);
  ctx.strokeStyle = 'rgba(120,130,150,0.3)'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(ix0, yOf(0)); ctx.lineTo(ix1, yOf(0)); ctx.moveTo(xOf(0), iy0); ctx.lineTo(xOf(0), iy1); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const v = vLo + (i / 240) * (vHi - vLo);
    const X = xOf(v), Y = yOf(Math.min(iHi, diodeCurrentOverI0(v)));
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  const iop = diodeCurrentOverI0(V);
  ctx.fillStyle = '#06d6a0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(xOf(Math.max(vLo, Math.min(vHi, V))), yOf(Math.max(-1, Math.min(iHi, iop))), 5, 0, 2 * Math.PI);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('I-V  (I/I0)  operating point', (ix0 + ix1) / 2, H - 16);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawLeft();
  drawDevice();
  const { NA, ND, V } = params3();
  rVbi.textContent = `${builtInPotential(NA, ND).toFixed(3)} V`;
  rV.textContent = `${V.toFixed(2)} V`;
  rW.textContent = `${(depletionWidth(NA, ND, V) * 1e9).toFixed(1)} nm`;
  const i = diodeCurrentOverI0(V);
  rI.textContent = Math.abs(i) > 999 ? i.toExponential(1) : i.toFixed(2);
  rC.textContent = `${(junctionCapacitance(NA, ND, V) * 1e3).toFixed(2)} mF/m2`;
}

function syncLabels() { vV.textContent = st.V.toFixed(2); vNA.textContent = st.lna.toFixed(1); vND.textContent = st.lnd.toFixed(1); }
sV.addEventListener('input', () => { st.V = parseFloat(sV.value); syncLabels(); render(); });
sNA.addEventListener('input', () => { st.lna = parseFloat(sNA.value); syncLabels(); render(); });
sND.addEventListener('input', () => { st.lnd = parseFloat(sND.value); syncLabels(); render(); });
selView.addEventListener('change', () => { st.view = selView.value; render(); });
bR.addEventListener('click', () => {
  st.V = 0; st.lna = 22; st.lnd = 21.7; st.view = 'bands';
  sV.value = '0'; sNA.value = '22'; sND.value = '21.7'; selView.value = 'bands'; syncLabels(); render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.V = -8 + f * 8.6;                                 // reverse -> forward sweep
    sV.value = String(st.V); syncLabels();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); }, { once: true });
} else {
  bootSync();
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
