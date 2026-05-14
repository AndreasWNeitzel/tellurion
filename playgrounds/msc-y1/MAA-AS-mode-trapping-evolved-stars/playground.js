import { deltaP, modePeriods } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Pi: 80, A: 0.2, Ptrap: 350 }; let running = true;
sP.addEventListener('input', () => { st.Pi = parseFloat(sP.value); vP.textContent = st.Pi.toFixed(0); });
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); });
sT.addEventListener('input', () => { st.Ptrap = parseFloat(sT.value); vT.textContent = st.Ptrap.toFixed(0); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ΔP (s)', 12, pad.t + 10); ctx.fillText('P (s)', W - 30, H - pad.b + 14);
  const Pmin = 500, Pmax = 2500;
  const xToPx = (p) => pad.l + (p - Pmin) / (Pmax - Pmin) * (W - pad.l - pad.r);
  const dPmin = st.Pi * (1 - st.A) * 0.95, dPmax = st.Pi * (1 + st.A) * 1.05;
  const yToPx = (d) => H - pad.b - (d - dPmin) / (dPmax - dPmin) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) {
    const P = Pmin + (Pmax - Pmin) * i / 400;
    const dP = deltaP(P, st.Pi, st.A, st.Ptrap);
    const px = xToPx(P), py = yToPx(dP);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Observable mode markers (the actual periods).
  const N = 30;
  const ps = modePeriods(N, st.Pi, st.A, st.Ptrap, Pmin);
  ctx.fillStyle = '#5bc0eb';
  for (let i = 1; i < ps.length; i += 1) {
    const dP = ps[i] - ps[i - 1];
    const P_avg = (ps[i] + ps[i - 1]) / 2;
    if (P_avg < Pmin || P_avg > Pmax) continue;
    ctx.beginPath(); ctx.arc(xToPx(P_avg), yToPx(dP), 5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.strokeStyle = '#06d6a0'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(pad.l, yToPx(st.Pi)); ctx.lineTo(W - pad.r, yToPx(st.Pi)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.fillText(`Π_1 = ${st.Pi.toFixed(0)} s`, W - 140, yToPx(st.Pi) - 4);
  let rms = 0;
  for (let i = 0; i < 400; i += 1) { const P = Pmin + (Pmax - Pmin) * i / 400; rms += Math.pow(deltaP(P, st.Pi, st.A, st.Ptrap) - st.Pi, 2); }
  rms = Math.sqrt(rms / 400);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`ΔP modulation: rms = ${rms.toFixed(2)} s, A = ${st.A.toFixed(2)}, P_trap = ${st.Ptrap.toFixed(0)} s`, 12, H - 14);
  rR.textContent = `${rms.toFixed(2)} s`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
