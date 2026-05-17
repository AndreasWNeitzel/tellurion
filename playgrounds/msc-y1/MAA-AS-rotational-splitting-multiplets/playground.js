// Rotational splitting of an asteroseismic multiplet. A degenerate mode
// of degree l splits into 2l+1 components at nu0 + m (1 - C_nl) Omega
// under rigid rotation. The view is the observed power spectrum: each
// component is a Lorentzian peak, summed into the spectrum you would
// actually measure. The frequency axis auto-scales to the multiplet
// half-width l (1 - C) Omega, so every component stays on screen for
// any l and Omega (the previous fixed +/-5 uHz axis clipped the outer
// components, which made the l slider look dead). The mode selector
// toggles the p-mode (C = 0, full m Omega splitting) and g-mode
// (C = 1/[l(l+1)], compressed) cases.
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology
// (2010), Sec. 3.8.

import { ledoux, splittedFreq } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const NU0 = 100;
const st = { Omega: 0.5, l: 2, isG: false }; let running = true;

sO.addEventListener('input', () => { st.Omega = parseFloat(sO.value); vO.textContent = st.Omega.toFixed(2); render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = st.l; render(); });
selM.addEventListener('change', () => { st.isG = selM.value === 'g'; render(); });
btnR.addEventListener('click', () => { st.Omega = 0.5; st.l = 2; st.isG = false; sO.value = '0.5'; sL.value = '2'; selM.value = 'p'; vO.textContent = '0.50'; vL.textContent = '2'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const pad = { l: 56, r: 28, t: 54, b: 56 };
  const x0 = pad.l, x1 = W - pad.r, yBase = H - pad.b, yTop = pad.t;
  const C = ledoux(st.l, st.isG);
  const split = (1 - C) * st.Omega;                       // uHz per unit m
  // Auto-scaled window framed on the rigid m*Omega comb (the C = 0
  // reference), so the window does not jump when toggling p/g and the
  // Ledoux contraction reads as the peaks pulling inward from it. Floor
  // keeps the Omega -> 0 degenerate case legible.
  const half = Math.max(1.0, st.l * st.Omega * 1.3);
  const nuMin = NU0 - half, nuMax = NU0 + half;
  const xOf = (nu) => x0 + (nu - nuMin) / (nuMax - nuMin) * (x1 - x0);

  // Component frequencies and a Lorentzian for each, summed into the
  // spectrum actually observed. Linewidth is a small fraction of the
  // window so peaks are sharp yet never sub-pixel.
  // p- and g-modes are distinct mode families (pressure vs buoyancy
  // cavity), so they carry a distinct colour as well as the Ledoux
  // contraction. Keeps the selector legible even where C is tiny.
  const TH = st.isG
    ? { fill: 'rgba(76,201,240,0.18)', line: '#4cc9f0', stem: 'rgba(76,201,240,0.55)' }
    : { fill: 'rgba(255,209,102,0.16)', line: '#ffd166', stem: 'rgba(255,209,102,0.55)' };
  const gamma = (nuMax - nuMin) / 150 + 1e-3;
  const comps = [];
  for (let m = -st.l; m <= st.l; m += 1) comps.push({ m, nu: splittedFreq(NU0, m, st.Omega, st.l, st.isG) });
  const power = (nu) => { let s = 0; for (const c of comps) { const d = (nu - c.nu) / gamma; s += 1 / (1 + d * d); } return s; };

  // Axis.
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, yBase); ctx.lineTo(x1, yBase); ctx.stroke();
  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  const nTick = 6;
  for (let k = 0; k <= nTick; k += 1) {
    const nu = nuMin + (nuMax - nuMin) * k / nTick, xx = xOf(nu);
    ctx.strokeStyle = '#20202a'; ctx.beginPath(); ctx.moveTo(xx, yTop); ctx.lineTo(xx, yBase); ctx.stroke();
    ctx.fillStyle = '#7e828a'; ctx.fillText(nu.toFixed(2), xx, yBase + 18);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.textAlign = 'right'; ctx.fillText('ν (μHz)', x1, H - 14);
  ctx.textAlign = 'center';
  ctx.save(); ctx.translate(16, (yTop + yBase) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('power', 0, 0); ctx.restore();
  ctx.textAlign = 'left';

  // nu0 reference (Omega = 0 limit, the unsplit degenerate frequency).
  ctx.strokeStyle = 'rgba(6,214,160,0.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOf(NU0), yTop - 6); ctx.lineTo(xOf(NU0), yBase); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ν₀ (Ω = 0)', xOf(NU0) + 5, yTop - 8);

  // Rigid m*Omega reference comb (Ledoux C = 0). The actual multiplet
  // sits on it for a p-mode and visibly contracts inward for a g-mode,
  // which is exactly what the Ledoux constant does. This makes the mode
  // selector perceptible at every l, not only where C is large.
  for (let m = -st.l; m <= st.l; m += 1) {
    if (m === 0) continue;
    const gx = xOf(NU0 + m * st.Omega);
    ctx.strokeStyle = 'rgba(120,128,150,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(gx, yTop + 8); ctx.lineTo(gx, yBase); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = '#7e828a'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('dashed: rigid m·Ω (C=0) reference', x0 + 6, yTop + 4);

  // Spectrum: filled blended profile then the comb of components.
  let pmax = 0;
  for (const c of comps) { const v = power(c.nu); if (v > pmax) pmax = v; }
  if (pmax <= 0) pmax = 1;
  ctx.beginPath(); ctx.moveTo(x0, yBase);
  for (let px = 0; px <= x1 - x0; px += 2) {
    const nu = nuMin + (nuMax - nuMin) * px / (x1 - x0);
    const y = yBase - (power(nu) / pmax) * (yBase - yTop) * 0.92;
    ctx.lineTo(x0 + px, y);
  }
  ctx.lineTo(x1, yBase); ctx.closePath();
  ctx.fillStyle = TH.fill; ctx.fill();
  ctx.strokeStyle = TH.line; ctx.lineWidth = 1.5; ctx.stroke();

  // Per-component stems and m labels.
  for (const c of comps) {
    const px = xOf(c.nu), pk = yBase - (power(c.nu) / pmax) * (yBase - yTop) * 0.92;
    ctx.strokeStyle = c.m === 0 ? '#06d6a0' : TH.stem;
    ctx.lineWidth = c.m === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(px, yBase); ctx.lineTo(px, pk); ctx.stroke();
    ctx.fillStyle = c.m === 0 ? '#06d6a0' : TH.line; ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.fillText(`m=${c.m}`, px, pk - 7); ctx.textAlign = 'left';
  }

  // delta-nu spacing annotation between m=0 and m=+1 when resolvable.
  if (st.l >= 1 && split > (nuMax - nuMin) / 60) {
    const a = xOf(NU0), b = xOf(NU0 + split), yA = yBase + 34;
    ctx.strokeStyle = '#cdd1d6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a, yA); ctx.lineTo(b, yA); ctx.stroke();
    for (const xx of [a, b]) { ctx.beginPath(); ctx.moveTo(xx, yA - 4); ctx.lineTo(xx, yA + 4); ctx.stroke(); }
    ctx.fillStyle = '#cdd1d6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`δν = ${split.toFixed(3)} μHz`, (a + b) / 2, yA - 6); ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`${st.isG ? 'g' : 'p'}-mode  ℓ=${st.l}  (2ℓ+1)=${2 * st.l + 1} components  Ledoux C=${C.toFixed(3)}  δν=${split.toFixed(3)} μHz`, 14, 26);
  rD.textContent = split.toFixed(3);
}

// The spectrum is static for fixed controls; sliders repaint via their
// own handlers. The rAF loop only keeps a redraw heartbeat and honours
// Pause, so there is no animation noise to mask the controls.
let rafOn = false;
function tick() { render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && !CAPTURE_NAME) { rafOn = true; requestAnimationFrame(tick); } }
btnP.addEventListener('click', startLoop);
btnR.addEventListener('click', startLoop);
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }
