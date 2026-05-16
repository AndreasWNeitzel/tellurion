// RC discharge playground. Left half: simple circuit diagram. Right half:
// V(t) and I(t) curves with the current-time dashed marker.

import { vC, iR } from './sim.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutV    = document.getElementById('readout-v');
const readoutI    = document.getElementById('readout-i');

const sliderV0 = document.getElementById('slider-v0');
const sliderR  = document.getElementById('slider-R');
const sliderC  = document.getElementById('slider-C');
const valueV0  = document.getElementById('value-v0');
const valueR   = document.getElementById('value-R');
const valueC   = document.getElementById('value-C');
const btnReset = document.getElementById('btn-reset');
const btnPlay  = document.getElementById('btn-playpause');

let V0 = parseFloat(sliderV0.value);
let R  = parseFloat(sliderR.value) * 1e3;  // kOhm -> Ohm
let C  = parseFloat(sliderC.value) * 1e-6; // uF -> F

let t = 0;
let running = true;
let lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

sliderV0.addEventListener('input', () => { V0 = parseFloat(sliderV0.value); valueV0.textContent = V0.toFixed(1); t = 0; });
sliderR.addEventListener('input', () => { R = parseFloat(sliderR.value) * 1e3; valueR.textContent = parseFloat(sliderR.value).toFixed(1); t = 0; });
sliderC.addEventListener('input', () => { C = parseFloat(sliderC.value) * 1e-6; valueC.textContent = parseFloat(sliderC.value).toFixed(1); t = 0; });
btnReset.addEventListener('click', () => { t = 0; });
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

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

function drawCircuit(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const cx = x0 + w * 0.5, cy = y_off + h * 0.5;
  const size = Math.min(w, h) * 0.35;

  // Wire loop (rectangle).
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(cx - size, cy - size * 0.6, 2 * size, size * 1.2);
  ctx.stroke();

  // Capacitor plates (left edge).
  const tau = R * C;
  const V = vC(t, V0, tau);
  const frac = V0 > 0 ? V / V0 : 0;
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - size - 5, cy - 18);
  ctx.lineTo(cx - size - 5, cy + 18);
  ctx.moveTo(cx - size + 5, cy - 18);
  ctx.lineTo(cx - size + 5, cy + 18);
  ctx.stroke();
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('C', cx - size - 22, cy + 4);

  // Charge cloud (size scales with V).
  ctx.fillStyle = c.orange;
  ctx.globalAlpha = 0.4 + 0.6 * frac;
  ctx.beginPath();
  ctx.arc(cx - size, cy, 8 + 16 * frac, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Resistor (zigzag on the right edge).
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const rx = cx + size;
  ctx.moveTo(rx, cy - 18);
  for (let i = 0; i < 6; i += 1) {
    const dy = -12 + i * 6;
    ctx.lineTo(rx + (i % 2 === 0 ? -6 : 6), cy - 18 + (i + 1) * 6);
  }
  ctx.lineTo(rx, cy + 18);
  ctx.stroke();
  ctx.fillStyle = c.muted;
  ctx.fillText('R', cx + size + 14, cy + 4);

  // Labels.
  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`V_0 = ${V0.toFixed(1)} V`, x0 + 14, y_off + 20);
  ctx.fillText(`R   = ${(R / 1e3).toFixed(1)} kOhm`, x0 + 14, y_off + 38);
  ctx.fillText(`C   = ${(C / 1e-6).toFixed(1)} uF`, x0 + 14, y_off + 56);
  ctx.fillText(`tau = ${(tau).toFixed(3)} s`, x0 + 14, y_off + 74);
  ctx.fillStyle = c.orange;
  ctx.fillText(`V = ${V.toFixed(3)} V`, x0 + 14, y_off + h - 14);
}

function drawPlot(c, x0, y_off, w, h) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(x0, y_off, w, h);

  const padL = 56, padR = 12, padT = 28, padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const tau = R * C;
  const tMax = 6 * tau;
  function xFor(tt) { return x0 + padL + plotW * (tt / tMax); }
  function yFor(v) { return y_off + padT + plotH * (1 - v / V0); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = x0 + padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, y_off + padT); ctx.lineTo(x, y_off + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`${i}tau`, x - 8, y_off + padT + plotH + 14);
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = y_off + padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(x0 + padL, y); ctx.lineTo(x0 + padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(V0 * (1 - i / 4)).toFixed(1)}`, x0 + padL - 32, y + 3);
  }

  // V(t) curve.
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const tt = tMax * i / 200;
    const yy = yFor(vC(tt, V0, tau));
    if (i === 0) ctx.moveTo(xFor(tt), yy); else ctx.lineTo(xFor(tt), yy);
  }
  ctx.stroke();

  // Mark t = tau line.
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xFor(tau), y_off + padT); ctx.lineTo(xFor(tau), y_off + padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.muted;
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('tau', xFor(tau) + 4, y_off + padT + 12);
  ctx.fillText('V0/e', xFor(tau) - 30, yFor(V0 / Math.E) + 3);

  // Current-time marker.
  if (t <= tMax) {
    const xNow = xFor(t);
    const yNow = yFor(vC(t, V0, tau));
    ctx.strokeStyle = c.accent;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xNow, y_off + padT); ctx.lineTo(xNow, y_off + padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.arc(xNow, yNow, 6, 0, 2 * Math.PI); ctx.fill();
  }

  ctx.fillStyle = c.muted;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('t', x0 + padL + plotW - 12, y_off + padT + plotH + 28);
  ctx.save(); ctx.translate(x0 + 16, y_off + padT + plotH / 2 + 20); ctx.rotate(-Math.PI / 2);
  ctx.fillText('V (volts)', 0, 0); ctx.restore();
  ctx.fillStyle = c.orange;
  ctx.fillText('V(t) = V_0 exp(-t/tau)', x0 + padL + 12, y_off + 18);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  drawCircuit(c, 0, 0, W * 0.42, H);
  drawPlot(c, W * 0.42, 0, W * 0.58, H);
}

function updateReadout() {
  const tau = R * C;
  const V = vC(t, V0, tau);
  const I = iR(t, V0, R, tau);
  readoutV.textContent = V.toFixed(3);
  readoutI.textContent = (I * 1e3).toFixed(3);
}

let holdUntil = 0;   // 2-B: 1 s pause at full discharge before auto-replay.
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  const tau = R * C;
  if (running) {
    if (holdUntil > 0) {
      if (now >= holdUntil) { holdUntil = 0; t = 0; }
    } else {
      // Fixed wall-clock duration for the full 0..7 tau sweep so the
      // discharge is followable for any R, C (was real-time, which flew
      // by whenever tau was small).
      const SWEEP_SECONDS = 9;
      t += dt * (7 * tau / SWEEP_SECONDS);
      if (t > 7 * tau) { t = 7 * tau; holdUntil = now + 1000; }
    }
  }
  render();
  updateReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const tau = R * C;
    t = frac * 6 * tau;
  }
  valueV0.textContent = V0.toFixed(1);
  valueR.textContent  = (R / 1e3).toFixed(1);
  valueC.textContent  = (C / 1e-6).toFixed(1);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, V0, R, C, t };
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
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
