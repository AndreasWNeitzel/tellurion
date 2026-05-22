import { omega, phaseVelocity, groupVelocity } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rVp = document.getElementById('readout-vp'), rVg = document.getElementById('readout-vg');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sD = document.getElementById('slider-dk'), vD = document.getElementById('value-dk');
const selD = document.getElementById('select-d');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { k0: 4, dk: 0.5, disp: 'water-deep', t: 0 };
let running = !prefersReducedMotion();
sK.addEventListener('input', () => { st.k0 = parseFloat(sK.value); vK.textContent = st.k0.toFixed(2); });
sD.addEventListener('input', () => { st.dk = parseFloat(sD.value); vD.textContent = st.dk.toFixed(2); });
selD.addEventListener('change', () => { st.disp = selD.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cy = canvas.height / 2;
  const k1 = st.k0 - st.dk, k2 = st.k0 + st.dk;
  const w1 = omega(st.disp, k1), w2 = omega(st.disp, k2);
  const vp = phaseVelocity(st.disp, st.k0), vg = groupVelocity(st.disp, st.k0);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(canvas.width - 20, cy); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 800;
  for (let i = 0; i < N; i += 1) {
    const x = 20 + (i / N) * (canvas.width - 40);
    const xphys = (x - canvas.width / 2) / 50;
    const y = Math.cos(k1 * xphys - w1 * st.t) + Math.cos(k2 * xphys - w2 * st.t);
    const py = cy - y * 60;
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(91,192,235,0.7)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = 20 + (i / N) * (canvas.width - 40);
    const xphys = (x - canvas.width / 2) / 50;
    const y = 2 * Math.cos((k2 - k1) / 2 * xphys - (w2 - w1) / 2 * st.t);
    const py = cy - y * 60;
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const x = 20 + (i / N) * (canvas.width - 40);
    const xphys = (x - canvas.width / 2) / 50;
    const y = -2 * Math.cos((k2 - k1) / 2 * xphys - (w2 - w1) / 2 * st.t);
    const py = cy - y * 60;
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  // Trackers ride the actual features at the TRUE velocities (the old
  // code used a spurious 0.3 factor so they never matched the wave).
  // x_phys advances at v, wrapped into the visible window so they keep
  // re-entering; sign of v is preserved so anomalous (opposite-sign)
  // dispersion makes them travel in opposite directions.
  const x0v = (20 - canvas.width / 2) / 50;          // left edge in phys units
  const x1v = (canvas.width - 20 - canvas.width / 2) / 50;
  const Lw = x1v - x0v;
  const wrapX = (xphys) => x0v + (((xphys - x0v) % Lw) + Lw) % Lw;
  const toPix = (xphys) => canvas.width / 2 + 50 * xphys;

  const xpP = wrapX(vp * st.t);                       // phase: rides a carrier crest
  const cxP = toPix(xpP);
  const yP = (Math.cos(k1 * xpP - w1 * st.t) + Math.cos(k2 * xpP - w2 * st.t));
  ctx.strokeStyle = 'rgba(255,209,102,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cxP, 20); ctx.lineTo(cxP, canvas.height - 20); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cxP, cy - yP * 60, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`phase v_p=${vp.toFixed(2)}`, cxP + 9, cy - 96);

  const xpG = wrapX(vg * st.t);                       // group: rides the envelope peak
  const cxG = toPix(xpG);
  const yG = 2 * Math.cos((k2 - k1) / 2 * xpG - (w2 - w1) / 2 * st.t);
  ctx.strokeStyle = 'rgba(91,192,235,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cxG, 20); ctx.lineTo(cxG, canvas.height - 20); ctx.stroke();
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(cxG, cy - yG * 60, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`group v_g=${vg.toFixed(2)}`, cxG + 9, cy + 110);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`v_p = ${vp.toFixed(3)}, v_g = ${vg.toFixed(3)}, v_g/v_p = ${(vg/vp).toFixed(3)}`, 12, canvas.height - 12);
  rVp.textContent = vp.toFixed(3); rVg.textContent = vg.toFixed(3);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.8; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const vp = phaseVelocity(st.disp, st.k0);
  const vg = groupVelocity(st.disp, st.k0);
  return {
    fields: [
      { key: 'k0', label: 'Carrier wavenumber k0', value: st.k0, format: 'float' },
      { key: 'dk', label: 'Modulation bandwidth dk', value: st.dk, format: 'float' },
      { key: 'disp', label: 'Dispersion relation', value: st.disp },
      { key: 'vp', label: 'Phase velocity vp', value: vp, format: 'float' },
      { key: 'vg', label: 'Group velocity vg', value: vg, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const vp = phaseVelocity(st.disp, st.k0);
  const vg = groupVelocity(st.disp, st.k0);
  const ratio = vg / vp;
  let expectedRatio = 1;
  switch (st.disp) {
    case 'light': expectedRatio = 1; break;
    case 'water-deep': expectedRatio = 0.5; break;
    case 'shrod': expectedRatio = 2; break;
    case 'plasma': expectedRatio = (st.k0 * st.k0) / (2 + st.k0 * st.k0); break;
    case 'anomalous': expectedRatio = -1 / (1 + 4 / (3 * st.k0)); break;
  }
  const relErr = Math.abs((ratio - expectedRatio) / Math.max(1, Math.abs(expectedRatio)));
  return [{
    key: 'dispersion-relation',
    label: `v_g / v_p = ${ratio.toFixed(3)} vs expected ${expectedRatio.toFixed(3)}`,
    value: relErr < 1e-6 ? 'pass' : (relErr < 1e-3 ? 'drift' : 'fail'),
    status: relErr < 1e-3 ? 'pass' : 'drift'
  }];
};
