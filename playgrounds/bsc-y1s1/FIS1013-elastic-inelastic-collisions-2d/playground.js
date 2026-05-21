// 2D oblique collision. Ball 1 comes in from the left at speed v1 with a
// settable impact parameter b (angle of attack) and strikes ball 2 (at
// rest). The collision is resolved along the line of centres with
// restitution e (sim.js collide2d); both disks scatter in 2D with
// trails and velocity arrows. The 1D collide/ke/momentum API is kept
// for the tests.

import { collide2d, ke2d } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutV = document.getElementById('readout-v');
const readoutKE = document.getElementById('readout-ke');
const ids = ['m1', 'm2', 'u1', 'u2', 'e'].map((k) => ({ k, s: document.getElementById('slider-' + k), v: document.getElementById('value-' + k) }));
// u1 -> incoming speed of ball 1; u2 -> impact parameter b (perp offset).
let st = { m1: 1, m2: 2, u1: 3, u2: 0.4, e: 0.9 };
for (const { k, s, v } of ids) { st[k] = parseFloat(s.value); s.addEventListener('input', () => { st[k] = parseFloat(s.value); v.textContent = parseFloat(s.value).toFixed(2); reset(); }); }
const btnR = document.getElementById('btn-reset');
const btnP = document.getElementById('btn-pause');
let running = !prefersReducedMotion();
btnR.addEventListener('click', reset);
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

let p1, p2, v1, v2, t, collided, trail1, trail2;
function reset() {
  p1 = [-4, st.u2]; v1 = [Math.max(0.3, st.u1), 0];
  p2 = [0, 0];      v2 = [0, 0];
  t = 0; collided = false; trail1 = []; trail2 = [];
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
}
reset();

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue: '#5bc0eb',
  };
}
const PHYSICS_DT = 1 / 240;
let last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let acc = 0;
const KE0 = () => 0.5 * st.m1 * Math.max(0.3, st.u1) ** 2;

function step() {
  const r1 = 0.22 * Math.sqrt(st.m1), r2 = 0.22 * Math.sqrt(st.m2);
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  if (!collided && Math.hypot(dx, dy) <= r1 + r2) {
    const r = collide2d(st.m1, p1, v1, st.m2, p2, v2, st.e);
    v1 = r.v1; v2 = r.v2; collided = true;
  }
  p1[0] += v1[0] * PHYSICS_DT; p1[1] += v1[1] * PHYSICS_DT;
  p2[0] += v2[0] * PHYSICS_DT; p2[1] += v2[1] * PHYSICS_DT;
  trail1.push([p1[0], p1[1]]); trail2.push([p2[0], p2[1]]);
  if (trail1.length > 260) trail1.shift();
  if (trail2.length > 260) trail2.shift();
  t += PHYSICS_DT;
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width * 0.42, cy = canvas.height / 2, scale = 56;
  const X = (x) => cx + x * scale, Y = (y) => cy - y * scale;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();

  const r1 = 0.22 * Math.sqrt(st.m1), r2 = 0.22 * Math.sqrt(st.m2);
  const drawTrail = (tr, col) => {
    for (let i = 1; i < tr.length; i += 1) {
      ctx.strokeStyle = `${col}${(0.04 + 0.4 * i / tr.length).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(X(tr[i - 1][0]), Y(tr[i - 1][1])); ctx.lineTo(X(tr[i][0]), Y(tr[i][1])); ctx.stroke();
    }
  };
  drawTrail(trail1, 'rgba(255,209,102,'); drawTrail(trail2, 'rgba(91,192,235,');

  const ball = (p, r, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), scale * r, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = c.fg; ctx.lineWidth = 1.4; ctx.stroke();
  };
  ball(p2, r2, c.blue);
  ball(p1, r1, c.accent);

  // Velocity arrows.
  const arrow = (p, v, col) => {
    const m = Math.hypot(v[0], v[1]); if (m < 1e-3) return;
    const ax = X(p[0]), ay = Y(p[1]);
    const ex = ax + v[0] * scale * 0.55, ey = ay - v[1] * scale * 0.55;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
    const an = Math.atan2(ey - ay, ex - ax);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 8 * Math.cos(an - 0.4), ey - 8 * Math.sin(an - 0.4));
    ctx.lineTo(ex - 8 * Math.cos(an + 0.4), ey - 8 * Math.sin(an + 0.4));
    ctx.closePath(); ctx.fill();
  };
  arrow(p1, v1, '#ffd166'); arrow(p2, v2, '#5bc0eb');

  const keNow = ke2d(st.m1, v1, st.m2, v2);
  const loss = KE0() > 0 ? 100 * (1 - keNow / KE0()) : 0;
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`2D oblique collision   e = ${st.e.toFixed(2)}   impact b = ${st.u2.toFixed(2)}`, 12, 20);
  ctx.fillText(`|v1| = ${Math.hypot(v1[0], v1[1]).toFixed(2)}   |v2| = ${Math.hypot(v2[0], v2[1]).toFixed(2)}   KE loss = ${loss.toFixed(1)}%`, 12, 38);
  ctx.fillText(`p_x conserved = ${(st.m1 * v1[0] + st.m2 * v2[0]).toFixed(3)} (in: ${(st.m1 * Math.max(0.3, st.u1)).toFixed(3)})`, 12, 56);
  readoutV.textContent = `${Math.hypot(v1[0], v1[1]).toFixed(2)}, ${Math.hypot(v2[0], v2[1]).toFixed(2)}`;
  readoutKE.textContent = `${loss.toFixed(1)}%`;
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  if (running) {
    acc += dt;
    while (acc >= PHYSICS_DT) { step(); acc -= PHYSICS_DT; }
    if (p1[0] > 7 || p2[0] > 7 || t > 14) reset();
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  for (const { k, v } of ids) v.textContent = st[k].toFixed(2);
  if (CAPTURE_NAME) {
    const T = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 2.6;
    for (let i = 0; i < T / PHYSICS_DT; i += 1) step();
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
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
