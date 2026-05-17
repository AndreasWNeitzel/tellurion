// Allowed beta decay: selection rules (Fermi vs Gamow-Teller) on the
// left, and on the right the actual continuous beta spectrum
// N(E) = F(Z,E) p Etot (Q - E)^2 with its Kurie linearisation
// sqrt(N / p^2 F Etot) ~ (Q - E). The old Kurie plot normalised BOTH
// axes by Q, so the endpoint slider changed nothing; here the energy
// axis is fixed (0..2200 keV) so raising Q visibly pushes the spectrum
// endpoint and the Kurie x-intercept outward, which is exactly how Q
// (and a neutrino-mass limit) is read off a real Kurie plot.
// Reference: Krane, Introductory Nuclear Physics (1988), Ch. 9.

import { transitionType, kurie, betaSpectrum } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rT = document.getElementById('readout-t');
const sJi = document.getElementById('slider-ji'), vJi = document.getElementById('value-ji');
const sJf = document.getElementById('slider-jf'), vJf = document.getElementById('value-jf');
const selP = document.getElementById('select-p');
const sQ = document.getElementById('slider-Q'), vQ = document.getElementById('value-Q');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { Ji: 0.5, Jf: 0.5, dPi: 0, Q: 1000 };
const st = { ...DEF }; let running = true;
const EMAX = 2200;

function jLabel(v) { return v % 1 === 0 ? `${v}` : `${v * 2}/2`; }
sJi.addEventListener('input', () => { st.Ji = parseInt(sJi.value, 10) / 2; vJi.textContent = jLabel(st.Ji); render(); });
sJf.addEventListener('input', () => { st.Jf = parseInt(sJf.value, 10) / 2; vJf.textContent = jLabel(st.Jf); render(); });
selP.addEventListener('change', () => { st.dPi = parseInt(selP.value, 10); render(); });
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value); vQ.textContent = st.Q; render(); });
btnR.addEventListener('click', () => { Object.assign(st, DEF); sJi.value = '1'; sJf.value = '1'; selP.value = '0'; sQ.value = '1000'; vJi.textContent = '1/2'; vJf.textContent = '1/2'; vQ.textContent = '1000'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

function plotAxes(x0, x1, yb, yt, xlabel, ylabel) {
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(x0, yt); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  ctx.fillStyle = '#7e828a'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  for (let E = 0; E <= EMAX; E += 500) { const xx = x0 + E / EMAX * (x1 - x0); ctx.fillText(`${E}`, xx, yb + 14); }
  ctx.fillText(xlabel, (x0 + x1) / 2, yb + 28);
  ctx.textAlign = 'left'; ctx.fillStyle = '#9aa0a6'; ctx.fillText(ylabel, x0 + 2, yt - 6);
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const type = transitionType(st.Ji, st.Jf, st.dPi);
  const color = type === 'Fermi (pure)' ? '#ffd166' : type === 'GT (pure)' ? '#5bc0eb' : type === 'Mixed' ? '#06d6a0' : '#ef476f';

  // Left: selection-rule classifier.
  ctx.fillStyle = '#9aa0a6'; ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`J_i = ${jLabel(st.Ji)}  →  J_f = ${jLabel(st.Jf)}`, 34, 60);
  ctx.fillText(`ΔJ = ${st.Jf - st.Ji}`, 34, 88);
  ctx.fillText(`Δπ = ${st.dPi === 0 ? 'no' : 'yes'}`, 34, 116);
  ctx.font = '12px ui-monospace, monospace'; ctx.fillStyle = '#7e828a';
  ctx.fillText('Fermi: ΔJ=0, no Δπ', 34, 160);
  ctx.fillText('GT: ΔJ=0,±1 (not 0→0), no Δπ', 34, 180);
  ctx.font = '19px ui-monospace, monospace'; ctx.fillStyle = color;
  ctx.fillText(type, 34, 230);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Q = ${st.Q.toFixed(0)} keV`, 34, H - 26);

  const x0 = 372, x1 = W - 24;
  const xOfE = (E) => x0 + Math.min(EMAX, E) / EMAX * (x1 - x0);

  if (type === 'Forbidden') {
    ctx.fillStyle = '#ef476f'; ctx.font = '15px ui-monospace, monospace';
    ctx.fillText('No allowed transition', x0 + 40, H / 2);
    rT.textContent = type; return;
  }

  // Top: beta spectrum N(E).
  const sYb = 196, sYt = 44;
  plotAxes(x0, x1, sYb, sYt, 'E_e (keV)', 'N(E)  electron spectrum');
  let nmax = 1e-30;
  for (let E = 0; E <= st.Q; E += st.Q / 200) { const v = betaSpectrum(E, st.Q); if (v > nmax) nmax = v; }
  ctx.beginPath(); ctx.moveTo(xOfE(0), sYb);
  for (let i = 0; i <= 240; i += 1) { const E = EMAX * i / 240; const y = sYb - betaSpectrum(E, st.Q) / nmax * (sYb - sYt); ctx.lineTo(xOfE(E), Math.max(sYt, y)); }
  ctx.lineTo(xOfE(EMAX), sYb); ctx.closePath();
  ctx.fillStyle = color + '24'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();

  // Bottom: Kurie plot, linear with x-intercept at Q.
  const kYb = 432, kYt = 268;
  plotAxes(x0, x1, kYb, kYt, 'E_e (keV)', 'Kurie √(N / p²F Eₜₒₜ)  ∝  (Q − E)');
  const kmax = EMAX;
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(xOfE(0), kYb - kurie(0, st.Q) / kmax * (kYb - kYt));
  ctx.lineTo(xOfE(st.Q), kYb);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(xOfE(st.Q), kYb); ctx.lineTo(xOfE(st.Q), kYt); ctx.stroke(); ctx.setLineDash([]);

  // Q endpoint marker across both plots.
  ctx.strokeStyle = 'rgba(239,71,111,0.6)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOfE(st.Q), sYt); ctx.lineTo(xOfE(st.Q), sYb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`Q = ${st.Q.toFixed(0)}`, Math.min(xOfE(st.Q) + 5, x1 - 60), sYt + 12);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(xOfE(st.Q), kYb, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('endpoint: Kurie line hits zero at E = Q', x0 + 4, kYb + 42);

  rT.textContent = type;
}

let rafOn = false;
function tick() { render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; requestAnimationFrame(tick); } }
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }
