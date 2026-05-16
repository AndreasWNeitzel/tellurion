// playground.js
// Balls dropped into a selectable concave bowl. The chosen profile is
// drawn as a filled curve; shaded balls bounce with restitution,
// leaving fading trails. sim.js holds the physics.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createSystem, step, SHAPES, totalEnergy, diagnostics } from './sim.js';

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
const sliderE = document.getElementById('slider-e');
const sliderA = document.getElementById('slider-a');
const valueShape = document.getElementById('value-shape');
const valueE = document.getElementById('value-e');
const valueA = document.getElementById('value-a');
const btnDrop = document.getElementById('btn-drop');
const btnPlay = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PHYS_DT = 1 / 240;
const VX = 3.3, Y_LO = -0.15, Y_HI = 3.7;
const toPx = (x, y) => ({ px: W * (x + VX) / (2 * VX), py: H * (1 - (y - Y_LO) / (Y_HI - Y_LO)) });

const COLORS = ['#5bc0eb', '#f4a261', '#06d6a0', '#ef476f', '#ffd166', '#b08bd8'];
const st = { shape: 'parabola', a: 0.55, e: 0.85, sys: null, trails: [], playing: !DETERMINISTIC };

function rebuild(reseed = true) {
  st.sys = createSystem({ shape: st.shape, a: st.a, e: st.e, mu: 0.02, n: 6, seed: SEED });
  st.trails = st.sys.balls.map(() => []);
}

function draw() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  // Bowl: filled region below y = f(x).
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

  // Trails + balls.
  st.sys.balls.forEach((b, i) => {
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

  const d = diagnostics(st.sys);
  readoutE.textContent = d.E.toFixed(2);
  readoutV.textContent = d.maxSpeed.toFixed(2);
  readoutState.textContent = d.maxSpeed < 0.4 ? 'settled' : (st.e >= 0.999 ? 'bouncing (lossless)' : 'bouncing');
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`${SHAPES[st.shape].label}   e = ${st.e.toFixed(2)}   a = ${st.a.toFixed(2)}`, 16, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('shape sets the motion; e = 1 bounces forever, e < 1 settles', 16, H - 14);
}

function physFrame(n) { for (let k = 0; k < n; k += 1) step(st.sys, PHYS_DT); }

selectShape.addEventListener('change', () => { st.shape = selectShape.value; valueShape.textContent = st.shape; rebuild(); draw(); });
sliderE.addEventListener('input', () => { st.e = parseFloat(sliderE.value); valueE.textContent = st.e.toFixed(2); st.sys.e = st.e; });
sliderA.addEventListener('input', () => { st.a = parseFloat(sliderA.value); valueA.textContent = st.a.toFixed(2); st.sys.a = st.a; });
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

function bootSync() {
  valueShape.textContent = st.shape;
  valueE.textContent = st.e.toFixed(2);
  valueA.textContent = st.a.toFixed(2);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(SHAPES);
    st.shape = keys[Math.min(keys.length - 1, Math.round(f * (keys.length - 1)))];
    selectShape.value = st.shape; valueShape.textContent = st.shape;
    rebuild();
    physFrame(Math.round((0.6 + f * 3.4) / PHYS_DT));
    // Build a few trail points so the motion reads in a still.
    for (let i = 0; i < 90; i += 1) { physFrame(2); st.sys.balls.forEach((b, j) => { st.trails[j].push([b.x, b.y]); if (st.trails[j].length > 90) st.trails[j].shift(); }); }
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
      }));
    }
    return;
  }
  rebuild();
  physFrame(160);
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
