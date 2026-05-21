// Slow-roll inflation playground. (n_s, r) plane with Planck 2018 box.

import { nsR, withinPlanckBox, PLANCK_NS, PLANCK_NS_SIG, PLANCK_R_UPPER } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutM     = document.getElementById('readout-m');
const readoutNr    = document.getElementById('readout-nr');

const sliderN  = document.getElementById('slider-N');
const selectM  = document.getElementById('select-model');
const valueN   = document.getElementById('value-N');
const valueM   = document.getElementById('value-model');

let N = parseInt(sliderN.value, 10);
let model = selectM.value;

sliderN.addEventListener('input', () => { N = parseInt(sliderN.value, 10); valueN.textContent = String(N); });
selectM.addEventListener('change', () => { model = selectM.value; valueM.textContent = model; });

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

const MODEL_COLORS = {
  phi2: '#5bc0eb',
  phi4: '#ef476f',
  natural: '#f4a261',
  starobinsky: '#06d6a0',
};

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 64, padR = 16, padT = 30, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const nsMin = 0.90, nsMax = 1.0;
  const rMin = 0, rMax = 0.3;

  function xFor(ns) { return padL + plotW * (ns - nsMin) / (nsMax - nsMin); }
  function yFor(r) { return padT + plotH * (1 - (r - rMin) / (rMax - rMin)); }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = padL + plotW * i / 5;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`${(nsMin + (nsMax - nsMin) * i / 5).toFixed(2)}`, x - 12, padT + plotH + 14);
  }
  for (let i = 0; i <= 6; i += 1) {
    const y = padT + plotH * i / 6;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.fillText(`${(rMax * (1 - i / 6)).toFixed(2)}`, padL - 28, y + 3);
  }

  // Planck 2018 box.
  const x_lo = xFor(PLANCK_NS - 2 * PLANCK_NS_SIG);
  const x_hi = xFor(PLANCK_NS + 2 * PLANCK_NS_SIG);
  const y_top = yFor(PLANCK_R_UPPER);
  const y_bot = yFor(0);
  ctx.fillStyle = 'rgba(6, 214, 160, 0.15)';
  ctx.fillRect(x_lo, y_top, x_hi - x_lo, y_bot - y_top);
  ctx.strokeStyle = c.green;
  ctx.lineWidth = 2;
  ctx.strokeRect(x_lo, y_top, x_hi - x_lo, y_bot - y_top);
  ctx.fillStyle = c.green;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Planck 2018 box', x_lo + 4, y_top + 14);

  // Plot model trajectories from N = 50 to N = 80.
  for (const m of ['phi2', 'phi4', 'natural', 'starobinsky']) {
    ctx.strokeStyle = MODEL_COLORS[m];
    ctx.lineWidth = m === model ? 3 : 1.5;
    ctx.globalAlpha = m === model ? 1.0 : 0.4;
    ctx.beginPath();
    let started = false;
    for (let n = 50; n <= 80; n += 1) {
      const { ns, r } = nsR(m, n);
      if (ns < nsMin || ns > nsMax || r < rMin || r > rMax) continue;
      if (!started) { ctx.moveTo(xFor(ns), yFor(r)); started = true; } else ctx.lineTo(xFor(ns), yFor(r));
    }
    ctx.stroke();
    // Endpoints.
    const ep50 = nsR(m, 50);
    const ep80 = nsR(m, 80);
    if (ep50.ns >= nsMin && ep50.ns <= nsMax && ep50.r >= rMin && ep50.r <= rMax) {
      ctx.fillStyle = MODEL_COLORS[m];
      ctx.beginPath(); ctx.arc(xFor(ep50.ns), yFor(ep50.r), 5, 0, 2 * Math.PI); ctx.fill();
    }
    if (ep80.ns >= nsMin && ep80.ns <= nsMax && ep80.r >= rMin && ep80.r <= rMax) {
      ctx.fillStyle = MODEL_COLORS[m];
      ctx.beginPath(); ctx.arc(xFor(ep80.ns), yFor(ep80.r), 5, 0, 2 * Math.PI); ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;

  // Current selection marker.
  const cur = nsR(model, N);
  if (cur.ns >= nsMin && cur.ns <= nsMax && cur.r >= rMin && cur.r <= rMax) {
    const xc = xFor(cur.ns);
    const yc = yFor(cur.r);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(xc, yc, 9, 0, 2 * Math.PI); ctx.stroke();
  }

  // Legend.
  let ly = padT + 12;
  for (const m of ['phi2', 'phi4', 'natural', 'starobinsky']) {
    ctx.fillStyle = MODEL_COLORS[m];
    ctx.fillRect(padL + plotW - 130, ly - 10, 12, 3);
    ctx.fillStyle = m === model ? MODEL_COLORS[m] : c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(m, padL + plotW - 110, ly);
    ly += 14;
  }

  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('n_s', padL + plotW - 12, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 24); ctx.rotate(-Math.PI / 2);
  ctx.fillText('r (tensor-to-scalar)', 0, 0); ctx.restore();
}

function updateReadout() {
  const { ns, r } = nsR(model, N);
  readoutM.textContent = model + (withinPlanckBox(ns, r) ? ' (favored)' : ' (excluded)');
  readoutNr.textContent = `${ns.toFixed(4)}, ${r.toFixed(4)}`;
}

function loop() {
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const models = ['phi2', 'phi4', 'natural', 'starobinsky'];
    // Five distinct reference frames: cycle the model and sweep N over
    // the full slider range [40,80]. The previous floor(frac*4) clamped
    // frames 4 and 5 both to starobinsky, so the t-075 and t-100 goldens
    // were pixel-identical (SSIM 1.000); this makes all five differ.
    const i = Math.max(0, Math.min(4, Math.round(frac * 4)));
    model = models[i % models.length];
    N = 40 + 10 * i;
    selectM.value = model;
    sliderN.value = String(N);
  }
  valueN.textContent = String(N);
  valueM.textContent = model;
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, N, model };
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
