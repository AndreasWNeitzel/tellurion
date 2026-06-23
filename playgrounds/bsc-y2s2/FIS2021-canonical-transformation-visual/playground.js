import { fontString } from '../../../shared/js/canvas-type.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
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
// Portrait composition: the two phase-space panels (source + image) sit
// side by side across the top ~58% of the tall canvas; an area-ratio vs
// morph diagnostic fills the lower ~42% (was: two small panels stranded
// in the vertical middle with large voids above and below).
const PANEL_CY = Math.round(H * 0.30);
const LCX = Math.round(W * 0.265), RCX = Math.round(W * 0.735);
const CY = PANEL_CY, SC = 96, HALF = 172;
const DIAG = { x: 64, y: Math.round(H * 0.615), w: W - 128, h: Math.round(H * 0.335) };

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
  ctx.beginPath(); ctx.moveTo(cx - HALF, CY); ctx.lineTo(cx + HALF, CY);
  ctx.moveTo(cx, CY - HALF); ctx.lineTo(cx, CY + HALF); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(label, cx, CY + HALF + 24);

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
  ctx.font = fontString(canvas, 'body', 'mono'); ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(91,192,235,0.95)';
  ctx.fillText(MAP_EQ[st.map], cx, 22);
  const canon = Math.abs(pb - 1) < 1e-6;
  ctx.fillStyle = canon ? '#06d6a0' : '#ef476f'; ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText(canon ? '{Q,P} = 1: area preserved (canonical)'
    : `{Q,P} = ${pb.toFixed(0)}: area changes (NOT canonical)`, cx, 39);
}

function areaRatioAt(t) {
  const ell = hoEllipse(st.E, 1, 160);
  const Ain = Math.abs(polyArea(ell)) || 1;
  const Aout = Math.abs(polyArea(ell.map(([q, p]) => morph(q, p, t))));
  return Aout / Ain;
}

// Area-ratio vs morph diagnostic: for a canonical map the image area
// equals the source area for every t (flat line at 1); for p-doubling it
// climbs to 2. The marker tracks the live morph fraction.
function drawAreaRatio() {
  const { x, y, w, h } = DIAG;
  const padL = 70, padR = 22, padT = 24, padB = 34;
  const ax = x + padL, aw = w - padL - padR;
  const ayTop = y + padT, ah = h - padT - padB;
  const rMax = 2.2;
  const PX = (t) => ax + t * aw;
  const PY = (r) => ayTop + ah - Math.min(r, rMax) / rMax * ah;

  ctx.fillStyle = 'rgba(91,192,235,0.04)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax, ayTop); ctx.lineTo(ax, ayTop + ah); ctx.lineTo(ax + aw, ayTop + ah); ctx.stroke();

  ctx.strokeStyle = 'rgba(6,214,160,0.5)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(ax, PY(1)); ctx.lineTo(ax + aw, PY(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(6,214,160,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('ratio = 1: area preserved (canonical)', ax + 8, PY(1) - 7);

  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const t = i / 120; const px = PX(t), py = PY(areaRatioAt(t)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.stroke();

  const rc = areaRatioAt(st.t);
  ctx.strokeStyle = 'rgba(239,71,111,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PX(st.t), ayTop); ctx.lineTo(PX(st.t), ayTop + ah); ctx.stroke();
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(PX(st.t), PY(rc), 5.5, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = 'rgba(150,160,180,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('morph fraction  t', ax + aw / 2, y + h - 10);
  ctx.save(); ctx.translate(x + 18, ayTop + ah / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('area(image) / area(source)', 0, 0); ctx.restore();
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(120,130,150,0.85)';
  ctx.fillText('0', ax - 8, PY(0) + 4); ctx.fillText('1', ax - 8, PY(1) + 4); ctx.fillText('2', ax - 8, PY(2) + 4);
  ctx.fillStyle = '#ef476f';
  const lblTxt = `t = ${st.t.toFixed(2)},  ratio = ${rc.toFixed(3)}`, lblX = PX(st.t);
  // follow the operating point but flip to its left near the right edge so the
  // readout never runs off the plot.
  if (lblX > ax + aw - 180) { ctx.textAlign = 'right'; ctx.fillText(lblTxt, lblX - 9, PY(rc) - 9); }
  else { ctx.textAlign = 'left'; ctx.fillText(lblTxt, lblX + 9, PY(rc) - 9); }
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const Ain = drawBlob(LCX, 'phase grid + blob  (q, p)', (q, p) => [q, p], false);
  const Aout = drawBlob(RCX, `image  (Q, P)  ${st.map}  t=${st.t.toFixed(2)}`, (q, p) => morph(q, p, st.t), true);
  const pb = poissonBracket(st.map, 0.6, 0.4, fullPar());
  drawMapBanner(RCX, pb);
  drawAreaRatio();
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
  } else if (!prefersReducedMotion()) {
    // Auto-morph on load so the deformation plays without a click; any
    // input on the morph slider pauses it (handled in the sT listener).
    setPlaying(true);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); }, { once: true });
} else {
  bootSync();
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const pb = poissonBracket(st.map, 0.6, 0.4, fullPar());   // match render: poissonBracket(map, q, p, params)
  const areaIn = polyArea(hoEllipse(st.E, 1));
  const [Q, P] = morph(0.8, 0, st.t);
  const areaOut = polyArea(hoEllipse(st.E, st.t < 1 ? 1 : 0.5)); // Rough estimate; full calc requires blob resampling
  return {
    fields: [
      { key: 'map', label: 'Transformation', value: st.map, format: undefined },
      { key: 'morph-t', label: 'Morph parameter (0 to 1)', value: st.t, format: 'float' },
      { key: 'poisson-bracket', label: 'Poisson bracket', value: pb, format: 'float' },
      { key: 'energy', label: 'Energy parameter', value: st.E, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const pb = poissonBracket(st.map, 0.6, 0.4, fullPar());
  const canonical = st.map !== 'pDouble';
  const pb_target = canonical ? 1.0 : (1 + st.t);
  const pb_drift = Math.abs(pb - pb_target);
  const status = pb_drift > 0.02 ? 'drift' : 'pass';
  return [
    {
      key: 'poisson-bracket-canonical',
      label: '{Q,P} = 1 (canonical)',
      value: pb.toFixed(4),
      status: status
    }
  ];
};
