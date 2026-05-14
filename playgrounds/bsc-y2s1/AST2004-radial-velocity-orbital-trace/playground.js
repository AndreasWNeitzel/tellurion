import { semiAmplitudeKMs, radialVelocityKMs, trueAnomaly, solveKepler } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rK = document.getElementById('readout-k');
const ids = { a: 0.5, p: 1, e: 0.3, w: 60, i: 80 };
const sliders = ['a','p','e','w','i'].map(k => ({ k, s: document.getElementById('slider-'+k), v: document.getElementById('value-'+k) }));
let st = { ...ids, phi: 0 }; let running = true;
sliders.forEach(({ k, s, v }) => s.addEventListener('input', () => { st[k] = parseFloat(s.value); v.textContent = st[k].toFixed(k === 'w' || k === 'i' ? 0 : 2); }));
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
btnR.addEventListener('click', () => { st.phi = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const cxL = W / 4, cyL = H / 2, sc = 80;
  const omega = st.w * Math.PI / 180, sin_i = Math.sin(st.i * Math.PI / 180);
  const K = semiAmplitudeKMs(st.a, st.p, st.e, sin_i);
  ctx.strokeStyle = '#ffd166'; ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(cxL, cyL, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let n = 0; n < 200; n += 1) {
    const phi = n / 200;
    const M = 2 * Math.PI * phi;
    const E = solveKepler(M, st.e);
    const x_pf = st.a * (Math.cos(E) - st.e);
    const y_pf = st.a * Math.sqrt(1 - st.e * st.e) * Math.sin(E);
    const x = x_pf * Math.cos(omega) - y_pf * Math.sin(omega);
    const y = x_pf * Math.sin(omega) + y_pf * Math.cos(omega);
    const px = cxL + x * sc, py = cyL - y * sc;
    if (n === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke();
  const M_now = 2 * Math.PI * st.phi;
  const E_now = solveKepler(M_now, st.e);
  const x_pf = st.a * (Math.cos(E_now) - st.e);
  const y_pf = st.a * Math.sqrt(1 - st.e * st.e) * Math.sin(E_now);
  const xn = x_pf * Math.cos(omega) - y_pf * Math.sin(omega);
  const yn = x_pf * Math.sin(omega) + y_pf * Math.cos(omega);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(cxL + xn * sc, cyL - yn * sc, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#9aa0a6'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cxL - 110, cyL); ctx.lineTo(cxL + 110, cyL); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('line of sight', cxL + 50, cyL - 8);
  ctx.setLineDash([]);
  const cxR = 3 * W / 4 - 30, cyR = H / 2, RvW = W / 2 - 60, RvH = H * 0.6;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(cxR - RvW / 2, cyR); ctx.lineTo(cxR + RvW / 2, cyR); ctx.moveTo(cxR - RvW / 2, cyR - RvH / 2); ctx.lineTo(cxR - RvW / 2, cyR + RvH / 2); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('phase', cxR + RvW / 2 - 30, cyR + 18);
  ctx.fillText(`v_r (K = ${K.toFixed(1)} km/s)`, cxR - RvW / 2, cyR - RvH / 2 - 8);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let n = 0; n < 200; n += 1) {
    const phi = n / 200;
    const v = radialVelocityKMs(phi, K, omega, st.e);
    const px = cxR - RvW / 2 + phi * RvW;
    const py = cyR - v / (1.5 * K) * (RvH / 2);
    if (n === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const v_now = radialVelocityKMs(st.phi, K, omega, st.e);
  const pxNow = cxR - RvW / 2 + st.phi * RvW, pyNow = cyR - v_now / (1.5 * K) * (RvH / 2);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(pxNow, pyNow, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`v_r = ${v_now.toFixed(1)} km/s at phase ${st.phi.toFixed(2)}`, 12, H - 12);
  rK.textContent = K.toFixed(1) + ' km/s';
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.phi = (st.phi + dt * 0.2) % 1; render(); requestAnimationFrame(tick); }
function bootSync() { st.phi = CAPTURE_FRAC; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
