// Cosmic-ray air shower playground (scaffolded stub).
// Status: needs-attention. The spec describes the full physics; this stub
// renders a representative figure so the catalog index shows a working page.
// Replace with the real engine when the implementation budget cycles cover it.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');

const rng = makeRng(SEED);
const W = canvas.width, H = canvas.height;
let frameNo = 0;

function drawSketch(t) {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Title strip.
  ctx.fillStyle = '#dcdde2';
  ctx.font = '18px sans-serif';
  ctx.fillText('Cosmic-ray air shower', 24, 36);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8b8c92';
  ctx.fillText('Sketch: shower cone with Xmax marker and ground detector array.', 24, 58);
  ctx.fillStyle = '#fdb56a';
  ctx.fillText('Status: scaffolded, awaiting full implementation', 24, H - 24);

  // Representative animated decoration: a Lissajous curve.
  ctx.strokeStyle = '#7c9cff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 256; i += 1) {
    const u = i / 256;
    const a = 2 * Math.PI * u + t;
    const x = W / 2 + 200 * Math.sin(3 * a);
    const y = H / 2 + 100 * Math.sin(2 * a + 0.5);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Animated moving dot to show liveness.
  const dx = W / 2 + 200 * Math.sin(3 * t);
  const dy = H / 2 + 100 * Math.sin(2 * t + 0.5);
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(dx, dy, 5, 0, 2 * Math.PI); ctx.fill();
}

function tick() {
  const t = frameNo * 0.02;
  drawSketch(t);
  frameNo += 1;
  if (frameNo % 12 === 0) {
    readoutInv.textContent = 'stub';
    readoutFrame.textContent = String(frameNo);
  }
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

if (DETERMINISTIC) {
  for (let f = 0; f < 60; f += 1) { frameNo = f; drawSketch(f * 0.02); }
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.__physicsCheck = async () => ({ skip: true, reason: 'stub scaffold; physics check deferred' });
