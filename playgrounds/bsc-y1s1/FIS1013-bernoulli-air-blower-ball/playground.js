// playground.js
// Interactive air-blower ball. The jet is drawn as advected streak
// particles; the ball levitates and self-centres. Grab the ball and
// release it, tilt the nozzle, or switch the blower off. sim.js holds
// the physics (quadratic drag in a Gaussian-spreading jet).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createBlower, step, airVelocityAt, diagnostics } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutH = document.getElementById('readout-h');
const readoutX = document.getElementById('readout-x');
const readoutState = document.getElementById('readout-state');
const sliderPower = document.getElementById('slider-power');
const sliderTilt = document.getElementById('slider-tilt');
const valuePower = document.getElementById('value-power');
const valueTilt = document.getElementById('value-tilt');
const btnBlower = document.getElementById('btn-blower');
const btnReset = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PHYS_DT = 1 / 240;
const VX = 0.62, Y_TOP = 1.35;
const SCx = W / (2 * VX), SCy = H / Y_TOP;
const NZ_PX = { x: W / 2, y: H - 26 };
const toPx = (x, y) => ({ px: NZ_PX.x + x * SCx, py: NZ_PX.y - y * SCy });
const toWorld = (mx, my) => ({ x: (mx - NZ_PX.x) / SCx, y: (NZ_PX.y - my) / SCy });

const rng = makeRng(SEED);
const sim = createBlower({ U0: 18, tiltDeg: 0, x0: 0.0, y0: 0.95 });
const streaks = [];
const st = { drag: false, playing: !(DETERMINISTIC || prefersReducedMotion()) };

function spawnStreaks(n) {
  for (let i = 0; i < n; i += 1) {
    const r = (rng() - 0.5) * 2 * sim.w0;
    const a = (sim.tiltDeg * Math.PI) / 180;
    // Spawn across the nozzle mouth: the sheet is perpendicular to the jet
    // axis (sin a, cos a), i.e. along (cos a, -sin a).
    streaks.push({ x: sim.nozzle.x + r * Math.cos(a), y: sim.nozzle.y - r * Math.sin(a) + 0.005, age: 0, life: 0.7 + rng() * 0.6 });
  }
}
function advanceStreaks(dt) {
  for (let i = streaks.length - 1; i >= 0; i -= 1) {
    const p = streaks[i];
    const { ux, uy, speed } = airVelocityAt(sim, p.x, p.y);
    p.x += ux * dt; p.y += uy * dt; p.age += dt;
    if (p.age > p.life || speed < 0.4 || p.y > Y_TOP || Math.abs(p.x) > VX) streaks.splice(i, 1);
  }
}

function physFrame(n) {
  for (let k = 0; k < n; k += 1) {
    if (!st.drag) step(sim, PHYS_DT);
    advanceStreaks(PHYS_DT);
    if (sim.on && (k % 2 === 0)) spawnStreaks(5);
  }
}

// Bernoulli pressure field: p = p0 - 1/2 rho v^2. Where the jet is
// fast the static pressure drops; the low-pressure tube around the
// ball is what holds it. We render it as a coarse heatmap so the
// pressure changes are directly visible (blue = low pressure / fast
// air, dark = ambient still air).
const PF_NX = 64, PF_NY = 44;
function drawPressureField() {
  if (!sim.on) return;
  const cellW = W / PF_NX, cellH = H / PF_NY;
  // Find the speed scale for normalisation (peak ~ U0).
  const vRef = Math.max(2, sim.U0);
  for (let j = 0; j < PF_NY; j += 1) {
    for (let i = 0; i < PF_NX; i += 1) {
      const px = (i + 0.5) * cellW, py = (j + 0.5) * cellH;
      const wx = (px - NZ_PX.x) / SCx, wy = (NZ_PX.y - py) / SCy;
      const { speed } = airVelocityAt(sim, wx, wy);
      // Dimensionless dynamic pressure 1/2 rho v^2 (rho absorbed).
      const q = Math.min(1, (speed * speed) / (vRef * vRef));
      if (q < 0.015) continue;                // ambient: leave background
      // Low static pressure = high q. Blue intensity tracks q.
      const a = 0.05 + 0.40 * q;
      ctx.fillStyle = `rgba(70, 130, 220, ${a.toFixed(3)})`;
      ctx.fillRect(px - cellW / 2, py - cellH / 2, cellW + 1, cellH + 1);
    }
  }
  // Colorbar key.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.8)';
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('blue = low static pressure (fast air, Bernoulli)', 16, 40);
}

function draw() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawPressureField();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, NZ_PX.y); ctx.lineTo(W, NZ_PX.y); ctx.stroke();
  const a = (sim.tiltDeg * Math.PI) / 180;
  // Emitter tilts WITH the jet: the physics jet axis is (sin a, cos a),
  // which in screen space (y-up) needs a clockwise canvas rotation of +a so
  // the nozzle mouth points along the actual stream, not opposite it.
  ctx.save(); ctx.translate(NZ_PX.x, NZ_PX.y); ctx.rotate(a);
  ctx.fillStyle = '#3a3f48'; ctx.fillRect(-26, 0, 52, 40);
  ctx.fillStyle = '#5b6472'; ctx.fillRect(-16, -10, 32, 12);
  ctx.restore();

  // Soft jet envelope (Gaussian cone) so the jet reads even between streaks.
  if (sim.on) {
    const a = (sim.tiltDeg * Math.PI) / 180;
    const ax = Math.sin(a), ay = Math.cos(a);
    for (let sAxis = 0.03; sAxis < Y_TOP; sAxis += 0.045) {
      const wHalf = sim.w0 + sim.spread * sAxis;
      const core = 1 / (1 + sAxis / sim.coreLen);
      const cx = sim.nozzle.x + ax * sAxis, cy = sim.nozzle.y + ay * sAxis;
      const c0 = toPx(cx - wHalf, cy), c1 = toPx(cx + wHalf, cy);
      ctx.fillStyle = `rgba(90,150,210,${(0.05 * core).toFixed(3)})`;
      ctx.fillRect(Math.min(c0.px, c1.px), c0.py - 4, Math.abs(c1.px - c0.px), 8);
    }
  }
  for (const p of streaks) {
    const { ux, uy, speed } = airVelocityAt(sim, p.x, p.y);
    const a0 = toPx(p.x, p.y);
    const a1 = toPx(p.x + ux * 0.012, p.y + uy * 0.012);
    const al = Math.max(0, 1 - p.age / p.life) * Math.min(1, speed / 12);
    ctx.strokeStyle = `rgba(120,180,235,${(0.05 + 0.4 * al).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(a0.px, a0.py); ctx.lineTo(a1.px, a1.py); ctx.stroke();
  }

  const b = toPx(sim.x, sim.y);
  const rPx = sim.ballR * SCx * 1.6;
  const g = ctx.createRadialGradient(b.px - rPx * 0.35, b.py - rPx * 0.4, rPx * 0.15, b.px, b.py, rPx);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#f4a261'); g.addColorStop(1, '#7a3b14');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(b.px, b.py, rPx, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();

  const d = diagnostics(sim);
  readoutH.textContent = `${(d.height * 100).toFixed(1)} cm`;
  readoutX.textContent = `${(d.offAxis * 100).toFixed(1)} cm`;
  let state = 'levitating';
  if (!sim.on) state = 'blower off (falling)';
  else if (d.yeq === null) state = 'power too low';
  else if (st.drag) state = 'held';
  else if (sim.y <= sim.ballR + 1e-3) state = 'grounded';
  readoutState.textContent = state;
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`U0 = ${sim.U0.toFixed(1)} m/s   tilt = ${sim.tiltDeg} deg   ${sim.on ? 'blower on' : 'blower off'}`, 16, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('drag the ball and release; it returns to the jet (self-centring)', 16, H - 14);
}

function evtPos(e) {
  const r = canvas.getBoundingClientRect();
  return { mx: (e.clientX - r.left) * (W / r.width), my: (e.clientY - r.top) * (H / r.height) };
}
canvas.addEventListener('pointerdown', (e) => {
  const { mx, my } = evtPos(e); const b = toPx(sim.x, sim.y);
  if (Math.hypot(mx - b.px, my - b.py) < 26) { st.drag = true; canvas.classList.add('dragging'); }
});
canvas.addEventListener('pointermove', (e) => {
  if (!st.drag) return;
  const { mx, my } = evtPos(e); const w = toWorld(mx, my);
  sim.x = Math.max(-VX, Math.min(VX, w.x));
  sim.y = Math.max(sim.ballR, Math.min(Y_TOP, w.y));
  sim.vx = 0; sim.vy = 0;
  if (!st.playing) draw();
});
window.addEventListener('pointerup', () => { st.drag = false; canvas.classList.remove('dragging'); });

sliderPower.addEventListener('input', () => { sim.U0 = parseFloat(sliderPower.value); valuePower.textContent = sim.U0.toFixed(1); });
sliderTilt.addEventListener('input', () => { sim.tiltDeg = parseInt(sliderTilt.value, 10); valueTilt.textContent = String(sim.tiltDeg); });
btnBlower.addEventListener('click', () => {
  sim.on = !sim.on;
  btnBlower.textContent = sim.on ? 'Blower: on' : 'Blower: off';
  btnBlower.setAttribute('aria-pressed', String(sim.on));
});
btnReset.addEventListener('click', () => { sim.x = 0; sim.y = 0.95; sim.vx = 0; sim.vy = 0; });

let last = (typeof performance !== 'undefined' ? performance.now() : Date.now()), acc = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now; acc += dt;
  let steps = 0;
  while (acc >= PHYS_DT && steps < 600) { physFrame(1); acc -= PHYS_DT; steps += 1; }
  draw();
  requestAnimationFrame(tick);
}

function bootSync() {
  valuePower.textContent = sim.U0.toFixed(1);
  valueTilt.textContent = String(sim.tiltDeg);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    sim.tiltDeg = Math.round(-18 + f * 36);
    sliderTilt.value = String(sim.tiltDeg); valueTilt.textContent = String(sim.tiltDeg);
    sim.x = 0.12; sim.y = 1.15; sim.vx = 0; sim.vy = 0;
    const settle = Math.round((1.2 + f * 2.2) / PHYS_DT);
    physFrame(settle);
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
      }));
    }
    return;
  }
  physFrame(240);
  draw();
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
