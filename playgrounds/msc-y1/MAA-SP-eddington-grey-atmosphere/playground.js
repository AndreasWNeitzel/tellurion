// Eddington grey atmosphere playground.

import { temperatureKEdd, limbDarkening } from './sim.js';

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
    ctx.font = '10px ui-monospace, monospace';
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
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`tau = 2/3 (T = T_eff)`, xFor(2 / 3) + 4, y_off + padT + 14);

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T_eff = ${Teff} K`, x0 + padL + plotW - 130, y_off + 14);
  ctx.fillText('tau', x0 + padL + plotW - 16, y_off + padT + plotH + 24);
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
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('Eddington limb darkening I(mu) = 0.4 + 0.6 mu', x0 + 12, y_off + 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawTau(c, 0, 0, W * 0.55, H);
  drawLimb(c, W * 0.55, 0, W * 0.45, H);
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
