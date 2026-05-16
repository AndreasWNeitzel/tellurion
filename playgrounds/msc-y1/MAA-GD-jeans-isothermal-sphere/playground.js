// Singular isothermal sphere, made physical. Left: a face-on halo with
// density shading rho ~ 1/r^2 and tracer stars on circular orbits at
// the flat circular speed v_c = sqrt(2) sigma. Because v_c is the same
// at every radius, an initially straight spoke winds into a spiral
// (the differential-rotation "winding problem"). Right: the flat
// rotation curve and the linearly rising enclosed mass M(<r) ~ r.
// sim.js is unchanged (invariant-tested).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { massEnclosed, vCirc } from './sim.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rV = document.getElementById('readout-v');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
const RMAX = 40;                       // kpc shown
const st = { sigma: 200, t: 0, running: !DETERMINISTIC, stars: [], spoke: [] };

function buildStars() {
  const rng = makeRng(SEED);
  st.stars = [];
  for (let i = 0; i < 520; i += 1) {
    const r = 2 + (RMAX - 2) * Math.sqrt(rng());     // ~ uniform in area
    st.stars.push({ r, th: rng() * 2 * Math.PI });
  }
  st.spoke = [];
  for (let i = 0; i < 60; i += 1) st.spoke.push({ r: 2 + (RMAX - 2) * i / 59, th0: 0.5 });
  st.t = 0;
}

const SCENE_CX = W * 0.26, SCENE_CY = H * 0.52, SCENE_R = Math.min(W * 0.22, H * 0.40);
const kpcToPx = SCENE_R / RMAX;

// Orbital angular speed Omega(r) = v_c / r (v_c flat). The ratio
// between radii is the physics; the prefactor sets visual pacing.
function omega(r) { return (st.sigma / 200) * 0.9 / r; }

function drawHalo() {
  const g = ctx.createRadialGradient(SCENE_CX, SCENE_CY, 2, SCENE_CX, SCENE_CY, SCENE_R);
  g.addColorStop(0, 'rgba(120,150,210,0.55)');
  g.addColorStop(0.18, 'rgba(70,90,150,0.30)');
  g.addColorStop(0.5, 'rgba(40,55,100,0.12)');
  g.addColorStop(1, 'rgba(20,28,55,0.02)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(SCENE_CX, SCENE_CY, SCENE_R, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  for (const rk of [10, 20, 30, 40]) {
    ctx.beginPath(); ctx.arc(SCENE_CX, SCENE_CY, rk * kpcToPx, 0, 2 * Math.PI); ctx.stroke();
  }
  for (const s of st.stars) {
    const a = s.th + omega(s.r) * st.t;
    const x = SCENE_CX + s.r * kpcToPx * Math.cos(a);
    const y = SCENE_CY + s.r * kpcToPx * Math.sin(a);
    ctx.fillStyle = 'rgba(245,235,200,0.85)';
    ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < st.spoke.length; i += 1) {
    const sp = st.spoke[i];
    const a = sp.th0 + omega(sp.r) * st.t;
    const x = SCENE_CX + sp.r * kpcToPx * Math.cos(a);
    const y = SCENE_CY + sp.r * kpcToPx * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('rho ~ 1/r^2 halo; stars orbit at constant v_c (spoke winds up)', SCENE_CX, SCENE_CY + SCENE_R + 22);
}

function drawGraphs() {
  const sigma_si = st.sigma * 1000;
  const vc = vCirc(sigma_si) / 1000;
  const px = W * 0.52, pw = W - px - 36;
  const yT = 56, yH = 170;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px, yT, pw, yH);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(px + 0.5, yT + 0.5, pw - 1, yH - 1);
  const xOf = (r) => px + 36 + (pw - 48) * r / RMAX;
  const yOf = (v) => yT + yH - 22 - (yH - 34) * v / 600;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (const r of [10, 20, 30, 40]) { const x = xOf(r); ctx.beginPath(); ctx.moveTo(x, yT + 6); ctx.lineTo(x, yT + yH - 22); ctx.stroke(); }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const r = 1 + (RMAX - 1) * i / 120; const X = xOf(r), Y = yOf(vc); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('v_c(r) = sqrt(2) sigma  (flat)', px + 8, yT + 16);
  ctx.textAlign = 'center'; ctx.fillText('r (kpc)', px + pw / 2, yT + yH - 4);

  const m0 = massEnclosed(RMAX * 3.086e19, sigma_si) / 1.989e30;
  const y2 = yT + yH + 26, y2H = H - y2 - 34;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px, y2, pw, y2H);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(px + 0.5, y2 + 0.5, pw - 1, y2H - 1);
  const mOf = (r) => massEnclosed(r * 3.086e19, sigma_si) / 1.989e30;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const r = 1 + (RMAX - 1) * i / 120;
    const X = px + 36 + (pw - 48) * r / RMAX;
    const Y = y2 + y2H - 22 - (y2H - 34) * mOf(r) / (m0 * 1.05);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('M(<r) = 2 sigma^2 r / G  (linear)', px + 8, y2 + 16);
  ctx.textAlign = 'center'; ctx.fillText('r (kpc)', px + pw / 2, y2 + y2H - 4);

  rV.textContent = `${vc.toFixed(0)} km/s`;
  return { vc, m20: mOf(20) };
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawHalo();
  const { vc, m20 } = drawGraphs();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`sigma = ${st.sigma.toFixed(0)} km/s   v_c = sqrt(2) sigma = ${vc.toFixed(0)} km/s   M(<20 kpc) = ${m20.toExponential(2)} Msun`, 16, 26);
}

sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(0); });
btnR.addEventListener('click', () => { buildStars(); st.running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { st.running = !st.running; btnP.textContent = st.running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!st.running)); });

function tick() {
  if (st.running) st.t += 1.1;
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  buildStars();
  vS.textContent = st.sigma.toFixed(0);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.t = f * 70;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
