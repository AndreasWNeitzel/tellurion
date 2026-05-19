// Black hole geodesics hero. The hero scene reuses the proven
// ray-marched Schwarzschild/Kerr shader (shared/js/engine-gl/
// schwarzschild-kerr.js). The interactive subject is the equatorial
// plane below: real null/timelike geodesics from the shared engine
// (./sim.js), with the V(r) effective potential as the small panel.

import {
  bCrit, photonSphere, iscoSchwarzschild, schwarzschildRadius,
  integrateGeodesic, vTimelike,
} from './sim.js';
import { setupBHGL } from '../../../shared/js/engine-gl/schwarzschild-kerr.js';
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
try { engine = setupBHGL(canvas); } catch (e) { console.warn('[bh-geo] GL init failed', e); engine = null; }
const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 30, minRadius: 9, maxRadius: 90,
  azimuthDeg: 30, elevationDeg: 8, fovDeg: 62,
});
window.__camera = camera;

const M = 1;
const ui = { b: 5.6, spin: 0.0, t: 0, running: true };
const geods = [];                       // recent fired geodesics

function fire(type, b, L, E, r0 = 46) {
  const g = integrateGeodesic({
    type, M, r0, b, L, E, dphi: 0.003, maxPhi: 90,
  });
  g.kind = type; g.b = b; g.anim = 0;
  geods.push(g); if (geods.length > 6) geods.shift();
  return g;
}
fire('null', ui.b);

const RKEYS = ['b / M', 'b / b_crit', 'outcome', 'periapsis/M', 'r_photon/M', 'r_ISCO/M'];
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
const bS = slider('impact b/M', 2, 9, 0.02, ui.b, (v) => v.toFixed(2), (v) => { ui.b = v; });
slider('spin a/M', 0, 0.98, 0.01, ui.spin, (v) => v.toFixed(2), (v) => { ui.spin = v; });
function sel(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
sel('preset', ['photon capture', 'photon escape (grazing)', 'ISCO orbit', 'plunge'], (p) => {
  if (p === 'photon capture') { ui.b = bCrit(M) * 0.98; bS.value = ui.b.toFixed(2); fire('null', ui.b); }
  else if (p === 'photon escape (grazing)') { ui.b = bCrit(M) * 1.03; bS.value = ui.b.toFixed(2); fire('null', ui.b); }
  else if (p === 'ISCO orbit') {
    // Start AT the circular-orbit radius with the matching L and E,
    // not 46M away with that L (which was the bug: the particle just
    // fell in).
    const r = 6.2, L = Math.sqrt((r * r) / (r - 3));
    const E = Math.sqrt((r - 2) ** 2 / (r * (r - 3)));
    fire('timelike', NaN, L, E, r);
  } else {
    // Plunge: start close enough to see the spiral in (small L, modest
    // E) rather than just a straight fall from r0=46.
    fire('timelike', NaN, 3.3, 0.965, 14);
  }
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bFire = document.createElement('button'); bFire.type = 'button'; bFire.textContent = 'Fire photon';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bClear = document.createElement('button'); bClear.type = 'button'; bClear.textContent = 'Clear rays';
btnRow.append(bFire, bPause, bClear); controlsEl.appendChild(btnRow);
bFire.addEventListener('click', () => fire('null', ui.b));
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bClear.addEventListener('click', () => { geods.length = 0; });

// Click the plane to set the impact parameter and fire.
plot.addEventListener('pointerdown', (e) => {
  const rect = plot.getBoundingClientRect();
  const py = (e.clientY - rect.top) / rect.height;
  const b = Math.abs((py - 0.5) * 2) * 9;          // vertical offset -> b
  ui.b = Math.max(2, Math.min(9, b)); bS.value = ui.b.toFixed(2);
  fire('null', ui.b);
});

// Equatorial-plane map + V(r) inset.
function drawPlot() {
  const W = plot.width, H = plot.height;
  pctx.fillStyle = '#05060a'; pctx.fillRect(0, 0, W, H);
  const cx = W * 0.42, cy = H * 0.5, sc = 11;       // px per M
  const rs = schwarzschildRadius(M), rph = photonSphere(M), ri = iscoSchwarzschild(M);
  // shadow / horizon
  pctx.fillStyle = '#000'; pctx.beginPath(); pctx.arc(cx, cy, rs * sc, 0, 7); pctx.fill();
  pctx.strokeStyle = '#3a3f4a'; pctx.beginPath(); pctx.arc(cx, cy, rs * sc, 0, 7); pctx.stroke();
  pctx.strokeStyle = 'rgba(255,200,120,0.7)'; pctx.setLineDash([4, 4]);
  pctx.beginPath(); pctx.arc(cx, cy, rph * sc, 0, 7); pctx.stroke();
  pctx.strokeStyle = 'rgba(120,200,255,0.6)';
  pctx.beginPath(); pctx.arc(cx, cy, ri * sc, 0, 7); pctx.stroke();
  pctx.setLineDash([]);
  pctx.fillStyle = '#7a818c'; pctx.font = '11px ui-monospace, monospace'; pctx.textAlign = 'left';
  pctx.fillText('equatorial plane: dashed = photon sphere 3M, blue = ISCO 6M', 8, 16);
  pctx.fillText('photon ring', cx + rph * sc + 4, cy - rph * sc);
  for (const g of geods) {
    const col = g.outcome === 'capture' ? '#ff5a5a' : (g.outcome === 'bound' ? '#ffd166' : '#5fd0e0');
    pctx.strokeStyle = col; pctx.lineWidth = 1.6; pctx.beginPath();
    const n = Math.min(g.xs.length, Math.floor(g.anim));
    for (let i = 0; i < n; i += 1) {
      const X = cx + g.xs[i] * sc, Y = cy + g.ys[i] * sc;
      if (i === 0) pctx.moveTo(X, Y); else pctx.lineTo(X, Y);
    }
    pctx.stroke();
    if (n > 0 && n < g.xs.length) {
      pctx.fillStyle = col; pctx.beginPath();
      pctx.arc(cx + g.xs[n - 1] * sc, cy + g.ys[n - 1] * sc, 3, 0, 7); pctx.fill();
    }
  }
  // V(r) inset (timelike effective potential, L for r=6M circular)
  const ix = W * 0.74, iy = 30, iw = W * 0.24, ih = H - 60;
  pctx.strokeStyle = '#23252a'; pctx.strokeRect(ix, iy, iw, ih);
  pctx.fillStyle = '#7a818c'; pctx.fillText('V(r) timelike, L=ISCO', ix, iy - 6);
  const L = Math.sqrt((6 * 6) / (6 - 3));
  let vmin = 1e9, vmax = -1e9;
  for (let r = 3; r < 30; r += 0.2) { const v = vTimelike(r, L, M); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
  pctx.strokeStyle = '#9b8cff'; pctx.lineWidth = 1.6; pctx.beginPath();
  let first = true;
  for (let r = 3; r < 30; r += 0.2) {
    const v = vTimelike(r, L, M);
    const X = ix + ((r - 3) / 27) * iw;
    const Y = iy + ih - ((v - vmin) / (vmax - vmin)) * ih;
    if (first) { pctx.moveTo(X, Y); first = false; } else pctx.lineTo(X, Y);
  }
  pctx.stroke();
}

function refreshReadout() {
  const g = geods[geods.length - 1];
  rEls['b / M'].textContent = ui.b.toFixed(2);
  rEls['b / b_crit'].textContent = (ui.b / bCrit(M)).toFixed(3);
  rEls.outcome.textContent = g ? g.kind + ': ' + g.outcome : '--';
  rEls['periapsis/M'].textContent = g ? g.periapsis.toFixed(2) : '--';
  rEls['r_photon/M'].textContent = photonSphere(M).toFixed(2);
  rEls['r_ISCO/M'].textContent = iscoSchwarzschild(M).toFixed(2);
}

function render() {
  if (engine) {
    const eye = camera.eyePosition();
    engine.render(eye, [0, 0, 0], [0, 1, 0], 62, 6, 18, ui.spin, ui.t);
  }
  for (const g of geods) g.anim = Math.min(g.xs.length, g.anim + (ui.running ? 9 : 0));
  drawPlot(); refreshReadout();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (ui.running) ui.t += dt;
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    camera.setAzimuthDeg(30 + CAPTURE_FRAC * 50);
    ui.t = CAPTURE_FRAC * 8;
    ui.b = 4.6 + CAPTURE_FRAC * 2.4;                // sweep across b_crit
    geods.length = 0; const g = fire('null', ui.b); g.anim = g.xs.length;
    render();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  render();
}

window.__physicsCheck = async () => {
  const bc = bCrit(1);
  const cap = integrateGeodesic({ type: 'null', M: 1, r0: 80, b: bc * 0.99, dphi: 0.003, maxPhi: 90 }).outcome;
  const esc = integrateGeodesic({ type: 'null', M: 1, r0: 80, b: bc * 1.01, dphi: 0.003, maxPhi: 90 }).outcome;
  return {
    name: 'photon capture threshold at b = 3 sqrt3 M',
    pass: cap === 'capture' && esc === 'escape',
    msg: `inside: ${cap}, outside: ${esc}, b_crit=${bc.toFixed(4)}`,
  };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'GPU is the lensing shader; geodesics validated by __physicsCheck and invariants' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
