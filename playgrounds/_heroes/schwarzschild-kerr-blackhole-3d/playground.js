import { iscoKerr, horizonOuter, ergosphereOuter, bCritSchwarzschild } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sI = document.getElementById('slider-i'), vI = document.getElementById('value-i');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { aOverM: 0, incl: 20, t: 0 }; let running = true;
sA.addEventListener('input', () => { st.aOverM = parseFloat(sA.value); vA.textContent = st.aOverM.toFixed(2); });
sI.addEventListener('input', () => { st.incl = parseFloat(sI.value); vI.textContent = st.incl.toFixed(0); });
btnR.addEventListener('click', () => { st.aOverM = 0; sA.value = 0; vA.textContent = '0.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function planckColor(T_K) {
  // Tanner Helland fit (T_K -> sRGB).
  const t = Math.max(1000, Math.min(15000, T_K)) / 100;
  let r, g, b;
  if (t <= 66) r = 255; else r = Math.min(255, 329.7 * Math.pow(t - 60, -0.133));
  if (t <= 66) g = Math.min(255, 99.5 * Math.log(t) - 161.1);
  else g = Math.min(255, 288.1 * Math.pow(t - 60, -0.0755));
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = Math.min(255, 138.5 * Math.log(t - 10) - 305.0);
  return [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
}
let last = performance.now();
function render() {
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
  const M_px = 30;
  // Starfield.
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 200; i += 1) {
    const x = ((i * 73 + 12) % W);
    const y = ((i * 97 + 27) % H);
    const a = (i * 13 % 100) / 100;
    if (Math.hypot(x - cx, y - cy) < 80) continue;
    ctx.fillStyle = `rgba(220,220,255,${0.2 + 0.6 * a})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  // Accretion disk (edge-on inclined).
  const incRad = st.incl * Math.PI / 180;
  const rH = horizonOuter(st.aOverM);
  const rISCO = iscoKerr(st.aOverM);
  const rOuter = 20;
  // Draw the disk as concentric arcs colored by Planck temperature (Shakura-Sunyaev T propto r^{-3/4}).
  for (let k = 200; k > 0; k -= 1) {
    const r = rISCO + (rOuter - rISCO) * k / 200;
    const T = 1e7 * Math.pow(rISCO / r, 0.75);  // arbitrary scaling.
    const col = planckColor(Math.min(15000, T / 1e3));
    ctx.strokeStyle = `rgba(${col[0].toFixed(0)},${col[1].toFixed(0)},${col[2].toFixed(0)},${0.4 + 0.5 * k / 200})`;
    ctx.lineWidth = (rOuter - rISCO) / 200 * M_px;
    ctx.beginPath(); ctx.ellipse(cx, cy, r * M_px, r * M_px * Math.sin(incRad), 0, 0, 2 * Math.PI); ctx.stroke();
  }
  // Mask the part behind the BH using a half-arc above.
  ctx.fillStyle = '#060608';
  ctx.beginPath(); ctx.ellipse(cx, cy, rH * M_px, rH * M_px, 0, 0, 2 * Math.PI); ctx.fill();
  // Ergosphere (purple shell, when |a|>0).
  if (Math.abs(st.aOverM) > 0.01) {
    ctx.strokeStyle = 'rgba(180,90,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const th = i / 100 * Math.PI;
      const r = ergosphereOuter(st.aOverM, th);
      const x = r * Math.sin(th); const y = r * Math.cos(th);
      const px = cx + x * M_px; const py = cy - y * M_px * Math.cos(incRad);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Photon ring (orange).
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.arc(cx, cy, 3 * M_px, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  // Horizon (event horizon disk).
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, rH * M_px, 0, 2 * Math.PI); ctx.fill();
  // Annotations.
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`a/M = ${st.aOverM.toFixed(2)}, r_+ = ${rH.toFixed(2)} M, r_ISCO = ${rISCO.toFixed(2)} M`, 12, H - 30);
  ctx.fillText(`b_crit (Schwarzschild) = ${bCritSchwarzschild(1).toFixed(3)} M`, 12, H - 12);
  rR.textContent = `${rISCO.toFixed(2)} M`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
