// Friedmann cosmography playground. E(z) and age curves vs redshift.

import { E, ageGyr, comovingDistanceMpc, hubbleTimeGyr } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutT0   = document.getElementById('readout-t0');
const readoutDc   = document.getElementById('readout-dc');

const sliderOm = document.getElementById('slider-om');
const sliderH0 = document.getElementById('slider-h0');
const valueOm  = document.getElementById('value-om');
const valueH0  = document.getElementById('value-h0');

let Om = parseFloat(sliderOm.value);
let H0 = parseFloat(sliderH0.value);

sliderOm.addEventListener('input', () => { Om = parseFloat(sliderOm.value); valueOm.textContent = Om.toFixed(3); });
sliderH0.addEventListener('input', () => { H0 = parseFloat(sliderH0.value); valueH0.textContent = H0.toFixed(1); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    grid:   '#23252a',
  };
}

function drawCurve(c, x0, y_off, w, h, fn, title, ymax, ylabel) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);
  const padL = 56, padR = 12, padT = 22, padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const zMin = 0, zMax = 5;
  function xFor(z) { return x0 + padL + plotW * (z / zMax); }
  function yFor(v) { return y_off + padT + plotH * (1 - v / ymax); }

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
    ctx.fillText(`${(ymax * (1 - i / 4)).toFixed(1)}`, x0 + padL - 32, y + 3);
  }

  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const z = zMin + (zMax - zMin) * i / 100;
    const v = fn(z);
    if (!Number.isFinite(v)) continue;
    const xx = xFor(z);
    const yy = yFor(Math.min(v, ymax));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(title, x0 + padL, y_off + 14);
  ctx.fillText('z', x0 + padL + plotW - 12, y_off + padT + plotH + 24);
  ctx.save(); ctx.translate(x0 + 16, y_off + padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText(ylabel, 0, 0); ctx.restore();
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const Ol = 1 - Om;
  const t0 = ageGyr(0, Om, Ol, H0);
  drawCurve(c, 0, 0, canvas.width, canvas.height / 2, (z) => E(z, Om, Ol), 'E(z) = H(z) / H_0', 30, 'E');
  drawCurve(c, 0, canvas.height / 2, canvas.width, canvas.height / 2, (z) => ageGyr(z, Om, Ol, H0), `t(z) Gyr (today t_0 = ${t0.toFixed(2)})`, t0 * 1.1, 't (Gyr)');
}

function updateReadout() {
  const Ol = 1 - Om;
  readoutT0.textContent = ageGyr(0, Om, Ol, H0).toFixed(2);
  readoutDc.textContent = comovingDistanceMpc(1.0, Om, Ol, H0).toFixed(0);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    Om = 0.05 + frac * 0.9;
    sliderOm.value = String(Om);
    valueOm.textContent = Om.toFixed(3);
  }
  valueOm.textContent = Om.toFixed(3);
  valueH0.textContent = H0.toFixed(1);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, Om, H0 };
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
