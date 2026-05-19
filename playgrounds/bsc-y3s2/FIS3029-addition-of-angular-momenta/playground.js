import { allowedJ, multiplicity, totalMultiplicityFromJ } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sJ1 = document.getElementById('slider-j1'), vJ1 = document.getElementById('value-j1');
const sJ2 = document.getElementById('slider-j2'), vJ2 = document.getElementById('value-j2');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { j1: 0.5, j2: 0.5 }; let running = true;
function jLabel(v) { return v % 1 === 0 ? `${v}` : `${v * 2}/2`; }
sJ1.addEventListener('input', () => { st.j1 = parseFloat(sJ1.value) / 2; vJ1.textContent = jLabel(st.j1); });
sJ2.addEventListener('input', () => { st.j2 = parseFloat(sJ2.value) / 2; vJ2.textContent = jLabel(st.j2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const Js = allowedJ(st.j1, st.j2);
  ctx.fillStyle = '#ffd166'; ctx.font = '16px ui-monospace, monospace';
  ctx.fillText(`${jLabel(st.j1)} ⊗ ${jLabel(st.j2)} =`, 30, 40);
  let xCursor = 200, yLine = 40;
  Js.forEach((J, i) => {
    ctx.fillStyle = '#06d6a0';
    ctx.fillText(`${jLabel(J)}`, xCursor, yLine);
    xCursor += 50;
    if (i < Js.length - 1) {
      ctx.fillStyle = '#9aa0a6'; ctx.fillText('⊕', xCursor, yLine); xCursor += 28;
    }
  });
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`dim = ${(2 * st.j1 + 1).toFixed(0)} × ${(2 * st.j2 + 1).toFixed(0)} = ${multiplicity(st.j1, st.j2)}`, 30, 80);
  ctx.fillText(`Σ(2J+1) = ${totalMultiplicityFromJ(st.j1, st.j2)}`, 30, 100);
  Js.forEach((J, i) => {
    const yPanel = 130 + i * 70;
    ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(60, yPanel + 30); ctx.lineTo(canvas.width - 30, yPanel + 30); ctx.stroke();
    ctx.fillStyle = '#06d6a0'; ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(`J = ${jLabel(J)}, m: `, 30, yPanel + 18);
    const dim = 2 * J + 1;
    const x0 = 130;
    for (let k = 0; k < dim; k += 1) {
      const m = J - k;
      const px = x0 + k * 50;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(px, yPanel + 30, 8, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(jLabel(m), px - 10, yPanel + 52);
    }
  });
  rS.textContent = `${totalMultiplicityFromJ(st.j1, st.j2)}`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // Sweep the coupling so the five frames show progressively richer
    // decompositions (more allowed J, taller m-ladders).
    const pairs = [[0.5, 0.5], [1, 0.5], [1, 1], [1.5, 1], [2, 1]];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    const p = pairs[Math.min(pairs.length - 1, Math.round(frac * (pairs.length - 1)))];
    st = { j1: p[0], j2: p[1] };
    sJ1.value = String(2 * st.j1); vJ1.textContent = jLabel(st.j1);
    sJ2.value = String(2 * st.j2); vJ2.textContent = jLabel(st.j2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
