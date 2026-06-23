// playground.js
// Magnus effect: a spinning ball curves because the spin drags air around with
// it, producing a force perpendicular to the velocity.
//
// Vertical 4:5 composition:
//   1. SCENE: the spinning ball flies along its curved path, with the no-spin
//      path (dashed) and the opposite-spin path for contrast, the live spinning
//      sphere, the spin direction, and the Magnus force arrow.
//   2. DIAGNOSTIC: the range as a function of spin: backspin carries, topspin
//      dives, with a cursor at the current spin.

import { fontString } from '../../../shared/js/canvas-type.js';
import { createBall, stepBall, trajectory, C_MAG } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderV = document.getElementById('slider-v');
const sliderAng = document.getElementById('slider-ang');
const sliderSpin = document.getElementById('slider-spin');
const valueV = document.getElementById('value-v');
const valueAng = document.getElementById('value-ang');
const valueSpin = document.getElementById('value-spin');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const COOL = '#7fb1d8', WARM = '#d68a69', GOLD = '#f1d28a';

const state = {
  v0: 25, angle: 20, spin: 50,
  sim: null, spinAngle: 0,
  trails: { current: [], zero: [], opposite: [] },
  rangeCurve: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diag', weight: 1.7 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'), panel: '#0a0c12', fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)', accent: g('--accent', '#ffd166'),
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.10)',
  };
}
function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = col.muted;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function precompute() {
  const opts = { v0: state.v0, angleDeg: state.angle };
  state.trails.current = trajectory({ ...opts, spin: state.spin });
  state.trails.zero = trajectory({ ...opts, spin: 0 });
  state.trails.opposite = trajectory({ ...opts, spin: -state.spin });
  state.rangeCurve = [];
  for (let sp = -100; sp <= 100; sp += 5) {
    const p = trajectory({ ...opts, spin: sp });
    state.rangeCurve.push({ spin: sp, range: p[p.length - 1].x });
  }
}
function rebuild() {
  state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin });
  state.spinAngle = 0;
  precompute();
}

function bbox() {
  let xMax = 10, yMax = 1;   // small floor; the real apex (a few metres) should set the vertical scale, not a fixed 5 m headroom
  for (const key of ['current', 'zero', 'opposite']) {
    for (const p of state.trails[key]) { if (p.x > xMax) xMax = p.x; if (p.y > yMax) yMax = p.y; }
  }
  return { xMax: xMax * 1.05, yMax: yMax * 1.15 };
}

function drawScene(col) {
  const r = REG.scene;
  panel(col, r, null);
  const bb = bbox();
  const padL = 14, padR = 14, padT = 48, padB = 26;
  const sx0 = r.x + padL, sw = r.w - padL - padR;
  const syB = r.y + r.h - padB, sh = r.h - padT - padB;
  const xP = (x) => sx0 + (x / bb.xMax) * sw;
  const yP = (y) => syB - (y / bb.yMax) * sh;

  // Ground line.
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sx0, yP(0)); ctx.lineTo(sx0 + sw, yP(0)); ctx.stroke();

  // Trajectories.
  const traces = [
    { key: 'zero', color: GOLD, dash: [5, 4] },
    { key: 'opposite', color: COOL, dash: null },
    { key: 'current', color: WARM, dash: null },
  ];
  for (const t of traces) {
    ctx.strokeStyle = t.color; ctx.lineWidth = 2;
    ctx.setLineDash(t.dash || []);
    ctx.beginPath();
    const arr = state.trails[t.key];
    for (let i = 0; i < arr.length; i += 1) {
      const p = arr[i]; const px = xP(p.x), py = yP(Math.max(0, p.y));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Spinning ball + arrows.
  if (state.sim && state.sim.y >= 0) {
    const cx = xP(state.sim.x), cy = yP(state.sim.y), R = 12;
    const sph = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
    sph.addColorStop(0, '#ffe7c8'); sph.addColorStop(0.55, WARM); sph.addColorStop(1, '#7a3318');
    ctx.fillStyle = sph; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(state.spinAngle);
    ctx.fillStyle = 'rgba(60,22,10,0.34)'; ctx.beginPath(); ctx.rect(-R, 0, 2 * R, R); ctx.fill();
    ctx.strokeStyle = 'rgba(40,14,6,0.85)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.stroke();
    ctx.restore();
    const hi = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.6);
    hi.addColorStop(0, 'rgba(255,255,255,0.55)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.stroke();

    // Magnus force arrow (perpendicular to velocity): F ~ spin*(vy, -vx).
    if (state.spin !== 0) {
      const fx = C_MAG * state.spin * state.sim.vy;
      const fy = -C_MAG * state.spin * state.sim.vx;
      const fm = Math.hypot(fx, fy) || 1;
      const ux = fx / fm, uy = -fy / fm;          // screen y is down, so flip fy
      const len = 34;
      const ex = cx + ux * len, ey = cy + uy * len;
      ctx.strokeStyle = col.accent; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      const an = Math.atan2(ey - cy, ex - cx);
      ctx.fillStyle = col.accent; ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 8 * Math.cos(an - 0.4), ey - 8 * Math.sin(an - 0.4));
      ctx.lineTo(ex - 8 * Math.cos(an + 0.4), ey - 8 * Math.sin(an + 0.4));
      ctx.closePath(); ctx.fill();
      ctx.font = fontString(canvas, 'tick', 'sans'); ctx.fillStyle = col.accent;
      ctx.textAlign = 'center'; ctx.textBaseline = (uy < 0 ? 'bottom' : 'top');
      ctx.fillText('Magnus', ex, ey + (uy < 0 ? -4 : 4));
    }
  }

  // Title, readout, legend.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('spinning ball flight', r.x + 8, r.y + 7);
  const rc = state.trails.current, rz = state.trails.zero;
  const rangeC = rc.length ? rc[rc.length - 1].x : 0, rangeZ = rz.length ? rz[rz.length - 1].x : 0;
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right'; ctx.fillStyle = col.fg;
  ctx.fillText(`spin ${state.spin}   range ${rangeC.toFixed(1)} m`, r.x + r.w - 8, r.y + 7);
  ctx.fillStyle = col.muted; ctx.fillText(`vs ${rangeZ.toFixed(1)} m no spin`, r.x + r.w - 8, r.y + 23);
  // Legend bottom.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = WARM; ctx.fillText('your spin', r.x + 8, r.y + r.h - 5);
  ctx.fillStyle = GOLD; ctx.fillText('no spin', r.x + 78, r.y + r.h - 5);
  ctx.fillStyle = COOL; ctx.fillText('opposite', r.x + 140, r.y + r.h - 5);
}

function drawDiag(col) {
  const r = REG.diag;
  panel(col, r, 'range vs spin');
  if (!state.rangeCurve.length) return;
  const padL = 40, padR = 14, padT = 28, padB = 26;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  let rMax = 0; for (const d of state.rangeCurve) rMax = Math.max(rMax, d.range);
  rMax *= 1.08;
  const fx = (sp) => x0 + (sp + 100) / 200 * pw;
  const fy = (rg) => y1 - rg / rMax * ph;

  // Gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let frac = 0; frac <= 1.0001; frac += 0.5) {
    const py = fy(rMax * frac);
    ctx.strokeStyle = col.grid; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
    ctx.fillText(`${Math.round(rMax * frac)}`, x0 - 4, py);
  }
  // Zero-spin vertical.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(fx(0), y0); ctx.lineTo(fx(0), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('backspin', fx(-55), y1 + 5);
  ctx.fillText('0', fx(0), y1 + 5);
  ctx.fillText('topspin', fx(55), y1 + 5);

  // Range curve.
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.2; ctx.beginPath();
  state.rangeCurve.forEach((d, i) => { const px = fx(d.spin), py = fy(d.range); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
  ctx.stroke();

  // Markers for opposite (cool), no-spin (gold), current (warm).
  const rangeAt = (sp) => {
    let best = state.rangeCurve[0];
    for (const d of state.rangeCurve) if (Math.abs(d.spin - sp) < Math.abs(best.spin - sp)) best = d;
    return best.range;
  };
  const dot = (sp, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(fx(sp), fy(rangeAt(sp)), 4, 0, 6.28); ctx.fill(); };
  dot(-state.spin, COOL); dot(0, GOLD); dot(state.spin, WARM);

  // Cursor.
  ctx.strokeStyle = WARM; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(fx(state.spin), y0); ctx.lineTo(fx(state.spin), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'caption', 'sans'); ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('spin (rad/s): backspin carries, topspin dives', (x0 + x1) / 2, r.y + r.h - 3);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  if (!state.sim) return;
  drawScene(col);
  drawDiag(col);
}

function tickN(n) {
  for (let i = 0; i < n; i += 1) {
    stepBall(state.sim, 0.01);
    state.spinAngle += state.spin * 0.0012;
    if (state.sim.y < 0) { state.sim = createBall({ v0: state.v0, angleDeg: state.angle, spin: state.spin }); state.spinAngle = 0; }
  }
}

sliderV.addEventListener('change', () => { state.v0 = parseInt(sliderV.value, 10); valueV.textContent = String(state.v0); rebuild(); render(); });
sliderV.addEventListener('input', () => { valueV.textContent = String(parseInt(sliderV.value, 10)); });
sliderAng.addEventListener('change', () => { state.angle = parseInt(sliderAng.value, 10); valueAng.textContent = `${state.angle} deg`; rebuild(); render(); });
sliderAng.addEventListener('input', () => { valueAng.textContent = `${parseInt(sliderAng.value, 10)} deg`; });
sliderSpin.addEventListener('change', () => { state.spin = parseInt(sliderSpin.value, 10); valueSpin.textContent = String(state.spin); rebuild(); render(); });
sliderSpin.addEventListener('input', () => { valueSpin.textContent = String(parseInt(sliderSpin.value, 10)); });
btnReset.addEventListener('click', () => { rebuild(); render(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); render(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  rebuild();
  valueV.textContent = String(state.v0);
  valueAng.textContent = `${state.angle} deg`;
  valueSpin.textContent = String(state.spin);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    tickN(Math.round(frac * 250));
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  render();
}

let frameCount = 0;
function tick() {
  if (state.playing) {
    frameCount += 1;
    if (frameCount % 2 === 0) tickN(1);
    render();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const rc = state.trails.current, rz = state.trails.zero;
  const rangeC = rc.length ? rc[rc.length - 1].x : 0, rangeZ = rz.length ? rz[rz.length - 1].x : 0;
  return {
    fields: [
      { key: 'v0', label: 'initial speed (m/s)', value: state.v0, format: 'float' },
      { key: 'angle', label: 'launch angle (deg)', value: state.angle, format: 'float' },
      { key: 'spin', label: 'spin (rad/s)', value: state.spin, format: 'float' },
      { key: 'range-delta', label: 'range vs no spin (m)', value: rangeC - rangeZ, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const rc = state.trails.current, rz = state.trails.zero;
  const rangeC = rc.length ? rc[rc.length - 1].x : 0, rangeZ = rz.length ? rz[rz.length - 1].x : 0;
  const delta = Math.abs(rangeC - rangeZ);
  return [
    {
      key: 'magnus-deflection',
      label: 'spin causes range change (m)',
      value: delta.toFixed(2),
      status: state.spin === 0 ? 'pass' : (delta > 0.1 ? 'pass' : 'drift'),
    },
  ];
};
