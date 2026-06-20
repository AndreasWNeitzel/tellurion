import { vC, iR } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack, fit } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderV0 = document.getElementById('slider-v0');
const sliderR = document.getElementById('slider-R');
const sliderC = document.getElementById('slider-C');
const valueV0 = document.getElementById('value-v0');
const valueR = document.getElementById('value-R');
const valueC = document.getElementById('value-C');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

let V0 = parseFloat(sliderV0.value);
let R = parseFloat(sliderR.value) * 1e3;  // kOhm -> Ohm
let C = parseFloat(sliderC.value) * 1e-6; // uF -> F

let t = 0;
let running = !prefersReducedMotion();
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

function drawCircuit(c, reg) {
  const s = reg;
  ctx.fillStyle = c.bg;
  ctx.fillRect(s.x, s.y, s.w, s.h);

  const cx = s.x + s.w * 0.5;
  const cy = s.y + s.h * 0.5;
  const size = Math.min(s.w, s.h) * 0.3;

  const tau = R * C;
  const V = vC(t, V0, tau);
  const frac = V0 > 0 ? V / V0 : 0;

  // Wire loop (rectangle).
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(cx - size, cy - size * 0.6, 2 * size, size * 1.2);
  ctx.stroke();

  // Capacitor plates (left edge).
  ctx.strokeStyle = c.orange;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - size - 5, cy - 18);
  ctx.lineTo(cx - size - 5, cy + 18);
  ctx.moveTo(cx - size + 5, cy - 18);
  ctx.lineTo(cx - size + 5, cy + 18);
  ctx.stroke();
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('C', cx - size - 22, cy + 4);

  // Charge cloud: size scales with V.
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
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`V_0 = ${V0.toFixed(1)} V`, s.x + 14, s.y + 20);
  ctx.fillText(`R   = ${(R / 1e3).toFixed(1)} kOhm`, s.x + 14, s.y + 38);
  ctx.fillText(`C   = ${(C / 1e-6).toFixed(1)} uF`, s.x + 14, s.y + 56);
  ctx.fillText(`tau = ${tau.toFixed(3)} s`, s.x + 14, s.y + 74);
  ctx.fillStyle = c.orange;
  ctx.fillText(`V = ${V.toFixed(3)} V`, s.x + 14, s.y + s.h - 14);
}

function drawPlot(c, reg) {
  const p = reg;
  ctx.fillStyle = c.bg;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  const padL = 60, padR = 12, padT = 28, padB = 40;
  const plotW = p.w - padL - padR;
  const plotH = p.h - padT - padB;

  const tau = R * C;
  const tMax = 6 * tau;
  function xFor(tt) { return p.x + padL + plotW * (tt / tMax); }
  function yFor(v) { return p.y + padT + plotH * (1 - v / V0); }
  function yForI(v) { return p.y + padT + plotH * (1 - v / (V0 / R)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = p.x + padL + plotW * i / 6;
    ctx.beginPath(); ctx.moveTo(x, p.y + padT); ctx.lineTo(x, p.y + padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${i}tau`, x - 8, p.y + padT + plotH + 14);
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = p.y + padT + plotH * i / 4;
    ctx.beginPath(); ctx.moveTo(p.x + padL, y); ctx.lineTo(p.x + padL + plotW, y); ctx.stroke();
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

  // I(t) curve.
  ctx.strokeStyle = c.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const tt = tMax * i / 200;
    const yy = yForI(iR(tt, V0, R, tau));
    if (i === 0) ctx.moveTo(xFor(tt), yy); else ctx.lineTo(xFor(tt), yy);
  }
  ctx.stroke();

  // Mark t = tau line.
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xFor(tau), p.y + padT); ctx.lineTo(xFor(tau), p.y + padT + plotH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('tau', xFor(tau) + 4, p.y + padT + 12);

  // Current-time markers.
  if (t <= tMax) {
    const xNow = xFor(t);
    const yNow = yFor(vC(t, V0, tau));
    const yNowI = yForI(iR(t, V0, R, tau));

    ctx.strokeStyle = c.accent;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xNow, p.y + padT); ctx.lineTo(xNow, p.y + padT + plotH); ctx.stroke();
    ctx.setLineDash([]);

    // Voltage marker.
    ctx.fillStyle = c.orange;
    ctx.beginPath(); ctx.arc(xNow, yNow, 5, 0, 2 * Math.PI); ctx.fill();

    // Current marker.
    ctx.fillStyle = c.blue;
    ctx.beginPath(); ctx.arc(xNow, yNowI, 5, 0, 2 * Math.PI); ctx.fill();
  }

  // Axes labels.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('t', p.x + padL + plotW - 12, p.y + padT + plotH + 28);

  ctx.save();
  ctx.translate(p.x + 18, p.y + padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('V(t), I(t)', 0, 0);
  ctx.restore();

  // Legend.
  ctx.fillStyle = c.orange;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('V(t)', p.x + padL + 12, p.y + 16);

  ctx.fillStyle = c.blue;
  ctx.fillText('I(t)', p.x + padL + 12 + 50, p.y + 16);
}

let REG = null;

function layout() {
  REG = stack(canvas, [
    { name: 'circuit', weight: 3 },
    { name: 'plot', weight: 4 }
  ]);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!REG) layout();

  drawCircuit(c, REG.circuit);
  drawPlot(c, REG.plot);
}

let holdUntil = 0;
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  const tau = R * C;
  if (running) {
    if (holdUntil > 0) {
      if (now >= holdUntil) { holdUntil = 0; t = 0; }
    } else {
      const SWEEP_SECONDS = 9;
      t += dt * (7 * tau / SWEEP_SECONDS);
      if (t > 7 * tau) { t = 7 * tau; holdUntil = now + 1000; }
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const tau = R * C;
    t = frac * 6 * tau;
  }
  valueV0.textContent = V0.toFixed(1);
  valueR.textContent = (R / 1e3).toFixed(1);
  valueC.textContent = (C / 1e-6).toFixed(1);
  render();

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

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const tau = R * C;
  const V = vC(t, V0, tau);
  const I = iR(t, V0, R, tau);
  return {
    fields: [
      { key: 'tau', label: 'time constant tau (s)', value: tau, format: 'float' },
      { key: 'voltage', label: 'capacitor voltage V(t) (V)', value: V, format: 'float' },
      { key: 'current', label: 'current I(t) (mA)', value: I * 1e3, format: 'float' },
      { key: 'fraction', label: 'V / V0', value: V0 > 0 ? V / V0 : 0, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const tau = R * C;
  const h = tau * 1e-3;
  const dVdt = (vC(t + h, V0, tau) - vC(t - h, V0, tau)) / (2 * h);
  const expected = -vC(t, V0, tau) / tau;
  const drift = Math.abs(dVdt - expected) / Math.max(1e-12, Math.abs(expected));
  return [{
    key: 'rc-ode',
    label: 'V(t) satisfies dV/dt = -V / (RC)',
    value: drift.toExponential(2),
    status: drift < 1e-3 ? 'pass' : (drift < 1e-2 ? 'pending' : 'drift'),
  }];
};
