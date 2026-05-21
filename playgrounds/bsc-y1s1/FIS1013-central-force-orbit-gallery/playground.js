// Central-force orbit gallery. Primary canvas: the orbit itself, a
// glowing trail about a luminous force centre, integrated with
// symplectic velocity-Verlet. Secondary panel: the effective potential
// V_eff(r) with the energy line and the radial turning points, placed
// below the readout HUD so they never overlap. The potential exponent,
// angular momentum and launch radius are sliders; presets show the
// Bertrand closed orbits, a precessing rosette and an unbound escape.
// Reference: Goldstein, Classical Mechanics (3rd ed.), Ch. 3.

import { createOrbit, step, energy, angularMomentum, vEff, orbitClass, MU } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['E', 'L', 'p', 'r', 'class'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

// k sign is chosen so the potential is an attractive well for every p
// (p<0 -> k<0, p=0 -> k>0 log, p>0 -> k>0), so V_eff always has a
// minimum and the gallery is meaningful.
function kFor(p) { return p < 0 ? -1 : 1; }
const st = { p: -1, L: 1.0, r0: 1.8, vr0: 0 };
let orbit = createOrbit({ k: kFor(st.p), p: st.p, L: st.L, r0: st.r0, vr0: st.vr0 });
let running = true, trail = [], maxR = 2;
const TRAIL = 1400;

function rebuild() {
  orbit = createOrbit({ k: kFor(st.p), p: st.p, L: st.L, r0: st.r0, vr0: st.vr0 });
  trail = []; maxR = st.r0 * 1.4;
}
function buildSlider(label, min, max, stp, value, onInput, fmt = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { val.textContent = fmt(+inp.value); onInput(parseFloat(inp.value)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return { inp, val, fmt };
}
const cP = buildSlider('exponent p', -3, 3, 0.5, st.p, v => { st.p = v; rebuild(); render(); }, v => v.toFixed(1));
const cL = buildSlider('ang. mom. L', 0.3, 3, 0.05, st.L, v => { st.L = v; rebuild(); render(); });
const cR = buildSlider('launch r₀', 0.6, 4, 0.05, st.r0, v => { st.r0 = v; rebuild(); render(); });
const selRow = document.createElement('div'); selRow.className = 'row';
const selLab = document.createElement('span'); selLab.className = 'label'; selLab.textContent = 'preset';
const sel = document.createElement('select'); sel.setAttribute('aria-label', 'preset');
const PRESETS = {
  'Kepler ellipse': { p: -1, L: 1.0, r0: 1.8, vr0: 0 },
  'Harmonic (oscillator)': { p: 2, L: 1.0, r0: 1.4, vr0: 0 },
  'Precessing rosette': { p: -1.5, L: 1.3, r0: 2.0, vr0: 0 },
  'Unbound escape': { p: -1, L: 1.0, r0: 1.1, vr0: 1.7 },
  'Near-circular': { p: -1, L: 1.0, r0: 1.0, vr0: 0 },
};
for (const name of Object.keys(PRESETS)) { const o = document.createElement('option'); o.value = name; o.textContent = name; sel.appendChild(o); }
sel.addEventListener('change', () => { Object.assign(st, PRESETS[sel.value]); cP.inp.value = String(st.p); cP.val.textContent = st.p.toFixed(1); cL.inp.value = String(st.L); cL.val.textContent = st.L.toFixed(2); cR.inp.value = String(st.r0); cR.val.textContent = st.r0.toFixed(2); rebuild(); render(); });
selRow.appendChild(selLab); selRow.appendChild(sel); const ss = document.createElement('span'); ss.className = 'value'; selRow.appendChild(ss);
controlsEl.appendChild(selRow);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { p: -1, L: 1.0, r0: 1.8, vr0: 0 }); cP.inp.value = '-1'; cP.val.textContent = '-1.0'; cL.inp.value = '1'; cL.val.textContent = '1.00'; cR.inp.value = '1.8'; cR.val.textContent = '1.80'; sel.value = 'Kepler ellipse'; rebuild(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render(); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#050509'; ctx.fillRect(0, 0, W, H);

  // Orbit scene (left).
  const cxL = 270, cyL = 286;
  const r = Math.hypot(orbit.x, orbit.y);
  // Fit the frame to the orbit envelope once, then hold it. The old
  // rule chased the instantaneous radius with a slow per-frame decay,
  // so a bound ellipse made the whole view zoom in and out every
  // period (the apoapsis inflated maxR, periapsis let it decay). A
  // monotone running max grows once to the true apoapsis and then
  // stays put; rebuild() resets it on any parameter change or escape.
  maxR = Math.min(14, Math.max(maxR, r * 1.12));
  const sc = 224 / Math.max(1.2, maxR);
  // Force centre glow.
  const g = ctx.createRadialGradient(cxL, cyL, 0, cxL, cyL, 26);
  g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cxL, cyL, 26, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cxL, cyL, 5, 0, 6.28); ctx.fill();
  // Trail (fading).
  if (trail.length > 2) {
    for (let i = 1; i < trail.length; i += 1) {
      const a = i / trail.length;
      ctx.strokeStyle = `rgba(110,200,255,${0.12 + 0.7 * a})`; ctx.lineWidth = 1 + 1.6 * a;
      ctx.beginPath();
      ctx.moveTo(cxL + trail[i - 1][0] * sc, cyL - trail[i - 1][1] * sc);
      ctx.lineTo(cxL + trail[i][0] * sc, cyL - trail[i][1] * sc);
      ctx.stroke();
    }
  }
  // Particle.
  const px = cxL + orbit.x * sc, py = cyL - orbit.y * sc;
  ctx.fillStyle = '#eaf6ff'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = 'rgba(120,200,255,0.5)'; ctx.beginPath(); ctx.moveTo(cxL, cyL); ctx.lineTo(px, py); ctx.stroke();

  // V_eff(r) panel (right, below the HUD).
  const ax0 = 560, ax1 = W - 26, ayb = H - 40, ayt = 168;
  ctx.fillStyle = '#0b0b13'; ctx.fillRect(ax0 - 8, ayt - 26, ax1 - ax0 + 34, ayb - ayt + 52);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('V_eff(r) = V(r) + L²/2μr²', ax0, ayt - 8);
  const rLo = 0.25, rHi = Math.max(3.5, maxR * 1.25);
  const E = energy(orbit);
  let vlo = Infinity, vhi = -Infinity;
  const NS = 240;
  const vv = [];
  for (let i = 0; i <= NS; i += 1) { const rr = rLo + (rHi - rLo) * i / NS; const v = vEff(rr, orbit.k, orbit.p, orbit.L); vv.push(v); if (isFinite(v)) { vlo = Math.min(vlo, v); vhi = Math.max(vhi, v); } }
  vlo = Math.min(vlo, E); vhi = Math.max(Math.min(vhi, E + Math.abs(E) + 3), E + 0.5);
  const X = (rr) => ax0 + (rr - rLo) / (rHi - rLo) * (ax1 - ax0);
  const Y = (v) => ayb - (Math.max(vlo, Math.min(vhi, v)) - vlo) / (vhi - vlo) * (ayb - ayt);
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(ax0, ayt); ctx.lineTo(ax0, ayb); ctx.lineTo(ax1, ayb); ctx.stroke();
  ctx.fillStyle = '#6e727a'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText('r', ax1 - 8, ayb + 14);
  // V_eff curve.
  ctx.strokeStyle = '#7cc6ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= NS; i += 1) { const rr = rLo + (rHi - rLo) * i / NS; i ? ctx.lineTo(X(rr), Y(vv[i])) : ctx.moveTo(X(rr), Y(vv[i])); }
  ctx.stroke();
  // Energy line + turning points (where V_eff crosses E).
  ctx.strokeStyle = '#ffd166'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(ax0, Y(E)); ctx.lineTo(ax1, Y(E)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166'; ctx.fillText('E', ax0 + 4, Y(E) - 4);
  for (let i = 1; i <= NS; i += 1) {
    if ((vv[i - 1] - E) * (vv[i] - E) < 0) {
      const rr = rLo + (rHi - rLo) * (i - 0.5) / NS;
      ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(X(rr), Y(E), 4, 0, 6.28); ctx.fill();
    }
  }
  // Current radius marker on the curve.
  ctx.fillStyle = '#eaf6ff'; ctx.beginPath(); ctx.arc(X(Math.min(rHi, r)), Y(vEff(Math.min(rHi, r), orbit.k, orbit.p, orbit.L)), 4, 0, 6.28); ctx.fill();

  const cls = orbitClass(orbit);
  rEls.E.textContent = E.toFixed(3);
  rEls.L.textContent = angularMomentum(orbit).toFixed(3);
  rEls.p.textContent = orbit.p.toFixed(1);
  rEls.r.textContent = r.toFixed(3);
  rEls.class.textContent = cls;
}

const PHYS_DT = 0.0015;
function advance(dtSim) {
  const n = Math.min(5000, Math.round(dtSim / PHYS_DT));
  for (let i = 0; i < n; i += 1) {
    step(orbit, PHYS_DT);
    if (i % 5 === 0) { trail.push([orbit.x, orbit.y]); if (trail.length > TRAIL) trail.shift(); }
    if (Math.hypot(orbit.x, orbit.y) > 60) { rebuild(); break; }   // escaped: relaunch
  }
}
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) advance(dt * 1.3);
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) {
    // Step through the preset gallery across the five reference frames so
    // the goldens show the contrast (closed Kepler ellipse, harmonic
    // ellipse, precessing rosette, unbound escape, near-circular), which
    // is the whole point of a gallery. Deterministic, fraction-driven.
    const names = Object.keys(PRESETS);
    const idx = Math.max(0, Math.min(names.length - 1, Math.round(CAPTURE_FRAC * (names.length - 1))));
    Object.assign(st, PRESETS[names[idx]]);
    rebuild();
    advance(6.0);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const s = createOrbit({ k: -1, p: -1, L: 1.0, r0: 1.6 });
  const E0 = energy(s), L0 = angularMomentum(s);
  for (let i = 0; i < 20000; i += 1) step(s, 0.002);
  const dE = Math.abs((energy(s) - E0) / E0), dL = Math.abs(angularMomentum(s) - L0);
  if (dE > 1e-4 || dL > 1e-7) return { name: 'orbit conservation', pass: false, msg: `dE=${dE.toExponential(2)} dL=${dL.toExponential(2)}` };
  return { name: 'E, L conserved (symplectic)', pass: true, msg: `dE=${dE.toExponential(2)}, dL=${dL.toExponential(2)} over 2e4 steps` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
