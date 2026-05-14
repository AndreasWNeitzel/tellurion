import { torusK, sphereK, hyperbolicK, cylinderK } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rK = document.getElementById('readout-k');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Rr: 3, t: 0 }; let running = true;
sR.addEventListener('input', () => { st.Rr = parseFloat(sR.value); vR.textContent = st.Rr.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function colorForK(K, kMax) {
  const t = Math.max(-1, Math.min(1, K / kMax));
  if (t > 0) return `rgba(239,71,111,${0.3 + t * 0.5})`;
  return `rgba(91,192,235,${0.3 - t * 0.5})`;
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = 200;
  const R = 100, r = 100 / st.Rr;
  let kMax = 0;
  for (let i = 0; i < 60; i += 1) {
    const theta = 2 * Math.PI * i / 60;
    const K = torusK(theta, R, r);
    if (Math.abs(K) > kMax) kMax = Math.abs(K);
  }
  for (let i = 0; i < 60; i += 1) {
    const phi = 2 * Math.PI * i / 60 + st.t * 0.5;
    for (let j = 0; j < 30; j += 1) {
      const theta = 2 * Math.PI * j / 30;
      const X = (R + r * Math.cos(theta)) * Math.cos(phi);
      const Y = r * Math.sin(theta);
      const Z = (R + r * Math.cos(theta)) * Math.sin(phi);
      const px = cx + X + Z * 0.3, py = cy - Y + Z * 0.2;
      const K = torusK(theta, R, r);
      ctx.fillStyle = colorForK(K, kMax);
      ctx.fillRect(px - 4, py - 4, 8, 8);
    }
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('Torus: red = K > 0 (outer), blue = K < 0 (inner)', 12, 20);
  // Below: reference surfaces.
  const refY = 360, refSize = 60;
  const refs = [
    { name: 'Sphere (K = 1/R²)', K: sphereK(1), color: '#ef476f' },
    { name: 'Cylinder (K = 0)', K: 0, color: '#9aa0a6' },
    { name: 'Hyperbolic (K = -1)', K: hyperbolicK(1), color: '#5bc0eb' },
  ];
  refs.forEach((r, i) => {
    const x0 = canvas.width / 4 + i * canvas.width / 4 - canvas.width / 8;
    ctx.fillStyle = r.color;
    ctx.beginPath(); ctx.arc(x0, refY, refSize / 2, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#060608'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(r.name, x0 - 60, refY + 60);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText(`K = ${r.K.toFixed(2)}`, x0 - 25, refY + 75);
  });
  rK.textContent = kMax.toExponential(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = 1; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
