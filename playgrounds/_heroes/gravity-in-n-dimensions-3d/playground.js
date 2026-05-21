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

function w2s(x, y) {
  const scale = Math.min(W, H) * 0.5 / 2.6;
  return { x: W / 2 + x * scale, y: H / 2 - y * scale };
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
