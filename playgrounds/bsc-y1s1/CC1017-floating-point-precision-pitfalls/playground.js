// Floating-point pitfalls playground. Plots relative error of
// 1 - cos(x) naive vs stable formulations versus x.

import { oneMinusCosNaive, oneMinusCosStable } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutN    = document.getElementById('readout-naive');
const readoutS    = document.getElementById('readout-stable');

const sliderLogX = document.getElementById('slider-logx');
const valueLogX  = document.getElementById('value-logx');

let logX = parseFloat(sliderLogX.value);
sliderLogX.addEventListener('input', () => { logX = parseFloat(sliderLogX.value); valueLogX.textContent = logX.toFixed(2); });

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

function taylor(x) {
  // 1 - cos(x) = x^2/2 - x^4/24 + ... use truncated series for the reference.
  return 0.5 * x * x * (1 - x * x / 12);
}

function relErr(approx, exact) {
  if (exact === 0) return approx === 0 ? 0 : 1;
  return Math.abs(approx - exact) / Math.abs(exact);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 60, padR = 16, padT = 30, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;
  const xMinLog = -16, xMaxLog = 0;
  const yMinLog = -18, yMaxLog = 1;

  function xFor(lX) { return padL + plotW * (lX - xMinLog) / (xMaxLog - xMinLog); }
  function yFor(lY) { return padT + plotH * (1 - (lY - yMinLog) / (yMaxLog - yMinLog)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let lX = xMinLog; lX <= xMaxLog; lX += 2) {
    const x = xFor(lX);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`1e${lX}`, x - 14, padT + plotH + 14);
  }
  for (let lY = yMinLog; lY <= yMaxLog; lY += 3) {
    const y = yFor(lY);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`1e${lY}`, padL - 32, y + 3);
  }

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('x', padL + plotW - 12, padT + plotH + 28);
  ctx.save(); ctx.translate(20, padT + plotH / 2 + 40); ctx.rotate(-Math.PI / 2);
  ctx.fillText('|err| / |exact|', 0, 0); ctx.restore();

  // Reference horizontal line at machine epsilon ~ 1e-16.
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  const yEps = yFor(-16);
  ctx.beginPath(); ctx.moveTo(padL, yEps); ctx.lineTo(padL + plotW, yEps); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.muted;
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('machine eps', padL + plotW - 78, yEps - 4);

  // Sample curves.
  const N = 400;
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const lX = xMinLog + (xMaxLog - xMinLog) * i / N;
    const x = Math.pow(10, lX);
    const ex = taylor(x);
    const naive = oneMinusCosNaive(x);
    const err = relErr(naive, ex);
    const lY = err > 0 ? Math.log10(err) : yMinLog;
    const yy = yFor(Math.max(yMinLog, Math.min(yMaxLog, lY)));
    if (i === 0) ctx.moveTo(xFor(lX), yy); else ctx.lineTo(xFor(lX), yy);
  }
  ctx.stroke();

  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const lX = xMinLog + (xMaxLog - xMinLog) * i / N;
    const x = Math.pow(10, lX);
    const ex = taylor(x);
    const stable = oneMinusCosStable(x);
    const err = relErr(stable, ex);
    const lY = err > 0 ? Math.log10(err) : yMinLog;
    const yy = yFor(Math.max(yMinLog, Math.min(yMaxLog, lY)));
    if (i === 0) ctx.moveTo(xFor(lX), yy); else ctx.lineTo(xFor(lX), yy);
  }
  ctx.stroke();

  // Current x marker.
  ctx.strokeStyle = c.accent;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  const xNow = xFor(logX);
  ctx.beginPath(); ctx.moveTo(xNow, padT); ctx.lineTo(xNow, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);

  // Legend.
  ctx.fillStyle = c.orange; ctx.fillRect(padL + 8, padT + 8, 12, 3);
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('naive: 1 - cos(x)', padL + 24, padT + 12);
  ctx.fillStyle = c.blue; ctx.fillRect(padL + 8, padT + 24, 12, 3);
  ctx.fillStyle = c.muted;
  ctx.fillText('stable: 2 sin^2(x/2)', padL + 24, padT + 28);
}

function updateReadout() {
  const x = Math.pow(10, logX);
  const ex = taylor(x);
  const en = relErr(oneMinusCosNaive(x), ex);
  const es = relErr(oneMinusCosStable(x), ex);
  readoutN.textContent = en.toExponential(2);
  readoutS.textContent = es.toExponential(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logX = -16 + 16 * frac;
    sliderLogX.value = String(logX.toFixed(2));
    valueLogX.textContent = logX.toFixed(2);
  }
  valueLogX.textContent = logX.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logX };
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
