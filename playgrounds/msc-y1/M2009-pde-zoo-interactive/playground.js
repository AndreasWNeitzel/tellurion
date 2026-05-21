// PDE zoo on a shared 1D grid. Panel A: the numeric solution with the
// analytic reference behind it. Panel B: the error or the conserved
// quantity over time. Panel C: the equation, scheme and what is
// conserved. Gate-tested sim.js; deterministic. LeVeque, Finite
// Difference Methods for ODEs and PDEs (2007).
import {
  makeWave, stepWave, waveAnalytic, waveEnergy,
  makeHeat, stepHeat, heatAnalytic, solvePoisson, poissonAnalytic,
  makeSchrodinger, stepSchrodinger, schrodingerNorm,
  makeBurgers, stepBurgers, burgersIntegral, burgersEnergy, maxError,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rEq = document.getElementById('readout-eq');
const rT = document.getElementById('readout-t');
const rErr = document.getElementById('readout-err');
const rCons = document.getElementById('readout-cons');
const selE = document.getElementById('select-eq');
const slP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const N = 200;
const NU = [0.001, 0.003, 0.006, 0.012, 0.02, 0.04];
const DEF = { eq: 'wave', p: 2 };
// Space-time waterfall: every frame we push the current u(x) field as
// a row in a circular buffer. The visualisation then shows the field
// evolving as a 2D heatmap (x horizontal, time downward) with the
// classic characteristic cones of wave propagation, the diffusive
// blur of the heat equation, and so on. This turns the 1D line plot
// into a genuinely 2D dynamic visualisation.
const WATERFALL_ROWS = 200;
const waterfall = new Float64Array(N * WATERFALL_ROWS);
let waterfallRow = 0;
function pushWaterfall(field) {
  const off = waterfallRow * N;
  for (let i = 0; i < N; i += 1) waterfall[off + i] = field[i];
  waterfallRow = (waterfallRow + 1) % WATERFALL_ROWS;
}
function clearWaterfall() {
  for (let i = 0; i < waterfall.length; i += 1) waterfall[i] = 0;
  waterfallRow = 0;
}

const st = { ...DEF, running: !prefersReducedMotion(), sim: null, hist: [], steady: null };

function build() {
  st.hist = []; st.steady = null;
  clearWaterfall();
  const p = st.p;
  if (st.eq === 'wave') st.sim = makeWave(N, 1.0, p);
  else if (st.eq === 'heat') st.sim = makeHeat(N, 0.02, p);
  else if (st.eq === 'schrodinger') st.sim = makeSchrodinger(N, 0.5, p * 12, 0.06);
  else if (st.eq === 'burgers') st.sim = makeBurgers(N, NU[p - 1], 0.6);
  else { st.steady = solvePoisson(N, p); st.sim = null; }   // laplace: steady
}

function analytic() {
  const s = st.sim;
  if (st.eq === 'wave') return waveAnalytic(s.x, s.t, 1.0, st.p);
  if (st.eq === 'heat') return heatAnalytic(s.x, s.t, 0.02, st.p);
  if (st.eq === 'laplace') return poissonAnalytic(st.steady.x, st.p);
  return null;                                              // schrodinger/burgers: no closed form shown
}
function curve() {                                          // what to plot
  if (st.eq === 'laplace') return st.steady.u;
  if (st.eq === 'schrodinger') {
    const s = st.sim, d = new Float64Array(N);
    for (let i = 0; i < N; i += 1) d[i] = s.re[i] * s.re[i] + s.im[i] * s.im[i];
    return d;
  }
  return st.sim.u;
}
function looped() {                                         // clean per-equation loop
  const s = st.sim;
  if (st.eq === 'wave') return s.t >= 2 / st.p + s.dt;       // one period (c=L=1)
  if (st.eq === 'heat') return Math.max(...s.u.map(Math.abs)) < 0.02;
  if (st.eq === 'schrodinger') return s.t > 0.06;
  if (st.eq === 'burgers') return burgersEnergy(s) < 0.012;
  return false;
}
function substep() {
  if (st.eq === 'wave') st.sim = stepWave(st.sim);
  else if (st.eq === 'heat') st.sim = stepHeat(st.sim);
  else if (st.eq === 'schrodinger') st.sim = stepSchrodinger(st.sim);
  else if (st.eq === 'burgers') st.sim = stepBurgers(st.sim);
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function plot(x, y, w, h, num, ana, label) {
  const px = x + 36, py = y + 24, pw = w - 50, ph = h - 46;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  let lo = Infinity, hi = -Infinity;
  for (const v of num) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (ana) for (const v of ana) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const pad = (hi - lo) * 0.12 + 1e-9; lo -= pad; hi += pad;
  const X = (i) => px + pw * i / (N - 1);
  const Y = (v) => py + ph * (1 - (v - lo) / (hi - lo));
  // zero line
  if (lo < 0 && hi > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.moveTo(px, Y(0)); ctx.lineTo(px + pw, Y(0)); ctx.stroke();
  }
  if (ana) {
    ctx.strokeStyle = 'rgba(155,232,176,0.65)'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let i = 0; i < N; i += 1) { const xx = X(i), yy = Y(ana[i]); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) { const xx = X(i), yy = Y(num[i]); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '11px monospace';
  ctx.fillText('x', px + pw / 2, py + ph + 14);
  ctx.fillStyle = '#6fb4ff'; ctx.fillText('numeric', px + 6, py + 13);
  if (ana) { ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.fillText('analytic (exact)', px + 70, py + 13); }
  ctx.fillStyle = 'rgba(200,210,235,0.7)'; ctx.fillText(label, px + pw - 120, py + 13);
}

function drawMain(x, y, w, h) {
  const NAME = {
    wave: 'wave equation: a shape oscillates back and forth',
    heat: 'heat equation: the shape smooths and decays',
    laplace: 'Poisson equation: the steady solution',
    schrodinger: 'Schrodinger: |psi|^2 of a spreading wavepacket',
    burgers: 'Burgers (1D Navier-Stokes): a shock forms and is smoothed',
  };
  panel(x, y, w, h, NAME[st.eq]);
  plot(x, y, w, h, curve(), st.eq === 'schrodinger' || st.eq === 'burgers' ? null : analytic(),
    st.eq === 'schrodinger' ? '|psi|^2' : 'u(x)');
}

function drawSecondary(x, y, w, h) {
  if (st.eq === 'laplace' || st.eq === 'wave' || st.eq === 'heat') {
    panel(x, y, w, h, 'error: |numeric - analytic|');
    const a = analytic(), n = curve();
    const e = new Float64Array(N);
    for (let i = 0; i < N; i += 1) e[i] = Math.abs(n[i] - a[i]);
    const px = x + 44, py = y + 24, pw = w - 58, ph = h - 46;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
    let mx = 1e-12; for (const v of e) mx = Math.max(mx, v);
    ctx.strokeStyle = '#ff9d6f'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < N; i += 1) {
      const xx = px + pw * i / (N - 1), yy = py + ph * (1 - e[i] / mx);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 4, py + 3, 168, 14);
    ctx.fillStyle = 'rgba(255,157,111,0.9)';
    ctx.fillText(`max |error| = ${mx.toExponential(2)}`, px + 8, py + 13);
    ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText('x', px + pw / 2, py + ph + 14);
  } else {
    const consName = st.eq === 'schrodinger' ? 'norm  integral |psi|^2' : 'energy  integral u^2';
    panel(x, y, w, h, `conserved quantity vs time: ${consName}`);
    const px = x + 50, py = y + 24, pw = w - 64, ph = h - 46;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
    if (st.hist.length > 1) {
      // FIXED physically-meaningful y-range so a truly conserved
      // quantity reads as a flat line (not amplified machine noise)
      const yLo = st.eq === 'schrodinger' ? 0.0 : 0.0;
      const yHi = st.eq === 'schrodinger' ? 1.2 : st.hist[0] * 1.08;
      const Yv = (v) => py + ph * (1 - (v - yLo) / (yHi - yLo));
      if (st.eq === 'schrodinger') {                        // reference at norm = 1
        ctx.strokeStyle = 'rgba(155,232,176,0.35)'; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(px, Yv(1)); ctx.lineTo(px + pw, Yv(1)); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.strokeStyle = st.eq === 'schrodinger' ? '#9be8b0' : '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
      st.hist.forEach((v, i) => {
        const xx = px + pw * i / (st.hist.length - 1);
        if (i === 0) ctx.moveTo(xx, Yv(v)); else ctx.lineTo(xx, Yv(v));
      });
      ctx.stroke();
      ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 4, py + 3, 250, 14);
      ctx.fillStyle = 'rgba(220,228,245,0.85)'; ctx.font = '11px monospace';
      ctx.fillText(st.eq === 'schrodinger'
        ? `norm = ${st.hist[st.hist.length - 1].toFixed(6)} (unitary: stays flat at 1)`
        : `energy ${st.hist[0].toFixed(3)} -> ${st.hist[st.hist.length - 1].toFixed(3)} (viscous decay)`,
      px + 8, py + 13);
    }
    ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '11px monospace';
    ctx.fillText('time ->', px + pw / 2 - 16, py + ph + 14);
  }
}

function drawInfo(x, y, w, h) {
  panel(x, y, w, h, 'equation, scheme and what is conserved');
  const INFO = {
    wave: ['u_tt = c^2 u_xx, fixed ends', 'explicit leapfrog, CFL c dt/dx <= 1',
      'energy stays bounded (oscillates)', 'numeric tracks the exact standing mode'],
    heat: ['u_t = alpha u_xx, fixed ends', 'Crank-Nicolson (shared tridiag)',
      'mode decays as e^{-alpha k^2 t}', 'unconditionally stable'],
    laplace: ['u_xx = -f, Dirichlet u(0)=u(L)=0', 'tridiagonal direct solve',
      'matches sin(k x)/k^2 exactly', 'steady: no time evolution'],
    schrodinger: ['i psi_t = -1/2 psi_xx (free)', 'Crank-Nicolson (shared complex tridiag)',
      'norm integral |psi|^2 is conserved', 'the packet spreads (dispersion)'],
    burgers: ['u_t + u u_x = nu u_xx, periodic', 'conservative explicit flux + diffusion',
      'integral of u conserved; u^2 decays', 'the 1D Navier-Stokes analogue'],
  };
  const rows = INFO[st.eq];
  ctx.font = '12px monospace';
  rows.forEach((r, i) => {
    ctx.fillStyle = i === 0 ? '#6fb4ff' : 'rgba(220,228,245,0.85)';
    ctx.fillText((i === 0 ? '' : '- ') + r, x + 14, y + 38 + i * 24);
  });
  ctx.fillStyle = 'rgba(155,232,176,0.8)'; ctx.font = '11px monospace';
  ctx.fillText('see also the standalone Laplace, TDSE and', x + 14, y + h - 26);
  ctx.fillText('Navier-Stokes hero playgrounds', x + 14, y + h - 12);
}

// Space-time waterfall: render the circular-buffer field rows as a
// heatmap. x is the spatial axis, y is time (newest row at the top).
// The colormap maps signed values (waveuvering wave amplitudes,
// Burgers shocks, Schrödinger densities) to a red-blue diverging
// scale (or a single-sided heat for non-negative fields).
function drawWaterfall(x, y, w, h) {
  panel(x, y, w, h, st.eq === 'laplace' ? 'space-time view (Poisson is steady; not applicable)' : 'space-time view  (rows = time, newest at top)');
  if (st.eq === 'laplace') return;
  const px = x + 36, py = y + 24, pw = w - 50, ph = h - 46;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  // Find dynamic range over the buffer.
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < waterfall.length; i += 1) {
    const v = waterfall[i];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi === lo) { hi = 1; lo = -1; }
  const isSigned = lo < 0;
  // Render the rows.
  const img = ctx.createImageData(N, WATERFALL_ROWS);
  for (let r = 0; r < WATERFALL_ROWS; r += 1) {
    // Newest row at the top -> read circular buffer in time-reverse.
    const src = ((waterfallRow - 1 - r) + WATERFALL_ROWS) % WATERFALL_ROWS;
    const off = src * N;
    for (let i = 0; i < N; i += 1) {
      const v = waterfall[off + i];
      let R, G, B;
      if (isSigned) {
        const t = (v - lo) / (hi - lo);     // 0..1
        // Diverging: blue (cold) -> white -> red (hot).
        if (t < 0.5) {
          const u = t / 0.5;
          R = Math.round(40 + 215 * u); G = Math.round(60 + 195 * u); B = 255;
        } else {
          const u = (t - 0.5) / 0.5;
          R = 255; G = Math.round(255 - 195 * u); B = Math.round(255 - 215 * u);
        }
      } else {
        const t = Math.max(0, Math.min(1, v / hi));
        // Single-sided: dark -> warm orange.
        R = Math.round(40 + 215 * t); G = Math.round(50 + 100 * t); B = Math.round(70 - 60 * t);
      }
      const idx = (r * N + i) * 4;
      img.data[idx] = R; img.data[idx + 1] = G; img.data[idx + 2] = B; img.data[idx + 3] = 255;
    }
  }
  // Composite via offscreen canvas to scale to panel size.
  const off = new OffscreenCanvas(N, WATERFALL_ROWS);
  off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, px, py, pw, ph);
  ctx.imageSmoothingEnabled = true;
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 235, 0.65)'; ctx.font = '11px monospace';
  ctx.fillText('x ->', px + pw - 30, py + ph + 12);
  ctx.fillText('t (newest at top)', px + 4, py - 4);
  // Colorbar.
  const cbx = x + w - 14, cby = py, cbw = 8, cbh = ph;
  for (let r = 0; r < cbh; r += 1) {
    const t = r / cbh;
    let R, G, B;
    if (isSigned) {
      if (t < 0.5) { const u = t / 0.5; R = Math.round(40 + 215 * u); G = Math.round(60 + 195 * u); B = 255; }
      else { const u = (t - 0.5) / 0.5; R = 255; G = Math.round(255 - 195 * u); B = Math.round(255 - 215 * u); }
    } else {
      R = Math.round(40 + 215 * t); G = Math.round(50 + 100 * t); B = Math.round(70 - 60 * t);
    }
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.fillRect(cbx, py + cbh - 1 - r, cbw, 1);
  }
  ctx.fillStyle = 'rgba(200, 210, 235, 0.8)'; ctx.font = '11px monospace';
  ctx.fillText(hi.toFixed(2), cbx - 4, py + 8);
  ctx.fillText(lo.toFixed(2), cbx - 4, py + cbh - 2);
}

// Click the main 1D plot to inject a Gaussian bump into the current
// field. Gives the user a direct way to perturb the simulation and
// see how each PDE redistributes the energy.
function injectBump(xFrac) {
  if (!st.sim) return;
  const widthCells = 8;
  const center = Math.round(xFrac * (N - 1));
  if (st.eq === 'wave' || st.eq === 'heat' || st.eq === 'burgers') {
    const u = st.sim.u;
    for (let i = 0; i < N; i += 1) {
      const d = i - center;
      u[i] += 0.6 * Math.exp(-d * d / (2 * widthCells * widthCells));
    }
  } else if (st.eq === 'schrodinger') {
    // Add a Gaussian to the real part (phase 0).
    for (let i = 0; i < N; i += 1) {
      const d = i - center;
      st.sim.re[i] += 0.4 * Math.exp(-d * d / (2 * widthCells * widthCells));
    }
  }
}
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const cx = (e.clientX - r.left) * (W / r.width);
  const cy = (e.clientY - r.top) * (H / r.height);
  const half = (W - 52) / 2;
  // Inject only when the user clicks inside the main field-plot panel.
  if (cx >= 20 && cx <= 20 + half && cy >= 20 && cy <= 20 + (H - 46) / 2) {
    const px = 56;        // approximately matches plot() interior offset.
    const pw = half - 56;
    const xFrac = Math.max(0, Math.min(1, (cx - 20 - px) / pw));
    injectBump(xFrac);
  }
});

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  const halfH = (H - 46) / 2;
  drawMain(20, 20, half, halfH);
  drawWaterfall(20, 20 + halfH + 6, half, halfH);
  drawSecondary(20 + half + 12, 20, half, halfH);
  drawInfo(20 + half + 12, 20 + halfH + 6, half, halfH);
  rEq.textContent = st.eq;
  if (st.eq === 'laplace') {
    rT.textContent = 'steady';
    rErr.textContent = maxError(st.steady.u, poissonAnalytic(st.steady.x, st.p)).toExponential(2);
    rCons.textContent = 'BVP solved';
  } else {
    rT.textContent = st.sim.t.toFixed(3);
    const a = analytic();
    rErr.textContent = a ? maxError(curve(), a).toExponential(2) : 'n/a';
    rCons.textContent = st.eq === 'wave' ? `E=${waveEnergy(st.sim).toFixed(3)}`
      : st.eq === 'heat' ? `peak=${Math.max(...st.sim.u).toFixed(3)}`
        : st.eq === 'schrodinger' ? `norm=${schrodingerNorm(st.sim).toFixed(5)}`
          : `mass=${burgersIntegral(st.sim).toExponential(1)}`;
  }
}

function tick() {
  if (st.running && st.eq !== 'laplace') {
    for (let k = 0; k < 6; k += 1) substep();
    pushWaterfall(curve());
    if (st.eq === 'schrodinger') st.hist.push(schrodingerNorm(st.sim));
    else if (st.eq === 'burgers') st.hist.push(burgersEnergy(st.sim));
    if (st.hist.length > 240) st.hist.shift();
    if (looped()) build();                                  // clean loop
  }
  draw();
  requestAnimationFrame(tick);
}

function sync() { vP.textContent = String(st.p); }
selE.addEventListener('change', () => { st.eq = selE.value; build(); draw(); });
slP.addEventListener('input', () => { vP.textContent = slP.value; });
slP.addEventListener('change', () => { st.p = parseInt(slP.value, 10); build(); draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true; selE.value = DEF.eq; slP.value = String(DEF.p);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); build(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { eq: st.eq, p: String(st.p) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.eq) { st.eq = s.eq; selE.value = s.eq; }
  if (s.p) { st.p = parseInt(s.p, 10); slP.value = s.p; }
}

function boot() {
  restoreState(); build();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    if (st.eq !== 'laplace') {
      const target = fr * (st.eq === 'wave' ? 1.6 / st.p : st.eq === 'heat' ? 5 : st.eq === 'schrodinger' ? 0.05 : 0.4);
      while (st.sim.t < target) substep();
      if (st.eq === 'schrodinger') st.hist.push(schrodingerNorm(st.sim));
      else if (st.eq === 'burgers') st.hist.push(burgersEnergy(st.sim));
    }
    draw();
  } else { draw(); }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
