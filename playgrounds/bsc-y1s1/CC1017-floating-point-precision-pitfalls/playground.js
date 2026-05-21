import { fontString } from '../../../shared/js/canvas-type.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
// playground.js
// The Patriot missile failure (Dhahran, 25 Feb 1991) as a
// floating-point pitfall you can drive, rendered as a tactical
// engagement. A 24-bit fixed-point copy of 0.1 makes the system
// clock lose ~9.5e-8 s per 0.1 s tick; the error grows linearly with
// uptime and displaces the radar range gate by (clock error) x (Scud
// closing speed). With the gate still on the Scud the Patriot boosts
// vertically, pitches over and converges under lead-pursuit guidance
// for a clean intercept; once the clock drift walks the gate off the
// track the system drops the track, no interceptor is fired, and the
// ballistic Scud completes its arc onto the protected asset. The
// lower panel keeps the exact 24-bit chop and the linear error
// accumulation. sim.js is unchanged (the floating-point model and
// its 12 invariants are the lesson).

import {
  PATRIOT_ERR_PER_TICK_S,
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
const GROUND_Y = 322;
const BAT = { x: 560, y: GROUND_Y - 4 };       // launcher (near the asset: longer intercept arc)
const ASSET = { x: 656, y: GROUND_Y - 4 };     // protected asset
const SCUD_HMAX = 270;          // Scud apogee height above ground (px)
const TL = 0.05;                // interceptor launch phase

const COL = {
  bg: '#05070d', grid: 'rgba(64,120,110,0.16)', ring: 'rgba(64,150,120,0.12)',
  fg: '#cfd6e4', muted: '#76839a', dim: '#3d4758',
  scud: '#ff8a4c', scudGlow: 'rgba(255,138,76,0.20)',
  intc: '#5bc0eb', intcGlow: 'rgba(91,192,235,0.20)',
  ok: '#06d6a0', bad: '#ef476f', amber: '#ffd166', grid2: '#23252a',
};

const state = {
  hours: parseInt(sliderHours.value, 10),
  speed: parseInt(sliderSpeed.value, 10),
  patched: false,
  phase: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function srnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

// Ballistic Scud: a smooth gravity arc. It enters high on the left
// at apogee, closes horizontally at a steady rate (x linear in t)
// and falls as h ~ (1 - t^2), so the path is a clean descending
// parabola that strikes the asset at an angle (not a late vertical
// plunge followed by a horizontal run).
function SC(t) {
  const tt = Math.max(0, Math.min(1, t));
  const x = 70 + (ASSET.x - 70) * tt;
  const h = SCUD_HMAX * (1 - tt * tt);
  return { x, y: GROUND_Y - 8 - h };
}
function scudTangent(t) {
  const a = SC(t - 0.01), b = SC(t + 0.01);
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
  return { x: dx / n, y: dy / n };
}

// Lead-pursuit interceptor with a launch boost and a turn-rate limit,
// so it climbs near-vertically then arcs over and converges. Pure
// function of the engagement phase: deterministic for capture.
function interceptorPath(tNow) {
  const pts = [];
  let pos = { x: BAT.x + 4, y: BAT.y - 16 };
  let ang = -Math.PI / 2;                       // straight up
  let spd = 120;
  const dt = 0.0045;
  let hit = null;
  for (let tau = TL; tau <= tNow + 1e-9; tau += dt) {
    const boosting = tau < TL + 0.05;
    // Ramp hard to interceptor speed within the boost phase; the old
    // tiny cruise accel kept it well below the Scud's effective speed
    // so it could never close from the downrange battery.
    spd = Math.min(1850, spd + 9000 * dt);
    // predicted intercept point: lead by time-to-go = range / speed
    // (in tau units). Self-correcting, so it converges from any
    // launch location (the battery sits well downrange now).
    const scNow = SC(tau);
    const tgo = Math.min(0.5, Math.hypot(pos.x - scNow.x, pos.y - scNow.y) / Math.max(spd, 1));
    const aim = SC(Math.min(1, tau + tgo));
    const want = Math.atan2(aim.y - pos.y, aim.x - pos.x);
    let d = Math.atan2(Math.sin(want - ang), Math.cos(want - ang));
    // Strong lateral acceleration off boost so the predicted-intercept
    // law actually bends the trajectory onto the Scud instead of
    // coasting up off the top of the scene.
    const cap = (boosting ? 1.0 : 11) * dt;
    if (d > cap) d = cap; else if (d < -cap) d = -cap;
    ang += d;
    pos = { x: pos.x + Math.cos(ang) * spd * dt, y: pos.y + Math.sin(ang) * spd * dt };
    if (pos.y > GROUND_Y - 2) pos.y = GROUND_Y - 2;
    if (pos.y < 6) pos.y = 6;                    // stay on the scene
    pts.push({ x: pos.x, y: pos.y });
    const sc = SC(tau);
    if (!hit && Math.hypot(pos.x - sc.x, pos.y - sc.y) < 18) { hit = { x: (pos.x + sc.x) / 2, y: (pos.y + sc.y) / 2, tau }; break; }
  }
  return { pts, hit };
}

function glowTrail(pts, head, color, glow, width) {
  if (pts.length < 2) return;
  const n = Math.max(2, Math.floor(pts.length * head));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = glow; ctx.lineWidth = width + 6;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  for (let i = 1; i < n; i += 1) {
    const a = (i / n) ** 1.4;
    ctx.strokeStyle = color.replace(')', `,${(0.15 + 0.85 * a).toFixed(3)})`).replace('rgb', 'rgba');
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
  }
}

function dart(x, y, ang, len, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(len * 0.6, 0);
  ctx.lineTo(-len * 0.4, -len * 0.16);
  ctx.lineTo(-len * 0.4, len * 0.16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(len * 0.5, 0, len * 0.09, 0, 6.2832); ctx.fill();
  ctx.restore();
}

// Clean targeting reticle: a pulsing ring, four fixed radial ticks
// at N/E/S/W and a centre dot. No bent or rotating arms (those read
// as a hooked cross), purely radial and mirror-symmetric.
function reticle(x, y, ph, color) {
  const r = 15 + Math.sin(ph * 4) * 1.2;
  ctx.strokeStyle = color; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
  for (let k = 0; k < 4; k += 1) {
    const a = k * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r - 5), y + Math.sin(a) * (r - 5));
    ctx.lineTo(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5));
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.2832); ctx.fill();
}

function burst(x, y, t, big) {
  const R = (big ? 52 : 30) * Math.min(1, 0.25 + t * 1.5);
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, `rgba(255,255,240,${(0.95 * (1 - t)).toFixed(2)})`);
  g.addColorStop(0.35, `rgba(255,180,70,${(0.8 * (1 - t)).toFixed(2)})`);
  g.addColorStop(0.7, `rgba(200,70,25,${(0.45 * (1 - t)).toFixed(2)})`);
  g.addColorStop(1, 'rgba(20,15,20,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = `rgba(255,210,160,${(0.55 * (1 - t)).toFixed(2)})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, R * (1 + t * 1.7), 0, 6.2832); ctx.stroke();
  for (let k = 0; k < (big ? 22 : 13); k += 1) {
    const a = k * 2.39996, d = R * (0.6 + 1.6 * t) * (0.5 + srnd(k));
    ctx.fillStyle = `rgba(255,${(150 + (k * 47) % 100) | 0},60,${(0.8 * (1 - t)).toFixed(2)})`;
    ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d - t * 16, 2.4, 2.4);
  }
}

function drawBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, '#05070d'); g.addColorStop(0.75, '#070b14'); g.addColorStop(1, '#0b0f1a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND_Y);
  // radar range rings + scan from the battery
  ctx.strokeStyle = COL.ring; ctx.lineWidth = 1;
  for (let r = 70; r < 540; r += 70) { ctx.beginPath(); ctx.arc(BAT.x, BAT.y, r, Math.PI, 2 * Math.PI); ctx.stroke(); }
  ctx.strokeStyle = COL.grid;
  for (let gx = 0; gx <= W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GROUND_Y); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1; }
  const sweep = Math.PI + (1 + Math.sin(state.phase * 5)) * 0.5 * Math.PI;
  const sg = ctx.createLinearGradient(BAT.x, BAT.y, BAT.x + 520 * Math.cos(sweep), BAT.y + 520 * Math.sin(sweep));
  sg.addColorStop(0, 'rgba(64,150,120,0.22)'); sg.addColorStop(1, 'rgba(64,150,120,0)');
  ctx.strokeStyle = sg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(BAT.x, BAT.y); ctx.lineTo(BAT.x + 520 * Math.cos(sweep), BAT.y + 520 * Math.sin(sweep)); ctx.stroke();
  // horizon
  ctx.strokeStyle = 'rgba(120,180,160,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
  ctx.fillStyle = '#080a10'; ctx.fillRect(0, GROUND_Y, W, 30);
}

function drawBattery(firing) {
  ctx.fillStyle = '#2c333f'; ctx.fillRect(BAT.x - 18, BAT.y - 8, 36, 10);
  ctx.fillStyle = '#3a4250';
  ctx.save(); ctx.translate(BAT.x, BAT.y - 8); ctx.rotate(-1.05);
  ctx.fillRect(-3, -30, 7, 30); ctx.restore();
  if (firing) {
    const fg = ctx.createRadialGradient(BAT.x + 6, BAT.y - 22, 0, BAT.x + 6, BAT.y - 22, 16);
    fg.addColorStop(0, 'rgba(255,220,140,0.7)'); fg.addColorStop(1, 'rgba(255,150,40,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(BAT.x + 6, BAT.y - 22, 16, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('BATTERY', BAT.x, BAT.y + 16);
}

function drawAsset(destroyed, t) {
  if (destroyed) {
    ctx.fillStyle = '#3a2a26';
    for (let i = 0; i < 14; i += 1) ctx.fillRect(ASSET.x - 26 + srnd(i) * 52, ASSET.y - 4 - srnd(i + 3) * 12, 4 + srnd(i + 7) * 6, 4 + srnd(i + 5) * 5);
    ctx.fillStyle = `rgba(140,140,150,${(0.3 * (1 - t)).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(ASSET.x, ASSET.y - 24, 28 + t * 22, 0, 6.2832); ctx.fill();
    ctx.fillStyle = COL.bad; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText('ASSET DESTROYED', ASSET.x, ASSET.y + 30);
  } else {
    ctx.strokeStyle = '#566173'; ctx.lineWidth = 1.5;
    ctx.strokeRect(ASSET.x - 22, ASSET.y - 24, 44, 24);
    ctx.beginPath(); ctx.moveTo(ASSET.x - 22, ASSET.y - 24); ctx.lineTo(ASSET.x, ASSET.y - 34); ctx.lineTo(ASSET.x + 22, ASSET.y - 24); ctx.stroke();
    ctx.strokeStyle = 'rgba(91,192,235,0.35)';
    ctx.beginPath(); ctx.arc(ASSET.x, ASSET.y, 40, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText('PROTECTED ASSET', ASSET.x, ASSET.y + 30);
  }
}

function drawScene(rangeErr) {
  const t = state.phase;
  const lost = rangeErr > GATE_HALF_M && !state.patched;
  const sc = SC(Math.min(1, t));
  const tan = scudTangent(Math.min(0.98, t));
  const offPx = rangeErr * M2PX;
  const gate = { x: sc.x - tan.x * offPx, y: sc.y - tan.y * offPx };

  drawBackdrop();

  // Scud incoming arc (faint guide + glowing trail)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.setLineDash([3, 7]); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k <= 40; k += 1) { const p = SC(k / 40); k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke(); ctx.setLineDash([]);

  const inter = (!lost) ? interceptorPath(t) : { pts: [], hit: null };
  const killed = inter.hit && t >= inter.hit.tau;
  const scudEndT = killed ? inter.hit.tau : Math.min(1, t);
  const scudTrail = [];
  for (let k = 0; k <= 60; k += 1) { const tt = scudEndT * k / 60; scudTrail.push(SC(tt)); }
  glowTrail(scudTrail, 1, 'rgb(255,138,76)', COL.scudGlow, 2);

  if (!killed) {
    dart(sc.x, sc.y, Math.atan2(tan.y, tan.x), 22, COL.scud);
    reticle(sc.x, sc.y, t * 6, lost ? COL.bad : COL.amber);
    ctx.fillStyle = COL.scud; ctx.font = fontString(canvas, 'tick', 'mono', 600); ctx.textAlign = 'left';
    ctx.fillText('SCUD  M-5', sc.x + 16, sc.y - 12);
  }

  // radar range gate (where the system THINKS the Scud is). Removed
  // once the Scud is destroyed: there is nothing left to track.
  if (!killed) {
    const gcol = state.patched ? COL.ok : (lost ? COL.bad : COL.ok);
    const flash = lost ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
    ctx.globalAlpha = flash; ctx.strokeStyle = gcol; ctx.lineWidth = 1.6;
    const gw = 17, L = 9;
    // Clean frame-corner brackets: each corner's two arms run inward
    // along the box edges (mirror-symmetric, no rotational hook).
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cxp = gate.x + sx * gw, cyp = gate.y + sy * gw;
      ctx.beginPath();
      ctx.moveTo(cxp - sx * L, cyp); ctx.lineTo(cxp, cyp); ctx.lineTo(cxp, cyp - sy * L);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = gcol; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(lost ? 'GATE (EMPTY - GHOST TRACK)' : 'RANGE GATE', gate.x, gate.y + 30);
  }

  // the clock-drift displacement, labelled (the floating-point lesson)
  if (offPx > 7 && !killed) {
    ctx.strokeStyle = lost ? COL.bad : COL.amber; ctx.lineWidth = 1.3; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(gate.x, gate.y); ctx.lineTo(sc.x, sc.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = lost ? COL.bad : COL.amber; ctx.font = fontString(canvas, 'tick', 'mono', 600); ctx.textAlign = 'center';
    // Below the gate when the gate is high (avoids the status banner);
    // above it otherwise (avoids the RANGE GATE label below it).
    const labY = gate.y < 70 ? gate.y + 46 : gate.y - 26;
    ctx.fillText(`${rangeErr.toFixed(0)} m clock-drift offset`, gate.x, labY);
  }

  // interceptor
  let firing = false;
  if (!lost && inter.pts.length > 1) {
    firing = !killed;
    glowTrail(inter.pts, 1, 'rgb(91,192,235)', COL.intcGlow, 2);
    if (!killed) {
      const a = inter.pts[inter.pts.length - 1], b = inter.pts[inter.pts.length - 2] || a;
      dart(a.x, a.y, Math.atan2(a.y - b.y, a.x - b.x), 17, COL.intc);
      ctx.fillStyle = COL.intc; ctx.font = fontString(canvas, 'tick', 'mono', 600); ctx.textAlign = 'left';
      ctx.fillText('PAC-2', a.x + 10, a.y - 8);
    }
  }
  if (killed) {
    const kt = Math.min(1, (t - inter.hit.tau) / 0.32);
    burst(inter.hit.x, inter.hit.y, kt, false);
  }

  const impacted = lost && t >= 0.99;
  if (impacted) {
    const it = Math.min(1, (t - 0.99) / 0.18);
    burst(ASSET.x, ASSET.y - 8, it, true);
    ctx.strokeStyle = `rgba(239,71,111,${(0.55 * (1 - it)).toFixed(2)})`;
    ctx.lineWidth = 7; ctx.strokeRect(4, 4, W - 8, GROUND_Y - 8);
  }

  drawBattery(firing);
  drawAsset(impacted, impacted ? Math.min(1, (t - 0.99) / 0.18) : 0);

  // HUD status banner
  ctx.textAlign = 'left';
  const msg = state.patched ? 'PATCHED: exact time kept, gate locked, INTERCEPT'
    : lost ? 'TRACK LOST: clock drift walked the gate off, NO LAUNCH, IMPACT'
    : (killed ? 'INTERCEPT: Scud destroyed in flight' : 'TRACKING: gate locked on the Scud, engaging');
  const bc = lost ? COL.bad : COL.ok;
  ctx.fillStyle = bc; ctx.globalAlpha = 0.16; ctx.fillRect(26, 16, 9, 22); ctx.globalAlpha = 1;
  ctx.fillStyle = bc; ctx.fillRect(26, 16, 5, 22);
  ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.fillText(msg, 42, 32);
}

function drawCausePanel(timeErr) {
  const top = 360;
  ctx.textAlign = 'left';
  ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Why: 0.1 is not exact in binary.', 40, top);
  ctx.fillStyle = COL.fg;
  ctx.fillText('24 bits: 0.1 ~ 209715 / 2097152 = 0.0999999046...', 40, top + 20);
  ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`error/tick = ${PATRIOT_ERR_PER_TICK_S.toExponential(3)} s, never reset`, 40, top + 40);
  ctx.fillText(`clock error now = ${(timeErr * 1000).toFixed(1)} ms  at ${state.hours} h uptime`, 40, top + 58);

  const px = 372, py = top - 6, pw = 348, ph = 92;
  const eMax = patriotTimeError(100) * 1.08;
  const xOf = (h) => px + pw * h / 100;
  const yOf = (e) => py + ph * (1 - e / eMax);
  ctx.strokeStyle = COL.grid2; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, ph);
  for (const h of [8, 20, 100]) {
    const x = xOf(h);
    ctx.strokeStyle = COL.grid2; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x, py + ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(`${h}h`, x, py + ph + 11);
  }
  ctx.strokeStyle = COL.bad; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) { const x = xOf(i), y = yOf(patriotTimeError(i)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
  const cx = xOf(state.hours), cy = yOf(state.patched ? 0 : patriotTimeError(state.hours));
  ctx.fillStyle = state.patched ? COL.ok : COL.amber;
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = COL.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('clock error (s) vs uptime', px, py - 10);
  ctx.textAlign = 'center';
  ctx.fillText('Dhahran battery: ~100 h up', px + pw / 2, py + ph + 11);
  ctx.textAlign = 'left';
}

function render() {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  const timeErr = patriotTimeError(state.hours, state.patched);
  const rangeErr = rangeGateErrorMeters(state.hours, state.speed, state.patched);
  drawScene(rangeErr);
  drawCausePanel(timeErr);

  readoutTime.textContent = `${(timeErr * 1000).toFixed(1)} ms`;
  readoutRange.textContent = `${rangeErr.toFixed(0)} m`;
  const lost = rangeErr > GATE_HALF_M;
  readoutStatus.textContent = state.patched ? 'PATCHED' : (lost ? 'LOST' : 'TRACKING');
}

function tick() {
  if (state.playing) { state.phase += 0.005; if (state.phase > 1.22) state.phase = 0; }
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
    state.phase = Math.min(1.05, 0.06 + f * 0.99);
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
