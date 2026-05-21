import { bondiRadius, MdotBondi, bondiVelocityIsothermal, M_SUN, G } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rM = document.getElementById('readout-m');
const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logM: 0, cs: 10, logn: 3, t: 0 }; let running = true;
sM.addEventListener('input', () => { st.logM = parseFloat(sM.value); vM.textContent = st.logM.toFixed(2); render(); });
sC.addEventListener('input', () => { st.cs = parseFloat(sC.value); vC.textContent = st.cs.toFixed(0); render(); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const M = Math.pow(10, st.logM) * M_SUN, cs = st.cs * 1000;
  const rho_inf = Math.pow(10, st.logn) * 1.66e-27 * 1e6;
  const rB = bondiRadius(M, cs);
  const rS = rB * 0.5;
  const Mdot = MdotBondi(M, cs, rho_inf);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  // FIXED length scale (px per AU). pixelsPerRad = 180/(1.5 rB) made
  // rB_px a constant 120 px for every M and cs, so the spatial view was
  // byte-identical and the sliders read as dead. With an absolute scale
  // the Bondi sphere visibly grows with M and shrinks with cs (clamped
  // at the extremes so it never overflows or vanishes).
  const AU = 1.496e11;
  const PX_PER_AU = 13.5;
  const rB_px = Math.max(10, Math.min(230, (rB / AU) * PX_PER_AU));
  const pixelsPerRad = rB_px / rB;                 // consistent for all radii
  const maxRDisplay = rB * 1.6;
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  const rS_px = rS * pixelsPerRad;
  ctx.beginPath(); ctx.arc(cx, cy, rB_px, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, rS_px, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  // r_B label above its circle, r_s label below, so they never collide.
  ctx.fillStyle = '#5bc0eb'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('r_B (Bondi)', cx - 28, cy - rB_px - 6);
  ctx.fillStyle = '#ff6b6b'; ctx.fillText('r_s (sonic)', cx - 26, cy + rS_px + 16);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2 * Math.PI); ctx.fill();
  // Radial inflow streamlines: each spoke carries tracers that speed up
  // as they fall in, blue while subsonic (r > r_s) and red once
  // supersonic (r < r_s), fading as they reach the centre.
  // Ambient density sets the accretion rate Mdot ~ rho_inf, so make the
  // inflow brightness track Mdot: the n slider then visibly thickens or
  // thins the stream (n does not change r_B, so the geometry alone would
  // not respond to it).
  const MdotSun = Mdot * 3.155e7 / M_SUN;
  const dens = Math.max(0.28, Math.min(1.35, 0.30 + 0.16 * (Math.log10(Math.max(MdotSun, 1e-30)) + 11)));
  const r_inner = rS * 0.06;
  for (let k = 0; k < 36; k += 1) {
    const ang = k * 2 * Math.PI / 36;
    for (let m = 0; m < 4; m += 1) {
      const phase = (st.t * 0.5 + k * 0.13 + m * 0.25) % 1;
      const r_now = maxRDisplay * Math.exp(-phase * Math.log(maxRDisplay / r_inner));
      const mach = Math.abs(bondiVelocityIsothermal(r_now, M, cs)) / cs;
      const a = Math.max(0, 0.9 * dens * (1 - phase));
      ctx.fillStyle = mach > 1 ? `rgba(255,107,107,${a.toFixed(3)})` : `rgba(91,192,235,${a.toFixed(3)})`;
      const px = cx + r_now * pixelsPerRad * Math.cos(ang);
      const py = cy + r_now * pixelsPerRad * Math.sin(ang);
      ctx.beginPath(); ctx.arc(px, py, (mach > 1 ? 2.4 : 1.8) * (0.7 + 0.5 * dens), 0, 2 * Math.PI); ctx.fill();
    }
  }
  // Mach vs r inset: the transonic solution. r spans 0.08..2 r_B so the
  // sonic radius r_s = 0.5 r_B sits inside the panel; the curve crosses
  // the horizontal M=1 line exactly at the vertical r_s marker.
  const vx0 = 40, vy0 = 412, vw = 340, vh = 84;
  const rLo = 0.08 * rB, rHi = 2.0 * rB, machMax = 3;
  ctx.strokeStyle = '#3a3d44'; ctx.lineWidth = 1; ctx.strokeRect(vx0, vy0, vw, vh);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Mach number vs radius (transonic Bondi solution)', vx0 + 2, vy0 - 5);
  ctx.fillText('M', vx0 - 14, vy0 + 10); ctx.fillText('r', vx0 + vw + 4, vy0 + vh - 2);
  const rToX = (r) => vx0 + (Math.log(r / rLo) / Math.log(rHi / rLo)) * vw;
  const mToY = (mm) => vy0 + vh - Math.min(machMax, mm) / machMax * vh;
  // M = 1 reference line.
  ctx.strokeStyle = '#555'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(vx0, mToY(1)); ctx.lineTo(vx0 + vw, mToY(1)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#888'; ctx.fillText('M=1', vx0 + 3, mToY(1) - 3);
  // Sonic-radius vertical marker.
  ctx.strokeStyle = '#ff6b6b'; ctx.setLineDash([4, 2]);
  ctx.beginPath(); ctx.moveTo(rToX(rS), vy0); ctx.lineTo(rToX(rS), vy0 + vh); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff6b6b'; ctx.fillText('r_s', rToX(rS) + 3, vy0 + 11);
  // Transonic curve: subsonic (blue) outside r_s, supersonic (red) inside.
  ctx.lineWidth = 2;
  for (let i = 0; i < 160; i += 1) {
    const r0 = rLo * Math.pow(rHi / rLo, i / 160);
    const r1 = rLo * Math.pow(rHi / rLo, (i + 1) / 160);
    const m0 = Math.abs(bondiVelocityIsothermal(r0, M, cs)) / cs;
    const m1 = Math.abs(bondiVelocityIsothermal(r1, M, cs)) / cs;
    ctx.strokeStyle = (0.5 * (m0 + m1) > 1) ? '#ff6b6b' : '#5bc0eb';
    ctx.beginPath(); ctx.moveTo(rToX(r0), mToY(m0)); ctx.lineTo(rToX(r1), mToY(m1)); ctx.stroke();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`r_s = ${(rS / 1.496e11).toExponential(2)} AU`, 12, 20);
  ctx.fillText(`r_B = ${(rB / 1.496e11).toExponential(2)} AU`, 12, 38);
  ctx.fillText(`Mdot = ${(Mdot * 3.155e7 / M_SUN).toExponential(2)} M⊙/yr`, 12, 56);
  ctx.fillText(`cs = ${st.cs} km/s, M = ${Math.pow(10, st.logM).toFixed(1)} M⊙`, 12, canvas.height - 12);
  rM.textContent = `${(Mdot * 3.155e7 / M_SUN).toExponential(1)} M⊙/yr`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { if (CAPTURE_NAME) { st.logM = CAPTURE_FRAC * 6; st.t = 1.4; sM.value = String(st.logM); vM.textContent = st.logM.toFixed(2); } render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
