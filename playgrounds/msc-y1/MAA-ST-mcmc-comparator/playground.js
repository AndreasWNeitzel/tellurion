// playground.js
// MCMC Sampler Comparator. Three chains run on a chosen 2D target. Each frame
// advances all three by SAMPLES_PER_FRAME steps and re-draws the contour map
// of the target with the chains' accepted-state trails overlaid.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createChain, TARGETS, ks1D, normCdf,
} from '../../../shared/js/engine/mcmc-harness.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selTarget    = document.getElementById('select-target');
const selA         = document.getElementById('select-a');
const selB         = document.getElementById('select-b');
const selC         = document.getElementById('select-c');
const sliderL      = document.getElementById('slider-L');
const sliderN      = document.getElementById('slider-N');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

// Slower default + shorter trail so each chain stays readable; the first
// subplot used to smear because three chains painted thousands of samples
// on top of each other every frame.
const SAMPLES_PER_FRAME = 3;
const WARMUP = 200;
const TRAIL_MAX = 400;            // tight cap: only last 400 accepted states

const PLOT  = { x: 30, y: 40, w: 540, h: 430, xmin: -6, xmax: 6, ymin: -4, ymax: 4 };
const PANEL = { x: 600, y: 40, w: 260, h: 430 };

const state = {
  targetName: 'banana',
  samplers:   ['rwm', 'mala', 'hmc'],
  chains:     null,
  traces:     null,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  rafId:      null,
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  bg:        cssVar('--bg', '#FBFBF9'),
  surface:   cssVar('--surface', '#FFFFFF'),
  fg:        cssVar('--fg', '#1A1B1C'),
  fgMuted:   cssVar('--fg-muted', '#5C5E61'),
  fgFaint:   cssVar('--fg-faint', '#9A9C9F'),
  cat1:      cssVar('--cat-1', '#4C72B0'),
  cat2:      cssVar('--cat-2', '#DD8452'),
  cat3:      cssVar('--cat-3', '#55A868'),
  grid:      cssVar('--grid', '#9A9C9F4D'),
};
const COLORS = [tokens.cat1, tokens.cat2, tokens.cat3];
const SAMPLER_LABEL = { rwm: 'RWM', 'adaptive-rwm': 'AdaptRWM', mala: 'MALA', hmc: 'HMC' };

function defaultParams(method) {
  switch (method) {
    case 'rwm':          return { sigma: 1.2 };
    case 'adaptive-rwm': return { sigma: 1.0, warmup: 200 };
    case 'mala':         return { stepSize: 0.5 };
    case 'hmc':          return { stepSize: 0.15, nLeapfrog: parseInt(sliderL.value, 10) };
    default: throw new Error(method);
  }
}

function buildTarget() {
  return TARGETS[state.targetName]();
}

function buildChains() {
  const target = buildTarget();
  state.chains = state.samplers.map((m, i) => createChain({
    method: m, target, x0: [0, 0],
    params: defaultParams(m),
    seed: SEED ^ (i * 0x9E37),
  }));
  state.traces = state.samplers.map(() => []);
}

function pxPlot(x, y) {
  return {
    px: PLOT.x + (x - PLOT.xmin) / (PLOT.xmax - PLOT.xmin) * PLOT.w,
    py: PLOT.y + (1 - (y - PLOT.ymin) / (PLOT.ymax - PLOT.ymin)) * PLOT.h,
  };
}

function drawContours() {
  const target = buildTarget();
  const GRID = 90;
  const xs = new Float64Array(GRID);
  const ys = new Float64Array(GRID);
  for (let i = 0; i < GRID; i += 1) {
    xs[i] = PLOT.xmin + (i + 0.5) / GRID * (PLOT.xmax - PLOT.xmin);
    ys[i] = PLOT.ymin + (i + 0.5) / GRID * (PLOT.ymax - PLOT.ymin);
  }
  const lp = new Float64Array(GRID * GRID);
  let lpMax = -Infinity, lpMin = Infinity;
  const tmp = [0, 0];
  for (let j = 0; j < GRID; j += 1) {
    for (let i = 0; i < GRID; i += 1) {
      tmp[0] = xs[i]; tmp[1] = ys[j];
      const v = target.logProb(tmp);
      lp[j * GRID + i] = v;
      if (v > lpMax) lpMax = v;
      if (v < lpMin) lpMin = v;
    }
  }
  const cellW = PLOT.w / GRID;
  const cellH = PLOT.h / GRID;
  for (let j = 0; j < GRID; j += 1) {
    for (let i = 0; i < GRID; i += 1) {
      const t = (lp[j * GRID + i] - lpMin) / Math.max(1e-12, lpMax - lpMin);
      const alpha = 0.10 + 0.55 * t;
      ctx.fillStyle = `rgba(26, 27, 28, ${alpha.toFixed(3)})`;
      const p0 = pxPlot(xs[i] - 0.5 * (PLOT.xmax - PLOT.xmin) / GRID,
                        ys[j] + 0.5 * (PLOT.ymax - PLOT.ymin) / GRID);
      ctx.fillRect(p0.px, p0.py, cellW + 1, cellH + 1);
    }
  }
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);
}

function drawTrails() {
  if (!state.traces) return;
  for (let i = 0; i < state.traces.length; i += 1) {
    const tr = state.traces[i];
    if (tr.length < 2) continue;
    // Fade trail per segment: older points are nearly invisible, newer ones
    // bright. Stops the contour plot from becoming one solid smear.
    const rgb = hexToRgb(COLORS[i]);
    ctx.lineWidth = 1.0;
    for (let k = 1; k < tr.length; k += 1) {
      const a = tr[k - 1], b = tr[k];
      const fade = k / tr.length;                  // 0 (oldest) -> 1 (newest)
      const alpha = (0.04 + 0.70 * fade).toFixed(3);
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
      ctx.beginPath();
      const pa = pxPlot(a.x, a.y);
      const pb = pxPlot(b.x, b.y);
      ctx.moveTo(pa.px, pa.py); ctx.lineTo(pb.px, pb.py);
      ctx.stroke();
    }
    const last = tr[tr.length - 1];
    const lp = pxPlot(last.x, last.y);
    ctx.fillStyle = COLORS[i];
    ctx.beginPath();
    ctx.arc(lp.px, lp.py, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
}

function hexToRgb(hex) {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function drawDiagnosticsPanel() {
  ctx.fillStyle = 'rgba(251, 251, 249, 0.92)';
  ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PANEL.x + 0.5, PANEL.y + 0.5, PANEL.w - 1, PANEL.h - 1);

  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tokens.fgMuted;
  ctx.textAlign = 'left';
  ctx.fillText('Per-chain trace of x[0]', PANEL.x + 12, PANEL.y + 16);

  const target = buildTarget();
  const rowH = (PANEL.h - 40) / state.chains.length;
  for (let i = 0; i < state.chains.length; i += 1) {
    const top = PANEL.y + 30 + i * rowH;
    const plot = { x: PANEL.x + 12, y: top + 18, w: PANEL.w - 24, h: rowH - 30 };
    // mini trace plot of the last TRAIL_MAX samples' x coordinate
    const tr = state.traces[i];
    const chain = state.chains[i];
    const n = tr.length;
    // y-range from the contour panel for consistency
    const ymin = PLOT.ymin, ymax = PLOT.ymax;
    // background
    ctx.fillStyle = 'rgba(26, 27, 28, 0.04)';
    ctx.fillRect(plot.x, plot.y, plot.w, plot.h);
    ctx.strokeStyle = tokens.fgFaint;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, plot.w - 1, plot.h - 1);
    // zero line
    const yZero = plot.y + (1 - (0 - ymin) / (ymax - ymin)) * plot.h;
    ctx.strokeStyle = tokens.fgFaint;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(plot.x, yZero); ctx.lineTo(plot.x + plot.w, yZero);
    ctx.stroke();
    // trace line
    if (n >= 2) {
      ctx.strokeStyle = COLORS[i];
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      const stride = Math.max(1, Math.floor(n / plot.w));
      let first = true;
      for (let k = 0; k < n; k += stride) {
        const xv = plot.x + (k / n) * plot.w;
        const yv = plot.y + (1 - (tr[k].x - ymin) / (ymax - ymin)) * plot.h;
        if (first) { ctx.moveTo(xv, yv); first = false; } else { ctx.lineTo(xv, yv); }
      }
      ctx.stroke();
    }
    // sampler label + acceptance + ESS
    ctx.fillStyle = COLORS[i];
    ctx.beginPath();
    ctx.arc(plot.x + 5, top + 9, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = '11px "Inter", system-ui, sans-serif';
    ctx.fillStyle = tokens.fg;
    ctx.textAlign = 'left';
    ctx.fillText(SAMPLER_LABEL[state.samplers[i]], plot.x + 14, top + 13);

    // metrics on the right edge
    let essStr = '', ksStr = '';
    if (n > WARMUP + 50) {
      const postN = Math.min(n - WARMUP, 4000);
      const flat = new Float64Array(postN * 2);
      for (let k = 0; k < postN; k += 1) {
        flat[k * 2]     = tr[n - postN + k].x;
        flat[k * 2 + 1] = tr[n - postN + k].y;
      }
      const d = chain.diagnostics(flat);
      essStr = `ess=${d.ess[0].toFixed(0)}`;
      if (target.name === 'gaussian2d') {
        const cols = new Float64Array(postN);
        for (let k = 0; k < postN; k += 1) cols[k] = flat[k * 2];
        ksStr = `KS=${ks1D(cols, x => normCdf(x, 0, 1)).toFixed(3)}`;
      }
    } else {
      essStr = `burn ${n}/${WARMUP}`;
    }
    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = tokens.fgMuted;
    const metricStr = `acc ${(100 * chain.acceptance).toFixed(0)}%  ${essStr}` + (ksStr ? `  ${ksStr}` : '');
    ctx.fillText(metricStr, plot.x + plot.w - 4, top + 13);
  }

  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tokens.fgMuted;
  ctx.fillText(`target = ${state.targetName}`, PANEL.x + 12, PANEL.y + PANEL.h - 12);
}

function drawAll() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawContours();
  drawTrails();
  drawDiagnosticsPanel();
}

function tickN(nSamples) {
  if (!state.chains) return;
  for (let i = 0; i < state.chains.length; i += 1) {
    const chain = state.chains[i];
    const tr = state.traces[i];
    for (let s = 0; s < nSamples; s += 1) {
      chain.step();
      tr.push({ x: chain.x[0], y: chain.x[1] });
      if (tr.length > TRAIL_MAX) tr.shift();
    }
  }
}

function applyControls() {
  state.targetName = selTarget.value;
  state.samplers   = [selA.value, selB.value, selC.value];
  buildChains();
  drawAll();
}

for (const el of [selTarget, selA, selB, selC]) {
  el.addEventListener('change', applyControls);
}
sliderL.addEventListener('change', () => { applyControls(); });
sliderN.addEventListener('change', () => { /* no-op for live mode */ });

btnReset.addEventListener('click', applyControls);
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
});

function bootSync() {
  buildChains();

  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.samplers = ['rwm', 'mala', 'hmc'];
    selA.value = 'rwm'; selB.value = 'mala'; selC.value = 'hmc';
    selTarget.value = 'banana';
    state.targetName = 'banana';
    buildChains();
    const totalSamples = Math.max(200, Math.round(frac * 5000));
    tickN(totalSamples);
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
    tickN(SAMPLES_PER_FRAME);
    drawAll();
  }
  state.rafId = requestAnimationFrame(tick);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
