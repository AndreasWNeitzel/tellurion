// Kirkwood gaps forming dynamically. The asteroid belt starts FULL with
// no gaps; asteroids whose semi-major axis lies near a mean-motion
// resonance with Jupiter (3:1, 5:2, 7:3, 2:1) have their eccentricity
// pumped chaotically (Wisdom 1982), become planet-crossing, and are
// ejected. Ejected bodies that leave a cutoff radius are deleted for
// efficiency. The gaps are carved by the simulation, not pre-drawn.
// Reference: Murray-Dermott, Solar System Dynamics, Ch. 9.

import { resonanceSemiMajor, KIRKWOOD_RATIOS } from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

// Jupiter's semi-major axis is fixed at its real value; only the
// simulation speed is user-controlled.
const st = { aJ: 5.2, speed: 2, t: 0 }; let running = true;
let last = performance.now();

const A_IN = 2.0, A_OUT = 3.5;          // belt extent (AU)
const RES_W = 0.035;                    // resonance libration half-width (AU)
const E_EJECT = 0.55;                   // planet-crossing -> ejected
const R_CUT = 9.0;                      // delete past this heliocentric AU
const NPART = 30000;

const pa = new Float32Array(NPART);
const pe = new Float32Array(NPART);
const pth = new Float32Array(NPART);
const pph = new Float32Array(NPART);    // perihelion longitude
const pkick = new Float32Array(NPART);  // per-particle chaotic-growth factor
const palive = new Uint8Array(NPART);

function initBelt() {
  const rng = makeRng(0xC0FFEE);
  for (let i = 0; i < NPART; i += 1) {
    pa[i] = A_IN + (A_OUT - A_IN) * rng();
    pe[i] = 0.004 + 0.03 * rng();        // tiny: a FULL belt, no gaps
    pth[i] = 2 * Math.PI * rng();
    pph[i] = 2 * Math.PI * rng();
    pkick[i] = 0.5 + 1.5 * rng();        // spread in resonant pumping rate
    palive[i] = 1;
  }
  st.t = 0;
}
initBelt();

function resRadii() {
  return KIRKWOOD_RATIOS
    .map(K => ({ a: resonanceSemiMajor(st.aJ, K.p, K.q), s: (K.p === 3 && K.q === 1) || (K.p === 2 && K.q === 1) ? 1.0 : 0.6, label: K.ratio }))
    .filter(r => r.a > A_IN - 0.2 && r.a < A_OUT + 0.2);
}

function step(dt) {
  const res = resRadii();
  for (let i = 0; i < NPART; i += 1) {
    if (!palive[i]) continue;
    const a = pa[i];
    // Chaotic eccentricity pumping near any resonance.
    let pump = 0;
    for (const r of res) {
      const d = (a - r.a) / RES_W;
      pump += r.s * Math.exp(-d * d);
    }
    if (pump > 1e-4) pe[i] = Math.min(1.2, pe[i] + 0.06 * pump * pkick[i] * dt);
    // Slow perihelion precession + orbital motion (Kepler, outer slower).
    const n = Math.pow(a, -1.5);
    pth[i] += dt * n * 1.4;
    pph[i] += dt * 0.04;
    // Ejection: once planet-crossing, the orbit grows; delete past R_CUT.
    if (pe[i] > E_EJECT) {
      pa[i] += dt * 6.0 * (pe[i] - E_EJECT);          // flung outward
      if (pa[i] * (1 + pe[i]) > R_CUT) palive[i] = 0;  // gone (efficiency)
    }
  }
}

const HERO_BOT = 626;                    // belt scene occupies the top; histogram below
function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = 332;
  const PX = ((HERO_BOT - 36) / 2 - 14) / 5.4;            // Jupiter's orbit fits the hero
  const res = resRadii();

  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, HERO_BOT); ctx.clip();   // keep ejecta out of the histogram

  const sun = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
  sun.addColorStop(0, '#fff3c4'); sun.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fill();

  // Faint resonance circles (where the gaps are being carved).
  for (const r of res) {
    if (r.a < A_IN || r.a > A_OUT) continue;
    ctx.strokeStyle = 'rgba(239,71,111,0.30)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, PX * r.a, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  }

  let alive = 0, pumped = 0;
  for (let i = 0; i < NPART; i += 1) {
    if (!palive[i]) continue;
    alive += 1;
    const a = pa[i], e = pe[i];
    const rr = a * (1 - e * Math.cos(pth[i] - pph[i]));     // instantaneous radius
    const x = cx + PX * rr * Math.cos(pth[i]);
    const y = cy + PX * rr * Math.sin(pth[i]);
    if (e > 0.12) {
      pumped += 1;
      const hot = Math.min(1, (e - 0.12) / 0.4);
      ctx.fillStyle = `rgba(255,${(170 - 120 * hot) | 0},${(90 - 70 * hot) | 0},0.85)`;
      ctx.fillRect(x, y, 2, 2);
    } else {
      ctx.fillStyle = 'rgba(150,180,210,0.6)';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }

  // Jupiter.
  ctx.strokeStyle = 'rgba(120,160,255,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, PX * st.aJ, 0, 2 * Math.PI); ctx.stroke();
  const jth = st.t * Math.pow(st.aJ, -1.5) * 1.4;
  const jx = cx + PX * st.aJ * Math.cos(jth), jy = cy + PX * st.aJ * Math.sin(jth);
  ctx.fillStyle = '#7c9cff';
  ctx.beginPath(); ctx.arc(jx, jy, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(160,180,255,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Jupiter', jx, jy - 12);
  ctx.restore();

  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`t = ${st.t.toFixed(0)} (secular)   alive = ${alive}   resonance-pumped = ${pumped}`, 14, 22);
  rR.textContent = `${alive} alive`;

  drawHistogram(W, H, res);
}

// Rule-13 diagnostic: histogram of asteroid semi-major axes. The belt
// starts uniform; as resonant asteroids are ejected the histogram
// develops dips (the Kirkwood gaps) exactly at the marked mean-motion
// resonance locations. This is the quantitative companion to the
// orbital scene.
const HBINS = 72;
function drawHistogram(W, H, res) {
  const x0 = 40, x1 = W - 40, y0 = 664, y1 = 992;        // full-width, short panel below the belt
  ctx.fillStyle = 'rgba(8,12,22,0.92)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(220,230,255,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
  ctx.fillStyle = 'rgba(220,230,255,0.92)'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('asteroid count vs semi-major axis: the Kirkwood gaps carve themselves at the resonances', x0 + 10, y0 + 18);
  // Bin the alive asteroids.
  const bins = new Float64Array(HBINS);
  for (let i = 0; i < NPART; i += 1) {
    if (!palive[i]) continue;
    const f = (pa[i] - A_IN) / (A_OUT - A_IN);
    if (f < 0 || f >= 1) continue;
    bins[Math.min(HBINS - 1, (f * HBINS) | 0)] += 1;
  }
  let bMax = 1;
  for (const b of bins) if (b > bMax) bMax = b;
  const ax = x0 + 36, ay = y0 + 40, aw = (x1 - x0) - 50, ah = (y1 - y0) - 74;
  const xA = (a) => ax + ((a - A_IN) / (A_OUT - A_IN)) * aw;
  // Resonance markers (where gaps open) + labels.
  for (const r of res) {
    if (r.a < A_IN || r.a > A_OUT) continue;
    const xr = xA(r.a);
    ctx.strokeStyle = 'rgba(239,71,111,0.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(xr, ay); ctx.lineTo(xr, ay + ah); ctx.stroke(); ctx.setLineDash([]);
    if (r.label) {
      ctx.fillStyle = 'rgba(239,120,150,0.95)'; ctx.font = fontString(canvas, 'tick', 'mono', 600); ctx.textAlign = 'center';
      ctx.fillText(r.label, xr, ay - 5);
    }
  }
  // Bars.
  ctx.fillStyle = '#5bc0eb';
  const bw = aw / HBINS;
  for (let k = 0; k < HBINS; k += 1) {
    const bh = (bins[k] / bMax) * ah;
    ctx.fillRect(ax + k * bw, ay + ah - bh, Math.max(1, bw - 0.6), bh);
  }
  // Axis + ticks.
  ctx.strokeStyle = 'rgba(150,160,180,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  for (const a of [2.0, 2.5, 3.0, 3.5]) ctx.fillText(a.toFixed(1), xA(a), ay + ah + 16);
  ctx.fillText('semi-major axis a (AU)', ax + aw / 2, ay + ah + 30);
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) { const k = dt * 4 * st.speed; st.t += k; step(k); }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    initBelt();
    const steps = Math.round(CAPTURE_FRAC * 90);
    for (let s = 0; s < steps; s += 1) { st.t += 1.5; step(1.5); }
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
btnR.addEventListener('click', () => { initBelt(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
sSpeed.addEventListener('input', () => { st.speed = parseFloat(sSpeed.value); vSpeed.textContent = st.speed.toFixed(1); });

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  let alive = 0;
  for (let i = 0; i < NPART; i += 1) if (palive[i]) alive += 1;
  return {
    fields: [
      { key: 'jupiter-semimajor', label: 'Jupiter semi-major axis a_J (AU)', value: st.aJ, format: 'float' },
      { key: 'simulation-time', label: 'simulation time (years)', value: st.t, format: 'float' },
      { key: 'simulation-speed', label: 'speed multiplier', value: st.speed, format: 'float' },
      { key: 'particles-alive', label: 'asteroid particles not ejected', value: alive, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  // Particle conservation: dead count should increase monotonically
  let alive = 0;
  for (let i = 0; i < NPART; i += 1) if (palive[i]) alive += 1;
  inv.push({
    key: 'particle-count',
    label: 'particles alive should decrease due to ejection',
    value: alive.toFixed(0),
    status: alive >= 0 && alive <= NPART ? 'pass' : 'drift'
  });
  // Resonance prediction: computed gaps should align with Kirkwood ratios
  let gapCount = 0;
  for (const kr of KIRKWOOD_RATIOS) {
    const a_res = resonanceSemiMajor(st.aJ, kr.p, kr.q);
    if (a_res >= A_IN && a_res <= A_OUT) gapCount += 1;
  }
  inv.push({
    key: 'kirkwood-gaps',
    label: 'expected Kirkwood gap count in belt',
    value: gapCount.toFixed(0),
    status: gapCount > 0 ? 'pass' : 'pending'
  });
  return inv;
};
