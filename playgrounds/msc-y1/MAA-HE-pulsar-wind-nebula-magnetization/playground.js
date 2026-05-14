import { terminationRadius, sigma_M, CRAB_L } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const sP = document.getElementById('slider-P'), vP = document.getElementById('value-P');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logL: 38.7, logP: -9, sigma: 0.003, t: 0 }; let running = true;
sL.addEventListener('input', () => { st.logL = parseFloat(sL.value); vL.textContent = st.logL.toFixed(1); });
sP.addEventListener('input', () => { st.logP = parseFloat(sP.value); vP.textContent = st.logP.toFixed(1); });
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(3); });
btnR.addEventListener('click', () => { st.logL = 38.7; st.logP = -9; st.sigma = 0.003; sL.value = 38.7; sP.value = -9; sS.value = 0.003; vL.textContent = '38.7'; vP.textContent = '-9.0'; vS.textContent = '0.003'; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const L = Math.pow(10, st.logL), Pext = Math.pow(10, st.logP);
  const PC = 3.086e18;
  const R_TS_pc = terminationRadius(L, Pext) / PC;
  const R_TS_px = Math.min(200, R_TS_pc / 0.3 * 200);
  // Pulsar.
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI); ctx.fill();
  // Wind region.
  for (let r = 10; r < R_TS_px; r += 1) {
    ctx.strokeStyle = `rgba(91,192,235,${0.06 * (1 - r / R_TS_px)})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
  }
  // Termination shock.
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R_TS_px, 0, 2 * Math.PI); ctx.stroke();
  // Post-shock nebula.
  for (let r = R_TS_px; r < R_TS_px + 60; r += 1) {
    const sigma_eff = Math.min(1, st.sigma);
    const cR = 255, cG = Math.floor(120 + 80 * sigma_eff), cB = Math.floor(60 + 100 * sigma_eff);
    ctx.strokeStyle = `rgba(${cR},${cG},${cB},${0.05 * (1 - (r - R_TS_px) / 60)})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`R_TS = ${R_TS_pc.toFixed(3)} pc`, 12, 20);
  ctx.fillText(`σ = ${st.sigma.toFixed(4)} ${st.sigma < 0.1 ? '(particle-dominated)' : '(magnetically dominated)'}`, 12, 38);
  ctx.fillText(`Crab: R_TS ~ 0.1 pc, σ ~ 0.003`, 12, canvas.height - 14);
  rR.textContent = `${R_TS_pc.toFixed(3)} pc`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
