import { elementsToPos, solveKepler, trueAnomaly } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sI = document.getElementById('slider-i'), vI = document.getElementById('value-i');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { a: 1.5, e: 0.3, i: 30, O: 60, w: 45, t: 0 };
let running = true;
for (const [id, key, fmt] of [[sA,'a',2],[sE,'e',2],[sI,'i',0],[sO,'O',0],[sW,'w',0]]) {
  id.addEventListener('input', () => { st[key] = parseFloat(id.value); document.getElementById(`value-${key === 'w' ? 'w' : key}`).textContent = st[key].toFixed(fmt); });
}
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function project(x, y, z) { return { px: canvas.width / 2 + x * 80 + 0.3 * z * 80, py: canvas.height / 2 - y * 80 + 0.3 * z * 80 }; }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(91,192,235,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); const ext = 3.5;
  for (let ang = 0; ang < 2 * Math.PI; ang += 0.02) {
    const p = project(ext * Math.cos(ang), ext * Math.sin(ang), 0);
    if (ang === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.closePath(); ctx.fillStyle = 'rgba(91,192,235,0.07)'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  const sun = project(0, 0, 0);
  ctx.beginPath(); ctx.arc(sun.px, sun.py, 10, 0, 2 * Math.PI); ctx.fill();
  const i = st.i * Math.PI / 180, O = st.O * Math.PI / 180, w = st.w * Math.PI / 180;
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let nu = 0; nu < 2 * Math.PI; nu += 0.02) {
    const p = elementsToPos(st.a, st.e, i, O, w, nu);
    const pr = project(p.x, p.y, p.z);
    if (nu === 0) ctx.moveTo(pr.px, pr.py); else ctx.lineTo(pr.px, pr.py);
  }
  ctx.closePath(); ctx.stroke();
  const M = st.t * 2 * Math.PI / Math.pow(st.a, 1.5);
  const E = solveKepler(M, st.e);
  const nu = trueAnomaly(E, st.e);
  const p = elementsToPos(st.a, st.e, i, O, w, nu);
  const pr = project(p.x, p.y, p.z);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(pr.px, pr.py, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(154,160,166,0.5)';
  ctx.beginPath(); ctx.moveTo(sun.px, sun.py); ctx.lineTo(pr.px, pr.py); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`a=${st.a.toFixed(2)} AU, e=${st.e.toFixed(2)}, i=${st.i.toFixed(0)}, Ω=${st.O.toFixed(0)}, ω=${st.w.toFixed(0)}`, 12, canvas.height - 30);
  ctx.fillText(`r = ${p.r.toFixed(3)} AU`, 12, canvas.height - 12);
  rR.textContent = p.r.toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt * 0.3; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
