// Gaussian-beam ABCD bench (Canvas2D). The beam envelope w(z) is
// drawn along an optical axis through a draggable thin lens; the
// complex q-parameter is propagated by ray-transfer matrices.
// Static (recomputed per control change). sim.js is the gate-tested
// engine.

import {
  qAtWaist, abcdApply, M_free, M_lens, beamRadius, rayleighRange,
  divergence, lensImage,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rZR = document.getElementById('readout-zr');
const rW0o = document.getElementById('readout-w0o');
const rLaw = document.getElementById('readout-law');
const rFoc = document.getElementById('readout-foc');
const rTh = document.getElementById('readout-th');

const sW0 = document.getElementById('slider-w0'), vW0 = document.getElementById('value-w0');
const sF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const sZL = document.getElementById('slider-zl'), vZL = document.getElementById('value-zl');
const sLam = document.getElementById('slider-lam'), vLam = document.getElementById('value-lam');
const bR = document.getElementById('btn-reset');

const ZTOT = 0.6;                                  // 600 mm bench
const st = { w0_um: 200, f_mm: 120, zL_mm: 250, lam_nm: 1064 };

const AX0 = 40, AX1 = W - 28, AYC = H / 2, AYH = H / 2 - 92;
const xOf = (z) => AX0 + (z / ZTOT) * (AX1 - AX0);

function qAt(z, q0, zL, f) {
  if (z <= zL) return abcdApply(M_free(z), q0);
  return abcdApply(M_free(z - zL), abcdApply(M_lens(f), abcdApply(M_free(zL), q0)));
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const w0 = st.w0_um * 1e-6, f = st.f_mm * 1e-3, zL = st.zL_mm * 1e-3, lam = st.lam_nm * 1e-9;
  const q0 = qAtWaist(w0, lam);

  const NP = 760;
  const ws = new Float64Array(NP + 1);
  let wmax = 1e-12;
  for (let i = 0; i <= NP; i += 1) {
    const z = (i / NP) * ZTOT;
    const w = beamRadius(qAt(z, q0, zL, f), lam);
    ws[i] = w; if (w > wmax) wmax = w;
  }
  const yOf = (w) => (w / wmax) * AYH;

  // optical axis
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(AX0, AYC); ctx.lineTo(AX1, AYC); ctx.stroke();

  // beam envelope (filled)
  ctx.beginPath();
  ctx.moveTo(xOf(0), AYC - yOf(ws[0]));
  for (let i = 1; i <= NP; i += 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC - yOf(ws[i]));
  for (let i = NP; i >= 0; i -= 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC + yOf(ws[i]));
  ctx.closePath();
  ctx.fillStyle = 'rgba(239,71,111,0.22)'; ctx.fill();
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(xOf(0), AYC - yOf(ws[0]));
  for (let i = 1; i <= NP; i += 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC - yOf(ws[i])); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xOf(0), AYC + yOf(ws[0]));
  for (let i = 1; i <= NP; i += 1) ctx.lineTo(xOf((i / NP) * ZTOT), AYC + yOf(ws[i])); ctx.stroke();

  // lens glyph
  const lx = xOf(zL);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(lx, AYC - AYH - 8); ctx.lineTo(lx, AYC + AYH + 8); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`lens f=${st.f_mm} mm`, lx, AYC - AYH - 14);

  // markers: input waist and focused waist
  const img = lensImage(w0, lam, f, zL);
  const zFoc = zL + img.distance;
  ctx.fillStyle = 'rgba(91,192,235,0.95)'; ctx.textAlign = 'left';
  ctx.fillText('w0 in', xOf(0) + 4, AYC - yOf(w0) - 6);
  if (zFoc > 0 && zFoc < ZTOT) {
    const fx = xOf(zFoc);
    ctx.strokeStyle = 'rgba(91,192,235,0.6)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, AYC - AYH); ctx.lineTo(fx, AYC + AYH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5bc0eb'; ctx.textAlign = 'center';
    ctx.fillText(`focus w0'=${(img.w0Out * 1e6).toFixed(1)} um`, fx, AYC + AYH + 22);
  }

  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('optical axis  z  (drag the lens)', (AX0 + AX1) / 2, H - 14);

  // beam size hitting the lens (just before it)
  const wAtLens = beamRadius(abcdApply(M_free(zL), q0), lam);
  rZR.textContent = `${(rayleighRange(w0, lam) * 1e3).toFixed(1)} mm`;
  rW0o.textContent = `${(img.w0Out * 1e6).toFixed(2)} um`;
  rLaw.textContent = `${(lam * f / (Math.PI * wAtLens) * 1e6).toFixed(2)} um`;
  rFoc.textContent = `${(img.distance * 1e3).toFixed(1)} mm`;
  rTh.textContent = `${(divergence(w0, lam) * 1e3).toFixed(2)} mrad`;
}

function syncLabels() {
  vW0.textContent = String(st.w0_um); vF.textContent = String(st.f_mm);
  vZL.textContent = String(st.zL_mm); vLam.textContent = String(st.lam_nm);
}
let dragging = false;
function lensFromX(clientX) {
  const r = canvas.getBoundingClientRect();
  const px = (clientX - r.left) * W / r.width;
  const z = ((px - AX0) / (AX1 - AX0)) * ZTOT * 1e3;
  st.zL_mm = Math.max(50, Math.min(450, Math.round(z / 5) * 5));
  sZL.value = String(st.zL_mm); syncLabels(); render();
}
canvas.addEventListener('mousedown', (e) => { dragging = true; lensFromX(e.clientX); });
canvas.addEventListener('mousemove', (e) => { if (dragging) lensFromX(e.clientX); });
window.addEventListener('mouseup', () => { dragging = false; });

sW0.addEventListener('input', () => { st.w0_um = parseInt(sW0.value, 10); syncLabels(); render(); });
sF.addEventListener('input', () => { st.f_mm = parseInt(sF.value, 10); syncLabels(); render(); });
sZL.addEventListener('input', () => { st.zL_mm = parseInt(sZL.value, 10); syncLabels(); render(); });
sLam.addEventListener('input', () => { st.lam_nm = parseInt(sLam.value, 10); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.w0_um = 200; st.f_mm = 120; st.zL_mm = 250; st.lam_nm = 1064;
  sW0.value = '200'; sF.value = '120'; sZL.value = '250'; sLam.value = '1064'; syncLabels(); render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.f_mm = Math.round((40 + fr * 340) / 5) * 5;     // strong -> weak focusing
    sF.value = String(st.f_mm); syncLabels();
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
