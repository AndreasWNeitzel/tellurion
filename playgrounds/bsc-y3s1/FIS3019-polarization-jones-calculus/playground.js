// Jones calculus playground (Canvas2D). Left: the polarization
// ellipse traced by the field after a chain of elements. Right: the
// Poincare sphere with the input and output state points. Static
// (recomputed per control change). sim.js is the gate-tested engine.

import {
  jLinear, jCircular, linearPolarizer, quarterWave, halfWave,
  identityM, applyChain, stokes, ellipse, intensity, degreeOfPolarization,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rPsi = document.getElementById('readout-psi');
const rChi = document.getElementById('readout-chi');
const rHand = document.getElementById('readout-hand');
const rInt = document.getElementById('readout-int');
const rDop = document.getElementById('readout-dop');

const selIn = document.getElementById('select-input');
const sAng = document.getElementById('slider-ang'), vAng = document.getElementById('value-ang');
const selE1 = document.getElementById('select-e1');
const sA1 = document.getElementById('slider-a1'), vA1 = document.getElementById('value-a1');
const selE2 = document.getElementById('select-e2');
const bR = document.getElementById('btn-reset');

const st = { input: 'lin', ang: 0, e1: 'qwp', a1: 45, e2: 'none' };
const DEG = Math.PI / 180;

function inputVec() {
  if (st.input === 'cr') return jCircular(true);
  if (st.input === 'cl') return jCircular(false);
  return jLinear(st.ang * DEG);
}
function elemMatrix(kind, axisDeg) {
  const a = axisDeg * DEG;
  if (kind === 'qwp') return quarterWave(a);
  if (kind === 'hwp') return halfWave(a);
  if (kind === 'pol') return linearPolarizer(a);
  return identityM;
}

function drawEllipse(cx, cy, S, vec, color, lw, alpha) {
  // trace E(t) = Re[ (ax, ay) e^{i omega t} ] over one period
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i <= 160; i += 1) {
    const t = (i / 160) * 2 * Math.PI;
    const ct = Math.cos(t), sct = Math.sin(t);
    const ex = vec[0].re * ct - vec[0].im * sct;
    const ey = vec[1].re * ct - vec[1].im * sct;
    const X = cx + ex * S, Y = cy - ey * S;
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const vin = inputVec();
  const chain = [elemMatrix(st.e1, st.a1), elemMatrix(st.e2, 0)];
  const vout = applyChain(chain, vin);

  // left: polarization ellipse
  const LCX = 200, LCY = H / 2, S = 130;
  ctx.strokeStyle = 'rgba(150,160,180,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LCX - S - 18, LCY); ctx.lineTo(LCX + S + 18, LCY);
  ctx.moveTo(LCX, LCY - S - 18); ctx.lineTo(LCX, LCY + S + 18); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Ex', LCX + S + 8, LCY + 16); ctx.fillText('Ey', LCX - 16, LCY - S - 6);
  ctx.fillText('polarization ellipse', LCX, LCY + S + 38);
  drawEllipse(LCX, LCY, S, vin, '#5bc0eb', 2.4, 0.85);   // input (rotates with azimuth)
  drawEllipse(LCX, LCY, S, vout, '#06d6a0', 3, 1);       // output
  const eo = ellipse(vout);
  // input (blue) vs output (green) legend, below the panel
  ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('input', LCX + S - 30, LCY + S + 38);
  ctx.fillStyle = '#06d6a0'; ctx.fillText('output', LCX + S + 18, LCY + S + 38);

  // right: Poincare sphere (orthographic, S1 right, S3 up, S2 depth)
  const PCX = 560, PCY = H / 2, PR = 130;
  ctx.strokeStyle = 'rgba(150,160,180,0.45)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(PCX, PCY, PR, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(PCX, PCY, PR, PR * 0.32, 0, 0, 2 * Math.PI); ctx.stroke();   // equator
  ctx.strokeStyle = 'rgba(120,130,150,0.3)';
  ctx.beginPath(); ctx.moveTo(PCX - PR, PCY); ctx.lineTo(PCX + PR, PCY);
  ctx.moveTo(PCX, PCY - PR); ctx.lineTo(PCX, PCY + PR); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'center';
  ctx.fillText('Poincare sphere', PCX, PCY + PR + 38);
  ctx.fillText('S3 (circular)', PCX, PCY - PR - 10);
  ctx.fillText('H', PCX + PR + 12, PCY + 4); ctx.fillText('V', PCX - PR - 12, PCY + 4);
  const proj = (S1, S2, S3, S0) => {
    const n = S0 || 1;
    return { x: PCX + (S1 / n) * PR, y: PCY - (S3 / n) * PR - (S2 / n) * PR * 0.30 };
  };
  for (const [vec, col, r] of [[vin, '#5bc0eb', 6], [vout, '#06d6a0', 7]]) {
    const s = stokes(vec); const p = proj(s.S1, s.S2, s.S3, s.S0);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); ctx.fill();
  }

  rPsi.textContent = `${(eo.psi / DEG).toFixed(1)} deg`;
  rChi.textContent = `${(eo.chi / DEG).toFixed(1)} deg`;
  rHand.textContent = eo.handed;
  rInt.textContent = intensity(vout).toFixed(3);
  rDop.textContent = degreeOfPolarization(vout).toFixed(3);
}

function syncLabels() { vAng.textContent = String(st.ang); vA1.textContent = String(st.a1); }
selIn.addEventListener('change', () => { st.input = selIn.value; render(); });
sAng.addEventListener('input', () => { st.ang = parseInt(sAng.value, 10); syncLabels(); render(); });
selE1.addEventListener('change', () => { st.e1 = selE1.value; render(); });
sA1.addEventListener('input', () => { st.a1 = parseInt(sA1.value, 10); syncLabels(); render(); });
selE2.addEventListener('change', () => { st.e2 = selE2.value; render(); });
bR.addEventListener('click', () => {
  st.input = 'lin'; st.ang = 0; st.e1 = 'qwp'; st.a1 = 45; st.e2 = 'none';
  selIn.value = 'lin'; sAng.value = '0'; selE1.value = 'qwp'; sA1.value = '45'; selE2.value = 'none';
  syncLabels(); render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.a1 = Math.round(f * 180);                       // rotate the QWP axis
    sA1.value = String(st.a1); syncLabels();
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
