// playground.js
// Four classical 2D billiards: circle, stadium, Sinai, ellipse. The
// particle bounces specularly; trail accumulates. The ellipse is
// integrable and launched from a focus, so every chord reflects
// through the other focus (the two-focus property).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { createBilliard, step, GEOM_BOUNDS, STADIUM_HALF_LENGTH, SINAI_R, ELLIPSE_AXES } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selGeom      = document.getElementById('select-geom');
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const TRAIL_MAX = 1500;

const state = {
  geom: 'stadium',
  speed: 6,
  billiard: null,
  trail: [],
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accent: cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
};

function toPx(x, y) {
  const b = GEOM_BOUNDS[state.geom];
  const span = Math.max(b.xmax - b.xmin, b.ymax - b.ymin);
  const scale = Math.min(W, H) / span * 0.9;
  const cx = (b.xmax + b.xmin) / 2;
  const cy = (b.ymax + b.ymin) / 2;
  return {
    px: W / 2 + (x - cx) * scale,
    py: H / 2 - (y - cy) * scale,
  };
}

function drawWalls() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.5;
  if (state.geom === 'circle') {
    const c = toPx(0, 0);
    const e = toPx(1, 0);
    const r = Math.abs(e.px - c.px);
    ctx.beginPath();
    ctx.arc(c.px, c.py, r, 0, 2 * Math.PI);
    ctx.stroke();
  } else if (state.geom === 'stadium') {
    const L = STADIUM_HALF_LENGTH;
    const tl = toPx(-L, 1), tr = toPx(L, 1);
    const bl = toPx(-L, -1), br = toPx(L, -1);
    ctx.beginPath();
    ctx.moveTo(tl.px, tl.py); ctx.lineTo(tr.px, tr.py);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bl.px, bl.py); ctx.lineTo(br.px, br.py);
    ctx.stroke();
    // Right semicircle from (L, 1) -> (L, -1) through (L+1, 0)
    const cr = toPx(L, 0);
    const er = toPx(L + 1, 0);
    const rad = Math.abs(er.px - cr.px);
    ctx.beginPath();
    ctx.arc(cr.px, cr.py, rad, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    const cl = toPx(-L, 0);
    ctx.beginPath();
    ctx.arc(cl.px, cl.py, rad, Math.PI / 2, 3 * Math.PI / 2);
    ctx.stroke();
  } else if (state.geom === 'sinai') {
    const tl = toPx(-1, 1), tr = toPx(1, 1), br = toPx(1, -1), bl = toPx(-1, -1);
    ctx.beginPath();
    ctx.moveTo(tl.px, tl.py); ctx.lineTo(tr.px, tr.py);
    ctx.lineTo(br.px, br.py); ctx.lineTo(bl.px, bl.py); ctx.closePath();
    ctx.stroke();
    const c = toPx(0, 0);
    const e = toPx(SINAI_R, 0);
    const r = Math.abs(e.px - c.px);
    ctx.beginPath();
    ctx.arc(c.px, c.py, r, 0, 2 * Math.PI);
    ctx.stroke();
  } else if (state.geom === 'ellipse') {
    const { a, b, c } = ELLIPSE_AXES;
    const o = toPx(0, 0);
    const rx = Math.abs(toPx(a, 0).px - o.px);
    const ry = Math.abs(toPx(0, b).py - o.py);
    ctx.beginPath();
    ctx.ellipse(o.px, o.py, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
    // the two foci: every chord through one reflects through the other
    ctx.fillStyle = 'rgba(255, 209, 102, 0.95)';
    for (const sgn of [-1, 1]) {
      const f = toPx(sgn * c, 0);
      ctx.beginPath(); ctx.arc(f.px, f.py, 4, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
    ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    const fl = toPx(-c, 0), fr = toPx(c, 0);
    ctx.fillText('focus', fl.px, fl.py + 16);
    ctx.fillText('focus', fr.px, fr.py + 16);
    ctx.textAlign = 'left';
  }
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  drawWalls();

  // Trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = tok.accent;
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const f = toPx(state.trail[0].x, state.trail[0].y);
    ctx.moveTo(f.px, f.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const p = toPx(state.trail[i].x, state.trail[i].y);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Current position
  if (state.billiard) {
    const p = toPx(state.billiard.x, state.billiard.y);
    ctx.fillStyle = tok.accentWarm;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Readout
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  const integrable = state.geom === 'circle' || state.geom === 'ellipse';
  const rows = [
    ['geometry', state.geom],
    ['integrable', integrable ? 'yes' : 'no'],
    ['bounces', state.billiard ? String(state.billiard.bounces) : '0'],
    ['trail length', String(state.trail.length)],
  ];
  let y = 18;
  for (const [k, v] of rows) {
    ctx.fillText(k, 12, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, 250, y);
    ctx.textAlign = 'left';
    y += 14;
  }
}

function rebuild() {
  // Generic non-symmetric IC so the circle traces a non-trivial caustic and
  // the chaotic ones quickly fill phase space.
  let ic;
  if (state.geom === 'circle') ic = { x: 0.7, y: 0.0, vx: 0.3, vy: 0.95 };
  else if (state.geom === 'stadium') ic = { x: 0.1, y: 0.2, vx: 1.0, vy: 0.7 };
  else if (state.geom === 'ellipse') ic = { x: -ELLIPSE_AXES.c, y: 0, vx: 0.35, vy: 0.94 };  // launch from a focus
  else ic = { x: 0.55, y: 0.55, vx: 1.0, vy: 0.6 };
  state.billiard = createBilliard({ geom: state.geom, ...ic });
  state.trail = [{ x: state.billiard.x, y: state.billiard.y }];
}

function tickN(nBounces) {
  if (!state.billiard) return;
  for (let i = 0; i < nBounces; i += 1) {
    step(state.billiard);
    state.trail.push({ x: state.billiard.x, y: state.billiard.y });
    if (state.trail.length > TRAIL_MAX) state.trail.shift();
  }
}

selGeom.addEventListener('change', () => {
  state.geom = selGeom.value;
  rebuild(); drawAll();
});
sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const stages = [
      { geom: 'circle',  bounces: 800 },
      { geom: 'circle',  bounces: 3000 },
      { geom: 'stadium', bounces: 3000 },
      { geom: 'sinai',   bounces: 3000 },
      { geom: 'stadium', bounces: 6000 },
    ];
    const s = stages[Math.min(stages.length - 1, Math.round(frac * (stages.length - 1)))];
    state.geom = s.geom;
    selGeom.value = state.geom;
    rebuild();
    tickN(s.bounces);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
