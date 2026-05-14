import { intensity, fringesBetween, visibility } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d'), rN = document.getElementById('readout-n');
const sL = document.getElementById('slider-lambda'), vL = document.getElementById('value-lambda');
const sR = document.getElementById('slider-rate'), vR = document.getElementById('value-rate');
const sV = document.getElementById('slider-vis'), vV = document.getElementById('value-vis');
const sSrc = document.getElementById('select-src');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause'), btnS = document.getElementById('btn-step');
let st = { lambda: 633e-9, rate: 200e-9, vis: 1, src: 'ring', d: 0, fringes: 0 };
let running = true;
sL.addEventListener('input', () => { st.lambda = parseFloat(sL.value) * 1e-9; vL.textContent = sL.value; });
sR.addEventListener('input', () => { st.rate = parseFloat(sR.value) * 1e-9; vR.textContent = sR.value; });
sV.addEventListener('input', () => { st.vis = parseFloat(sV.value); vV.textContent = st.vis.toFixed(2); });
sSrc.addEventListener('change', () => { st.src = sSrc.value; });
btnR.addEventListener('click', () => { st.d = 0; st.fringes = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnS.addEventListener('click', () => { st.d += st.lambda / 2; st.fringes += 1; });
let last = performance.now(), prevD = 0;
function render() {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const V = 2 * Math.sqrt(st.vis) / (1 + st.vis);
  const W = canvas.width, H = canvas.height;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const rgbR = parseInt(st.lambda > 600e-9 ? 200 : 60, 10);
  const rgbG = st.lambda < 500e-9 ? 60 : (st.lambda > 600e-9 ? 50 : 180);
  const rgbB = st.lambda < 500e-9 ? 200 : (st.lambda > 600e-9 ? 50 : 100);
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const u = (x - cx) / (W / 2), v = (y - cy) / (H / 2);
      let arg = 4 * Math.PI * st.d / st.lambda;
      if (st.src === 'ring') arg *= 1 - 0.5 * (u * u + v * v);
      else if (st.src === 'wedge') arg += 50 * u;
      const I = 1 + V * Math.cos(arg);
      const a = Math.max(0, Math.min(255, Math.floor(I * 0.5 * 255)));
      for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) {
        const idx = ((y + dy) * W + (x + dx)) * 4;
        d[idx] = rgbR * a / 255; d[idx + 1] = rgbG * a / 255; d[idx + 2] = rgbB * a / 255; d[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(8, 8, 240, 56);
  ctx.fillStyle = '#e8e8e8'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`d = ${(st.d * 1e9).toFixed(1)} nm`, 16, 26);
  ctx.fillText(`fringes counted: ${st.fringes.toFixed(2)}`, 16, 44);
  ctx.fillText(`V = ${V.toFixed(2)}, lambda = ${(st.lambda * 1e9).toFixed(0)} nm`, 16, 60);
  rD.textContent = (st.d * 1e9).toFixed(0) + ' nm'; rN.textContent = st.fringes.toFixed(2);
}
function tick(now) {
  const dt = (now - last) / 1000; last = now;
  if (running) { prevD = st.d; st.d += st.rate * dt; st.fringes += 2 * (st.d - prevD) / st.lambda; }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { st.d = CAPTURE_FRAC * 3e-6; st.fringes = 2 * st.d / st.lambda; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
