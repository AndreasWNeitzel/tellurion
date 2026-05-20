// Magnetic reconnection at an X-point. Canvas2D shows a hyperbolic
// X-point field, inflow streamlines, the diffusion (current) sheet,
// and tracer particles that fold into the sheet and shoot out as
// twin jets.
//
// Coordinates: world (x, y) in units of L. Sheet lies along x at
// y = 0. Inflow is along +/- y. Outflow is along +/- x.

import { PRESETS, lundquist, reconnectionRate, inflowSpeed, sheetHalfWidth, fieldAt, makeRng } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rEta = document.getElementById('readout-eta');
const rS = document.getElementById('readout-S');
const rMA = document.getElementById('readout-MA');
const rDelta = document.getElementById('readout-delta');

const sLogEta = document.getElementById('slider-log-eta'), vLogEta = document.getElementById('value-log-eta');
const sVa = document.getElementById('slider-v-a'), vVa = document.getElementById('value-v-a');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sNp = document.getElementById('slider-Np'), vNp = document.getElementById('value-Np');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  log_eta: -3,
  v_a: 1.0,
  preset: 'solar_corona',
  Np: 120,
  running: !prefersReducedMotion(),
  particles: [],
  rng: makeRng(0xC0FFEE),
  t: 0,
};

const L_WORLD = 1.0;
const X_HALF = 1.5 * L_WORLD;
const Y_HALF = 1.0 * L_WORLD;

function w2s(x, y) {
  const sx = (x + X_HALF) / (2 * X_HALF) * W;
  const sy = (Y_HALF - y) / (2 * Y_HALF) * H;
  return { x: sx, y: sy };
}

function currentParams() {
  return { L: L_WORLD, v_A: st.v_a, eta: Math.pow(10, st.log_eta) };
}

// Inflow + outflow kinematic velocity field. Compressing along y,
// expanding along x. v = (v_in * x / L, -v_in * y / L) in this
// convention so that material flows from |y| big toward y=0 and is
// ejected to |x| big. To make the outflow saturate at v_A we use a
// smooth saturating profile.
function velocityAt(x, y, p) {
  const vin = inflowSpeed(p);
  // Stagnation flow: vx = vin * (x/L), vy = -vin * (y/L). Saturate
  // outflow to v_A near the sheet edges.
  const ux0 = vin * (x / p.L);
  const uy0 = -vin * (y / p.L);
  // Add the "jet" component: along y=0, accelerate x outflow toward
  // sign(x)*v_A on a scale of 0.5 L from the X-point.
  const jet = Math.sign(x) * p.v_A * Math.tanh(Math.abs(x) / (0.4 * p.L));
  const sheetWidth = sheetHalfWidth(p) * 4.0;
  const sheetWindow = Math.exp(-(y * y) / Math.max(1e-9, sheetWidth * sheetWidth));
  const ux = ux0 * (1 - sheetWindow) + jet * sheetWindow;
  return { ux, uy: uy0 };
}

function spawnParticle() {
  // Spawn in the inflow lobes (top or bottom) at uniform x in [-X_HALF,X_HALF].
  const side = (st.rng() < 0.5) ? +1 : -1;
  const y = side * (0.7 + 0.25 * st.rng()) * Y_HALF;
  const x = (st.rng() - 0.5) * 2 * X_HALF * 0.9;
  return { x, y, age: 0 };
}

function reseedParticles() {
  st.particles = [];
  for (let i = 0; i < st.Np; i++) {
    const p = spawnParticle();
    p.age = st.rng() * 4.0;
    st.particles.push(p);
  }
}

function stepParticles(dt) {
  const p = currentParams();
  const newList = [];
  for (const pt of st.particles) {
    const v = velocityAt(pt.x, pt.y, p);
    pt.x += v.ux * dt;
    pt.y += v.uy * dt;
    pt.age += dt;
    // Recycle off-canvas particles.
    if (Math.abs(pt.x) > 1.05 * X_HALF || Math.abs(pt.y) > 1.05 * Y_HALF) {
      newList.push(spawnParticle());
    } else {
      newList.push(pt);
    }
  }
  st.particles = newList;
}

// Hyperbolic field-line tracer: integrate along B starting from a
// seed point until it leaves the box or returns near origin.
function tracedFieldLine(x0, y0, steps = 240, ds = 0.03) {
  const pts = [{ x: x0, y: y0 }];
  let x = x0, y = y0;
  for (let i = 0; i < steps; i++) {
    const { Bx, By } = fieldAt(x, y);
    const mag = Math.hypot(Bx, By);
    if (mag < 1e-6) break;
    x += ds * Bx / mag;
    y += ds * By / mag;
    if (Math.abs(x) > 1.05 * X_HALF || Math.abs(y) > 1.05 * Y_HALF) break;
    pts.push({ x, y });
  }
  return pts;
}

function drawBackground() {
  ctx.fillStyle = '#050609';
  ctx.fillRect(0, 0, W, H);
  // Faint gradient: cyan top half (B to +x), orange bottom (B to -x).
  const gTop = ctx.createLinearGradient(0, 0, 0, H / 2);
  gTop.addColorStop(0, 'rgba(80, 180, 255, 0.10)');
  gTop.addColorStop(1, 'rgba(80, 180, 255, 0.00)');
  ctx.fillStyle = gTop;
  ctx.fillRect(0, 0, W, H / 2);
  const gBot = ctx.createLinearGradient(0, H / 2, 0, H);
  gBot.addColorStop(0, 'rgba(255, 140, 80, 0.00)');
  gBot.addColorStop(1, 'rgba(255, 140, 80, 0.10)');
  ctx.fillStyle = gBot;
  ctx.fillRect(0, H / 2, W, H / 2);
}

function drawFieldLines() {
  // Hyperbolic field lines: pick c = x*y, sweep from negative to
  // positive c. Each contour is two branches.
  ctx.lineWidth = 1.4;
  const cVals = [0.04, 0.10, 0.20, 0.35, 0.55, 0.80];
  for (const c of cVals) {
    // c > 0: upper-right and lower-left branches (top: B to +x).
    // c < 0: lower-right and upper-left.
    for (const sign of [+1, -1]) {
      for (const branchSign of [+1, -1]) {
        // y = (sign*c) / x, sweep x in [0.05, X_HALF] then negate
        ctx.beginPath();
        let first = true;
        for (let i = 0; i < 200; i++) {
          const u = i / 199;
          const xa = 0.05 + u * (X_HALF - 0.05);
          const x = branchSign * xa;
          const y = (sign * c) / x;
          if (Math.abs(y) > Y_HALF * 1.02) { first = true; continue; }
          const p = w2s(x, y);
          if (first) { ctx.moveTo(p.x, p.y); first = false; } else ctx.lineTo(p.x, p.y);
        }
        // Top (y > 0) cyan, bottom orange.
        const yMid = (sign > 0) ? (branchSign > 0 ? +0.5 : -0.5) : (branchSign > 0 ? -0.5 : +0.5);
        ctx.strokeStyle = (yMid > 0)
          ? 'rgba(120, 200, 255, 0.55)'
          : 'rgba(255, 160, 100, 0.55)';
        ctx.stroke();
      }
    }
  }
}

function drawCurrentSheet() {
  const p = currentParams();
  const delta = sheetHalfWidth(p);
  const yPix = (d) => w2s(0, +d).y;
  const yA = yPix(delta), yB = yPix(-delta);
  const top = Math.min(yA, yB), bot = Math.max(yA, yB);
  const grad = ctx.createLinearGradient(0, top, 0, bot);
  grad.addColorStop(0, 'rgba(255, 230, 100, 0.0)');
  grad.addColorStop(0.5, 'rgba(255, 230, 100, 0.55)');
  grad.addColorStop(1, 'rgba(255, 230, 100, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, top, W, bot - top);
  // Crisp central line.
  ctx.strokeStyle = 'rgba(255, 230, 100, 0.9)';
  ctx.lineWidth = 1.2;
  const c = w2s(0, 0);
  ctx.beginPath(); ctx.moveTo(0, c.y); ctx.lineTo(W, c.y); ctx.stroke();
}

function drawInflowArrows(p) {
  const vin = inflowSpeed(p);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.lineWidth = 1.2;
  // Inflow arrows from top and bottom.
  for (const xx of [-1.1, -0.55, 0, 0.55, 1.1]) {
    for (const sign of [+1, -1]) {
      const yA = sign * 0.85 * Y_HALF;
      const yB = sign * 0.45 * Y_HALF;
      arrow(w2s(xx, yA), w2s(xx, yB));
    }
  }
  // Outflow arrows along the sheet.
  ctx.strokeStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.lineWidth = 1.8;
  for (const sign of [+1, -1]) {
    arrow(w2s(sign * 0.35, 0), w2s(sign * 1.15, 0));
  }
}

function arrow(p0, p1) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ah = 8;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p1.x - ah * ux + (ah / 2) * uy, p1.y - ah * uy - (ah / 2) * ux);
  ctx.lineTo(p1.x - ah * ux - (ah / 2) * uy, p1.y - ah * uy + (ah / 2) * ux);
  ctx.closePath();
  ctx.fill();
}

function drawParticles() {
  // Hot plasma color: white near sheet, cooler far from it.
  for (const pt of st.particles) {
    const r2 = pt.y * pt.y;
    const sheetWidth = sheetHalfWidth(currentParams());
    const heat = Math.exp(-r2 / Math.max(1e-9, (4 * sheetWidth) * (4 * sheetWidth)));
    const r = Math.round(180 + 75 * heat);
    const g = Math.round(150 + 70 * heat);
    const b = Math.round(120 + 100 * heat);
    const a = 0.4 + 0.5 * heat;
    const p = w2s(pt.x, pt.y);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8 + 1.2 * heat, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawXPoint() {
  const c = w2s(0, 0);
  // Pulse the X-point with the reconnection rate.
  const p = currentParams();
  const ma = reconnectionRate(p);
  const pulse = 0.6 + 0.4 * Math.sin(st.t * 4);
  const r = 4 + 10 * Math.sqrt(ma) * pulse;
  const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
  g.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
  g.addColorStop(1, 'rgba(255, 250, 220, 0.0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
}

function drawLabels() {
  ctx.fillStyle = 'rgba(180, 220, 255, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('B above sheet  ->', 14, 22);
  ctx.fillStyle = 'rgba(255, 180, 130, 0.75)';
  ctx.fillText('<-  B below sheet', W - 130, H - 12);
  ctx.fillStyle = 'rgba(255, 230, 140, 0.9)';
  ctx.fillText('current sheet (diffusion region)', W / 2 - 100, H / 2 - 12);
  ctx.fillStyle = 'rgba(255, 240, 200, 0.95)';
  ctx.fillText('X-point', W / 2 + 18, H / 2 + 4);
}

function draw() {
  drawBackground();
  drawFieldLines();
  drawCurrentSheet();
  drawXPoint();
  drawInflowArrows(currentParams());
  drawParticles();
  drawLabels();
  updateReadout();
}

function updateReadout() {
  const p = currentParams();
  rEta.textContent = `${st.log_eta.toFixed(1)}`;
  const S = lundquist(p);
  rS.textContent = S.toExponential(2);
  rMA.textContent = reconnectionRate(p).toExponential(2);
  rDelta.textContent = (sheetHalfWidth(p) / p.L).toExponential(2);
}

function readSliders() {
  st.log_eta = parseFloat(sLogEta.value);
  st.v_a = parseFloat(sVa.value);
  st.Np = parseInt(sNp.value, 10);
  vLogEta.textContent = st.log_eta.toFixed(1);
  vVa.textContent = st.v_a.toFixed(1);
  vNp.textContent = String(st.Np);
}

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  st.log_eta = Math.log10(p.eta);
  st.v_a = p.v_A;
  sLogEta.value = String(st.log_eta);
  sVa.value = String(st.v_a);
  readSliders();
  vPreset.textContent = key.replace('_', ' ').slice(0, 8);
  reseedParticles();
}

[sLogEta, sVa, sNp].forEach(el => el.addEventListener('input', () => {
  readSliders();
  if (st.particles.length !== st.Np) reseedParticles();
}));
selPreset.addEventListener('change', () => applyPreset(selPreset.value));
btnReset.addEventListener('click', () => {
  st.t = 0;
  st.rng = makeRng(0xC0FFEE);
  reseedParticles();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  log_eta: { get: () => st.log_eta, set: v => { st.log_eta = parseFloat(v); sLogEta.value = v; }, parse: parseFloat },
  v_a: { get: () => st.v_a, set: v => { st.v_a = parseFloat(v); sVa.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

reseedParticles();

if (CAPTURE_NAME) {
  // Pre-step to the requested fraction (1 second of sim time per frame).
  const target = 2.0 * CAPTURE_FRAC;
  let tt = 0;
  while (tt < target) {
    stepParticles(0.05);
    tt += 0.05;
    st.t = tt;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      stepParticles(dt * 1.5);
      st.t += dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
