// playground.js
// Five beads released from different heights on a cycloid bowl arrive at the
// bottom simultaneously.

import { DEFAULT_SEED } from '../../shared/js/render/rng.js';
import {
  beadPosition, cycloidXY, sampleCycloid,
  R, FULL_PERIOD, QUARTER_PERIOD,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderSpeed  = document.getElementById('slider-speed');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;

// Bead release amplitudes (arc-length s_0). Mix of left and right.
const BEAD_S0 = [-3.5, -2.5, -1.5, 1.5, 3.0];
const BEAD_COLORS = ['#7fb1d8', '#d68a69', '#f1d28a', '#c2c2e6', '#a3d4a3'];

const state = {
  speed: 2,
  tNow: 0,
  playing: !DETERMINISTIC,
};

function worldToPx(x, y) {
  // World extents: x in [0, 2 R pi] = [0, ~6.28], y in [0, 2 R] = [0, 2]
  const padL = 40, padR = 40, padT = 70, padB = 80;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const wx = 2 * Math.PI * R;
  const wy = 2 * R + 0.4;
  const scale = Math.min(drawW / wx, drawH / wy);
  return {
    px: padL + (x - 0) * scale + (drawW - wx * scale) / 2,
    py: padT + drawH - y * scale,
  };
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.tNow.toFixed(2)} / T_quarter = ${QUARTER_PERIOD.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`omega = sqrt(g / 4R), T = ${FULL_PERIOD.toFixed(3)}, t_quarter = ${QUARTER_PERIOD.toFixed(3)} (same for all amplitudes)`, 30, 40);

  // Frame
  const padL = 40, padR = 40, padT = 70, padB = 80;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, W - padL - padR, H - padT - padB);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, W - padL - padR - 1, H - padT - padB - 1);

  // Draw cycloid bowl
  const cyc = sampleCycloid(200);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < cyc.length; i += 1) {
    const p = worldToPx(cyc[i].x, cyc[i].y);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  // Mark bottom
  const bottomPx = worldToPx(R * Math.PI, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(bottomPx.px, bottomPx.py - 6);
  ctx.lineTo(bottomPx.px, bottomPx.py + 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('bottom', bottomPx.px, bottomPx.py + 18);

  // Beads
  for (let i = 0; i < BEAD_S0.length; i += 1) {
    const s0 = BEAD_S0[i];
    const pos = beadPosition(s0, state.tNow);
    const p = worldToPx(pos.x, pos.y);
    ctx.fillStyle = BEAD_COLORS[i];
    ctx.beginPath();
    ctx.arc(p.px, p.py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    // Initial position marker
    const initPos = beadPosition(s0, 0);
    const initP = worldToPx(initPos.x, initPos.y);
    ctx.strokeStyle = `${BEAD_COLORS[i]}66`;
    ctx.beginPath();
    ctx.arc(initP.px, initP.py, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Time bar
  const barY = H - 50;
  const barX = 50, barW = W - 100, barH = 16;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  const tCur = state.tNow % FULL_PERIOD;
  const pxCur = barX + barW * (tCur / FULL_PERIOD);
  ctx.fillStyle = '#f1d28a';
  ctx.fillRect(barX + 1, barY + 2, pxCur - barX - 1, barH - 4);
  // Quarter, half, three-quarter marks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
  for (let i = 1; i <= 3; i += 1) {
    const xx = barX + (barW * i) / 4;
    ctx.beginPath();
    ctx.moveTo(xx, barY); ctx.lineTo(xx, barY + barH);
    ctx.stroke();
  }
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('t / T_full', barX + barW / 2, barY - 4);
  ctx.fillText('1/4', barX + barW / 4, barY + barH + 12);
  ctx.fillText('1/2', barX + barW / 2, barY + barH + 12);
  ctx.fillText('3/4', barX + 3 * barW / 4, barY + barH + 12);
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.01; }

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.tNow = 0; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * FULL_PERIOD;
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
    if (state.tNow > FULL_PERIOD) state.tNow -= FULL_PERIOD;
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
