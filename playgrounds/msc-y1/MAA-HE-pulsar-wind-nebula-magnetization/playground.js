// Pulsar wind nebula (Crab-like), shown as the object itself: a
// rotating neutron star drives a cold relativistic wind that ends at a
// termination shock, beyond which a magnetized synchrotron bubble forms
// an equatorial torus and, when the magnetization sigma is high, bright
// collimated polar jets (the Crab "sigma problem"). The shock radius
// R_TS = sqrt(L_sd / 4 pi c P_ext) is mapped logarithmically to screen
// so both the spin-down luminosity and the external pressure visibly
// move it (the old linear map saturated and the pressure slider was
// dead). sigma sets the torus-vs-jet balance.
// Reference: Kennel and Coroniti, ApJ 283, 694 (1984); Rybicki and
// Lightman, Radiative Processes in Astrophysics (1979), Ch. 6.

import { terminationRadius } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sL = document.getElementById('slider-L'), vL = document.getElementById('value-L');
const sP = document.getElementById('slider-P'), vP = document.getElementById('value-P');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { logL: 38.7, logP: -9, sigma: 0.003 };
const st = { ...DEF, t: 0 }; let running = true;
let last = performance.now();
const PC = 3.086e18, Q = 0.42;                 // view tilt (equatorial squash)
const stars = (() => { const r = makeRng(DEFAULT_SEED); const a = []; for (let i = 0; i < 140; i += 1) a.push([r(), r(), 0.5 + 1.4 * r()]); return a; })();

sL.addEventListener('input', () => { st.logL = parseFloat(sL.value); vL.textContent = st.logL.toFixed(1); if (!running) render(); });
sP.addEventListener('input', () => { st.logP = parseFloat(sP.value); vP.textContent = st.logP.toFixed(1); if (!running) render(); });
sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(3); if (!running) render(); });
btnR.addEventListener('click', () => { Object.assign(st, DEF); sL.value = '38.7'; sP.value = '-9'; sS.value = '0.003'; vL.textContent = '38.7'; vP.textContent = '-9.0'; vS.textContent = '0.003'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

function render() {
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2 + 6;
  ctx.fillStyle = '#04040a'; ctx.fillRect(0, 0, W, H);
  for (const [sx, sy, sr] of stars) { ctx.fillStyle = `rgba(180,195,230,${0.15 + 0.25 * sr / 1.9})`; ctx.fillRect(sx * W, sy * H, sr, sr); }

  const L = Math.pow(10, st.logL), Pext = Math.pow(10, st.logP);
  const R_TS_pc = terminationRadius(L, Pext) / PC;
  // R_TS spans ~8 decades over the joint (L, P_ext) range; a wide,
  // gently sloped log map keeps BOTH sliders responsive everywhere
  // (a tight clamp pinned the shock and killed the pressure slider).
  const Rpx = Math.max(22, Math.min(236, 130 + 24 * (Math.log10(R_TS_pc) + 1)));
  const s = st.sigma, jetFrac = s / (1 + s), parFrac = 1 / (1 + s);   // mag vs particle
  const ph = CAPTURE_NAME ? CAPTURE_FRAC * 4 : st.t;

  // Outer synchrotron bubble.
  const og = ctx.createRadialGradient(cx, cy, Rpx, cx, cy, Rpx + 150);
  og.addColorStop(0, `rgba(120,90,200,${0.16 * parFrac + 0.05})`); og.addColorStop(1, 'rgba(120,90,200,0)');
  ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(cx, cy, Rpx + 150, (Rpx + 150) * Q, 0, 0, 6.28); ctx.fill();

  // Cold relativistic wind: faint radial streaks pulsar -> shock.
  for (let k = 0; k < 60; k += 1) {
    const a = k / 60 * 6.283, rr = 12 + ((ph * 60 + k * 7) % (Rpx - 14));
    ctx.fillStyle = 'rgba(120,200,255,0.30)';
    ctx.fillRect(cx + rr * Math.cos(a), cy + rr * Q * Math.sin(a), 1.5, 1.5);
  }

  // Equatorial torus (bright for particle-dominated, Crab-like).
  ctx.strokeStyle = `rgba(255,150,70,${0.20 + 0.6 * parFrac})`; ctx.lineWidth = 10 + 16 * parFrac;
  ctx.beginPath(); ctx.ellipse(cx, cy, Rpx + 26, (Rpx + 26) * Q, 0, 0, 6.28); ctx.stroke();
  ctx.strokeStyle = `rgba(255,220,140,${0.15 + 0.45 * parFrac})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, Rpx + 26, (Rpx + 26) * Q, 0, 0, 6.28); ctx.stroke();

  // Termination shock ring.
  ctx.strokeStyle = '#ff5d8f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, Rpx, Rpx * Q, 0, 0, 6.28); ctx.stroke();

  // Polar jets along the (vertical) spin axis: length and glow grow
  // with magnetization (the sigma problem of the Crab).
  const jLen = 30 + 230 * jetFrac;
  for (const sgn of [-1, 1]) {
    const jg = ctx.createLinearGradient(cx, cy, cx, cy + sgn * jLen);
    jg.addColorStop(0, `rgba(120,230,255,${0.25 + 0.6 * jetFrac})`); jg.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.strokeStyle = jg; ctx.lineWidth = 4 + 10 * jetFrac;
    ctx.beginPath(); ctx.moveTo(cx, cy + sgn * Rpx * Q * 0.3); ctx.lineTo(cx, cy + sgn * jLen); ctx.stroke();
    if (jetFrac > 0.15) { ctx.fillStyle = `rgba(180,245,255,${0.5 * jetFrac})`; ctx.beginPath(); ctx.arc(cx, cy + sgn * jLen, 4 + 8 * jetFrac, 0, 6.28); ctx.fill(); }
  }

  // Drifting wisps just outside the shock (the Crab's moving wisps).
  for (let i = 0; i < 3; i += 1) {
    const rr = Rpx + 8 + ((ph * 26 + i * 22) % 56);
    ctx.strokeStyle = `rgba(255,210,150,${0.5 * (1 - (rr - Rpx) / 64)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * Q, 0, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * Q, 0, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  }

  // Pulsar with sweeping lighthouse beams.
  const ba = ph * 6.0;
  for (const sgn of [0, Math.PI]) {
    const g = ctx.createLinearGradient(cx, cy, cx + 150 * Math.cos(ba + sgn), cy + 150 * Math.sin(ba + sgn) * Q);
    g.addColorStop(0, 'rgba(160,210,255,0.5)'); g.addColorStop(1, 'rgba(160,210,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 150 * Math.cos(ba + sgn), cy + 150 * Math.sin(ba + sgn) * Q); ctx.stroke();
  }
  const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.28); ctx.fill();

  ctx.fillStyle = '#cdd1d6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`R_TS = ${R_TS_pc < 0.01 ? R_TS_pc.toExponential(2) : R_TS_pc.toFixed(3)} pc`, 14, 22);
  ctx.fillText(`log L_sd = ${st.logL.toFixed(1)}   log P_ext = ${st.logP.toFixed(1)}`, 14, 40);
  ctx.fillStyle = s < 0.1 ? '#ff9d6e' : '#7cdfff';
  ctx.fillText(`σ = ${s.toFixed(3)}  ${s < 0.1 ? 'particle-dominated → bright torus (Crab)' : 'magnetically dominated → strong jets'}`, 14, H - 16);
  rR.textContent = `${R_TS_pc < 0.01 ? R_TS_pc.toExponential(2) : R_TS_pc.toFixed(3)} pc`;
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }
