import { bohrEnergy, fineStructureDelta, fsLevel } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rF = document.getElementById('readout-f');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { nMax: 3, mag: 3000 }; let running = true;
sN.addEventListener('input', () => { st.nMax = parseInt(sN.value); vN.textContent = st.nMax; });
sM.addEventListener('input', () => { st.mag = parseInt(sM.value); vM.textContent = st.mag; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 70, r: 30, t: 30, b: 40 };
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('E (eV)', 12, pad.t + 10);
  const eMin = -14, eMax = 0;
  const yToPx = (e) => H - pad.b - (e - eMin) / (eMax - eMin) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.stroke();
  for (let e = -14; e <= 0; e += 1) {
    const py = yToPx(e);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(pad.l, py, 4, 1);
    if (e % 2 === 0) { ctx.fillStyle = '#9aa0a6'; ctx.fillText(`${e}`, 30, py + 4); }
  }
  let maxFS = 0;
  for (let n = 1; n <= st.nMax; n += 1) for (let l = 0; l < n; l += 1) for (const j of [Math.abs(l - 0.5), l + 0.5]) if (j >= 0.5) maxFS = Math.max(maxFS, Math.abs(fineStructureDelta(n, j)));
  for (let n = 1; n <= st.nMax; n += 1) {
    const E = bohrEnergy(n);
    const xCol = pad.l + 50 + (n - 1) * 140;
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xCol - 30, yToPx(E)); ctx.lineTo(xCol + 30, yToPx(E)); ctx.stroke();
    ctx.fillStyle = '#5bc0eb'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`n=${n}`, xCol - 10, yToPx(E) - 6);
    for (let l = 0; l < n; l += 1) {
      const jvals = l === 0 ? [0.5] : [l - 0.5, l + 0.5];
      for (const j of jvals) {
        const Esplit = fsLevel(n, j);
        const py = yToPx(E + (Esplit - E) * st.mag);
        const xSub = xCol + (j === 0.5 ? -10 : 30) + l * 12;
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(xSub - 15, py); ctx.lineTo(xSub + 15, py); ctx.stroke();
        ctx.fillStyle = '#ffd166'; ctx.font = '10px ui-monospace, monospace';
        ctx.fillText(`${'spdfg'[l]}${j === 0.5 ? '½' : j === 1.5 ? '3/2' : j === 2.5 ? '5/2' : `${j}`}`, xSub - 12, py - 4);
      }
    }
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`FS magnification x${st.mag}, max ΔE_FS ≈ ${(maxFS * 1e6).toFixed(0)} μeV`, 12, H - 14);
  rF.textContent = `${(maxFS * 1e6).toFixed(0)} μeV`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
