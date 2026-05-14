import { omegaK, modePosition } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rW = document.getElementById('readout-w');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const selV = document.getElementById('select-v');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { k: 1, A: 0.2, view: 'both', t: 0, N: 24 };
let running = true;
sK.addEventListener('input', () => { st.k = parseFloat(sK.value); vK.textContent = st.k.toFixed(2); });
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); });
selV.addEventListener('change', () => { st.view = selV.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function drawChain(mode, cy) {
  const pad = 40;
  const a = (canvas.width - 2 * pad) / st.N;
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(canvas.width - pad, cy); ctx.stroke();
  let prevX = null, prevY = null;
  for (let i = 0; i < st.N; i += 1) {
    const p = modePosition(i, st.t, mode, st.k, st.A, st.N);
    const x = pad + (i + p.x - i) * a;
    const y = cy - p.y * 80;
    ctx.fillStyle = mode === 'transverse' ? '#5bc0eb' : '#ffd166';
    ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fill();
    if (prevX !== null) {
      ctx.strokeStyle = 'rgba(154,160,166,0.4)'; ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(x, y); ctx.stroke();
    }
    prevX = x; prevY = y;
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(mode === 'transverse' ? 'Transverse: y displacement, x fixed' : 'Longitudinal: x displacement, y fixed', pad, cy - 100);
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (st.view === 'both') {
    drawChain('transverse', canvas.height / 3);
    drawChain('longitudinal', 2 * canvas.height / 3);
  } else if (st.view === 'trans') {
    drawChain('transverse', canvas.height / 2);
  } else {
    drawChain('longitudinal', canvas.height / 2);
  }
  const w = omegaK(st.k);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`k = ${st.k.toFixed(2)} (1/a), omega = ${w.toFixed(3)}`, 12, canvas.height - 12);
  rW.textContent = w.toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 1.5; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
