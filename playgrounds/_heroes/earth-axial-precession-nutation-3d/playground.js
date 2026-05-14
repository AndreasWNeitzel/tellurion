import { precessionLongitude, nutation, obliquity, EPS0_DEG, PREC_RATE_ARCSEC_YR } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sY = document.getElementById('slider-y'), vY = document.getElementById('value-y');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { scale: 2, year0: 0, t: 0 }; let running = true;
sS.addEventListener('input', () => { st.scale = parseFloat(sS.value); vS.textContent = st.scale.toFixed(1); });
sY.addEventListener('input', () => { st.year0 = parseFloat(sY.value); vY.textContent = st.year0.toFixed(0); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width * 0.35, cy = canvas.height * 0.55;
  const R = 130;
  ctx.fillStyle = 'rgba(91,192,235,0.2)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1; ctx.stroke();
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.strokeStyle = 'rgba(91,192,235,0.15)';
    const y0 = R * Math.sin(lat * Math.PI / 180);
    const rx = R * Math.cos(lat * Math.PI / 180);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * 0.25, 0, 0, 2 * Math.PI); ctx.translate(0, 0); ctx.stroke();
  }
  // Time variable in years.
  const yearsTotal = Math.pow(10, st.scale) * 100;
  const phase = ((running ? st.t * 0.5 : 0) % 1);
  const year_now = st.year0 + phase * yearsTotal;
  // Axis tip on celestial sphere: precession + nutation.
  function axisTip(year) {
    const psiArcsec = precessionLongitude(year);
    const psi = psiArcsec / 3600 * Math.PI / 180;
    const eps = obliquity(year) * Math.PI / 180;
    return { x: Math.sin(eps) * Math.cos(psi), y: Math.sin(eps) * Math.sin(psi), z: Math.cos(eps) };
  }
  // Draw the cone trace over years history.
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let y = 0; y < yearsTotal; y += yearsTotal / 400) {
    const T = axisTip(st.year0 + y);
    const px = cx + T.x * R * 1.4 + T.z * R * 0.4;
    const py = cy - T.y * R * 1.4 + T.z * R * 0.3;
    if (y === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const Tnow = axisTip(year_now);
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Tnow.x * R * 1.4 + Tnow.z * R * 0.4, cy - Tnow.y * R * 1.4 + Tnow.z * R * 0.3);
  ctx.stroke();
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(cx + Tnow.x * R * 1.4 + Tnow.z * R * 0.4, cy - Tnow.y * R * 1.4 + Tnow.z * R * 0.3, 7, 0, 2 * Math.PI); ctx.fill();
  // Right panel: nutation timeseries.
  const x0 = canvas.width * 0.62, w = canvas.width - x0 - 40, y0p = 80, h = canvas.height - 130;
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(x0, y0p); ctx.lineTo(x0, y0p + h); ctx.lineTo(x0 + w, y0p + h); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Nutation (arcsec)', x0, y0p - 6); ctx.fillText('years', x0 + w - 30, y0p + h + 14);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const y = year_now - 30 + i / 200 * 60;
    const n = nutation(y);
    const px = x0 + i / 200 * w;
    const py = y0p + h / 2 - n.dPsi / 30 * h * 0.4;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const y = year_now - 30 + i / 200 * 60;
    const n = nutation(y);
    const px = x0 + i / 200 * w;
    const py = y0p + h / 2 - n.dEps / 30 * h * 0.4;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.fillText('Δψ (yellow)', x0 + 6, y0p + 14);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('Δε (cyan)', x0 + 6, y0p + 30);
  const eps = obliquity(year_now);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`epoch ${year_now.toFixed(0)} yr from J2000`, 12, canvas.height - 12);
  ctx.fillText(`obliquity ε = ${eps.toFixed(4)}°`, 12, canvas.height - 30);
  rE.textContent = `${eps.toFixed(3)}°`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
