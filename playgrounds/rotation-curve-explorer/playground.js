// playground.js
// Rotation curve explorer UI. Plots the rotation curve and three component
// contributions with the synthetic data points and a live chi^2 readout.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  vBulge2, vDisk2, vHalo2,
  syntheticData, chiSquared,
  TRUE_PARAMS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  Mb:    document.getElementById('readout-Mb'),
  Md:    document.getElementById('readout-Md'),
  M200:  document.getElementById('readout-M200'),
  c:     document.getElementById('readout-c'),
  chi2:  document.getElementById('readout-chi2'),
  redChi2: document.getElementById('readout-redchi2'),
};
const sliders = {
  Mb:   document.getElementById('slider-Mb'),
  Md:   document.getElementById('slider-Md'),
  M200: document.getElementById('slider-M200'),
  c:    document.getElementById('slider-c'),
};
const sliderValues = {
  Mb:   document.getElementById('value-Mb'),
  Md:   document.getElementById('value-Md'),
  M200: document.getElementById('value-M200'),
  c:    document.getElementById('value-c'),
};
const btnReset = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PLOT = { x: 60, y: 30, w: 620, h: 400, rmin: 0, rmax: 60, vmin: 0, vmax: 320 };

const N_DATA_POINTS = 18;
const NUM_FREE = 4;
const data = syntheticData(SEED);

const state = {
  Mb:   TRUE_PARAMS.Mb,
  Md:   TRUE_PARAMS.Md,
  M200: TRUE_PARAMS.M200,
  c:    TRUE_PARAMS.c,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:      cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg:      cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent:  cssVar('--accent', '#1B6CA8'),
  cat1:    cssVar('--cat-1', '#4C72B0'),
  cat2:    cssVar('--cat-2', '#DD8452'),
  cat3:    cssVar('--cat-3', '#55A868'),
  grid:    cssVar('--grid', '#9A9C9F4D'),
};

function currentParams() {
  return {
    Mb: state.Mb, ab: TRUE_PARAMS.ab,
    Md: state.Md, ad: TRUE_PARAMS.ad, bd: TRUE_PARAMS.bd,
    M200: state.M200, c: state.c,
  };
}

function px(R, v) {
  return {
    px: PLOT.x + ((R - PLOT.rmin) / (PLOT.rmax - PLOT.rmin)) * PLOT.w,
    py: PLOT.y + (1 - (v - PLOT.vmin) / (PLOT.vmax - PLOT.vmin)) * PLOT.h,
  };
}

function drawCurve(color, vFn, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  let first = true;
  for (let R = PLOT.rmin + 0.05; R <= PLOT.rmax; R += 0.25) {
    const v = Math.sqrt(Math.max(vFn(R), 0));
    const { px: x, py: y } = px(R, v);
    if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
  }
  ctx.stroke();
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = tokens.surface;
  ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

  // grid
  ctx.beginPath();
  for (let R = 10; R <= 50; R += 10) {
    const { px: x } = px(R, 0);
    ctx.moveTo(x, PLOT.y); ctx.lineTo(x, PLOT.y + PLOT.h);
  }
  for (let v = 50; v <= 300; v += 50) {
    const { py: y } = px(0, v);
    ctx.moveTo(PLOT.x, y); ctx.lineTo(PLOT.x + PLOT.w, y);
  }
  ctx.stroke();

  // ticks
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const R of [0, 10, 20, 30, 40, 50, 60]) {
    const { px: x } = px(R, 0);
    ctx.fillText(String(R), x, PLOT.y + PLOT.h + 13);
  }
  ctx.textAlign = 'right';
  for (const v of [0, 100, 200, 300]) {
    const { py: y } = px(0, v);
    ctx.fillText(String(v), PLOT.x - 4, y + 3);
  }

  // component curves
  const p = currentParams();
  drawCurve(tokens.cat1, R => vBulge2(R, p.Mb, p.ab), 1.0);
  drawCurve(tokens.cat2, R => vDisk2(R, p.Md, p.ad, p.bd), 1.0);
  drawCurve(tokens.cat3, R => vHalo2(R, p.M200, p.c), 1.0);
  // total
  drawCurve(tokens.accent, R => {
    const total = vBulge2(R, p.Mb, p.ab) + vDisk2(R, p.Md, p.ad, p.bd) + vHalo2(R, p.M200, p.c);
    return total;
  }, 1.5);

  // data points with error bars
  ctx.fillStyle = tokens.fg;
  for (const d of data) {
    const c = px(d.R, d.v);
    // error bar
    const top = px(d.R, d.v + 4);
    const bot = px(d.R, d.v - 4);
    ctx.strokeStyle = tokens.fgMuted;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(c.px, top.py); ctx.lineTo(c.px, bot.py);
    ctx.stroke();
    // marker
    ctx.beginPath();
    ctx.arc(c.px, c.py, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // titles
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Rotation curve: bulge (cat-1), disk (cat-2), halo (cat-3), total (accent)', PLOT.x, PLOT.y - 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillText('R (kpc)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 26);
  ctx.save();
  ctx.translate(PLOT.x - 38, PLOT.y + PLOT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('v_circ (km/s)', 0, 0);
  ctx.restore();
}

function updateReadouts() {
  readouts.Mb.textContent   = state.Mb.toFixed(2);
  readouts.Md.textContent   = state.Md.toFixed(2);
  readouts.M200.textContent = state.M200.toFixed(2);
  readouts.c.textContent    = state.c.toFixed(1);
  const chi2 = chiSquared(currentParams(), data);
  readouts.chi2.textContent = chi2.toFixed(2);
  readouts.redChi2.textContent = (chi2 / (N_DATA_POINTS - NUM_FREE)).toFixed(2);
}

function applySliders() {
  state.Mb   = parseFloat(sliders.Mb.value);
  state.Md   = parseFloat(sliders.Md.value);
  state.M200 = parseFloat(sliders.M200.value);
  state.c    = parseFloat(sliders.c.value);
  sliderValues.Mb.textContent   = state.Mb.toFixed(2);
  sliderValues.Md.textContent   = state.Md.toFixed(2);
  sliderValues.M200.textContent = state.M200.toFixed(2);
  sliderValues.c.textContent    = state.c.toFixed(1);
  drawAll();
  updateReadouts();
}

for (const key of ['Mb', 'Md', 'M200', 'c']) {
  sliders[key].addEventListener('input', applySliders);
}

btnReset.addEventListener('click', () => {
  sliders.Mb.value   = TRUE_PARAMS.Mb.toString();
  sliders.Md.value   = TRUE_PARAMS.Md.toString();
  sliders.M200.value = TRUE_PARAMS.M200.toString();
  sliders.c.value    = TRUE_PARAMS.c.toString();
  applySliders();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.Mb   = TRUE_PARAMS.Mb;
    state.Md   = TRUE_PARAMS.Md;
    state.M200 = 0.3 + frac * (5.0 - 0.3);
    state.c    = TRUE_PARAMS.c;
    sliders.Mb.value   = state.Mb.toString();
    sliders.Md.value   = state.Md.toString();
    sliders.M200.value = state.M200.toString();
    sliders.c.value    = state.c.toString();
    sliderValues.Mb.textContent   = state.Mb.toFixed(2);
    sliderValues.Md.textContent   = state.Md.toFixed(2);
    sliderValues.M200.textContent = state.M200.toFixed(2);
    sliderValues.c.textContent    = state.c.toFixed(1);
  } else {
    state.Mb   = parseFloat(sliders.Mb.value);
    state.Md   = parseFloat(sliders.Md.value);
    state.M200 = parseFloat(sliders.M200.value);
    state.c    = parseFloat(sliders.c.value);
    sliderValues.Mb.textContent   = state.Mb.toFixed(2);
    sliderValues.Md.textContent   = state.Md.toFixed(2);
    sliderValues.M200.textContent = state.M200.toFixed(2);
    sliderValues.c.textContent    = state.c.toFixed(1);
  }
  drawAll();
  updateReadouts();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
