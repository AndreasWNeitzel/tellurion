import { N, S_l, cavities } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rC = document.getElementById('readout-c');
const sW = document.getElementById('slider-w'), vW = document.getElementById('value-w');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { omega: 2, l: 1 }; let running = true;
sW.addEventListener('input', () => { st.omega = parseFloat(sW.value); vW.textContent = st.omega.toFixed(2); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value); vL.textContent = st.l; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  const xToPx = (r) => pad.l + r * (W - pad.l - pad.r);
  const yToPx = (omega) => H - pad.b - omega / 12 * (H - pad.t - pad.b);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ω', 12, pad.t + 10); ctx.fillText('r / R*', W - 50, H - pad.b + 14);
  // Shade cavities.
  const c = cavities(st.omega, st.l);
  for (const [r0, r1] of c.gCavities) {
    ctx.fillStyle = 'rgba(255,209,102,0.18)';
    ctx.fillRect(xToPx(r0), pad.t, xToPx(r1) - xToPx(r0), H - pad.t - pad.b);
  }
  for (const [r0, r1] of c.pCavities) {
    ctx.fillStyle = 'rgba(91,192,235,0.18)';
    ctx.fillRect(xToPx(r0), pad.t, xToPx(r1) - xToPx(r0), H - pad.t - pad.b);
  }
  // N curve.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const r = i / 200; const Nv = N(r);
    const px = xToPx(r), py = yToPx(Nv);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // S_l curve.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const r = 0.02 + 0.98 * i / 200; const Sv = S_l(r, st.l);
    const px = xToPx(r), py = yToPx(Math.min(12, Sv));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // omega line.
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pad.l, yToPx(st.omega)); ctx.lineTo(W - pad.r, yToPx(st.omega)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.fillText('N (buoyancy)', pad.l + 10, pad.t + 28);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`S_ℓ (Lamb, ℓ=${st.l})`, pad.l + 10, pad.t + 44);
  ctx.fillStyle = '#06d6a0'; ctx.fillText(`ω = ${st.omega.toFixed(2)}`, pad.l + 10, pad.t + 60);
  const tag = c.pCavities.length && c.gCavities.length ? 'p + g (mixed)' : c.pCavities.length ? 'p' : c.gCavities.length ? 'g' : 'evanescent';
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`cavities active: ${tag}`, 12, H - 14);
  rC.textContent = tag;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
