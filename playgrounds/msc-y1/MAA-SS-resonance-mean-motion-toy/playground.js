// Kirkwood gaps as a top-down view of the asteroid belt. Sun at centre,
// asteroids on near-circular orbits coloured by semi-major axis; rings
// are cleared at the mean-motion resonances with Jupiter (3:1, 5:2,
// 7:3, 2:1), so the gaps appear as dark annuli. Moving Jupiter's
// semi-major axis slides every resonance radius and the gaps move with
// it. Reference: Murray-Dermott, Solar System Dynamics, Ch. 8-9.

import { resonanceSemiMajor, KIRKWOOD_RATIOS } from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { aJ: 5.2, t: 0 }; let running = true;
let last = performance.now();

sA.addEventListener('input', () => { st.aJ = parseFloat(sA.value); vA.textContent = st.aJ.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const A_IN = 2.0, A_OUT = 3.5;          // belt extent (AU)
const GAP_HALF = 0.10;                  // resonance clearing half-width (AU)

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
  const cx = W * 0.42, cy = H * 0.5;
  // Scale so Jupiter's orbit fits with margin.
  const PX = Math.min(W * 0.42, H * 0.46) / st.aJ;

  // Resonance radii with Jupiter at this aJ.
  const res = KIRKWOOD_RATIOS.map(K => ({ a: resonanceSemiMajor(st.aJ, K.p, K.q), label: K.ratio }))
    .filter(r => r.a > A_IN && r.a < A_OUT);

  // Sun.
  const sun = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
  sun.addColorStop(0, '#fff3c4'); sun.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fill();

  // Faint dark annulus at each resonance so the cleared ring is
  // unmistakable even before the eye parses the density drop.
  for (const r of res) {
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2 * GAP_HALF * PX;
    ctx.beginPath(); ctx.arc(cx, cy, PX * r.a, 0, 2 * Math.PI); ctx.stroke();
  }
  // Asteroid belt: deterministic seeded positions, cleared at resonances.
  const rng = makeRng(0xC0FFEE);
  const N = 9000;
  for (let i = 0; i < N; i += 1) {
    // a weighted toward the belt centre; small eccentricity for realism.
    const a = A_IN + (A_OUT - A_IN) * rng();
    const th0 = rng() * 2 * Math.PI;
    let cleared = false;
    for (const r of res) if (Math.abs(a - r.a) < GAP_HALF) { cleared = true; break; }
    if (cleared && rng() < 0.985) continue;   // near-total clearing -> obvious dark ring
    const e = 0.02 + 0.06 * rng();
    const th = th0 + st.t * Math.pow(a, -1.5) * 0.6;     // Kepler: outer slower
    const rr = a * (1 - e * Math.cos(th));
    const x = cx + PX * rr * Math.cos(th);
    const y = cy + PX * rr * Math.sin(th);
    // Colour by semi-major axis (cool inner -> warm outer).
    const u = (a - A_IN) / (A_OUT - A_IN);
    ctx.fillStyle = `rgba(${(150 + 90 * u) | 0},${(190 - 60 * u) | 0},${(230 - 140 * u) | 0},0.7)`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // Resonance circles + labels (the gap centres).
  for (const r of res) {
    ctx.strokeStyle = 'rgba(239,71,111,0.55)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, PX * r.a, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`${r.label}  ${r.a.toFixed(2)} AU`, cx + PX * r.a * 0.71 + 2, cy - PX * r.a * 0.71);
  }

  // Jupiter orbit + planet.
  ctx.strokeStyle = 'rgba(120,160,255,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, PX * st.aJ, 0, 2 * Math.PI); ctx.stroke();
  const jth = st.t * Math.pow(st.aJ, -1.5) * 0.6;
  const jx = cx + PX * st.aJ * Math.cos(jth), jy = cy + PX * st.aJ * Math.sin(jth);
  ctx.fillStyle = '#7c9cff'; ctx.beginPath(); ctx.arc(jx, jy, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('Jupiter', jx + 10, jy + 4);

  ctx.fillStyle = '#9aa0a6';
  ctx.fillText(`a_Jupiter = ${st.aJ.toFixed(2)} AU   gaps cleared at mean-motion resonances`, 12, H - 14);
  rR.textContent = `${resonanceSemiMajor(st.aJ, 2, 1).toFixed(2)} AU`;
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt * 0.4;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 14;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
