// Gravity in n dimensions playground. Velocity-Verlet on a generalized
// central force, Canvas2D orbit trail in the orbital plane. Reference:
// Tangherlini, Nuovo Cim. 27 (1963) 636.

import { step, angularMomentum, energy, eccentricIC } from './sim.js';
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

const rD = document.getElementById('readout-d');
const rL = document.getElementById('readout-L');
const rE = document.getElementById('readout-E');
const rR = document.getElementById('readout-r');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sR0 = document.getElementById('slider-r0'), vR0 = document.getElementById('value-r0');
const sEcc = document.getElementById('slider-ecc'), vEcc = document.getElementById('value-ecc');
const sTrail = document.getElementById('slider-trail'), vTrail = document.getElementById('value-trail');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  d: 3, r0: 1.0, ecc: 1.05, trail: 1500, running: !prefersReducedMotion(),
  state: null, trailBuf: null, trailIdx: 0, trailLen: 0,
  L0: 0, E0: 0,
};

function reseed() {
  st.state = eccentricIC(st.r0, st.d, st.ecc);
  st.L0 = angularMomentum(st.state);
  st.E0 = energy(st.state);
  st.trailBuf = new Float64Array(st.trail * 2);
  st.trailIdx = 0;
  st.trailLen = 0;
}

// Orbit sits in the upper part of the canvas so the lower third can carry the
// r(t) diagnostic.
function w2s(x, y) {
  const scale = Math.min(W, H) * 0.5 / 2.9;
  return { x: W / 2 + x * scale, y: Math.round(H * 0.32) - y * scale };
}

function dimensionColor(d) {
  // d = 3 stable golden; d = 2 cool blue (precessing); d = 4 marginal
  // teal; d >= 5 hot red (decaying).
  if (Math.abs(d - 3) < 0.05) return 'rgba(255, 209, 102,';
  if (d < 3) return 'rgba(120, 200, 255,';
  if (d < 4.2) return 'rgba(110, 230, 200,';
  return 'rgba(255, 110, 110,';
}

function render() {
  // Persistent fade to keep some trail visible while drawing new segments.
  ctx.fillStyle = 'rgba(6, 6, 8, 0.10)';
  ctx.fillRect(0, 0, W, H);

  // Draw the trail buffer.
  const colStem = dimensionColor(st.d);
  if (st.trailLen > 1) {
    const len = st.trailLen;
    for (let k = 0; k < len - 1; k += 1) {
      const i0 = (st.trailIdx - len + k + st.trail) % st.trail;
      const i1 = (st.trailIdx - len + k + 1 + st.trail) % st.trail;
      const p0 = w2s(st.trailBuf[i0 * 2], st.trailBuf[i0 * 2 + 1]);
      const p1 = w2s(st.trailBuf[i1 * 2], st.trailBuf[i1 * 2 + 1]);
      const a = 0.08 + 0.55 * (k / len);
      ctx.strokeStyle = colStem + a.toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }

  // Central mass.
  const center = w2s(0, 0);
  const g = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 40);
  g.addColorStop(0, 'rgba(255, 220, 140, 0.5)');
  g.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(center.x, center.y, 40, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(center.x, center.y, 7, 0, 2 * Math.PI); ctx.fill();

  // Particle.
  const p = w2s(st.state.x, st.state.y);
  ctx.fillStyle = colStem + '0.95)';
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI); ctx.fill();

  // Stability tag in the corner.
  let stability;
  if (st.d < 2.6) stability = 'closed precessing (rosette)';
  else if (st.d < 3.4) stability = 'closed Kepler ellipse';
  else if (st.d < 4.4) stability = 'marginal: tilts to spiral';
  else stability = 'plunging spiral';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`d = ${st.d.toFixed(2)}    ${stability}`, 14, 22);
  ctx.fillStyle = colStem + '0.85)';
  ctx.fillRect(14, 28, 200, 2);

  // Readouts.
  const L = angularMomentum(st.state);
  const E = energy(st.state);
  const r = Math.sqrt(st.state.x * st.state.x + st.state.y * st.state.y);
  rD.textContent = st.d.toFixed(2);
  rL.textContent = L.toFixed(3);
  rE.textContent = E.toFixed(3);
  rR.textContent = (r / st.r0).toFixed(3);

  drawDiagnostic();
}

// Bottom diagnostic: the orbital radius r(t). A bound orbit (d = 3, or the
// precessing d < 3 rosette) oscillates between a fixed perihelion and
// aphelion; a high-d orbit spirals in and r(t) decays to zero, the visual
// proof that stable bound orbits exist only for the inverse-square (d = 3)
// force. Drawn over an opaque panel so the canvas-wide trail fade does not
// ghost it.
function drawDiagnostic() {
  const x0 = 50, x1 = W - 24, y0 = Math.round(H * 0.66), y1 = H - 40;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, y0 - 26, W, H - (y0 - 26));
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('orbital radius r(t):  bound orbits oscillate, high-d orbits spiral to zero', x0 + 4, y0 - 8);
  const len = st.trailLen;
  if (len < 2) return;
  let rmax = 1e-6;
  for (let k = 0; k < len; k += 1) { const i = (st.trailIdx - len + k + st.trail) % st.trail; const rr = Math.hypot(st.trailBuf[i * 2], st.trailBuf[i * 2 + 1]); if (rr > rmax) rmax = rr; }
  rmax = Math.max(rmax, st.r0 * 1.2) * 1.08;
  const ax = x0 + 36, aw = x1 - x0 - 50, ay = y0 + 16, ah = y1 - y0 - 34;
  const rY = (rr) => ay + ah - (ah - 4) * (rr / rmax);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(ax, rY(st.r0)); ctx.lineTo(ax + aw, rY(st.r0)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'right'; ctx.fillText('r0', ax - 4, rY(st.r0) + 3); ctx.fillText('0', ax - 4, ay + ah + 3);
  const col = dimensionColor(st.d);
  ctx.strokeStyle = col + '0.9)'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let k = 0; k < len; k += 1) {
    const i = (st.trailIdx - len + k + st.trail) % st.trail;
    const rr = Math.hypot(st.trailBuf[i * 2], st.trailBuf[i * 2 + 1]);
    const px = ax + aw * k / (len - 1), py = rY(rr);
    if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'center'; ctx.fillText('time', (ax + ax + aw) / 2, y1 - 5);
}

function tick() {
  if (st.running) {
    const SUBS = 12;
    const DT = 0.005;
    for (let s = 0; s < SUBS; s += 1) {
      step(st.state, DT);
      // Stop if particle escapes too far or falls into the centre.
      const r = Math.sqrt(st.state.x * st.state.x + st.state.y * st.state.y);
      if (r > 10) { st.state.x *= 0.4; st.state.y *= 0.4; st.state.vx = 0; st.state.vy = 0; }
      if (r < 0.02) { reseed(); break; }
      // Push trail
      st.trailBuf[st.trailIdx * 2] = st.state.x;
      st.trailBuf[st.trailIdx * 2 + 1] = st.state.y;
      st.trailIdx = (st.trailIdx + 1) % st.trail;
      if (st.trailLen < st.trail) st.trailLen += 1;
    }
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vD.textContent = st.d.toFixed(2);
  vR0.textContent = st.r0.toFixed(2);
  vEcc.textContent = st.ecc.toFixed(2);
  vTrail.textContent = String(st.trail);
}

sD.addEventListener('input', () => { st.d = parseFloat(sD.value); syncLabels(); reseed(); });
sR0.addEventListener('input', () => { st.r0 = parseFloat(sR0.value); syncLabels(); reseed(); });
sEcc.addEventListener('input', () => { st.ecc = parseFloat(sEcc.value); syncLabels(); reseed(); });
sTrail.addEventListener('input', () => {
  st.trail = parseInt(sTrail.value, 10);
  st.trailBuf = new Float64Array(st.trail * 2); st.trailIdx = 0; st.trailLen = 0;
  syncLabels();
});
btnReset.addEventListener('click', () => {
  st.d = 3; st.r0 = 1.0; st.ecc = 1.05; st.trail = 1500; st.running = true;
  sD.value = '3'; sR0.value = '1.0'; sEcc.value = '1.05'; sTrail.value = '1500';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  syncLabels(); reseed();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { dimension: st.d, r0: st.r0, ecc: st.ecc }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.dimension) { st.d = parseFloat(s.dimension); sD.value = String(st.d); }
  if (s.r0) { st.r0 = parseFloat(s.r0); sR0.value = String(st.r0); }
  if (s.ecc) { st.ecc = parseFloat(s.ecc); sEcc.value = String(st.ecc); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep dimension across captures so the goldens show closed,
    // precessing, marginal, and plunging orbits in five frames.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.d = 2.0 + f * 3.5;          // 2 to 5.5
    sD.value = String(st.d);
    syncLabels();
    reseed();
    // Pre-run to populate the trail. 1800 steps at dt=0.005 = 9 t.u.,
    // about 1.4 Kepler periods for the d=3 case so the closed ellipse
    // shows fully; for d>4 this is well past the plunge timescale, so
    // the plunging spiral is also visible.
    for (let s = 0; s < 1800; s += 1) {
      step(st.state, 0.005);
      const r = Math.sqrt(st.state.x * st.state.x + st.state.y * st.state.y);
      if (r > 8) break;       // stop tracing once particle has escaped
      st.trailBuf[st.trailIdx * 2] = st.state.x;
      st.trailBuf[st.trailIdx * 2 + 1] = st.state.y;
      st.trailIdx = (st.trailIdx + 1) % st.trail;
      if (st.trailLen < st.trail) st.trailLen += 1;
    }
  } else {
    reseed();
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


// === Diagnostics interface (Layout System v2) ===
// A central force conserves energy and angular momentum in any
// spatial dimension (only the orbit's closure depends on d). The
// relative drift of each under the velocity-Verlet step is the
// invariant.
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!st.state) return { fields: [] };
  return {
    fields: [
      { key: 'dimension', label: 'force-law dimension d', value: st.d.toFixed(2), format: 'float' },
      { key: 'energy', label: 'total energy', value: energy(st.state).toFixed(3), format: 'float' },
      { key: 'angular-momentum', label: 'angular momentum', value: angularMomentum(st.state).toFixed(3), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  if (!st.state) return [];
  const dE = Math.abs(energy(st.state) - st.E0) / Math.max(1e-12, Math.abs(st.E0));
  const dL = Math.abs(angularMomentum(st.state) - st.L0) / Math.max(1e-12, Math.abs(st.L0));
  const mk = (key, label, d) => ({
    key, label, value: d.toExponential(2),
    status: d < 1e-3 ? 'pass' : (d < 1e-2 ? 'pending' : 'drift'),
  });
  return [
    mk('energy', 'total energy conserved (rel. drift)', dE),
    mk('angular-momentum', 'angular momentum conserved (rel. drift)', dL),
  ];
};
