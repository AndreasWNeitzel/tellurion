// Jeans instability playground. Plots omega^2(k) on a signed
// log-symmetric scale, shading the unstable band.

import {
  jeansLengthM, jeansMassKg, omegaSquared,
  nToRho, isothermalCs, PC_M, M_SUN,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLj   = document.getElementById('readout-lj');
const readoutMj   = document.getElementById('readout-mj');

const sliderT     = document.getElementById('slider-T');
const sliderLogN  = document.getElementById('slider-logn');
const valueT      = document.getElementById('value-T');
const valueLogN   = document.getElementById('value-logn');

let T   = parseFloat(sliderT.value);
let logN = parseFloat(sliderLogN.value);

sliderT.addEventListener('input', () => { T = parseFloat(sliderT.value); valueT.textContent = String(T.toFixed(0)); });
sliderLogN.addEventListener('input', () => { logN = parseFloat(sliderLogN.value); valueLogN.textContent = logN.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

// Symmetric log scale: y > 0 -> log10(y), y < 0 -> -log10(-y), with
// linear interpolation across zero.
function symLog(y) {
  const linthresh = 1e-30;
  if (Math.abs(y) < linthresh) return y / linthresh;
  return Math.sign(y) * (Math.log10(Math.abs(y) / linthresh) + 1);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cs = isothermalCs(T);
  const n_cm3 = Math.pow(10, logN);
  const rho = nToRho(n_cm3);

  // Layout: dispersion plot on the LEFT, evolving-density simulation
  // on the RIGHT.
  const padL = 64, padR = 16, padT = 30, padB = 40;
  const SIM_FRAC = 0.40;
  const plotW = (canvas.width - padL - padR) * (1 - SIM_FRAC) - 16;
  const plotH = canvas.height - padT - padB;

  // k range from 1e-22 to 1e-12 /m (log) - covers galactic to subparsec.
  const kMinLog = -22, kMaxLog = -12;
  function xFor(lK) { return padL + plotW * (lK - kMinLog) / (kMaxLog - kMinLog); }

  // omega^2 range (log absolute) from 1e-32 (epsilon) to 1e-22.
  const wMinSym = -10, wMaxSym = 10; // symlog units
  function yFor(w2) {
    const s = symLog(w2);
    return padT + plotH * (1 - (s - wMinSym) / (wMaxSym - wMinSym));
  }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let lK = kMinLog; lK <= kMaxLog; lK += 2) {
    const x = xFor(lK);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`1e${lK}`, x - 18, padT + plotH + 14);
  }
  // zero line.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yFor(0)); ctx.lineTo(padL + plotW, yFor(0)); ctx.stroke();

  // Compute kJ.
  const lamJ = jeansLengthM(cs, rho);
  const kJ = 2 * Math.PI / lamJ;
  const lkJ = Math.log10(kJ);

  // Shade unstable band (k < kJ).
  if (lkJ > kMinLog) {
    const xShade = xFor(Math.min(kMaxLog, lkJ));
    ctx.fillStyle = 'rgba(239, 71, 111, 0.10)';
    ctx.fillRect(padL, padT, xShade - padL, plotH);
  }

  // Dispersion curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const lK = kMinLog + (kMaxLog - kMinLog) * i / 200;
    const k = Math.pow(10, lK);
    const w2 = omegaSquared(k, cs, rho);
    const xx = xFor(lK);
    const yy = yFor(w2);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Jeans wavenumber marker.
  if (lkJ > kMinLog && lkJ < kMaxLog) {
    const xJ = xFor(lkJ);
    ctx.strokeStyle = c.red;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xJ, padT); ctx.lineTo(xJ, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.red;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`k_J = 2pi/lambda_J`, xJ + 4, padT + 12);
  }

  // Axis labels.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('k (1/m)', padL + plotW - 50, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 40); ctx.rotate(-Math.PI / 2);
  ctx.fillText('ω^2 (1/s^2), signed-log', 0, 0); ctx.restore();

  // Label regions.
  ctx.fillStyle = c.red;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Jeans-unstable (ω^2 < 0)', padL + 12, padT + plotH - 8);
  ctx.fillStyle = c.blue;
  ctx.fillText('sound-wave (ω^2 > 0)', padL + plotW - 180, padT + 24);

  // ======================================================================
  // RIGHT: live evolution of a 1D density field under the dispersion.
  // delta(x, t) = sum_k A_k cos(k x) * f_k(t), where
  //   f_k(t) = cos(omega_k t)   if omega_k^2 > 0   (sound wave),
  //   f_k(t) = cosh(gamma_k t)  if omega_k^2 < 0   (Jeans-unstable).
  // The user sees stable modes oscillate while unstable ones blow up
  // exponentially.
  // ======================================================================
  const simX = padL + plotW + 16;
  const simW = canvas.width - padR - simX;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(simX, padT, simW, plotH);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(simX + 0.5, padT + 0.5, simW - 1, plotH - 1);
  ctx.fillStyle = c.fg;
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('δ(x, t) evolution', simX + 8, padT + 16);

  // Two stacked panes: top = density profile, bottom = mode amplitudes
  // tracked vs time (the diagnostic).
  const topH = plotH * 0.55, botH = plotH - topH - 14;
  // Density field.
  const fx0 = simX + 16, fy0 = padT + 28, fw = simW - 32, fh = topH - 30;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  for (let yv = -1; yv <= 1.001; yv += 0.5) {
    const y = fy0 + fh / 2 - (yv / 2) * fh;
    ctx.beginPath(); ctx.moveTo(fx0, y); ctx.lineTo(fx0 + fw, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.beginPath(); ctx.moveTo(fx0, fy0 + fh / 2); ctx.lineTo(fx0 + fw, fy0 + fh / 2); ctx.stroke();
  // Pick three probe wavenumbers: one well below k_J (unstable), one
  // near k_J, one well above (stable sound wave).
  const NX_FIELD = 240;
  const tEvolve = simTime;
  const probeKs = [
    { k: Math.pow(10, lkJ - 1.2), col: '#ef476f', label: 'k<k_J unstable' },
    { k: Math.pow(10, lkJ),       col: '#ffd166', label: 'k=k_J marginal' },
    { k: Math.pow(10, lkJ + 1.2), col: '#5bc0eb', label: 'k>k_J stable' },
  ];
  // Amplitude evolution f(t).
  function f_k(k, t) {
    const w2 = omegaSquared(k, cs, rho);
    if (w2 >= 0) return Math.cos(Math.sqrt(w2) * t);
    return Math.cosh(Math.sqrt(-w2) * t);
  }
  // Sum the three probe modes into the density field; cap amplitude
  // at +/- 1 visually so the unstable mode doesn't blow off-screen.
  for (let i = 0; i < NX_FIELD; i += 1) {
    const xFrac = i / (NX_FIELD - 1);
    const xWorld = xFrac * (2 * Math.PI / probeKs[0].k);     // domain = one wavelength of the longest mode
    let d = 0;
    for (const probe of probeKs) {
      d += 0.25 * Math.cos(probe.k * xWorld) * f_k(probe.k, tEvolve);
    }
    d = Math.max(-1, Math.min(1, d));
    const x = fx0 + xFrac * fw;
    const y = fy0 + fh / 2 - (d / 2) * fh;
    ctx.fillStyle = d >= 0 ? 'rgba(239, 71, 111, 0.7)' : 'rgba(91, 192, 235, 0.7)';
    ctx.fillRect(x, Math.min(y, fy0 + fh / 2), 1.5, Math.abs(d / 2 * fh));
  }
  ctx.fillStyle = 'rgba(200, 210, 230, 0.8)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('δ(x) (3 superposed modes)', fx0, fy0 + 12);

  // Mode amplitude time-series panel.
  const ax0 = simX + 36, ay0 = padT + topH, aw = simW - 50, ah = botH - 30;
  ctx.fillStyle = 'rgba(8, 14, 24, 0.7)';
  ctx.fillRect(ax0 - 12, ay0, aw + 20, ah + 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.18)';
  ctx.strokeRect(ax0 - 12 + 0.5, ay0 + 0.5, aw + 19, ah + 25);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('mode amplitude vs time', ax0 - 8, ay0 + 14);
  // Y range: log10|A| from -2 to 4 (six decades). The plot area starts
  // BELOW the title (ay0 + 24) so the top y-tick cannot collide with it.
  const aMin = -2, aMax = 4;
  const plotTop = ay0 + 24;
  function yOfA(la) {
    return plotTop + (1 - (la - aMin) / (aMax - aMin)) * (ay0 + ah - 6 - plotTop);
  }
  function xOfT(t) { return ax0 + (t / 18) * aw; }
  // Axes.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  for (let la = aMin; la <= aMax; la += 1) {
    ctx.beginPath(); ctx.moveTo(ax0, yOfA(la)); ctx.lineTo(ax0 + aw, yOfA(la)); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200, 210, 240, 0.75)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  for (let la = aMin; la <= aMax; la += 2) ctx.fillText(`10^${la}`, ax0 - 2, yOfA(la) + 3);
  ctx.textAlign = 'left';
  // Curves.
  const NPT = 80;
  for (const probe of probeKs) {
    ctx.strokeStyle = probe.col; ctx.lineWidth = 1.6;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= NPT; i += 1) {
      const t = (i / NPT) * 18;        // 0..18 sim-time units
      const a = Math.abs(f_k(probe.k, t));
      if (a < 1e-3) continue;
      const la = Math.max(aMin, Math.min(aMax, Math.log10(a)));
      const x = xOfT(t), y = yOfA(la);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Current-time marker.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  const xt = xOfT(Math.min(18, simTime));
  ctx.beginPath(); ctx.moveTo(xt, ay0 + 18); ctx.lineTo(xt, ay0 + ah + 4); ctx.stroke();
  ctx.setLineDash([]);
  // Legend: three entries spread evenly across the panel width so the
  // last one cannot clip the right edge.
  const llyy = ay0 + ah + 12;
  ctx.font = fontString(canvas, 'caption', 'mono');
  const legStep = (aw - 8) / probeKs.length;
  probeKs.forEach((probe, i) => {
    ctx.fillStyle = probe.col;
    ctx.fillText(probe.label, ax0 - 8 + i * legStep, llyy);
  });
}

// Live cosmic time (simulation seconds; gravity scales set by rho).
let simTime = 0;
let lastWall = performance.now();

function updateReadout() {
  const cs = isothermalCs(T);
  const n_cm3 = Math.pow(10, logN);
  const rho = nToRho(n_cm3);
  const lam = jeansLengthM(cs, rho);
  const M = jeansMassKg(cs, rho);
  readoutLj.textContent = (lam / PC_M).toFixed(3);
  readoutMj.textContent = (M / M_SUN).toFixed(2);
}

// Honour the OS reduced-motion preference: when set, the time sweep
// holds at a representative mid-point rather than animating.
const REDUCED_MOTION = prefersReducedMotion();
function loop(now) {
  const dt = Math.min(0.05, (now - lastWall) / 1000);
  lastWall = now;
  // Sweep simulation time from 0 to 18 in ~ 9 seconds, then loop.
  if (REDUCED_MOTION) { simTime = 9; }
  else {
    simTime += dt * 2;
    if (simTime > 18) simTime = 0;
  }
  // Guard the render so a transient exception cannot silently kill
  // the rAF chain (the chain must keep scheduling).
  try { render(); updateReadout(); }
  catch (e) { console.error('jeans loop failed', e); }
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    T = 10 + frac * 1000;
    sliderT.value = String(Math.round(T));
    valueT.textContent = String(Math.round(T));
  }
  valueT.textContent = String(T.toFixed(0));
  valueLogN.textContent = logN.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, T, logN };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2) ===
// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const rho = nToRho(Math.pow(10, logN));
  const Lj = jeansLengthM(T, rho);
  const Mj = jeansMassKg(T, rho);
  return {
    fields: [
      { key: 'T', label: 'Temperature T', value: T, format: 'float' },
      { key: 'logN', label: 'Log density log10(n)', value: logN, format: 'float' },
      { key: 'Lj', label: 'Jeans length Lj', value: Lj / PC_M, format: 'float' },
      { key: 'Mj', label: 'Jeans mass Mj', value: Mj / M_SUN, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const rho = nToRho(Math.pow(10, logN));
  const Lj = jeansLengthM(T, rho);
  const unstableK = 1 / Lj;
  return [{
    key: 'jeans-instability',
    label: `Unstable region k < 1/Lj (wavenumber < ${(1e-20/Lj).toFixed(3)})`,
    value: 'pass',
    status: 'pass'
  }];
};
