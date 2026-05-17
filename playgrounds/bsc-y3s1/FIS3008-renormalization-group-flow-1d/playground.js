// 1D Ising RG flow (Canvas2D). Flow-plane view: the exact decimation
// vector field in (u = tanh K, h), the fixed points, and a traced
// trajectory from a draggable start, all flowing into the disordered
// sink (no finite-T transition). Cobweb view: the zero-field map
// K' = 1/2 ln cosh 2K iterating to 0. sim.js is the gate-tested
// headless engine.

import {
  rgStep, rgFlow, exactFreeEnergy, rgFreeEnergy, correlationLength,
  uOfK, kOfU,
} from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rKh = document.getElementById('readout-kh');
const rKhN = document.getElementById('readout-khn');
const rXi = document.getElementById('readout-xi');
const rFrg = document.getElementById('readout-frg');
const rFex = document.getElementById('readout-fex');

const sK = document.getElementById('slider-k0'), vK = document.getElementById('value-k0');
const sH = document.getElementById('slider-h0'), vH = document.getElementById('value-h0');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const selV = document.getElementById('select-view');
const bR = document.getElementById('btn-reset');

const st = { K0: 3.0, h0: 0.0, N: 9, view: 'flow' };
const HMAX = 1.6;
const BX0 = 70, BX1 = W - 40, BY0 = 46, BY1 = H - 56;
const xOfU = (u) => BX0 + u * (BX1 - BX0);
const yOfH = (h) => BY0 + (HMAX - h) / (2 * HMAX) * (BY1 - BY0);
const uOfX = (px) => (px - BX0) / (BX1 - BX0);
const hOfY = (py) => HMAX - (py - BY0) / (BY1 - BY0) * 2 * HMAX;

function axes(xlab, ylab) {
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(BX0, BY0); ctx.lineTo(BX0, BY1); ctx.lineTo(BX1, BY1); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.fillText(xlab, (BX0 + BX1) / 2, H - 18);
  ctx.save(); ctx.translate(24, (BY0 + BY1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText(ylab, 0, 0); ctx.restore();
}

function arrowHead(x, y, ang, s, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * Math.cos(ang - 0.4), y - s * Math.sin(ang - 0.4));
  ctx.lineTo(x - s * Math.cos(ang + 0.4), y - s * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
}

function renderFlow() {
  axes('u = tanh K   (K=0 left, K to infinity right)', 'field  h');
  // h = 0 invariant line
  ctx.strokeStyle = 'rgba(120,130,150,0.25)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(BX0, yOfH(0)); ctx.lineTo(BX1, yOfH(0)); ctx.stroke(); ctx.setLineDash([]);

  // vector field: one RG step direction at each grid point
  for (let i = 1; i <= 13; i += 1) {
    const u = i / 14;
    for (let j = 0; j <= 10; j += 1) {
      const h = -HMAX + (j / 10) * 2 * HMAX;
      const K = kOfU(u);
      const r = rgStep(K, h);
      const u2 = uOfK(r.K), h2 = r.h;
      const x0 = xOfU(u), y0 = yOfH(h);
      let dx = xOfU(u2) - x0, dy = yOfH(Math.max(-HMAX, Math.min(HMAX, h2))) - y0;
      const m = Math.hypot(dx, dy) || 1;
      const L = 16;
      dx = dx / m * L; dy = dy / m * L;
      ctx.strokeStyle = 'rgba(120,170,235,0.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + dx, y0 + dy); ctx.stroke();
      arrowHead(x0 + dx, y0 + dy, Math.atan2(dy, dx), 5, 'rgba(120,170,235,0.6)');
    }
  }

  // fixed points
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(xOfU(0), yOfH(0), 8, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(6,214,160,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('stable sink (T = infinity)', xOfU(0) + 12, yOfH(0) - 10);
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(xOfU(1), yOfH(0), 8, 0, 2 * Math.PI); ctx.fill();
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(239,71,111,0.9)';
  ctx.fillText('unstable (T = 0)', xOfU(1) - 12, yOfH(0) - 10);

  // trajectory
  const traj = rgFlow(st.K0, st.h0, st.N);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let n = 0; n < traj.length; n += 1) {
    const x = xOfU(uOfK(traj[n].K)), y = yOfH(Math.max(-HMAX, Math.min(HMAX, traj[n].h)));
    if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let n = 0; n < traj.length; n += 1) {
    const x = xOfU(uOfK(traj[n].K)), y = yOfH(Math.max(-HMAX, Math.min(HMAX, traj[n].h)));
    if (n > 0) {
      const px = xOfU(uOfK(traj[n - 1].K)), py = yOfH(Math.max(-HMAX, Math.min(HMAX, traj[n - 1].h)));
      arrowHead(x, y, Math.atan2(y - py, x - px), 7, '#ffd166');
    }
    ctx.fillStyle = n === 0 ? '#fff' : 'rgba(255,209,102,0.9)';
    ctx.beginPath(); ctx.arc(x, y, n === 0 ? 6 : 3.2, 0, 2 * Math.PI); ctx.fill();
  }
  const su = uOfK(st.K0), sx = xOfU(su), sy = yOfH(Math.max(-HMAX, Math.min(HMAX, st.h0)));
  ctx.fillStyle = '#fff'; ctx.font = '12px ui-monospace, monospace';
  if (su > 0.7) { ctx.textAlign = 'right'; ctx.fillText('start (drag me)', sx - 12, sy + 4); }
  else { ctx.textAlign = 'left'; ctx.fillText('start (drag me)', sx + 12, sy + 4); }
}

function renderCobweb() {
  axes('K', "K' = 1/2 ln cosh 2K");
  const KMAX = 3.6;
  const xOfK = (K) => BX0 + (K / KMAX) * (BX1 - BX0);
  const yOfK = (K) => BY1 - (K / KMAX) * (BY1 - BY0);
  // diagonal y = x
  ctx.strokeStyle = 'rgba(120,130,150,0.4)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOfK(0), yOfK(0)); ctx.lineTo(xOfK(KMAX), yOfK(KMAX)); ctx.stroke(); ctx.setLineDash([]);
  // map curve
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 300; i += 1) {
    const K = (i / 300) * KMAX, Kp = 0.5 * Math.log(Math.cosh(2 * K));
    const X = xOfK(K), Y = yOfK(Kp);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  // cobweb iteration from K0
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  let K = st.K0;
  ctx.moveTo(xOfK(K), yOfK(0));
  for (let n = 0; n < st.N; n += 1) {
    const Kp = 0.5 * Math.log(Math.cosh(2 * K));
    ctx.lineTo(xOfK(K), yOfK(Kp));     // up to the curve
    ctx.lineTo(xOfK(Kp), yOfK(Kp));    // across to the diagonal
    K = Kp;
  }
  ctx.stroke();
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xOfK(0), yOfK(0), 7, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(6,214,160,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('K* = 0 (only fixed point at finite T)', xOfK(0) + 12, yOfK(0) - 10);
}

// A deterministic representative Ising chain at coupling K, field h:
// nearest-neighbour same-sign probability (1 + tanh K)/2, with a
// mild bias toward sign(h). Seeded so each RG level is reproducible.
function makeChain(K, h, len, seed) {
  const rng = makeRng(seed);
  const pSame = 0.5 * (1 + Math.tanh(Math.max(0, K)));
  const bias = Math.tanh(h);
  const s = new Int8Array(len);
  s[0] = rng() < 0.5 + 0.5 * bias ? 1 : -1;
  for (let i = 1; i < len; i += 1) {
    let v = rng() < pSame ? s[i - 1] : -s[i - 1];
    if (bias !== 0 && rng() < Math.abs(bias) * 0.5) v = bias > 0 ? 1 : -1;
    s[i] = v;
  }
  return s;
}

// Real-space decimation cascade: each RG step integrates out every
// other spin; the chain halves and the coupling renormalizes by the
// exact 1D recursion (sim.js rgStep). At any finite T the coupling
// flows to 0, so the cascade ends in a disordered (random) chain:
// the concrete statement that 1D Ising has no finite-T order.
function renderChain() {
  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('real-space decimation (b = 2): keep every other block; K flows toward 0 (disorder)', W / 2, 24);
  const rows = Math.min(st.N + 1, 11);
  const traj = rgFlow(st.K0, st.h0, rows - 1);
  const x0 = 150, x1 = W - 30, top = 44, bot = H - 60;
  const rowH = (bot - top) / rows;
  const L0 = 96;
  for (let n = 0; n < rows; n += 1) {
    const { K, h } = traj[n];
    const len = Math.max(3, Math.round(L0 / 2 ** n));
    const chain = makeChain(K, h, len, DEFAULT_SEED + n * 1009);
    const yc = top + n * rowH + rowH / 2;
    const cellW = (x1 - x0) / len, hh = Math.min(22, rowH - 12);
    for (let i = 0; i < len; i += 1) {
      ctx.fillStyle = chain[i] > 0 ? '#ef476f' : '#5bc0eb';
      ctx.fillRect(x0 + i * cellW, yc - hh / 2, Math.max(1, cellW - 0.6), hh);
    }
    ctx.strokeStyle = 'rgba(150,160,180,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(x0, yc - hh / 2, x1 - x0, hh);
    ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'right';
    ctx.fillText(`n=${n}  K=${K.toFixed(2)}`, x0 - 10, yc + 4);
    if (n > 0) {
      ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0 - 64, top + (n - 1) * rowH + rowH / 2 + 10); ctx.lineTo(x0 - 64, yc - 10); ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(91,192,235,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('blue = spin down', x0, bot + 22);
  ctx.fillStyle = 'rgba(239,71,111,0.9)'; ctx.textAlign = 'left';
  ctx.fillText('red = spin up', x0 + 150, bot + 22);
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.textAlign = 'right';
  ctx.fillText('top: correlated domains   bottom: disordered sink', x1, bot + 22);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  if (st.view === 'cobweb') renderCobweb(); else if (st.view === 'chain') renderChain(); else renderFlow();
  const tj = rgFlow(st.K0, st.h0, st.N);
  const last = tj[tj.length - 1];
  const fRG = rgFreeEnergy(st.K0, st.h0), fEx = exactFreeEnergy(st.K0, st.h0);
  rKh.textContent = `${st.K0.toFixed(2)}, ${st.h0.toFixed(2)}`;
  rKhN.textContent = `${last.K.toFixed(3)}, ${last.h.toFixed(3)}`;
  const xi = correlationLength(st.K0);
  rXi.textContent = Number.isFinite(xi) ? xi.toFixed(2) : 'inf';
  rFrg.textContent = fRG.toFixed(6);
  rFex.textContent = fEx.toFixed(6);
}

function setStart(K0, h0) {
  st.K0 = Math.max(0.1, Math.min(6.0, K0));
  st.h0 = Math.max(-1.5, Math.min(1.5, h0));
  sK.value = String(st.K0); vK.textContent = st.K0.toFixed(2);
  sH.value = String(st.h0); vH.textContent = st.h0.toFixed(2);
  render();
}
let dragging = false;
function pointerToParams(e) {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * W / rect.width;
  const py = (e.clientY - rect.top) * H / rect.height;
  if (st.view !== 'flow') return null;
  const u = Math.max(0.001, Math.min(0.999, uOfX(px)));
  return { K: kOfU(u), h: Math.max(-1.5, Math.min(1.5, hOfY(py))) };
}
canvas.addEventListener('mousedown', (e) => { const p = pointerToParams(e); if (p) { dragging = true; setStart(p.K, p.h); } });
canvas.addEventListener('mousemove', (e) => { if (!dragging) return; const p = pointerToParams(e); if (p) setStart(p.K, p.h); });
window.addEventListener('mouseup', () => { dragging = false; });

sK.addEventListener('input', () => { st.K0 = parseFloat(sK.value); vK.textContent = st.K0.toFixed(2); render(); });
sH.addEventListener('input', () => { st.h0 = parseFloat(sH.value); vH.textContent = st.h0.toFixed(2); render(); });
sN.addEventListener('input', () => { st.N = parseInt(sN.value, 10); vN.textContent = String(st.N); render(); });
selV.addEventListener('change', () => { st.view = selV.value; render(); });
bR.addEventListener('click', () => { st.view = 'flow'; selV.value = 'flow'; setStart(3.0, 0.0); st.N = 9; sN.value = '9'; vN.textContent = '9'; render(); });

function bootSync() {
  vK.textContent = st.K0.toFixed(2); vH.textContent = st.h0.toFixed(2); vN.textContent = String(st.N);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.N = Math.round(f * 14);            // the trajectory marches into the sink
    sN.value = String(st.N);
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(function loop() { render(); requestAnimationFrame(loop); }); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(function loop() { render(); requestAnimationFrame(loop); });
}
