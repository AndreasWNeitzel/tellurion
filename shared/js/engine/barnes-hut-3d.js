// barnes-hut-3d.js
// Three-dimensional Barnes-Hut octree gravity, O(N log N).
//
// Distant groups of bodies are replaced by their centre of mass when the
// cell width s over the distance d satisfies s/d < theta (the opening
// angle); nearby bodies are summed directly. Forces use Plummer
// softening a = G m r / (r^2 + eps^2)^{3/2}. Time integration is a
// kick-drift-kick leapfrog that reuses the end-of-step acceleration as
// the start-of-step acceleration, so each step does ONE tree build.
//
// This is the standard isolated-system N-body method (Barnes & Hut,
// Nature 324, 446, 1986; applied to galaxy mergers by Barnes &
// Efstathiou 1987; leapfrog + Plummer-equivalent softening practice
// after Springel 2005, GADGET-2). It has no periodic box and no grid,
// so it is naturally 3D and free of the zero-padded-FFT cost that makes
// an isolated 3D particle-mesh non-interactive.
//
// State object: { x: Float64Array(3N), v: Float64Array(3N),
//                  m: Float64Array(N), N, t, nSteps, a? }
// Options: { G = 1, theta = 0.6, eps = 0.05 }

const OCT = 8;

// Preallocated, reusable octree storage (grows on demand).
let cap = 0;
let nCx, nCy, nCz;        // accumulated centre of mass (then normalized)
let nMass;                // node mass
let nHx, nHy, nHz, nHalf; // node centre + half-width (cube)
let nBody;                // >=0: leaf holds that body; -1: internal; -2: empty
let nChild;               // OCT * node -> child node index, or -1
let nMore, nNext;         // threaded traversal: open -> nMore, accept -> nNext

function ensureCap(maxNodes) {
  if (maxNodes <= cap) return;
  cap = Math.max(maxNodes, 64);
  nCx = new Float64Array(cap); nCy = new Float64Array(cap); nCz = new Float64Array(cap);
  nMass = new Float64Array(cap);
  nHx = new Float64Array(cap); nHy = new Float64Array(cap); nHz = new Float64Array(cap);
  nHalf = new Float64Array(cap);
  nBody = new Int32Array(cap);
  nChild = new Int32Array(cap * OCT);
  nMore = new Int32Array(cap);
  nNext = new Int32Array(cap);
}

function octantOf(px, py, pz, cxv, cyv, czv) {
  return (px >= cxv ? 1 : 0) | (py >= cyv ? 2 : 0) | (pz >= czv ? 4 : 0);
}

// Build the octree over bodies [0, N). Returns the root node index (0).
function buildTree(x, m, N) {
  // Bounding cube.
  let xmin = Infinity, ymin = Infinity, zmin = Infinity;
  let xmax = -Infinity, ymax = -Infinity, zmax = -Infinity;
  for (let i = 0; i < N; i += 1) {
    const px = x[3 * i], py = x[3 * i + 1], pz = x[3 * i + 2];
    if (px < xmin) xmin = px; if (px > xmax) xmax = px;
    if (py < ymin) ymin = py; if (py > ymax) ymax = py;
    if (pz < zmin) zmin = pz; if (pz > zmax) zmax = pz;
  }
  const cxv = 0.5 * (xmin + xmax), cyv = 0.5 * (ymin + ymax), czv = 0.5 * (zmin + zmax);
  let half = 0.5 * Math.max(xmax - xmin, ymax - ymin, zmax - zmin);
  if (!(half > 0) || !Number.isFinite(half)) half = 1;
  half *= 1.0000001;                                   // strict containment

  ensureCap(8 * N + 16);
  let nNodes = 1;
  nCx[0] = 0; nCy[0] = 0; nCz[0] = 0; nMass[0] = 0;
  nHx[0] = cxv; nHy[0] = cyv; nHz[0] = czv; nHalf[0] = half;
  nBody[0] = -2;                                       // -2 empty
  for (let c = 0; c < OCT; c += 1) nChild[c] = -1;

  for (let i = 0; i < N; i += 1) {
    const px = x[3 * i], py = x[3 * i + 1], pz = x[3 * i + 2], mi = m[i];
    let node = 0;
    let depth = 0;
    for (;;) {
      // Accumulate mass and (mass-weighted) COM on the path.
      nMass[node] += mi;
      nCx[node] += mi * px; nCy[node] += mi * py; nCz[node] += mi * pz;

      if (nBody[node] === -2) {
        nBody[node] = i;                               // empty -> leaf
        break;
      }
      if (nBody[node] >= 0) {
        // Leaf: make it internal and push the resident body down one
        // level into its octant child (created empty, set as a leaf).
        const j = nBody[node];
        nBody[node] = -1;
        if (depth < 28) {
          const jx = x[3 * j], jy = x[3 * j + 1], jz = x[3 * j + 2];
          const oj = octantOf(jx, jy, jz, nHx[node], nHy[node], nHz[node]);
          if (nNodes + 1 > cap) ensureCapGrow(nNodes + 1);
          const cn = nNodes++;
          initChild(cn, node, oj);
          nMass[cn] = m[j];
          nCx[cn] = m[j] * jx; nCy[cn] = m[j] * jy; nCz[cn] = m[j] * jz;
          nBody[cn] = j;
          nChild[OCT * node + oj] = cn;
        }
        // depth >= 28: keep as a bucket (rare near-coincident case); the
        // resident j stays accounted in this node's mass/COM.
      }
      // Internal: descend into the child octant for body i.
      const o = octantOf(px, py, pz, nHx[node], nHy[node], nHz[node]);
      let ch = nChild[OCT * node + o];
      if (ch === -1) {
        if (nNodes + 1 > cap) ensureCapGrow(nNodes + 1);
        ch = nNodes++;
        initChild(ch, node, o);
        nChild[OCT * node + o] = ch;
      }
      node = ch;
      depth += 1;
      if (depth > 64) break;                           // hard safety
    }
  }
  // Normalize COM.
  for (let n = 0; n < nNodes; n += 1) {
    const M = nMass[n];
    if (M > 0) { nCx[n] /= M; nCy[n] /= M; nCz[n] /= M; }
  }
  threadTree(nNodes);
  return { root: 0, nNodes };
}

function ensureCapGrow(need) {
  const old = cap;
  const newCap = Math.max(need, Math.ceil(cap * 1.6));
  const g = (arr, Ctor, mul = 1) => {
    const n = new Ctor(newCap * mul);
    n.set(arr.subarray(0, old * mul));
    return n;
  };
  nCx = g(nCx, Float64Array); nCy = g(nCy, Float64Array); nCz = g(nCz, Float64Array);
  nMass = g(nMass, Float64Array);
  nHx = g(nHx, Float64Array); nHy = g(nHy, Float64Array); nHz = g(nHz, Float64Array);
  nHalf = g(nHalf, Float64Array);
  nBody = g(nBody, Int32Array);
  nChild = g(nChild, Int32Array, OCT);
  nMore = g(nMore, Int32Array);
  nNext = g(nNext, Int32Array);
  cap = newCap;
}

// Thread the tree for stackless traversal: nMore[node] is where to go
// when the node is OPENED (its first existing child); nNext[node] is
// where to go when the node is ACCEPTED or is a leaf (its next sibling,
// or the nearest ancestor's next). A full traversal is then:
//   cur = root; while (cur !== -1) cur = accept(cur) ? nNext : nMore;
function threadTree(nNodes) {
  // Iterative DFS; pass each node the index to go to after its subtree.
  // Stack holds (node, after).
  let sp = 0;
  const sNode = threadStackN, sAfter = threadStackA;
  if (sNode.length < nNodes + 1) {
    threadStackN = new Int32Array(nNodes + 1);
    threadStackA = new Int32Array(nNodes + 1);
    return threadTree(nNodes);
  }
  sNode[sp] = 0; sAfter[sp] = -1; sp += 1;
  while (sp > 0) {
    sp -= 1;
    const node = sNode[sp], after = sAfter[sp];
    nNext[node] = after;
    if (nBody[node] >= 0 || nBody[node] === -2) {
      nMore[node] = after;                             // leaf/empty: no open
      continue;
    }
    // Internal: existing children in octant order form a sibling chain;
    // each child's "after" is the next sibling, the last child's "after"
    // is this node's own "after".
    const kids = threadKids;
    let nk = 0;
    for (let c = 0; c < OCT; c += 1) {
      const ch = nChild[OCT * node + c];
      if (ch !== -1) kids[nk++] = ch;
    }
    nMore[node] = nk > 0 ? kids[0] : after;
    for (let k = 0; k < nk; k += 1) {
      const childAfter = (k + 1 < nk) ? kids[k + 1] : after;
      sNode[sp] = kids[k]; sAfter[sp] = childAfter; sp += 1;
    }
  }
}
let threadStackN = new Int32Array(64);
let threadStackA = new Int32Array(64);
const threadKids = new Int32Array(OCT);

function initChild(cn, parent, oct) {
  const h = 0.5 * nHalf[parent];
  nHx[cn] = nHx[parent] + ((oct & 1) ? h : -h);
  nHy[cn] = nHy[parent] + ((oct & 2) ? h : -h);
  nHz[cn] = nHz[parent] + ((oct & 4) ? h : -h);
  nHalf[cn] = h;
  nMass[cn] = 0; nCx[cn] = 0; nCy[cn] = 0; nCz[cn] = 0;
  nBody[cn] = -2;                                       // empty
  for (let c = 0; c < OCT; c += 1) nChild[OCT * cn + c] = -1;
}

// Acceleration on every body via the Barnes-Hut opening criterion.
// Returns a Float64Array(3N).
export function accelBH(x, m, N, opts = {}) {
  const G = opts.G ?? 1;
  const theta = opts.theta ?? 0.6;
  const eps2 = (opts.eps ?? 0.05) ** 2;
  const theta2 = theta * theta;
  buildTree(x, m, N);
  const a = new Float64Array(3 * N);
  for (let i = 0; i < N; i += 1) {
    const xi = x[3 * i], yi = x[3 * i + 1], zi = x[3 * i + 2];
    let ax = 0, ay = 0, az = 0;
    let node = 0;                                      // stackless walk
    while (node !== -1) {
      const b = nBody[node];
      if (b === i) { node = nNext[node]; continue; }   // skip self leaf
      const dx = nCx[node] - xi, dy = nCy[node] - yi, dz = nCz[node] - zi;
      const d2 = dx * dx + dy * dy + dz * dz;
      const w = 2 * nHalf[node];
      if (b >= 0 || (w * w < theta2 * d2)) {
        // Leaf body, or cell far enough: monopole (Plummer-softened).
        if (nMass[node] > 0 && d2 > 0) {
          const inv = 1 / Math.sqrt(d2 + eps2);
          const f = G * nMass[node] * inv * inv * inv;
          ax += f * dx; ay += f * dy; az += f * dz;
        }
        node = nNext[node];                            // accept
      } else {
        node = nMore[node];                            // open
      }
    }
    a[3 * i] = ax; a[3 * i + 1] = ay; a[3 * i + 2] = az;
  }
  return a;
}

// Per-body gravitational potential via the same opening criterion
// (monopole, Plummer-softened). Returns Float64Array(N). Builds its own
// tree, so call sparingly (the merger uses it only for the periodic
// energy vs angular-momentum diagnostic, not every frame).
export function potentialBH(x, m, N, opts = {}) {
  const G = opts.G ?? 1;
  const theta = opts.theta ?? 0.6;
  const eps2 = (opts.eps ?? 0.05) ** 2;
  const theta2 = theta * theta;
  buildTree(x, m, N);
  const phi = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const xi = x[3 * i], yi = x[3 * i + 1], zi = x[3 * i + 2];
    let p = 0;
    let node = 0;
    while (node !== -1) {
      const b = nBody[node];
      if (b === i) { node = nNext[node]; continue; }
      const dx = nCx[node] - xi, dy = nCy[node] - yi, dz = nCz[node] - zi;
      const d2 = dx * dx + dy * dy + dz * dz;
      const w = 2 * nHalf[node];
      if (b >= 0 || (w * w < theta2 * d2)) {
        if (nMass[node] > 0) p -= G * nMass[node] / Math.sqrt(d2 + eps2);
        node = nNext[node];
      } else {
        node = nMore[node];
      }
    }
    phi[i] = p;
  }
  return phi;
}

// Direct O(N^2) reference (for tests / accuracy checks).
export function accelDirect(x, m, N, opts = {}) {
  const G = opts.G ?? 1;
  const eps2 = (opts.eps ?? 0.05) ** 2;
  const a = new Float64Array(3 * N);
  for (let i = 0; i < N; i += 1) {
    const xi = x[3 * i], yi = x[3 * i + 1], zi = x[3 * i + 2];
    let ax = 0, ay = 0, az = 0;
    for (let j = 0; j < N; j += 1) {
      if (j === i) continue;
      const dx = x[3 * j] - xi, dy = x[3 * j + 1] - yi, dz = x[3 * j + 2] - zi;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz + eps2);
      const f = G * m[j] * inv * inv * inv;
      ax += f * dx; ay += f * dy; az += f * dz;
    }
    a[3 * i] = ax; a[3 * i + 1] = ay; a[3 * i + 2] = az;
  }
  return a;
}

// Kick-drift-kick leapfrog. Reuses state.a (end-of-step acceleration) as
// the next start-of-step acceleration, so each step is ONE tree build.
export function stepBH(state, dt, opts = {}) {
  const { x, v, m, N } = state;
  let a = state.a;
  if (!a) a = accelBH(x, m, N, opts);
  for (let k = 0; k < 3 * N; k += 1) v[k] += 0.5 * dt * a[k];   // half kick
  for (let k = 0; k < 3 * N; k += 1) x[k] += dt * v[k];          // drift
  a = accelBH(x, m, N, opts);                                    // new accel
  for (let k = 0; k < 3 * N; k += 1) v[k] += 0.5 * dt * a[k];   // half kick
  state.a = a;
  state.t = (state.t ?? 0) + dt;
  state.nSteps = (state.nSteps ?? 0) + 1;
  return a;
}

export { buildTree };
