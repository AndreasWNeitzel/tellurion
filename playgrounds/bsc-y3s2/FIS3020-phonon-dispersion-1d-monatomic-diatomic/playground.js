import { monatomic, diatomic, gapAtZoneBoundary } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rG = document.getElementById('readout-g');
const sM1 = document.getElementById('slider-m1'), vM1 = document.getElementById('value-m1');
const sM2 = document.getElementById('slider-m2'), vM2 = document.getElementById('value-m2');
const sK = document.getElementById('slider-K'), vK = document.getElementById('value-K');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { m1: 1, m2: 2, K: 1 }; let running = true;
sM1.addEventListener('input', () => { st.m1 = parseFloat(sM1.value); vM1.textContent = st.m1.toFixed(2); });
sM2.addEventListener('input', () => { st.m2 = parseFloat(sM2.value); vM2.textContent = st.m2.toFixed(2); });
sK.addEventListener('input', () => { st.K = parseFloat(sK.value); vK.textContent = st.K.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ω(k)', 12, pad.t + 10); ctx.fillText('k a / π', W - 60, H - pad.b + 14);
  let omegaMax = 0;
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const d = diatomic(k, st.K, st.m1, st.m2);
    if (d.optical > omegaMax) omegaMax = d.optical;
  }
  const xToPx = (k) => pad.l + (k + Math.PI) / (2 * Math.PI) * (W - pad.l - pad.r);
  const yToPx = (o) => H - pad.b - o / omegaMax * (H - pad.t - pad.b);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const w = monatomic(k, st.K, (st.m1 + st.m2) / 2);
    if (i === -100) ctx.moveTo(xToPx(k), yToPx(w)); else ctx.lineTo(xToPx(k), yToPx(w));
  }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const d = diatomic(k, st.K, st.m1, st.m2);
    if (i === -100) ctx.moveTo(xToPx(k), yToPx(d.acoustic)); else ctx.lineTo(xToPx(k), yToPx(d.acoustic));
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI;
    const d = diatomic(k, st.K, st.m1, st.m2);
    if (i === -100) ctx.moveTo(xToPx(k), yToPx(d.optical)); else ctx.lineTo(xToPx(k), yToPx(d.optical));
  }
  ctx.stroke();
  const gap = gapAtZoneBoundary(st.K, st.m1, st.m2);
  ctx.strokeStyle = 'rgba(239,71,111,0.4)'; ctx.fillStyle = 'rgba(239,71,111,0.1)';
  ctx.fillRect(xToPx(Math.PI) - 4, yToPx(gap.high), 8, yToPx(gap.low) - yToPx(gap.high));
  ctx.fillStyle = '#ef476f'; ctx.fillText('GAP', xToPx(Math.PI) - 10, (yToPx(gap.high) + yToPx(gap.low)) / 2);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('Monatomic (dashed)', pad.l + 10, pad.t + 40);
  ctx.fillStyle = '#06d6a0'; ctx.fillText('Acoustic', pad.l + 10, pad.t + 56);
  ctx.fillStyle = '#ffd166'; ctx.fillText('Optical', pad.l + 10, pad.t + 72);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`m₁ = ${st.m1.toFixed(2)}, m₂ = ${st.m2.toFixed(2)}, K = ${st.K.toFixed(2)}`, 12, H - 14);
  rG.textContent = (gap.high - gap.low).toFixed(2);
}
// Upgrade A (Phase 13): a small animated lattice strip at the bottom shows
// the diatomic chain oscillating in the OPTICAL mode at zone boundary
// (m1, m2 move opposite, with amplitudes inversely proportional to mass).
// The animation frequency is the local optical frequency, scaled for visibility.
let _phase = 0;
function renderLattice() {
  if (!running) return;
  const W = canvas.width, H = canvas.height;
  const stripY = H - 28;
  const N = 14, dx = W / (N + 4), x0 = dx * 2;
  const gap = gapAtZoneBoundary(st.K, st.m1, st.m2);
  const omegaOpt = gap.high;
  _phase += 0.08 * omegaOpt;
  ctx.fillStyle = 'rgba(220,220,240,0.07)';
  ctx.fillRect(0, stripY - 14, W, 28);
  for (let i = 0; i < N; i += 1) {
    const isM1 = (i & 1) === 0;
    const amp = (isM1 ? 1 / st.m1 : -1 / st.m2) * 6;
    const x = x0 + i * dx + amp * Math.sin(_phase);
    ctx.fillStyle = isM1 ? '#7c9cff' : '#ffd57f';
    ctx.beginPath(); ctx.arc(x, stripY, isM1 ? 6 : 5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px sans-serif';
  ctx.fillText('Lattice (optical mode, zone boundary; m1 blue, m2 amber)', 12, stripY - 18);
}

function tick() { render(); renderLattice(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
