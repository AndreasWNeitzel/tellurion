// Habitable-zone playground. Star at center; HZ as a green annulus;
// reference planet marker at user-set distance.

import {
  stellarLuminosity, habitableInnerAu, habitableOuterAu, inHabitableZone,
  asSEff, fluxAt,
  R_SUN, AU, L_SUN,
} from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutL    = document.getElementById('readout-l');
const readoutHz   = document.getElementById('readout-hz');

const sliderT = document.getElementById('slider-T');
const sliderR = document.getElementById('slider-R');
const sliderD = document.getElementById('slider-d');
const valueT  = document.getElementById('value-T');
const valueR  = document.getElementById('value-R');
const valueD  = document.getElementById('value-d');

let T = parseFloat(sliderT.value);
let Rs = parseFloat(sliderR.value);
let dAu = parseFloat(sliderD.value);

sliderT.addEventListener('input', () => { T = parseFloat(sliderT.value); valueT.textContent = String(T); });
sliderR.addEventListener('input', () => { Rs = parseFloat(sliderR.value); valueR.textContent = Rs.toFixed(2); });
sliderD.addEventListener('input', () => { dAu = parseFloat(sliderD.value); valueD.textContent = dAu.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    green:  '#06d6a0',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function tempToColor(T) {
  // Crude Wien-like: red below 4000, white around 6000, blue above 9000.
  if (T < 4000) return '#ef476f';
  if (T < 5000) return '#f4a261';
  if (T < 6500) return '#ffd166';
  if (T < 8000) return '#e8e8e8';
  return '#5bc0eb';
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2, cy = canvas.height / 2;

  const L = stellarLuminosity(Rs * R_SUN, T);
  const inner = habitableInnerAu(L);
  const outer = habitableOuterAu(L);

  // Plot scale: pick max AU based on outer HZ * 1.5 OR slider max (5 AU), whichever is larger.
  const maxAu = Math.max(5, outer * 1.5);
  const scale = Math.min(canvas.width, canvas.height) * 0.42 / maxAu;

  // Concentric reference circles every 0.5 AU.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let a = 0.5; a <= maxAu; a += 0.5) {
    ctx.beginPath(); ctx.arc(cx, cy, a * scale, 0, 2 * Math.PI); ctx.stroke();
  }

  // Habitable zone band.
  ctx.fillStyle = 'rgba(6, 214, 160, 0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, outer * scale, 0, 2 * Math.PI);
  ctx.arc(cx, cy, inner * scale, 0, 2 * Math.PI, true);
  ctx.fill();
  ctx.strokeStyle = c.green;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, inner * scale, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, outer * scale, 0, 2 * Math.PI); ctx.stroke();

  // Star.
  const Rpx = 6 + Math.min(40, Rs * 10);
  ctx.fillStyle = tempToColor(T);
  ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Reference planet.
  const inHz = inHabitableZone(L, dAu);
  ctx.fillStyle = inHz ? c.green : c.red;
  ctx.beginPath(); ctx.arc(cx + dAu * scale, cy, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`star: T = ${T} K, R = ${Rs.toFixed(2)} R_sun`, 12, 20);
  ctx.fillText(`L = ${(L / L_SUN).toExponential(3)} L_sun`, 12, 38);
  ctx.fillStyle = c.green;
  ctx.fillText(`HZ: ${inner.toFixed(3)} to ${outer.toFixed(3)} AU`, 12, 56);
  ctx.fillStyle = inHz ? c.green : c.red;
  ctx.fillText(`planet at ${dAu.toFixed(2)} AU: ${inHz ? 'habitable' : 'not habitable'}`, 12, 74);

  // Earth marker at 1 AU.
  if (Rs > 0.99 && Rs < 1.01 && Math.abs(T - 5778) < 50) {
    const dEarth = 1.0 * scale;
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.arc(cx + dEarth, cy, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = c.muted;
    ctx.fillText('Earth', cx + dEarth + 6, cy - 6);
  }
}

function updateReadout() {
  const L = stellarLuminosity(Rs * R_SUN, T);
  const inner = habitableInnerAu(L);
  const outer = habitableOuterAu(L);
  readoutL.textContent = (L / L_SUN).toExponential(2);
  readoutHz.textContent = `${inner.toFixed(3)} to ${outer.toFixed(3)}`;
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    T = 2500 + frac * 7500;
    sliderT.value = String(Math.round(T));
    valueT.textContent = String(Math.round(T));
  }
  valueT.textContent = String(T);
  valueR.textContent = Rs.toFixed(2);
  valueD.textContent = dAu.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, T, Rs, dAu };
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
