import { generateImage, aperturePhot } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rF = document.getElementById('readout-f');
const ids = ['a','s','w','F','sk'];
const sliders = ids.map(k => ({ k, s: document.getElementById('slider-'+k), v: document.getElementById('value-'+k) }));
let st = { a: 6, s: 14, w: 2.5, F: 8000, sk: 100, seed: 0xC0FFEE };
let running = true;
sliders.forEach(({ k, s, v }) => s.addEventListener('input', () => { st[k] = parseFloat(s.value); v.textContent = k === 'F' || k === 'sk' ? st[k].toFixed(0) : st[k].toFixed(1); refresh(); }));
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
btnR.addEventListener('click', () => { st.seed = (st.seed * 31 + 7) >>> 0; refresh(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
const N = 64;
let img;
function refresh() { img = generateImage(N, 32, 32, st.F, st.w, st.sk, 1, 1, st.seed); }
refresh();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const imgPx = 380, x0 = 30, y0 = 60;
  const pxToImg = imgPx / N;
  let max = 0; for (let i = 0; i < img.length; i += 1) if (img[i] > max) max = img[i];
  const id = ctx.createImageData(imgPx, imgPx);
  for (let py = 0; py < imgPx; py += 1) {
    for (let px = 0; px < imgPx; px += 1) {
      const ix = Math.floor(px / pxToImg), iy = Math.floor(py / pxToImg);
      const v = img[iy * N + ix] / max;
      const a = Math.max(0, Math.min(255, Math.floor(v * 255)));
      const idx = (py * imgPx + px) * 4;
      id.data[idx] = a; id.data[idx + 1] = a * 0.9; id.data[idx + 2] = a * 0.6; id.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(id, x0, y0);
  const cx = x0 + 32 * pxToImg, cy = y0 + 32 * pxToImg;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, st.a * pxToImg, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, st.s * pxToImg, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, (st.s + 4) * pxToImg, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  const r = aperturePhot(img, N, 32, 32, st.a, st.a, st.s, st.s + 4);
  const x_panel = x0 + imgPx + 30, y_panel = y0;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`F_true   = ${st.F.toFixed(0)}`, x_panel, y_panel + 14);
  ctx.fillText(`F_meas   = ${r.flux.toFixed(0)}`, x_panel, y_panel + 36);
  ctx.fillText(`sky/pix  = ${r.sky.toFixed(1)} (true ${st.sk})`, x_panel, y_panel + 58);
  ctx.fillText(`err     = ${((r.flux - st.F) / st.F * 100).toFixed(1)} %`, x_panel, y_panel + 80);
  rF.textContent = r.flux.toFixed(0);
}
function tick() { if (running) render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
