// Bell-CHSH playground. Canvas2D scene: source in the middle,
// photon pairs streaming left and right toward Alice and Bob
// polarizers, with a CHSH bar chart and correlation curve.

import {
  correlation_QM, chshS, sampleCorrelation, correlation_LHV_envelope,
  CLASSICAL_BOUND, TSIRELSON_BOUND, OPTIMAL_ANGLES, makeRng, DEG,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rA = document.getElementById('readout-a');
const rB = document.getElementById('readout-b');
const rE = document.getElementById('readout-E');
const rS = document.getElementById('readout-S');
const rVerdict = document.getElementById('readout-verdict');

const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sAp = document.getElementById('slider-ap'), vAp = document.getElementById('value-ap');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const sBp = document.getElementById('slider-bp'), vBp = document.getElementById('value-bp');
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  a_deg: 0, ap_deg: 45, b_deg: 22, bp_deg: 67,
  running: !prefersReducedMotion(),
  t: 0,
  photons: [],
  outcomes: { N: 0, sumProduct: 0 },
  rng: makeRng(0xC0FFEE),
};

function asRad() {
  return {
    a: st.a_deg * DEG,
    ap: st.ap_deg * DEG,
    b: st.b_deg * DEG,
    bp: st.bp_deg * DEG,
  };
}

// Scene layout: top 60% = optical scene; bottom 40% = correlation curve + CHSH bars.
const SCENE = { x: 0, y: 0, w: W, h: 0.55 * H };
const CURVE = { x: 30, y: 0.58 * H + 12, w: 0.55 * W - 40, h: H - (0.58 * H + 12) - 30 };
const BARS = { x: 0.58 * W, y: 0.58 * H + 12, w: 0.40 * W - 20, h: H - (0.58 * H + 12) - 30 };

function drawScene() {
  const cy = SCENE.y + SCENE.h * 0.5;
  // Background
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    const ix = (i * 23.7) % SCENE.w;
    const iy = (i * 31.1) % SCENE.h;
    const sb = 0.10 + 0.30 * ((i * 7) % 17) / 17;
    ctx.fillStyle = `rgba(190, 200, 255, ${sb})`;
    ctx.fillRect(ix, iy, 1, 1);
  }
  // Source in the middle.
  const cx = W / 2;
  const sgrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 24);
  sgrad.addColorStop(0, 'rgba(255, 255, 200, 1)');
  sgrad.addColorStop(1, 'rgba(255, 100, 200, 0)');
  ctx.fillStyle = sgrad;
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('singlet source', cx - 40, cy + 38);

  // Detectors (Alice on left, Bob on right).
  drawDetector(120, cy, st.a_deg, 'Alice (a)', 'rgba(120, 220, 255, 0.95)');
  drawDetector(W - 120, cy, st.b_deg, 'Bob (b)', 'rgba(255, 180, 120, 0.95)');
  drawDetector(120, cy + 90, st.ap_deg, 'Alice (a)', 'rgba(120, 220, 255, 0.55)', true);
  drawDetector(W - 120, cy + 90, st.bp_deg, 'Bob (b)', 'rgba(255, 180, 120, 0.55)', true);

  // Photon trails.
  for (const p of st.photons) {
    const xL = cx - p.s * (cx - 150);
    const xR = cx + p.s * (W - 150 - cx);
    const yL = cy + p.tilt * 0;
    const yR = cy - p.tilt * 0;
    const colL = p.A === 1 ? [120, 240, 200] : [240, 120, 200];
    const colR = p.B === 1 ? [120, 240, 200] : [240, 120, 200];
    ctx.fillStyle = `rgba(${colL[0]}, ${colL[1]}, ${colL[2]}, 0.8)`;
    ctx.beginPath(); ctx.arc(xL, yL, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${colR[0]}, ${colR[1]}, ${colR[2]}, 0.8)`;
    ctx.beginPath(); ctx.arc(xR, yR, 2.2, 0, Math.PI * 2); ctx.fill();
  }

  // Caption strip
  ctx.fillStyle = 'rgba(220, 230, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption');
  const {a, ap, b, bp} = asRad();
  ctx.fillText(`S = ${chshS(a, ap, b, bp).toFixed(3)} (classical bound 2, Tsirelson 2.828)`, 14, SCENE.h - 10);
}

function drawDetector(x, y, angleDeg, label, color, ghost = false) {
  // Box
  ctx.fillStyle = ghost ? 'rgba(30, 38, 56, 0.7)' : 'rgba(40, 48, 70, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = ghost ? 1 : 1.5;
  ctx.fillRect(x - 30, y - 30, 60, 60);
  ctx.strokeRect(x - 30, y - 30, 60, 60);
  // Polarizer line at angleDeg.
  const rad = angleDeg * DEG;
  const len = 22;
  const dx = len * Math.cos(rad), dy = len * Math.sin(rad);
  ctx.strokeStyle = color;
  ctx.lineWidth = ghost ? 1.5 : 2.5;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  // Tick mark for + axis.
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x + dx, y + dy, 3, 0, Math.PI * 2); ctx.fill();
  // Label
  ctx.fillStyle = ghost ? 'rgba(180, 200, 230, 0.65)' : 'rgba(220, 230, 255, 0.95)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(`${label} = ${angleDeg.toFixed(0)} deg`, x - 30, y + 50);
}

function stepPhotons(dt) {
  // Spawn a pair from the source if running.
  if (st.t * 60 > (st.photons.length === 0 ? 0 : st.photons[st.photons.length - 1].born + 0.04)) {
    const A = st.rng() < 0.5 ? 1 : -1;
    // Bob outcome correlated via cos(2(a-b)).
    const { a, b } = asRad();
    const c = Math.cos(2 * (a - b));
    const probSame = (1 - c) / 2;     // P(same sign in singlet)
    const sameSign = st.rng() < probSame;
    const B = sameSign ? A : -A;
    st.photons.push({ s: 0, born: st.t * 60, A, B });
    // Update accumulated correlation.
    st.outcomes.N += 1;
    st.outcomes.sumProduct += A * B;
    if (st.photons.length > 30) st.photons.shift();
  }
  for (const p of st.photons) {
    p.s += dt * 1.4;
  }
  st.photons = st.photons.filter(p => p.s < 1.05);
}

function drawCorrelationCurve() {
  const { x, y, w, h } = CURVE;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('E(a - b) = -cos(2 (a - b)) singlet correlation', x + 8, y - 6);

  // Plot E vs delta = (a - b) over [0, 180 deg].
  const midY = y + h / 2;
  // Frame
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.20)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 32, midY); ctx.lineTo(x + w - 8, midY); ctx.stroke();
  // Quantum curve (yellow).
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k <= 180; k++) {
    const d = k * DEG;
    const E = -Math.cos(2 * d);
    const xx = x + 32 + (k / 180) * (w - 40);
    const yy = midY - E * (h / 2 - 12);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // LHV envelope (zigzag, light blue).
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let k = 0; k <= 180; k++) {
    const d = k * DEG;
    const E_env = correlation_LHV_envelope(0, -d);
    const xx = x + 32 + (k / 180) * (w - 40);
    const yy = midY - E_env * (h / 2 - 12);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // -envelope
  ctx.beginPath();
  for (let k = 0; k <= 180; k++) {
    const d = k * DEG;
    const E_env = -correlation_LHV_envelope(0, -d);
    const xx = x + 32 + (k / 180) * (w - 40);
    const yy = midY - E_env * (h / 2 - 12);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // Current (a, b) marker.
  const { a, b } = asRad();
  let delta_deg = (st.a_deg - st.b_deg);
  delta_deg = ((delta_deg % 180) + 180) % 180;
  const E_now = correlation_QM(a, b);
  const x_now = x + 32 + (delta_deg / 180) * (w - 40);
  const y_now = midY - E_now * (h / 2 - 12);
  ctx.fillStyle = 'rgba(255, 255, 240, 1)';
  ctx.beginPath(); ctx.arc(x_now, y_now, 6, 0, Math.PI * 2); ctx.fill();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', x + 28, y + h - 8);
  ctx.fillText('180 deg', x + w - 50, y + h - 8);
  ctx.fillText('+1', x + 12, y + 14);
  ctx.fillText('-1', x + 12, y + h - 8);
  // Legend
  ctx.fillStyle = 'rgba(255, 220, 120, 0.95)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText('quantum E(d)', x + 32, y + 16);
  ctx.fillStyle = 'rgba(120, 200, 255, 0.65)';
  ctx.fillText('LHV envelope', x + 120, y + 16);
}

function drawBars() {
  const { x, y, w, h } = BARS;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText('CHSH statistic  |S|', x + 8, y - 6);

  // S spans [0, 3]. Tick lines at 2 and 2 sqrt 2.
  const x0 = x + 26;
  const xMax = x + w - 14;
  const scale = (s) => x0 + (s / 3) * (xMax - x0);
  // Background bar.
  ctx.fillStyle = 'rgba(40, 50, 70, 0.7)';
  ctx.fillRect(x0, y + 30, xMax - x0, h - 60);
  // Classical bound (red).
  const x_clas = scale(CLASSICAL_BOUND);
  ctx.strokeStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x_clas, y + 20); ctx.lineTo(x_clas, y + h - 20); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 130, 110, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('classical', x_clas - 18, y + 18);
  ctx.fillText('|S| = 2', x_clas - 14, y + h - 6);
  // Tsirelson (green).
  const x_tsir = scale(TSIRELSON_BOUND);
  ctx.strokeStyle = 'rgba(120, 240, 160, 0.95)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x_tsir, y + 20); ctx.lineTo(x_tsir, y + h - 20); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(120, 240, 160, 0.95)';
  ctx.fillText('Tsirelson', x_tsir - 22, y + 18);
  ctx.fillText('2 sqrt 2', x_tsir - 18, y + h - 6);
  // Current |S| bar.
  const { a, ap, b, bp } = asRad();
  const S = chshS(a, ap, b, bp);
  const absS = Math.abs(S);
  const x_S = scale(absS);
  const grad = ctx.createLinearGradient(x0, y + h / 2, x_S, y + h / 2);
  grad.addColorStop(0, 'rgba(180, 220, 255, 0.95)');
  grad.addColorStop(1, absS > 2.8 ? 'rgba(120, 240, 160, 0.95)' : (absS > 2 ? 'rgba(255, 240, 120, 0.95)' : 'rgba(220, 220, 220, 0.95)'));
  ctx.fillStyle = grad;
  ctx.fillRect(x0, y + h / 2 - 12, x_S - x0, 24);
  // Numerical readout.
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.font = fontString(canvas, 'heading', 'mono', 600);
  ctx.fillText(`|S| = ${absS.toFixed(3)}`, x + 8, y + h / 2 + 38);
  ctx.fillStyle = absS > 2 ? 'rgba(120, 240, 160, 0.95)' : 'rgba(255, 130, 110, 0.95)';
  ctx.font = fontString(canvas, 'caption');
  const verdict = absS > 2 ? '> 2 : LHV ruled out' : 'within classical bound';
  ctx.fillText(verdict, x + 8, y + h / 2 + 56);
}

function updateReadout() {
  rA.textContent = `${st.a_deg}, ${st.ap_deg}`;
  rB.textContent = `${st.b_deg}, ${st.bp_deg}`;
  const { a, ap, b, bp } = asRad();
  const E = correlation_QM(a, b);
  rE.textContent = E.toFixed(3);
  const S = chshS(a, ap, b, bp);
  rS.textContent = S.toFixed(3);
  rVerdict.textContent = Math.abs(S) > 2 ? 'LHV ruled out' : 'classical OK';
}

function draw() {
  drawScene();
  drawCorrelationCurve();
  drawBars();
  updateReadout();
}

function readSliders() {
  st.a_deg = parseInt(sA.value, 10);
  st.ap_deg = parseInt(sAp.value, 10);
  st.b_deg = parseInt(sB.value, 10);
  st.bp_deg = parseInt(sBp.value, 10);
  vA.textContent = String(st.a_deg);
  vAp.textContent = String(st.ap_deg);
  vB.textContent = String(st.b_deg);
  vBp.textContent = String(st.bp_deg);
}

function applyPreset(name) {
  if (name === 'optimal') {
    st.a_deg = 0; st.ap_deg = 45; st.b_deg = 22; st.bp_deg = 67;
  } else if (name === 'aligned') {
    st.a_deg = 0; st.ap_deg = 90; st.b_deg = 0; st.bp_deg = 90;
  } else if (name === 'random') {
    st.a_deg = Math.floor(st.rng() * 180);
    st.ap_deg = Math.floor(st.rng() * 180);
    st.b_deg = Math.floor(st.rng() * 180);
    st.bp_deg = Math.floor(st.rng() * 180);
  }
  sA.value = String(st.a_deg);
  sAp.value = String(st.ap_deg);
  sB.value = String(st.b_deg);
  sBp.value = String(st.bp_deg);
  readSliders();
  st.outcomes = { N: 0, sumProduct: 0 };
  vPreset.textContent = name.slice(0, 3);
}

[sA, sAp, sB, sBp].forEach(el => el.addEventListener('input', () => { readSliders(); st.outcomes = { N: 0, sumProduct: 0 }; }));
selPreset.addEventListener('change', () => applyPreset(selPreset.value));
btnReset.addEventListener('click', () => { st.outcomes = { N: 0, sumProduct: 0 }; st.photons = []; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  angle_a: { get: () => st.a_deg, set: v => { st.a_deg = parseInt(v, 10); sA.value = v; }, parse: parseInt },
  angle_ap: { get: () => st.ap_deg, set: v => { st.ap_deg = parseInt(v, 10); sAp.value = v; }, parse: parseInt },
  angle_b: { get: () => st.b_deg, set: v => { st.b_deg = parseInt(v, 10); sB.value = v; }, parse: parseInt },
  angle_bp: { get: () => st.bp_deg, set: v => { st.bp_deg = parseInt(v, 10); sBp.value = v; }, parse: parseInt },
};
parseUrlState(SHARE_KEYS);
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Pre-emit a steady-state photon stream.
  let tt = 0;
  while (tt < 0.8 + 0.6 * (CAPTURE_FRAC || 0)) {
    stepPhotons(0.05);
    tt += 0.05;
    st.t = tt;
  }
  draw();
  window.__simulationReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      stepPhotons(dt);
      st.t += dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
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
