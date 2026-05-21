// Time-dependent Schroedinger equation, sculpted. The primary scene is
// the physical |psi(x)|^2 probability cloud, coloured by the local
// phase arg(psi), evolving by Crank-Nicolson over a chosen potential
// V(x): a free packet spreads, a barrier splits it into reflected and
// transmitted parts (tunnelling), a harmonic well makes a coherent
// state oscillate, a double well lets it tunnel between minima. The
// strip below traces <x>(t). Numerics in sim.js (shared CN solver).
// Reference: Griffiths, Introduction to Quantum Mechanics (3rd ed.),
// Ch. 1-2; Press et al., Numerical Recipes (3rd ed.), Sec. 20.2.

import { makeState, setPotential, setGaussian, step, norm, expectationX, energy, probRightOf } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['potential', 'k0', 'norm', 'energy', '<x>', 'T (right)'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const N = 640, L = 60, DT = 0.01, STEPS_PER_FRAME = 6, HORIZON = 1400;
// Default: E = k0^2/2 = 8 ~ V0 = 8, so the barrier splits the packet
// into clearly comparable reflected and transmitted lobes (the
// headline). It auto-launches and re-launches on loop.
const st = { pot: 'barrier', k0: 4.0, param: 8, nstep: 0, running: 1 };
let s = makeState(N, L);
let trace = [];

function packetStart() {
  if (st.pot === 'harmonic') return { x0: 6, k0: 0, sig: 0.7 };
  if (st.pot === 'double') return { x0: -8, k0: 0, sig: 1.0 };
  if (st.pot === 'well' || st.pot === 'lattice') return { x0: -6, k0: st.k0, sig: 1.4 };
  return { x0: -16, k0: st.k0, sig: 1.2 };       // free / barrier / delta
}
function potOpts() {
  if (st.pot === 'harmonic') return { omega: st.param / 8 };   // param 2..16 -> omega 0.25..2
  return { V0: st.param, width: 1.5 };
}
function rebuild(toStep) {
  s = makeState(N, L);
  setPotential(s, st.pot, potOpts());
  const p = packetStart();
  setGaussian(s, p.x0, p.k0, p.sig);
  trace = [];
  for (let k = 0; k < toStep; k += 1) { step(s, DT); if (k % 4 === 0) trace.push(expectationX(s)); }
  st.nstep = toStep;
}
rebuild(0);

// geometry
const PX = 24, PY = 44, PW = 552, PH = 320;       // wavefunction over V(x)
const TX = 24, TY = 392, TW = 552, TH = 120;      // <x>(t) trace
const QX = 596, QW = 286;                         // legend area

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(PX, PY, PW, PH);
  const xpix = (i) => PX + (i / (N - 1)) * PW;
  // potential V(x), scaled to the panel
  let vmax = 1e-6; for (let i = 0; i < N; i += 1) vmax = Math.max(vmax, Math.min(s.V[i], 30));
  const vy = (v) => PY + PH - 12 - (Math.min(v, 30) / vmax) * (PH - 40);
  ctx.strokeStyle = 'rgba(160,170,190,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < N; i += 1) { const Y = vy(s.V[i]); i === 0 ? ctx.moveTo(xpix(i), Y) : ctx.lineTo(xpix(i), Y); }
  ctx.stroke(); ctx.lineWidth = 1;
  // |psi|^2, phase-coloured (hue = arg psi), as filled bars from a baseline
  let pmax = 1e-9; for (let i = 0; i < N; i += 1) pmax = Math.max(pmax, s.re[i] ** 2 + s.im[i] ** 2);
  const base = PY + PH - 12;
  for (let i = 0; i < N; i += 1) {
    const p = s.re[i] ** 2 + s.im[i] ** 2;
    if (p < pmax * 0.002) continue;
    const ph = Math.atan2(s.im[i], s.re[i]);
    const hue = ((ph + Math.PI) / (2 * Math.PI)) * 360;
    const hgt = (p / pmax) * (PH - 50);
    ctx.fillStyle = `hsl(${hue.toFixed(0)},85%,60%)`;
    ctx.fillRect(xpix(i), base - hgt, Math.max(1, PW / N + 0.6), hgt);
  }
  // mean-position marker
  const mx = expectationX(s), mi = (mx + L / 2) / L * (N - 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xpix(mi), PY + 4); ctx.lineTo(xpix(mi), base); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('|psi(x)|^2 phase-coloured over V(x); dashed line = <x>', PX + PW / 2, PY + PH + 18);
  ctx.textAlign = 'left';

  // <x>(t) trace
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(TX, TY, TW, TH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(TX, TY, TW, TH);
  ctx.strokeStyle = 'rgba(150,160,180,0.3)'; ctx.beginPath(); ctx.moveTo(TX, TY + TH / 2); ctx.lineTo(TX + TW, TY + TH / 2); ctx.stroke();
  if (trace.length > 1) {
    ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.6; ctx.beginPath();
    const M = Math.max(60, trace.length);
    for (let k = 0; k < trace.length; k += 1) { const X = TX + (k / M) * TW, Y = TY + TH / 2 - (trace[k] / (L / 2)) * (TH / 2 - 6); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
    ctx.stroke(); ctx.lineWidth = 1;
  }
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('<x>(t)', TX + TW / 2, TY + TH + 16); ctx.textAlign = 'left';

  // phase colour-wheel legend (anchored below the top-right HUD)
  const LG = 184;
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('phase arg(psi)', QX, LG);
  for (let q = 0; q < 60; q += 1) { ctx.fillStyle = `hsl(${(q / 60 * 360).toFixed(0)},85%,60%)`; ctx.fillRect(QX + q * 2.4, LG + 8, 2.6, 14); }
  ctx.fillStyle = '#9aa0ad'; ctx.fillText('-pi', QX, LG + 38); ctx.fillText('+pi', QX + 60 * 2.4 - 16, LG + 38);
  ctx.fillStyle = '#c8ccd6';
  ctx.fillText(`potential: ${st.pot}`, QX, LG + 66);
  ctx.fillText(`steps ${st.nstep}/${HORIZON}`, QX, LG + 88);
  ctx.fillStyle = '#9aa0ad';
  ctx.fillText('a barrier splits the', QX, LG + 118);
  ctx.fillText('packet: reflected', QX, LG + 136);
  ctx.fillText('+ tunnelled', QX, LG + 154);

  rEls['potential'].textContent = st.pot;
  rEls['k0'].textContent = st.k0.toFixed(2);
  rEls['norm'].textContent = norm(s).toFixed(6);
  rEls['energy'].textContent = energy(s).toFixed(3);
  rEls['<x>'].textContent = expectationX(s).toFixed(2);
  rEls['T (right)'].textContent = probRightOf(s, 2.5).toFixed(3);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(Math.min(st.nstep, HORIZON)); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const pRow = document.createElement('div'); pRow.className = 'row';
const pLab = document.createElement('span'); pLab.className = 'label'; pLab.textContent = 'potential';
const pSel = document.createElement('select'); pSel.setAttribute('aria-label', 'potential');
for (const [v, t] of [['barrier', 'tunnelling barrier'], ['free', 'free particle'], ['harmonic', 'harmonic well'], ['double', 'double well'], ['well', 'infinite box'], ['lattice', 'periodic lattice'], ['delta', 'delta spike']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; pSel.appendChild(o); }
pSel.value = st.pot;
pSel.addEventListener('change', () => { st.pot = pSel.value; rebuild(0); render(); });
pRow.appendChild(pLab); pRow.appendChild(pSel); const psp = document.createElement('span'); psp.className = 'value'; pRow.appendChild(psp);
controlsEl.appendChild(pRow);
const cK = buildSlider('momentum k0', 0.5, 6, 0.1, st.k0, 'k0', v => v.toFixed(1));
const cP = buildSlider('barrier V0 / well', 2, 16, 0.5, st.param, 'param', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bLaunch = document.createElement('button'); bLaunch.type = 'button'; bLaunch.textContent = 'Launch';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bLaunch); bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bLaunch.addEventListener('click', () => {       // re-fire the packet from t=0
  st.nstep = 0; st.running = 1; rebuild(0);
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bReset.addEventListener('click', () => {
  Object.assign(st, { pot: 'barrier', k0: 4.0, param: 8, nstep: 0, running: 1 });
  pSel.value = 'barrier'; cK.inp.value = '4'; cK.val.textContent = '4.0'; cP.inp.value = '8'; cP.val.textContent = '8.0';
  rebuild(0); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let acc = 0, lastT = performance.now(), holdF = 0;
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running && st.nstep < HORIZON) {
    acc += dr;
    while (acc > 1 / 60 && st.nstep < HORIZON) { for (let q = 0; q < STEPS_PER_FRAME && st.nstep < HORIZON; q += 1) { step(s, DT); st.nstep += 1; if (st.nstep % 4 === 0) trace.push(expectationX(s)); } acc -= 1 / 60; }
    if (st.nstep >= HORIZON) { acc = 0; holdF = 0; }
  } else if (st.running && st.nstep >= HORIZON && !CAPTURE_NAME) {
    // hold the final split for ~1.2 s, then re-launch (keeps it alive)
    holdF += 1; if (holdF > 72) { rebuild(0); }
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  rebuild(CAPTURE_NAME ? Math.round(CAPTURE_FRAC * HORIZON) : 0);
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const a = makeState(400, 50); setPotential(a, 'free', {}); setGaussian(a, 0, 0, 1.2);
  const n0 = norm(a);
  for (let k = 0; k < 800; k += 1) step(a, 0.02);
  if (Math.abs(norm(a) - n0) > 1e-6) return { name: 'CN unitarity', pass: false, msg: `dnorm=${Math.abs(norm(a) - n0)}` };
  const b = makeState(512, 60); setPotential(b, 'harmonic', { omega: 1 }); setGaussian(b, 4, 0, 1 / Math.sqrt(2));
  const E0 = energy(b); for (let k = 0; k < 600; k += 1) step(b, 0.01);
  if (Math.abs(energy(b) - E0) / Math.abs(E0) > 3e-3) return { name: 'energy conservation', pass: false, msg: 'E drift' };
  return { name: 'CN unitary + energy conserved', pass: true, msg: 'norm 1e-6, <H> stationary' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


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
