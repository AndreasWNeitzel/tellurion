// Bernoulli / Venturi: steady incompressible flow through a
// variable-area pipe. Closed-form continuity (Q = A v) and Bernoulli
// (p + 1/2 rho v^2 = const), rendered in Canvas2D: the pipe with its
// constriction, tracer particles that speed up through the throat,
// piezometer pressure columns that dip where the flow is fast, and a
// thin-airfoil lift cartoon driven by the same principle. The physics
// is shared/sim.js (gate-tested); this only draws it. Deterministic.
import { pipeArea, velocity, pressure, diagnostics, airfoilLift } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rB = document.getElementById('readout-bern');
const rF = document.getElementById('readout-flux');
const rVt = document.getElementById('readout-vthroat');
const rPt = document.getElementById('readout-pthroat');
const sRatio = document.getElementById('slider-ratio'), vRatio = document.getElementById('value-ratio');
const sQ = document.getElementById('slider-q'), vQ = document.getElementById('value-q');
const sRho = document.getElementById('slider-rho'), vRho = document.getElementById('value-rho');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const PT = 2.0;                                      // total (stagnation) pressure, arbitrary units
const st = { ratio: 0.4, Q: 0.7, rho: 1.2, running: !prefersReducedMotion(), t: 0 };

const PIPE_X0 = 70, PIPE_X1 = W - 70, PIPE_CY = Math.round(H * 0.56), PIPE_HALF = 64;
const COL_MAXH = (PIPE_CY - PIPE_HALF) - 104;        // tallest column stays clear of the readout panel
const NPART = 260;
const parts = [];
function seedParts() {
  parts.length = 0;
  for (let i = 0; i < NPART; i += 1) {
    parts.push({ x: Math.random(), yo: (Math.random() * 2 - 1) * 0.82 });
  }
}
// deterministic seed for capture (no RNG dependence on Math.random)
function seedPartsDet() {
  parts.length = 0;
  for (let i = 0; i < NPART; i += 1) {
    parts.push({ x: (i / NPART), yo: (((i * 53) % 41) / 20 - 1) * 0.82 });
  }
}

function halfWidth(x) { return PIPE_HALF * pipeArea(x, st.ratio); }

function drawPipe() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  // pipe walls
  ctx.beginPath();
  for (let p = 0; p <= 200; p += 1) {
    const x = p / 200, px = PIPE_X0 + x * (PIPE_X1 - PIPE_X0), hy = halfWidth(x);
    if (p === 0) ctx.moveTo(px, PIPE_CY - hy); else ctx.lineTo(px, PIPE_CY - hy);
  }
  for (let p = 200; p >= 0; p -= 1) {
    const x = p / 200, px = PIPE_X0 + x * (PIPE_X1 - PIPE_X0), hy = halfWidth(x);
    ctx.lineTo(px, PIPE_CY + hy);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(40,90,150,0.18)'; ctx.fill();
  ctx.strokeStyle = '#5a7da0'; ctx.lineWidth = 2; ctx.stroke();
}

function drawColumns() {
  // Piezometer tubes: column height proportional to static pressure p.
  const N = 9;
  for (let i = 0; i < N; i += 1) {
    const x = (i + 0.5) / N;
    const A = pipeArea(x, st.ratio);
    const v = velocity(st.Q, A);
    const p = pressure(PT, st.rho, v);
    const px = PIPE_X0 + x * (PIPE_X1 - PIPE_X0);
    const top = PIPE_CY - halfWidth(x);
    const colH = Math.max(4, Math.min(COL_MAXH, COL_MAXH * p / PT)); // clamped to the headroom
    ctx.fillStyle = 'rgba(120,180,255,0.16)';
    ctx.fillRect(px - 6, top - colH, 12, colH);
    ctx.strokeStyle = '#7fb2ff'; ctx.lineWidth = 1; ctx.strokeRect(px - 6, top - colH, 12, colH);
    ctx.fillStyle = '#bcd6ff'; ctx.fillRect(px - 6, top - colH, 12, 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText('piezometer columns: height ~ static pressure (lowest at the throat)', PIPE_X0, H - 14);
}

function drawParticles(dt) {
  ctx.fillStyle = '#ffd479';
  for (const pt of parts) {
    const A = pipeArea(pt.x, st.ratio);
    const v = velocity(st.Q, A);
    if (st.running) pt.x += v * dt * 0.16;
    if (pt.x > 1) { pt.x -= 1; }
    const px = PIPE_X0 + pt.x * (PIPE_X1 - PIPE_X0);
    const py = PIPE_CY + pt.yo * halfWidth(pt.x);
    const sp = Math.min(1, v / 4);
    ctx.globalAlpha = 0.5 + 0.5 * sp;
    ctx.fillRect(px, py, 2 + 2 * sp, 2);
  }
  ctx.globalAlpha = 1;
}

function drawAirfoil() {
  // Same Bernoulli principle: faster over the curved top -> lower
  // pressure -> upward lift. Cartoon inset, bottom-right.
  const cx = Math.round(W * 0.5), cy = PIPE_CY + PIPE_HALF + 82, ch = 92;
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px monospace';
  ctx.fillText('same Bernoulli principle: airfoil lift', cx - 100, cy - 50);
  ctx.beginPath();
  ctx.moveTo(cx - ch / 2, cy);
  ctx.quadraticCurveTo(cx, cy - 30, cx + ch / 2, cy);
  ctx.quadraticCurveTo(cx, cy + 10, cx - ch / 2, cy);
  ctx.closePath();
  ctx.fillStyle = '#cdd6e0'; ctx.fill();
  // streamlines: denser/faster over the top
  ctx.strokeStyle = 'rgba(127,210,255,0.7)'; ctx.lineWidth = 1;
  for (let k = -2; k <= 3; k += 1) {
    const off = k * 14;
    ctx.beginPath();
    ctx.moveTo(cx - ch, cy + off);
    const bulge = off < 0 ? -18 : 6;
    ctx.quadraticCurveTo(cx, cy + off + bulge, cx + ch, cy + off);
    ctx.stroke();
  }
  const lift = airfoilLift(st.rho, velocity(st.Q, 1), 1.35, 1);
  const La = Math.min(70, 14 + lift * 26);
  ctx.strokeStyle = '#ff9a5a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy - 4 - La); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 4 - La); ctx.lineTo(cx - 5, cy - 4 - La + 9); ctx.lineTo(cx + 5, cy - 4 - La + 9); ctx.closePath();
  ctx.fillStyle = '#ff9a5a'; ctx.fill();
  ctx.fillStyle = '#ffb27a'; ctx.fillText('L', cx + 8, cy - 4 - La + 6);
}

function readout() {
  const d = diagnostics(PT, st.rho, st.Q, st.ratio, 200);
  rB.textContent = d.bernoulliSpread.toExponential(1);
  rF.textContent = d.fluxSpread.toExponential(1);
  const vt = velocity(st.Q, pipeArea(0.5, st.ratio));
  rVt.textContent = vt.toFixed(3);
  rPt.textContent = pressure(PT, st.rho, vt).toFixed(3);
}

function frame(dt) {
  drawPipe();
  drawColumns();
  drawParticles(dt);
  drawAirfoil();
  readout();
}

function tick() {
  st.t += 1 / 60;
  frame(st.running ? 1 / 60 : 0);
  requestAnimationFrame(tick);
}

function syncLabels() {
  vRatio.textContent = st.ratio.toFixed(2);
  vQ.textContent = st.Q.toFixed(2);
  vRho.textContent = st.rho.toFixed(1);
}
sRatio.addEventListener('input', () => { st.ratio = parseFloat(sRatio.value) / 100; syncLabels(); });
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value) / 100; syncLabels(); });
sRho.addEventListener('input', () => { st.rho = parseFloat(sRho.value) / 10; syncLabels(); });
bR.addEventListener('click', () => {
  st.ratio = 0.4; st.Q = 0.7; st.rho = 1.2; st.running = true;
  sRatio.value = '40'; sQ.value = '70'; sRho.value = '12';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
  seedParts(); syncLabels();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { throat_ratio: st.ratio.toFixed(3), flow_rate: st.Q.toFixed(3), density: st.rho.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.throat_ratio) { st.ratio = parseFloat(s.throat_ratio); sRatio.value = String(Math.round(st.ratio * 100)); }
  if (s.flow_rate) { st.Q = parseFloat(s.flow_rate); sQ.value = String(Math.round(st.Q * 100)); }
  if (s.density) { st.rho = parseFloat(s.density); sRho.value = String(Math.round(st.rho * 10)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    seedPartsDet();
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    for (let n = 0; n < Math.round(f * 240); n += 1) {
      for (const pt of parts) { const v = velocity(st.Q, pipeArea(pt.x, st.ratio)); pt.x += v * (1 / 60) * 0.16; if (pt.x > 1) pt.x -= 1; }
    }
    frame(0);
  } else {
    seedParts(); frame(0);
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
