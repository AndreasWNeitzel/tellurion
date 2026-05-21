// Transmission-line playground. Standing wave on the line with the
// reflection coefficient, VSWR, and power delivered.

import { reflection, vswr, powerDelivered } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutG     = document.getElementById('readout-g');
const readoutP     = document.getElementById('readout-p');

const sliderZL = document.getElementById('slider-zl');
const valueZL  = document.getElementById('value-zl');

const Z0 = 50;
let ZL = parseFloat(sliderZL.value);
sliderZL.addEventListener('input', () => { ZL = parseFloat(sliderZL.value); valueZL.textContent = String(ZL); });

let t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

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

function render(now) {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 20, padR = 20, padT = 100, padB = 80;
  const plotW = canvas.width - padL - padR;
  const lineY = canvas.height / 2;
  const ampPx = (canvas.height - padT - padB) * 0.4;

  const g = reflection(ZL, Z0);
  const t = (now - t0) / 1000;

  // The standing wave envelope: |V(x)| = |V_inc| * sqrt(1 + g^2 + 2 g cos(2 k x))
  // where x is distance from the load. Animation: time-domain V(x, t) = V_inc(cos(omega t - kx) + g cos(omega t + kx)).
  const k = 2 * Math.PI / (plotW / 3); // 3 wavelengths along line
  const omega = 2 * Math.PI * 0.6;

  // Line.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, lineY); ctx.lineTo(padL + plotW, lineY);
  ctx.stroke();

  // Voltage waveform on the line (drawn as a snake above the line).
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const N = 400;
  for (let i = 0; i <= N; i += 1) {
    const x = padL + plotW * i / N;
    const xPhys = (plotW - (x - padL)); // distance from load (right edge is load)
    const v_fwd = Math.cos(omega * t - k * xPhys);
    const v_ref = g * Math.cos(omega * t + k * xPhys);
    const V = v_fwd + v_ref;
    const yPx = lineY - ampPx * V;
    if (i === 0) ctx.moveTo(x, yPx); else ctx.lineTo(x, yPx);
  }
  ctx.stroke();

  // Envelope (max and min).
  ctx.strokeStyle = c.muted;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = padL + plotW * i / N;
    const xPhys = (plotW - (x - padL));
    const E = Math.sqrt(1 + g * g + 2 * g * Math.cos(2 * k * xPhys));
    const yPx = lineY - ampPx * E;
    if (i === 0) ctx.moveTo(x, yPx); else ctx.lineTo(x, yPx);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = padL + plotW * i / N;
    const xPhys = (plotW - (x - padL));
    const E = Math.sqrt(1 + g * g + 2 * g * Math.cos(2 * k * xPhys));
    const yPx = lineY + ampPx * E;
    if (i === 0) ctx.moveTo(x, yPx); else ctx.lineTo(x, yPx);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Source on left, load on right.
  ctx.fillStyle = c.blue;
  ctx.fillRect(padL - 14, lineY - 18, 14, 36);
  ctx.fillStyle = c.red;
  ctx.fillRect(padL + plotW, lineY - 18, 14, 36);

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`source (Z_0 = 50 Ohm)`, padL - 4, padT + 14);
  ctx.fillText(`load Z_L = ${ZL} Ohm`, padL + plotW - 130, padT + 14);
  ctx.fillStyle = c.accent;
  ctx.fillText(`Gamma = ${g.toFixed(3)}`, padL + plotW / 2 - 60, padT + 14);
  ctx.fillStyle = c.muted;
  ctx.fillText('voltage standing wave (live)', padL, canvas.height - padB / 2);
  ctx.fillText('dashed: |V| envelope', padL, canvas.height - padB / 2 + 16);
}

function updateReadout() {
  const g = reflection(ZL, Z0);
  const v = vswr(ZL, Z0);
  const p = powerDelivered(ZL, Z0);
  readoutG.textContent = `${Math.abs(g).toFixed(3)}, ${v === Infinity ? 'inf' : v.toFixed(3)}`;
  readoutP.textContent = p.toFixed(3);
}

function tick(now) {
  render(now);
  updateReadout();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    ZL = 10 + frac * 400;
    sliderZL.value = String(Math.round(ZL));
    valueZL.textContent = String(Math.round(ZL));
    // Freeze time at the same instant for all captured frames.
    t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }
  valueZL.textContent = String(ZL);
  render((typeof performance !== 'undefined' ? performance.now() : Date.now()));
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, ZL };
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
