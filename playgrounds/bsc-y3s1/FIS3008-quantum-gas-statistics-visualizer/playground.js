import { fontString } from '../../../shared/js/canvas-type.js';
// Ideal quantum gas statistics visualizer (Canvas2D). The mean
// occupation n(eps) for Maxwell-Boltzmann, Fermi-Dirac and
// Bose-Einstein at a shared temperature, each at its own chemical
// potential solved from fixed N. A cooling sweep crosses the Bose
// condensation point, where a macroscopic spike appears at eps = 0.
// An occupation-cells cartoon shows the discrete picture. sim.js is
// the gate-tested headless engine.

import {
  occ, gDOS, numberIntegral, fermiEnergy, tauC, solveMu,
  condensateFraction, NTOT,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rN = document.getElementById('readout-n');
const rMu = document.getElementById('readout-mu');
const rCond = document.getElementById('readout-cond');
const rTtc = document.getElementById('readout-ttc');

const sT = document.getElementById('slider-tau'), vT = document.getElementById('value-tau');
const selS = document.getElementById('select-stat');
const tgOcc = document.getElementById('toggle-occupied');
const bCool = document.getElementById('btn-cool'), bR = document.getElementById('btn-reset');

const EF = fermiEnergy(), TC = tauC();
const TAU_HOT = 2.0, TAU_COLD = 0.12;
const st = { tau: 0.9, stat: 'all', occupied: true, cooling: false };

// plot box (curves) on the left, cells cartoon on the right
const PX0 = 205, PX1 = W - 210, PY0 = 40, PY1 = H - 50;
const EMAX = 3.2;
const xOf = (e) => PX0 + (e / EMAX) * (PX1 - PX0);
let NMAX = 1.2;
const yOf = (n) => PY1 - Math.max(0, Math.min(1.02, n / NMAX)) * (PY1 - PY0);

const COL = { MB: '#ffd166', FD: '#5bc0eb', BE: '#ef476f', axis: 'rgba(150,160,180,0.8)', grid: 'rgba(120,130,150,0.16)' };

// Sample a series. Occupied = g(eps) n(eps), the spectral density of
// occupied states (its area is N, so it stays comparably scaled at
// every temperature); bare = the raw occupation n(eps).
function series(stat, mu, tau, occupied) {
  const pts = [];
  for (let i = 0; i <= 360; i += 1) {
    const e = 0.0008 + (i / 360) * EMAX;
    let v = occ(stat, e, mu, tau);
    v = occupied ? gDOS(e) * (Number.isFinite(v) ? v : 0) : (Number.isFinite(v) ? v : Infinity);
    pts.push([e, v]);
  }
  return pts;
}

const CELL_LV = 8;
// The sampled level energies, shared by the cells and the x-axis
// ticks so the two representations are visibly the same energies.
function cellEnergies() {
  const es = [];
  for (let k = 0; k < CELL_LV; k += 1) es.push((k + 0.5) / CELL_LV * EMAX);
  return es;
}

// Discrete-occupation cartoon. Each row is one energy level eps_k
// (low at the bottom, the same energies marked on the curve's x
// axis); each dot is a particle, the dot count proportional to the
// occupied weight g(eps_k) n(eps_k) on a scale shared across the
// columns so the Fermi sea, the dilute Boltzmann gas and the Bose
// pile-up are directly comparable. When all three are selected, all
// three are drawn side by side, not just one.
function drawCells(tau) {
  const stats = st.stat === 'all' ? ['MB', 'FD', 'BE'] : [st.stat];
  const es = cellEnergies();
  const XC0 = PX1 + 22, XC1 = W - 12, region = XC1 - XC0;
  const colW = region / stats.length, dotsMax = stats.length === 1 ? 8 : 5;

  // shared scale: the largest finite occupied weight across every
  // shown column and level (the BE eps->0 divergence is excluded; it
  // is represented by the condensate bar instead)
  const mu = {}, wgt = {};
  let scale = 1e-9;
  for (const s of stats) {
    mu[s] = solveMu(s, tau); wgt[s] = [];
    for (const e of es) {
      let nk = occ(s, e, mu[s], tau); if (!Number.isFinite(nk)) nk = 0;
      const w8 = gDOS(e) * nk; wgt[s].push(w8);
      if (e > 0.06) scale = Math.max(scale, w8);
    }
  }

  ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.fillStyle = COL.axis; ctx.textAlign = 'center';
  ctx.fillText('occupation cells', (XC0 + XC1) / 2, 18);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = 'rgba(150,160,180,0.62)';
  ctx.fillText('row eps_k, dot = particle', (XC0 + XC1) / 2, PY1 + 44);

  stats.forEach((s, ci) => {
    const cx0 = XC0 + ci * colW;
    ctx.fillStyle = COL[s]; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'center';
    ctx.fillText(s, cx0 + colW / 2, PY0 - 6);
    for (let k = 0; k < CELL_LV; k += 1) {
      const y = PY1 - (k / (CELL_LV - 1)) * (PY1 - PY0);
      ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx0 + 4, y); ctx.lineTo(cx0 + colW - 6, y); ctx.stroke();
      const dots = Math.max(0, Math.min(dotsMax, Math.round(dotsMax * wgt[s][k] / scale)));
      const r = stats.length === 1 ? 5 : 3.4, dx = (colW - 14) / dotsMax;
      for (let d = 0; d < dots; d += 1) {
        ctx.fillStyle = COL[s];
        ctx.beginPath(); ctx.arc(cx0 + 8 + d * dx + dx / 2, y - 6, r, 0, 2 * Math.PI); ctx.fill();
      }
    }
    // E_F level marker on the Fermi column
    if (s === 'FD') {
      const yF = PY1 - (EF / EMAX) * (PY1 - PY0);
      ctx.strokeStyle = 'rgba(91,192,235,0.7)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx0 + 2, yF); ctx.lineTo(cx0 + colW - 4, yF); ctx.stroke(); ctx.setLineDash([]);
    }
    // Bose condensate: the macroscopic ground-state pile, as a bar
    if (s === 'BE' && tau < TC) {
      const cf = condensateFraction(tau);
      ctx.fillStyle = COL.BE; ctx.font = fontString(canvas, 'tick', 'mono', 600); ctx.textAlign = 'center';
      ctx.fillText('BEC ground', cx0 + colW / 2, PY1 + 18);
      ctx.fillRect(cx0 + 4, PY1 + 24, (colW - 10) * cf, 9);
      ctx.strokeStyle = COL.axis; ctx.lineWidth = 1; ctx.strokeRect(cx0 + 4, PY1 + 24, colW - 10, 9);
    }
  });
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const tau = st.tau;
  const show = st.stat === 'all' ? ['MB', 'FD', 'BE'] : [st.stat];
  const mus = {};
  for (const s of ['MB', 'FD', 'BE']) mus[s] = solveMu(s, tau);

  // autoscale to the plotted curves (ignore the BE low-energy
  // divergence, which is represented by the condensate bar instead)
  const sers = {};
  let peak = 1e-6;
  for (const s of show) {
    sers[s] = series(s, mus[s], tau, st.occupied);
    for (const [e, v] of sers[s]) if (Number.isFinite(v) && e > 0.05 && v > peak) peak = v;
  }
  NMAX = peak * 1.18;

  // axes
  ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PX0, PY0); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
  ctx.fillStyle = COL.axis; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center'; ctx.fillText('energy  eps', (PX0 + PX1) / 2, H - 16);
  ctx.textAlign = 'left';
  ctx.fillText(st.occupied ? 'occupied  n' : 'occupation  n', 8, PY0 - 6);
  ctx.textAlign = 'right';
  for (let g = 1; g <= 4; g += 1) {
    const yy = PY1 - (g / 4) * (PY1 - PY0);
    ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(PX0, yy); ctx.lineTo(PX1, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(150,160,180,0.55)'; ctx.fillText((NMAX * g / 4).toFixed(2), PX0 - 6, yy + 4);
  }

  // the discrete cell levels marked on the energy axis, so the
  // curve and the cells cartoon are visibly the same energies
  ctx.fillStyle = 'rgba(150,160,180,0.7)';
  for (const e of cellEnergies()) {
    const X = xOf(e);
    ctx.fillRect(X - 0.5, PY1, 1, 6);
    ctx.beginPath(); ctx.arc(X, PY1 + 12, 2, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(150,160,180,0.6)';
  ctx.fillText('ticks = the cell levels eps_k', PX0 + 4, PY1 + 22);

  // E_F marker
  ctx.strokeStyle = 'rgba(91,192,235,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xOf(EF), PY0); ctx.lineTo(xOf(EF), PY1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(91,192,235,0.8)'; ctx.textAlign = 'center'; ctx.fillText('E_F', xOf(EF), PY0 - 6);

  for (const s of show) {
    ctx.strokeStyle = COL[s]; ctx.lineWidth = 2.4;
    if (s === 'MB') ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
    ctx.beginPath();
    let started = false;
    for (const [e, v] of sers[s]) {
      const X = xOf(e), Y = yOf(v);
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  // Bose condensate as a bold bar at eps = 0, height = fraction of
  // the panel proportional to the condensate fraction
  const cf = condensateFraction(tau);
  if ((st.stat === 'BE' || st.stat === 'all') && cf > 0) {
    ctx.strokeStyle = COL.BE; ctx.fillStyle = COL.BE; ctx.lineWidth = 7;
    const yTop = PY1 - cf * (PY1 - PY0);
    ctx.beginPath(); ctx.moveTo(xOf(0) + 4, PY1); ctx.lineTo(xOf(0) + 4, yTop); ctx.stroke();
    ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
    ctx.fillText(`BEC  N0/N=${cf.toFixed(2)}`, xOf(0) + 12, yTop + 4);
  }

  // legend (colored swatch + label)
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  let ly = PY0 + 2;
  for (const [s, lab] of [['MB', 'Maxwell-Boltzmann'], ['FD', 'Fermi-Dirac'], ['BE', 'Bose-Einstein']]) {
    if (st.stat !== 'all' && st.stat !== s) continue;
    ctx.fillStyle = COL[s]; ctx.fillRect(PX1 - 205, ly, 18, 4);
    ctx.fillText(lab, PX1 - 182, ly + 6); ly += 17;
  }

  drawCells(tau);

  // readout: number conservation is the live invariant
  const stat = st.stat === 'all' ? 'BE' : st.stat;
  const mu = mus[stat];
  const nExc = numberIntegral(stat, mu, tau);
  const nCond = stat === 'BE' ? cf * NTOT : 0;
  rN.textContent = (nExc + nCond).toFixed(4);
  rMu.textContent = (mu >= 0 ? '+' : '') + mu.toFixed(3);
  rCond.textContent = (stat === 'BE' ? cf : 0).toFixed(3);
  rTtc.textContent = (tau / TC).toFixed(3);
  vT.textContent = tau.toFixed(2);
}

let lastT = (typeof performance !== 'undefined' ? performance.now() : Date.now());
function tick(now) {
  const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.cooling) {
    st.tau -= dt * 0.35;
    if (st.tau <= TAU_COLD) { st.tau = TAU_COLD; st.cooling = false; bCool.textContent = 'Cool through Tc'; }
    sT.value = String(st.tau);
  }
  render();
  requestAnimationFrame(tick);
}

sT.addEventListener('input', () => { st.tau = parseFloat(sT.value); st.cooling = false; bCool.textContent = 'Cool through Tc'; render(); });
selS.addEventListener('change', () => { st.stat = selS.value; render(); });
tgOcc.addEventListener('change', () => { st.occupied = tgOcc.checked; render(); });
bCool.addEventListener('click', () => { st.cooling = !st.cooling; if (st.cooling && st.tau <= TAU_COLD + 1e-6) st.tau = TAU_HOT; bCool.textContent = st.cooling ? 'Stop' : 'Cool through Tc'; });
bR.addEventListener('click', () => { st.tau = 0.9; st.stat = 'all'; st.occupied = true; st.cooling = false; selS.value = 'all'; tgOcc.checked = true; sT.value = '0.9'; bCool.textContent = 'Cool through Tc'; render(); });

function bootSync() {
  vT.textContent = st.tau.toFixed(2);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.tau = TAU_HOT + f * (TAU_COLD - TAU_HOT);     // hot to cold sweep across Tc
    sT.value = String(st.tau);
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
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const muMB = solveMu('MB', st.tau);
  const muFD = solveMu('FD', st.tau);
  const muBE = st.tau < TC ? 0 : solveMu('BE', st.tau);
  const condensate = st.tau < TC ? condensateFraction(st.tau) : 0;
  return {
    fields: [
      { key: 'temperature-ratio', label: 'T/T_F (temperature ratio)', value: st.tau / EF, format: 'float' },
      { key: 'chemical-potential', label: 'mu (current stat)', value: (st.stat === 'FD' ? muFD : (st.stat === 'BE' ? muBE : muMB)), format: 'float' },
      { key: 'fermi-energy', label: 'E_F (Fermi energy)', value: EF, format: 'float' },
      { key: 'condensate-fraction', label: 'Condensate fraction (BE)', value: condensate, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const muBE = st.tau < TC ? 0 : solveMu('BE', st.tau);
  const N_be = numberIntegral('BE', muBE, st.tau);
  const N_be_err = Math.abs(N_be - NTOT);
  const condensate = st.tau < TC ? condensateFraction(st.tau) : 0;
  const cond_valid = st.tau < TC && condensate >= 0 && condensate <= 1;
  const status = N_be_err < 0.01 && cond_valid ? 'pass' : 'pending';
  return [
    {
      key: 'particle-conservation',
      label: 'N = integral g(E) n(E) dE',
      value: N_be_err.toExponential(2),
      status: status
    }
  ];
};
