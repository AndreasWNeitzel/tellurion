import { emissivity, cutoffHz, H, KB } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rC = document.getElementById('readout-c');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logT: 7, logn: 0 }; let running = true;
sT.addEventListener('input', () => { st.logT = parseFloat(sT.value); vT.textContent = st.logT.toFixed(2); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(1); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
// Bremsstrahlung scene state: an electron repeatedly flies past an ion,
// gets deflected, and emits an expanding radiation wavefront at periapsis.
const scene = { t: 0, pulses: [] };
function drawScene(W, sceneH) {
  scene.t += 0.016;
  const ionX = W * 0.52, ionY = sceneH * 0.5;
  // Electron path: comes from the left, hyperbolically deflected by the ion.
  const period = 3.2;
  const phase = (scene.t % period) / period;          // 0..1 per flyby
  const ex = W * 0.08 + phase * W * 0.84;
  const b = sceneH * 0.16;                              // impact parameter
  const dxi = ex - ionX;
  const ey = ionY + b - 1800 / (dxi * dxi / 60 + 40) * Math.sign(dxi || 1) * 0;
  // Smooth hyperbola-like vertical deflection peaking at periapsis.
  const defl = 70 * Math.exp(-(dxi * dxi) / (2 * 60 * 60));
  const eyy = ionY + b - defl;
  // Emit a radiation pulse as the electron passes periapsis.
  if (Math.abs(dxi) < 6 && (scene.pulses.length === 0 ||
      scene.t - scene.pulses[scene.pulses.length - 1].t0 > period * 0.5)) {
    scene.pulses.push({ x: ex, y: eyy, t0: scene.t });
  }
  scene.pulses = scene.pulses.filter(p => scene.t - p.t0 < 1.4);

  // Ion nucleus (with a faint Coulomb halo).
  const g = ctx.createRadialGradient(ionX, ionY, 0, ionX, ionY, 80);
  g.addColorStop(0, 'rgba(255,150,90,0.5)'); g.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ionX, ionY, 80, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ff9351';
  ctx.beginPath(); ctx.arc(ionX, ionY, 9, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ion (Ze)', ionX + 12, ionY - 12);

  // Radiation wavefronts (emitted at periapsis, expand outward).
  for (const p of scene.pulses) {
    const age = scene.t - p.t0;
    for (let k = 0; k < 3; k += 1) {
      const r = (age - k * 0.12) * 260;
      if (r <= 0) continue;
      ctx.strokeStyle = `rgba(125,211,252,${Math.max(0, 0.5 - age * 0.35)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.stroke();
    }
  }
  // Electron + its trajectory trail.
  ctx.strokeStyle = 'rgba(124,156,255,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let s = 0; s <= 60; s += 1) {
    const ph = s / 60;
    const x = W * 0.08 + ph * W * 0.84;
    const dd = x - ionX;
    const yy = ionY + b - 70 * Math.exp(-(dd * dd) / (2 * 60 * 60));
    if (s === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.fillStyle = '#7c9cff';
  ctx.beginPath(); ctx.arc(ex, eyy, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dcdde2';
  ctx.fillText('electron, deflected -> emits bremsstrahlung at periapsis', W * 0.06, 22);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, Hc = canvas.height;
  const sceneH = Hc * 0.46;
  drawScene(W, sceneH);
  // Spectrum is now the secondary lower panel.
  const H_px = Hc;
  const pad = { l: 60, r: 30, t: sceneH + 24, b: 44 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H_px - pad.b); ctx.lineTo(W - pad.r, H_px - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 e_nu', 12, pad.t + 10);
  ctx.fillText('log10 nu (Hz)', W / 2, H_px - pad.b + 18);
  const T = Math.pow(10, st.logT), n = Math.pow(10, st.logn);
  const lognu_min = 8, lognu_max = 22;
  const xToPx = (l) => pad.l + (l - lognu_min) / (lognu_max - lognu_min) * (W - pad.l - pad.r);
  let emax = -1e9, emin = 1e9;
  const N = 600; const eps = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const nu = Math.pow(10, lognu);
    const e = emissivity(nu, T, n, n);
    eps[i] = e > 0 ? Math.log10(e) : -50;
    if (eps[i] > emax) emax = eps[i]; if (eps[i] < emin) emin = eps[i];
  }
  emin = Math.max(emin, emax - 12);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const e = Math.max(emin, eps[i]);
    const py = H_px - pad.b - (e - emin) / (emax - emin) * (H_px - pad.t - pad.b);
    if (i === 0) ctx.moveTo(xToPx(lognu), py); else ctx.lineTo(xToPx(lognu), py);
  }
  ctx.stroke();
  const nu_c = cutoffHz(T);
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(Math.log10(nu_c)), pad.t); ctx.lineTo(xToPx(Math.log10(nu_c)), H_px - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`hν = kT @ log10 ν = ${Math.log10(nu_c).toFixed(2)}`, xToPx(Math.log10(nu_c)) + 4, pad.t + 16);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T = 10^${st.logT.toFixed(1)} K, n = 10^${st.logn.toFixed(1)} cm⁻³`, 12, H_px - 14);
  rC.textContent = `10^${Math.log10(nu_c).toFixed(1)} Hz`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
