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
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
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

function drawIV() {
  const { NA, ND, V } = params3();
  const Vt = thermalVoltage();
  const vLo = -8 * Vt, vHi = 0.55;
  const iAt = (v) => diodeCurrentOverI0(v);
  const iHi = iAt(vHi);
  const xOf = (v) => RX0 + (v - vLo) / (vHi - vLo) * (RX1 - RX0);
  const yOf = (i) => RY1 - (i + 1) / (iHi + 1) * (RY1 - RY0);
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(RX0, RY0); ctx.lineTo(RX0, RY1); ctx.lineTo(RX1, RY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('I-V (I in units of I0)', (RX0 + RX1) / 2, H - 16);
  // axes through I=0
  ctx.strokeStyle = 'rgba(120,130,150,0.3)'; ctx.beginPath();
  ctx.moveTo(RX0, yOf(0)); ctx.lineTo(RX1, yOf(0));
  ctx.moveTo(xOf(0), RY0); ctx.lineTo(xOf(0), RY1); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.4; ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 300; i += 1) {
    const v = vLo + (i / 300) * (vHi - vLo);
    const X = xOf(v), Y = yOf(Math.min(iHi, iAt(v)));
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  // operating point
  const iop = iAt(V);
  ctx.fillStyle = '#06d6a0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(xOf(Math.max(vLo, Math.min(vHi, V))), yOf(Math.max(-1, Math.min(iHi, iop))), 6, 0, 2 * Math.PI);
  ctx.fill(); ctx.stroke();
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawLeft();
  drawIV();
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
