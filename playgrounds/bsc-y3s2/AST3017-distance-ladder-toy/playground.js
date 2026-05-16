import { distanceModulus, ladderUncertainty, RANGE_PC } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sS1 = document.getElementById('slider-s1'), vS1 = document.getElementById('value-s1');
const sS2 = document.getElementById('slider-s2'), vS2 = document.getElementById('value-s2');
const sS3 = document.getElementById('slider-s3'), vS3 = document.getElementById('value-s3');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { s1: 0.02, s2: 0.05, s3: 0.06 }; let running = true;
sS1.addEventListener('input', () => { st.s1 = parseFloat(sS1.value); vS1.textContent = `${(st.s1 * 100).toFixed(1)}%`; render(); });
sS2.addEventListener('input', () => { st.s2 = parseFloat(sS2.value); vS2.textContent = `${(st.s2 * 100).toFixed(1)}%`; render(); });
sS3.addEventListener('input', () => { st.s3 = parseFloat(sS3.value); vS3.textContent = `${(st.s3 * 100).toFixed(1)}%`; render(); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 40, b: 50 };
  const lmin = 0, lmax = 11;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  for (let i = 0; i <= lmax; i += 1) {
    const x = pad.l + i / lmax * (W - pad.l - pad.r);
    ctx.moveTo(x, pad.t + 50); ctx.lineTo(x, pad.t + 60);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText(`10^${i}`, x - 12, pad.t + 75);
  }
  ctx.moveTo(pad.l, pad.t + 55); ctx.lineTo(W - pad.r, pad.t + 55); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('d (pc)', W - 50, pad.t + 75);
  const rungs = [
    { name: 'Parallax', range: [0, 3], color: '#5bc0eb', sigma: st.s1 },
    { name: 'Cepheids', range: [3, 8], color: '#ffd166', sigma: st.s2 },
    { name: 'SN Ia', range: [8, 9.7], color: '#ef476f', sigma: st.s3 },
    { name: 'Hubble flow', range: [9.5, 11], color: '#06d6a0', sigma: ladderUncertainty([st.s1, st.s2, st.s3]) },
  ];
  rungs.forEach((r, i) => {
    const x0 = pad.l + r.range[0] / lmax * (W - pad.l - pad.r);
    const x1 = pad.l + r.range[1] / lmax * (W - pad.l - pad.r);
    const y = pad.t + 100 + i * 50;
    // Distance uncertainty drawn as an error band whose half-height is
    // proportional to sigma, so each slider visibly fattens its rung and
    // the Hubble-flow band (the orthogonal compounded sum) visibly grows
    // as any upstream sigma increases. Previously sigma only changed a
    // label digit, so the sliders read as dead.
    const half = Math.max(2, Math.min(22, 2 + r.sigma * 190));   // capped < half the 50 px rung spacing
    ctx.fillStyle = r.color + '33';
    ctx.fillRect(x0, y - half, x1 - x0, 2 * half);
    ctx.strokeStyle = r.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ctx.strokeRect(x0, y - half, x1 - x0, 2 * half); ctx.globalAlpha = 1;
    ctx.strokeStyle = r.color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.fillStyle = r.color; ctx.font = '12px ui-monospace, monospace';
    const lbl = `${r.name}  σ = ${(r.sigma * 100).toFixed(1)}%  (+-${half.toFixed(0)} px)`;
    const lx = Math.min(x0, W - pad.r - lbl.length * 7.2);
    ctx.fillText(lbl, Math.max(pad.l, lx), y - half - 6);
  });
  const sigma_total = ladderUncertainty([st.s1, st.s2, st.s3]);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Compounded σ at the Hubble flow: ${(sigma_total * 100).toFixed(1)}% (orthogonal sum)`, 12, H - 12);
  rS.textContent = `${(sigma_total * 100).toFixed(1)}%`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
