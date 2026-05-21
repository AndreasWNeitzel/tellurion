// Black-hole ringdown playground. The remnant horizon is drawn as an
// oblate spheroid whose shape oscillates with the dominant (2, 2, 0)
// QNM. Below the horizon, the strain h(t) trace decays in real time.

import { qnmFrequency, ringdownProperties, strain, schwarzschildRadius_km, qualityFactor } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rM = document.getElementById('readout-M');
const rChi = document.getElementById('readout-chi');
const rF = document.getElementById('readout-f');
const rTau = document.getElementById('readout-tau');
const rQ = document.getElementById('readout-Q');

const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const sChi = document.getElementById('slider-chi'), vChi = document.getElementById('value-chi');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const sAmp = document.getElementById('slider-amp'), vAmp = document.getElementById('value-amp');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  M_solar: 62,
  chi: 0.69,
  speed: 2,
  amp: 0.20,
  running: !prefersReducedMotion(),
  t_ms: 0,        // simulated ringdown time
  hHistory: [],   // 2D array of {t_ms, h}
  maxHistory: 600,
};

// Scene area: top 65% is 3D BH; bottom 35% is h(t) trace.
const SCENE_H = 0.62 * H;
const STRAIN_H = H - SCENE_H;
const SCENE_RECT = { x: 0, y: 0, w: W, h: SCENE_H };
const STRAIN_RECT = { x: 0, y: SCENE_H, w: W, h: STRAIN_H };

function project3D(x, y, z, scale, cx, cy) {
  // Simple perspective: viewer along +z.
  const k = 1 / (1 + z / 8);
  return { x: cx + x * scale * k, y: cy - y * scale * k, z: z };
}

// Build a UV-grid of the perturbed horizon. The horizon for a Kerr
// BH is oblate, with equatorial radius slightly larger than polar.
// QNM (l=2, m=2) ripples on the surface: r(theta, phi, t) = r0 *
// (1 + epsilon Y_22 * Re(exp(i(omega t + 2 phi)))).
function horizonGeometry(t_ms, amp) {
  const { omegaR_M, omegaI_M } = qnmFrequency(st.chi);
  const r0 = 1.0;
  const a = st.chi;
  const ax = 1.0;        // equatorial radius
  const az = Math.sqrt(Math.max(0.01, 1 - a * a));   // polar radius for Kerr
  // Scale t to dimensionless (use M units same as omegaR_M).
  const M_sec = 4.925490947e-6 * st.M_solar;
  const u = (t_ms / 1000) / M_sec;     // t / M
  const decay = Math.exp(omegaI_M * u);
  const phase = omegaR_M * u;
  // Generate UV grid:
  const N_THETA = 26, N_PHI = 36;
  const verts = [];
  for (let i = 0; i <= N_THETA; i++) {
    const theta = (i / N_THETA) * Math.PI;     // polar angle
    const ct = Math.cos(theta), stt = Math.sin(theta);
    const row = [];
    for (let j = 0; j <= N_PHI; j++) {
      const phi = (j / N_PHI) * 2 * Math.PI;
      // Y_22 ~ sin^2(theta) e^{2 i phi}; spatial Re part is sin^2 cos(2 phi).
      const Y22 = stt * stt * Math.cos(2 * phi + phase);
      const ripple = amp * decay * Y22;
      const r = r0 * (1 + 0.6 * ripple);
      // Kerr oblateness factor (1 + (1 - az) cos^2 theta).
      const obl = 1 / (Math.sqrt(stt * stt + (1 / (az * az)) * ct * ct));
      const rr = r * obl;
      const x = rr * stt * Math.cos(phi);
      const y = rr * ct;
      const z = rr * stt * Math.sin(phi);
      row.push({ x, y, z });
    }
    verts.push(row);
  }
  return verts;
}

function drawScene() {
  ctx.fillStyle = '#03050b';
  ctx.fillRect(0, 0, W, H);
  // Starfield in scene area.
  for (let i = 0; i < 110; i++) {
    const ix = (i * 23.7) % SCENE_RECT.w;
    const iy = (i * 31.1) % SCENE_RECT.h;
    const sb = 0.15 + 0.45 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }

  // Camera setup
  const cx = SCENE_RECT.x + SCENE_RECT.w / 2;
  const cy = SCENE_RECT.y + SCENE_RECT.h / 2;
  const scale = 0.36 * SCENE_RECT.h;

  // Tilt camera by yaw + pitch.
  const yaw = -0.4, pitch = 0.25;
  const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  function cameraTransform(p) {
    let X = cy_ * p.x + sy_ * p.z;
    let Z = -sy_ * p.x + cy_ * p.z;
    let Y = cp * p.y - sp * Z;
    Z = sp * p.y + cp * Z;
    return { x: X, y: Y, z: Z };
  }

  // Glow halo behind the BH.
  const gC = project3D(0, 0, 0, scale, cx, cy);
  const haloR = scale * 1.4;
  const halo = ctx.createRadialGradient(gC.x, gC.y, 0, gC.x, gC.y, haloR);
  halo.addColorStop(0, 'rgba(255, 180, 100, 0.5)');
  halo.addColorStop(0.4, 'rgba(180, 110, 200, 0.25)');
  halo.addColorStop(1, 'rgba(120, 80, 220, 0.0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(gC.x, gC.y, haloR, 0, Math.PI * 2); ctx.fill();

  // Horizon mesh.
  const verts = horizonGeometry(st.t_ms, st.amp);
  // Project + collect quads with depth.
  const quads = [];
  for (let i = 0; i < verts.length - 1; i++) {
    for (let j = 0; j < verts[0].length - 1; j++) {
      const a = cameraTransform(verts[i][j]);
      const b = cameraTransform(verts[i + 1][j]);
      const c = cameraTransform(verts[i + 1][j + 1]);
      const d = cameraTransform(verts[i][j + 1]);
      const zAvg = (a.z + b.z + c.z + d.z) / 4;
      quads.push({ a, b, c, d, zAvg });
    }
  }
  quads.sort((p, q) => p.zAvg - q.zAvg);
  for (const q of quads) {
    const pa = project3D(q.a.x, q.a.y, q.a.z, scale, cx, cy);
    const pb = project3D(q.b.x, q.b.y, q.b.z, scale, cx, cy);
    const pc = project3D(q.c.x, q.c.y, q.c.z, scale, cx, cy);
    const pd = project3D(q.d.x, q.d.y, q.d.z, scale, cx, cy);
    // Face brightness: lambert with light from (1, 1, -1).
    const e1 = { x: q.b.x - q.a.x, y: q.b.y - q.a.y, z: q.b.z - q.a.z };
    const e2 = { x: q.d.x - q.a.x, y: q.d.y - q.a.y, z: q.d.z - q.a.z };
    const n = { x: e1.y * e2.z - e1.z * e2.y, y: e1.z * e2.x - e1.x * e2.z, z: e1.x * e2.y - e1.y * e2.x };
    const nl = Math.hypot(n.x, n.y, n.z) || 1;
    n.x /= nl; n.y /= nl; n.z /= nl;
    const lx = 0.6, ly = 0.7, lz = -0.4;
    const ll = Math.hypot(lx, ly, lz);
    const lit = Math.max(0, (n.x * lx + n.y * ly + n.z * lz) / ll);
    const brightness = 0.05 + 0.55 * lit;
    const grey = Math.round(40 * brightness);
    ctx.fillStyle = `rgba(${grey}, ${grey}, ${grey + 8}, 0.95)`;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.lineTo(pc.x, pc.y);
    ctx.lineTo(pd.x, pd.y);
    ctx.closePath();
    ctx.fill();
  }
  // Surface highlight edges of the bulge (m=2 lobes).
  ctx.strokeStyle = 'rgba(255, 220, 180, 0.6)';
  ctx.lineWidth = 1.6;
  const { omegaR_M, omegaI_M } = qnmFrequency(st.chi);
  const M_sec = 4.925490947e-6 * st.M_solar;
  const u = (st.t_ms / 1000) / M_sec;
  const decay = Math.exp(omegaI_M * u);
  const ph = omegaR_M * u;
  for (let lobe = 0; lobe < 2; lobe++) {
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const t = (k / 40) * Math.PI;
      const r = 1 + 0.6 * 0.2 * decay * Math.sin(t) * Math.sin(t) * Math.cos(ph + lobe * Math.PI);
      const lat = (lobe ? -1 : 1) * 0.4;
      const az = Math.sqrt(Math.max(0.01, 1 - st.chi * st.chi));
      const obl = 1 / (Math.sqrt(Math.sin(t) * Math.sin(t) + (1 / (az * az)) * Math.cos(t) * Math.cos(t)));
      const rr = r * obl;
      const px = rr * Math.sin(t) * Math.cos((k / 40) * 2 * Math.PI + lat);
      const py = rr * Math.cos(t);
      const pz = rr * Math.sin(t) * Math.sin((k / 40) * 2 * Math.PI + lat);
      const pt = cameraTransform({ x: px, y: py, z: pz });
      const sp_ = project3D(pt.x, pt.y, pt.z, scale, cx, cy);
      if (k === 0) ctx.moveTo(sp_.x, sp_.y); else ctx.lineTo(sp_.x, sp_.y);
    }
    ctx.stroke();
  }

  // Caption strip
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  const props = ringdownProperties(st.M_solar, st.chi);
  ctx.fillText(`M = ${st.M_solar} M_sun, chi = ${st.chi.toFixed(2)} -> f = ${props.f_Hz.toFixed(1)} Hz, tau = ${props.tau_ms.toFixed(2)} ms, Q = ${props.Q.toFixed(2)}`, 16, 24);
}

function drawStrain() {
  // Frame
  const { x, y, w, h } = STRAIN_RECT;
  ctx.fillStyle = 'rgba(12, 16, 28, 0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('strain h(t)', x + 14, y + 18);

  // Zero line.
  const midY = y + h / 2;
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.18)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, midY); ctx.lineTo(x + w, midY); ctx.stroke();
  ctx.setLineDash([]);

  // Plot history.
  if (st.hHistory.length < 2) return;
  const tMax = st.hHistory[st.hHistory.length - 1].t_ms;
  const tMin = tMax - 50;       // 50 ms window
  const yMid = midY, yAmp = h * 0.42;
  ctx.strokeStyle = 'rgba(120, 240, 200, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let first = true;
  for (const pt of st.hHistory) {
    if (pt.t_ms < tMin) continue;
    const xx = x + ((pt.t_ms - tMin) / (tMax - tMin)) * w;
    const yy = yMid - pt.h * yAmp;
    if (first) { ctx.moveTo(xx, yy); first = false; } else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Envelope (exponential decay).
  ctx.strokeStyle = 'rgba(255, 180, 140, 0.40)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  const props = ringdownProperties(st.M_solar, st.chi);
  ctx.beginPath();
  let firstUp = true, firstDn = true;
  for (let k = 0; k < 200; k++) {
    const tt = tMin + (k / 199) * (tMax - tMin);
    if (tt < 0) continue;
    const envU = Math.exp(-tt / 1000 / props.tau_s);
    const xx = x + ((tt - tMin) / (tMax - tMin)) * w;
    const yU = yMid - envU * yAmp;
    if (firstUp) { ctx.moveTo(xx, yU); firstUp = false; } else ctx.lineTo(xx, yU);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k < 200; k++) {
    const tt = tMin + (k / 199) * (tMax - tMin);
    if (tt < 0) continue;
    const envD = -Math.exp(-tt / 1000 / props.tau_s);
    const xx = x + ((tt - tMin) / (tMax - tMin)) * w;
    const yD = yMid - envD * yAmp;
    if (firstDn) { ctx.moveTo(xx, yD); firstDn = false; } else ctx.lineTo(xx, yD);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Time axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('0', x + 4, y + h - 4);
  ctx.fillText(`${tMax.toFixed(0)} ms`, x + w - 50, y + h - 4);
}

function updateReadout() {
  const props = ringdownProperties(st.M_solar, st.chi);
  rM.textContent = `${st.M_solar} M_sun`;
  rChi.textContent = st.chi.toFixed(2);
  rF.textContent = props.f_Hz.toFixed(1) + ' Hz';
  rTau.textContent = props.tau_ms.toFixed(2) + ' ms';
  rQ.textContent = props.Q.toFixed(2);
}

function step(dt_real_s) {
  // Advance simulated ringdown time. Slow it down so user can see it.
  const slowdown = 60;
  st.t_ms += dt_real_s * 1000 * Math.max(0.1, st.speed) / slowdown;
  const h = strain(st.t_ms, st.M_solar, st.chi);
  st.hHistory.push({ t_ms: st.t_ms, h });
  while (st.hHistory.length > st.maxHistory) st.hHistory.shift();
  // Reset when amplitude drops below 1% (already decayed away).
  const props = ringdownProperties(st.M_solar, st.chi);
  if (st.t_ms > 8 * props.tau_ms) {
    st.t_ms = 0;
    st.hHistory = [];
  }
}

function draw() {
  drawScene();
  drawStrain();
  updateReadout();
}

function readSliders() {
  st.M_solar = parseInt(sM.value, 10);
  st.chi = parseFloat(sChi.value);
  st.speed = parseInt(sSpeed.value, 10);
  st.amp = parseFloat(sAmp.value);
  vM.textContent = `${st.M_solar} M_sun`;
  vChi.textContent = st.chi.toFixed(2);
  vSpeed.textContent = String(st.speed);
  vAmp.textContent = st.amp.toFixed(2);
}

[sM, sChi, sSpeed, sAmp].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => { st.t_ms = 0; st.hHistory = []; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  mass_solar: { get: () => st.M_solar, set: v => { st.M_solar = parseInt(v, 10); sM.value = v; }, parse: parseInt },
  spin: { get: () => st.chi, set: v => { st.chi = parseFloat(v); sChi.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Advance to CAPTURE_FRAC * 30 ms.
  const target = (CAPTURE_FRAC || 0) * 30;
  let tt = 0;
  while (tt < target) {
    step(1 / 60);
    tt += 1000 / 60 / 60;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) step(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
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
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
