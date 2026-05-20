import { lobeParallel, lobePerpendicular, betaFromGamma, openingAngle } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rG = document.getElementById('readout-g'), rTh = document.getElementById('readout-th');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const selG = document.getElementById('select-geom');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { gamma: 3, geom: 'perp' };
let running = true, theta_rot = 0;
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
selG.addEventListener('change', () => { st.geom = selG.value; });
btnR.addEventListener('click', () => { theta_rot = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const beta = betaFromGamma(st.gamma);
  const N = 720; const vals = new Float32Array(N);
  let maxv = 1e-30;
  for (let i = 0; i < N; i += 1) {
    const theta = (i / N) * Math.PI;
    const v = st.geom === 'par' ? lobeParallel(theta, beta) : lobePerpendicular(theta, 0, beta);
    vals[i] = v; if (v > maxv) maxv = v;
  }
  const R = 220;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(theta_rot);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const theta = (i / N) * Math.PI;
    const r = R * Math.pow(vals[i] / maxv, 0.45);
    const x = r * Math.sin(theta), y = -r * Math.cos(theta);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let i = N - 1; i >= 0; i -= 1) {
    const theta = (i / N) * Math.PI;
    const r = R * Math.pow(vals[i] / maxv, 0.45);
    const x = -r * Math.sin(theta), y = -r * Math.cos(theta);
    ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fillStyle = 'rgba(255,209,102,0.25)'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
  const opAng = openingAngle(st.gamma);
  ctx.beginPath(); ctx.moveTo(0, -R - 20); ctx.lineTo(R * 1.2 * Math.sin(opAng), -R * 1.2 * Math.cos(opAng)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -R - 20); ctx.lineTo(-R * 1.2 * Math.sin(opAng), -R * 1.2 * Math.cos(opAng)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -R - 50); ctx.lineTo(0, R + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -R - 50); ctx.lineTo(-7, -R - 40); ctx.lineTo(7, -R - 40); ctx.closePath(); ctx.fillStyle = '#06d6a0'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`gamma = ${st.gamma.toFixed(2)}, beta = ${beta.toFixed(4)}`, 12, 20);
  ctx.fillText(`1/gamma = ${(opAng * 180 / Math.PI).toFixed(1)} deg`, 12, 38);
  rG.textContent = st.gamma.toFixed(2); rTh.textContent = `${(opAng * 180 / Math.PI).toFixed(1)}°`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) theta_rot += dt * 0.4; render(); requestAnimationFrame(tick); }
function bootSync() { theta_rot = CAPTURE_FRAC * Math.PI; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
