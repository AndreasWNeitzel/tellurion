import { rk4, angularMomentum, energy } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rL = document.getElementById('readout-l');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { eps: 0, v0: 0.8 };
let state, trail = [], lHist = [], eHist = [], L0, E0, running = true;
function reset() { state = [1, 0, 0, st.v0]; L0 = angularMomentum(state); E0 = energy(state, st.eps); trail = []; lHist = []; eHist = []; }
reset();
sE.addEventListener('input', () => { st.eps = parseFloat(sE.value); vE.textContent = st.eps.toFixed(2); reset(); });
sV.addEventListener('input', () => { st.v0 = parseFloat(sV.value); vV.textContent = st.v0.toFixed(2); reset(); });
btnR.addEventListener('click', () => { reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function step() {
  for (let i = 0; i < 5; i += 1) state = rk4(state, 0.01, st.eps);
  trail.push([state[0], state[1]]); if (trail.length > 1200) trail.shift();
  lHist.push(angularMomentum(state)); if (lHist.length > 400) lHist.shift();
  eHist.push(energy(state, st.eps)); if (eHist.length > 400) eHist.shift();
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const cx = W / 4, cy = H / 2, sc = 80;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  ctx.moveTo(cx - 130, cy); ctx.lineTo(cx + 130, cy); ctx.moveTo(cx, cy - 130); ctx.lineTo(cx, cy + 130); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5; ctx.beginPath();
  trail.forEach((pt, i) => { const px = cx + pt[0] * sc, py = cy - pt[1] * sc; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
  ctx.stroke();
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(cx + state[0] * sc, cy - state[1] * sc, 6, 0, 2 * Math.PI); ctx.fill();
  const x0 = W / 2 + 20, y0 = 60, wp = W / 2 - 40, hp = (H - 100) / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + hp); ctx.lineTo(x0 + wp, y0 + hp); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('L_z(t)', x0 + 4, y0 + 12);
  let lMin = Math.min(...lHist, L0), lMax = Math.max(...lHist, L0);
  if (lMax - lMin < 0.1) { lMin -= 0.05; lMax += 0.05; }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  lHist.forEach((v, i) => { const px = x0 + i / lHist.length * wp; const py = y0 + hp - (v - lMin) / (lMax - lMin) * (hp - 14); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(x0, y0 + hp - (L0 - lMin) / (lMax - lMin) * (hp - 14)); ctx.lineTo(x0 + wp, y0 + hp - (L0 - lMin) / (lMax - lMin) * (hp - 14)); ctx.stroke();
  ctx.setLineDash([]);
  const y1 = y0 + hp + 30;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y1 + hp); ctx.lineTo(x0 + wp, y1 + hp); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('E(t)', x0 + 4, y1 + 12);
  let eMin = Math.min(...eHist, E0), eMax = Math.max(...eHist, E0);
  if (eMax - eMin < 0.1) { eMin -= 0.05; eMax += 0.05; }
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  eHist.forEach((v, i) => { const px = x0 + i / eHist.length * wp; const py = y1 + hp - (v - eMin) / (eMax - eMin) * (hp - 14); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
  ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L_z = ${angularMomentum(state).toFixed(3)} (initial ${L0.toFixed(3)})`, 12, H - 30);
  ctx.fillText(`ε = ${st.eps.toFixed(2)} ${st.eps === 0 ? '(symmetric)' : '(broken)'}`, 12, H - 12);
  rL.textContent = angularMomentum(state).toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < CAPTURE_FRAC * 800; i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
window.playground.getState = function () {
  if (state === undefined) return { fields: [] };
  return {
    fields: [
      { key: 'epsilon', label: 'symmetry breaking $\\varepsilon$', value: st.eps, format: 'float' },
      { key: 'angular-momentum', label: 'angular momentum $L$', value: angularMomentum(state), format: 'float' },
      { key: 'energy', label: 'energy $E$', value: energy(state, st.eps), format: 'float' },
    ],
  };
};
// Noether: time-translation symmetry gives energy conservation, and
// the potential here is time-independent, so energy is conserved
// whatever the rotational-symmetry-breaking parameter does to the
// angular momentum.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      if (state === undefined || E0 === undefined) return [];
      const E = energy(state, st.eps);
      if (!Number.isFinite(E)) return [];
      const dE = Math.abs(E - E0) / Math.max(1e-12, Math.abs(E0));
      return [{
        key: 'energy',
        label: 'energy conserved (time-translation symmetry)',
        value: dE.toExponential(2),
        status: dE < 2e-3 ? 'pass' : (dE < 2e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
