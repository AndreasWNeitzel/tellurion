// Div/curl visualizer. Draws the vector field as an arrow grid and
// reports analytic div and curl at the origin.

import { FAMILIES } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutDiv   = document.getElementById('readout-div');
const readoutCurl  = document.getElementById('readout-curl');

const selectFamily = document.getElementById('select-family');
const sliderA      = document.getElementById('slider-a');
const valueFamily  = document.getElementById('value-family');
const valueA       = document.getElementById('value-a');

let familyName = selectFamily.value;
let a = parseFloat(sliderA.value);

const state = {
  familyName,
  a,
};

// Advected flow tracers: they drift along the field, so a source sprays them
// outward, a sink pulls them in, and a vortex spins them, making divergence and
// curl directly visible rather than only implied by the arrows. Seeded RNG keeps
// the deterministic capture stable.
let _pseed = 0xC0FFEE >>> 0;
function _prnd() { _pseed = (_pseed * 1664525 + 1013904223) >>> 0; return _pseed / 4294967296; }
const NPART = 260, DOMX = 5.6, DOMY = 7.2;
const particles = [];
function seedParticle(p) { p.x = (_prnd() * 2 - 1) * DOMX; p.y = (_prnd() * 2 - 1) * DOMY; p.age = 0; p.life = 1.6 + _prnd() * 3.2; }
for (let i = 0; i < NPART; i += 1) { const p = {}; seedParticle(p); p.age = _prnd() * p.life; particles.push(p); }
let partLast = (typeof performance !== 'undefined' ? performance.now() : 0);
function advectParticles(now) {
  const dt = Math.min((now - partLast) / 1000, 0.05); partLast = now;
  const fld = FAMILIES[familyName];
  for (const p of particles) {
    const u = fld.P(p.x, p.y, a), v = fld.Q(p.x, p.y, a);
    let sx = u * dt * 0.6, sy = v * dt * 0.6;
    const sm = Math.hypot(sx, sy), cap = 0.09;
    if (sm > cap) { sx = sx / sm * cap; sy = sy / sm * cap; }
    p.x += sx; p.y += sy; p.age += dt;
    if (p.age > p.life || Math.abs(p.x) > DOMX + 0.3 || Math.abs(p.y) > DOMY + 0.3) seedParticle(p);
  }
}
function drawParticles(cx, cy, scale) {
  for (const p of particles) {
    const fade = Math.min(1, p.age / 0.4) * Math.min(1, (p.life - p.age) / 0.4);
    if (fade <= 0) continue;
    const px = cx + scale * p.x, py = cy - scale * p.y;
    ctx.fillStyle = `rgba(255, 238, 196, ${(0.8 * fade).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(px, py, 2.2, 0, 6.283); ctx.fill();
  }
}

selectFamily.addEventListener('change', () => {
  familyName = selectFamily.value;
  state.familyName = familyName;
  valueFamily.textContent = familyName;
});
sliderA.addEventListener('input', () => {
  a = parseFloat(sliderA.value);
  state.a = a;
  valueA.textContent = a.toFixed(2);
});

function colors() {
  // The canvas is a fixed dark viewport, matching the rest of the
  // portfolio. The page theme tokens are deliberately not read here, so
  // the field arrows keep their contrast even on a light-themed page.
  return {
    bg:     '#060608',
    fg:     '#e8e8e8',
    muted:  '#9aa0a6',
    accent: '#ffd166',
    blue:   '#5bc0eb',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function arrow(c, x0, y0, x1, y1) {
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = 5;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(a - 0.32), y1 - head * Math.sin(a - 0.32));
  ctx.lineTo(x1 - head * Math.cos(a + 0.32), y1 - head * Math.sin(a + 0.32));
  ctx.closePath();
  ctx.fill();
}

// Numerical outward flux through a circle of radius r at the origin.
// The divergence theorem predicts div * pi r^2.
function fluxThroughCircle(f, r, aVal) {
  const N = 240;
  let sum = 0;
  for (let i = 0; i < N; i += 1) {
    const th = 2 * Math.PI * (i + 0.5) / N;
    const x = r * Math.cos(th), y = r * Math.sin(th);
    sum += (f.P(x, y, aVal) * Math.cos(th) + f.Q(x, y, aVal) * Math.sin(th)) * r * (2 * Math.PI / N);
  }
  return sum;
}

// Numerical circulation around the same circle. Green's theorem
// predicts curl * pi r^2.
function circulationAroundCircle(f, r, aVal) {
  const N = 240;
  let sum = 0;
  for (let i = 0; i < N; i += 1) {
    const th = 2 * Math.PI * (i + 0.5) / N;
    const x = r * Math.cos(th), y = r * Math.sin(th);
    sum += (-f.P(x, y, aVal) * Math.sin(th) + f.Q(x, y, aVal) * Math.cos(th)) * r * (2 * Math.PI / N);
  }
  return sum;
}

// Rule-13 diagnostic: the flux and circulation through a circular loop
// against the loop radius. Both scale as r^2, the area-scaling of the
// divergence and Green theorems.
function drawFluxPlot(f, aVal) {
  const pw = 290, ph = 150, px = canvas.width - pw - 16, py = 48;
  ctx.fillStyle = 'rgb(10, 13, 24)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText('flux and circulation vs loop radius', px + 8, py + 16);
  const ax = px + 16, ay = py + 26, aw = pw - 30, ah = ph - 44;
  const rMax = 2.5;
  const fluxes = [], circs = [];
  let mag = 1e-9;
  for (let i = 0; i <= 40; i += 1) {
    const r = rMax * i / 40;
    const fx = fluxThroughCircle(f, r, aVal), cr = circulationAroundCircle(f, r, aVal);
    fluxes.push(fx); circs.push(cr);
    mag = Math.max(mag, Math.abs(fx), Math.abs(cr));
  }
  mag *= 1.15;
  const xOf = (i) => ax + (i / 40) * aw;
  const yOf = (val) => ay + ah / 2 - (val / mag) * (ah / 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  for (const [arr, col] of [[fluxes, '#ffd166'], [circs, '#ef476f']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < arr.length; i += 1) {
      const xx = xOf(i), yy = yOf(arr[i]);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = '#ffd166'; ctx.fillText('flux', px + 10, ay + 11);
  ctx.fillStyle = '#ef476f'; ctx.fillText('circulation', px + 10, ay + 25);
  ctx.fillStyle = 'rgba(200, 210, 240, 0.75)';
  ctx.textAlign = 'right';
  ctx.fillText('radius r', ax + aw, ay + ah + 12);
  ctx.textAlign = 'left';
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const scale = 70;
  const f = FAMILIES[familyName];

  // Axes.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();

  // Vector arrows: span the whole portrait, not just a central band.
  for (let ix = -5.5; ix <= 5.5; ix += 0.5) {
    for (let iy = -7; iy <= 7; iy += 0.5) {
      const x = ix, y = iy;
      const u = f.P(x, y, a), v = f.Q(x, y, a);
      const mag = Math.hypot(u, v);
      if (mag < 1e-9) continue;
      const len = Math.min(0.45, 0.08 + 0.05 * mag);
      const dx = len * (u / mag);
      const dy = len * (v / mag);
      const px = cx + scale * x;
      const py = cy - scale * y;
      const px2 = cx + scale * (x + dx);
      const py2 = cy - scale * (y + dy);
      // Color encode by magnitude (faint to bright).
      const t = Math.min(1, mag / 3);
      const r = 91 + Math.round(t * (255 - 91));
      const g = 192 + Math.round(t * (255 - 192));
      const b = 235 + Math.round(t * (107 - 235));
      arrow(`rgb(${r},${g},${b})`, px, py, px2, py2);
    }
  }

  drawParticles(cx, cy, scale);

  // Center marker.
  ctx.fillStyle = c.red;
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fill();

  // Field label and operator readout.
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(f.label, 12, 20);
  ctx.fillStyle = c.accent;
  ctx.fillText(`div F = ${f.div(0, 0, a).toFixed(3)}`, 12, 38);
  ctx.fillStyle = c.red;
  ctx.fillText(`curl F = ${f.curl(0, 0, a).toFixed(3)}`, 12, 54);

  // Test loop used by the flux/circulation diagnostic.
  ctx.strokeStyle = 'rgba(225, 225, 245, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, scale * 1.5, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);

  drawFluxPlot(f, a);
}

function updateReadout() {
  const f = FAMILIES[familyName];
  readoutDiv.textContent = f.div(0, 0, a).toFixed(3);
  readoutCurl.textContent = f.curl(0, 0, a).toFixed(3);
}

function loop(now) {
  if (now === undefined) now = (typeof performance !== 'undefined' ? performance.now() : 0);
  advectParticles(now);
  render();
  updateReadout();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const names = ['source', 'rotation', 'shear', 'saddle'];
    familyName = names[Math.min(names.length - 1, Math.floor(frac * names.length))];
    selectFamily.value = familyName;
  }
  valueFamily.textContent = familyName;
  valueA.textContent = a.toFixed(2);
  render();
  updateReadout();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, familyName, a };
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = FAMILIES[familyName];
  return {
    fields: [
      { key: 'field_family', label: 'Field family', value: familyName },
      { key: 'parameter_a', label: 'Parameter a', value: a, format: 'float' },
      { key: 'divergence', label: 'Divergence (div F)', value: f.div(0, 0, a), format: 'float' },
      { key: 'curl', label: 'Curl (curl F)', value: f.curl(0, 0, a), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const f = FAMILIES[familyName];
  const r = 1.5, area = Math.PI * r * r;
  const flux = fluxThroughCircle(f, r, a);
  const circ = circulationAroundCircle(f, r, a);
  const divArea = f.div(0, 0, a) * area;
  const curlArea = f.curl(0, 0, a) * area;
  const fluxErr = Math.abs(flux - divArea) / (Math.abs(divArea) + 1e-6);
  const circErr = Math.abs(circ - curlArea) / (Math.abs(curlArea) + 1e-6);
  return [
    {
      key: 'divergence-theorem',
      label: 'divergence theorem: loop flux equals div times enclosed area',
      value: fluxErr.toExponential(1),
      status: fluxErr < 1e-3 ? 'pass' : (fluxErr < 1e-1 ? 'pending' : 'drift'),
    },
    {
      key: 'green-theorem',
      label: 'Green theorem: loop circulation equals curl times enclosed area',
      value: circErr.toExponential(1),
      status: circErr < 1e-3 ? 'pass' : (circErr < 1e-1 ? 'pending' : 'drift'),
    },
  ];
};
