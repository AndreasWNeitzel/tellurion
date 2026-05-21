import { ottoEfficiency, dieselEfficiency, carnotEfficiency, stirlingEfficiency, ottoPVCurve } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const sRc = document.getElementById('slider-rc'), vRc = document.getElementById('value-rc');
const selC = document.getElementById('select-c');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { r: 8, rc: 2, cycle: 'otto', t: 0, gamma: 1.4 };
let running = !prefersReducedMotion();
sR.addEventListener('input', () => { st.r = parseFloat(sR.value); vR.textContent = st.r.toFixed(1); });
sRc.addEventListener('input', () => { st.rc = parseFloat(sRc.value); vRc.textContent = st.rc.toFixed(2); });
selC.addEventListener('change', () => { st.cycle = selC.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function buildPoints() {
  const V1 = 1, V2 = V1 / st.r, P1 = 1, T1 = 300, T3 = T1 * st.r * 4;
  switch (st.cycle) {
    case 'otto': return ottoPVCurve(V1, V2, P1, T1, T3, st.gamma);
    case 'diesel': {
      // 1->2 adiabatic compression, 2->3 isobaric heat in to V3 = rc V2,
      // 3->4 adiabatic expansion to V1, 4->1 isochoric heat out.
      const P2 = P1 * Math.pow(V1 / V2, st.gamma);
      const V3 = V2 * st.rc;
      const P3 = P2;
      const P4 = P3 * Math.pow(V3 / V1, st.gamma);
      const points = [];
      const N = 30;
      for (let i = 0; i <= N; i += 1) { const v = V1 + (V2 - V1) * i / N; points.push({ V: v, P: P1 * Math.pow(V1 / v, st.gamma) }); }
      for (let i = 0; i <= N; i += 1) { const v = V2 + (V3 - V2) * i / N; points.push({ V: v, P: P2 }); }
      for (let i = 0; i <= N; i += 1) { const v = V3 + (V1 - V3) * i / N; points.push({ V: v, P: P3 * Math.pow(V3 / v, st.gamma) }); }
      for (let i = 0; i <= N; i += 1) { const t = i / N; points.push({ V: V1, P: P4 + (P1 - P4) * t }); }
      return points;
    }
    case 'carnot': {
      const Tc = 300, Th = 900, V_ratio = 2;
      const points = [];
      const N = 30;
      for (let i = 0; i <= N; i += 1) { const v = V1 + (V_ratio * V1 - V1) * i / N; points.push({ V: v, P: P1 * V1 / v }); }
      const V2c = V_ratio * V1;
      const P2c = P1 / V_ratio;
      const V3c = V2c * Math.pow(Th / Tc, 1 / (st.gamma - 1));
      for (let i = 0; i <= N; i += 1) { const v = V2c + (V3c - V2c) * i / N; points.push({ V: v, P: P2c * Math.pow(V2c / v, st.gamma) }); }
      const P3c = P2c * Math.pow(V2c / V3c, st.gamma);
      const V4c = V3c / V_ratio;
      for (let i = 0; i <= N; i += 1) { const v = V3c + (V4c - V3c) * i / N; points.push({ V: v, P: P3c * V3c / v }); }
      const P4c = P3c * V3c / V4c;
      for (let i = 0; i <= N; i += 1) { const v = V4c + (V1 - V4c) * i / N; points.push({ V: v, P: P4c * Math.pow(V4c / v, st.gamma) }); }
      return points;
    }
    case 'stirling': {
      const Th = 900, Tc = 300;
      const points = [];
      const N = 30;
      for (let i = 0; i <= N; i += 1) { const v = V1 + (V2 - V1) * i / N; points.push({ V: v, P: P1 * V1 / v * Th / Tc }); }
      for (let i = 0; i <= N; i += 1) { const t = i / N; points.push({ V: V2, P: P1 * V1 / V2 * Th / Tc + (P1 * V1 / V2 - P1 * V1 / V2 * Th / Tc) * t }); }
      for (let i = 0; i <= N; i += 1) { const v = V2 + (V1 - V2) * i / N; points.push({ V: v, P: P1 * V1 / v }); }
      for (let i = 0; i <= N; i += 1) { const t = i / N; points.push({ V: V1, P: P1 + (P1 * Th / Tc - P1) * t }); }
      return points;
    }
  }
}
function efficiency() {
  switch (st.cycle) {
    case 'otto': return ottoEfficiency(st.r, st.gamma);
    case 'diesel': return dieselEfficiency(st.r, st.rc, st.gamma);
    case 'carnot': return carnotEfficiency(300, 900);
    case 'stirling': return stirlingEfficiency(300, 900);
  }
}
function mapV(V) { return 80 + (V - 0) / 1.2 * (canvas.width - 120); }
function mapP(P) { return canvas.height - 50 - (P - 0) / 6 * (canvas.height - 80); }
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(80, 30); ctx.lineTo(80, canvas.height - 50); ctx.lineTo(canvas.width - 40, canvas.height - 50); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('V', canvas.width - 70, canvas.height - 30); ctx.fillText('P', 20, 30);
  const pts = buildPoints();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  pts.forEach((p, i) => { const x = mapV(p.V), y = mapP(p.P); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.closePath(); ctx.fillStyle = 'rgba(255,209,102,0.12)'; ctx.fill(); ctx.stroke();
  const idx = Math.floor((st.t * 30) % pts.length);
  const cur = pts[idx];
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(mapV(cur.V), mapP(cur.P), 8, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText(`cycle: ${st.cycle}, η = ${efficiency().toFixed(3)}`, 12, 100);
  rE.textContent = efficiency().toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.5; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 3; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
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
