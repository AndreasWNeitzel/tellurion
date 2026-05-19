// Laser cavity hero. Physics: shared rate-equation engine via
// ./sim.js. Render: shared/js/engine-gl/laser-cavity-3d.js (glowing
// excited atoms + cavity photons + output beam). Secondary Canvas2D:
// the output-versus-pump curve with its sharp threshold kink.

import { cavityLifetime, thresholdPump, thresholdInversion, makeLaser, step, outputPower, steadyState } from './sim.js';
import { setupLaserCavityGL } from '../../../shared/js/engine-gl/laser-cavity-3d.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const plot = document.getElementById('plot');
const pctx = plot.getContext('2d');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

let engine = null;
try { engine = setupLaserCavityGL(canvas); } catch (e) { console.warn('[laser] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0.6, 0, 0], radius: 8.6, minRadius: 4, maxRadius: 24,
  azimuthDeg: 42, elevationDeg: 13, fovDeg: 56,
});
window.__camera = camera;

// Default pump is set just above the lasing threshold so the slider
// has visible head-room above and below it. The old P=3 was ~75x
// the threshold (everything saturated, the slider looked dead).
const ui = { Lc: 1, R: 0.92, tau: 1, P: 0.08, running: true, qArmed: false, qOpen: true, qT: 0 };
const sim = makeLaser({ P: ui.P, tau: ui.tau, tauC: cavityLifetime(ui.Lc, ui.R), B: 1, seed: 1e-5, qLow: 1e-3 });
function syncParams() { sim.P = ui.P; sim.tau = ui.tau; sim.tauC = cavityLifetime(ui.Lc, ui.R); }

const RKEYS = ['pump P', 'P_threshold', 'inversion N', 'photons n', 'output', 'state'];
const rEls = {};
for (const k of RKEYS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.append(lab, val); rEls[k] = val;
}

function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return inp;
}
const sP = slider('pump P', 0, 0.6, 0.005, ui.P, (v) => v.toFixed(3), (v) => { ui.P = v; syncParams(); });
slider('mirror R', 0.5, 0.99, 0.005, ui.R, (v) => v.toFixed(3), (v) => { ui.R = v; syncParams(); });
slider('cavity length', 0.5, 3, 0.05, ui.Lc, (v) => v.toFixed(2), (v) => { ui.Lc = v; syncParams(); });
slider('upper tau', 0.3, 6, 0.1, ui.tau, (v) => v.toFixed(1), (v) => { ui.tau = v; syncParams(); });
function sel(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
sel('preset', ['below threshold', 'at threshold', 'well above threshold', 'Q-switched giant pulse'], (p) => {
  ui.qArmed = false; ui.qOpen = true;
  const Pth = thresholdPump(1, sim.tauC, ui.tau);
  if (p === 'below threshold') ui.P = 0.6 * Pth;
  else if (p === 'at threshold') ui.P = 1.02 * Pth;
  else if (p === 'well above threshold') ui.P = 4 * Pth;
  else { ui.tau = 5; ui.P = 0.5 * thresholdPump(1, sim.tauC, 5) * 6; ui.qArmed = true; ui.qOpen = false; ui.qT = 0; sim.N = 0; sim.n = 1e-9; }
  sP.value = ui.P.toFixed(2); syncParams();
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bQ = document.createElement('button'); bQ.type = 'button'; bQ.textContent = 'Q-switch: build & fire';
btnRow.append(bPause, bReset, bQ); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bReset.addEventListener('click', () => { sim.N = 0; sim.n = 1e-9; ui.qArmed = false; ui.qOpen = true; });
bQ.addEventListener('click', () => { ui.qArmed = true; ui.qOpen = false; ui.qT = 0; sim.N = 0; sim.n = 1e-9; });

let nMaxSeen = 1, outMaxSeen = 1;
function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  const Pmax = 8, x0 = 44, x1 = W - 16, y0 = 16, y1 = H - 22;
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(x0, y1); pctx.lineTo(x1, y1); pctx.stroke();
  let omax = 1e-6;
  const pts = [];
  for (let k = 0; k <= 80; k += 1) {
    const P = (k / 80) * Pmax;
    const o = steadyState({ P, tau: ui.tau, tauC: sim.tauC, B: 1, seed: 1e-6 }, 4e-3, 9000).output;
    pts.push([P, o]); omax = Math.max(omax, o);
  }
  pctx.strokeStyle = '#5fd0e0'; pctx.lineWidth = 1.8; pctx.beginPath();
  pts.forEach(([P, o], i) => { const X = x0 + (P / Pmax) * (x1 - x0), Y = y1 - (o / omax) * (y1 - y0); i ? pctx.lineTo(X, Y) : pctx.moveTo(X, Y); });
  pctx.stroke();
  const Xp = x0 + (Math.min(Pmax, ui.P) / Pmax) * (x1 - x0);
  pctx.strokeStyle = '#ffd166'; pctx.beginPath(); pctx.moveTo(Xp, y0); pctx.lineTo(Xp, y1); pctx.stroke();
  pctx.fillStyle = '#7a818c'; pctx.font = '11px ui-monospace, monospace'; pctx.textAlign = 'left';
  pctx.fillText('output power vs pump (sharp lasing-threshold kink; yellow = current pump)', 8, 12);
}

function refreshReadout() {
  const Pth = thresholdPump(1, sim.tauC, ui.tau);
  rEls['pump P'].textContent = ui.P.toFixed(2);
  rEls.P_threshold.textContent = Pth.toFixed(2);
  rEls['inversion N'].textContent = sim.N.toFixed(2);
  rEls['photons n'].textContent = sim.n < 1e-3 ? sim.n.toExponential(1) : sim.n.toFixed(2);
  rEls.output.textContent = outputPower(sim).toFixed(3);
  rEls.state.textContent = ui.qArmed && !ui.qOpen ? 'Q closed (charging)' : (ui.P > Pth ? 'lasing' : 'below threshold');
}

function frame() {
  const Pth = thresholdPump(1, sim.tauC, ui.tau);
  const invF = Math.min(1, sim.N / Math.max(1.4 * thresholdInversion(1, sim.tauC), 0.06));
  const photF = Math.min(1, sim.n / 0.6);
  const outF = Math.min(1, outputPower(sim) / 0.02);
  if (engine) { engine.update(0.016, invF, photF, outF); engine.render(camera.viewMatrix(), camera.projMatrix(canvas.width / canvas.height)); }
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.033); last = now;
  if (ui.running) {
    if (ui.qArmed && !ui.qOpen) { ui.qT += dt; if (ui.qT > 1.4) ui.qOpen = true; }
    const sub = 6, h = (dt * 4) / sub;
    for (let i = 0; i < sub; i += 1) step(sim, h, ui.qOpen);
  }
  camera.tickIdle(now);
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const Pth = thresholdPump(1, sim.tauC, ui.tau);
    const ks = [0.5, 1.0, 2.0, 4.0, 6.0];
    ui.P = ks[Math.min(ks.length - 1, Math.floor(CAPTURE_FRAC * ks.length + 1e-6))] * Pth;
    syncParams();
    for (let i = 0; i < 5000; i += 1) step(sim, 2e-3, true);
    camera.setAzimuthDeg(40 + CAPTURE_FRAC * 28);
    frame();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  for (let i = 0; i < 1500; i += 1) step(sim, 2e-3, true);
  frame();
}

window.__physicsCheck = async () => {
  const tauC = cavityLifetime(1, 0.92);
  const Pth = thresholdPump(1, tauC, 1);
  const below = steadyState({ P: 0.6 * Pth, tau: 1, tauC, B: 1, seed: 1e-6 }).output;
  const above = steadyState({ P: 3 * Pth, tau: 1, tauC, B: 1, seed: 1e-6 });
  const Nth = thresholdInversion(1, tauC);
  return {
    name: 'emergent threshold + gain clamping',
    pass: below < 1e-2 && Math.abs(above.N - Nth) / Nth < 0.01 && above.n > 1e3 * below,
    msg: `below out=${below.toExponential(1)}, above N=${above.N.toFixed(3)} (N_th=${Nth.toFixed(3)})`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; rate equations validated by __physicsCheck and invariants' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
