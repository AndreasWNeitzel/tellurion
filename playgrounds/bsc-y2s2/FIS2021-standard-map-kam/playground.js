// playground.js
// Chirikov standard map. Left: the kicked rotor itself, a rod that
// free-rotates and gets a periodic impulse K sin(theta); its
// stroboscopic state (theta, p) is exactly one iterate of the
// standard map. Right: the phase portrait, each colour one orbit,
// with the live rotor's own orbit drawn in gold so you see the
// physical rotor and the map are the same thing. Past K_crit ~
// 0.9716 the golden KAM torus breaks and the rotor diffuses in p.
// sim.js is the gate-tested map. Reference: Chirikov 1979; Lichtenberg
// and Lieberman, Regular and Chaotic Dynamics, Ch. 4.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { iterateOrbit, phasePortrait, maxLyapunov, K_CRITICAL } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const urlParams = new URLSearchParams(location.search);
const SEED = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = urlParams.get('deterministic') === '1';
const CAPTURE_NAME = urlParams.get('capture');
const CAPTURE_FRAC = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderK = document.getElementById('slider-K');
const sliderN = document.getElementById('slider-n');
const valueK = document.getElementById('value-K');
const valueN = document.getElementById('value-n');
const btnReset = document.getElementById('btn-reset');
const btnKcrit = document.getElementById('btn-kcrit');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const TWO_PI = 2 * Math.PI;

// left rotor panel, right phase portrait
const RP = { x: 8, y: 8, w: 232, h: H - 16 };
const PP = { x: 256, y: 8, w: W - 264, h: H - 16 };

const state = {
  K: 0.971, nPerOrbit: 1200, baseOrbits: null,
  tr: { theta: 0.6, p: 0.9, tail: [] }, // the live rotor / tracer
  running: !DETERMINISTIC, dirty: true, kicks: 0,
};
let subPhase = 0;            // 0..1 within the current kick period

const ORBIT_COLORS = ['#69a8d6', '#d68a69', '#7ec27e', '#d6c869', '#b07cd1', '#d169a8', '#6dccc2', '#d96660', '#a2a89d', '#bcd169'];

function toPx(theta, p) {
  return { px: PP.x + PP.w * (theta / TWO_PI), py: PP.y + PP.h * (1 - p / TWO_PI) };
}

function rebuild() {
  state.baseOrbits = phasePortrait({ K: state.K, nOrbits: 24, nPerOrbit: state.nPerOrbit, seed: SEED });
  state.dirty = false;
}
function resetTracer() { state.tr = { theta: 0.6, p: 0.9, tail: [] }; state.kicks = 0; subPhase = 0; }

// one standard-map kick: p += K sin(theta); theta += p  (mod 2 pi)
function kick() {
  const tr = state.tr;
  tr.p = ((tr.p + state.K * Math.sin(tr.theta)) % TWO_PI + TWO_PI) % TWO_PI;
  tr.theta = ((tr.theta + tr.p) % TWO_PI + TWO_PI) % TWO_PI;
  tr.tail.push({ theta: tr.theta, p: tr.p });
  if (tr.tail.length > 1400) tr.tail.shift();
  state.kicks += 1;
}

function drawPortrait() {
  ctx.fillStyle = '#070a10'; ctx.fillRect(PP.x - 2, PP.y - 2, PP.w + 4, PP.h + 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5;
  for (let i = 1; i < 4; i += 1) {
    const x = PP.x + PP.w * i / 4, y = PP.y + PP.h * i / 4;
    ctx.beginPath(); ctx.moveTo(x, PP.y); ctx.lineTo(x, PP.y + PP.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PP.x, y); ctx.lineTo(PP.x + PP.w, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(PP.x, PP.y, PP.w, PP.h);
  if (state.baseOrbits) {
    for (let o = 0; o < state.baseOrbits.length; o += 1) {
      const { thetas, ps } = state.baseOrbits[o];
      ctx.fillStyle = ORBIT_COLORS[o % ORBIT_COLORS.length]; ctx.globalAlpha = 0.55;
      for (let i = 0; i < thetas.length; i += 1) { const q = toPx(thetas[i], ps[i]); ctx.fillRect(q.px - 0.5, q.py - 0.5, 1.1, 1.1); }
    }
    ctx.globalAlpha = 1;
  }
  // the live rotor's own orbit, gold
  const tail = state.tr.tail;
  ctx.fillStyle = '#f1d28a';
  for (let i = 0; i < tail.length; i += 1) { const q = toPx(tail[i].theta, tail[i].p); ctx.globalAlpha = 0.25 + 0.6 * (i / tail.length); ctx.fillRect(q.px - 0.6, q.py - 0.6, 1.7, 1.7); }
  ctx.globalAlpha = 1;
  const cur = toPx(state.tr.theta, state.tr.p);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cur.px, cur.py, 3.4, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = 'rgba(241,210,138,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('phase portrait  (theta -> , p ^);  gold = this rotor', PP.x + 6, PP.y + PP.h - 8);
}

function drawRotor() {
  ctx.fillStyle = '#05060c'; ctx.fillRect(RP.x - 2, RP.y - 2, RP.w + 4, RP.h + 4);
  const cx = RP.x + RP.w / 2, cy = RP.y + 150, R = 78;
  ctx.strokeStyle = 'rgba(150,160,185,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TWO_PI); ctx.stroke();
  // the rod free-rotates by p across the period, kicked at the end
  const ang = state.tr.theta + state.tr.p * subPhase;
  const ex = cx + R * Math.cos(ang), ey = cy - R * Math.sin(ang);
  ctx.strokeStyle = '#f1d28a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#cdd3e2'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, TWO_PI); ctx.fill();
  // the impending kick impulse K sin(theta), shown as a tangential arrow
  const kk = state.K * Math.sin(state.tr.theta);
  const flash = subPhase > 0.92 ? 1 : 0.35;
  ctx.strokeStyle = `rgba(239,114,114,${flash})`; ctx.lineWidth = 2.5;
  const tx = -Math.sin(ang), ty = -Math.cos(ang);
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + tx * kk * 40, ey + ty * kk * 40); ctx.stroke();
  ctx.fillStyle = '#9fb0cc'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('kicked rotor', cx, cy - R - 18);
  ctx.fillText('free spin, then a', cx, cy + R + 26);
  ctx.fillText('kick of K sin(theta)', cx, cy + R + 41);
  // p gauge
  const gy = cy + R + 64, gw = RP.w - 30;
  ctx.strokeStyle = 'rgba(150,160,185,0.4)'; ctx.strokeRect(RP.x + 15, gy, gw, 10);
  ctx.fillStyle = '#6dccc2'; ctx.fillRect(RP.x + 15, gy, gw * (state.tr.p / TWO_PI), 10);
  ctx.fillStyle = '#9fb0cc'; ctx.textAlign = 'left';
  ctx.fillText(`p (spin) = ${state.tr.p.toFixed(3)}`, RP.x + 15, gy + 26);
  ctx.fillText(`theta = ${state.tr.theta.toFixed(3)}`, RP.x + 15, gy + 41);
  ctx.fillText(`kick # ${state.kicks}`, RP.x + 15, gy + 56);
  // readout
  const lyap = maxLyapunov({ K: state.K, theta0: 0.5, p0: 0.3, nIter: 4000 });
  ctx.fillStyle = lyap > 0.1 ? '#f87272' : '#34d399';
  ctx.fillText(`K = ${state.K.toFixed(3)}   K_crit = ${K_CRITICAL.toFixed(3)}`, RP.x + 15, gy + 80);
  ctx.fillText(`lambda_1 = ${lyap.toFixed(3)}  ${lyap > 0.1 ? '(chaotic)' : '(regular)'}`, RP.x + 15, gy + 95);
}

function draw() { drawRotor(); drawPortrait(); }

function frame() {
  if (state.dirty) rebuild();
  if (state.running && !CAPTURE_NAME) {
    subPhase += 0.04;
    if (subPhase >= 1) { subPhase = 0; kick(); }
  }
  draw();
  requestAnimationFrame(frame);
}

// controls: every input applies at once; rebuild is coalesced to one
// per frame via state.dirty (no heavy per-event recompute, no
// auto-sweep clobbering the buttons).
sliderK.addEventListener('input', () => { state.K = parseFloat(sliderK.value); valueK.textContent = state.K.toFixed(3); state.dirty = true; });
sliderN.addEventListener('input', () => { valueN.textContent = sliderN.value; });
sliderN.addEventListener('change', () => { state.nPerOrbit = parseInt(sliderN.value, 10); state.dirty = true; });
btnReset.addEventListener('click', () => { resetTracer(); state.dirty = true; });
btnKcrit.addEventListener('click', () => { state.K = K_CRITICAL; sliderK.value = K_CRITICAL.toFixed(3); valueK.textContent = K_CRITICAL.toFixed(3); state.dirty = true; });
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    state.running = !state.running;
    btnPlayPause.textContent = state.running ? 'Pause' : 'Play';
    btnPlayPause.setAttribute('aria-pressed', String(!state.running));
  });
}
canvas.addEventListener('click', (ev) => {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (W / r.width), y = (ev.clientY - r.top) * (H / r.height);
  if (x < PP.x || x > PP.x + PP.w) return;
  state.tr = { theta: TWO_PI * (x - PP.x) / PP.w, p: TWO_PI * (1 - (y - PP.y) / PP.h), tail: [] };
  state.kicks = 0; subPhase = 0;
});

function bootSync() {
  valueK.textContent = state.K.toFixed(3); valueN.textContent = String(state.nPerOrbit);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const KS = [0.0, 0.4, K_CRITICAL, 1.6, 2.5];
    state.K = KS[Math.min(KS.length - 1, Math.max(0, Math.round(frac * (KS.length - 1))))];
    sliderK.value = state.K.toFixed(3); valueK.textContent = state.K.toFixed(3);
    rebuild();
    for (let i = 0; i < Math.round(40 + frac * 240); i += 1) kick();   // a settled tracer orbit
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED, K: state.K } }));
      }));
    }
    return;
  }
  rebuild(); draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(frame); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(frame);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'K', label: 'Kick strength K', value: state.K, format: 'float' },
      { key: 'n_orbits', label: 'Orbit count', value: state.norbits, format: 'float' },
      { key: 'K_crit', label: 'Critical K (KAM)', value: K_CRITICAL, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const regime = state.K < 0.4 ? 'integrable' : (state.K < K_CRITICAL ? 'chaotic-island' : 'diffusive');
  return [{
    key: 'standard-map-regime',
    label: `Phase space regime (K vs Kc=0.9716): ${regime}`,
    value: regime,
    status: 'pass'
  }];
};
