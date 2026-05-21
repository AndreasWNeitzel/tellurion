import { fontString } from '../../../shared/js/canvas-type.js';
// Jones calculus playground (Canvas2D). Left: the polarization
// ellipse traced by the field after a chain of elements. Right: the
// Poincare sphere with the input and output state points. Static
// (recomputed per control change). sim.js is the gate-tested engine.

import {
  jLinear, jCircular, linearPolarizer, quarterWave, halfWave,
  identityM, applyChain, stokes, ellipse, intensity, degreeOfPolarization,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rPsi = document.getElementById('readout-psi');
const rChi = document.getElementById('readout-chi');
const rHand = document.getElementById('readout-hand');
const rInt = document.getElementById('readout-int');
const rDop = document.getElementById('readout-dop');

const selIn = document.getElementById('select-input');
const sAng = document.getElementById('slider-ang'), vAng = document.getElementById('value-ang');
const selE1 = document.getElementById('select-e1');
const sA1 = document.getElementById('slider-a1'), vA1 = document.getElementById('value-a1');
const selE2 = document.getElementById('select-e2');
const bR = document.getElementById('btn-reset');

const st = { input: 'lin', ang: 0, e1: 'qwp', a1: 45, e2: 'none' };
const DEG = Math.PI / 180;
const rowAng = document.getElementById('row-ang');

// The input azimuth only means anything for linear light; circular
// light has no linear angle, so the slider is hidden there rather
// than left looking dead.
function applyVis() { rowAng.style.display = st.input === 'lin' ? '' : 'none'; }

function inputVec() {
  if (st.input === 'cr') return jCircular(true);
  if (st.input === 'cl') return jCircular(false);
  return jLinear(st.ang * DEG);
}
function elemMatrix(kind, axisDeg) {
  const a = axisDeg * DEG;
  if (kind === 'qwp') return quarterWave(a);
  if (kind === 'hwp') return halfWave(a);
  if (kind === 'pol') return linearPolarizer(a);
  return identityM;
}
function elemLabel(kind, axisDeg) {
  if (kind === 'qwp') return `QWP ${axisDeg} deg`;
  if (kind === 'hwp') return `HWP ${axisDeg} deg`;
  if (kind === 'pol') return `POL ${axisDeg} deg`;
  return 'none';
}

// Trace E(t) = Re[(ax,ay) e^{i omega t}] over one period; a small
// arrowhead near the start shows the rotation sense (handedness).
function drawEllipse(cx, cy, S, vec, color, lw, alpha, tick) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
  ctx.beginPath();
  let x4 = 0, y4 = 0;
  for (let i = 0; i <= 160; i += 1) {
    const t = (i / 160) * 2 * Math.PI;
    const ct = Math.cos(t), sct = Math.sin(t);
    const ex = vec[0].re * ct - vec[0].im * sct;
    const ey = vec[1].re * ct - vec[1].im * sct;
    const X = cx + ex * S, Y = cy - ey * S;
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    if (i === 4) { x4 = X; y4 = Y; }
  }
  ctx.stroke();
  if (tick) {
    const e0x = cx + vec[0].re * S, e0y = cy - vec[1].re * S;
    const an = Math.atan2(y4 - e0y, x4 - e0x), hl = 7;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x4, y4);
    ctx.lineTo(x4 - hl * Math.cos(an - 0.5), y4 - hl * Math.sin(an - 0.5));
    ctx.lineTo(x4 - hl * Math.cos(an + 0.5), y4 - hl * Math.sin(an + 0.5));
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Optical-bench strip: the beam enters, passes element 1 then
// element 2, and the polarization ellipse is drawn at every stage so
// the transformation is concrete, not abstract.
function drawBench(vin, vmid, vout) {
  const by = 60, gx = 64;
  ctx.strokeStyle = 'rgba(120,200,255,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(176, by); ctx.lineTo(744, by); ctx.stroke();
  for (const ax of [330, 560]) {
    ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.beginPath();
    ctx.moveTo(ax, by); ctx.lineTo(ax - 6, by - 5); ctx.lineTo(ax - 6, by + 5);
    ctx.closePath(); ctx.fill();
  }
  const stage = (cx, vec, col, lab) => {
    drawEllipse(cx, by, gx * 0.42, vec, col, 2, 1, true);
    ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(lab, cx, by + 40);
  };
  const ebox = (cx, text) => {
    ctx.strokeStyle = 'rgba(150,160,180,0.7)'; ctx.lineWidth = 1.4;
    ctx.strokeRect(cx - 44, by - 26, 88, 52);
    ctx.fillStyle = 'rgba(150,160,180,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(text, cx, by - 32);
  };
  stage(216, vin, '#5bc0eb', 'input');
  ebox(330, elemLabel(st.e1, st.a1));
  stage(445, vmid, 'rgba(200,200,210,0.95)', 'after E1');
  ebox(560, elemLabel(st.e2, 0));
  stage(704, vout, '#06d6a0', 'output');
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const vin = inputVec();
  const M1 = elemMatrix(st.e1, st.a1), M2 = elemMatrix(st.e2, 0);
  const vmid = applyChain([M1], vin);
  const vout = applyChain([M1, M2], vin);
  const eo = ellipse(vout);

  // top: optical bench, the beam through each element with the
  // polarization ellipse drawn at every stage
  drawBench(vin, vmid, vout);

  // left: input-vs-output polarization ellipse (the real-space field)
  const LCX = 196, LCY = 270, S = 104;
  ctx.strokeStyle = 'rgba(150,160,180,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LCX - S - 16, LCY); ctx.lineTo(LCX + S + 16, LCY);
  ctx.moveTo(LCX, LCY - S - 16); ctx.lineTo(LCX, LCY + S + 16); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Ex', LCX + S + 6, LCY + 15); ctx.fillText('Ey', LCX - 15, LCY - S - 4);
  ctx.fillText('field ellipse  (arrow = handedness)', LCX, LCY - S - 22);
  drawEllipse(LCX, LCY, S, vin, '#5bc0eb', 2.2, 0.8, true);    // input
  drawEllipse(LCX, LCY, S, vout, '#06d6a0', 3, 1, true);       // output
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('input', LCX - 64, LCY + S + 34);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.fillText('/', LCX, LCY + S + 34);
  ctx.fillStyle = '#06d6a0'; ctx.fillText('output', LCX + 64, LCY + S + 34);

  // right: Poincare sphere with the stage-by-stage path. Each element
  // moves the state: a wave plate rotates it about its axis, a
  // polarizer projects it toward a diameter.
  const PCX = 560, PCY = 264, PR = 104;
  ctx.strokeStyle = 'rgba(150,160,180,0.45)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(PCX, PCY, PR, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(PCX, PCY, PR, PR * 0.32, 0, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,130,150,0.3)';
  ctx.beginPath(); ctx.moveTo(PCX - PR, PCY); ctx.lineTo(PCX + PR, PCY);
  ctx.moveTo(PCX, PCY - PR); ctx.lineTo(PCX, PCY + PR); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'center';
  ctx.fillText('Poincare sphere (each element moves the point)', PCX, PCY + PR + 34);
  ctx.fillText('S3 circular', PCX, PCY - PR - 10);
  ctx.fillText('H', PCX + PR + 12, PCY + 4); ctx.fillText('V', PCX - PR - 12, PCY + 4);
  const proj = (s) => {
    const n = s.S0 || 1;
    return { x: PCX + (s.S1 / n) * PR, y: PCY - (s.S3 / n) * PR - (s.S2 / n) * PR * 0.30 };
  };
  const pIn = proj(stokes(vin)), pMid = proj(stokes(vmid)), pOut = proj(stokes(vout));
  ctx.strokeStyle = 'rgba(200,200,210,0.6)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(pIn.x, pIn.y); ctx.lineTo(pMid.x, pMid.y); ctx.lineTo(pOut.x, pOut.y); ctx.stroke();
  ctx.setLineDash([]);
  for (const [p, col, r] of [[pIn, '#5bc0eb', 6], [pMid, 'rgba(200,200,210,0.95)', 5], [pOut, '#06d6a0', 7]]) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fill();
  }

  rPsi.textContent = `${(eo.psi / DEG).toFixed(1)} deg`;
  rChi.textContent = `${(eo.chi / DEG).toFixed(1)} deg`;
  rHand.textContent = eo.handed;
  rInt.textContent = intensity(vout).toFixed(3);
  rDop.textContent = degreeOfPolarization(vout).toFixed(3);
}

function syncLabels() { vAng.textContent = String(st.ang); vA1.textContent = String(st.a1); }
selIn.addEventListener('change', () => { st.input = selIn.value; applyVis(); render(); });
sAng.addEventListener('input', () => { st.ang = parseInt(sAng.value, 10); syncLabels(); render(); });
selE1.addEventListener('change', () => { st.e1 = selE1.value; render(); });
sA1.addEventListener('input', () => { st.a1 = parseInt(sA1.value, 10); syncLabels(); render(); });
selE2.addEventListener('change', () => { st.e2 = selE2.value; render(); });
bR.addEventListener('click', () => {
  st.input = 'lin'; st.ang = 0; st.e1 = 'qwp'; st.a1 = 45; st.e2 = 'none';
  selIn.value = 'lin'; sAng.value = '0'; selE1.value = 'qwp'; sA1.value = '45'; selE2.value = 'none';
  syncLabels(); applyVis(); render();
});

function bootSync() {
  syncLabels(); applyVis();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.a1 = Math.round(f * 180);                       // rotate the QWP axis
    sA1.value = String(st.a1); syncLabels();
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); }, { once: true });
} else {
  bootSync();
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
