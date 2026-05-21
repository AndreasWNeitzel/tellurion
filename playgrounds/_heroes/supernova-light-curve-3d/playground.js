// Supernova Light Curve hero. 3D fireball + bolometric light curve +
// mass-partition strip. The fireball grows homologously (r = v_ej t)
// and dims along with the Arnett-1982 decay-powered light curve.

import {
  massPartition, bolometricLuminosity_ergS, absoluteBolMag,
  fireballRadius_cm, SN_PRESETS, makeRng,
} from './sim.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 5, minRadius: 2, maxRadius: 15,
  azimuthDeg: 30, elevationDeg: 18, fovDeg: 50,
});

// Readouts.
const rType = document.getElementById('readout-type');
const rT = document.getElementById('readout-t');
const rL = document.getElementById('readout-L');
const rMv = document.getElementById('readout-mv');
const rR = document.getElementById('readout-r');

// Controls.
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sMni = document.getElementById('slider-mni'), vMni = document.getElementById('value-mni');
const sTdiff = document.getElementById('slider-tdiff'), vTdiff = document.getElementById('value-tdiff');
const sVej = document.getElementById('slider-vej'), vVej = document.getElementById('value-vej');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  preset: 'ia_2011fe',
  m_Ni: 0.60,
  t_diff_d: 14,
  v_ej_kms: 11000,
  running: !prefersReducedMotion(),
  t_d: 5,            // current time in days (animated)
  T_MAX_D: 200,
};

function applyPreset(name) {
  const p = SN_PRESETS[name];
  if (!p) return;
  st.preset = name;
  st.m_Ni = p.m0_Ni;
  st.t_diff_d = p.t_diff_d;
  st.v_ej_kms = p.v_ej_kms;
  sMni.value = String(p.m0_Ni);
  sTdiff.value = String(p.t_diff_d);
  sVej.value = String(p.v_ej_kms);
}

// =========================================================================
// 3D STARFIELD + FIREBALL via depth-sorted UV quads.
// =========================================================================
const STARS = [];
{
  const r = makeRng(0xD15EA5E);
  for (let i = 0; i < 220; i++) {
    STARS.push({ x: r() * W, y: r() * H, b: 0.10 + 0.70 * r() });
  }
}
function drawSky() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (const s of STARS) {
    ctx.fillStyle = `rgba(200, 220, 255, ${s.b.toFixed(3)})`;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
}

function makeCamBasis() {
  const eye = camera.eyePosition();
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const fx = target[0] - eye[0], fy = target[1] - eye[1], fz = target[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz);
  const f = [fx / fl, fy / fl, fz / fl];
  const rx = f[1] * up[2] - f[2] * up[1];
  const ry = f[2] * up[0] - f[0] * up[2];
  const rz = f[0] * up[1] - f[1] * up[0];
  const rl = Math.hypot(rx, ry, rz);
  const r = [rx / rl, ry / rl, rz / rl];
  const ux = r[1] * f[2] - r[2] * f[1];
  const uy = r[2] * f[0] - r[0] * f[2];
  const uz = r[0] * f[1] - r[1] * f[0];
  const u = [ux, uy, uz];
  return { eye, f, r, u, tanHalfFov: Math.tan(50 * Math.PI / 180 / 2), aspect: W / H };
}
function w2s(p, cam) {
  const dx = p[0] - cam.eye[0], dy = p[1] - cam.eye[1], dz = p[2] - cam.eye[2];
  const zf = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
  if (zf <= 0.01) return null;
  const xr = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
  const yu = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
  const xn = xr / (zf * cam.tanHalfFov * cam.aspect);
  const yn = yu / (zf * cam.tanHalfFov);
  return { x: (xn * 0.5 + 0.5) * W, y: (1.0 - (yn * 0.5 + 0.5)) * H, depth: zf };
}

const N_TH = 16, N_PH = 24;
const fireballQuads = [];
{
  for (let i = 0; i < N_TH; i++) {
    const th0 = (i / N_TH) * Math.PI;
    const th1 = ((i + 1) / N_TH) * Math.PI;
    for (let j = 0; j < N_PH; j++) {
      const ph0 = (j / N_PH) * 2 * Math.PI;
      const ph1 = ((j + 1) / N_PH) * 2 * Math.PI;
      fireballQuads.push({ th0, th1, ph0, ph1 });
    }
  }
}

// Fireball color based on temperature (proxy: brightness at peak ~ orange/white,
// late times -> reddish).
function fireballColor(t_days, L_norm) {
  // L_norm is 0..1 (peak = 1). At peak we shine bright white-yellow;
  // late we cool to red-orange.
  const x = Math.min(1, Math.max(0, L_norm));
  const r = 255;
  const g = Math.round(200 + 50 * x);
  const b = Math.round(80 + 150 * x);
  return [r, g, b];
}

function drawFireball(cam, t_days, L_norm) {
  // Fireball radius in scene units. We use a scaled visual radius:
  // r_visual = log(1 + t_days/5).
  const rVis = 0.5 + 1.5 * Math.log10(1 + t_days / 5);
  const col = fireballColor(t_days, L_norm);
  const items = [];
  for (const q of fireballQuads) {
    const thc = (q.th0 + q.th1) / 2;
    const phc = (q.ph0 + q.ph1) / 2;
    const center = [
      rVis * Math.sin(thc) * Math.cos(phc),
      rVis * Math.cos(thc),
      rVis * Math.sin(thc) * Math.sin(phc),
    ];
    const dx = center[0] - cam.eye[0], dy = center[1] - cam.eye[1], dz = center[2] - cam.eye[2];
    const depth = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    if (depth <= 0) continue;
    const norm = [center[0] / rVis, center[1] / rVis, center[2] / rVis];
    const facing = (dx * norm[0] + dy * norm[1] + dz * norm[2]);
    if (facing > 0) continue;
    items.push({ q, thc, phc, center, depth, norm });
  }
  items.sort((a, b) => b.depth - a.depth);
  for (const it of items) {
    const { q, center, norm } = it;
    const verts = [
      [rVis * Math.sin(q.th0) * Math.cos(q.ph0), rVis * Math.cos(q.th0), rVis * Math.sin(q.th0) * Math.sin(q.ph0)],
      [rVis * Math.sin(q.th0) * Math.cos(q.ph1), rVis * Math.cos(q.th0), rVis * Math.sin(q.th0) * Math.sin(q.ph1)],
      [rVis * Math.sin(q.th1) * Math.cos(q.ph1), rVis * Math.cos(q.th1), rVis * Math.sin(q.th1) * Math.sin(q.ph1)],
      [rVis * Math.sin(q.th1) * Math.cos(q.ph0), rVis * Math.cos(q.th1), rVis * Math.sin(q.th1) * Math.sin(q.ph0)],
    ];
    const proj = verts.map(v => w2s(v, cam));
    if (proj.some(p => p === null)) continue;
    const toEye = [cam.eye[0] - center[0], cam.eye[1] - center[1], cam.eye[2] - center[2]];
    const teLen = Math.hypot(...toEye);
    const dot = (norm[0] * toEye[0] + norm[1] * toEye[1] + norm[2] * toEye[2]) / teLen;
    const shade = Math.max(0.20, dot) * (0.4 + 0.6 * L_norm);
    ctx.fillStyle = `rgb(${Math.round(col[0] * shade)}, ${Math.round(col[1] * shade)}, ${Math.round(col[2] * shade)})`;
    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    ctx.lineTo(proj[1].x, proj[1].y);
    ctx.lineTo(proj[2].x, proj[2].y);
    ctx.lineTo(proj[3].x, proj[3].y);
    ctx.closePath();
    ctx.fill();
  }
  // Outer glow halo (depends on luminosity).
  const center2D = w2s([0, 0, 0], cam);
  if (center2D) {
    const refR = w2s([rVis, 0, 0], cam);
    const RpxBase = refR ? Math.hypot(refR.x - center2D.x, refR.y - center2D.y) : 60;
    const haloR = RpxBase * (1.8 + 1.0 * L_norm);
    const glow = ctx.createRadialGradient(center2D.x, center2D.y, RpxBase, center2D.x, center2D.y, haloR);
    glow.addColorStop(0, `rgba(255, 220, 150, ${(0.40 * L_norm).toFixed(3)})`);
    glow.addColorStop(0.5, `rgba(255, 140, 100, ${(0.20 * L_norm).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(255, 100, 80, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(center2D.x, center2D.y, haloR, 0, 2 * Math.PI); ctx.fill();
  }
}

// =========================================================================
// LIGHT CURVE PANEL.
// =========================================================================
function drawLightcurvePanel() {
  const px = 0.50 * W, py = 50, pw = 0.46 * W - 14, ph = 240;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('bolometric L(t) (log) over 200 days', px + 8, py - 6);
  // Compute L(t).
  const N = 200;
  const t_arr = [], L_arr = [];
  let Lmax = 0;
  for (let k = 0; k < N; k++) {
    const t = (k / (N - 1)) * st.T_MAX_D + 0.5;
    const L = bolometricLuminosity_ergS(t, st.m_Ni, st.t_diff_d);
    t_arr.push(t); L_arr.push(L);
    if (L > Lmax) Lmax = L;
  }
  const Llog_max = Math.log10(Math.max(1e10, Lmax)) + 0.5;
  const Llog_min = Llog_max - 4.5;     // 4.5 dex range
  function xForT(t) { return px + 30 + (t / st.T_MAX_D) * (pw - 50); }
  function yForL(L) {
    const Llog = Math.log10(Math.max(1e10, L));
    return py + ph - 28 - (Llog - Llog_min) / (Llog_max - Llog_min) * (ph - 50);
  }
  // Grid (log decades).
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let lv = Math.floor(Llog_min); lv <= Math.ceil(Llog_max); lv++) {
    const Y = py + ph - 28 - (lv - Llog_min) / (Llog_max - Llog_min) * (ph - 50);
    ctx.beginPath(); ctx.moveTo(px + 30, Y); ctx.lineTo(px + pw - 20, Y); ctx.stroke();
    ctx.fillStyle = 'rgba(180, 200, 240, 0.65)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`1e${lv}`, px + 4, Y + 4);
  }
  for (let t = 0; t <= 200; t += 50) {
    ctx.beginPath(); ctx.moveTo(xForT(t), py + 16); ctx.lineTo(xForT(t), py + ph - 28); ctx.stroke();
  }
  // Light curve.
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = xForT(t_arr[k]); const y = yForL(L_arr[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Co tail (asymptote).
  ctx.strokeStyle = 'rgba(255, 140, 110, 0.55)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    if (t_arr[k] < 60) continue;
    // Co-only tail: L ~ exp(-t/tau_Co) at late times.
    const tail = bolometricLuminosity_ergS(t_arr[k], st.m_Ni, 1);
    const x = xForT(t_arr[k]); const y = yForL(tail);
    if (k === Math.floor(60 / st.T_MAX_D * N)) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // Current cursor.
  const Lnow = bolometricLuminosity_ergS(st.t_d, st.m_Ni, st.t_diff_d);
  const xc = xForT(st.t_d), yc = yForL(Lnow);
  ctx.fillStyle = 'rgba(255, 255, 200, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 5, 0, 2 * Math.PI); ctx.fill();
  // Axes labels.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('t (d)', px + pw - 32, py + ph - 8);
  ctx.fillText('L (erg/s, log)', px + 4, py + 14);
  ctx.fillText('0', xForT(0) - 4, py + ph - 12);
  ctx.fillText('50', xForT(50) - 8, py + ph - 12);
  ctx.fillText('100', xForT(100) - 8, py + ph - 12);
  ctx.fillText('150', xForT(150) - 10, py + ph - 12);
  ctx.fillText('200', xForT(200) - 12, py + ph - 12);
  // Current readout strip.
  const Mv = absoluteBolMag(Lnow);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`t = ${st.t_d.toFixed(0)} d; L = ${Lnow.toExponential(2)} erg/s; M_bol = ${Mv.toFixed(2)}`,
    px + 8, py + ph + 18);

  return { Lmax, Lnow };
}

// =========================================================================
// MASS-PARTITION PANEL (Ni / Co / Fe stacked bars).
// =========================================================================
function drawMassPartitionPanel() {
  const px = 0.50 * W, py = 320, pw = 0.46 * W - 14, ph = H - 360;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('mass partition Ni -> Co -> Fe (M_sun)', px + 8, py - 6);
  // Plot three lines over t.
  const N = 200;
  function xForT(t) { return px + 30 + (t / st.T_MAX_D) * (pw - 50); }
  function yForM(m) { return py + ph - 24 - (m / st.m_Ni) * (ph - 44); }
  // Grid.
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let t = 0; t <= 200; t += 50) {
    ctx.beginPath(); ctx.moveTo(xForT(t), py + 16); ctx.lineTo(xForT(t), py + ph - 24); ctx.stroke();
  }
  const colors = { Ni: 'rgba(120, 220, 255, 0.95)', Co: 'rgba(255, 220, 120, 0.95)', Fe: 'rgba(255, 130, 110, 0.95)' };
  for (const species of ['Ni', 'Co', 'Fe']) {
    ctx.strokeStyle = colors[species]; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const t = (k / (N - 1)) * st.T_MAX_D + 0.5;
      const p = massPartition(t, st.m_Ni);
      const m = species === 'Ni' ? p.mNi : species === 'Co' ? p.mCo : p.mFe;
      const x = xForT(t); const y = yForM(m);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Current cursor (vertical line).
  const xc = xForT(st.t_d);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xc, py + 16); ctx.lineTo(xc, py + ph - 24); ctx.stroke();
  ctx.setLineDash([]);
  // Legend.
  let lyy = py + 30;
  for (const species of ['Ni', 'Co', 'Fe']) {
    ctx.fillStyle = colors[species];
    ctx.fillRect(px + pw - 80, lyy - 7, 10, 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.90)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(species, px + pw - 66, lyy - 4);
    lyy += 14;
  }
  // Current numbers.
  const p = massPartition(st.t_d, st.m_Ni);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`@ t = ${st.t_d.toFixed(0)} d: Ni = ${p.mNi.toFixed(3)}, Co = ${p.mCo.toFixed(3)}, Fe = ${p.mFe.toFixed(3)}`,
    px + 8, py + ph + 18);
}

// =========================================================================
// SIDE-LEFT INFO PANEL (preset summary).
// =========================================================================
function drawInfoPanel() {
  const px = 12, py = 50, pw = 200, ph = 130;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('SN preset', px + 8, py - 6);
  const p = SN_PRESETS[st.preset];
  let yy = py + 24;
  const row = (k, v, c = '#e0e8ff') => {
    ctx.fillStyle = 'rgba(180, 190, 215, 0.85)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(k, px + 10, yy);
    ctx.fillStyle = c;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(v, px + 10, yy + 14);
    yy += 30;
  };
  row('type', p.type, '#ffd28a');
  row('M_Ni (M_sun)', st.m_Ni.toFixed(3));
  row('v_ej (km/s)', String(st.v_ej_kms));
  row('expected peak M_V', p.peak_MV.toFixed(2));
}

function updateReadout(Lnow) {
  const Mv = absoluteBolMag(Lnow);
  const r_cm = fireballRadius_cm(st.t_d, st.v_ej_kms);
  rType.textContent = SN_PRESETS[st.preset].type;
  rT.textContent = st.t_d.toFixed(0);
  rL.textContent = Lnow.toExponential(2);
  rMv.textContent = Mv.toFixed(2);
  rR.textContent = r_cm.toExponential(2);
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  drawSky();
  const cam = makeCamBasis();
  // Compute L now to normalise color brightness.
  const N = 80;
  let Lmax = 0;
  for (let k = 0; k < N; k++) {
    const t = (k / (N - 1)) * st.T_MAX_D + 0.5;
    const L = bolometricLuminosity_ergS(t, st.m_Ni, st.t_diff_d);
    if (L > Lmax) Lmax = L;
  }
  const Lnow = bolometricLuminosity_ergS(st.t_d, st.m_Ni, st.t_diff_d);
  const L_norm = Math.max(0, Math.min(1, Lnow / Lmax));
  drawFireball(cam, st.t_d, L_norm);
  drawLightcurvePanel();
  drawMassPartitionPanel();
  drawInfoPanel();
  // Title strip.
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 260, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.strokeRect(10.5, 8.5, 259, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText(`SUPERNOVA (${SN_PRESETS[st.preset].type})`, 20, 26);
  updateReadout(Lnow);
}

function readSliders() {
  // If preset changed, snap params.
  if (selPreset.value !== st.preset) applyPreset(selPreset.value);
  else {
    st.m_Ni = parseFloat(sMni.value);
    st.t_diff_d = parseFloat(sTdiff.value);
    st.v_ej_kms = parseFloat(sVej.value);
  }
  vPreset.textContent = st.preset === 'ia_2011fe' ? '2011fe' : '1987A';
  vMni.textContent = st.m_Ni.toFixed(2);
  vTdiff.textContent = String(st.t_diff_d);
  vVej.textContent = String(st.v_ej_kms);
}

[selPreset, sMni, sTdiff, sVej].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.t_d = 5; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  m_ni: { get: () => st.m_Ni, set: v => { st.m_Ni = parseFloat(v); sMni.value = v; }, parse: parseFloat },
  preset: { get: () => st.preset, set: v => { st.preset = v; selPreset.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
applyPreset(st.preset);   // start with default preset values
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Sweep t_d across the 5 frames: 5 d, 18 d (peak Ia), 50 d, 100 d, 200 d.
  const t_table = [5, 18, 50, 100, 200];
  const idx = Math.min(4, Math.max(0, Math.floor((CAPTURE_FRAC || 0) * 5)));
  // Two presets: Ia for fractions 0..0.5, II for 0.5..1.
  if ((CAPTURE_FRAC || 0) >= 0.5) {
    selPreset.value = 'ii_1987a';
    applyPreset('ii_1987a');
  }
  st.t_d = t_table[idx];
  readSliders();
  if (camera.setAzimuthDeg) camera.setAzimuthDeg(30 + CAPTURE_FRAC * 30);
  draw();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
  } else {
    window.__simulationReady = true;
  }
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      // Sweep t_d in a loop: 5 d -> 200 d in 30 s, then reset.
      st.t_d += dt * 6;
      if (st.t_d > st.T_MAX_D) st.t_d = 1;
    }
    if (camera.tickIdle) camera.tickIdle(now);
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
