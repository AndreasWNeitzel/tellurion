import { rk4Orbit, miyamotoPotential, G_SI } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const sVz = document.getElementById('slider-vz'), vVz = document.getElementById('value-vz');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { R0: 8, vR: 0, vz: 40 };
let state, trail = [], running = true;
const kpc = 3.086e19, M = 5e40, a = 3 * kpc, b = 0.3 * kpc;
function reset() { state = [st.R0 * kpc, 0, st.vR * 1000, st.vz * 1000]; trail = []; }
reset();
sR.addEventListener('input', () => { st.R0 = parseFloat(sR.value); vR.textContent = st.R0.toFixed(1); reset(); });
sV.addEventListener('input', () => { st.vR = parseFloat(sV.value); vV.textContent = st.vR; reset(); });
sVz.addEventListener('input', () => { st.vz = parseFloat(sVz.value); vVz.textContent = st.vz; reset(); });
btnR.addEventListener('click', () => { reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function step() { for (let k = 0; k < 5; k += 1) state = rk4Orbit(state, 5e13, M, a, b); trail.push([state[0], state[1]]); if (trail.length > 1500) trail.shift(); }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 12;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  ctx.moveTo(20, cy); ctx.lineTo(canvas.width - 20, cy);
  ctx.moveTo(cx, 20); ctx.lineTo(cx, canvas.height - 20); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('R (kpc)', canvas.width - 60, cy + 18); ctx.fillText('z (kpc)', cx + 6, 30);
  // Disk schematic.
  ctx.strokeStyle = 'rgba(91,192,235,0.3)'; ctx.lineWidth = 1;
  for (let r = 2; r < 30; r += 5) {
    ctx.beginPath(); ctx.arc(cx, cy, r * scale, 0, 2 * Math.PI); ctx.stroke();
  }
  // Trail.
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  trail.forEach((pt, i) => {
    const px = cx + pt[0] / kpc * scale, py = cy - pt[1] / kpc * scale;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(cx + state[0] / kpc * scale, cy - state[1] / kpc * scale, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`R = ${(state[0] / kpc).toFixed(1)} kpc, z = ${(state[1] / kpc).toFixed(2)} kpc, |v| = ${Math.hypot(state[2], state[3]).toFixed(0)} m/s`, 12, canvas.height - 12);
  rR.textContent = `R=${(state[0] / kpc).toFixed(1)}, z=${(state[1] / kpc).toFixed(2)}`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) for (let i = 0; i < 4; i += 1) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < 400; i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
