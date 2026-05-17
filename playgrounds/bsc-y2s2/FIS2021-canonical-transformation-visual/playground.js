// Canonical transformations (Canvas2D). A phase blob in (q,p) on the
// left and its image (Q,P) on the right; the readouts are the
// Poisson bracket and the area ratio. sim.js is the gate-tested
// engine.

import {
  mapApply, poissonBracket, polyArea, hoEllipse,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rMap = document.getElementById('readout-map');
const rPB = document.getElementById('readout-pb');
const rAI = document.getElementById('readout-ai');
const rAO = document.getElementById('readout-ao');
const rR = document.getElementById('readout-r');

const selMap = document.getElementById('select-map');
const sPar = document.getElementById('slider-par'), vPar = document.getElementById('value-par');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const bR = document.getElementById('btn-reset');

const st = { map: 'hoScale', par: 1.7, E: 1.0 };
const LCX = 210, RCX = 555, CY = H / 2 - 6, SC = 78;

function mapPar() {
  if (st.map === 'rotation') return { a: (st.par - 0.3) / 2.3 * 2 * Math.PI };
  if (st.map === 'hoScale') return { w: st.par };
  if (st.map === 'squeeze') return { lam: st.par };
  return {};
}

function drawBlob(cx, label, transform) {
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 150, CY); ctx.lineTo(cx + 150, CY);
  ctx.moveTo(cx, CY - 150); ctx.lineTo(cx, CY + 150); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, cx, H - 14);
  const ell = hoEllipse(st.E, 1, 200);
  const T = transform || ((q, p) => [q, p]);
  const poly = ell.map(([q, p]) => T(q, p));
  ctx.fillStyle = 'rgba(6,214,160,0.16)'; ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.2;
  ctx.beginPath();
  poly.forEach(([X, Y], i) => { const px = cx + X * SC, py = CY - Y * SC; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // interior lattice points show the deformation
  ctx.fillStyle = 'rgba(91,192,235,0.7)';
  const A = Math.sqrt(2 * st.E);
  for (let gi = -3; gi <= 3; gi += 1) for (let gj = -3; gj <= 3; gj += 1) {
    const q = gi * A / 3.2, p = gj * A / 3.2;
    if (p * p + q * q > 2 * st.E * 1.02) continue;
    const [X, Y] = T(q, p);
    ctx.beginPath(); ctx.arc(cx + X * SC, CY - Y * SC, 2.4, 0, 2 * Math.PI); ctx.fill();
  }
  return Math.abs(polyArea(poly));
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const par = mapPar();
  const Ain = drawBlob(LCX, 'phase blob  (q, p)', null);
  const Aout = drawBlob(RCX, `image  (Q, P)  via ${st.map}`, (q, p) => mapApply(st.map, q, p, par));
  const pb = poissonBracket(st.map, 0.6, 0.4, par);
  rMap.textContent = st.map;
  rPB.textContent = pb.toFixed(4);
  rAI.textContent = Ain.toFixed(4);
  rAO.textContent = Aout.toFixed(4);
  rR.textContent = (Aout / (Ain || 1)).toFixed(4);
  vPar.textContent = st.par.toFixed(2); vE.textContent = st.E.toFixed(2);
}

selMap.addEventListener('change', () => { st.map = selMap.value; render(); });
sPar.addEventListener('input', () => { st.par = parseFloat(sPar.value); render(); });
sE.addEventListener('input', () => { st.E = parseFloat(sE.value); render(); });
bR.addEventListener('click', () => {
  st.map = 'hoScale'; st.par = 1.7; st.E = 1.0;
  selMap.value = 'hoScale'; sPar.value = '1.7'; sE.value = '1.0'; render();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.par = 0.3 + f * 2.3;                               // sweep the map parameter
    sPar.value = String(st.par);
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
