// KAM / Chirikov standard map Poincare section (Canvas2D). A grid of
// seed orbits iterated on the (theta, p) torus; below K_c they lie
// on nested KAM curves, above it the chaotic sea spreads. sim.js is
// the gate-tested map engine.

import {
  KC_GOLDEN, TWO_PI, stdMap, jacobianDet, pSpread,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rK = document.getElementById('readout-k');
const rKc = document.getElementById('readout-kc');
const rDJ = document.getElementById('readout-dj');
const rGD = document.getElementById('readout-gd');
const rRG = document.getElementById('readout-rg');

const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sOrb = document.getElementById('slider-orb'), vOrb = document.getElementById('value-orb');
const sIt = document.getElementById('slider-it'), vIt = document.getElementById('value-it');
const bR = document.getElementById('btn-reset');

const st = { K: 0.5, orbits: 22, iters: 420 };
const BX = 70, BY = 36, BW = W - 100, BH = H - 86;       // section box
const xOf = (th) => BX + (th / TWO_PI) * BW;
const yOf = (p) => BY + BH - (p / TWO_PI) * BH;

const PALETTE = ['#5bc0eb', '#06d6a0', '#ef476f', '#ffd166', '#b48cff', '#4dd0e1', '#ff9e6d', '#9ccc65'];

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(150,160,180,0.55)'; ctx.lineWidth = 1.2;
  ctx.strokeRect(BX, BY, BW, BH);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('theta  (0 .. 2 pi)', BX + BW / 2, H - 14);
  ctx.save(); ctx.translate(28, BY + BH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('p  (0 .. 2 pi)', 0, 0); ctx.restore();

  const K = st.K, nOrb = st.orbits, nIt = st.iters;
  for (let o = 0; o < nOrb; o += 1) {
    const p0 = TWO_PI * (o + 0.5) / nOrb;
    const th0 = 0.1 + (o % 3) * 0.4;
    let th = th0, p = p0;
    ctx.fillStyle = PALETTE[o % PALETTE.length];
    for (let i = 0; i < nIt; i += 1) {
      [th, p] = stdMap(th, p, K);
      ctx.fillRect(xOf(th) - 0.6, yOf(p) - 0.6, 1.2, 1.2);
    }
  }
  // golden-mean torus highlighted
  const golden = (Math.sqrt(5) - 1) / 2;
  let gth = 0.0, gp = TWO_PI * golden;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < Math.max(nIt, 600); i += 1) {
    [gth, gp] = stdMap(gth, gp, K);
    ctx.fillRect(xOf(gth) - 1, yOf(gp) - 1, 2, 2);
  }
  const gSpread = pSpread(0.0, TWO_PI * golden, K, 1500);

  rK.textContent = K.toFixed(3);
  rKc.textContent = KC_GOLDEN.toFixed(4);
  rDJ.textContent = jacobianDet(1.0, K).toFixed(6);
  rGD.textContent = gSpread.toFixed(2);
  rRG.textContent = K < 0.4 ? 'tori' : (K < KC_GOLDEN ? 'mixed' : 'chaotic');
  vK.textContent = K.toFixed(2); vOrb.textContent = String(nOrb); vIt.textContent = String(nIt);
}

sK.addEventListener('input', () => { st.K = parseFloat(sK.value); render(); });
sOrb.addEventListener('input', () => { st.orbits = parseInt(sOrb.value, 10); render(); });
sIt.addEventListener('input', () => { st.iters = parseInt(sIt.value, 10); render(); });
bR.addEventListener('click', () => {
  st.K = 0.5; st.orbits = 22; st.iters = 420;
  sK.value = '0.5'; sOrb.value = '22'; sIt.value = '420'; render();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.K = f * 3.0;                                      // K = 0 (tori) -> chaos
    sK.value = String(st.K);
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
