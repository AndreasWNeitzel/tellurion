import { fontString } from '../../../shared/js/canvas-type.js';
// Tight-binding band structure (Canvas2D). 1D / SSH: the dispersion
// E(k) with states filled to E_F and the density of states. 2D: the
// E(kx,ky) heatmap with the Fermi-surface contour. Static
// (recomputed per control change). sim.js is the gate-tested engine.

import {
  E1D, sshBands, sshGap, E2D, dos1D, filling1D, fermiSurface2D,
  effMassBottom,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rLat = document.getElementById('readout-lat');
const rBw = document.getElementById('readout-bw');
const rGap = document.getElementById('readout-gap');
const rEf = document.getElementById('readout-ef');
const rFill = document.getElementById('readout-fill');

const selLat = document.getElementById('select-lat');
const sT = document.getElementById('slider-t'), vT = document.getElementById('value-t');
const sDim = document.getElementById('slider-dim'), vDim = document.getElementById('value-dim');
const sEF = document.getElementById('slider-ef'), vEF = document.getElementById('value-ef');
const bR = document.getElementById('btn-reset');
const rowDim = document.getElementById('row-dim');

const st = { lat: 'ssh', t: 1.0, dim: 0.5, EF: 0 };

// Dimerization only enters the SSH Hamiltonian; for the 1D chain and
// the 2D square it has no effect, so the control is hidden there
// rather than left looking broken.
function applyVis() { rowDim.style.display = st.lat === 'ssh' ? '' : 'none'; }
const PX0 = 60, PX1 = 470, PY0 = 40, PY1 = H - 56;       // dispersion / heatmap box
const DX0 = 520, DX1 = W - 24;                            // DOS box

// Fixed energy axis so the hopping t changes the visible band
// amplitude (an autoscaled axis would hide it).
function dispBounds() { return [-6.5, 6.5]; }

function draw1D() {
  const [eLo, eHi] = dispBounds();
  const xOf = (k) => PX0 + (k + Math.PI) / (2 * Math.PI) * (PX1 - PX0);
  const yOf = (E) => PY1 - (E - eLo) / (eHi - eLo) * (PY1 - PY0);
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('wavevector  k  (-pi .. pi)', (PX0 + PX1) / 2, H - 16);
  ctx.save(); ctx.translate(24, (PY0 + PY1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('energy  E(k)', 0, 0); ctx.restore();
  // E_F line + filled shading
  const yF = yOf(st.EF);
  ctx.fillStyle = 'rgba(91,192,235,0.12)'; ctx.fillRect(PX0, yF, PX1 - PX0, PY1 - yF);
  ctx.strokeStyle = 'rgba(6,214,160,0.8)'; ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(PX0, yF); ctx.lineTo(PX1, yF); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(6,214,160,0.9)'; ctx.textAlign = 'left'; ctx.fillText('E_F', PX1 - 34, yF - 5);

  const bands = st.lat === 'ssh' ? ['plus', 'minus'] : ['one'];
  for (const band of bands) {
    ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.6; ctx.beginPath();
    for (let i = 0; i <= 240; i += 1) {
      const k = -Math.PI + (i / 240) * 2 * Math.PI;
      const E = st.lat === 'ssh' ? sshBands(k, st.t, st.t * st.dim)[band] : E1D(k, st.t);
      const X = xOf(k), Y = yOf(E);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    // mark filled portion in a brighter colour
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.6; ctx.beginPath(); let on = false;
    for (let i = 0; i <= 240; i += 1) {
      const k = -Math.PI + (i / 240) * 2 * Math.PI;
      const E = st.lat === 'ssh' ? sshBands(k, st.t, st.t * st.dim)[band] : E1D(k, st.t);
      if (E <= st.EF) { const X = xOf(k), Y = yOf(E); if (!on) { ctx.moveTo(X, Y); on = true; } else ctx.lineTo(X, Y); }
      else on = false;
    }
    ctx.stroke();
  }

  // DOS panel (1D single band only)
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(DX0, PY0); ctx.lineTo(DX0, PY1); ctx.lineTo(DX1, PY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.75)'; ctx.textAlign = 'center';
  ctx.fillText('g(E)  (van Hove)', (DX0 + DX1) / 2, H - 16);
  if (st.lat !== 'ssh') {
    let gmax = 0;
    for (let i = 1; i < 200; i += 1) gmax = Math.max(gmax, dos1D(eLo + (i / 200) * (eHi - eLo), st.t));
    gmax = Math.min(gmax, 1.5);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 240; i += 1) {
      const E = eLo + (i / 240) * (eHi - eLo);
      const g = Math.min(gmax, dos1D(E, st.t));
      const X = DX0 + (g / gmax) * (DX1 - DX0), Y = yOf(E);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(6,214,160,0.6)'; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(DX0, yF); ctx.lineTo(DX1, yF); ctx.stroke(); ctx.setLineDash([]);
  } else {
    ctx.fillStyle = 'rgba(150,160,180,0.6)'; ctx.textAlign = 'center';
    ctx.fillText(`gap = ${sshGap(st.t, st.t * st.dim).toFixed(2)}`, (DX0 + DX1) / 2, (PY0 + PY1) / 2);
  }
}

function draw2D() {
  const t = st.t, NX = (PX1 - PX0), NY = (PY1 - PY0);
  const img = ctx.createImageData(Math.round(NX), Math.round(NY));
  for (let py = 0; py < img.height; py += 1) {
    const ky = -Math.PI + (py / img.height) * 2 * Math.PI;
    for (let px = 0; px < img.width; px += 1) {
      const kx = -Math.PI + (px / img.width) * 2 * Math.PI;
      const E = E2D(kx, ky, t);
      const u = (E + 4 * t) / (8 * t);                    // 0..1
      const c = u < 0.5 ? [40 + u * 120, 90, 160] : [220, 90 + (1 - u) * 120, 70];
      const j = (py * img.width + px) * 4;
      img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 255;
    }
  }
  ctx.putImageData(img, PX0, PY0);
  ctx.strokeStyle = 'rgba(150,160,180,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(PX0, PY0, NX, NY);
  // Fermi surface
  const pts = fermiSurface2D(st.EF, t, 0, 1, 220);
  ctx.fillStyle = '#06d6a0';
  for (const [kx, ky] of pts) {
    const X = PX0 + (kx + Math.PI) / (2 * Math.PI) * NX;
    const Y = PY0 + (ky + Math.PI) / (2 * Math.PI) * NY;
    ctx.fillRect(X - 1.2, Y - 1.2, 2.4, 2.4);
  }
  ctx.fillStyle = 'rgba(150,160,180,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('kx (-pi..pi)', (PX0 + PX1) / 2, H - 16);
  ctx.save(); ctx.translate(24, (PY0 + PY1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('ky', 0, 0); ctx.restore();
  ctx.fillStyle = '#06d6a0'; ctx.textAlign = 'left'; ctx.fillText('Fermi surface at E_F', DX0, PY0 + 12);
  ctx.fillStyle = 'rgba(150,160,180,0.7)';
  ctx.fillText(`E2D = -2t(cos kx + cos ky)`, DX0, PY0 + 34);
  ctx.fillText(`min -4t (Gamma), max +4t`, DX0, PY0 + 54);
  ctx.fillText(`saddle 0 at (pi,0): van Hove`, DX0, PY0 + 74);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  if (st.lat === '2d') draw2D(); else draw1D();
  const bw = st.lat === '2d' ? 8 * st.t : (st.lat === 'ssh' ? 2 * sshBands(0, st.t, st.t * st.dim).plus : 4 * st.t);
  rLat.textContent = st.lat.toUpperCase();
  rBw.textContent = bw.toFixed(2);
  rGap.textContent = st.lat === 'ssh' ? sshGap(st.t, st.t * st.dim).toFixed(2) : '0';
  rEf.textContent = st.EF.toFixed(2);
  rFill.textContent = st.lat === '1d' ? filling1D(st.EF, st.t).toFixed(3)
    : (st.lat === '2d' ? ((st.EF + 4 * st.t) / (8 * st.t)).toFixed(2) + '*' : '-');
}

function syncLabels() { vT.textContent = st.t.toFixed(2); vDim.textContent = st.dim.toFixed(2); vEF.textContent = st.EF.toFixed(2); }
selLat.addEventListener('change', () => { st.lat = selLat.value; applyVis(); render(); });
sT.addEventListener('input', () => { st.t = parseFloat(sT.value); syncLabels(); render(); });
sDim.addEventListener('input', () => { st.dim = parseFloat(sDim.value); syncLabels(); render(); });
sEF.addEventListener('input', () => { st.EF = parseFloat(sEF.value); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.lat = 'ssh'; st.t = 1.0; st.dim = 0.5; st.EF = 0;
  selLat.value = 'ssh'; sT.value = '1.0'; sDim.value = '0.5'; sEF.value = '0'; syncLabels(); applyVis(); render();
});

function bootSync() {
  selLat.value = st.lat;                                 // default view = SSH
  syncLabels(); applyVis();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.EF = -4 + f * 8;                                   // fill the band
    sEF.value = String(st.EF); syncLabels();
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
