import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Moving source emits circular wavefronts. Bottom panel shows f_obs(theta).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createDoppler, stepDoppler, observedFreq, radius,
  SOURCE_FREQ, WAVE_SPEED,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-v');
const sliderSpeed  = document.getElementById('slider-speed');
const valueV       = document.getElementById('value-v');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  v: 0.5,
  speed: 2,
  sim: null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  // Draggable observer in world coords (offset from the source at
  // theta = 0 by default).
  obsX: 2.5, obsY: 0,
};

// Pointerdown on the canvas places the draggable observer at the
// clicked world position; pointermove drags it. The observer's
// instantaneous angle theta = atan2(dy, dx) and observed frequency
// f / (1 - (v/c) cos(theta)) are computed and rendered.
let dragging = false;
function onPointer(e, isDown) {
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * (canvas.width / r.width);
  const py = (e.clientY - r.top) * (canvas.height / r.height);
  const sceneCy = 56 + (H - 200) / 2;
  const scale = (H - 200) / 8;
  const wx = (px - W / 2) / scale - state.sim.sourceX;
  const wy = -(py - sceneCy) / scale;
  if (Math.hypot(wx, wy) < 0.3) return;        // ignore clicks on the source
  state.obsX = wx; state.obsY = wy;
  dragging = isDown ? true : dragging;
}
canvas.addEventListener('pointerdown', (e) => { dragging = true; onPointer(e, true); });
canvas.addEventListener('pointermove', (e) => { if (dragging) onPointer(e, false); });
window.addEventListener('pointerup', () => { dragging = false; });

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  // start the source near the left edge so it moves rightward into view
  state.sim = createDoppler({ v: state.v, x0: -2.0, y0: 0.0 });
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  // Title
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`v / c = ${state.v.toFixed(2)}   t = ${state.sim.t.toFixed(2)}   wavefronts = ${state.sim.wavefronts.length}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`f_obs(0) = ${observedFreq(state.v, 0).toFixed(3)}   f_obs(pi/2) = 1.000   f_obs(pi) = ${observedFreq(state.v, Math.PI).toFixed(3)}`, 30, 40);

  // Scene region (top 70 percent) and bar chart (bottom 30 percent)
  const sceneY = 56;
  const sceneH = H - 200;
  const sceneCx = W / 2;
  const sceneCy = sceneY + sceneH / 2;
  const scale = sceneH / 8;     // pixels per unit world

  function worldToPx(x, y) {
    return { px: sceneCx + x * scale, py: sceneCy - y * scale };
  }

  // Scene background
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(20, sceneY, W - 40, sceneH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(20.5, sceneY + 0.5, W - 41, sceneH - 1);

  // Wavefronts (concentric circles)
  for (const wf of state.sim.wavefronts) {
    const r = radius(wf, state.sim.t) * scale;
    if (r < 1) continue;
    const center = worldToPx(wf.xEmit, wf.yEmit);
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(center.px, center.py, r, 0, Math.PI * 2);
    ctx.stroke();
    // small dot at the emission point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(center.px, center.py, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wavelength overlay: where each wavefront crosses the source axis, the
  // FRONT crossings (xEmit + r) are bunched (compressed lambda) and the
  // BACK crossings (xEmit - r) are spread (stretched lambda). Draw the
  // gaps so the Doppler wavelength change is explicit and measurable.
  {
    const axisY = sceneCy;                       // world y = 0
    const front = [], back = [];
    for (const wf of state.sim.wavefronts) {
      const r = radius(wf, state.sim.t);
      if (r < 0.05) continue;
      const xf = wf.xEmit + r, xb = wf.xEmit - r;
      if (xf > -XLIM && xf < XLIM) front.push(xf);
      if (xb > -XLIM && xb < XLIM) back.push(xb);
    }
    front.sort((a, b) => a - b); back.sort((a, b) => a - b);
    const drawGaps = (xs, color) => {
      for (let i = 1; i < xs.length; i += 1) {
        const x0 = sceneCx + xs[i - 1] * scale, x1 = sceneCx + xs[i] * scale;
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0, axisY); ctx.lineTo(x1, axisY); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        for (const xx of [x0, x1]) { ctx.beginPath(); ctx.moveTo(xx, axisY - 6); ctx.lineTo(xx, axisY + 6); ctx.stroke(); }
      }
    };
    // Subtle dark guide so the bars read.
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, axisY); ctx.lineTo(W - 20, axisY); ctx.stroke();
    drawGaps(back, 'rgba(214,138,105,0.85)');     // stretched (warm/red)
    drawGaps(front, 'rgba(127,177,216,0.95)');    // compressed (cool/blue)
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(127,177,216,0.95)';
    ctx.fillText(`lambda_front = c/f - v/f = ${(1 - state.v).toFixed(2)} (compressed)`, 30, sceneY + sceneH - 30);
    ctx.fillStyle = 'rgba(214,138,105,0.95)';
    ctx.fillText(`lambda_back  = c/f + v/f = ${(1 + state.v).toFixed(2)} (stretched)`, 30, sceneY + sceneH - 14);
  }

  // MACH CONE for supersonic v >= 1: the envelope of the wavefronts
  // is a cone with half-angle sin(theta_mach) = 1/M, where M = v/c
  // is the Mach number. Draw the two cone walls from the current
  // source position back to the trailing edge.
  if (state.v > 1.01) {
    const sxp = worldToPx(state.sim.sourceX, 0);
    const sinAng = 1 / state.v;
    const cosAng = Math.sqrt(Math.max(0, 1 - sinAng * sinAng));
    const len = scale * 5;
    ctx.strokeStyle = 'rgba(255, 90, 90, 0.65)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sxp.px, sxp.py);
    ctx.lineTo(sxp.px - len * cosAng, sxp.py - len * sinAng);
    ctx.moveTo(sxp.px, sxp.py);
    ctx.lineTo(sxp.px - len * cosAng, sxp.py + len * sinAng);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 100, 100, 0.92)'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
    const machAngDeg = Math.asin(sinAng) * 180 / Math.PI;
    ctx.fillText(`Mach M = ${state.v.toFixed(2)}; cone half-angle ${machAngDeg.toFixed(1)} deg`,
      sxp.px - len * cosAng + 8, sxp.py - len * sinAng - 8);
  }

  // Source
  const sourcePx = worldToPx(state.sim.sourceX, state.sim.sourceY);
  ctx.fillStyle = tok.accentCool;
  ctx.beginPath();
  ctx.arc(sourcePx.px, sourcePx.py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Velocity arrow
  const arrowLen = 0.8 * scale;
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sourcePx.px, sourcePx.py);
  ctx.lineTo(sourcePx.px + arrowLen, sourcePx.py);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sourcePx.px + arrowLen, sourcePx.py);
  ctx.lineTo(sourcePx.px + arrowLen - 8, sourcePx.py - 5);
  ctx.lineTo(sourcePx.px + arrowLen - 8, sourcePx.py + 5);
  ctx.closePath();
  ctx.fillStyle = tok.accentCool;
  ctx.fill();

  // Two observer markers: in front (theta = 0) and behind (theta = pi)
  const obs1 = worldToPx(state.sim.sourceX + 2.5, 0);
  const obs2 = worldToPx(state.sim.sourceX - 2.5, 0);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath(); ctx.arc(obs1.px, obs1.py, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(obs2.px, obs2.py, 5, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('theta = 0 (in front)',  obs1.px, obs1.py - 10);
  ctx.fillText('theta = pi (behind)',   obs2.px, obs2.py - 10);
  ctx.fillText(`f = ${observedFreq(state.v, 0).toFixed(3)}`,        obs1.px, obs1.py + 18);
  ctx.fillText(`f = ${observedFreq(state.v, Math.PI).toFixed(3)}`, obs2.px, obs2.py + 18);

  // Draggable observer: place it at the user-set offset from the source.
  const dragX = state.sim.sourceX + state.obsX, dragY = state.obsY;
  const dragPx = worldToPx(dragX, dragY);
  // Angle from velocity vector (which points +x).
  const theta = Math.atan2(state.obsY, state.obsX);
  const fDrag = observedFreq(state.v, theta);
  // Colour map: cool blue if blue-shifted (f > 1), warm red if red-
  // shifted (f < 1).
  const dragCol = fDrag >= 1.0
    ? `rgba(${Math.round(120 - 30 * Math.min(1, fDrag - 1))}, ${Math.round(200)}, 255, 0.95)`
    : `rgba(255, ${Math.round(180 - 50 * Math.min(1, 1 - fDrag))}, ${Math.round(120 - 60 * Math.min(1, 1 - fDrag))}, 0.95)`;
  ctx.fillStyle = dragCol;
  ctx.beginPath(); ctx.arc(dragPx.px, dragPx.py, 7, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(dragPx.px, dragPx.py, 7, 0, 6.2832); ctx.stroke();
  // Line from source to observer
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(sourcePx.px, sourcePx.py); ctx.lineTo(dragPx.px, dragPx.py); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(220, 230, 245, 0.95)';
  ctx.fillText(`theta = ${(theta * 180 / Math.PI).toFixed(0)} deg`, dragPx.px, dragPx.py - 12);
  ctx.fillText(`f = ${fDrag.toFixed(3)}`, dragPx.px, dragPx.py + 20);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(180, 195, 220, 0.6)';
  ctx.fillText('drag this observer', dragPx.px + 12, dragPx.py + 3);

  // Bottom: bar chart f_obs(theta) vs theta
  const barY = sceneY + sceneH + 14;
  const barH = H - barY - 16;
  const barX = 30, barW = W - 60;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('observed frequency vs theta (0 to pi)', barX + 6, barY + 14);
  // Plot curve
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const fMax = observedFreq(state.v, 0);
  const fMin = observedFreq(state.v, Math.PI);
  const yMin = Math.min(0.5, fMin * 0.9);
  const yMax = Math.max(2.5, fMax * 1.1);
  for (let i = 0; i < barW - 4; i += 1) {
    const theta = Math.PI * i / (barW - 5);
    const f = observedFreq(state.v, theta);
    const px = barX + 2 + i;
    const py = barY + 18 + (barH - 24) * (1 - (f - yMin) / (yMax - yMin));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Mark f = 1 (source-frame value)
  const yOne = barY + 18 + (barH - 24) * (1 - (1 - yMin) / (yMax - yMin));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(barX, yOne); ctx.lineTo(barX + barW, yOne);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('f = 1', barX + barW - 6, yOne - 4);
}

// Visible world half-width (px 20..W-20 maps to world -XLIM..+XLIM with
// scale = (H-200)/8). When the source passes the right edge, recycle it
// and every wavefront left by the full span so it re-enters from the
// left and the pattern loops seamlessly. This is a presentation wrap;
// sim.js (emission, observed frequency) is unchanged.
const WRAP_SCALE = (H - 200) / 8;
const XLIM  = (W / 2 - 20) / WRAP_SCALE;
const XSPAN = 2 * XLIM;

function stepWorld(n) {
  for (let i = 0; i < n; i += 1) stepDoppler(state.sim, 0.02);
  const s = state.sim;
  while (s.sourceX > XLIM) {
    s.sourceX -= XSPAN;
    for (const wf of s.wavefronts) wf.xEmit -= XSPAN;
    s.wavefronts = s.wavefronts.filter(wf => wf.xEmit > -XLIM - 22);
  }
}
function tickN(n) { stepWorld(n); }

sliderV.addEventListener('input', () => { state.v = parseFloat(sliderV.value); valueV.textContent = state.v.toFixed(2); rebuild(); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
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
    const target = Math.round(frac * 240);
    tickN(target);
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
    tickN(state.speed);
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
