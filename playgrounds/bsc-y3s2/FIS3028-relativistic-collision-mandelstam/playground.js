import { fixedTargetS, colliderS, sqrtS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rS = document.getElementById('readout-s');
const sM1 = document.getElementById('slider-m1'), vM1 = document.getElementById('value-m1');
const sM2 = document.getElementById('slider-m2'), vM2 = document.getElementById('value-m2');
const sE = document.getElementById('slider-E'), vE = document.getElementById('value-E');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const selG = document.getElementById('select-geom');

const st = { m1: 0.94, m2: 0.94, logE: 3, geom: 'collider', t: 0, cycle: 3.0 };
let running = !prefersReducedMotion();

sM1.addEventListener('input', () => { st.m1 = parseFloat(sM1.value); vM1.textContent = st.m1.toFixed(2); });
sM2.addEventListener('input', () => { st.m2 = parseFloat(sM2.value); vM2.textContent = st.m2.toFixed(2); });
sE.addEventListener('input', () => { st.logE = parseFloat(sE.value); vE.textContent = st.logE.toFixed(2); });
selG.addEventListener('change', () => { st.geom = selG.value; st.t = 0; });
btnR.addEventListener('click', () => { running = true; st.t = 0; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Render the scattering animation in the top 60 % of the canvas; the
// log-log sqrt(s) vs E_lab plot occupies the bottom 40 % as a demoted
// diagnostic per the no-plot-as-main rule.
function drawScattering(SX, SY, SW, SH) {
  const cx = SX + SW / 2, cy = SY + SH / 2;
  const Ecur = Math.pow(10, st.logE);
  const sCur = st.geom === 'fixed' ? fixedTargetS(st.m1, st.m2, Ecur) : colliderS(st.m1, st.m2, Ecur, Ecur);
  const roots = sqrtS(sCur);

  // Phase: 0..1 over one cycle (incoming -> collision -> outgoing).
  const phase = (st.t % st.cycle) / st.cycle;
  // Beam-pipe baseline
  ctx.strokeStyle = 'rgba(150, 165, 195, 0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SX + 14, cy); ctx.lineTo(SX + SW - 14, cy); ctx.stroke();
  ctx.fillStyle = 'rgba(150, 165, 195, 0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  if (st.geom === 'fixed') {
    ctx.fillText('FIXED-TARGET: m1 beam slams into a stationary m2 target', SX + 16, SY + 16);
  } else {
    ctx.fillText('SYMMETRIC COLLIDER: two beams of equal energy meet head-on', SX + 16, SY + 16);
  }

  // Particles: incoming (phase 0..0.5), collision flash (0.5), outgoing
  // (0.5..1). Position by phase. Beam 1 from left, beam 2 from right.
  const span = SW * 0.40;
  const collideX = cx;
  let x1, x2;
  if (st.geom === 'fixed') {
    // m1 (beam) moves left -> right; m2 stationary
    x1 = SX + 30 + phase * 2 * (collideX - SX - 30);
    x2 = collideX;
    if (phase > 0.5) { x1 = collideX; }
  } else {
    // both beams move toward the centre
    x1 = SX + 30 + Math.min(1, phase * 2) * span;
    x2 = SX + SW - 30 - Math.min(1, phase * 2) * span;
  }

  // Pre-collision incoming particles, with momentum arrows showing each
  // beam's direction of travel toward the interaction point.
  if (phase < 0.55) {
    drawMomentumArrow(x1, cy, 1, '#5bc0eb');
    if (st.geom !== 'fixed') drawMomentumArrow(x2, cy, -1, '#ffd166');
    drawParticle(x1, cy, 15, '#5bc0eb', `m1 = ${st.m1.toFixed(2)}`);
    drawParticle(x2, cy, 15, '#ffd166', st.geom === 'fixed' ? `m2 = ${st.m2.toFixed(2)} (tgt)` : `m2 = ${st.m2.toFixed(2)}`);
    drawStreak(x1 - 10, cy, '#5bc0eb', -1);
    if (st.geom !== 'fixed') drawStreak(x2 + 10, cy, '#ffd166', 1);
  }

  // Collision fireball at phase ~ 0.5
  if (phase >= 0.40 && phase < 0.70) {
    const fp = (phase - 0.40) / 0.30;     // 0..1 collision burst
    const r = 8 + SH * 0.17 * fp * (1 - fp) * 4;   // grows then shrinks, scaled to the scene
    const fireG = ctx.createRadialGradient(collideX, cy, 0, collideX, cy, r);
    // Colour saturation grows with sqrt(s): high-energy collisions are
    // hotter (whiter) than low-energy ones.
    const heat = Math.min(1, Math.log10(roots / 0.94) / 4);   // 0..1 from ~ 0.94 GeV to ~ 1e4 GeV
    fireG.addColorStop(0, `rgba(${Math.round(255)}, ${Math.round(220 + 35 * heat)}, ${Math.round(120 + 135 * heat)}, ${0.85 * (1 - fp)})`);
    fireG.addColorStop(0.5, `rgba(255, 145, 70, ${0.45 * (1 - fp)})`);
    fireG.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireG;
    ctx.beginPath(); ctx.arc(collideX, cy, r, 0, 6.2832); ctx.fill();
  }

  // Outgoing decay products (phase >= 0.55): radiate from the collision
  // point with random-looking but seeded angles. The number of jets
  // and their colour intensity scale with log10(sqrt s).
  if (phase >= 0.55) {
    const op = (phase - 0.55) / 0.45;
    const N_JETS = Math.max(4, Math.min(14, Math.round(4 + 2 * Math.log10(Math.max(1, roots)))));
    const rxMax = SW * 0.42, ryMax = SH * 0.40;   // fill the scene in both axes
    for (let i = 0; i < N_JETS; i += 1) {
      const ang = (i / N_JETS) * Math.PI * 2 + 0.31;
      const grow = 0.22 + 0.78 * op;
      const jx = collideX + rxMax * grow * Math.cos(ang);
      const jy = cy + ryMax * grow * Math.sin(ang);
      const c = i % 2 === 0 ? '#5bc0eb' : '#ffd166';
      ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 * (1 - 0.5 * op);
      ctx.beginPath(); ctx.moveTo(collideX, cy); ctx.lineTo(jx, jy); ctx.stroke();
      ctx.globalAlpha = 1;
      drawParticle(jx, jy, Math.max(5, 10 * (1 - op * 0.5)), c, '');
    }
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(`${N_JETS} outgoing tracks  (multiplicity ~ ln sqrt s)`, cx, SY + SH - 10);
  }

  // Energy budget readout overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'right';
  ctx.fillText(`E_lab = ${Ecur.toExponential(2)} GeV`, SX + SW - 14, SY + 18);
  ctx.fillText(`sqrt(s) = ${roots.toExponential(2)} GeV`, SX + SW - 14, SY + 36);
}

function drawParticle(x, y, r, col, label) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, 6.2832); ctx.fill();
  if (label) {
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    // clamp so a particle near the edge keeps its centred label on-canvas
    ctx.fillText(label, Math.max(48, Math.min(canvas.width - 48, x)), y - r - 6);
  }
}
function drawStreak(x, y, col, dir) {
  for (let k = 1; k <= 5; k += 1) {
    ctx.fillStyle = col.replace('rgb', 'rgba').replace(')', `,${0.35 - k * 0.06})`);
    ctx.fillRect(x + dir * k * 9, y - 1.5, 4, 3);
  }
}
// Momentum arrow drawn behind an incoming particle, pointing along its
// direction of travel (dir = +1 moving right, -1 moving left).
function drawMomentumArrow(x, y, dir, col) {
  const tail = x - dir * 60, head = x - dir * 26;
  ctx.strokeStyle = col; ctx.globalAlpha = 0.7; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(head, y); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(head + dir * 11, y);
  ctx.lineTo(head, y - 7);
  ctx.lineTo(head, y + 7);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlot(SX, SY, SW, SH) {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(SX, SY, SW, SH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(SX, SY, SW, SH);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('log10 sqrt(s) (GeV) vs log10 E_lab (GeV)   (diagnostic plot)', SX + 10, SY + 14);
  const pad = { l: 50, r: 16, t: 24, b: 24 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  ctx.moveTo(SX + pad.l, SY + pad.t); ctx.lineTo(SX + pad.l, SY + SH - pad.b);
  ctx.lineTo(SX + SW - pad.r, SY + SH - pad.b); ctx.stroke();
  const xToPx = (l) => SX + pad.l + l / 5 * (SW - pad.l - pad.r);
  const yToPx = (l) => SY + SH - pad.b - l / 5 * (SH - pad.t - pad.b);
  // Decade tick labels on both log axes.
  ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'center';
  for (let l = 0; l <= 5; l += 1) ctx.fillText(String(l), xToPx(l), SY + SH - pad.b + 14);
  ctx.textAlign = 'right';
  for (let l = 0; l <= 5; l += 1) ctx.fillText(String(l), SX + pad.l - 5, yToPx(l) + 3);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const logE = 5 * i / 200;
    const E = Math.pow(10, logE);
    const s = fixedTargetS(st.m1, st.m2, E);
    const py = yToPx(Math.log10(sqrtS(s)));
    if (i === 0) ctx.moveTo(xToPx(logE), py); else ctx.lineTo(xToPx(logE), py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const logE = 5 * i / 200;
    const E = Math.pow(10, logE);
    const s = colliderS(st.m1, st.m2, E, E);
    const py = yToPx(Math.log10(sqrtS(s)));
    if (i === 0) ctx.moveTo(xToPx(logE), py); else ctx.lineTo(xToPx(logE), py);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  const Ecur = Math.pow(10, st.logE);
  const sf = fixedTargetS(st.m1, st.m2, Ecur);
  const sc = colliderS(st.m1, st.m2, Ecur, Ecur);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(xToPx(st.logE), yToPx(Math.log10(sqrtS(sf))), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xToPx(st.logE), yToPx(Math.log10(sqrtS(sc))), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('fixed-target sqrt(s) ~ sqrt(E)', SX + pad.l + 6, SY + pad.t + 14);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('symmetric collider sqrt(s) ~ E', SX + pad.l + 6, SY + pad.t + 28);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const SCH = Math.floor(H * 0.60), PLH = H - SCH - 4;
  drawScattering(0, 0, W, SCH);
  drawPlot(12, SCH + 4, W - 24, PLH - 8);
  const Ecur = Math.pow(10, st.logE);
  const sc = colliderS(st.m1, st.m2, Ecur, Ecur);
  rS.textContent = `${sqrtS(sc).toExponential(1)} GeV`;
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    st.logE = 0.3 + CAPTURE_FRAC * 4.4;
    st.t = CAPTURE_FRAC * st.cycle;
    sE.value = String(st.logE);
    vE.textContent = st.logE.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const Ecur = Math.pow(10, st.logE);
  const sCur = st.geom === 'fixed' ? fixedTargetS(st.m1, st.m2, Ecur) : colliderS(st.m1, st.m2, Ecur, Ecur);
  const sqrtSval = sqrtS(sCur);
  return {
    fields: [
      { key: 'm1', label: 'm1 (GeV)', value: st.m1, format: 'float' },
      { key: 'm2', label: 'm2 (GeV)', value: st.m2, format: 'float' },
      { key: 'energy', label: 'E (GeV)', value: Ecur.toExponential(2) },
      { key: 'sqrt-s', label: 'sqrt(s) (GeV)', value: sqrtSval.toExponential(2) }
    ]
  };
};
window.playground.getInvariants = function () {
  const Ecur = Math.pow(10, st.logE);
  const sCur = st.geom === 'fixed' ? fixedTargetS(st.m1, st.m2, Ecur) : colliderS(st.m1, st.m2, Ecur, Ecur);
  const sqrtSval = sqrtS(sCur);
  const threshold = st.geom === 'fixed' ? (st.m1 + st.m2) ** 2 : (st.m1 + st.m2) ** 2;
  return [
    {
      key: 'threshold',
      label: 'Above threshold',
      value: sCur >= threshold ? 'yes' : 'no',
      status: sCur >= threshold ? 'pass' : 'pending'
    }
  ];
};
