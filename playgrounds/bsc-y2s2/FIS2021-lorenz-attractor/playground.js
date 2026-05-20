// playground.js
// A zoo of classic 3D strange attractors, hand-projected and slowly
// rotating with a viridis-shaded fading trail. Lorenz keeps its
// interactive sigma/rho/beta sliders and the live max-Lyapunov
// readout; the other vector fields (Roessler, Aizawa, Thomas,
// Halvorsen, Chen-Ueta) come from the sim.js ATTRACTORS catalog. The
// Lorenz physics and its invariants in sim.js are unchanged.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  createLorenz, stepLorenz, maxLyapunov, rebuildRhs,
  createAttractor, stepAttractor, ATTRACTORS,
  DEFAULT_DT, DEFAULT_PARAMS,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const selAttractor = document.getElementById('select-attractor');
const sliderSigma  = document.getElementById('slider-sigma');
const sliderRho    = document.getElementById('slider-rho');
const sliderBeta   = document.getElementById('slider-beta');
const sliderSpeed  = document.getElementById('slider-speed');
const valueSigma   = document.getElementById('value-sigma');
const valueRho     = document.getElementById('value-rho');
const valueBeta    = document.getElementById('value-beta');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const CX = W / 2, CY = H / 2, ELEV = 0.34;

const state = {
  key: 'lorenz',
  params: { ...DEFAULT_PARAMS },
  speed: 1.0,
  at: null,                 // unified handle: { step(), pos(), def }
  trail: [],
  az: 0.6,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function buildHandle() {
  const def = ATTRACTORS[state.key] || ATTRACTORS.lorenz;
  if (state.key === 'lorenz') {
    const lz = createLorenz({ params: state.params, ic: def.ic, dt: DEFAULT_DT, method: 'rk4' });
    let nStep = 0;
    return {
      lz, def,
      step: () => {
        stepLorenz(lz);
        nStep += 1;
        if (nStep % 50 === 0) {                    // tangent renorm (runLorenz logic)
          const y = lz.inst.y;
          const norm = Math.hypot(y[3], y[4], y[5]);
          if (norm > 0) { lz.logSum += Math.log(norm); lz.nRescale += 1; y[3] /= norm; y[4] /= norm; y[5] /= norm; }
        }
      },
      pos: () => [lz.inst.y[0], lz.inst.y[1], lz.inst.y[2]],
      lyap: () => maxLyapunov(lz, 50),
    };
  }
  const a = createAttractor(state.key);
  return { def, step: () => stepAttractor(a), pos: () => [a.inst.y[0], a.inst.y[1], a.inst.y[2]], lyap: null };
}

function rebuild() {
  state.at = buildHandle();
  state.trail = [];
  const warm = state.key === 'lorenz' ? 1000 : Math.round(state.at.def.steps * 0.12);
  for (let i = 0; i < warm; i += 1) state.at.step();
}

function project(p) {
  const c = state.at.def.center, sc = state.at.def.scale;
  const x = (p[0] - c[0]) * sc, y = (p[1] - c[1]) * sc, z = (p[2] - c[2]) * sc;
  const ca = Math.cos(state.az), sa = Math.sin(state.az);
  const ex = x * ca - y * sa;
  const ey = x * sa + y * ca;
  return { sx: CX + ex, sy: CY - z * Math.cos(ELEV) - ey * Math.sin(ELEV) };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  const tr = state.trail, n = tr.length;
  if (n >= 2) {
    let prev = project(tr[0]);
    for (let i = 1; i < n; i += 1) {
      const cur = project(tr[i]);
      const t = i / n;
      const col = viridis(0.1 + 0.85 * t);
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${(0.10 + 0.7 * t).toFixed(3)})`;
      ctx.lineWidth = 0.6 + 1.4 * t;
      ctx.beginPath(); ctx.moveTo(prev.sx, prev.sy); ctx.lineTo(cur.sx, cur.sy); ctx.stroke();
      prev = cur;
    }
    const head = project(tr[n - 1]);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(head.sx, head.sy, 3, 0, 2 * Math.PI); ctx.fill();
  }

  const def = state.at.def;
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(def.label, 18, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px ui-monospace, monospace';
  if (state.key === 'lorenz') {
    const lam = state.at.lyap();
    ctx.fillText(`sigma=${state.params.sigma.toFixed(1)} rho=${state.params.rho.toFixed(1)} beta=${state.params.beta.toFixed(3)}   max-Lyapunov ~ ${lam.toFixed(3)}`, 18, 44);
  } else {
    ctx.fillText('dissipative chaotic attractor; drag the speed slider, pick another from the menu', 18, 44);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('points ~ trail length; colour = age (viridis)', 18, H - 16);
}

function stepFrame() {
  const def = state.at.def;
  const perFrame = Math.max(1, Math.round((state.key === 'lorenz' ? 18 : def.steps / 240) * state.speed * 4));
  for (let i = 0; i < perFrame; i += 1) {
    state.at.step();
    state.trail.push(state.at.pos());
    if (state.trail.length > def.steps) state.trail.shift();
  }
}

selAttractor.addEventListener('change', () => { state.key = selAttractor.value; rebuild(); drawAll(); });
sliderSigma.addEventListener('input', () => { state.params.sigma = parseFloat(sliderSigma.value); valueSigma.textContent = state.params.sigma.toFixed(1); if (state.key === 'lorenz') { rebuildRhs(state.at.lz, state.params); } });
sliderRho.addEventListener('input', () => { state.params.rho = parseFloat(sliderRho.value); valueRho.textContent = state.params.rho.toFixed(1); if (state.key === 'lorenz') { rebuildRhs(state.at.lz, state.params); } });
sliderBeta.addEventListener('input', () => { state.params.beta = parseFloat(sliderBeta.value); valueBeta.textContent = state.params.beta.toFixed(3); if (state.key === 'lorenz') { rebuildRhs(state.at.lz, state.params); } });
sliderSpeed.addEventListener('input', () => { state.speed = parseFloat(sliderSpeed.value); valueSpeed.textContent = state.speed.toFixed(2); });
btnReset.addEventListener('click', () => { state.key = 'lorenz'; selAttractor.value = 'lorenz'; state.params = { ...DEFAULT_PARAMS }; sliderSigma.value = '10'; sliderRho.value = '28'; sliderBeta.value = '2.6667'; valueSigma.textContent = '10.0'; valueRho.textContent = '28.0'; valueBeta.textContent = '2.667'; rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  valueSigma.textContent = state.params.sigma.toFixed(1);
  valueRho.textContent = state.params.rho.toFixed(1);
  valueBeta.textContent = state.params.beta.toFixed(3);
  valueSpeed.textContent = state.speed.toFixed(2);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(ATTRACTORS);
    state.key = keys[Math.min(keys.length - 1, Math.round(f * (keys.length - 1)))];
    selAttractor.value = state.key;
    state.az = 0.6;
    rebuild();
    const def = state.at.def;
    for (let i = 0; i < def.steps; i += 1) {
      state.at.step();
      state.trail.push(state.at.pos());
      if (state.trail.length > def.steps) state.trail.shift();
    }
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, seed: SEED } }));
      }));
    }
    return;
  }
  rebuild();
  drawAll();
}

function tick() {
  if (state.playing) { stepFrame(); state.az += 0.0016; drawAll(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
