import { fontString } from '../../../shared/js/canvas-type.js';
import { viridis, fieldToImageData } from '../../../shared/js/render/colormaps.js';
// Field expulsion and the critical field (Canvas2D). A cross-section
// of a superconducting sphere in a uniform applied field: the hero is
// the field-intensity map |B|/B0 (B = 0 inside, a dark cap at the
// poles, bright lobes crowding to (3/2) B0 at the equator) overlaid
// with the bent field-line streamlines. Cool below the critical
// parabola Bc(T) and the field is expelled; raise T or B0 across it
// and the flux floods back. Two aux panels: the Bc(T) phase diagram
// and the surface-field profile |B(theta)|/B0. sim.js is the
// gate-tested engine.

import {
  meissnerField, criticalField, isSuperconducting, surfaceField,
  vortexCount,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rState = document.getElementById('readout-state');
const rBc = document.getElementById('readout-bc');
const rB0 = document.getElementById('readout-b0');
const rEq = document.getElementById('readout-eq');
const rVx = document.getElementById('readout-vx');

const sT = document.getElementById('slider-t'), vT = document.getElementById('value-t');
const sB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const selType = document.getElementById('select-type');
const sBc0 = document.getElementById('slider-bc0'), vBc0 = document.getElementById('value-bc0');
const bR = document.getElementById('btn-reset');

const st = { Tr: 0.4, B0: 0.03, type: 'I', Bc0: 0.08 };
const Tc = 1;                                            // T measured in units of Tc

// Full-width field-expulsion hero on top; two aux panels below.
const HERO = { x0: 30, y0: 74, x1: 790, y1: 626 };
const CX = (HERO.x0 + HERO.x1) / 2, CY = (HERO.y0 + HERO.y1) / 2;
const RW = 1.0, SCALE = 150;                            // sphere radius 1 -> 150 px
const sR = RW * SCALE;
const toPx = (X, Z) => ({ px: CX + X * SCALE, py: CY - Z * SCALE });

function fieldXZ(X, Z, sc) {
  const r = Math.hypot(X, Z) || 1e-9;
  const theta = Math.atan2(X, Z);                        // from +z axis
  const { Br, Bt } = meissnerField(r, theta, RW, st.B0, sc);
  return {
    Bx: Br * Math.sin(theta) + Bt * Math.cos(theta),
    Bz: Br * Math.cos(theta) - Bt * Math.sin(theta),
  };
}

// Offscreen |B|/B0 intensity field for the superconducting (expelled)
// pattern. Normalised by B0, so its shape is independent of the
// applied field and the type and it is built once and cached.
const HEAT_W = Math.round((HERO.x1 - HERO.x0) / 4);
const HEAT_H = Math.round((HERO.y1 - HERO.y0) / 4);
const HEAT_MAX = 1.5;                                    // (3/2) B0 at the equator
let heatCanvas = null;
function buildHeat() {
  const field = new Float32Array(HEAT_W * HEAT_H);
  for (let j = 0; j < HEAT_H; j += 1) {
    const py = HERO.y0 + (j + 0.5) * (HERO.y1 - HERO.y0) / HEAT_H;
    for (let i = 0; i < HEAT_W; i += 1) {
      const px = HERO.x0 + (i + 0.5) * (HERO.x1 - HERO.x0) / HEAT_W;
      const X = (px - CX) / SCALE, Z = (CY - py) / SCALE;
      const r = Math.hypot(X, Z) || 1e-9;
      const theta = Math.atan2(X, Z);
      field[j * HEAT_W + i] = meissnerField(r, theta, RW, 1, true).Bmag;
    }
  }
  const img = fieldToImageData(field, HEAT_W, HEAT_H, 0, HEAT_MAX, viridis);
  heatCanvas = document.createElement('canvas');
  heatCanvas.width = HEAT_W; heatCanvas.height = HEAT_H;
  heatCanvas.getContext('2d').putImageData(img, 0, 0);
}

function drawHero(sc, isII, inVortex) {
  const expelled = sc || inVortex;
  const HW = HERO.x1 - HERO.x0, HH = HERO.y1 - HERO.y0;
  ctx.save();
  ctx.beginPath(); ctx.rect(HERO.x0, HERO.y0, HW, HH); ctx.clip();

  // field-intensity background
  if (expelled) {
    if (!heatCanvas) buildHeat();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(heatCanvas, HERO.x0, HERO.y0, HW, HH);
  } else {
    const cN = viridis(1 / HEAT_MAX);                    // uniform |B|/B0 = 1
    ctx.fillStyle = `rgb(${cN.r},${cN.g},${cN.b})`;
    ctx.fillRect(HERO.x0, HERO.y0, HW, HH);
  }

  // field-line streamlines, seeded across the top and marched down -B
  const topZ = (CY - HERO.y0 - 8) / SCALE;
  const nL = Math.max(9, Math.min(46, Math.round((st.B0 / 0.12) * 38) + 9));
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = expelled ? 'rgba(228,240,255,0.6)' : 'rgba(228,240,255,0.42)';
  for (let s = 0; s <= nL; s += 1) {
    const X0 = -2.45 + s * (4.9 / nL);
    let X = X0, Z = topZ;
    const pts = [];
    for (let i = 0; i < 1100; i += 1) {
      const r = Math.hypot(X, Z);
      if (expelled && r < RW - 1e-3) break;              // expelled: no field inside
      const f = fieldXZ(X, Z, expelled);
      const m = Math.hypot(f.Bx, f.Bz) || 1e-9;
      X -= 0.011 * f.Bx / m; Z -= 0.011 * f.Bz / m;
      pts.push(toPx(X, Z));
      if (Z < -topZ - 0.1 || Math.abs(X) > 2.7) break;
    }
    if (pts.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(pts[0].px, pts[0].py);
    for (const p of pts) ctx.lineTo(p.px, p.py);
    ctx.stroke();
  }

  // sphere body + outline
  ctx.fillStyle = expelled ? 'rgba(8,12,22,0.64)' : 'rgba(239,71,111,0.10)';
  ctx.beginPath(); ctx.arc(CX, CY, sR, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = expelled ? 'rgba(125,205,255,0.9)' : 'rgba(239,71,111,0.82)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(CX, CY, sR, 0, 2 * Math.PI); ctx.stroke();

  // London penetration layer (type I Meissner): exponential decay skin
  if (sc && st.type === 'I') {
    const lambdaL = 0.08 * sR;
    for (let i = 0; i < 8; i += 1) {
      const frac = i / 8;
      const decay = Math.exp(-frac * 3);
      ctx.strokeStyle = `rgba(120,225,255,${0.4 * decay})`;
      ctx.lineWidth = Math.max(0.4, 1.2 * decay);
      ctx.beginPath(); ctx.arc(CX, CY, sR + frac * lambdaL, 0, 2 * Math.PI); ctx.stroke();
    }
  }

  // type-II mixed state: triangular Abrikosov vortex lattice threading the sphere
  if (inVortex) {
    const nApprox = Math.min(120, 10 + Math.round(55 * st.B0 / st.Bc0));
    const cols = Math.ceil(Math.sqrt(nApprox));
    let drawn = 0;
    for (let iy = 0; iy < cols && drawn < nApprox; iy += 1) {
      for (let ix = 0; ix < cols && drawn < nApprox; ix += 1) {
        const gx = -0.82 + 1.64 * (ix + (iy % 2) * 0.5) / cols;
        const gy = -0.82 + 1.64 * iy / cols;
        if (gx * gx + gy * gy > 0.82) continue;
        const p = toPx(gx, gy);
        ctx.fillStyle = '#ffd166'; ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.px, p.py, 4.2, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(p.px, p.py, 7.5, 0, 2 * Math.PI); ctx.stroke();
        drawn += 1;
      }
    }
  }
  ctx.restore();

  // hero labels (outside the clip)
  ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillStyle = expelled ? '#7dcdff' : '#ef8aa0';
  ctx.fillText('field intensity  |B| / B0', HERO.x0 + 4, HERO.y0 + 14);
  // compact colorbar (0 .. 3/2) top-right of the hero
  if (expelled) {
    const cb = { x: HERO.x1 - 138, y: HERO.y0 + 6, w: 120, h: 9 };
    for (let i = 0; i < cb.w; i += 1) {
      const c = viridis(i / cb.w);
      ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
      ctx.fillRect(cb.x + i, cb.y, 1, cb.h);
    }
    ctx.fillStyle = 'rgba(190,200,220,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono');
    ctx.textAlign = 'left'; ctx.fillText('0', cb.x - 8, cb.y + cb.h + 1);
    ctx.textAlign = 'center'; ctx.fillText('1', cb.x + cb.w / 1.5, cb.y + cb.h + 1);
    ctx.textAlign = 'right'; ctx.fillText('3/2', cb.x + cb.w + 14, cb.y + cb.h + 1);
  }
  // state caption under the sphere
  ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 600);
  if (inVortex) {
    ctx.fillStyle = 'rgba(255,209,102,0.92)';
    ctx.fillText('Abrikosov vortex lattice: flux threads in as quanta of Phi0', CX, HERO.y1 - 12);
  } else if (sc) {
    ctx.fillStyle = 'rgba(150,210,255,0.9)';
    ctx.fillText('B = 0 inside: the field is actively expelled (Meissner)', CX, HERO.y1 - 12);
  } else {
    ctx.fillStyle = 'rgba(239,140,160,0.9)';
    ctx.fillText('flux penetrates freely: the normal state', CX, HERO.y1 - 12);
  }
}

function drawPhase(sc, isII, inVortex) {
  const PX0 = 44, PX1 = 396, PY0 = 712, PY1 = 990;
  const Bc2fac = 2.4;
  const maxCurve = isII ? Bc2fac * st.Bc0 : st.Bc0;
  const yMax = Math.max(st.B0, maxCurve) * 1.16;
  const xT = (T) => PX0 + (T / 1.2) * (PX1 - PX0);
  const yB = (B) => PY1 - (Math.min(B, yMax) / yMax) * (PY1 - PY0);
  const Bc1f = (T) => criticalField(st.Bc0, T, Tc);
  const Bc2f = (T) => Bc2fac * criticalField(st.Bc0, T, Tc);

  // Meissner region (below Bc1): blue
  ctx.fillStyle = 'rgba(91,192,235,0.24)';
  ctx.beginPath(); ctx.moveTo(xT(0), yB(0));
  for (let i = 0; i <= 100; i += 1) { const T = i / 100; ctx.lineTo(xT(T), yB(Bc1f(T))); }
  ctx.lineTo(xT(1), yB(0)); ctx.closePath(); ctx.fill();
  if (isII) {
    ctx.fillStyle = 'rgba(255,209,102,0.18)';
    ctx.beginPath(); ctx.moveTo(xT(0), yB(Bc1f(0)));
    for (let i = 0; i <= 100; i += 1) { const T = i / 100; ctx.lineTo(xT(T), yB(Bc2f(T))); }
    for (let i = 100; i >= 0; i -= 1) { const T = i / 100; ctx.lineTo(xT(T), yB(Bc1f(T))); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) { const T = (i / 120) * 1.2; const X = xT(T), Y = yB(Bc2f(T)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
    ctx.stroke();
  }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.8; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const T = (i / 120) * 1.2; const X = xT(T), Y = yB(Bc1f(T)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();

  // axes
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();

  // operating point
  ctx.fillStyle = sc ? '#06d6a0' : (inVortex ? '#ffd166' : '#ef476f'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(xT(st.Tr), yB(st.B0), 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

  // labels
  ctx.fillStyle = 'rgba(170,180,200,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('T / Tc', (PX0 + PX1) / 2, PY1 + 22);
  ctx.save(); ctx.translate(PX0 - 26, (PY0 + PY1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('B0', 0, 0); ctx.restore();
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(isII ? 'Bc(T) phase diagram: Bc1 / Bc2' : 'Bc(T) phase diagram', PX0, PY0 - 12);
}

function drawSurface(sc) {
  const QX0 = 444, QX1 = 786, QY0 = 712, QY1 = 990;
  const yMax = 1.66;
  const xA = (a) => QX0 + (a / Math.PI) * (QX1 - QX0);   // colatitude 0..pi
  const yV = (v) => QY1 - (Math.min(v, yMax) / yMax) * (QY1 - QY0);

  // gridlines at 0.5, 1.0, 1.5
  ctx.strokeStyle = 'rgba(120,130,150,0.18)'; ctx.lineWidth = 1; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right';
  for (const v of [0.5, 1.0, 1.5]) {
    ctx.beginPath(); ctx.moveTo(QX0, yV(v)); ctx.lineTo(QX1, yV(v)); ctx.stroke();
    ctx.fillStyle = 'rgba(150,160,180,0.7)'; ctx.fillText(v.toFixed(1), QX0 - 6, yV(v) + 4);
  }

  // normal-state reference: uniform B0 (flat at 1.0)
  ctx.setLineDash([5, 4]); ctx.strokeStyle = sc ? 'rgba(239,140,160,0.55)' : 'rgba(239,140,160,0.95)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(xA(0), yV(1)); ctx.lineTo(xA(Math.PI), yV(1)); ctx.stroke();
  ctx.setLineDash([]);

  // superconducting surface field |Bt(theta)|/B0 = (3/2) sin(theta)
  ctx.fillStyle = sc ? 'rgba(91,192,235,0.20)' : 'rgba(91,192,235,0.08)';
  ctx.beginPath(); ctx.moveTo(xA(0), yV(0));
  for (let i = 0; i <= 120; i += 1) { const a = (i / 120) * Math.PI; ctx.lineTo(xA(a), yV(surfaceField(a, 1))); }
  ctx.lineTo(xA(Math.PI), yV(0)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sc ? '#5bc0eb' : 'rgba(91,192,235,0.45)'; ctx.lineWidth = sc ? 2.6 : 1.6; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const a = (i / 120) * Math.PI; const X = xA(a), Y = yV(surfaceField(a, 1)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();

  // equator marker + peak value
  const aEq = Math.PI / 2;
  ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(6,214,160,0.6)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xA(aEq), yV(0)); ctx.lineTo(xA(aEq), yV(1.5)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xA(aEq), yV(1.5), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(6,214,160,0.95)'; ctx.font = fontString(canvas, 'tick', 'mono', 600); ctx.textAlign = 'center';
  ctx.fillText('(3/2) B0', xA(aEq), yV(1.5) - 8);

  // axes
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(QX0, QY0); ctx.lineTo(QX0, QY1); ctx.lineTo(QX1, QY1); ctx.stroke();

  // axis labels
  ctx.fillStyle = 'rgba(170,180,200,0.8)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('pole', xA(0) + 12, QY1 + 22);
  ctx.fillText('equator', xA(aEq), QY1 + 22);
  ctx.fillText('pole', xA(Math.PI) - 12, QY1 + 22);
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText('surface field  |B(theta)| / B0', QX0, QY0 - 12);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const sc = isSuperconducting(st.B0, st.Bc0, st.Tr, Tc);
  const Bc = criticalField(st.Bc0, st.Tr, Tc);
  const isII = st.type === 'II';
  const inVortex = isII && st.Tr < Tc && st.B0 >= Bc && st.B0 < 2.4 * Bc;

  drawHero(sc, isII, inVortex);
  drawPhase(sc, isII, inVortex);
  drawSurface(sc);

  rState.textContent = sc ? 'Meissner' : (inVortex ? 'vortex' : 'normal');
  rBc.textContent = Bc.toFixed(4);
  rB0.textContent = st.B0.toFixed(4);
  rEq.textContent = ((sc || inVortex) ? surfaceField(Math.PI / 2, st.B0) : st.B0).toFixed(4);
  rVx.textContent = inVortex ? String(vortexCount(st.B0, Math.PI * (RW * 1e-7) ** 2)) : '0';
}

function syncLabels() { vT.textContent = st.Tr.toFixed(2); vB.textContent = st.B0.toFixed(3); vBc0.textContent = st.Bc0.toFixed(3); }
// Auto-sweep the temperature across Tc so the Meissner transition plays on
// load: below the critical parabola the field is expelled, above it the flux
// floods back. Any control pauses it.
let playing = false, raf = 0, tDir = 1, last = 0;
const trLo = parseFloat(sT.min); const trHi = parseFloat(sT.max);
const tMin = Number.isFinite(trLo) ? trLo : 0.1, tMax = Number.isFinite(trHi) ? trHi : 1.1;
function animate(now) {
  if (!playing) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  st.Tr += tDir * dt * ((tMax - tMin) / 12);
  if (st.Tr >= tMax) { st.Tr = tMax; tDir = -1; } else if (st.Tr <= tMin) { st.Tr = tMin; tDir = 1; }
  sT.value = String(st.Tr); syncLabels(); render();
  raf = requestAnimationFrame(animate);
}
function setPlaying(on) { playing = on; if (on) { last = performance.now(); raf = requestAnimationFrame(animate); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } }
function pause() { if (playing) setPlaying(false); }

sT.addEventListener('input', () => { pause(); st.Tr = parseFloat(sT.value); syncLabels(); render(); });
sB.addEventListener('input', () => { pause(); st.B0 = parseFloat(sB.value); syncLabels(); render(); });
selType.addEventListener('change', () => { st.type = selType.value; render(); });   // sweep continues across types
sBc0.addEventListener('input', () => { pause(); st.Bc0 = parseFloat(sBc0.value); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.Tr = 0.4; st.B0 = 0.03; st.type = 'I'; st.Bc0 = 0.08;
  sT.value = '0.4'; sB.value = '0.03'; selType.value = 'I'; sBc0.value = '0.08'; syncLabels();
  if (!prefersReducedMotion()) setPlaying(true); else render();
});

function bootSync() {
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.Tr = 0.15 + f * 0.95;                              // cool -> warm across Tc
    sT.value = String(st.Tr); syncLabels();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  } else if (!prefersReducedMotion()) {
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
  const Bc = criticalField(st.Bc0, st.Tr, Tc);
  const sc = isSuperconducting(st.B0, st.Bc0, st.Tr, Tc);
  return {
    fields: [
      { key: 'temperature', label: 'T / Tc', value: st.Tr, format: 'float' },
      { key: 'applied-field', label: 'B0 (tesla)', value: st.B0, format: 'float' },
      { key: 'critical-field', label: 'Bc (tesla)', value: Bc, format: 'float' },
      { key: 'state', label: 'State', value: sc ? 'superconducting' : 'normal' }
    ]
  };
};
window.playground.getInvariants = function () {
  const Bc = criticalField(st.Bc0, st.Tr, Tc);
  const sc = isSuperconducting(st.B0, st.Bc0, st.Tr, Tc);
  return [
    {
      key: 'phase-boundary',
      label: 'Phase boundary check',
      value: sc ? 'SC' : 'N',
      status: (sc && st.B0 < Bc) || (!sc && st.B0 >= Bc) ? 'pass' : 'drift'
    }
  ];
};
