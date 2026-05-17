// 2D wave equation in a drawable geometry. The primary scene is the
// physical displacement field (a water-like diverging map) with rigid
// walls and slits; presets show a free circular wavefront, single-slit
// diffraction, double-slit interference, and an obstacle shadow. The
// side panel is the screen intensity along a far column. Numerics are
// the shared leapfrog engine with rigid barriers and an absorbing
// sponge. Reference: Crawford, Waves (Berkeley Physics Vol. 3), Ch. 7;
// Hecht, Optics (5th ed.), Ch. 10.

import { buildScene, stepScene, cflDt, PRESETS, energy } from './sim.js';
import { fieldToImageData, rdbu } from '../../../shared/js/render/colormaps.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const N = 220;
const C = 1;
const DT = cflDt(C);
const HORIZON = 900;                 // steps to the terminal capture frame
const USCALE = 0.32;                 // fixed amplitude scale (so damping is visible)
const READOUTS = ['preset', 'lambda', 'damping', 'sim t', 'energy', 'steps'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { preset: 'double-slit', lambda: 18, gamma: 0.0, nstep: 0, running: 1 };
let scene = buildScene(N, st.preset, { lambda: st.lambda, c: C });
let phase = 0, simT = 0;
let imgData = new ImageData(N, N);
const disp = new Float32Array(N * N);
const off = document.createElement('canvas'); off.width = N; off.height = N;
const offCtx = off.getContext('2d');

// Rebuild deterministically and run to a step count so a control
// change is reflected at once and the field is consistent.
function rebuild(toStep = st.nstep) {
  scene = buildScene(N, st.preset, { lambda: st.lambda, c: C });
  phase = 0; simT = 0;
  for (let k = 0; k < toStep; k += 1) { scene.drive(phase, 0.7); phase += scene.omega * DT; stepScene(scene, C, st.gamma, DT); simT += DT; }
  st.nstep = toStep;
}

// geometry
const FX = 16, FY = 16, FPX = 560, CELL = FPX / N;
const PX = 596, PW = 256, PY = 214, PH = 326;

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const u = scene.state.u, bar = scene.barrier;

  // wave field, diverging water map. tanh compression lifts the faint
  // diffracted/transmitted field without clipping the strong near
  // field, so the pattern past the wall is visible.
  for (let i = 0; i < N * N; i += 1) disp[i] = Math.tanh(u[i] / USCALE);
  imgData = fieldToImageData(disp, N, N, -1, 1, rdbu, imgData);
  const px = imgData.data;
  for (let i = 0; i < N * N; i += 1) if (bar[i]) { const j = i * 4; px[j] = 14; px[j + 1] = 16; px[j + 2] = 22; }
  offCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, FX, FY, FPX, FPX);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(FX, FY, FPX, FPX);

  // source marker and screen-column indicator
  const sX = FX + scene.srcX * CELL, sY = FY + scene.cyMid * CELL;
  ctx.strokeStyle = 'rgba(255,235,150,0.9)'; ctx.beginPath(); ctx.arc(sX, sY, 5, 0, 6.2832); ctx.stroke();
  const xScreen = Math.round(N * 0.86);
  ctx.strokeStyle = 'rgba(180,230,255,0.35)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(FX + xScreen * CELL, FY); ctx.lineTo(FX + xScreen * CELL, FY + FPX); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('wave displacement field (rigid walls dark, source ring, dashed screen)', FX + FPX / 2, FY + FPX + 18);
  ctx.textAlign = 'left';

  // side panel: screen intensity |u| along the dashed column
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PY, PW, PH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('screen intensity  |u|(y)', PX + PW / 2, PY - 6);
  let aMax = 1e-6; for (let y = 0; y < N; y += 1) aMax = Math.max(aMax, Math.abs(u[y * N + xScreen]));
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let y = 0; y < N; y += 1) {
    const v = Math.abs(u[y * N + xScreen]) / aMax;
    const X = PX + 6 + v * (PW - 12), Y = PY + (y / (N - 1)) * PH;
    y === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('|u|', PX + PW / 2, PY + PH + 14);
  ctx.save(); ctx.translate(PX - 7, PY + PH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('screen y', 0, 0); ctx.restore();
  ctx.textAlign = 'left';

  rEls['preset'].textContent = st.preset;
  rEls['lambda'].textContent = st.lambda.toFixed(0);
  rEls['damping'].textContent = st.gamma.toFixed(3);
  rEls['sim t'].textContent = simT.toFixed(1);
  rEls['energy'].textContent = energy(scene, C).toExponential(2);
  rEls['steps'].textContent = String(st.nstep);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const selRow = document.createElement('div'); selRow.className = 'row';
const selLab = document.createElement('span'); selLab.className = 'label'; selLab.textContent = 'preset';
const sel = document.createElement('select'); sel.setAttribute('aria-label', 'preset');
for (const [v, t] of [['free', 'free point source'], ['single-slit', 'single slit'], ['double-slit', 'double slit'], ['obstacle', 'obstacle']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
sel.value = st.preset;
sel.addEventListener('change', () => { st.preset = sel.value; rebuild(); render(); });
selRow.appendChild(selLab); selRow.appendChild(sel); const ssp = document.createElement('span'); ssp.className = 'value'; selRow.appendChild(ssp);
controlsEl.appendChild(selRow);
const cL = buildSlider('wavelength (cells)', 10, 36, 1, st.lambda, 'lambda', v => v.toFixed(0));
const cG = buildSlider('damping gamma', 0, 0.08, 0.002, st.gamma, 'gamma', v => v.toFixed(3));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { preset: 'double-slit', lambda: 18, gamma: 0.0, nstep: 0, running: 1 });
  sel.value = 'double-slit'; cL.inp.value = '18'; cL.val.textContent = '18'; cG.inp.value = '0'; cG.val.textContent = '0.000';
  rebuild(0); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

// loop and capture
let acc = 0, lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) {
    acc += dr;
    while (acc > 1 / 60 && st.nstep < HORIZON) { scene.drive(phase, 0.7); phase += scene.omega * DT; stepScene(scene, C, st.gamma, DT); simT += DT; st.nstep += 1; acc -= 1 / 60; }
    if (st.nstep >= HORIZON) acc = 0;
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  rebuild(CAPTURE_NAME ? Math.round(CAPTURE_FRAC * HORIZON) : 0);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const s = buildScene(160, 'double-slit', { c: C, lambda: 18 });
  let p = 0; for (let n = 0; n < 600; n += 1) { s.drive(p); p += s.omega * DT; stepScene(s, C, 0, DT); }
  const u = s.state.u, cy = s.cyMid, xs = Math.round(160 * 0.86);
  let amax = 0, ymax = 0; for (let y = 1; y < 159; y += 1) { const a = Math.abs(u[y * 160 + xs]); if (a > amax) { amax = a; ymax = y; } }
  if (Math.abs(ymax - cy) > 10) return { name: 'double-slit central max', pass: false, msg: `peak at ${ymax} vs ${cy}` };
  return { name: 'double-slit central maximum on axis', pass: true, msg: `peak |dy|=${Math.abs(ymax - cy)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
