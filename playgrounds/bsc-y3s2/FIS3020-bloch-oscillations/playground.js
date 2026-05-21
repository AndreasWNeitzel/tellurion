// Bloch oscillations. Primary view: an electron wavepacket in a
// tilted periodic lattice. A constant force F does NOT make it run
// away; it slides a little, the band bends it back at the zone edge,
// and it oscillates about a fixed point (a Wannier-Stark state) with
// period T_B = h / (e F a). The band E(k) with the Brillouin-zone
// sweep and the real-space x(t) are small diagnostics. Physics in
// sim.js. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 12.
import { blochFrequency, quasiMomentum, position } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rT = document.getElementById('readout-t');
const sF = document.getElementById('slider-F'), vF = document.getElementById('value-F');
const sW = document.getElementById('slider-W'), vW = document.getElementById('value-W');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { F: 1, W: 1, t: 0 }; let running = true;
sF.addEventListener('input', () => { st.F = parseFloat(sF.value); vF.textContent = st.F.toFixed(2); render(); });
sW.addEventListener('input', () => { st.W = parseFloat(sW.value); vW.textContent = st.W.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();

function render() {
  const CW = canvas.width, CH = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, CW, CH);
  const omega_B = blochFrequency(st.F);
  const T_B = 2 * Math.PI / omega_B;
  const A = st.W / (2 * st.F);                          // oscillation amplitude (lattice units)

  // Primary: tilted lattice + the oscillating wavepacket.
  const PX = 16, PY = 28, PW = CW - 32, PH = Math.round(CH * 0.6) - 28;
  ctx.fillStyle = '#0a0b12'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(220,225,235,0.18)'; ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);
  ctx.fillStyle = 'rgba(220,225,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('electron in a tilted lattice: the DC force makes it oscillate, it does not run away', PX + 10, PY + 18);
  const xc = position(st.t, 0, st.F, st.W);             // wavepacket centre, real space
  const span = Math.max(2.2, A * 2.6);                  // visible x range (lattice units)
  const X = (x) => PX + PW * (0.5 + 0.5 * Math.max(-1, Math.min(1, x / span)));
  const yMid = PY + PH * 0.52;
  const tilt = (x) => -0.20 * st.F * x;                 // linear potential -F x (display)
  const Vy = (x) => yMid - (0.5 * st.W * Math.cos(2 * Math.PI * x) * 0.18 + tilt(x)) * (PH * 0.16);
  // tilted washboard potential
  ctx.strokeStyle = 'rgba(150,170,210,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const x = -span + 2 * span * i / 300;
    const px = X(x); if (px < PX || px > PX + PW) continue;
    const py = Vy(x);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Wannier-Stark localisation envelope (the particle stays inside it)
  ctx.strokeStyle = 'rgba(120,235,180,0.30)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X(-A), PY + 24); ctx.lineTo(X(-A), PY + PH - 8);
  ctx.moveTo(X(A), PY + 24); ctx.lineTo(X(A), PY + PH - 8); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(120,235,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Wannier-Stark width = W / 2F', X(-A) + 6, PY + PH - 12);
  // centre-of-mass trail (shows the back-and-forth, not a drift)
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let s = 0; s <= 60; s += 1) {
    const tt = st.t - (60 - s) / 60 * 1.6 * T_B;
    if (tt < 0) continue;
    const xx = position(tt, 0, st.F, st.W);
    const px = X(xx), py = Vy(xx) - 26;
    if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // the wavepacket: a glowing Gaussian probability blob riding the lattice
  const cxp = X(xc), cyp = Vy(xc) - 26, wpx = Math.max(14, PW * 0.06);
  const g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, wpx);
  g.addColorStop(0, 'rgba(120,210,255,0.95)'); g.addColorStop(0.5, 'rgba(80,150,255,0.45)'); g.addColorStop(1, 'rgba(80,150,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cxp, cyp, wpx, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#bfe4ff'; ctx.beginPath(); ctx.arc(cxp, cyp, 4, 0, 2 * Math.PI); ctx.fill();
  // force arrow
  ctx.strokeStyle = 'rgba(255,160,90,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PX + PW - 90, PY + 30); ctx.lineTo(PX + PW - 40, PY + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PX + PW - 40, PY + 30); ctx.lineTo(PX + PW - 48, PY + 26); ctx.lineTo(PX + PW - 48, PY + 34); ctx.closePath(); ctx.fillStyle = 'rgba(255,160,90,0.85)'; ctx.fill();
  ctx.fillStyle = 'rgba(255,160,90,0.85)'; ctx.fillText('force F', PX + PW - 96, PY + 22);

  // Diagnostics row: band E(k) with the BZ sweep, and x(t).
  const DY = PY + PH + 12, DH = CH - DY - 14, DW = (PW - 12) / 2;
  function dpanel(x, w, title) {
    ctx.fillStyle = '#0a0b12'; ctx.fillRect(x, DY, w, DH);
    ctx.strokeStyle = 'rgba(220,225,235,0.16)'; ctx.strokeRect(x + 0.5, DY + 0.5, w - 1, DH - 1);
    ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(title, x + 8, DY + 14);
  }
  dpanel(PX, DW, 'band E(k), Brillouin-zone sweep');
  const bx0 = PX + 10, bx1 = PX + DW - 10, byc = DY + DH * 0.56, bAmp = DH * 0.30;
  const kToPx = (k) => bx0 + (k + Math.PI) / (2 * Math.PI) * (bx1 - bx0);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const k = i / 100 * Math.PI, E = -st.W / 2 * Math.cos(k);
    const py = byc - E / 1.6 * bAmp;
    if (i === -100) ctx.moveTo(kToPx(k), py); else ctx.lineTo(kToPx(k), py);
  }
  ctx.stroke();
  const kNow = quasiMomentum(st.t, 0, st.F), ENow = -st.W / 2 * Math.cos(kNow);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(kToPx(((kNow + Math.PI) % (2 * Math.PI)) - Math.PI), byc - ENow / 1.6 * bAmp, 5, 0, 2 * Math.PI); ctx.fill();
  const x2 = PX + DW + 12;
  dpanel(x2, DW, 'real-space x(t): a clean oscillation');
  const tMax = 3 * T_B, px0 = x2 + 10, px1 = x2 + DW - 10, pyc = DY + DH * 0.56, pAmp = DH * 0.34;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const tt = tMax * i / 300, xx = position(tt, 0, st.F, st.W);
    const py = pyc - Math.max(-1, Math.min(1, xx / span)) * pAmp;
    if (i === 0) ctx.moveTo(px0 + (px1 - px0) * i / 300, py); else ctx.lineTo(px0 + (px1 - px0) * i / 300, py);
  }
  ctx.stroke();
  const tn = st.t % tMax, xn = position(tn, 0, st.F, st.W);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(px0 + (px1 - px0) * tn / tMax, pyc - Math.max(-1, Math.min(1, xn / span)) * pAmp, 5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = 'rgba(200,206,224,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T_B = ${T_B.toFixed(2)}   amplitude W/2F = ${A.toFixed(2)}   omega_B = ${omega_B.toFixed(2)}`, PX + 4, CH - 4);
  rT.textContent = T_B.toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 2; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    // 2.7 Bloch periods (non-integer), so the five frames land at
    // different phases of the real-space oscillation and the sweep.
    st.t = frac * 2.7 * (2 * Math.PI / blochFrequency(st.F));
  } else {
    st.t = 0;
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
