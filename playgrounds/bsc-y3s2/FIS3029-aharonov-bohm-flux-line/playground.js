import { intensity } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rP = document.getElementById('readout-p');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { phi: 0 }; let running = true;
sP.addEventListener('input', () => { st.phi = parseFloat(sP.value); vP.textContent = st.phi.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cy = canvas.height / 2;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('source', 30, cy - 90);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(50, cy, 6, 0, 2 * Math.PI); ctx.fill();
  // Two slits.
  const slit_x = 200, slit_y1 = cy - 50, slit_y2 = cy + 50;
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(slit_x, 100); ctx.lineTo(slit_x, slit_y1 - 8); ctx.moveTo(slit_x, slit_y1 + 8); ctx.lineTo(slit_x, slit_y2 - 8); ctx.moveTo(slit_x, slit_y2 + 8); ctx.lineTo(slit_x, canvas.height - 100); ctx.stroke();
  // Paths to screen.
  const screen_x = canvas.width - 100;
  ctx.strokeStyle = 'rgba(91,192,235,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(slit_x, slit_y1); ctx.lineTo(screen_x, cy);
  ctx.moveTo(slit_x, slit_y2); ctx.lineTo(screen_x, cy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc((slit_x + screen_x) / 2, cy, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('solenoid Φ', (slit_x + screen_x) / 2 + 12, cy - 10);
  // Screen with fringes.
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(screen_x, 80); ctx.lineTo(screen_x, canvas.height - 80); ctx.stroke();
  for (let y = 80; y <= canvas.height - 80; y += 2) {
    const x = (y - cy) / 200;
    const I = intensity(x, 1, 1, 30, 2 * Math.PI * st.phi);
    const a = Math.max(0, Math.min(255, Math.floor(I * 128)));
    ctx.fillStyle = `rgb(${a}, ${a * 0.9}, ${a * 0.6})`;
    ctx.fillRect(screen_x + 6, y, 30, 2);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Φ/Φ₀ = ${st.phi.toFixed(2)}, fringe shift = ${st.phi.toFixed(2)} cycles`, 12, canvas.height - 14);
  rP.textContent = st.phi.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // Sweep the enclosed flux so the five frames show the fringe pattern
    // shifting by a controlled number of cycles (the Aharonov-Bohm shift).
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.phi = 2 * frac;
    sP.value = String(st.phi); vP.textContent = st.phi.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
