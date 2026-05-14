import { forceAt, potentialAt } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readF = document.getElementById('readout-f'), readV = document.getElementById('readout-v');
const sQ = document.getElementById('slider-Q'), vQ = document.getElementById('value-Q');
const sq = document.getElementById('slider-q'), vq = document.getElementById('value-q');
const cfg = document.getElementById('select-cfg'), tf = document.getElementById('toggle-field');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause'), btnE = document.getElementById('btn-equil'), btnT = document.getElementById('btn-trace');
let st = { Q: 1, q: 0.5, cfg: 'quad', showField: true };
let test = { x: 0.5, y: 0.3, vx: 0, vy: 0 };
let trace = []; let dragging = false; let running = false; let tracing = false;
function configCharges() {
  switch (st.cfg) {
    case 'quad': return [{x:1.5,y:1.5,q:st.Q},{x:-1.5,y:1.5,q:st.Q},{x:1.5,y:-1.5,q:st.Q},{x:-1.5,y:-1.5,q:st.Q}];
    case 'dipole': return [{x:-1.5,y:0,q:st.Q},{x:1.5,y:0,q:-st.Q}];
    case 'line': return [{x:-2,y:0,q:st.Q},{x:0,y:0,q:st.Q},{x:2,y:0,q:st.Q}];
    case 'hex': { const c = []; for (let k = 0; k < 6; k += 1) { const a = k * Math.PI / 3; c.push({ x: 1.8 * Math.cos(a), y: 1.8 * Math.sin(a), q: st.Q * (k % 2 ? -1 : 1) }); } return c; }
  }
  return [];
}
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value); vQ.textContent = st.Q.toFixed(1); });
sq.addEventListener('input', () => { st.q = parseFloat(sq.value); vq.textContent = st.q.toFixed(1); });
cfg.addEventListener('change', () => { st.cfg = cfg.value; trace = []; });
tf.addEventListener('change', () => { st.showField = tf.checked; });
btnR.addEventListener('click', () => { test = { x: 0.5, y: 0.3, vx: 0, vy: 0 }; trace = []; running = false; tracing = false; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); btnT.textContent = 'Trace orbit'; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnE.addEventListener('click', () => {
  let r = { x: test.x, y: test.y };
  const C = configCharges();
  for (let i = 0; i < 200; i += 1) { const f = forceAt(r.x, r.y, C); r.x -= 0.02 * Math.sign(st.q) * f.fx; r.y -= 0.02 * Math.sign(st.q) * f.fy; }
  test.x = r.x; test.y = r.y; test.vx = 0; test.vy = 0;
});
btnT.addEventListener('click', () => { tracing = !tracing; running = tracing; trace = []; btnT.textContent = tracing ? 'Stop trace' : 'Trace orbit'; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function clientToWorld(cx, cy) { const rect = canvas.getBoundingClientRect(); const sx = canvas.width / rect.width, sy = canvas.height / rect.height; return { x: ((cx - rect.left) * sx - canvas.width / 2) / 60, y: -((cy - rect.top) * sy - canvas.height / 2) / 60 }; }
canvas.addEventListener('mousedown', (e) => { dragging = true; const w = clientToWorld(e.clientX, e.clientY); test.x = w.x; test.y = w.y; test.vx = 0; test.vy = 0; canvas.classList.add('dragging'); });
canvas.addEventListener('mousemove', (e) => { if (dragging) { const w = clientToWorld(e.clientX, e.clientY); test.x = w.x; test.y = w.y; trace = []; } });
window.addEventListener('mouseup', () => { dragging = false; canvas.classList.remove('dragging'); });
function colors() { return { bg: '#060608', fg: '#e8e8e8', muted: '#9aa0a6', accent: '#ffd166', pos: '#ef476f', neg: '#5bc0eb', test: '#06d6a0' }; }
const PHYSICS_DT = 1 / 240;
let last = performance.now(), acc = 0;
function step() {
  const C = configCharges();
  const f = forceAt(test.x, test.y, C);
  test.vx += st.q * f.fx * PHYSICS_DT; test.vy += st.q * f.fy * PHYSICS_DT;
  test.vx *= 0.998; test.vy *= 0.998;
  test.x += test.vx * PHYSICS_DT; test.y += test.vy * PHYSICS_DT;
  if (tracing) { trace.push([test.x, test.y]); if (trace.length > 2000) trace.shift(); }
}
function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2, scale = 60;
  const C = configCharges();
  if (st.showField) {
    const N = 28; const step = canvas.width / N;
    for (let i = 0; i < N; i += 1) for (let j = 0; j < Math.floor(canvas.height / step); j += 1) {
      const px = (i + 0.5) * step, py = (j + 0.5) * step;
      const wx = (px - cx) / scale, wy = -(py - cy) / scale;
      const f = forceAt(wx, wy, C); const mag = Math.sqrt(f.fx * f.fx + f.fy * f.fy);
      if (mag < 1e-9) continue;
      const u = step * 0.45;
      const a = Math.min(0.8, 0.05 + Math.log1p(mag) * 0.15);
      ctx.strokeStyle = `rgba(154,160,166,${a})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + u * f.fx / mag, py - u * f.fy / mag); ctx.stroke();
    }
  }
  if (trace.length > 1) {
    ctx.strokeStyle = c.test; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(cx + trace[0][0] * scale, cy - trace[0][1] * scale);
    for (const [x, y] of trace) ctx.lineTo(cx + x * scale, cy - y * scale);
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const ch of C) {
    ctx.fillStyle = ch.q >= 0 ? c.pos : c.neg;
    ctx.fillRect(cx + ch.x * scale - 8, cy - ch.y * scale - 8, 16, 16);
    ctx.fillStyle = c.fg; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText((ch.q >= 0 ? '+' : '') + ch.q.toFixed(1), cx + ch.x * scale, cy - ch.y * scale - 12);
  }
  ctx.fillStyle = c.test; ctx.beginPath(); ctx.arc(cx + test.x * scale, cy - test.y * scale, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.stroke();
  const f = forceAt(test.x, test.y, C); const v = potentialAt(test.x, test.y, C);
  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`F = (${(st.q*f.fx).toFixed(2)}, ${(st.q*f.fy).toFixed(2)})`, 12, 20);
  ctx.fillText(`V = ${v.toFixed(3)}`, 12, 38);
  readF.textContent = Math.sqrt((st.q*f.fx)**2 + (st.q*f.fy)**2).toFixed(2); readV.textContent = v.toFixed(2);
}
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  if (running) { acc += dt; while (acc >= PHYSICS_DT) { step(); acc -= PHYSICS_DT; } }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { for (let i = 0; i < CAPTURE_FRAC * 1000; i += 1) step(); }
  render();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
