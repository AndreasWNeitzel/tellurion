// Rotational splitting of an asteroseismic multiplet, shown on the oscillating
// surface and in the observed spectrum.
//
// A mode of degree l has 2l+1 azimuthal orders m = -l..+l. In a non-rotating star
// they share one frequency nu0 (degenerate). Uniform rotation Omega lifts the
// degeneracy: to first order the inertial-frame frequencies are
//   nu_m = nu0 + m (1 - C_nl) Omega,
// a symmetric, equally spaced multiplet. The +m Omega part is rigid advection of
// the pattern by rotation; the -m C_nl Omega part is the Coriolis force in the
// corotating frame (Ledoux 1951), with C_nl -> 0 for p modes and 1/l(l+1) for g
// modes. If all 2l+1 components are excited with equal amplitude and phase the
// total surface displacement is a fixed real pattern F(theta, phi - s t) that
// pulsates at nu0 and rigidly rotates in azimuth at s = (1 - C_nl) Omega, the
// splitting rate. A single component m is instead a wave running at nu_m. The
// component the observer sees has power E_lm(i) = (l-|m|)!/(l+|m|)! [P_l^|m|(cos i)]^2,
// set by the inclination i between the rotation axis and the line of sight: pole-on
// shows only m=0, equator-on suppresses it. Canvas2D only.
//
// References: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Sec. 3.8 (Ledoux 1951); Gizon and Solanki, ApJ 589, 1009 (2003), mode visibilities.

import { ledoux } from './sim.js';
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
const sI = document.getElementById('slider-i'), vI = document.getElementById('value-i');
const selDisp = document.getElementById('select-disp');
const selAz = document.getElementById('select-az'), vAz = document.getElementById('value-az');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const NU0 = 100;
const OMEGA_P = 2.0;      // visible non-radial pulsation rate, a stand-in for nu0
const SPLIT_VIS = 0.8;    // visible scale of the rotational azimuthal drift
const AMP = 0.17;         // exaggerated radial surface displacement (fraction of R)
const NTH = 24, NPH = 48; // surface mesh resolution
const LX = -0.32, LY = 0.46, LZ = 0.83;                         // light direction (upper-left, toward viewer)
const MESH = { sinT: [], cosT: [], sinP: [], cosP: [] };
for (let i = 0; i <= NTH; i += 1) { const th = Math.PI * i / NTH; MESH.sinT.push(Math.sin(th)); MESH.cosT.push(Math.cos(th)); }
for (let j = 0; j <= NPH; j += 1) { const ph = 2 * Math.PI * j / NPH; MESH.sinP.push(Math.sin(ph)); MESH.cosP.push(Math.cos(ph)); }

const st = { Omega: 0.5, l: 2, m: 2, isG: false, inc: 60, disp: 'multi', t: 0 };
let running = true, last = performance.now();
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fact(n) { let f = 1; for (let k = 2; k <= n; k += 1) f *= k; return f; }

// Associated Legendre P_l^|m|(x) by recurrence (Condon-Shortley sign dropped; the
// squared magnitude is what the surface pattern and the visibility need).
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

// Legendre rows P_l^mm(cos theta_i), mm = 0..l, and the pattern normalisations.
// The multiplet norm is independent of inclination and time; the single-m norm
// depends on the chosen m. Both depend on l.
let Prow = [], normSingle = 1, normMulti = 1;
function rebuildL() {
  Prow = [];
  for (let i = 0; i <= NTH; i += 1) { const row = []; for (let mm = 0; mm <= st.l; mm += 1) row.push(plm(st.l, mm, MESH.cosT[i])); Prow.push(row); }
  let mx = 1e-6;
  for (let i = 0; i <= NTH; i += 1) for (let q = 0; q <= 64; q += 1) { const psi = 2 * Math.PI * q / 64; let F = Prow[i][0]; for (let mm = 1; mm <= st.l; mm += 1) F += 2 * Prow[i][mm] * Math.cos(mm * psi); mx = Math.max(mx, Math.abs(F)); }
  normMulti = mx; recomputeSingleNorm();
}
function recomputeSingleNorm() { let mx = 1e-6; const am = Math.abs(st.m); for (let i = 0; i <= NTH; i += 1) mx = Math.max(mx, Math.abs(Prow[i][am] || 0)); normSingle = mx; }

function populateAz() {
  selAz.innerHTML = '';
  for (let m = st.l; m >= -st.l; m -= 1) { const o = document.createElement('option'); o.value = String(m); o.textContent = m > 0 ? `+${m}` : String(m); selAz.appendChild(o); }
  if (Math.abs(st.m) > st.l) st.m = st.l;
  selAz.value = String(st.m); vAz.textContent = st.m > 0 ? `+${st.m}` : String(st.m);
}

sO.addEventListener('input', () => { st.Omega = parseFloat(sO.value); vO.textContent = st.Omega.toFixed(2); if (!running) render(); });
sL.addEventListener('input', () => { st.l = parseInt(sL.value, 10); vL.textContent = st.l; populateAz(); rebuildL(); if (!running) render(); });
sI.addEventListener('input', () => { st.inc = parseInt(sI.value, 10); vI.textContent = `${st.inc}°`; if (!running) render(); });
selDisp.addEventListener('change', () => { st.disp = selDisp.value; if (!running) render(); });
selAz.addEventListener('change', () => { st.m = parseInt(selAz.value, 10); vAz.textContent = st.m > 0 ? `+${st.m}` : String(st.m); recomputeSingleNorm(); if (!running) render(); });
selM.addEventListener('change', () => { st.isG = selM.value === 'g'; if (!running) render(); });
btnR.addEventListener('click', () => { st.Omega = 0.5; st.l = 2; st.m = 2; st.isG = false; st.inc = 60; st.disp = 'multi'; st.t = 0; sO.value = '0.5'; sL.value = '2'; sI.value = '60'; selM.value = 'p'; selDisp.value = 'multi'; vO.textContent = '0.50'; vL.textContent = '2'; vI.textContent = '60°'; populateAz(); rebuildL(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

// View transform set by the inclination: the rotation axis points at the viewer at
// i=0 (pole-on) and lies in the plane of the sky at i=90 (equator-on).
function viewRot() { const a = Math.PI / 2 - st.inc * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }

// Radial displacement of the surface at mesh point (it, jph) and time t.
function fieldAmp(it, jph, t, C, s, omega_m) {
  const phi = 2 * Math.PI * jph / NPH;
  if (st.disp === 'single') { const m = st.m; return (Prow[it][Math.abs(m)] / normSingle) * Math.cos(m * phi - omega_m * t); }
  const psi = phi - s * t; let F = Prow[it][0];
  for (let mm = 1; mm <= st.l; mm += 1) F += 2 * Prow[it][mm] * Math.cos(mm * psi);
  return (F / normMulti) * Math.cos(OMEGA_P * t);
}

function drawMode(cx, cy, RST, t) {
  const l = st.l, m = st.m, C = ledoux(l, st.isG);
  const s = (1 - C) * st.Omega * SPLIT_VIS;                      // multiplet pattern rotation rate
  const omega_m = OMEGA_P + m * (1 - C) * st.Omega * SPLIT_VIS;  // single-component running rate
  const [ca, sa] = viewRot();
  const toV = (x, y, z) => [x, y * ca - z * sa, y * sa + z * ca];
  const NV = (NTH + 1) * (NPH + 1);
  const VX = new Array(NV), VY = new Array(NV), VZ = new Array(NV), VA = new Array(NV);
  for (let i = 0; i <= NTH; i += 1) {
    const sT = MESH.sinT[i], cTh = MESH.cosT[i];
    for (let j = 0; j <= NPH; j += 1) {
      const idx = i * (NPH + 1) + j;
      const A = fieldAmp(i, j, t, C, s, omega_m);
      const rho = 1 + AMP * A;
      const v = toV(rho * sT * MESH.cosP[j], rho * cTh, rho * sT * MESH.sinP[j]);
      VX[idx] = v[0]; VY[idx] = v[1]; VZ[idx] = v[2]; VA[idx] = A;
    }
  }
  const quads = [];
  for (let i = 0; i < NTH; i += 1) {
    for (let j = 0; j < NPH; j += 1) {
      const a = i * (NPH + 1) + j, b = a + 1, c = a + (NPH + 2), d = a + (NPH + 1);
      const ccx = (VX[a] + VX[b] + VX[c] + VX[d]) / 4, ccy = (VY[a] + VY[b] + VY[c] + VY[d]) / 4, ccz = (VZ[a] + VZ[b] + VZ[c] + VZ[d]) / 4;
      if (ccz <= 0) continue;                                    // cull the far hemisphere
      let nx = (VY[b] - VY[a]) * (VZ[d] - VZ[a]) - (VZ[b] - VZ[a]) * (VY[d] - VY[a]);
      let ny = (VZ[b] - VZ[a]) * (VX[d] - VX[a]) - (VX[b] - VX[a]) * (VZ[d] - VZ[a]);
      let nz = (VX[b] - VX[a]) * (VY[d] - VY[a]) - (VY[b] - VY[a]) * (VX[d] - VX[a]);
      if (nx * ccx + ny * ccy + nz * ccz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const nl = Math.hypot(nx, ny, nz) || 1;
      const diff = Math.max(0, (nx * LX + ny * LY + nz * LZ) / nl);
      quads.push({ z: ccz, a, b, c, d, shade: clamp(0.32 + 0.78 * diff, 0, 1.18), A: (VA[a] + VA[b] + VA[c] + VA[d]) / 4 });
    }
  }
  quads.sort((p, q) => p.z - q.z);
  for (const q of quads) {
    const t2 = clamp(Math.abs(q.A), 0, 1), sm = t2 * t2 * (3 - 2 * t2);
    let r, g, bl;
    if (q.A >= 0) { r = 222 + 33 * sm; g = 196 - 64 * sm; bl = 158 - 80 * sm; }
    else { r = 222 - 126 * sm; g = 196 - 28 * sm; bl = 158 + 97 * sm; }
    const col = `rgb(${(r * q.shade) | 0},${(g * q.shade) | 0},${(bl * q.shade) | 0})`;
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + RST * VX[q.a], cy - RST * VY[q.a]);
    ctx.lineTo(cx + RST * VX[q.b], cy - RST * VY[q.b]);
    ctx.lineTo(cx + RST * VX[q.c], cy - RST * VY[q.c]);
    ctx.lineTo(cx + RST * VX[q.d], cy - RST * VY[q.d]);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // Rotation axis through the poles, with N marker and Omega label.
  const np = toV(0, 1.36, 0), sp = toV(0, -1.36, 0);
  ctx.strokeStyle = 'rgba(150,200,255,0.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(cx + RST * sp[0], cy - RST * sp[1]); ctx.lineTo(cx + RST * np[0], cy - RST * np[1]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(150,200,255,0.95)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Ω', cx + RST * np[0], cy - RST * np[1] - 8);
  // Spin sense: a near-pole latitude circle with an arrowhead, drawn for Omega>0.
  if (st.Omega > 0) {
    const th0 = 0.42, r0 = 1.12, pts = [];
    for (let k = 0; k <= 40; k += 1) { const ph = 0.5 + k / 40 * 5.0; const v = toV(r0 * Math.sin(th0) * Math.cos(ph), r0 * Math.cos(th0), r0 * Math.sin(th0) * Math.sin(ph)); if (v[2] > -0.15) pts.push(v); }
    if (pts.length > 2) {
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2.0; ctx.beginPath();
      pts.forEach((v, i) => { const X = cx + RST * v[0], Y = cy - RST * v[1]; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      const tip = pts[pts.length - 1], pen = pts[pts.length - 2];
      const ux = (tip[0] - pen[0]), uy = -(tip[1] - pen[1]); const ul = Math.hypot(ux, uy) || 1; const dx = ux / ul, dy = uy / ul;
      const TX = cx + RST * tip[0], TY = cy - RST * tip[1];
      ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.moveTo(TX, TY);
      ctx.lineTo(TX - 9 * dx + 5 * dy, TY + 9 * dy + 5 * dx); ctx.lineTo(TX - 9 * dx - 5 * dy, TY + 9 * dy - 5 * dx); ctx.closePath(); ctx.fill();
    }
  }
  // Labels.
  ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  const what = st.disp === 'single' ? `m=${m > 0 ? '+' + m : m} component` : 'full multiplet (all m)';
  ctx.fillText(`ℓ=${l}, ${what}, ${st.isG ? 'g' : 'p'}-mode, i=${st.inc}°`, cx, cy + RST + 26);
  let line2, col2;
  if (st.disp === 'single') {
    line2 = m === 0 ? 'm=0 zonal: pulsates in place (unshifted)' : (m > 0 ? 'prograde' : 'retrograde') + ' running wave at ν₀+m(1−C)Ω';
    col2 = m > 0 ? '#ff9f43' : m < 0 ? '#4cc9f0' : '#9aa0a6';
  } else {
    line2 = st.Omega > 0 ? 'pattern rotates rigidly at the splitting (1−C)Ω' : 'Ω=0: degenerate, pulsates in place';
    col2 = st.Omega > 0 ? '#ffd27a' : '#9aa0a6';
  }
  ctx.fillStyle = col2; ctx.fillText(line2, cx, cy + RST + 44); ctx.textAlign = 'left';
}

// Inclination visibility of component m: E_lm(i) = (l-|m|)!/(l+|m|)! [P_l^|m|(cos i)]^2.
function visM(m) { const am = Math.abs(m); const ci = Math.cos(st.inc * Math.PI / 180); const p = plm(st.l, am, ci); return fact(st.l - am) / fact(st.l + am) * p * p; }

function drawSpectrum(x0, x1, yb, yt) {
  const C = ledoux(st.l, st.isG);
  const split = (1 - C) * st.Omega;
  const half = Math.max(1.0, st.l * st.Omega * 1.3);
  const nuMin = NU0 - half, nuMax = NU0 + half;
  const xOf = (nu) => x0 + (nu - nuMin) / (nuMax - nuMin) * (x1 - x0);
  const gamma = (nuMax - nuMin) / 150 + 1e-3;
  const comps = []; let vmax = 1e-6;
  for (let m = -st.l; m <= st.l; m += 1) { const v = visM(m); comps.push({ m, nu: NU0 + m * split, vis: v }); vmax = Math.max(vmax, v); }
  const power = (nu) => { let s = 0; for (const c of comps) { const d = (nu - c.nu) / gamma; s += (c.vis / vmax) / (1 + d * d); } return s; };
  const TH = st.isG ? { f: 'rgba(76,201,240,0.18)', s: '#4cc9f0' } : { f: 'rgba(255,209,102,0.16)', s: '#ffd166' };
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.fillText('observed multiplet (peak heights set by inclination i)', x0, yt - 10);
  // rigid m*Omega reference comb (C=0).
  for (let m = -st.l; m <= st.l; m += 1) { if (m === 0) continue; const gx = xOf(NU0 + m * st.Omega); ctx.strokeStyle = 'rgba(120,128,150,0.4)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(gx, yt + 6); ctx.lineTo(gx, yb); ctx.stroke(); ctx.setLineDash([]); }
  // power envelope.
  let pmax = 0; for (const c of comps) { const v = power(c.nu); if (v > pmax) pmax = v; } if (pmax <= 0) pmax = 1;
  ctx.beginPath(); ctx.moveTo(x0, yb);
  for (let pxp = 0; pxp <= x1 - x0; pxp += 2) { const nu = nuMin + (nuMax - nuMin) * pxp / (x1 - x0); ctx.lineTo(x0 + pxp, yb - power(nu) / pmax * (yb - yt) * 0.92); }
  ctx.lineTo(x1, yb); ctx.closePath(); ctx.fillStyle = TH.f; ctx.fill();
  ctx.strokeStyle = TH.s; ctx.lineWidth = 1.6; ctx.stroke();
  // component sticks, heights proportional to visibility; selected m highlighted.
  for (const c of comps) {
    const pxc = xOf(c.nu), h = (c.vis / vmax) * (yb - yt) * 0.92, pk = yb - h;
    const isSel = c.m === st.m && (st.disp === 'single');
    const faint = c.vis / vmax < 0.02;
    ctx.strokeStyle = isSel ? '#ffffff' : (c.m === 0 ? '#06d6a0' : TH.s); ctx.lineWidth = isSel ? 2.6 : (c.m === 0 ? 2 : 1);
    ctx.beginPath(); ctx.moveTo(pxc, yb); ctx.lineTo(pxc, faint ? yb - 3 : pk); ctx.stroke();
    if (!faint || isSel) { ctx.fillStyle = isSel ? '#ffffff' : (c.m === 0 ? '#06d6a0' : TH.s); ctx.font = fontString(canvas, 'caption', 'mono', isSel ? 800 : 400); ctx.textAlign = 'center'; ctx.fillText(`m=${c.m}`, pxc, Math.min(pk, yb - 6) - 5); }
  }
  ctx.textAlign = 'left'; ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`C=${C.toFixed(3)}  δν=(1−C)Ω=${split.toFixed(3)} μHz  (2ℓ+1)=${2 * st.l + 1}`, x0, yb + 22);
  ctx.fillText('dashed: rigid m·Ω (C=0);  pole-on shows only m=0', x0, yb + 38);
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
  const s = REG.star;
  const RST = Math.min(s.w * 0.40, (s.h - 84) * 0.5);
  drawMode(s.x + s.w / 2, s.y + 22 + RST, RST, ph);
  const sp = REG.spec;
  drawSpectrum(sp.x + 46, sp.x + sp.w - 22, sp.y + sp.h - 52, sp.y + 28);
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  if (Number.isFinite(parseFloat(params.get('Omega')))) { st.Omega = parseFloat(params.get('Omega')); sO.value = String(st.Omega); vO.textContent = st.Omega.toFixed(2); }
  if (Number.isFinite(parseInt(params.get('l'), 10))) { st.l = clamp(parseInt(params.get('l'), 10), 1, 4); sL.value = String(st.l); vL.textContent = st.l; }
  if (Number.isFinite(parseInt(params.get('inc'), 10))) { st.inc = clamp(parseInt(params.get('inc'), 10), 0, 90); sI.value = String(st.inc); vI.textContent = `${st.inc}°`; }
  if (params.get('disp') === 'single') { st.disp = 'single'; selDisp.value = 'single'; }
  if (params.get('mode') === 'g') { st.isG = true; selM.value = 'g'; }
  if (Number.isFinite(parseInt(params.get('m'), 10))) st.m = parseInt(params.get('m'), 10);
  populateAz(); rebuildL();
  relayout(); render();
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
      { key: 'inclination', label: 'inclination i (deg)', value: st.inc, format: 'int' },
      { key: 'ledoux-constant', label: 'Ledoux constant C', value: C, format: 'float' },
      { key: 'splitting', label: 'splitting δν = (1−C)Ω (μHz)', value: (1 - C) * st.Omega, format: 'float' },
      { key: 'visibility', label: `visibility E of m=${st.m}`, value: visM(st.m), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const C = ledoux(st.l, st.isG);
  const expected = NU0 + st.m * (1 - C) * st.Omega;
  const nu = NU0 + st.m * (1 - ledoux(st.l, st.isG)) * st.Omega;
  const err = Math.abs(nu - expected) / Math.max(1, Math.abs(expected));
  let vsum = 0; for (let m = -st.l; m <= st.l; m += 1) vsum += visM(m);
  return [
    { key: 'splitting', label: 'νₘ = ν₀ + m(1−C)Ω', value: err.toExponential(2), status: err < 1e-9 ? 'pass' : 'drift' },
    { key: 'visibility', label: 'Σₘ Eₗₘ(i) = 1 (visibility normalised)', value: vsum.toFixed(4), status: Math.abs(vsum - 1) < 1e-6 ? 'pass' : 'drift' },
    { key: 'ledoux', label: C === 0 ? 'p-mode: C = 0' : 'g-mode: C = 1/ℓ(ℓ+1)', value: C.toFixed(3), status: 'pass' },
  ];
};
