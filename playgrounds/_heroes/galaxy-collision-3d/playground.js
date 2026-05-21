// Two-galaxy flyby playground. Uses the shared Barnes-Hut quadtree
// (shared/js/engine/quadtree-2d.js) via sim.js. Canvas2D star
// rendering with a fading trail behind each particle for visual flow.
// Reference: Toomre and Toomre 1972; Barnes and Hut 1986.

import { makeTwoGalaxies, leapfrog } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rN = document.getElementById('readout-n');
const rStep = document.getElementById('readout-step');
const rD = document.getElementById('readout-d');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sSep = document.getElementById('slider-sep'), vSep = document.getElementById('value-sep');
const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const sTheta = document.getElementById('slider-theta'), vTheta = document.getElementById('value-theta');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  N_disk: 1200, sep: 4.0, V: 0.7, theta: 0.7,
  running: !prefersReducedMotion(), state: null,
  VIEW: 5.0,
};

function reseed() {
  st.state = makeTwoGalaxies({
    seed: 0xC0FFEE, N_disk: st.N_disk, M_core: 80,
    R_scale: 0.4, R_max: 1.0, d: st.sep, V: st.V,
  });
}

function w2s(wx, wy) {
  const scale = Math.min(W, H) * 0.5 / st.VIEW;
  return { x: W * 0.5 + wx * scale, y: H * 0.5 - wy * scale };
}

function render() {
  // Light persistent fade so the disk's trail reads on the still
  // frame without smearing the whole canvas.
  ctx.fillStyle = 'rgba(6, 8, 12, 0.18)';
  ctx.fillRect(0, 0, W, H);

  const s = st.state;
  const N_each = st.N_disk + 1;
  // Galaxy 0 in cool blue (cores brighter), galaxy 1 in warm orange.
  for (let g = 0; g < 2; g += 1) {
    const offset = g * N_each;
    // Core first.
    const cp = w2s(s.x[2 * offset], s.x[2 * offset + 1]);
    const corona = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, 22);
    corona.addColorStop(0, g === 0 ? 'rgba(180, 220, 255, 0.55)' : 'rgba(255, 200, 130, 0.55)');
    corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath(); ctx.arc(cp.x, cp.y, 22, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = g === 0 ? '#9bd0ff' : '#ffc77c';
    ctx.beginPath(); ctx.arc(cp.x, cp.y, 4, 0, 2 * Math.PI); ctx.fill();
    // Disk stars.
    const baseR = g === 0 ? 150 : 255;
    const baseG = g === 0 ? 200 : 180;
    const baseB = g === 0 ? 255 : 130;
    for (let k = 1; k < N_each; k += 1) {
      const i = offset + k;
      const p = w2s(s.x[2 * i], s.x[2 * i + 1]);
      if (p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;
      ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, 0.75)`;
      ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
    }
  }

  // Top-left HUD.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`N = ${s.N.toLocaleString()}    step = ${s.nSteps}    tree evals/step ≈ ${s.evals.toLocaleString()}`, 24, 22);
  // Core separation.
  const c0x = s.x[0], c0y = s.x[1];
  const c1x = s.x[2 * (st.N_disk + 1)], c1y = s.x[2 * (st.N_disk + 1) + 1];
  const sep = Math.sqrt((c1x - c0x) ** 2 + (c1y - c0y) ** 2);
  ctx.fillText(`core separation = ${sep.toFixed(2)}`, 24, 40);

  rN.textContent = String(s.N);
  rStep.textContent = String(s.nSteps);
  rD.textContent = sep.toFixed(2);

  // Rule-13 diagnostic: core-core separation vs simulation step. The
  // dips mark pericentre passages; the long-term decay shows the
  // dynamical-friction-driven inspiral toward merger.
  if (sepHistory.length === 0 || s.nSteps - sepHistory[sepHistory.length - 1].n >= 4) {
    sepHistory.push({ n: s.nSteps, sep });
    if (sepHistory.length > 360) sepHistory.shift();
  }
  drawSepDiagnostic();
}

const sepHistory = [];
function drawSepDiagnostic() {
  const pw = 240, ph = 130, px = W - pw - 14, py = H - ph - 14;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('core separation vs step', px + 8, py + 14);
  if (sepHistory.length < 2) return;
  const ax = px + 30, ay = py + 22, aw = pw - 42, ah = ph - 40;
  let sMax = 1;
  for (const p of sepHistory) if (p.sep > sMax) sMax = p.sep;
  const n0 = sepHistory[0].n, n1 = sepHistory[sepHistory.length - 1].n;
  const xOf = (n) => ax + (n1 > n0 ? (n - n0) / (n1 - n0) : 0) * aw;
  const yOf = (v) => ay + ah - (v / (sMax * 1.05)) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.moveTo(ax, yOf(0)); ctx.lineTo(ax + aw, yOf(0)); ctx.stroke();
  ctx.strokeStyle = '#9bd0ff'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < sepHistory.length; i += 1) {
    const p = sepHistory[i];
    const x = xOf(p.n), y = yOf(p.sep);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(sMax.toFixed(1), px + 4, ay + 8);
  ctx.fillText('step', ax + aw / 2 - 12, py + ph - 4);
}

function tick() {
  if (st.running) {
    const SUBS = 2;
    for (let k = 0; k < SUBS; k += 1) {
      leapfrog(st.state, 0.003, { use_tree: true, theta: st.theta, G: 1, eps: 0.08 });
    }
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vN.textContent = String(st.N_disk);
  vSep.textContent = st.sep.toFixed(1);
  vV.textContent = st.V.toFixed(2);
  vTheta.textContent = st.theta.toFixed(2);
}

sN.addEventListener('change', () => { st.N_disk = parseInt(sN.value, 10); syncLabels(); reseed(); });
sN.addEventListener('input', () => { st.N_disk = parseInt(sN.value, 10); syncLabels(); });
sSep.addEventListener('change', () => { st.sep = parseFloat(sSep.value); syncLabels(); reseed(); });
sSep.addEventListener('input', () => { st.sep = parseFloat(sSep.value); syncLabels(); });
sV.addEventListener('change', () => { st.V = parseFloat(sV.value); syncLabels(); reseed(); });
sV.addEventListener('input', () => { st.V = parseFloat(sV.value); syncLabels(); });
sTheta.addEventListener('input', () => { st.theta = parseFloat(sTheta.value); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.N_disk = 1200; st.sep = 4.0; st.V = 0.7; st.theta = 0.7; st.running = true;
  sN.value = '1200'; sSep.value = '4.0'; sV.value = '0.7'; sTheta.value = '0.7';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  syncLabels(); reseed();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { seed: 0xC0FFEE, n_disk: st.N_disk, separation: st.sep, velocity: st.V }; }
function restoreState() {
  const p = parseUrlState();
  if (!p) return;
  if (p.n_disk) { st.N_disk = parseInt(p.n_disk, 10); sN.value = String(st.N_disk); }
  if (p.separation) { st.sep = parseFloat(p.separation); sSep.value = String(st.sep); }
  if (p.velocity) { st.V = parseFloat(p.velocity); sV.value = String(st.V); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  reseed();
  if (CAPTURE_NAME) {
    // Reduce N for capture so the goldens render in the gate's 30s
    // window. The live-page experience uses the full default of 1200
    // stars per galaxy.
    st.N_disk = 300;
    sN.value = '300';
    syncLabels();
    reseed();
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const steps = Math.round(40 + f * 500);
    for (let n = 0; n < steps; n += 1) leapfrog(st.state, 0.003, { use_tree: true, theta: st.theta, G: 1, eps: 0.08 });
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
