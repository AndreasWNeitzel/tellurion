import { resonanceSemiMajor, periodRatio, KIRKWOOD_RATIOS } from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { aJ: 5.2 }; let running = true;
sA.addEventListener('input', () => { st.aJ = parseFloat(sA.value); vA.textContent = st.aJ.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 50, b: 50 };
  const aMin = 1, aMax = 5.5;
  const xToPx = (a) => pad.l + (a - aMin) / (aMax - aMin) * (W - pad.l - pad.r);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('a (AU)', W - 50, H - pad.b + 14);
  // Asteroid dots: rng-determined, with gap at resonance.
  const rng = makeRng(0xC0FFEE);
  const N = 2000;
  for (let i = 0; i < N; i += 1) {
    const a = aMin + rng() * (aMax - aMin);
    let near = false;
    for (const K of KIRKWOOD_RATIOS) {
      const a_res = resonanceSemiMajor(st.aJ, K.p, K.q);
      if (Math.abs(a - a_res) < 0.05) near = true;
    }
    if (near && rng() < 0.85) continue; // gap.
    if (a < 2 || a > 3.7) continue; // restrict belt.
    const y = pad.t + 30 + rng() * (H - pad.t - pad.b - 50);
    ctx.fillStyle = 'rgba(255,209,102,0.6)';
    ctx.fillRect(xToPx(a), y, 1.5, 1.5);
  }
  // Resonance lines.
  for (const K of KIRKWOOD_RATIOS) {
    const a_res = resonanceSemiMajor(st.aJ, K.p, K.q);
    if (a_res < aMin || a_res > aMax) continue;
    ctx.strokeStyle = '#ef476f'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xToPx(a_res), pad.t); ctx.lineTo(xToPx(a_res), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(K.ratio, xToPx(a_res) - 8, pad.t + 14);
    ctx.fillText(`${a_res.toFixed(2)}`, xToPx(a_res) - 14, pad.t + 28);
  }
  // Jupiter marker.
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(xToPx(st.aJ), H - pad.b - 10, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.font = '12px ui-monospace, monospace'; ctx.fillText('Jupiter', xToPx(st.aJ) - 22, H - pad.b - 24);
  ctx.fillStyle = '#9aa0a6'; ctx.fillText(`a_Jupiter = ${st.aJ.toFixed(2)} AU`, 12, H - 14);
  rR.textContent = `${resonanceSemiMajor(st.aJ, 2, 1).toFixed(2)} AU`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
