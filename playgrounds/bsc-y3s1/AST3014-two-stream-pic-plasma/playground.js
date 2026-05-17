// playground.js
// 1D-1V PIC two-stream instability, upgraded: phase-space with
// persistence vortex trails, a density-mode spectrogram, and the
// log mode-1 trace with the analytic growth-rate reference
// gamma = omega_p / (2 sqrt 2). Physics is the gate-tested sim.js.
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  createTwoStream, stepPIC, modeOneAmplitude, modeAmplitudes,
  twoStreamMaxGrowth, NPARTICLES, L,
} from './sim.js';

const urlParams = new URLSearchParams(location.search);
const SEED = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderV0 = document.getElementById('slider-v0');
const sliderSpeed = document.getElementById('slider-speed');
const valueV0 = document.getElementById('value-v0');
const valueSpeed = document.getElementById('value-speed');
const btnReset = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const PX = 30, PW = W - 60;
const PHASE_Y = 20, PHASE_H = H - 250;
const SPEC_Y = PHASE_Y + PHASE_H + 14, SPEC_H = 84;
const TRACE_Y = SPEC_Y + SPEC_H + 14, TRACE_H = 96;
const KMODES = 8, DT = 0.05, GAMMA = twoStreamMaxGrowth(1);   // wp = 1 in sim units

const state = { v0: 0.6, speed: 3, sim: null, modeHist: [], spec: [], playing: !DETERMINISTIC };

function rebuild() {
  state.sim = createTwoStream({ v0: state.v0, T: 0.01, seed: SEED });
  state.modeHist = [];
  state.spec = [];
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
}

function viridis(t) {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.min(1, Math.max(0, 1.4 * t - 0.2)));
  const g = Math.round(255 * Math.max(0, Math.min(1, 0.9 * t + 0.1)));
  const b = Math.round(255 * Math.max(0, Math.min(1, 1.3 * (1 - t) * t * 4)));
  return `rgb(${r},${g},${b})`;
}

function drawAll() {
  // Phase space: persistence fade (the vortex roll-up leaves trails).
  ctx.fillStyle = 'rgba(6,6,8,0.16)';
  ctx.fillRect(PX, PHASE_Y, PW, PHASE_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.strokeRect(PX + 0.5, PHASE_Y + 0.5, PW - 1, PHASE_H - 1);
  const V_MAX = state.v0 * 3.2;
  for (let p = 0; p < NPARTICLES; p += 2) {            // 2x subsample for speed
    const px = PX + PW * (state.sim.x[p] / L);
    const py = PHASE_Y + PHASE_H * (1 - (state.sim.v[p] + V_MAX) / (2 * V_MAX));
    ctx.fillStyle = p < NPARTICLES / 2 ? 'rgba(127,177,216,0.55)' : 'rgba(214,138,105,0.55)';
    ctx.fillRect(px, py, 1.4, 1.4);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('phase space (x, v): blue +v0, orange -v0; trails trace the electron-hole vortices', PX + 8, PHASE_Y + 14);
  ctx.textAlign = 'right';
  ctx.fillText(`t = ${state.sim.t.toFixed(2)}`, PX + PW - 8, PHASE_Y + 14);
  ctx.textAlign = 'left';

  // Density-mode spectrogram: time (x) vs k = 1..KMODES (y), bright = high.
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(PX, SPEC_Y, PW, SPEC_H);
  const cols = state.spec.length;
  const cw = Math.max(1, (PW - 2) / Math.max(1, 540));
  for (let c = 0; c < cols; c += 1) {
    const col = state.spec[c];
    const x = PX + 1 + c * (PW - 2) / 540;
    for (let k = 0; k < KMODES; k += 1) {
      const yy = SPEC_Y + SPEC_H - (k + 1) * SPEC_H / KMODES;
      ctx.fillStyle = viridis(col[k]);
      ctx.fillRect(x, yy, cw + 0.6, SPEC_H / KMODES + 0.6);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.strokeRect(PX + 0.5, SPEC_Y + 0.5, PW - 1, SPEC_H - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('density-mode spectrogram  |rho_hat[k]|  (k = 1 bottom .. 8 top) vs time', PX + 8, SPEC_Y + 13);

  // Mode-1 log trace with the analytic gamma = wp/(2 sqrt 2) reference.
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(PX, TRACE_Y, PW, TRACE_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.strokeRect(PX + 0.5, TRACE_Y + 0.5, PW - 1, TRACE_H - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('log |rho_hat[k=1]| vs time; dashed = analytic slope gamma = omega_p/(2 sqrt 2)', PX + 8, TRACE_Y + 13);
  if (state.modeHist.length >= 2) {
    const logs = state.modeHist.map(v => Math.log(Math.max(1e-6, v)));
    let lo = Infinity, hi = -Infinity;
    for (const l of logs) { if (l < lo) lo = l; if (l > hi) hi = l; }
    if (hi === lo) hi = lo + 1;
    const X = (i) => PX + (PW - 4) * (i / Math.max(1, logs.length - 1));
    const Y = (l) => TRACE_Y + TRACE_H - 6 - (TRACE_H - 26) * (l - lo) / (hi - lo);
    ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let i = 0; i < logs.length; i += 1) { const x = X(i), y = Y(logs[i]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    // analytic reference slope: d(log A)/dt = GAMMA, in pixels
    const dtPerSample = DT * state.speed;
    const i0 = Math.min(20, logs.length - 1);
    ctx.strokeStyle = 'rgba(120,200,255,0.7)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = i0; i < logs.length; i += 1) {
      const lref = logs[i0] + GAMMA * (i - i0) * dtPerSample;
      if (lref > hi + 2) break;
      const x = X(i), y = Y(Math.min(hi + 1, lref));
      i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // measured slope over the last window
    const m = Math.min(120, logs.length);
    if (m >= 8) {
      const s0 = logs.length - m;
      let mt = 0, ml = 0;
      for (let i = 0; i < m; i += 1) { mt += i; ml += logs[s0 + i]; }
      mt /= m; ml /= m;
      let nu = 0, de = 0;
      for (let i = 0; i < m; i += 1) { nu += (i - mt) * (logs[s0 + i] - ml); de += (i - mt) ** 2; }
      const gMeas = (nu / de) / dtPerSample;
      ctx.fillStyle = 'rgba(180,210,240,0.85)'; ctx.textAlign = 'right';
      ctx.fillText(`gamma_meas = ${gMeas.toFixed(3)}   wp/(2 sqrt 2) = ${GAMMA.toFixed(3)}`, PX + PW - 8, TRACE_Y + 13);
      ctx.textAlign = 'left';
    }
  }
}

function tickN(n) {
  if (!state.sim) return;
  for (let i = 0; i < n; i += 1) {
    stepPIC(state.sim, DT);
    state.modeHist.push(modeOneAmplitude(state.sim));
    if (state.modeHist.length > 540) state.modeHist.shift();
    const a = modeAmplitudes(state.sim, KMODES);
    let mx = 1e-9; for (const v of a) if (v > mx) mx = v;
    state.spec.push(Array.from(a, v => Math.min(1, Math.log(1 + 9 * v / mx) / Math.log(10))));
    if (state.spec.length > 540) state.spec.shift();
  }
}

sliderV0.addEventListener('change', () => { state.v0 = parseFloat(sliderV0.value); valueV0.textContent = state.v0.toFixed(2); rebuild(); drawAll(); });
sliderV0.addEventListener('input', () => { valueV0.textContent = parseFloat(sliderV0.value).toFixed(2); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => { state.playing = !state.playing; btnPlayPause.textContent = state.playing ? 'Pause' : 'Play'; });

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    tickN(Math.round(frac * 360));
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
      }));
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) { tickN(state.speed); drawAll(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
