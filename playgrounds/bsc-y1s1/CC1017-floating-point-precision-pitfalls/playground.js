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

// Deterministic pseudo-random so stars, smoke and debris are reproducible
// frame to frame (the visual gate needs byte-stable captures).
function srnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

function drawSky(c) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, '#070912'); g.addColorStop(0.7, '#0d1020'); g.addColorStop(1, '#1a1526');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND_Y);
  for (let i = 0; i < 70; i += 1) {
    const x = srnd(i) * W, y = srnd(i + 99) * (GROUND_Y - 30);
    ctx.fillStyle = `rgba(200,210,255,${(0.15 + 0.5 * srnd(i + 7)).toFixed(2)})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawGround(c) {
  // Desert dune silhouette instead of a flat line.
  ctx.fillStyle = '#241c2b';
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= W; x += 24) {
    const y = GROUND_Y + 5 * Math.sin(x * 0.013) + 3 * Math.sin(x * 0.041 + 1.3);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,140,0.18)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= W; x += 24) ctx.lineTo(x, GROUND_Y + 5 * Math.sin(x * 0.013) + 3 * Math.sin(x * 0.041 + 1.3));
  ctx.stroke();
}

function drawRadar(c, lost) {
  // Fire-control radar range rings + sweeping beam from the battery.
  const col = lost ? '120,30,55' : '20,120,90';
  for (let r = 60; r < 360; r += 60) {
    ctx.strokeStyle = `rgba(${col},0.16)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(BATTERY.x, BATTERY.y, r, Math.PI, 2 * Math.PI); ctx.stroke();
  }
  const sweep = Math.PI + (1 + Math.sin(state.phase * 6.0)) * 0.5 * Math.PI;
  const grad = ctx.createLinearGradient(BATTERY.x, BATTERY.y,
    BATTERY.x + 330 * Math.cos(sweep), BATTERY.y + 330 * Math.sin(sweep));
  grad.addColorStop(0, `rgba(${col},0.32)`); grad.addColorStop(1, `rgba(${col},0)`);
  ctx.strokeStyle = grad; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(BATTERY.x, BATTERY.y);
  ctx.lineTo(BATTERY.x + 330 * Math.cos(sweep), BATTERY.y + 330 * Math.sin(sweep)); ctx.stroke();
}

function missile(x, y, ang, len, bodyCol, flame) {
  // A nose-cone + body + fins missile with a tapered exhaust flame.
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (flame > 0) {
    const fl = len * (1.1 + 1.6 * flame);
    const fg = ctx.createLinearGradient(-len * 0.5, 0, -len * 0.5 - fl, 0);
    fg.addColorStop(0, 'rgba(255,240,180,0.95)');
    fg.addColorStop(0.4, 'rgba(255,150,40,0.8)');
    fg.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(-len * 0.5, -len * 0.22);
    ctx.lineTo(-len * 0.5 - fl, 0); ctx.lineTo(-len * 0.5, len * 0.22);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.moveTo(len * 0.5, 0);                       // nose
  ctx.lineTo(len * 0.1, -len * 0.16);
  ctx.lineTo(-len * 0.5, -len * 0.16);
  ctx.lineTo(-len * 0.5, len * 0.16);
  ctx.lineTo(len * 0.1, len * 0.16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';       // fins
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, -len * 0.16); ctx.lineTo(-len * 0.62, -len * 0.34);
  ctx.lineTo(-len * 0.34, -len * 0.16); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, len * 0.16); ctx.lineTo(-len * 0.62, len * 0.34);
  ctx.lineTo(-len * 0.34, len * 0.16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function fireball(x, y, t, big) {
  // Layered expanding blast: white core, orange body, dark smoke, shock ring.
  const R = (big ? 46 : 24) * Math.min(1, 0.3 + t * 1.4);
  const sg = ctx.createRadialGradient(x, y, 0, x, y, R);
  sg.addColorStop(0, 'rgba(255,255,235,0.95)');
  sg.addColorStop(0.35, 'rgba(255,170,50,0.85)');
  sg.addColorStop(0.7, 'rgba(190,60,20,0.55)');
  sg.addColorStop(1, 'rgba(40,20,20,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = `rgba(255,210,160,${(0.6 * (1 - t)).toFixed(2)})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, R * (1 + t * 1.6), 0, 2 * Math.PI); ctx.stroke();
  for (let k = 0; k < (big ? 18 : 10); k += 1) {
    const a = k * 2.39996, d = R * (0.6 + 1.5 * t) * (0.5 + srnd(k));
    ctx.fillStyle = `rgba(255,${120 + (k * 53) % 120},40,${(0.8 * (1 - t)).toFixed(2)})`;
    ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d - t * 14, 2.4, 2.4);
  }
}

function drawBattery(c, firing) {
  // Launcher box on tracked chassis with raised launch rails.
  ctx.fillStyle = '#3a4150';
  ctx.fillRect(BATTERY.x - 20, BATTERY.y - 12, 40, 12);
  ctx.fillStyle = '#2a2f3a';
  ctx.fillRect(BATTERY.x - 22, BATTERY.y, 44, 6);
  ctx.fillStyle = firing ? c.green : '#566';
  ctx.save(); ctx.translate(BATTERY.x, BATTERY.y - 12); ctx.rotate(-0.86);
  ctx.fillRect(-3, -26, 6, 26); ctx.fillRect(-9, -22, 6, 22);
  ctx.restore();
  if (firing) {
    ctx.fillStyle = 'rgba(255,180,60,0.5)';
    ctx.beginPath(); ctx.arc(BATTERY.x + 12, BATTERY.y - 26, 9, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Patriot battery', BATTERY.x, BATTERY.y + 18);
}

function drawBarracks(c, hit, t) {
  if (hit) {
    // Collapsed rubble after the strike.
    ctx.fillStyle = '#3a2420';
    for (let i = 0; i < 16; i += 1) {
      const bx = TARGET.x + 4 + srnd(i) * 64, by = TARGET.y - 4 - srnd(i + 3) * 14;
      ctx.fillRect(bx, by, 4 + srnd(i + 9) * 7, 4 + srnd(i + 5) * 6);
    }
    ctx.fillStyle = 'rgba(120,120,130,0.25)';
    ctx.beginPath(); ctx.arc(TARGET.x + 36, TARGET.y - 30, 30 + t * 20, 0, 2 * Math.PI); ctx.fill();
  } else {
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(TARGET.x + 8, TARGET.y - 26, 56, 26);
    ctx.fillStyle = '#454b57';
    ctx.beginPath(); ctx.moveTo(TARGET.x + 4, TARGET.y - 26);
    ctx.lineTo(TARGET.x + 36, TARGET.y - 38); ctx.lineTo(TARGET.x + 68, TARGET.y - 26);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 3; i += 1) ctx.fillRect(TARGET.x + 14 + i * 16, TARGET.y - 20, 8, 10);
  }
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('barracks', TARGET.x + 36, TARGET.y + 16);
}

function drawScene(c, timeErr, rangeErr) {
  const sp = scudPos(state.phase);
  const offPx = rangeErr * M2PX;                 // gate lags behind Scud
  const gate = { x: sp.x - TRK_U.x * offPx, y: sp.y - TRK_U.y * offPx };
  const lost = rangeErr > GATE_HALF_M;
  const halfPx = GATE_HALF_M * M2PX;
  const ang = Math.atan2(TRK.dy, TRK.dx);
  const nx = -TRK_U.y, ny = TRK_U.x;             // across-track normal

  drawSky(c);
  drawRadar(c, lost && !state.patched);
  drawGround(c);

  // Scud incoming trajectory (faint), then a glowing smoke trail behind it.
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ENTRY.x, ENTRY.y); ctx.lineTo(TARGET.x, TARGET.y); ctx.stroke();
  ctx.setLineDash([]);

  const intercepted = !lost && state.phase >= 0.62;
  const impacted = lost && state.phase >= 0.98;

  if (!intercepted) {
    for (let k = 1; k <= 14; k += 1) {
      const pp = scudPos(Math.max(0, state.phase - k * 0.018));
      ctx.fillStyle = `rgba(210,210,225,${(0.16 * (1 - k / 14)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(pp.x, pp.y, 4.5 - k * 0.22, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // Radar acquisition gate: corner brackets where the system THINKS the
  // target is. Green and locked when it still contains the Scud; flashing
  // red and empty (tracking a ghost) once the clock drift has walked it off.
  const gw = halfPx, gx = 18;
  const flash = lost ? 0.55 + 0.45 * Math.sin(state.phase * 22) : 1;
  const gcol = state.patched ? c.green : (lost ? c.red : c.green);
  ctx.strokeStyle = gcol; ctx.globalAlpha = lost ? flash : 1; ctx.lineWidth = 2;
  const cor = [
    [gate.x - TRK_U.x * gw + nx * gx, gate.y - TRK_U.y * gw + ny * gx],
    [gate.x + TRK_U.x * gw + nx * gx, gate.y + TRK_U.y * gw + ny * gx],
    [gate.x + TRK_U.x * gw - nx * gx, gate.y + TRK_U.y * gw - ny * gx],
    [gate.x - TRK_U.x * gw - nx * gx, gate.y - TRK_U.y * gw - ny * gx],
  ];
  const L = 10;
  for (let i = 0; i < 4; i += 1) {
    const p = cor[i], q = cor[(i + 1) % 4], r = cor[(i + 3) % 4];
    const u1 = [(q[0] - p[0]), (q[1] - p[1])], n1 = Math.hypot(u1[0], u1[1]);
    const u2 = [(r[0] - p[0]), (r[1] - p[1])], n2 = Math.hypot(u2[0], u2[1]);
    ctx.beginPath();
    ctx.moveTo(p[0] + u1[0] / n1 * L, p[1] + u1[1] / n1 * L);
    ctx.lineTo(p[0], p[1]);
    ctx.lineTo(p[0] + u2[0] / n2 * L, p[1] + u2[1] / n2 * L);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = gcol; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'right';
  ctx.fillText(lost ? 'gate (empty: tracking a ghost)' : 'acquisition gate',
    gate.x - nx * (gx + 8) - 4, gate.y - ny * (gx + 8) + 4);

  // The clock-drift displacement, as a labelled offset between where the
  // radar looks and where the Scud really is.
  if (offPx > 8) {
    ctx.strokeStyle = lost ? c.red : c.accent; ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(gate.x, gate.y); ctx.lineTo(sp.x, sp.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = lost ? c.red : c.accent; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${rangeErr.toFixed(0)} m`, (gate.x + sp.x) / 2 + nx * 12, (gate.y + sp.y) / 2 + ny * 12);
  }

  // The Scud (a real missile with exhaust), unless already intercepted.
  if (!intercepted) {
    missile(sp.x, sp.y, ang, 26, c.accent, 0.5 + 0.4 * Math.sin(state.phase * 30));
    if (state.phase < 0.82) {
      ctx.fillStyle = c.accent; ctx.font = 'bold 11px ui-monospace, monospace'; ctx.textAlign = 'left';
      ctx.fillText('Scud', sp.x + nx * 18 + 6, sp.y + ny * 18 + 4);
    }
  }

  // Interceptor / outcome.
  let firing = false;
  if (!lost) {
    const launch = Math.max(0, Math.min(1, (state.phase - 0.15) / 0.47));
    firing = launch > 0 && state.phase < 0.62;
    if (firing) {
      const lx = BATTERY.x + 14, ly = BATTERY.y - 26;
      // Lead-pursuit interceptor path with a slight gravity-like arc.
      const ix = lx + (sp.x - lx) * launch;
      const iy = ly + (sp.y - ly) * launch - 70 * Math.sin(Math.PI * launch);
      const prevL = Math.max(0, launch - 0.05);
      const px = lx + (sp.x - lx) * prevL;
      const py = ly + (sp.y - ly) * prevL - 70 * Math.sin(Math.PI * prevL);
      for (let k = 1; k <= 10; k += 1) {
        const f = Math.max(0, launch - k * 0.05);
        const tx = lx + (sp.x - lx) * f, ty = ly + (sp.y - ly) * f - 70 * Math.sin(Math.PI * f);
        ctx.fillStyle = `rgba(150,210,255,${(0.22 * (1 - k / 10)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(tx, ty, 3.2 - k * 0.22, 0, 2 * Math.PI); ctx.fill();
      }
      missile(ix, iy, Math.atan2(iy - py, ix - px), 20, '#cfe6ff', 1.0);
      ctx.fillStyle = c.blue; ctx.font = 'bold 10px ui-monospace, monospace'; ctx.textAlign = 'left';
      ctx.fillText('PAC-2 interceptor', lx + 8, ly - 8);
    }
    if (intercepted) {
      const t = Math.min(1, (state.phase - 0.62) / 0.4);
      fireball(sp.x, sp.y, t, false);
    }
  } else if (impacted) {
    const t = Math.min(1, (state.phase - 0.98) / 0.2);
    fireball(TARGET.x + 36, TARGET.y - 8, t, true);
    // Screen-edge red alert flash on the lethal outcome.
    ctx.strokeStyle = `rgba(239,71,111,${(0.5 * (1 - t)).toFixed(2)})`;
    ctx.lineWidth = 8; ctx.strokeRect(4, 4, W - 8, GROUND_Y - 8);
  }

  drawBattery(c, firing);
  drawBarracks(c, impacted, impacted ? Math.min(1, (state.phase - 0.98) / 0.2) : 0);

  // Headline status banner with a coloured chip.
  ctx.textAlign = 'left';
  const msg = state.patched ? 'PATCHED: exact time kept, gate locked on the Scud (intercept)'
    : lost ? 'TRACK LOST: clock drift walked the gate off the Scud, no launch, impact'
    : 'TRACKING: gate still contains the Scud (intercept)';
  const bc = (lost && !state.patched) ? c.red : c.green;
  ctx.fillStyle = bc; ctx.globalAlpha = 0.16; ctx.fillRect(28, 18, 9, 22); ctx.globalAlpha = 1;
  ctx.fillStyle = bc; ctx.fillRect(28, 18, 5, 22);
  ctx.font = 'bold 14px ui-monospace, monospace'; ctx.fillText(msg, 44, 35);
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
