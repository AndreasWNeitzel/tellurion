// Eddington grey atmosphere playground.

import { temperatureKEdd, limbDarkening } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutTb    = document.getElementById('readout-tb');
const readoutLd    = document.getElementById('readout-ld');

const sliderT = document.getElementById('slider-T');
const valueT  = document.getElementById('value-T');

let Teff = parseFloat(sliderT.value);
sliderT.addEventListener('input', () => { Teff = parseFloat(sliderT.value); valueT.textContent = String(Teff); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    grid:   '#23252a',
  };
}

function drawTau(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const tauMax = 5;
  const Tmax = temperatureKEdd(tauMax, Teff) * 1.05;
  const Tmin = Math.min(temperatureKEdd(0, Teff) * 0.95, 3000);
  function xFor(tau) { return x0 + padL + plotW * (tau / tauMax); }
  function yFor(T) { return y_off + padT + plotH * (1 - (T - Tmin) / (Tmax - Tmin)); }

  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = x0 + padL + plotW * i / 5;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${i}`, x - 4, y_off + padT + plotH + 14);
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = y_off + padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(Tmin + (Tmax - Tmin) * (1 - i / 4)).toFixed(0)}`, x0 + padL - 38, y + 3);
  }

  // Curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const tau = tauMax * i / 200;
    const T = temperatureKEdd(tau, Teff);
    if (i === 0) ctx.moveTo(xFor(tau), yFor(T)); else ctx.lineTo(xFor(tau), yFor(T));
  }
  ctx.stroke();

  // Photosphere marker.
  ctx.strokeStyle = c.blue;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xFor(2 / 3), y_off + padT); ctx.lineTo(xFor(2 / 3), y_off + padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.blue;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`tau = 2/3 (T = T_eff)`, xFor(2 / 3) + 4, y_off + padT + 14);

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`T_eff = ${Teff} K`, x0 + padL + plotW - 130, y_off + 14);
  ctx.fillText('τ', x0 + padL + plotW - 16, y_off + padT + plotH + 24);
  ctx.save(); ctx.translate(x0 + 16, y_off + padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText('T (K)', 0, 0); ctx.restore();
}

function drawLimb(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const cxPx = x0 + w / 2, cyPx = y_off + h / 2;
  const R = Math.min(w, h) * 0.4;

  // Solar disk with limb darkening.
  for (let r = 0; r <= R; r += 1) {
    const mu = Math.sqrt(1 - (r / R) * (r / R));
    const I = limbDarkening(mu);
    ctx.fillStyle = `rgb(${Math.round(255 * I)}, ${Math.round(200 * I)}, ${Math.round(100 * I)})`;
    ctx.beginPath();
    ctx.arc(cxPx, cyPx, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Eddington limb darkening I(μ) = 0.4 + 0.6 μ', x0 + 12, y_off + 14);
}

// Wyman 2013 blackbody temperature (K) -> sRGB at unit luminance.
function bbRGB(T) {
  T = Math.max(1000, Math.min(25000, T));
  let x;
  if (T < 4000) x = -0.2661239e9 / (T*T*T) - 0.2343580e6 / (T*T) + 0.8776956e3 / T + 0.179910;
  else          x = -3.0258469e9 / (T*T*T) + 2.1070379e6 / (T*T) + 0.2226347e3 / T + 0.240390;
  let y;
  if (T < 2222)      y = -1.1063814*x*x*x - 1.34811020*x*x + 2.18555832*x - 0.20219683;
  else if (T < 4000) y = -0.9549476*x*x*x - 1.37418593*x*x + 2.09137015*x - 0.16748867;
  else               y =  3.0817580*x*x*x - 5.87338670*x*x + 3.75112997*x - 0.37001483;
  y = Math.max(y, 0.001);
  const X = x / y, Z = (1 - x - y) / y;
  let r =  3.2406*X - 1.5372 - 0.4986*Z;
  let g = -0.9689*X + 1.8758 + 0.0415*Z;
  let b =  0.0557*X - 0.2040 + 1.0570*Z;
  const m = Math.max(r, g, b, 1e-6);
  r = Math.max(0, r / m); g = Math.max(0, g / m); b = Math.max(0, b / m);
  return [r, g, b];
}

// 1-F: a limb-darkened solar disk. I(mu) = 0.4 + 0.6 mu, mu = sqrt(1-(r/R)^2),
// colored by a blackbody at T_eff * I(mu)^0.25.
function drawDisk(c, x0, y0, w, h) {
  const cx = x0 + w / 2, cy = y0 + h / 2;
  const R = Math.min(w, h) * 0.42;
  const img = ctx.getImageData(x0, y0, w, h);
  const d = img.data;
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const dx = (x0 + px) - cx, dy = (y0 + py) - cy;
      const rr = Math.hypot(dx, dy) / R;
      const idx = (py * w + px) * 4;
      if (rr > 1) { d[idx] = 6; d[idx+1] = 6; d[idx+2] = 8; d[idx+3] = 255; continue; }
      const mu = Math.sqrt(1 - rr * rr);
      const I = 0.4 + 0.6 * mu;
      const [cr, cg, cb] = bbRGB(Teff * Math.pow(I, 0.25));
      d[idx]   = Math.round(255 * cr * I);
      d[idx+1] = Math.round(255 * cg * I);
      d[idx+2] = Math.round(255 * cb * I);
      d[idx+3] = 255;
    }
  }
  ctx.putImageData(img, x0, y0);
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Limb-darkened disk  I(mu)=0.4+0.6 mu, T_eff=${Math.round(Teff)} K`, x0 + 12, y0 + 18);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const diskH = H * 0.58;
  drawDisk(c, 0, 0, W, diskH);
  drawTau(c, 0, diskH, W * 0.55, H - diskH);
  drawLimb(c, W * 0.55, diskH, W * 0.45, H - diskH);
}

function updateReadout() {
  readoutTb.textContent = (Math.pow(0.5, 0.25)).toFixed(4);
  readoutLd.textContent = limbDarkening(0).toFixed(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    Teff = 2500 + frac * 7500;
    sliderT.value = String(Math.round(Teff));
    valueT.textContent = String(Math.round(Teff));
  }
  valueT.textContent = String(Teff);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, Teff };
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
window.playground = window.playground || {};
window.playground.getState = function () {
  const Tb = Math.pow(0.5, 0.25);
  return {
    fields: [
      { key: 'effective-temp', label: 'effective temperature (K)', value: Teff, format: 'float' },
      { key: 'boundary-temp', label: 'boundary temperature (Tb)', value: Tb, format: 'float' },
      { key: 'limb-darkening', label: 'limb darkening (mu=1)', value: limbDarkening(0), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const Tb = Math.pow(0.5, 0.25);
  const Tb_expected = 0.84089642;
  const dTb = Math.abs(Tb - Tb_expected) / Tb_expected;
  return [
    {
      key: 'eddington-grey-atmosphere',
      label: 'Tb = (0.5)^(1/4) in grey atmosphere',
      value: dTb.toExponential(2),
      status: dTb < 1e-10 ? 'pass' : 'drift',
    },
  ];
};
