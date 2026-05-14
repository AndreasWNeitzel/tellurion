import { transitionType, kurie } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rT = document.getElementById('readout-t');
const sJi = document.getElementById('slider-ji'), vJi = document.getElementById('value-ji');
const sJf = document.getElementById('slider-jf'), vJf = document.getElementById('value-jf');
const selP = document.getElementById('select-p');
const sQ = document.getElementById('slider-Q'), vQ = document.getElementById('value-Q');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Ji: 0.5, Jf: 0.5, dPi: 0, Q: 1000 }; let running = true;
function jLabel(v) { return v % 1 === 0 ? `${v}` : `${v * 2}/2`; }
sJi.addEventListener('input', () => { st.Ji = parseInt(sJi.value) / 2; vJi.textContent = jLabel(st.Ji); });
sJf.addEventListener('input', () => { st.Jf = parseInt(sJf.value) / 2; vJf.textContent = jLabel(st.Jf); });
selP.addEventListener('change', () => { st.dPi = parseInt(selP.value); });
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value); vQ.textContent = st.Q; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  // Classifier on left.
  const type = transitionType(st.Ji, st.Jf, st.dPi);
  const color = type === 'Fermi (pure)' ? '#ffd166' : type === 'GT (pure)' ? '#5bc0eb' : type === 'Mixed' ? '#06d6a0' : '#ef476f';
  ctx.fillStyle = '#9aa0a6'; ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`J_i = ${jLabel(st.Ji)} → J_f = ${jLabel(st.Jf)}`, 40, 50);
  ctx.fillText(`Δπ = ${st.dPi === 0 ? 'no' : 'yes'}`, 40, 76);
  ctx.font = '20px ui-monospace, monospace'; ctx.fillStyle = color;
  ctx.fillText(`Type: ${type}`, 40, 130);
  // Kurie plot on right.
  const x0 = W / 2 + 30, y0 = 80, w = W - x0 - 30, h = H - y0 - 60;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Kurie sqrt(N/p²F)', x0 + 4, y0 + 12);
  ctx.fillText('E_e (keV)', x0 + w - 50, y0 + h + 14);
  if (type !== 'Forbidden') {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const E = (i / 100) * st.Q;
      const K = kurie(E, st.Q);
      const px = x0 + i / 100 * w;
      const py = y0 + h - K / st.Q * h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ef476f'; ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('No allowed transition', x0 + w / 2 - 100, y0 + h / 2);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Q = ${st.Q} keV`, x0 + 4, H - 14);
  rT.textContent = type;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
