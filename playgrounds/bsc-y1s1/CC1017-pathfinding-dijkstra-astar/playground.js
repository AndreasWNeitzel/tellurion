// playground.js
// Side-by-side Dijkstra vs A* on the same city grid. Settled cells are
// painted in reveal order (viridis). When both searches reach the goal
// a single bright bolt races down the optimal path, then dissipates to
// a steady line; the demo then rests on the solved map for a few
// seconds before regenerating. A* drives a tight beam, Dijkstra floods.
// sim.js holds the grid and both searches.

import { viridis } from '../../../shared/js/render/colormaps.js';
import { buildCity, dijkstra, astarWeighted, WALL } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas } from '../../../shared/js/render/vertical-layout.js';

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
const sliderWeight = document.getElementById('slider-weight');
const valueSpeed = document.getElementById('value-speed');
const valueSeed = document.getElementById('value-seed');
const valueWeight = document.getElementById('value-weight');
const btnRestart = document.getElementById('btn-restart');
const btnPlay = document.getElementById('btn-playpause');
const btnNextMap = document.getElementById('btn-nextmap');

// Wide-short grid so each stacked panel fills the portrait width.
const COLS = 88, ROWS = 44;

// Responsive layout: two panels stacked vertically (Dijkstra top, A* bottom)
// with a shared info strip at the bottom. Recomputed on resize.
let view = { w: 760, h: 950, dpr: 1 };
let L = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  const pad = 14, gap = 14, titleH = 22, infoH = 52;
  const availW = view.w - 2 * pad;
  const panelH = (view.h - 2 * pad - infoH - gap) / 2;
  const CS = Math.min(availW / COLS, (panelH - titleH) / ROWS);
  const gridW = COLS * CS, gridH = ROWS * CS;
  const panelX = pad + (availW - gridW) / 2;
  L = {
    pad, gap, CS, gridW, gridH, panelX,
    p1GridY: pad + titleH, p1TitleY: pad + 15,
    p2GridY: pad + panelH + gap + titleH, p2TitleY: pad + panelH + gap + 15,
    infoY: view.h - infoH, infoH,
  };
}

// One dramatic bolt, not a pulsation: a white-hot head sweeps the path
// (FLASH_SWEEP frames), then the whole path blazes and the glow decays
// (FLASH_GLOW frames) to a steady line; REST holds the solved map.
const FLASH_SWEEP = 10;
const FLASH_GLOW = 32;
const FLASH_DUR = FLASH_SWEEP + FLASH_GLOW;
const REST_DUR = 300;          // 5 s hold so the result is readable

const st = {
  seed: 7, speed: 5, w: 1, k: 0, g: null, dj: null, as: null,
  phase: 'search', restT: 0, playing: !(DETERMINISTIC || prefersReducedMotion()),
};

function rebuild() {
  st.g = buildCity(COLS, ROWS, st.seed);
  st.dj = dijkstra(st.g);
  st.as = astarWeighted(st.g, st.w);
  st.k = 0; st.phase = 'search'; st.restT = 0;
  // Per-search arrival index (cells settled when each reached the
  // goal). Each panel reveals at its own pace: A* finishes early and
  // its panel sits solved while Dijkstra is still visibly flooding, so
  // the effort asymmetry is on screen, not hidden by a joint finish.
  const gD = st.dj.order.indexOf(st.g.goal);
  const gA = st.as.order.indexOf(st.g.goal);
  st.djGoal = (gD < 0 ? st.dj.order.length : gD) + 1;
  st.asGoal = (gA < 0 ? st.as.order.length : gA) + 1;
  st.firstName = st.asGoal <= st.djGoal ? 'A*' : 'Dijkstra';
  st.fullEnd = Math.max(st.djGoal, st.asGoal);
  // Per-panel bolt timers: -1 until that search reaches its goal, then
  // counts up through FLASH_DUR (sweep then decay to a steady line).
  st.djFlashT = -1; st.asFlashT = -1;
}

function pathPx(x0, y0, res) {
  const g = st.g;
  return res.path.map((idx) => [
    x0 + (idx % g.cols) * L.CS + L.CS / 2,
    y0 + ((idx / g.cols) | 0) * L.CS + L.CS / 2,
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

// Each panel owns its bolt, driven by ft = frames since THAT search
// reached its goal (ft < 0: not yet; 0..SWEEP: head races the path;
// SWEEP..DUR: glow decays; >= DUR: steady line). So A* flashes the
// instant it finishes while Dijkstra is still flooding, and Dijkstra
// flashes later when it finishes; the two are never coupled.
function drawBolt(pts, ft) {
  if (pts.length < 2 || ft < 0) return;
  const CS = L.CS;
  const P = pts.length - 1;
  if (ft < FLASH_SWEEP) {
    const head = Math.max(1, Math.round((ft / FLASH_SWEEP) * P));
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
    const I = Math.exp(-(ft - FLASH_SWEEP) / 11);
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

function drawPanel(x0, y0, title, res, ft) {
  const g = st.g, CS = L.CS;
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x0, y0 - 7);
  const reachedHere = ft >= 0;
  const revealed = reachedHere ? res.order.length : Math.min(res.order.length, st.k);
  const rank = new Int32Array(g.cols * g.rows).fill(-1);
  for (let i = 0; i < revealed; i += 1) rank[res.order[i]] = i;
  for (let y = 0; y < g.rows; y += 1) {
    for (let x = 0; x < g.cols; x += 1) {
      const idx = y * g.cols + x;
      const px = x0 + x * CS, py = y0 + y * CS;
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
  if (reachedHere && res.path.length > 1) drawBolt(pathPx(x0, y0, res), ft);
  for (const [node, c] of [[g.start, '#06d6a0'], [g.goal, '#ef476f']]) {
    const cx = x0 + (node % g.cols) * CS + CS / 2, cy = y0 + ((node / g.cols) | 0) * CS + CS / 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, CS * 0.8, 0, 2 * Math.PI); ctx.fill();
  }
  const settledHere = Math.min(revealed, res.expanded);
  const arrival = goalRank >= 0 ? goalRank + 1 : res.expanded;
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  if (reachedHere) {
    ctx.fillStyle = '#9be19b';
    ctx.fillText(`done: ${arrival} scanned -> path ${res.path.length}`, x0 + L.gridW, y0 - 7);
  } else {
    ctx.fillStyle = 'rgba(160,200,255,0.85)';
    ctx.fillText(`scanning ${settledHere}...`, x0 + L.gridW, y0 - 7);
  }
  ctx.textAlign = 'left';
  return revealed;
}

function render() {
  if (!L) relayout();
  const W = view.w, H = view.h;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const rd = drawPanel(L.panelX, L.p1GridY, 'Dijkstra (flood)', st.dj, st.djFlashT);
  const aTitle = st.w > 1 ? `A* greedy w=${st.w.toFixed(2)}` : 'A* (optimal)';
  const ra = drawPanel(L.panelX, L.p2GridY, aTitle, st.as, st.asFlashT);
  readoutD.textContent = String(Math.min(rd, st.dj.expanded));
  readoutA.textContent = String(Math.min(ra, st.as.expanded));
  const costTxt = Number.isFinite(st.dj.cost) ? st.dj.cost.toFixed(0) : 'inf';
  const pathLen = st.dj.path.length;
  readoutCost.textContent = `${costTxt}  (path ${pathLen} cells)`;
  // Bottom info strip.
  ctx.fillStyle = 'rgba(6,7,11,0.9)'; ctx.fillRect(0, L.infoY, W, L.infoH);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, L.infoY + 0.5); ctx.lineTo(W, L.infoY + 0.5); ctx.stroke();
  ctx.textAlign = 'center';
  const dSet = st.dj.expanded, aSet = st.as.expanded;
  const bothReached = st.djFlashT >= 0 && st.asFlashT >= 0;
  const r1 = L.infoY + 22, r2 = L.infoY + 40;
  if (!bothReached) {
    const dLive = Math.min(rd, dSet), aLive = Math.min(ra, aSet);
    const aDone = st.asFlashT >= 0, dDone = st.djFlashT >= 0;
    let tail = 'A* drives a beam, Dijkstra floods';
    if (aDone && !dDone) tail = 'A* solved; Dijkstra still flooding';
    else if (dDone && !aDone) tail = 'Dijkstra solved; A* still searching';
    ctx.fillStyle = 'rgba(160,200,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`Dijkstra ${dLive} scanned    A* ${aLive} scanned`, W / 2, r1);
    ctx.fillStyle = col_muted(); ctx.fillText(tail, W / 2, r2);
  } else {
    const ratio = aSet > 0 ? (dSet / aSet).toFixed(1) : '--';
    const aCost = Number.isFinite(st.as.cost) ? st.as.cost : Infinity;
    const dCost = Number.isFinite(st.dj.cost) ? st.dj.cost : Infinity;
    const suboptimal = aCost > dCost + 1e-9;
    ctx.font = fontString(canvas, 'caption', 'mono');
    if (suboptimal) {
      const over = (((aCost - dCost) / dCost) * 100).toFixed(0);
      ctx.fillStyle = 'rgba(255,140,90,0.95)';
      ctx.fillText(`greedy A* path +${over}% longer (cost ${aCost.toFixed(0)} vs ${dCost.toFixed(0)})`, W / 2, r1);
      ctx.fillStyle = 'rgba(160,200,255,0.9)';
      ctx.fillText(`but scanned ${aSet} vs ${dSet} cells (${ratio}x less): speed for optimality`, W / 2, r2);
    } else {
      ctx.fillStyle = 'rgba(255,209,102,0.92)';
      ctx.fillText(`Same shortest path: ${pathLen} cells, cost ${costTxt}`, W / 2, r1);
      ctx.fillStyle = 'rgba(160,200,255,0.9)';
      ctx.fillText(`A* scanned ${aSet} cells; Dijkstra ${dSet} (${ratio}x more work)`, W / 2, r2);
    }
    if (st.phase === 'rest') {
      const frac = 1 - st.restT / REST_DUR;
      ctx.strokeStyle = 'rgba(255,209,102,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - 90, H - 1); ctx.lineTo(W / 2 - 90 + 180 * frac, H - 1); ctx.stroke();
    }
  }
  ctx.textAlign = 'left';
}
function col_muted() { return 'rgba(255,255,255,0.5)'; }

sliderSpeed.addEventListener('input', () => { st.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(st.speed); });
sliderSeed.addEventListener('input', () => { st.seed = parseInt(sliderSeed.value, 10); valueSeed.textContent = String(st.seed); rebuild(); });
sliderWeight.addEventListener('input', () => { st.w = parseFloat(sliderWeight.value); valueWeight.textContent = st.w.toFixed(2); rebuild(); });
btnRestart.addEventListener('click', () => { st.k = 0; st.phase = 'search'; st.djFlashT = -1; st.asFlashT = -1; st.restT = 0; });
btnPlay.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlay.textContent = st.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!st.playing));
});
btnNextMap.addEventListener('click', nextMap);

function advanceFlash(key, goal) {
  if (st.k > goal && st[key] < 0) st[key] = 0;
  else if (st[key] >= 0 && st[key] < FLASH_DUR) st[key] += 1;
}
function nextMap() {
  st.seed = (st.seed % 40) + 1;
  valueSeed.textContent = String(st.seed);
  sliderSeed.value = String(st.seed);
  rebuild();
}
function tick() {
  if (st.playing) {
    if (st.phase === 'search') {
      st.k += st.speed;
      // Each panel's bolt fires the instant THAT search reaches its
      // own goal, independently: A* flashes while Dijkstra is still
      // flooding, then Dijkstra flashes when it finishes.
      advanceFlash('djFlashT', st.djGoal);
      advanceFlash('asFlashT', st.asGoal);
      if (st.djFlashT >= FLASH_DUR && st.asFlashT >= FLASH_DUR) { st.phase = 'rest'; st.restT = REST_DUR; }
    } else {
      st.restT -= 1;
      if (st.restT <= 0) nextMap();
    }
    render();
  }
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
  valueSpeed.textContent = String(st.speed);
  valueSeed.textContent = String(st.seed);
  // The reference frames showcase the headline feature: a greedy A*
  // (w = 2) returning a suboptimal path far faster than Dijkstra's
  // exhaustive optimum. The live default stays w = 1 (classic optimal).
  if (CAPTURE_NAME) { st.w = 2; sliderWeight.value = '2'; }
  valueWeight.textContent = st.w.toFixed(2);
  rebuild();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const i = Math.max(0, Math.min(4, Math.round(f * 4)));
    const a = st.asGoal, d = st.djGoal;
    if (i === 0) {                                  // both still flooding
      st.phase = 'search'; st.k = Math.round(0.35 * Math.min(a, d));
    } else if (i === 1) {                           // A* bolt; Dijkstra floods
      st.phase = 'search'; st.k = a + 4; st.asFlashT = FLASH_SWEEP; st.djFlashT = -1;
    } else if (i === 2) {                           // A* solved & idle; Dijkstra floods
      st.phase = 'search'; st.k = Math.round((a + d) / 2); st.asFlashT = FLASH_DUR; st.djFlashT = -1;
    } else if (i === 3) {                           // Dijkstra bolt; A* steady
      st.phase = 'search'; st.k = d + 4; st.djFlashT = FLASH_SWEEP; st.asFlashT = FLASH_DUR;
    } else {                                        // rest, both steady
      st.phase = 'rest'; st.restT = REST_DUR - 40; st.k = st.fullEnd; st.djFlashT = FLASH_DUR; st.asFlashT = FLASH_DUR;
    }
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const dCost = Number.isFinite(st.dj.cost) ? st.dj.cost : 0;
  const aCost = Number.isFinite(st.as.cost) ? st.as.cost : 0;
  return {
    fields: [
      { key: 'weight', label: 'A* heuristic weight', value: st.w, format: 'float' },
      { key: 'dijkstra-cost', label: 'Dijkstra cost', value: dCost, format: 'float' },
      { key: 'astar-cost', label: 'A* cost', value: aCost, format: 'float' },
      { key: 'dijkstra-scanned', label: 'Dijkstra nodes scanned', value: st.dj.expanded, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const dCost = Number.isFinite(st.dj.cost) ? st.dj.cost : 0;
  const aCost = Number.isFinite(st.as.cost) ? st.as.cost : 0;
  const ratio = st.dj.expanded > 0 ? st.as.expanded / st.dj.expanded : 1;
  return [
    {
      key: 'cost-optimality',
      label: 'A* cost $\\leq$ Dijkstra cost',
      value: aCost <= dCost ? 'pass' : `+${(100 * (aCost - dCost) / dCost).toFixed(1)}%`,
      status: aCost <= dCost + 1e-6 ? 'pass' : 'drift'
    },
    {
      key: 'search-efficiency',
      label: 'A* expanded nodes / Dijkstra',
      value: ratio.toFixed(2),
      status: ratio < 1 ? 'pass' : 'pending'
    }
  ];
};
