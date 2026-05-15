import { gapAtT, Tc, gapZero } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { N0V: 0.3, tRel: 0.3 }; let running = true;
sN.addEventListener('input', () => { st.N0V = parseFloat(sN.value); vN.textContent = st.N0V.toFixed(2); });
sT.addEventListener('input', () => { st.tRel = parseFloat(sT.value); vT.textContent = st.tRel.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let sweep = 0;     // autoplay temperature sweep phase
function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const Tc_v = Tc(st.N0V);
  const Delta0 = gapZero(st.N0V);
  const tCur = Math.min(st.tRel, 1.05);
  const dRel = gapAtT(tCur * Tc_v, st.N0V) / Delta0;   // Delta(T)/Delta0 in [0,1]

  // PRIMARY: Fermi-surface panel (top 62%).
  const sceneH = H * 0.62;
  const cx = W / 2, cy = sceneH / 2;
  const Rf = Math.min(W, sceneH) * 0.32;

  // Gap band: an annulus of half-width proportional to Delta(T).
  const bandW = 4 + 46 * dRel;
  const cold = `rgba(140, 200, 255, ${0.10 + 0.5 * dRel})`;
  ctx.strokeStyle = cold;
  ctx.lineWidth = bandW;
  ctx.beginPath(); ctx.arc(cx, cy, Rf, 0, 2 * Math.PI); ctx.stroke();
  // Fermi circle itself.
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, Rf, 0, 2 * Math.PI); ctx.stroke();

  // 8 Cooper pairs: dots at +k and -k joined by a faint glowing line.
  // Lines fade with the gap and vanish above Tc.
  const pairAlpha = Math.max(0, dRel);
  for (let p = 0; p < 8; p += 1) {
    const a = (p / 8) * Math.PI + sweep * 0.15;
    const x1 = cx + Rf * Math.cos(a), y1 = cy + Rf * Math.sin(a);
    const x2 = cx - Rf * Math.cos(a), y2 = cy - Rf * Math.sin(a);
    ctx.strokeStyle = `rgba(125, 211, 252, ${0.55 * pairAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = `rgba(255, 209, 102, ${0.4 + 0.6 * pairAlpha})`;
    ctx.beginPath(); ctx.arc(x1, y1, 3.5, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x2, y2, 3.5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Fermi surface + gap band  (T/Tc = ${tCur.toFixed(2)}, Delta/Delta0 = ${dRel.toFixed(3)})`,
    14, 22);
  ctx.fillText(dRel < 0.02 ? 'NORMAL STATE (gap closed, pairs broken)' : 'SUPERCONDUCTING (Cooper pairs bound)',
    14, sceneH - 12);

  // SECONDARY: Delta(T) curve (bottom).
  const pad = { l: 56, r: 24, t: sceneH + 14, b: 34 };
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Delta(T)/Delta0', 10, pad.t + 10); ctx.fillText('T/Tc', W - 50, H - pad.b + 12);
  const xToPx = (t) => pad.l + t * (W - pad.l - pad.r);
  const yToPx = (d) => H - pad.b - d * (H - pad.t - pad.b);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    const d = gapAtT(t * Tc_v, st.N0V) / Delta0;
    if (i === 0) ctx.moveTo(xToPx(t), yToPx(d)); else ctx.lineTo(xToPx(t), yToPx(d));
  }
  ctx.stroke();
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(xToPx(tCur), yToPx(dRel), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`N(0)V=${st.N0V.toFixed(2)}  2Delta0/kTc=${(2 * Delta0 / Tc_v).toFixed(3)}`, 12, H - 8);
  rD.textContent = dRel.toFixed(3);
}

function tick() {
  if (running) {
    // Autoplay: slowly sweep temperature up and back so the gap opens and
    // closes without user input (Q1).
    sweep += 0.01;
    st.tRel = 0.5 + 0.5 * Math.sin(sweep * 0.5);
    vT.textContent = st.tRel.toFixed(2);
    sT.value = String(st.tRel);
  }
  render();
  requestAnimationFrame(tick);
}
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
