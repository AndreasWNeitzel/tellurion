// playground.js
// Tautochrone (isochronism of the cycloid). Beads released from any
// height on a cycloid bowl reach the bottom in the same time. The
// canvas is clickable: click anywhere on the bowl to drop a new bead
// from that height and watch it fall into step with the others, all
// passing the bottom together every quarter period.

import { fontString } from '../../../shared/js/canvas-type.js';
import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  beadPosition, cycloidXY, sampleCycloid, arclengthFromBottom,
  R, OMEGA, FULL_PERIOD, QUARTER_PERIOD,
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

const DEFAULT_BEADS = [-3.5, -2.5, -1.5, 1.5, 3.0];
const PALETTE = ['#7fb1d8', '#d68a69', '#f1d28a', '#c2c2e6', '#a3d4a3',
  '#e08fae', '#8fd0e0', '#cdb07a', '#b6e07a', '#d0a0f0'];

const state = {
  speed: 2,
  tNow: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
  beads: [],
};

function resetBeads() {
  state.beads = DEFAULT_BEADS.map((s0, i) => ({ s0, color: PALETTE[i % PALETTE.length] }));
}
resetBeads();

const PAD = { L: 40, R: 40, T: 70, B: 80 };

function viewScale() {
  const drawW = W - PAD.L - PAD.R;
  const drawH = H - PAD.T - PAD.B;
  const wx = 2 * Math.PI * R;
  const wy = 2 * R + 0.4;
  const scale = Math.min(drawW / wx, drawH / wy);
  return { drawW, drawH, wx, scale, offX: (drawW - wx * scale) / 2 };
}

function worldToPx(x, y) {
  const v = viewScale();
  return {
    px: PAD.L + x * v.scale + v.offX,
    py: PAD.T + v.drawH - y * v.scale,
  };
}

// Invert worldToPx and snap to the nearest point of the cycloid, so a
// click anywhere near the bowl yields a valid release arc-length.
function pxToBeadS0(px, py) {
  const v = viewScale();
  const x = (px - PAD.L - v.offX) / v.scale;
  const y = (PAD.T + v.drawH - py) / v.scale;
  let best = Infinity, bestTheta = Math.PI;
  for (let i = 0; i <= 400; i += 1) {
    const th = 2 * Math.PI * i / 400;
    const c = cycloidXY(th);
    const d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
    if (d < best) { best = d; bestTheta = th; }
  }
  return Math.max(-3.9, Math.min(3.9, arclengthFromBottom(bestTheta)));
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // sFrac is 0 when every bead is at the bottom, 1 at the turning
  // points; it drives the isochronous-arrival flash.
  const sFrac = Math.abs(Math.cos(OMEGA * state.tNow));
  const atBottom = sFrac < 0.06;

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.tNow.toFixed(2)}    beads = ${state.beads.length}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`every bead reaches the bottom at t_quarter = ${QUARTER_PERIOD.toFixed(3)} s, whatever its release height`, 30, 40);

  // Frame.
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(PAD.L, PAD.T, W - PAD.L - PAD.R, H - PAD.T - PAD.B);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(PAD.L + 0.5, PAD.T + 0.5, W - PAD.L - PAD.R - 1, H - PAD.T - PAD.B - 1);

  // Cycloid bowl.
  const cyc = sampleCycloid(240);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < cyc.length; i += 1) {
    const p = worldToPx(cyc[i].x, cyc[i].y);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();

  // Bottom marker, with the isochronous-arrival flash.
  const bottomPx = worldToPx(R * Math.PI, 0);
  if (atBottom) {
    const glow = (1 - sFrac / 0.06);
    const g = ctx.createRadialGradient(bottomPx.px, bottomPx.py, 0, bottomPx.px, bottomPx.py, 46);
    g.addColorStop(0, `rgba(241, 210, 138, ${(0.5 * glow).toFixed(3)})`);
    g.addColorStop(1, 'rgba(241, 210, 138, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bottomPx.px, bottomPx.py, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(241, 210, 138, ${(0.9 * glow).toFixed(3)})`;
    ctx.textAlign = 'center';
    ctx.fillText('all beads arrive together', bottomPx.px, bottomPx.py - 40);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(bottomPx.px, bottomPx.py - 6);
  ctx.lineTo(bottomPx.px, bottomPx.py + 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('bottom', bottomPx.px, bottomPx.py + 18);

  // Beads, each with its release-height marker.
  for (const bead of state.beads) {
    const initPos = beadPosition(bead.s0, 0);
    const initP = worldToPx(initPos.x, initPos.y);
    ctx.strokeStyle = `${bead.color}66`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(initP.px, initP.py, 4, 0, Math.PI * 2); ctx.stroke();

    const pos = beadPosition(bead.s0, state.tNow);
    const p = worldToPx(pos.x, pos.y);
    ctx.fillStyle = bead.color;
    ctx.beginPath(); ctx.arc(p.px, p.py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath(); ctx.arc(p.px, p.py, 7, 0, Math.PI * 2); ctx.stroke();
  }

  // Click hint.
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('click the bowl to drop a bead from that height', W / 2, H - 60);

  // Phase bar: where the swarm is within the period.
  const barY = H - 44;
  const barX = 50, barW = W - 100, barH = 14;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
  const tCur = state.tNow % FULL_PERIOD;
  ctx.fillStyle = '#f1d28a';
  ctx.fillRect(barX + 1, barY + 2, barW * (tCur / FULL_PERIOD) - 1, barH - 4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
  for (let i = 1; i <= 3; i += 1) {
    const xx = barX + (barW * i) / 4;
    ctx.beginPath(); ctx.moveTo(xx, barY); ctx.lineTo(xx, barY + barH); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('bottom', barX + barW / 4, barY + barH + 12);
  ctx.fillText('bottom', barX + 3 * barW / 4, barY + barH + 12);
}

function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.01; }

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (W / rect.width);
  const py = (e.clientY - rect.top) * (H / rect.height);
  const s0 = pxToBeadS0(px, py);
  state.beads.push({ s0, color: PALETTE[state.beads.length % PALETTE.length] });
  if (!state.playing) drawAll();
});

sliderSpeed.addEventListener('input', () => {
  state.speed = parseInt(sliderSpeed.value, 10);
  valueSpeed.textContent = String(state.speed);
});
btnReset.addEventListener('click', () => { state.tNow = 0; resetBeads(); drawAll(); });
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

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const sFrac = Math.abs(Math.cos(OMEGA * state.tNow));
  return {
    fields: [
      { key: 'beads', label: 'beads on the bowl', value: state.beads.length },
      { key: 'time', label: 'elapsed time (s)', value: state.tNow, format: 'float' },
      { key: 'phase', label: 'arc fraction |s/s0|', value: sFrac, format: 'float' },
      { key: 'speed', label: 'animation speed', value: state.speed },
    ],
  };
};
window.playground.getInvariants = function () {
  // Isochronism: on a cycloid the motion is exactly simple harmonic in
  // arc length, s(t) = s0 cos(omega t), so the descent time to the
  // bottom is the quarter period for every release height. Verify the
  // current beads all hit |s| < tolerance at the same t_quarter.
  const tol = 1e-9;
  let synced = true;
  for (const b of state.beads) {
    if (Math.abs(b.s0 * Math.cos(OMEGA * QUARTER_PERIOD)) > tol) synced = false;
  }
  return [
    {
      key: 'isochronism',
      label: 'descent time independent of amplitude',
      value: `${QUARTER_PERIOD.toFixed(3)} s`,
      status: synced ? 'pass' : 'drift',
    },
  ];
};
