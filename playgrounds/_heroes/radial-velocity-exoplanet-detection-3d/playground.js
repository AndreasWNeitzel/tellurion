// Radial-velocity exoplanet detection playground. Left: top-down view
// of the star + planet system orbiting the COM. Right: RV curve over
// one period. Bottom: small Doppler-shifted spectral-line indicator.

import { positions, radialVelocity, rvSemiAmplitude, dopplerShift } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rK = document.getElementById('readout-K');
const rVr = document.getElementById('readout-vr');
const rPhase = document.getElementById('readout-phase');
const sMp = document.getElementById('slider-mp'), vMp = document.getElementById('value-mp');
const sP = document.getElementById('slider-P'), vP = document.getElementById('value-P');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sInc = document.getElementById('slider-inc'), vInc = document.getElementById('value-inc');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  M_star: 1.0, m_p: 0.010, P: 1.6, e: 0.20, incDeg: 80,
  speed: 2, t: 0,
  running: !prefersReducedMotion(),
  trailStar: [], trailPlanet: [], TRAIL: 600,
};

function getOpts() {
  return {
    M_star: st.M_star, m_p: st.m_p, P: st.P, e: st.e,
    i: st.incDeg * Math.PI / 180,
    omega: 0, t0: 0, a_planet: 1.0,
  };
}

function drawOrbit() {
  // Top panel: orbit top-down.
  const cx = 410, cy = 310, R = 250;
  const opts = getOpts();
  const pos = positions(st.t, opts);

  // Background frame
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.strokeRect(cx - R + 0.5, cy - R + 0.5, 2 * R - 1, 2 * R - 1);

  // COM marker
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy);
  ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
  ctx.stroke();

  // Trails
  function plotTrail(trail, color) {
    if (trail.length < 2) return;
    for (let k = 1; k < trail.length; k += 1) {
      const a = 0.10 + 0.6 * (k / trail.length);
      ctx.strokeStyle = `rgba(${color}, ${a.toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx + trail[k - 1][0] * R / 1.2, cy + trail[k - 1][1] * R / 1.2);
      ctx.lineTo(cx + trail[k][0] * R / 1.2, cy + trail[k][1] * R / 1.2);
      ctx.stroke();
    }
  }
  plotTrail(st.trailPlanet, '120, 200, 255');
  plotTrail(st.trailStar, '255, 230, 140');

  // Bodies
  const sx = cx + pos.sx * R / 1.2, sy = cy + pos.sy * R / 1.2;
  const px = cx + pos.px * R / 1.2, py = cy + pos.py * R / 1.2;
  // Star glow
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22);
  g.addColorStop(0, 'rgba(255, 230, 140, 0.85)');
  g.addColorStop(1, 'rgba(255, 230, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, 22, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(sx, sy, 8, 0, 2 * Math.PI); ctx.fill();
  // Planet
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill();

  // Observer indicator: arrow at bottom pointing up (out of page is +y)
  // The RV is the +y velocity component (we choose +y as toward observer).
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(cx, cy + R + 16); ctx.lineTo(cx, cy + R + 4);
  ctx.lineTo(cx - 5, cy + R + 10); ctx.moveTo(cx, cy + R + 4); ctx.lineTo(cx + 5, cy + R + 10);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('observer', cx, cy + R + 30);

  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('top-down orbit (star + planet around COM)', cx - R, cy - R - 10);
}

function drawRVCurve() {
  // Bottom panel: v_r(t) over one period.
  const x0 = 60, y0 = 650, w = 700, h = 320;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const opts = getOpts();
  const K = rvSemiAmplitude(opts);
  const vrNow = radialVelocity(st.t, opts);

  const pad = { l: 50, r: 14, t: 22, b: 30 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(ax, ay + ah / 2); ctx.lineTo(ax + aw, ay + ah / 2);   // zero line
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`v_r(t)    K = ${K.toFixed(4)}`, x0 + 8, ay - 4);
  ctx.textAlign = 'center';
  ctx.fillText('t / P', ax + aw / 2, y0 + h - 8);

  // y range based on K
  const vMax = Math.max(0.01, K * 1.4);
  const xToPx = (tau) => ax + tau * aw;
  const yToPx = (v) => ay + ah / 2 - (v / vMax) * ah / 2;

  // y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText(`+${K.toFixed(3)}`, ax - 4, yToPx(K));
  ctx.fillText('0', ax - 4, yToPx(0) + 3);
  ctx.fillText(`-${K.toFixed(3)}`, ax - 4, yToPx(-K) + 6);

  // Plot curve over one period.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const N = 200;
  for (let i = 0; i <= N; i += 1) {
    const tau = i / N;
    const t = tau * st.P;
    const v = radialVelocity(t, opts);
    const px = xToPx(tau);
    const py = yToPx(v);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Current-time marker
  const tau = (st.t % st.P) / st.P;
  const mx = xToPx(tau), my = yToPx(vrNow);
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath(); ctx.arc(mx, my, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx, ay); ctx.lineTo(mx, ay + ah); ctx.stroke();

  // Spectral-line indicator below
  const lineX0 = ax + 20, lineX1 = ax + aw - 20, lineY = y0 + h - 50;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('Doppler-shifted spectral line:', lineX0, lineY - 18);
  // Faint reference line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.moveTo(lineX0, lineY); ctx.lineTo(lineX1, lineY); ctx.stroke();
  // Rest-frame center
  const cxLine = (lineX0 + lineX1) / 2;
  ctx.fillStyle = 'rgba(120, 220, 200, 0.5)';
  ctx.fillRect(cxLine - 1, lineY - 8, 2, 16);
  // Shifted line: shift proportional to v_r/K
  const shift = vrNow / Math.max(1e-6, K) * (lineX1 - lineX0) * 0.3;
  ctx.fillStyle = '#ff8080';
  ctx.fillRect(cxLine + shift - 2, lineY - 10, 4, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('rest', cxLine, lineY + 20);
  ctx.fillStyle = '#ff8080';
  ctx.fillText(vrNow > 0 ? 'redshift' : 'blueshift', cxLine + shift, lineY - 14);
}

function pushTrails() {
  const pos = positions(st.t, getOpts());
  st.trailStar.push([pos.sx, pos.sy]);
  st.trailPlanet.push([pos.px, pos.py]);
  if (st.trailStar.length > st.TRAIL) st.trailStar.shift();
  if (st.trailPlanet.length > st.TRAIL) st.trailPlanet.shift();
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  drawOrbit();
  drawRVCurve();

  const opts = getOpts();
  const K = rvSemiAmplitude(opts);
  const vr = radialVelocity(st.t, opts);

  // Top label band
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`m_p = ${st.m_p.toFixed(3)}, P = ${st.P.toFixed(2)}, e = ${st.e.toFixed(2)}, i = ${st.incDeg}°`, 24, 22);
  ctx.fillText(`Mayor & Queloz 1995: first exoplanet around a Sun-like star (51 Peg b) found via RV wobble`, 24, H - 12);

  rK.textContent = K.toFixed(4);
  rVr.textContent = vr.toFixed(4);
  rPhase.textContent = ((st.t % st.P) / st.P).toFixed(3);
}

function tick() {
  if (st.running) {
    st.t += 0.01 * Math.max(1, st.speed);
    pushTrails();
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vMp.textContent = st.m_p.toFixed(3);
  vP.textContent = st.P.toFixed(1);
  vE.textContent = st.e.toFixed(2);
  vInc.textContent = String(st.incDeg);
  vSpeed.textContent = String(st.speed);
}

sMp.addEventListener('input', () => { st.m_p = parseFloat(sMp.value); syncLabels(); });
sP.addEventListener('input', () => { st.P = parseFloat(sP.value); syncLabels(); });
sE.addEventListener('input', () => { st.e = parseFloat(sE.value); syncLabels(); });
sInc.addEventListener('input', () => { st.incDeg = parseInt(sInc.value, 10); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.m_p = 0.01; st.P = 1.6; st.e = 0.20; st.incDeg = 80; st.speed = 2; st.t = 0;
  st.trailStar.length = 0; st.trailPlanet.length = 0;
  sMp.value = '0.01'; sP.value = '1.6'; sE.value = '0.20'; sInc.value = '80'; sSpeed.value = '2';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { m_p: st.m_p, P: st.P, e: st.e, inc_deg: st.incDeg }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.m_p) { st.m_p = parseFloat(s.m_p); sMp.value = String(st.m_p); }
  if (s.P) { st.P = parseFloat(s.P); sP.value = String(st.P); }
  if (s.e !== undefined) { st.e = parseFloat(s.e); sE.value = String(st.e); }
  if (s.inc_deg) { st.incDeg = parseInt(s.inc_deg, 10); sInc.value = String(st.incDeg); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.t = f * st.P;
    // Populate the trail across one orbit so the trail is visible from t-000.
    const N = 200;
    for (let n = 0; n < N; n += 1) {
      const tnow = (n / N) * st.t;
      const pos = positions(tnow, getOpts());
      st.trailStar.push([pos.sx, pos.sy]);
      st.trailPlanet.push([pos.px, pos.py]);
    }
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// The orbit is closed and periodic, so the star's orbital radial
// velocity averages to zero over one full period: that vanishing
// mean is the invariant the Keplerian solution must hold.
window.playground = window.playground || {};
window.playground.getState = function () {
  const opts = getOpts();
  return {
    fields: [
      { key: 'period', label: 'orbital period P', value: st.P, format: 'float' },
      { key: 'eccentricity', label: 'eccentricity e', value: st.e, format: 'float' },
      { key: 'rv-amplitude', label: 'RV semi-amplitude K', value: rvSemiAmplitude(opts).toFixed(4), format: 'float' },
      { key: 'vr-now', label: 'current radial velocity', value: radialVelocity(st.t, opts).toFixed(4), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const opts = getOpts();
  const K = rvSemiAmplitude(opts);
  if (!(K > 0)) return [];
  let sum = 0;
  const N = 480;
  for (let i = 0; i < N; i += 1) sum += radialVelocity(((i + 0.5) / N) * st.P, opts);
  const meanOverK = Math.abs(sum / N) / K;
  return [
    {
      key: 'rv-closes',
      label: 'orbital RV averages to zero over a period',
      value: meanOverK.toExponential(2),
      status: meanOverK < 5e-3 ? 'pass' : (meanOverK < 3e-2 ? 'pending' : 'drift'),
    },
  ];
};
