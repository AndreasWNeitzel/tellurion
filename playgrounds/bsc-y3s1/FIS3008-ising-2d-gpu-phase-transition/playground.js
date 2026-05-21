// The 2D Ising phase transition (Canvas2D). The live lattice is drawn
// from an offscreen ImageData; the panel shows the exact Onsager
// magnetization curve with the measured operating point and a trail
// of measured samples. The Metropolis sweep is the verified shared
// lattice-MC engine. No WebGL: the lattice is 144^2 in plain
// Canvas2D, which sustains 60 fps (the "GPU/512^2" slug is the
// aspiration; the stack rule keeps this Canvas2D).

import {
  create, step, diagnostics, magPerSpin, energyPerSpin, onsagerTc, onsagerM,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rAbsM = document.getElementById('readout-absm');
const rOns = document.getElementById('readout-onsager');
const rE = document.getElementById('readout-e');
const rChi = document.getElementById('readout-chi');
const rTtc = document.getElementById('readout-ttc');

const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sSp = document.getElementById('slider-speed'), vSp = document.getElementById('value-speed');
const selI = document.getElementById('select-init');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const L = 144, SEED = 0xC0FFEE, TC = onsagerTc(1);
const st = { T: 2.0, speed: 3, init: 'random', running: !prefersReducedMotion() };
let inst = create({ L, T: st.T, seed: SEED, init: st.init });

// offscreen lattice bitmap
const off = document.createElement('canvas'); off.width = L; off.height = L;
const offCtx = off.getContext('2d');
const img = offCtx.createImageData(L, L);

// plot box (right) and lattice box (left)
const GX = 60, GY = 40, GS = 400;                       // lattice square
const PX0 = GX + GS + 60, PX1 = W - 24, PY0 = 70, PY1 = H - 60;
const TMIN = 0.6, TMAX = 4.0, MMAX = 1.05;
const xOfT = (T) => PX0 + ((T - TMIN) / (TMAX - TMIN)) * (PX1 - PX0);
const yOfM = (m) => PY1 - (m / MMAX) * (PY1 - PY0);

// running susceptibility window
let win = [];
function pushWin(m) { win.push(m); if (win.length > 240) win.shift(); }
function chiNow() {
  if (win.length < 8) return 0;
  let s = 0, s2 = 0;
  for (const m of win) { const a = Math.abs(m); s += a; s2 += a * a; }
  const n = win.length, mean = s / n;
  return (L * L * (s2 / n - mean * mean)) / st.T;
}
const samples = [];                                     // measured (T, |M|) trail

function paintLattice() {
  const s = inst.s, d = img.data;
  for (let i = 0; i < s.length; i += 1) {
    const j = i * 4;
    if (s[i] > 0) { d[j] = 239; d[j + 1] = 71; d[j + 2] = 111; }   // up: warm
    else { d[j] = 25; d[j + 1] = 70; d[j + 2] = 120; }             // down: cool
    d[j + 3] = 255;
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, GX, GY, GS, GS);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(GX, GY, GS, GS);
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`${L} x ${L} spins`, GX + GS / 2, GY - 14);
}

function paintPlot() {
  // axes
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.fillText('temperature  T', (PX0 + PX1) / 2, H - 22);
  ctx.save(); ctx.translate(PX0 - 34, (PY0 + PY1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('|M|', 0, 0); ctx.restore();
  for (let g = 0; g <= 4; g += 1) {
    const yy = PY1 - (g / 4) * (PY1 - PY0);
    ctx.strokeStyle = 'rgba(120,130,150,0.15)'; ctx.beginPath(); ctx.moveTo(PX0, yy); ctx.lineTo(PX1, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(150,160,180,0.5)'; ctx.textAlign = 'right'; ctx.fillText((g / 4).toFixed(2), PX0 - 6, yy + 4);
  }
  // Tc marker
  ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOfT(TC), PY0); ctx.lineTo(xOfT(TC), PY1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.textAlign = 'center'; ctx.fillText('Tc', xOfT(TC), PY0 - 6);

  // Onsager exact curve
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.2; ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 240; i += 1) {
    const T = TMIN + (i / 240) * (TMAX - TMIN);
    const X = xOfT(T), Y = yOfM(onsagerM(T));
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // measured sample trail
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [T, m] of samples) { ctx.beginPath(); ctx.arc(xOfT(T), yOfM(m), 2, 0, 2 * Math.PI); ctx.fill(); }

  // current operating point
  const mNow = Math.abs(magPerSpin(inst));
  ctx.fillStyle = '#ef476f'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(xOfT(st.T), yOfM(mNow), 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

  // legend in the empty lower-left (the curve is high on the left,
  // zero on the right, so the bottom-left stays clear)
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillRect(PX0 + 10, PY1 - 34, 16, 4);
  ctx.fillText('Onsager exact', PX0 + 32, PY1 - 28);
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(PX0 + 18, PY1 - 14, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText('measured', PX0 + 32, PY1 - 10);
}

let frame = 0;
function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  paintLattice();
  paintPlot();
  // speed indicator: a wide bar so the sweeps/frame control changes a
  // dominant static element even when the simulation is paused
  const by = GY + GS + 14, bw = GS;
  ctx.fillStyle = 'rgba(120,130,150,0.18)'; ctx.fillRect(GX, by, bw, 16);
  ctx.fillStyle = '#ffd166'; ctx.fillRect(GX, by, bw * (st.speed / 12), 16);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(GX, by, bw, 16);
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`sweeps / frame: ${st.speed}`, GX, by + 32);
  const m = magPerSpin(inst), e = energyPerSpin(inst);
  pushWin(m);
  if ((frame & 31) === 0) { samples.push([st.T, Math.abs(m)]); if (samples.length > 400) samples.shift(); }
  rAbsM.textContent = Math.abs(m).toFixed(3);
  rOns.textContent = onsagerM(st.T).toFixed(3);
  rE.textContent = e.toFixed(3);
  rChi.textContent = chiNow().toFixed(1);
  rTtc.textContent = (st.T / TC).toFixed(3);
  frame += 1;
}

function tick() {
  if (st.running) step(inst, st.speed);
  render();
  requestAnimationFrame(tick);
}

function resetLattice() {
  inst = create({ L, T: st.T, seed: SEED, init: st.init });
  win = []; samples.length = 0;
}
// Deterministic re-thermalization from the fixed seed: a control
// change immediately shows the equilibrium character at the new
// setting (disordered fizz at high T, ordered domains at low T)
// instead of only altering the future of the running chain, so the
// effect is visible in a single frame even while paused.
function quench() {
  inst = create({ L, T: st.T, seed: SEED, init: st.init });
  step(inst, 90);
  win = []; samples.length = 0;
}
sT.addEventListener('input', () => { st.T = parseFloat(sT.value); vT.textContent = st.T.toFixed(2); quench(); render(); });
sSp.addEventListener('input', () => { st.speed = parseInt(sSp.value, 10); vSp.textContent = String(st.speed); render(); });
selI.addEventListener('change', () => { st.init = selI.value; quench(); render(); });
bR.addEventListener('click', () => { st.T = 2.0; sT.value = '2.0'; vT.textContent = '2.00'; st.init = 'random'; selI.value = 'random'; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); quench(); render(); });
bP.addEventListener('click', () => { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); });

function bootSync() {
  vT.textContent = st.T.toFixed(2); vSp.textContent = String(st.speed);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // hot -> cold sweep so the frames show fizz -> critical clusters
    // -> ordered domains, each thermalized deterministically.
    st.T = 3.6 + f * (1.2 - 3.6);
    sT.value = String(st.T);
    inst = create({ L, T: st.T, seed: SEED, init: 'random' });
    step(inst, 700);
    render();
  } else {
    render();
  }
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
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
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
