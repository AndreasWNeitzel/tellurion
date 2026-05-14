import { dPdOmega, Ptotal } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rP = document.getElementById('readout-p');
const sA = document.getElementById('slider-amp'), vA = document.getElementById('value-amp');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const sV = document.getElementById('select-view');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { amp: 1, fExp: 3, view: 'lobe', t: 0 };
let running = true;
sA.addEventListener('input', () => { st.amp = parseFloat(sA.value); vA.textContent = st.amp.toFixed(1); });
sF.addEventListener('input', () => { st.fExp = parseFloat(sF.value); vF.textContent = `1e${st.fExp.toFixed(1)}`; });
sV.addEventListener('change', () => { st.view = sV.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const a_peak = 1e10 * st.amp;
  const omega = 2 * Math.PI * Math.pow(10, st.fExp);
  const a_inst = a_peak * Math.cos(omega * st.t * 1e-6);
  if (st.view === 'lobe') {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
    const peakLen = 200;
    for (let i = 0; i <= 360; i += 2) {
      const th = i * Math.PI / 180;
      const r = peakLen * Math.sin(th) ** 2 * st.amp;
      const x = cx + r * Math.sin(th); const y = cy - r * Math.cos(th);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - 100); ctx.lineTo(cx, cy + 100); ctx.stroke();
    const elY = cy - 60 * Math.cos(omega * st.t * 1e-6);
    ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(cx, elY, 7, 0, 2 * Math.PI); ctx.fill();
  } else if (st.view === '3d') {
    for (let i = 0; i < 36; i += 1) {
      const phi = i * Math.PI / 18;
      ctx.strokeStyle = `hsla(${200 + 30 * Math.sin(phi)}, 60%, 60%, 0.5)`; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j <= 36; j += 1) {
        const th = j * Math.PI / 36;
        const r = 180 * Math.sin(th) ** 2 * st.amp;
        const X = r * Math.sin(th) * Math.cos(phi);
        const Y = r * Math.cos(th);
        const Z = r * Math.sin(th) * Math.sin(phi);
        const px = cx + X + 0.4 * Z; const py = cy - Y + 0.4 * Z;
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  } else {
    for (let k = 0; k < 5; k += 1) {
      const phase = (st.t * 1e-6 - k * 0.0002) * omega;
      const r0 = (st.t * 1e-6 - k * 0.0002) * 200000;
      if (r0 <= 0) continue;
      ctx.strokeStyle = `rgba(255,209,102,${Math.max(0, 0.7 - r0 / 200)})`; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 360; i += 3) {
        const th = i * Math.PI / 180;
        const amp = Math.sin(th) ** 2;
        const r = r0 + 10 * amp * Math.cos(phase);
        const x = cx + r * Math.sin(th); const y = cy - r * Math.cos(th);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    ctx.fillStyle = '#06d6a0';
    ctx.beginPath(); ctx.arc(cx, cy - 30 * Math.cos(omega * st.t * 1e-6), 8, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`a(t) = ${(a_inst * 1e-9).toFixed(2)} GA/s, a_peak = ${(a_peak * 1e-9).toFixed(2)}`, 12, 20);
  ctx.fillText(`P_tot = ${Ptotal(a_peak).toExponential(2)} W`, 12, 38);
  rP.textContent = Ptotal(a_peak).toExponential(2) + ' W';
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { if (CAPTURE_NAME) st.t = CAPTURE_FRAC; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
