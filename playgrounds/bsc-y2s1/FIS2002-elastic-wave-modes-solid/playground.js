// Elastic waves in a 2D solid. The primary scene is the physical
// medium: a divergence map (compression in colour) with the deformed
// reference grid and the expanding P and S wavefront rings. A station
// records a seismogram, the side panel, where the fast P arrival
// precedes the slower S arrival by d (1/v_S - 1/v_P). Numerics: the
// headless leapfrog elastic solver in sim.js. Reference: Landau and
// Lifshitz, Theory of Elasticity (Vol. 7), Sec. 22-24.

import { speeds, cflDt, makeSolid, ricker, step, divergence } from './sim.js';
import { divBlack, fieldToImageData } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const GN = 160;
const RHO = 1;
const HORIZON = 360;                  // steps: long enough for P then the slower S to reach the station
const STEPS_PER_FRAME = 1;
const READOUTS = ['source', 'lambda', 'mu', 'v_P', 'v_S', 'sim t'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { src: 'force', lambda: 2.0, mu: 1.0, nstep: 0, running: 1 };
let solid = makeSolid(GN);
let DT = cflDt(st.lambda, st.mu, RHO);
const CI = GN >> 1;
const STA = { i: CI + 24, j: CI + 24 };       // 45 deg seismograph station
let seis = [];

function srcFn() {
  const t0 = 14 * DT, f0 = 1 / (26 * DT), A = 70;
  if (st.src === 'explosive') {
    // outward radial force in a small disc -> compressional (P)
    return (i, j) => { const dx = i - CI, dy = j - CI, r = Math.hypot(dx, dy); if (r > 3.5 || r < 1e-6) return null; const g = A * ricker(solid.t, t0, f0) / r; return [g * dx, g * dy]; };
  }
  if (st.src === 'shear') {
    // tangential force couple -> shear (S)
    return (i, j) => { const dx = i - CI, dy = j - CI, r = Math.hypot(dx, dy); if (r > 3.5 || r < 1e-6) return null; const g = A * ricker(solid.t, t0, f0) / r; return [-g * dy, g * dx]; };
  }
  return (i, j) => (i === CI && j === CI ? [0, A * ricker(solid.t, t0, f0)] : null);   // point force
}

function rebuild(toStep = st.nstep) {
  solid = makeSolid(GN); DT = cflDt(st.lambda, st.mu, RHO); seis = []; st.nstep = 0;
  const sf = srcFn();
  for (let k = 0; k < toStep; k += 1) {
    step(solid, st.lambda, st.mu, RHO, DT, k < 34 ? sf : null, 16);
    seis.push([solid.t, solid.uy[STA.j * GN + STA.i], solid.ux[STA.j * GN + STA.i]]);
    st.nstep += 1;
  }
}

// geometry
const FX = 16, FY = 16, FPX = 560, CELL = FPX / GN;
const PX = 596, PW = 256, PY = 212, PH = 330;
let imgData = new ImageData(GN, GN);
const off = document.createElement('canvas'); off.width = GN; off.height = GN;
const offCtx = off.getContext('2d');
const dfield = new Float32Array(GN * GN);

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const { vP, vS } = speeds(st.lambda, st.mu, RHO);

  // divergence (P, compression) map, tanh-compressed
  let mx = 1e-9;
  for (let j = 1; j < GN - 1; j += 1) for (let i = 1; i < GN - 1; i += 1) { const d = divergence(solid, i, j); dfield[j * GN + i] = d; const a = Math.abs(d); if (a > mx) mx = a; }
  const uref = 0.62 * mx;
  for (let i = 0; i < GN * GN; i += 1) dfield[i] = Math.tanh(dfield[i] / uref);
  imgData = fieldToImageData(dfield, GN, GN, -1, 1, divBlack, imgData);
  offCtx.putImageData(imgData, 0, 0);
  // Clip everything (field, strained grid, growing wavefront rings)
  // to the panel so nothing escapes the box.
  ctx.save(); ctx.beginPath(); ctx.rect(FX, FY, FPX, FPX); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off, FX, FY, FPX, FPX);

  // deformed reference grid (shows the medium straining)
  const gstep = 11, uscale = 60;
  ctx.strokeStyle = 'rgba(225,230,240,0.16)'; ctx.lineWidth = 1;
  for (let gj = gstep; gj < GN - gstep; gj += gstep) {
    ctx.beginPath();
    for (let gi = gstep; gi < GN - gstep; gi += 1) {
      const k = gj * GN + gi; const X = FX + (gi + solid.ux[k] * uscale) * CELL, Y = FY + (gj + solid.uy[k] * uscale) * CELL;
      gi === gstep ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
  for (let gi = gstep; gi < GN - gstep; gi += gstep) {
    ctx.beginPath();
    for (let gj = gstep; gj < GN - gstep; gj += 1) {
      const k = gj * GN + gi; const X = FX + (gi + solid.ux[k] * uscale) * CELL, Y = FY + (gj + solid.uy[k] * uscale) * CELL;
      gj === gstep ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }

  // analytic P and S wavefront rings (radius v t since the pulse peak)
  const tp = Math.max(0, solid.t - 14 * DT);
  const ringPx = (v) => (v * tp) * CELL;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,120,110,0.8)'; ctx.beginPath(); ctx.arc(FX + CI * CELL, FY + CI * CELL, ringPx(vP), 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,200,255,0.8)'; ctx.beginPath(); ctx.arc(FX + CI * CELL, FY + CI * CELL, ringPx(vS), 0, 6.2832); ctx.stroke();
  ctx.lineWidth = 1;
  // station marker
  ctx.fillStyle = '#ffe46b'; ctx.beginPath(); ctx.arc(FX + STA.i * CELL, FY + STA.j * CELL, 4, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(FX, FY, FPX, FPX);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('divergence (compression) + deformed grid; P ring red, S ring blue', FX + FPX / 2, FY + FPX + 18);
  ctx.textAlign = 'left';

  // side panel: seismogram at the station
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PY, PW, PH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('seismogram at the station', PX + PW / 2, PY - 6);
  if (seis.length > 2) {
    const tEnd = HORIZON * DT;
    let amax = 1e-9; for (const [, sy, sx] of seis) amax = Math.max(amax, Math.abs(sy), Math.abs(sx));
    const xx = (tt) => PX + 4 + (tt / tEnd) * (PW - 8);
    const yy = (val, base) => base - (val / amax) * (PH * 0.22);
    const bU = PY + PH * 0.30, bV = PY + PH * 0.72;
    ctx.strokeStyle = 'rgba(255,120,110,0.85)'; ctx.beginPath();
    seis.forEach(([tt, , sx], n) => { const X = xx(tt), Y = yy(sx, bU); n === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,200,255,0.9)'; ctx.beginPath();
    seis.forEach(([tt, sy], n) => { const X = xx(tt), Y = yy(sy, bV); n === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
    ctx.stroke();
    const d = Math.hypot(STA.i - CI, STA.j - CI);
    const tP = d / vP + 14 * DT, tS = d / vS + 14 * DT;
    ctx.strokeStyle = 'rgba(255,120,110,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xx(tP), PY + 6); ctx.lineTo(xx(tP), PY + PH - 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,200,255,0.5)'; ctx.beginPath(); ctx.moveTo(xx(tS), PY + 6); ctx.lineTo(xx(tS), PY + PH - 6); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('u_x (P)', PX + 8, PY + PH * 0.30 - 30);
    ctx.fillText('u_y (S)', PX + 8, PY + PH * 0.72 - 30);
    ctx.textAlign = 'center'; ctx.fillText('time', PX + PW / 2, PY + PH + 14);
  }
  ctx.textAlign = 'left';

  rEls['source'].textContent = st.src;
  rEls['lambda'].textContent = st.lambda.toFixed(2);
  rEls['mu'].textContent = st.mu.toFixed(2);
  rEls['v_P'].textContent = vP.toFixed(3);
  rEls['v_S'].textContent = vS.toFixed(3);
  rEls['sim t'].textContent = solid.t.toFixed(2);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const srRow = document.createElement('div'); srRow.className = 'row';
const srLab = document.createElement('span'); srLab.className = 'label'; srLab.textContent = 'source';
const srSel = document.createElement('select'); srSel.setAttribute('aria-label', 'source type');
for (const [v, t] of [['force', 'point force'], ['explosive', 'explosive (P)'], ['shear', 'shear couple (S)']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; srSel.appendChild(o); }
srSel.value = st.src;
srSel.addEventListener('change', () => { st.src = srSel.value; rebuild(); render(); });
srRow.appendChild(srLab); srRow.appendChild(srSel); const srsp = document.createElement('span'); srsp.className = 'value'; srRow.appendChild(srsp);
controlsEl.appendChild(srRow);
const cL = buildSlider('lambda (Lame)', 0.2, 6.0, 0.1, st.lambda, 'lambda', v => v.toFixed(2));
const cM = buildSlider('mu (shear)', 0.0, 4.0, 0.05, st.mu, 'mu', v => v.toFixed(2));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { src: 'force', lambda: 2.0, mu: 1.0, nstep: 0, running: 1 });
  srSel.value = 'force'; cL.inp.value = '2'; cL.val.textContent = '2.00'; cM.inp.value = '1'; cM.val.textContent = '1.00';
  rebuild(0); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let acc = 0, lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) {
    acc += dr;
    while (acc > 1 / 60 && st.nstep < HORIZON) {
      const sf = srcFn();
      for (let q = 0; q < STEPS_PER_FRAME && st.nstep < HORIZON; q += 1) { step(solid, st.lambda, st.mu, RHO, DT, st.nstep < 34 ? sf : null, 16); seis.push([solid.t, solid.uy[STA.j * GN + STA.i], solid.ux[STA.j * GN + STA.i]]); st.nstep += 1; }
      acc -= 1 / 60;
    }
    if (st.nstep >= HORIZON) { rebuild(0); acc = 0; }   // replay: strike -> P -> S -> repeat
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  rebuild(CAPTURE_NAME ? Math.round(CAPTURE_FRAC * HORIZON) : 0);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const { vP, vS } = speeds(2, 1, 1);
  const ratio = vP / vS, exp = Math.sqrt((2 + 2 * 1) / 1);
  if (Math.abs(ratio - exp) > 1e-9) return { name: 'v_P/v_S', pass: false, msg: `${ratio} vs ${exp}` };
  return { name: 'v_P = sqrt((lambda+2mu)/rho), v_S = sqrt(mu/rho)', pass: true, msg: `v_P/v_S = ${ratio.toFixed(4)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
