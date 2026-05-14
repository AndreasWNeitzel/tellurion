import { euler, rk4, rk45, energy } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sDT = document.getElementById('slider-dt'), vDT = document.getElementById('value-dt');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { dt: 0.1, omega: 1 };
let yE, yR, yA, trailE = [], trailR = [], trailA = [], E0 = 0, t = 0, running = true;
function reset() { yE = [1, 0]; yR = [1, 0]; yA = [1, 0]; E0 = energy(yE, st.omega); trailE = []; trailR = []; trailA = []; t = 0; }
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
  trailE.push([t, yE[0]]); trailR.push([t, yR[0]]); trailA.push([t, yA[0]]);
  if (trailE.length > 400) { trailE.shift(); trailR.shift(); trailA.shift(); }
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
  const psL = right + 30, psT = padT, psR = W - padR, psB = H - padB;
  const cx = (psL + psR) / 2, cy = (psT + psB) / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(psL, cy); ctx.lineTo(psR, cy); ctx.moveTo(cx, psT); ctx.lineTo(cx, psB); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('phase (x, v)', psL, psT + 10);
  const ymax2 = 2.5, vmax = 2.5;
  const xToPx = (xx) => cx + xx / ymax2 * (psR - psL) / 2;
  const vToPx = (vv) => cy - vv / vmax * (psB - psT) / 2;
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(xToPx(yE[0]), vToPx(yE[1]), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(xToPx(yR[0]), vToPx(yR[1]), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xToPx(yA[0]), vToPx(yA[1]), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (let a = 0; a < 2 * Math.PI; a += 0.05) {
    const xx = Math.cos(a), vv = -Math.sin(a) * st.omega;
    const px = xToPx(xx), py = vToPx(vv);
    if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  const eE = energy(yE, st.omega), eR = energy(yR, st.omega), eA = energy(yA, st.omega);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E drift: Euler ${((eE / E0 - 1) * 100).toFixed(1)}%, RK4 ${((eR / E0 - 1) * 100).toFixed(2)}%, RK45 ${((eA / E0 - 1) * 100).toFixed(3)}%`, 12, H - 12);
  rE.textContent = `${((eE / E0 - 1) * 100).toFixed(1)}%`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) for (let i = 0; i < 2; i += 1) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < CAPTURE_FRAC * 400; i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
