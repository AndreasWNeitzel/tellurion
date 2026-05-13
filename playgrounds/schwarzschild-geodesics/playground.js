// playground.js
// UI for the Schwarzschild geodesics playground. Draws the (x, y) orbit trail
// over horizon and ISCO reference circles, with sliders for (r_ap, L).

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  createGeodesic,
  stepGeodesic,
  geodesicDiagnostics,
  DEFAULT_DT,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  r:        document.getElementById('readout-r'),
  L:        document.getElementById('readout-L'),
  phi:      document.getElementById('readout-phi'),
  E:        document.getElementById('readout-E'),
  dE:       document.getElementById('readout-dE'),
  t:        document.getElementById('readout-t'),
};
const sliderRap    = document.getElementById('slider-rap');
const sliderL      = document.getElementById('slider-L');
const valueRap     = document.getElementById('value-rap');
const valueL       = document.getElementById('value-L');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW = { xmin: -16, xmax: 16, ymin: -10, ymax: 10 };
const TRAIL_MAX = 30000;

const state = {
  r_ap: 12.0,
  L:    3.9,
  geo: null,
  trail: [],
  playing: !DETERMINISTIC,
  plunge: false,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:         cssVar('--bg', '#FBFBF9'),
  surface:    cssVar('--surface', '#FFFFFF'),
  fg:         cssVar('--fg', '#1A1B1C'),
  fgMuted:    cssVar('--fg-muted', '#5C5E61'),
  fgFaint:    cssVar('--fg-faint', '#9A9C9F'),
  accent:     cssVar('--accent', '#1B6CA8'),
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  grid:       cssVar('--grid', '#9A9C9F4D'),
};

function rebuild() {
  state.geo   = createGeodesic(state.r_ap, state.L);
  state.trail = [{ x: state.r_ap, y: 0 }];
  state.plunge = false;
}

function px(x, y) {
  return {
    px: ((x - VIEW.xmin) / (VIEW.xmax - VIEW.xmin)) * W,
    py: (1 - (y - VIEW.ymin) / (VIEW.ymax - VIEW.ymin)) * H,
  };
}

function drawCircle(rWorld, strokeStyle, lineWidth, dash) {
  const center = px(0, 0);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  if (dash) ctx.setLineDash(dash);
  const radiusPx = (rWorld / (VIEW.xmax - VIEW.xmin)) * W;
  ctx.beginPath();
  ctx.arc(center.px, center.py, radiusPx, 0, 2 * Math.PI);
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // grid lines at integer ticks
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -15; x <= 15; x += 3) {
    const { px: xp } = px(x, 0);
    ctx.moveTo(xp, 0); ctx.lineTo(xp, H);
  }
  for (let y = -9; y <= 9; y += 3) {
    const { py: yp } = px(0, y);
    ctx.moveTo(0, yp); ctx.lineTo(W, yp);
  }
  ctx.stroke();

  // axes
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const o = px(0, 0);
  ctx.moveTo(0, o.py); ctx.lineTo(W, o.py);
  ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H);
  ctx.stroke();

  // reference circles: horizon (r=2) and ISCO (r=6)
  drawCircle(2, tokens.accentWarm, 1.2, [3, 4]);
  drawCircle(6, tokens.fgFaint,    0.8, [4, 5]);

  // trail
  if (state.trail.length >= 2) {
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    const first = px(state.trail[0].x, state.trail[0].y);
    ctx.moveTo(first.px, first.py);
    for (let i = 1; i < state.trail.length; i += 1) {
      const q = px(state.trail[i].x, state.trail[i].y);
      ctx.lineTo(q.px, q.py);
    }
    ctx.stroke();
  }

  // central black hole
  ctx.fillStyle = tokens.fg;
  const center = px(0, 0);
  const horizonPx = (2 / (VIEW.xmax - VIEW.xmin)) * W;
  ctx.beginPath();
  ctx.arc(center.px, center.py, horizonPx, 0, 2 * Math.PI);
  ctx.fill();

  // current particle
  if (state.geo) {
    const d = geodesicDiagnostics(state.geo);
    const x = d.r * Math.cos(d.phi);
    const y = d.r * Math.sin(d.phi);
    const p = px(x, y);
    ctx.fillStyle = tokens.accent;
    ctx.beginPath();
    ctx.arc(p.px, p.py, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // titles
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Schwarzschild geodesic (M = 1, geometric units)', 20, 20);
  ctx.fillText('Inner dashed circle: event horizon r = 2.  Outer dashed circle: ISCO r = 6.', 20, 36);

  if (state.plunge) {
    ctx.fillStyle = tokens.accentWarm;
    ctx.font = '13px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('plunge: orbit fell inside r = 2.1', W / 2, H / 2);
  }
}

function updateReadouts() {
  if (!state.geo) return;
  const d = geodesicDiagnostics(state.geo);
  readouts.r.textContent   = d.r.toFixed(4);
  readouts.L.textContent   = d.L.toFixed(4);
  readouts.phi.textContent = d.phi.toFixed(4);
  readouts.E.textContent   = d.radialEnergy.toFixed(6);
  readouts.dE.textContent  = Math.abs(d.radialEnergyDrift).toExponential(2);
  readouts.t.textContent   = d.t.toFixed(2);
  readouts.dE.classList.toggle('warn', Math.abs(d.radialEnergyDrift) > 1e-3);
}

function stepOnce() {
  if (state.plunge) return;
  stepGeodesic(state.geo, DEFAULT_DT);
  const r = state.geo.inst.q[0];
  if (r < 2.1) {
    state.plunge = true;
    return;
  }
  const x = r * Math.cos(state.geo.phi);
  const y = r * Math.sin(state.geo.phi);
  state.trail.push({ x, y });
  if (state.trail.length > TRAIL_MAX) state.trail.shift();
}

function applySliders() {
  state.r_ap = parseFloat(sliderRap.value);
  state.L    = parseFloat(sliderL.value);
  valueRap.textContent = state.r_ap.toFixed(1);
  valueL.textContent   = state.L.toFixed(2);
  rebuild();
  drawAll();
  updateReadouts();
}

sliderRap.addEventListener('input', applySliders);
sliderL.addEventListener('input', applySliders);

btnReset.addEventListener('click', () => {
  sliderRap.value = '12.0';
  sliderL.value   = '3.9';
  applySliders();
});
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

const CAPTURE_TOTAL_T = 1500;

function bootSync() {
  state.r_ap = parseFloat(sliderRap.value);
  state.L    = parseFloat(sliderL.value);
  valueRap.textContent = state.r_ap.toFixed(1);
  valueL.textContent   = state.L.toFixed(2);
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(frac * CAPTURE_TOTAL_T / DEFAULT_DT);
    for (let i = 0; i < steps; i += 1) stepOnce();
    state.playing = false;
  }
  drawAll();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, r_ap: state.r_ap, L: state.L };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let accumulator   = 0;

function tick(now) {
  if (!state.playing) {
    lastFrameTime = now;
    requestAnimationFrame(tick);
    return;
  }
  const frameDt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  accumulator += frameDt;
  let safety = 0;
  while (accumulator >= DEFAULT_DT && safety < 240) {
    stepOnce();
    accumulator -= DEFAULT_DT;
    safety += 1;
  }
  drawAll();
  updateReadouts();
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
