// playground.js
// Tautochrone: beads released from any height on a cycloid bowl reach the
// bottom in the SAME time, because the motion is exactly simple harmonic in
// arc length, s(t) = s0 cos(omega t). The point is made by contrast: the same
// beads on a circular bowl (a pendulum) arrive at different times, because the
// circle is only isochronous for tiny swings.
//
// Vertical 4:5 composition:
//   1. CYCLOID bowl: beads from different heights all reach the bottom at one
//      instant (they flash together).
//   2. CIRCLE bowl: the same heights, but the higher beads lag, arriving spread
//      out in time.
//   3. DIAGNOSTIC: descent time vs release height, flat for the cycloid and
//      rising for the circle.

import { fontString } from '../../../shared/js/canvas-type.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  beadPosition, cycloidXY, sampleCycloid, arclengthFromBottom,
  circleXY, circlePhi0FromHeight, circleQuarter, stepCircleBead, R_CIRCLE,
  R, OMEGA, QUARTER_PERIOD,
} from './sim.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderSpeed = document.getElementById('slider-speed');
const valueSpeed = document.getElementById('value-speed');
const sliderBeads = document.getElementById('slider-beads');
const valueBeads = document.getElementById('value-beads');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const HMAX = 1.7 * R;                         // top release height (just below the cusp)
const DT = 1 / 240;
const T_END = circleQuarter(circlePhi0FromHeight(HMAX)) * 1.18;   // run until the slowest circle bead lands

const state = {
  speed: 2,
  tNow: 0,
  nBeads: 5,
  holdT: 0, holding: false,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  cyc: [],            // { s0, color, h }
  cir: [],            // { phi, w, phi0, arrived, tArrive, color, h }
};

function rebuildBeads() {
  state.cyc = []; state.cir = [];
  const n = state.nBeads;
  for (let i = 1; i <= n; i += 1) {
    const h = HMAX * i / n;
    const c = viridis(0.12 + 0.78 * (i - 1) / Math.max(1, n - 1));
    const color = `rgb(${c.r},${c.g},${c.b})`;
    const theta = Math.acos(Math.max(-1, Math.min(1, h / R - 1)));   // left side, theta in (0, pi)
    state.cyc.push({ s0: arclengthFromBottom(theta), color, h });
    const phi0 = -circlePhi0FromHeight(h);                            // left side, phi < 0
    state.cir.push({ phi: phi0, w: 0, phi0, arrived: false, tArrive: null, color, h });
  }
  state.tNow = 0; state.holding = false; state.holdT = 0;
}
rebuildBeads();

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'cyc', weight: 1.35 },
    { name: 'cir', weight: 1.35 },
    { name: 'diag', weight: 1.5 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'), panel: '#0a0c12', fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)', accent: g('--accent', '#f1d28a'),
    ok: '#67d98c', warm: '#e0925f', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.10)',
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

// Map a bowl whose x runs [xLo,xHi] and y runs [0,yHi] into a region, bottom
// near the lower edge, x-range centred.
function bowlMap(r, xLo, xHi, yHi) {
  const padX = 18, padTop = 24, padBot = 16;
  const aw = r.w - 2 * padX, ah = r.h - padTop - padBot;
  const s = Math.min(aw / (xHi - xLo), ah / yHi);
  const ox = r.x + r.w / 2 - 0.5 * (xLo + xHi) * s;
  const oyBottom = r.y + padTop + ah;
  return { s, X: (x) => ox + x * s, Y: (y) => oyBottom - y * s };
}

function drawArrivalFlash(col, m, bx, by, intensity, label) {
  if (intensity <= 0) return;
  const g = ctx.createRadialGradient(bx, by, 0, bx, by, 44);
  g.addColorStop(0, `rgba(241,210,138,${(0.5 * intensity).toFixed(3)})`); g.addColorStop(1, 'rgba(241,210,138,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 44, 0, 6.28); ctx.fill();
  if (label) {
    ctx.fillStyle = `rgba(241,210,138,${(0.95 * intensity).toFixed(3)})`;
    ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, bx, by - 26);
  }
}

function drawCycloid(col) {
  const r = REG.cyc;
  panel(col, r, 'cycloid bowl: every bead lands at the same instant');
  const m = bowlMap(r, 0, 2 * Math.PI * R, 2 * R);
  // bowl curve.
  const cyc = sampleCycloid(220);
  ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < cyc.length; i += 1) { const p = [m.X(cyc[i].x), m.Y(cyc[i].y)]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
  ctx.stroke();
  const bx = m.X(R * Math.PI), by = m.Y(0);
  // arrival flash: a single synchronized landing at the quarter period.
  const dtq = Math.abs(state.tNow - QUARTER_PERIOD);
  if (state.tNow >= QUARTER_PERIOD - 0.05) drawArrivalFlash(col, m, bx, by, Math.max(0, 1 - dtq / 0.25), 'all land together');
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx, by - 8); ctx.lineTo(bx, by + 8); ctx.stroke(); ctx.setLineDash([]);
  // beads (parked at the bottom once they reach it at the quarter period).
  for (const b of state.cyc) {
    const init = beadPosition(b.s0, 0); ctx.strokeStyle = `${b.color}66`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(m.X(init.x), m.Y(init.y), 3.5, 0, 6.28); ctx.stroke();
    const pos = beadPosition(b.s0, Math.min(state.tNow, QUARTER_PERIOD));
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(m.X(pos.x), m.Y(pos.y), 6.5, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  }
}

function drawCircle(col) {
  const r = REG.cir;
  panel(col, r, 'circular bowl: the higher you start, the longer you take');
  const phiMax = circlePhi0FromHeight(HMAX);
  const xm = R_CIRCLE * Math.sin(phiMax) * 1.04;
  const m = bowlMap(r, -xm, xm, R_CIRCLE * (1 - Math.cos(phiMax)) * 1.04);
  // bowl arc.
  ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const phi = -phiMax + 2 * phiMax * i / 120; const c = circleXY(phi); const p = [m.X(c.x), m.Y(c.y)]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
  ctx.stroke();
  const bx = m.X(0), by = m.Y(0);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx, by - 8); ctx.lineTo(bx, by + 8); ctx.stroke(); ctx.setLineDash([]);
  // arrival flashes: each bead flashes as it lands, so they twinkle in sequence.
  for (const b of state.cir) {
    if (b.arrived && b.tArrive !== null) {
      const dtq = state.tNow - b.tArrive;
      if (dtq >= 0) drawArrivalFlash(col, m, bx, by, Math.max(0, 1 - dtq / 0.25) * 0.8, null);
    }
  }
  // beads.
  for (const b of state.cir) {
    const init = circleXY(b.phi0); ctx.strokeStyle = `${b.color}66`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(m.X(init.x), m.Y(init.y), 3.5, 0, 6.28); ctx.stroke();
    const c = circleXY(b.phi);
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(m.X(c.x), m.Y(c.y), 6.5, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  }
  const arrived = state.cir.filter((b) => b.arrived).length;
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText(`landed ${arrived}/${state.cir.length}`, r.x + r.w - 8, r.y + 7);
}

function drawDiag(col) {
  const r = REG.diag;
  panel(col, r, 'descent time vs release height: flat (cycloid) or rising (circle)');
  const padL = 46, padR = 16, padT = 28, padB = 26;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  // Zoom the time axis to the data band so the circle's rise above the flat
  // cycloid line reads clearly (the absolute spread is only a few percent).
  const tLo = QUARTER_PERIOD * 0.9;
  const tHi = circleQuarter(circlePhi0FromHeight(HMAX)) * 1.04;
  const fx = (h) => x0 + (h / HMAX) * pw;
  const fy = (t) => y1 - ((t - tLo) / (tHi - tLo)) * ph;
  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.7; ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of [tLo, 0.5 * (tLo + tHi), tHi]) { const y = fy(t); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.fillText(`${t.toFixed(2)}s`, x0 - 5, y); }
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, pw, ph);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
  // cycloid theory: flat at the quarter period.
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.4; ctx.beginPath();
  ctx.moveTo(fx(0), fy(QUARTER_PERIOD)); ctx.lineTo(fx(HMAX), fy(QUARTER_PERIOD)); ctx.stroke();
  // circle theory: rising elliptic curve.
  ctx.strokeStyle = col.warm; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 80; i += 1) { const h = HMAX * i / 80; const t = circleQuarter(circlePhi0FromHeight(h)); const X = fx(h), Y = fy(t); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  // per-bead dots.
  for (const b of state.cyc) { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(fx(b.h), fy(QUARTER_PERIOD), 3.5, 0, 6.28); ctx.fill(); }
  for (const b of state.cir) { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(fx(b.h), fy(circleQuarter(-b.phi0)), 3.5, 0, 6.28); ctx.fill(); }
  ctx.restore();
  // legend + axes.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = col.accent; ctx.fillText('cycloid', x0 + 6, y0 + 4);
  ctx.fillStyle = col.warm; ctx.fillText('circle', x0 + 64, y0 + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('release height', (x0 + x1) / 2, y1 + 6);
  ctx.save(); ctx.translate(x0 - 34, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('descent time', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawCycloid(col); drawCircle(col); drawDiag(col);
}

function advance(dt) {
  state.tNow += dt;
  for (const b of state.cir) {
    if (!b.arrived) { stepCircleBead(b, dt); if (b.arrived) b.tArrive = state.tNow; }
  }
}

function stepFrame(frameDt) {
  if (!state.holding) {
    let acc = frameDt * state.speed, guard = 0;
    while (acc > 0 && guard < 600) { const d = Math.min(DT, acc); advance(d); acc -= d; guard += 1; }
    if (state.tNow >= T_END) { state.holding = true; state.holdT = 0; }
  } else {
    state.holdT += frameDt;
    if (state.holdT > 1.3) rebuildBeads();
  }
}

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
sliderBeads.addEventListener('input', () => { state.nBeads = parseInt(sliderBeads.value, 10); valueBeads.textContent = String(state.nBeads); rebuildBeads(); render(); });
btnReset.addEventListener('click', () => { rebuildBeads(); render(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { relayout(); render(); }); });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  valueSpeed.textContent = String(state.speed);
  if (valueBeads) valueBeads.textContent = String(state.nBeads);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = frac * T_END;
    let acc = 0; while (acc < target) { const d = Math.min(DT, target - acc); advance(d); acc += d; }
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
        window.__simulationReady = true; window.__simulationReadyDetail = { capture: CAPTURE_NAME };
      }));
    }
    return;
  }
  render();
}

let lastT = (typeof performance !== 'undefined' ? performance.now() : Date.now());
function tick(now) {
  if (state.playing) { const dt = Math.min((now - lastT) / 1000, 0.05); stepFrame(dt); render(); }
  lastT = now;
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
  const landedC = state.cir.filter((b) => b.arrived).length;
  return {
    fields: [
      { key: 'beads', label: 'beads per bowl', value: state.nBeads, format: 'int' },
      { key: 'time', label: 'elapsed time (s)', value: state.tNow, format: 'float' },
      { key: 'cyctime', label: 'cycloid descent (s)', value: QUARTER_PERIOD, format: 'float' },
      { key: 'landed', label: 'circle beads landed', value: landedC, format: 'int' },
    ],
  };
};
window.playground.getInvariants = function () {
  // The cycloid descent time is the same for every release height; the circle's
  // is not (it grows with amplitude). Compare the spread of each across heights.
  const cyc = state.cyc.map((b) => QUARTER_PERIOD);
  const cir = state.cir.map((b) => circleQuarter(-b.phi0));
  const spread = (a) => (a.length ? Math.max(...a) - Math.min(...a) : 0);
  const cycSpread = spread(cyc), cirSpread = spread(cir);
  return [{
    key: 'isochronism',
    label: 'cycloid descent time independent of height',
    value: `cycloid spread ${cycSpread.toExponential(1)}s vs circle ${cirSpread.toFixed(2)}s`,
    status: cycSpread < 1e-9 && cirSpread > 1e-3 ? 'pass' : 'pending',
  }];
};
