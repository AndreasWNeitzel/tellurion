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
    // Electric field lines: streamlines seeded radially around each
    // positive charge, integrated along E until they reach a negative
    // charge or leave the frame. Line count scales with |q|.
    const W = canvas.width, Hc = canvas.height;
    const inWorld = (x, y) => x > -W / (2 * scale) - 0.5 && x < W / (2 * scale) + 0.5
                            && y > -Hc / (2 * scale) - 0.5 && y < Hc / (2 * scale) + 0.5;
    for (const src of C) {
      if (src.q <= 0) continue;
      const nLines = Math.max(8, Math.round(10 * Math.abs(src.q)));
      for (let L = 0; L < nLines; L += 1) {
        const a0 = (L + 0.5) / nLines * 2 * Math.PI;
        let x = src.x + 0.18 * Math.cos(a0), y = src.y + 0.18 * Math.sin(a0);
        ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(cx + x * scale, cy - y * scale);
        let arrowAt = 26;
        for (let s = 0; s < 520; s += 1) {
          const f = forceAt(x, y, C);
          const m = Math.hypot(f.fx, f.fy);
          if (m < 1e-7) break;
          const ds = 0.05;
          // RK2 along the unit field direction.
          const hx = x + 0.5 * ds * f.fx / m, hy = y + 0.5 * ds * f.fy / m;
          const fh = forceAt(hx, hy, C); const mh = Math.hypot(fh.fx, fh.fy) || 1;
          x += ds * fh.fx / mh; y += ds * fh.fy / mh;
          ctx.lineTo(cx + x * scale, cy - y * scale);
          // Terminate near any charge or off-frame.
          let hit = false;
          for (const ch of C) if (Math.hypot(x - ch.x, y - ch.y) < 0.16) hit = true;
          if (hit || !inWorld(x, y)) break;
          if (--arrowAt === 0) {
            arrowAt = 30;
            const px = cx + x * scale, py = cy - y * scale;
            const ang = Math.atan2(-(fh.fy), fh.fx);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,209,102,0.6)';
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - 6 * Math.cos(ang - 0.4), py - 6 * Math.sin(ang - 0.4));
            ctx.lineTo(px - 6 * Math.cos(ang + 0.4), py - 6 * Math.sin(ang + 0.4));
            ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(px, py);
          }
        }
        ctx.stroke();
      }
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
