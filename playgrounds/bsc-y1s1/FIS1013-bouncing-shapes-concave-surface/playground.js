// playground.js
// Up to 1800 balls released at rest in the outline of a shape, then
// shattered by gravity into a selectable concave bowl. The chosen
// profile is drawn as a filled curve. sim.js holds the physics; this
// file only arranges, renders and wires the controls.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createSystem, step, SHAPES, ARRANGEMENTS, diagnostics } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutE = document.getElementById('readout-e');
const readoutV = document.getElementById('readout-v');
const readoutState = document.getElementById('readout-state');
const selectShape = document.getElementById('select-shape');
const selectArr = document.getElementById('select-arrange');
const sliderE = document.getElementById('slider-e');
const sliderA = document.getElementById('slider-a');
const sliderN = document.getElementById('slider-n');
const valueShape = document.getElementById('value-shape');
const valueArr = document.getElementById('value-arrange');
const valueE = document.getElementById('value-e');
const valueA = document.getElementById('value-a');
const valueN = document.getElementById('value-n');
const btnDrop = document.getElementById('btn-drop');
const btnPlay = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PHYS_DT = 1 / 240;
const VX = 3.3, Y_LO = -0.15, Y_HI = 3.7;
const toPx = (x, y) => ({ px: W * (x + VX) / (2 * VX), py: H * (1 - (y - Y_LO) / (Y_HI - Y_LO)) });

const COLORS = ['#5bc0eb', '#f4a261', '#06d6a0', '#ef476f', '#ffd166', '#b08bd8'];
const st = {
  shape: 'parabola', a: 0.55, e: 0.85, arrangement: 'star', n: 1200,
  sys: null, trails: [], playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function rebuild() {
  st.sys = createSystem({
    shape: st.shape, a: st.a, e: st.e, mu: 0.02,
    n: st.n, seed: SEED, arrangement: st.arrangement,
  });
  // Per-ball fading trails are only legible (and only affordable) for a
  // handful of balls; the shape modes draw thousands of solid dots.
  st.trails = st.n <= 32 ? st.sys.balls.map(() => []) : null;
}

function drawBowl() {
  const f = SHAPES[st.shape].f;
  ctx.beginPath();
  let first = true;
  for (let px = 0; px <= W; px += 4) {
    const x = (px / W) * 2 * VX - VX;
    const p = toPx(x, f(x, st.a));
    if (first) { ctx.moveTo(p.px, p.py); first = false; } else ctx.lineTo(p.px, p.py);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(40,52,78,0.25)'); g.addColorStop(1, 'rgba(20,26,44,0.6)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); first = true;
  for (let px = 0; px <= W; px += 4) {
    const x = (px / W) * 2 * VX - VX;
    const p = toPx(x, f(x, st.a));
    if (first) { ctx.moveTo(p.px, p.py); first = false; } else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawBowl();

  const balls = st.sys.balls;
  if (st.trails) {
    // Few-ball mode: glossy spheres with fading trails (original look).
    balls.forEach((b, i) => {
      const tr = st.trails[i];
      tr.push([b.x, b.y]);
      if (tr.length > 90) tr.shift();
      ctx.strokeStyle = COLORS[i % COLORS.length]; ctx.lineWidth = 1.4;
      for (let k = 1; k < tr.length; k += 1) {
        ctx.globalAlpha = 0.05 + 0.4 * k / tr.length;
        const a0 = toPx(tr[k - 1][0], tr[k - 1][1]), a1 = toPx(tr[k][0], tr[k][1]);
        ctx.beginPath(); ctx.moveTo(a0.px, a0.py); ctx.lineTo(a1.px, a1.py); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const p = toPx(b.x, b.y), r = 9;
      const rg = ctx.createRadialGradient(p.px - 3, p.py - 4, 2, p.px, p.py, r);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.35, COLORS[i % COLORS.length]); rg.addColorStop(1, '#10131a');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, 2 * Math.PI); ctx.fill();
    });
  } else {
    // Many-ball mode: one batched path per colour, solid dots. Radius
    // shrinks with count so a 1800-ball figure stays crisp at 60 fps.
    const r = Math.max(1.6, Math.min(4.5, 64 / Math.sqrt(st.n)));
    for (let c = 0; c < COLORS.length; c += 1) {
      ctx.beginPath();
      for (let i = 0; i < balls.length; i += 1) {
        if (balls[i].ci !== c) continue;
        const p = toPx(balls[i].x, balls[i].y);
        ctx.moveTo(p.px + r, p.py);
        ctx.arc(p.px, p.py, r, 0, 2 * Math.PI);
      }
      ctx.fillStyle = COLORS[c];
      ctx.globalAlpha = 0.92;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const d = diagnostics(st.sys);
  readoutE.textContent = d.E.toFixed(2);
  readoutV.textContent = d.maxSpeed.toFixed(2);
  readoutState.textContent = d.maxSpeed < 0.4 ? 'settled' : (st.e >= 0.999 ? 'bouncing (lossless)' : 'bouncing');
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`${SHAPES[st.shape].label}   ${ARRANGEMENTS[st.arrangement].label}   n = ${st.n}   e = ${st.e.toFixed(2)}`, 16, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('every ball obeys the same law, so the figure dissolves into the bowl motion', 16, H - 14);
}

function physFrame(n) { for (let k = 0; k < n; k += 1) step(st.sys, PHYS_DT); }

selectShape.addEventListener('change', () => { st.shape = selectShape.value; valueShape.textContent = st.shape; rebuild(); draw(); });
selectArr.addEventListener('change', () => { st.arrangement = selectArr.value; valueArr.textContent = ARRANGEMENTS[st.arrangement].label; rebuild(); draw(); });
sliderE.addEventListener('input', () => { st.e = parseFloat(sliderE.value); valueE.textContent = st.e.toFixed(2); st.sys.e = st.e; });
sliderA.addEventListener('input', () => { st.a = parseFloat(sliderA.value); valueA.textContent = st.a.toFixed(2); st.sys.a = st.a; });
sliderN.addEventListener('input', () => { st.n = parseInt(sliderN.value, 10); valueN.textContent = String(st.n); rebuild(); draw(); });
btnDrop.addEventListener('click', () => { rebuild(); draw(); });
btnPlay.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlay.textContent = st.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!st.playing));
});

let last = (typeof performance !== 'undefined' ? performance.now() : Date.now()), acc = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now; acc += dt;
  let steps = 0;
  while (acc >= PHYS_DT && steps < 600) { if (st.playing) physFrame(1); acc -= PHYS_DT; steps += 1; }
  draw();
  requestAnimationFrame(tick);
}

function syncControls() {
  selectShape.value = st.shape; valueShape.textContent = st.shape;
  selectArr.value = st.arrangement; valueArr.textContent = ARRANGEMENTS[st.arrangement].label;
  sliderE.value = String(st.e); valueE.textContent = st.e.toFixed(2);
  sliderA.value = String(st.a); valueA.textContent = st.a.toFixed(2);
  sliderN.value = String(st.n); valueN.textContent = String(st.n);
}

function bootSync() {
  if (CAPTURE_NAME) {
    // Deterministic gallery: a 1200-ball star released into the parabola,
    // stepped through release -> shatter -> settle so the five reference
    // frames are visually distinct and dramatic.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.shape = 'parabola'; st.arrangement = 'star'; st.n = 1200;
    syncControls();
    rebuild();
    physFrame(Math.round((f * 1.7) / PHYS_DT));
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
      }));
    }
    return;
  }
  syncControls();
  rebuild();
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const diag = st.sys ? diagnostics(st.sys) : null;
  const nActive = st.sys ? st.sys.bodies.length : 0;
  return {
    fields: [
      { key: 'shape', label: 'Bowl shape', value: st.shape, format: undefined },
      { key: 'n-bodies', label: 'Particle count', value: nActive, format: 'float' },
      { key: 'curvature', label: 'Curvature a', value: st.a, format: 'float' },
      { key: 'restitution', label: 'Restitution e', value: st.e, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const diag = st.sys ? diagnostics(st.sys) : null;
  const ke_bounded = diag ? (diag.KE >= 0 && diag.KE < 1e6) : true;
  return [
    {
      key: 'kinetic-energy',
      label: 'KE >= 0 and finite',
      value: ke_bounded ? 'pass' : (diag ? `${diag.KE.toExponential(2)}` : 'pending'),
      status: ke_bounded ? 'pass' : 'drift'
    }
  ];
};
