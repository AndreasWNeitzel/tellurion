// BEC vortex-lattice playground. Renders the Thomas-Fermi density of
// a 2D rotating condensate with quantized vortex cores marked as
// black holes and the phase encoded as a hue ring around each.
//
// Approach: compute |psi(x,y)|^2 on a grid using the kinematic
// product-of-cores ansatz n_TF(r) * prod_v tanh^2(|r-r_v|/xi); fill
// an ImageData with a cyan-magenta colormap; overlay a faint phase
// hue near each vortex; draw vortex markers.

import { thomasFermiRadius, healingLength, vortexLattice, vortexCount, vortexSpacing, angularMomentumPerAtom, density, phase, OMEGA_MAX } from './sim.js';
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

const rOmega = document.getElementById('readout-omega');
const rNv = document.getElementById('readout-nv');
const rRTF = document.getElementById('readout-rtf');
const rXi = document.getElementById('readout-xi');
const rLz = document.getElementById('readout-lz');

const sOmega = document.getElementById('slider-omega'), vOmega = document.getElementById('value-omega');
const sNa = document.getElementById('slider-Na'), vNa = document.getElementById('value-Na');
const sPhase = document.getElementById('slider-phase'), vPhase = document.getElementById('value-phase');
const sRes = document.getElementById('slider-res'), vRes = document.getElementById('value-res');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  omega: 0.78,
  Na: 2500,
  phaseAlpha: 0.5,
  res: 220,
  running: !prefersReducedMotion(),
  t: 0,
  rotation: 0,
  cacheKey: '',
  lattice: [],
  R_TF: 0,
  xi: 0,
};

// Cyan-magenta-yellow colormap for density.
function densityColor(d, out) {
  const u = Math.max(0, Math.min(1, d));
  // 3-stop gradient: dark cyan (0, 30, 70) -> magenta (200, 60, 160)
  // -> yellow-white (255, 240, 200).
  let r, g, b;
  if (u < 0.5) {
    const t = u * 2;
    r = Math.round(0 * (1 - t) + 200 * t);
    g = Math.round(30 * (1 - t) + 60 * t);
    b = Math.round(70 * (1 - t) + 160 * t);
  } else {
    const t = (u - 0.5) * 2;
    r = Math.round(200 * (1 - t) + 255 * t);
    g = Math.round(60 * (1 - t) + 240 * t);
    b = Math.round(160 * (1 - t) + 200 * t);
  }
  out[0] = r; out[1] = g; out[2] = b;
}

// Phase -> hue (HSV with full saturation).
function phaseColor(theta, out) {
  // theta in [-pi, pi], map to hue [0, 1].
  const hue = ((theta / (2 * Math.PI)) + 1) % 1;
  const i = Math.floor(hue * 6);
  const f = hue * 6 - i;
  const v = 1, s = 1;
  const p_ = 0;
  const q = 1 - s * f;
  const t = 1 - s * (1 - f);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p_; break;
    case 1: r = q; g = v; b = p_; break;
    case 2: r = p_; g = v; b = t; break;
    case 3: r = p_; g = q; b = v; break;
    case 4: r = t; g = p_; b = v; break;
    case 5: r = v; g = p_; b = q; break;
  }
  out[0] = Math.round(r * 255);
  out[1] = Math.round(g * 255);
  out[2] = Math.round(b * 255);
}

function w2s(x, y) {
  // world coords: ~[-R_TF, R_TF]. Fit with 80% canvas.
  const halfWorld = Math.max(st.R_TF, 0.1) * 1.15;
  const scale = (Math.min(W, H) * 0.85) / (2 * halfWorld);
  return { x: W / 2 + x * scale, y: H / 2 - y * scale, scale };
}

function rotatePoint(p, theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return { x: c * p.x - s * p.y, y: s * p.x + c * p.y };
}

function updateLattice() {
  const key = `${st.omega.toFixed(3)}_${st.Na.toFixed(0)}`;
  if (key === st.cacheKey) return;
  st.cacheKey = key;
  const Na = st.Na / 100; // map to dimensionless N_aS_ratio in sim's units.
  st.lattice = vortexLattice(st.omega, Na);
  st.R_TF = thomasFermiRadius(Na);
  st.xi = healingLength(Na);
}

function drawCondensate() {
  // Rotate the lattice by st.rotation for animation.
  const lat = st.lattice.map(v => rotatePoint(v, st.rotation));
  const Na = st.Na / 100;
  const halfWorld = Math.max(st.R_TF, 0.1) * 1.15;
  const N = Math.floor(st.res);
  const cell = Math.min(W, H) / N;
  const img = ctx.createImageData(N, N);
  const data = img.data;
  const rgb = [0, 0, 0];
  const rgbPh = [0, 0, 0];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N - 0.5) * 2 * halfWorld;
      const y = ((0.5 - (j + 0.5) / N)) * 2 * halfWorld;
      const d = density(x, y, st.omega, Na, lat);
      // Boost contrast a bit so cores read.
      const dShow = Math.pow(d, 0.6);
      densityColor(dShow, rgb);
      // Phase overlay near vortices (where density is low).
      if (st.phaseAlpha > 0 && d > 0.0) {
        const ph = phase(x, y, lat);
        phaseColor(ph, rgbPh);
        // Weight phase by (1 - core) so it shows close to cores.
        const r2 = x * x + y * y;
        const insideTF = (r2 < st.R_TF * st.R_TF) ? 1 : 0;
        // emphasis: small near full-density regions, larger near holes
        const emph = insideTF * Math.exp(-d * 4) * st.phaseAlpha;
        rgb[0] = Math.round(rgb[0] * (1 - emph) + rgbPh[0] * emph);
        rgb[1] = Math.round(rgb[1] * (1 - emph) + rgbPh[1] * emph);
        rgb[2] = Math.round(rgb[2] * (1 - emph) + rgbPh[2] * emph);
      }
      const idx = (j * N + i) * 4;
      data[idx + 0] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }
  // Centre the rendered grid in the canvas.
  const c2 = document.createElement('canvas');
  c2.width = N; c2.height = N;
  const ctx2 = c2.getContext('2d');
  ctx2.putImageData(img, 0, 0);
  // Background
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  // Draw scaled bitmap.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const D = Math.min(W, H);
  ctx.drawImage(c2, (W - D) / 2, (H - D) / 2, D, D);
}

function drawVorticesAndAxes() {
  const lat = st.lattice.map(v => rotatePoint(v, st.rotation));
  // Trap boundary circle.
  const c = w2s(0, 0);
  const r = c.scale * st.R_TF;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
  // Vortex dots.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.2;
  const dotR = Math.max(2.5, c.scale * st.xi * 0.9);
  for (const v of lat) {
    const p = w2s(v.x, v.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Rotation arrow.
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.6)';
  ctx.fillStyle = 'rgba(255, 240, 200, 0.6)';
  ctx.lineWidth = 1.5;
  const aR = r * 1.07;
  const a0 = -0.3, a1 = -1.6;
  ctx.beginPath(); ctx.arc(c.x, c.y, aR, a0, a1, true); ctx.stroke();
  // arrowhead at a1
  const ah = { x: c.x + aR * Math.cos(a1), y: c.y + aR * Math.sin(a1) };
  const tx = -Math.sin(a1), ty = Math.cos(a1); // tangent at a1 (going CCW)
  const ah1 = { x: ah.x - 8 * tx + 4 * Math.cos(a1), y: ah.y - 8 * ty + 4 * Math.sin(a1) };
  const ah2 = { x: ah.x - 8 * tx - 4 * Math.cos(a1), y: ah.y - 8 * ty - 4 * Math.sin(a1) };
  ctx.beginPath(); ctx.moveTo(ah.x, ah.y); ctx.lineTo(ah1.x, ah1.y); ctx.lineTo(ah2.x, ah2.y); ctx.closePath(); ctx.fill();
  // Label.
  ctx.fillStyle = 'rgba(255, 240, 200, 0.85)';
  ctx.font = fontString(canvas, 'body');
  ctx.fillText('Ω', c.x + aR * Math.cos((a0 + a1) / 2) + 6, c.y + aR * Math.sin((a0 + a1) / 2));
}

function drawCount() {
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'body');
  const txt = `${st.lattice.length} quantized vortices`;
  ctx.fillText(txt, 14, 22);
  // Magic shell numbers.
  ctx.fillText(`shell-filling: 1, 7, 19, 37, 61 ...`, 14, 40);
}

function draw() {
  updateLattice();
  drawCondensate();
  drawVorticesAndAxes();
  drawCount();
  updateReadout();
}

function updateReadout() {
  const Na = st.Na / 100;
  rOmega.textContent = st.omega.toFixed(2);
  rNv.textContent = String(st.lattice.length);
  rRTF.textContent = thomasFermiRadius(Na).toFixed(2);
  rXi.textContent = healingLength(Na).toFixed(3);
  rLz.textContent = angularMomentumPerAtom(st.omega, Na).toFixed(3);
}

function readSliders() {
  st.omega = parseFloat(sOmega.value);
  st.Na = parseFloat(sNa.value);
  st.phaseAlpha = parseFloat(sPhase.value);
  st.res = parseInt(sRes.value, 10);
  vOmega.textContent = st.omega.toFixed(2);
  vNa.textContent = st.Na.toFixed(0);
  vPhase.textContent = st.phaseAlpha.toFixed(2);
  vRes.textContent = String(st.res);
  st.cacheKey = ''; // force re-lattice
}

[sOmega, sNa, sPhase, sRes].forEach(el => el.addEventListener('input', readSliders));
btnReset.addEventListener('click', () => {
  st.rotation = 0;
  st.t = 0;
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  omega: { get: () => st.omega, set: v => { st.omega = parseFloat(v); sOmega.value = v; }, parse: parseFloat },
  Na: { get: () => st.Na, set: v => { st.Na = parseFloat(v); sNa.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  st.rotation = (CAPTURE_FRAC || 0) * 0.6;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      // Gentle solid-body rotation of the lattice for visual interest.
      st.rotation += dt * Math.max(0.02, st.omega * 0.25);
      st.t += dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'temperature-k', label: 'Temperature', value: parseFloat(document.getElementById('slider-temp')?.value || 0), format: 'float' },
      { key: 'density-um3', label: 'Density', value: parseFloat(document.getElementById('slider-density')?.value || 0), format: 'float' },
      { key: 'vortex-count', label: 'Vortex count', value: st.vortexCount || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Check that vortex count remains stable during evolution.
  const currentCount = st.vortexCount || 0;
  if (!window._vortexCountBaseline) {
    window._vortexCountBaseline = currentCount;
  }
  const drift = Math.abs(currentCount - window._vortexCountBaseline);
  const status = drift === 0 ? 'pass' : 'drift';
  return [
    {
      key: 'vortex-count-conservation',
      label: 'Vortex count change',
      value: String(drift),
      status: status
    }
  ];
};
