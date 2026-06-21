// Headless simulation for the quadtree collision playground. Equal hard disks
// bounce inside a unit box and collide elastically. A quadtree partitions the
// box so each disk only tests neighbours in nearby cells: collision detection
// is O(N log N) instead of the O(N^2) all-pairs check. The metric reported is
// the number of candidate pair-checks per step, which is deterministic (unlike
// wall-clock time), so the speedup is unambiguous.
//
// Reference: Barnes and Hut, Nature 324 (1986) 446 (`barnes-hut1986`); Samet,
// The Design and Analysis of Spatial Data Structures (`samet1990`).

// Mulberry32 PRNG so the initial layout is reproducible in browser and Node.
export function rng32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// N equal disks of radius r placed without trying to avoid overlap (a couple of
// frames of relaxation clears it), each with a random velocity of fixed speed.
export function createBoxState(N, opts = {}) {
  const { seed = 0xC0FFEE, radius = 0.0072, speed = 0.16 } = opts;
  const rng = rng32(seed);
  const x = new Float64Array(2 * N);
  const v = new Float64Array(2 * N);
  for (let i = 0; i < N; i += 1) {
    x[2 * i] = radius + rng() * (1 - 2 * radius);
    x[2 * i + 1] = radius + rng() * (1 - 2 * radius);
    const a = rng() * 2 * Math.PI;
    v[2 * i] = speed * Math.cos(a);
    v[2 * i + 1] = speed * Math.sin(a);
  }
  return { N, x, v, r: radius, checks: 0, collisions: 0 };
}

// --- Quadtree over the unit box -------------------------------------------
// A node is { x0,y0,x1,y1, idx:[...] | null, kids:[4] | null }. Leaves hold up
// to CAP point indices; a leaf over capacity (above MIN_SIZE) splits into four.
const CAP = 4;
const MIN_SIZE = 1 / 256;

function makeNode(x0, y0, x1, y1) { return { x0, y0, x1, y1, idx: [], kids: null }; }

function quadrant(node, x, y) {
  const mx = 0.5 * (node.x0 + node.x1), my = 0.5 * (node.y0 + node.y1);
  return (x >= mx ? 1 : 0) + (y >= my ? 2 : 0);
}
// px is the flat positions array [x0,y0,x1,y1,...]; i is a body index.
function insert(node, i, px) {
  const x = px[2 * i], y = px[2 * i + 1];
  if (node.kids) { insert(node.kids[quadrant(node, x, y)], i, px); return; }
  node.idx.push(i);
  if (node.idx.length > CAP && (node.x1 - node.x0) > MIN_SIZE) split(node, px);
}
function split(node, px) {
  const mx = 0.5 * (node.x0 + node.x1), my = 0.5 * (node.y0 + node.y1);
  node.kids = [
    makeNode(node.x0, node.y0, mx, my),
    makeNode(mx, node.y0, node.x1, my),
    makeNode(node.x0, my, mx, node.y1),
    makeNode(mx, my, node.x1, node.y1),
  ];
  const held = node.idx; node.idx = null;
  for (const j of held) insert(node, j, px);
}

export function buildQuadtree(s) {
  const root = makeNode(0, 0, 1, 1);
  for (let i = 0; i < s.N; i += 1) insert(root, i, s.x);
  return root;
}

// Collect indices whose point lies in the query rect (used per disk).
function query(node, rx0, ry0, rx1, ry1, out) {
  if (node.x1 < rx0 || node.x0 > rx1 || node.y1 < ry0 || node.y0 > ry1) return;
  if (node.kids) { for (const k of node.kids) query(k, rx0, ry0, rx1, ry1, out); return; }
  for (const j of node.idx) out.push(j);
}

// Leaf rectangles, for drawing the live partition.
export function quadtreeCells(node, out = []) {
  if (node.kids) { for (const k of node.kids) quadtreeCells(k, out); }
  else out.push([node.x0, node.y0, node.x1, node.y1]);
  return out;
}

// Resolve an elastic collision between equal-mass disks i and j (exchange the
// velocity components along the line of centres) and push them apart so they no
// longer overlap. Conserves momentum and kinetic energy.
function resolve(s, i, j) {
  const dx = s.x[2 * j] - s.x[2 * i], dy = s.x[2 * j + 1] - s.x[2 * i + 1];
  const d2 = dx * dx + dy * dy, dmin = 2 * s.r;
  if (d2 >= dmin * dmin || d2 < 1e-12) return false;
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
  const dvx = s.v[2 * j] - s.v[2 * i], dvy = s.v[2 * j + 1] - s.v[2 * i + 1];
  const vn = dvx * nx + dvy * ny;
  if (vn < 0) {                       // only if approaching
    s.v[2 * i] += vn * nx; s.v[2 * i + 1] += vn * ny;
    s.v[2 * j] -= vn * nx; s.v[2 * j + 1] -= vn * ny;
  }
  const overlap = 0.5 * (dmin - d);
  s.x[2 * i] -= overlap * nx; s.x[2 * i + 1] -= overlap * ny;
  s.x[2 * j] += overlap * nx; s.x[2 * j + 1] += overlap * ny;
  return true;
}

// One step: drift, reflect off the walls, resolve collisions with the chosen
// method. Returns { checks, collisions, root } (root is the quadtree, or null).
export function stepBox(s, dt, mode = 'tree') {
  const { N, r } = s;
  for (let i = 0; i < N; i += 1) {
    s.x[2 * i] += s.v[2 * i] * dt; s.x[2 * i + 1] += s.v[2 * i + 1] * dt;
    for (const c of [0, 1]) {
      const p = 2 * i + c;
      if (s.x[p] < r) { s.x[p] = r; s.v[p] = Math.abs(s.v[p]); }
      else if (s.x[p] > 1 - r) { s.x[p] = 1 - r; s.v[p] = -Math.abs(s.v[p]); }
    }
  }
  let checks = 0, collisions = 0, root = null;
  if (mode === 'direct') {
    for (let i = 0; i < N; i += 1) for (let j = i + 1; j < N; j += 1) { checks += 1; if (resolve(s, i, j)) collisions += 1; }
  } else {
    root = buildQuadtree(s);
    const cand = [];
    for (let i = 0; i < N; i += 1) {
      const xi = s.x[2 * i], yi = s.x[2 * i + 1];
      cand.length = 0;
      query(root, xi - 2 * r, yi - 2 * r, xi + 2 * r, yi + 2 * r, cand);
      for (const j of cand) { if (j <= i) continue; checks += 1; if (resolve(s, i, j)) collisions += 1; }
    }
  }
  s.checks = checks; s.collisions = collisions;
  return { checks, collisions, root };
}

export function kineticEnergy(s) {
  let e = 0;
  for (let i = 0; i < 2 * s.N; i += 1) e += s.v[i] * s.v[i];
  return 0.5 * e;
}

// Expected pair-checks for a uniform spread: all-pairs is N(N-1)/2; the
// quadtree is ~ N times the mean occupancy of a 4r-wide neighbourhood.
export function directChecks(N) { return N * (N - 1) / 2; }
