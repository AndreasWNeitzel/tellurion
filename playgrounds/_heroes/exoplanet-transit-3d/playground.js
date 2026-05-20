// Exoplanet transit hero. Physics: shared transit engine via ./sim.js
// (Keplerian orbit + limb-darkened transit light curve). Render:
// shared/js/engine-gl/transit-3d.js (limb-darkened star imposter +
// dark planet on the orbit ring). Secondary Canvas2D: the light
// curve (the observable).

import { makeTransit, planetSkyPos, transitFlux, periodFromAxis } from './sim.js';
import { setupTransitGL } from '../../../shared/js/engine-gl/transit-3d.js';
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
try { engine = setupTransitGL(canvas); } catch (e) { console.warn('[transit] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 14, minRadius: 4, maxRadius: 120,
  azimuthDeg: 0, elevationDeg: 0, fovDeg: 35,
  near: 0.05, far: 400,
});
// User feedback: 'star too small'. Star world radius stays at 1 (one
// Rs); the fix is to pull the camera CLOSER so the star takes up
// more screen. We still preserve the (Rp/Rs)^2 transit ratio because
// the planet world radius is also one Rp/Rs world unit and the orbit
// is at one a/Rs world unit (apart from the log compression for
// huge a/Rs).
// View-orbit radius: identity for compact orbits (a/Rs <= 12), gentle
// log compression beyond so an Earth-analogue at a/Rs = 215 still fits.
function viewOrbitRadius(aOverRs) {
  if (aOverRs <= 12) return aOverRs;
  return 12 + 5 * Math.log10(aOverRs / 12);
}
function fitCamera() {
  const A = viewOrbitRadius(ui.aOverRs);
  camera.setRadius(Math.max(8, Math.min(100, A * 2.3)));
}
window.__camera = camera;

const ui = { Rp: 0.1, aOverRs: 6, inc: Math.PI / 2, period: 4, u1: 0.45, u2: 0.20, running: true, hoverPhase: -1 };
let sim = makeTransit({ Rp: ui.Rp, a: ui.aOverRs, inc: ui.inc, period: ui.period, u1: ui.u1, u2: ui.u2 });
function resolve() {
  sim = makeTransit({ Rp: ui.Rp, a: ui.aOverRs, inc: ui.inc, period: ui.period, u1: ui.u1, u2: ui.u2 });
  fitCamera();
}
fitCamera();

const RKEYS = ['phase', 'flux', 'depth (Rp/Rs)^2', 'period', 'inclination', 'transit?'];
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
const sRp = slider('Rp / Rs', 0.02, 0.25, 0.005, ui.Rp, (v) => v.toFixed(3), (v) => { ui.Rp = v; resolve(); });
const sA = slider('a / Rs', 2, 20, 0.1, ui.aOverRs, (v) => v.toFixed(1), (v) => { ui.aOverRs = v; resolve(); });
const sI = slider('inclination', 1.30, Math.PI / 2, 0.005, ui.inc, (v) => `${(v * 57.3).toFixed(1)} deg`, (v) => { ui.inc = v; resolve(); });
const sP = slider('period', 1.0, 10.0, 0.1, ui.period, (v) => v.toFixed(1), (v) => { ui.period = v; resolve(); });
slider('limb u1', 0, 0.9, 0.02, ui.u1, (v) => v.toFixed(2), (v) => { ui.u1 = v; resolve(); });
slider('limb u2', 0, 0.6, 0.02, ui.u2, (v) => v.toFixed(2), (v) => { ui.u2 = v; resolve(); });
function selRow(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
selRow('preset', ['central transit', 'grazing transit', 'no transit', 'hot Jupiter', 'Earth analogue'], (p) => {
  if (p === 'central transit') Object.assign(ui, { Rp: 0.10, aOverRs: 6, inc: Math.PI / 2, period: 4, u1: 0.45, u2: 0.20 });
  else if (p === 'grazing transit') Object.assign(ui, { Rp: 0.10, aOverRs: 8, inc: Math.PI / 2 - 0.115, period: 4, u1: 0.45, u2: 0.20 });
  else if (p === 'no transit') Object.assign(ui, { Rp: 0.10, aOverRs: 8, inc: Math.PI / 2 - 0.22, period: 4, u1: 0.45, u2: 0.20 });
  else if (p === 'hot Jupiter') Object.assign(ui, { Rp: 0.10, aOverRs: 3.5, inc: Math.PI / 2, period: 2.0, u1: 0.45, u2: 0.20 });
  else Object.assign(ui, { Rp: 0.0092, aOverRs: 215, inc: Math.PI / 2, period: 8.0, u1: 0.45, u2: 0.20 });
  sRp.value = ui.Rp.toFixed(3); sA.value = ui.aOverRs.toFixed(1);
  sI.value = ui.inc.toFixed(3); sP.value = ui.period.toFixed(1); resolve();
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bEdge = document.createElement('button'); bEdge.type = 'button'; bEdge.textContent = 'Edge-on';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
btnRow.append(bPause, bEdge, bReset); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bEdge.addEventListener('click', () => { camera.setAzimuthDeg(0); camera.setElevationDeg(0); });
bReset.addEventListener('click', () => { sim.t = 0; });

plot.addEventListener('pointermove', (e) => {
  const r = plot.getBoundingClientRect();
  ui.hoverPhase = (e.clientX - r.left) / r.width;
});
plot.addEventListener('pointerleave', () => { ui.hoverPhase = -1; });

// Light curve over one full period, sampled and cached when params change.
let curve = null;
function rebuildCurve() {
  const N = 600;
  curve = new Float64Array(N);
  for (let i = 0; i < N; i += 1) curve[i] = transitFlux(sim, (i / N) * sim.period);
}

function drawPlot() {
  if (!curve) rebuildCurve();
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, W, H);
  const x0 = 56, x1 = W - 16, y0 = 18, y1 = H - 22;
  // baseline
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(x0, y0); pctx.lineTo(x0, y1); pctx.lineTo(x1, y1); pctx.stroke();
  let fmin = 1;
  for (let i = 0; i < curve.length; i += 1) if (curve[i] < fmin) fmin = curve[i];
  const fLo = Math.min(1 - 1.4 * (1 - fmin), 0.9999);
  const yOf = (f) => y0 + (1 - (f - fLo) / (1 - fLo)) * (y1 - y0);
  pctx.strokeStyle = '#5fd0e0'; pctx.lineWidth = 1.8; pctx.beginPath();
  for (let i = 0; i < curve.length; i += 1) { const X = x0 + (i / curve.length) * (x1 - x0); const Y = yOf(curve[i]); i ? pctx.lineTo(X, Y) : pctx.moveTo(X, Y); }
  pctx.stroke();
  // current phase marker (yellow)
  const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
  const Xp = x0 + phase * (x1 - x0);
  const Yp = yOf(transitFlux(sim, phase * sim.period));
  pctx.strokeStyle = '#ffd166'; pctx.beginPath(); pctx.moveTo(Xp, y0); pctx.lineTo(Xp, y1); pctx.stroke();
  pctx.fillStyle = '#ffd166'; pctx.beginPath(); pctx.arc(Xp, Yp, 4.5, 0, 6.28); pctx.fill();
  // hover phase marker
  if (ui.hoverPhase >= 0 && ui.hoverPhase <= 1) {
    const ph = ui.hoverPhase, hF = transitFlux(sim, ph * sim.period);
    const Xh = x0 + ph * (x1 - x0);
    pctx.strokeStyle = 'rgba(255,255,255,0.55)'; pctx.setLineDash([3, 3]); pctx.beginPath(); pctx.moveTo(Xh, y0); pctx.lineTo(Xh, y1); pctx.stroke(); pctx.setLineDash([]);
    pctx.fillStyle = '#cdd1d6'; pctx.font = '11px ui-monospace, monospace'; pctx.textAlign = 'left';
    pctx.fillText(`phase ${ph.toFixed(2)}  flux ${hF.toFixed(5)}`, Xh + 6, y0 + 12);
  }
  pctx.fillStyle = '#7a818c'; pctx.font = '11px ui-monospace, monospace'; pctx.textAlign = 'left';
  pctx.fillText('stellar flux vs orbital phase   (yellow = current; hover for value)', 8, 12);
  pctx.fillText('1.0000', 8, y0 + 4); pctx.fillText(fLo.toFixed(4), 8, y1);
}

function refreshReadout() {
  const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
  const f = transitFlux(sim, phase * sim.period);
  const p = planetSkyPos(sim, phase * sim.period);
  rEls.phase.textContent = phase.toFixed(3);
  rEls.flux.textContent = f.toFixed(5);
  rEls['depth (Rp/Rs)^2'].textContent = (ui.Rp * ui.Rp).toExponential(2);
  rEls.period.textContent = ui.period.toFixed(2);
  rEls.inclination.textContent = (ui.inc * 57.296).toFixed(2) + ' deg';
  rEls['transit?'].textContent = (p.infront && (p.x * p.x + p.y * p.y) < (1 + sim.Rp) ** 2) ? 'yes' : 'no';
}

function frame() {
  if (engine) {
    const phase = ((sim.t % sim.period) / sim.period + 1) % 1;
    const theta = 2 * Math.PI * phase;
    // World units: star radius = 1; orbit radius = viewOrbitRadius(a/Rs);
    // planet radius = Rp/Rs. Camera radius is now A * 1.20 so the
    // star fills more of the panel.
    const A_view = viewOrbitRadius(ui.aOverRs);
    engine.update(theta, A_view, ui.inc, ui.Rp, [1.0, 0.78, 0.50]);
    engine.render(camera.viewMatrix(), camera.projMatrix(canvas.width / canvas.height), ui.u1, ui.u2, camera.state.fovDeg);
  }
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) sim.t += dt * (ui.period / 14);    // one orbit in ~14 s (slower so the transit is watchable)
  camera.tickIdle(now);
  rebuildCurve();
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    sim.t = CAPTURE_FRAC * sim.period;
    camera.setAzimuthDeg(CAPTURE_FRAC * 18);
    rebuildCurve();
    frame();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  rebuildCurve();
  frame();
}

window.__physicsCheck = async () => {
  const s = makeTransit({ Rp: 0.1, a: 5, inc: Math.PI / 2, period: 4, u1: 0, u2: 0, Nr: 200, Nphi: 280 });
  const f = transitFlux(s, s.period * 0.25);
  return {
    name: 'central transit depth = (Rp/Rs)^2',
    pass: Math.abs(1 - f - 0.01) < 1e-4,
    msg: `1 - f = ${(1 - f).toFixed(5)} vs 0.01`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is render-only; transit physics validated by __physicsCheck and invariants' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
