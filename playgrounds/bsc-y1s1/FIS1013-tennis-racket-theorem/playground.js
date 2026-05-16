// playground.js
// 3D free rigid body (a flat slab) tumbling under Euler's equations,
// hand-projected in Canvas2D. Spin about the intermediate axis and it
// flips periodically (Dzhanibekov); the major/minor axes are stable.
// A decaying trace of one corner makes the flip unmistakable. sim.js
// carries the dynamics (RK4 + quaternion).

import {
  createRacket, step, rotationMatrix, diagnostics,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutW = document.getElementById('readout-w');
const readoutE = document.getElementById('readout-e');
const readoutFlips = document.getElementById('readout-flips');
const selectAxis = document.getElementById('select-axis');
const sliderSpin = document.getElementById('slider-spin');
const sliderPerturb = document.getElementById('slider-perturb');
const valueAxis = document.getElementById('value-axis');
const valueSpin = document.getElementById('value-spin');
const valuePerturb = document.getElementById('value-perturb');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const W = canvas.width, H = canvas.height;
const PHYS_DT = 1 / 480;
const CX = W / 2, CY = H / 2, SC = 150;
const AZ = 0.6, EL = 0.42;

const st = {
  axis: 1, spin: 6, perturb: 0.04, playing: !DETERMINISTIC,
  sim: null, trace: [], flips: 0, lastSign: 0,
};

// Flat slab half-dimensions along body axes (x thin, z mid, y long):
// distinct so the three principal axes read differently in 3D.
const HX = 0.16, HY = 0.95, HZ = 0.6;
const VERTS = [];
for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) VERTS.push([sx * HX, sy * HY, sz * HZ]);
const FACES = [
  { idx: [0, 1, 3, 2], c: '#1b6ca8' }, { idx: [4, 5, 7, 6], c: '#2d83c4' },
  { idx: [0, 1, 5, 4], c: '#c13b27' }, { idx: [2, 3, 7, 6], c: '#d6593f' },
  { idx: [0, 2, 6, 4], c: '#e0a93d' }, { idx: [1, 3, 7, 5], c: '#f0c25a' },
];

function rebuild() {
  st.sim = createRacket({ I: [1, 2, 3], spin: st.spin, axis: st.axis, perturb: st.perturb });
  st.trace = []; st.flips = 0; st.lastSign = Math.sign(st.sim.w[st.axis]) || 1;
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

function draw() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const R = rotationMatrix(st.sim);
  const wv = VERTS.map((v) => applyR(R, v));
  const pv = wv.map(project);

  // corner trace (vertex 0), decaying.
  st.trace.push([...wv[0]]);
  if (st.trace.length > 240) st.trace.shift();
  for (let i = 1; i < st.trace.length; i += 1) {
    const a = project(st.trace[i - 1]), b = project(st.trace[i]);
    ctx.strokeStyle = `rgba(120,200,170,${(0.05 + 0.35 * i / st.trace.length).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
  }

  // painter's order
  const order = FACES.map((f, i) => {
    const dz = f.idx.reduce((s, k) => s + pv[k].d, 0) / 4;
    return { i, dz };
  }).sort((a, b) => a.dz - b.dz);
  for (const { i } of order) {
    const f = FACES[i];
    ctx.beginPath();
    f.idx.forEach((k, j) => (j ? ctx.lineTo(pv[k].sx, pv[k].sy) : ctx.moveTo(pv[k].sx, pv[k].sy)));
    ctx.closePath();
    ctx.fillStyle = f.c; ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4; ctx.stroke();
  }
  // mark vertex 0
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pv[0].sx, pv[0].sy, 4, 0, 2 * Math.PI); ctx.fill();

  const d = diagnostics(st.sim);
  readoutW.textContent = `${d.w[0].toFixed(2)}, ${d.w[1].toFixed(2)}, ${d.w[2].toFixed(2)}`;
  readoutE.textContent = d.energyDrift.toExponential(2);
  readoutFlips.textContent = String(st.flips);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  const names = ['major (stable)', 'intermediate (flips)', 'minor (stable)'];
  ctx.fillText(`spin axis: ${names[st.axis]}   |L| drift ${d.LDrift.toExponential(1)}`, 16, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('energy and |L| are conserved exactly; the flip is free', 16, H - 14);
}

function physFrame(n) {
  for (let k = 0; k < n; k += 1) {
    step(st.sim, PHYS_DT);
    // Count a flip when the primary spin component, having reached a
    // confident magnitude, reverses sign relative to the last confident
    // sign.
    const wp = st.sim.w[st.axis];
    if (Math.abs(wp) > 0.5 * st.spin) {
      const sgn = Math.sign(wp);
      if (st.lastSign !== 0 && sgn === -st.lastSign) st.flips += 1;
      st.lastSign = sgn;
    }
  }
}

selectAxis.addEventListener('change', () => { st.axis = parseInt(selectAxis.value, 10); valueAxis.textContent = selectAxis.options[selectAxis.selectedIndex].text.split(' ')[0]; rebuild(); });
sliderSpin.addEventListener('input', () => { st.spin = parseFloat(sliderSpin.value); valueSpin.textContent = st.spin.toFixed(1); rebuild(); });
sliderPerturb.addEventListener('input', () => { st.perturb = parseFloat(sliderPerturb.value); valuePerturb.textContent = st.perturb.toFixed(3); rebuild(); });
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
  valueSpin.textContent = st.spin.toFixed(1);
  valuePerturb.textContent = st.perturb.toFixed(3);
  valueAxis.textContent = 'intermediate';
  rebuild();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.axis = 1; selectAxis.value = '1';
    rebuild();
    const steps = Math.round((0.4 + f * 5.0) / PHYS_DT);   // walk through several flips
    physFrame(steps);
    draw();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
