import { bindingEnergy, pairWavefunction } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sV = document.getElementById('slider-V'), vV = document.getElementById('value-V');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sOD = document.getElementById('slider-OD'), vOD = document.getElementById('value-OD');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { V: 0.3, N0: 1.0, omega_D: 1.0 };
let running = !prefersReducedMotion();

sV.addEventListener('input', () => { st.V = parseFloat(sV.value); vV.textContent = st.V.toFixed(2); render(); });
sN.addEventListener('input', () => { st.N0 = parseFloat(sN.value); vN.textContent = st.N0.toFixed(2); render(); });
sOD.addEventListener('input', () => { st.omega_D = parseFloat(sOD.value); vOD.textContent = st.omega_D.toFixed(2); render(); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width, H = canvas.height;
  const gapX = 10;
  const leftW = (W - gapX) / 2;
  const rightW = (W - gapX) / 2;

  renderLeftPanel(leftW, H);
  renderRightPanel(leftW + gapX, 0, rightW, H);
}

function renderLeftPanel(w, h) {
  const pad = { l: 60, r: 20, t: 30, b: 50 };
  const x0 = 0, y0 = 0;

  ctx.strokeStyle = '#9aa0a6';
  ctx.beginPath();
  ctx.moveTo(x0 + pad.l, y0 + pad.t);
  ctx.lineTo(x0 + pad.l, y0 + h - pad.b);
  ctx.lineTo(x0 + w - pad.r, y0 + h - pad.b);
  ctx.stroke();

  ctx.fillStyle = '#9aa0a6';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('E', x0 + 8, y0 + pad.t - 5);
  ctx.save();
  ctx.translate(x0 - 2, y0 + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.fillText('ρV', 0, 0);
  ctx.restore();

  const xToPx = (n) => x0 + pad.l + (n - 0.05) / 0.95 * (w - pad.l - pad.r);
  const minLog = -20, maxLog = 1;     // headroom: E_b can exceed 1 at large omega_D
  const yToPx = (l) => y0 + h - pad.b - (l - minLog) / (maxLog - minLog) * (h - pad.t - pad.b);

  ctx.strokeStyle = '#7fb3d5';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const n = 0.05 + 0.95 * i / 200;
    // Pass omega_D so the whole E_b(N0V) curve shifts with the Debye
    // slider (E_b ~ omega_D). Previously it used the sim default, so the
    // dominant left-panel curve was omega_D-independent and the slider
    // read as dead.
    const E = bindingEnergy(n, st.omega_D);
    const l = Math.log10(Math.max(E, 1e-30));
    const px = xToPx(n), py = yToPx(l);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  const N0V = st.N0 * st.V;
  const Ecur = bindingEnergy(N0V, st.omega_D);
  const lcur = Math.log10(Math.max(Ecur, 1e-30));
  const curX = xToPx(N0V), curY = yToPx(lcur);

  ctx.fillStyle = '#06d6a0';
  ctx.beginPath();
  ctx.arc(curX, curY, 6, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#06d6a0';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText(`E_b = ${Ecur.toExponential(2)}`, x0 + pad.l, y0 + h - 12);

  rE.textContent = Ecur.toExponential(2);
}

function renderRightPanel(x0, y0, w, h) {
  ctx.fillStyle = '#1a1a1d';
  ctx.fillRect(x0, y0, w, h);

  const N0V = st.N0 * st.V;
  const Ecur = bindingEnergy(N0V, st.omega_D);
  // FIXED xi window (absolute hbar*omega_D units). Auto-zooming to a few
  // E_b made the plot self-similar, so the peak looked identical for
  // every omega_D / coupling and the sliders read as dead. With a fixed
  // window the peak visibly broadens as E_b ~ omega_D exp(-1/N0V) grows
  // and narrows as it shrinks.
  const xi_max = 0.12;

  const pad = { l: 40, r: 20, t: 30, b: 40 };
  ctx.strokeStyle = '#9aa0a6';
  ctx.beginPath();
  ctx.moveTo(x0 + pad.l, y0 + pad.t);
  ctx.lineTo(x0 + pad.l, y0 + h - pad.b);
  ctx.lineTo(x0 + w - pad.r, y0 + h - pad.b);
  ctx.stroke();

  ctx.fillStyle = '#9aa0a6';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('|g(ξ)|', x0 + 8, y0 + pad.t - 3);
  ctx.textAlign = 'right';
  ctx.fillText('ξ / ℏω_D', x0 + w - 20, y0 + h - pad.b + 12);

  const xToPx = (xi) => x0 + pad.l + (xi + xi_max) / (2 * xi_max) * (w - pad.l - pad.r);
  const maxG = 1 / Math.max(Math.abs(0 + Ecur), 1e-6) * 1.5;
  const yToPx = (g) => y0 + h - pad.b - Math.min(g, maxG) / maxG * (h - pad.t - pad.b);

  ctx.strokeStyle = '#ffa86a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 150; i++) {
    const xi = -xi_max + 2 * xi_max * i / 150;
    const g = pairWavefunction(xi, Ecur);
    const px = xToPx(xi), py = yToPx(g);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.strokeStyle = '#9aa0a6';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xToPx(0), y0 + pad.t);
  ctx.lineTo(xToPx(0), y0 + h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#9aa0a6';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('FWHM ~ E_b (broadens with coupling)', x0 + pad.l + 5, y0 + pad.t + 15);
}

function tick() {
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // Sweep the pairing coupling so the five frames show the binding
    // energy growing exponentially with the interaction strength.
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.V = 0.15 + frac * 0.55;
    sV.value = String(st.V); vV.textContent = st.V.toFixed(2);
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', {
          detail: { capture: CAPTURE_NAME ?? null }
        }));
      })
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const N0V = st.N0 * st.V;
  const Eb = bindingEnergy(N0V, st.omega_D);
  return { fields: [
    { key: 'coupling', label: 'N(0)V', value: N0V, format: 'float' },
    { key: 'debye-freq', label: 'hbar*omega_D', value: st.omega_D, format: 'float' },
    { key: 'binding-energy', label: 'E_b (hbar*omega_D)', value: Eb, format: 'float' },
    { key: 'binding-log', label: 'log10(E_b)', value: Math.log10(Math.max(Eb, 1e-30)), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const N0V = st.N0 * st.V;
  const Eb = bindingEnergy(N0V, st.omega_D);

  // Invariant 1: Binding energy must be positive and decrease exponentially with N(0)V
  // E_b = 2 hbar omega_D exp(-2 / (N(0)V))
  // For N(0)V approaching 0, E_b -> 0; for large N(0)V, E_b -> 2*omega_D
  const EbPositive = Eb > 0;
  const EbMaxed = Eb <= 2 * st.omega_D * 1.01;

  // Invariant 2: Verify the formula: exp(-2 / N0V) should match Eb / (2*omega_D)
  const expPart = Math.exp(-2 / Math.max(N0V, 1e-10));
  const ratio = Eb / (2 * st.omega_D);
  const formulaError = Math.abs(ratio - expPart) / Math.max(Math.abs(expPart), 1e-30);

  return [
    { key: 'positivity', label: 'E_b > 0', value: EbPositive ? 'yes' : 'no', status: EbPositive ? 'pass' : 'drift' },
    { key: 'formula', label: 'Formula E_b = 2*hbar*omega_D*exp(-2/N(0)V)', value: formulaError.toExponential(2), status: formulaError < 1e-10 ? 'pass' : formulaError < 1e-6 ? 'drift' : 'pending' },
  ];
};
