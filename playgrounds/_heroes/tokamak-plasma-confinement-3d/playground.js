import { safetyAtEdge, bToroidal } from './sim.js';
import { setupTokamakGL } from '../../../shared/js/engine-gl/tokamak.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const rQ = document.getElementById('readout-q');
const sR = document.getElementById('slider-R'), vR = document.getElementById('value-R');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sI = document.getElementById('slider-I'), vI = document.getElementById('value-I');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { R0: 6.2, a: 2, B0: 5.3, Ip: 15, t: 0 }; let running = true; let needsRebuild = true;
sR.addEventListener('input', () => { st.R0 = parseFloat(sR.value); vR.textContent = st.R0.toFixed(1); needsRebuild = true; });
sA.addEventListener('input', () => { st.a = parseFloat(sA.value); vA.textContent = st.a.toFixed(2); needsRebuild = true; });
sB.addEventListener('input', () => { st.B0 = parseFloat(sB.value); vB.textContent = st.B0.toFixed(1); needsRebuild = true; });
sI.addEventListener('input', () => { st.Ip = parseFloat(sI.value); vI.textContent = st.Ip.toFixed(1); needsRebuild = true; });
btnR.addEventListener('click', () => { st.R0 = 6.2; st.a = 2; st.B0 = 5.3; st.Ip = 15; sR.value = 6.2; sA.value = 2; sB.value = 5.3; sI.value = 15; vR.textContent = '6.2'; vA.textContent = '2.0'; vB.textContent = '5.3'; vI.textContent = '15'; needsRebuild = true; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let gl = null; try { gl = setupTokamakGL(canvas); } catch (e) { console.warn('webgl2 tokamak init failed', e); }
const ctx2d = gl ? null : canvas.getContext('2d', { alpha: false });
let last = performance.now();
function render() {
  const q = safetyAtEdge(st.B0, st.R0, st.a, st.Ip);
  if (gl) {
    if (needsRebuild) { gl.buildFieldLines(1.0, 0.35, Math.max(0.5, q), 8); needsRebuild = false; }
    gl.render(st.t, 1.0, 0.35, Math.max(0.5, q));
  } else if (ctx2d) {
    // Canvas2D fallback (same as MVP).
    ctx2d.fillStyle = '#060608'; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const scale = 200 / (st.R0 + st.a);
    const R0px = st.R0 * scale, apx = st.a * scale;
    const project = (x, y, z) => ({ px: cx + x + z * 0.3, py: cy - y + z * 0.25 });
    ctx2d.strokeStyle = 'rgba(91,192,235,0.3)';
    for (let phi = 0; phi < 2 * Math.PI; phi += Math.PI / 24) {
      ctx2d.beginPath();
      for (let th = 0; th <= 2 * Math.PI; th += 0.05) {
        const x = (R0px + apx * Math.cos(th)) * Math.cos(phi);
        const y = apx * Math.sin(th);
        const z = (R0px + apx * Math.cos(th)) * Math.sin(phi);
        const pp = project(x, y, z);
        if (th === 0) ctx2d.moveTo(pp.px, pp.py); else ctx2d.lineTo(pp.px, pp.py);
      }
      ctx2d.stroke();
    }
    for (let k = 0; k < 6; k += 1) {
      const r_offset = (k + 0.5) / 6 * apx * 0.85;
      const hue = 30 + 120 * (1 - r_offset / apx);
      ctx2d.strokeStyle = `hsla(${hue}, 80%, 60%, 0.85)`; ctx2d.lineWidth = 1.5;
      ctx2d.beginPath();
      const phi0 = st.t * 0.4 + k * 2 * Math.PI / 6;
      for (let s = 0; s <= 1; s += 0.005) {
        const phi = phi0 + s * 2 * Math.PI;
        const th = s * 2 * Math.PI * 12 / q;
        const x = (R0px + r_offset * Math.cos(th)) * Math.cos(phi);
        const y = r_offset * Math.sin(th);
        const z = (R0px + r_offset * Math.cos(th)) * Math.sin(phi);
        const pp = project(x, y, z);
        if (s === 0) ctx2d.moveTo(pp.px, pp.py); else ctx2d.lineTo(pp.px, pp.py);
      }
      ctx2d.stroke();
    }
  }
  rQ.textContent = q.toFixed(2);
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 4; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
