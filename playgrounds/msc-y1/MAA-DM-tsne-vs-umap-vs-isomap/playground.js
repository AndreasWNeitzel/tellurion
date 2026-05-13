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
  dataset: 'torus',
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

// Color points by their label.
function colorFor(label, dataset) {
  if (dataset === 'clusters-5d') {
    const palette = ['#4C72B0', '#DD8452', '#55A868', '#C44E52', '#8172B2'];
    return palette[Math.round(label) % palette.length];
  }
  if (dataset === 'hopf-link') {
    // Two-ring categorical with intra-ring hue ramp.
    const ringA = label < 1;
    const t = ringA ? label : label - 1;     // [0, 1)
    const baseHue = ringA ? 210 : 30;
    const h = (baseHue + 60 * t) % 360;
    return `hsl(${h.toFixed(0)}, 80%, 50%)`;
  }
  if (dataset === 'torus') {
    // Hue ramp along the toroidal angle theta in [0, 2 pi).
    const t = label / (2 * Math.PI);
    const h = (220 + 300 * t) % 360;
    return `hsl(${h.toFixed(0)}, 75%, 50%)`;
  }
  return '#69a8d6';
}

function drawRaw() {
  const p = PANEL.raw;
  ctx.fillStyle = tok.surface; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = tok.fgFaint; ctx.lineWidth = 0.6;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = tok.fgMuted;
  ctx.font = '12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  const dimLabel = state.data ? `${state.data.D}D` : 'data';
  ctx.fillText(`Original ${dimLabel} data (rotating)`, p.x + 8, p.y - 6);
  if (!state.data) return;
  const { X, N, D } = state.data;
  // Project to 2D via a slowly rotating camera so the user can see the 3D
  // (or higher-D) structure. For D > 3 we fold extra dimensions into the
  // vertical axis with a small coefficient so noise dims smear the points
  // visibly along y.
  const phi = state.rotPhi || 0;
  const cP = Math.cos(phi), sP = Math.sin(phi);
  const us = new Float64Array(N), vs = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const x = X[i * D];
    const y = D >= 2 ? X[i * D + 1] : 0;
    const z = D >= 3 ? X[i * D + 2] : 0;
    const u = x * cP - z * sP;
    let v = y;
    if (D > 3) {
      let extra = 0;
      for (let d = 3; d < D; d += 1) extra += X[i * D + d];
      v = y + 0.35 * extra;
    }
    us[i] = u; vs[i] = v;
  }
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
  for (let i = 0; i < N; i += 1) {
    if (us[i] < umin) umin = us[i]; if (us[i] > umax) umax = us[i];
    if (vs[i] < vmin) vmin = vs[i]; if (vs[i] > vmax) vmax = vs[i];
  }
  const pad = 0.05 * Math.max(umax - umin, vmax - vmin, 1e-9);
  umin -= pad; umax += pad; vmin -= pad; vmax += pad;
  for (let i = 0; i < N; i += 1) {
    const cx = p.x + (us[i] - umin) / (umax - umin) * p.w;
    const cy = p.y + (1 - (vs[i] - vmin) / (vmax - vmin)) * p.h;
    ctx.fillStyle = colorFor(state.data.labels[i], state.dataset);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.4, 0, 2 * Math.PI);
    ctx.fill();
  }
  // small axis tripod in the corner
  const cx0 = p.x + p.w - 38, cy0 = p.y + 30, L = 20;
  function drawAxis(dx, dz, color, label) {
    const u = dx * cP - dz * sP;
    const ex = cx0 + u * L, ey = cy0;
    ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = color; ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(label, ex + 2, ey - 2);
  }
  drawAxis(1, 0, 'rgba(193,59,39,0.9)',  'x');
  drawAxis(0, 1, 'rgba(76,114,176,0.9)', 'z');
  ctx.strokeStyle = 'rgba(85,168,104,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0, cy0 - L); ctx.stroke();
  ctx.fillStyle = 'rgba(85,168,104,0.9)';
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('y', cx0 + 2, cy0 - L - 2);
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
  selDataset.value = 'torus';
  sliderN.value = '300'; sliderK.value = '8'; sliderPerp.value = '30';
  applyControls();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Sweep through datasets: 0..1/3 torus, 1/3..2/3 hopf-link, rest clusters-5d.
    if (frac < 1 / 3)       state.dataset = 'torus';
    else if (frac < 2 / 3)  state.dataset = 'hopf-link';
    else                    state.dataset = 'clusters-5d';
    selDataset.value = state.dataset;
    state.N = 200; state.k = 8; state.perplexity = 25;
    state.rotPhi = frac * 2 * Math.PI;
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

// rotate the 3D data panel slowly so the user sees that it really is 3D
state.rotPhi = 0.0;
let rotPaused = false;
const btnPlayPause = document.getElementById('btn-playpause');
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    rotPaused = !rotPaused;
    btnPlayPause.textContent = rotPaused ? 'Resume rotation' : 'Pause rotation';
  });
}
function rotateTick() {
  if (!rotPaused && !CAPTURE_NAME) {
    state.rotPhi += 0.006;
    drawAll();
  }
  requestAnimationFrame(rotateTick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(rotateTick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(rotateTick);
}
