// playground.js
// Mandelbrot rainbow explorer with auto-zoom. The user clicks anywhere to
// recenter; the auto-zoom button drives a geometric width decrease at every
// frame until the double-precision floor is reached. Rendering is done at
// half-resolution during auto-zoom so frame time stays under 16 ms; the
// final paint at rest is full resolution.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { escapeTime, maxIterForWidth, ZOOM_TARGETS, DEFAULT_MAX_ITER } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readouts     = {
  cr:       document.getElementById('readout-cr'),
  ci:       document.getElementById('readout-ci'),
  width:    document.getElementById('readout-width'),
  zoom:     document.getElementById('readout-zoom'),
  iter:     document.getElementById('readout-iter'),
  maxIter:  document.getElementById('readout-maxIter'),
};
const btnAutoZoom  = document.getElementById('btn-autozoom');
const btnZoomOut   = document.getElementById('btn-zoomout');
const btnReset     = document.getElementById('btn-reset');
const selPreset    = document.getElementById('preset-target');

const W = canvas.width, H = canvas.height;
const ASPECT = H / W;

const state = {
  cx: -0.5,
  cy: 0,
  width: 3.5,
  maxIter: 256,
  autoZoom: false,
  // The exponential-zoom factor per frame. width *= ZOOM_PER_FRAME until
  // the floor (~ 1e-13, a hair above double-precision noise).
  zoomFactor: 0.97,
  zoomFloor: 1e-13,
  rafId: null,
  hover: null,
  // The rainbow palette is precomputed at 1024 hues for speed.
  palette: null,
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
  grid:    cssVar('--grid', '#9A9C9F4D'),
};

// HSL -> RGB. Pure function, no allocations.
function hslToRgb(h, s, l) {
  // h, s, l in [0, 1]
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function buildPalette() {
  // 1024 entries with hue cycling and lightness modulation. Hue wraps a full
  // cycle every PALETTE_LEN / 32 entries; lightness sinusoid every 16. The
  // combination gives the classic "rainbow contour band" look without being
  // a default rainbow ramp (waiver documented in spec.md).
  const N = 1024;
  const palette = new Uint8Array(N * 4);
  for (let i = 0; i < N; i += 1) {
    const t = i / N;
    const hue   = (t * 4) % 1;              // 4 full hue cycles across the palette
    const light = 0.50 + 0.22 * Math.sin(i * 0.20);
    const sat   = 0.85;
    const [r, g, b] = hslToRgb(hue, sat, light);
    palette[i * 4]     = r;
    palette[i * 4 + 1] = g;
    palette[i * 4 + 2] = b;
    palette[i * 4 + 3] = 255;
  }
  return palette;
}

function paletteColor(mu) {
  // mu is a continuous escape time; map it into the precomputed palette.
  // Use log scale so deep-iteration features still resolve.
  const t = Math.log2(1 + mu) * 0.10;       // ~ one full hue cycle per ~ doubling
  const idx = (Math.floor(t * 1024) % 1024 + 1024) % 1024;
  return idx * 4;
}

function render(downsample) {
  const step = downsample;
  const palette = state.palette;
  const setR = 6, setG = 6, setB = 8;       // near-black for set members
  const Wp = Math.ceil(W / step);
  const Hp = Math.ceil(H / step);
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const dx = state.width / W;
  const dy = state.width * ASPECT / H;
  const cx0 = state.cx - state.width / 2;
  const cy0 = state.cy + state.width * ASPECT / 2;
  const maxIter = state.maxIter;

  for (let py = 0; py < Hp; py += 1) {
    const ci = cy0 - (py * step) * dy - 0.5 * step * dy;
    for (let px = 0; px < Wp; px += 1) {
      const cr = cx0 + (px * step) * dx + 0.5 * step * dx;
      const { mu } = escapeTime(cr, ci, maxIter);
      let r, g, b;
      if (mu >= maxIter) {
        r = setR; g = setG; b = setB;
      } else {
        const pIdx = paletteColor(mu);
        r = palette[pIdx];
        g = palette[pIdx + 1];
        b = palette[pIdx + 2];
      }
      // Splat this colour across a step x step block.
      for (let qy = 0; qy < step; qy += 1) {
        const yy = py * step + qy;
        if (yy >= H) break;
        for (let qx = 0; qx < step; qx += 1) {
          const xx = px * step + qx;
          if (xx >= W) break;
          const idx = (yy * W + xx) * 4;
          data[idx]     = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawOverlay() {
  // hover crosshair
  if (state.hover) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(state.hover.px - 12, state.hover.py);
    ctx.lineTo(state.hover.px + 12, state.hover.py);
    ctx.moveTo(state.hover.px, state.hover.py - 12);
    ctx.lineTo(state.hover.px, state.hover.py + 12);
    ctx.stroke();
  }
  // top-left title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.80)';
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Mandelbrot set. Click to recenter; auto-zoom drives into the click point.', 12, 18);

  // top-right readout overlay
  const zoom = 3.5 / state.width;
  const lines = [
    `Re c    ${state.cx.toFixed(10)}`,
    `Im c    ${state.cy.toFixed(10)}`,
    `width   ${state.width.toExponential(3)}`,
    `zoom    ${zoom.toExponential(2)}`,
    `maxIter ${String(state.maxIter).padStart(6)}`,
  ];
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  let y = 20;
  for (const line of lines) {
    ctx.fillText(line, W - 12, y);
    y += 14;
  }
}

function updateReadouts() {
  const zoom = 3.5 / state.width;
  readouts.cr.textContent      = state.cx.toFixed(10);
  readouts.ci.textContent      = state.cy.toFixed(10);
  readouts.width.textContent   = state.width.toExponential(3);
  readouts.zoom.textContent    = zoom.toExponential(2);
  readouts.maxIter.textContent = String(state.maxIter);
  if (state.hover) {
    readouts.iter.textContent = state.hover.iter === state.maxIter ? `${state.maxIter} (set)` : String(state.hover.iter);
  } else {
    readouts.iter.textContent = 'NA';
  }
}

function refresh(downsample = 1) {
  state.maxIter = maxIterForWidth(state.width);
  render(downsample);
  drawOverlay();
  updateReadouts();
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const ev   = evt.touches ? evt.touches[0] : evt;
  const sx   = canvas.width  / rect.width;
  const sy   = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

function pixelToC(p) {
  const cr = state.cx + (p.x / W - 0.5) * state.width;
  const ci = state.cy + (0.5 - p.y / H) * state.width * ASPECT;
  return { cr, ci };
}

canvas.addEventListener('pointermove', (e) => {
  const p = canvasPos(e);
  const { cr, ci } = pixelToC(p);
  const r = escapeTime(cr, ci, state.maxIter);
  state.hover = { px: p.x, py: p.y, iter: r.iter };
  drawOverlay();   // overlay only; do not re-render the fractal
  updateReadouts();
});
canvas.addEventListener('pointerleave', () => {
  state.hover = null;
  drawOverlay();
  updateReadouts();
});
canvas.addEventListener('pointerdown', (e) => {
  if (state.autoZoom) return;            // ignore clicks during auto-zoom
  const p = canvasPos(e);
  const { cr, ci } = pixelToC(p);
  state.cx = cr;
  state.cy = ci;
  refresh(1);
  e.preventDefault();
});

function stopAutoZoom() {
  state.autoZoom = false;
  if (state.rafId !== null) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  btnAutoZoom.textContent = 'Auto-zoom';
  refresh(1);
}

function startAutoZoom() {
  state.autoZoom = true;
  btnAutoZoom.textContent = 'Stop zoom';
  const tick = () => {
    if (!state.autoZoom) return;
    state.width *= state.zoomFactor;
    if (state.width < state.zoomFloor) {
      stopAutoZoom();
      return;
    }
    refresh(2);                          // half-resolution during zoom
    state.rafId = requestAnimationFrame(tick);
  };
  state.rafId = requestAnimationFrame(tick);
}

btnAutoZoom.addEventListener('click', () => {
  if (state.autoZoom) stopAutoZoom();
  else startAutoZoom();
});

btnZoomOut.addEventListener('click', () => {
  if (state.autoZoom) return;
  state.width = Math.min(3.5, state.width * 2);
  refresh(1);
});

btnReset.addEventListener('click', () => {
  stopAutoZoom();
  state.cx = -0.5;
  state.cy = 0;
  state.width = 3.5;
  refresh(1);
});

selPreset.addEventListener('change', () => {
  const key = selPreset.value;
  if (key === '' ) return;
  const target = ZOOM_TARGETS[key];
  if (!target) return;
  stopAutoZoom();
  state.cx = target.cx;
  state.cy = target.cy;
  state.width = 0.005;                   // start already zoomed in
  refresh(1);
});

function bootSync() {
  state.palette = buildPalette();

  if (CAPTURE_NAME) {
    // Deterministic capture: an exponential zoom into Seahorse Valley while
    // the view stays centered on the target throughout. t-000 shows the full
    // set centered on the seahorse target; t-100 is a deep zoom (width 6e-5).
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const TARGET = ZOOM_TARGETS.seahorse;
    const wStart = 3.5, wEnd = 6e-5;
    state.width = wStart * Math.pow(wEnd / wStart, frac);
    state.cx = TARGET.cx;
    state.cy = TARGET.cy;
    refresh(1);
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const detail = { capture: CAPTURE_NAME, seed: SEED, width: state.width };
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = detail;
        });
      });
    }
    return;
  }

  refresh(1);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
