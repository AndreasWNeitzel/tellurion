import { curlAtPoint, circulationRect } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutC = document.getElementById('readout-c'); const readoutA = document.getElementById('readout-a');
const selectF = document.getElementById('select-f');
const sliderW = document.getElementById('slider-w'); const sliderH = document.getElementById('slider-h');
const valueF = document.getElementById('value-f'); const valueW = document.getElementById('value-w'); const valueH = document.getElementById('value-h');
let field = selectF.value; let w = parseFloat(sliderW.value); let h = parseFloat(sliderH.value);
let cx0 = 0, cy0 = 0; // Center of rectangle in field coordinates
let isDragging = false, dragStartX = 0, dragStartY = 0, dragStartCx0 = 0, dragStartCy0 = 0;
selectF.addEventListener('change', () => { field = selectF.value; valueF.textContent = field; });
sliderW.addEventListener('input', () => { w = parseFloat(sliderW.value); valueW.textContent = w.toFixed(2); });
sliderH.addEventListener('input', () => { h = parseFloat(sliderH.value); valueH.textContent = h.toFixed(2); });
function colors() { const css = getComputedStyle(document.body); return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', red: '#ef476f', grid: '#23252a' }; }
function vec(field, x, y) {
  if (field === 'unit') return { u: -y / 2, v: x / 2 };
  if (field === 'shear') return { u: y, v: 0 };
  return { u: x, v: y };
}
function arrow(c, x0, y0, x1, y1) { ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); const head = 4; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - head * Math.cos(a - 0.32), y1 - head * Math.sin(a - 0.32)); ctx.lineTo(x1 - head * Math.cos(a + 0.32), y1 - head * Math.sin(a + 0.32)); ctx.closePath(); ctx.fill(); }
// Vertical 4:5 composition: the vector field fills the scene region (its
// width carries x in [-3, 3] at an isotropic scale, so arrows are never
// distorted) and the circulation-vs-area diagnostic sits in a band beneath
// it. SC/SCX/SCY and REG are recomputed each frame and reused by the drag
// handler so the pointer maps to field coordinates correctly.
let SC = 70, SCX = 0, SCY = 0, REG = null;
function layout() {
  REG = stack(canvas, [{ name: 'scene', weight: 3 }, { name: 'plot', weight: 1 }]);
  const s = REG.scene;
  SC = s.w / 6;                       // x in [-3, 3] across the full width
  SCX = s.x + s.w / 2;
  SCY = s.y + s.h / 2;
}
const toX = (x) => SCX + x * SC;
const toY = (y) => SCY - y * SC;

// Flowing tracers advected by the field: this makes the scene alive and, more
// to the point, draws the flow whose rotation around the loop IS the
// circulation, so the animation is the pedagogy. Seeded so captures replay.
let _seed = 0xC0FFEE >>> 0;
function rnd() {
  _seed = (_seed + 0x6D2B79F5) >>> 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
let tracers = [];
let everDragged = false;
const TRAIL = 10;
function spawnTracer(fresh) {
  const yhalf = REG ? (REG.scene.h / 2) / SC : 3;
  const life = 1.4 + rnd() * 1.8;
  const x = (rnd() * 2 - 1) * 3, y = (rnd() * 2 - 1) * yhalf;
  return { x, y, age: fresh ? rnd() * life : 0, life, hist: [[x, y]] };
}
function stepTracers(dt) {
  const yhalf = (REG.scene.h / 2) / SC + 0.3;
  for (const t of tracers) {
    const { u, v } = vec(field, t.x, t.y);
    t.x += u * dt; t.y += v * dt; t.age += dt;
    t.hist.push([t.x, t.y]); if (t.hist.length > TRAIL) t.hist.shift();
    if (t.age > t.life || Math.abs(t.x) > 3.3 || Math.abs(t.y) > yhalf) Object.assign(t, spawnTracer(false));
  }
}
function drawTracers() {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const t of tracers) {
    const { u, v } = vec(field, t.x, t.y);
    const col = viridis(Math.min(1, Math.hypot(u, v) / 2.6));
    const rgb = `${Math.round(col[0])}, ${Math.round(col[1])}, ${Math.round(col[2])}`;
    const fade = Math.sin(Math.min(1, t.age / t.life) * Math.PI);   // fade in then out over life
    // Fading streamline trail: oldest segments faint, head bright. The tail
    // keeps a floor of brightness so the streamlines read as solid ribbons
    // rather than near-black specks against the dark scene.
    for (let i = 1; i < t.hist.length; i += 1) {
      const a = fade * (0.3 + 0.7 * (i / t.hist.length));
      ctx.strokeStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
      ctx.lineWidth = 1.0 + 2.1 * (i / t.hist.length);
      ctx.beginPath();
      ctx.moveTo(toX(t.hist[i - 1][0]), toY(t.hist[i - 1][1]));
      ctx.lineTo(toX(t.hist[i][0]), toY(t.hist[i][1]));
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(${rgb}, ${fade.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(toX(t.x), toY(t.y), 2.3, 0, 2 * Math.PI); ctx.fill();
  }
}

// Rule-13 diagnostic: the loop circulation against the enclosed area.
// Stokes (Green) in 2D makes this a straight line through the origin with
// slope equal to the curl; the marker is the measured circulation.
function drawStokesPlot() {
  const p = REG.plot;
  ctx.fillStyle = 'rgb(10, 13, 24)';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText('circulation vs enclosed area', p.x + 8, p.y + 16);
  const ax = p.x + 44, ay = p.y + 24, aw = p.w - 60, ah = p.h - 46;
  const areaMax = 12, circMax = 12;
  const curl = curlAtPoint(field, cx0, cy0);
  const xOf = (A) => ax + (A / areaMax) * aw;
  const yOf = (C) => ay + ah / 2 - (C / circMax) * (ah / 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  ctx.lineTo(xOf(areaMax), yOf(curl * areaMax));
  ctx.stroke();
  const area = w * h;
  const circ = circulationRect(field, cx0, cy0, w, h);
  const mx = xOf(Math.min(area, areaMax));
  const my = yOf(Math.max(-circMax, Math.min(circMax, circ)));
  // Dotted drop line from the marker to the area axis: ties the moving loop
  // to its point on the circulation = curl x area line.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, yOf(0)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(mx, my, 4, 0, 2 * Math.PI);
  ctx.fill();
  // Slope label: the line's slope IS the curl, the content of Stokes in 2D.
  ctx.font = fontString(canvas, 'tick', 'mono', 600);
  ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'left';
  ctx.fillText(`slope = curl = ${curl.toFixed(2)}`, xOf(areaMax * 0.42), yOf(curl * areaMax * 0.42) + (curl < 0 ? 16 : -8));
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(200, 210, 240, 0.75)';
  ctx.fillText('circulation', p.x + 8, ay + 10);
  ctx.textAlign = 'right';
  ctx.fillText('area', ax + aw, ay + ah + 12);
  ctx.textAlign = 'left';
}

function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  layout();
  const s = REG.scene;
  // Axes within the scene region.
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(s.x, toY(0)); ctx.lineTo(s.x + s.w, toY(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX(0), s.y); ctx.lineTo(toX(0), s.y + s.h); ctx.stroke();
  // Faint static arrows carry the field's structure; the flowing tracers
  // carry the motion and the eye (and are the flow whose loop rotation is the
  // circulation). y-extent follows the scene height at the same isotropic
  // scale, filling the portrait without stretching.
  const yhalf = Math.ceil((s.h / 2) / SC);
  for (let ix = -3; ix <= 3; ix += 0.4) for (let iy = -yhalf; iy <= yhalf; iy += 0.4) {
    const { u, v } = vec(field, ix, iy);
    const mag = Math.hypot(u, v); if (mag < 1e-9) continue;
    const len = Math.min(0.35, 0.08 + 0.05 * mag);
    const dx = len * u / mag, dy = len * v / mag;
    arrow('rgba(150, 160, 180, 0.28)', toX(ix), toY(iy), toX(ix + dx), toY(iy + dy));
  }
  if (!tracers.length) tracers = Array.from({ length: 240 }, () => spawnTracer(true));
  stepTracers(0.016);
  drawTracers();
  // Rectangle at (cx0, cy0).
  const rx = toX(cx0), ry = toY(cy0);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
  ctx.fillRect(rx - SC * w / 2, ry - SC * h / 2, SC * w, SC * h);
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5;
  ctx.strokeRect(rx - SC * w / 2, ry - SC * h / 2, SC * w, SC * h);
  // Boundary arrows showing CCW orientation.
  ctx.strokeStyle = c.blue; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx - SC * w / 2, ry - SC * h / 2);
  ctx.lineTo(rx + SC * w / 2, ry - SC * h / 2);
  ctx.lineTo(rx + SC * w / 2, ry + SC * h / 2);
  ctx.lineTo(rx - SC * w / 2, ry + SC * h / 2);
  ctx.closePath();
  ctx.stroke();
  // Drag affordance, until the user first grabs the loop.
  if (!everDragged) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'center';
    ctx.fillText('drag to move the loop', rx, ry + SC * h / 2 + 18);
    ctx.textAlign = 'left';
  }
  // In-canvas readout overlay (top-left of the scene).
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`field: ${field}`, s.x + 6, s.y + 16);
  ctx.fillText(`curl = ${curlAtPoint(field, 0, 0)}`, s.x + 6, s.y + 34);
  ctx.fillStyle = c.accent;
  ctx.fillText(`circulation = ${circulationRect(field, cx0, cy0, w, h).toFixed(3)}, area = ${(w * h).toFixed(3)}`, s.x + 6, s.y + 52);
  drawStokesPlot();
}
function updateReadout() { readoutC.textContent = circulationRect(field, cx0, cy0, w, h).toFixed(3); readoutA.textContent = (w * h).toFixed(3); }
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }

// Canvas drag handling for rectangle.
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  dragStartX = e.clientX - rect.left;
  dragStartY = e.clientY - rect.top;
  dragStartCx0 = cx0;
  dragStartCy0 = cy0;
  isDragging = true;
  everDragged = true;
});
canvas.addEventListener('pointermove', e => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const dx = x - dragStartX;
  const dy = y - dragStartY;
  cx0 = dragStartCx0 + dx / SC;
  cy0 = dragStartCy0 - dy / SC;
});
canvas.addEventListener('pointerup', () => { isDragging = false; });
canvas.addEventListener('pointercancel', () => { isDragging = false; });
canvas.addEventListener('mouseleave', () => { isDragging = false; });

function bootSync() {
  if (CAPTURE_NAME) {
    const f = CAPTURE_FRAC || 0;
    const fields = ['unit', 'shear', 'conservative'];
    field = fields[Math.min(2, Math.floor(f * 2.999))]; selectF.value = field;
    // Also sweep the loop and position so every frame differs
    w = 0.7 + f * 3.0; h = 0.6 + f * 2.2;
    cx0 = -1 + f * 2.5;
    sliderW.value = String(w); sliderH.value = String(h);
  }
  valueF.textContent = field; valueW.textContent = w.toFixed(2); valueH.textContent = h.toFixed(2);
  if (CAPTURE_NAME) {
    // Warm the advected tracers so the capture shows developed streamlines,
    // not the one-step stubs: the flowing trails ARE the visible field, and a
    // single render() frame would leave them as faint specks.
    layout();
    tracers = Array.from({ length: 240 }, () => spawnTracer(true));
    for (let i = 0; i < 60; i += 1) stepTracers(0.016);
  }
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const curl = curlAtPoint(field, cx0, cy0);
  const circ = circulationRect(field, cx0, cy0, w, h);
  const area = w * h;
  return {
    fields: [
      { key: 'field-type', label: 'Vector field', value: field, format: undefined },
      { key: 'curl-at-center', label: 'Curl (at rect center)', value: curl, format: 'float' },
      { key: 'circulation', label: 'Circulation (line integral)', value: circ, format: 'float' },
      { key: 'area', label: 'Area of rectangle', value: area, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const curl = curlAtPoint(field, cx0, cy0);
  const circ = circulationRect(field, cx0, cy0, w, h);
  const area = w * h;
  const flux = curl * area;
  const stokes_error = Math.abs(circ - flux);
  const rel_error = Math.abs(flux) > 1e-10 ? stokes_error / Math.abs(flux) : stokes_error;
  const status = rel_error < 1e-6 ? 'pass' : (rel_error < 0.01 ? 'pending' : 'drift');
  return [
    {
      key: 'stokes-theorem',
      label: 'Circulation = integral(curl) dA',
      value: status === 'pass' ? 'pass' : stokes_error.toExponential(2),
      status: status
    }
  ];
};
