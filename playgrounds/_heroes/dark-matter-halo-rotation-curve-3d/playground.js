// Dark-matter halo + rotation curve playground. Left half: 3D disk
// galaxy with transparent halo. Right half: rotation curve v_c(r)
// decomposed by component.

import { vCirc, vCircVisible, massBulge, massDisk, massDM, massTotal, MW_PARAMS, G } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rVp = document.getElementById('readout-vp');
const rRatio = document.getElementById('readout-ratio');
const rDm = document.getElementById('readout-dm');
const sMDM = document.getElementById('slider-MDM'), vMDM = document.getElementById('value-MDM');
const sC = document.getElementById('slider-c'), vC = document.getElementById('value-c');
const sRs = document.getElementById('slider-rs'), vRs = document.getElementById('value-rs');
const tDM = document.getElementById('toggle-dm');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  M_DM: 80, c: 12, r_s: 20, includeDM: true,
  // Rotation-curve preset: which model the bold highlighted curve in
  // the rotation panel reflects. The galaxy disc colouring also
  // changes (e.g. rigid-body presets visualize uniform rotation, etc.)
  preset: 'visible+dm',
  running: !prefersReducedMotion(),
  rotAngle: 0,
};
const PRESETS = ['rigid', 'kepler', 'visible', 'visible+dm'];
// Frozen synthetic observation points (built lazily on first draw).
let OBS_POINTS = null;

function getParams() {
  return { ...MW_PARAMS, M_DM: st.M_DM, c: st.c, r_s: st.r_s, includeDM: st.includeDM };
}

// 3D projection for the left panel.
function project3D(x, y, z, cx, cy, scale) {
  const tilt = 0.5;
  const ca = Math.cos(st.rotAngle), sa = Math.sin(st.rotAngle);
  const xp = ca * x - sa * y;
  const yp = sa * x + ca * y;
  const ct = Math.cos(tilt), stl = Math.sin(tilt);
  const yr = ct * yp - stl * z;
  const zr = stl * yp + ct * z;
  const cam = 50;
  const f = 1 / (1 + zr / cam);
  return { x: cx + xp * scale * f, y: cy - yr * scale * f, depth: zr };
}

// =========================================================================
// LIVE ORBITAL SIMULATION. Stars are tracked individually in (r, phi);
// each step advances phi by Omega(r) * dt where Omega = v(r) / r. The
// v(r) law depends on the active preset, so changing the preset
// VISIBLY changes how the disc shears (rigid: lockstep; Keplerian:
// inner stars catch up fast; visible-only: dramatic differential
// rotation; visible+DM: flat curve = uniform tangential speed).
const N_STARS = 2400;
const STARS = [];
function seedStars() {
  STARS.length = 0;
  let s = 7;
  const rnd = () => { s = (s * 16807) | 0; return ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF; };
  const pitch = 0.55, nArms = 2;
  for (let k = 0; k < N_STARS; k += 1) {
    const u = rnd();
    const r = -3 * Math.log(1 - u * 0.98);
    if (r < 0.5) continue;
    const phi_arm_center = (k % nArms) * (2 * Math.PI / nArms);
    const armPhi = phi_arm_center + pitch * Math.log(Math.max(0.3, r));
    const sigma = 0.18 + 0.20 * Math.exp(-r / 15);
    const dPhi = (rnd() - 0.5) * 2 * sigma;
    const phi = armPhi + dPhi + (rnd() - 0.5) * 0.10;
    const z = (rnd() - 0.5) * 0.5 * Math.exp(-r / 4);
    STARS.push({ r, phi, z, dPhi, sigma });
  }
}
seedStars();

// v(r) according to the active preset.
function vAt(r) {
  const p = getParams();
  if (st.preset === 'rigid') {
    // Match a global rotation speed; pick omega so v(r=5) = vtot(5).
    const vtot5 = vCirc(5, p);
    return (vtot5 / 5) * r;
  }
  if (st.preset === 'kepler') {
    const M_kep = p.M_b + p.M_d;
    return Math.sqrt(G * M_kep / Math.max(0.5, r));
  }
  if (st.preset === 'visible') return vCircVisible(r, p);
  return vCirc(r, p);            // visible + DM
}

function drawGalaxy3D() {
  // Fill the TOP region of the portrait canvas, centred horizontally.
  const cx = W * 0.5, cy = H * 0.30;
  const scale = Math.min(W * 0.30, H * 0.22) / 8;     // 8 ~ outer disc radius

  // Dark matter halo: large transparent purple sphere. The true virial radius
  // r_s*c is tens of times the visible disc, so cap the drawn radius to the
  // scene so the halo glow, its dashed boundary, and the label stay on-canvas
  // (they were drawn at ~1700px radius, far off-screen).
  if (st.includeDM) {
    const haloR = Math.min(st.r_s * st.c / 4 * scale, cy * 0.9);
    const g = ctx.createRadialGradient(cx, cy, haloR * 0.4, cx, cy, haloR);
    g.addColorStop(0, 'rgba(170, 130, 220, 0.10)');
    g.addColorStop(1, 'rgba(170, 130, 220, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(170, 130, 220, 0.25)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(170, 130, 220, 0.65)';
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.textAlign = 'center';
    ctx.fillText('NFW dark halo', cx, cy + haloR + 14);
  }

  // Disk: many star dots in an exponential disk.
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) | 0;
    return ((seed >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
  };
  // Render the LIVE star orbits. Each star tracks its (r, phi) under
  // Omega(r) = v(r)/r per the active preset; the disc shears as
  // physics dictates.
  for (const star of STARS) {
    const x = star.r * Math.cos(star.phi);
    const y = star.r * Math.sin(star.phi);
    const p = project3D(x, y, star.z, cx, cy, scale);
    const armBright = Math.exp(-(star.dPhi * star.dPhi) / (2 * star.sigma * star.sigma * 0.6));
    const a = 0.35 + 0.55 * armBright * Math.exp(-star.r / 8);
    const hue = armBright > 0.6 ? 215 : 35;
    const sat = armBright > 0.6 ? 90 : 60;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, 75%, ${a.toFixed(2)})`;
    ctx.fillRect(p.x - 0.9, p.y - 0.9, 1.8, 1.8);
  }
  // Bulge: bright core
  const pc = project3D(0, 0, 0, cx, cy, scale);
  const g = ctx.createRadialGradient(pc.x, pc.y, 0, pc.x, pc.y, 14);
  g.addColorStop(0, 'rgba(255, 230, 140, 0.85)');
  g.addColorStop(1, 'rgba(255, 230, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(pc.x, pc.y, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(pc.x, pc.y, 5, 0, 2 * Math.PI); ctx.fill();

  // Top label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`3D galactic disk + DM halo`, 24, 22);
  ctx.fillStyle = st.includeDM ? 'rgba(170, 130, 220, 0.85)' : 'rgba(120, 120, 130, 0.65)';
  ctx.fillText(st.includeDM ? `dark halo: M_DM = ${st.M_DM.toFixed(0)}, c = ${st.c.toFixed(1)}, r_s = ${st.r_s.toFixed(0)}` : `dark halo OFF (visible mass only)`, 24, 40);
}

function drawRotationCurve() {
  // Right panel: v_c(r) decomposition.
  const x0 = 60, y0 = 650, w = 700, h = 330;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

  const pad = { l: 50, r: 14, t: 26, b: 28 };
  const ax = x0 + pad.l, ay = y0 + pad.t;
  const aw = w - pad.l - pad.r, ah = h - pad.t - pad.b;

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah);
  ctx.stroke();

  const R_MAX = 80;
  const V_MAX = 1.6;
  const xToPx = (r) => ax + (r / R_MAX) * aw;
  const yToPx = (v) => ay + (1 - v / V_MAX) * ah;

  // Y-axis ticks
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  for (let v = 0; v <= V_MAX; v += 0.4) {
    ctx.fillText(v.toFixed(1), ax - 4, yToPx(v) + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.moveTo(ax, yToPx(v)); ctx.lineTo(ax + aw, yToPx(v)); ctx.stroke();
  }
  ctx.textAlign = 'center';
  for (let r = 0; r <= R_MAX; r += 20) {
    ctx.fillText(String(r), xToPx(r), ay + ah + 14);
  }
  ctx.fillText('r', ax + aw - 6, ay + ah + 22);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textAlign = 'left';
  ctx.fillText('v_c(r)', ax - 10, ay - 6);

  // Sample the curve.
  const p = getParams();
  const NPTS = 200;
  const rs = new Float64Array(NPTS);
  const vb = new Float64Array(NPTS), vd = new Float64Array(NPTS), vh = new Float64Array(NPTS);
  const vvis = new Float64Array(NPTS), vtot = new Float64Array(NPTS);
  for (let i = 0; i < NPTS; i += 1) {
    const r = (i + 0.5) / NPTS * R_MAX;
    rs[i] = r;
    vb[i] = Math.sqrt(G * massBulge(r, p.M_b, p.a_b) / r);
    vd[i] = Math.sqrt(G * massDisk(r, p.M_d, p.h_d) / r);
    vh[i] = p.includeDM ? Math.sqrt(G * massDM(r, p.M_DM, p.r_s, p.c) / r) : 0;
    vvis[i] = vCircVisible(r, p);
    vtot[i] = vCirc(r, p);
  }

  function plotLine(values, color, dash) {
    ctx.strokeStyle = color;
    ctx.lineWidth = dash ? 1.0 : 1.6;
    if (dash) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i < NPTS; i += 1) {
      const px = xToPx(rs[i]);
      const py = yToPx(values[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  plotLine(vb, 'rgba(255, 209, 102, 0.55)');
  plotLine(vd, 'rgba(91, 192, 235, 0.55)');
  if (p.includeDM) plotLine(vh, 'rgba(170, 130, 220, 0.55)');
  plotLine(vvis, 'rgba(150, 220, 255, 0.40)', true);

  // Preset-specific overlay curves drawn BOLD on top.
  const rigid = new Float64Array(NPTS);
  const kepler = new Float64Array(NPTS);
  // Rigid body: v ∝ r (uniform angular speed). Normalise to match
  // vtot at r = 5.
  const omRigid = vtot[Math.floor(5 / R_MAX * NPTS)] / 5;
  for (let i = 0; i < NPTS; i += 1) rigid[i] = omRigid * rs[i];
  // Keplerian point mass: v = sqrt(GM/r). Take M = M_b + M_d.
  const M_kep = p.M_b + p.M_d;
  for (let i = 0; i < NPTS; i += 1) kepler[i] = Math.sqrt(G * M_kep / Math.max(0.5, rs[i]));

  // Pick the bold curve based on preset.
  function bold(values, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 3.2; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < NPTS; i += 1) {
      const px = xToPx(rs[i]);
      const py = yToPx(Math.max(0, Math.min(V_MAX, values[i])));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (st.preset === 'rigid') bold(rigid, '#06d6a0');
  else if (st.preset === 'kepler') bold(kepler, '#ef476f');
  else if (st.preset === 'visible') bold(vvis, '#5bc0eb');
  else bold(vtot, 'rgba(255, 255, 255, 0.98)');

  // Observed rotation-curve data points (Rubin-Ford-style): synthetic
  // measurements with scatter, generated once and frozen. They follow
  // the FULL visible+DM curve (flat at large r) -- the observational
  // evidence for dark matter. The points stay fixed while the user
  // changes the model so the mismatch with the visible-only curve is
  // obvious.
  if (!OBS_POINTS) {
    OBS_POINTS = [];
    let s = 0x5EED;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    // The "true" universe is the default MW params with DM on.
    const truth = { ...MW_PARAMS };
    for (let r = 4; r <= R_MAX - 4; r += 5) {
      const vTrue = vCirc(r, truth);
      const noise = (rnd() - 0.5) * 0.10;
      OBS_POINTS.push({ r, v: vTrue + noise, err: 0.05 + 0.03 * rnd() });
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillStyle = '#ffd166';
  ctx.lineWidth = 1.2;
  for (const pt of OBS_POINTS) {
    const px = xToPx(pt.r);
    const py = yToPx(pt.v);
    // Error bar.
    ctx.beginPath();
    ctx.moveTo(px, yToPx(pt.v - pt.err));
    ctx.lineTo(px, yToPx(pt.v + pt.err));
    ctx.stroke();
    // Data marker.
    ctx.beginPath(); ctx.arc(px, py, 3.2, 0, Math.PI * 2); ctx.fill();
  }

  // Legend
  const legendX = ax + aw - 140, legendY = ay + 10;
  const legend = [
    { label: 'bulge', color: 'rgba(255, 209, 102, 0.9)' },
    { label: 'disk', color: 'rgba(91, 192, 235, 0.9)' },
    p.includeDM ? { label: 'dark halo (NFW)', color: 'rgba(170, 130, 220, 0.9)' } : null,
    { label: 'visible only', color: 'rgba(150, 220, 255, 0.6)', dash: true },
    { label: 'total (visible+DM)', color: 'rgba(255, 255, 255, 0.95)' },
    { label: 'observed v(r)', color: '#ffd166', dot: true },
  ].filter(Boolean);
  ctx.textAlign = 'left';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let i = 0; i < legend.length; i += 1) {
    const item = legend[i];
    const yy = legendY + i * 14;
    if (item.dot) {
      ctx.fillStyle = item.color;
      ctx.beginPath(); ctx.arc(legendX + 9, yy, 3.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      if (item.dash) ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(legendX, yy); ctx.lineTo(legendX + 18, yy); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = item.color;
    ctx.fillText(item.label, legendX + 22, yy + 3);
  }

  // Plateau value at r=50.
  return { vPlateau: vtot[Math.floor(50 / R_MAX * NPTS)] };
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  drawGalaxy3D();
  const stats = drawRotationCurve();

  // Bottom HUD: Rubin-Ford historical note.
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('Rubin and Ford 1970: flat rotation curves out to many disk scale lengths require dark matter', W / 2, H - 14);

  const p = getParams();
  const Mvis = p.M_b + p.M_d;
  rVp.textContent = stats.vPlateau.toFixed(2);
  rRatio.textContent = (p.M_DM / Mvis).toFixed(1);
  rDm.textContent = p.includeDM ? 'ON' : 'OFF';
}

let _tickLast = performance.now();
function tick(now) {
  const wt = now || performance.now();
  const dt = Math.min(0.05, (wt - _tickLast) / 1000);
  _tickLast = wt;
  if (st.running) {
    st.rotAngle += 0.005;
    // Advance each star's azimuth by Omega(r) dt, where Omega = v/r is
    // dictated by the active preset's rotation curve. This is the
    // physics simulation the user asked for.
    // Visual speed scale bumped from 0.5 to 3.0 so the differential
    // rotation reads clearly within a few seconds: Keplerian orbits
    // shear FAST (inner stars race ahead), rigid-body holds the
    // spiral pattern, flat-curve (visible+DM) shears moderately.
    const SPEED = 3.0;
    for (const star of STARS) {
      const v = vAt(star.r);
      const omega = v / Math.max(0.5, star.r);
      star.phi += omega * dt * SPEED;
    }
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vMDM.textContent = String(st.M_DM);
  vC.textContent = st.c.toFixed(1);
  vRs.textContent = String(st.r_s);
}

sMDM.addEventListener('input', () => { st.M_DM = parseFloat(sMDM.value); syncLabels(); });
sC.addEventListener('input', () => { st.c = parseFloat(sC.value); syncLabels(); });
sRs.addEventListener('input', () => { st.r_s = parseFloat(sRs.value); syncLabels(); });
tDM.addEventListener('change', () => { st.includeDM = tDM.checked; });
const selPreset = document.getElementById('select-preset');
const vPreset = document.getElementById('value-preset');
if (selPreset) selPreset.addEventListener('change', () => {
  st.preset = selPreset.value;
  if (vPreset) vPreset.textContent = st.preset;
  // For Keplerian preset, disable the DM halo so the disc shears
  // visibly under a 1/sqrt(r) law.
  if (st.preset === 'kepler') { st.includeDM = false; tDM.checked = false; }
});
btnReset.addEventListener('click', () => {
  st.M_DM = 80; st.c = 12; st.r_s = 20; st.includeDM = true;
  sMDM.value = '80'; sC.value = '12'; sRs.value = '20'; tDM.checked = true;
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { M_DM: st.M_DM, c: st.c, include_DM: st.includeDM ? 1 : 0 }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.M_DM) { st.M_DM = parseFloat(s.M_DM); sMDM.value = String(st.M_DM); }
  if (s.c) { st.c = parseFloat(s.c); sC.value = String(st.c); }
  if (s.include_DM !== undefined) { st.includeDM = String(s.include_DM) === '1'; tDM.checked = st.includeDM; }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep: t-000 visible-only -> t-100 with DM at concentration 4..20.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    if (f < 0.25) {
      st.includeDM = false; tDM.checked = false;
    } else {
      st.includeDM = true; tDM.checked = true;
      st.c = 4 + (f - 0.25) / 0.75 * 16;
      sC.value = String(st.c);
    }
    st.rotAngle = f * 1.2;
    syncLabels();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
// Reports the halo parameters and the circular speed sampled in the
// inner and outer disc.
window.playground = window.playground || {};
window.playground.getState = function () {
  const p = getParams();
  return {
    fields: [
      { key: 'dark-matter', label: 'dark-matter halo', value: st.includeDM ? 'on' : 'off' },
      { key: 'halo-mass', label: 'halo mass M_DM', value: st.M_DM, format: 'float' },
      { key: 'concentration', label: 'concentration c', value: st.c, format: 'float' },
      { key: 'v-inner', label: 'v_circ at r=8', value: vCirc(8, p), format: 'float' },
      { key: 'v-outer', label: 'v_circ at r=20', value: vCirc(20, p), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const p = getParams();
  // Enclosed mass can only grow outward (mass is non-negative).
  const mIn = massTotal(8, p);
  const mOut = massTotal(20, p);
  // The dark-matter signature: with the halo on, the outer rotation
  // curve is flat, so v(20)/v(8) is close to 1. Visible matter alone
  // gives a declining (sub-Keplerian) curve, which is the point, so
  // that case is reported as pending rather than as a failure.
  const ratio = vCirc(20, p) / Math.max(1e-6, vCirc(8, p));
  return [
    {
      key: 'mass-monotone',
      label: 'enclosed mass increases outward',
      value: `${mIn.toFixed(1)} -> ${mOut.toFixed(1)}`,
      status: mOut >= mIn ? 'pass' : 'drift',
    },
    {
      key: 'flat-curve',
      label: 'outer rotation curve flat',
      value: ratio.toFixed(3),
      status: st.includeDM ? (ratio > 0.85 ? 'pass' : 'drift') : 'pending',
    },
  ];
};
