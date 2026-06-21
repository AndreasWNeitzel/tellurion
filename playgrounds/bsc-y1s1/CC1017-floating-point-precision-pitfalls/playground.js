import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
// Vertical 4:5 hero for the Patriot missile floating-point failure. Top
// region: the incoming Scud and the radar range gate the system opens for it,
// offset along the track by the accumulated clock-drift error; when the offset
// exceeds the gate's catch radius the track is lost and the Scud leaks
// through. Bottom region: gate displacement versus uptime against the catch
// radius, with the real Dhahran point marked.
//
// Reference: GAO/IMTEC-92-26 (1992); Skeel, SIAM News 25(4), 1992.

import {
  patriotTimeError, rangeGateErrorMeters, PATRIOT_ERR_PER_TICK_S,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const sliderHours = document.getElementById('slider-hours');
const sliderSpeed = document.getElementById('slider-speed');
const valueHours = document.getElementById('value-hours');
const valueSpeed = document.getElementById('value-speed');
const toggleFix = document.getElementById('toggle-fix');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const GATE_M = 250;            // gate catch radius (m)
const PXM = 0.14;             // pixels per metre for the offset
let running = !DETERMINISTIC;
let p = 0;                    // descent fraction
let holdT = 0, holding = false;

const hours = () => parseFloat(sliderHours.value);
const speed = () => parseFloat(sliderSpeed.value);
const patched = () => toggleFix.checked;
const disp = () => Math.abs(rangeGateErrorMeters(hours(), speed(), patched()));
const tracked = () => disp() <= GATE_M;

function syncVals() {
  valueHours.textContent = hours().toFixed(0);
  valueSpeed.textContent = speed().toFixed(0);
}
[sliderHours, sliderSpeed].forEach((s) => s.addEventListener('input', () => { syncVals(); p = 0; holding = false; render(); }));
toggleFix.addEventListener('change', () => { p = 0; holding = false; render(); });
btnReset.addEventListener('click', () => {
  sliderHours.value = '18'; sliderSpeed.value = '1676'; toggleFix.checked = false;
  p = 0; holding = false; running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); render();
});
btnPlay.addEventListener('click', () => {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.8 },
    { name: 'diagnostic', weight: 1.25 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    scud: '#ef476f',
    gate: '#5bc0eb',
    ok: '#67d98c',
    border: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.08)',
  };
}

function panel(col, r, title) {
  ctx.fillStyle = col.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

function drawScene(col, r) {
  panel(col, r, 'The gate the radar opens vs where the Scud is');

  const titleH = 22, stripH = 28;
  const draw = { x: r.x + 8, y: r.y + titleH + 6, w: r.w - 16, h: r.h - titleH - 6 - stripH - 6 };
  const isTracked = tracked();
  const d = disp();
  const dPx = d * PXM;
  const gateHalfPx = GATE_M * PXM;

  // Trajectory: from upper-right toward the protected site at bottom-centre.
  const start = { x: draw.x + draw.w * 0.74, y: draw.y + 18 };
  const site = { x: draw.x + draw.w * 0.42, y: draw.y + draw.h - 30 };
  const dx = site.x - start.x, dy = site.y - start.y;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;

  ctx.save();
  clipTo(ctx, draw);

  // Ground + protected site.
  ctx.strokeStyle = col.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(draw.x + 4, site.y + 10); ctx.lineTo(draw.x + draw.w - 4, site.y + 10); ctx.stroke();
  ctx.fillStyle = '#2a3340';
  ctx.fillRect(site.x - 16, site.y - 4, 32, 14);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'sans');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('protected site', site.x, site.y + 13);

  // Faint full trajectory.
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(site.x, site.y); ctx.stroke();
  ctx.setLineDash([]);

  // Scud true position and the gate (offset back along the track by the drift).
  const sx = start.x + ux * p * L, sy = start.y + uy * p * L;
  const gx = sx - ux * dPx, gy = sy - uy * dPx;

  // Gate box (catch window), green if it still holds the Scud.
  const gcol = isTracked ? col.ok : col.gate;
  ctx.strokeStyle = gcol; ctx.lineWidth = 1.8;
  ctx.save(); ctx.setLineDash([5, 4]);
  ctx.strokeRect(gx - gateHalfPx, gy - gateHalfPx, 2 * gateHalfPx, 2 * gateHalfPx);
  ctx.restore();
  ctx.fillStyle = isTracked ? 'rgba(103,217,140,0.10)' : 'rgba(91,192,235,0.08)';
  ctx.fillRect(gx - gateHalfPx, gy - gateHalfPx, 2 * gateHalfPx, 2 * gateHalfPx);
  ctx.fillStyle = gcol; ctx.font = fontString(canvas, 'tick', 'mono', 600);
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('range gate', gx, gy - gateHalfPx - 3);

  // Offset arrow between gate centre and the Scud.
  if (dPx > 3) {
    ctx.strokeStyle = col.accent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.fillStyle = col.accent; ctx.font = fontString(canvas, 'tick', 'mono', 700);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`${d.toFixed(0)} m`, (gx + sx) / 2 + 6, (gy + sy) / 2 - 6);
  }

  // The Scud.
  ctx.fillStyle = col.scud;
  ctx.beginPath();
  ctx.arc(sx, sy, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  // Outcome marker.
  if (holding) {
    if (isTracked) {
      ctx.fillStyle = col.ok; ctx.font = fontString(canvas, 'caption', 'mono', 700);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('INTERCEPTED', gx, gy + gateHalfPx + 16);
    } else {
      ctx.fillStyle = col.scud;
      ctx.beginPath(); ctx.arc(site.x, site.y, 12, 0, 2 * Math.PI); ctx.fill();
      ctx.font = fontString(canvas, 'caption', 'mono', 700);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('IMPACT', site.x, site.y - 16);
    }
  }

  ctx.restore();

  // Readout strip.
  const tErr = patriotTimeError(hours(), patched());
  const ry = r.y + r.h - stripH / 2 + 1;
  const items = [
    [`uptime ${hours().toFixed(0)} h`, col.fg],
    [`clock ${(tErr * 1000).toFixed(0)} ms`, col.accent],
    [`offset ${d.toFixed(0)} m`, col.accent],
    [isTracked ? 'TRACKING' : 'TRACK LOST', isTracked ? col.ok : col.scud],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono', 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  items.forEach(([txt, c], i) => { ctx.fillStyle = c; ctx.fillText(txt, r.x + r.w * (i + 0.5) / 4, ry); });
}

function drawDiagnostic(col, r) {
  panel(col, r, 'Gate displacement vs uptime, against the catch radius');

  const inner = { x: r.x + 46, y: r.y + 28, w: r.w - 46 - 14, h: r.h - 28 - 40 };
  const hMax = 100, sp = speed();
  const dMax = Math.max(GATE_M * 1.4, rangeGateErrorMeters(hMax, sp, false) * 1.1);
  const xOf = (h) => inner.x + (h / hMax) * inner.w;
  const yOf = (m) => inner.y + inner.h - (m / dMax) * inner.h;

  // miss region shading (above the catch radius).
  ctx.fillStyle = 'rgba(239,71,111,0.08)';
  ctx.fillRect(inner.x, inner.y, inner.w, yOf(GATE_M) - inner.y);

  // grid + ticks.
  ctx.strokeStyle = col.grid; ctx.lineWidth = 0.8;
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const m of [0, dMax / 2, dMax]) { const y = yOf(m); ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); ctx.fillText(m.toFixed(0), inner.x - 5, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const h of [0, 25, 50, 75, 100]) ctx.fillText(String(h), xOf(h), inner.y + inner.h + 4);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  // gate catch radius line.
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = col.gate; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(inner.x, yOf(GATE_M)); ctx.lineTo(inner.x + inner.w, yOf(GATE_M)); ctx.stroke(); ctx.restore();
  ctx.fillStyle = col.gate; ctx.font = fontString(canvas, 'tick', 'mono', 700);
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('gate radius', inner.x + 4, yOf(GATE_M) - 2);

  // displacement line (linear in uptime). Flat at 0 if patched.
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const h = i / 100 * hMax;
    const m = rangeGateErrorMeters(h, sp, patched());
    const X = xOf(h), Y = yOf(m);
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.stroke();

  // Dhahran marker at 100 h (true closing speed).
  const dh = rangeGateErrorMeters(100, sp, false);
  ctx.fillStyle = col.scud;
  ctx.beginPath(); ctx.arc(xOf(100), yOf(dh), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('Dhahran', xOf(100) - 4, yOf(dh) - 4);

  // current uptime cursor.
  const cxh = xOf(hours());
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cxh, inner.y); ctx.lineTo(cxh, inner.y + inner.h); ctx.stroke(); ctx.restore();
  ctx.fillStyle = col.accent;
  ctx.beginPath(); ctx.arc(cxh, yOf(disp()), 4, 0, 2 * Math.PI); ctx.fill();

  // axis labels.
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('uptime (hours)', inner.x + inner.w / 2, inner.y + inner.h + 20);
  ctx.save(); ctx.translate(inner.x - 34, inner.y + inner.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('displacement (m)', 0, 0); ctx.restore();
}

function render() {
  if (!REG) relayout();
  const col = colors();
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  drawScene(col, REG.scene);
  drawDiagnostic(col, REG.diagnostic);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) {
    if (!holding) {
      const stopP = tracked() ? 0.55 : 1.0;   // intercept mid-air, or reach the site
      p += dt / 3;
      if (p >= stopP) { p = stopP; holding = true; holdT = 0; }
    } else {
      holdT += dt;
      if (holdT > 1.2) { p = 0; holding = false; }
    }
  }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncVals();
  if (CAPTURE_NAME) { p = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 0.55; }
  else { p = 0.5; }
  relayout();
  render();
}

window.addEventListener('load', bootSync);
if (document.readyState !== 'loading') bootSync();
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => { relayout(); render(); }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else if (!CAPTURE_NAME) {
  requestAnimationFrame(tick);
}

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'uptime', label: 'uptime (h)', value: hours(), format: 'float' },
      { key: 'clock', label: 'clock error (s)', value: patriotTimeError(hours(), patched()), format: 'float' },
      { key: 'offset', label: 'gate offset (m)', value: disp(), format: 'float' },
      { key: 'tracked', label: 'within gate', value: tracked() ? 1 : 0, format: 'int' },
    ],
  };
};

window.playground.getInvariants = function () {
  try {
    // The drift is exactly linear in uptime: doubling uptime doubles the
    // displacement (the defining property of the unreset accumulating error).
    const a = rangeGateErrorMeters(20, speed(), false);
    const b = rangeGateErrorMeters(40, speed(), false);
    const ratio = a > 0 ? b / a : 2;
    const err = Math.abs(ratio - 2);
    return [{
      key: 'linear',
      label: 'clock drift linear in uptime',
      value: `${(PATRIOT_ERR_PER_TICK_S * 1e9).toFixed(1)} ns/tick`,
      status: err < 1e-9 ? 'pass' : 'drift',
    }];
  } catch (e) {
    return [];
  }
};
