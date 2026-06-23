// Gamow peak. The reaction-rate integrand I(E) = exp(-E/kT) * exp(-sqrt(E_G/E))
// is the product of the falling Maxwell-Boltzmann tail and the rising
// tunneling probability. Top panel: the three curves on a shared energy
// axis, each normalised to its own maximum, with the Gamow energy E0 and
// the Gaussian-approximation width Delta marked, and the true peak
// magnification (1 / I(E0)) called out. Bottom panel: the integrated rate
// against temperature, which is where the steep T-sensitivity of stellar
// burning comes from. Temperature auto-sweeps; the slider and the reaction
// selector pause it and drive the whole frame.
// Reference: Clayton, Stellar Evolution and Nucleosynthesis (1983), Sec. 4-3.

import {
  gamowEnergy, kT_keV, integrand, penetration,
  peakEnergy, peakWidth, peakValue, rate, rateExponent, REACTIONS,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selRx = document.getElementById('sel-rx');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const LOGT_LO = 6.6, LOGT_HI = 9.2;
const SWEEP = 0.42;                                    // log10 half-width of the auto-sweep band

function rxByKey(k) { return REACTIONS.find((r) => r.key === k) || REACTIONS[0]; }
const st = { rx: 'pp', logT: rxByKey('pp').defLogT };
let running = !prefersReducedMotion();

// Colours.
const C_MB = '#4ea3ff';      // Maxwell-Boltzmann tail
const C_PEN = '#ffce4a';     // tunneling / penetration
const C_PROD = '#ff5fa8';    // product (Gamow peak)
const C_RATE = '#39d4c8';    // rate-vs-T diagnostic

function pausePlay() { running = false; btnP.textContent = 'Play'; btnP.setAttribute('aria-pressed', 'true'); }
function resume() { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); }

selRx.addEventListener('change', () => {
  st.rx = selRx.value; st.logT = rxByKey(st.rx).defLogT;
  sT.value = String(st.logT); vT.textContent = st.logT.toFixed(2);
  render();
});
sT.addEventListener('input', () => { pausePlay(); st.logT = parseFloat(sT.value); vT.textContent = st.logT.toFixed(2); render(); });
btnR.addEventListener('click', () => {
  st.rx = 'pp'; selRx.value = 'pp'; st.logT = rxByKey('pp').defLogT;
  sT.value = String(st.logT); vT.textContent = st.logT.toFixed(2); resume(); render();
});
btnP.addEventListener('click', () => { if (running) pausePlay(); else resume(); });

// ---- geometry ----
const W = canvas.width, H = canvas.height;
const MAIN = { x0: 78, x1: W - 30, yt: 150, yb: 612 };
const DIAG = { x0: 78, x1: W - 30, yt: 742, yb: 986 };

function fmtPow10(lt) {
  const e = Math.floor(lt), m = Math.pow(10, lt - e);
  return `${m.toFixed(1)}×10${sup_(e)}`;
}
function sup_(n) {
  const map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  return String(n).split('').map((c) => map[c] ?? c).join('');
}

function render() {
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
  const rx = rxByKey(st.rx);
  const T = Math.pow(10, st.logT);
  const kT = kT_keV(T);
  const E_G = gamowEnergy(rx.Z1, rx.Z2, rx.A1, rx.A2);
  const E0 = peakEnergy(E_G, kT);
  const dE = peakWidth(E0, kT);
  const Ipk = peakValue(E_G, kT);
  const mag = Ipk > 0 ? 1 / Ipk : Infinity;

  drawHeader(rx, T, kT, E_G, E0, dE, mag);
  drawMainPanel(E_G, kT, E0, dE, Ipk);
  drawDiagPanel(E_G, T);
}

// ---- header callout ----
function drawHeader(rx, T, kT, E_G, E0, dE, mag) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f2f4f8'; ctx.font = fontString(canvas, 'title', 'sans', 600);
  ctx.fillText(`Gamow peak:  ${rx.label}`, 20, 36);

  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#aeb6c2';
  const TMK = T / 1e6;
  ctx.fillText(`T = ${fmtPow10(st.logT)} K  =  ${TMK >= 100 ? TMK.toFixed(0) : TMK.toFixed(1)} MK`, 20, 62);
  ctx.fillText(`kT = ${kT.toFixed(2)} keV`, 20, 82);
  ctx.fillText(`E_G = ${E_G >= 1e4 ? (E_G / 1e3).toFixed(0) + ' MeV' : E_G.toFixed(0) + ' keV'}`, 300, 62);
  ctx.fillStyle = C_PROD;
  ctx.fillText(`E₀ = ${E0 < 100 ? E0.toFixed(1) : E0.toFixed(0)} keV    Δ = ${dE < 100 ? dE.toFixed(1) : dE.toFixed(0)} keV`, 300, 82);
  ctx.fillStyle = '#ffb0d4';
  const magStr = mag >= 1e4 ? `×${fmtPow10(Math.log10(mag))}` : `×${mag.toFixed(0)}`;
  ctx.fillText(`peak fraction I(E₀) = ${mag > 0 ? (1 / mag).toExponential(1) : '0'}   (curve magnified ${magStr})`, 300, 36);
}

// ---- main panel: the three curves on a shared energy axis ----
function drawMainPanel(E_G, kT, E0, dE, Ipk) {
  const { x0, x1, yt, yb } = MAIN;
  const Emax = Math.max(5 * E0, E0 + 4.5 * dE, 6 * kT);
  const xOf = (E) => x0 + (E / Emax) * (x1 - x0);
  const yOf = (v) => yb - Math.max(0, Math.min(1.02, v)) * (yb - yt);

  // plot frame and gridlines
  ctx.fillStyle = '#080a10'; ctx.fillRect(x0, yt, x1 - x0, yb - yt);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#727a88'; ctx.textAlign = 'right';
  for (let f = 0; f <= 1.0001; f += 0.25) {
    const yy = yOf(f);
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.fillText(f.toFixed(2), x0 - 6, yy + 3);
  }
  // x ticks (energy)
  ctx.textAlign = 'center';
  const nTick = 5;
  for (let i = 0; i <= nTick; i += 1) {
    const E = (Emax * i) / nTick, xx = xOf(E);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(xx, yt); ctx.lineTo(xx, yb); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(E < 100 ? E.toFixed(1) : E.toFixed(0), xx, yb + 18);
  }

  const N = 280;
  const Es = [], mb = [], pen = [], prod = [];
  for (let i = 0; i <= N; i += 1) {
    const E = (Emax * i) / N;
    Es.push(E);
    mb.push(Math.exp(-E / kT));                       // 1 at E=0
    pen.push(penetration(E, E_G));
    prod.push(integrand(E, kT, E_G) / Ipk);           // 0..1, peak at E0
  }
  const penMax = pen[N] || 1;                          // penetration rises toward the right edge

  // width band around the Gamow peak
  const bandL = xOf(Math.max(0, E0 - dE / 2)), bandR = xOf(E0 + dE / 2);
  ctx.fillStyle = 'rgba(255,95,168,0.12)'; ctx.fillRect(bandL, yt, bandR - bandL, yb - yt);

  // filled product area
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0));
  for (let i = 0; i <= N; i += 1) ctx.lineTo(xOf(Es[i]), yOf(prod[i]));
  ctx.lineTo(xOf(Emax), yOf(0)); ctx.closePath();
  ctx.fillStyle = 'rgba(255,95,168,0.20)'; ctx.fill();

  // curves
  strokeCurve(Es, mb, (v) => v, xOf, yOf, C_MB, 2);
  strokeCurve(Es, pen, (v) => v / penMax, xOf, yOf, C_PEN, 2);
  strokeCurve(Es, prod, (v) => v, xOf, yOf, C_PROD, 2.6);

  // E0 marker
  const xs = xOf(E0);
  ctx.strokeStyle = C_PROD; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(xs, yt); ctx.lineTo(xs, yb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = C_PROD; ctx.beginPath(); ctx.arc(xs, yOf(1), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#ffb0d4'; ctx.fillText('E₀', xs, yt - 6);

  // axis labels
  ctx.fillStyle = '#9aa2ae'; ctx.font = fontString(canvas, 'caption', 'sans');
  ctx.textAlign = 'center'; ctx.fillText('relative collision energy  E (keV)', (x0 + x1) / 2, yb + 38);
  ctx.save(); ctx.translate(22, (yt + yb) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('probability (each curve normalised to its own max)', 0, 0); ctx.restore();

  // legend (with a backing panel so curves do not bleed through the text)
  const items = [
    [C_MB, 'Maxwell-Boltzmann  e^(-E/kT)'],
    [C_PEN, 'tunneling  e^(-√(E_G/E))'],
    [C_PROD, 'product  =  Gamow peak'],
  ];
  ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono');
  const lgW = 252, lgH = items.length * 19 + 12;
  const lgX = x1 - lgW - 10, lgY = yt + 8;
  ctx.fillStyle = 'rgba(8,10,16,0.86)'; ctx.fillRect(lgX, lgY, lgW, lgH);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.strokeRect(lgX + 0.5, lgY + 0.5, lgW, lgH);
  const lx = lgX + 12, ly = lgY + 16;
  items.forEach(([col, lab], i) => {
    const yy = ly + i * 19;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, yy); ctx.lineTo(lx + 22, yy); ctx.stroke();
    ctx.fillStyle = '#cdd3dc'; ctx.fillText(lab, lx + 30, yy + 4);
  });
}

function strokeCurve(Es, ys, map, xOf, yOf, color, lw) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  for (let i = 0; i < Es.length; i += 1) {
    const X = xOf(Es[i]), Y = yOf(map(ys[i]));
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.stroke();
}

// The rate-vs-T curve depends only on the reaction (E_G), not on the
// swept temperature, so cache it and rebuild only when the reaction changes.
let _diag = { rx: null, lr: null, lo: 0, hi: 0 };
function diagCurve(E_G) {
  if (_diag.rx === st.rx) return _diag;
  const M = 160, lr = [];
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= M; i += 1) {
    const lt = LOGT_LO + (LOGT_HI - LOGT_LO) * i / M;
    const r = rate(kT_keV(Math.pow(10, lt)), E_G);
    const l = Math.log10(Math.max(r, 1e-300));
    lr.push([lt, l]);
    if (Number.isFinite(l)) { if (l < lo) lo = l; if (l > hi) hi = l; }
  }
  hi = Math.ceil(hi + 0.5); lo = Math.max(hi - 60, Math.floor(lo - 0.5));
  _diag = { rx: st.rx, lr, lo, hi };
  return _diag;
}

// ---- diagnostic panel: integrated rate vs temperature ----
function drawDiagPanel(E_G, Tnow) {
  const { x0, x1, yt, yb } = DIAG;
  ctx.fillStyle = '#080a10'; ctx.fillRect(x0, yt, x1 - x0, yb - yt);

  const { lr, lo, hi } = diagCurve(E_G);
  const xOf = (lt) => x0 + (lt - LOGT_LO) / (LOGT_HI - LOGT_LO) * (x1 - x0);
  const yOf = (l) => yb - (Math.max(lo, Math.min(hi, l)) - lo) / (hi - lo) * (yb - yt);

  // y decade gridlines
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  const step = Math.max(5, Math.ceil((hi - lo) / 6 / 5) * 5);
  for (let l = Math.ceil(lo / step) * step; l <= hi; l += step) {
    const yy = yOf(l);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(`10${sup_(l)}`, x0 - 6, yy + 3);
  }
  // x ticks
  ctx.textAlign = 'center';
  for (let lt = 7; lt <= 9; lt += 1) {
    const xx = xOf(lt);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(xx, yt); ctx.lineTo(xx, yb); ctx.stroke();
    ctx.fillStyle = '#727a88'; ctx.fillText(String(lt), xx, yb + 18);
  }

  // rate curve
  ctx.strokeStyle = C_RATE; ctx.lineWidth = 2.2; ctx.beginPath();
  lr.forEach(([lt, l], i) => { const X = xOf(lt), Y = yOf(l); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();

  // current operating point
  const lnow = Math.log10(Math.max(rate(kT_keV(Tnow), E_G), 1e-300));
  const xs = xOf(st.logT);
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(xs, yt); ctx.lineTo(xs, yb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(xs, yOf(lnow), 5, 0, 2 * Math.PI); ctx.fill();

  const nu = rateExponent(Tnow, E_G);
  ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#cdd3dc';
  ctx.fillText(`<σv> ∝ T^(-3/2) ∫ I(E) dE   (S-factor constant)`, x0 + 10, yt + 20);
  ctx.fillStyle = C_RATE;
  ctx.fillText(`local slope  ν = dln(rate)/dlnT ≈ ${nu.toFixed(1)}`, x0 + 10, yt + 40);

  // axis labels
  ctx.fillStyle = '#9aa2ae'; ctx.font = fontString(canvas, 'caption', 'sans'); ctx.textAlign = 'center';
  ctx.fillText('temperature  log₁₀ T (K)', (x0 + x1) / 2, yb + 38);
  ctx.save(); ctx.translate(22, (yt + yb) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('relative reaction rate', 0, 0); ctx.restore();

  // panel title
  ctx.fillStyle = '#e6e8ec'; ctx.font = fontString(canvas, 'body', 'sans', 500); ctx.textAlign = 'left';
  ctx.fillText('Why burning is so temperature-sensitive', x0, yt - 12);
}

// ---- animation: ping-pong the temperature around the reaction default ----
let rafOn = false, dir = 1, last = (typeof performance !== 'undefined' ? performance.now() : 0);
function tick(now) {
  if (running) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    const c = rxByKey(st.rx).defLogT;
    const lo = Math.max(LOGT_LO, c - SWEEP), hi = Math.min(LOGT_HI, c + SWEEP);
    st.logT += dir * dt * ((hi - lo) / 7);
    if (st.logT >= hi) { st.logT = hi; dir = -1; } else if (st.logT <= lo) { st.logT = lo; dir = 1; }
    sT.value = String(st.logT); vT.textContent = st.logT.toFixed(2);
  }
  last = now;
  render();
  if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false;
}
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = (typeof performance !== 'undefined' ? performance.now() : 0); requestAnimationFrame(tick); } }

function boot() {
  vT.textContent = st.logT.toFixed(2); sT.value = String(st.logT); selRx.value = st.rx;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { boot(); startLoop(); }, { once: true }); } else { boot(); startLoop(); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const rx = rxByKey(st.rx);
  const T = Math.pow(10, st.logT), kT = kT_keV(T);
  const E_G = gamowEnergy(rx.Z1, rx.Z2, rx.A1, rx.A2);
  const E0 = peakEnergy(E_G, kT), dE = peakWidth(E0, kT);
  const Ipk = peakValue(E_G, kT);
  return { fields: [
    { key: 'reaction', label: 'reaction', value: rx.label, format: 'text' },
    { key: 'kT', label: '$kT$ (keV)', value: kT, format: 'float' },
    { key: 'E0', label: 'Gamow energy $E_0$ (keV)', value: E0, format: 'float' },
    { key: 'width', label: 'peak width $\\Delta$ (keV)', value: dE, format: 'float' },
    { key: 'E0_over_kT', label: '$E_0 / kT$', value: E0 / kT, format: 'float' },
    { key: 'suppression', label: 'peak fraction $I(E_0)$', value: Ipk.toExponential(2), format: 'text' },
  ] };
};
window.playground.getInvariants = function () {
  const rx = rxByKey(st.rx);
  const T = Math.pow(10, st.logT), kT = kT_keV(T);
  const E_G = gamowEnergy(rx.Z1, rx.Z2, rx.A1, rx.A2);
  const E0 = peakEnergy(E_G, kT);
  // analytic E0 must be the argmax of the integrand: scan a fine grid.
  let bestE = 0, bestV = -Infinity;
  const Emax = E0 + 8 * peakWidth(E0, kT);
  for (let i = 1; i <= 4000; i += 1) {
    const E = (Emax * i) / 4000, v = integrand(E, kT, E_G);
    if (v > bestV) { bestV = v; bestE = E; }
  }
  const relErr = Math.abs(bestE - E0) / E0;
  const Thi = rate(kT_keV(T * 1.05), E_G), Tlo = rate(kT_keV(T * 0.95), E_G);
  return [
    { key: 'peak-location', label: 'analytic $E_0$ = numeric argmax', value: relErr.toExponential(1), status: relErr < 0.02 ? 'pass' : 'drift' },
    { key: 'rate-increasing', label: 'rate increases with $T$', value: Thi > Tlo ? 'yes' : 'no', status: Thi > Tlo ? 'pass' : 'drift' },
  ];
};
