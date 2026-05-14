// SEMF playground. Binding per nucleon vs A along the valley of stability,
// with term-by-term decomposition.

import {
  bindingPerNucleon, bindingEnergyMeV, optimalZ, pairing, COEFFS,
  bindingProfile,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutBa   = document.getElementById('readout-ba');
const readoutPeak = document.getElementById('readout-peak');

const sliderA = document.getElementById('slider-A');
const valueA  = document.getElementById('value-A');

let A = parseInt(sliderA.value, 10);
sliderA.addEventListener('input', () => { A = parseInt(sliderA.value, 10); valueA.textContent = String(A); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    green:  '#06d6a0',
    orange: '#f4a261',
    grid:   '#23252a',
  };
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 56, padR = 12, padT = 22, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const aMin = 1, aMax = 250;
  function xFor(a) { return padL + plotW * (a - aMin) / (aMax - aMin); }

  const yMin = 0, yMax = 10; // MeV per nucleon
  function yFor(b) { return padT + plotH * (1 - (b - yMin) / (yMax - yMin)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = padL + plotW * i / 5;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${50 * i}`, x - 6, padT + plotH + 14);
  }
  for (let i = 0; i <= 5; i += 1) {
    const y = padT + plotH * i / 5;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(2 * (5 - i))}`, padL - 22, y + 3);
  }

  // Plot binding profile.
  const profile = bindingProfile();
  let maxA = 0, maxB = 0;
  for (const p of profile) if (p.BperA > maxB) { maxB = p.BperA; maxA = p.A; }

  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (const p of profile) {
    if (p.BperA < yMin) continue;
    const xx = xFor(p.A);
    const yy = yFor(Math.min(p.BperA, yMax));
    if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Mark peak.
  const xp = xFor(maxA);
  const yp = yFor(maxB);
  ctx.fillStyle = c.green;
  ctx.beginPath(); ctx.arc(xp, yp, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = c.green;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`peak A = ${maxA}, B/A = ${maxB.toFixed(2)} MeV`, xp + 8, yp - 6);

  // Mark current A.
  const Zs = Math.round(optimalZ(A));
  const Bcurr = bindingPerNucleon(A, Zs);
  const xc = xFor(A);
  const yc = yFor(Math.min(Bcurr, yMax));
  ctx.strokeStyle = c.blue;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(xc, padT); ctx.lineTo(xc, padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.blue;
  ctx.beginPath(); ctx.arc(xc, yc, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = c.blue;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`A = ${A}, Z* = ${Zs}, B/A = ${Bcurr.toFixed(2)}`, xc + 8, yc + 14);

  // Term decomposition at the current A.
  const N = A - Zs;
  const volume    =  COEFFS.aV;
  const surface   = -COEFFS.aS / Math.pow(A, 1 / 3);
  const coulomb   = -COEFFS.aC * Zs * (Zs - 1) / Math.pow(A, 4 / 3);
  const asymmetry = -COEFFS.aA * (N - Zs) * (N - Zs) / (A * A);
  const pair      =  pairing(A, Zs) / A;

  ctx.fillStyle = c.muted;
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`B/A breakdown at A = ${A}:`, padL + plotW - 240, padT + 14);
  let ly = padT + 28;
  for (const [label, val, col] of [
    ['volume   ', volume,    c.accent],
    ['surface  ', surface,   c.red],
    ['coulomb  ', coulomb,   c.orange],
    ['asymmetry', asymmetry, c.blue],
    ['pairing  ', pair,      c.green],
    ['sum      ', volume + surface + coulomb + asymmetry + pair, c.fg],
  ]) {
    ctx.fillStyle = col;
    ctx.fillText(`${label} ${val >= 0 ? '+' : ''}${val.toFixed(3)}`, padL + plotW - 240, ly);
    ly += 14;
  }

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('A (mass number)', padL + plotW - 100, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText('B/A (MeV)', 0, 0); ctx.restore();
}

function updateReadout() {
  const Zs = Math.round(optimalZ(A));
  const Bcurr = bindingPerNucleon(A, Zs);
  readoutBa.textContent = Bcurr.toFixed(3);
  const profile = bindingProfile();
  let maxA = 0, maxB = 0;
  for (const p of profile) if (p.BperA > maxB) { maxB = p.BperA; maxA = p.A; }
  readoutPeak.textContent = `${maxA}, ${maxB.toFixed(2)}`;
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    A = Math.round(4 + frac * 230);
    sliderA.value = String(A);
    valueA.textContent = String(A);
  }
  valueA.textContent = String(A);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, A };
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
