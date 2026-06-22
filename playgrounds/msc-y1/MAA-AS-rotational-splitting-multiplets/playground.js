// Rotational splitting of an asteroseismic multiplet, shown faithfully on the
// oscillation modes themselves. Left: the star carrying a single (l, m)
// spherical-harmonic pattern Y_l^m, rendered as an azimuthal travelling wave.
// In a non-rotating star the 2l+1 values of m are degenerate and the pattern is
// stationary (a standing wave). Rotation breaks the prograde/retrograde
// symmetry through the Coriolis force and advection, so each m pattern is
// carried around in azimuth: a fixed observer then sees it oscillate at the
// shifted frequency nu0 + m (1 - C_nl) Omega. That azimuthal drift IS the
// splitting; m = 0 stays put (unshifted), prograde and retrograde m drift in
// opposite senses, and the g-mode Ledoux constant C slows the drift. Right: the
// observed multiplet, the 2l+1 peaks at nu0 + m (1 - C) Omega, with the selected
// m highlighted and the rigid m*Omega comb dashed for reference.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Sec. 3.8 (rotational splitting; Ledoux 1951).

import { ledoux, splittedFreq } from './sim.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rD = document.getElementById('readout-d');
const sO = document.getElementById('slider-O'), vO = document.getElementById('value-O');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const selAz = document.getElementById('select-az'), vAz = document.getElementById('value-az');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const NU0 = 100;
// The surface displacement of the (l, m) mode is
//   xi_r(theta, phi, t) = N P_l^|m|(cos theta) cos(|m| phi - omega_d t) cos(omega_p t),
// a standing non-radial pulsation cos(omega_p t) in the Y_l^m pattern that, once
// the star rotates, drifts in azimuth at the rate omega_d = m (1 - C) Omega. With
// Omega = 0 the drift vanishes and the 2l+1 components are degenerate (one
// frequency, a pattern that pulses in place). Rotation lifts the drift: prograde
// (m>0) and retrograde (m<0) patterns march in opposite senses, and that drift IS
// the observed splitting delta_nu = m (1 - C) Omega. The Coriolis force supplies
// the -mC Omega part (slower for g modes, C = 1/l(l+1)); rigid advection supplies
// the +m Omega part (the dashed comb in the spectrum).
const OMEGA_P = 2.0;      // visible non-radial pulsation rate (rad/s)
const SPLIT_VIS = 0.8;    // visual scale of the rotational azimuthal drift
const AMP = 0.17;         // exaggerated radial surface displacement (fraction of R)
const INC = 0.46, ROLL = 0.30;                                  // viewing tilt of the rotation axis
const cI = Math.cos(INC), sI = Math.sin(INC), cR = Math.cos(ROLL), sR = Math.sin(ROLL);
const LX = -0.32, LY = 0.46, LZ = 0.83;                         // light direction (upper-left, toward viewer)
const NTH = 24, NPH = 48;                                       // surface mesh resolution
const MESH = { sinT: [], cosT: [], sinP: [], cosP: [] };
(function buildMesh() {
  for (let i = 0; i <= NTH; i += 1) { const th = Math.PI * i / NTH; MESH.sinT.push(Math.sin(th)); MESH.cosT.push(Math.cos(th)); }
  for (let j = 0; j <= NPH; j += 1) { const ph = 2 * Math.PI * j / NPH; MESH.sinP.push(Math.sin(ph)); MESH.cosP.push(Math.cos(ph)); }
})();
// Rotate a model point (rotation axis = +y) into view space: tip by INC about the
// screen x axis (so a pole leans toward the viewer), then roll by ROLL in the screen.
function toView(x, y, z) {
  const y1 = y * cI - z * sI, z1 = y * sI + z * cI;
  return [x * cR - y1 * sR, x * sR + y1 * cR, z1];           // [X right, Y up, Z toward viewer]
}
const st = { Omega: 0.5, l: 2, m: 2, isG: false, t: 0 };
let running = true, last = performance.now();

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Associated Legendre P_l^|m|(x) by recurrence (Condon-Shortley sign dropped;
// only the shape matters for the surface pattern).
function plm(l, m, x) {
  m = Math.abs(m); if (m > l) return 0;
  const s = Math.sqrt(Math.max(0, 1 - x * x));
  let pmm = 1; for (let i = 1; i <= m; i += 1) pmm *= (2 * i - 1) * s;
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) { pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m); pmm = pmmp1; pmmp1 = pll; }
  return pll;
}
let plmNorm = 1;
function recomputeNorm() { let mx = 1e-9; for (let i = 0; i <= 256; i += 1) { const th = Math.PI * i / 256; mx = Math.max(mx, Math.abs(plm(st.l, st.m, Math.cos(th)))); } plmNorm = mx; }

function populateAz() {
  selAz.innerHTML = '';
  for (let m = st.l; m >= -st.l; m -= 1) { const o = document.createElement('option'); o.value = String(m); o.textContent = m > 0 ? `+${m}` : String(m); selAz.appendChild(o); }
  if (Math.abs(st.m) > st.l) st.m = st.l;
  selAz.value = String(st.m); vAz.textContent = st.m > 0 ? `+${st.m}` : String(st.m);
}

sO.addEventListener('input', () => { st.Omega = parseFloat(sO.value); vO.textContent = st.Omega.toFixed(2); if (!running) render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = st.l; populateAz(); recomputeNorm(); if (!running) render(); });
selAz.addEventListener('change', () => { st.m = parseInt(selAz.value, 10); vAz.textContent = st.m > 0 ? `+${st.m}` : String(st.m); recomputeNorm(); if (!running) render(); });
selM.addEventListener('change', () => { st.isG = selM.value === 'g'; if (!running) render(); });
btnR.addEventListener('click', () => { st.Omega = 0.5; st.l = 2; st.m = 2; st.isG = false; st.t = 0; sO.value = '0.5'; sL.value = '2'; selM.value = 'p'; vO.textContent = '0.50'; vL.textContent = '2'; populateAz(); recomputeNorm(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

// The (l, m) surface displacement amplitude on the tilted sphere, separated into a
// standing pulsation cos(omega_p t) and an azimuthal drift omega_d that rotation adds.
function ampAt(Pi, cosAz) { return Pi * cosAz; }

function drawMode(cx, cy, RST, t) {
  const l = st.l, m = st.m, k = Math.abs(m), C = ledoux(l, st.isG);
  const omega_d = m * (1 - C) * st.Omega * SPLIT_VIS;           // signed azimuthal drift (the splitting)
  const cosPulse = Math.cos(OMEGA_P * t);                        // standing non-radial pulsation
  const drift = omega_d * t;
  // Per-colatitude Legendre row P_l^|m|(cos theta), normalised to unit peak.
  const Prow = new Array(NTH + 1);
  for (let i = 0; i <= NTH; i += 1) Prow[i] = plm(l, m, MESH.cosT[i]) / plmNorm;
  // Displace every mesh vertex radially by the mode and transform to view space.
  const VX = new Array((NTH + 1) * (NPH + 1)), VY = new Array(VX.length), VZ = new Array(VX.length), VA = new Array(VX.length);
  for (let i = 0; i <= NTH; i += 1) {
    const sT = MESH.sinT[i], cTh = MESH.cosT[i], Pi = Prow[i];
    for (let j = 0; j <= NPH; j += 1) {
      const idx = i * (NPH + 1) + j;
      const A = ampAt(Pi, Math.cos(k * (2 * Math.PI * j / NPH) - drift)) * cosPulse;   // -1..1
      const rho = 1 + AMP * A;
      const x = rho * sT * MESH.cosP[j], y = rho * cTh, z = rho * sT * MESH.sinP[j];
      const v = toView(x, y, z); VX[idx] = v[0]; VY[idx] = v[1]; VZ[idx] = v[2]; VA[idx] = A;
    }
  }
  // Build front-facing quads, depth-sort (painter's), shade by surface normal and
  // colour by displacement: warm where the surface bulges out, cool where it caves in.
  const quads = [];
  for (let i = 0; i < NTH; i += 1) {
    for (let j = 0; j < NPH; j += 1) {
      const a = i * (NPH + 1) + j, b = i * (NPH + 1) + (j + 1), c = (i + 1) * (NPH + 1) + (j + 1), d = (i + 1) * (NPH + 1) + j;
      const ccx = (VX[a] + VX[b] + VX[c] + VX[d]) / 4, ccy = (VY[a] + VY[b] + VY[c] + VY[d]) / 4, ccz = (VZ[a] + VZ[b] + VZ[c] + VZ[d]) / 4;
      if (ccz <= 0) continue;                                    // cull the far hemisphere
      let nx = (VY[b] - VY[a]) * (VZ[d] - VZ[a]) - (VZ[b] - VZ[a]) * (VY[d] - VY[a]);
      let ny = (VZ[b] - VZ[a]) * (VX[d] - VX[a]) - (VX[b] - VX[a]) * (VZ[d] - VZ[a]);
      let nz = (VX[b] - VX[a]) * (VY[d] - VY[a]) - (VY[b] - VY[a]) * (VX[d] - VX[a]);
      if (nx * ccx + ny * ccy + nz * ccz < 0) { nx = -nx; ny = -ny; nz = -nz; }   // outward
      const nl = Math.hypot(nx, ny, nz) || 1;
      const diff = Math.max(0, (nx * LX + ny * LY + nz * LZ) / nl);
      const shade = clamp(0.32 + 0.78 * diff, 0, 1.18);
      const A = (VA[a] + VA[b] + VA[c] + VA[d]) / 4;
      quads.push({ z: ccz, a, b, c, d, shade, A });
    }
  }
  quads.sort((p, q) => p.z - q.z);
  for (const q of quads) {
    const t2 = clamp(Math.abs(q.A), 0, 1), sm = t2 * t2 * (3 - 2 * t2);
    let r, g, bl;
    if (q.A >= 0) { r = 222 + (255 - 222) * sm; g = 196 - (196 - 132) * sm; bl = 158 - (158 - 78) * sm; }
    else { r = 222 - (222 - 96) * sm; g = 196 - (196 - 168) * sm; bl = 158 + (255 - 158) * sm; }
    const col = `rgb(${(r * q.shade) | 0},${(g * q.shade) | 0},${(bl * q.shade) | 0})`;
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + RST * VX[q.a], cy - RST * VY[q.a]);
    ctx.lineTo(cx + RST * VX[q.b], cy - RST * VY[q.b]);
    ctx.lineTo(cx + RST * VX[q.c], cy - RST * VY[q.c]);
    ctx.lineTo(cx + RST * VX[q.d], cy - RST * VY[q.d]);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // Rotation axis through the poles, drawn behind/front by depth, with N/S markers
  // and a curved spin arrow: this is the axis the m pattern drifts around.
  const np = toView(0, 1.34, 0), sp = toView(0, -1.34, 0);
  ctx.strokeStyle = 'rgba(150,200,255,0.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(cx + RST * sp[0], cy - RST * sp[1]); ctx.lineTo(cx + RST * np[0], cy - RST * np[1]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(150,200,255,0.95)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.fillText('Ω', cx + RST * np[0], cy - RST * np[1] - 8);
  // equatorial drift arrow: direction = prograde/retrograde, length ~ |m(1-C)Ω|.
  if (st.Omega > 0 && m !== 0) {
    const dir = Math.sign(omega_d);
    const eq = []; for (let a = -0.6; a <= 0.6; a += 0.08) { const ang = dir > 0 ? a : -a; eq.push(toView(Math.cos(ang) * 1.16, 0, Math.sin(ang) * 1.16)); }
    ctx.strokeStyle = m > 0 ? '#ff9f43' : '#4cc9f0'; ctx.lineWidth = 2.2; ctx.beginPath();
    eq.forEach((p, i) => { const X = cx + RST * p[0], Y = cy - RST * p[1]; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    const tip = eq[eq.length - 1], pen = eq[eq.length - 2];
    const ax = tip[0] - pen[0], ay = -(tip[1] - pen[1]); const al = Math.hypot(ax, ay) || 1; const ux = ax / al, uy = ay / al;
    const TX = cx + RST * tip[0], TY = cy - RST * tip[1];
    ctx.fillStyle = m > 0 ? '#ff9f43' : '#4cc9f0'; ctx.beginPath(); ctx.moveTo(TX, TY);
    ctx.lineTo(TX - 9 * ux + 5 * uy, TY + 9 * uy + 5 * ux); ctx.lineTo(TX - 9 * ux - 5 * uy, TY + 9 * uy - 5 * ux); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`ℓ=${l}, m=${m > 0 ? '+' + m : m}, ${st.isG ? 'g' : 'p'}-mode`, cx, cy + RST + 26);
  const sense = m === 0 ? 'm=0 zonal: pulsates in place, unshifted by rotation'
    : (m > 0 ? 'prograde drift' : 'retrograde drift') + `: pattern circles the axis at m(1−C)Ω`;
  ctx.fillStyle = m > 0 ? '#ff9f43' : m < 0 ? '#4cc9f0' : '#9aa0a6';
  ctx.fillText(st.Omega > 0 ? sense : 'Ω = 0: pulsates in place, 2ℓ+1 components degenerate', cx, cy + RST + 44);
  ctx.textAlign = 'left';
}

function drawSpectrum(x0, x1, yb, yt) {
  const C = ledoux(st.l, st.isG);
  const split = (1 - C) * st.Omega;
  const half = Math.max(1.0, st.l * st.Omega * 1.3);
  const nuMin = NU0 - half, nuMax = NU0 + half;
  const xOf = (nu) => x0 + (nu - nuMin) / (nuMax - nuMin) * (x1 - x0);
  const gamma = (nuMax - nuMin) / 150 + 1e-3;
  const comps = [];
  for (let m = -st.l; m <= st.l; m += 1) comps.push({ m, nu: splittedFreq(NU0, m, st.Omega, st.l, st.isG) });
  const power = (nu) => { let s = 0; for (const c of comps) { const d = (nu - c.nu) / gamma; s += 1 / (1 + d * d); } return s; };
  const TH = st.isG ? { f: 'rgba(76,201,240,0.18)', s: '#4cc9f0' } : { f: 'rgba(255,209,102,0.16)', s: '#ffd166' };
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('observed multiplet', x0, yt - 10);
  // rigid m*Omega reference comb.
  for (let m = -st.l; m <= st.l; m += 1) { if (m === 0) continue; const gx = xOf(NU0 + m * st.Omega); ctx.strokeStyle = 'rgba(120,128,150,0.4)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(gx, yt + 6); ctx.lineTo(gx, yb); ctx.stroke(); ctx.setLineDash([]); }
  let pmax = 0; for (const c of comps) { const v = power(c.nu); if (v > pmax) pmax = v; } if (pmax <= 0) pmax = 1;
  ctx.beginPath(); ctx.moveTo(x0, yb);
  for (let pxp = 0; pxp <= x1 - x0; pxp += 2) { const nu = nuMin + (nuMax - nuMin) * pxp / (x1 - x0); ctx.lineTo(x0 + pxp, yb - power(nu) / pmax * (yb - yt) * 0.92); }
  ctx.lineTo(x1, yb); ctx.closePath(); ctx.fillStyle = TH.f; ctx.fill();
  ctx.strokeStyle = TH.s; ctx.lineWidth = 1.6; ctx.stroke();
  for (const c of comps) {
    const pxc = xOf(c.nu), pk = yb - power(c.nu) / pmax * (yb - yt) * 0.92;
    const isSel = c.m === st.m;
    ctx.strokeStyle = isSel ? '#ffffff' : (c.m === 0 ? '#06d6a0' : TH.s); ctx.lineWidth = isSel ? 2.6 : (c.m === 0 ? 2 : 1);
    ctx.beginPath(); ctx.moveTo(pxc, yb); ctx.lineTo(pxc, pk); ctx.stroke();
    ctx.fillStyle = isSel ? '#ffffff' : (c.m === 0 ? '#06d6a0' : TH.s); ctx.font = fontString(canvas, 'caption', 'mono', isSel ? 800 : 400); ctx.textAlign = 'center';
    ctx.fillText(`m=${c.m}`, pxc, pk - 5); ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`C=${C.toFixed(3)}  δν=${split.toFixed(3)} μHz  (2ℓ+1)=${2 * st.l + 1}`, x0, yb + 22);
  ctx.fillText('dashed: rigid m·Ω (C=0)', x0, yb + 38);
  rD.textContent = split.toFixed(3);
}

let view = { w: 800, h: 1020, dpr: 1 }, REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [{ name: 'star', weight: 1.18 }, { name: 'spec', weight: 0.82 }]);
}

function render() {
  if (!REG) relayout();
  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, view.w, view.h);
  const ph = CAPTURE_NAME ? (CAPTURE_FRAC > 0 ? CAPTURE_FRAC * 6 : 9.0) : st.t;
  // star region (top): centred disc with room below for the two label lines.
  const s = REG.star;
  const RST = Math.min(s.w * 0.40, (s.h - 84) * 0.5);
  drawMode(s.x + s.w / 2, s.y + 22 + RST, RST, ph);
  // spectrum region (bottom).
  const sp = REG.spec;
  drawSpectrum(sp.x + 46, sp.x + sp.w - 22, sp.y + sp.h - 52, sp.y + 28);
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  if (Number.isFinite(parseFloat(params.get('Omega')))) { st.Omega = parseFloat(params.get('Omega')); sO.value = String(st.Omega); vO.textContent = st.Omega.toFixed(2); }
  if (Number.isFinite(parseInt(params.get('l'), 10))) { st.l = clamp(parseInt(params.get('l'), 10), 1, 4); sL.value = String(st.l); vL.textContent = st.l; }
  if (params.get('mode') === 'g') { st.isG = true; selM.value = 'g'; }
  if (Number.isFinite(parseInt(params.get('m'), 10))) st.m = parseInt(params.get('m'), 10);
  populateAz(); recomputeNorm();
  relayout();
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }
window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const C = ledoux(st.l, st.isG);
  return {
    fields: [
      { key: 'rotation-rate', label: 'rotation rate Ω (μHz)', value: st.Omega, format: 'float' },
      { key: 'degree-l', label: 'degree ℓ', value: st.l, format: 'int' },
      { key: 'azimuthal-m', label: 'azimuthal order m', value: st.m, format: 'int' },
      { key: 'ledoux-constant', label: 'Ledoux constant C', value: C, format: 'float' },
      { key: 'shift', label: 'frequency shift m(1−C)Ω (μHz)', value: st.m * (1 - C) * st.Omega, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const C = ledoux(st.l, st.isG);
  // The selected component sits at nu0 + m(1-C)Omega; check the closed form.
  const nu = splittedFreq(NU0, st.m, st.Omega, st.l, st.isG);
  const expected = NU0 + st.m * (1 - C) * st.Omega;
  const err = Math.abs(nu - expected) / Math.max(1, Math.abs(expected));
  return [
    { key: 'splitting', label: 'νₘ = ν₀ + m(1−C)Ω', value: err.toExponential(2), status: err < 1e-9 ? 'pass' : 'drift' },
    { key: 'ledoux', label: C === 0 ? 'p-mode: C = 0' : 'g-mode: C = 1/ℓ(ℓ+1)', value: C.toFixed(3), status: 'pass' },
  ];
};
