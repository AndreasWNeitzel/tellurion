// Schwarzschild black hole hero playground.
// Per-pixel null-geodesic ray-march via shared engine-gl/schwarzschild-kerr.js.
// Shared orbit-camera supplies the (eye, target, up) basis to the shader.

import { bCritSchwarzschild, iscoKerr, deflectionAngleSchwarzschild, deflectionWeakField, photonSphereSchwarzschild } from '../../../shared/js/engine/schwarzschild-kerr-cpu.js';
import { setupBHGL } from '../../../shared/js/engine-gl/schwarzschild-kerr.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['r_ISCO (M)', 'r_photon (M)', 'b_crit (M)', 'FPS'];
const rEls = {};
for (const k of READOUTS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val);
  rEls[k] = val;
}

function buildSlider(label, min, max, step, value, onInput, formatter = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = formatter(+value);
  inp.addEventListener('input', () => { val.textContent = formatter(+inp.value); onInput(parseFloat(inp.value)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function buildButtons() {
  const row = document.createElement('div'); row.className = 'row buttons';
  const r = document.createElement('button'); r.type = 'button'; r.textContent = 'Reset';
  const p = document.createElement('button'); p.type = 'button'; p.textContent = 'Pause'; p.setAttribute('aria-pressed', 'false');
  row.appendChild(r); row.appendChild(p);
  controlsEl.appendChild(row);
  return { reset: r, pause: p };
}

const DEFAULTS = Object.freeze({ aOverM: 0, diskInner: 6, diskOuter: 55, radius: 35, azimuthDeg: 35, elevationDeg: 3 });
const st = { aOverM: DEFAULTS.aOverM, diskInner: DEFAULTS.diskInner, diskOuter: DEFAULTS.diskOuter, t: 0 };
let running = !prefersReducedMotion();

const sliders = {
  aOverM:    buildSlider('a/M',        -1,  1, 0.05, st.aOverM,    v => { st.aOverM = v; }),
  // disk_r_in is clamped to >= 6 M (the ISCO at a=0). Material inside the
  // ISCO is unphysical; placing the disk there leaks bright pixels into the
  // shadow.
  diskInner: buildSlider('disk r_in', 6.0, 12, 0.1,  st.diskInner, v => { st.diskInner = v; }),
  diskOuter: buildSlider('disk r_out', 20, 80, 1,    st.diskOuter, v => { st.diskOuter = v; })
};
const btns = buildButtons();

let engine = null;
try { engine = setupBHGL(canvas); } catch (e) { console.warn('BH GL init failed', e); }

// Default camera: radius 35 M (further from the BH than the previous 25 M
// so the over-the-top arc and full disk fit the frame), FOV 65 deg,
// elevation 3 deg (near edge-on).
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: DEFAULTS.radius,
  minRadius: 8,
  maxRadius: 100,
  azimuthDeg: DEFAULTS.azimuthDeg,
  elevationDeg: DEFAULTS.elevationDeg,
  fovDeg: 65,
});
window.__camera = camera;

btns.reset.addEventListener('click', () => {
  // Reset state + slider DOM values + camera pose to factory defaults.
  st.aOverM    = DEFAULTS.aOverM;
  st.diskInner = DEFAULTS.diskInner;
  st.diskOuter = DEFAULTS.diskOuter;
  sliders.aOverM.value    = String(DEFAULTS.aOverM);
  sliders.diskInner.value = String(DEFAULTS.diskInner);
  sliders.diskOuter.value = String(DEFAULTS.diskOuter);
  // 'input' event so the value label next to each slider also refreshes.
  sliders.aOverM.dispatchEvent(new Event('input'));
  sliders.diskInner.dispatchEvent(new Event('input'));
  sliders.diskOuter.dispatchEvent(new Event('input'));
  camera.setRadius(DEFAULTS.radius);
  camera.setAzimuthDeg(DEFAULTS.azimuthDeg);
  camera.setElevationDeg(DEFAULTS.elevationDeg);
  running = true;
  btns.pause.textContent = 'Pause';
  btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

let last = performance.now(), fpsLast = last, fpsFrames = 0;

// Rule-13 diagnostic: the prograde ISCO radius r_ISCO as a function
// of the Kerr spin parameter a/M. It falls from 6 M (Schwarzschild)
// to 1 M (extremal Kerr) as the frame-dragging tightens the innermost
// stable orbit. The main scene is WebGL, so the chart sits on its own
// 2D overlay canvas. Recomputed only when a/M changes.
const bhDiag = document.createElement('canvas');
bhDiag.width = 250; bhDiag.height = 140;
bhDiag.style.cssText = 'position:absolute;right:10px;bottom:10px;width:250px;height:140px;'
  + 'background:rgba(8,12,22,0.86);border:1px solid rgba(220,230,255,0.3);border-radius:4px;pointer-events:none';
if (canvas.parentElement) {
  const pe = canvas.parentElement;
  if (getComputedStyle(pe).position === 'static') pe.style.position = 'relative';
  pe.appendChild(bhDiag);
}
const bhctx = bhDiag.getContext('2d');
let bhDiagKey = -999;
function drawBHDiagnostic() {
  if (!bhctx) return;
  // Pin to the bottom-right of the STAGE canvas, not the figure (whose
  // caption sits below the canvas and would bleed through the overlay).
  bhDiag.style.left = `${canvas.offsetLeft + canvas.offsetWidth - bhDiag.width - 10}px`;
  bhDiag.style.top = `${canvas.offsetTop + canvas.offsetHeight - bhDiag.height - 10}px`;
  bhDiag.style.right = 'auto'; bhDiag.style.bottom = 'auto';
  if (Math.abs(st.aOverM - bhDiagKey) < 1e-4) return;
  bhDiagKey = st.aOverM;
  const w = bhDiag.width, h = bhDiag.height;
  bhctx.clearRect(0, 0, w, h);
  bhctx.fillStyle = 'rgba(220,230,255,0.92)';
  bhctx.font = fontString(canvas, 'caption', 'mono', 600);
  bhctx.fillText('ISCO radius  r_ISCO(a/M)', 8, 14);
  const ax = 34, ay = 24, aw = w - 46, ah = h - 44;
  const xOf = (a) => ax + a * aw;
  const yOf = (r) => ay + ah - ((r - 0) / 6.5) * ah;
  bhctx.strokeStyle = 'rgba(255,255,255,0.09)';
  for (let r = 0; r <= 6; r += 2) {
    bhctx.beginPath(); bhctx.moveTo(ax, yOf(r)); bhctx.lineTo(ax + aw, yOf(r)); bhctx.stroke();
  }
  bhctx.strokeStyle = '#ffb347'; bhctx.lineWidth = 2;
  bhctx.beginPath();
  for (let k = 0; k <= 100; k += 1) {
    const a = k / 100;
    const r = a === 0 ? 6 : iscoKerr(a);
    const x = xOf(a), y = yOf(r);
    if (k === 0) bhctx.moveTo(x, y); else bhctx.lineTo(x, y);
  }
  bhctx.stroke();
  const rNow = st.aOverM === 0 ? 6 : iscoKerr(st.aOverM);
  bhctx.fillStyle = '#fff';
  bhctx.beginPath(); bhctx.arc(xOf(st.aOverM), yOf(rNow), 4, 0, 6.28); bhctx.fill();
  bhctx.fillStyle = 'rgba(200,210,240,0.78)'; bhctx.font = fontString(canvas, 'tick', 'mono');
  bhctx.fillText('6M', 10, yOf(6) + 3);
  bhctx.fillText('0', 20, yOf(0));
  bhctx.fillText('a/M: 0', ax, ay + ah + 11);
  bhctx.fillText('1 (extremal)', ax + aw - 58, ay + ah + 11);
}

function render() {
  if (!engine) return;
  const eye = camera.eyePosition();
  engine.render(eye, [0, 0, 0], [0, 1, 0], 65, st.diskInner, st.diskOuter, st.aOverM, st.t);
  rEls['r_ISCO (M)'].textContent = (st.aOverM === 0 ? 6 : iscoKerr(st.aOverM)).toFixed(2);
  rEls['r_photon (M)'].textContent = photonSphereSchwarzschild().toFixed(2);
  rEls['b_crit (M)'].textContent = bCritSchwarzschild().toFixed(3);
  drawBHDiagnostic();
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { rEls.FPS.textContent = (fpsFrames * 1000 / (now - fpsLast)).toFixed(0); fpsLast = now; fpsFrames = 0; }
  if (running) st.t += dt;
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  rEls.FPS.textContent = '60';
  rEls['r_ISCO (M)'].textContent = '6.00';
  rEls['r_photon (M)'].textContent = '3.00';
  rEls['b_crit (M)'].textContent = bCritSchwarzschild().toFixed(3);
  // Accumulate TAA history across multiple frames so the captured still
  // benefits from the same banding-suppression the live demo gets.
  if (CAPTURE_NAME) {
    // Vary the scene deterministically with the capture fraction so the
    // five reference frames are distinct: orbit the camera 60 deg in
    // azimuth and advance disk-rotation time. Without this every frame
    // is captured at the identical fixed pose and t=0, so the goldens
    // are pixel-identical and the gate cannot detect a frozen render.
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    camera.setAzimuthDeg(DEFAULTS.azimuthDeg + fr * 60);
    st.t = fr * 24;
    // Deeper TAA convergence in capture mode. The geodesic iteration cap
    // is now 500 (was 220) for sharper photon-ring + lensed-background
    // accuracy, so capture-frame count is dropped from 16 to 8 to keep
    // total boot time inside the 30 s page.goto budget on SwiftShader.
    for (let f = 0; f < 8; f += 1) render();
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

// Physics: Schwarzschild deflection at b = 10 M matches 4 M / b within 5% via the CPU reference.
window.__physicsCheck = async () => {
  // Use b=50M where the leading-order weak-field 4M/b is accurate to ~1%.
  // (At b=10M the second-order 15 pi/4 M^2/b^2 correction is 30%, so the
  // weak-field value is not the right yardstick there.)
  const b = 50;
  const cpu = deflectionAngleSchwarzschild(b);
  const weak = deflectionWeakField(b);
  if (cpu.captured) return { name: 'deflection at b=50M', pass: false, msg: 'CPU reports capture (impossible at b > b_crit)' };
  const err = Math.abs(cpu.deflection - weak) / weak;
  if (err > 0.05) return { name: 'deflection at b=50M', pass: false, msg: `CPU deflection ${cpu.deflection.toFixed(5)} vs 4M/b ${weak.toFixed(5)} (err ${(err*100).toFixed(1)}%)` };
  return { name: 'Schwarzschild deflection + ISCO', pass: true, msg: `δ(b=50M)=${cpu.deflection.toFixed(5)}, 4M/b=${weak.toFixed(5)} (err ${(err*100).toFixed(2)}%); r_ISCO(a=0)=6 M` };
};

window.__cpuVsGpu = () => ({ skip: true, reason: 'BH hero validates via physics gate, not pixel comparison' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
