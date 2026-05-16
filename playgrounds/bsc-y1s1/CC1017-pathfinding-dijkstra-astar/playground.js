// playground.js
// Side-by-side Dijkstra vs A* on the same city grid. Settled cells are
// painted in reveal order (viridis); when a search reaches the goal
// its optimal path flashes. A* expands a tight beam, Dijkstra floods.
// sim.js holds the grid and both searches.

import { DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { viridis } from '../../../shared/js/render/colormaps.js';
import { buildCity, dijkstra, astar, WALL } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutD = document.getElementById('readout-d');
const readoutA = document.getElementById('readout-a');
const readoutCost = document.getElementById('readout-cost');
const sliderSpeed = document.getElementById('slider-speed');
const sliderSeed = document.getElementById('slider-seed');
const valueSpeed = document.getElementById('value-speed');
const valueSeed = document.getElementById('value-seed');
const btnRestart = document.getElementById('btn-restart');
const btnPlay = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const COLS = 40, ROWS = 26;
const PAD = 18, GAP = 24;
const PANEL_W = (W - 2 * PAD - GAP) / 2;
const TOP = 30;
const CS = Math.min(PANEL_W / COLS, (H - TOP - 20) / ROWS);

const st = { seed: 7, speed: 8, k: 0, g: null, dj: null, as: null, playing: !DETERMINISTIC };

function rebuild() {
  st.g = buildCity(COLS, ROWS, st.seed);
  st.dj = dijkstra(st.g);
  st.as = astar(st.g);
  st.k = 0;
}

function drawPanel(x0, title, res, color) {
  const g = st.g;
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(title, x0, TOP - 12);
  const revealed = Math.min(res.order.length, st.k);
  // settle-order rank for coloring
  const rank = new Int32Array(g.cols * g.rows).fill(-1);
  for (let i = 0; i < revealed; i += 1) rank[res.order[i]] = i;
  for (let y = 0; y < g.rows; y += 1) {
    for (let x = 0; x < g.cols; x += 1) {
      const idx = y * g.cols + x;
      const px = x0 + x * CS, py = TOP + y * CS;
      let col;
      if (g.cost[idx] === WALL) col = '#161922';
      else if (rank[idx] >= 0) {
        const t = rank[idx] / Math.max(1, res.order.length);
        const c = viridis(0.08 + 0.9 * t);
        col = `rgb(${c.r},${c.g},${c.b})`;
      } else col = g.cost[idx] > 1 ? '#241f15' : '#0c0d11';
      ctx.fillStyle = col;
      ctx.fillRect(px, py, CS - 0.5, CS - 0.5);
    }
  }
  // path flash once the goal is settled within the revealed prefix
  const goalRank = res.order.indexOf(g.goal);
  if (goalRank >= 0 && revealed > goalRank && res.path.length > 1) {
    const fl = 0.5 + 0.5 * Math.sin(st.k * 0.25);
    ctx.strokeStyle = `rgba(255,209,102,${(0.55 + 0.45 * fl).toFixed(2)})`;
    ctx.lineWidth = Math.max(2, CS * 0.4);
    ctx.beginPath();
    res.path.forEach((idx, i) => {
      const cx = x0 + (idx % g.cols) * CS + CS / 2, cy = TOP + ((idx / g.cols) | 0) * CS + CS / 2;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
  }
  // start (green) + goal (red)
  for (const [node, c] of [[g.start, '#06d6a0'], [g.goal, '#ef476f']]) {
    const cx = x0 + (node % g.cols) * CS + CS / 2, cy = TOP + ((node / g.cols) | 0) * CS + CS / 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, CS * 0.45, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = color; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`${Math.min(revealed, res.expanded)} cells settled`, x0, TOP + ROWS * CS + 14);
  return revealed;
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const rd = drawPanel(PAD, 'Dijkstra (uniform-cost flood)', st.dj, '#5bc0eb');
  const ra = drawPanel(PAD + PANEL_W + GAP, 'A* (Manhattan heuristic)', st.as, '#f4a261');
  readoutD.textContent = String(Math.min(rd, st.dj.expanded));
  readoutA.textContent = String(Math.min(ra, st.as.expanded));
  readoutCost.textContent = Number.isFinite(st.dj.cost) ? st.dj.cost.toFixed(0) : 'inf';
}

sliderSpeed.addEventListener('input', () => { st.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(st.speed); });
sliderSeed.addEventListener('input', () => { st.seed = parseInt(sliderSeed.value, 10); valueSeed.textContent = String(st.seed); rebuild(); });
btnRestart.addEventListener('click', () => { st.k = 0; });
btnPlay.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlay.textContent = st.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!st.playing));
});

function tick() {
  if (st.playing) {
    const maxLen = Math.max(st.dj.order.length, st.as.order.length);
    st.k = Math.min(maxLen + 40, st.k + st.speed);     // +40 so the path flashes a moment
    if (st.k >= maxLen + 40) st.k = 0;                  // loop the demo
    render();
  }
  requestAnimationFrame(tick);
}

function bootSync() {
  valueSpeed.textContent = String(st.speed);
  valueSeed.textContent = String(st.seed);
  rebuild();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const maxLen = Math.max(st.dj.order.length, st.as.order.length);
    st.k = Math.round(f * (maxLen + 40));
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
