import { potential, field, inducedSigma } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readQ = document.getElementById('readout-q');
const sq = document.getElementById('slider-q'), vq = document.getElementById('value-q');
const tImg = document.getElementById('toggle-img'), tF = document.getElementById('toggle-field'), tE = document.getElementById('toggle-equi');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { q: 1, a: 0, b: 1.5, showImg: true, showField: true, showEqui: true };
let dragging = false, running = true;
sq.addEventListener('input', () => { st.q = parseFloat(sq.value); vq.textContent = st.q.toFixed(1); });
tImg.addEventListener('change', () => { st.showImg = tImg.checked; });
tF.addEventListener('change', () => { st.showField = tF.checked; });
tE.addEventListener('change', () => { st.showEqui = tE.checked; });
btnR.addEventListener('click', () => { st.a = 0; st.b = 1.5; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function clientToWorld(cx, cy) { const rect = canvas.getBoundingClientRect(); const sx = canvas.width / rect.width, sy = canvas.height / rect.height; return { x: ((cx - rect.left) * sx - canvas.width / 2) / 70, y: -((cy - rect.top) * sy - canvas.height / 2) / 70 + 0.5 }; }
canvas.addEventListener('mousedown', (e) => { dragging = true; const w = clientToWorld(e.clientX, e.clientY); st.a = w.x; st.b = Math.max(0.2, w.y); canvas.classList.add('dragging'); });
canvas.addEventListener('mousemove', (e) => { if (dragging) { const w = clientToWorld(e.clientX, e.clientY); st.a = w.x; st.b = Math.max(0.2, w.y); } });
window.addEventListener('mouseup', () => { dragging = false; canvas.classList.remove('dragging'); });
let t0 = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, planeY = canvas.height * 0.7, scale = 70;
  ctx.fillStyle = 'rgba(154,160,166,0.2)'; ctx.fillRect(0, planeY, canvas.width, canvas.height - planeY);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(0, planeY); ctx.lineTo(canvas.width, planeY); ctx.stroke();
  if (st.showEqui) {
    const W = canvas.width, H = canvas.height;
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const wx = (x - cx) / scale, wy = (planeY - y) / scale;
      if (wy < 0) continue;
      const v = potential(wx, wy, st.q, st.a, st.b);
      const phase = Math.cos(2 * Math.PI * Math.log(1 + Math.abs(v)) / 0.3);
      const a = Math.max(0, Math.min(255, 30 + 80 * Math.abs(phase) * Math.tanh(Math.abs(v))));
      const colorR = v > 0 ? 239 : 91, colorG = v > 0 ? 71 : 192, colorB = v > 0 ? 111 : 235;
      for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) {
        const idx = ((y + dy) * W + (x + dx)) * 4;
        d[idx] = (d[idx] * (255 - a) + colorR * a) / 255;
        d[idx + 1] = (d[idx + 1] * (255 - a) + colorG * a) / 255;
        d[idx + 2] = (d[idx + 2] * (255 - a) + colorB * a) / 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  if (st.showField) {
    const N = 22, step = canvas.width / N;
    ctx.strokeStyle = 'rgba(232,232,232,0.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < N; i += 1) for (let j = 0; j < Math.floor(planeY / step); j += 1) {
      const px = (i + 0.5) * step, py = (j + 0.5) * step;
      const wx = (px - cx) / scale, wy = (planeY - py) / scale;
      const f = field(wx, wy, st.q, st.a, st.b); const mag = Math.hypot(f.ex, f.ey);
      if (mag < 1e-6) continue;
      const u = step * 0.4;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + u * f.ex / mag, py - u * f.ey / mag); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -canvas.width / 2; x < canvas.width / 2; x += 2) {
    const wx = x / scale;
    const s = inducedSigma(wx - st.a, st.q, st.b);
    const y = planeY + 30 - 8000 * s;
    if (x === -canvas.width / 2) ctx.moveTo(cx + x, y); else ctx.lineTo(cx + x, y);
  }
  ctx.stroke();
  ctx.fillStyle = st.q >= 0 ? '#ef476f' : '#5bc0eb';
  ctx.beginPath(); ctx.arc(cx + st.a * scale, planeY - st.b * scale, 9, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1.5; ctx.stroke();
  if (st.showImg) {
    ctx.fillStyle = st.q < 0 ? '#ef476f' : '#5bc0eb'; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(cx + st.a * scale, planeY + st.b * scale, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.globalAlpha = 1; ctx.setLineDash([4, 4]); ctx.strokeStyle = '#9aa0a6'; ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`q = ${st.q.toFixed(2)}, height b = ${st.b.toFixed(2)}`, 12, 20);
  ctx.fillText('induced σ(x) shown as yellow trace along the conductor', 12, 38);
  readQ.textContent = (-st.q).toFixed(2);
}
function tick() { render(); if (running) requestAnimationFrame(tick); else requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
