// Fourier vs Laplace. The primary view is the complex s-plane: a
// domain-coloured map of F(s) (hue = phase of F, brightness = |F|),
// so the poles glow as bright peaks and the transform is seen as one
// analytic landscape. The Fourier transform is the slice of that
// landscape along the imaginary axis s = i omega. f(t) and |F(omega)|^2
// are diagnostic strips. Reference: Arfken-Weber Ch. 15.
import { fourierMag2, laplaceComplex, timeFn } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const selF = document.getElementById('select-f');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { a: 1, omega0: 2, fn: 'exp', t: 0 };
let running = !prefersReducedMotion();
sA.addEventListener('input', () => { st.a = parseFloat(sA.value); vA.textContent = st.a.toFixed(2); });
sW.addEventListener('input', () => { st.omega0 = parseFloat(sW.value); vW.textContent = st.omega0.toFixed(1); });
selF.addEventListener('change', () => { st.fn = selF.value; });
btnR.addEventListener('click', () => { running = true; st.t = 0; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const SX0 = -4, SX1 = 4, SY0 = -6.5, SY1 = 6.5;          // s-plane window
const BL = 5;

function aEff() {
  // Gentle breathing of the pole position for dynamism; the slider
  // sets the base, pause freezes it.
  return Math.max(0.05, st.a + (running && !CAPTURE_NAME ? 0.7 * Math.sin(st.t * 0.9) : 0));
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const a = aEff();
  const p = { a, omega0: st.omega0, decay: a, T: 2 };

  // Primary: domain-coloured complex s-plane.
  const PX = 16, PY = 26, PW = W - 32, PH = Math.round(H * 0.62) - 26;
  const sx = (px) => SX0 + (SX1 - SX0) * (px - PX) / PW;
  const sy = (py) => SY1 - (SY1 - SY0) * (py - PY) / PH;
  for (let py = PY; py < PY + PH; py += BL) {
    const yim = sy(py);
    for (let px = PX; px < PX + PW; px += BL) {
      const F = laplaceComplex(sx(px), yim, st.fn, p);
      const mag = Math.hypot(F.re, F.im);
      const ph = Math.atan2(F.im, F.re);
      const L = Math.max(6, Math.min(64, 8 + 24 * Math.log10(1 + mag)));
      const hue = (ph / (2 * Math.PI) + 0.5) * 360;
      ctx.fillStyle = `hsl(${hue.toFixed(0)},42%,${L.toFixed(0)}%)`;
      ctx.fillRect(px, py, BL, BL);
    }
  }
  // region of convergence Re(s) > -decay (faint overlay)
  const xRoc = PX + PW * ((-p.decay) - SX0) / (SX1 - SX0);
  ctx.fillStyle = 'rgba(120,170,255,0.06)';
  ctx.fillRect(xRoc, PY, PX + PW - xRoc, PH);
  // axes; the imaginary axis IS the Fourier transform line
  const x0 = PX + PW * (0 - SX0) / (SX1 - SX0);
  const y0 = PY + PH * (SY1 - 0) / (SY1 - SY0);
  ctx.strokeStyle = 'rgba(226,232,240,0.30)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PX, y0); ctx.lineTo(PX + PW, y0); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,200,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, PY); ctx.lineTo(x0, PY + PH); ctx.stroke(); ctx.lineWidth = 1;
  // poles
  const poles = [];
  if (st.fn === 'exp' || st.fn === 'ramp') poles.push([-a, 0]);
  if (st.fn === 'cos') { poles.push([-a, st.omega0]); poles.push([-a, -st.omega0]); }
  ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2; ctx.font = '13px ui-monospace, monospace';
  for (const [pr, pi] of poles) {
    const qx = PX + PW * (pr - SX0) / (SX1 - SX0), qy = PY + PH * (SY1 - pi) / (SY1 - SY0);
    ctx.beginPath(); ctx.moveTo(qx - 6, qy - 6); ctx.lineTo(qx + 6, qy + 6);
    ctx.moveTo(qx + 6, qy - 6); ctx.lineTo(qx - 6, qy + 6); ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(226,232,240,0.85)'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('complex s-plane: F(s) domain-coloured (hue = phase, brightness = |F|)', PX + 8, PY + 16);
  ctx.fillStyle = 'rgba(120,200,255,0.9)';
  ctx.fillText('Fourier axis  s = i omega', x0 + 6, PY + PH - 8);
  ctx.fillStyle = '#fb7185'; ctx.fillText('x = pole', PX + 8, PY + PH - 8);

  // Diagnostics: f(t) and |F(omega)|^2 (the |F| cut along the i-axis).
  const DY = PY + PH + 10, DH = H - DY - 12, DW = (PW - 12) / 2;
  function dp(x, w, label) {
    ctx.fillStyle = '#0a0b12'; ctx.fillRect(x, DY, w, DH);
    ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.strokeRect(x + 0.5, DY + 0.5, w - 1, DH - 1);
    ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText(label, x + 8, DY + 13);
  }
  dp(PX, DW, 'f(t)');
  let fMax = 1e-9; for (let i = 0; i <= 160; i += 1) fMax = Math.max(fMax, Math.abs(timeFn(i / 160 * 6, st.fn, p)));
  ctx.strokeStyle = '#d4a843'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 160; i += 1) {
    const f = timeFn(i / 160 * 6, st.fn, p);
    const xx = PX + 8 + (DW - 16) * i / 160, yy = DY + DH * 0.55 - f / fMax * DH * 0.4;
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  const x2 = PX + DW + 12;
  dp(x2, DW, '|F(omega)|^2  (Fourier = i-axis cut)');
  let gMax = 1e-9; for (let i = -100; i <= 100; i += 1) gMax = Math.max(gMax, fourierMag2(i / 100 * 8, st.fn, p));
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = -100; i <= 100; i += 1) {
    const g = fourierMag2(i / 100 * 8, st.fn, p);
    const xx = x2 + 8 + (DW - 16) * (i + 100) / 200, yy = DY + DH - 8 - g / gMax * (DH - 22);
    if (i === -100) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  rA.textContent = a.toFixed(2);
}
function tick() { if (running) st.t += 0.016; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const states = [
      { a: 0.6, omega0: 2, fn: 'exp', t: 0 },
      { a: 1.5, omega0: 2, fn: 'exp', t: 0 },
      { a: 0.8, omega0: 2, fn: 'cos', t: 0 },
      { a: 0.8, omega0: 4, fn: 'cos', t: 0 },
      { a: 1.0, omega0: 2, fn: 'ramp', t: 0 },
    ];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st = states[Math.min(states.length - 1, Math.round(frac * (states.length - 1)))];
    sA.value = String(st.a); vA.textContent = st.a.toFixed(2);
    sW.value = String(st.omega0); vW.textContent = st.omega0.toFixed(1);
    if (selF) selF.value = st.fn;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
