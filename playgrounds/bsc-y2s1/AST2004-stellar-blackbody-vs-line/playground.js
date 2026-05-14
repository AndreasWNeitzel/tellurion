import { spectrum, wienPeakNm, LINES, planckLambda } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rPeak = document.getElementById('readout-peak');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const selS = document.getElementById('select-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { T: 5800, depth: 1, scale: 'lin', tA: 0 };
let running = true;
sT.addEventListener('input', () => { st.T = parseFloat(sT.value); vT.textContent = st.T.toFixed(0); });
sD.addEventListener('input', () => { st.depth = parseFloat(sD.value); vD.textContent = st.depth.toFixed(2); });
selS.addEventListener('change', () => { st.scale = selS.value; });
btnR.addEventListener('click', () => { st.tA = 0; st.T = 5800; sT.value = 5800; vT.textContent = '5800'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const lamMin = 200, lamMax = 1200, W = canvas.width, H = canvas.height;
  const pad = { l: 60, r: 30, t: 40, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  for (let lam = 300; lam <= 1100; lam += 100) {
    const x = pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    ctx.strokeStyle = '#262626'; ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.fillText(lam, x - 12, H - pad.b + 14);
  }
  ctx.fillText('λ (nm)', W / 2 - 30, H - 12);
  ctx.fillText('flux', 12, pad.t + 10);
  const N = 800;
  let yMax = 0; const samples = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const lam = lamMin + (lamMax - lamMin) * i / (N - 1);
    samples[i] = spectrum(lam, st.T, st.depth);
    if (samples[i] > yMax) yMax = samples[i];
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lam = lamMin + (lamMax - lamMin) * i / (N - 1);
    const x = pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    let y = samples[i] / yMax;
    if (st.scale === 'log') y = Math.log10(1 + samples[i]) / Math.log10(1 + yMax);
    const py = H - pad.b - y * (H - pad.t - pad.b);
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(91,192,235,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lam = lamMin + (lamMax - lamMin) * i / (N - 1);
    const x = pad.l + (lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    let yC = planckLambda(lam * 1e-9, st.T) / yMax;
    if (st.scale === 'log') yC = Math.log10(1 + planckLambda(lam * 1e-9, st.T)) / Math.log10(1 + yMax);
    const py = H - pad.b - yC * (H - pad.t - pad.b);
    if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
  }
  ctx.stroke();
  for (const L of LINES) {
    const x = pad.l + (L.lam - lamMin) / (lamMax - lamMin) * (W - pad.l - pad.r);
    if (x < pad.l || x > W - pad.r) continue;
    ctx.fillStyle = '#5bc0eb'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(L.name, x - 20, pad.t + 10);
    ctx.strokeStyle = 'rgba(91,192,235,0.3)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(x, pad.t + 14); ctx.lineTo(x, H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T = ${st.T.toFixed(0)} K, λ_peak = ${wienPeakNm(st.T).toFixed(0)} nm`, 12, H - 30);
  rPeak.textContent = `${wienPeakNm(st.T).toFixed(0)} nm`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) { st.tA += dt; st.T = 5800 + 8000 * Math.sin(st.tA * 0.4); sT.value = Math.max(2500, Math.min(30000, st.T)); vT.textContent = st.T.toFixed(0); } render(); requestAnimationFrame(tick); }
function bootSync() { st.T = 5800 + 8000 * Math.sin(CAPTURE_FRAC * Math.PI * 2); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
