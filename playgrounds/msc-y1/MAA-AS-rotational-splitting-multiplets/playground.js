import { ledoux, splittedFreq } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Omega: 0.5, l: 2, isG: false }; let running = true;
sO.addEventListener('input', () => { st.Omega = parseFloat(sO.value); vO.textContent = st.Omega.toFixed(2); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value); vL.textContent = st.l; });
selM.addEventListener('change', () => { st.isG = selM.value === 'g'; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 50, b: 50 };
  const cy = H / 2;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, cy); ctx.lineTo(W - pad.r, cy); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ν (μHz)', W - 60, cy + 18);
  const nu0 = 100;
  const xToPx = (n) => pad.l + (n - 95) / 10 * (W - pad.l - pad.r);
  for (let m = -st.l; m <= st.l; m += 1) {
    const nu = splittedFreq(nu0, m, st.Omega, st.l, st.isG);
    const px = xToPx(nu);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, cy - 80); ctx.lineTo(px, cy + 80); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.fillText(`m = ${m}`, px - 14, cy - 90);
  }
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(nu0), cy - 100); ctx.lineTo(xToPx(nu0), cy + 100); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.fillText(`ν_0 = ${nu0} (Ω = 0 limit)`, xToPx(nu0) - 90, cy + 110);
  const dnu = (1 - ledoux(st.l, st.isG)) * st.Omega;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Ledoux C_n,ℓ = ${ledoux(st.l, st.isG).toFixed(3)}, splitting δν = ${dnu.toFixed(3)} μHz`, 12, H - 14);
  rD.textContent = dnu.toFixed(3);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
