import { isothermalPressure, adiabaticPressure, adiabaticTemperature } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rP = document.getElementById('readout-p'), rT = document.getElementById('readout-t');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const selP = document.getElementById('select-p');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause'), btnRev = document.getElementById('btn-rev');
let st = { gamma: 1.4, T0: 300, V0: 1, P0_iso: 1, mode: 'both', V: 1, dir: 1, curve: 'both' };
let running = true;
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(2); });
sT.addEventListener('input', () => { st.T0 = parseFloat(sT.value); vT.textContent = st.T0.toFixed(0); });
selP.addEventListener('change', () => { st.curve = selP.value; });
btnR.addEventListener('click', () => { st.V = 1; st.dir = 1; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
btnRev.addEventListener('click', () => { st.dir = -st.dir; });
let last = performance.now();
function mapV(V) { return 80 + (V - 0.25) / (2.5 - 0.25) * (canvas.width - 120); }
function mapP(P) { return canvas.height - 60 - (P - 0) / 4 * (canvas.height - 90); }
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1; ctx.font = '11px ui-monospace, monospace';
  for (let v = 0.5; v <= 2.5; v += 0.5) {
    ctx.strokeStyle = '#262626'; ctx.beginPath(); ctx.moveTo(mapV(v), 20); ctx.lineTo(mapV(v), canvas.height - 50); ctx.stroke();
  }
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(80, 20); ctx.lineTo(80, canvas.height - 50); ctx.lineTo(canvas.width - 40, canvas.height - 50); ctx.stroke();
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('V (norm.)', canvas.width - 70, canvas.height - 30);
  ctx.fillText('P (norm.)', 20, 20);
  const showIso = st.curve === 'both' || st.curve === 'iso';
  const showAdi = st.curve === 'both' || st.curve === 'adi';
  if (showIso) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = 0.25; v <= 2.5; v += 0.01) {
      const P = 1 / v;
      const px = mapV(v), py = mapP(P);
      if (v <= 0.26) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  if (showAdi) {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = 0.25; v <= 2.5; v += 0.01) {
      const P = Math.pow(1 / v, st.gamma);
      const px = mapV(v), py = mapP(P);
      if (v <= 0.26) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  const Piso = 1 / st.V;
  const Padi = Math.pow(1 / st.V, st.gamma);
  const Tiso = st.T0;
  const Tadi = adiabaticTemperature(st.V, 1, st.T0, st.gamma);
  if (showIso) {
    ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(mapV(st.V), mapP(Piso), 7, 0, 2 * Math.PI); ctx.fill();
  }
  if (showAdi) {
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(mapV(st.V), mapP(Padi), 7, 0, 2 * Math.PI); ctx.fill();
  }
  const pistonX = 60, pistonY = 20, pistonW = canvas.width / 2 - 100;
  ctx.strokeStyle = '#9aa0a6'; ctx.strokeRect(pistonX, pistonY, pistonW, 30);
  ctx.fillStyle = 'rgba(91,192,235,0.3)';
  ctx.fillRect(pistonX, pistonY, pistonW * Math.min(1, st.V / 2.5), 30);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pistonX + pistonW * Math.min(1, st.V / 2.5), pistonY - 5); ctx.lineTo(pistonX + pistonW * Math.min(1, st.V / 2.5), pistonY + 35); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText(`V = ${st.V.toFixed(2)}`, pistonX, 12);
  ctx.fillText(`Iso: P = ${Piso.toFixed(2)}, T = ${Tiso.toFixed(0)} K`, 12, 100);
  ctx.fillStyle = '#ffd166'; ctx.fillText(`Adi: P = ${Padi.toFixed(2)}, T = ${Tadi.toFixed(0)} K`, 12, 118);
  rP.textContent = (showAdi ? Padi : Piso).toFixed(2);
  rT.textContent = (showAdi ? Tadi : Tiso).toFixed(0) + ' K';
}
function tick(now) { const dt = (now - last) / 1000; last = now;
  if (running) {
    st.V += st.dir * dt * 0.5;
    if (st.V > 2.4) st.dir = -1;
    if (st.V < 0.3) st.dir = 1;
  }
  render(); requestAnimationFrame(tick); }
function bootSync() { st.V = 1 + 1.4 * Math.sin(CAPTURE_FRAC * Math.PI * 2); render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
