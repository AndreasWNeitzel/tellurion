// Penrose tiling playground. Builds the tiling via Conway-Penrose
// deflation, draws Robinson triangles colored by type (A = cyan,
// B = orange), rotates slowly for visual interest.

import { buildTiling, countByType, totalArea, PHI } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rN = document.getElementById('readout-n');
const rTotal = document.getElementById('readout-N');
const rA = document.getElementById('readout-A');
const rB = document.getElementById('readout-B');
const rRatio = document.getElementById('readout-ratio');

const sSteps = document.getElementById('slider-steps'), vSteps = document.getElementById('value-steps');
const selEdges = document.getElementById('select-edges'), vEdges = document.getElementById('value-edges');
const sRot = document.getElementById('slider-rot'), vRot = document.getElementById('value-rot');
const sZoom = document.getElementById('slider-zoom'), vZoom = document.getElementById('value-zoom');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  steps: 4,
  edges: true,
  rotation: 0,
  zoom: 1.0,
  running: !prefersReducedMotion(),
  spinPhase: 0,
  triangles: [],
  counts: { A: 0, B: 0, total: 0, ratio: 0 },
  cacheKey: '',
};

function updateTiling() {
  const key = `${st.steps}`;
  if (key === st.cacheKey) return;
  st.cacheKey = key;
  st.triangles = buildTiling(st.steps);
  st.counts = countByType(st.triangles);
}

function w2s(p, center, scale) {
  // Apply rotation + zoom for visual.
  const phi = (st.rotation * Math.PI / 180) + st.spinPhase;
  const c = Math.cos(phi), s = Math.sin(phi);
  const x = c * p.x - s * p.y;
  const y = s * p.x + c * p.y;
  return { x: center.x + x * scale * st.zoom, y: center.y - y * scale * st.zoom };
}

function drawTiling() {
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);

  const center = { x: W / 2, y: H / 2 };
  const scale = 0.45 * Math.min(W, H);

  // Pair adjacent triangles into rhombi for cleaner edges?
  // For simplicity, draw triangles individually.
  for (const t of st.triangles) {
    const p0 = w2s(t.p0, center, scale);
    const p1 = w2s(t.p1, center, scale);
    const p2 = w2s(t.p2, center, scale);
    // Fill color by type.
    let fill;
    if (t.type === 'A') fill = 'rgba(120, 200, 240, 0.85)';
    else fill = 'rgba(240, 160, 100, 0.85)';
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.fill();
    if (st.edges) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  // Optional radial faint outline (the unit circle of the Sun seed).
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(center.x, center.y, scale * st.zoom, 0, Math.PI * 2); ctx.stroke();

  // Legend
  ctx.fillStyle = 'rgba(120, 200, 240, 0.92)';
  ctx.fillRect(14, 14, 14, 14);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('A (thick, 72/108)', 34, 26);
  ctx.fillStyle = 'rgba(240, 160, 100, 0.92)';
  ctx.fillRect(14, 36, 14, 14);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.fillText('B (thin, 36/144)', 34, 48);

  // Count + ratio
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`tiles: ${st.counts.total}`, 14, H - 36);
  ctx.fillText(`A / B: ${st.counts.ratio.toFixed(4)} (phi = ${PHI.toFixed(4)})`, 14, H - 18);
}

function updateReadout() {
  rN.textContent = String(st.steps);
  rTotal.textContent = String(st.counts.total);
  rA.textContent = String(st.counts.A);
  rB.textContent = String(st.counts.B);
  rRatio.textContent = st.counts.ratio.toFixed(4);
}

function readSliders() {
  st.steps = parseInt(sSteps.value, 10);
  st.edges = selEdges.value === 'on';
  st.rotation = parseFloat(sRot.value);
  st.zoom = parseFloat(sZoom.value);
  vSteps.textContent = String(st.steps);
  vEdges.textContent = st.edges ? 'on' : 'off';
  vRot.textContent = st.rotation.toFixed(0) + ' deg';
  vZoom.textContent = st.zoom.toFixed(2);
}

[sSteps, selEdges, sRot, sZoom].forEach(el => el.addEventListener('input', readSliders));
selEdges.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.spinPhase = 0; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  steps: { get: () => st.steps, set: v => { st.steps = parseInt(v, 10); sSteps.value = v; }, parse: parseInt },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

function draw() {
  updateTiling();
  drawTiling();
  updateReadout();
}

if (CAPTURE_NAME) {
  st.spinPhase = (CAPTURE_FRAC || 0) * 0.4;
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) st.spinPhase += dt * 0.08;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}
