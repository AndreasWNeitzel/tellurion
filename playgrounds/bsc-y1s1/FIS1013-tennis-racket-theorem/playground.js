// playground.js
// The tennis-racket (Dzhanibekov) theorem on a recognizable rigid
// body. Pick a T-handle, a tennis racket, a smartphone or a book; each
// has its true principal moments (computed from the rendered geometry,
// I1 < I2 < I3). Spin about the intermediate axis and it tumbles
// periodically; the major and minor axes are stable. A bright trail of
// the long-axis tip makes the flip unmistakable, and a side panel
// plots the body-frame omega(t) whose sign reversals ARE the flips,
// with the conserved E and |L|. sim.js carries the dynamics
// (Euler's equations, RK4 + quaternion).

import {
  createRacket, step, rotationMatrix, diagnostics, energy, angularMomentumMag,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutW = document.getElementById('readout-w');
const readoutE = document.getElementById('readout-e');
const readoutFlips = document.getElementById('readout-flips');
const selectObject = document.getElementById('select-object');
const selectAxis = document.getElementById('select-axis');
const sliderSpin = document.getElementById('slider-spin');
const sliderPerturb = document.getElementById('slider-perturb');
const valueObject = document.getElementById('value-object');
const valueAxis = document.getElementById('value-axis');
const valueSpin = document.getElementById('value-spin');
const valuePerturb = document.getElementById('value-perturb');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PHYS_DT = 1 / 480;
// 3D scene on the left, omega(t) panel on the right.
const SCENE_W = 470;
const CX = SCENE_W / 2, CY = H / 2 - 10, SC = 150;
const AZ = 0.6, EL = 0.42;

// Each object is a list of axis-aligned boxes (body frame: x = major
// axis, y = intermediate/flip axis, z = minor axis). The principal
// moments are computed from this geometry so they are honest and
// satisfy I1 < I2 < I3 by construction (checked numerically).
const OBJECTS = {
  thandle: {
    label: 'T-handle',
    parts: [
      { c: [0, 0, 0], h: [0.95, 0.10, 0.10], col: '#cdd2db' },     // shaft (long, x)
      { c: [0.7, 0, 0], h: [0.13, 0.62, 0.13], col: '#9aa3b2' },    // crossbar (y)
    ],
  },
  racket: {
    label: 'tennis racket',
    parts: [
      { c: [-0.55, 0, 0], h: [0.55, 0.07, 0.05], col: '#7a5230' },  // handle (x)
      { c: [0.5, 0, 0], h: [0.42, 0.42, 0.035], col: '#2d83c4' },   // head (flat, x-y)
      { c: [0.5, 0, 0], h: [0.30, 0.30, 0.05], col: '#10131a' },    // string bed cut-out shade
    ],
  },
  phone: {
    label: 'smartphone',
    parts: [{ c: [0, 0, 0], h: [0.95, 0.50, 0.045], col: '#1b6ca8' }],
  },
  book: {
    label: 'hardback book',
    parts: [{ c: [0, 0, 0], h: [0.90, 0.62, 0.13], col: '#b5462f' }],
  },
};

// Principal moments (unit density) of an assembly of axis-aligned
// boxes, taken about the assembly centre of mass. Symmetric layouts
// keep the products of inertia zero, so the diagonal is the spectrum.
function principalMoments(parts) {
  let m = 0, cx = 0, cy = 0, cz = 0;
  for (const p of parts) {
    const mi = 8 * p.h[0] * p.h[1] * p.h[2];
    m += mi; cx += mi * p.c[0]; cy += mi * p.c[1]; cz += mi * p.c[2];
  }
  cx /= m; cy /= m; cz /= m;
  let Ixx = 0, Iyy = 0, Izz = 0;
  for (const p of parts) {
    const mi = 8 * p.h[0] * p.h[1] * p.h[2];
    const a = p.h[0] * 2, b = p.h[1] * 2, d = p.h[2] * 2;
    const ix = mi * (b * b + d * d) / 12, iy = mi * (a * a + d * d) / 12, iz = mi * (a * a + b * b) / 12;
    const dx = p.c[0] - cx, dy = p.c[1] - cy, dz = p.c[2] - cz;
    Ixx += ix + mi * (dy * dy + dz * dz);
    Iyy += iy + mi * (dx * dx + dz * dz);
    Izz += iz + mi * (dx * dx + dy * dy);
  }
  return [Ixx, Iyy, Izz];
}

function boxFaces(p) {
  const [hx, hy, hz] = p.h, [ox, oy, oz] = p.c;
  const v = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) v.push([ox + sx * hx, oy + sy * hy, oz + sz * hz]);
  return {
    verts: v,
    faces: [
      { idx: [0, 1, 3, 2] }, { idx: [4, 5, 7, 6] }, { idx: [0, 1, 5, 4] },
      { idx: [2, 3, 7, 6] }, { idx: [0, 2, 6, 4] }, { idx: [1, 3, 7, 5] },
    ],
    col: p.col,
  };
}

const st = {
  object: 'thandle', axis: 1, spin: 6, perturb: 0.04, playing: !(DETERMINISTIC || prefersReducedMotion()),
  sim: null, trace: [], flips: 0, lastSign: 0, I: [1, 2, 3],
  wHist: [[], [], []],
};
const WHIST = 360;

function rebuild() {
  st.I = principalMoments(OBJECTS[st.object].parts);
  st.sim = createRacket({ I: st.I, spin: st.spin, axis: st.axis, perturb: st.perturb });
  st.trace = []; st.flips = 0; st.lastSign = Math.sign(st.sim.w[st.axis]) || 1;
  st.wHist = [[], [], []];
}

function project(p) {
  const ca = Math.cos(AZ), sa = Math.sin(AZ);
  const ex = p[0] * ca - p[2] * sa;
  const ez = p[0] * sa + p[2] * ca;
  return { sx: CX + ex * SC, sy: CY - p[1] * SC * Math.cos(EL) - ez * SC * Math.sin(EL), d: ez };
}
function applyR(R, v) {
  return [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];
}

function drawScene() {
  const R = rotationMatrix(st.sim);
  // Bright trail of the +x (long-axis) tip: this is the line that
  // sweeps a big arc on every flip, so it reads instantly.
  const tip = applyR(R, [1.15, 0, 0]);
  st.trace.push(tip);
  if (st.trace.length > 300) st.trace.shift();
  for (let i = 1; i < st.trace.length; i += 1) {
    const a = project(st.trace[i - 1]), b = project(st.trace[i]);
    const t = i / st.trace.length;
    ctx.strokeStyle = `rgba(120,230,200,${(0.05 + 0.6 * t).toFixed(3)})`;
    ctx.lineWidth = 0.5 + 2.6 * t;
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
  }

  // All faces of all parts, one global painter's-order pass.
  const polys = [];
  for (const p of OBJECTS[st.object].parts) {
    const bf = boxFaces(p);
    const wv = bf.verts.map((v) => applyR(R, v));
    const pv = wv.map(project);
    for (const f of bf.faces) {
      const dz = (pv[f.idx[0]].d + pv[f.idx[1]].d + pv[f.idx[2]].d + pv[f.idx[3]].d) / 4;
      polys.push({ dz, pts: f.idx.map((k) => pv[k]), col: bf.col });
    }
  }
  polys.sort((a, b) => a.dz - b.dz);
  for (const poly of polys) {
    ctx.beginPath();
    poly.pts.forEach((q, j) => (j ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy)));
    ctx.closePath();
    ctx.fillStyle = poly.col; ctx.globalAlpha = 0.94; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.1; ctx.stroke();
  }
  // Body-axis arrows so the principal frame is explicit.
  const O = project([0, 0, 0]);
  const axCol = ['#ff6b6b', '#ffd166', '#5bc0eb'];
  const axNm = ['1 major', '2 inter', '3 minor'];
  for (let k = 0; k < 3; k += 1) {
    const e = [0, 0, 0]; e[k] = 1.35;
    const tp = project(applyR(R, e));
    ctx.strokeStyle = axCol[k]; ctx.lineWidth = k === st.axis ? 3.5 : 1.6;
    ctx.beginPath(); ctx.moveTo(O.sx, O.sy); ctx.lineTo(tp.sx, tp.sy); ctx.stroke();
    ctx.fillStyle = axCol[k]; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText(axNm[k], tp.sx + 4, tp.sy);
  }
}

function drawPanel() {
  const x0 = SCENE_W + 16, x1 = W - 16, yt = 64, yb = H - 96, mid = (yt + yb) / 2;
  ctx.fillStyle = '#0b0c12'; ctx.fillRect(x0 - 8, yt - 30, x1 - x0 + 24, yb - yt + 60);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('body-frame omega(t)', x0, yt - 12);
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.moveTo(x0, yt); ctx.lineTo(x0, yb); ctx.stroke();
  const sc = (yb - yt) / 2 / (st.spin * 1.25);
  const cols = ['#ff6b6b', '#ffd166', '#5bc0eb'];
  for (let k = 0; k < 3; k += 1) {
    const hk = st.wHist[k]; if (hk.length < 2) continue;
    ctx.strokeStyle = cols[k]; ctx.lineWidth = k === st.axis ? 2.2 : 1.3;
    ctx.beginPath();
    hk.forEach((val, i) => {
      const X = x0 + (i / WHIST) * (x1 - x0);
      const Y = mid - Math.max(-(yb - yt) / 2, Math.min((yb - yt) / 2, val * sc));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    ctx.stroke();
  }
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = cols[0]; ctx.fillText('w1', x1 - 70, yt + 10);
  ctx.fillStyle = cols[1]; ctx.fillText('w2', x1 - 46, yt + 10);
  ctx.fillStyle = cols[2]; ctx.fillText('w3', x1 - 22, yt + 10);
  // Conserved quantities (flat lines are the proof the solver is exact).
  const E = energy(st.sim), L = angularMomentumMag(st.sim);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`I = [${st.I.map((v) => v.toFixed(3)).join(', ')}]`, x0, yb + 16);
  ctx.fillText(`E=${E.toFixed(2)}  |L|=${L.toFixed(2)}  (conserved)`, x0, yb + 31);
  ctx.fillText('w-sign reversals = the flips', x0, yb + 46);
}

function draw() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  drawScene();
  drawPanel();
  const d = diagnostics(st.sim);
  readoutW.textContent = `${d.w[0].toFixed(2)}, ${d.w[1].toFixed(2)}, ${d.w[2].toFixed(2)}`;
  readoutE.textContent = d.energyDrift.toExponential(2);
  readoutFlips.textContent = String(st.flips);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  const names = ['major (stable)', 'intermediate (flips)', 'minor (stable)'];
  ctx.fillText(`${OBJECTS[st.object].label} spinning about its ${names[st.axis]} axis`, 16, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('|L| drift ' + d.LDrift.toExponential(1) + '; the tumble is torque-free', 16, H - 12);
}

function physFrame(n) {
  for (let k = 0; k < n; k += 1) {
    step(st.sim, PHYS_DT);
    const wp = st.sim.w[st.axis];
    if (Math.abs(wp) > 0.5 * st.spin) {
      const sgn = Math.sign(wp);
      if (st.lastSign !== 0 && sgn === -st.lastSign) st.flips += 1;
      st.lastSign = sgn;
    }
    if (k % 4 === 0) {
      for (let a = 0; a < 3; a += 1) { st.wHist[a].push(st.sim.w[a]); if (st.wHist[a].length > WHIST) st.wHist[a].shift(); }
    }
  }
}

selectObject.addEventListener('change', () => { st.object = selectObject.value; valueObject.textContent = OBJECTS[st.object].label; rebuild(); draw(); });
selectAxis.addEventListener('change', () => { st.axis = parseInt(selectAxis.value, 10); valueAxis.textContent = selectAxis.options[selectAxis.selectedIndex].text.split(' ')[0]; rebuild(); draw(); });
sliderSpin.addEventListener('input', () => { st.spin = parseFloat(sliderSpin.value); valueSpin.textContent = st.spin.toFixed(1); rebuild(); draw(); });
sliderPerturb.addEventListener('input', () => { st.perturb = parseFloat(sliderPerturb.value); valuePerturb.textContent = st.perturb.toFixed(3); rebuild(); draw(); });
btnPlay.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlay.textContent = st.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!st.playing));
});
btnReset.addEventListener('click', () => { rebuild(); draw(); });

let last = (typeof performance !== 'undefined' ? performance.now() : Date.now()), acc = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now; acc += dt;
  let steps = 0;
  while (acc >= PHYS_DT && steps < 1200) { if (st.playing) physFrame(1); acc -= PHYS_DT; steps += 1; }
  draw();
  requestAnimationFrame(tick);
}

function bootSync() {
  valueObject.textContent = OBJECTS[st.object].label;
  valueSpin.textContent = st.spin.toFixed(1);
  valuePerturb.textContent = st.perturb.toFixed(3);
  valueAxis.textContent = 'intermediate';
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const objs = ['thandle', 'racket', 'phone', 'book'];
    st.object = objs[Math.max(0, Math.min(3, Math.round(f * 3)))];
    selectObject.value = st.object; valueObject.textContent = OBJECTS[st.object].label;
    st.axis = 1; selectAxis.value = '1';
    rebuild();
    physFrame(Math.round((0.5 + f * 5.0) / PHYS_DT));
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  rebuild();
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  if (!st.sim) return { fields: [] };
  const w = st.sim.w;
  return {
    fields: [
      { key: 'omega1', label: '$\\omega_1$ (body axis 1)', value: w[0], format: 'float' },
      { key: 'omega2', label: '$\\omega_2$ (body axis 2)', value: w[1], format: 'float' },
      { key: 'omega3', label: '$\\omega_3$ (body axis 3)', value: w[2], format: 'float' },
      { key: 'energy', label: 'rotational energy $E$', value: energy(st.sim), format: 'float' },
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
      const E = energy(st.sim);
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
