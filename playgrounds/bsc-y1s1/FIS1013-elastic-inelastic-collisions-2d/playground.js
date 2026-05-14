import { collide, ke, momentum } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutV = document.getElementById('readout-v'); const readoutKE = document.getElementById('readout-ke');
const ids = ['m1','m2','u1','u2','e'].map((k) => ({ k, s: document.getElementById('slider-'+k), v: document.getElementById('value-'+k) }));
let st = { m1: 1, m2: 2, u1: 3, u2: -1, e: 0.7 };
for (const { k, s, v } of ids) { st[k] = parseFloat(s.value); s.addEventListener('input', () => { st[k] = parseFloat(s.value); v.textContent = parseFloat(s.value).toFixed(2); reset(); }); }
const btnR = document.getElementById('btn-reset'); const btnP = document.getElementById('btn-pause');
let running = true;
btnR.addEventListener('click', reset);
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let x1, x2; let v1, v2; let t = 0;
function reset() {
  x1 = -3; x2 = 3; v1 = st.u1; v2 = st.u2; t = 0;
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
}
reset();
function colors() { const css = getComputedStyle(document.body); return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', red: '#ef476f' }; }
const PHYSICS_DT = 1 / 240;
let last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let acc = 0;
function step() {
  // Check collision: balls at x1, x2; radii proportional to sqrt(m).
  const r1 = 0.2 * Math.sqrt(st.m1), r2 = 0.2 * Math.sqrt(st.m2);
  if (x1 + r1 >= x2 - r2 && v1 > v2) {
    const r = collide(st.m1, v1, st.m2, v2, st.e);
    v1 = r.v1; v2 = r.v2;
  }
  x1 += v1 * PHYSICS_DT; x2 += v2 * PHYSICS_DT;
  if (Math.abs(x1) > 6) x1 = Math.sign(x1) * 6;
  if (Math.abs(x2) > 6) x2 = Math.sign(x2) * 6;
  t += PHYSICS_DT;
}
function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2; const scale = 60;
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  const r1 = 0.2 * Math.sqrt(st.m1), r2 = 0.2 * Math.sqrt(st.m2);
  ctx.fillStyle = c.accent;
  ctx.beginPath(); ctx.arc(cx + scale * x1, cy, scale * r1, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(cx + scale * x2, cy, scale * r2, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg; ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`v1 = ${v1.toFixed(2)}, v2 = ${v2.toFixed(2)}`, 12, 20);
  const ke0 = ke(st.m1, st.u1, st.m2, st.u2);
  const ke1 = ke(st.m1, v1, st.m2, v2);
  const loss = ke0 > 0 ? 100 * (1 - ke1 / ke0) : 0;
  ctx.fillText(`KE loss: ${loss.toFixed(1)}% (e = ${st.e.toFixed(2)})`, 12, 38);
}
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  if (running) { acc += dt; while (acc >= PHYSICS_DT) { step(); acc -= PHYSICS_DT; } }
  render();
  readoutV.textContent = `${v1.toFixed(2)}, ${v2.toFixed(2)}`;
  const ke0 = ke(st.m1, st.u1, st.m2, st.u2), ke1 = ke(st.m1, v1, st.m2, v2);
  readoutKE.textContent = (ke0 > 0 ? `${(100 * (1 - ke1 / ke0)).toFixed(1)}%` : '0%');
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { const dt = (CAPTURE_FRAC || 0) * 3; for (let i = 0; i < dt / PHYSICS_DT; i += 1) step(); }
  for (const { k, v } of ids) v.textContent = st[k].toFixed(2);
  render();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
