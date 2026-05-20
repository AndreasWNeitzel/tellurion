import { euler, rk4, rk45, energy, analyticSolution } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sDT = document.getElementById('slider-dt'), vDT = document.getElementById('value-dt');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { dt: 0.05, omega: 0.5 };
let yE, yR, yA, trailE = [], trailR = [], trailA = [], errE = [], errR = [], errA = [], E0 = 0, t = 0, running = true;
function reset() {
  yE = [1, 0]; yR = [1, 0]; yA = [1, 0]; E0 = energy(yE, st.omega);
  trailE = []; trailR = []; trailA = []; errE = []; errR = []; errA = []; t = 0;
  // Pre-integrate the full window so changing dt instantly shows the
  // complete trajectory: at large dt Euler visibly diverges and its
  // error curve jumps, immediately, instead of creeping in 2 steps a
  // frame (which is why the dt slider read as barely responsive).
  for (let i = 0; i < 360; i += 1) step();
}
reset();
sDT.addEventListener('input', () => { st.dt = parseFloat(sDT.value); vDT.textContent = st.dt.toFixed(2); reset(); });
sW.addEventListener('input', () => { st.omega = parseFloat(sW.value); vW.textContent = st.omega.toFixed(2); reset(); });
btnR.addEventListener('click', () => { reset(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function step() {
  yE = euler(yE, st.dt, st.omega);
  yR = rk4(yR, st.dt, st.omega);
  const out = rk45(yA, st.dt, st.omega);
  yA = out.y_new;
  t += st.dt;
  const analytic = analyticSolution(t, st.omega);
  const eE = Math.hypot(yE[0] - analytic[0], yE[1] - analytic[1]);
  const eR = Math.hypot(yR[0] - analytic[0], yR[1] - analytic[1]);
  const eA = Math.hypot(yA[0] - analytic[0], yA[1] - analytic[1]);
  trailE.push([t, yE[0]]); trailR.push([t, yR[0]]); trailA.push([t, yA[0]]);
  errE.push([t, eE]); errR.push([t, eR]); errA.push([t, eA]);
  if (trailE.length > 400) { trailE.shift(); trailR.shift(); trailA.shift(); errE.shift(); errR.shift(); errA.shift(); }
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const padL = 50, padR = 30, padT = 30, padB = 50;
  const left = padL, right = W * 0.6, top = padT, bot = H - padB;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.lineTo(right, bot); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('x(t)', 12, top + 10); ctx.fillText('t', right - 20, bot + 18);
  const ymax = 3;
  const tmin = trailE.length ? trailE[0][0] : 0; const tmax = tmin + 400 * st.dt;
  const tToPx = (tt) => left + (tt - tmin) / (tmax - tmin) * (right - left);
  const yToPx = (yy) => bot - (yy + ymax) / (2 * ymax) * (bot - top);
  const colors = ['#ef476f', '#5bc0eb', '#06d6a0']; const labels = ['Euler', 'RK4', 'RK45'];
  [trailE, trailR, trailA].forEach((tr, i) => {
    ctx.strokeStyle = colors[i]; ctx.lineWidth = 1.5; ctx.beginPath();
    tr.forEach((p, j) => { const px = tToPx(p[0]), py = yToPx(p[1]); if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    ctx.fillStyle = colors[i]; ctx.fillText(labels[i], right - 50, top + 14 + i * 14);
  });
  // Right column: phase portrait on top, log error plot below, stacked
  // with a clear gap so neither overlaps the other.
  const colX0 = right + 44, colX1 = W - padR;
  const midGap = 26;
  const psT = padT, psB = Math.round(H / 2) - midGap;
  const cx = (colX0 + colX1) / 2, cy = (psT + psB) / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(colX0, cy); ctx.lineTo(colX1, cy); ctx.moveTo(cx, psT); ctx.lineTo(cx, psB); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('phase (x, v): dashed = exact', colX0, psT - 6);
  const ymax2 = 2.5, vmax = 2.5;
  const xToPx = (xx) => cx + xx / ymax2 * (colX1 - colX0) / 2;
  const vToPx = (vv) => cy - vv / vmax * (psB - psT) / 2;
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (let a = 0; a <= 2 * Math.PI + 0.01; a += 0.05) {
    const xx = Math.cos(a), vv = -Math.sin(a) * st.omega;
    const px = xToPx(xx), py = vToPx(vv);
    if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke(); ctx.setLineDash([]);
  [[yE, 0], [yR, 1], [yA, 2]].forEach(([y, i]) => {
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.arc(xToPx(y[0]), vToPx(y[1]), 5, 0, 2 * Math.PI); ctx.fill();
  });
  const errL = colX0, errT = Math.round(H / 2) + midGap, errR2 = colX1, errB = H - padB;
  ctx.strokeStyle = '#9aa0a6';
  ctx.beginPath(); ctx.moveTo(errL, errT); ctx.lineTo(errL, errB); ctx.lineTo(errR2, errB); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 |error vs exact|', errL, errT - 6); ctx.fillText('t', errR2 - 14, errB + 16);
  const errMin = -10, errMax = 1;
  const eToPx = (ee) => {
    const l = Math.max(errMin, Math.min(errMax, Math.log10(Math.max(1e-12, ee))));
    return errB - (l - errMin) / (errMax - errMin) * (errB - errT);
  };
  for (let g = errMin; g <= errMax; g += 2) {
    const gy = errB - (g - errMin) / (errMax - errMin) * (errB - errT);
    ctx.strokeStyle = '#1b1b1f'; ctx.beginPath(); ctx.moveTo(errL, gy); ctx.lineTo(errR2, gy); ctx.stroke();
    ctx.fillStyle = '#6b7077'; ctx.fillText(String(g), errL - 26, gy + 3);
  }
  const tmin_e = errE.length ? errE[0][0] : 0; const tmax_e = tmin_e + 400 * st.dt;
  const tToPx_e = (tt) => errL + (tt - tmin_e) / (tmax_e - tmin_e) * (errR2 - errL);
  [errE, errR, errA].forEach((ers, i) => {
    ctx.strokeStyle = colors[i]; ctx.lineWidth = 1.5; ctx.beginPath();
    ers.forEach((p, j) => { const px = tToPx_e(p[0]), py = eToPx(p[1]); if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
  });
  const eE = energy(yE, st.omega), eR = energy(yR, st.omega), eA = energy(yA, st.omega);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E drift: Euler ${((eE / E0 - 1) * 100).toFixed(1)}%, RK4 ${((eR / E0 - 1) * 100).toFixed(2)}%, RK45 ${((eA / E0 - 1) * 100).toFixed(3)}%`, 12, H - 12);
  rE.textContent = `${((eE / E0 - 1) * 100).toFixed(1)}%`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) for (let i = 0; i < 2; i += 1) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < CAPTURE_FRAC * 400; i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
