// Quadtree N-body playground. Renders a 2D disk under gravity with the
// live quadtree overlay; the user can toggle the algorithm (Barnes-Hut
// tree vs direct O(N^2)) and the opening angle theta. See sim.js for
// the initial-condition factory and the imported shared engine.

import { makeDisk, leapfrog, accBH, accDirect, snapshotTree } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

const rN = document.getElementById('readout-n');
const rEvals = document.getElementById('readout-evals');
const rNodes = document.getElementById('readout-nodes');
const rStep = document.getElementById('readout-step');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sTh = document.getElementById('slider-theta'), vTh = document.getElementById('value-theta');
const selTree = document.getElementById('select-tree'), vTree = document.getElementById('value-tree');
const tShowTree = document.getElementById('toggle-show-tree');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const VIEW = 1.4;                            // world half-width in code units
const DT = 0.005;
const G = 1, EPS = 0.03;
const st = {
  N: 500, theta: 0.7, use_tree: true, show_tree: true,
  running: true, state: null,
};

function reseed() {
  st.state = makeDisk(st.N, { seed: 0xC0FFEE, M_core: 50 });
  // Warm one accel evaluation so leapfrog half-kick has a valid a.
  if (st.use_tree) accBH(st.state, st.theta, G, EPS);
  else accDirect(st.state, G, EPS);
}

// World-to-screen.
function w2s(wx, wy) {
  const cx = W * 0.5, cy = H * 0.5;
  const scale = Math.min(W, H) * 0.5 / VIEW;
  return [cx + wx * scale, cy + wy * scale];
}

function drawTreeNode(node, snap, level) {
  if (snap.nBody[node] === -2) return;
  // Draw this cell's boundary.
  const half = snap.nHalf[node];
  const hx = snap.nHx[node], hy = snap.nHy[node];
  const [x0, y0] = w2s(hx - half, hy - half);
  const [x1, y1] = w2s(hx + half, hy + half);
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // Recurse if internal.
  if (snap.nBody[node] === -1) {
    for (let c = 0; c < snap.QUAD; c += 1) {
      const ch = snap.nChild[node * snap.QUAD + c];
      if (ch >= 0) drawTreeNode(ch, snap, level + 1);
    }
  }
}

function render() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);

  // Faint axes / world bounds.
  const [bx0, by0] = w2s(-VIEW, -VIEW);
  const [bx1, by1] = w2s(VIEW, VIEW);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);

  // Quadtree overlay.
  if (st.show_tree && st.use_tree) {
    const snap = snapshotTree();
    ctx.strokeStyle = 'rgba(255, 170, 100, 0.35)';
    ctx.lineWidth = 1.0;
    drawTreeNode(0, snap, 0);
  }

  // Particles.
  const s = st.state;
  for (let i = 0; i < s.N; i += 1) {
    const [sx, sy] = w2s(s.x[2 * i], s.x[2 * i + 1]);
    if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
    if (i === 0) {
      // central heavy mass
      ctx.fillStyle = 'rgba(255, 200, 100, 0.95)';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 2 * Math.PI); ctx.fill();
      // glow
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22);
      g.addColorStop(0, 'rgba(255,200,100,0.4)');
      g.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sx, sy, 22, 0, 2 * Math.PI); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(180, 220, 255, 0.85)';
      ctx.fillRect(sx - 0.7, sy - 0.7, 1.4, 1.4);
    }
  }

  // Top-left readout panel.
  ctx.fillStyle = 'rgba(6,6,8,0.65)';
  ctx.fillRect(8, 8, 280, 80);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`N             ${s.N}`, 16, 26);
  ctx.fillText(`algorithm     ${st.use_tree ? 'Barnes-Hut' : 'direct O(N^2)'}`, 16, 42);
  ctx.fillText(`evals/step    ${s.evals.toLocaleString()}`, 16, 58);
  if (st.use_tree) ctx.fillText(`opening θ     ${st.theta.toFixed(2)}`, 16, 74);
  else ctx.fillText(`direct pairs  ${(s.N * (s.N - 1)).toLocaleString()}`, 16, 74);

  // Bottom: comparison strip.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  const speedup = st.use_tree && s.evals > 0 ? (s.N * (s.N - 1)) / s.evals : 1;
  ctx.fillText(`vs direct: ${speedup.toFixed(1)}× fewer pair evaluations`, W / 2, H - 12);

  rN.textContent = String(s.N);
  rEvals.textContent = s.evals.toLocaleString();
  rNodes.textContent = String(s.nNodes);
  rStep.textContent = String(s.nSteps);
}

function tick() {
  if (st.running) {
    leapfrog(st.state, DT, { use_tree: st.use_tree, theta: st.theta, G, eps: EPS });
  }
  render();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vN.textContent = String(st.N);
  vTh.textContent = st.theta.toFixed(2);
  vTree.textContent = st.use_tree ? 'tree' : 'direct';
}

sN.addEventListener('change', () => { st.N = parseInt(sN.value, 10); reseed(); syncLabels(); render(); });
sN.addEventListener('input', () => { st.N = parseInt(sN.value, 10); syncLabels(); });
sTh.addEventListener('input', () => { st.theta = parseFloat(sTh.value); syncLabels(); });
selTree.addEventListener('change', () => { st.use_tree = selTree.value === 'tree'; syncLabels(); });
tShowTree.addEventListener('change', () => { st.show_tree = tShowTree.checked; render(); });
btnReset.addEventListener('click', () => {
  st.N = 500; st.theta = 0.7; st.use_tree = true; st.show_tree = true; st.running = true;
  sN.value = '500'; sTh.value = '0.7'; selTree.value = 'tree'; tShowTree.checked = true;
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  syncLabels(); reseed(); render();
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

function getState() {
  return { n_bodies: st.N, theta: st.theta, use_tree: st.use_tree ? 1 : 0, show_tree: st.show_tree ? 1 : 0 };
}
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.n_bodies) { st.N = parseInt(s.n_bodies, 10); sN.value = String(st.N); }
  if (s.theta) { st.theta = parseFloat(s.theta); sTh.value = String(st.theta); }
  if (s.use_tree !== undefined) { st.use_tree = String(s.use_tree) === '1'; selTree.value = st.use_tree ? 'tree' : 'direct'; }
  if (s.show_tree !== undefined) { st.show_tree = String(s.show_tree) === '1'; tShowTree.checked = st.show_tree; }
}

function bootSync() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    // Sweep simulation time across captures so the disk has visibly
    // wound up by t-100.
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    reseed();
    const steps = Math.round(40 + f * 400);
    for (let n = 0; n < steps; n += 1) leapfrog(st.state, DT, { use_tree: true, theta: 0.7, G, eps: EPS });
  } else {
    reseed();
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
