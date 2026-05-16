import { bindingEnergy, pairWavefunction } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sV = document.getElementById('slider-V'), vV = document.getElementById('value-V');
const sN = document.getElementById('slider-N'), vN = document.getElementById('value-N');
const sOD = document.getElementById('slider-OD'), vOD = document.getElementById('value-OD');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { V: 0.3, N0: 1.0, omega_D: 1.0 };
let running = true;

sV.addEventListener('input', () => { st.V = parseFloat(sV.value); vV.textContent = st.V.toFixed(2); });
sN.addEventListener('input', () => { st.N0 = parseFloat(sN.value); vN.textContent = st.N0.toFixed(2); });
sOD.addEventListener('input', () => { st.omega_D = parseFloat(sOD.value); vOD.textContent = st.omega_D.toFixed(2); });
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
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('log10(E_b / hω_D)', x0 + 8, y0 + pad.t - 5);
  ctx.save();
  ctx.translate(x0 + 10, y0 + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('N(0)V', 0, 0);
  ctx.restore();

  const xToPx = (n) => x0 + pad.l + (n - 0.05) / 0.95 * (w - pad.l - pad.r);
  const minLog = -20, maxLog = 0;
  const yToPx = (l) => y0 + h - pad.b - (l - minLog) / (maxLog - minLog) * (h - pad.t - pad.b);

  ctx.strokeStyle = '#7fb3d5';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const n = 0.05 + 0.95 * i / 200;
    const E = bindingEnergy(n);
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
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.fillText(`E_b = ${Ecur.toExponential(2)} hω_D`, x0 + pad.l, y0 + h - 12);

  rE.textContent = Ecur.toExponential(2);
}

function renderRightPanel(x0, y0, w, h) {
  ctx.fillStyle = '#1a1a1d';
  ctx.fillRect(x0, y0, w, h);

  const N0V = st.N0 * st.V;
  const Ecur = bindingEnergy(N0V, st.omega_D);
  // The pair amplitude g(xi) ~ 1 / (2|xi| + E_b) has characteristic
  // width ~ E_b, which is exponentially smaller than the Debye cutoff.
  // Zoom the axis to a few E_b so the peak and its coupling-dependent
  // broadening are visible instead of an invisible spike in a void.
  const xi_max = Math.min(st.omega_D, Math.max(8 * Ecur, 1e-4 * st.omega_D));

  const pad = { l: 40, r: 20, t: 30, b: 40 };
  ctx.strokeStyle = '#9aa0a6';
  ctx.beginPath();
  ctx.moveTo(x0 + pad.l, y0 + pad.t);
  ctx.lineTo(x0 + pad.l, y0 + h - pad.b);
  ctx.lineTo(x0 + w - pad.r, y0 + h - pad.b);
  ctx.stroke();

  ctx.fillStyle = '#9aa0a6';
  ctx.font = '9px ui-monospace, monospace';
  ctx.fillText('|g(ξ)|', x0 + 8, y0 + pad.t - 3);
  ctx.fillText('ξ (zoomed to ~E_b)', x0 + w - 110, y0 + h - pad.b + 12);

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
  ctx.font = '9px ui-monospace, monospace';
  ctx.fillText('FWHM ~ E_b (broadens with coupling)', x0 + pad.l + 5, y0 + pad.t + 15);
}

function tick() {
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
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
