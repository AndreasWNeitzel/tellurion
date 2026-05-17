// Chandrasekhar dynamical friction. A massive perturber ploughs through
// a Maxwellian star field; gravitational focusing piles a trailing
// overdensity (the wake) behind it, and the wake's pull decelerates it
// by a_DF = 4 pi G^2 M rho lnLambda f(X) / V^2. The old view let the
// velocity slider only reseed an indistinguishable star cloud (the
// perturber was one dot among 200), so it read DEAD. Now the perturber,
// its fading decelerating trajectory, a velocity arrow, the highlighted
// wake and a V(t) decay panel are the dominant visuals, all driven by
// the initial speed. The drag is non-monotonic in V (peaks near
// V ~ sigma), so a slow and a very fast perturber both decelerate
// little while an intermediate one is braked hard.
// Reference: Binney and Tremaine, Galactic Dynamics (2nd ed.), Sec. 8.1.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { fOfX, chandrasekharDecel } from './sim.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const N = 240, SIGMA = 0.6, LNLAMBDA = 3, RHO = 1.0, PXV = 90;
let rng = makeRng(SEED);
function gaussian() { const u1 = Math.max(rng(), 1e-9), u2 = rng(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }

const DEF_VP = 1.5;
const state = { vPerturber: DEF_VP, t: 0 };
let bg, perturber, trail, vHist, running = true;

function reset() {
  rng = makeRng(SEED);                       // reseed: deterministic, slider-independent field
  bg = [];
  for (let i = 0; i < N; i += 1) bg.push({ x: rng() * W, y: rng() * H, vx: SIGMA * gaussian() * 36, vy: SIGMA * gaussian() * 36 });
  perturber = { x: 70, y: H / 2, vx: state.vPerturber * PXV, vy: 0 };
  trail = []; vHist = []; state.t = 0;
}
reset();

const dt = 0.02;
function step() {
  for (const p of bg) {
    const dx = perturber.x - p.x, dy = perturber.y - p.y;
    const r2 = dx * dx + dy * dy + 400, r = Math.sqrt(r2);
    const a = 4000 / r2;
    p.vx += a * dx / r * dt; p.vy += a * dy / r * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
  }
  // Chandrasekhar deceleration applied gently as a speed scaling so the
  // slowdown is gradual and visible over the crossing (the old tuning
  // braked V=1.5 to a halt in ~0.1 s and reset). f(X)/V^2 makes a fast
  // perturber barely slow and an intermediate one brake hardest, while
  // f(X) -> 0 as V -> 0 lets a slow one coast rather than stop dead.
  const Vpx = Math.hypot(perturber.vx, perturber.vy);
  const Vphys = Vpx / PXV;
  const aDF = chandrasekharDecel(Vphys, SIGMA, RHO, LNLAMBDA);
  const K = 0.008;
  const dVphys = Math.min(K * aDF * dt, 0.2 * Vphys);
  const scale = Math.max(0, Vphys - dVphys) / Math.max(Vphys, 1e-9);
  perturber.vx *= scale; perturber.vy *= scale;
  perturber.x += perturber.vx * dt; perturber.y += perturber.vy * dt;
  trail.push({ x: perturber.x, y: perturber.y });
  if (trail.length > 260) trail.shift();
  vHist.push(Vphys); if (vHist.length > 320) vHist.shift();
  state.t += dt;
  if (perturber.x > W - 50 || state.t > 40) reset();
}

function render() {
  ctx.fillStyle = '#080810'; ctx.fillRect(0, 0, W, H);
  const Vpx = Math.hypot(perturber.vx, perturber.vy), Vphys = Vpx / PXV;
  const X = Vphys / (Math.SQRT2 * SIGMA), fX = fOfX(X);

  // Field, with the wake (particles just behind the perturber, in the
  // half-space it came from) highlighted: that overdensity is the drag.
  const ux = perturber.vx / Math.max(Vpx, 1e-6), uy = perturber.vy / Math.max(Vpx, 1e-6);
  for (const p of bg) {
    const rx = p.x - perturber.x, ry = p.y - perturber.y;
    const behind = rx * ux + ry * uy < 0, near = (rx * rx + ry * ry) < 14000;
    if (behind && near) { ctx.fillStyle = 'rgba(255,170,90,0.9)'; ctx.fillRect(p.x - 1, p.y - 1, 3, 3); }
    else { ctx.fillStyle = 'rgba(124,156,255,0.5)'; ctx.fillRect(p.x, p.y, 2, 2); }
  }

  // Wake cone, opacity tied to f(X) (the coupling strength).
  ctx.fillStyle = `rgba(255,150,70,${0.05 + 0.18 * fX})`;
  ctx.beginPath();
  ctx.moveTo(perturber.x, perturber.y);
  ctx.lineTo(perturber.x - ux * 150 - uy * 46, perturber.y - uy * 150 + ux * 46);
  ctx.lineTo(perturber.x - ux * 150 + uy * 46, perturber.y - uy * 150 - ux * 46);
  ctx.closePath(); ctx.fill();

  // Decelerating trajectory.
  ctx.strokeStyle = 'rgba(6,214,160,0.7)'; ctx.lineWidth = 2; ctx.beginPath();
  trail.forEach((q, i) => { i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
  ctx.stroke();

  // Perturber and velocity arrow.
  ctx.fillStyle = '#ffd57f'; ctx.beginPath(); ctx.arc(perturber.x, perturber.y, 11, 0, 2 * Math.PI); ctx.fill();
  const aLen = 26 + Vphys * 60;
  const ex = perturber.x + ux * aLen, ey = perturber.y + uy * aLen;
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(perturber.x, perturber.y); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ux * 12 - uy * 7, ey - uy * 12 + ux * 7);
  ctx.lineTo(ex - ux * 12 + uy * 7, ey - uy * 12 - ux * 7);
  ctx.closePath(); ctx.fillStyle = '#5bc0eb'; ctx.fill();

  // Large deterministic dual panel (no particle churn, so it never
  // masks the slider): V(t) decay on the left, the Chandrasekhar
  // a_DF(V) law on the right with the live operating point. The drag
  // peaks near V ~ sqrt2 sigma, so the operating point sweeping that
  // curve as the initial speed changes is the headline physics.
  const PH = 232, PY = H - PH, vmax = 4.3;
  ctx.fillStyle = 'rgba(8,8,16,0.92)'; ctx.fillRect(0, PY, W, PH);
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(0, PY); ctx.lineTo(W, PY); ctx.stroke();
  const halfW = W / 2;

  // Left: V(t).
  const ax0 = 52, ax1 = halfW - 24, ay0 = PY + 30, ay1 = H - 34;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('perturber speed V(t)', ax0, PY + 20);
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(ax0, ay0); ctx.lineTo(ax0, ay1); ctx.lineTo(ax1, ay1); ctx.stroke();
  ctx.fillStyle = '#6e727a'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText(`${vmax}`, ax0 - 26, ay0 + 4); ctx.fillText('0', ax0 - 14, ay1); ctx.fillText('t', ax1 - 6, ay1 + 16);
  if (vHist.length > 1) {
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath();
    vHist.forEach((v, i) => { const px = ax0 + i / 320 * (ax1 - ax0); const py = ay1 - Math.min(1, v / vmax) * (ay1 - ay0); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
  }
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(ax0 + (vHist.length - 1) / 320 * (ax1 - ax0), ay1 - Math.min(1, Vphys / vmax) * (ay1 - ay0), 4, 0, 2 * Math.PI); ctx.fill();

  // Right: a_DF(V) law with the operating point on it.
  const bx0 = halfW + 40, bx1 = W - 24, by0 = PY + 30, by1 = H - 34;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('friction a_DF(V) ∝ f(X)/V²  (peaks near V≈√2σ)', bx0, PY + 20);
  let aMax = 0; const NA = 120;
  const adf = (vv) => chandrasekharDecel(vv, SIGMA, RHO, LNLAMBDA);
  for (let i = 1; i <= NA; i += 1) { const a = adf(vmax * i / NA); if (a > aMax) aMax = a; }
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.stroke();
  ctx.fillStyle = '#6e727a'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText('V', bx1 - 8, by1 + 16); ctx.fillText('a_DF', bx0 - 34, by0 + 4);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 1; i <= NA; i += 1) { const vv = vmax * i / NA; const px = bx0 + i / NA * (bx1 - bx0); const py = by1 - Math.min(1, adf(vv) / aMax) * (by1 - by0); i === 1 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.stroke();
  const opx = bx0 + Math.min(1, Vphys / vmax) * (bx1 - bx0), opy = by1 - Math.min(1, adf(Vphys) / aMax) * (by1 - by0);
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(opx, by1); ctx.lineTo(opx, opy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(opx, opy, 6, 0, 2 * Math.PI); ctx.fill();

  if (readoutEl) {
    readoutEl.innerHTML =
      `<span class="label">V</span><span class="value">${Vphys.toFixed(3)}</span>` +
      `<span class="label">X = V/√2σ</span><span class="value">${X.toFixed(3)}</span>` +
      `<span class="label">f(X)</span><span class="value">${fX.toFixed(3)}</span>` +
      `<span class="label">a_DF</span><span class="value">${chandrasekharDecel(Vphys, SIGMA, RHO, LNLAMBDA).toExponential(2)}</span>` +
      `<span class="label">t</span><span class="value">${state.t.toFixed(1)}</span>`;
  }
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'vp'; lab.textContent = 'V perturber';
  const inp = document.createElement('input'); inp.id = 'vp'; inp.type = 'range';
  inp.min = '0.2'; inp.max = '4'; inp.step = '0.1'; inp.value = String(state.vPerturber);
  inp.setAttribute('aria-label', 'Perturber initial velocity');
  const val = document.createElement('span'); val.className = 'value'; val.textContent = state.vPerturber.toFixed(1);
  inp.addEventListener('input', () => { state.vPerturber = parseFloat(inp.value); val.textContent = state.vPerturber.toFixed(1); reset(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  const br = document.createElement('div'); br.className = 'row buttons';
  const rb = document.createElement('button'); rb.type = 'button'; rb.id = 'btn-reset'; rb.textContent = 'Reset';
  rb.addEventListener('click', () => { state.vPerturber = DEF_VP; inp.value = String(DEF_VP); val.textContent = DEF_VP.toFixed(1); reset(); running = true; pb.textContent = 'Pause'; pb.setAttribute('aria-pressed', 'false'); startLoop(); render(); });
  const pb = document.createElement('button'); pb.type = 'button'; pb.id = 'btn-pause'; pb.textContent = 'Pause'; pb.setAttribute('aria-pressed', 'false');
  pb.addEventListener('click', () => { running = !running; pb.textContent = running ? 'Pause' : 'Play'; pb.setAttribute('aria-pressed', String(!running)); startLoop(); });
  br.appendChild(rb); br.appendChild(pb); controlsEl.appendChild(br);
}

let rafOn = false;
function tick() { if (running) step(); render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; requestAnimationFrame(tick); } }

buildControls();
if (DETERMINISTIC) {
  const steps = 40 + Math.round(CAPTURE_FRAC * 240);
  for (let i = 0; i < steps; i += 1) step();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  startLoop();
}

window.__physicsCheck = async () => {
  const fHi = fOfX(3 / Math.SQRT2), fLo = fOfX(0.1 / Math.SQRT2);
  if (fHi <= 0.9) return { name: 'friction at V=3σ', pass: false, msg: `f=${fHi.toFixed(3)}` };
  if (fLo >= 0.05) return { name: 'friction at V=0.1σ', pass: false, msg: `f=${fLo.toFixed(3)}` };
  return { name: 'Chandrasekhar f(X) limits', pass: true, msg: `f(3σ)=${fHi.toFixed(3)}, f(0.1σ)=${fLo.toFixed(3)}` };
};
