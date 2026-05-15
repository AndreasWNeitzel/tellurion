// Stellar habitable zone: planet equilibrium temperature vs orbital radius.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const state = { Teff: 5778, Rstar: 1.0, A: 0.3, a_AU: 1.0 };

// L = 4 pi R^2 sigma T^4, in solar units L = R^2 (T/T_sun)^4.
function Lstar() { return state.Rstar * state.Rstar * Math.pow(state.Teff / 5778, 4); }
function Teq(a_AU) {
  // T_eq = T_sun (1 - A)^0.25 / sqrt(2 a / R_sun) * sqrt(R_star / R_sun)
  // Approx for a in AU: T_eq = T_sun (L)^0.25 * (1 - A)^0.25 / sqrt(a)
  return 278 * Math.pow(Lstar(), 0.25) * Math.pow(1 - state.A, 0.25) / Math.sqrt(a_AU);
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Sun on left.
  const sx = 90, sy = H / 2, sr = Math.max(10, Math.min(60, 60 * state.Rstar));
  // Star color by Teff.
  let cr, cg, cb;
  if (state.Teff < 3500) { cr = 255; cg = 130; cb = 60; }
  else if (state.Teff < 5000) { cr = 255; cg = 200; cb = 120; }
  else if (state.Teff < 6500) { cr = 255; cg = 240; cb = 200; }
  else { cr = 200; cg = 220; cb = 255; }
  const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2);
  grad.addColorStop(0, `rgb(${cr},${cg},${cb})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 2 * Math.PI); ctx.fill();

  // HZ band: T_inner ~ 273 K, T_outer ~ 200 K.
  function rFromT(T) {
    return Math.pow(278 * Math.pow(Lstar(), 0.25) * Math.pow(1 - state.A, 0.25) / T, 2);
  }
  const r_in  = rFromT(273);
  const r_out = rFromT(200);
  const scaleX = (W - 160) / Math.max(r_out * 1.4, 1);
  ctx.fillStyle = 'rgba(90, 220, 120, 0.18)';
  ctx.fillRect(sx + r_in * scaleX, sy - 80, (r_out - r_in) * scaleX, 160);

  // Planet at a_AU.
  const px = sx + state.a_AU * scaleX;
  const py = sy;
  const T = Teq(state.a_AU);
  let pCol = '#7c9cff';
  if (T > 350) pCol = '#cc7777';
  else if (T > 273) pCol = '#7fffaa';
  else pCol = '#cce0ff';
  ctx.fillStyle = pCol;
  ctx.beginPath(); ctx.arc(px, py, 9, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#dcdde2'; ctx.font = '13px sans-serif';
  ctx.fillStyle = '#dcdde2';
  ctx.fillText(`a=${state.a_AU.toFixed(2)} AU  T_eq=${T.toFixed(0)} K`, px - 20, py - 14);
  ctx.fillText(`HZ: [${r_in.toFixed(2)}, ${r_out.toFixed(2)}] AU`, 16, H - 24);

  readoutInv.textContent = `Teff=${state.Teff} R=${state.Rstar} A=${state.A.toFixed(2)} T_eq=${T.toFixed(0)} K`;
  readoutFrame.textContent = '-';
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt) {
    const r = document.createElement('div'); r.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); render(); });
    r.appendChild(lab); r.appendChild(inp); r.appendChild(val);
    controlsEl.appendChild(r);
  }
  slider('Teff',  'Teff (K)',     2500, 9000, 100, state.Teff,  v => state.Teff = v, v => v.toFixed(0));
  slider('Rstar', 'R_star (R_o)', 0.1, 3.0, 0.05, state.Rstar, v => state.Rstar = v, v => v.toFixed(2));
  slider('A',     'albedo',       0.0, 0.9, 0.05, state.A,    v => state.A = v,    v => v.toFixed(2));
  slider('a',     'a (AU)',       0.05, 6.0, 0.05, state.a_AU, v => state.a_AU = v, v => v.toFixed(2));
}

buildControls();
render();
if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  // Sun-like star, A=0.3, a=1 AU should give T_eq close to Earth's 255 K.
  state.Teff = 5778; state.Rstar = 1.0; state.A = 0.3;
  const T = Teq(1.0);
  if (Math.abs(T - 254) > 5) return { name: 'Earth T_eq', pass: false, msg: `T_eq(1 AU, A=0.3) = ${T}` };
  return { name: 'Earth equilibrium T', pass: true, msg: `T_eq(1 AU, A=0.3) = ${T.toFixed(1)} K` };
};
