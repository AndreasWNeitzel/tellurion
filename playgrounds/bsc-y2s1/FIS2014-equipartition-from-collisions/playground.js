import { init, step, meanKE, meanSpeed } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rKE = document.getElementById('readout-ke');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { N: 60, T: 0.5 };
let state = init(st.N, st.T, 0xC0FFEE);
let running = true, bins = 30, hist = new Float32Array(bins);
sN.addEventListener('input', () => { st.N = parseInt(sN.value); vN.textContent = st.N; state = init(st.N, st.T); });
sT.addEventListener('input', () => { st.T = parseFloat(sT.value); vT.textContent = st.T.toFixed(2); state = init(st.N, st.T); });
btnR.addEventListener('click', () => { state = init(st.N, st.T); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); hist.fill(0); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function updateHist() {
  hist.fill(0); const N = state.vel.length / 2; const sMax = 4 * Math.sqrt(2 * st.T);
  for (let i = 0; i < N; i += 1) {
    const sp = Math.hypot(state.vel[2 * i], state.vel[2 * i + 1]);
    const k = Math.min(bins - 1, Math.floor(sp / sMax * bins));
    hist[k] += 1;
  }
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const boxL = 40, boxT = 30, boxS = 380;
  ctx.strokeStyle = '#9aa0a6'; ctx.strokeRect(boxL, boxT, boxS, boxS);
  const N = state.pos.length / 2;
  for (let i = 0; i < N; i += 1) {
    const x = boxL + (state.pos[2 * i] + 0.5) * boxS;
    const y = boxT + (state.pos[2 * i + 1] + 0.5) * boxS;
    const sp = Math.hypot(state.vel[2 * i], state.vel[2 * i + 1]);
    const norm = Math.min(1, sp / (3 * Math.sqrt(2 * st.T)));
    ctx.fillStyle = `hsl(${220 - 200 * norm}, 70%, 60%)`;
    ctx.beginPath(); ctx.arc(x, y, state.r * boxS, 0, 2 * Math.PI); ctx.fill();
  }
  const hL = boxL + boxS + 30, hT = boxT, hW = canvas.width - hL - 30, hH = boxS;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(hL, hT + hH); ctx.lineTo(hL + hW, hT + hH); ctx.moveTo(hL, hT); ctx.lineTo(hL, hT + hH); ctx.stroke();
  const sMax = 4 * Math.sqrt(2 * st.T);
  let hMax = 0; for (let i = 0; i < bins; i += 1) hMax = Math.max(hMax, hist[i]); hMax = Math.max(hMax, 1);
  ctx.fillStyle = '#5bc0eb';
  for (let i = 0; i < bins; i += 1) {
    const x = hL + (i / bins) * hW;
    const h = (hist[i] / hMax) * hH;
    ctx.fillRect(x, hT + hH - h, hW / bins - 1, h);
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 100; i += 1) {
    const v = (i / 100) * sMax;
    const f = (v / st.T) * Math.exp(-v * v / (2 * st.T));
    const x = hL + (v / sMax) * hW;
    const fMax = 1 / Math.sqrt(st.T) * Math.exp(-0.5);
    const y = hT + hH - (f / fMax) * hH * 0.8;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('|v|', hL + hW / 2, hT + hH + 18);
  ctx.fillText(`<KE> = ${meanKE(state).toFixed(3)} (target T = ${st.T.toFixed(2)})`, 12, canvas.height - 12);
  rKE.textContent = meanKE(state).toFixed(3);
}
let last = performance.now();
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) { for (let k = 0; k < 5; k += 1) step(state, 0.002); updateHist(); } render(); requestAnimationFrame(tick); }
function bootSync() { for (let k = 0; k < CAPTURE_FRAC * 800; k += 1) step(state, 0.002); updateHist(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
