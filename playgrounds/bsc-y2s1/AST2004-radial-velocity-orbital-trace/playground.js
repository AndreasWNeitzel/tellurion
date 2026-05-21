import { semiAmplitudeKMs, radialVelocityKMs, trueAnomaly, solveKepler } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
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
  const cos_i = Math.cos(st.i * Math.PI / 180);
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
    const px = cxL + x * sc, py = cyL - y * cos_i * sc;
    if (n === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke();
  const M_now = 2 * Math.PI * st.phi;
  const E_now = solveKepler(M_now, st.e);
  const x_pf = st.a * (Math.cos(E_now) - st.e);
  const y_pf = st.a * Math.sqrt(1 - st.e * st.e) * Math.sin(E_now);
  const xn = x_pf * Math.cos(omega) - y_pf * Math.sin(omega);
  const yn = x_pf * Math.sin(omega) + y_pf * Math.cos(omega);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(cxL + xn * sc, cyL - yn * cos_i * sc, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#9aa0a6'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cxL - 110, cyL); ctx.lineTo(cxL + 110, cyL); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('line of sight', cxL + 50, cyL - 8);
  ctx.setLineDash([]);
  // RV curve on an ABSOLUTE velocity axis. The old plot divided v_r by
  // K, which removed every dependence on K (hence on P, a, i): the
  // curve never changed. On a fixed km/s axis the amplitude scales as
  // K = 2 pi a sin i / (P sqrt(1-e^2)), so P, a and i all visibly grow
  // or shrink the curve, while e and omega skew its shape.
  const cxR = 3 * W / 4 - 30, cyR = H / 2, RvW = W / 2 - 70, RvH = H * 0.62;
  const R_KMS = 80;                                  // fixed half-range
  const xR = (phi) => cxR - RvW / 2 + phi * RvW;
  const yR = (v) => cyR - Math.max(-1, Math.min(1, v / R_KMS)) * (RvH / 2);
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(cxR - RvW / 2, cyR); ctx.lineTo(cxR + RvW / 2, cyR);
  ctx.moveTo(cxR - RvW / 2, cyR - RvH / 2); ctx.lineTo(cxR - RvW / 2, cyR + RvH / 2); ctx.stroke();
  ctx.fillStyle = '#7e828a'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  for (const vv of [-80, -40, 0, 40, 80]) { const yy = yR(vv); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(cxR - RvW / 2, yy); ctx.lineTo(cxR + RvW / 2, yy); ctx.stroke(); ctx.fillText(`${vv}`, cxR - RvW / 2 - 6, yy + 3); }
  ctx.textAlign = 'left'; ctx.fillStyle = '#9aa0a6';
  ctx.fillText('phase', cxR + RvW / 2 - 36, cyR + 18);
  ctx.fillText('v_r (km/s)', cxR - RvW / 2, cyR - RvH / 2 - 22);
  // Systemic line and the +/-K envelope about the e cos(omega) offset
  // (v_max = K(1 + e cos w), v_min = K(e cos w - 1); peak-to-peak 2K).
  const offset = K * st.e * Math.cos(omega);
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  for (const lv of [offset + K, offset - K]) { ctx.beginPath(); ctx.moveTo(cxR - RvW / 2, yR(lv)); ctx.lineTo(cxR + RvW / 2, yR(lv)); ctx.stroke(); }
  ctx.setLineDash([]); ctx.fillStyle = '#5bc0eb';
  ctx.fillText(`+K`, cxR + RvW / 2 + 4, yR(offset + K) + 3);
  ctx.fillText(`−K`, cxR + RvW / 2 + 4, yR(offset - K) + 3);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let n = 0; n <= 200; n += 1) {
    const phi = n / 200;
    const v = radialVelocityKMs(phi, K, omega, st.e);
    n ? ctx.lineTo(xR(phi), yR(v)) : ctx.moveTo(xR(phi), yR(v));
  }
  ctx.stroke();
  const v_now = radialVelocityKMs(st.phi, K, omega, st.e);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(xR(st.phi), yR(v_now), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#cdd1d6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`K = ${K.toFixed(1)} km/s   2K = ${(2 * K).toFixed(1)} km/s   v_r = ${v_now.toFixed(1)} km/s at phase ${st.phi.toFixed(2)}`, 12, H - 12);
  rK.textContent = K.toFixed(1) + ' km/s';
}
// Phase advances as 1/P (Kepler time mapping): a longer period orbits
// more slowly, so the period is visible in the motion as well.
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.phi = (st.phi + dt * 0.3 / st.p) % 1; render(); requestAnimationFrame(tick); }
function bootSync() { st.phi = CAPTURE_FRAC; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
