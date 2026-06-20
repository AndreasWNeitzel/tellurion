import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for a pendulum on a frictionless moving cart.
// Top region: the cart and hanging bob. Released from rest the total
// horizontal momentum is zero, so the centre of mass cannot move; it is
// drawn as a fixed dashed line while the cart recoils against the swinging
// bob. Bottom region: the cart and bob horizontal positions versus time,
// mirror images about the flat centre-of-mass line.

import {
  createCart, stepCart, energy, horizontalMomentum,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderTheta = document.getElementById('slider-theta');
const sliderMcart = document.getElementById('slider-mcart');
const sliderMbob = document.getElementById('slider-mbob');
const valueTheta = document.getElementById('value-theta');
const valueMcart = document.getElementById('value-mcart');
const valueMbob = document.getElementById('value-mbob');
const btnReset = document.getElementById('btn-reset');
const btnPlay = document.getElementById('btn-playpause');

const PHYSICS_DT = 0.005;
const WINDOW = 6.0;              // diagnostic time window (s)
let running = !DETERMINISTIC;
let theta0 = parseFloat(sliderTheta.value);
let comX = 0;                    // world centre-of-mass x (constant per run)
let e0 = null;
const trail = [];               // bob screen positions for a motion streak
const hist = [];                // {t, xc, xb} for the diagnostic

function makeSim() {
  theta0 = parseFloat(sliderTheta.value);
  const M = parseFloat(sliderMcart.value);
  const m = parseFloat(sliderMbob.value);
  const s = createCart({ theta: theta0, M, m, L: 1.0 });
  comX = s.m * s.L * Math.sin(theta0) / (s.M + s.m);
  e0 = null;
  trail.length = 0;
  hist.length = 0;
  return s;
}
let sim = makeSim();

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.35 },
  ]);
}

function reinit() { sim = makeSim(); }

[sliderTheta, sliderMcart, sliderMbob].forEach((sl) => sl.addEventListener('input', () => {
  valueTheta.textContent = parseFloat(sliderTheta.value).toFixed(2);
  valueMcart.textContent = parseFloat(sliderMcart.value).toFixed(1);
  valueMbob.textContent = parseFloat(sliderMbob.value).toFixed(1);
  reinit();
  render();
}));
btnReset.addEventListener('click', () => { reinit(); render(); });
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    cart: '#5bc0eb',
    bob: '#ff9d6e',
    com: '#b58cff',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function roundRect(x, y, w, h, rad) {
  const rr = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawScene(col, r) {
  panel(col, r, 'Cart recoils, center of mass stays put');

  const titleH = 22, stripH = 30;
  const draw = {
    x: r.x + 10, y: r.y + titleH + 4,
    w: r.w - 20, h: r.h - titleH - 4 - stripH - 4,
  };

  const L = sim.L;
  const amp = Math.abs(Math.sin(theta0));
  const bobAmpX = (sim.M / (sim.M + sim.m)) * L * amp;
  const worldHalfW = Math.max(bobAmpX, 0.15) + 0.28;
  const scaleX = Math.min((draw.w * 0.5 - 14) / worldHalfW, (draw.h * 0.66) / L);
  const centerX = draw.x + draw.w / 2;
  const railY = draw.y + draw.h * 0.30;
  const sx = (wx) => centerX + (wx - comX) * scaleX;

  // Center-of-mass marker (fixed vertical line).
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = col.com;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(centerX, draw.y);
  ctx.lineTo(centerX, draw.y + draw.h);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col.com;
  ctx.font = fontString(canvas, 'tick', 'sans', 600);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('center of mass', centerX, draw.y + 1);

  // Rail.
  ctx.strokeStyle = col.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(draw.x + 6, railY);
  ctx.lineTo(draw.x + draw.w - 6, railY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let hx = draw.x + 10; hx < draw.x + draw.w - 6; hx += 14) {
    ctx.moveTo(hx, railY);
    ctx.lineTo(hx - 7, railY + 8);
  }
  ctx.stroke();

  // Positions.
  const pivotX = sx(sim.x);
  const bobWX = sim.x + L * Math.sin(sim.theta);
  const bobX = sx(bobWX);
  const bobY = railY + L * Math.cos(sim.theta) * scaleX;

  // Bob trail.
  if (running && Math.abs(sim.thetadot) > 0.05) {
    trail.push({ x: bobX, y: bobY });
    if (trail.length > 40) trail.shift();
  }
  for (let i = 1; i < trail.length; i++) {
    ctx.strokeStyle = `rgba(255,157,110,${0.04 + 0.16 * (i / trail.length)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }

  // Rod.
  ctx.strokeStyle = col.fg;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pivotX, railY);
  ctx.lineTo(bobX, bobY);
  ctx.stroke();

  // Cart (box above the rail) with two wheels and a pivot.
  const cartW = Math.max(48, Math.min(120, scaleX * 0.5));
  const cartH = cartW * 0.46;
  ctx.fillStyle = col.cart;
  roundRect(pivotX - cartW / 2, railY - cartH, cartW, cartH, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#0a0c12';
  ctx.beginPath();
  ctx.arc(pivotX, railY, 4, 0, 2 * Math.PI);
  ctx.fill();
  const wheelR = Math.max(5, cartW * 0.12);
  for (const wd of [-1, 1]) {
    ctx.fillStyle = '#2a3340';
    ctx.beginPath();
    ctx.arc(pivotX + wd * cartW * 0.3, railY + wheelR * 0.6, wheelR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Bob.
  const bobR = Math.max(9, Math.min(26, 7 + 6 * Math.cbrt(sim.m)));
  ctx.fillStyle = col.bob;
  ctx.beginPath();
  ctx.arc(bobX, bobY, bobR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Readout strip.
  const p = horizontalMomentum(sim);
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [`θ = ${(sim.theta * 180 / Math.PI).toFixed(0)}°`, col.fg],
    [`cart ${sim.x.toFixed(2)}`, col.cart],
    [`bob ${bobWX.toFixed(2)}`, col.bob],
    [`p ${p.toFixed(2)}`, col.com],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => {
    ctx.fillStyle = c;
    ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry);
  });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Horizontal positions vs time');

  const inner = {
    x: r.x + 50,
    y: r.y + 28,
    w: r.w - 50 - 14,
    h: r.h - 28 - 40,
  };

  const L = sim.L;
  const amp = Math.abs(Math.sin(theta0));
  const bobAmpX = (sim.M / (sim.M + sim.m)) * L * amp;
  const yHalf = Math.max(bobAmpX, 0.12) * 1.15;
  const yMin = comX - yHalf, yMax = comX + yHalf;
  const tNow = sim.t;
  const t0 = Math.max(0, tNow - WINDOW);
  const tSpan = Math.max(WINDOW, tNow) - t0 || 1;

  const xOf = (t) => inner.x + ((t - t0) / tSpan) * inner.w;
  const yOf = (xx) => inner.y + inner.h - ((xx - yMin) / (yMax - yMin)) * inner.h;

  // Grid + y ticks.
  ctx.strokeStyle = col.grid;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const yv of [yMin, comX, yMax]) {
    const y = yOf(yv);
    ctx.beginPath();
    ctx.moveTo(inner.x, y);
    ctx.lineTo(inner.x + inner.w, y);
    ctx.stroke();
    ctx.fillText(yv.toFixed(2), inner.x - 5, y);
  }
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // Center-of-mass line (constant).
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = col.com;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(inner.x, yOf(comX));
  ctx.lineTo(inner.x + inner.w, yOf(comX));
  ctx.stroke();
  ctx.restore();

  // Cart and bob position traces.
  const plot = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (const h of hist) {
      if (h.t < t0) continue;
      const X = xOf(h.t), Y = yOf(h[key]);
      if (!started) { ctx.moveTo(X, Y); started = true; } else { ctx.lineTo(X, Y); }
    }
    ctx.stroke();
  };
  plot('xc', col.cart);
  plot('xb', col.bob);

  // Leading dots at the current time.
  if (hist.length) {
    const cur = hist[hist.length - 1];
    const dot = (yy, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xOf(cur.t), yy, 3.5, 0, 2 * Math.PI); ctx.fill(); };
    dot(yOf(cur.xc), col.cart);
    dot(yOf(cur.xb), col.bob);
  }

  // Axis labels.
  ctx.fillStyle = col.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('time (s)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save();
  ctx.translate(inner.x - 40, inner.y + inner.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x (m)', 0, 0);
  ctx.restore();

  // Legend.
  const legend = [['cart', col.cart], ['bob', col.bob], ['COM', col.com]];
  ctx.fillStyle = 'rgba(10,12,18,0.72)';
  ctx.fillRect(inner.x + 6, inner.y + 6, 140, 18);
  let lx = inner.x + 12;
  const ly = inner.y + 15;
  ctx.font = fontString(canvas, 'legend', 'mono');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const [lab, c] of legend) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 14, ly);
    ctx.stroke();
    ctx.fillStyle = col.fg;
    ctx.fillText(lab, lx + 17, ly);
    lx += ctx.measureText(lab).width + 34;
  }
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

function recordHistory() {
  const xb = sim.x + sim.L * Math.sin(sim.theta);
  hist.push({ t: sim.t, xc: sim.x, xb });
  while (hist.length && hist[0].t < sim.t - WINDOW - 0.5) hist.shift();
}

let last = performance.now();
let accum = 0;
let sample = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    accum += dt;
    while (accum >= PHYSICS_DT) {
      stepCart(sim, PHYSICS_DT);
      accum -= PHYSICS_DT;
      if ((sample++ % 4) === 0) recordHistory();
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(f * (WINDOW / PHYSICS_DT));
    for (let i = 0; i < steps; i++) {
      stepCart(sim, PHYSICS_DT);
      if ((i % 4) === 0) recordHistory();
    }
  }
  relayout();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const xb = sim.x + sim.L * Math.sin(sim.theta);
  return {
    fields: [
      { key: 'theta', label: 'angle $\\theta$ (deg)', value: sim.theta * 180 / Math.PI, format: 'float' },
      { key: 'xcart', label: 'cart $x$ (m)', value: sim.x, format: 'float' },
      { key: 'xbob', label: 'bob $x$ (m)', value: xb, format: 'float' },
      { key: 'p', label: 'momentum $p_x$', value: horizontalMomentum(sim), format: 'float' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    const E = energy(sim);
    if (!Number.isFinite(E)) return [];
    if (e0 === null) e0 = E;
    const dE = Math.abs(E - e0) / Math.max(1e-6, Math.abs(e0));
    return [{
      key: 'energy',
      label: 'total energy conserved (rel. drift)',
      value: dE.toExponential(2),
      status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
    }];
  } catch (e) {
    return [];
  }
};
