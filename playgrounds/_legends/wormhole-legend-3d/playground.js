// Wormhole LEGEND. Four-mode laboratory for the Morris-Thorne / Ellis
// traversable wormhole. Same recipe as the other legends: offscreen
// WebGL2 canvas runs the shared wormhole-3d shader; result blitted
// into the visible 2D canvas; 2D overlays for mode-specific content.

import {
  circumferentialR, embedZ, properDistance, tidalScale,
  exoticDensity, anecIntegral, exoticEnergyDensity_SI,
  traversalEll, makeRng,
} from './sim.js';
import { setupWormholeGL } from '../../../shared/js/engine-gl/wormhole-3d.js';
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
const DEG = Math.PI / 180;

const canvasGL = document.createElement('canvas');
canvasGL.width = W; canvasGL.height = H;
let engine = null;
try { engine = setupWormholeGL(canvasGL); }
catch (e) { console.warn('[wormhole-legend] WebGL2 init failed', e); engine = null; }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 8, minRadius: 3, maxRadius: 25,
  azimuthDeg: 35, elevationDeg: 22, fovDeg: 50,
});
window.__camera = camera;

// Readouts.
const rB0 = document.getElementById('readout-b0');
const rL = document.getElementById('readout-l');
const rR = document.getElementById('readout-r');
const rRho = document.getElementById('readout-rho');
const rMode = document.getElementById('readout-mode');

// Controls.
const selMode = document.getElementById('select-mode'), vMode = document.getElementById('value-mode');
const sB0 = document.getElementById('slider-b0'), vB0 = document.getElementById('value-b0');
const sLcam = document.getElementById('slider-lcam'), vLcam = document.getElementById('value-lcam');
const sYaw = document.getElementById('slider-yaw'), vYaw = document.getElementById('value-yaw');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const MODE_ROWS = {
  overview:  ['mode', 'b0', 'lcam', 'yaw'],
  traversal: ['mode', 'b0'],
  embedding: ['mode', 'b0'],
  exotic:    ['mode', 'b0'],
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
  mode: 'overview',
  b0: 1.0,
  lCam: 2.5,        // in units of b0
  yaw: 0,
  running: !prefersReducedMotion(),
  t: 0,
};

// =========================================================================
// CAMERA PROJECTION for embedding mode.
// =========================================================================
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

// =========================================================================
// BACKGROUND. WebGL throat for overview / traversal; clear for embedding / exotic.
// =========================================================================
function paintBackground() {
  if ((st.mode === 'overview' || st.mode === 'traversal') && engine) {
    let lCam = st.lCam * st.b0;
    if (st.mode === 'traversal') {
      // Sweep camera from +L to -L and back, smooth ease-in-out.
      const period = 6.0;
      const u = ((st.t % period) / period);
      const tau = (u < 0.5) ? (u * 2) : (1 - (u - 0.5) * 2);
      lCam = traversalEll(tau, st.b0, 3.0);
    }
    engine.render(st.b0, lCam, st.yaw * DEG, st.t);
    ctx.drawImage(canvasGL, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, W, H);
    const r = makeRng(0xD15EA5E);
    for (let i = 0; i < 220; i++) {
      const ix = r() * W; const iy = r() * H;
      const sb = 0.15 + 0.55 * r();
      ctx.fillStyle = `rgba(200, 220, 255, ${sb.toFixed(3)})`;
      ctx.fillRect(ix, iy, 1, 1);
    }
  }
}

// =========================================================================
// MODE: OVERVIEW. WebGL throat with a strip describing the geometry.
// =========================================================================
function drawOverviewMode() {
  // The background is already the throat render.
  const rNow = circumferentialR(st.lCam * st.b0, st.b0);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`Ellis throat: b_0 = ${st.b0.toFixed(2)}, camera at l / b_0 = ${st.lCam.toFixed(2)}`, 14, H - 50);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Photons with impact parameter |L/E| < b_0 pass through to the other universe.', 14, H - 32);
  ctx.fillText(`Circumferential radius r(l) = sqrt(b_0^2 + l^2) = ${rNow.toFixed(2)}.`, 14, H - 14);
}

// =========================================================================
// MODE: TRAVERSAL. Same WebGL render but with animated l_cam plus
// progress strip.
// =========================================================================
function drawTraversalMode() {
  // Background already animates.
  const period = 6.0;
  const u = ((st.t % period) / period);
  const tau = (u < 0.5) ? (u * 2) : (1 - (u - 0.5) * 2);
  const lCam = traversalEll(tau, st.b0, 3.0);
  // Progress bar.
  const px = 14, py = H - 60, pw = 0.92 * W, ph = 12;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  // Universe A side (l > 0) on the right; throat in middle; Universe B (l < 0) on the left.
  // Map l in [-3, +3] to x.
  const fromL = (l) => px + 4 + ((-l + 3) / 6) * (pw - 8);   // l = +3 -> left, l = -3 -> right
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  const xc = fromL(lCam);
  ctx.fillRect(xc - 2, py + 2, 4, ph - 4);
  // Throat tick.
  ctx.fillStyle = 'rgba(255, 180, 100, 0.85)';
  ctx.fillRect(fromL(0) - 1, py - 2, 2, ph + 4);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('Universe A', px + 6, py - 4);
  ctx.fillText('throat', fromL(0) - 16, py - 4);
  ctx.fillText('Universe B', px + pw - 68, py - 4);
  // Strip.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`Camera traversing the wormhole: l(t) = ${lCam.toFixed(2)} b_0`, 14, H - 80);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('No event horizon, no singularity. The two skies smoothly exchange in the field of view.', 14, H - 14);
}

// =========================================================================
// MODE: EMBEDDING. The classic two-funnel paraboloid, drawn as a 3D
// depth-sorted UV mesh with orbit camera.
// =========================================================================
function drawEmbeddingMode(cam) {
  const N_L = 40, N_PHI = 60;
  const L_MAX = 5 * st.b0;
  const quads = [];
  for (let i = 0; i < N_L; i++) {
    const l0 = -L_MAX + (i / N_L) * 2 * L_MAX;
    const l1 = -L_MAX + ((i + 1) / N_L) * 2 * L_MAX;
    for (let j = 0; j < N_PHI; j++) {
      const ph0 = (j / N_PHI) * 2 * Math.PI;
      const ph1 = ((j + 1) / N_PHI) * 2 * Math.PI;
      quads.push({ l0, l1, ph0, ph1 });
    }
  }
  // Compute vertex positions, depths, and shading.
  function vertex(l, phi) {
    const r = circumferentialR(l, st.b0);
    const z = embedZ(l, st.b0);
    return [r * Math.cos(phi), z, r * Math.sin(phi)];
  }
  const items = [];
  for (const q of quads) {
    const lc = (q.l0 + q.l1) / 2;
    const phc = (q.ph0 + q.ph1) / 2;
    const center = vertex(lc, phc);
    const dx = center[0] - cam.eye[0], dy = center[1] - cam.eye[1], dz = center[2] - cam.eye[2];
    const depth = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    if (depth <= 0) continue;
    items.push({ q, lc, phc, center, depth });
  }
  items.sort((a, b) => b.depth - a.depth);
  for (const it of items) {
    const { q, lc, phc, center } = it;
    const verts = [
      vertex(q.l0, q.ph0), vertex(q.l0, q.ph1),
      vertex(q.l1, q.ph1), vertex(q.l1, q.ph0),
    ];
    const proj = verts.map(v => w2s(v, cam));
    if (proj.some(p => p === null)) continue;
    // Simple diffuse: tangent normal in embedded surface direction.
    // Use a "depth-dependent" tint: brighter near throat (small |lc|).
    const t = Math.max(0, 1 - Math.abs(lc) / L_MAX);
    const baseR = 80 + 100 * t;
    const baseG = 100 + 80 * t;
    const baseB = 160 + 90 * t;
    // Lighting: dot of camera-to-center with surface outward (approx
    // radial in the embedding).
    const norm = [Math.cos(phc), 0, Math.sin(phc)];
    const toEye = [cam.eye[0] - center[0], cam.eye[1] - center[1], cam.eye[2] - center[2]];
    const eLen = Math.hypot(toEye[0], toEye[1], toEye[2]);
    const lambert = Math.max(0.15, (toEye[0] * norm[0] + toEye[1] * norm[1] + toEye[2] * norm[2]) / eLen);
    ctx.fillStyle = `rgb(${Math.round(baseR * lambert)}, ${Math.round(baseG * lambert)}, ${Math.round(baseB * lambert)})`;
    ctx.beginPath();
    ctx.moveTo(proj[0].x, proj[0].y);
    ctx.lineTo(proj[1].x, proj[1].y);
    ctx.lineTo(proj[2].x, proj[2].y);
    ctx.lineTo(proj[3].x, proj[3].y);
    ctx.closePath();
    ctx.fill();
    // Wireframe edge in the l direction (every 4th phi).
    if ((q.ph0 * 100 | 0) % 50 === 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(proj[0].x, proj[0].y); ctx.lineTo(proj[3].x, proj[3].y);
      ctx.stroke();
    }
  }
  // Throat ring (highlight).
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.9)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let started = false;
  for (let k = 0; k <= 64; k++) {
    const phi = (k / 64) * 2 * Math.PI;
    const p = w2s(vertex(0, phi), cam);
    if (!p) { started = false; continue; }
    if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  // Captions.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`Flamm embedding: r(l) = sqrt(b_0^2 + l^2), z(l) = b_0 asinh(l/b_0)`, 14, 52);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Two-funnel paraboloid; the throat (yellow ring) is the narrowest waist at l = 0.', 14, 70);
  ctx.fillText(`Universe A is l > 0 (upper funnel); Universe B is l < 0 (lower funnel).`, 14, 88);
}

// =========================================================================
// MODE: EXOTIC. Density rho(l), running ANEC, tidal scale, all on one
// composite plot.
// =========================================================================
function drawExoticMode() {
  const px = 0.06 * W, py = 50, pw = 0.66 * W, ph = H - 130;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.92)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('exotic matter density rho(l), running ANEC, and tidal scale', px + 8, py - 6);
  // Axes: l in [-4, 4] (units of b_0).
  const L_MIN = -4, L_MAX = 4;
  function xForL(l) { return px + 40 + (l - L_MIN) / (L_MAX - L_MIN) * (pw - 60); }
  // y axes: rho in [-rho_throat, 0], ANEC in [I_min, 0], tidal in [0, tidal_max].
  // We normalise all three to fit a single panel.
  // Compute on-the-fly.
  const N = 120;
  const lsArr = [], rhoArr = [], anecArr = [], tidalArr = [];
  for (let k = 0; k < N; k++) {
    const l = L_MIN + (k / (N - 1)) * (L_MAX - L_MIN);
    lsArr.push(l);
    rhoArr.push(exoticDensity(l * st.b0, st.b0));
    anecArr.push(anecIntegral(l * st.b0, st.b0, 50));
    tidalArr.push(tidalScale(l * st.b0, st.b0));
  }
  // Normalise each into ph * 0.4.
  function fitter(arr, signed = false) {
    let mn = Infinity, mx = -Infinity;
    for (const v of arr) { if (v < mn) mn = v; if (v > mx) mx = v; }
    return (v) => {
      const denom = Math.max(1e-12, Math.max(Math.abs(mn), Math.abs(mx)));
      const t = signed ? (v / denom) : (v - mn) / Math.max(1e-12, mx - mn);
      return t;
    };
  }
  const fRho = fitter(rhoArr, true);     // signed (rho negative)
  const fAnec = fitter(anecArr, true);
  const fTidal = fitter(tidalArr);
  // Three sub-strips.
  const strips = [
    { label: 'rho(l) (units of 1/(8 pi G b_0^2))', color: 'rgba(255, 130, 110, 0.95)', data: rhoArr, fit: fRho, y0: py + 36, height: ph * 0.28 },
    { label: 'running ANEC integral (always negative)', color: 'rgba(120, 220, 200, 0.95)', data: anecArr, fit: fAnec, y0: py + 36 + ph * 0.32, height: ph * 0.28 },
    { label: 'tidal scale 1/r(l)^2 (felt by traveller)', color: 'rgba(255, 230, 120, 0.95)', data: tidalArr, fit: fTidal, y0: py + 36 + ph * 0.64, height: ph * 0.28 },
  ];
  for (const s of strips) {
    // Strip background label.
    ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillText(s.label, px + 10, s.y0 - 4);
    // Zero line.
    const yZero = s.y0 + s.height / 2;
    ctx.strokeStyle = 'rgba(200, 210, 230, 0.18)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(px + 40, yZero); ctx.lineTo(px + pw - 20, yZero); ctx.stroke();
    ctx.setLineDash([]);
    // Curve.
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const l = lsArr[k];
      const x = xForL(l);
      const yNorm = s.fit(s.data[k]);
      const y = yZero - yNorm * (s.height / 2);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Throat tick.
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.55)';
  ctx.setLineDash([2, 5]);
  ctx.beginPath(); ctx.moveTo(xForL(0), py + 16); ctx.lineTo(xForL(0), py + ph - 14); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('throat (l = 0)', xForL(0) + 4, py + ph - 22);
  // X-axis label.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.85)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('l / b_0', px + pw - 40, py + ph - 8);
  // Caption.
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Morris-Thorne 1988: rho < 0 at the throat; ANEC violated. Real matter cannot do this.', px + 8, py + ph + 18);
}

// =========================================================================
// SIDE PANEL.
// =========================================================================
function drawSidePanel() {
  const x = 0.74 * W, y = 30, w = W - x - 14, h = 220;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('wormhole', x + 8, y - 6);
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
  const l_m = st.lCam * st.b0;
  row('throat b_0', st.b0.toFixed(2));
  row('l / b_0', st.lCam.toFixed(2));
  row('r(l) / b_0', (circumferentialR(l_m, st.b0) / st.b0).toFixed(3));
  row('z(l) / b_0', (embedZ(l_m, st.b0) / st.b0).toFixed(3));
  row('tidal 1/r^2', (1 / Math.pow(circumferentialR(l_m, st.b0), 2)).toExponential(2));
  const rhoSI = exoticEnergyDensity_SI(st.b0);
  row('rho_throat (J/m^3)', rhoSI.toExponential(2), '#ff908a');
  row('mode', st.mode, '#ffd28a');
}

function drawModeTab() {
  ctx.fillStyle = 'rgba(20, 28, 44, 0.85)';
  ctx.fillRect(10, 8, 290, 26);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.40)';
  ctx.strokeRect(10.5, 8.5, 289, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.95)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const labels = {
    overview: 'OVERVIEW (throat + two skies)',
    traversal: 'TRAVERSAL (camera flythrough)',
    embedding: 'EMBEDDING (two-funnel paraboloid)',
    exotic: 'EXOTIC (rho, ANEC, tidal)',
  };
  ctx.fillText(labels[st.mode] || st.mode, 20, 26);
}

function updateReadout() {
  rB0.textContent = st.b0.toFixed(2);
  rL.textContent = st.lCam.toFixed(2);
  rR.textContent = (circumferentialR(st.lCam * st.b0, st.b0) / st.b0).toFixed(2);
  rRho.textContent = exoticEnergyDensity_SI(st.b0).toExponential(2);
  rMode.textContent = st.mode;
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
function draw() {
  paintBackground();
  const cam = makeCamBasis();
  if (st.mode === 'overview') drawOverviewMode();
  else if (st.mode === 'traversal') drawTraversalMode();
  else if (st.mode === 'embedding') drawEmbeddingMode(cam);
  else if (st.mode === 'exotic') drawExoticMode();
  drawSidePanel();
  drawModeTab();
  updateReadout();
}

function readSliders() {
  st.mode = selMode.value;
  st.b0 = parseFloat(sB0.value);
  st.lCam = parseFloat(sLcam.value);
  st.yaw = parseFloat(sYaw.value);
  vMode.textContent = st.mode.slice(0, 5);
  vB0.textContent = st.b0.toFixed(2);
  vLcam.textContent = st.lCam.toFixed(2);
  vYaw.textContent = String(st.yaw);
  syncRowVisibility(st.mode);
}

[selMode, sB0, sLcam, sYaw].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => { st.t = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  b0: { get: () => st.b0, set: v => { st.b0 = parseFloat(v); sB0.value = v; }, parse: parseFloat },
  mode: { get: () => st.mode, set: v => { st.mode = v; selMode.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function captureModeForFraction(f) {
  if (f < 0.20) return 'overview';
  if (f < 0.45) return 'traversal';
  if (f < 0.75) return 'embedding';
  return 'exotic';
}

if (CAPTURE_NAME) {
  st.mode = captureModeForFraction(CAPTURE_FRAC || 0);
  selMode.value = st.mode;
  readSliders();
  st.t = (CAPTURE_FRAC || 0) * 4 + 0.5;
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
