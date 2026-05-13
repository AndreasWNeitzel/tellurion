// playground.js
// Chirikov standard map phase portrait. Each color is one orbit, traced
// from a different starting (theta_0, p_0). The K slider controls how
// strongly the periodic kick perturbs free rotation. At K = 0 the
// horizontal lines p = const are invariant; past K_crit ~ 0.9716 the
// golden-mean KAM torus breaks and orbits can diffuse vertically.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import { iterateOrbit, phasePortrait, maxLyapunov, K_CRITICAL } from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const sliderK     = document.getElementById('slider-K');
const sliderN     = document.getElementById('slider-n');
const valueK      = document.getElementById('value-K');
const valueN      = document.getElementById('value-n');
const btnReset    = document.getElementById('btn-reset');
const btnKcrit    = document.getElementById('btn-kcrit');

const W = canvas.width, H = canvas.height;
const TWO_PI = 2 * Math.PI;

const state = {
  K: 0.971,
  nPerOrbit: 1200,
  baseOrbits: null,
  userOrbits: [],
};

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const tokens = {
  fg:        cssVar('--fg', '#1A1B1C'),
  fgMuted:   cssVar('--fg-muted', '#5C5E61'),
  accent:    cssVar('--accent', '#1B6CA8'),
  accentWarm:cssVar('--accent-warm', '#C13B27'),
};

const ORBIT_COLORS = [
  '#69a8d6', '#d68a69', '#7ec27e', '#d6c869', '#b07cd1',
  '#d169a8', '#6dccc2', '#d96660', '#a2a89d', '#bcd169',
];

function toPx(theta, p) {
  return {
    px: 8 + (W - 16) * (theta / TWO_PI),
    py: H - 8 - (H - 16) * (p / TWO_PI),
  };
}

function drawBackground() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i += 1) {
    const x = 8 + (W - 16) * i / 4;
    const y = 8 + (H - 16) * i / 4;
    ctx.beginPath();
    ctx.moveTo(x, 8); ctx.lineTo(x, H - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, y); ctx.lineTo(W - 8, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.strokeRect(8, 8, W - 16, H - 16);
}

function drawOrbit(thetas, ps, color, alpha = 0.85) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < thetas.length; i += 1) {
    const pp = toPx(thetas[i], ps[i]);
    ctx.fillRect(pp.px - 0.5, pp.py - 0.5, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
}

function drawAll() {
  drawBackground();
  if (state.baseOrbits) {
    for (let o = 0; o < state.baseOrbits.length; o += 1) {
      const { thetas, ps } = state.baseOrbits[o];
      drawOrbit(thetas, ps, ORBIT_COLORS[o % ORBIT_COLORS.length], 0.7);
    }
  }
  for (let i = 0; i < state.userOrbits.length; i += 1) {
    const { thetas, ps } = state.userOrbits[i];
    drawOrbit(thetas, ps, '#f1d28a', 0.95);
  }
  drawReadout();
}

function drawReadout() {
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const rows = [
    ['K',        state.K.toFixed(3)],
    ['K_crit',   K_CRITICAL.toFixed(4)],
    ['n/orbit',  String(state.nPerOrbit)],
    ['orbits',   String((state.baseOrbits?.length ?? 0) + state.userOrbits.length)],
  ];
  let y = 22;
  for (const [k, v] of rows) {
    ctx.textAlign = 'left';
    ctx.fillText(k, 18, y);
    ctx.textAlign = 'right';
    ctx.fillText(v, W - 18, y);
    y += 14;
  }
  const lyap = maxLyapunov({ K: state.K, theta0: 0.5, p0: 0.3, nIter: 8000 });
  ctx.textAlign = 'left';
  ctx.fillText('lambda_1', 18, y);
  ctx.textAlign = 'right';
  ctx.fillText(lyap.toFixed(3), W - 18, y);
}

function rebuild() {
  state.baseOrbits = phasePortrait({
    K: state.K, nOrbits: 24, nPerOrbit: state.nPerOrbit, seed: SEED,
  });
  state.userOrbits = [];
  drawAll();
}

function addUserOrbit(theta0, p0) {
  const orb = iterateOrbit(theta0, p0, state.K, state.nPerOrbit);
  state.userOrbits.push(orb);
  if (state.userOrbits.length > 8) state.userOrbits.shift();
  drawAll();
}

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const x = (ev.clientX - rect.left) * scaleX;
  const y = (ev.clientY - rect.top) * scaleY;
  const theta = TWO_PI * (x - 8) / (W - 16);
  const p = TWO_PI * (1 - (y - 8) / (H - 16));
  if (theta < 0 || theta > TWO_PI || p < 0 || p > TWO_PI) return;
  addUserOrbit(theta, p);
});

sliderK.addEventListener('input', () => {
  valueK.textContent = parseFloat(sliderK.value).toFixed(3);
});
sliderK.addEventListener('change', () => {
  state.K = parseFloat(sliderK.value);
  valueK.textContent = state.K.toFixed(3);
  rebuild();
});

sliderN.addEventListener('input', () => {
  valueN.textContent = sliderN.value;
});
sliderN.addEventListener('change', () => {
  state.nPerOrbit = parseInt(sliderN.value, 10);
  rebuild();
});

btnReset.addEventListener('click', rebuild);
btnKcrit.addEventListener('click', () => {
  state.K = K_CRITICAL;
  sliderK.value = String(K_CRITICAL.toFixed(3));
  valueK.textContent = K_CRITICAL.toFixed(3);
  rebuild();
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const KS = [0.0, 0.4, K_CRITICAL, 1.6, 2.5];
    const idx = Math.min(KS.length - 1, Math.max(0, Math.round(frac * (KS.length - 1))));
    state.K = KS[idx];
    sliderK.value = String(state.K.toFixed(3));
    valueK.textContent = state.K.toFixed(3);
    rebuild();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', {
            detail: { capture: CAPTURE_NAME, seed: SEED, K: state.K },
          }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED, K: state.K };
        });
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSync, { once: true });
} else {
  bootSync();
}
