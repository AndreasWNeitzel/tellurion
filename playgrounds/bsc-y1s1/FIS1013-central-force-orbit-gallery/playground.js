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
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack } from '../../../shared/js/render/vertical-layout.js';
import { viridis } from '../../../shared/js/render/colormaps.js';

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
let running = true, trail = [], maxR = 2, vMax = 1e-6;
const TRAIL = 3200;   // long enough to show a rosette build into a flower

let view = { w: 760, h: 950, dpr: 1 };
let REG = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.6 },
    { name: 'veff', weight: 1.6 },
  ]);
}

function rebuild() {
  orbit = createOrbit({ k: kFor(st.p), p: st.p, L: st.L, r0: st.r0, vr0: st.vr0 });
  trail = []; maxR = st.r0 * 1.4; vMax = 1e-6;
}
function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }
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
  if (!REG) relayout();
  const col = {
    bg: '#050509', panel: '#0a0c12', center: '#ffd166', particle: '#eaf6ff',
    veff: '#7cc6ff', e: '#ffd166', turn: '#ef476f',
    muted: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.12)',
  };
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);

  // ---- Orbit scene ----
  const S = REG.scene;
  ctx.fillStyle = col.panel; ctx.fillRect(S.x, S.y, S.w, S.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(S.x + 0.5, S.y + 0.5, S.w - 1, S.h - 1);
  const cx = S.x + S.w / 2, cy = S.y + S.h / 2 + 8;
  const r = Math.hypot(orbit.x, orbit.y);
  maxR = Math.min(14, Math.max(maxR, r * 1.12));
  const sc = (Math.min(S.w, S.h) / 2 - 26) / Math.max(1.2, maxR);

  // Trail coloured by speed (viridis): the planet runs fast at perihelion
  // and slow at aphelion (Kepler's second law made visible).
  if (trail.length > 2) {
    for (let i = 1; i < trail.length; i += 1) {
      const a = i / trail.length;
      const c = viridis(Math.max(0, Math.min(1, (trail[i][2] || 0) / vMax)));
      ctx.strokeStyle = rgba(c, (0.06 + 0.7 * a).toFixed(3));
      ctx.lineWidth = 1 + 1.8 * a;
      ctx.beginPath();
      ctx.moveTo(cx + trail[i - 1][0] * sc, cy - trail[i - 1][1] * sc);
      ctx.lineTo(cx + trail[i][0] * sc, cy - trail[i][1] * sc);
      ctx.stroke();
    }
  }
  // Force centre glow.
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
  g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 6.28); ctx.fill();
  ctx.fillStyle = col.center; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.28); ctx.fill();
  // Radius line + particle.
  const px = cx + orbit.x * sc, py = cy - orbit.y * sc;
  ctx.strokeStyle = 'rgba(120,200,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.fillStyle = col.particle; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.28); ctx.fill();

  const E = energy(orbit);
  const cls = orbitClass(orbit);
  // Title + on-canvas readout (self-contained for a reel crop).
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillStyle = col.center; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('orbit', S.x + 8, S.y + 7);
  ctx.font = fontString(canvas, 'mono', 'mono');
  ctx.fillStyle = '#cdd3da'; ctx.textAlign = 'right';
  ctx.fillText(`p ${orbit.p.toFixed(1)}   L ${angularMomentum(orbit).toFixed(2)}`, S.x + S.w - 8, S.y + 8);
  ctx.fillText(`E ${E.toFixed(2)}   ${cls}`, S.x + S.w - 8, S.y + 24);

  // ---- Effective potential panel ----
  const P = REG.veff;
  ctx.fillStyle = col.panel; ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(P.x + 0.5, P.y + 0.5, P.w - 1, P.h - 1);
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('effective potential  V_eff(r) = V(r) + L²/2μr²', P.x + 8, P.y + 7);
  const padL = 18, padR = 16, padT = 30, padB = 22;
  const ax0 = P.x + padL, ax1 = P.x + P.w - padR, ayt = P.y + padT, ayb = P.y + P.h - padB;
  // Frame the plot to the radial range the orbit actually explores: scan for
  // the outer turning point (largest r where V_eff crosses E) and frame just
  // past it, so the well and both turning points fill the panel instead of
  // being squeezed against a long flat large-r tail.
  let rOuter = 2.0;
  { let pv = vEff(0.25, orbit.k, orbit.p, orbit.L);
    for (let i = 1; i <= 400; i += 1) { const rr = 0.25 + 24 * i / 400; const v = vEff(rr, orbit.k, orbit.p, orbit.L); if (isFinite(pv) && isFinite(v) && (pv - E) * (v - E) < 0) rOuter = rr; pv = v; } }
  const rLo = 0.25, rHi = Math.min(14, Math.max(1.6, rOuter * 1.3));
  let vlo = Infinity, vhi = -Infinity; const NS = 240; const vv = [];
  for (let i = 0; i <= NS; i += 1) { const rr = rLo + (rHi - rLo) * i / NS; const v = vEff(rr, orbit.k, orbit.p, orbit.L); vv.push(v); if (isFinite(v)) { vlo = Math.min(vlo, v); vhi = Math.max(vhi, v); } }
  vlo = Math.min(vlo, E); vhi = Math.max(Math.min(vhi, E + Math.abs(E) + 3), E + 0.5);
  const X = (rr) => ax0 + (rr - rLo) / (rHi - rLo) * (ax1 - ax0);
  const Y = (v) => ayb - (Math.max(vlo, Math.min(vhi, v)) - vlo) / (vhi - vlo) * (ayb - ayt);
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax0, ayt); ctx.lineTo(ax0, ayb); ctx.lineTo(ax1, ayb); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('r', ax1 - 2, ayb + 5);
  // V_eff curve.
  ctx.strokeStyle = col.veff; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= NS; i += 1) { const rr = rLo + (rHi - rLo) * i / NS; i ? ctx.lineTo(X(rr), Y(vv[i])) : ctx.moveTo(X(rr), Y(vv[i])); }
  ctx.stroke();
  // Energy line + turning points.
  ctx.strokeStyle = col.e; ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(ax0, Y(E)); ctx.lineTo(ax1, Y(E)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col.e; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillText('E', ax0 + 4, Y(E) - 2);
  for (let i = 1; i <= NS; i += 1) {
    if ((vv[i - 1] - E) * (vv[i] - E) < 0) {
      const rr = rLo + (rHi - rLo) * (i - 0.5) / NS;
      ctx.fillStyle = col.turn; ctx.beginPath(); ctx.arc(X(rr), Y(E), 4, 0, 6.28); ctx.fill();
    }
  }
  // Current radius marker.
  const rC = Math.min(rHi, r);
  ctx.fillStyle = col.particle; ctx.beginPath(); ctx.arc(X(rC), Y(vEff(rC, orbit.k, orbit.p, orbit.L)), 4, 0, 6.28); ctx.fill();

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
    const spd = Math.hypot(orbit.vx, orbit.vy);
    if (spd > vMax) vMax = spd;
    if (i % 5 === 0) { trail.push([orbit.x, orbit.y, spd]); if (trail.length > TRAIL) trail.shift(); }
    if (Math.hypot(orbit.x, orbit.y) > 60) { rebuild(); break; }   // escaped: relaunch
  }
}
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) advance(dt * 1.9);
  render();
  requestAnimationFrame(tick);
}
if (typeof ResizeObserver !== 'undefined') {
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { relayout(); render(); });
  });
  ro.observe(canvas);
}

function bootSync() {
  relayout();
  if (!CAPTURE_NAME) advance(7.0);   // pre-trace a full orbit so the first frame is not empty
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'orbit-class', label: 'orbit class', value: orbitClass(orbit) },
      { key: 'energy', label: 'energy $E$', value: energy(orbit), format: 'float' },
      { key: 'angular-momentum', label: 'angular momentum $L$', value: angularMomentum(orbit), format: 'float' },
      { key: 'radius', label: 'orbital radius $r$', value: Math.hypot(orbit.x, orbit.y), format: 'float' },
    ],
  };
};
// A conservative (Hamiltonian) system: total energy is the
// invariant. The baseline is the energy at the start of the run and
// is re-taken whenever a control change steps the energy.
let __energy0 = null, __energyPrev = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const E = energy(orbit);
      if (!Number.isFinite(E)) return [];
      if (__energyPrev !== null
        && Math.abs(E - __energyPrev) > 0.02 * Math.max(1e-9, Math.abs(__energyPrev)) + 1e-9) {
        __energy0 = E;                    // discontinuity: a control changed the system
      }
      __energyPrev = E;
      if (__energy0 === null) __energy0 = E;
      const dE = Math.abs(E - __energy0) / Math.max(1e-12, Math.abs(__energy0));
      return [{
        key: 'energy',
        label: 'total energy conserved (rel. drift)',
        value: dE.toExponential(2),
        status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
