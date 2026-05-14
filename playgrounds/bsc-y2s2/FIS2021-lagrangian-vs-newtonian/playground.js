import { leapfrog, energy, pendulumRHS } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sTh = document.getElementById('slider-th'), vTh = document.getElementById('value-th');
const sOm = document.getElementById('slider-om'), vOm = document.getElementById('value-om');
const selV = document.getElementById('select-v');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { theta: 1.5, omega: 0, view: 'all' };
let trail = []; let running = true;
sTh.addEventListener('input', () => { st.theta = parseFloat(sTh.value); vTh.textContent = st.theta.toFixed(2); trail = []; });
sOm.addEventListener('input', () => { st.omega = parseFloat(sOm.value); vOm.textContent = st.omega.toFixed(2); trail = []; });
selV.addEventListener('change', () => { st.view = selV.value; });
btnR.addEventListener('click', () => { st.theta = parseFloat(sTh.value); st.omega = parseFloat(sOm.value); trail = []; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function drawPendulum(cx, cy, label, showForces) {
  const L_pix = 120;
  const bx = cx + L_pix * Math.sin(st.theta), by = cy + L_pix * Math.cos(st.theta);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(bx, by, 12, 0, 2 * Math.PI); ctx.fill();
  if (showForces) {
    ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + 40); ctx.stroke();
    ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.moveTo(bx, by + 40); ctx.lineTo(bx - 4, by + 32); ctx.lineTo(bx + 4, by + 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('mg', bx + 6, by + 36);
    const tx = (cx - bx) * 0.35, ty = (cy - by) * 0.35;
    ctx.strokeStyle = '#5bc0eb';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tx, by + ty); ctx.stroke();
    ctx.fillStyle = '#5bc0eb'; ctx.fillText('T', bx + tx + 4, by + ty - 4);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(label, cx - 40, cy - 40);
}
function drawPhase(cx, cy, w, h) {
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx + w / 2, cy);
  ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx, cy + h / 2); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('θ', cx + w / 2 - 12, cy - 6); ctx.fillText('p', cx + 6, cy - h / 2 + 12);
  for (const E of [-0.8, -0.4, 0, 0.4, 1, 1.5]) {
    ctx.strokeStyle = `rgba(91,192,235,${0.5 + 0.1 * Math.sign(E)})`; ctx.lineWidth = 1; ctx.beginPath();
    for (let q = -Math.PI; q < Math.PI; q += 0.05) {
      const pp = 2 * (E + Math.cos(q));
      if (pp < 0) continue;
      const p = Math.sqrt(pp);
      const px = cx + q / Math.PI * (w / 2);
      const py = cy - p / 5 * (h / 2);
      ctx.moveTo(px, py); ctx.lineTo(px + 1, py);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  trail.forEach((pt, i) => {
    const px = cx + pt[0] / Math.PI * (w / 2);
    const py = cy - pt[1] / 5 * (h / 2);
    if (i === 0 || Math.abs(pt[0] - trail[i - 1][0]) > 2) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  const ptx = cx + st.theta / Math.PI * (w / 2);
  const pty = cy - st.omega / 5 * (h / 2);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(ptx, pty, 6, 0, 2 * Math.PI); ctx.fill();
}
function step() {
  for (let k = 0; k < 4; k += 1) {
    const next = leapfrog(st.theta, st.omega, 0.005);
    st.theta = next.theta; st.omega = next.omega;
  }
  let th = st.theta;
  while (th > Math.PI) th -= 2 * Math.PI; while (th < -Math.PI) th += 2 * Math.PI;
  trail.push([th, st.omega]); if (trail.length > 1000) trail.shift();
}
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (st.view === 'all') {
    drawPendulum(canvas.width / 3, canvas.height / 3, 'Newton: m L θ̈ = -m g sin θ', true);
    drawPendulum(2 * canvas.width / 3, canvas.height / 3, 'Lagrangian: L = T - V', false);
    drawPhase(canvas.width / 2, 2 * canvas.height / 3 + 20, canvas.width - 60, canvas.height / 2 - 30);
  } else if (st.view === 'newton') {
    drawPendulum(canvas.width / 2, canvas.height / 2, 'Newton: T - m g cos θ êᵣ - m g sin θ êθ', true);
  } else {
    drawPhase(canvas.width / 2, canvas.height / 2, canvas.width - 60, canvas.height - 80);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`E = ${energy(st.theta, st.omega).toFixed(3)} (conserved by leapfrog)`, 12, canvas.height - 12);
  rE.textContent = energy(st.theta, st.omega).toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) step(); render(); requestAnimationFrame(tick); }
function bootSync() { for (let i = 0; i < CAPTURE_FRAC * 300; i += 1) step(); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
