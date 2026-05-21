// Slow-roll inflation. Panel A: the inflaton rolling down V(phi)
// toward phi_end (epsilon = 1). Panel B: comoving fluctuations
// stretched exponentially past the nearly constant Hubble horizon and
// freezing superhorizon. Panel C: the near-scale-invariant scalar
// spectrum P_s(k) ~ k^{n_s-1}. Gate-tested sim.js; deterministic.
// Mukhanov; Baumann; Starobinsky 1980; Planck 2018.
import {
  POTENTIALS, epsilon, nsOf, rOf, phiEnd, phiAtN,
  scalarAmplitude, powerSpectrum, modeHistory,
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
const rN = document.getElementById('readout-n');
const rNs = document.getElementById('readout-ns');
const rR = document.getElementById('readout-r');
const rEps = document.getElementById('readout-eps');
const selP = document.getElementById('select-pot');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sL = document.getElementById('slider-lam'), vL = document.getElementById('value-lam');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_POT = 'starobinsky', DEF_N = 57, DEF_L = 14;
const st = { pot: DEF_POT, N: DEF_N, lam: DEF_L, running: !prefersReducedMotion(), ph: 0 };

function lamCom() { return Math.pow(10, -8 + st.lam * 0.25); }   // ~1e-8 .. 1e2

function rebuild() {
  const P = POTENTIALS[st.pot];
  st.phiEnd = phiEnd(st.pot);
  st.phi0 = phiAtN(st.N, st.pot);                       // field N e-folds before end
  st.ns = nsOf(st.phi0, st.pot);
  st.r = rOf(st.phi0, st.pot);
  st.eps0 = epsilon(st.phi0, st.pot);
  st.As = scalarAmplitude(st.phi0, st.pot);
  // potential curve
  const pMax = P.phiStart;
  st.vc = [];
  for (let i = 0; i <= 200; i += 1) { const phi = pMax * i / 200; st.vc.push([phi, P.V(phi)]); }
  st.vMax = Math.max(...st.vc.map((c) => c[1]));
  // field trajectory: e-folds remaining N -> 0 (rolls phi0 -> phi_end)
  st.ST = 70;
  st.traj = new Float64Array(st.ST + 1);
  for (let i = 0; i <= st.ST; i += 1) {
    const Nrem = st.N * (1 - i / st.ST);
    st.traj[i] = Nrem < 0.05 ? st.phiEnd : phiAtN(Nrem, st.pot);
  }
  // three modes stretched over the e-fold history
  st.modes = [lamCom(), lamCom() * 1e3, lamCom() * 1e6].map((lc) => modeHistory(lc, st.pot, st.N, 80));
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawPotential(x, y, w, h) {
  panel(x, y, w, h, 'inflaton potential V(phi): slow roll on the plateau to phi_end');
  const x0 = x + 30, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 22;
  const pMax = POTENTIALS[st.pot].phiStart;
  const X = (p) => x0 + (x1 - x0) * p / pMax;
  const Y = (v) => y1 - (y1 - y0) * v / (st.vMax * 1.05);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  st.vc.forEach(([p, v], i) => { const xx = X(p), yy = Y(v); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
  ctx.stroke();
  // phi_end marker (epsilon = 1)
  ctx.strokeStyle = 'rgba(255,143,143,0.6)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(st.phiEnd), y0); ctx.lineTo(X(st.phiEnd), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,143,143,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('phi_end (eps=1)', X(st.phiEnd) + 4, y0 + 12);
  // rolling inflaton
  const phi = st.traj[Math.min(st.ST, Math.floor(st.ph * st.ST))];
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(phi), Y(POTENTIALS[st.pot].V(phi)) - 6, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText(`phi = ${phi.toFixed(2)},  N remaining = ${(st.N * (1 - st.ph)).toFixed(0)}`, x + 12, y + h - 10);
  ctx.fillText('phi ->', x1 - 44, y1 + 14);
}

function drawModes(x, y, w, h) {
  panel(x, y, w, h, 'fluctuations stretched superhorizon: lambda_phys vs the Hubble horizon');
  const x0 = x + 36, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const m0 = st.modes[0], nN = m0.Ne.length, NeMax = m0.Ne[nN - 1];
  let lo = 1e30, hi = -1e30;
  for (const m of st.modes) for (let i = 0; i < nN; i += 1) { lo = Math.min(lo, m.lamPhys[i], m.horizon[i]); hi = Math.max(hi, m.lamPhys[i]); }
  const lyLo = Math.log10(lo), lyHi = Math.log10(hi);
  const X = (ne) => x0 + (x1 - x0) * ne / NeMax;
  const Y = (val) => y1 - (y1 - y0) * (Math.log10(val) - lyLo) / (lyHi - lyLo);
  const rev = Math.floor(st.ph * (nN - 1));
  // Hubble horizon (nearly constant on this log scale)
  ctx.strokeStyle = 'rgba(255,143,143,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < nN; i += 1) { const xx = X(m0.Ne[i]), yy = Y(m0.horizon[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,143,143,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText('Hubble horizon 1/H', x0 + 4, Y(m0.horizon[0]) - 4);
  const cols = ['#7fd1ff', '#8fe39b', '#e79bff'];
  st.modes.forEach((m, mi) => {
    ctx.strokeStyle = cols[mi]; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 0; i <= Math.min(rev, nN - 1); i += 1) { const xx = X(m.Ne[i]), yy = Y(m.lamPhys[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke();
  });
  ctx.fillStyle = 'rgba(200,215,240,0.65)';
  ctx.fillText('e-folds N ->', x1 - 96, y1 + 14);
  ctx.fillStyle = 'rgba(143,227,155,0.8)'; ctx.fillText('modes freeze once super-horizon', x0 + 4, y1 - 4);
}

function drawSpectrum(x, y, w, h) {
  panel(x, y, w, h, 'scalar power spectrum P_s(k) ~ k^{n_s - 1}: near scale invariant');
  const x0 = x + 34, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  const decades = 4;
  const X = (lk) => x0 + (x1 - x0) * (lk + decades) / (2 * decades);
  const ref = st.As;
  // Gentle tilt magnification: keep the curve inside the panel so the
  // slight red slope reads against the flat n_s = 1 reference.
  const Y = (P) => y1 - (y1 - y0) * Math.max(0.05, Math.min(0.95, 0.5 + 0.9 * (P / ref - 1)));
  // scale-invariant reference (n_s = 1, flat)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x0, Y(ref)); ctx.lineTo(x1, Y(ref)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('n_s = 1 (scale invariant)', x0 + 6, Y(ref) - 4);
  ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 160; i += 1) {
    const lk = -decades + 2 * decades * i / 160;
    const k = Math.pow(10, lk);
    const xx = X(lk), yy = Y(powerSpectrum(k, 1, st.ns, ref));
    i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(241,192,105,0.9)';
  ctx.fillText(`n_s = ${st.ns.toFixed(4)}  (red tilt)`, x0 + 6, y0 + 14);
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('log10 k ->', x1 - 70, y1 + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawPotential(20, 22, W - 40, 232);
  drawModes(20, 270, (W - 52) / 2, H - 270 - 16);
  drawSpectrum(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rN.textContent = String(st.N);
  rNs.textContent = st.ns.toFixed(4);
  rR.textContent = st.r.toExponential(2);
  rEps.textContent = st.eps0.toExponential(2);
}

const LIVE = 1 / 320;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) { st.ph = 1; st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); } }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vN.textContent = String(st.N); vL.textContent = lamCom().toExponential(1); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
selP.addEventListener('change', () => { st.pot = selP.value; rebuild(); syncLabels(); draw(); });
sN.addEventListener('input', () => { st.N = parseInt(sN.value, 10); syncLabels(); rebuild(); draw(); });
sL.addEventListener('input', () => { st.lam = parseInt(sL.value, 10); syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.pot = DEF_POT; st.N = DEF_N; st.lam = DEF_L;
  selP.value = DEF_POT; sN.value = String(DEF_N); sL.value = String(DEF_L);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { pot: st.pot, n: String(st.N), lam: String(st.lam) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.pot) { st.pot = s.pot; selP.value = s.pot; }
  if (s.n) { st.N = parseInt(s.n, 10); sN.value = String(st.N); }
  if (s.lam) { st.lam = parseInt(s.lam, 10); sL.value = String(st.lam); }
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


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
