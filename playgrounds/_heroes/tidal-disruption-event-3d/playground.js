// TDE playground. Canvas2D scene: top panel shows the star
// approaching the BH on a parabolic orbit, crossing R_T and being
// stretched into a stream; bottom panel shows the t^-5/3 lightcurve.

import {
  tidalRadius_m, schwarzschildRadius_m, isDisrupted, maxDisruptingBH_solar,
  peakFallbackTime_days, peakFallbackTime_s, fallbackRate,
  lightcurve_W, peakLuminosity_W, eddingtonLuminosity_W,
  STREAM_LENGTH, makeRng,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rMBH = document.getElementById('readout-MBH');
const rRtRs = document.getElementById('readout-rtrs');
const rTpk = document.getElementById('readout-tpk');
const rLp = document.getElementById('readout-Lp');
const rPhase = document.getElementById('readout-phase');

const sLogMBH = document.getElementById('slider-logMBH'), vLogMBH = document.getElementById('value-logMBH');
const sMstar = document.getElementById('slider-Mstar'), vMstar = document.getElementById('value-Mstar');
const sRstar = document.getElementById('slider-Rstar'), vRstar = document.getElementById('value-Rstar');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  logMBH: 6.0,
  Mstar: 1.0,
  Rstar: 1.0,
  speed: 2,
  running: !prefersReducedMotion(),
  phase: 0,          // 0 to 1: pre-disruption (0-0.4), disruption (0.4-0.5), fallback (0.5-1)
  t: 0,
  rng: makeRng(0xC0FFEE),
};

// Scene layout: top 60% = orbital scene, bottom 40% = lightcurve.
const SCENE = { x: 0, y: 0, w: W, h: 0.62 * H };
const LC = { x: 30, y: 0.62 * H + 24, w: W - 60, h: 0.32 * H - 20 };

function currentMBH() { return Math.pow(10, st.logMBH); }
function currentDisrupted() { return isDisrupted(currentMBH(), st.Mstar, st.Rstar); }
function currentRtRs() {
  const RT = tidalRadius_m(currentMBH(), st.Mstar, st.Rstar);
  const RS = schwarzschildRadius_m(currentMBH());
  return RT / RS;
}
function currentTpkDays() {
  return peakFallbackTime_days(currentMBH(), st.Mstar, st.Rstar);
}
function currentLpEddRatio() {
  const Lp = peakLuminosity_W(currentMBH(), st.Mstar, st.Rstar);
  const Ledd = eddingtonLuminosity_W(currentMBH());
  return Lp / Ledd;
}

function drawScene() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Starfield in scene area
  for (let i = 0; i < 90; i++) {
    const ix = (i * 23.7) % SCENE.w;
    const iy = (i * 31.1) % SCENE.h;
    const sb = 0.15 + 0.40 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }

  const cx = SCENE.x + SCENE.w * 0.55;
  const cy = SCENE.y + SCENE.h * 0.52;

  // Tidal-radius circle (cyan dashed).
  const RT_canvas = 130;
  ctx.strokeStyle = 'rgba(100, 220, 255, 0.55)';
  ctx.lineWidth = 1.3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.arc(cx, cy, RT_canvas, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(100, 220, 255, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('R_T (tidal radius)', cx + RT_canvas * 0.7, cy - RT_canvas * 0.7);

  // SMBH at center: black disc with photon ring.
  const BH_R = 20;
  const glow = ctx.createRadialGradient(cx, cy, BH_R * 0.7, cx, cy, BH_R * 2.4);
  glow.addColorStop(0, 'rgba(255, 170, 100, 0.7)');
  glow.addColorStop(0.5, 'rgba(255, 110, 200, 0.25)');
  glow.addColorStop(1, 'rgba(100, 80, 220, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, BH_R * 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx, cy, BH_R, 0, Math.PI * 2); ctx.fill();

  // Star: pre-disruption (whole), or being disrupted (stretching), or stream.
  if (st.phase < 0.4) {
    // Star approaching on parabolic trajectory.
    const u = st.phase / 0.4;       // 0 to 1 (approach)
    // Parabolic: x = -300 + 200 u, y = 280 - 480 u + 280 u^2 (roughly)
    const sx = cx + (-280 + 280 * u);
    const sy = cy - (180 - 220 * u + 60 * u * u);
    const starR = 12 * Math.max(0.8, st.Rstar);
    // Trail
    ctx.strokeStyle = 'rgba(255, 220, 140, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < 30; k++) {
      const v = (u - k * 0.03) ;
      if (v < 0) break;
      const x_ = cx + (-280 + 280 * v);
      const y_ = cy - (180 - 220 * v + 60 * v * v);
      if (k === 0) ctx.moveTo(x_, y_); else ctx.lineTo(x_, y_);
    }
    ctx.stroke();
    const sgrad = ctx.createRadialGradient(sx - starR * 0.3, sy - starR * 0.3, starR * 0.15, sx, sy, starR);
    sgrad.addColorStop(0, 'rgba(255, 255, 220, 1)');
    sgrad.addColorStop(0.5, 'rgba(255, 220, 100, 1)');
    sgrad.addColorStop(1, 'rgba(180, 100, 40, 0)');
    ctx.fillStyle = sgrad;
    ctx.beginPath(); ctx.arc(sx, sy, starR * 1.3, 0, Math.PI * 2); ctx.fill();
    // Label
    ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('star', sx + starR + 4, sy + 4);
  } else if (st.phase < 0.55) {
    // Disruption: stretched ellipsoid at pericentre.
    const u = (st.phase - 0.4) / 0.15;
    const angle = -Math.PI / 6 + u * Math.PI * 0.4;
    const stretch = 12 + 80 * u;
    const px = cx + 90 * Math.cos(angle);
    const py = cy + 90 * Math.sin(angle);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    const sg = ctx.createLinearGradient(0, -stretch, 0, stretch);
    sg.addColorStop(0, 'rgba(255, 200, 100, 0.85)');
    sg.addColorStop(0.5, 'rgba(255, 255, 200, 1)');
    sg.addColorStop(1, 'rgba(255, 200, 100, 0.85)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, stretch, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Pericentre arrows
    ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('stretched debris', px + 12, py);
  } else {
    // Stream + accretion disk forming.
    const u = (st.phase - 0.55) / 0.45;
    // Stream: many small particles on eccentric orbits, color by recency.
    drawStream(cx, cy, u);
    // Accretion disk: ring of glowing material near the BH.
    drawDisk(cx, cy, u);
    // Label
    ctx.fillStyle = 'rgba(255, 200, 120, 0.85)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('returning debris stream', cx + RT_canvas + 8, cy + 100);
    ctx.fillText('accretion disk', cx + 50, cy - 30);
  }

  // Caption
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = '12px system-ui, sans-serif';
  const phaseLabel = st.phase < 0.4 ? 'approach' : (st.phase < 0.55 ? 'disruption' : 'fallback');
  ctx.fillText(`phase = ${phaseLabel}, M_BH = 10^${st.logMBH.toFixed(1)} M_sun, ${currentDisrupted() ? 'disrupting' : 'swallow-whole'}`, 14, SCENE.h - 14);
}

function drawStream(cx, cy, u) {
  // Spawn ~ 60 particles on eccentric orbits at angles spanning a 220-deg arc.
  const N = 120;
  for (let i = 0; i < N; i++) {
    const t01 = ((i / N) + u * 0.6) % 1;
    const r = 200 * (1 - 0.8 * t01) + 30;
    const aBase = -Math.PI * 0.4 + t01 * Math.PI * 1.6;
    const x = cx + r * Math.cos(aBase);
    const y = cy + r * Math.sin(aBase);
    const a = 0.4 + 0.6 * (1 - t01);
    const col = i % 5 < 1
      ? [255, 220, 140]
      : [255, 180, 120];
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, 1.6 + 1.2 * (1 - t01), 0, Math.PI * 2); ctx.fill();
  }
}

function drawDisk(cx, cy, u) {
  // Bright glowing disk just outside the BH.
  const innerR = 28, outerR = 70;
  const N = 90;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI;
    for (let j = 0; j < 3; j++) {
      const r = innerR + (outerR - innerR) * (j + 0.5) / 3;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a) * 0.45;       // edge-on flattening
      const heat = 1 - (r - innerR) / (outerR - innerR);
      const intensity = u * (0.4 + 0.6 * heat);
      ctx.fillStyle = `rgba(${Math.round(255 * intensity + 50)}, ${Math.round(200 * intensity + 30)}, ${Math.round(120 * intensity)}, ${(0.55 * intensity + 0.2).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawLightcurve() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(LC.x, LC.y, LC.w, LC.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(LC.x + 0.5, LC.y + 0.5, LC.w - 1, LC.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Lightcurve L(t): t^-5/3 fallback after the peak', LC.x + 8, LC.y - 6);

  const tpDays = currentTpkDays();
  const Lp = peakLuminosity_W(currentMBH(), st.Mstar, st.Rstar);
  if (!isFinite(Lp) || Lp <= 0) return;
  // Plot range: t in [0, 8 t_peak] linear, L on log scale.
  const tmax = 8 * tpDays * 86400;
  const N = 200;
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let first = true;
  let Lmax = 0;
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1) * tmax;
    const L = lightcurve_W(t, currentMBH(), st.Mstar, st.Rstar);
    if (L > Lmax) Lmax = L;
  }
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1) * tmax;
    const L = lightcurve_W(t, currentMBH(), st.Mstar, st.Rstar);
    const x = LC.x + 40 + (k / (N - 1)) * (LC.w - 60);
    const y = (LC.y + LC.h - 24) - Math.min(1, L / Math.max(1e-30, Lmax)) * (LC.h - 50);
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // t_peak marker.
  const xPeak = LC.x + 40 + (tpDays * 86400 / tmax) * (LC.w - 60);
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.75)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xPeak, LC.y + 8); ctx.lineTo(xPeak, LC.y + LC.h - 24); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(120, 200, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`t_peak = ${tpDays.toFixed(0)} days`, xPeak + 4, LC.y + 22);
  // Current-time marker (advances with st.phase).
  const sliderT = Math.max(0, Math.min(1, (st.phase - 0.55) / 0.45)) * tmax;
  if (st.phase >= 0.55) {
    const x_now = LC.x + 40 + (sliderT / tmax) * (LC.w - 60);
    const L_now = lightcurve_W(sliderT, currentMBH(), st.Mstar, st.Rstar);
    const y_now = (LC.y + LC.h - 24) - Math.min(1, L_now / Math.max(1e-30, Lmax)) * (LC.h - 50);
    ctx.fillStyle = 'rgba(255, 250, 200, 1)';
    ctx.beginPath(); ctx.arc(x_now, y_now, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('0', LC.x + 36, LC.y + LC.h - 8);
  ctx.fillText(`${(tmax / 86400).toFixed(0)} days`, LC.x + LC.w - 70, LC.y + LC.h - 8);
  ctx.fillText('L', LC.x + 20, LC.y + 16);
}

function updateReadout() {
  rMBH.textContent = `10^${st.logMBH.toFixed(1)} M_sun`;
  rRtRs.textContent = currentRtRs().toExponential(2);
  rTpk.textContent = currentTpkDays().toFixed(1);
  rLp.textContent = currentLpEddRatio().toFixed(2);
  const phaseLabel = st.phase < 0.4 ? 'approach' : (st.phase < 0.55 ? 'disruption' : 'fallback');
  rPhase.textContent = phaseLabel;
}

function draw() {
  drawScene();
  drawLightcurve();
  updateReadout();
}

function readSliders() {
  st.logMBH = parseFloat(sLogMBH.value);
  st.Mstar = parseFloat(sMstar.value);
  st.Rstar = parseFloat(sRstar.value);
  st.speed = parseInt(sSpeed.value, 10);
  vLogMBH.textContent = st.logMBH.toFixed(1);
  vMstar.textContent = st.Mstar.toFixed(1);
  vRstar.textContent = st.Rstar.toFixed(1);
  vSpeed.textContent = String(st.speed);
}

[sLogMBH, sMstar, sRstar, sSpeed].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => { st.phase = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  m_bh: { get: () => st.logMBH, set: v => { st.logMBH = parseFloat(v); sLogMBH.value = v; }, parse: parseFloat },
  m_star: { get: () => st.Mstar, set: v => { st.Mstar = parseFloat(v); sMstar.value = v; }, parse: parseFloat },
  r_star: { get: () => st.Rstar, set: v => { st.Rstar = parseFloat(v); sRstar.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

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
      st.phase += dt * 0.05 * st.speed;
      if (st.phase > 1) st.phase = 0;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
