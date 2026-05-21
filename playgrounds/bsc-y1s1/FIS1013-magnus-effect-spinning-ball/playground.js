import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Magnus-effect trajectory comparison: three trajectories (no spin, current,
// opposite) on common axes, with a live moving ball.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createBall, stepBall, trajectory } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-v');
const sliderAng    = document.getElementById('slider-ang');
const sliderSpin   = document.getElementById('slider-spin');
const valueV       = document.getElementById('value-v');
const valueAng     = document.getElementById('value-ang');
const valueSpin    = document.getElementById('value-spin');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  v0: 25,
  angle: 20,
  spin: 50,
  sim: null,
  spinAngle: 0,
  trails: { current: [], zero: [], opposite: [] },
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function precomputeTrajectories() {
  const opts = { v0: state.v0, angleDeg: state.angle };
  state.trails.current  = trajectory({ ...opts, spin: state.spin });
  state.trails.zero     = trajectory({ ...opts, spin: 0 });
  state.trails.opposite = trajectory({ ...opts, spin: -state.spin });
}

function rebuild() {
  state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin });
  precomputeTrajectories();
}

function bbox() {
  let xMax = 10, yMax = 5;
  for (const key of ['current', 'zero', 'opposite']) {
    for (const p of state.trails[key]) {
      if (p.x > xMax) xMax = p.x;
      if (p.y > yMax) yMax = p.y;
    }
  }
  return { xMax: xMax * 1.05, yMax: yMax * 1.4 };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;
  const bb = bbox();

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`v_0 = ${state.v0}   angle = ${state.angle} deg   spin = ${state.spin}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`range with spin: ${state.trails.current[state.trails.current.length - 1].x.toFixed(2)} m   without: ${state.trails.zero[state.trails.zero.length - 1].x.toFixed(2)} m`, 30, 40);

  const padL = 30, padR = 30, padT = 60, padB = 70;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);

  function xP(x) { return padL + 4 + (drawW - 8) * (x / bb.xMax); }
  function yP(y) { return padT + drawH - 4 - (drawH - 12) * (y / bb.yMax); }
  // Ground line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.beginPath();
  ctx.moveTo(padL, yP(0)); ctx.lineTo(padL + drawW, yP(0));
  ctx.stroke();

  // Trails
  const traces = [
    { key: 'zero',     color: '#f1d28a', dashed: true,  label: 'no spin' },
    { key: 'opposite', color: tok.accentCool, dashed: false, label: 'opposite' },
    { key: 'current',  color: tok.accentWarm, dashed: false, label: 'current spin' },
  ];
  for (const t of traces) {
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 1.5;
    if (t.dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < state.trails[t.key].length; i += 1) {
      const p = state.trails[t.key][i];
      if (i === 0) ctx.moveTo(xP(p.x), yP(Math.max(0, p.y)));
      else         ctx.lineTo(xP(p.x), yP(Math.max(0, p.y)));
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Animated current ball. For in-plane Magnus the spin axis is the
  // screen normal, so the ball spins like a wheel: the surface texture
  // rotates rigidly about the centre while the lighting stays fixed.
  // That contrast (turning texture, static highlight) is what makes the
  // top-/back-spin unambiguous. The earlier seam math left the vertical
  // coordinate independent of the spin phase, so the ball only wobbled.
  if (state.sim.y >= 0) {
    const cx = xP(state.sim.x), cy = yP(state.sim.y), R = 12;
    // Fixed base shading (light from upper-left, does not rotate).
    const sph = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
    sph.addColorStop(0, '#ffe7c8'); sph.addColorStop(0.55, tok.accentWarm); sph.addColorStop(1, '#7a3318');
    ctx.fillStyle = sph;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
    // Rotating surface texture, clipped to the disk: one darker
    // hemisphere plus a stitched equator great circle. Under a rigid
    // rotation about the screen normal the hemisphere boundary projects
    // to a straight diameter and the equator to an ellipse that flattens
    // and fattens once per turn, reading as a true spinning sphere.
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(state.spinAngle);
    ctx.fillStyle = 'rgba(60,22,10,0.34)';
    ctx.beginPath(); ctx.rect(-R, 0, 2 * R, R); ctx.fill();
    ctx.strokeStyle = 'rgba(40,14,6,0.85)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.stroke();
    // Equator stitch ticks: short marks along the diameter, scaled so
    // the row visibly compresses toward the limb as it turns.
    ctx.strokeStyle = 'rgba(40,14,6,0.7)'; ctx.lineWidth = 1.2;
    for (let s = -3; s <= 3; s += 1) {
      const sxp = (s / 3.4) * R;
      const fore = Math.sqrt(Math.max(0, 1 - (sxp / R) * (sxp / R)));
      ctx.beginPath();
      ctx.moveTo(sxp, -2.4 * fore); ctx.lineTo(sxp, 2.4 * fore); ctx.stroke();
    }
    ctx.restore();
    // Fixed specular highlight and rim (static lighting over the spin).
    const hi = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.6);
    hi.addColorStop(0, 'rgba(255,255,255,0.55)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    // Curved spin-direction arrow above the ball, with an arrowhead so
    // top-spin vs back-spin is readable at a glance.
    const dir = Math.sign(state.spin) || 1;
    const ay = cy - R - 11, aR = 7;
    ctx.strokeStyle = tok.accentWarm; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, ay, aR, -2.4, 2.4, dir < 0); ctx.stroke();
    const aEnd = dir > 0 ? 2.4 : Math.PI - 2.4 + Math.PI;
    const hx = cx + aR * Math.cos(aEnd), hy = ay + aR * Math.sin(aEnd);
    const tang = aEnd + (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    ctx.fillStyle = tok.accentWarm;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - 4 * Math.cos(tang - 0.4), hy - 4 * Math.sin(tang - 0.4));
    ctx.lineTo(hx - 4 * Math.cos(tang + 0.4), hy - 4 * Math.sin(tang + 0.4));
    ctx.closePath(); ctx.fill();
  }

  // Legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f1d28a';
  ctx.fillText('no spin (dashed)', padL + 6, padT + 14);
  ctx.fillStyle = tok.accentCool;
  ctx.fillText('opposite spin', padL + 170, padT + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('current spin', padL + 320, padT + 14);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepBall(state.sim, 0.01);
    state.spinAngle += state.spin * 0.0012;     // visible sphere rotation
    if (state.sim.y < 0) {
      // Reset to relaunch
      state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin });
      state.spinAngle = 0;
    }
  }
}

sliderV.addEventListener('change', () => { state.v0 = parseInt(sliderV.value, 10); valueV.textContent = String(state.v0); rebuild(); drawAll(); });
sliderV.addEventListener('input', () => { valueV.textContent = String(parseInt(sliderV.value, 10)); });
sliderAng.addEventListener('change', () => { state.angle = parseInt(sliderAng.value, 10); valueAng.textContent = `${state.angle} deg`; rebuild(); drawAll(); });
sliderAng.addEventListener('input', () => { valueAng.textContent = `${parseInt(sliderAng.value, 10)} deg`; });
sliderSpin.addEventListener('change', () => { state.spin = parseInt(sliderSpin.value, 10); valueSpin.textContent = String(state.spin); rebuild(); drawAll(); });
sliderSpin.addEventListener('input', () => { valueSpin.textContent = String(parseInt(sliderSpin.value, 10)); });
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
    const target = Math.round(frac * 250);
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

// Slowed 4x further on review: one physics step every other frame
// (~0.5 step/frame, vs the previous 2) so the curved flight and the
// visible spin are easy to follow. Capture path returns before tick(),
// so this does not affect goldens.
let frameCount = 0;
function tick() {
  if (state.playing) {
    frameCount += 1;
    if (frameCount % 2 === 0) tickN(1);
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
