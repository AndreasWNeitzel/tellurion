// SEMF as a fitting puzzle. Target B/A heatmap on the N-Z plane (canonical
// Wapstra coefficients) vs the user's overlay (their five slider values).
// The physics engine in sim.js is unchanged; the binding formula is
// re-evaluated here with parameterized coefficients so the engine's
// module-level COEFFS is never mutated.

import { COEFFS } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });
const readoutBa   = document.getElementById('readout-ba') || { textContent: '' };
const readoutPeak = document.getElementById('readout-peak') || { textContent: '' };
const controlsEl  = document.getElementById('controls');

const W = canvas.width, H = canvas.height;

// Parameterized SEMF binding-per-nucleon (mirrors sim.js bindingEnergyMeV
// but with explicit coefficients instead of the frozen COEFFS object).
function baWith(co, A, Z) {
  if (A <= 0 || Z < 0 || Z > A) return 0;
  const N = A - Z;
  const volume    =  co.aV * A;
  const surface   = -co.aS * Math.pow(A, 2 / 3);
  const coulomb   = -co.aC * Z * (Z - 1) / Math.pow(A, 1 / 3);
  const asymmetry = -co.aA * (N - Z) * (N - Z) / A;
  let pair = 0;
  if (A % 2 === 0) {
    const eZ = Z % 2 === 0, eN = N % 2 === 0;
    if (eZ && eN) pair = co.aP / Math.sqrt(A);
    else if (!eZ && !eN) pair = -co.aP / Math.sqrt(A);
  }
  return (volume + surface + coulomb + asymmetry + pair) / A;
}

const TARGET = { aV: 15.8, aS: 18.3, aC: 0.714, aA: 23.2, aP: 12.0 };
const guess  = { aV: 0, aS: 0, aC: 0, aA: 0, aP: 0 };
let showValley = false;

// Sample grid: N in [0,160], Z in [0,100].
const NMAX = 160, ZMAX = 100, STEP = 4;

function chiSquared() {
  let chi = 0;
  for (let Z = 1; Z <= ZMAX; Z += STEP) {
    for (let n = 1; n <= NMAX; n += STEP) {
      const A = n + Z;
      const bt = baWith(TARGET, A, Z);
      if (bt < 1) continue;
      const bf = baWith(guess, A, Z);
      chi += (bt - bf) * (bt - bf);
    }
  }
  return chi;
}

function color(ba) {
  // viridis-ish 0..9 MeV.
  const t = Math.max(0, Math.min(1, ba / 9));
  const r = Math.round(255 * Math.min(1, 0.27 + 1.5 * t * t));
  const g = Math.round(255 * (0.0 + 0.86 * t));
  const b = Math.round(255 * (0.33 + 0.4 * Math.cos(3.0 * t)));
  return `rgb(${r},${Math.min(255,g)},${Math.max(0,Math.min(255,b))})`;
}

function render() {
  ctx.fillStyle = '#0b0b10';
  ctx.fillRect(0, 0, W, H);

  // Three side-by-side panels: target, your fit, residual.
  const pad = 16;
  const pw = (W - 4 * pad) / 3, ph = H - 70;
  const px0 = [pad, 2 * pad + pw, 3 * pad + 2 * pw];
  const labels = ['Target B/A (Wapstra)', 'Your fit', 'Residual |target - fit|'];

  for (let panel = 0; panel < 3; panel += 1) {
    const ox = px0[panel], oy = 40;
    for (let zi = 0; zi < ZMAX; zi += STEP) {
      for (let ni = 0; ni < NMAX; ni += STEP) {
        const Z = zi + 1, A = ni + Z;
        const bt = baWith(TARGET, A, Z);
        const bf = baWith(guess, A, Z);
        let col;
        if (panel === 0) col = bt > 1 ? color(bt) : '#0b0b10';
        else if (panel === 1) col = bf > 1 ? color(bf) : '#0b0b10';
        else {
          const res = bt > 1 ? Math.abs(bt - bf) : 0;
          const t = Math.min(1, res / 4);
          col = bt > 1 ? `rgb(${Math.round(255*t)},${Math.round(60*(1-t))},${Math.round(60*(1-t))})` : '#0b0b10';
        }
        const cw = pw / (NMAX / STEP), chh = ph / (ZMAX / STEP);
        ctx.fillStyle = col;
        ctx.fillRect(ox + ni / NMAX * pw, oy + (ZMAX - zi) / ZMAX * ph - chh, cw + 1, chh + 1);
      }
    }
    // Valley of stability ridge overlay.
    if (showValley && panel === 0) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let A = 2; A <= NMAX + ZMAX; A += 2) {
        const Zs = A / (2 + 0.5 * TARGET.aC * Math.pow(A, 2 / 3) / TARGET.aA);
        const Ns = A - Zs;
        if (Ns < 0 || Ns > NMAX || Zs > ZMAX) continue;
        const x = ox + Ns / NMAX * pw;
        const y = oy + (ZMAX - Zs) / ZMAX * ph;
        if (A === 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(220,220,240,0.35)';
    ctx.strokeRect(ox, 40, pw, ph);
    ctx.fillStyle = '#dcdde2'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(labels[panel], ox + 4, 28);
    ctx.fillText('N ->', ox + pw - 34, 40 + ph + 16);
  }

  const chi = chiSquared();
  const matched = chi < 50;
  readoutBa.textContent = `chi^2 = ${chi.toFixed(0)} MeV^2`;
  readoutPeak.textContent = matched ? 'MATCH' : 'fitting...';
  ctx.fillStyle = matched ? '#06d6a0' : '#9aa0a6';
  ctx.font = fontString(canvas, 'heading', 'mono', 600);
  ctx.fillText(matched
    ? `MATCH  (aV=${TARGET.aV} aS=${TARGET.aS} aC=${TARGET.aC} aA=${TARGET.aA} aP=${TARGET.aP})`
    : `chi^2 = ${chi.toFixed(0)} MeV^2  (target < 50)`, pad, H - 18);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(key, label, max, step) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = `s-${key}`; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = `s-${key}`; inp.type = 'range';
    inp.min = '0'; inp.max = String(max); inp.step = String(step); inp.value = '0';
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = '0.00';
    inp.addEventListener('input', () => { guess[key] = parseFloat(inp.value); val.textContent = guess[key].toFixed(2); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('aV', 'a_V (MeV)', 30, 0.1);
  slider('aS', 'a_S (MeV)', 30, 0.1);
  slider('aC', 'a_C (MeV)', 2, 0.01);
  slider('aA', 'a_A (MeV)', 40, 0.1);
  slider('aP', 'a_P (MeV)', 20, 0.1);
  const row = document.createElement('div'); row.className = 'row';
  const hint = document.createElement('button'); hint.type = 'button'; hint.textContent = 'Hint: valley of stability';
  hint.addEventListener('click', () => { showValley = !showValley; });
  row.appendChild(hint); controlsEl.appendChild(row);
}

buildControls();
let raf;
function loop() { render(); raf = requestAnimationFrame(loop); }
if (DETERMINISTIC) {
  // Reference capture sweeps the guessed coefficients from zero toward
  // the canonical Wapstra values, so the five golden frames are
  // distinct: the "Your fit" panel fills in and the residual fades as
  // the SEMF terms reconstruct the binding-energy surface.
  if (CAPTURE_NAME) {
    for (const k of Object.keys(guess)) guess[k] = CAPTURE_FRAC * TARGET[k];
  }
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
} else {
  raf = requestAnimationFrame(loop);
}

window.__physicsCheck = async () => {
  // With canonical coefficients, chi^2 vs target is ~0 (identical formula).
  for (const k of Object.keys(guess)) guess[k] = TARGET[k];
  const chiMatch = chiSquared();
  for (const k of Object.keys(guess)) guess[k] = 0;
  const chiZero = chiSquared();
  for (const k of Object.keys(guess)) guess[k] = 0;
  if (chiMatch >= 50) return { name: 'SEMF fit', pass: false, msg: `chi^2 at canonical = ${chiMatch}` };
  if (chiZero <= 10000) return { name: 'SEMF fit', pass: false, msg: `chi^2 at zero = ${chiZero}` };
  return { name: 'SEMF chi-squared puzzle', pass: true, msg: `canonical chi^2=${chiMatch.toFixed(1)} (<50), zero chi^2=${chiZero.toFixed(0)} (>10000)` };
};


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'av', label: 'aV (volume)', value: guess.aV, format: 'float' },
      { key: 'as', label: 'aS (surface)', value: guess.aS, format: 'float' },
      { key: 'ac', label: 'aC (Coulomb)', value: guess.aC, format: 'float' },
      { key: 'aa', label: 'aA (asymmetry)', value: guess.aA, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Cross-check: chi-squared error between fitted and target coefficients.
  const chi = chiSquared();
  const relError = Math.sqrt(chi) / 100;
  return [
    {
      key: 'fit-error',
      label: 'Fit RMSE (%) ',
      value: relError.toExponential(2),
      status: relError < 0.5 ? 'pass' : relError < 5 ? 'pending' : 'drift'
    }
  ];
};
