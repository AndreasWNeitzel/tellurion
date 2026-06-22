import { gapAtT, Tc, gapZero } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
// Auto-sweep the temperature on load so the gap opening and closing through
// Tc plays without a click. Dragging the T slider sets userControlling,
// which pauses the sweep (tick skips the tRel update) so the slider still
// respects input; releasing it resumes. Play/Pause toggles the sweep.
let st = { N0V: 0.3, tRel: 0.3 }; let running = !(DETERMINISTIC || prefersReducedMotion()); let userControlling = false;
sN.addEventListener('input', () => { st.N0V = parseFloat(sN.value); vN.textContent = st.N0V.toFixed(2); render(); });
// Dragging T sets userControlling, which pauses the autoplay step in
// tick() (so it does not overwrite tRel). That also paused rendering, so
// the temperature slider looked frozen while dragged. Render directly
// here so it updates live.
sT.addEventListener('input', () => { userControlling = true; st.tRel = parseFloat(sT.value); vT.textContent = st.tRel.toFixed(2); render(); });
sT.addEventListener('change', () => { userControlling = false; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running));
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

  // Gap band width is proportional to the ABSOLUTE gap Delta(T, N0V) on
  // a fixed scale (max Delta0 over the N0V slider). Using Delta/Delta0
  // made the band the universal coupling-independent value, so the
  // coupling slider did nothing to it. Now stronger coupling visibly
  // widens the gap annulus.
  const D0_REF = gapZero(0.5);
  const gapAbs = gapAtT(tCur * Tc_v, st.N0V);
  const dAbs = Math.min(1, gapAbs / D0_REF);
  const bandW = 3 + 52 * dAbs;
  const cold = `rgba(140, 200, 255, ${0.10 + 0.55 * dAbs})`;
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
    const a = (p / 8) * Math.PI;          // static (no decorative churn)
    const x1 = cx + Rf * Math.cos(a), y1 = cy + Rf * Math.sin(a);
    const x2 = cx - Rf * Math.cos(a), y2 = cy - Rf * Math.sin(a);
    ctx.strokeStyle = `rgba(125, 211, 252, ${0.55 * pairAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = `rgba(255, 209, 102, ${0.4 + 0.6 * pairAlpha})`;
    ctx.beginPath(); ctx.arc(x1, y1, 3.5, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x2, y2, 3.5, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Fermi surface + gap band  (T/Tc = ${tCur.toFixed(2)}, Delta/Delta0 = ${dRel.toFixed(3)})`,
    14, 22);
  ctx.fillText(dRel < 0.02 ? 'NORMAL STATE (gap closed, pairs broken)' : 'SUPERCONDUCTING (Cooper pairs bound)',
    14, sceneH - 12);

  // SECONDARY: Delta(T) curve (bottom).
  const pad = { l: 56, r: 24, t: sceneH + 14, b: 34 };
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Δ(T)/Delta0', 10, pad.t - 4); ctx.fillText('T/Tc', W - 46, H - pad.b + 12);
  const xToPx = (t) => pad.l + t * (W - pad.l - pad.r);
  // 1.08 headroom so the flat Delta(T~0) ~ 1 segment does not graze the
  // panel boundary.
  const yToPx = (d) => H - pad.b - (d / 1.08) * (H - pad.t - pad.b);
  for (const yt of [0, 0.5, 1]) {
    const gy = yToPx(yt);
    ctx.strokeStyle = '#1b1b1f'; ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W - pad.r, gy); ctx.stroke();
    ctx.fillStyle = '#6b7077'; ctx.fillText(yt.toFixed(1), pad.l - 28, gy + 3);
  }
  ctx.fillStyle = '#6b7077'; ctx.fillText('1.0', xToPx(1) - 8, H - pad.b + 12);
  ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const t = i / 100;
    const d = gapAtT(t * Tc_v, st.N0V) / Delta0;
    if (i === 0) ctx.moveTo(xToPx(t), yToPx(d)); else ctx.lineTo(xToPx(t), yToPx(d));
  }
  ctx.stroke();
  // Bold full-height temperature cursor: dragging T sweeps it across the
  // curve, an unmistakable T response (the universal Delta/Delta0 curve
  // itself is coupling- and T-independent in shape, so without this the
  // T slider only nudged a small marker dot).
  const tx = xToPx(tCur);
  ctx.fillStyle = 'rgba(244,114,182,0.10)';
  ctx.fillRect(tx, pad.t, (W - pad.r) - tx, (H - pad.b) - pad.t);
  ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(tx, pad.t); ctx.lineTo(tx, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#f472b6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T/Tc = ${tCur.toFixed(2)}`, Math.min(tx + 4, W - pad.r - 78), pad.t + 12);
  ctx.beginPath(); ctx.arc(tx, yToPx(dRel), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`N(0)V=${st.N0V.toFixed(3)}  Tc=${Tc_v.toFixed(3)}  2Δ₀/kBTc=${(2 * Delta0 / Tc_v).toFixed(3)}`, 12, H - 8);
  rD.textContent = dRel.toFixed(3);
}

function tick() {
  if (running && !userControlling) {
    sweep += 0.01;
    st.tRel = 0.5 + 0.5 * Math.sin(sweep * 0.5);
    vT.textContent = st.tRel.toFixed(2);
    sT.value = String(st.tRel);
  }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // Sweep the reduced temperature so the five frames show the gap
    // closing from near-full down to zero through Tc.
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.tRel = 0.05 + frac * 1.0;
    sT.value = String(st.tRel); vT.textContent = st.tRel.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const gap = gapAtT(st.tRel, st.N0V);
  const Tcrit = Tc(st.N0V);
  return { fields: [
    { key: 'interaction-param', label: 'Interaction N0V', value: st.N0V, format: 'float' },
    { key: 'temp-relative', label: 'Temperature T/Tc', value: st.tRel, format: 'float' },
    { key: 'gap-value', label: 'Gap Delta(T)', value: gap, format: 'float' },
    { key: 'crit-temp', label: 'Critical Tc', value: Tcrit, format: 'float' },
  ]};
};
window.playground.getInvariants = function () {
  const gap = gapAtT(st.tRel, st.N0V);
  const gapZeroVal = gapZero(st.N0V);
  const gapDecreases = st.tRel > 0 && gap < gapZeroVal;
  return [{ key: 'gap-temperature-relation', label: 'Gap decreases with temperature', value: gapDecreases ? 'pass' : 'drift', status: gapDecreases ? 'pass' : 'drift' }];
};
