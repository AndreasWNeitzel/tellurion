// playground.js
// Moving source emits circular wavefronts. Bottom panel shows f_obs(theta).

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  createDoppler, stepDoppler, observedFreq, radius,
  SOURCE_FREQ, WAVE_SPEED,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderV      = document.getElementById('slider-v');
const sliderSpeed  = document.getElementById('slider-speed');
const valueV       = document.getElementById('value-v');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

const state = {
  v: 0.5,
  speed: 2,
  sim: null,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function rebuild() {
  // start the source near the left edge so it moves rightward into view
  state.sim = createDoppler({ v: state.v, x0: -2.0, y0: 0.0 });
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (!state.sim) return;

  // Title
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`v / c = ${state.v.toFixed(2)}   t = ${state.sim.t.toFixed(2)}   wavefronts = ${state.sim.wavefronts.length}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`f_obs(0) = ${observedFreq(state.v, 0).toFixed(3)}   f_obs(pi/2) = 1.000   f_obs(pi) = ${observedFreq(state.v, Math.PI).toFixed(3)}`, 30, 40);

  // Scene region (top 70 percent) and bar chart (bottom 30 percent)
  const sceneY = 56;
  const sceneH = H - 200;
  const sceneCx = W / 2;
  const sceneCy = sceneY + sceneH / 2;
  const scale = sceneH / 8;     // pixels per unit world

  function worldToPx(x, y) {
    return { px: sceneCx + x * scale, py: sceneCy - y * scale };
  }

  // Scene background
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(20, sceneY, W - 40, sceneH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(20.5, sceneY + 0.5, W - 41, sceneH - 1);

  // Wavefronts (concentric circles)
  for (const wf of state.sim.wavefronts) {
    const r = radius(wf, state.sim.t) * scale;
    if (r < 1) continue;
    const center = worldToPx(wf.xEmit, wf.yEmit);
    ctx.strokeStyle = 'rgba(127, 177, 216, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(center.px, center.py, r, 0, Math.PI * 2);
    ctx.stroke();
    // small dot at the emission point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(center.px, center.py, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Source
  const sourcePx = worldToPx(state.sim.sourceX, state.sim.sourceY);
  ctx.fillStyle = tok.accentCool;
  ctx.beginPath();
  ctx.arc(sourcePx.px, sourcePx.py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Velocity arrow
  const arrowLen = 0.8 * scale;
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sourcePx.px, sourcePx.py);
  ctx.lineTo(sourcePx.px + arrowLen, sourcePx.py);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sourcePx.px + arrowLen, sourcePx.py);
  ctx.lineTo(sourcePx.px + arrowLen - 8, sourcePx.py - 5);
  ctx.lineTo(sourcePx.px + arrowLen - 8, sourcePx.py + 5);
  ctx.closePath();
  ctx.fillStyle = tok.accentCool;
  ctx.fill();

  // Two observer markers: in front (theta = 0) and behind (theta = pi)
  const obs1 = worldToPx(state.sim.sourceX + 2.5, 0);
  const obs2 = worldToPx(state.sim.sourceX - 2.5, 0);
  ctx.fillStyle = tok.accentWarm;
  ctx.beginPath(); ctx.arc(obs1.px, obs1.py, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(obs2.px, obs2.py, 5, 0, Math.PI * 2); ctx.fill();
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('theta = 0 (in front)',  obs1.px, obs1.py - 10);
  ctx.fillText('theta = pi (behind)',   obs2.px, obs2.py - 10);
  ctx.fillText(`f = ${observedFreq(state.v, 0).toFixed(3)}`,        obs1.px, obs1.py + 18);
  ctx.fillText(`f = ${observedFreq(state.v, Math.PI).toFixed(3)}`, obs2.px, obs2.py + 18);

  // Bottom: bar chart f_obs(theta) vs theta
  const barY = sceneY + sceneH + 14;
  const barH = H - barY - 16;
  const barX = 30, barW = W - 60;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'left';
  ctx.fillText('observed frequency vs theta (0 to pi)', barX + 6, barY + 14);
  // Plot curve
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const fMax = observedFreq(state.v, 0);
  const fMin = observedFreq(state.v, Math.PI);
  const yMin = Math.min(0.5, fMin * 0.9);
  const yMax = Math.max(2.5, fMax * 1.1);
  for (let i = 0; i < barW - 4; i += 1) {
    const theta = Math.PI * i / (barW - 5);
    const f = observedFreq(state.v, theta);
    const px = barX + 2 + i;
    const py = barY + 18 + (barH - 24) * (1 - (f - yMin) / (yMax - yMin));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Mark f = 1 (source-frame value)
  const yOne = barY + 18 + (barH - 24) * (1 - (1 - yMin) / (yMax - yMin));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(barX, yOne); ctx.lineTo(barX + barW, yOne);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('f = 1', barX + barW - 6, yOne - 4);
}

function tickN(n) { for (let i = 0; i < n; i += 1) stepDoppler(state.sim, 0.02); }

sliderV.addEventListener('input', () => { state.v = parseFloat(sliderV.value); valueV.textContent = state.v.toFixed(2); rebuild(); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { rebuild(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  rebuild();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const target = Math.round(frac * 240);
    tickN(target);
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
    tickN(state.speed);
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
