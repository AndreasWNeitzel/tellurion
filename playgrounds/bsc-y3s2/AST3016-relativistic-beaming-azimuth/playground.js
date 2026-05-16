// playground.js
// Relativistic beaming as a real 3D solid of revolution. The lab-frame
// emission pattern D(theta)^(3+alpha) of a rest-frame-isotropic source
// is revolved about the velocity axis into a shaded latitude/longitude
// lobe (viridis by intensity) that rotates slowly; a small wireframe
// sphere shows the isotropic rest frame for contrast. As gamma rises
// the lobe collapses from a sphere into a forward pencil (the
// relativistic headlight effect). Canvas2D only; sim.js unchanged.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { beamingHalfAngle, doppler, aberratedAngle } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderG      = document.getElementById('slider-gamma');
const sliderA      = document.getElementById('slider-alpha');
const valueG       = document.getElementById('value-gamma');
const valueA       = document.getElementById('value-alpha');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const st = { gamma: 5.0, alpha: 0.0, az: 0.5, playing: !DETERMINISTIC };

const CX = W * 0.46, CY = H * 0.52, SC = 150, ELEV = 0.42;
function proj(x, y, z) {
  // Velocity axis = world x (points right / +screen-x). Camera orbits.
  const ca = Math.cos(st.az), sa = Math.sin(st.az);
  const ey = y * ca - z * sa;
  const ez = y * sa + z * ca;
  return { sx: CX + x * SC, sy: CY - ez * SC * Math.cos(ELEV) - ey * SC * Math.sin(ELEV), d: ey };
}

function betaOf(g) { return Math.sqrt(1 - 1 / (g * g)); }

function lobePoint(thetaRest, phi, beta, p, Rn) {
  const thLab = aberratedAngle(beta, thetaRest);
  const D = doppler(beta, thLab);
  const I = Math.pow(D, p);
  // Mild compression of the normalized radius: keeps the forward
  // dominance and the gamma-dependent narrowing while giving the 3D
  // lobe a visible body instead of a 1px needle (display only; the
  // exact beam half-angle is read from sim.beamingHalfAngle).
  const R = Math.pow(I / Rn, 0.34) * 1.85;
  const x = R * Math.cos(thLab);
  const rho = R * Math.sin(thLab);
  return { x, y: rho * Math.cos(phi), z: rho * Math.sin(phi), I };
}

function drawLobe() {
  const beta = betaOf(st.gamma), p = 3 + st.alpha;
  const Rn = Math.pow(doppler(beta, 0), p);  // peak (forward) intensity
  const NLAT = 30, NLON = 40;
  // Longitude meridians.
  for (let j = 0; j < NLON; j += 1) {
    const phi = (j / NLON) * 2 * Math.PI;
    ctx.beginPath();
    for (let i = 0; i <= NLAT; i += 1) {
      const tr = Math.PI * i / NLAT;
      const pt = lobePoint(tr, phi, beta, p, Rn);
      const s = proj(pt.x, pt.y, pt.z);
      if (i === 0) ctx.moveTo(s.sx, s.sy); else ctx.lineTo(s.sx, s.sy);
    }
    ctx.strokeStyle = 'rgba(180,200,230,0.16)'; ctx.lineWidth = 1; ctx.stroke();
  }
  // Latitude rings, colored by lab-frame intensity (viridis).
  for (let i = 1; i < NLAT; i += 1) {
    const tr = Math.PI * i / NLAT;
    let Imax = 0;
    const ring = [];
    for (let j = 0; j <= NLON; j += 1) {
      const phi = (j / NLON) * 2 * Math.PI;
      const pt = lobePoint(tr, phi, beta, p, Rn);
      ring.push(proj(pt.x, pt.y, pt.z));
      Imax = pt.I;
    }
    const t = Math.max(0, Math.min(1, Imax / Rn));
    const c = viridis(0.12 + 0.85 * t);
    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${(0.35 + 0.6 * t).toFixed(3)})`;
    ctx.lineWidth = 1.5 + 1.5 * t;
    ctx.beginPath();
    ring.forEach((s, k) => (k ? ctx.lineTo(s.sx, s.sy) : ctx.moveTo(s.sx, s.sy)));
    ctx.stroke();
  }
  // Source + velocity (beta) arrow along +x.
  const o = proj(0, 0, 0);
  const glow = ctx.createRadialGradient(o.sx, o.sy, 1, o.sx, o.sy, 14);
  glow.addColorStop(0, '#ffffff'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(o.sx, o.sy, 14, 0, 2 * Math.PI); ctx.fill();
  const tail = proj(-0.55, 0, 0), tip = proj(2.45, 0, 0);
  ctx.strokeStyle = '#ef476f'; ctx.fillStyle = '#ef476f'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(tail.sx, tail.sy); ctx.lineTo(tip.sx, tip.sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tip.sx, tip.sy);
  ctx.lineTo(tip.sx - 11, tip.sy - 6); ctx.lineTo(tip.sx - 11, tip.sy + 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ef476f'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('beta (velocity)', tip.sx + 8, tip.sy + 4);
}

function drawRestInset() {
  // Small isotropic sphere = the rest frame, for contrast.
  const ix = W - 110, iy = 120, r = 46;
  ctx.strokeStyle = 'rgba(160,170,190,0.45)'; ctx.lineWidth = 1;
  for (let k = 0; k < 6; k += 1) {
    ctx.beginPath();
    ctx.ellipse(ix, iy, r, r * Math.abs(Math.cos(k * Math.PI / 6)) + 2, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(ix, iy, r, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ix, iy, 3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('rest frame: isotropic', ix, iy + r + 16);
}

function drawReadout() {
  const beta = betaOf(st.gamma), p = 3 + st.alpha;
  const tb = beamingHalfAngle(beta);
  const D0 = doppler(beta, 0), Dpi = doppler(beta, Math.PI);
  const rows = [
    ['gamma', st.gamma.toFixed(2)],
    ['beta', beta.toFixed(4)],
    ['alpha', st.alpha.toFixed(2)],
    ['theta_beam', `${tb.toFixed(3)} rad`],
    ['1/gamma', `${(1 / st.gamma).toFixed(3)} rad`],
    ['D(0) fwd', D0.toFixed(2)],
    ['D(pi) back', Dpi.toFixed(3)],
    ['I(0)/I(pi)', Math.pow(D0 / Dpi, p).toExponential(2)],
  ];
  ctx.font = '12px ui-monospace, monospace';
  let y = 26;
  for (const [k, v] of rows) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'left'; ctx.fillText(k, 16, y);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'left'; ctx.fillText(v, 130, y);
    y += 19;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left';
  ctx.fillText('isotropic in rest frame -> beamed forward in lab frame', 16, H - 16);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawLobe();
  drawRestInset();
  drawReadout();
}

sliderG.addEventListener('input', () => { st.gamma = parseFloat(sliderG.value); valueG.textContent = st.gamma.toFixed(1); if (!st.playing) render(); });
sliderA.addEventListener('input', () => { st.alpha = parseFloat(sliderA.value); valueA.textContent = st.alpha.toFixed(1); if (!st.playing) render(); });
btnPlayPause.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlayPause.textContent = st.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!st.playing));
});

function bootSync() {
  valueG.textContent = st.gamma.toFixed(1);
  valueA.textContent = st.alpha.toFixed(1);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.gamma = 1.2 + f * 14;                  // sphere -> pencil beam
    st.az = 0.5;
    valueG.textContent = st.gamma.toFixed(1);
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

function tick() {
  if (st.playing) { st.az += 0.006; render(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
