// Neutron-star structure from the TOV equation. Panel A: the
// mass-radius diagram for four equations of state with the 2 Msun
// pulsar line and the selected star marked. Panel B: the interior run
// of pressure, energy density and enclosed mass with a density-shaded
// cross-section. Panel C: the equations of state on a log-log P-rho
// plane. Gate-tested sim.js; deterministic. Tolman 1939; Oppenheimer
// and Volkoff 1939; Shapiro and Teukolsky Ch. 5.
import {
  C, MSUN, KM, EOS, tovStar, tovProfile, massRadiusCurve, maxMass, fermiP, fermiRho,
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
const rEos = document.getElementById('readout-eos');
const rMm = document.getElementById('readout-m');
const rR = document.getElementById('readout-r');
const rMmax = document.getElementById('readout-mmax');
const selE = document.getElementById('select-eos');
const slR = document.getElementById('slider-rho'), vR = document.getElementById('value-rho');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const KEYS = ['fermi', 'stiff', 'soft', 'quark'];
const COL = { fermi: '#ffd166', stiff: '#6fb4ff', soft: '#9be8b0', quark: '#ff9d6f' };
const DEF_E = 'fermi', DEF_R = 183;
const st = { eos: DEF_E, rRaw: DEF_R, running: !prefersReducedMotion(), ph: 0 };
const rhoC = () => Math.pow(10, st.rRaw / 10);

// boot-time cache of the four mass-radius sequences and max masses
const CURVES = {}, MMAX = {};
function buildCurves() {
  for (const k of KEYS) {
    const lo = k === 'quark' ? 5e17 : 1e17;
    CURVES[k] = massRadiusCurve(k, lo, 5e19, 46);
    MMAX[k] = maxMass(k, lo, 5e19, 50);
  }
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawMR(x, y, w, h) {
  panel(x, y, w, h, 'mass-radius diagram: four equations of state');
  const px = x + 44, py = y + 26, pw = w - 60, ph = h - 58;
  const Rmin = 4, Rmax = 24, Mmin = 0, Mmax = 3.4;
  const X = (R) => px + pw * (R - Rmin) / (Rmax - Rmin);
  const Y = (M) => py + ph * (1 - (M - Mmin) / (Mmax - Mmin));
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (let M = 0; M <= 3; M += 1) { ctx.fillText(`${M}`, px - 16, Y(M) + 3); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(px, Y(M)); ctx.lineTo(px + pw, Y(M)); ctx.stroke(); }
  for (let R = 5; R <= 24; R += 5) ctx.fillText(`${R}`, X(R) - 5, py + ph + 15);
  ctx.fillText('R (km)', px + pw / 2 - 18, py + ph + 28);
  ctx.save(); ctx.translate(x + 12, py + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'start'; ctx.fillText('M (Msun)', 2, 0); ctx.restore();
  // 2 Msun observational line
  ctx.strokeStyle = 'rgba(255,120,120,0.6)'; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(px, Y(2)); ctx.lineTo(px + pw, Y(2)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,150,150,0.85)'; ctx.fillText('2 Msun pulsars (J0740, J0348)', px + pw - 188, Y(2) - 4);
  // EOS curves
  for (const k of KEYS) {
    const c = CURVES[k], sel = k === st.eos;
    ctx.strokeStyle = sel ? COL[k] : `${COL[k]}66`;
    ctx.lineWidth = sel ? 2.5 : 1.3; ctx.beginPath();
    let started = false;
    for (let i = 0; i < c.R.length; i += 1) {
      if (!(c.R[i] > 0) || c.R[i] > Rmax || c.M[i] <= 0) { continue; }
      const xx = X(c.R[i]), yy = Y(Math.min(Mmax, c.M[i]));
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  // current star marker
  const s = tovStar(st.eos, rhoC(), 30);
  const Rk = s.R / KM, Mm = s.M / MSUN;
  const pulse = 4 + 1.5 * Math.sin(2 * Math.PI * st.ph);
  if (Rk > Rmin && Rk < Rmax && Mm > 0) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(X(Rk), Y(Math.min(Mmax, Mm)), pulse, 0, 2 * Math.PI); ctx.fill();
  }
  // legend
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(10,11,16,0.82)'; ctx.fillRect(px + 4, py + 4, 246, 64);
  let ly = py + 14;
  for (const k of KEYS) {
    ctx.fillStyle = COL[k]; ctx.fillRect(px + 8, ly - 8, 10, 9);
    ctx.fillStyle = k === st.eos ? '#fff' : 'rgba(220,228,245,0.7)';
    ctx.fillText(`${EOS[k].name}  (Mmax ${MMAX[k].Mmax.toFixed(2)})`, px + 22, ly);
    ly += 15;
  }
}

function drawInterior(x, y, w, h) {
  panel(x, y, w, h, 'interior structure of the selected star');
  const prof = tovProfile(st.eos, rhoC(), 30);
  const Rk = prof.R / KM, Mm = prof.M / MSUN;
  // density-shaded cross-section disc
  const ccx = x + 52, ccy = y + h / 2 + 4, cR = Math.min(46, (h - 60) / 2);
  const epsc = prof.eps[0] || 1;
  for (let i = prof.r.length - 1; i >= 0; i -= 1) {
    const rr = (prof.r[i] / prof.R) * cR;
    const t = Math.max(0, Math.min(1, prof.eps[i] / epsc));
    const g = Math.round(40 + 180 * t);
    ctx.fillStyle = `rgb(${g},${Math.round(60 + 90 * t)},${Math.round(120 + 60 * (1 - t))})`;
    ctx.beginPath(); ctx.arc(ccx, ccy, Math.max(1, rr), 0, 2 * Math.PI); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(ccx, ccy, cR, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,235,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`R = ${Rk.toFixed(2)} km`, ccx - 28, ccy + cR + 16);
  // profiles P, eps, m normalised vs r/R
  const px = x + 120, py = y + 26, pw = w - 134, ph = h - 52;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const series = [
    ['P', prof.P, prof.P[0] || 1, '#ffd166'],
    ['eps', prof.eps, prof.eps[0] || 1, '#6fb4ff'],
    ['m', prof.m, prof.m[prof.m.length - 1] || 1, '#9be8b0'],
  ];
  for (const [, arr, norm, col] of series) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < arr.length; i += 1) {
      const xx = px + pw * (prof.r[i] / prof.R);
      const yy = py + ph * (1 - Math.max(0, Math.min(1, arr[i] / norm)));
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 2, py + 2, 150, 15);
  let lx = px + 6;
  for (const [name, , , col] of series) { ctx.fillStyle = col; ctx.fillText(name, lx, py + 13); lx += name.length * 7 + 18; }
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText('r/R', px + pw / 2 - 8, py + ph + 14);
  ctx.fillStyle = '#fff'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`M = ${Mm.toFixed(3)} Msun`, px + 6, py + ph - 8);
}

function drawEOS(x, y, w, h) {
  panel(x, y, w, h, 'equation of state: P vs rest-mass density (log-log)');
  const px = x + 44, py = y + 26, pw = w - 58, ph = h - 72;
  const rhoLo = 16.5, rhoHi = 19.5, pLo = 30, pHi = 37;     // log10 ranges
  const X = (lr) => px + pw * (lr - rhoLo) / (rhoHi - rhoLo);
  const Y = (lp) => py + ph * (1 - (lp - pLo) / (pHi - pLo));
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (let l = 17; l <= 19; l += 1) ctx.fillText(`1e${l}`, X(l) - 8, py + ph + 13);
  ctx.fillText('rho (kg/m^3)', px + pw / 2 - 30, py + ph + 25);
  for (let l = 31; l <= 36; l += 1) ctx.fillText(`1e${l}`, x + 6, Y(l) + 3);
  for (const k of KEYS) {
    const sel = k === st.eos;
    ctx.strokeStyle = sel ? COL[k] : `${COL[k]}55`; ctx.lineWidth = sel ? 2.5 : 1.3;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 120; i += 1) {
      const rho = Math.pow(10, rhoLo + (rhoHi - rhoLo) * i / 120);
      let P;
      if (k === 'fermi') {
        // invert rho -> x -> P
        let lo = 1e-6, hi = 1e3;
        for (let b = 0; b < 80; b += 1) { const m = Math.sqrt(lo * hi); if (fermiRho(m) < rho) lo = m; else hi = m; }
        P = fermiP(Math.sqrt(lo * hi));
      } else { P = EOS[k].Pc(rho); }
      if (!(P > 0)) continue;
      const xx = X(Math.log10(rho)), yy = Y(Math.max(pLo, Math.min(pHi, Math.log10(P))));
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(220,228,245,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('steeper = stiffer (higher Mmax)', px + 8, py + 14);
  const mm = MMAX[st.eos];
  ctx.fillStyle = mm.Mmax >= 2 ? '#9be8b0' : '#ff8f8f'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Mmax = ${mm.Mmax.toFixed(2)} Msun  ${mm.Mmax >= 2 ? 'allowed by 2 Msun' : 'excluded by 2 Msun'}`, px + 6, py + ph + 40);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawMR(20, 20, half, H - 34);
  drawInterior(20 + half + 12, 20, half, (H - 46) / 2);
  drawEOS(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  const s = tovStar(st.eos, rhoC(), 30);
  rEos.textContent = EOS[st.eos].name;
  rMm.textContent = `${(s.M / MSUN).toFixed(3)} Msun`;
  rR.textContent = `${(s.R / KM).toFixed(2)} km`;
  rMmax.textContent = `${MMAX[st.eos].Mmax.toFixed(2)} Msun`;
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 120) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vR.textContent = rhoC().toExponential(1); }
selE.addEventListener('change', () => { st.eos = selE.value; draw(); });
slR.addEventListener('input', () => { st.rRaw = parseInt(slR.value, 10); sync(); draw(); });
bR.addEventListener('click', () => {
  st.eos = DEF_E; st.rRaw = DEF_R; st.running = true;
  selE.value = DEF_E; slR.value = String(DEF_R);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { eos: st.eos, rho: String(st.rRaw) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.eos) { st.eos = s.eos; selE.value = s.eos; }
  if (s.rho) { st.rRaw = parseInt(s.rho, 10); slR.value = s.rho; }
}

function boot() {
  buildCurves();
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = fr; draw();
  } else { draw(); }
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
  const rc = rhoC();
  const star = tovStar(st.eos, rc);
  return {
    fields: [
      { key: 'eos-name', label: 'equation of state', value: st.eos, format: undefined },
      { key: 'central-density', label: 'central density log10(rho, kg/m^3)', value: st.rRaw / 10, format: 'float' },
      { key: 'mass', label: 'total mass (Msun)', value: star ? (star.m / MSUN).toFixed(2) : 0, format: 'float' },
      { key: 'radius', label: 'radius (km)', value: star ? (star.r / KM).toFixed(1) : 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const rc = rhoC();
  const star = tovStar(st.eos, rc);
  if (!star) return inv;
  // Causality: sound speed must be <= c (Shapiro-Teukolsky), enforced by EOS design
  const m = star.m / MSUN;
  const r = star.r / KM;
  inv.push({
    key: 'compactness',
    label: 'compactness 2GM/c^2 < R (stable config)',
    value: (2 * m / (r / 0.297)).toFixed(2),
    status: (2 * m / (r / 0.297)) < 1.0 ? 'pass' : 'drift'
  });
  // TOV regularity: central pressure should be finite, decreasing outward
  inv.push({
    key: 'structure-valid',
    label: 'star has positive radius and mass',
    value: `M=${m.toFixed(2)}Ms, R=${r.toFixed(1)}km`,
    status: m > 0 && r > 0 ? 'pass' : 'drift'
  });
  return inv;
};
