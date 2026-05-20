// Cosmology LEGEND. Four-mode laboratory for the universe at large.
//
// Architecture: offscreen WebGL2 canvas runs the shared cosmic-lattice
// shader (the Hubble-flow lattice). Each frame we blit its output into
// the visible 2D canvas via drawImage, then draw 2D overlays for the
// mode-specific content (Friedmann a(t) curve, CMB sphere, V(phi) +
// (n_s, r) plane). Same recipe as the BH legend.

import {
  integrateScaleFactor, scaleAt, hubble,
  FATE_PRESETS, cmbDeltaT, T_CMB_NOW, T_LAST_SCATTERING, Z_LAST_SCATTERING,
  POTENTIALS, epsilon, eta, nsOf, rOf, efolds_quadratic, efolds_starobinsky,
  makeRng,
} from './sim.js';
import { setupCosmicLatticeGL } from '../../../shared/js/engine-gl/cosmic-lattice-3d.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Offscreen WebGL canvas; result blitted into visible canvas.
const canvasGL = document.createElement('canvas');
canvasGL.width = W; canvasGL.height = H;
let engine = null;
try { engine = setupCosmicLatticeGL(canvasGL, 9); }
catch (e) { console.warn('[cosmology-legend] WebGL2 init failed', e); engine = null; }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 26, minRadius: 6, maxRadius: 70,
  azimuthDeg: 35, elevationDeg: 22, fovDeg: 50,
});
window.__camera = camera;

// Readouts.
const rOm = document.getElementById('readout-om');
const rOl = document.getElementById('readout-ol');
const rA = document.getElementById('readout-a');
const rFate = document.getElementById('readout-fate');
const rMode = document.getElementById('readout-mode');

// Controls.
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sOm = document.getElementById('slider-omegam'), vOm = document.getElementById('value-omegam');
const sOl = document.getElementById('slider-omegal'), vOl = document.getElementById('value-omegal');
const selPot = document.getElementById('select-pot'), vPot = document.getElementById('value-pot');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const MODE_ROWS = {
  expansion: ['mode', 'preset', 'omegaM', 'omegaL'],
  fate:      ['mode', 'preset', 'omegaM', 'omegaL'],
  cmb:       ['mode'],
  inflation: ['mode', 'pot', 'Nefolds'],
};
const allRows = Array.from(document.querySelectorAll('#controls .row[data-row]'));
function syncRowVisibility(mode) {
  const visible = new Set(MODE_ROWS[mode] || ['mode']);
  for (const row of allRows) {
    const key = row.getAttribute('data-row');
    row.classList.toggle('hidden', !visible.has(key));
  }
}

const st = {
  mode: 'expansion',
  preset: 'lcdm',
  Om: 0.31,
  Ol: 0.69,
  pot: 'starobinsky',
  Nefolds: 60,
  running: !prefersReducedMotion(),
  t: 0,
  rng: makeRng(0xC0FFEE),
};

function applyPreset(name) {
  const p = FATE_PRESETS[name];
  if (!p) return;
  st.preset = name;
  st.Om = p.Om;
  st.Ol = p.Ol;
  sOm.value = String(p.Om);
  sOl.value = String(p.Ol);
}

// =========================================================================
// Cosmology cache: integrate a(t) once per (Om, Ol) and reuse.
// =========================================================================
let cosmoCache = null;
let cacheKey = '';
function getCosmo() {
  const key = `${st.Om.toFixed(3)}|${st.Ol.toFixed(3)}`;
  if (key !== cacheKey) {
    cosmoCache = integrateScaleFactor({ m: st.Om, L: st.Ol }, 1.0, { dt: 0.004, tMax: 40 });
    cacheKey = key;
  }
  return cosmoCache;
}

// =========================================================================
// Background rendering: WebGL lattice for expansion mode; clear for CMB.
// =========================================================================
function paintBackground(a) {
  if (st.mode === 'expansion' && engine) {
    engine.render(camera.viewMatrix(), camera.projMatrix(W / H), camera.eyePosition(), a, []);
    ctx.drawImage(canvasGL, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, W, H);
    // Tiny stars for visual interest.
    const r = makeRng(0xD15EA5E);
    for (let i = 0; i < 200; i++) {
      const ix = r() * W; const iy = r() * H;
      const sb = 0.15 + 0.55 * r();
      ctx.fillStyle = `rgba(200, 220, 255, ${sb.toFixed(3)})`;
      ctx.fillRect(ix, iy, 1, 1);
    }
  }
}

// =========================================================================
// MODE: EXPANSION. WebGL lattice + readout.
// =========================================================================
function drawExpansionMode(a) {
  // (background is already the lattice via paintBackground)
  // Centred title strip.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`a(now) = ${a.toFixed(3)}`, 14, H - 30);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Comoving lattice of galaxies; proper separations scale by a(t).', 14, H - 12);
}

// =========================================================================
// MODE: FATE. a(t) curve panel with the current preset highlighted plus
// the three other fates overlaid for comparison.
// =========================================================================
function drawFateMode(aNow) {
  // Big a(t) plot covering most of the canvas.
  const px = 0.06 * W, py = 50, pw = 0.66 * W, ph = H - 130;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('scale factor a(t) for four fates', px + 8, py - 6);

  // Axes: t in [-1, 3] (units of 1/H0), a in [0, 4].
  const T_MIN = -1, T_MAX = 3, A_MIN = 0, A_MAX = 4;
  function xForT(t) { return px + 36 + (t - T_MIN) / (T_MAX - T_MIN) * (pw - 56); }
  function yForA(a) { return py + ph - 30 - (a - A_MIN) / (A_MAX - A_MIN) * (ph - 52); }

  // Grid.
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let t = T_MIN; t <= T_MAX; t += 1) {
    ctx.beginPath(); ctx.moveTo(xForT(t), py + 16); ctx.lineTo(xForT(t), py + ph - 30); ctx.stroke();
  }
  for (let a = 1; a <= A_MAX; a += 1) {
    ctx.beginPath(); ctx.moveTo(px + 36, yForA(a)); ctx.lineTo(px + pw - 20, yForA(a)); ctx.stroke();
  }
  // a = 1 reference line.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(px + 36, yForA(1)); ctx.lineTo(px + pw - 20, yForA(1)); ctx.stroke();
  ctx.setLineDash([]);

  // Plot each fate.
  const fates = ['lcdm', 'matter', 'closed', 'empty'];
  const colors = {
    lcdm: 'rgba(120, 220, 255, 0.95)',
    matter: 'rgba(255, 220, 120, 0.85)',
    closed: 'rgba(255, 130, 110, 0.85)',
    empty: 'rgba(220, 220, 230, 0.65)',
  };
  for (const f of fates) {
    const p = FATE_PRESETS[f];
    const sol = integrateScaleFactor({ m: p.Om, L: p.Ol }, 1.0, { dt: 0.004, tMax: 40 });
    ctx.strokeStyle = colors[f];
    ctx.lineWidth = (f === st.preset) ? 2.6 : 1.3;
    ctx.beginPath();
    let started = false;
    for (let k = 0; k < sol.t.length; k++) {
      const ti = sol.t[k], ai = sol.a[k];
      if (ti < T_MIN - 0.05 || ti > T_MAX + 0.05) continue;
      if (ai > A_MAX + 0.1) continue;
      const x = xForT(ti); const y = yForA(ai);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Cosmic time marker: t = 0 (now).
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(xForT(0), py + 16); ctx.lineTo(xForT(0), py + ph - 30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('t = now', xForT(0) + 4, py + 28);

  // Axes labels.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('t / H_0^-1', px + pw - 56, py + ph - 12);
  ctx.fillText('a(t)', px + 8, py + 18);
  ctx.fillText('0', px + 22, py + ph - 30);
  ctx.fillText('-1', xForT(-1) - 6, py + ph - 16);
  ctx.fillText('0', xForT(0) - 4, py + ph - 16);
  ctx.fillText('1', xForT(1) - 4, py + ph - 16);
  ctx.fillText('2', xForT(2) - 4, py + ph - 16);
  ctx.fillText('3', xForT(3) - 4, py + ph - 16);
  ctx.fillText('1', px + 20, yForA(1) + 4);
  ctx.fillText('2', px + 20, yForA(2) + 4);
  ctx.fillText('3', px + 20, yForA(3) + 4);

  // Legend.
  let lyy = py + 30;
  for (const f of fates) {
    ctx.fillStyle = colors[f];
    ctx.fillRect(px + pw - 180, lyy - 8, 10, 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.90)';
    ctx.font = (f === st.preset) ? 'bold 10px ui-monospace, monospace' : '10px ui-monospace, monospace';
    ctx.fillText(FATE_PRESETS[f].label, px + pw - 165, lyy - 4);
    lyy += 14;
  }
  // Description strip.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = '12px system-ui, sans-serif';
  const desc = {
    lcdm: 'LCDM (our universe): a(t) accelerates without bound as dark energy dominates.',
    matter: 'Matter-only Einstein-de-Sitter: a ~ t^(2/3); decelerating but expands forever.',
    closed: 'Closed (Big Crunch): a peaks and recollapses; total density above critical.',
    empty: 'Empty universe: a coasts linearly with t; no matter or dark energy.',
  };
  ctx.fillText(desc[st.preset] || '', px + 8, py + ph + 18);
}

// =========================================================================
// MODE: CMB. A sphere of last scattering, tinted by a deterministic
// random temperature field at the Planck Delta T / T ~ 1e-5 amplitude.
// We render it as a sphere with depth-sorted quads in 3D so the orbit
// camera can rotate around it (the observer is inside; the sphere is
// the surface of last scattering 14 Gpc away).
// =========================================================================
const N_THETA_CMB = 30, N_PHI_CMB = 60;
const cmbQuads = [];
{
  for (let i = 0; i < N_THETA_CMB; i++) {
    const th0 = (i / N_THETA_CMB) * Math.PI;
    const th1 = ((i + 1) / N_THETA_CMB) * Math.PI;
    for (let j = 0; j < N_PHI_CMB; j++) {
      const ph0 = (j / N_PHI_CMB) * 2 * Math.PI;
      const ph1 = ((j + 1) / N_PHI_CMB) * 2 * Math.PI;
      cmbQuads.push({ th0, th1, ph0, ph1 });
    }
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

// CMB color: Delta T in [-1, 1] -> blue (cold) to red (hot) diverging.
function cmbColor(dT) {
  // dT in roughly [-1, 1]. Center is the mean T = 2.725 K (greyish).
  const x = Math.max(-1, Math.min(1, dT));
  if (x >= 0) {
    // Toward red.
    const t = x;
    return [Math.round(200 + 55 * t), Math.round(180 - 90 * t), Math.round(120 - 60 * t)];
  } else {
    const t = -x;
    return [Math.round(120 - 60 * t), Math.round(180 - 90 * t), Math.round(220 + 35 * t)];
  }
}

function drawCMBSphere(cam) {
  const R_SPHERE = 4.0;     // arbitrary world units
  const quads = [];
  for (const q of cmbQuads) {
    const thc = (q.th0 + q.th1) / 2;
    const phc = (q.ph0 + q.ph1) / 2;
    const center = [
      R_SPHERE * Math.sin(thc) * Math.cos(phc),
      R_SPHERE * Math.cos(thc),
      R_SPHERE * Math.sin(thc) * Math.sin(phc),
    ];
    const dx = center[0] - cam.eye[0], dy = center[1] - cam.eye[1], dz = center[2] - cam.eye[2];
    const depth = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    if (depth <= 0) continue;
    // For the surface-of-last-scattering, we're INSIDE looking out, so we
    // do NOT back-face cull; we render every quad facing us. We render
    // only the front-facing patches (whose outward normals face away from
    // the camera, since we are looking out).
    const norm = [center[0] / R_SPHERE, center[1] / R_SPHERE, center[2] / R_SPHERE];
    const eToP = [dx, dy, dz]; const eLen = Math.hypot(...eToP);
    const cosFacing = (eToP[0] * norm[0] + eToP[1] * norm[1] + eToP[2] * norm[2]) / eLen;
    // We're outside the sphere; treat it as a normal opaque ball. So
    // keep quads where the camera-to-center direction has negative dot
    // with the outward normal (i.e., camera sees the near side).
    if (cosFacing > 0) continue;
    quads.push({ q, thc, phc, depth });
  }
  quads.sort((a, b) => b.depth - a.depth);
  for (const Q of quads) {
    const { q, thc, phc } = Q;
    const verts = [
      [R_SPHERE * Math.sin(q.th0) * Math.cos(q.ph0), R_SPHERE * Math.cos(q.th0), R_SPHERE * Math.sin(q.th0) * Math.sin(q.ph0)],
      [R_SPHERE * Math.sin(q.th0) * Math.cos(q.ph1), R_SPHERE * Math.cos(q.th0), R_SPHERE * Math.sin(q.th0) * Math.sin(q.ph1)],
      [R_SPHERE * Math.sin(q.th1) * Math.cos(q.ph1), R_SPHERE * Math.cos(q.th1), R_SPHERE * Math.sin(q.th1) * Math.sin(q.ph1)],
      [R_SPHERE * Math.sin(q.th1) * Math.cos(q.ph0), R_SPHERE * Math.cos(q.th1), R_SPHERE * Math.sin(q.th1) * Math.sin(q.ph0)],
    ];
    const proj = verts.map(v => w2s(v, cam));
    if (proj.some(p => p === null)) continue;
    const dT = cmbDeltaT(thc, phc);
    const c = cmbColor(dT);
    ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    ctx.lineTo(proj[1].x, proj[1].y);
    ctx.lineTo(proj[2].x, proj[2].y);
    ctx.lineTo(proj[3].x, proj[3].y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCMBMode(cam) {
  drawCMBSphere(cam);
  // Strip with key numbers.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Cosmic Microwave Background (surface of last scattering)', 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Surface of last scattering at z ~ 1100 (380,000 yr after the Big Bang).', 14, 72);
  ctx.fillText('Photons stream freely after recombination; near-perfect blackbody.', 14, 90);
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T_CMB(today) = ${T_CMB_NOW.toFixed(3)} K`, 14, H - 50);
  ctx.fillText(`T_LSS = ${(T_LAST_SCATTERING).toFixed(0)} K (at z = ${Z_LAST_SCATTERING})`, 14, H - 32);
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Delta T / T ~ 10^-5 anisotropies are the seeds of all later structure.', 14, H - 14);
}

// =========================================================================
// MODE: INFLATION. V(phi) curve + (n_s, r) plane with Planck box.
// =========================================================================
function drawInflationMode() {
  // Left half: V(phi) with inflaton trajectory.
  const lpx = 0.06 * W, lpy = 50, lpw = 0.42 * W, lph = H - 130;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(lpx, lpy, lpw, lph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(lpx + 0.5, lpy + 0.5, lpw - 1, lph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`inflaton potential V(phi): ${POTENTIALS[st.pot].label}`, lpx + 8, lpy - 6);

  // Plot V(phi).
  const pot = POTENTIALS[st.pot];
  const phiMin = 0.5, phiMax = pot.phiStart * 1.05;
  let vMin = Infinity, vMax = -Infinity;
  for (let p = phiMin; p <= phiMax; p += (phiMax - phiMin) / 80) {
    const v = pot.V(p);
    if (v < vMin) vMin = v; if (v > vMax) vMax = v;
  }
  function xForP(p) { return lpx + 36 + (p - phiMin) / (phiMax - phiMin) * (lpw - 56); }
  function yForV(v) { return lpy + lph - 30 - (v - vMin) / Math.max(1e-12, vMax - vMin) * (lph - 52); }
  // Grid.
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let p = Math.ceil(phiMin); p <= phiMax; p += Math.max(1, Math.floor((phiMax - phiMin) / 5))) {
    ctx.beginPath(); ctx.moveTo(xForP(p), lpy + 16); ctx.lineTo(xForP(p), lpy + lph - 30); ctx.stroke();
  }
  // Potential curve.
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let started = false;
  for (let p = phiMin; p <= phiMax; p += (phiMax - phiMin) / 200) {
    const v = pot.V(p);
    const x = xForP(p), y = yForV(v);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Inflaton position: solve for phi at chosen N. (Closed forms.)
  let phi_N;
  if (st.pot === 'quadratic') phi_N = Math.sqrt(4 * st.Nefolds + 2);
  else phi_N = Math.log((st.Nefolds + 1.5) / 0.75) / Math.sqrt(2 / 3);
  phi_N = Math.min(pot.phiStart, Math.max(phiMin, phi_N));
  const xc = xForP(phi_N), yc = yForV(pot.V(phi_N));
  ctx.fillStyle = 'rgba(255, 220, 120, 1)';
  ctx.beginPath(); ctx.arc(xc, yc, 7, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xc, yc); ctx.lineTo(xc, lpy + lph - 30); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`phi at N = ${st.Nefolds}: ${phi_N.toFixed(2)}`, xc + 8, yc - 8);
  // Axes labels.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('phi (M_Pl)', lpx + lpw - 60, lpy + lph - 12);
  ctx.fillText('V', lpx + 8, lpy + 18);

  // Right half: (n_s, r) plane with Planck box.
  const rpx = 0.52 * W, rpy = 50, rpw = 0.42 * W, rph = H - 130;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(rpx, rpy, rpw, rph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(rpx + 0.5, rpy + 0.5, rpw - 1, rph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('(n_s, r) plane with Planck 2018 2-sigma box', rpx + 8, rpy - 6);
  // Axes: n_s in [0.9, 1.05], r in [0, 0.3].
  const N_MIN = 0.92, N_MAX = 1.02, R_MIN = 0, R_MAX = 0.30;
  function xForN(n) { return rpx + 40 + (n - N_MIN) / (N_MAX - N_MIN) * (rpw - 60); }
  function yForR(r) { return rpy + rph - 30 - (r - R_MIN) / (R_MAX - R_MIN) * (rph - 52); }
  // Grid.
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.10)';
  for (let n = 0.92; n <= 1.02; n += 0.02) {
    ctx.beginPath(); ctx.moveTo(xForN(n), rpy + 16); ctx.lineTo(xForN(n), rpy + rph - 30); ctx.stroke();
  }
  for (let r = 0; r <= 0.30; r += 0.05) {
    ctx.beginPath(); ctx.moveTo(rpx + 40, yForR(r)); ctx.lineTo(rpx + rpw - 20, yForR(r)); ctx.stroke();
  }
  // Planck 2018 2-sigma box: n_s in [0.957, 0.973], r < 0.061 (TT+TE+EE+lowE+BK15).
  ctx.fillStyle = 'rgba(120, 220, 200, 0.18)';
  ctx.fillRect(xForN(0.957), yForR(0.061), xForN(0.973) - xForN(0.957), yForR(0) - yForR(0.061));
  ctx.strokeStyle = 'rgba(120, 220, 200, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(xForN(0.957), yForR(0.061), xForN(0.973) - xForN(0.957), yForR(0) - yForR(0.061));
  ctx.fillStyle = 'rgba(120, 220, 200, 0.95)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('Planck 2-sigma', xForN(0.957) + 4, yForR(0.061) + 12);

  // Track both potentials' (n_s, r) for N = 30..70.
  const tracks = [
    { name: 'phi^2', pot: 'quadratic', color: 'rgba(255, 130, 110, 0.95)' },
    { name: 'Starobinsky', pot: 'starobinsky', color: 'rgba(255, 220, 120, 0.95)' },
  ];
  for (const t of tracks) {
    ctx.strokeStyle = t.color;
    ctx.lineWidth = (t.pot === st.pot) ? 2.4 : 1.2;
    ctx.beginPath();
    let started2 = false;
    for (let N = 30; N <= 70; N += 1) {
      let p;
      if (t.pot === 'quadratic') p = Math.sqrt(4 * N + 2);
      else p = Math.log((N + 1.5) / 0.75) / Math.sqrt(2 / 3);
      p = Math.max(0.5, Math.min(POTENTIALS[t.pot].phiStart, p));
      const ns = nsOf(p, t.pot);
      const r = rOf(p, t.pot);
      const x = xForN(ns), y = yForR(r);
      if (ns < N_MIN || ns > N_MAX || r > R_MAX) continue;
      if (!started2) { ctx.moveTo(x, y); started2 = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Current marker.
  const ns_now = nsOf(phi_N, st.pot);
  const r_now = rOf(phi_N, st.pot);
  if (ns_now >= N_MIN && ns_now <= N_MAX && r_now <= R_MAX) {
    ctx.fillStyle = 'rgba(255, 255, 220, 1)';
    ctx.beginPath(); ctx.arc(xForN(ns_now), yForR(r_now), 6, 0, 2 * Math.PI); ctx.fill();
  }
  // Axes labels and N markers on the current track.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('n_s', rpx + rpw - 24, rpy + rph - 12);
  ctx.fillText('r', rpx + 8, rpy + 18);
  ctx.fillText('0.94', xForN(0.94), rpy + rph - 16);
  ctx.fillText('0.98', xForN(0.98), rpy + rph - 16);
  ctx.fillText('1.02', xForN(1.02), rpy + rph - 16);
  ctx.fillText('0.1', rpx + 14, yForR(0.1));
  ctx.fillText('0.2', rpx + 14, yForR(0.2));
  // Legend.
  let lyy = rpy + 30;
  for (const t of tracks) {
    ctx.fillStyle = t.color;
    ctx.fillRect(rpx + 14, lyy - 8, 10, 3);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
    ctx.font = (t.pot === st.pot) ? 'bold 10px ui-monospace, monospace' : '10px ui-monospace, monospace';
    ctx.fillText(t.name, rpx + 30, lyy - 4);
    lyy += 14;
  }
  // Readouts.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`n_s = ${ns_now.toFixed(4)}, r = ${r_now.toFixed(4)}`, rpx + 8, rpy + rph + 18);
}

// =========================================================================
// SIDE PANEL + MODE TAB.
// =========================================================================
function drawSidePanel(aNow) {
  const x = 0.74 * W, y = 30, w = W - x - 14, h = 220;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('cosmology', x + 8, y - 6);
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
  row('Omega_m', st.Om.toFixed(2));
  row('Omega_Lambda', st.Ol.toFixed(2));
  const Ok = 1 - st.Om - st.Ol;
  row('Omega_k', Ok.toFixed(2));
  row('preset', st.preset, '#ffd28a');
  if (st.mode === 'expansion' || st.mode === 'fate') {
    row('a(now)', aNow.toFixed(3));
  } else {
    row('a(now)', '-');
  }
  row('mode', st.mode, '#ffd28a');
}

function drawModeTab() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 290, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 8.5, 289, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const labels = {
    expansion: 'EXPANSION (a(t) lattice)',
    fate: 'FATE (four scenarios)',
    cmb: 'CMB (last-scattering sphere)',
    inflation: 'INFLATION (V(phi) + n_s, r)',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

function updateReadout(aNow) {
  rOm.textContent = st.Om.toFixed(2);
  rOl.textContent = st.Ol.toFixed(2);
  rA.textContent = (st.mode === 'expansion' || st.mode === 'fate') ? aNow.toFixed(3) : '-';
  // Fate classifier.
  if (st.Om === 0 && st.Ol === 0) rFate.textContent = 'coasting';
  else if (st.Ol > 0) rFate.textContent = 'accelerating';
  else if (st.Om > 1) rFate.textContent = 'crunch';
  else rFate.textContent = 'decelerating';
  rMode.textContent = st.mode;
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  // Compute a(now). Use cosmology cache.
  const sol = getCosmo();
  // Advance an "internal" cosmic time. For visual interest in expansion
  // mode, slowly sweep t from -0.5 to +0.5 (units of 1/H0).
  const tNorm = ((st.t * 0.10) % 2) - 1;       // in [-1, 1]
  const aNow = Math.max(0.05, scaleAt(sol, tNorm * 0.5));
  paintBackground(aNow);
  if (st.mode === 'expansion') drawExpansionMode(aNow);
  else if (st.mode === 'fate') drawFateMode(aNow);
  else if (st.mode === 'cmb') drawCMBMode(makeCamBasis());
  else if (st.mode === 'inflation') drawInflationMode();
  drawSidePanel(aNow);
  drawModeTab();
  updateReadout(aNow);
}

function readSliders() {
  st.mode = selMode.value;
  // If preset changed, snap Om/Ol to it.
  if (selPreset.value !== st.preset) applyPreset(selPreset.value);
  else { st.Om = parseFloat(sOm.value); st.Ol = parseFloat(sOl.value); }
  st.pot = selPot.value;
  st.Nefolds = parseInt(sN.value, 10);
  vMode.textContent = st.mode.slice(0, 5);
  vPreset.textContent = st.preset;
  vOm.textContent = st.Om.toFixed(2);
  vOl.textContent = st.Ol.toFixed(2);
  vPot.textContent = st.pot === 'starobinsky' ? 'stb' : 'phi2';
  vN.textContent = String(st.Nefolds);
  syncRowVisibility(st.mode);
}

[selMode, selPreset, sOm, sOl, selPot, sN].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', readSliders);
selPot.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.t = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  omega_m: { get: () => st.Om, set: v => { st.Om = parseFloat(v); sOm.value = v; }, parse: parseFloat },
  omega_l: { get: () => st.Ol, set: v => { st.Ol = parseFloat(v); sOl.value = v; }, parse: parseFloat },
  mode: { get: () => st.mode, set: v => { st.mode = v; selMode.value = v; }, parse: x => x },
  preset: { get: () => st.preset, set: v => { st.preset = v; selPreset.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function captureModeForFraction(f) {
  if (f < 0.20) return 'expansion';
  if (f < 0.45) return 'fate';
  if (f < 0.75) return 'cmb';
  return 'inflation';
}

if (CAPTURE_NAME) {
  st.mode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = st.mode;
  if (st.mode === 'fate') { selPreset.value = 'lcdm'; applyPreset('lcdm'); }
  if (st.mode === 'inflation') { selPot.value = 'starobinsky'; st.pot = 'starobinsky'; }
  readSliders();
  st.t = (CAPTURE_FRAC || 0) * 4 + 1.0;
  if (camera.setAzimuthDeg) camera.setAzimuthDeg(35 + CAPTURE_FRAC * 30);
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
    if (st.running) st.t += dt;
    if (camera.tickIdle) camera.tickIdle(now);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
