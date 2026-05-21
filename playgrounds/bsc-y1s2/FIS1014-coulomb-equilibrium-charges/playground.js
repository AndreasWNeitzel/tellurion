import { forceAt, potentialAt } from './sim.js';
import { rdbu, fieldToImageData } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
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
let test = { x: 0.6, y: 1.1, vx: 0, vy: 0 };
let trace = []; let dragging = false; let running = true; let tracing = false;
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
btnR.addEventListener('click', () => { test = { x: 0.6, y: 1.1, vx: 0, vy: 0 }; trace = []; running = true; tracing = false; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); btnT.textContent = 'Trace orbit'; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnE.addEventListener('click', () => {
  let r = { x: test.x, y: test.y };
  const C = configCharges();
  for (let i = 0; i < 200; i += 1) { const f = forceAt(r.x, r.y, C); r.x -= 0.02 * Math.sign(st.q) * f.fx; r.y -= 0.02 * Math.sign(st.q) * f.fy; }
  test.x = r.x; test.y = r.y; test.vx = 0; test.vy = 0;
});
btnT.addEventListener('click', () => { tracing = !tracing; running = tracing; trace = []; btnT.textContent = tracing ? 'Stop trace' : 'Trace orbit'; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function clientToWorld(cx, cy) { const rect = canvas.getBoundingClientRect(); const sx = canvas.width / rect.width, sy = canvas.height / rect.height; return { x: ((cx - rect.left) * sx - canvas.width / 2) / 60, y: -((cy - rect.top) * sy - canvas.height / 2) / 60 }; }
canvas.addEventListener('mousedown', (e) => { dragging = true; const w = clientToWorld(e.clientX, e.clientY); test.x = w.x; test.y = w.y; test.vx = 0; test.vy = 0; trace = [[w.x, w.y]]; canvas.classList.add('dragging'); });
canvas.addEventListener('mousemove', (e) => { if (dragging) { const w = clientToWorld(e.clientX, e.clientY); test.x = w.x; test.y = w.y; trace.push([w.x, w.y]); if (trace.length > 600) trace.shift(); } });
window.addEventListener('mouseup', () => { dragging = false; canvas.classList.remove('dragging'); });
function colors() { return { bg: '#060608', fg: '#e8e8e8', muted: '#9aa0a6', accent: '#ffd166', pos: '#ef476f', neg: '#5bc0eb', test: '#06d6a0' }; }
const PHYSICS_DT = 1 / 240;
let last = performance.now(), acc = 0;
// Force streamline through the test charge: the curve everywhere
// tangent to F = qE. Traced at constant speed (RK2) like a field
// line, so it is always long and smooth and never blows up. For q > 0
// it runs along +E (the charge is pushed away from positive sources);
// for q < 0 it runs along -E (pulled in), so the sign of the q slider
// reverses the whole curve. Recomputed every frame, so it also tracks
// the drag. This is the direction the charge first accelerates and
// the path it follows in the overdamped limit.
function predictTrajectory() {
  const C = configCharges();
  const sgn = st.q >= 0 ? 1 : -1;
  let x = test.x, y = test.y;
  const pts = [[x, y]];
  for (let s = 0; s < 620; s += 1) {
    const f = forceAt(x, y, C);
    const m = Math.hypot(f.fx, f.fy); if (m < 1e-7) break;
    const ds = 0.045;
    const hx = x + 0.5 * ds * sgn * f.fx / m, hy = y + 0.5 * ds * sgn * f.fy / m;
    const fh = forceAt(hx, hy, C); const mh = Math.hypot(fh.fx, fh.fy) || 1;
    x += ds * sgn * fh.fx / mh; y += ds * sgn * fh.fy / mh;
    pts.push([x, y]);
    let hit = false;
    for (const ch of C) if (Math.hypot(x - ch.x, y - ch.y) < 0.18) hit = true;
    if (hit || Math.abs(x) > 6.6 || Math.abs(y) > 4.5) break;
  }
  return pts;
}
function step() {
  const C = configCharges();
  const f = forceAt(test.x, test.y, C);
  test.vx += st.q * f.fx * PHYSICS_DT; test.vy += st.q * f.fy * PHYSICS_DT;
  test.vx *= 0.998; test.vy *= 0.998;
  test.x += test.vx * PHYSICS_DT; test.y += test.vy * PHYSICS_DT;
  // Always keep a rolling trail so the field-driven motion is
  // visible; Trace orbit keeps a long persistent path instead.
  trace.push([test.x, test.y]);
  if (trace.length > (tracing ? 4000 : 240)) trace.shift();
}
// Interaction-energy map U(x,y) = q V(x,y), the landscape the test
// charge feels. Its minima/maxima/saddles are exactly the equilibria;
// stability follows from the curvature. Drawn as a translucent
// diverging (red-blue) background, so the whole map inverts when the
// q slider changes sign and rescales with its magnitude and with Q.
const EGW = 96, EGH = 64;
const eField = new Float64Array(EGW * EGH);
const eAbs = new Float64Array(EGW * EGH);
let eCanvas = null, eCtx = null;
function drawEnergy(C, cx, cy, scale) {
  if (!eCanvas) { eCanvas = document.createElement('canvas'); eCanvas.width = EGW; eCanvas.height = EGH; eCtx = eCanvas.getContext('2d'); }
  for (let gy = 0; gy < EGH; gy += 1) {
    const wy = -(((gy + 0.5) / EGH * canvas.height - cy) / scale);
    for (let gx = 0; gx < EGW; gx += 1) {
      const wx = ((gx + 0.5) / EGW * canvas.width - cx) / scale;
      const e = st.q * potentialAt(wx, wy, C);
      eField[gy * EGW + gx] = e;
      eAbs[gy * EGW + gx] = Math.abs(e);
    }
  }
  // Robust scale: the median |U|, not the max, so the 1/r spikes at
  // the source charges saturate while the saddle and well structure
  // (the equilibria) stays visible. tanh keeps it a smooth diverging
  // map centred at U = 0, so flipping q inverts it.
  const med = [...eAbs].sort((a, b) => a - b)[eAbs.length >> 1] || 1e-6;
  for (let i = 0; i < eField.length; i += 1) eField[i] = 0.5 + 0.5 * Math.tanh(eField[i] / (3 * med));
  const img = fieldToImageData(eField, EGW, EGH, 0, 1, rdbu);
  eCtx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(eCanvas, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
}
function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2, scale = 60;
  const C = configCharges();
  drawEnergy(C, cx, cy, scale);
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
  {
    const pp = predictTrajectory();
    ctx.strokeStyle = c.test; ctx.lineWidth = 3; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(cx + pp[0][0] * scale, cy - pp[0][1] * scale);
    for (const [x, y] of pp) ctx.lineTo(cx + x * scale, cy - y * scale);
    ctx.stroke(); ctx.globalAlpha = 1;
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
    ctx.fillStyle = c.fg; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText((ch.q >= 0 ? '+' : '') + ch.q.toFixed(1), cx + ch.x * scale, cy - ch.y * scale - 12);
  }
  const f = forceAt(test.x, test.y, C); const v = potentialAt(test.x, test.y, C);
  // Force on the test charge, F = q E. The arrow scales and flips
  // with the q slider, so its sign and magnitude are visible at rest.
  const Fx = st.q * f.fx, Fy = st.q * f.fy, Fm = Math.hypot(Fx, Fy);
  const tpx = cx + test.x * scale, tpy = cy - test.y * scale;
  if (Fm > 1e-3) {
    const Lp = (16 + 70 * Math.tanh(Fm / 3)) / Fm;
    const hx = tpx + Fx * Lp, hy = tpy - Fy * Lp;
    const ang = Math.atan2(-(Fy), Fx);
    ctx.strokeStyle = c.accent; ctx.fillStyle = c.accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(tpx, tpy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - 9 * Math.cos(ang - 0.42), hy - 9 * Math.sin(ang - 0.42));
    ctx.lineTo(hx - 9 * Math.cos(ang + 0.42), hy - 9 * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = c.test; ctx.beginPath(); ctx.arc(tpx, tpy, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`F = (${(st.q*f.fx).toFixed(2)}, ${(st.q*f.fy).toFixed(2)})`, 12, 20);
  ctx.fillText(`V = ${v.toFixed(3)}`, 12, 38);
  readF.textContent = Math.sqrt((st.q*f.fx)**2 + (st.q*f.fy)**2).toFixed(2); readV.textContent = v.toFixed(2);
}
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  // Freeze the integrator while the charge is held; on release it
  // accelerates from rest under F = qE. acc is cleared so the release
  // does not replay an accumulated time burst.
  if (running && !dragging) { acc += dt; while (acc >= PHYSICS_DT) { step(); acc -= PHYSICS_DT; } } else { acc = 0; }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { for (let i = 0; i < CAPTURE_FRAC * 1000; i += 1) step(); }
  render();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
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
