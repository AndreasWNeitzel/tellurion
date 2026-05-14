// Tokamak hero. Translucent vessel + helical field lines + Planck plasma core
// + 12 trapped (banana) particles. Shared orbit-camera.

import { safetyAtEdge } from './sim.js';
import { setupTokamakGL } from '../../../shared/js/engine-gl/tokamak.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['q_edge', 'q_axis', 'particles', 'FPS'];
const rEls = {};
for (const k of READOUTS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val);
  rEls[k] = val;
}

function buildSlider(label, min, max, step, value, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = (+value).toFixed(2);
  inp.addEventListener('input', () => { val.textContent = (+inp.value).toFixed(2); onInput(parseFloat(inp.value)); rebuild = true; });
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

const st = { R: 1.0, a: 0.35, B0: 5.3, Ip: 3, t: 0 };
let running = true;
let rebuild = true;

buildSlider('R0 (m)', 1.0, 3.0, 0.05, st.R, v => { st.R = v; });
buildSlider('a (m)', 0.2, 1.0, 0.02, st.a, v => { st.a = v; });
buildSlider('B0 (T)', 1, 10, 0.1, st.B0, v => { st.B0 = v; });
buildSlider('Ip (MA)', 0.1, 20, 0.5, st.Ip, v => { st.Ip = v; });
const btns = buildButtons();

let engine = null;
try { engine = setupTokamakGL(canvas); } catch (e) { console.warn('tokamak GL init failed', e); }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 4.0,
  minRadius: 1.5,
  maxRadius: 10.0,
  azimuthDeg: 35, elevationDeg: 25, fovDeg: 45,
});
window.__camera = camera;

btns.reset.addEventListener('click', () => {
  st.R = 1.0; st.a = 0.35; st.B0 = 5.3; st.Ip = 3; rebuild = true;
  running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

let sceneInfo = null;
let last = performance.now(), fpsLast = last, fpsFrames = 0;
const aspect = () => canvas.width / canvas.height;

function render() {
  if (!engine) return;
  const q_edge = Math.max(1.0, safetyAtEdge(st.B0, st.R, st.a, st.Ip));
  if (rebuild) {
    sceneInfo = engine.buildScene(st.R, st.a, q_edge, st.B0, st.Ip);
    rebuild = false;
  }
  engine.render(camera.viewMatrix(), camera.projMatrix(aspect()), sceneInfo);
  rEls.q_edge.textContent = q_edge.toFixed(2);
  rEls.q_axis.textContent = (1 / (1 + 0.05 * st.Ip)).toFixed(2); // proxy on-axis q
  rEls.particles.textContent = '12';
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { rEls.FPS.textContent = (fpsFrames * 1000 / (now - fpsLast)).toFixed(0); fpsLast = now; fpsFrames = 0; }
  if (running) st.t += dt;
  // animate via a tiny scene rotation? keep simple for capture determinism.
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  rEls.FPS.textContent = '60';
  rEls.particles.textContent = '12';
  rEls.q_edge.textContent = safetyAtEdge(st.B0, st.R, st.a, st.Ip).toFixed(2);
  rEls.q_axis.textContent = (1 / (1 + 0.05 * st.Ip)).toFixed(2);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

// Physics: q profile sanity. The edge safety factor should be > 1 for stability.
window.__physicsCheck = async () => {
  const q = safetyAtEdge(st.B0, st.R, st.a, st.Ip);
  if (q < 1) return { name: 'q_edge', pass: false, msg: `q_edge=${q.toFixed(2)} below kink-instability threshold 1` };
  if (q > 50) return { name: 'q_edge', pass: false, msg: `q_edge=${q.toFixed(2)} unphysically high` };
  return { name: 'q_edge', pass: true, msg: `q_edge=${q.toFixed(2)} in stable band` };
};

window.__cpuVsGpu = () => ({ skip: true, reason: 'tokamak hero is JS-built geometry; no GPU physics path' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
