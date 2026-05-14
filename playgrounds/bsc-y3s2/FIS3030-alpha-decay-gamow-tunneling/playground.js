import { geigerNuttallLogT, gamowExponent } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rT = document.getElementById('readout-t');
const sZ = document.getElementById('slider-Z'), vZ = document.getElementById('value-Z');
const sQ = document.getElementById('slider-Q'), vQ = document.getElementById('value-Q');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Z: 90, Q: 4.5 }; let running = true;
sZ.addEventListener('input', () => { st.Z = parseInt(sZ.value); vZ.textContent = st.Z; });
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value); vQ.textContent = st.Q.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  // Left panel: barrier.
  const lpW = W / 2 - 50;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(pad.l + lpW, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('V(r)', 12, pad.t + 10); ctx.fillText('r', pad.l + lpW - 10, H - pad.b + 14);
  const rmax = 30, vmax = 30;
  const xToPx = (r) => pad.l + (r / rmax) * lpW;
  const yToPx = (v) => H - pad.b - (v / vmax) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const r = rmax * i / 200;
    const V = r < 7 ? -30 : Math.min(vmax * 0.9, 1.44 * (st.Z + 2) / r);
    const py = yToPx(V);
    if (i === 0) ctx.moveTo(xToPx(r), py); else ctx.lineTo(xToPx(r), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(pad.l, yToPx(st.Q)); ctx.lineTo(pad.l + lpW, yToPx(st.Q)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`Q = ${st.Q.toFixed(2)} MeV`, pad.l + lpW - 110, yToPx(st.Q) - 4);
  ctx.fillStyle = '#ffd166'; ctx.fillText(`Coulomb barrier`, pad.l + 30, pad.t + 28);
  // Right panel: Geiger-Nuttall.
  const rpL = W / 2 + 30;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(rpL, pad.t); ctx.lineTo(rpL, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('log10 T_{1/2} (s)', rpL - 50, pad.t + 10);
  ctx.fillText('Q^{-1/2} (MeV^{-1/2})', W - 160, H - pad.b + 14);
  const x2ToPx = (q) => rpL + (q - 0.25) / 0.75 * (W - rpL - pad.r);
  let lmin = Infinity, lmax = -Infinity;
  for (let i = 1; i < 20; i += 1) {
    const Q = i * 0.7;
    const l = geigerNuttallLogT(st.Z, Q);
    if (l < lmin) lmin = l; if (l > lmax) lmax = l;
  }
  const y2ToPx = (l) => H - pad.b - (l - lmin) / (lmax - lmin) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const Q = 1 + 11 * i / 200;
    const Qm = 1 / Math.sqrt(Q);
    const l = geigerNuttallLogT(st.Z, Q);
    const px = x2ToPx(Qm), py = y2ToPx(l);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const QCur = st.Q, QmCur = 1 / Math.sqrt(QCur), lCur = geigerNuttallLogT(st.Z, QCur);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(x2ToPx(QmCur), y2ToPx(lCur), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Z = ${st.Z}, Q = ${st.Q.toFixed(2)} MeV → T_{1/2} ≈ 10^${lCur.toFixed(1)} s`, 12, H - 14);
  rT.textContent = `10^${lCur.toFixed(1)} s`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
