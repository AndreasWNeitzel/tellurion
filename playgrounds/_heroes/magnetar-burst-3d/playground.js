// Magnetar burst playground. A neutron star + extreme dipole field +
// stochastic crustquake bursts + lightcurve.

import {
  spindownDotP, spindownAge_yr, magneticEnergy_J, B_QED_G,
  isInBurstingRegime, burstLightcurve, makeRng, KNOWN_MAGNETARS,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rB = document.getElementById('readout-B');
const rBratio = document.getElementById('readout-Bratio');
const rP = document.getElementById('readout-P');
const rTau = document.getElementById('readout-tau');
const rEb = document.getElementById('readout-Eb');

const sLogB = document.getElementById('slider-logB'), vLogB = document.getElementById('value-logB');
const sP = document.getElementById('slider-P'), vP = document.getElementById('value-P');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  logB: 15.0,
  P: 7.5,
  speed: 2,
  running: !prefersReducedMotion(),
  t: 0,
  rng: makeRng(0xC0FFEE),
  bursts: [],          // active burst entries: {t_start, surface_lat, surface_lon, peak_t}
  lightCurve: [],      // {t, L} history
  spin: 0,
};

function B_G() { return Math.pow(10, st.logB); }

const SCENE = { cx: W * 0.36, cy: H * 0.42, r: 90 };
const LC = { x: 30, y: 0.66 * H + 8, w: W - 60, h: 0.30 * H - 16 };

function drawSky() {
  ctx.fillStyle = '#03030a';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 130; i++) {
    const ix = (i * 23.7) % W;
    const iy = (i * 31.1) % (SCENE.cy * 1.7);
    ctx.fillStyle = `rgba(190, 200, 255, ${0.10 + 0.40 * ((i * 7) % 17) / 17})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
}

function drawDipoleField() {
  // Show 8 dipole field lines around the NS in the orbit plane.
  // Field-line equation in 2D: r = r0 sin^2 theta where r0 sets the
  // line. We draw closed loops emanating from the poles.
  const N_LINES = 10;
  for (let i = 0; i < N_LINES; i++) {
    const r0_scale = 1.6 + i * 0.45;       // multiplier of r_NS
    ctx.strokeStyle = `rgba(120, 220, 255, ${(0.5 - i * 0.04).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    let first = true;
    for (let k = 0; k <= 80; k++) {
      const theta = (k / 80) * Math.PI;
      const r = SCENE.r * r0_scale * Math.sin(theta) * Math.sin(theta);
      // Rotate the field line by st.spin around the NS axis (z).
      const x = r * Math.sin(theta);
      const y = -r * Math.cos(theta);
      // Rotate around z by st.spin to simulate the dipole axis tilt.
      const cs = Math.cos(0.18);   // small tilt
      const sn = Math.sin(0.18);
      const xr = x * cs - y * sn;
      const yr = x * sn + y * cs;
      const px = SCENE.cx + xr;
      const py = SCENE.cy + yr;
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Mirror on the other side.
    ctx.beginPath();
    first = true;
    for (let k = 0; k <= 80; k++) {
      const theta = (k / 80) * Math.PI;
      const r = SCENE.r * r0_scale * Math.sin(theta) * Math.sin(theta);
      const x = -r * Math.sin(theta);
      const y = -r * Math.cos(theta);
      const cs = Math.cos(0.18);
      const sn = Math.sin(0.18);
      const xr = x * cs - y * sn;
      const yr = x * sn + y * cs;
      const px = SCENE.cx + xr;
      const py = SCENE.cy + yr;
      if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function drawNeutronStar() {
  // Faint photon-ring glow then solid body.
  const grad = ctx.createRadialGradient(SCENE.cx, SCENE.cy, SCENE.r * 0.7, SCENE.cx, SCENE.cy, SCENE.r * 1.6);
  grad.addColorStop(0, 'rgba(180, 220, 255, 0.95)');
  grad.addColorStop(0.6, 'rgba(255, 220, 180, 0.35)');
  grad.addColorStop(1, 'rgba(255, 110, 90, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(SCENE.cx, SCENE.cy, SCENE.r * 1.6, 0, Math.PI * 2); ctx.fill();
  // Solid surface.
  const surf = ctx.createRadialGradient(SCENE.cx - SCENE.r * 0.4, SCENE.cy - SCENE.r * 0.4, SCENE.r * 0.2, SCENE.cx, SCENE.cy, SCENE.r);
  surf.addColorStop(0, 'rgba(255, 255, 255, 1)');
  surf.addColorStop(0.7, 'rgba(180, 200, 240, 1)');
  surf.addColorStop(1, 'rgba(60, 80, 130, 1)');
  ctx.fillStyle = surf;
  ctx.beginPath(); ctx.arc(SCENE.cx, SCENE.cy, SCENE.r, 0, Math.PI * 2); ctx.fill();
}

function spawnBurst() {
  // Random surface location (longitude, latitude). Encode as (theta, phi).
  const lat = -Math.PI / 2 + st.rng() * Math.PI;
  const lon = (st.rng()) * 2 * Math.PI + st.spin;
  st.bursts.push({ t0: st.t, lat, lon, intensity: 0.5 + 0.5 * st.rng() });
  if (st.bursts.length > 12) st.bursts.shift();
}

function stepBursts(dt) {
  // Bursting rate scales with B^2: each B/B_QED above 1 fires roughly
  // one burst per ~ 10 seconds. We'll fire stochastically.
  if (!isInBurstingRegime(B_G())) return;
  const Bratio = B_G() / B_QED_G;
  const rate_per_s = 0.15 * Math.min(8, Bratio);
  st._burstAcc = (st._burstAcc || 0) + dt * rate_per_s;
  while (st._burstAcc > 1) {
    st._burstAcc -= 1;
    spawnBurst();
  }
  // Aggregate lightcurve.
  let L_now = 0;
  for (const b of st.bursts) {
    const dt_burst = st.t - b.t0;
    L_now += b.intensity * burstLightcurve(dt_burst, 0.05);
  }
  st.lightCurve.push({ t: st.t, L: L_now });
  if (st.lightCurve.length > 1200) st.lightCurve.shift();
}

function drawBursts() {
  for (const b of st.bursts) {
    const dt_burst = st.t - b.t0;
    if (dt_burst > 4) continue;
    const inten = b.intensity * burstLightcurve(dt_burst, 0.05);
    if (inten < 0.005) continue;
    // Surface point: project (lat, lon) to canvas. Take the front
    // hemisphere only.
    const sx = SCENE.r * Math.cos(b.lat) * Math.cos(b.lon);
    const sy = SCENE.r * Math.sin(b.lat);
    const sz = SCENE.r * Math.cos(b.lat) * Math.sin(b.lon);
    if (sz < 0) continue;
    const px = SCENE.cx + sx;
    const py = SCENE.cy + sy;
    const r_flare = 6 + 30 * Math.min(1, inten);
    const g = ctx.createRadialGradient(px, py, 1, px, py, r_flare);
    g.addColorStop(0, `rgba(255, 240, 220, ${Math.min(1, inten).toFixed(3)})`);
    g.addColorStop(0.5, `rgba(255, 130, 100, ${(0.4 * inten).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255, 0, 60, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r_flare, 0, Math.PI * 2); ctx.fill();
    // Outgoing photon trace.
    ctx.strokeStyle = `rgba(255, 220, 160, ${Math.min(0.7, inten).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    const outR = SCENE.r * (1 + dt_burst * 5);
    if (outR < SCENE.r * 4) {
      ctx.beginPath();
      const ox = SCENE.cx + outR * Math.cos(b.lat) * Math.cos(b.lon);
      const oy = SCENE.cy + outR * Math.sin(b.lat);
      ctx.moveTo(px, py); ctx.lineTo(ox, oy); ctx.stroke();
    }
  }
}

function drawLightCurve() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(LC.x, LC.y, LC.w, LC.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(LC.x + 0.5, LC.y + 0.5, LC.w - 1, LC.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('X-ray lightcurve (last 20 s)', LC.x + 8, LC.y - 6);

  if (st.lightCurve.length < 2) return;
  const tNow = st.t;
  const tMin = tNow - 20;
  let Lmax = 0.001;
  for (const p of st.lightCurve) if (p.L > Lmax) Lmax = p.L;
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let first = true;
  for (const p of st.lightCurve) {
    if (p.t < tMin) continue;
    const xx = LC.x + 30 + ((p.t - tMin) / (tNow - tMin)) * (LC.w - 50);
    const yy = LC.y + LC.h - 12 - (p.L / Lmax) * (LC.h - 30);
    if (first) { ctx.moveTo(xx, yy); first = false; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('L', LC.x + 8, LC.y + 18);
  ctx.fillText('t (s)', LC.x + LC.w / 2 - 14, LC.y + LC.h - 4);
}

function drawSidePanel() {
  const x = 0.65 * W, y = 30, w = W - x - 14, h = 0.55 * H;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Magnetar diagnostics', x + 8, y - 6);
  let yy = y + 24;
  const row = (k, v, c = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(k, x + 10, yy);
    ctx.fillStyle = c;
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(v, x + 10, yy + 14);
    yy += 30;
  };
  const B = B_G();
  row('B (Gauss)', B.toExponential(2));
  row('B / B_QED', (B / B_QED_G).toFixed(2), B > B_QED_G ? '#ffd28a' : '#e0e8ff');
  row('P (s)', st.P.toFixed(2));
  const dP = spindownDotP(B, st.P);
  row('dot P (s/s)', dP.toExponential(2));
  row('tau (yr)', spindownAge_yr(B, st.P).toExponential(2));
  row('E_B (J)', magneticEnergy_J(B).toExponential(2));
  row('bursting?', isInBurstingRegime(B) ? 'YES' : 'no', isInBurstingRegime(B) ? '#ffd28a' : '#9aa');
}

function updateReadout() {
  const B = B_G();
  rB.textContent = B.toExponential(2);
  rBratio.textContent = (B / B_QED_G).toFixed(2);
  rP.textContent = st.P.toFixed(2);
  rTau.textContent = spindownAge_yr(B, st.P).toExponential(2);
  rEb.textContent = magneticEnergy_J(B).toExponential(2);
}

function draw() {
  drawSky();
  drawDipoleField();
  drawNeutronStar();
  drawBursts();
  drawLightCurve();
  drawSidePanel();
  updateReadout();
  // Caption strip.
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`B = ${B_G().toExponential(1)} G, P = ${st.P.toFixed(1)} s, ${isInBurstingRegime(B_G()) ? 'bursting' : 'quiescent'}`, 14, SCENE.cy + SCENE.r * 2.4 + 14);
}

function readSliders() {
  st.logB = parseFloat(sLogB.value);
  st.P = parseFloat(sP.value);
  st.speed = parseInt(sSpeed.value, 10);
  vLogB.textContent = st.logB.toFixed(2);
  vP.textContent = st.P.toFixed(2);
  vSpeed.textContent = String(st.speed);
}

function applyPreset(name) {
  if (name === 'sgr1806') { st.logB = Math.log10(2e15); st.P = 7.55; }
  else if (name === 'axp1841') { st.logB = Math.log10(7e14); st.P = 11.78; }
  else if (name === 'normal') { st.logB = 12.0; st.P = 1.0; }
  sLogB.value = String(st.logB);
  sP.value = String(st.P);
  readSliders();
  vPreset.textContent = name.slice(0, 4);
}

[sLogB, sP, sSpeed].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', () => applyPreset(selPreset.value));
btnReset.addEventListener('click', () => { st.t = 0; st.bursts = []; st.lightCurve = []; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  b_field_log: { get: () => st.logB, set: v => { st.logB = parseFloat(v); sLogB.value = v; }, parse: parseFloat },
  period_s: { get: () => st.P, set: v => { st.P = parseFloat(v); sP.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Pre-step several seconds to populate bursts.
  const target = 3 + 4 * (CAPTURE_FRAC || 0);
  let tt = 0;
  const dtFixed = 0.05;
  while (tt < target) {
    st.t = tt;
    st.spin += dtFixed * 0.5;
    stepBursts(dtFixed);
    tt += dtFixed;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      st.t += dt;
      st.spin += dt * (2 * Math.PI / Math.max(0.5, st.P)) * 0.15;
      stepBursts(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
