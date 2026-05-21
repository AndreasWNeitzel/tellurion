// Baryon acoustic oscillations as the physical event. A point
// overdensity in the early universe: cold dark matter has no pressure
// and stays as a central peak, while the coupled baryon-photon plasma
// launches a spherical sound wave at c_s. At recombination the photons
// decouple and free-stream away (the CMB) and the baryon shell freezes
// at the comoving sound horizon r_s ~ 150 Mpc. That frozen shell is
// the standard ruler: it appears as the acoustic bump in the galaxy
// correlation function (the demoted diagnostic). sim.js is unchanged;
// soundHorizon / baoXi are the added gate-tested helpers. Reference:
// Eisenstein et al. 2005; Weinberg, Cosmology Ch. 8.
import { soundSpeed, soundHorizon, baoXi, C_KM_S } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const T_REC = 380;                                   // kyr
const st = { R: 0.6, t: 0 };                          // t in kyr (loops)
let running = !prefersReducedMotion();

sR.addEventListener('input', () => { st.R = parseFloat(sR.value); vR.textContent = st.R.toFixed(2); });
btnR.addEventListener('click', () => { st.R = 0.6; st.t = 0; sR.value = '0.6'; vR.textContent = '0.60'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const CX = 250, CY = 215, MAXR = 196;                 // field centre + max radius (px)
const r_s = () => soundHorizon(st.R);                 // Mpc, standard ruler
const MPC_VIEW = 240;                                  // Mpc across the half-field
const mpcToPx = (mpc) => mpc / MPC_VIEW * MAXR;

function render() {
  if (!CAPTURE_NAME && running) { st.t += 4; if (st.t > T_REC + 220) st.t = 0; }
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('A ripple in the infant universe freezes into a 150 Mpc standard ruler', 18, 26);

  const cs = soundSpeed(st.R);
  const rs = r_s();
  const phase = Math.min(1, st.t / T_REC);             // 0..1 up to recombination
  const post = Math.max(0, st.t - T_REC);              // kyr after recombination
  // baryon-photon sound shell: reaches r_s exactly at recombination,
  // then frozen. photon ring is faster (c/sqrt3) and keeps going.
  const shellMpc = rs * phase;
  const shellFrozen = st.t >= T_REC;
  const photonMpc = (shellFrozen ? rs + (C_KM_S / Math.sqrt(3)) / cs * (post / T_REC) * rs : rs * phase * (C_KM_S / Math.sqrt(3)) / cs);

  // field: faint plasma disk, CDM core, sound shell, photon ring
  ctx.fillStyle = 'rgba(120,150,210,0.05)';
  ctx.beginPath(); ctx.arc(CX, CY, MAXR, 0, 6.2832); ctx.fill();
  // sound shell (baryon-photon plasma compression)
  const spx = mpcToPx(shellMpc);
  const g = ctx.createRadialGradient(CX, CY, Math.max(0, spx - 16), CX, CY, spx + 10);
  g.addColorStop(0, 'rgba(255,209,102,0)'); g.addColorStop(0.7, 'rgba(255,209,102,0.22)'); g.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, spx + 10, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = shellFrozen ? '#ffd166' : 'rgba(255,209,102,0.85)';
  ctx.lineWidth = shellFrozen ? 3.5 : 2.5;
  ctx.beginPath(); ctx.arc(CX, CY, spx, 0, 6.2832); ctx.stroke();
  // photon ring (decoupled at t_rec, free-streaming CMB)
  if (photonMpc > 0) {
    const ppx = Math.min(MAXR + 30, mpcToPx(photonMpc));
    ctx.strokeStyle = `rgba(91,192,235,${shellFrozen ? 0.7 : 0.45})`; ctx.lineWidth = 1.4; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.arc(CX, CY, ppx, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  }
  // CDM core (pressureless, stays)
  const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 26);
  cg.addColorStop(0, '#06d6a0'); cg.addColorStop(1, 'rgba(6,214,160,0)');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(CX, CY, 26, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(CX, CY, 7, 0, 6.2832); ctx.fill();

  // standard-ruler caliper once frozen
  if (shellFrozen) {
    const rpx = mpcToPx(rs);
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + rpx, CY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(`r_s = ${rs.toFixed(0)} Mpc`, CX + rpx / 2, CY - 8);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('CDM core', CX - 30, CY + 44);
  ctx.fillStyle = shellFrozen ? '#ffd166' : '#64748b';
  ctx.fillText(shellFrozen ? 'baryon shell FROZEN at the sound horizon' : `sound wave expanding at c_s = ${cs.toFixed(0)} km/s`, 26, 56);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('photons decouple at recombination -> CMB', 26, 74);

  // recombination timeline
  const tlx = 26, tly = H - 116, tlw = 420;
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(tlx, tly, tlw, 5);
  ctx.fillStyle = '#5bc0eb'; ctx.fillRect(tlx, tly, tlw * Math.min(1, st.t / (T_REC + 220)), 5);
  const recx = tlx + tlw * T_REC / (T_REC + 220);
  ctx.strokeStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(recx, tly - 5); ctx.lineTo(recx, tly + 10); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`t = ${st.t.toFixed(0)} kyr`, tlx, tly - 8);
  ctx.fillStyle = '#ffd166'; ctx.fillText('recombination ~380 kyr', recx - 60, tly + 24);

  // radial density profile rho(r): CDM spike + baryon bump
  const pX = 470, pY = 90, pW = W - pX - 24, pH = 150;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(pX, pY, pW, pH);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(pX + 0.5, pY + 0.5, pW - 1, pH - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('density profile rho(r)', pX + 8, pY + 14);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const rMpc = i / 120 * MPC_VIEW;
    const cz = rMpc / 14;
    const cdm = 1.2 * Math.exp(-(cz * cz));
    const bz = (rMpc - shellMpc) / 16;
    const bar = 0.7 * Math.exp(-(bz * bz));
    const v = Math.min(1, (cdm + bar) / 1.6);
    const xx = pX + 8 + i / 120 * (pW - 16), yy = pY + pH - 16 - v * (pH - 30);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // correlation function xi(r) with the acoustic bump (the observable)
  const qX = 470, qY = pY + pH + 20, qW = pW, qH = 150;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(qX, qY, qW, qH);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(qX + 0.5, qY + 0.5, qW - 1, qH - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('galaxy correlation xi(r): the BAO bump at r_s', qX + 8, qY + 14);
  let xmax = 1e-9;
  for (let i = 5; i <= 120; i += 1) xmax = Math.max(xmax, baoXi(i / 120 * MPC_VIEW, rs));
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 4; i <= 120; i += 1) {
    const rMpc = i / 120 * MPC_VIEW;
    const v = baoXi(rMpc, rs) / xmax;
    const xx = qX + 8 + i / 120 * (qW - 16), yy = qY + qH - 16 - v * (qH - 32);
    if (i === 4) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  const bx = qX + 8 + rs / MPC_VIEW * (qW - 16);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(bx, qY + 16); ctx.lineTo(bx, qY + qH - 14); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('r_s', bx, qY + qH - 3); ctx.textAlign = 'left';

  rR.textContent = `${rs.toFixed(0)} Mpc`;
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const Rs = [0.05, 0.3, 0.6, 1.1, 1.8];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.R = Rs[Math.min(Rs.length - 1, Math.round(frac * (Rs.length - 1)))];
    st.t = T_REC + 90;                                 // post-recombination: the frozen ruler
    sR.value = String(st.R); vR.textContent = st.R.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
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
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
