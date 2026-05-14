import { safetyAtEdge, bToroidal } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rQ = document.getElementById('readout-q');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sI = document.getElementById('slider-I'), vI = document.getElementById('value-I');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { R0: 6.2, a: 2, B0: 5.3, Ip: 15, t: 0 }; let running = true;
sR.addEventListener('input', () => { st.R0 = parseFloat(sR.value); vR.textContent = st.R0.toFixed(1); });
sA.addEventListener('input', () => { st.a = parseFloat(sA.value); vA.textContent = st.a.toFixed(2); });
sB.addEventListener('input', () => { st.B0 = parseFloat(sB.value); vB.textContent = st.B0.toFixed(1); });
sI.addEventListener('input', () => { st.Ip = parseFloat(sI.value); vI.textContent = st.Ip.toFixed(1); });
btnR.addEventListener('click', () => { st.R0 = 6.2; st.a = 2; st.B0 = 5.3; st.Ip = 15; sR.value = 6.2; sA.value = 2; sB.value = 5.3; sI.value = 15; vR.textContent = '6.2'; vA.textContent = '2.0'; vB.textContent = '5.3'; vI.textContent = '15'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function project(x, y, z) { return { px: canvas.width / 2 + x + z * 0.3, py: canvas.height / 2 - y + z * 0.25 }; }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 200 / (st.R0 + st.a);
  const R0px = st.R0 * scale, apx = st.a * scale;
  // Translucent vacuum vessel.
  ctx.strokeStyle = 'rgba(91,192,235,0.3)'; ctx.lineWidth = 1;
  for (let phi = 0; phi < 2 * Math.PI; phi += Math.PI / 24) {
    const xC = R0px * Math.cos(phi), yC = 0, zC = R0px * Math.sin(phi);
    const p = project(xC, yC, zC);
    ctx.beginPath();
    for (let th = 0; th <= 2 * Math.PI; th += 0.05) {
      const x = (R0px + apx * Math.cos(th)) * Math.cos(phi);
      const y = apx * Math.sin(th);
      const z = (R0px + apx * Math.cos(th)) * Math.sin(phi);
      const pp = project(x, y, z);
      if (th === 0) ctx.moveTo(pp.px, pp.py); else ctx.lineTo(pp.px, pp.py);
    }
    ctx.stroke();
  }
  // Helical field lines.
  const q = safetyAtEdge(st.B0, st.R0, st.a, st.Ip);
  const N_lines = 6;
  for (let k = 0; k < N_lines; k += 1) {
    const r_offset = (k + 0.5) / N_lines * apx * 0.85;
    const hue = 30 + 120 * (1 - r_offset / apx);
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.85)`; ctx.lineWidth = 1.5;
    ctx.beginPath();
    const phi0 = st.t * 0.4 + k * 2 * Math.PI / N_lines;
    const turns = 12;
    for (let s = 0; s <= 1; s += 0.005) {
      const phi = phi0 + s * 2 * Math.PI;
      const th = s * 2 * Math.PI * turns / q;
      const x = (R0px + r_offset * Math.cos(th)) * Math.cos(phi);
      const y = r_offset * Math.sin(th);
      const z = (R0px + r_offset * Math.cos(th)) * Math.sin(phi);
      const pp = project(x, y, z);
      if (s === 0) ctx.moveTo(pp.px, pp.py); else ctx.lineTo(pp.px, pp.py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`R0=${st.R0.toFixed(1)} m, a=${st.a.toFixed(2)} m, B0=${st.B0.toFixed(1)} T, Ip=${st.Ip.toFixed(1)} MA, q_a=${q.toFixed(2)}`, 12, canvas.height - 12);
  rQ.textContent = q.toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 4; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
