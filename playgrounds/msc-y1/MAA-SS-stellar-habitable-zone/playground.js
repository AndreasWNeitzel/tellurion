// Stellar habitable zone: planet equilibrium temperature vs orbital radius.

import { luminosity, Teq as simTeq, radiusAtT } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const state = { Teff: 5778, Rstar: 1.0, A: 0.3, a_AU: 1.0, theta: 0, running: !prefersReducedMotion() };

function Lstar() { return luminosity(state.Teff, state.Rstar); }
function Teq(a_AU) { return simTeq(a_AU, state.Teff, state.Rstar, state.A); }
function starRGB() {
  if (state.Teff < 3500) return [255, 130, 60];
  if (state.Teff < 5000) return [255, 200, 120];
  if (state.Teff < 6500) return [255, 240, 200];
  return [200, 220, 255];
}

// Top-down orbital view. The habitable zone is the green annulus; the
// planet orbits the star on a circular orbit of radius a (Keplerian
// angular speed). The AU->px scale fits {a, HZ outer} with a stable
// floor so changing any slider rescales the physics, never flings the
// planet off-screen (the old build coupled the scale to r_out only).
function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const rFromT = (T) => radiusAtT(T, state.Teff, state.Rstar, state.A);
  const r_in = rFromT(273), r_out = rFromT(200);
  const Rmax = Math.max(3.0, state.a_AU * 1.18, r_out * 1.08);
  const sc = Math.min(W, H) * 0.42 / Rmax;            // AU -> px, stable

  // AU reference rings.
  ctx.strokeStyle = 'rgba(150,160,185,0.18)'; ctx.fillStyle = 'rgba(170,180,205,0.45)';
  ctx.font = '11px ui-monospace, monospace'; ctx.setLineDash([2, 4]);
  for (let au = 1; au * sc < Math.min(W, H) * 0.5; au += 1) {
    ctx.beginPath(); ctx.arc(cx, cy, au * sc, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillText(`${au} AU`, cx + au * sc + 3, cy - 3);
  }
  ctx.setLineDash([]);

  // Habitable-zone annulus (green ring between r_in and r_out).
  ctx.beginPath();
  ctx.arc(cx, cy, r_out * sc, 0, 2 * Math.PI);
  ctx.arc(cx, cy, r_in * sc, 0, 2 * Math.PI, true);
  ctx.fillStyle = 'rgba(90, 220, 120, 0.20)'; ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(120,235,150,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r_in * sc, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r_out * sc, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(150,240,180,0.85)';
  ctx.fillText(`habitable zone  ${r_in.toFixed(2)} - ${r_out.toFixed(2)} AU`, cx - 70, cy - r_out * sc - 8);

  // Orbit path.
  ctx.strokeStyle = 'rgba(200,210,235,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, state.a_AU * sc, 0, 2 * Math.PI); ctx.stroke();

  // Star (size grows mildly with R_star, color by Teff).
  const [r0, g0, b0] = starRGB();
  const sr = Math.max(9, Math.min(34, 13 * Math.cbrt(state.Rstar)));
  const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr * 2.6);
  gl.addColorStop(0, `rgba(${r0},${g0},${b0},0.9)`); gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, sr * 2.6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = `rgb(${r0},${g0},${b0})`;
  ctx.beginPath(); ctx.arc(cx, cy, sr, 0, 2 * Math.PI); ctx.fill();

  // Planet on its circular orbit, coloured by equilibrium temperature.
  const T = Teq(state.a_AU);
  const px = cx + Math.cos(state.theta) * state.a_AU * sc;
  const py = cy + Math.sin(state.theta) * state.a_AU * sc;
  let pCol = '#7c9cff', tag = 'too cold (frozen)';
  if (T > 320) { pCol = '#d76b5e'; tag = 'too hot (runaway)'; }
  else if (T >= 240) { pCol = '#5fe39b'; tag = 'habitable (liquid water)'; }
  else { pCol = '#9ec8ff'; tag = 'too cold (frozen)'; }
  ctx.fillStyle = pCol;
  ctx.beginPath(); ctx.arc(px, py, 8, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke();

  // Compact HUD (no overlap with the orbit; bottom-left).
  ctx.fillStyle = 'rgba(14,14,19,0.7)'; ctx.fillRect(10, H - 64, 250, 54);
  ctx.fillStyle = '#dfe3ea'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`a = ${state.a_AU.toFixed(2)} AU    T_eq = ${T.toFixed(0)} K`, 20, H - 42);
  ctx.fillStyle = pCol;
  ctx.fillText(tag, 20, H - 22);

  drawTeqDiagnostic(cx, cy, r_in, r_out, T);

  readoutInv.textContent = `Teff=${state.Teff} R=${state.Rstar} A=${state.A.toFixed(2)} T_eq=${T.toFixed(0)} K`;
  readoutFrame.textContent = '-';
}

// Rule-13 diagnostic: equilibrium temperature T_eq vs orbital radius.
// T_eq ~ a^(-1/2) (inverse-square flux, Stefan-Boltzmann balance). The
// habitable band (200-273 K) is shaded; the planet's current (a, T_eq)
// sits on the curve, tying the orbital scene to the physics.
function drawTeqDiagnostic(cx, cy, r_in, r_out, Tnow) {
  const pw = 232, ph = 150, px = W - pw - 14, py = 14;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('T_eq vs orbital radius', px + 8, py + 14);
  const ax = px + 34, ay = py + 24, aw = pw - 46, ah = ph - 42;
  const aMax = Math.max(3, state.a_AU * 1.2, r_out * 1.1);
  const tMax = 360;
  const xOf = (a) => ax + (a / aMax) * aw;
  const yOf = (t) => ay + ah - (t / tMax) * ah;
  // Habitable band 200-273 K.
  ctx.fillStyle = 'rgba(90, 220, 120, 0.16)';
  ctx.fillRect(ax, yOf(273), aw, yOf(200) - yOf(273));
  // T_eq(a) curve.
  ctx.strokeStyle = '#5fe39b'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 1; k <= 120; k += 1) {
    const a = aMax * k / 120;
    const t = Teq(a);
    const x = xOf(a), y = yOf(Math.min(tMax, t));
    if (k === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current planet point.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(xOf(state.a_AU), yOf(Math.min(tMax, Tnow)), 4, 0, 6.28); ctx.fill();
  // Axes.
  ctx.fillStyle = 'rgba(200,210,240,0.75)'; ctx.font = '9px ui-monospace, monospace';
  ctx.fillText('273', px + 8, yOf(273) + 3);
  ctx.fillText('200', px + 8, yOf(200) + 3);
  ctx.fillText('0', ax - 8, ay + ah + 9);
  ctx.fillText(`${aMax.toFixed(1)} AU`, ax + aw - 34, ay + ah + 9);
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

const KEPLER = 1.15;                                 // visual angular-speed scale
let _last = performance.now();
function tick(now) {
  const dt = Math.min((now - _last) / 1000, 0.05); _last = now;
  if (state.running) {
    // Keplerian: omega ~ a^-3/2, so inner orbits are visibly faster.
    state.theta = (state.theta + dt * KEPLER / Math.pow(Math.max(state.a_AU, 0.05), 1.5)) % (2 * Math.PI);
  }
  render();
  requestAnimationFrame(tick);
}

if (CAPTURE_NAME && DETERMINISTIC) {
  // Sweep the planet outward through the habitable zone and advance
  // the orbit phase so the five frames are distinct: too-hot (close
  // in) -> habitable -> too-cold (far out).
  const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
  state.a_AU = 0.30 + frac * 2.70;
  state.theta = frac * 1.7 * Math.PI;
  const aInp = document.getElementById('a');
  if (aInp) { aInp.value = String(state.a_AU); const v = aInp.parentElement && aInp.parentElement.querySelector('.value'); if (v) v.textContent = state.a_AU.toFixed(2); }
  render();
} else {
  render();
}
if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // Sun-like star, A=0.3, a=1 AU should give T_eq close to Earth's 255 K.
  state.Teff = 5778; state.Rstar = 1.0; state.A = 0.3;
  const T = Teq(1.0);
  if (Math.abs(T - 254) > 5) return { name: 'Earth T_eq', pass: false, msg: `T_eq(1 AU, A=0.3) = ${T}` };
  return { name: 'Earth equilibrium T', pass: true, msg: `T_eq(1 AU, A=0.3) = ${T.toFixed(1)} K` };
};
