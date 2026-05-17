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
const st = { Ra: 2 * RA_C, k: K_C, Pr: 1, running: true, amp: 1e-3, t: 0 };

const FW = W, FH = Math.round(H * 0.62);             // roll field panel
const CW = W, CY = FH, CH = H - FH;                  // neutral-curve panel

function fieldAmplitude(sigma, dt) {
  // Linear evolution exp(sigma t), saturated for display so the rolls
  // stay visible (a tanh soft clamp; the physics is the sign of sigma).
  st.amp *= Math.exp(sigma * dt);
  st.amp = Math.max(1e-4, Math.min(st.amp, 1e3));
  return Math.tanh(st.amp);                          // 0..1 display amplitude
}

function drawRolls(disp) {
  const img = ctx.getImageData(0, 0, FW, FH);
  const d = img.data;
  for (let py = 0; py < FH; py += 1) {
    const y = 1 - py / (FH - 1);                      // y=0 hot plate at the bottom
    const vert = Math.sin(Math.PI * y);
    for (let px = 0; px < FW; px += 1) {
      const x = px / (FW - 1) * (2 * Math.PI / st.k) * 2;    // ~2 roll pairs across
      const theta = disp * vert * Math.cos(st.k * x);        // eigenmode sin(pi y) cos(k x)
      const c = viridis(0.5 + 0.5 * Math.max(-1, Math.min(1, theta)));
      const o = (py * FW + px) * 4;
      d[o] = c.r; d[o + 1] = c.g; d[o + 2] = c.b; d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // hot/cold plate labels
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '12px monospace';
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
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '11px monospace';
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
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.Ra = 2 * RA_C; st.k = K_C; st.Pr = 1; st.amp = 1e-3;
    for (let n = 0; n < Math.round(f * 90); n += 1) { const sg = linearSigma(NY, st.Ra, st.Pr, st.k); fieldAmplitude(sg, 0.016 * 6); }
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
