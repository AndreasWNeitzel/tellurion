// playground.js
// Side-by-side Dijkstra vs A* on the same city grid. Settled cells are
// painted in reveal order (viridis). When both searches reach the goal
// a single bright bolt races down the optimal path, then dissipates to
// a steady line; the demo then rests on the solved map for a few
// seconds before regenerating. A* drives a tight beam, Dijkstra floods.
// sim.js holds the grid and both searches.

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
// Higher resolution: ~3.3x the cells of the old 40x26 map, so the
// flood genuinely struggles and the A*-vs-Dijkstra contrast is stark.
const COLS = 72, ROWS = 48;
const PAD = 18, GAP = 24;
const PANEL_W = (W - 2 * PAD - GAP) / 2;
const TOP = 30;
const CS = Math.min(PANEL_W / COLS, (H - TOP - 20) / ROWS);

// One dramatic bolt, not a pulsation: a white-hot head sweeps the path
// (FLASH_SWEEP frames), then the whole path blazes and the glow decays
// (FLASH_GLOW frames) to a steady line; REST holds the solved map.
const FLASH_SWEEP = 26;
const FLASH_GLOW = 32;
const FLASH_DUR = FLASH_SWEEP + FLASH_GLOW;
const REST_DUR = 220;

const st = {
  seed: 7, speed: 6, k: 0, g: null, dj: null, as: null,
  phase: 'search', flashT: 0, restT: 0, playing: !DETERMINISTIC,
};

function rebuild() {
  st.g = buildCity(COLS, ROWS, st.seed);
  st.dj = dijkstra(st.g);
  st.as = astar(st.g);
  st.k = 0; st.phase = 'search'; st.flashT = 0; st.restT = 0;
  // Fire the bolt as soon as the FIRST search reaches the goal, not
  // when both finish. A* almost always settles its goal first.
  const gD = st.dj.order.indexOf(st.g.goal);
  const gA = st.as.order.indexOf(st.g.goal);
  st.firstGoal = Math.min(gD < 0 ? Infinity : gD, gA < 0 ? Infinity : gA) + 1;
  st.firstName = (gA >= 0 && (gD < 0 || gA <= gD)) ? 'A*' : 'Dijkstra';
}
const searchEnd = () => st.firstGoal;

function pathPx(x0, res) {
  const g = st.g;
  return res.path.map((idx) => [
    x0 + (idx % g.cols) * CS + CS / 2,
    TOP + ((idx / g.cols) | 0) * CS + CS / 2,
  ]);
}

function strokePath(pts, lo, hi, width, style) {
  if (hi <= lo) return;
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = lo; i <= hi && i < pts.length; i += 1) {
    if (i === lo) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.stroke();
}

function drawBolt(pts) {
  if (pts.length < 2) return;
  const P = pts.length - 1;
  if (st.phase === 'flash' && st.flashT < FLASH_SWEEP) {
    // Attack: a white-hot head racing from start to goal.
    const head = Math.max(1, Math.round((st.flashT / FLASH_SWEEP) * P));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    strokePath(pts, 0, head, Math.max(3, CS * 0.9), 'rgba(255,170,40,0.5)');
    strokePath(pts, 0, head, Math.max(2, CS * 0.5), 'rgba(255,238,200,0.95)');
    const [hx, hy] = pts[Math.min(head, P)];
    const rg = ctx.createRadialGradient(hx, hy, 0, hx, hy, CS * 3.2);
    rg.addColorStop(0, 'rgba(255,255,255,0.95)');
    rg.addColorStop(0.4, 'rgba(255,209,102,0.6)');
    rg.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(hx, hy, CS * 3.2, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();
  } else {
    // Decay: whole path blazes, additive glow fades to a steady line.
    const since = st.phase === 'flash' ? st.flashT - FLASH_SWEEP : FLASH_GLOW;
    const I = Math.exp(-since / 11);
    strokePath(pts, 0, P, Math.max(2, CS * 0.42), 'rgba(255,196,84,0.92)');
    if (I > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      strokePath(pts, 0, P, Math.max(3, CS * 0.95), `rgba(255,180,60,${(0.45 * I).toFixed(3)})`);
      strokePath(pts, 0, P, Math.max(2, CS * 0.5), `rgba(255,245,210,${(0.9 * I).toFixed(3)})`);
      ctx.restore();
    }
  }
}

function drawPanel(x0, title, res, color) {
  const g = st.g;
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(title, x0, TOP - 12);
  const revealed = st.phase === 'search' ? Math.min(res.order.length, st.k) : res.order.length;
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
      ctx.fillRect(px, py, CS - 0.4, CS - 0.4);
    }
  }
  const goalRank = res.order.indexOf(g.goal);
  const reached = goalRank >= 0 && revealed > goalRank && res.path.length > 1;
  if (st.phase === 'search' && reached) {
    strokePath(pathPx(x0, res), 0, res.path.length - 1, Math.max(2, CS * 0.4), 'rgba(255,209,102,0.7)');
  } else if (st.phase !== 'search' && res.path.length > 1) {
    drawBolt(pathPx(x0, res));
  }
  for (const [node, c] of [[g.start, '#06d6a0'], [g.goal, '#ef476f']]) {
    const cx = x0 + (node % g.cols) * CS + CS / 2, cy = TOP + ((node / g.cols) | 0) * CS + CS / 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, CS * 0.7, 0, 2 * Math.PI); ctx.fill();
  }
  return revealed;
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const rd = drawPanel(PAD, 'Dijkstra (uniform-cost flood)', st.dj, '#5bc0eb');
  const ra = drawPanel(PAD + PANEL_W + GAP, 'A* (Manhattan heuristic)', st.as, '#f4a261');
  readoutD.textContent = String(Math.min(rd, st.dj.expanded));
  readoutA.textContent = String(Math.min(ra, st.as.expanded));
  const costTxt = Number.isFinite(st.dj.cost) ? st.dj.cost.toFixed(0) : 'inf';
  const pathLen = st.dj.path.length;
  readoutCost.textContent = `${costTxt}  (path ${pathLen} cells)`;
  // Bottom info strip (dark backdrop so it stays legible over the grid).
  ctx.fillStyle = 'rgba(6,7,11,0.82)'; ctx.fillRect(0, H - 34, W, 34);
  ctx.textAlign = 'center';
  const dSet = st.dj.expanded, aSet = st.as.expanded;
  if (st.phase === 'search') {
    const dLive = Math.min(rd, dSet), aLive = Math.min(ra, aSet);
    ctx.fillStyle = 'rgba(160,200,255,0.85)'; ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(`Dijkstra ${dLive} settled    A* ${aLive} settled    (A* drives a beam, Dijkstra floods)`, W / 2, H - 12);
  } else {
    // Teaching point: both return the SAME optimal path; A* just
    // settles far fewer nodes. (Admissible heuristic, so A* is optimal,
    // and Dijkstra's path is not shorter.)
    const ratio = aSet > 0 ? (dSet / aSet).toFixed(1) : '--';
    ctx.fillStyle = 'rgba(255,209,102,0.92)'; ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(`${st.firstName} reached the goal first    same optimal path: ${pathLen} cells, cost ${costTxt}`, W / 2, H - 21);
    ctx.fillStyle = 'rgba(160,200,255,0.88)';
    ctx.fillText(`Dijkstra settled ${dSet}    A* settled ${aSet}    (${ratio}x fewer for the identical route)`, W / 2, H - 7);
    if (st.phase === 'rest') {
      const frac = 1 - st.restT / REST_DUR;
      ctx.strokeStyle = 'rgba(255,209,102,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - 90, H - 1); ctx.lineTo(W / 2 - 90 + 180 * frac, H - 1); ctx.stroke();
    }
  }
  ctx.textAlign = 'left';
}

sliderSpeed.addEventListener('input', () => { st.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(st.speed); });
sliderSeed.addEventListener('input', () => { st.seed = parseInt(sliderSeed.value, 10); valueSeed.textContent = String(st.seed); rebuild(); });
btnRestart.addEventListener('click', () => { st.k = 0; st.phase = 'search'; st.flashT = 0; st.restT = 0; });
btnPlay.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlay.textContent = st.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!st.playing));
});

function tick() {
  if (st.playing) {
    if (st.phase === 'search') {
      st.k += st.speed;
      if (st.k >= searchEnd()) { st.k = searchEnd(); st.phase = 'flash'; st.flashT = 0; }
    } else if (st.phase === 'flash') {
      st.flashT += 1;
      if (st.flashT >= FLASH_DUR) { st.phase = 'rest'; st.restT = REST_DUR; }
    } else {
      st.restT -= 1;
      if (st.restT <= 0) { st.seed = (st.seed % 40) + 1; valueSeed.textContent = String(st.seed); sliderSeed.value = String(st.seed); rebuild(); }
    }
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
    const i = Math.max(0, Math.min(4, Math.round(f * 4)));
    const end = searchEnd();
    if (i === 0) { st.phase = 'search'; st.k = Math.round(0.10 * end); }
    else if (i === 1) { st.phase = 'search'; st.k = Math.round(0.55 * end); }
    else if (i === 2) { st.phase = 'search'; st.k = end; }
    else if (i === 3) { st.phase = 'flash'; st.flashT = FLASH_SWEEP; }
    else { st.phase = 'rest'; st.restT = REST_DUR - 30; }
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
