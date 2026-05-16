// playground.js
// Brachistochrone race: cycloid vs line vs arc. Three beads, one canvas.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import {
  positionOnCycloid, positionOnLine, positionOnArc,
  cycloidCurve, lineCurve, arcCurve,
  T_CYCLOID, T_LINE, T_ARC, X_B, Y_B,
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
const T_MAX = Math.max(T_CYCLOID, T_LINE, T_ARC) * 1.05;

const state = {
  speed: 2,
  tNow: 0,
  playing: !DETERMINISTIC,
};

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function reset() { state.tNow = 0; }

function worldToPx(x, y) {
  // World extents: x in [0, X_B + 0.5], y in [-(Y_B + 1.0), 0.5]
  const wx = X_B + 0.5;
  const wy = Y_B + 1.0;
  const padL = 50, padR = 30, padT = 70, padB = 110;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const scale = Math.min(drawW / wx, drawH / wy);
  const px = padL + (x / wx) * (wx * scale);
  const py = padT + ((-y) / wy) * (wy * scale);
  return { px, py };
}

function drawCurve(pts, color, lw = 2.0) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 1) {
    const p = worldToPx(pts[i][0], pts[i][1]);
    if (i === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Title bar
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${state.tNow.toFixed(3)} s`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`T_cycloid = ${T_CYCLOID.toFixed(3)} s   T_arc = ${T_ARC.toFixed(3)} s   T_line = ${T_LINE.toFixed(3)} s`, 30, 40);

  // Anchor points
  const A = worldToPx(0, 0);
  const B = worldToPx(X_B, -Y_B);

  // Draw curves
  drawCurve(cycloidCurve(180), 'rgba(127, 177, 216, 0.55)', 2.0);
  drawCurve(arcCurve(180), 'rgba(241, 210, 138, 0.55)', 2.0);
  drawCurve(lineCurve(40), 'rgba(214, 138, 105, 0.55)', 2.0);

  // Label endpoints
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '13px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('A', A.px - 8, A.py + 4);
  ctx.textAlign = 'left';
  ctx.fillText('B', B.px + 8, B.py + 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath(); ctx.arc(A.px, A.py, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(B.px, B.py, 3, 0, Math.PI * 2); ctx.fill();

  // Beads at current time
  const t = Math.min(state.tNow, T_MAX);
  const pc = positionOnCycloid(t);
  const pa = positionOnArc(t);
  const pl = positionOnLine(t);

  function drawBead(p, color, label) {
    const px = worldToPx(p.x, p.y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px.px, px.py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    if (label) {
      ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(label, px.px + 9, px.py - 6);
    }
  }
  drawBead(pc, tok.accentCool,    'cycloid');
  drawBead(pa, '#f1d28a',         'arc');
  drawBead(pl, tok.accentWarm,    'line');

  // Time bars at bottom
  const barY = H - 90;
  const barH = 16;
  const barX = 50, barW = W - 100;
  function drawTimeBar(y, tStop, color, label) {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(barX, y, barW, barH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(barX + 0.5, y + 0.5, barW - 1, barH - 1);
    // Mark T_stop
    const px = barX + barW * (tStop / T_MAX);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, y); ctx.lineTo(px, y + barH);
    ctx.stroke();
    ctx.setLineDash([]);
    // Fill up to current min(t, tStop)
    const tFill = Math.min(state.tNow, tStop);
    const pxFill = barX + barW * (tFill / T_MAX);
    ctx.fillStyle = color;
    ctx.fillRect(barX + 1, y + 2, pxFill - barX - 1, barH - 4);
    // Label
    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.textAlign = 'left';
    ctx.fillText(label, barX, y - 2);
    ctx.textAlign = 'right';
    ctx.fillText(`T = ${tStop.toFixed(3)}`, barX + barW, y - 2);
  }
  drawTimeBar(barY,           T_CYCLOID, tok.accentCool, 'cycloid');
  drawTimeBar(barY + 30,      T_ARC,    '#f1d28a',       'arc');
  drawTimeBar(barY + 60,      T_LINE,   tok.accentWarm,  'line');
}

// Slowed ~3x (was 0.01): cycloid and line finished almost instantly,
// so the race was unreadable.
function tickN(n) { for (let i = 0; i < n; i += 1) state.tNow += 0.0035; }

sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { reset(); drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  reset();
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.tNow = frac * T_MAX;
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
    if (state.tNow > T_MAX + 0.5) state.tNow = 0; // loop animation
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
