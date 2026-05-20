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
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('pulsating Cepheid', x + 8, y - 6);

  const cx = x + w / 2, cy = y + h / 2;
  // Map physical R/R_sun to canvas pixels. delta Cep ~ 45 R_sun;
  // l Car ~ 180 R_sun. Use sqrt scaling so big stars don't blow up.
  const R_Rsun = radiusAtPhase(st.phase, st.P);
  const T_K = TeffAtPhase(st.phase, st.P);
  const drawR = 35 + 5 * Math.sqrt(R_Rsun);
  const col = blackbodyColor(T_K);
  const grad = ctx.createRadialGradient(cx - drawR * 0.3, cy - drawR * 0.3, drawR * 0.15, cx, cy, drawR);
  grad.addColorStop(0, 'rgba(255, 255, 235, 1)');
  grad.addColorStop(0.6, `rgba(${col.r}, ${col.g}, ${col.b}, 1)`);
  grad.addColorStop(1, `rgba(${Math.round(col.r * 0.4)}, ${Math.round(col.g * 0.4)}, ${Math.round(col.b * 0.4)}, 1)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, drawR, 0, Math.PI * 2); ctx.fill();
  // limb darkening
  ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.3)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, drawR, 0, Math.PI * 2); ctx.stroke();
  // Pulsation indicator: show the mean-radius ring as dashed.
  const meanR_can = 35 + 5 * Math.sqrt(meanRadius_Rsun(st.P));
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.arc(cx, cy, meanR_can, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  // Readouts.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`R = ${R_Rsun.toFixed(1)} R_sun`, x + 8, y + h - 24);
  ctx.fillText(`T_eff = ${T_K.toFixed(0)} K`, x + 8, y + h - 10);
  // Phase arrow.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
  const dPhase = Math.cos(2 * Math.PI * st.phase);
  ctx.font = '12px system-ui, sans-serif';
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
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('lightcurve  L(phi)', x + 8, y - 6);

  // Two-period lightcurve over phase axis [-0.2, 1.8].
  const N = 200;
  const phi_min = -0.2, phi_max = 1.8;
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
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('phi = 0', x + 40, y + h - 10);
  ctx.fillText('1', x + 40 + ((1 - phi_min) / (phi_max - phi_min)) * (w - 60) - 4, y + h - 10);
  ctx.fillText('2', x + 40 + ((1.8 - phi_min) / (phi_max - phi_min)) * (w - 60) - 4, y + h - 10);
  ctx.fillText('L_min', x + 8, y + h - 24);
  ctx.fillText('L_max', x + 8, y + 14);
  // Period text.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
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
  ctx.font = 'bold 13px system-ui, sans-serif';
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
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('M_V = -2.78 log P - 1.35', px(0.4), py(-7.4));

  // Calibrators.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  for (const c of KNOWN_CEPHEIDS) {
    const lP = Math.log10(c.P);
    const MV = -2.78 * lP - 1.35;
    const xx = px(lP), yy = py(MV);
    ctx.beginPath(); ctx.arc(xx, yy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
    ctx.font = '11px system-ui, sans-serif';
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
  ctx.font = '11px ui-monospace, monospace';
  for (let lP = 0; lP <= 2; lP += 0.5) {
    const xx = px(lP);
    ctx.fillText(`10^${lP.toFixed(1)}`, xx - 14, y + h - 8);
  }
  for (let MV = -8; MV <= -2; MV += 1) {
    const yy = py(MV);
    ctx.fillText(`${MV}`, x + 12, yy + 4);
  }
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
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
  ctx.font = '12px system-ui, sans-serif';
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
      // Show one period per ~3 seconds, scaled by speed.
      st.phase += dt * 0.35 * st.speed;
      if (st.phase > 1) st.phase -= 1;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
