// playground.js
// Field lines from a chosen charge configuration. Includes a moving test
// charge that drifts under the field.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { field, traceLine, PRESETS, emissionPoints, BOX } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');
const btnShoot     = document.getElementById('btn-shoot');
const presetBtns   = document.querySelectorAll('[data-preset]');

const W = canvas.width, H = canvas.height;

const state = {
  preset: 'dipole',
  charges: PRESETS.dipole,
  lines: [],
  testCharge: null,
  trail: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  // Take a deep copy so drag-edits don't mutate PRESETS.
  state.charges = PRESETS[state.preset].map(c => ({ ...c }));
  state.trail = [];
  state.testCharge = null;
  retraceLines();
}

function retraceLines() {
  state.lines = [];
  const emits = emissionPoints(state.charges, 16);
  for (const e of emits) {
    state.lines.push(traceLine(e.x, e.y, state.charges, e.sign));
  }
}

const SCALE_LAYOUT = (() => {
  const padL = 30, padR = 30, padT = 60, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const wbox = 2 * BOX;
  const scale = Math.min(drawW / wbox, drawH / wbox);
  return { padL, padR, padT, padB, drawW, drawH, scale };
})();

function worldToPx(x, y) {
  const { padL, padT, drawW, drawH, scale } = SCALE_LAYOUT;
  return {
    px: padL + drawW / 2 + x * scale,
    py: padT + drawH / 2 - y * scale,
  };
}

function pxToWorld(px, py) {
  const { padL, padT, drawW, drawH, scale } = SCALE_LAYOUT;
  return {
    x: (px - padL - drawW / 2) / scale,
    y: (padT + drawH / 2 - py) / scale,
  };
}

function shootTestCharge() {
  state.testCharge = { x: -BOX + 0.1, y: 0.3, vx: 1.5, vy: 0, q: +1 };
  state.trail = [];
}

function stepTest(dt) {
  if (!state.testCharge) return;
  const { Ex, Ey } = field(state.testCharge.x, state.testCharge.y, state.charges);
  // F = q E. Treat mass = 1.
  state.testCharge.vx += state.testCharge.q * Ex * dt;
  state.testCharge.vy += state.testCharge.q * Ey * dt;
  state.testCharge.x += state.testCharge.vx * dt;
  state.testCharge.y += state.testCharge.vy * dt;
  state.trail.push([state.testCharge.x, state.testCharge.y]);
  if (state.trail.length > 400) state.trail.shift();
  if (Math.abs(state.testCharge.x) > BOX + 1 || Math.abs(state.testCharge.y) > BOX + 1) {
    state.testCharge = null;
  }
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`preset = ${state.preset}    field lines = ${state.lines.length}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`E(r) = sum_i q_i (r - r_i) / |r - r_i|^3`, 30, 40);

  // Plot frame
  const padL = 30, padR = 30, padT = 60, padB = 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, W - padL - padR, H - padT - padB);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, W - padL - padR - 1, H - padT - padB - 1);

  // Field lines (color by sign of starting charge)
  for (let li = 0; li < state.lines.length; li += 1) {
    const line = state.lines[li];
    if (line.xs.length < 2) continue;
    ctx.strokeStyle = 'rgba(241, 210, 138, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let i = 0; i < line.xs.length; i += 1) {
      const p = worldToPx(line.xs[i], line.ys[i]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    // Arrowhead at 60 percent of the line
    const idx = Math.min(line.xs.length - 2, Math.floor(line.xs.length * 0.6));
    if (idx >= 1) {
      const p0 = worldToPx(line.xs[idx], line.ys[idx]);
      const p1 = worldToPx(line.xs[idx + 1], line.ys[idx + 1]);
      const dx = p1.px - p0.px, dy = p1.py - p0.py;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1e-3) {
        const ux = dx / mag, uy = dy / mag;
        const ah = 6;
        ctx.fillStyle = 'rgba(241, 210, 138, 0.75)';
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p1.px - ah * ux + ah * 0.5 * uy, p1.py - ah * uy - ah * 0.5 * ux);
        ctx.lineTo(p1.px - ah * ux - ah * 0.5 * uy, p1.py - ah * uy + ah * 0.5 * ux);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Charges
  for (const c of state.charges) {
    const p = worldToPx(c.x, c.y);
    ctx.fillStyle = c.q > 0 ? tok.accentWarm : tok.accentCool;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.q > 0 ? '+' : '-', p.px, p.py + 1);
    ctx.textBaseline = 'alphabetic';
  }

  // Test charge trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < state.trail.length; i += 1) {
      const p = worldToPx(state.trail[i][0], state.trail[i][1]);
      if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
  if (state.testCharge) {
    const p = worldToPx(state.testCharge.x, state.testCharge.y);
    ctx.fillStyle = '#f1d28a';
    ctx.beginPath();
    ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Legend
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('+ charge', 60, H - 24);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('- charge', 160, H - 24);
  ctx.fillStyle = '#f1d28a';
  ctx.fillText('test charge (q = +1)', 260, H - 24);
}

function tickN(n) {
  if (!state.testCharge) return;
  for (let i = 0; i < n; i += 1) stepTest(0.005);
}

presetBtns.forEach(b => b.addEventListener('click', () => {
  state.preset = b.dataset.preset;
  rebuild();
  drawAll();
}));

// Drag a charge with the mouse / touch.
let dragIndex = -1;
function eventToWorld(ev) {
  const rect = canvas.getBoundingClientRect();
  const px = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const py = (ev.clientY - rect.top) * (canvas.height / rect.height);
  return pxToWorld(px, py);
}
function pickCharge(p) {
  let best = -1, bestD2 = 0.36;     // radius 0.6 in world units
  for (let i = 0; i < state.charges.length; i += 1) {
    const c = state.charges[i];
    const d2 = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = i; }
  }
  return best;
}
canvas.addEventListener('pointerdown', (ev) => {
  const p = eventToWorld(ev);
  dragIndex = pickCharge(p);
  if (dragIndex >= 0) {
    canvas.setPointerCapture(ev.pointerId);
    canvas.style.cursor = 'grabbing';
    ev.preventDefault();
  }
});
canvas.addEventListener('pointermove', (ev) => {
  const p = eventToWorld(ev);
  if (dragIndex >= 0) {
    const c = state.charges[dragIndex];
    c.x = Math.max(-BOX * 0.9, Math.min(BOX * 0.9, p.x));
    c.y = Math.max(-BOX * 0.9, Math.min(BOX * 0.9, p.y));
    retraceLines();
    drawAll();
  } else {
    canvas.style.cursor = pickCharge(p) >= 0 ? 'grab' : 'default';
  }
});
function endDrag(ev) {
  if (dragIndex >= 0) {
    try { canvas.releasePointerCapture(ev.pointerId); } catch {}
  }
  dragIndex = -1;
  canvas.style.cursor = 'default';
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', endDrag);
btnShoot.addEventListener('click', () => { shootTestCharge(); drawAll(); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Pick preset by frac.
    const presetNames = ['dipole', 'two-plus', 'quadrupole', 'mono-plus'];
    state.preset = presetNames[Math.min(3, Math.floor(frac * 4))];
    rebuild();
    shootTestCharge();
    tickN(Math.round(frac * 200));
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(4);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
