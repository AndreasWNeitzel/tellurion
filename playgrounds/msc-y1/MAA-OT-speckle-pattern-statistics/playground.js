import { speckleField, expectedSpeckleCount } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rN = document.getElementById('readout-n');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Dr0: 6, seed: 0xC0FFEE }; let running = true;
sD.addEventListener('input', () => { st.Dr0 = parseFloat(sD.value); vD.textContent = st.Dr0.toFixed(1); });
btnR.addEventListener('click', () => { st.seed = (st.seed * 31 + 7) >>> 0; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const psfSize = 100, scale = 4;
  const I = speckleField(psfSize, st.Dr0, 4, st.seed);
  let max = 0; for (let i = 0; i < I.length; i += 1) if (I[i] > max) max = I[i];
  const x0 = canvas.width / 2 - psfSize * scale / 2, y0 = 40;
  const id = ctx.createImageData(psfSize * scale, psfSize * scale);
  for (let py = 0; py < psfSize * scale; py += 1) for (let px = 0; px < psfSize * scale; px += 1) {
    const ix = Math.floor(px / scale), iy = Math.floor(py / scale);
    const v = I[iy * psfSize + ix] / max;
    const a = Math.max(0, Math.min(255, Math.floor(Math.pow(v, 0.35) * 255)));
    const idx = (py * psfSize * scale + px) * 4;
    id.data[idx] = a; id.data[idx + 1] = a * 0.9; id.data[idx + 2] = a * 0.7; id.data[idx + 3] = 255;
  }
  ctx.putImageData(id, x0, y0);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`D/r_0 = ${st.Dr0.toFixed(1)}, expected speckles ≈ ${expectedSpeckleCount(st.Dr0, 1).toFixed(0)}`, 12, 20);
  rN.textContent = expectedSpeckleCount(st.Dr0, 1).toFixed(0);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
