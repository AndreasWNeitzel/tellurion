// playground.js
// The Patriot missile failure (Dhahran, 25 Feb 1991) as a floating-
// point pitfall you can drive. A 24-bit fixed-point copy of 0.1 makes
// the system clock lose ~9.5e-8 s per 0.1 s tick; the error grows
// linearly with uptime and displaces the radar range gate by
// (clock error) x (Scud closing speed). Drag uptime; when the gate
// walks off the Scud the track is lost and the interceptor never fires.

import {
  PATRIOT_ERR_PER_TICK_S, SCUD_SPEED_MS,
  patriotTimeError, rangeGateErrorMeters,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const readoutTime = document.getElementById('readout-time');
const readoutRange = document.getElementById('readout-range');
const readoutStatus = document.getElementById('readout-status');
const sliderHours = document.getElementById('slider-hours');
const valueHours = document.getElementById('value-hours');
const sliderSpeed = document.getElementById('slider-speed');
const valueSpeed = document.getElementById('value-speed');
const toggleFix = document.getElementById('toggle-fix');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const GATE_HALF_M = 150;        // radar range-gate half-width (m)
const M2PX = 0.084;             // scene scale (px per metre)

const state = {
  hours: parseInt(sliderHours.value, 10),
  speed: parseInt(sliderSpeed.value, 10),
  patched: false,
  phase: 0,                     // Scud descent 0..1
  playing: !DETERMINISTIC,
};

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue: '#5bc0eb',
    red: '#ef476f',
    green: '#06d6a0',
    grid: '#23252a',
  };
}

// Scene geometry: a long diagonal Scud track across the full frame so
// the gate displacement is legible; battery low and central.
const GROUND_Y = 312;
const BATTERY = { x: 372, y: GROUND_Y };
const ENTRY = { x: 70, y: 60 };
const TARGET = { x: 690, y: GROUND_Y - 6 };
const TRK = { dx: TARGET.x - ENTRY.x, dy: TARGET.y - ENTRY.y };
const TRK_LEN = Math.hypot(TRK.dx, TRK.dy);
const TRK_U = { x: TRK.dx / TRK_LEN, y: TRK.dy / TRK_LEN };

function scudPos(phase) {
  return { x: ENTRY.x + TRK.dx * phase, y: ENTRY.y + TRK.dy * phase };
}

function drawGround(c) {
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let x = 24; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x - 10, GROUND_Y + 8); ctx.stroke();
  }
}

function drawBattery(c, firing) {
  ctx.fillStyle = c.muted;
  ctx.beginPath();
  ctx.moveTo(BATTERY.x - 16, BATTERY.y);
  ctx.lineTo(BATTERY.x + 16, BATTERY.y);
  ctx.lineTo(BATTERY.x + 8, BATTERY.y - 16);
  ctx.lineTo(BATTERY.x - 8, BATTERY.y - 16);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = firing ? c.green : c.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BATTERY.x, BATTERY.y - 12);
  ctx.lineTo(BATTERY.x + 18, BATTERY.y - 30);
  ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Patriot', BATTERY.x, BATTERY.y + 16);
}

function drawBarracks(c, hit) {
  ctx.fillStyle = hit ? c.red : c.muted;
  ctx.fillRect(TARGET.x + 8, TARGET.y - 22, 56, 24);
  ctx.fillStyle = c.bg;
  for (let i = 0; i < 3; i += 1) ctx.fillRect(TARGET.x + 14 + i * 16, TARGET.y - 16, 8, 10);
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('barracks', TARGET.x + 36, TARGET.y + 14);
}

function burst(x, y, r, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  for (let k = 0; k < 12; k += 1) {
    const a = k * Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

function drawScene(c, timeErr, rangeErr) {
  drawGround(c);

  // Scud track.
  ctx.strokeStyle = c.grid; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ENTRY.x, ENTRY.y); ctx.lineTo(TARGET.x, TARGET.y); ctx.stroke();
  ctx.setLineDash([]);

  const sp = scudPos(state.phase);
  const offPx = rangeErr * M2PX;                 // gate lags behind Scud
  const gate = { x: sp.x - TRK_U.x * offPx, y: sp.y - TRK_U.y * offPx };
  const lost = rangeErr > GATE_HALF_M;
  const halfPx = GATE_HALF_M * M2PX;

  // Range gate (where the radar expects the target).
  const nx = -TRK_U.y, ny = TRK_U.x;             // across-track normal
  const gw = halfPx, gx = 16;
  ctx.strokeStyle = lost ? c.red : c.green;
  ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
  ctx.beginPath();
  const corners = [
    [gate.x - TRK_U.x * gw + nx * gx, gate.y - TRK_U.y * gw + ny * gx],
    [gate.x + TRK_U.x * gw + nx * gx, gate.y + TRK_U.y * gw + ny * gx],
    [gate.x + TRK_U.x * gw - nx * gx, gate.y + TRK_U.y * gw - ny * gx],
    [gate.x - TRK_U.x * gw - nx * gx, gate.y - TRK_U.y * gw - ny * gx],
  ];
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < 4; i += 1) ctx.lineTo(corners[i][0], corners[i][1]);
  ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  // "range gate" label offset to the lower-left perpendicular side.
  ctx.fillStyle = lost ? c.red : c.green;
  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'right';
  ctx.fillText('range gate', gate.x - nx * (gx + 6) - 4, gate.y - ny * (gx + 6) + 4);

  // Displacement arrow from gate to the true Scud position.
  if (offPx > 6) {
    ctx.strokeStyle = lost ? c.red : c.green; ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(gate.x, gate.y); ctx.lineTo(sp.x, sp.y); ctx.stroke();
    ctx.setLineDash([]);
  }

  const intercepted = !lost && state.phase >= 0.62;
  const impacted = lost && state.phase >= 0.98;

  // Scud (hidden after a successful intercept).
  if (!intercepted) {
    ctx.fillStyle = c.accent;
    ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(Math.atan2(TRK.dy, TRK.dx));
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-10, 6); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (state.phase < 0.8) {
      ctx.fillStyle = c.accent; ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Scud', sp.x + nx * 16 + 6, sp.y + ny * 16 + 4);
    }
  }

  // Interceptor / outcome.
  let firing = false;
  if (!lost) {
    const launch = Math.max(0, Math.min(1, (state.phase - 0.15) / 0.47));
    firing = launch > 0 && state.phase < 0.62;
    if (firing) {
      const ip = { x: BATTERY.x + (sp.x - BATTERY.x) * launch, y: (BATTERY.y - 30) + (sp.y - (BATTERY.y - 30)) * launch };
      ctx.strokeStyle = c.green; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BATTERY.x + 18, BATTERY.y - 30); ctx.lineTo(ip.x, ip.y); ctx.stroke();
      ctx.fillStyle = c.green; ctx.beginPath(); ctx.arc(ip.x, ip.y, 3, 0, 2 * Math.PI); ctx.fill();
    }
    if (intercepted) burst(sp.x, sp.y, 18, c.green);
  } else if (impacted) {
    burst(TARGET.x + 36, TARGET.y - 10, 26, c.red);
  }

  drawBattery(c, firing);
  drawBarracks(c, impacted);

  // Headline status.
  ctx.textAlign = 'left'; ctx.font = 'bold 14px ui-monospace, monospace';
  if (state.patched) { ctx.fillStyle = c.green; ctx.fillText('PATCHED: exact time, gate locked on target', 40, 36); }
  else if (lost) { ctx.fillStyle = c.red; ctx.fillText('TRACK LOST: gate displaced past the Scud, no launch', 40, 36); }
  else { ctx.fillStyle = c.green; ctx.fillText('TRACKING: gate still contains the Scud', 40, 36); }
}

function drawCausePanel(c, timeErr, rangeErr) {
  const top = 352;
  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('Why: 0.1 is not exact in binary.', 40, top);
  ctx.fillStyle = c.fg; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('24 bits: 0.1 ~ 209715 / 2097152', 40, top + 20);
  ctx.fillText('       = 0.0999999046...', 40, top + 38);
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`error/tick = ${PATRIOT_ERR_PER_TICK_S.toExponential(3)} s, never reset`, 40, top + 60);

  // Linear accumulation plot, error(s) vs uptime(h).
  const px = 372, py = top + 2, pw = 348, ph = 92;
  const eMax = patriotTimeError(100) * 1.08;
  const xOf = (h) => px + pw * h / 100;
  const yOf = (e) => py + ph * (1 - e / eMax);
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  ctx.strokeRect(px, py, pw, ph);
  for (const h of [8, 20, 100]) {
    const x = xOf(h);
    ctx.strokeStyle = c.grid; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x, py + ph); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = c.muted; ctx.font = '9px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${h}h`, x, py + ph + 11);
  }
  ctx.strokeStyle = c.red; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) { const x = xOf(i), y = yOf(patriotTimeError(i)); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  const cx = xOf(state.hours), cy = yOf(state.patched ? 0 : patriotTimeError(state.hours));
  ctx.fillStyle = state.patched ? c.green : c.accent;
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = c.muted; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('clock error (s) vs uptime', px, py - 12);
  ctx.fillText('Dhahran battery: ~100 h up', px + 96, py + ph + 11);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  const timeErr = patriotTimeError(state.hours, state.patched);
  const rangeErr = rangeGateErrorMeters(state.hours, state.speed, state.patched);
  drawScene(c, timeErr, rangeErr);
  drawCausePanel(c, timeErr, rangeErr);

  readoutTime.textContent = `${(timeErr * 1000).toFixed(1)} ms`;
  readoutRange.textContent = `${rangeErr.toFixed(0)} m`;
  const lost = rangeErr > GATE_HALF_M;
  readoutStatus.textContent = state.patched ? 'PATCHED' : (lost ? 'LOST' : 'TRACKING');
}

function tick() {
  if (state.playing) {
    state.phase += 0.006;
    if (state.phase > 1.18) state.phase = 0;
  }
  render();
  requestAnimationFrame(tick);
}

sliderHours.addEventListener('input', () => { state.hours = parseInt(sliderHours.value, 10); valueHours.textContent = String(state.hours); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
toggleFix.addEventListener('change', () => { state.patched = toggleFix.checked; });
btnPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!state.playing));
});
btnReset.addEventListener('click', () => { state.phase = 0; });

function bootSync() {
  valueHours.textContent = String(state.hours);
  valueSpeed.textContent = String(state.speed);

  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    state.hours = Math.round(f * 100);
    state.phase = Math.min(1.05, 0.08 + f * 0.97);
    valueHours.textContent = String(state.hours);
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, hours: state.hours } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
