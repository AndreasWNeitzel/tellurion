// Canonical transformations (Canvas2D). Left: a phase-space grid and
// a blob in (q,p). Right: their image under the selected map, which
// can be morphed continuously from the identity by the "morph t"
// slider (or animated with Play), so the deformation of phase space
// is something you watch, not two static snapshots. The readouts are
// the Poisson bracket and the area ratio. sim.js is the gate-tested
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
const sT = document.getElementById('slider-t'), vT = document.getElementById('value-t');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const bPlay = document.getElementById('btn-play'), bR = document.getElementById('btn-reset');

const st = { map: 'hoScale', par: 1.7, t: 1, E: 1.0, playing: false };
const LCX = 210, RCX = 555, CY = H / 2 - 6, SC = 78;

function fullPar() {
  if (st.map === 'rotation') return { a: (st.par - 0.3) / 2.3 * 2 * Math.PI };
  if (st.map === 'hoScale') return { w: st.par };
  if (st.map === 'squeeze') return { lam: st.par };
  return {};
}

// The map at morph fraction t. For the linear canonical maps every
// intermediate is itself canonical (the area is exactly constant the
// whole way); point is blended; p-doubling grows its area 1 -> 2 so
// the loss of canonicality is watchable.
function morph(q, p, t) {
  if (st.map === 'identity') return [q, p];
  if (st.map === 'hoScale') return mapApply('hoScale', q, p, { w: 1 + t * (st.par - 1) });
  if (st.map === 'squeeze') return mapApply('squeeze', q, p, { lam: 1 + t * (st.par - 1) });
  if (st.map === 'rotation') return mapApply('rotation', q, p, { a: t * fullPar().a });
  if (st.map === 'pDouble') return [q, (1 + t) * p];
  // point: a smooth blend identity -> full point transform
  const [Q, P] = mapApply('point', q, p);
  return [(1 - t) * q + t * Q, (1 - t) * p + t * P];
}

function drawGrid(cx, T, col, lw) {
  const A = Math.sqrt(2 * st.E) * 1.25, n = 8, S = 26;
  ctx.strokeStyle = col; ctx.lineWidth = lw;
  for (let gi = 0; gi <= n; gi += 1) {
    const u = -A + (2 * A) * gi / n;
    ctx.beginPath();
    for (let s = 0; s <= S; s += 1) { const v = -A + (2 * A) * s / S; const [X, Y] = T(u, v); const px = cx + X * SC, py = CY - Y * SC; if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
    ctx.beginPath();
    for (let s = 0; s <= S; s += 1) { const v = -A + (2 * A) * s / S; const [X, Y] = T(v, u); const px = cx + X * SC, py = CY - Y * SC; if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
  }
}

function drawBlob(cx, label, T, underlay) {
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 150, CY); ctx.lineTo(cx + 150, CY);
  ctx.moveTo(cx, CY - 150); ctx.lineTo(cx, CY + 150); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, cx, H - 14);

  // faint reference: the undeformed grid + ellipse (only on the
  // image panel) so the deformation is read against the start
  if (underlay) {
    drawGrid(cx, (q, p) => [q, p], 'rgba(120,130,150,0.16)', 1);
    const e0 = hoEllipse(st.E, 1, 160);
    ctx.strokeStyle = 'rgba(150,160,180,0.32)'; ctx.lineWidth = 1.4; ctx.beginPath();
    e0.forEach(([q, p], i) => { const px = cx + q * SC, py = CY - p * SC; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.closePath(); ctx.stroke();
  }
  drawGrid(cx, T, 'rgba(91,192,235,0.34)', 1);

  const ell = hoEllipse(st.E, 1, 200);
  const poly = ell.map(([q, p]) => T(q, p));
  ctx.fillStyle = 'rgba(6,214,160,0.16)'; ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  poly.forEach(([X, Y], i) => { const px = cx + X * SC, py = CY - Y * SC; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(91,192,235,0.85)';
  const Amp = Math.sqrt(2 * st.E);
  for (let gi = -3; gi <= 3; gi += 1) for (let gj = -3; gj <= 3; gj += 1) {
    const q = gi * Amp / 3.2, p = gj * Amp / 3.2;
    if (p * p + q * q > 2 * st.E * 1.02) continue;
    const [X, Y] = T(q, p);
    ctx.beginPath(); ctx.arc(cx + X * SC, CY - Y * SC, 2.4, 0, 2 * Math.PI); ctx.fill();
  }
  return Math.abs(polyArea(poly));
}

const MAP_EQ = {
  identity: '(Q,P) = (q, p)',
  hoScale: '(Q,P) = (sqrt(w) q,  p/sqrt(w))',
  rotation: '(Q,P) = rotate (q,p) by angle a',
  squeeze: '(Q,P) = (lam q,  p/lam)',
  point: '(Q,P) = (q+0.3 q^3,  p/(1+0.9 q^2))',
  pDouble: '(Q,P) = (q, 2p)',
};
function drawMapBanner(cx, pb) {
  ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(91,192,235,0.95)';
  ctx.fillText(MAP_EQ[st.map], cx, 22);
  const canon = Math.abs(pb - 1) < 1e-6;
  ctx.fillStyle = canon ? '#06d6a0' : '#ef476f'; ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText(canon ? '{Q,P} = 1: area preserved (canonical)'
    : `{Q,P} = ${pb.toFixed(0)}: area changes (NOT canonical)`, cx, 39);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const Ain = drawBlob(LCX, 'phase grid + blob  (q, p)', (q, p) => [q, p], false);
  const Aout = drawBlob(RCX, `image  (Q, P)  ${st.map}  t=${st.t.toFixed(2)}`, (q, p) => morph(q, p, st.t), true);
  const pb = poissonBracket(st.map, 0.6, 0.4, fullPar());
  drawMapBanner(RCX, pb);
  rMap.textContent = st.map;
  rPB.textContent = pb.toFixed(4);
  rAI.textContent = Ain.toFixed(4);
  rAO.textContent = Aout.toFixed(4);
  rR.textContent = (Aout / (Ain || 1)).toFixed(4);
  vPar.textContent = st.par.toFixed(2); vT.textContent = st.t.toFixed(2); vE.textContent = st.E.toFixed(2);
}

let raf = 0, dir = 1, last = 0;
function animate(now) {
  if (!st.playing) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  st.t += dir * dt * 0.5;
  if (st.t >= 1) { st.t = 1; dir = -1; } else if (st.t <= 0) { st.t = 0; dir = 1; }
  sT.value = String(st.t);
  render();
  raf = requestAnimationFrame(animate);
}
function setPlaying(on) {
  st.playing = on;
  bPlay.textContent = on ? 'Pause morph' : 'Play morph';
  bPlay.setAttribute('aria-pressed', String(on));
  if (on) { last = performance.now(); raf = requestAnimationFrame(animate); } else if (raf) cancelAnimationFrame(raf);
}

selMap.addEventListener('change', () => { st.map = selMap.value; render(); });
sPar.addEventListener('input', () => { st.par = parseFloat(sPar.value); render(); });
sT.addEventListener('input', () => { st.t = parseFloat(sT.value); if (st.playing) setPlaying(false); render(); });
sE.addEventListener('input', () => { st.E = parseFloat(sE.value); render(); });
bPlay.addEventListener('click', () => setPlaying(!st.playing));
bR.addEventListener('click', () => {
  if (st.playing) setPlaying(false);
  st.map = 'hoScale'; st.par = 1.7; st.t = 1; st.E = 1.0;
  selMap.value = 'hoScale'; sPar.value = '1.7'; sT.value = '1'; sE.value = '1.0'; render();
});

function bootSync() {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.t = f;                                              // sweep the morph across frames
    sT.value = String(st.t);
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
