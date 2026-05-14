import { schwarzschild, vConv } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { dnabla: 0.05, alpha: 1.7, t: 0 }; let running = true;
sN.addEventListener('input', () => { st.dnabla = parseFloat(sN.value); vN.textContent = st.dnabla.toFixed(2); });
sA.addEventListener('input', () => { st.alpha = parseFloat(sA.value); vA.textContent = st.alpha.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const isConv = st.dnabla > 0;
  ctx.fillStyle = isConv ? 'rgba(239,71,111,0.15)' : 'rgba(91,192,235,0.15)';
  ctx.fillRect(40, 30, W - 80, H - 90);
  // Mixing-length blobs.
  if (isConv) {
    const v = vConv(1e3, st.dnabla * 1e6, 1e7, st.alpha * 1e8);
    const N = 25;
    for (let i = 0; i < N; i += 1) {
      const x = 60 + (i * 53 + st.t * v * 0.1) % (W - 120);
      const y = 100 + 90 * Math.sin(st.t * 0.5 + i);
      const blobY = 100 + (st.t * v * 0.001 + i * 30) % (H - 200);
      ctx.fillStyle = `rgba(255,209,102,${0.3 + 0.4 * Math.sin(st.t + i)})`;
      ctx.beginPath(); ctx.arc(x, blobY, 18, 0, 2 * Math.PI); ctx.fill();
    }
  } else {
    for (let r = 0; r < 8; r += 1) {
      ctx.strokeStyle = 'rgba(91,192,235,0.4)';
      ctx.beginPath(); ctx.moveTo(40, 60 + r * 40); ctx.lineTo(W - 40, 60 + r * 40); ctx.stroke();
    }
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`Regime: ${schwarzschild(0.5 + st.dnabla, 0.5)}`, 50, H - 30);
  ctx.fillText(`α (mixing length) = ${st.alpha.toFixed(2)}`, 50, H - 12);
  rR.textContent = schwarzschild(0.5 + st.dnabla, 0.5);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 1; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
