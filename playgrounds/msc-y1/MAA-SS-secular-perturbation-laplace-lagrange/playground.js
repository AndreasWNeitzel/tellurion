// Laplace-Lagrange secular perturbations, two planets. Three coupled
// views: the actual orbits seen from above slowly breathing and
// precessing while the planets orbit fast; the eccentricity vectors
// (h,k) = (e cos w, e sin w) tracing the canonical Laplace-Lagrange
// circles; and e1(t), e2(t) exchanging amplitude at fixed total AMD.
// Reference: Murray-Dermott, Solar System Dynamics, Ch. 7.

import { amd } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { e0: 0.15, coupling: 0.3, t: 0 };
let running = true;
let last = performance.now();

sE.addEventListener('input', () => { st.e0 = parseFloat(sE.value); vE.textContent = st.e0.toFixed(2); render(); });
sC.addEventListener('input', () => { st.coupling = parseFloat(sC.value); vC.textContent = st.coupling.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Secular state at time t. The exchange angle phi = coupling*t rotates
// amplitude between the planets at fixed e1^2 + e2^2 (equal-mass AMD).
// Each perihelion precesses at one of the two eigenfrequencies.
function secular(t) {
  const phi = st.coupling * t;
  const e1 = st.e0 * Math.abs(Math.cos(phi));
  const e2 = st.e0 * Math.abs(Math.sin(phi));
  const g1 = -0.6 * st.coupling, g2 = 0.45 * st.coupling;
  const w1 = g1 * t;
  const w2 = g2 * t + Math.PI / 2;
  return { e1, e2, w1, w2 };
}

function keplerXY(a, e, w, M, scale, cx, cy) {
  // Solve Kepler for E, then position on the ellipse with focus at the
  // star (origin), rotated by the perihelion longitude w.
  let E = M;
  for (let i = 0; i < 6; i += 1) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xo = a * (Math.cos(E) - e);
  const yo = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return {
    x: cx + scale * (xo * Math.cos(w) - yo * Math.sin(w)),
    y: cy + scale * (xo * Math.sin(w) + yo * Math.cos(w)),
  };
}

function drawOrbit(a, e, w, scale, cx, cy, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 96; i += 1) {
    const E = (i / 96) * 2 * Math.PI;
    const xo = a * (Math.cos(E) - e);
    const yo = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const x = cx + scale * (xo * Math.cos(w) - yo * Math.sin(w));
    const y = cy + scale * (xo * Math.sin(w) + yo * Math.cos(w));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.stroke();
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const s = secular(st.t);

  // Panel A: top-down orbits (left half).
  const ax = W * 0.27, ay = H * 0.5, aS = 150;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('orbits from above (slow breathing + precession)', 14, 20);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 2 * Math.PI); ctx.fill();
  const a1 = 0.62, a2 = 1.0;
  drawOrbit(a1, s.e1, s.w1, aS, ax, ay, 'rgba(255,209,102,0.85)');
  drawOrbit(a2, s.e2, s.w2, aS, ax, ay, 'rgba(91,192,235,0.85)');
  // Planets orbit at a calm rate (Kepler n ~ a^-1.5). Fast strobing was
  // pure decorative churn that swamped the slider response.
  const M1 = (st.t * 1.3) / Math.pow(a1, 1.5);
  const M2 = (st.t * 1.3) / Math.pow(a2, 1.5);
  const p1 = keplerXY(a1, s.e1, s.w1, M1, aS, ax, ay);
  const p2 = keplerXY(a2, s.e2, s.w2, M2, aS, ax, ay);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(p1.x, p1.y, 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(p2.x, p2.y, 4.5, 0, 2 * Math.PI); ctx.fill();

  // Panel B: (h, k) eccentricity phase plane (top right).
  const bx = W * 0.74, by = H * 0.30, bS = 200;
  ctx.strokeStyle = '#2c2f36'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx - 120, by); ctx.lineTo(bx + 120, by); ctx.moveTo(bx, by - 110); ctx.lineTo(bx, by + 110); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('(h, k) = (e cos ϖ, e sin ϖ)', bx - 110, by - 96);
  ctx.fillText('k', bx + 4, by - 98); ctx.fillText('h', bx + 110, by - 6);
  // Trace one full secular period for each planet (the Laplace-Lagrange
  // circle), then mark the current eccentricity vectors.
  for (const [sel, col] of [[0, 'rgba(255,209,102,0.5)'], [1, 'rgba(91,192,235,0.5)']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const tt = (i / 160) * (Math.PI / st.coupling);
      const ss = secular(tt);
      const e = sel === 0 ? ss.e1 : ss.e2, w = sel === 0 ? ss.w1 : ss.w2;
      const x = bx + bS * e * Math.cos(w), y = by - bS * e * Math.sin(w);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(bx + bS * s.e1 * Math.cos(s.w1), by - bS * s.e1 * Math.sin(s.w1), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#5bc0eb';
  ctx.beginPath(); ctx.arc(bx + bS * s.e2 * Math.cos(s.w2), by - bS * s.e2 * Math.sin(s.w2), 5, 0, 2 * Math.PI); ctx.fill();

  // Panel C: e1(t), e2(t) exchange (bottom right).
  const cx0 = W * 0.55, cx1 = W - 24, cy0 = H * 0.62, cy1 = H - 40;
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0, cy1); ctx.lineTo(cx1, cy1); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.fillText('e_j (orange = inner, cyan = outer)', cx0, cy0 - 6);
  ctx.fillText('t (secular)', cx1 - 60, cy1 + 14);
  const tSpan = 2 * Math.PI / st.coupling;
  const tx = (tt) => cx0 + (tt % tSpan) / tSpan * (cx1 - cx0);
  const ey = (e) => cy1 - (e / (st.e0 * 1.1)) * (cy1 - cy0);
  for (const [sel, col] of [[0, '#ffd166'], [1, '#5bc0eb']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 0; i <= 220; i += 1) {
      const tt = (i / 220) * tSpan;
      const ss = secular(tt);
      const e = sel === 0 ? ss.e1 : ss.e2;
      if (i === 0) ctx.moveTo(tx(tt), ey(e)); else ctx.lineTo(tx(tt), ey(e));
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#06d6a0'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(tx(st.t), cy0); ctx.lineTo(tx(st.t), cy1); ctx.stroke(); ctx.setLineDash([]);

  const A = amd(s.e1, s.e2);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`coupling = ${st.coupling.toFixed(2)}   AMD = e1^2 + e2^2 = ${A.toFixed(4)} (conserved)`, 14, H - 14);
  rE.textContent = `e1=${s.e1.toFixed(3)} e2=${s.e2.toFixed(3)}`;
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt * 0.8;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = 1 + CAPTURE_FRAC * (2 * Math.PI / st.coupling);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
