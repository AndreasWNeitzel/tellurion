// de Broglie wavelength playground.
// Log-log plot of lambda vs kinetic energy for all five particle species.
// Highlighted species in bold; current T marked by a vertical dashed line.

import { PARTICLES, deBroglieNm } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutLam  = document.getElementById('readout-lam');
const readoutRel  = document.getElementById('readout-rel');

const selectSpecies = document.getElementById('select-species');
const sliderLogT    = document.getElementById('slider-logT');
const valueSpecies  = document.getElementById('value-species');
const valueLogT     = document.getElementById('value-logT');

let species = selectSpecies.value;
let logT    = parseFloat(sliderLogT.value);

selectSpecies.addEventListener('change', () => {
  species = selectSpecies.value;
  valueSpecies.textContent = species;
});
sliderLogT.addEventListener('input', () => {
  logT = parseFloat(sliderLogT.value);
  valueLogT.textContent = logT.toFixed(2);
});

function currentParticle() {
  return PARTICLES.find(p => p.name === species) || PARTICLES[1];
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    grid:   '#23252a',
  };
}

const TMIN_LOG = -3;
const TMAX_LOG = 12;
const LMIN_LOG = -8; // 1e-8 nm = 0.01 fm
const LMAX_LOG = 4;  // 1e4 nm = 10 um

function drawPlot(c, x0, y0, w, h) {
  const padL = 56, padR = 12, padT = 30, padB = 38;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y0, w, h);

  function xFor(logE) { return x0 + padL + plotW * (logE - TMIN_LOG) / (TMAX_LOG - TMIN_LOG); }
  function yFor(logL) { return y0 + padT + plotH * (1 - (logL - LMIN_LOG) / (LMAX_LOG - LMIN_LOG)); }

  // Major grid lines per decade.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let lT = TMIN_LOG; lT <= TMAX_LOG; lT += 3) {
    const x = xFor(lT);
    ctx.beginPath(); ctx.moveTo(x, y0 + padT); ctx.lineTo(x, y0 + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`1e${lT}`, x - 14, y0 + padT + plotH + 14);
  }
  for (let lL = LMIN_LOG; lL <= LMAX_LOG; lL += 3) {
    const y = yFor(lL);
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`1e${lL}`, x0 + padL - 36, y + 3);
  }

  // Axis labels.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('T (eV)', x0 + padL + plotW - 40, y0 + padT + plotH + 30);
  ctx.save();
  ctx.translate(x0 + 12, y0 + padT + plotH / 2 + 36);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('lambda (nm)', 0, 0);
  ctx.restore();

  // Reference horizontal lines: atomic spacing (0.1 nm) and nuclear scale (1 fm = 1e-6 nm).
  for (const ref of [{ logL: -1, label: 'atomic (0.1 nm)' }, { logL: -6, label: 'nuclear (1 fm)' }]) {
    const y = yFor(ref.logL);
    ctx.strokeStyle = c.muted;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(ref.label, x0 + padL + plotW - 110, y - 4);
  }

  // Plot every particle curve.
  const N = 200;
  for (const p of PARTICLES) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = (p.name === species) ? 2.5 : 1.2;
    ctx.globalAlpha = (p.name === species) ? 1.0 : 0.5;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= N; i += 1) {
      const lT = TMIN_LOG + (TMAX_LOG - TMIN_LOG) * i / N;
      const T = Math.pow(10, lT);
      const lam = deBroglieNm(T, p.mEv);
      if (!Number.isFinite(lam) || lam <= 0) continue;
      const lL = Math.log10(lam);
      if (lL < LMIN_LOG || lL > LMAX_LOG) { started = false; continue; }
      const xx = xFor(lT);
      const yy = yFor(lL);
      if (!started) { ctx.moveTo(xx, yy); started = true; }
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Current T vertical marker for highlighted species.
  const part = currentParticle();
  const T = Math.pow(10, logT);
  const lam = deBroglieNm(T, part.mEv);
  if (Number.isFinite(lam) && lam > 0) {
    const xT = xFor(logT);
    const yL = yFor(Math.log10(lam));
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(xT, y0 + padT); ctx.lineTo(xT, y0 + padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = part.color;
    ctx.beginPath(); ctx.arc(xT, yL, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Legend.
  const legendX = x0 + padL + 8;
  let ly = y0 + padT + 12;
  ctx.font = '11px ui-monospace, monospace';
  for (const p of PARTICLES) {
    ctx.fillStyle = p.color;
    ctx.fillRect(legendX, ly - 8, 12, 3);
    ctx.fillStyle = (p.name === species) ? p.color : c.muted;
    ctx.fillText(p.name, legendX + 18, ly);
    ly += 14;
  }
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPlot(c, 0, 0, canvas.width, canvas.height);
}

function updateReadout() {
  const part = currentParticle();
  const T = Math.pow(10, logT);
  const lam = deBroglieNm(T, part.mEv);
  readoutLam.textContent = Number.isFinite(lam) ? lam.toExponential(3) : '--';
  if (part.mEv === 0) readoutRel.textContent = 'photon';
  else readoutRel.textContent = (T / part.mEv).toExponential(2);
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const particles = ['photon', 'electron', 'proton', 'neutron', 'C-12'];
    const idx = Math.min(particles.length - 1, Math.floor(frac * particles.length));
    species = particles[idx];
    selectSpecies.value = species;
    valueSpecies.textContent = species;
    logT = -3 + 15 * frac;
    sliderLogT.value = String(logT);
    valueLogT.textContent = logT.toFixed(2);
  }
  valueSpecies.textContent = species;
  valueLogT.textContent = logT.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null };
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
