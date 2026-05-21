import { fontString } from '../../../shared/js/canvas-type.js';
// Compton vs inverse-Compton playground. Plot energy axis on log scale
// with the input photon, the forward-Compton-shifted photon, and the
// inverse-Compton up-scattered photon marked.

import {
  comptonForward, icMaxEnergy, icTypicalThomson, isThomsonRegime,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutEmax = document.getElementById('readout-emax');
const readoutReg  = document.getElementById('readout-reg');

const sliderLogE = document.getElementById('slider-logE');
const sliderLogG = document.getElementById('slider-logG');
const valueLogE  = document.getElementById('value-logE');
const valueLogG  = document.getElementById('value-logG');

let logE = parseFloat(sliderLogE.value);
let logG = parseFloat(sliderLogG.value);
sliderLogE.addEventListener('input', () => { logE = parseFloat(sliderLogE.value); valueLogE.textContent = logE.toFixed(2); });
sliderLogG.addEventListener('input', () => { logG = parseFloat(sliderLogG.value); valueLogG.textContent = logG.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 64, padR = 16, padT = 32, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const E = Math.pow(10, logE);
  const gam = Math.pow(10, logG);

  const Edown = comptonForward(E, Math.PI); // backscatter (max down-shift)
  const Eup = icMaxEnergy(gam, E);
  const Etyp = icTypicalThomson(gam, E);

  // Log energy axis from -6 to 14 (covers radio to TeV).
  const eMinLog = -6, eMaxLog = 14;
  function xFor(le) { return padL + plotW * (le - eMinLog) / (eMaxLog - eMinLog); }

  // Spectrum bands (radio, optical, X-ray, gamma).
  const bands = [
    { from: -6, to: -3, label: 'radio',   color: 'rgba(167, 139, 250, 0.06)' },
    { from: -1, to: 1,  label: 'optical', color: 'rgba(91, 192, 235, 0.06)' },
    { from: 2,  to: 5,  label: 'X-ray',   color: 'rgba(244, 162, 97, 0.08)' },
    { from: 5,  to: 14, label: 'gamma',   color: 'rgba(239, 71, 111, 0.08)' },
  ];
  for (const b of bands) {
    ctx.fillStyle = b.color;
    ctx.fillRect(xFor(b.from), padT, xFor(b.to) - xFor(b.from), plotH);
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(b.label, xFor(0.5 * (b.from + b.to)) - 20, padT + 14);
  }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let le = eMinLog; le <= eMaxLog; le += 2) {
    const x = xFor(le);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`1e${le}`, x - 14, padT + plotH + 14);
  }
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('photon energy (eV, log)', padL + plotW - 140, padT + plotH + 28);

  // Track lines.
  function marker(x, y, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(label, x + 8, y - 6);
  }
  const yIn = padT + plotH * 0.7;
  const yDown = padT + plotH * 0.5;
  const yUp = padT + plotH * 0.3;
  marker(xFor(logE), yIn, c.blue, `E_in = ${E.toExponential(2)} eV`);
  if (Edown > 0) marker(xFor(Math.log10(Edown)), yDown, c.orange, `Compton backscatter`);
  if (Eup > 0)   marker(xFor(Math.log10(Eup)), yUp, c.accent, `IC max (gamma=${gam.toExponential(1)})`);

  // Connectors.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xFor(logE), yIn); ctx.lineTo(xFor(Math.log10(Edown)), yDown); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xFor(logE), yIn); ctx.lineTo(xFor(Math.log10(Eup)), yUp); ctx.stroke();
}

function updateReadout() {
  const E = Math.pow(10, logE);
  const gam = Math.pow(10, logG);
  readoutEmax.textContent = icMaxEnergy(gam, E).toExponential(2);
  readoutReg.textContent = isThomsonRegime(gam, E) ? 'yes' : 'Klein-Nishina';
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logG = 1 + frac * 7;
    sliderLogG.value = String(logG);
    valueLogG.textContent = logG.toFixed(2);
  }
  valueLogE.textContent = logE.toFixed(2);
  valueLogG.textContent = logG.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logE, logG };
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
