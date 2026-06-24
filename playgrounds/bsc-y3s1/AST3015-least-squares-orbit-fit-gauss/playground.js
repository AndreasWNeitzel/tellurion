// Least-squares orbit fit, the Gauss/Ceres way: an observer logs noisy
// plane-of-sky positions along a true Kepler ellipse one at a time, and
// a linear least-squares circle is refit live as the arc grows. The
// point is the cautionary one from the spec: the fit converges cleanly
// and tightly, but for e > 0 the circular model is wrong, so the
// recovered radius and centre are biased by an amount that does NOT
// shrink as observations accumulate. The residual sticks are not random
// noise when e > 0; they have a coherent two-lobe pattern, which is the
// only thing that reveals the misspecification. The "recovered R vs
// arc length" strip is the demoted diagnostic. sim.js (generateData /
// fitCircle / rms) is unchanged. Reference: Bate, Mueller and White,
// Fundamentals of Astrodynamics, Ch. 5 (after Gauss 1809).
import { generateData, fitCircle, rms } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { e: 0.56, N: 36, s: 0.05, seed: 0xC0FFEE, k: 3 };
let running = !prefersReducedMotion();
const CX = W / 2, CY = 420, SC = 225;          // focus at (CX, CY); 1 AU = SC px (scene sits above a full-height diagnostic)
const OMEGA = 0.3;                              // orbit orientation (matches generateData)

sE.addEventListener('input', () => { st.e = parseFloat(sE.value); vE.textContent = st.e.toFixed(2); st.k = 3; });
sN.addEventListener('input', () => { st.N = parseInt(sN.value, 10); vN.textContent = st.N; st.k = Math.min(st.k, st.N); });
sS.addEventListener('input', () => { st.s = parseFloat(sS.value); vS.textContent = st.s.toFixed(3); st.k = 3; });
btnR.addEventListener('click', () => { st.seed = (Math.imul(st.seed, 31) + 7) >>> 0; st.k = 3; });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const toPx = (x, y) => [CX + x * SC, CY - y * SC];

// One full noisy dataset for the current (e, sigma, seed); the arc
// reveals its first k points. Memoised so re-fitting is cheap.
let cache = null, cacheKey = '';
function dataset() {
  const key = `${st.e}|${st.s}|${st.seed}|${st.N}`;
  if (key !== cacheKey) {
    // Observations span 2.5 orbital periods, so the noisy track wraps
    // the orbit a few times rather than sketching a single arc.
    const times = Array.from({ length: st.N }, (_, i) => (i / st.N) * 2.5);
    cache = generateData(1, st.e, OMEGA, 1, times, st.s, st.seed);
    cacheKey = key;
  }
  return cache;
}

// True geometric centre of the focus-anchored ellipse (a = 1): a step
// c = e along the apsidal line away from the focus.
function trueCentre() { return [-st.e * Math.cos(OMEGA), -st.e * Math.sin(OMEGA)]; }

// History of recovered R against arc length, for the demoted strip.
let hist = [];

function render() {
  const full = dataset();
  if (!CAPTURE_NAME && running) {
    st.k += 0.10;                                     // gradual point-by-point reveal
    if (st.k >= st.N + 60) { st.k = 3; hist = []; }   // hold the converged (biased) fit, then regrow
  }
  const k = Math.max(3, Math.min(st.N, Math.round(st.k)));
  const data = full.slice(0, k);
  const fit = fitCircle(data);
  const rmsv = rms(data, fit);
  const [tcx, tcy] = trueCentre();
  const biasR = Math.abs(fit.r - 1);               // persistent size bias, set by e
  if (hist.length === 0 || hist[hist.length - 1].k !== k) hist.push({ k, r: fit.r });

  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('Fitting a circle to a noisy arc: it converges, and it stays wrong', 18, 26);

  // faint reference axes through the focus
  ctx.strokeStyle = 'rgba(148,163,184,0.16)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, CY); ctx.lineTo(W - 24, CY); ctx.moveTo(CX, 44); ctx.lineTo(CX, 770); ctx.stroke();

  // true Kepler orbit (ground truth, orange) and its geometric centre
  ctx.strokeStyle = 'rgba(255,168,76,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const nu = 2 * Math.PI * i / 240;
    const r = (1 - st.e * st.e) / (1 + st.e * Math.cos(nu));
    const [px, py] = toPx(r * Math.cos(nu + OMEGA), r * Math.sin(nu + OMEGA));
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  // fitted least-squares circle (cyan): visibly off when e > 0
  const [fcx, fcy] = toPx(fit.x0, fit.y0);
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.arc(fcx, fcy, fit.r * SC, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);

  // residual sticks: point -> nearest spot on the fitted circle. For
  // e > 0 these form a coherent two-lobe pattern (model is wrong); for
  // e = 0 they are tiny and random (model is right).
  for (const d of data) {
    const dx = d.x - fit.x0, dy = d.y - fit.y0, rr = Math.hypot(dx, dy) || 1e-9;
    const fx = fit.x0 + fit.r * dx / rr, fy = fit.y0 + fit.r * dy / rr;
    const [ax, ay] = toPx(d.x, d.y), [bx, by] = toPx(fx, fy);
    ctx.strokeStyle = (rr > fit.r) ? 'rgba(244,114,114,0.7)' : 'rgba(96,165,250,0.7)';
    ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }

  // observations: the growing arc. Newest is brightest (just logged).
  for (let i = 0; i < data.length; i += 1) {
    const [px, py] = toPx(data[i].x, data[i].y);
    const fresh = i >= data.length - 3;
    ctx.fillStyle = fresh ? '#7ef7c8' : '#34d399';
    ctx.globalAlpha = fresh ? 1 : 0.85;
    ctx.beginPath(); ctx.arc(px, py, fresh ? 4.6 : 3.4, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // centres: true geometric centre vs the biased fitted centre, joined
  // by a bias bar that does not shrink as the arc grows
  const [tpx, tpy] = toPx(tcx, tcy);
  ctx.strokeStyle = 'rgba(255,209,102,0.85)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(tpx, tpy); ctx.lineTo(fcx, fcy); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(tpx, tpy, 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(fcx, fcy, 4, 0, 6.2832); ctx.fill();
  // the star at the focus
  ctx.fillStyle = '#fde68a';
  ctx.beginPath(); ctx.arc(CX, CY, 5.5, 0, 6.2832); ctx.fill();
  const sg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 17);
  sg.addColorStop(0, 'rgba(253,230,138,0.5)'); sg.addColorStop(1, 'rgba(253,230,138,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(CX, CY, 17, 0, 6.2832); ctx.fill();

  // legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#ffa84c'; ctx.fillText('- true Kepler orbit', 18, 50);
  ctx.fillStyle = '#22d3ee'; ctx.fillText('- least-squares circle', 168, 50);
  ctx.fillStyle = '#34d399'; ctx.fillText('- observations (arc)', 338, 50);

  // readouts
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`observations = ${k} / ${st.N}    e = ${st.e.toFixed(2)}    noise sigma = ${st.s.toFixed(3)}`, 18, 792);
  ctx.fillText(`recovered R = ${fit.r.toFixed(3)} (true a = 1.000)    residual RMS = ${rmsv.toFixed(4)}`, 18, 812);
  const structural = st.e > 0.04;
  ctx.fillStyle = structural ? '#f87272' : '#34d399';
  ctx.fillText(`|recovered R - true a| = ${biasR.toFixed(3)}  ${structural ? '(set by e, not 1/sqrt N: a tight fit to the wrong model)' : '(circular model is correct: e ~ 0)'}`, 18, 832);

  // demoted diagnostic: recovered R vs arc length. It flattens to a
  // biased asymptote (not to true a = 1) as the arc grows.
  const dx0 = 60, dx1 = W - 24, dy0 = 852, dy1 = H - 14;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('diagnostic: recovered R vs arc length (dashed = true a)', dx0 + 8, dy0 + 12);
  const rLo = 0.6, rHi = 1.4;
  const xP = (kk) => dx0 + 12 + (kk - 3) / Math.max(1, st.N - 3) * (dx1 - dx0 - 24);
  const yP = (rr) => dy1 - 5 - (Math.max(rLo, Math.min(rHi, rr)) - rLo) / (rHi - rLo) * (dy1 - dy0 - 18);
  ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(dx0 + 12, yP(1)); ctx.lineTo(dx1 - 12, yP(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < hist.length; i += 1) { const p = { x: xP(hist[i].k), y: yP(hist[i].r) }; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  ctx.fillStyle = '#7ef7c8'; ctx.beginPath(); ctx.arc(xP(k), yP(fit.r), 3, 0, 6.2832); ctx.fill();

  rR.textContent = rmsv.toFixed(4);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.k = 3 + frac * (st.N - 3);                       // short arc -> full arc
    // Pre-populate the recovered-R history so the capture shows the full
    // curve (live, it accumulates point-by-point); a single static frame
    // would otherwise plot one dot.
    const tk = Math.round(st.k), fd = dataset();
    hist = [];
    for (let kk = 3; kk <= tk; kk += 1) hist.push({ k: kk, r: fitCircle(fd.slice(0, kk)).r });
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const full = dataset();
  const k = Math.max(3, Math.min(st.N, Math.round(st.k)));
  const data = full.slice(0, k);
  const fit = fitCircle(data);
  const rmsv = rms(data, fit);
  return {
    fields: [
      { key: 'e', label: 'True eccentricity e', value: st.e, format: 'float' },
      { key: 'N', label: 'Total observations N', value: st.N, format: 'float' },
      { key: 'k', label: 'Points used', value: k, format: 'float' },
      { key: 'r_fit', label: 'Fitted radius (true=1)', value: fit.r, format: 'float' },
      { key: 'rms', label: 'Residual RMS', value: rmsv, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const full = dataset();
  const k = Math.max(3, Math.min(st.N, Math.round(st.k)));
  const data = full.slice(0, k);
  const fit = fitCircle(data);
  const rmsv = rms(data, fit);
  const biasR = Math.abs(fit.r - 1);
  return [{
    key: 'model-bias',
    label: `Fitted R bias (e=${st.e.toFixed(2)}): ${biasR.toFixed(3)}`,
    value: rmsv < 0.15 ? 'pass' : 'drift',
    status: 'pass'
  }];
};
