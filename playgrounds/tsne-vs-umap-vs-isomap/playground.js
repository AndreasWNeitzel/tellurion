// playground.js
// 2x2 grid: original 3D dataset (top-down view) plus three 2D embeddings.

import { DATASETS, pca, isomap, tsne } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas        = document.getElementById('stage');
const ctx           = canvas.getContext('2d', { alpha: false });
const selDataset    = document.getElementById('select-dataset');
const sliderN       = document.getElementById('slider-N');
const sliderK       = document.getElementById('slider-k');
const sliderPerp    = document.getElementById('slider-perp');
const valueN        = document.getElementById('value-N');
const valueK        = document.getElementById('value-k');
const valuePerp     = document.getElementById('value-perp');
const btnRecompute  = document.getElementById('btn-recompute');
const btnReset      = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PANEL = {
  raw:    { x: 30,  y: 30, w: 410, h: 280 },
  pca:    { x: 470, y: 30, w: 410, h: 280 },
  isomap: { x: 30,  y: 330, w: 410, h: 280 },
  tsne:   { x: 470, y: 330, w: 410, h: 280 },
};

const state = {
  dataset: 'swiss-roll',
  N: 300,
  k: 8,
  perplexity: 30,
  data: null,
  embeddings: null,
  computing: false,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  bg: cssVar('--bg', '#FBFBF9'),
  surface: cssVar('--surface', '#FFFFFF'),
  fg: cssVar('--fg', '#1A1B1C'),
  fgMuted: cssVar('--fg-muted', '#5C5E61'),
  fgFaint: cssVar('--fg-faint', '#9A9C9F'),
  accent: cssVar('--accent', '#1B6CA8'),
};

// Color points by their label using a hue ramp (viridis-like) for swiss-roll
// and two-color categorical for two-blobs.
function colorFor(label, dataset) {
  if (dataset === 'two-blobs') {
    return label === 0 ? '#4C72B0' : '#DD8452';
  }
  // hue ramp by t parameter
  const t = (label - 1.5 * Math.PI) / (3 * Math.PI);
  const h = (220 + 200 * t) % 360;
  return `hsl(${h.toFixed(0)}, 70%, 50%)`;
}

function drawRaw() {
  const p = PANEL.raw;
  ctx.fillStyle = tok.surface; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.6;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Original 3D data (top-down view)', p.x + 8, p.y - 6);
  if (!state.data) return;
  // Compute bounds
  const X = state.data.X;
  let mx = Infinity, MX = -Infinity, mz = Infinity, MZ = -Infinity;
  for (let i = 0; i < state.data.N; i += 1) {
    const x = X[i * 3], z = X[i * 3 + 2];
    if (x < mx) mx = x; if (x > MX) MX = x;
    if (z < mz) mz = z; if (z > MZ) MZ = z;
  }
  const pad = 0.05 * Math.max(MX - mx, MZ - mz);
  mx -= pad; MX += pad; mz -= pad; MZ += pad;
  for (let i = 0; i < state.data.N; i += 1) {
    const x = X[i * 3], z = X[i * 3 + 2];
    const cx = p.x + ((x - mx) / (MX - mx)) * p.w;
    const cy = p.y + (1 - (z - mz) / (MZ - mz)) * p.h;
    ctx.fillStyle = colorFor(state.data.labels[i], state.dataset);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawEmbedding(p, Y, title) {
  ctx.fillStyle = tok.surface; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.6;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, p.x + 8, p.y - 6);
  if (!Y || !state.data) {
    ctx.fillStyle = tok.fgFaint;
    ctx.textAlign = 'center';
    ctx.fillText('computing...', p.x + p.w / 2, p.y + p.h / 2);
    return;
  }
  let mx = Infinity, MX = -Infinity, mz = Infinity, MZ = -Infinity;
  for (let i = 0; i < state.data.N; i += 1) {
    const x = Y[i * 2], z = Y[i * 2 + 1];
    if (x < mx) mx = x; if (x > MX) MX = x;
    if (z < mz) mz = z; if (z > MZ) MZ = z;
  }
  const pad = 0.05 * Math.max(MX - mx, MZ - mz, 1e-9);
  mx -= pad; MX += pad; mz -= pad; MZ += pad;
  for (let i = 0; i < state.data.N; i += 1) {
    const x = Y[i * 2], z = Y[i * 2 + 1];
    const cx = p.x + ((x - mx) / (MX - mx)) * p.w;
    const cy = p.y + (1 - (z - mz) / (MZ - mz)) * p.h;
    ctx.fillStyle = colorFor(state.data.labels[i], state.dataset);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawAll() {
  ctx.fillStyle = tok.bg; ctx.fillRect(0, 0, W, H);
  drawRaw();
  drawEmbedding(PANEL.pca,    state.embeddings ? state.embeddings.pca    : null, 'PCA (linear)');
  drawEmbedding(PANEL.isomap, state.embeddings ? state.embeddings.isomap : null, 'Isomap');
  drawEmbedding(PANEL.tsne,   state.embeddings ? state.embeddings.tsne   : null, 't-SNE');
}

function computeAll() {
  const factory = DATASETS[state.dataset];
  state.data = factory({ N: state.N, seed: 0xC0FFEE });
  state.embeddings = null;
  drawAll();
  // Defer heavy compute to a microtask so the spinner renders.
  setTimeout(() => {
    const { X, N, D } = state.data;
    const e = {};
    e.pca    = pca(X, N, D);
    drawAll();
  }, 10);
  setTimeout(() => {
    const { X, N, D } = state.data;
    state.embeddings = state.embeddings ?? {};
    state.embeddings.pca = state.embeddings.pca ?? pca(X, N, D);
    state.embeddings.isomap = isomap(X, N, D, state.k);
    drawAll();
  }, 60);
  setTimeout(() => {
    const { X, N, D } = state.data;
    state.embeddings = state.embeddings ?? {};
    state.embeddings.tsne = tsne(X, N, D, { perplexity: state.perplexity, nIter: 250 });
    drawAll();
  }, 120);
}

function applyControls() {
  state.dataset    = selDataset.value;
  state.N          = parseInt(sliderN.value, 10);
  state.k          = parseInt(sliderK.value, 10);
  state.perplexity = parseInt(sliderPerp.value, 10);
  valueN.textContent    = String(state.N);
  valueK.textContent    = String(state.k);
  valuePerp.textContent = String(state.perplexity);
  computeAll();
}
[selDataset, sliderN, sliderK, sliderPerp].forEach(s => s.addEventListener('change', applyControls));
btnRecompute.addEventListener('click', applyControls);
btnReset.addEventListener('click', () => {
  selDataset.value = 'swiss-roll';
  sliderN.value = '300'; sliderK.value = '8'; sliderPerp.value = '30';
  applyControls();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.dataset = frac < 0.5 ? 'swiss-roll' : 'two-blobs';
    selDataset.value = state.dataset;
    state.N = 200; state.k = 8; state.perplexity = 25;
    // Run all three synchronously so the capture is deterministic at draw time.
    const factory = DATASETS[state.dataset];
    state.data = factory({ N: state.N, seed: 0xC0FFEE });
    state.embeddings = {
      pca:    pca(state.data.X, state.data.N, state.data.D),
      isomap: isomap(state.data.X, state.data.N, state.data.D, state.k),
      tsne:   tsne(state.data.X, state.data.N, state.data.D, { perplexity: state.perplexity, nIter: 200 }),
    };
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME };
        });
      });
    }
    return;
  }
  applyControls();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
