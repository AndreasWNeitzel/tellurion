// playground.js
// Tautochrone: beads released from any height on a cycloid bowl reach the
// bottom in the same time, because the motion is exactly simple harmonic in
// arc length s(t) = s0 cos(omega t).
//
// Vertical 4:5 composition:
//   1. SCENE: the cycloid bowl with beads released from different heights,
//      all sweeping through the bottom together (the arrival flashes). Click
//      the bowl to drop another bead; it falls into step.
//   2. DIAGNOSTIC: each bead's arc length over time, a cosine of the same
//      period but a different amplitude, all crossing zero (the bottom) at the
//      same instants.

import { fontString } from '../../../shared/js/canvas-type.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  beadPosition, cycloidXY, sampleCycloid, arclengthFromBottom,
  R, OMEGA, FULL_PERIOD, QUARTER_PERIOD,
} from './sim.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const urlParams = new URLSearchParams(location.search);
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderSpeed = document.getElementById('slider-speed');
const valueSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const DEFAULT_BEADS = [-3.5, -2.5, -1.5, 1.5, 3.0];
const PALETTE = ['#7fb1d8', '#d68a69', '#f1d28a', '#c2c2e6', '#a3d4a3',
  '#e08fae', '#8fd0e0', '#cdb07a', '#b6e07a', '#d0a0f0'];

const state = {
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  beads: [],
};
function resetBeads() { state.beads = DEFAULT_BEADS.map((s0, i) => ({ s0, color: PALETTE[i % PALETTE.length] })); }
resetBeads();

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.2 },
    { name: 'diag', weight: 1.8 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  const g = (k, d) => css.getPropertyValue(k).trim() || d;
  return {
    bg: g('--bg', '#07090f'), panel: '#0a0c12', fg: g('--fg', '#e8e8e8'),
    muted: 'rgba(255,255,255,0.5)', accent: g('--accent', '#f1d28a'),
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

function sceneMap() {
  const r = REG.scene;
  const padX = 24, padTop = 42, padBot = 30;
  const aw = r.w - 2 * padX, ah = r.h - padTop - padBot;
  const wx = 2 * Math.PI * R, wy = 2 * R;
  const s = Math.min(aw / wx, ah / wy);
  const ox = r.x + r.w / 2 - (wx * s) / 2;
  const oyBottom = r.y + padTop + (ah + wy * s) / 2;
  return { s, ox, oyBottom, X: (x) => ox + x * s, Y: (y) => oyBottom - y * s };
}

function pxToBeadS0(px, py) {
  const m = sceneMap();
  const x = (px - m.ox) / m.s, y = (m.oyBottom - py) / m.s;
  let best = Infinity, bestTheta = Math.PI;
  for (let i = 0; i <= 400; i += 1) {
    const th = 2 * Math.PI * i / 400;
    const c = cycloidXY(th);
    const d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
    if (d < best) { best = d; bestTheta = th; }
  }
  return Math.max(-3.9, Math.min(3.9, arclengthFromBottom(bestTheta)));
}

function drawScene(col) {
  const r = REG.scene;
  panel(col, r, null);
  const m = sceneMap();
  const sFrac = Math.abs(Math.cos(OMEGA * state.tNow));
  const atBottom = sFrac < 0.07;

  // Cycloid bowl.
  const cyc = sampleCycloid(240);
  ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < cyc.length; i += 1) { const p = [m.X(cyc[i].x), m.Y(cyc[i].y)]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
  ctx.stroke();

  // Bottom marker + arrival flash.
  const bx = m.X(R * Math.PI), by = m.Y(0);
  if (atBottom) {
    const glow = 1 - sFrac / 0.07;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, 50);
    g.addColorStop(0, `rgba(241,210,138,${(0.5 * glow).toFixed(3)})`); g.addColorStop(1, 'rgba(241,210,138,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 50, 0, 6.28); ctx.fill();
    ctx.fillStyle = `rgba(241,210,138,${(0.95 * glow).toFixed(3)})`;
    ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('all arrive together', bx, by - 34);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx, by - 8); ctx.lineTo(bx, by + 8); ctx.stroke(); ctx.setLineDash([]);

  // Beads + release markers.
  for (const bead of state.beads) {
    const init = beadPosition(bead.s0, 0);
    const ip = [m.X(init.x), m.Y(init.y)];
    ctx.strokeStyle = `${bead.color}66`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ip[0], ip[1], 4, 0, 6.28); ctx.stroke();
    const pos = beadPosition(bead.s0, state.tNow);
    const p = [m.X(pos.x), m.Y(pos.y)];
    ctx.fillStyle = bead.color; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 6.28); ctx.stroke();
  }

  // Title + readout + hint.
  ctx.font = fontString(canvas, 'caption', 'sans', 600); ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('cycloid bowl', r.x + 8, r.y + 7);
  ctx.font = fontString(canvas, 'mono', 'mono'); ctx.textAlign = 'right'; ctx.fillStyle = col.fg;
  ctx.fillText(`t ${state.tNow.toFixed(2)} s   beads ${state.beads.length}`, r.x + r.w - 8, r.y + 7);
  ctx.font = fontString(canvas, 'caption', 'sans'); ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('click the bowl to drop a bead', r.x + r.w / 2, r.y + r.h - 4);
}

function drawDiag(col) {
  const r = REG.diag;
  panel(col, r, 'arc length s(t): same period, every amplitude');
  const padL = 30, padR = 14, padT = 28, padB = 22;
  const x0 = r.x + padL, x1 = r.x + r.w - padR, pw = x1 - x0;
  const y0 = r.y + padT, y1 = r.y + r.h - padB, ph = y1 - y0;
  const T = FULL_PERIOD;
  const sMax = 4 * R;
  const fx = (t) => x0 + (t / T) * pw;
  const fy = (s) => (y0 + y1) / 2 - (s / sMax) * (ph / 2);

  // Zero line = the bottom.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, fy(0)); ctx.lineTo(x1, fy(0)); ctx.stroke();
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = col.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('bottom', x0 - 3, fy(0));

  // Bottom-crossing instants at T/4 and 3T/4.
  for (const tc of [QUARTER_PERIOD, 3 * QUARTER_PERIOD]) {
    ctx.strokeStyle = 'rgba(241,210,138,0.45)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx(tc), y0); ctx.lineTo(fx(tc), y1); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = 'rgba(241,210,138,0.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('all cross here', fx(QUARTER_PERIOD), y0 + 1);

  // Each bead's s(t) = s0 cos(omega t).
  for (const bead of state.beads) {
    ctx.strokeStyle = bead.color; ctx.lineWidth = 2; ctx.beginPath();
    const N = 160;
    for (let i = 0; i <= N; i += 1) {
      const t = T * i / N;
      const s = bead.s0 * Math.cos(OMEGA * t);
      const px = fx(t), py = fy(s);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }

  // Now cursor.
  const tc = state.tNow % T;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(fx(tc), y0); ctx.lineTo(fx(tc), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'caption', 'sans'); ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('time', (x0 + x1) / 2, r.y + r.h - 3);
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col);
  drawDiag(col);
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.01; }

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (view.w / rect.width);
  const py = (e.clientY - rect.top) * (view.h / rect.height);
  if (REG && py > REG.scene.y && py < REG.scene.y + REG.scene.h) {
    const s0 = pxToBeadS0(px, py);
    state.beads.push({ s0, color: PALETTE[state.beads.length % PALETTE.length] });
    if (!state.playing) render();
  }
});
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.tNow = 0; resetBeads(); render(); });
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
  valueSpeed.textContent = String(state.speed);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * FULL_PERIOD;
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

function tick() {
  if (state.playing) {
    tickN(state.speed);
    if (state.tNow > FULL_PERIOD) state.tNow -= FULL_PERIOD;
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
  const sFrac = Math.abs(Math.cos(OMEGA * state.tNow));
  return {
    fields: [
      { key: 'beads', label: 'beads on the bowl', value: state.beads.length },
      { key: 'time', label: 'elapsed time (s)', value: state.tNow, format: 'float' },
      { key: 'phase', label: 'arc fraction |s/s0|', value: sFrac, format: 'float' },
      { key: 'quarter', label: 'time to bottom (s)', value: QUARTER_PERIOD, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const tol = 1e-9;
  let synced = true;
  for (const b of state.beads) if (Math.abs(b.s0 * Math.cos(OMEGA * QUARTER_PERIOD)) > tol) synced = false;
  return [
    {
      key: 'isochronism',
      label: 'descent time independent of amplitude',
      value: `${QUARTER_PERIOD.toFixed(3)} s`,
      status: synced ? 'pass' : 'drift',
    },
  ];
};
