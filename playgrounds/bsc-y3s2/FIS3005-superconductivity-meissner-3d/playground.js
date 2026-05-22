import { fontString } from '../../../shared/js/canvas-type.js';
// The Meissner effect (Canvas2D). Cross-section of a superconducting
// sphere in a uniform field: the field lines (streamlines of the
// perfect-diamagnet field) bend around it and B = 0 inside, until
// T or B crosses the critical parabola and the flux floods back.
// Type II shows the Abrikosov vortex lattice. The inset is the
// Bc(T) phase diagram. sim.js is the gate-tested engine.

import {
  meissnerField, criticalField, isSuperconducting, surfaceField,
  vortexCount, vortexSpacing,
} from './sim.js';

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
const CX = 250, CY = H / 2, RW = 1.0, SCALE = 150;       // sphere radius 1 -> 150 px
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

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const sc = isSuperconducting(st.B0, st.Bc0, st.Tr, Tc);
  const Bc = criticalField(st.Bc0, st.Tr, Tc);

  // sphere
  const sR = RW * SCALE;
  ctx.fillStyle = sc ? 'rgba(91,192,235,0.16)' : 'rgba(239,71,111,0.12)';
  ctx.beginPath(); ctx.arc(CX, CY, sR, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = sc ? 'rgba(91,192,235,0.7)' : 'rgba(239,71,111,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(CX, CY, sR, 0, 2 * Math.PI); ctx.stroke();

  // London penetration layer (type I only, when superconducting):
  // a thin glowing layer at the surface showing exponential field decay.
  if (sc && st.type === 'I') {
    const lambdaL = 0.08 * sR;  // penetration depth in pixels (~ 8% of radius)
    const nRings = 8;
    for (let i = 0; i < nRings; i += 1) {
      const frac = i / nRings;
      const decay = Math.exp(-frac * 3);  // exponential decay over depth
      const rr = sR + frac * lambdaL;
      ctx.strokeStyle = `rgba(100,220,255,${0.4 * decay})`;
      ctx.lineWidth = Math.max(0.4, 1.2 * decay);
      ctx.beginPath(); ctx.arc(CX, CY, rr, 0, 2 * Math.PI); ctx.stroke();
    }
  }

  // field-line streamlines seeded across the top; the number of
  // lines is proportional to the applied flux B0 (a denser bundle
  // for a stronger field).
  const topZ = (CY - 20) / SCALE;
  ctx.lineWidth = 1.4;
  const nL = Math.max(7, Math.min(56, Math.round((st.B0 / 0.12) * 50) + 7));
  for (let s = 0; s <= nL; s += 1) {
    const X0 = -2.0 + s * (4.0 / nL);
    let X = X0, Z = topZ;
    const pts = [];
    for (let i = 0; i < 900; i += 1) {
      const r = Math.hypot(X, Z);
      if (sc && r < RW - 1e-3) break;                    // expelled: no field inside
      const f = fieldXZ(X, Z, sc);
      const m = Math.hypot(f.Bx, f.Bz) || 1e-9;
      X -= 0.012 * f.Bx / m;                             // march top-to-bottom along -B
      Z -= 0.012 * f.Bz / m;
      pts.push(toPx(X, Z));
      if (Z < -topZ || Math.abs(X) > 2.4) break;
    }
    if (pts.length < 2) continue;
    ctx.strokeStyle = sc ? 'rgba(120,170,235,0.55)' : 'rgba(239,140,160,0.5)';
    ctx.beginPath(); ctx.moveTo(pts[0].px, pts[0].py);
    for (const p of pts) ctx.lineTo(p.px, p.py);
    ctx.stroke();
  }

  // type-II: the field threads the sphere as a triangular Abrikosov
  // vortex lattice (more vortices for a stronger field).
  if (st.type === 'II' && st.Tr < Tc) {
    const nApprox = Math.min(140, 10 + Math.round(60 * st.B0 / st.Bc0));
    const cols = Math.ceil(Math.sqrt(nApprox));
    let drawn = 0;
    for (let iy = 0; iy < cols && drawn < nApprox; iy += 1) {
      for (let ix = 0; ix < cols && drawn < nApprox; ix += 1) {
        const gx = (-0.85 + 1.7 * (ix + (iy % 2) * 0.5) / cols);
        const gy = (-0.85 + 1.7 * iy / cols);
        if (gx * gx + gy * gy > 0.85) continue;
        const p = toPx(gx, gy);
        ctx.fillStyle = '#ffd166'; ctx.strokeStyle = 'rgba(255,209,102,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.px, p.py, 4.5, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(p.px, p.py, 8, 0, 2 * Math.PI); ctx.stroke();
        drawn += 1;
      }
    }
    ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText('Abrikosov vortices (1 Phi0 each)', CX, CY + sR + 28);
  } else {
    ctx.fillStyle = 'rgba(150,160,180,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(sc ? 'B = 0 inside (Meissner)' : 'flux penetrates (normal)', CX, CY + sR + 28);
  }

  // phase diagram inset: type I has one Bc(T); type II has Bc1 and
  // Bc2 with a vortex region between. The whole panel reshapes with
  // the type and Bc0.
  const GX0 = 500, GX1 = W - 30, GY0 = 70, GY1 = H - 70;
  const isII = st.type === 'II';
  const Bc2fac = 2.4;
  // Fixed B axis (covers Bc0_max = 0.12 and type-II Bc2 ~ 0.29) so
  // changing Bc0 actually moves the parabola, not just the scale.
  const yMax = 0.32;
  ctx.strokeStyle = 'rgba(150,160,180,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(GX0, GY0); ctx.lineTo(GX0, GY1); ctx.lineTo(GX1, GY1); ctx.stroke();
  const xT = (T) => GX0 + (T / 1.2) * (GX1 - GX0);
  const yB = (B) => GY1 - (Math.min(B, yMax) / yMax) * (GY1 - GY0);
  const Bc1f = (T) => criticalField(st.Bc0, T, Tc);
  const Bc2f = (T) => Bc2fac * criticalField(st.Bc0, T, Tc);
  // Meissner region (below Bc1): blue
  ctx.fillStyle = 'rgba(91,192,235,0.24)';
  ctx.beginPath(); ctx.moveTo(xT(0), yB(0));
  for (let i = 0; i <= 100; i += 1) { const T = i / 100; ctx.lineTo(xT(T), yB(Bc1f(T))); }
  ctx.lineTo(xT(1), yB(0)); ctx.closePath(); ctx.fill();
  if (isII) {
    // vortex (mixed) region between Bc1 and Bc2: gold
    ctx.fillStyle = 'rgba(255,209,102,0.20)';
    ctx.beginPath(); ctx.moveTo(xT(0), yB(Bc1f(0)));
    for (let i = 0; i <= 100; i += 1) { const T = i / 100; ctx.lineTo(xT(T), yB(Bc2f(T))); }
    for (let i = 100; i >= 0; i -= 1) { const T = i / 100; ctx.lineTo(xT(T), yB(Bc1f(T))); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) { const T = (i / 120) * 1.2; const X = xT(T), Y = yB(Bc2f(T)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
    ctx.stroke();
  }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 3.2; ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const T = (i / 120) * 1.2; const X = xT(T), Y = yB(Bc1f(T)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();
  const inVortex = isII && st.Tr < Tc && st.B0 > Bc1f(st.Tr) && st.B0 < Bc2f(st.Tr);
  ctx.fillStyle = sc ? '#06d6a0' : (inVortex ? '#ffd166' : '#ef476f'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(xT(st.Tr), yB(st.B0), 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(150,160,180,0.75)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('T / Tc', (GX0 + GX1) / 2, H - 22);
  ctx.save(); ctx.translate(GX0 - 20, (GY0 + GY1) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'left'; ctx.fillText('B', 0, 0); ctx.restore();
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(isII ? 'Bc1 (blue) / Bc2 (gold)' : 'Bc(T): superconducting below', (GX0 + GX1) / 2, GY0 - 8);

  rState.textContent = sc ? 'Meissner' : (inVortex ? 'vortex' : 'normal');
  rBc.textContent = Bc.toFixed(4);
  rB0.textContent = st.B0.toFixed(4);
  rEq.textContent = (sc ? surfaceField(Math.PI / 2, st.B0) : st.B0).toFixed(4);
  rVx.textContent = st.type === 'II' && sc ? String(vortexCount(st.B0, 3.14 * (RW * 1e-7) ** 2)) : '0';
}

function syncLabels() { vT.textContent = st.Tr.toFixed(2); vB.textContent = st.B0.toFixed(3); vBc0.textContent = st.Bc0.toFixed(3); }
sT.addEventListener('input', () => { st.Tr = parseFloat(sT.value); syncLabels(); render(); });
sB.addEventListener('input', () => { st.B0 = parseFloat(sB.value); syncLabels(); render(); });
selType.addEventListener('change', () => { st.type = selType.value; render(); });
sBc0.addEventListener('input', () => { st.Bc0 = parseFloat(sBc0.value); syncLabels(); render(); });
bR.addEventListener('click', () => {
  st.Tr = 0.4; st.B0 = 0.03; st.type = 'I'; st.Bc0 = 0.08;
  sT.value = '0.4'; sB.value = '0.03'; selType.value = 'I'; sBc0.value = '0.08'; syncLabels(); render();
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
  const nv = vortexCount(st.B0, st.Bc0, st.Tr, Tc, 1.0);
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
  const tc_parabola = (1 - (st.Tr / Tc) ** 2);
  return [
    {
      key: 'phase-boundary',
      label: 'Phase boundary check',
      value: sc ? 'SC' : 'N',
      status: (sc && st.B0 < Bc) || (!sc && st.B0 >= Bc) ? 'pass' : 'drift'
    }
  ];
};
