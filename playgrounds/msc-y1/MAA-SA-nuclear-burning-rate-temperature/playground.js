import { eps_pp, eps_CNO, eps_3alpha } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logT: 7.2, rho: 100 }; let running = true;
sT.addEventListener('input', () => { st.logT = parseFloat(sT.value); vT.textContent = st.logT.toFixed(2); });
sR.addEventListener('input', () => { st.rho = parseFloat(sR.value); vR.textContent = st.rho.toFixed(0); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 ε (erg/g/s)', 12, pad.t + 10); ctx.fillText('log10 T (K)', W - 60, H - pad.b + 14);
  const xToPx = (l) => pad.l + (l - 6.5) / 2.5 * (W - pad.l - pad.r);
  const yToPx = (l) => H - pad.b - (l + 15) / 30 * (H - pad.t - pad.b);
  const lines = [
    { fn: eps_pp, color: '#5bc0eb', label: 'pp (T^4)' },
    { fn: eps_CNO, color: '#ffd166', label: 'CNO (T^18)' },
    { fn: eps_3alpha, color: '#06d6a0', label: '3-α (T^40)' },
  ];
  lines.forEach((line, idx) => {
    ctx.strokeStyle = line.color; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
      const logT = 6.5 + 2.5 * i / 200;
      const T = Math.pow(10, logT);
      const e = line.fn(T, st.rho);
      const le = Math.log10(e + 1e-30);
      if (i === 0) ctx.moveTo(xToPx(logT), yToPx(le)); else ctx.lineTo(xToPx(logT), yToPx(le));
    }
    ctx.stroke();
    ctx.fillStyle = line.color; ctx.fillText(line.label, pad.l + 10, pad.t + 26 + idx * 14);
  });
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(st.logT), pad.t); ctx.lineTo(xToPx(st.logT), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  const T = Math.pow(10, st.logT);
  const epp = eps_pp(T, st.rho), eC = eps_CNO(T, st.rho), e3 = eps_3alpha(T, st.rho);
  const dom = e3 > eC && e3 > epp ? '3-α' : eC > epp ? 'CNO' : 'pp';
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T = 10^${st.logT.toFixed(2)} K, dominant: ${dom}`, 12, H - 14);
  rD.textContent = dom;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
