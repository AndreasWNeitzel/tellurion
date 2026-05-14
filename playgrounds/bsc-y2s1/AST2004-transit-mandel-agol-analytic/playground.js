import { fluxAt, fluxWithLimb } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const sU1 = document.getElementById('slider-u1'), vU1 = document.getElementById('value-u1');
const sU2 = document.getElementById('slider-u2'), vU2 = document.getElementById('value-u2');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { p: 0.1, b: 0.3, u1: 0.3, u2: 0.2, t: 0 };
let running = true;
sP.addEventListener('input', () => { st.p = parseFloat(sP.value); vP.textContent = st.p.toFixed(3); });
sB.addEventListener('input', () => { st.b = parseFloat(sB.value); vB.textContent = st.b.toFixed(2); });
sU1.addEventListener('input', () => { st.u1 = parseFloat(sU1.value); vU1.textContent = st.u1.toFixed(2); });
sU2.addEventListener('input', () => { st.u2 = parseFloat(sU2.value); vU2.textContent = st.u2.toFixed(2); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cxStar = canvas.width / 2, cyStar = 130, Rstar = 90;
  ctx.fillStyle = '#9aa0a6';
  for (let r = Rstar; r > 0; r -= 2) {
    const mu = Math.sqrt(1 - (r / Rstar) ** 2);
    const I = Math.max(0, 1 - st.u1 * (1 - mu) - st.u2 * (1 - mu) ** 2);
    ctx.fillStyle = `rgba(255, ${200 + 30 * I}, ${100 + 100 * I}, ${I})`;
    ctx.beginPath(); ctx.arc(cxStar, cyStar, r, 0, 2 * Math.PI); ctx.fill();
  }
  const phase = ((st.t * 0.2) % 1) - 0.5;
  const xPl = cxStar + phase * 4 * Rstar;
  const yPl = cyStar + st.b * Rstar;
  ctx.fillStyle = '#060608';
  ctx.beginPath(); ctx.arc(xPl, yPl, Rstar * st.p, 0, 2 * Math.PI); ctx.fill();
  const lcTop = 250, lcBot = canvas.height - 30, lcL = 40, lcR = canvas.width - 30;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(lcL, lcTop); ctx.lineTo(lcL, lcBot); ctx.lineTo(lcR, lcBot); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('phase', lcR - 30, lcBot + 14);
  ctx.fillText('flux', 12, lcTop + 10);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  const minF = Math.min(0.95, fluxWithLimb(st.p, st.b, st.u1, st.u2));
  for (let n = 0; n < 200; n += 1) {
    const ph = n / 200 - 0.5;
    const z = Math.sqrt((ph * 4) ** 2 + st.b * st.b);
    const F = fluxWithLimb(st.p, z, st.u1, st.u2);
    const px = lcL + n / 200 * (lcR - lcL);
    const py = lcTop + (1 - (F - minF) / (1 - minF + 1e-9)) * (lcBot - lcTop);
    if (n === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const phNow = ((st.t * 0.2) % 1);
  const ph2 = phNow - 0.5;
  const zNow = Math.sqrt((ph2 * 4) ** 2 + st.b * st.b);
  const Fnow = fluxWithLimb(st.p, zNow, st.u1, st.u2);
  const pxNow = lcL + phNow * (lcR - lcL);
  const pyNow = lcTop + (1 - (Fnow - minF) / (1 - minF + 1e-9)) * (lcBot - lcTop);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(pxNow, pyNow, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`depth ≈ ${((1 - fluxWithLimb(st.p, st.b, st.u1, st.u2)) * 100).toFixed(3)}%`, 12, lcBot - 14);
  rD.textContent = `${((1 - fluxWithLimb(st.p, st.b, st.u1, st.u2)) * 100).toFixed(2)}%`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 5; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
