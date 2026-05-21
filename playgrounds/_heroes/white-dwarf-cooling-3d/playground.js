// White-dwarf cooling playground. Canvas2D with four panels:
// (1) HR diagram (top), (2) WD sphere photosphere color (left bottom),
// (3) interior cross-section with crystal front (middle bottom),
// (4) luminosity-function bump indicator (right bottom).

import {
  eggletonRadius_Rsun, mestelLuminosity_Lsun, effectiveTemperature_K,
  blackbodyColor, crystalFraction, DISK_AGE_GYR,
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

const rM = document.getElementById('readout-M');
const rAge = document.getElementById('readout-age');
const rL = document.getElementById('readout-L');
const rT = document.getElementById('readout-T');
const rfX = document.getElementById('readout-fX');

const sMass = document.getElementById('slider-mass'), vMass = document.getElementById('value-mass');
const sLogt = document.getElementById('slider-logt'), vLogt = document.getElementById('value-logt');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const selBump = document.getElementById('select-bump'), vBump = document.getElementById('value-bump');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  M: 0.60,
  log_t: 9.0,           // log10 (age in years)
  speed: 1,
  bump: true,
  running: !prefersReducedMotion(),
  t: 0,
};

function current() {
  const t_yr = Math.pow(10, st.log_t);
  const L = mestelLuminosity_Lsun(st.M, t_yr);
  const R = eggletonRadius_Rsun(st.M);
  const T = effectiveTemperature_K(L, Math.max(1e-9, R));
  const fX = crystalFraction(t_yr, st.M);
  return { t_yr, L, R, T, fX };
}

// HR diagram region.
const HR = { x: 30, y: 40, w: W - 60, h: 230 };
// L axis: log L / L_sun in [-5, 1]
// T axis: log T_eff in [3.4, 4.7] (5000 to 50000 K) -- inverted (hot on left)
const LMIN = -5, LMAX = 1;
const LOGTMIN = 3.4, LOGTMAX = 4.7;

function hrXY(logT, logL) {
  const x = HR.x + ((LOGTMAX - logT) / (LOGTMAX - LOGTMIN)) * HR.w;
  const y = HR.y + ((LMAX - logL) / (LMAX - LMIN)) * HR.h;
  return { x, y };
}

function drawHR(cur) {
  // Frame
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(HR.x, HR.y, HR.w, HR.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(HR.x + 0.5, HR.y + 0.5, HR.w - 1, HR.h - 1);
  // Title
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('Hertzsprung-Russell diagram (WD cooling track)', HR.x + 8, HR.y - 6);
  // Gridlines and axis labels
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let logL = -5; logL <= 1; logL += 1) {
    const p = hrXY(LOGTMAX, logL);
    ctx.beginPath(); ctx.moveTo(HR.x, p.y); ctx.lineTo(HR.x + HR.w, p.y); ctx.stroke();
    ctx.fillText(`log L = ${logL}`, HR.x + 4, p.y - 2);
  }
  for (let logT = 3.5; logT <= 4.7; logT += 0.2) {
    const p = hrXY(logT, LMIN);
    ctx.beginPath(); ctx.moveTo(p.x, HR.y); ctx.lineTo(p.x, HR.y + HR.h); ctx.stroke();
    ctx.fillText(`${Math.pow(10, logT).toFixed(0)} K`, p.x - 18, HR.y + HR.h + 12);
  }
  // Cooling tracks for three masses.
  for (const m of [0.40, 0.60, 0.90, 1.20]) {
    ctx.strokeStyle = (m === st.M) ? 'rgba(255, 220, 140, 0.7)' : 'rgba(120, 160, 220, 0.30)';
    ctx.lineWidth = (m === st.M) ? 1.8 : 1.1;
    ctx.beginPath();
    let first = true;
    for (let logT_age = 7.0; logT_age <= 10.4; logT_age += 0.05) {
      const t_yr = Math.pow(10, logT_age);
      const L = mestelLuminosity_Lsun(m, t_yr);
      const R = eggletonRadius_Rsun(m);
      const T = effectiveTemperature_K(L, Math.max(1e-9, R));
      const lL = Math.log10(L);
      const lT = Math.log10(T);
      if (lL < LMIN || lL > LMAX || lT < LOGTMIN || lT > LOGTMAX) { first = true; continue; }
      const p = hrXY(lT, lL);
      if (first) { ctx.moveTo(p.x, p.y); first = false; } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  // Mass labels.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.65)';
  ctx.font = fontString(canvas, 'caption');
  for (const [m, lbl] of [[0.40, '0.4'], [0.60, '0.6'], [0.90, '0.9'], [1.20, '1.2']]) {
    // Pick a point on the curve at logT_age = 9.0 to label.
    const t_yr = 1e9;
    const L = mestelLuminosity_Lsun(m, t_yr);
    const R = eggletonRadius_Rsun(m);
    const T = effectiveTemperature_K(L, Math.max(1e-9, R));
    const lL = Math.log10(L);
    const lT = Math.log10(T);
    if (lL >= LMIN && lL <= LMAX && lT >= LOGTMIN && lT <= LOGTMAX) {
      const p = hrXY(lT, lL);
      ctx.fillText(`${lbl} M_sun`, p.x + 4, p.y - 4);
    }
  }
  // Disk age cutoff marker.
  const tCut = DISK_AGE_GYR * 1e9;
  const Lcut = mestelLuminosity_Lsun(st.M, tCut);
  const Rcut = eggletonRadius_Rsun(st.M);
  const Tcut = effectiveTemperature_K(Lcut, Math.max(1e-9, Rcut));
  const pCut = hrXY(Math.log10(Tcut), Math.log10(Lcut));
  ctx.strokeStyle = 'rgba(255, 140, 80, 0.75)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pCut.x - 80, pCut.y); ctx.lineTo(pCut.x + 80, pCut.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 180, 100, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`disk-age cutoff (~ ${DISK_AGE_GYR} Gyr)`, pCut.x + 6, pCut.y + 14);
  // Current WD position marker
  const pWD = hrXY(Math.log10(cur.T), Math.log10(cur.L));
  const col = blackbodyColor(cur.T);
  ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 1)`;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(pWD.x, pWD.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

// 3D WD sphere panel
const PANEL_TOP = HR.y + HR.h + 30;
const SPHERE_PANEL = { x: 30, y: PANEL_TOP, w: 240, h: H - PANEL_TOP - 30 };
const CROSS_PANEL = { x: 300, y: PANEL_TOP, w: 240, h: H - PANEL_TOP - 30 };
const SCALE_PANEL = { x: 570, y: PANEL_TOP, w: W - 600, h: H - PANEL_TOP - 30 };

function drawSphere(cur) {
  const { x, y, w, h } = SPHERE_PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('photosphere', x + 8, y - 6);

  const cx = x + w / 2, cy = y + h / 2;
  const radius = 0.45 * Math.min(w, h);
  const col = blackbodyColor(cur.T);
  const grad = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.25, radius * 0.1, cx, cy, radius);
  grad.addColorStop(0, `rgba(255, 255, 255, 1)`);
  grad.addColorStop(0.4, `rgba(${col.r}, ${col.g}, ${col.b}, 1)`);
  grad.addColorStop(1, `rgba(${Math.round(col.r * 0.3)}, ${Math.round(col.g * 0.3)}, ${Math.round(col.b * 0.3)}, 1)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
  // Limb darkening highlight
  ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.4)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();

  // Labels
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T_eff = ${cur.T.toFixed(0)} K`, x + 8, y + h - 22);
  ctx.fillText(`log L = ${Math.log10(cur.L).toFixed(2)}`, x + 8, y + h - 8);
}

function drawCrossSection(cur) {
  const { x, y, w, h } = CROSS_PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('interior cross-section', x + 8, y - 6);

  const cx = x + w / 2, cy = y + h / 2;
  const radius = 0.45 * Math.min(w, h);
  // Outer envelope: H/He thin layer drawn as a thin ring.
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(60, 80, 120, 0.7)';
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // C/O liquid: dark grey
  ctx.fillStyle = 'rgba(70, 60, 70, 0.95)';
  ctx.beginPath(); ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2); ctx.fill();
  // Crystal core: yellow
  const fX = cur.fX;
  const rX = radius * 0.95 * Math.sqrt(fX);
  if (rX > 1) {
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rX);
    cg.addColorStop(0, 'rgba(255, 240, 160, 1)');
    cg.addColorStop(0.7, 'rgba(220, 180, 80, 1)');
    cg.addColorStop(1, 'rgba(180, 140, 50, 1)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, rX, 0, Math.PI * 2); ctx.fill();
    // Front line.
    ctx.strokeStyle = 'rgba(255, 250, 200, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, rX, 0, Math.PI * 2); ctx.stroke();
  }
  // Labels
  ctx.fillStyle = 'rgba(180, 200, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('H/He envelope', x + 8, y + 18);
  ctx.fillText('C/O liquid', x + 8, y + 32);
  ctx.fillStyle = 'rgba(255, 240, 160, 0.85)';
  ctx.fillText('C/O crystal', x + 8, y + 46);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.75)';
  ctx.fillText(`f_X = ${(fX * 100).toFixed(1)} %`, x + 8, y + h - 8);
}

function drawLF(cur) {
  if (!st.bump) return;
  const { x, y, w, h } = SCALE_PANEL;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('crystallization timeline', x + 8, y - 6);

  // x-axis: log10 t (years), 7 to 10.2.
  // y-axis: f_X(t) on [0, 1].
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 30, y + h - 30);
  ctx.lineTo(x + w - 10, y + h - 30);
  ctx.moveTo(x + 30, y + 10);
  ctx.lineTo(x + 30, y + h - 30);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('1', x + 12, y + 14);
  ctx.fillText('0', x + 12, y + h - 28);
  ctx.fillText('10^7', x + 28, y + h - 14);
  ctx.fillText('10^10', x + w - 40, y + h - 14);
  ctx.fillText('age (yr)', x + (w / 2) - 20, y + h - 14);
  // Curve
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let first = true;
  for (let lt = 7; lt <= 10.2; lt += 0.05) {
    const t_yr = Math.pow(10, lt);
    const f = crystalFraction(t_yr, st.M);
    const xx = x + 30 + ((lt - 7) / (10.2 - 7)) * (w - 40);
    const yy = (y + h - 30) - f * (h - 40);
    if (first) { ctx.moveTo(xx, yy); first = false; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // Marker for current age.
  const lt_now = st.log_t;
  const f_now = cur.fX;
  const xn = x + 30 + ((lt_now - 7) / (10.2 - 7)) * (w - 40);
  const yn = (y + h - 30) - f_now * (h - 40);
  ctx.fillStyle = 'rgba(220, 240, 255, 1)';
  ctx.beginPath(); ctx.arc(xn, yn, 4, 0, Math.PI * 2); ctx.fill();
  // f_X readout.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('f_X(t)', x + 36, y + 22);
}

function updateReadout() {
  const c = current();
  rM.textContent = st.M.toFixed(2) + ' M_sun';
  const t_yr = Math.pow(10, st.log_t);
  if (t_yr < 1e9) rAge.textContent = (t_yr / 1e6).toFixed(0) + ' Myr';
  else rAge.textContent = (t_yr / 1e9).toFixed(2) + ' Gyr';
  rL.textContent = Math.log10(c.L).toFixed(2);
  rT.textContent = c.T.toFixed(0) + ' K';
  rfX.textContent = (c.fX * 100).toFixed(1) + ' %';
}

function draw() {
  const cur = current();
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Sparse starfield in the empty corners
  for (let i = 0; i < 80; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % H;
    const sb = 0.10 + 0.30 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  drawHR(cur);
  drawSphere(cur);
  drawCrossSection(cur);
  drawLF(cur);
  updateReadout();
}

function readSliders() {
  st.M = parseFloat(sMass.value);
  st.log_t = parseFloat(sLogt.value);
  st.speed = parseInt(sSpeed.value, 10);
  st.bump = selBump.value === 'on';
  vMass.textContent = st.M.toFixed(2);
  vLogt.textContent = st.log_t.toFixed(2);
  vSpeed.textContent = String(st.speed);
  vBump.textContent = st.bump ? 'show' : 'hide';
}

[sMass, sLogt, sSpeed, selBump].forEach(el => el.addEventListener('input', readSliders));
selBump.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.log_t = 9.0; sLogt.value = '9.00'; readSliders(); });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  mass: { get: () => st.M, set: v => { st.M = parseFloat(v); sMass.value = v; }, parse: parseFloat },
  age_gyr: { get: () => Math.pow(10, st.log_t) / 1e9, set: v => { st.log_t = Math.log10(parseFloat(v) * 1e9); sLogt.value = st.log_t.toFixed(2); }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Sweep log_t from 7.5 (hot WD) to 10.0 (cold WD) as CAPTURE_FRAC.
  st.log_t = 7.5 + (CAPTURE_FRAC || 0) * (10.0 - 7.5);
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running && st.speed > 0) {
      // Auto-sweep age slider for visual interest.
      st.log_t += 0.04 * st.speed * dt;
      if (st.log_t > 10.2) st.log_t = 7.0;
      sLogt.value = st.log_t.toFixed(2);
      vLogt.textContent = st.log_t.toFixed(2);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
// White dwarfs cool by the Mestel law, luminosity falling as
// t^(-7/5) with cooling age. The late-time log-log slope of the
// cooling curve is the invariant.
window.playground = window.playground || {};
window.playground.getState = function () {
  const c = current();
  return {
    fields: [
      { key: 'mass', label: 'WD mass (M_sun)', value: st.M.toFixed(2), format: 'float' },
      { key: 'cooling-age', label: 'cooling age (yr)', value: c.t_yr.toExponential(2) },
      { key: 'luminosity', label: 'luminosity (L_sun)', value: c.L.toExponential(2) },
      { key: 'temperature', label: 'effective temperature (K)', value: Math.round(c.T) },
      { key: 'crystal-fraction', label: 'crystallised fraction', value: c.fX.toFixed(3), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const t1 = 1e8, t2 = 5e8;
  const L1 = mestelLuminosity_Lsun(st.M, t1);
  const L2 = mestelLuminosity_Lsun(st.M, t2);
  if (!(L1 > 0) || !(L2 > 0)) return [];
  const slope = Math.log(L2 / L1) / Math.log(t2 / t1);
  const off = Math.abs(slope + 7 / 5);
  return [
    {
      key: 'mestel-law',
      label: 'cooling follows the Mestel t^(-7/5) law',
      value: slope.toFixed(3),
      status: off < 0.02 ? 'pass' : (off < 0.2 ? 'pending' : 'drift'),
    },
  ];
};
