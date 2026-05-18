import { Pi_l, evolutionStage } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sMin = document.getElementById('slider-min'), vMin = document.getElementById('value-min');
const sMax = document.getElementById('slider-max'), vMax = document.getElementById('value-max');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { Pi: 80, Pmin: 500, Pmax: 2500 }; let running = true;
sP.addEventListener('input', () => { st.Pi = parseFloat(sP.value); vP.textContent = st.Pi.toFixed(0); });
sMin.addEventListener('input', () => { st.Pmin = parseFloat(sMin.value); vMin.textContent = st.Pmin.toFixed(0); });
sMax.addEventListener('input', () => { st.Pmax = parseFloat(sMax.value); vMax.textContent = st.Pmax.toFixed(0); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 50, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('P (s)', W - 30, H - pad.b + 14);
  const xToPx = (p) => pad.l + (p - st.Pmin) / (st.Pmax - st.Pmin) * (W - pad.l - pad.r);
  // l=1 g modes.
  const Pi1 = st.Pi;
  for (let k = -1000; k < 1000; k += 1) {
    const P = Pi1 * k + 1500;
    if (P < st.Pmin || P > st.Pmax) continue;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xToPx(P), pad.t + 60); ctx.lineTo(xToPx(P), H - pad.b); ctx.stroke();
  }
  // l=2 g modes (smaller spacing).
  const Pi2 = Pi_l(Pi1 * Math.sqrt(2), 2);
  for (let k = -1000; k < 1000; k += 1) {
    const P = Pi2 * k + 1500;
    if (P < st.Pmin || P > st.Pmax) continue;
    ctx.strokeStyle = 'rgba(91,192,235,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xToPx(P), pad.t + 100); ctx.lineTo(xToPx(P), H - pad.b - 30); ctx.stroke();
  }
  ctx.fillStyle = '#ffd166'; ctx.font = '12px ui-monospace, monospace'; ctx.fillText(`ℓ = 1: ΔP = Π_1 = ${Pi1.toFixed(0)} s`, pad.l, pad.t + 20);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`ℓ = 2: ΔP = Π_1 / √3 = ${Pi2.toFixed(0)} s`, pad.l, pad.t + 40);
  const stage = evolutionStage(Pi1);
  ctx.fillStyle = stage === 'RGB' ? '#ef476f' : stage === 'RC' ? '#06d6a0' : '#9aa0a6';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`evolution: ${stage}`, W - 200, pad.t + 20);
  rS.textContent = stage;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  // Reference capture sweeps the asymptotic period spacing Pi_1 from
  // the red-giant-branch regime (~80 s) up through the red-clump
  // regime (~280 s), so the five golden frames are distinct: the comb
  // spacing widens and the evolution-stage label flips RGB -> RC.
  if (CAPTURE_NAME) {
    st.Pi = 60 + CAPTURE_FRAC * 220;
    sP.value = String(st.Pi);
    vP.textContent = st.Pi.toFixed(0);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
