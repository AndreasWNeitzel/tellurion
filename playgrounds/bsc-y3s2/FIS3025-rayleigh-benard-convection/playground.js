// Rayleigh-Benard convection: the linear stability of a fluid layer
// heated from below. This renders exactly the physics the engine gate
// proves (shared/js/engine/boussinesq-2d-cpu.js, re-exported by
// sim.js): the free-free neutral curve Ra(k) = (k^2+pi^2)^3/k^2 with
// its exact minimum Ra_c = 27 pi^4 / 4 at k_c = pi/sqrt(2), and the
// critical roll eigenmode growing or decaying as exp(sigma t). No
// fragile nonlinear DNS: the closed-form linear theory is robust,
// deterministic, and is the heart of the Rayleigh-Benard problem.
import { RA_C, K_C, discreteRaC, linearSigma } from './sim.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rRaC = document.getElementById('readout-rac');
const rSig = document.getElementById('readout-sigma');
const rRatio = document.getElementById('readout-ratio');
const rState = document.getElementById('readout-state');
const sRa = document.getElementById('slider-ra'), vRa = document.getElementById('value-ra');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sPr = document.getElementById('slider-pr'), vPr = document.getElementById('value-pr');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const NY = 96;                                       // resolution of the discrete onset
const st = { Ra: 2 * RA_C, k: K_C, Pr: 1, running: !prefersReducedMotion(), amp: 1e-3, t: 0 };

const FW = W, FH = Math.round(H * 0.62);             // roll field panel
const CW = W, CY = FH, CH = H - FH;                  // neutral-curve panel

// Deterministic RNG so tracer seeding is reproducible for the gate.
let _seed = 0xC0FFEE >>> 0;
function rnd() { _seed = (Math.imul(_seed, 1664525) + 1013904223) >>> 0; return _seed / 4294967296; }

const Lx = () => (2 * Math.PI / st.k) * 2;            // domain width: ~2 roll pairs
const NTR = 760;
const trc = new Float32Array(NTR * 2);               // x in [0,Lx], y in [0,1]
function seedTracers() {
  _seed = 0xC0FFEE >>> 0;
  const L = Lx();
  for (let i = 0; i < NTR; i += 1) { trc[2 * i] = rnd() * L; trc[2 * i + 1] = 0.03 + rnd() * 0.94; }
}
seedTracers();

function fieldAmplitude(sigma, dt) {
  // Linear evolution exp(sigma t), saturated for display so the rolls
  // stay visible (a tanh soft clamp; the physics is the sign of sigma).
  st.amp *= Math.exp(sigma * dt);
  st.amp = Math.max(1e-4, Math.min(st.amp, 1e3));
  return Math.tanh(st.amp);                          // 0..1 display amplitude
}

// Linear convective eigenmode stream function psi = S sin(pi y) sin(k x):
// temperature theta ~ sin(pi y) cos(k x), velocity (u, w) = (psi_y, -psi_x).
// Advecting tracers by this divergence-free field makes the counter-
// rotating rolls visibly circulate instead of freezing into a still image.
function vel(x, y, S) {
  const k = st.k;
  return [
    S * Math.PI * Math.cos(Math.PI * y) * Math.sin(k * x),
    -S * k * Math.sin(Math.PI * y) * Math.cos(k * x),
  ];
}
function advect(disp, dt) {
  const S = disp, L = Lx(), h = dt * 1.6;            // visual flow rate
  for (let i = 0; i < NTR; i += 1) {
    let x = trc[2 * i], y = trc[2 * i + 1];
    const [ux, uy] = vel(x, y, S);
    x += ux * h; y += uy * h;
    if (x < 0) x += L; else if (x >= L) x -= L;
    if (y < 0.02 || y > 0.98) { x = rnd() * L; y = 0.03 + rnd() * 0.94; }
    trc[2 * i] = x; trc[2 * i + 1] = y;
  }
}

const BL = 6;                                         // temperature block size (fast paint)
function drawRolls(disp) {
  for (let py = 0; py < FH; py += BL) {
    const y = 1 - py / (FH - 1);
    const vert = Math.sin(Math.PI * y);
    for (let px = 0; px < FW; px += BL) {
      const x = px / FW * Lx();
      const theta = disp * vert * Math.cos(st.k * x);
      const c = viridis(0.5 + 0.5 * Math.max(-1, Math.min(1, theta)));
      ctx.fillStyle = `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
      ctx.fillRect(px, py, BL, BL);
    }
  }
  // tracer streaks: each drawn as a short segment along the local flow
  // so the rolls read as turning fluid (background repaint clears them
  // every frame, so there is no smear).
  const S = disp, L = Lx();
  ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(245,248,255,0.55)';
  ctx.beginPath();
  for (let i = 0; i < NTR; i += 1) {
    const x = trc[2 * i], y = trc[2 * i + 1];
    const [ux, uy] = vel(x, y, S);
    const m = Math.hypot(ux, uy) || 1, sl = 0.05 / m;
    const ax = (x - ux * sl) / L * FW, ay = (1 - (y - uy * sl)) * (FH - 1);
    const bx = (x + ux * sl) / L * FW, by = (1 - (y + uy * sl)) * (FH - 1);
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('cold plate  T = 0', 12, 16);
  ctx.fillText('hot plate  T = 1', 12, FH - 10);
}

function drawNeutralCurve() {
  ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, CY, CW, CH);
  const kMin = 0.6, kMax = 7, raMin = RA_C * 0.5, raMax = RA_C * 8;
  const X = (k) => (k - kMin) / (kMax - kMin) * (CW - 60) + 48;
  const Yv = (ra) => CY + 14 + (1 - (Math.log(ra) - Math.log(raMin)) / (Math.log(raMax) - Math.log(raMin))) * (CH - 30);
  // neutral curve Ra(k) = (k^2+pi^2)^3/k^2
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let p = 0; p <= 240; p += 1) {
    const k = kMin + (kMax - kMin) * p / 240;
    const ra = ((k * k + Math.PI * Math.PI) ** 3) / (k * k);
    const yy = Yv(Math.max(raMin, Math.min(raMax, ra)));
    if (p === 0) ctx.moveTo(X(k), yy); else ctx.lineTo(X(k), yy);
  }
  ctx.stroke();
  // critical point
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(K_C), Yv(RA_C), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Ra_c = 27 pi^4/4 at k_c = pi/sqrt2', X(K_C) - 4, Yv(RA_C) - 8);
  // operating point
  const unstable = linearSigma(NY, st.Ra, st.Pr, st.k) > 0;
  ctx.fillStyle = unstable ? '#ff5a5a' : '#5affa0';
  ctx.beginPath(); ctx.arc(X(st.k), Yv(st.Ra), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('k', CW - 18, CY + CH - 6);
  ctx.fillText('Ra (log)', 6, CY + 14);
  ctx.fillText(unstable ? 'UNSTABLE (above curve): rolls grow'
                        : 'STABLE (below curve): conduction',
    X(st.k) + 10, Yv(st.Ra) + 4);
}

function readout() {
  const sigma = linearSigma(NY, st.Ra, st.Pr, st.k);
  rRaC.textContent = discreteRaC(NY, K_C).toFixed(2) + ' / ' + RA_C.toFixed(2);
  rSig.textContent = sigma.toExponential(2);
  rRatio.textContent = (st.Ra / RA_C).toFixed(2);
  rState.textContent = sigma > 0 ? 'unstable' : 'stable';
  return sigma;
}

function frame(dt) {
  const sigma = readout();
  const disp = fieldAmplitude(sigma, dt);
  drawRolls(disp);
  advect(disp, dt);
  drawNeutralCurve();
}

function tick() {
  if (st.running) { st.t += 0.016; frame(0.016 * 6); }
  else frame(0);
  requestAnimationFrame(tick);
}

function syncLabels() {
  vRa.textContent = (st.Ra / RA_C).toFixed(2) + ' Ra_c';
  vK.textContent = st.k.toFixed(2);
  vPr.textContent = st.Pr.toFixed(1);
}
sRa.addEventListener('input', () => { st.Ra = (parseFloat(sRa.value) / 100) * RA_C; st.amp = 1e-3; syncLabels(); });
sK.addEventListener('input', () => { st.k = parseFloat(sK.value) / 100; st.amp = 1e-3; syncLabels(); });
sPr.addEventListener('input', () => { st.Pr = parseFloat(sPr.value) / 10; syncLabels(); });
bR.addEventListener('click', () => {
  st.Ra = 2 * RA_C; st.k = K_C; st.Pr = 1; st.amp = 1e-3; st.running = true;
  sRa.value = '200'; sK.value = String(Math.round(K_C * 100)); sPr.value = '10';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { rayleigh: (st.Ra / RA_C).toFixed(3), wavenumber: st.k.toFixed(3), prandtl: st.Pr.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.rayleigh) { st.Ra = parseFloat(s.rayleigh) * RA_C; sRa.value = String(Math.round(parseFloat(s.rayleigh) * 100)); }
  if (s.wavenumber) { st.k = parseFloat(s.wavenumber); sK.value = String(Math.round(st.k * 100)); }
  if (s.prandtl) { st.Pr = parseFloat(s.prandtl); sPr.value = String(Math.round(st.Pr * 10)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    // Sweep the Rayleigh number across the critical value at a fixed
    // settling time: below Ra_c the perturbation decays to a flat
    // conducting state, above it convection rolls grow and saturate at
    // an amplitude that increases with Ra - Ra_c. This shows the
    // convective onset (the headline) and is robustly frame-distinct.
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    const raMul = [0.6, 1.05, 1.5, 2.5, 5.0][Math.min(4, Math.round(f * 4))];
    st.Ra = raMul * RA_C; st.k = K_C; st.Pr = 1; st.amp = 1e-2;
    seedTracers();
    const steps = 50 + Math.round(f * 150);            // distinct + reproducible per fraction
    for (let n = 0; n < steps; n += 1) {
      const sg = linearSigma(NY, st.Ra, st.Pr, st.k);
      const dp = fieldAmplitude(sg, 0.016 * 4);
      advect(dp, 0.016 * 4);
    }
    frame(0);
  } else {
    frame(0);
  }
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
