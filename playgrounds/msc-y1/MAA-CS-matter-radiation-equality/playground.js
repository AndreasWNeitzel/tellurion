// Matter-radiation equality playground. Log-log plot of rho_m, rho_r,
// rho_lambda vs a.

import {
  rhoMatter, rhoRadiation, rhoLambda,
  aEq, zEq,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutZeq   = document.getElementById('readout-zeq');
const readoutAeq   = document.getElementById('readout-aeq');

const sliderOm = document.getElementById('slider-om');
const sliderOr = document.getElementById('slider-or');
const valueOm  = document.getElementById('value-om');
const valueOr  = document.getElementById('value-or');

let Om = parseFloat(sliderOm.value);
let Or = parseFloat(sliderOr.value);

sliderOm.addEventListener('input', () => { Om = parseFloat(sliderOm.value); valueOm.textContent = Om.toFixed(3); });
sliderOr.addEventListener('input', () => { Or = parseFloat(sliderOr.value); valueOr.textContent = Or.toExponential(2); });

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

  const padL = 64, padR = 16, padT = 26, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const aMinLog = -8, aMaxLog = 2;
  const rMinLog = -8, rMaxLog = 30;

  function xFor(la) { return padL + plotW * (la - aMinLog) / (aMaxLog - aMinLog); }
  function yFor(lr) { return padT + plotH * (1 - (lr - rMinLog) / (rMaxLog - rMinLog)); }

  const OL = Math.max(0, 1 - Om - Or);

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let la = aMinLog; la <= aMaxLog; la += 2) {
    const x = xFor(la);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`1e${la}`, x - 14, padT + plotH + 14);
  }
  for (let lr = rMinLog; lr <= rMaxLog; lr += 6) {
    const y = yFor(lr);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`1e${lr}`, padL - 32, y + 3);
  }

  // Curves.
  function drawCurve(color, f) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 200; i += 1) {
      const la = aMinLog + (aMaxLog - aMinLog) * i / 200;
      const a = Math.pow(10, la);
      const r = f(a);
      const lr = Math.log10(r);
      if (lr < rMinLog || lr > rMaxLog) { started = false; continue; }
      const xx = xFor(la);
      const yy = yFor(lr);
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  drawCurve(c.blue,   (a) => rhoRadiation(a, Or));
  drawCurve(c.accent, (a) => rhoMatter(a, Om));
  drawCurve(c.orange, (a) => rhoLambda(OL));

  // a_eq vertical line.
  const aeq = aEq(Om, Or);
  if (aeq > 0 && Math.log10(aeq) > aMinLog && Math.log10(aeq) < aMaxLog) {
    const xeq = xFor(Math.log10(aeq));
    ctx.strokeStyle = c.red;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xeq, padT); ctx.lineTo(xeq, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.red;
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('a_eq', xeq + 4, padT + 14);
  }
  // a = 1 (today) line.
  const xnow = xFor(0);
  ctx.strokeStyle = c.fg;
  ctx.setLineDash([2, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xnow, padT); ctx.lineTo(xnow, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.fg;
  ctx.fillText('today', xnow + 4, padT + 28);

  // Legend.
  ctx.fillStyle = c.blue;   ctx.fillRect(padL + 8, padT + 8, 12, 3);
  ctx.fillStyle = c.muted;  ctx.fillText('radiation (a^-4)', padL + 24, padT + 12);
  ctx.fillStyle = c.accent; ctx.fillRect(padL + 8, padT + 24, 12, 3);
  ctx.fillStyle = c.muted;  ctx.fillText('matter (a^-3)', padL + 24, padT + 28);
  ctx.fillStyle = c.orange; ctx.fillRect(padL + 8, padT + 40, 12, 3);
  ctx.fillStyle = c.muted;  ctx.fillText('Lambda (const)', padL + 24, padT + 44);

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('a (scale factor)', padL + plotW - 100, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText('rho / rho_crit (today)', 0, 0); ctx.restore();
}

function updateReadout() {
  readoutZeq.textContent = zEq(Om, Or).toFixed(0);
  readoutAeq.textContent = aEq(Om, Or).toExponential(3);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    Om = 0.1 + frac * 0.5;
    sliderOm.value = String(Om);
    valueOm.textContent = Om.toFixed(3);
  }
  valueOm.textContent = Om.toFixed(3);
  valueOr.textContent = Or.toExponential(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, Om, Or };
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
