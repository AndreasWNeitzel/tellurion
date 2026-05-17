// Fabry-Perot etalon spectrometer (Canvas2D). Transmitted intensity
// of the sodium doublet as the plate spacing is scanned: the Airy
// comb of each line and their sum. Raising the reflectance sharpens
// the peaks until the doublet splits. Static (recomputed per control
// change). sim.js is the gate-tested closed-form engine.

import {
  airyT, phase, reflFinesse, fsrNm, resolvingPower, resolves, NA_D2,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rFin = document.getElementById('readout-fin');
const rRp = document.getElementById('readout-rp');
const rFsr = document.getElementById('readout-fsr');
const rNeed = document.getElementById('readout-need');
const rRes = document.getElementById('readout-res');

const sR = document.getElementById('slider-r'), vR = document.getElementById('value-r');
const sD = document.getElementById('slider-d'), vD = document.getElementById('value-d');
const sDL = document.getElementById('slider-dl'), vDL = document.getElementById('value-dl');
const bR = document.getElementById('btn-reset');

const st = { R: 0.6, d_um: 80, dl: 0.60 };
const PX0 = 60, PX1 = W - 28, PY0 = 36, PY1 = H - 52;

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const lam1 = NA_D2 * 1e-9;                       // D2 (fixed)
  const lam2 = (NA_D2 + st.dl) * 1e-9;             // second line
  const d0 = st.d_um * 1e-6;
  const win = 1.6 * (NA_D2 * 1e-9) / 2;            // about 3 orders wide
  const dA = d0 - win, dB = d0 + win;
  const xOf = (d) => PX0 + (d - dA) / (dB - dA) * (PX1 - PX0);
  const yOf = (T) => PY1 - T * (PY1 - PY0);

  // axes
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.fillText('plate spacing  d  (scanned, micrometres)', (PX0 + PX1) / 2, H - 16);
  ctx.save(); ctx.translate(22, (PY0 + PY1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('transmittance  T', 0, 0); ctx.restore();
  ctx.textAlign = 'right';
  for (let g = 0; g <= 4; g += 1) {
    const yy = PY1 - (g / 4) * (PY1 - PY0);
    ctx.strokeStyle = 'rgba(120,130,150,0.15)'; ctx.beginPath(); ctx.moveTo(PX0, yy); ctx.lineTo(PX1, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(150,160,180,0.5)'; ctx.fillText((g / 4).toFixed(2), PX0 - 6, yy + 4);
  }

  const NP = 900;
  const drawCurve = (lam, color, lw) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i <= NP; i += 1) {
      const d = dA + (i / NP) * (dB - dA);
      const T = airyT(phase(lam, d), st.R);
      const X = xOf(d), Y = yOf(T);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  // sum first (so the individual lines sit on top), scaled by 1/2 to
  // keep it in [0,1]
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i <= NP; i += 1) {
    const d = dA + (i / NP) * (dB - dA);
    const T = 0.5 * (airyT(phase(lam1, d), st.R) + airyT(phase(lam2, d), st.R));
    const X = xOf(d), Y = yOf(T);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  drawCurve(lam1, '#ef476f', 2);
  drawCurve(lam2, '#5bc0eb', 2);

  // legend
  ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#ef476f'; ctx.fillText('D2 588.995 nm', PX1 - 200, PY0 + 14);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`line 2 (+${st.dl.toFixed(2)} nm)`, PX1 - 200, PY0 + 31);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('sum / 2', PX1 - 200, PY0 + 48);

  const Fstar = reflFinesse(st.R);
  const Rp = resolvingPower(lam1, d0, st.R);
  const info = resolves(NA_D2, st.dl, d0, st.R);
  rFin.textContent = Fstar.toFixed(1);
  rRp.textContent = Math.round(Rp).toString();
  rFsr.textContent = fsrNm(NA_D2, d0).toFixed(3);
  rNeed.textContent = Math.round(info.need).toString();
  rRes.textContent = info.resolved ? 'yes' : 'no';
}

function syncLabels() { vR.textContent = st.R.toFixed(2); vD.textContent = String(st.d_um); vDL.textContent = st.dl.toFixed(2); }
sR.addEventListener('input', () => { st.R = parseFloat(sR.value); syncLabels(); render(); });
sD.addEventListener('input', () => { st.d_um = parseInt(sD.value, 10); syncLabels(); render(); });
sDL.addEventListener('input', () => { st.dl = parseFloat(sDL.value); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.R = 0.6; st.d_um = 80; st.dl = 0.60;
  sR.value = '0.6'; sD.value = '80'; sDL.value = '0.6'; syncLabels(); render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.R = 0.10 + f * 0.88;                         // low -> high R: doublet splits
    sR.value = String(st.R);
    syncLabels();
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
