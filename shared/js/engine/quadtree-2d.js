// quadtree-2d.js
// Two-dimensional Barnes-Hut quadtree gravity for an isolated N-body
// system, O(N log N). Distant groups of bodies are replaced by their
// centre of mass when the cell width s over the distance d satisfies
// s/d < theta (the opening angle); nearby bodies are summed directly.
// Forces use Plummer softening a = G m r / (r^2 + eps^2)^{3/2}. Time
// integration is a kick-drift-kick leapfrog that reuses the
// end-of-step acceleration as the start-of-step acceleration, so each
// step does one tree build.
//
// This is the 2D variant of shared/js/engine/barnes-hut-3d.js, intended
// for the algorithm-visualization playground that draws the live tree
// over a moving particle system. It also exposes the tree itself for
// rendering (boxes + node masses), and an O(N^2) direct evaluator for
// the side-by-side speed comparison.
//
// Reference: Barnes and Hut, Nature 324, 446 (1986); softening / time
// integration practice after Springel 2005, GADGET-2.

const QUAD = 4;

// Preallocated, reusable quadtree storage (grows on demand).
let cap = 0;
let nCx, nCy, nMass;            // mass-weighted centre of mass accumulators then centre
let nHx, nHy, nHalf;            // node centre + half-width (axis-aligned square)
let nBody;                      // >=0 leaf body index, -1 internal, -2 empty
let nChild;                     // QUAD * node -> child node index, or -1

function ensureCap(maxNodes) {
  if (maxNodes <= cap) return;
  cap = Math.max(maxNodes, 64);
  nCx = new Float64Array(cap); nCy = new Float64Array(cap);
  nMass = new Float64Array(cap);
  nHx = new Float64Array(cap); nHy = new Float64Array(cap); nHalf = new Float64Array(cap);
  nBody = new Int32Array(cap);
  nChild = new Int32Array(cap * QUAD);
}

function quadrantOf(px, py, cxv, cyv) {
  return (px >= cxv ? 1 : 0) | (py >= cyv ? 2 : 0);
}

// Build the quadtree over bodies [0, N). Returns the number of nodes
// used. The root is node 0.
export function buildTree(x, m, N) {
  // Bounding square.
  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (let i = 0; i < N; i += 1) {
    const px = x[2 * i], py = x[2 * i + 1];
    if (px < xmin) xmin = px; if (px > xmax) xmax = px;
    if (py < ymin) ymin = py; if (py > ymax) ymax = py;
  }
  const cxv = 0.5 * (xmin + xmax), cyv = 0.5 * (ymin + ymax);
  let half = 0.5 * Math.max(xmax - xmin, ymax - ymin);
  if (!(half > 0) || !Number.isFinite(half)) half = 1;
  half *= 1.0000001;

  ensureCap(4 * N + 16);
  let nNodes = 1;
  nCx[0] = 0; nCy[0] = 0; nMass[0] = 0;
  nHx[0] = cxv; nHy[0] = cyv; nHalf[0] = half;
  nBody[0] = -2;
  for (let c = 0; c < QUAD; c += 1) nChild[c] = -1;

  for (let i = 0; i < N; i += 1) {
    const px = x[2 * i], py = x[2 * i + 1], mi = m[i];
    let node = 0;
    let depth = 0;
    for (;;) {
      nMass[node] += mi;
      nCx[node] += mi * px;
      nCy[node] += mi * py;
      if (nBody[node] === -2) {
        // empty leaf -> store body
        nBody[node] = i;
        break;
      }
      if (nBody[node] >= 0) {
        // leaf holds another body; subdivide.
        const j = nBody[node];
        const jx = x[2 * j], jy = x[2 * j + 1], mj = m[j];
        nBody[node] = -1;
        // create 4 empty children
        for (let c = 0; c < QUAD; c += 1) {
          const ch = nNodes;
          ensureCap(ch + 1);
          nNodes += 1;
          const dx = (c & 1) ? 0.5 * nHalf[node] : -0.5 * nHalf[node];
          const dy = (c & 2) ? 0.5 * nHalf[node] : -0.5 * nHalf[node];
          nHx[ch] = nHx[node] + dx;
          nHy[ch] = nHy[node] + dy;
          nHalf[ch] = 0.5 * nHalf[node];
          nCx[ch] = 0; nCy[ch] = 0; nMass[ch] = 0;
          nBody[ch] = -2;
          for (let cc = 0; cc < QUAD; cc += 1) nChild[ch * QUAD + cc] = -1;
          nChild[node * QUAD + c] = ch;
        }
        // re-insert the previous occupant.
        const qj = quadrantOf(jx, jy, nHx[node], nHy[node]);
        const chj = nChild[node * QUAD + qj];
        nMass[chj] += mj;
        nCx[chj] += mj * jx;
        nCy[chj] += mj * jy;
        nBody[chj] = j;
      }
      // descend into the appropriate child of this internal node.
      const q = quadrantOf(px, py, nHx[node], nHy[node]);
      const ch = nChild[node * QUAD + q];
      node = ch;
      depth += 1;
      if (depth > 64) break;          // safety
    }
  }
  // normalize centre of mass.
  for (let k = 0; k < nNodes; k += 1) {
    if (nMass[k] > 0) {
      nCx[k] /= nMass[k];
      nCy[k] /= nMass[k];
    }
  }
  return nNodes;
}

// Recursive Barnes-Hut traversal: compute acceleration on body i from
// node. opens nodes when s / d > theta, otherwise treats node as a
// single point at its centre of mass. Plummer softening eps. Returns
// the contribution accumulated into (ax, ay).
function accFromNode(node, px, py, theta, eps2, x, m) {
  if (nBody[node] === -2) return [0, 0];
  const dx = nCx[node] - px;
  const dy = nCy[node] - py;
  const r2 = dx * dx + dy * dy + eps2;
  const s = 2 * nHalf[node];
  if (nBody[node] >= 0 || s * s < theta * theta * r2) {
    const inv = nMass[node] / (r2 * Math.sqrt(r2));
    return [inv * dx, inv * dy];
  }
  let ax = 0, ay = 0;
  for (let c = 0; c < QUAD; c += 1) {
    const ch = nChild[node * QUAD + c];
    if (ch < 0) continue;
    const [cax, cay] = accFromNode(ch, px, py, theta, eps2, x, m);
    ax += cax; ay += cay;
  }
  return [ax, ay];
}

// Compute accelerations for all N bodies via the tree. Returns the
// number of force-pair evaluations performed (i.e. how many leaves
// or aggregate cells were summed, summed over bodies). The user can
// compare this to N*(N-1) for the direct sum.
export function accBH(state, theta, G, eps) {
  const { x, m, a, N } = state;
  const nNodes = buildTree(x, m, N);
  const eps2 = eps * eps;
  let evals = 0;
  for (let i = 0; i < N; i += 1) {
    const px = x[2 * i], py = x[2 * i + 1];
    const [ax, ay] = accFromNode(0, px, py, theta, eps2, x, m);
    a[2 * i] = G * ax;
    a[2 * i + 1] = G * ay;
    // count evaluations
    evals += countEvals(0, px, py, theta, eps2);
  }
  return { evals, nNodes };
}

function countEvals(node, px, py, theta, eps2) {
  if (nBody[node] === -2) return 0;
  const dx = nCx[node] - px;
  const dy = nCy[node] - py;
  const r2 = dx * dx + dy * dy + eps2;
  const s = 2 * nHalf[node];
  if (nBody[node] >= 0 || s * s < theta * theta * r2) return 1;
  let e = 0;
  for (let c = 0; c < QUAD; c += 1) {
    const ch = nChild[node * QUAD + c];
    if (ch >= 0) e += countEvals(ch, px, py, theta, eps2);
  }
  return e;
}

// Direct O(N^2) accelerations, for the side-by-side comparison.
export function accDirect(state, G, eps) {
  const { x, m, a, N } = state;
  const eps2 = eps * eps;
  for (let i = 0; i < 2 * N; i += 1) a[i] = 0;
  for (let i = 0; i < N; i += 1) {
    const xi = x[2 * i], yi = x[2 * i + 1];
    for (let j = i + 1; j < N; j += 1) {
      const dx = x[2 * j] - xi, dy = x[2 * j + 1] - yi;
      const r2 = dx * dx + dy * dy + eps2;
      const inv = 1 / (r2 * Math.sqrt(r2));
      const fx = inv * dx, fy = inv * dy;
      const mi = m[i], mj = m[j];
      a[2 * i]     += G * mj * fx;
      a[2 * i + 1] += G * mj * fy;
      a[2 * j]     -= G * mi * fx;
      a[2 * j + 1] -= G * mi * fy;
    }
  }
  return { evals: N * (N - 1), nNodes: 0 };
}

// Kick-drift-kick leapfrog one timestep.
export function leapfrog(state, dt, opts) {
  const { use_tree = true, theta = 0.7, G = 1, eps = 0.03 } = opts || {};
  const { x, v, a, N } = state;
  // half kick
  for (let i = 0; i < 2 * N; i += 1) v[i] += 0.5 * dt * a[i];
  // drift
  for (let i = 0; i < 2 * N; i += 1) x[i] += dt * v[i];
  // accel
  const ev = use_tree ? accBH(state, theta, G, eps) : accDirect(state, G, eps);
  // half kick
  for (let i = 0; i < 2 * N; i += 1) v[i] += 0.5 * dt * a[i];
  state.t += dt;
  state.nSteps += 1;
  state.evals = ev.evals;
  state.nNodes = ev.nNodes;
}

// Allocate a state container for N bodies.
export function createState(N) {
  return {
    N,
    x: new Float64Array(2 * N),
    v: new Float64Array(2 * N),
    a: new Float64Array(2 * N),
    m: new Float64Array(N),
    t: 0,
    nSteps: 0,
    evals: 0,
    nNodes: 0,
  };
}

// Read-only views of the current tree (after a tree build), for the
// playground to draw boxes. Returns parallel arrays of node centres,
// half-widths, body indices, masses; the playground walks these.
export function snapshotTree() {
  return { nCx, nCy, nHx, nHy, nHalf, nMass, nBody, nChild, QUAD };
}

// Total system kinetic energy.
export function kineticEnergy(state) {
  let K = 0;
  for (let i = 0; i < state.N; i += 1) {
    const vx = state.v[2 * i], vy = state.v[2 * i + 1];
    K += 0.5 * state.m[i] * (vx * vx + vy * vy);
  }
  return K;
}

// Total potential energy (direct O(N^2)).
export function potentialEnergy(state, G = 1, eps = 0.03) {
  let U = 0;
  const eps2 = eps * eps;
  for (let i = 0; i < state.N; i += 1) {
    for (let j = i + 1; j < state.N; j += 1) {
      const dx = state.x[2 * j] - state.x[2 * i];
      const dy = state.x[2 * j + 1] - state.x[2 * i + 1];
      const r = Math.sqrt(dx * dx + dy * dy + eps2);
      U -= G * state.m[i] * state.m[j] / r;
    }
  }
  return U;
}
