// Mode trapping in evolved stars, shown as the physics it is, not a
// bare plot. A sharp glitch in the buoyancy (Brunt-Vaisala) profile
// partially reflects g-modes: modes whose period sits at a deltaP
// minimum are trapped and their displacement eigenfunction rings
// loudly just outside the glitch, while modes between dips propagate
// across the whole radiative cavity. The playground sweeps the mode
// ladder so you watch successive modes trap and release; the
// observable period-spacing diagram deltaP(P) is demoted to a strip
// with the current mode tracked on it. The mean spacing stays at the
// asymptotic Pi_1 despite the wiggle: that is the live invariant.
// sim.js deltaP / modePeriods are byte-identical; trapping /
// gModeEnvelope / gModePhase are appended. Reference: Mosser et al.,
// A&A 618, A109 (2018); Aerts, Christensen-Dalsgaard and Kurtz,
// Asteroseismology, Ch. 3.
import { deltaP, modePeriods, trapping, gModeEnvelope, gModePhase } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const sA = document.getElementById('slider-A'), vA = document.getElementById('value-A');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { Pi: 80, A: 0.2, Ptrap: 350, t: 0, mi: 1 };
let running = !prefersReducedMotion();
const NM = 60, P0 = 800;
const XENV = 0.62;                                   // g-mode cavity edge (frac radius)

sP.addEventListener('input', () => { st.Pi = parseFloat(sP.value); vP.textContent = st.Pi.toFixed(0); });
sA.addEventListener('input', () => { st.A = parseFloat(sA.value); vA.textContent = st.A.toFixed(2); });
sT.addEventListener('input', () => { st.Ptrap = parseFloat(sT.value); vT.textContent = st.Ptrap.toFixed(0); });
btnR.addEventListener('click', () => { st.Pi = 80; st.A = 0.2; st.Ptrap = 350; st.t = 0; st.mi = 1; sP.value = '80'; vP.textContent = '80'; sA.value = '0.2'; vA.textContent = '0.20'; sT.value = '350'; vT.textContent = '350'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const glitchX = () => Math.max(0.12, Math.min(0.5, 0.14 + (st.Ptrap - 100) / 700 * 0.34));
// buoyancy frequency N(x): high in the radiative core, a sharp spike
// at the composition glitch, dropping to zero at the convective edge
function Nprofile(x, xg) {
  if (x >= XENV) return 0.04;
  const core = 0.35 + 0.55 * (1 - x / XENV);
  const spike = 0.9 * Math.exp(-((x - xg) ** 2) / (2 * 0.012 ** 2));
  return Math.min(1, core + spike);
}

function render() {
  if (!CAPTURE_NAME && running) {
    st.t += 0.016;
    st.mi += 0.016 * 1.7;                            // sweep up the mode ladder
    if (st.mi > NM - 2) st.mi = 1;
  }
  const xg = glitchX();
  const ps = modePeriods(NM, st.Pi, st.A, st.Ptrap, P0);
  const i = Math.max(1, Math.min(NM - 2, Math.floor(st.mi)));
  const P = ps[i];
  const dPnow = ps[i + 1] - ps[i];
  const trap = Math.max(0, Math.min(1, (st.A / 0.5) * trapping(P, st.Ptrap)));
  const nOrd = 7 + i * 0.5;

  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('A buoyancy glitch traps some g-modes: the eigenfunction shows which', 18, 24);

  // star-interior panel
  const x0 = 42, x1 = W - 28, pt = 64, pb = 300;
  const XP = (x) => x0 + x * (x1 - x0);
  ctx.fillStyle = '#0a0c14'; ctx.fillRect(x0, pt, x1 - x0, pb - pt);
  // cavity shading
  ctx.fillStyle = 'rgba(91,192,235,0.06)'; ctx.fillRect(x0, pt, XP(XENV) - x0, pb - pt);
  ctx.fillStyle = 'rgba(160,170,200,0.05)'; ctx.fillRect(XP(XENV), pt, x1 - XP(XENV), pb - pt);
  // N(x) buoyancy profile (filled, near the top of the panel)
  const nTop = pt + 8, nBot = pt + 96;
  ctx.beginPath(); ctx.moveTo(x0, nBot);
  for (let s = 0; s <= 300; s += 1) { const x = s / 300; ctx.lineTo(XP(x), nBot - Nprofile(x, xg) * (nBot - nTop)); }
  ctx.lineTo(x1, nBot); ctx.closePath();
  const ng = ctx.createLinearGradient(0, nTop, 0, nBot);
  ng.addColorStop(0, 'rgba(91,192,235,0.5)'); ng.addColorStop(1, 'rgba(91,192,235,0.05)');
  ctx.fillStyle = ng; ctx.fill();
  ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('buoyancy frequency N(r)', x0 + 8, nTop + 12);
  // glitch marker
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(XP(xg), pt); ctx.lineTo(XP(xg), pb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.fillText('composition glitch', XP(xg) + 6, pt + 110);
  ctx.strokeStyle = 'rgba(160,170,200,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(XP(XENV), pt); ctx.lineTo(XP(XENV), pb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#94a3b8'; ctx.fillText('convective envelope', XP(XENV) + 6, pb - 8);

  // g-mode displacement eigenfunction
  const mid = (pt + 116 + pb) / 2;
  const osc = Math.cos(2 * Math.PI * st.t * 0.9);
  let peak = 0;
  const ys = [];
  for (let s = 0; s <= 520; s += 1) {
    const x = XENV * s / 520;
    const e = gModeEnvelope(x, xg, trap, XENV);
    const y = e * Math.sin(gModePhase(x, nOrd, xg)) * osc;
    ys.push([XP(x), y]);
    if (Math.abs(y) > peak) peak = Math.abs(y);
  }
  const amp = 54 / (peak || 1);
  ctx.strokeStyle = 'rgba(226,232,240,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.stroke();
  ctx.strokeStyle = trap > 0.5 ? '#ffd166' : '#06d6a0';
  ctx.lineWidth = 2; ctx.beginPath();
  ys.forEach(([px, y], k) => { const yy = mid - y * amp; k === 0 ? ctx.moveTo(px, yy) : ctx.lineTo(px, yy); });
  ctx.stroke();
  // glow
  ctx.strokeStyle = trap > 0.5 ? 'rgba(255,209,102,0.25)' : 'rgba(6,214,160,0.22)';
  ctx.lineWidth = 6; ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = trap > 0.5 ? '#ffd166' : '#06d6a0'; ctx.font = fontString(canvas, 'body');
  ctx.fillText(trap > 0.5 ? 'mode TRAPPED: rings at the glitch (a deltaP dip)' : 'mode propagating across the cavity', x0 + 8, 48);
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('radial displacement ξ(r)   <-- centre        fractional radius r/R        surface -->', x0 + 8, pb + 16);

  // recovered asymptotic spacing: the live invariant
  let mean = 0;
  for (let k = 0; k < NM - 1; k += 1) mean += ps[k + 1] - ps[k];
  mean /= (NM - 1);
  ctx.fillStyle = '#cbd5e1'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`mean deltaP = ${mean.toFixed(2)} s   (asymptotic Pi_1 = ${st.Pi.toFixed(0)} s)   P_trap = ${st.Ptrap.toFixed(0)} s   mode n ~ ${nOrd.toFixed(0)}   trapping = ${(trap * 100).toFixed(0)}%`, 18, pb + 38);

  // demoted diagnostic: the period-spacing diagram deltaP(P) vs P
  const dx0 = 60, dx1 = W - 24, dy0 = H - 110, dy1 = H - 14;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('diagnostic: period-spacing  deltaP vs P  (what Kepler/TESS observe)', dx0 + 8, dy0 + 12);
  const Pmin = ps[1], Pmax = ps[NM - 1];
  const dLo = st.Pi * (1 - st.A) * 0.9, dHi = st.Pi * (1 + st.A) * 1.1;
  const xPp = (p) => dx0 + 12 + (p - Pmin) / (Pmax - Pmin) * (dx1 - dx0 - 24);
  const yPp = (d) => dy1 - 6 - (d - dLo) / (dHi - dLo) * (dy1 - dy0 - 26);
  ctx.strokeStyle = 'rgba(6,214,160,0.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xPp(Pmin), yPp(st.Pi)); ctx.lineTo(xPp(Pmax), yPp(st.Pi)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(6,214,160,0.8)'; ctx.fillText('Pi_1', xPp(Pmax) - 28, yPp(st.Pi) - 4);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let k = 1; k < NM - 1; k += 1) { const pp = { x: xPp(ps[k]), y: yPp(ps[k + 1] - ps[k]) }; k === 1 ? ctx.moveTo(pp.x, pp.y) : ctx.lineTo(pp.x, pp.y); }
  ctx.stroke();
  ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(xPp(P), yPp(dPnow), 4.5, 0, 6.2832); ctx.fill();

  rR.textContent = `${mean.toFixed(1)} s`;
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.t = frac * 6.0;
    st.mi = 1 + frac * (NM - 4);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'pi1', label: 'Pi_1 (s)', value: st.Pi, format: 'float' },
      { key: 'amplitude', label: 'Trapping amplitude A', value: st.A, format: 'float' },
      { key: 'ptrap', label: 'Trap period (s)', value: st.Ptrap, format: 'float' },
      { key: 'mode-index', label: 'Mode index', value: st.mi }
    ]
  };
};
window.playground.getInvariants = function () {
  const periods = modePeriods(NM, st.Pi, st.A, st.Ptrap, P0);
  let sum = 0;
  for (let i = 1; i < periods.length; i++) sum += (periods[i] - periods[i-1]);
  const meanSpacing = sum / (NM - 1);
  const relError = Math.abs(meanSpacing - st.Pi) / st.Pi;
  return [
    {
      key: 'mean-spacing-rule',
      label: 'Mean spacing (should be Pi_1)',
      value: meanSpacing.toFixed(1) + ' s',
      status: relError < 0.05 ? 'pass' : 'drift'
    }
  ];
};
