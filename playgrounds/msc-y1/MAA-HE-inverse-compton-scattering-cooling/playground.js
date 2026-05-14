// Inverse-Compton cooling playground. t_cool vs gamma on log-log axes.

import { tCoolYears, uPhotonThermalJM3 } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutU    = document.getElementById('readout-u');
const readoutT    = document.getElementById('readout-t');

const sliderT = document.getElementById('slider-T');
const valueT  = document.getElementById('value-T');

let logT = parseFloat(sliderT.value);
sliderT.addEventListener('input', () => { logT = parseFloat(sliderT.value); valueT.textContent = logT.toFixed(3); });

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

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 64, padR = 16, padT = 30, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const gMinLog = 0, gMaxLog = 9;
  const tMinLog = -3, tMaxLog = 18;

  const T = Math.pow(10, logT);
  const U = uPhotonThermalJM3(T);

  function xFor(lg) { return padL + plotW * (lg - gMinLog) / (gMaxLog - gMinLog); }
  function yFor(lt) { return padT + plotH * (1 - (lt - tMinLog) / (tMaxLog - tMinLog)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let lg = gMinLog; lg <= gMaxLog; lg += 3) {
    const x = xFor(lg);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`1e${lg}`, x - 14, padT + plotH + 14);
  }
  for (let lt = tMinLog; lt <= tMaxLog; lt += 3) {
    const y = yFor(lt);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`1e${lt}`, padL - 32, y + 3);
  }

  // Hubble time reference (14 Gyr ~ 1.4e10 yr).
  const yH = yFor(Math.log10(1.4e10));
  ctx.strokeStyle = c.red;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, yH); ctx.lineTo(padL + plotW, yH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.red;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Hubble time', padL + plotW - 90, yH - 4);

  // t(gamma) curve.
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const lg = gMinLog + (gMaxLog - gMinLog) * i / 200;
    const gamma = Math.pow(10, lg);
    const t = tCoolYears(gamma, U);
    const lt = Math.log10(t);
    if (lt < tMinLog || lt > tMaxLog) continue;
    if (i === 0) ctx.moveTo(xFor(lg), yFor(lt)); else ctx.lineTo(xFor(lg), yFor(lt));
  }
  ctx.stroke();

  // Reference: vertical line at gamma = 1e4.
  const gRef = 4;
  const xRef = xFor(gRef);
  ctx.strokeStyle = c.blue;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xRef, padT); ctx.lineTo(xRef, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.blue;
  ctx.fillText(`gamma = 1e4`, xRef + 4, padT + 14);

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('Lorentz factor gamma (log)', padL + plotW - 200, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 30); ctx.rotate(-Math.PI / 2);
  ctx.fillText('t_cool (years, log)', 0, 0); ctx.restore();

  ctx.fillStyle = c.accent;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T = ${T.toFixed(2)} K, U_ph = ${U.toExponential(2)} J/m^3`, padL + 12, padT + 14);
}

function updateReadout() {
  const T = Math.pow(10, logT);
  const U = uPhotonThermalJM3(T);
  readoutU.textContent = U.toExponential(3);
  readoutT.textContent = tCoolYears(1e4, U).toExponential(3);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logT = 0 + frac * 5;
    sliderT.value = String(logT);
    valueT.textContent = logT.toFixed(3);
  }
  valueT.textContent = logT.toFixed(3);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logT };
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
