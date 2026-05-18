// sim.js
// Dijkstra vs A* on a procedurally generated city grid. Cells are
// street (cost 1), slow zone (cost 4, e.g. a piazza/market), or wall
// (a building or the river without a bridge). Both algorithms return
// the order in which nodes were settled (for the animated frontier),
// the optimal path, and its cost. With an admissible heuristic A*
// settles the same optimum as Dijkstra but expands fewer nodes.
//
// Reference: Cormen, Leiserson, Rivest, Stein, Introduction to
// Algorithms 3e, ch. 24 (`cormen2009`); Hart, Nilsson, Raphael 1968
// (A*).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

export const WALL = Infinity;

export function buildCity(cols, rows, seed = DEFAULT_SEED) {
  const rng = makeRng(seed);
  const cost = new Float64Array(cols * rows).fill(1);
  const at = (x, y) => y * cols + x;
  // Building blocks: rectangular wall clusters. Dense enough that the
  // flood has to work around real obstructions, but not so dense that
  // most seeds disconnect and fall back to the carved corridor.
  const nBlocks = Math.floor(cols * rows / 30);
  for (let b = 0; b < nBlocks; b += 1) {
    const bw = 2 + Math.floor(rng() * 4), bh = 2 + Math.floor(rng() * 4);
    const bx = 1 + Math.floor(rng() * (cols - bw - 2));
    const by = 1 + Math.floor(rng() * (rows - bh - 2));
    for (let y = by; y < by + bh; y += 1) for (let x = bx; x < bx + bw; x += 1) cost[at(x, y)] = WALL;
  }
  // A diagonal "river" with two bridges.
  for (let y = 0; y < rows; y += 1) {
    const rx = Math.round((0.32 + 0.28 * y / rows) * cols);
    for (let dx = -1; dx <= 1; dx += 1) { const x = rx + dx; if (x >= 0 && x < cols) cost[at(x, y)] = WALL; }
  }
  // A SINGLE bridge on the bank OPPOSITE the start/goal band (see
  // below: both endpoints sit in one horizontal band, the bridge in
  // the other). The only river crossing is then far from the direct
  // line, so every seed forces a large V-shaped detour (path length
  // well above Manhattan, never a straight shot) while the banks stay
  // open so A*'s heuristic still vastly out-prunes Dijkstra. Side and
  // jitter are seed-chosen for variety.
  const topBand = Math.floor(seed) % 2 === 0;          // endpoints band
  const bridgeY = topBand
    ? rows - 4 - Math.floor(rng() * 4)                 // bridge at bottom
    : 3 + Math.floor(rng() * 4);                       // bridge at top
  for (let dy = -1; dy <= 1; dy += 1) {
    const by = bridgeY + dy;
    if (by < 0 || by >= rows) continue;
    const rx = Math.round((0.32 + 0.28 * by / rows) * cols);
    for (let dx = -3; dx <= 3; dx += 1) { const x = rx + dx; if (x >= 0 && x < cols) cost[at(x, by)] = 1; }
  }
  // Slow piazzas (cost 4): scaled to the map so a larger city has more
  // of them, which makes Dijkstra's uniform-cost flood visibly bulge.
  const nPiazza = Math.max(5, Math.floor((cols * rows) / 320));
  for (let p = 0; p < nPiazza; p += 1) {
    const pw = 2 + Math.floor(rng() * 3), ph = 2 + Math.floor(rng() * 3);
    const px = 2 + Math.floor(rng() * (cols - pw - 3)), py = 2 + Math.floor(rng() * (rows - ph - 3));
    for (let y = py; y < py + ph; y += 1) for (let x = px; x < px + pw; x += 1) if (cost[at(x, y)] !== WALL) cost[at(x, y)] = 4;
  }
  // Start and goal in the SAME horizontal band (both near the top, or
  // both near the bottom, opposite the bridge). With the only river
  // crossing on the far bank, the optimal route is a deep V: out to
  // the bridge and back, never a straight line, for every seed.
  const band = topBand ? 0.14 : 0.86;
  const sx = 1, sy = Math.floor(rows * band);
  const gx = cols - 2, gy = Math.floor(rows * (topBand ? band + 0.06 : band - 0.06));
  const start = at(sx, sy);
  const goal = at(gx, gy);
  cost[start] = 1; cost[goal] = 1;
  // Clear a small apron around the endpoints so a random block can
  // never seal the start or goal cell itself.
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    const ax = sx + dx, ay = sy + dy, bx2 = gx + dx, by2 = gy + dy;
    if (ax >= 0 && ax < cols && ay >= 0 && ay < rows) cost[at(ax, ay)] = Math.min(cost[at(ax, ay)], 1);
    if (bx2 >= 0 && bx2 < cols && by2 >= 0 && by2 < rows) cost[at(bx2, by2)] = Math.min(cost[at(bx2, by2)], 1);
  }
  // Guarantee connectivity. If the single bridge or the blocks happen
  // to disconnect the goal, carve a MEANDERING goal-biased corridor
  // (never the old straight mid-row line). Rare with one open bridge.
  if (!reachable(cost, cols, rows, start, goal)) {
    let x = sx, y = sy, guard = 0;
    const maxG = cols * rows * 6;
    while ((x !== gx || y !== gy) && guard < maxG) {
      guard += 1;
      cost[at(x, y)] = Math.min(cost[at(x, y)], 1);
      const tX = Math.sign(gx - x), tY = Math.sign(gy - y);
      let dx = 0, dy = 0;
      if (rng() < 0.62) { if (tX && (rng() < 0.5 || !tY)) dx = tX; else if (tY) dy = tY; else dx = tX || 1; }
      else if (rng() < 0.5) dx = rng() < 0.5 ? -1 : 1; else dy = rng() < 0.5 ? -1 : 1;
      x = Math.max(0, Math.min(cols - 1, x + dx));
      y = Math.max(0, Math.min(rows - 1, y + dy));
    }
    cost[goal] = 1;
  }
  return { cols, rows, cost, start, goal };
}

function neighbors(g, idx) {
  const x = idx % g.cols, y = (idx / g.cols) | 0;
  const out = [];
  if (x > 0) out.push(idx - 1);
  if (x < g.cols - 1) out.push(idx + 1);
  if (y > 0) out.push(idx - g.cols);
  if (y < g.rows - 1) out.push(idx + g.cols);
  return out;
}

function reachable(cost, cols, rows, s, t) {
  const seen = new Uint8Array(cols * rows);
  const q = [s]; seen[s] = 1;
  const g = { cols, rows };
  while (q.length) {
    const c = q.pop();
    if (c === t) return true;
    for (const n of neighbors(g, c)) if (!seen[n] && cost[n] !== WALL) { seen[n] = 1; q.push(n); }
  }
  return false;
}

// Binary min-heap of [priority, node].
function heapPush(h, item) {
  h.push(item); let i = h.length - 1;
  while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; }
}
function heapPop(h) {
  const top = h[0], last = h.pop();
  if (h.length) { h[0] = last; let i = 0;
    for (;;) { let s = i; const l = 2 * i + 1, r = l + 1;
      if (l < h.length && h[l][0] < h[s][0]) s = l;
      if (r < h.length && h[r][0] < h[s][0]) s = r;
      if (s === i) break; [h[s], h[i]] = [h[i], h[s]]; i = s; } }
  return top;
}

function search(g, useHeuristic) {
  const N = g.cols * g.rows;
  const dist = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const settled = new Uint8Array(N);
  const order = [];
  const gx = g.goal % g.cols, gy = (g.goal / g.cols) | 0;
  const hToGoal = (i) => {
    if (!useHeuristic) return 0;
    const x = i % g.cols, y = (i / g.cols) | 0;
    return Math.abs(x - gx) + Math.abs(y - gy);          // admissible (min edge cost = 1)
  };
  dist[g.start] = 0;
  const h = [];
  heapPush(h, [hToGoal(g.start), g.start]);
  while (h.length) {
    const [, u] = heapPop(h);
    if (settled[u]) continue;
    settled[u] = 1; order.push(u);
    if (u === g.goal) break;
    for (const v of neighbors(g, u)) {
      if (g.cost[v] === WALL) continue;
      const nd = dist[u] + g.cost[v];
      if (nd < dist[v]) { dist[v] = nd; prev[v] = u; heapPush(h, [nd + hToGoal(v), v]); }
    }
  }
  const path = [];
  if (settled[g.goal]) { let c = g.goal; while (c !== -1) { path.push(c); c = prev[c]; } path.reverse(); }
  return { order, path, cost: dist[g.goal], expanded: order.length };
}

export function dijkstra(g) { return search(g, false); }
export function astar(g) { return search(g, true); }
