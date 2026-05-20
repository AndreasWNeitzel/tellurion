import { isothermalPressure, adiabaticPressure, adiabaticTemperature } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rP = document.getElementById('readout-p'), rT = document.getElementById('readout-t');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const selP = document.getElementById('select-p');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause'), btnRev = document.getElementById('btn-rev');
let st = { gamma: 1.4, T0: 300, V0: 1, P0_iso: 1, mode: 'both', V: 1, dir: 1, curve: 'both' };
let running = !prefersReducedMotion();

// Molecular gas inside the piston: NPART point particles bouncing in
// a rectangular cell whose right wall is the piston. Speeds scaled by
// sqrt(T) so the adiabatic-vs-isothermal temperature difference shows
// up as the particle speed difference. This adds the "simulation"
// the user asked for; the PV plot below it is the diagnostic.
const NPART = 90;
const partI = [], partA = [];
let _rng = 0xC0FFEE;
function rndN() { _rng = (Math.imul(_rng, 1664525) + 1013904223) >>> 0; return _rng / 4294967296; }
function seedParticles() {
  partI.length = 0; partA.length = 0;
  for (let i = 0; i < NPART; i += 1) {
    const a1 = rndN() * 2 * Math.PI, a2 = rndN() * 2 * Math.PI;
    partI.push({ x: rndN(), y: rndN(), vx: Math.cos(a1), vy: Math.sin(a1) });
    partA.push({ x: rndN(), y: rndN(), vx: Math.cos(a2), vy: Math.sin(a2) });
  }
}
seedParticles();
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
sT.addEventListener('input', () => { st.T0 = parseFloat(sT.value); vT.textContent = st.T0.toFixed(0); });
selP.addEventListener('change', () => { st.curve = selP.value; });
btnR.addEventListener('click', () => { st.V = 1; st.dir = 1; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnRev.addEventListener('click', () => { st.dir = -st.dir; });
let last = performance.now();
function mapV(V) { return 80 + (V - 0.25) / (2.5 - 0.25) * (canvas.width - 120); }
function mapP(P) { return canvas.height - 60 - (P - 0) / 4 * (canvas.height - 90); }
// Update one set of particles for one timestep (dt in s). For the
// adiabatic gas the speeds are rescaled by sqrt(Tadi/T0) before
// bouncing, so the kinetic energy tracks the adiabatic temperature.
// For isothermal the speeds are renormalized to sqrt(T0/T_inst) each
// step (the reservoir injects/removes heat).
function stepParticles(arr, vNorm, vScale, dt) {
  for (const p of arr) {
    p.x += p.vx * dt * 2.0;
    p.y += p.vy * dt * 2.0;
    if (p.x < 0) { p.x = 0; p.vx = -p.vx; }
    if (p.x > vNorm) { p.x = vNorm; p.vx = -p.vx; }
    if (p.y < 0) { p.y = 0; p.vy = -p.vy; }
    if (p.y > 1) { p.y = 1; p.vy = -p.vy; }
  }
  if (vScale && vScale !== 1) {
    for (const p of arr) { p.vx *= vScale; p.vy *= vScale; }
  }
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1; ctx.font = '11px ui-monospace, monospace';
  for (let v = 0.5; v <= 2.5; v += 0.5) {
    ctx.strokeStyle = '#262626'; ctx.beginPath(); ctx.moveTo(mapV(v), 20); ctx.lineTo(mapV(v), canvas.height - 50); ctx.stroke();
  }
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(80, 20); ctx.lineTo(80, canvas.height - 50); ctx.lineTo(canvas.width - 40, canvas.height - 50); ctx.stroke();
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('V (norm.)', canvas.width - 70, canvas.height - 30);
  ctx.fillText('P (norm.)', 20, 20);
  const showIso = st.curve === 'both' || st.curve === 'iso';
  const showAdi = st.curve === 'both' || st.curve === 'adi';
  if (showIso) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = 0.25; v <= 2.5; v += 0.01) {
      const P = 1 / v;
      const px = mapV(v), py = mapP(P);
      if (v <= 0.26) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  if (showAdi) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = 0.25; v <= 2.5; v += 0.01) {
      const P = Math.pow(1 / v, st.gamma);
      const px = mapV(v), py = mapP(P);
      if (v <= 0.26) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  const Piso = 1 / st.V;
  const Padi = Math.pow(1 / st.V, st.gamma);
  const Tiso = st.T0;
  const Tadi = adiabaticTemperature(st.V, 1, st.T0, st.gamma);
  if (showIso) {
    ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(mapV(st.V), mapP(Piso), 7, 0, 2 * Math.PI); ctx.fill();
  }
  if (showAdi) {
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(mapV(st.V), mapP(Padi), 7, 0, 2 * Math.PI); ctx.fill();
  }
  // Piston cylinders: TWO stacked rectangles, one isothermal (with
  // heat-reservoir bath stripes) and one adiabatic (with insulation
  // hatching), each containing a particle gas whose mean speed
  // tracks the corresponding temperature.
  const pistonX = 60, pistonW = canvas.width / 2 - 100, pistonH = 36;
  const pIsoY = 20, pAdiY = 64;
  const Vmin = 0.25, Vmax = 2.5, Vfrac = (st.V - Vmin) / (Vmax - Vmin);
  const wIso = pistonW * Math.min(1, st.V / 2.5);
  const wAdi = wIso;
  // Isothermal cylinder (cyan)
  if (showIso) {
    ctx.fillStyle = 'rgba(91, 192, 235, 0.10)';
    ctx.fillRect(pistonX, pIsoY, wIso, pistonH);
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.4;
    ctx.strokeRect(pistonX, pIsoY, wIso, pistonH);
    // Reservoir bath stripes below
    ctx.fillStyle = 'rgba(91, 192, 235, 0.20)';
    for (let xx = 0; xx < pistonW; xx += 8) ctx.fillRect(pistonX + xx, pIsoY + pistonH + 1, 4, 4);
    ctx.fillStyle = '#5bc0eb'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('isothermal (reservoir bath)', pistonX, pIsoY - 4);
  }
  // Adiabatic cylinder (yellow)
  if (showAdi) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.10)';
    ctx.fillRect(pistonX, pAdiY, wAdi, pistonH);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4;
    ctx.strokeRect(pistonX, pAdiY, wAdi, pistonH);
    // Insulation hatching above
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
    for (let xx = 0; xx < pistonW; xx += 6) {
      ctx.beginPath(); ctx.moveTo(pistonX + xx, pAdiY - 5); ctx.lineTo(pistonX + xx + 4, pAdiY - 1); ctx.stroke();
    }
    ctx.fillStyle = '#ffd166'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('adiabatic (insulated)', pistonX, pAdiY + pistonH + 12);
  }
  // Particle gas inside each cylinder; speed sets the dot brightness.
  const vNorm = wIso / pistonW;            // normalised piston cell width (0..1)
  // Isothermal: rescale speeds to keep <v^2> ~ T0 (renormalise each step).
  if (showIso) {
    // RMS speed before
    let sum2 = 0; for (const p of partI) sum2 += p.vx * p.vx + p.vy * p.vy;
    const rms = Math.sqrt(sum2 / partI.length) || 1;
    const target = 1.0;
    stepParticles(partI, vNorm, target / rms, 0.016);
    for (const p of partI) {
      const sp = Math.hypot(p.vx, p.vy);
      const alpha = 0.4 + 0.5 * Math.min(1, sp);
      ctx.fillStyle = `rgba(150, 220, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pistonX + p.x * pistonW, pIsoY + 4 + p.y * (pistonH - 8), 1.4, 0, 6.2832);
      ctx.fill();
    }
  }
  // Adiabatic: speeds reflect Tadi/T0 ratio
  if (showAdi) {
    const ratio = Math.sqrt(Tadi / st.T0);
    let sum2 = 0; for (const p of partA) sum2 += p.vx * p.vx + p.vy * p.vy;
    const rms = Math.sqrt(sum2 / partA.length) || 1;
    stepParticles(partA, vNorm, ratio / rms, 0.016);
    for (const p of partA) {
      const sp = Math.hypot(p.vx, p.vy);
      const alpha = 0.4 + 0.5 * Math.min(1, sp / 1.5);
      ctx.fillStyle = `rgba(255, 220, 130, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pistonX + p.x * pistonW, pAdiY + 4 + p.y * (pistonH - 8), 1.4, 0, 6.2832);
      ctx.fill();
    }
  }
  // Piston rod handles
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pistonX + wIso, pIsoY - 6); ctx.lineTo(pistonX + wIso, pAdiY + pistonH + 6); ctx.stroke();

  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`Iso: P = ${Piso.toFixed(2)}, T = ${Tiso.toFixed(0)} K`, 12, 130);
  ctx.fillStyle = '#ffd166'; ctx.fillText(`Adi: P = ${Padi.toFixed(2)}, T = ${Tadi.toFixed(0)} K`, 12, 148);
  ctx.fillStyle = '#9aa0a6'; ctx.fillText(`V = ${st.V.toFixed(2)}`, 12, 166);
  rP.textContent = (showAdi ? Padi : Piso).toFixed(2);
  rT.textContent = (showAdi ? Tadi : Tiso).toFixed(0) + ' K';
}
function tick(now) { const dt = (now - last) / 1000; last = now;
  if (running) {
    st.V += st.dir * dt * 0.5;
    if (st.V > 2.4) st.dir = -1;
    if (st.V < 0.3) st.dir = 1;
  }
  render(); requestAnimationFrame(tick); }
function bootSync() { st.V = 0.3 + CAPTURE_FRAC * 2.1; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
