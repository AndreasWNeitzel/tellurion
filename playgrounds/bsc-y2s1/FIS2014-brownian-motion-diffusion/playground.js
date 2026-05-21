// Brownian motion as a real diffusing cloud. A point cloud of walkers
// spreads from the origin while a highlighted tracer is buffeted by
// solvent molecules and drags a trail. The diffusion coefficient comes
// from Stokes-Einstein, D = kB T / (6 pi eta r), so warming, thinning
// or shrinking the tracer visibly speeds the spread. Side panels: the
// mean-squared displacement against the 4 D t law, and the displacement
// histogram against the Gaussian. Reference: Reif, Statistical and
// Thermal Physics, Ch. 1 and Sec. 15.5.

import { createEnsemble, step, msd, stokesEinstein, kB } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
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

const NP = 1600;
const DT = 0.02;
const HORIZON = 720;                 // steps per animation cycle (~12 s real)
const K_DISP = 3.6e9;                // physical D (m^2/s) to display units
const PXSCALE = 21;                  // display units to pixels
const READOUTS = ['T (K)', 'eta (mPa s)', 'r (nm)', 'D (m^2/s)', 'sim t', '<r^2>'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { T: 300, eta: 1.0, r: 1.0, nstep: 0, running: 1 };
let ens = createEnsemble(NP, DEFAULT_SEED);
let msdHist = [], trail = [];
const solv = (() => { const g = makeRng(0xBEEF); const a = []; for (let i = 0; i < 90; i += 1) a.push([g(), g(), g() * 6.28, 0.5 + g()]); return a; })();

function Dphys() { return stokesEinstein(st.T, st.eta * 1e-3, st.r * 1e-9); }
function Ddisp() { return K_DISP * Dphys(); }

// Rebuild the ensemble deterministically and diffuse it to the current
// step count with the current D (so a slider change is reflected at
// once and the cloud is always consistent with D).
function rebuild(toStep = st.nstep) {
  ens = createEnsemble(NP, DEFAULT_SEED);
  msdHist = []; trail = [];
  const D = Ddisp();
  for (let k = 1; k <= toStep; k += 1) { step(ens, DT, D); if (k % 6 === 0) msdHist.push([ens.t, msd(ens)]); if (k % 3 === 0) trail.push([ens.x[0], ens.y[0]]); }
  st.nstep = toStep;
}

// geometry
const BX = 20, BY = 20, BW = 540, BH = 540;
const cx = BX + BW / 2, cy = BY + BH / 2;
const QX = 584, QW = 256;
const M1Y = 220, M1H = 148, M2Y = 392, M2H = 148;

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y - 6); ctx.textAlign = 'left';
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const D = Ddisp(), t = ens.t;

  // diffusion arena
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(BX, BY, BW, BH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(BX, BY, BW, BH);
  ctx.save(); ctx.beginPath(); ctx.rect(BX, BY, BW, BH); ctx.clip();
  // origin marker
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke();
  // rms theoretical spread circle, radius sqrt(4 D t)
  const rmsR = Math.sqrt(Math.max(1e-6, 4 * D * t)) * PXSCALE;
  ctx.strokeStyle = 'rgba(127,209,255,0.55)'; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.arc(cx, cy, rmsR, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('sqrt(4Dt)', cx + rmsR * 0.7 + 4, cy - rmsR * 0.7);
  // walker cloud
  ctx.fillStyle = 'rgba(230,200,120,0.5)';
  for (let i = 1; i < NP; i += 1) {
    const X = cx + ens.x[i] * PXSCALE, Y = cy + ens.y[i] * PXSCALE;
    ctx.fillRect(X - 1, Y - 1, 2, 2);
  }
  // tracer (walker 0) with trail and solvent buffeting
  const tX = cx + ens.x[0] * PXSCALE, tY = cy + ens.y[0] * PXSCALE;
  const trR = 6 + st.r * 2.2;
  for (const [a, b, ph, sp] of solv) {
    const ang = ph + st.t * 2.4 * sp, rr = trR + 7 + a * 16;
    ctx.fillStyle = 'rgba(150,170,200,0.5)';
    ctx.beginPath(); ctx.arc(tX + Math.cos(ang) * rr, tY + Math.sin(ang + b * 6.28) * rr, 1.5, 0, 6.2832); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,93,93,0.65)'; ctx.lineWidth = 1.4; ctx.beginPath();
  trail.forEach(([wx, wy], k) => { const px = cx + wx * PXSCALE, py = cy + wy * PXSCALE; k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
  ctx.lineTo(tX, tY); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(tX, tY, trR, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('diffusing ensemble (' + NP + ' walkers) and a buffeted tracer', cx, BY + BH + 18);
  ctx.textAlign = 'left';

  // panel 1: MSD vs t with the 4 D t law
  panel(QX, M1Y, QW, M1H, 'mean-squared displacement');
  const tMax = HORIZON * DT, msdMax = 4 * D * tMax * 1.15 + 1e-9;
  const mx = (tt) => QX + (tt / tMax) * QW, my = (vv) => M1Y + M1H - (vv / msdMax) * M1H;
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(mx(0), my(0)); ctx.lineTo(mx(tMax), my(4 * D * tMax)); ctx.stroke(); ctx.lineWidth = 1;
  ctx.strokeStyle = '#e6c878'; ctx.beginPath();
  msdHist.forEach(([tt, vv], k) => { const X = mx(tt), Y = my(vv); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
  ctx.stroke();
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(mx(t), my(msd(ens)), 3.5, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('t', QX + QW / 2, M1Y + M1H + 13);
  ctx.save(); ctx.translate(QX - 7, M1Y + M1H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('<r^2>', 0, 0); ctx.restore();
  ctx.textAlign = 'left'; ctx.fillStyle = '#7fd6ff'; ctx.fillText('4 D t', QX + 8, M1Y + 14);
  ctx.fillStyle = '#e6c878'; ctx.fillText('measured', QX + 8, M1Y + 28);

  // panel 2: displacement histogram vs Gaussian
  panel(QX, M2Y, QW, M2H, 'x-displacement vs Gaussian');
  const sig = Math.sqrt(Math.max(1e-9, 2 * D * t)), HB = 31, span = 4 * (sig || 1);
  const hist = new Float64Array(HB);
  for (let i = 0; i < NP; i += 1) { const b = Math.floor(((ens.x[i] + span) / (2 * span)) * HB); if (b >= 0 && b < HB) hist[b] += 1; }
  let hmax = 1; for (const v of hist) hmax = Math.max(hmax, v);
  ctx.fillStyle = 'rgba(230,200,120,0.55)';
  for (let b = 0; b < HB; b += 1) { const bw = QW / HB, bh = (hist[b] / hmax) * (M2H - 16); ctx.fillRect(QX + b * bw + 0.5, M2Y + M2H - bh, bw - 1, bh); }
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let px = 0; px <= QW; px += 3) { const xv = -span + (px / QW) * 2 * span; const g = Math.exp(-xv * xv / (2 * sig * sig)); const Y = M2Y + M2H - g * (M2H - 16); px === 0 ? ctx.moveTo(QX + px, Y) : ctx.lineTo(QX + px, Y); }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('dx', QX + QW / 2, M2Y + M2H + 13);
  ctx.textAlign = 'left';

  rEls['T (K)'].textContent = st.T.toFixed(0);
  rEls['eta (mPa s)'].textContent = st.eta.toFixed(2);
  rEls['r (nm)'].textContent = st.r.toFixed(2);
  rEls['D (m^2/s)'].textContent = Dphys().toExponential(2);
  rEls['sim t'].textContent = t.toFixed(2);
  rEls['<r^2>'].textContent = msd(ens).toFixed(3);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => {
    st[key] = parseFloat(inp.value);
    val.textContent = fmt(+inp.value);
    // Restart the cycle so the user SEES the new diffusion play out;
    // previously this just snapshotted the new state at the current
    // step count, which made the slider feel inert.
    rebuild(0); render();
  });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const cT = buildSlider('temperature T (K)', 150, 600, 5, st.T, 'T', v => v.toFixed(0));
const cE = buildSlider('viscosity eta (mPa s)', 0.3, 3.0, 0.05, st.eta, 'eta', v => v.toFixed(2));
const cR = buildSlider('tracer radius r (nm)', 0.4, 5.0, 0.1, st.r, 'r', v => v.toFixed(2));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { T: 300, eta: 1.0, r: 1.0, nstep: 0, running: 1 });
  cT.inp.value = '300'; cT.val.textContent = '300'; cE.inp.value = '1'; cE.val.textContent = '1.00'; cR.inp.value = '1'; cR.val.textContent = '1.00';
  rebuild(0); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

// loop and capture
let acc = 0, lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) {
    acc += dr; const D = Ddisp();
    while (acc > 1 / 60 && st.nstep < HORIZON) {
      step(ens, DT, D); st.nstep += 1;
      if (st.nstep % 6 === 0) msdHist.push([ens.t, msd(ens)]);
      if (st.nstep % 3 === 0) trail.push([ens.x[0], ens.y[0]]);
      acc -= 1 / 60;
    }
    // Auto-restart at the terminal frame so the animation cycles
    // forever; the user sees the cloud spread, the MSD-4Dt line build
    // up, the histogram approach the Gaussian, then reset and repeat.
    if (st.nstep >= HORIZON) { rebuild(0); acc = 0; }
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) rebuild(Math.round(CAPTURE_FRAC * HORIZON)); else rebuild(0);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const e = createEnsemble(9000, DEFAULT_SEED), Dt = 0.6;
  for (let k = 0; k < 300; k += 1) step(e, 0.01, Dt);
  const ratio = msd(e) / (4 * Dt * e.t);
  if (Math.abs(ratio - 1) > 0.05) return { name: 'MSD = 4 D t', pass: false, msg: `ratio=${ratio.toFixed(3)}` };
  const se2 = stokesEinstein(600, 1e-3, 1e-6) / stokesEinstein(300, 1e-3, 1e-6);
  if (Math.abs(se2 - 2) > 1e-9) return { name: 'Stokes-Einstein', pass: false, msg: `T-scale=${se2}` };
  return { name: 'MSD 4Dt + Stokes-Einstein', pass: true, msg: `ratio ${ratio.toFixed(3)}, D~kT/6πηr` };
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
