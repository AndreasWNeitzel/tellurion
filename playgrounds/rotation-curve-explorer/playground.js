// playground.js
// Top-down rotating spiral galaxy. Tracer stars are advanced by omega(R) for
// the selected rotation-curve model. A rotation-curve inset plots v(R) for
// the three models against the synthetic observation set, so the user sees
// both the visual difference (galaxy spinning faster or slower at large R)
// and the quantitative gap that motivates dark matter.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  vModel, omegaModel,
  MODELS,
  syntheticObservations,
  chiSquared,
  buildGalaxy,
  galaxyAt,
  DATA_RADII, DATA_SIGMA,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');
const CAPTURE_MODEL  = urlParams.get('captureModel');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  model:    document.getElementById('readout-model'),
  t:        document.getElementById('readout-t'),
  vAt20:    document.getElementById('readout-vAt20'),
  chi2:     document.getElementById('readout-chi2'),
};
const radios       = Array.from(document.querySelectorAll('input[name="model"]'));
const btnReset     = document.getElementById('btn-reset');
const btnPause     = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;

// Galaxy panel occupies the upper portion (square area centered top).
// Rotation-curve subplot lies underneath, full-width.
const GAL  = { cx: 440, cy: 240, R: 220 };
const PLOT = { x: 80, y: 500, w: 760, h: 180, rmax: 30, vmax: 280 };

const state = {
  model:      'dm',
  t:          0,                            // Gyr
  paused:     false,
  rafId:      null,
  stars:      [],
  data:       [],
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
  accentWarm: cssVar('--accent-warm', '#C13B27'),
  cat1:    cssVar('--cat-1', '#4C72B0'),
  cat2:    cssVar('--cat-2', '#DD8452'),
  cat3:    cssVar('--cat-3', '#55A868'),
  grid:    cssVar('--grid', '#9A9C9F4D'),
};

const MODEL_COLOR = {
  rigid:   tokens.fgMuted,
  kepler:  tokens.cat2,
  visible: tokens.cat1,
  dm:      tokens.cat3,
};

function drawFivePointedStar(cx, cy, rOuter, fill, stroke) {
  const rInner = rOuter * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = (i % 2 === 0) ? rOuter : rInner;
    const a = -Math.PI / 2 + i * Math.PI / 5;       // top point first
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.0;
  ctx.stroke();
}

function pxGal(x, y) {
  // x, y in kpc; scale R = 25 kpc to the half-extent 220 px.
  const s = GAL.R / 25;
  return { px: GAL.cx + s * x, py: GAL.cy - s * y };
}

function pxPlot(R, v) {
  return {
    px: PLOT.x + (R / PLOT.rmax) * PLOT.w,
    py: PLOT.y + (1 - v / PLOT.vmax) * PLOT.h,
  };
}

function drawGalaxyPanel() {
  // Radial grid: 5, 10, 15, 20, 25 kpc.
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  for (const Rg of [5, 10, 15, 20, 25]) {
    const pr = (Rg / 25) * GAL.R;
    ctx.beginPath();
    ctx.arc(GAL.cx, GAL.cy, pr, 0, 2 * Math.PI);
    ctx.stroke();
  }
  // Solar-circle (8 kpc) dashed accent ring.
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(GAL.cx, GAL.cy, (8 / 25) * GAL.R, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  // star particles
  const snapshot = galaxyAt(state.stars, state.t, state.model);
  for (let i = 0; i < snapshot.length; i += 1) {
    const s = snapshot[i];
    const p = pxGal(s.x, s.y);
    if (s.kind === 'bulge') {
      ctx.fillStyle = tokens.accentWarm;
      ctx.beginPath();
      ctx.arc(p.px, p.py, 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = tokens.fg;
      ctx.beginPath();
      ctx.arc(p.px, p.py, 1.4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // R = 8 kpc highlight tracer: the Sun. Drawn as a five-pointed yellow star
  // with a dark outline. Per-model speed difference is visible by how quickly
  // it traverses its dashed orbit ring.
  const sunR = 8;
  const sunPhi = state.t * omegaModel(sunR, state.model);
  const sun = pxGal(sunR * Math.cos(sunPhi), sunR * Math.sin(sunPhi));
  drawFivePointedStar(sun.px, sun.py, 8, '#F2C641', tokens.fg);

  // top banner
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Top-down view: spiral galaxy out to R = 25 kpc. Dashed ring = solar circle (8 kpc). Yellow star = Sun.',
               20, 22);
}

function drawRotationCurveInset() {
  // Subplot underneath the galaxy. No grid. Dim fill so the boundary reads
  // without competing with the galaxy.
  ctx.fillStyle = 'rgba(15, 16, 18, 0.04)';
  ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
  ctx.strokeStyle = tokens.fgFaint;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

  // ticks
  ctx.fillStyle = tokens.fgFaint;
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const R of [0, 10, 20, 30]) {
    const { px: x } = pxPlot(R, 0);
    ctx.fillText(String(R), x, PLOT.y + PLOT.h + 13);
  }
  ctx.textAlign = 'right';
  for (const v of [0, 100, 200]) {
    const { py: y } = pxPlot(0, v);
    ctx.fillText(String(v), PLOT.x - 4, y + 3);
  }

  // model curves: paint all four. The selected curve gets a white glow halo
  // and a thicker stroke so it pops against the others.
  function drawCurve(model, color, lineWidth, glow) {
    ctx.beginPath();
    let first = true;
    for (let R = 0.5; R <= PLOT.rmax; R += 0.5) {
      const v = vModel(R, model);
      const { px: x, py: y } = pxPlot(R, Math.min(v, PLOT.vmax));
      if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
    }
    if (glow) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
      ctx.lineWidth = lineWidth + 2.5;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.30)';
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  for (const m of ['rigid', 'kepler', 'visible', 'dm']) {
    const isSel = (state.model === m);
    drawCurve(m, MODEL_COLOR[m], isSel ? 2.4 : 1.0, isSel);
  }

  // observed data points with error bars
  for (const d of state.data) {
    const c = pxPlot(d.R, d.v);
    const top = pxPlot(d.R, d.v + DATA_SIGMA);
    const bot = pxPlot(d.R, d.v - DATA_SIGMA);
    ctx.strokeStyle = tokens.fgMuted;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(c.px, top.py); ctx.lineTo(c.px, bot.py);
    ctx.stroke();
    ctx.fillStyle = tokens.fg;
    ctx.beginPath();
    ctx.arc(c.px, c.py, 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // axis labels: title above the box, x-axis along the bottom edge inside,
  // y-axis rotated to the left.
  ctx.fillStyle = tokens.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Rotation curve v(R)', PLOT.x + PLOT.w / 2, PLOT.y - 8);
  ctx.font = '10px "Inter", system-ui, sans-serif';
  ctx.fillStyle = tokens.fgFaint;
  ctx.fillText('R (kpc)', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 16);
  ctx.save();
  ctx.translate(PLOT.x - 36, PLOT.y + PLOT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('v (km/s)', 0, 0);
  ctx.restore();
}

function drawLegendAndReadout() {
  // legend at top-left of the canvas (above the galaxy)
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  const lx = 20;
  let ly = 60;
  const items = [
    { color: MODEL_COLOR.rigid,   label: 'Rigid-body (v proportional R)' },
    { color: MODEL_COLOR.kepler,  label: 'Keplerian (point mass)' },
    { color: MODEL_COLOR.visible, label: 'Visible matter only' },
    { color: MODEL_COLOR.dm,      label: 'Visible + dark matter' },
  ];
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.fillRect(lx, ly - 8, 14, 3);
    ctx.fillStyle = tokens.fg;
    ctx.fillText(it.label, lx + 22, ly);
    ly += 16;
  }

  // live readout overlay (top-right of canvas). Two-column layout: labels
  // left-aligned at xLabel, values right-aligned at xValue so the columns
  // stay flush as the model and numbers change.
  const v8 = vModel(8, state.model);
  const chi2 = chiSquared(state.model, state.data);
  const rows = [
    ['model',         state.model],
    ['t (Gyr)',       state.t.toFixed(3)],
    ['v(R=8) [km/s]', v8.toFixed(1)],
    ['chi^2',         chi2.toFixed(1)],
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tokens.fg;
  const xLabel = W - 160;
  const xValue = W - 16;
  let y = 20;
  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(label, xLabel, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, xValue, y);
    y += 14;
  }
}

function drawFrame() {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawGalaxyPanel();
  drawRotationCurveInset();
  drawLegendAndReadout();

  // DOM readouts mirror canvas
  readouts.model.textContent = MODELS[state.model].label;
  readouts.t.textContent     = state.t.toFixed(3);
  readouts.vAt20.textContent = vModel(20, state.model).toFixed(1);
  readouts.chi2.textContent  = chiSquared(state.model, state.data).toFixed(1);
}

// Animation: advance time at 0.0006 Gyr per rAF (~60 Hz -> 0.036 Gyr/sec, so
// the outer galaxy at R = 20 kpc with v_dm = 200 km/s -> omega = 10.2 rad/Gyr
// completes one orbit in ~17 sec on the screen. Inner orbits are faster.)
const DT_PER_FRAME = 0.0006;
const T_RESET_AT   = 2.5;             // Gyr, loop time

function tick() {
  if (state.paused) return;
  state.t += DT_PER_FRAME;
  if (state.t > T_RESET_AT) state.t = 0;
  drawFrame();
  state.rafId = requestAnimationFrame(tick);
}

function startAnim() {
  if (state.rafId !== null) cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(tick);
}

function pauseAnim() {
  state.paused = !state.paused;
  btnPause.textContent = state.paused ? 'Play' : 'Pause';
  if (!state.paused) startAnim();
}

function setModel(model) {
  state.model = model;
  // Reset time on model switch so the user sees the unwound IC under the new
  // rotation law. Without this, a switch from DM to rigid-body inherits the
  // already-wound DM angular positions, which would mislead the eye.
  state.t = 0;
  drawFrame();
}

for (const r of radios) {
  r.addEventListener('change', () => {
    if (r.checked) setModel(r.value);
  });
}

btnReset.addEventListener('click', () => {
  state.t = 0;
  drawFrame();
});

btnPause.addEventListener('click', pauseAnim);

function bootSync() {
  state.stars = buildGalaxy(SEED);
  state.data  = syntheticObservations(SEED);

  if (CAPTURE_NAME) {
    // Deterministic capture sweep: spans t in [0, 1.8] Gyr at a fixed model.
    // The captureModel query parameter switches the model so the golden set
    // can show all three side-by-side; default is 'dm' if missing.
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.model  = CAPTURE_MODEL ?? 'dm';
    state.t      = frac * 1.8;
    state.paused = true;
    for (const r of radios) r.checked = (r.value === state.model);
    drawFrame();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const detail = { capture: CAPTURE_NAME, seed: SEED, model: state.model, t: state.t };
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = detail;
        });
      });
    }
    return;
  }

  drawFrame();
  startAnim();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
