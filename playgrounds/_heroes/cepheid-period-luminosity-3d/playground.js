// Cepheid period-luminosity playground. Three panels:
// 1. Pulsating Cepheid star (left): a sphere whose radius and
//    surface color vary with phase, with limb-darkening highlight.
// 2. Lightcurve (middle): L(phi) over 2 periods, marker at current phase.
// 3. P-L diagram (right): Leavitt Law line + Galactic calibrators
//    + current star.

import {
  periodLuminosity_MV, meanRadius_Rsun, meanTeff_K, luminosity_Lsun,
  radiusAtPhase, TeffAtPhase, lightcurveLsun, apparentMag, distanceModulus,
  MbolFromL, KNOWN_CEPHEIDS, blackbodyColor,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rP = document.getElementById('readout-P');
const rMV = document.getElementById('readout-MV');
const rL = document.getElementById('readout-L');
const rR = document.getElementById('readout-R');
const rT = document.getElementById('readout-T');

const sP = document.getElementById('slider-P'), vP = document.getElementById('value-P');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  P: 10.2,
  speed: 2,
  distance_pc: 360,
  running: !prefersReducedMotion(),
  phase: 0,
  t: 0,
};

const STAR_PANEL = { x: 20, y: 30, w: 260, h: H - 80 };
const LC_PANEL = { x: 300, y: 30, w: 280, h: H - 80 };
const PL_PANEL = { x: 600, y: 30, w: W - 620, h: H - 80 };

function drawStar() {
  const { x, y, w, h } = STAR_PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('pulsating Cepheid', x + 8, y - 6);

  const cx = x + w / 2, cy = y + h / 2;
  const R_Rsun = radiusAtPhase(st.phase, st.P);
  const T_K = TeffAtPhase(st.phase, st.P);
  const L_now = luminosity_Lsun(R_Rsun, T_K);
  const L_mean = luminosity_Lsun(meanRadius_Rsun(st.P), meanTeff_K(st.P));
  const lumFactor = L_now / Math.max(1e-9, L_mean);    // 1.0 at mean; > 1 at peak; < 1 at trough.
  const drawR = 35 + 5 * Math.sqrt(R_Rsun);
  const col = blackbodyColor(T_K);

  // Distance-driven apparent-brightness factor. The halo and core
  // intensity scale as 1/d^2 (inverse-square law) so moving the
  // distance slider visibly dims the star without changing its size
  // on the canvas. d=300 pc is the calibration distance (around the
  // delta-Cep neighbourhood) at which the halo is fully bright.
  const distRef = 300;
  const distFactor = Math.max(0.05, Math.min(2.5, (distRef / Math.max(50, st.distance_pc)) ** 2));

  // Luminosity-driven halo: a soft radial glow whose intensity tracks
  // both intrinsic L (phase-modulated) and apparent 1/d^2 dimming.
  const haloR = drawR * (2.0 + 0.7 * (lumFactor - 1));
  const haloA = Math.max(0, Math.min(0.85, 0.35 + 0.55 * (lumFactor - 1))) * distFactor;
  const halo = ctx.createRadialGradient(cx, cy, drawR * 0.95, cx, cy, haloR);
  halo.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${(haloA * 0.55).toFixed(3)})`);
  halo.addColorStop(0.5, `rgba(${col.r}, ${col.g}, ${col.b}, ${(haloA * 0.18).toFixed(3)})`);
  halo.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, Math.PI * 2); ctx.fill();

  // Star body. Core brightness is also lumFactor-modulated so peak-light
  // shows as visibly hotter (whiter) core; trough is more saturated colour.
  const coreBoost = Math.min(1, Math.max(0.55, 0.7 + 0.35 * (lumFactor - 1)));
  const grad = ctx.createRadialGradient(cx - drawR * 0.3, cy - drawR * 0.3, drawR * 0.15, cx, cy, drawR);
  grad.addColorStop(0, `rgba(255, 255, ${Math.round(220 + 35 * coreBoost)}, 1)`);
  grad.addColorStop(0.6, `rgba(${col.r}, ${col.g}, ${col.b}, 1)`);
  grad.addColorStop(1, `rgba(${Math.round(col.r * 0.4)}, ${Math.round(col.g * 0.4)}, ${Math.round(col.b * 0.4)}, 1)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, drawR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.3)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, drawR, 0, Math.PI * 2); ctx.stroke();
  // Mean-radius reference ring.
  const meanR_can = 35 + 5 * Math.sqrt(meanRadius_Rsun(st.P));
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.arc(cx, cy, meanR_can, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  // Readouts.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`R = ${R_Rsun.toFixed(1)} R_sun`, x + 8, y + h - 52);
  ctx.fillText(`T_eff = ${T_K.toFixed(0)} K`, x + 8, y + h - 38);
  ctx.fillText(`L / <L> = ${lumFactor.toFixed(2)}`, x + 8, y + h - 24);
  ctx.fillStyle = 'rgba(120, 200, 255, 0.85)';
  ctx.fillText(`apparent 1/d^2 = ${distFactor.toFixed(2)}x`, x + 8, y + h - 10);
  // Phase arrow.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
  const dPhase = Math.cos(2 * Math.PI * st.phase);
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(dPhase > 0 ? '(expanding)' : '(contracting)', x + 8, y + 18);
}

function drawLightcurve() {
  const { x, y, w, h } = LC_PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('lightcurve  L(phi)', x + 8, y - 6);

  // One-period phase-folded lightcurve over [0, 1], so the sweeping
  // marker (st.phase wraps in [0,1)) spans the full plot from the
  // left edge to the right edge and the loop is in sync with it.
  const N = 200;
  const phi_min = 0, phi_max = 1;
  let Lmin = Infinity, Lmax = -Infinity;
  const Ls = [];
  for (let k = 0; k < N; k++) {
    const phi = phi_min + (k / (N - 1)) * (phi_max - phi_min);
    const L = lightcurveLsun(phi, st.P);
    Ls.push(L);
    if (L < Lmin) Lmin = L;
    if (L > Lmax) Lmax = L;
  }
  const yScale = (L) => y + h - 30 - ((L - Lmin) / Math.max(1e-9, Lmax - Lmin)) * (h - 50);
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const phi = phi_min + (k / (N - 1)) * (phi_max - phi_min);
    const xx = x + 40 + ((phi - phi_min) / (phi_max - phi_min)) * (w - 60);
    const yy = yScale(Ls[k]);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // Current phase marker.
  const xc = x + 40 + ((st.phase - phi_min) / (phi_max - phi_min)) * (w - 60);
  const yc = yScale(lightcurveLsun(st.phase, st.P));
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.7)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xc, y + 8); ctx.lineTo(xc, y + h - 24); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 5, 0, Math.PI * 2); ctx.fill();
  // Period markers.
  for (let p = 0; p <= 1; p++) {
    const xp = x + 40 + ((p - phi_min) / (phi_max - phi_min)) * (w - 60);
    ctx.strokeStyle = 'rgba(200, 210, 230, 0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(xp, y + 8); ctx.lineTo(xp, y + h - 24); ctx.stroke();
  }
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('phi = 0', x + 40, y + h - 10);
  ctx.fillText('1', x + 40 + ((1 - phi_min) / (phi_max - phi_min)) * (w - 60) - 4, y + h - 10);
  ctx.fillText('2', x + 40 + ((1.8 - phi_min) / (phi_max - phi_min)) * (w - 60) - 4, y + h - 10);
  ctx.fillText('L_min', x + 8, y + h - 24);
  ctx.fillText('L_max', x + 8, y + 14);
  // Period text.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`P = ${st.P.toFixed(1)} days`, x + w - 90, y + h - 8);
}

function drawPLDiagram() {
  const { x, y, w, h } = PL_PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Leavitt period-luminosity', x + 8, y - 6);

  // x-axis: log10 P from 0 to 2 (1 to 100 days).
  // y-axis: M_V from -2 (top) to -8 (bottom, brighter).
  const logPmin = 0, logPmax = 2;
  const MVmin = -8, MVmax = -2;
  const px = (logP) => x + 36 + ((logP - logPmin) / (logPmax - logPmin)) * (w - 56);
  const py = (MV) => y + 16 + ((MV - MVmin) / (MVmax - MVmin)) * (h - 50);

  // Madore-Freedman line.
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.9)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k <= 40; k++) {
    const lP = logPmin + (k / 40) * (logPmax - logPmin);
    const MV = -2.78 * lP - 1.35;
    if (k === 0) ctx.moveTo(px(lP), py(MV)); else ctx.lineTo(px(lP), py(MV));
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(120, 220, 255, 0.8)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('M_V = -2.78 log P - 1.35', px(0.4), py(-7.4));

  // Calibrators.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  for (const c of KNOWN_CEPHEIDS) {
    const lP = Math.log10(c.P);
    const MV = -2.78 * lP - 1.35;
    const xx = px(lP), yy = py(MV);
    ctx.beginPath(); ctx.arc(xx, yy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(c.name, xx + 7, yy + 4);
    ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  }

  // Current star marker.
  const lP = Math.log10(st.P);
  const MV = periodLuminosity_MV(st.P);
  const cx = px(lP), cy = py(MV);
  const colT = blackbodyColor(meanTeff_K(st.P));
  ctx.fillStyle = `rgba(${colT.r}, ${colT.g}, ${colT.b}, 1)`;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Axis labels and ticks.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let lP = 0; lP <= 2; lP += 0.5) {
    const xx = px(lP);
    ctx.fillText(`10^${lP.toFixed(1)}`, xx - 14, y + h - 8);
  }
  for (let MV = -8; MV <= -2; MV += 1) {
    const yy = py(MV);
    ctx.fillText(`${MV}`, x + 12, yy + 4);
  }
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('log P (days)', x + w / 2 - 30, y + h - 8);
  ctx.save(); ctx.translate(x + 8, y + h / 2 + 20); ctx.rotate(-Math.PI / 2);
  ctx.fillText('M_V', 0, 0);
  ctx.restore();
}

function updateReadout() {
  const MV = periodLuminosity_MV(st.P);
  const R = radiusAtPhase(st.phase, st.P);
  const T = TeffAtPhase(st.phase, st.P);
  const L = luminosity_Lsun(R, T);
  rP.textContent = st.P.toFixed(1) + ' d';
  rMV.textContent = MV.toFixed(2);
  rL.textContent = L.toFixed(1);
  rR.textContent = R.toFixed(1);
  rT.textContent = T.toFixed(0);
}

function readSliders() {
  st.P = parseFloat(sP.value);
  st.speed = parseInt(sSpeed.value, 10);
  st.distance_pc = parseFloat(sD.value);
  vP.textContent = st.P.toFixed(1);
  vSpeed.textContent = String(st.speed);
  vD.textContent = String(st.distance_pc);
}

function applyPreset(name) {
  const k = KNOWN_CEPHEIDS.find(c => c.name.replace(/[\s.]/g, '').toLowerCase().includes(name.replace('_', '')));
  if (k) {
    st.P = k.P;
    st.distance_pc = k.d_pc;
    sP.value = String(st.P);
    sD.value = String(st.distance_pc);
    readSliders();
    vPreset.textContent = k.name.slice(0, 6);
  }
}

[sP, sSpeed, sD].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', () => applyPreset(selPreset.value));
btnReset.addEventListener('click', () => { st.phase = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  period_days: { get: () => st.P, set: v => { st.P = parseFloat(v); sP.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function draw() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Starfield
  for (let i = 0; i < 70; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.10 + 0.30 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  drawStar();
  drawLightcurve();
  drawPLDiagram();
  // Bottom caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`P = ${st.P.toFixed(1)} d, M_V = ${periodLuminosity_MV(st.P).toFixed(2)}, mu = ${distanceModulus(st.distance_pc).toFixed(2)}, m_V = ${apparentMag(periodLuminosity_MV(st.P), st.distance_pc).toFixed(2)}`, 14, H - 14);
  updateReadout();
}

if (CAPTURE_NAME) {
  st.phase = CAPTURE_FRAC || 0;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running && st.speed > 0) {
      // Period-driven animation. Visual time scale: a P = 10 d Cepheid
      // takes ~ 5 seconds per cycle at speed = 2. Longer-period stars
      // pulse visibly slower; shorter-period ones faster. The slider
      // value 'speed' is a global multiplier (1, 2, 3).
      const P_ref = 10;            // reference period in days for the
                                    // visual base rate.
      const cyclesPerSec = (st.speed * 0.2) * (P_ref / Math.max(1, st.P));
      st.phase += dt * cyclesPerSec;
      st.phase = st.phase - Math.floor(st.phase);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
// Reports the pulsation period and phase and the mean stellar
// properties along the instability strip.
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'period', label: 'pulsation period (days)', value: st.P, format: 'float' },
      { key: 'phase', label: 'pulsation phase', value: st.phase, format: 'float' },
      { key: 'abs-mag', label: 'absolute magnitude M_V', value: periodLuminosity_MV(st.P), format: 'float' },
      { key: 'mean-radius', label: 'mean radius (Rsun)', value: meanRadius_Rsun(st.P), format: 'float' },
      { key: 'mean-teff', label: 'mean Teff (K)', value: meanTeff_K(st.P), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  // Leavitt's period-luminosity relation: a longer-period Cepheid is
  // intrinsically brighter, so the absolute magnitude is more negative
  // at a longer period.
  const mvNow = periodLuminosity_MV(st.P);
  const mvLong = periodLuminosity_MV(st.P * 2);
  // The light curve pulsates: the instantaneous luminosity stays in a
  // bounded band around the mean rather than running away.
  const lNow = luminosity_Lsun(radiusAtPhase(st.phase, st.P), TeffAtPhase(st.phase, st.P));
  const lMean = luminosity_Lsun(meanRadius_Rsun(st.P), meanTeff_K(st.P));
  const ratio = lNow / Math.max(1e-6, lMean);
  return [
    {
      key: 'period-luminosity',
      label: 'period-luminosity relation (Leavitt law)',
      value: mvNow.toFixed(2),
      status: mvLong < mvNow ? 'pass' : 'drift',
    },
    {
      key: 'pulsation-bounded',
      label: 'pulsation luminosity bounded',
      value: ratio.toFixed(2),
      status: (ratio > 0.3 && ratio < 3) ? 'pass' : 'drift',
    },
  ];
};
