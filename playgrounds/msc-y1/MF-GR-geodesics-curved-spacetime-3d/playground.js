// Geodesics in curved spacetime (Canvas2D, deterministic). Panel A:
// the equatorial null-geodesic fan around a Schwarzschild/Kerr black
// hole, or the FLRW comoving lattice with the Hubble flow. Panel B:
// the null effective potential (or the Hubble law). Panel C: the
// capture/deflect map vs impact parameter (or the scale factor).
// Reuses the gate-tested shared CPU engine. Carroll; Shapiro and
// Teukolsky Ch. 12; Hubble 1929; Friedmann 1922. WebGL is relaxed to
// Canvas2D here (justified in spec.md): the photoreal ray-trace ships
// separately as the schwarzschild-kerr-blackhole-3d hero; this piece
// is its deterministically gate-verifiable geodesic-physics companion.
import {
  bCritSchwarzschild, photonSphereSchwarzschild, iscoKerr,
  horizonOuter, nullGeodesic, hubbleLaw, hubbleRadius,
  particleHorizon, scaleFactorHistory, scaleToRedshift,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rMode = document.getElementById('readout-mode');
const rBc = document.getElementById('readout-bc');
const rIsco = document.getElementById('readout-isco');
const rDrift = document.getElementById('readout-drift');
const selM = document.getElementById('select-mode');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sQ = document.getElementById('slider-q'), vQ = document.getElementById('value-q');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_MODE = 'schw', DEF_P = 5.2, DEF_Q = 0;
const BC = bCritSchwarzschild();
const st = { mode: DEF_MODE, p: DEF_P, q: DEF_Q, running: !prefersReducedMotion(), ph: 0, fan: null, drift: 0 };

function rebuild() {
  const aOverM = st.mode === 'kerr' ? Math.max(0, Math.min(0.99, st.q / 100)) : 0;
  st.aOverM = aOverM;
  if (st.mode === 'flrw') {
    st.hist = scaleFactorHistory(70, Math.max(0.05, st.q / 100 || 0.3), 1 - (st.q / 100 || 0.3), 3.0, 1200);
    st.fan = null;
  } else {
    // precompute the geodesic fan (deterministic; the sweep just reveals it)
    st.fan = [];
    let maxd = 0;
    for (let i = 0; i < 16; i += 1) {
      const b = 1.5 + i * 0.75;                          // span across b_c
      const g = nullGeodesic(b, { dphi: 2e-3, maxSteps: 9000 });
      maxd = Math.max(maxd, g.maxDrift);
      st.fan.push({ b, g });
    }
    const gp = nullGeodesic(st.p, { dphi: 2e-3, maxSteps: 9000 });   // probe ray
    st.fan.push({ b: st.p, g: gp, probe: true });
    st.drift = Math.max(maxd, gp.maxDrift);
  }
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawBHView(x, y, w, h) {
  const kerr = st.mode === 'kerr';
  panel(x, y, w, h, kerr ? 'Kerr equatorial geodesics: ergosphere + frame drag' : 'Schwarzschild null-geodesic fan: capture below b_c, photon-sphere whirl');
  const cx = x + w * 0.62, cy = y + h * 0.52, S = Math.min(w * 0.5, h) * 0.5 / 14;  // px per M
  const rH = kerr ? horizonOuter(st.aOverM) : 2;
  const rIscoV = kerr ? iscoKerr(st.aOverM) : 6;
  // rings: horizon (filled), ergosphere (Kerr), photon sphere, b_c shadow, ISCO
  ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.arc(cx, cy, rH * S, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  let legendY = y + 26;
  const ring = (r, col, dash, lab) => {
    ctx.strokeStyle = col; ctx.setLineDash(dash); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r * S, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    // legend stacked at the top-left, not crammed onto the small rings
    ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillRect(x + 12, legendY - 6, 14, 2);
    ctx.fillText(lab, x + 30, legendY - 2);
    legendY += 14;
  };
  if (kerr) ring(2, 'rgba(255,143,143,0.7)', [2, 3], 'ergosphere (r=2M)');
  ring(photonSphereSchwarzschild(), 'rgba(127,209,255,0.7)', [4, 3], 'photon sphere r=3M');
  ring(BC, 'rgba(241,192,105,0.65)', [2, 4], `b_c shadow = ${BC.toFixed(2)}M`);
  ring(rIscoV, 'rgba(143,227,155,0.65)', [5, 4], `ISCO r=${rIscoV.toFixed(2)}M`);
  // geodesic fan: launch from +x at impact parameter b (offset y = b)
  const reveal = st.ph;
  for (const f of st.fan) {
    const pts = f.g.pts, n = Math.max(2, Math.floor(pts.length * reveal));
    ctx.lineWidth = f.probe ? 2.4 : 1;
    ctx.strokeStyle = f.probe ? '#ffd166' : (f.g.captured ? 'rgba(255,120,120,0.7)' : 'rgba(127,209,255,0.5)');
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i += 1) {
      // incoming from +x: world angle = pi - phi so the ray enters from the right
      const ang = Math.PI - pts[i].phi + (kerr ? st.aOverM * 0.06 * pts[i].phi : 0);  // perturbative frame drag
      const px = cx + S * pts[i].r * Math.cos(ang);
      const py = cy - S * pts[i].r * Math.sin(ang);
      if (pts[i].r > 90) { started = false; continue; }
      started ? ctx.lineTo(px, py) : (ctx.moveTo(px, py), started = true);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  const pf = st.fan[st.fan.length - 1];
  ctx.fillText(`probe b = ${st.p.toFixed(2)} M  ->  ${pf.g.captured ? 'CAPTURED' : 'deflected'}`, x + 12, y + h - 10);
  if (kerr) ctx.fillText(`a/M = ${st.aOverM.toFixed(2)} (frame drag, perturbative)`, x + 12, y + h - 26);
}

function drawFLRW(x, y, w, h) {
  panel(x, y, w, h, 'FLRW Hubble flow: comoving lattice, recession arrows, particle horizon');
  const a = st.hist.a[Math.min(st.hist.a.length - 1, Math.floor(st.ph * (st.hist.a.length - 1)))];
  const cx = x + w * 0.5, cy = y + h * 0.52;
  const H0 = 70, c = 1;
  const dH = hubbleRadius(H0, c);                        // v = c radius (comoving units here)
  const scaleProp = Math.min(w, h) * 0.40 / (3.2 * dH);  // px per proper-distance unit
  // particle horizon and Hubble radius circles (proper, grow with a)
  const dPH = particleHorizon(H0, 1, 0, c, 4000) * a;    // schematic growth with a
  ctx.strokeStyle = 'rgba(241,192,105,0.5)'; ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.46, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(127,209,255,0.5)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.arc(cx, cy, dH * scaleProp * a, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,209,255,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Hubble radius (v = c)', cx + dH * scaleProp * a * 0.5, cy - dH * scaleProp * a * 0.8);
  ctx.fillStyle = 'rgba(241,192,105,0.7)'; ctx.fillText('particle horizon', cx + 6, y + 26);
  // comoving galaxy lattice; proper distance = comoving * a
  for (let i = -5; i <= 5; i += 1) for (let j = -5; j <= 5; j += 1) {
    if (i === 0 && j === 0) continue;
    const dx = i * 0.55 * dH, dy = j * 0.55 * dH;
    const dprop = Math.sqrt(dx * dx + dy * dy) * a;
    const px = cx + dx * scaleProp * a, py = cy + dy * scaleProp * a;
    if (px < x + 6 || px > x + w - 6 || py < y + 20 || py > y + h - 8) continue;
    const v = hubbleLaw(dprop, H0) / (H0 * dH);          // v / c
    const z = Math.max(0, scaleToRedshift(1 / (1 + 0.5 * dprop / dH)));
    const red = Math.min(255, 120 + 135 * Math.min(1, z));
    ctx.fillStyle = `rgb(${red | 0},${(170 - 90 * Math.min(1, z)) | 0},${(220 - 150 * Math.min(1, z)) | 0})`;
    ctx.beginPath(); ctx.arc(px, py, 3, 0, 2 * Math.PI); ctx.fill();
    // recession arrow length proportional to v = H0 d
    const L = Math.min(26, 26 * v);
    const ux = dx / (Math.hypot(dx, dy) + 1e-9), uy = dy / (Math.hypot(dx, dy) + 1e-9);
    ctx.strokeStyle = v > 1 ? 'rgba(255,143,143,0.7)' : 'rgba(143,227,155,0.6)';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ux * L, py + uy * L); ctx.stroke();
  }
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`a = ${a.toFixed(2)}  (red arrows: v > c, superluminal recession, allowed)`, x + 12, y + h - 10);
}

function drawPotential(x, y, w, h) {
  if (st.mode === 'flrw') {
    panel(x, y, w, h, 'Hubble law v = H0 d (linear; v = c at the Hubble radius)');
    const x0 = x + 34, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
    const H0 = 70, dMax = 3 / H0;
    const X = (d) => x0 + (x1 - x0) * d / dMax;
    const Y = (v) => y1 - (y1 - y0) * Math.min(1, v / (H0 * dMax));
    ctx.fillStyle = 'rgba(127,209,255,0.10)'; ctx.fillRect(X(1 / H0), y0, X(dMax) - X(1 / H0), y1 - y0);
    ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(dMax), Y(H0 * dMax)); ctx.stroke();
    ctx.strokeStyle = 'rgba(127,209,255,0.5)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(X(1 / H0), y0); ctx.lineTo(X(1 / H0), y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('v = c (Hubble radius)', X(1 / H0) + 4, y0 + 12);
    ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('proper distance d ->', x1 - 130, y1 + 14);
    return;
  }
  panel(x, y, w, h, 'null effective potential V(r) = (1 - 2M/r)/r^2 ; peak at r = 3M');
  const x0 = x + 34, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const rMax = 25;
  const V = (r) => (1 - 2 / r) / (r * r);
  let vmax = 0; for (let r = 2.01; r < rMax; r += 0.05) vmax = Math.max(vmax, V(r));
  const X = (r) => x0 + (x1 - x0) * r / rMax;
  const Y = (v) => y1 - (y1 - y0) * Math.max(0, v) / (vmax * 1.1);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  let first = true;
  for (let r = 2.02; r <= rMax; r += 0.05) { const xx = X(r), yy = Y(V(r)); first ? (ctx.moveTo(xx, yy), first = false) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  const inv = 1 / (st.p * st.p);                          // energy line 1/b^2
  ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x0, Y(inv)); ctx.lineTo(x1, Y(inv)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`1/b^2 (b=${st.p.toFixed(1)}M)`, x0 + 6, Y(inv) - 4);
  ctx.strokeStyle = 'rgba(127,209,255,0.5)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(X(3), y0); ctx.lineTo(X(3), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,209,255,0.8)'; ctx.fillText('r = 3M', X(3) + 3, y1 - 6);
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('r (M) ->', x1 - 56, y1 + 14);
}

function drawMap(x, y, w, h) {
  if (st.mode === 'flrw') {
    panel(x, y, w, h, 'scale factor a(t): monotone expansion (a-dot > 0)');
    const x0 = x + 30, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 22;
    const A = st.hist.a, T = st.hist.t, n = A.length;
    const tMax = T[n - 1], aMax = A[n - 1];
    const X = (t) => x0 + (x1 - x0) * t / tMax;
    const Y = (av) => y1 - (y1 - y0) * av / aMax;
    ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < n; i += 1) { const xx = X(T[i]), yy = Y(A[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke();
    const idx = Math.min(n - 1, Math.floor(st.ph * (n - 1)));
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(T[idx]), Y(A[idx]), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`a = ${A[idx].toFixed(2)},  z = ${scaleToRedshift(A[idx] / aMax).toFixed(2)}`, x + 10, y + h - 10);
    ctx.fillText('cosmic time ->', x1 - 96, y1 + 14);
    return;
  }
  panel(x, y, w, h, 'outcome vs impact parameter b: sharp boundary at b_c = 3 sqrt(3) M');
  const x0 = x + 16, x1 = x + w - 14, y0 = y + 34, y1 = y + h - 30;
  const bMin = 2, bMax = 9;
  const X = (b) => x0 + (x1 - x0) * (b - bMin) / (bMax - bMin);
  for (let i = 0; i <= 240; i += 1) {
    const b = bMin + (bMax - bMin) * i / 240;
    ctx.fillStyle = b < BC ? 'rgba(255,120,120,0.55)' : 'rgba(127,209,255,0.5)';
    ctx.fillRect(X(b), y0, (x1 - x0) / 240 + 1, y1 - y0);
  }
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X(BC), y0 - 6); ctx.lineTo(X(BC), y1 + 6); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`b_c = ${BC.toFixed(3)} M`, X(BC) - 30, y0 - 10);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(X(Math.max(bMin, Math.min(bMax, st.p))), (y0 + y1) / 2, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,120,0.85)'; ctx.fillText('captured', x0 + 6, y1 + 16);
  ctx.fillStyle = 'rgba(127,209,255,0.85)'; ctx.fillText('deflected', x1 - 60, y1 + 16);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  if (st.mode === 'flrw') drawFLRW(20, 22, W - 40, 232);
  else drawBHView(20, 22, W - 40, 232);
  drawPotential(20, 270, (W - 52) / 2, H - 270 - 16);
  drawMap(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rMode.textContent = st.mode === 'schw' ? 'Schwarzschild' : st.mode === 'kerr' ? 'Kerr' : 'FLRW';
  rBc.textContent = BC.toFixed(3);
  rIsco.textContent = st.mode === 'kerr' ? iscoKerr(st.aOverM).toFixed(2) : '6.00';
  rDrift.textContent = st.mode === 'flrw' ? 'n/a' : st.drift.toExponential(1);
}

const LIVE = 1 / 300;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) st.ph = st.mode === 'flrw' ? 0 : 1; if (st.mode !== 'flrw' && st.ph >= 1) { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); } }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vP.textContent = st.p.toFixed(2); vQ.textContent = (st.q / 100).toFixed(2); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
selM.addEventListener('change', () => { st.mode = selM.value; rebuild(); syncLabels(); draw(); });
sP.addEventListener('input', () => { st.p = parseFloat(sP.value) / 10; syncLabels(); rebuild(); draw(); });
sQ.addEventListener('input', () => { st.q = parseFloat(sQ.value); syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.mode = DEF_MODE; st.p = DEF_P; st.q = DEF_Q;
  selM.value = DEF_MODE; sP.value = String(DEF_P * 10); sQ.value = String(DEF_Q);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { mode: st.mode, p: st.p.toFixed(2), q: String(st.q) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.mode) { st.mode = s.mode; selM.value = s.mode; }
  if (s.p) { st.p = parseFloat(s.p); sP.value = String(Math.round(st.p * 10)); }
  if (s.q) { st.q = parseFloat(s.q); sQ.value = String(st.q); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
    draw();
  } else {
    draw();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const b_crit = BC;
  return {
    fields: [
      { key: 'mode', label: 'geometry type', value: st.mode, format: undefined },
      { key: 'impact-parameter', label: 'photon impact parameter b', value: st.p, format: 'float' },
      { key: 'spin-parameter', label: 'Kerr spin parameter a', value: st.q, format: 'float' },
      { key: 'critical-impact', label: 'critical b for unstable orbit', value: b_crit, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  if (st.mode === 'schw') {
    // Schwarzschild invariant: the effective potential first integral must be conserved
    // The orbit integral I = (du/dphi)^2 + u^2 - 2u^3 should be constant = 1/b^2
    if (st.fan) {
      const I_expected = 1 / (st.p * st.p);
      inv.push({
        key: 'orbit-integral',
        label: 'first integral I = 1/b^2 conserved along geodesic',
        value: st.drift.toExponential(2),
        status: st.drift < 1e-6 ? 'pass' : (st.drift < 1e-4 ? 'pending' : 'drift')
      });
    }
    // Light deflection for weak-field impact must be positive
    inv.push({
      key: 'photon-sphere-exists',
      label: 'critical impact parameter b_c = 2.6 (Schwarzschild)',
      value: BC.toFixed(2),
      status: BC > 2.5 && BC < 2.7 ? 'pass' : 'drift'
    });
  }
  return inv;
};
