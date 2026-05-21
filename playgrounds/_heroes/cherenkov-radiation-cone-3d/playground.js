// Cherenkov radiation playground. Canvas2D 2D-plane section through
// the 3D cone showing the particle traversing a medium and the
// expanding wavelets piling up on the Cherenkov cone.

import { cherenkovAngle, frankTammFactor, wavelets, particleX } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rBeta = document.getElementById('readout-beta');
const rTheta = document.getElementById('readout-theta');
const rInt = document.getElementById('readout-int');
const sBeta = document.getElementById('slider-beta'), vBeta = document.getElementById('value-beta');
const selN = document.getElementById('select-n'), vN = document.getElementById('value-n');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const sNw = document.getElementById('slider-Nw'), vNw = document.getElementById('value-Nw');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  beta: 0.85, n: 1.33, speed: 2, Nw: 24,
  running: !prefersReducedMotion(),
  t: 0,
};

const X_MIN = -1.0, X_MAX = 8.0;
function w2s(x, y) {
  const margin = 30;
  const scale = (W - 2 * margin) / (X_MAX - X_MIN);
  return { x: margin + (x - X_MIN) * scale, y: H / 2 - y * scale };
}

function drawMedium() {
  // Light-blue tint over the entire canvas (the medium).
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1426');
  g.addColorStop(1, '#0a0f1c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Grid
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = X_MIN; x <= X_MAX; x += 1) {
    const p = w2s(x, 0);
    ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, H); ctx.stroke();
  }
  for (let y = -3; y <= 3; y += 1) {
    const p = w2s(0, y);
    ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(W, p.y); ctx.stroke();
  }
}

function drawTrack() {
  const xNow = particleX(st.t, st.beta);
  const p0 = w2s(X_MIN, 0);
  const p1 = w2s(xNow, 0);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  ctx.setLineDash([]);
}

function drawWavelets() {
  const ws = wavelets(st.t, st.beta, st.n, st.Nw);
  const fac = frankTammFactor(st.beta, st.n);
  const baseA = Math.min(0.6, 0.25 + 0.5 * fac);
  ctx.strokeStyle = `rgba(120, 200, 255, ${baseA.toFixed(3)})`;
  ctx.lineWidth = 1.0;
  const scale = (W - 60) / (X_MAX - X_MIN);
  for (const w of ws) {
    if (w.r < 0.01) continue;
    const p = w2s(w.x, 0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, w.r * scale, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function drawCone() {
  const theta = cherenkovAngle(st.beta, st.n);
  if (theta === null) return;
  const xNow = particleX(st.t, st.beta);
  const apex = w2s(xNow, 0);
  const L_world = xNow - X_MIN + 1;
  const dy = L_world * Math.tan(theta);
  const back_x_world = xNow - L_world;
  const top = w2s(back_x_world, dy);
  const bot = w2s(back_x_world, -dy);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.lineWidth = 2.0;
  ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(top.x, top.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
  ctx.fillStyle = 'rgba(120, 200, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y); ctx.lineTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`theta_C = ${(theta * 180 / Math.PI).toFixed(1)} deg`, apex.x + 14, apex.y - 14);
}

function drawParticle() {
  const xNow = particleX(st.t, st.beta);
  const p = w2s(xNow, 0);
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
  g.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
  g.addColorStop(1, 'rgba(255, 255, 200, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI); ctx.fill();
}

// Diagnostic panel: Cherenkov angle theta_C = arccos(1 / (n beta))
// versus beta, with the emission threshold (n beta = 1) marked and the
// current beta shown. Rule-13 mathematical grounding for the cone.
function drawDiagnostic() {
  const W = canvas.width, H = canvas.height;
  const pw = 220, ph = 150;
  const px = W - pw - 16, py = H - ph - 16;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.88)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.30)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText('Cherenkov angle  θ_C(β)', px + 8, py + 14);
  const ax = px + 32, ay = py + 24, aw = pw - 44, ah = ph - 46;
  // x: beta in [0, 1]; y: theta in [0, 90 deg].
  const xOf = (b) => ax + b * aw;
  const yOf = (deg) => ay + ah - (deg / 90) * ah;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let d = 0; d <= 90; d += 30) {
    ctx.beginPath(); ctx.moveTo(ax, yOf(d)); ctx.lineTo(ax + aw, yOf(d)); ctx.stroke();
  }
  // Threshold beta_thr = 1/n.
  const bThr = 1 / st.n;
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(xOf(bThr), ay); ctx.lineTo(xOf(bThr), ay + ah); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('βn=1', xOf(bThr) + 2, ay + 10);
  // theta_C(beta) curve.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 120; i += 1) {
    const b = i / 120;
    const th = cherenkovAngle(b, st.n);
    if (th === null) { started = false; continue; }
    const x = xOf(b), y = yOf(th * 180 / Math.PI);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current beta marker.
  const thNow = cherenkovAngle(st.beta, st.n);
  if (thNow !== null) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(xOf(st.beta), yOf(thNow * 180 / Math.PI), 4, 0, 6.28); ctx.fill();
  }
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 240, 0.8)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('0', ax - 8, ay + ah + 9);
  ctx.fillText('1', ax + aw - 4, ay + ah + 9);
  ctx.fillText('β', ax + aw / 2, ay + ah + 11);
  ctx.fillText('90°', ax - 22, ay + 6);
  ctx.fillText('0°', ax - 16, ay + ah);
}

function render() {
  drawMedium();
  drawWavelets();
  drawTrack();
  drawCone();
  drawParticle();
  drawDiagnostic();

  const theta = cherenkovAngle(st.beta, st.n);
  const fac = frankTammFactor(st.beta, st.n);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillText(`beta = ${st.beta.toFixed(2)}    n = ${st.n.toFixed(2)}    beta*n = ${(st.beta * st.n).toFixed(3)}`, 24, 22);
  if (theta === null) {
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(`below threshold: wavelets stay nested, no cone (beta*n < 1)`, 24, 40);
  } else {
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`above threshold: Cherenkov cone theta_C = ${(theta * 180 / Math.PI).toFixed(1)} deg, intensity ${(fac * 100).toFixed(1)}% of max`, 24, 40);
  }

  rBeta.textContent = st.beta.toFixed(2);
  rTheta.textContent = theta === null ? 'below threshold' : `${(theta * 180 / Math.PI).toFixed(2)} deg`;
  rInt.textContent = `${(fac * 100).toFixed(1)}%`;
}

function tick() {
  if (st.running) {
    st.t += 0.02 * Math.max(1, st.speed);
    if (particleX(st.t, st.beta) > X_MAX - 0.5) st.t = 0.5;
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vBeta.textContent = st.beta.toFixed(2);
  vN.textContent = st.n.toFixed(2);
  vSpeed.textContent = String(st.speed);
  vNw.textContent = String(st.Nw);
}

sBeta.addEventListener('input', () => { st.beta = parseFloat(sBeta.value); syncLabels(); });
selN.addEventListener('change', () => { st.n = parseFloat(selN.value); syncLabels(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
sNw.addEventListener('input', () => { st.Nw = parseInt(sNw.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.beta = 0.85; st.n = 1.33; st.speed = 2; st.Nw = 24; st.t = 0;
  sBeta.value = '0.85'; selN.value = '1.33'; sSpeed.value = '2'; sNw.value = '24';
  syncLabels();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { beta: st.beta, n: st.n }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.beta) { st.beta = parseFloat(s.beta); sBeta.value = String(st.beta); }
  if (s.n) { st.n = parseFloat(s.n); selN.value = String(st.n); }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.beta = 0.45 + f * 0.5;
    sBeta.value = String(st.beta);
    syncLabels();
    for (let n = 0; n < 30; n += 1) st.t += 0.04;
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
