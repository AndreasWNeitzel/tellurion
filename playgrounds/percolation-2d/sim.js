// sim.js
// 2D bond percolation on a square lattice. Each site is occupied with
// probability p, independently. We find connected clusters via union-find
// (Hoshen-Kopelman 1976) and report the largest-cluster fraction.
//
// Critical occupation for site percolation on the 2D square lattice:
//   p_c = 0.59274621... (Newman-Ziff 2000, Stauffer-Aharony 1994).
//
// Below p_c: only small clusters; no infinite cluster.
// Above p_c: a spanning cluster appears and grows; the largest-cluster
//   fraction P_inf becomes a finite fraction of the lattice.
//
// Reference: Stauffer and Aharony 1994, Introduction to Percolation Theory,
// Chapter 2 (`staufferaharony1994`).

import { makeRng } from '../../shared/js/render/rng.js';

export const P_C = 0.59274621;

// Generate a 0/1 occupation grid.
export function occupy(L, p, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const grid = new Uint8Array(L * L);
  for (let i = 0; i < grid.length; i += 1) grid[i] = rng() < p ? 1 : 0;
  return grid;
}

// Union-find for cluster labeling.
function find(parent, x) {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]];
    x = parent[x];
  }
  return x;
}
function union(parent, size, a, b) {
  const ra = find(parent, a);
  const rb = find(parent, b);
  if (ra === rb) return;
  if (size[ra] < size[rb]) { parent[ra] = rb; size[rb] += size[ra]; }
  else { parent[rb] = ra; size[ra] += size[rb]; }
}

// Returns labels[N] with label = root index for each occupied site, 0 for
// empty. Plus a Map from label to cluster size.
export function cluster(grid, L) {
  const N = L * L;
  const parent = new Int32Array(N);
  const size = new Int32Array(N);
  for (let i = 0; i < N; i += 1) { parent[i] = i; size[i] = 1; }
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const k = j * L + i;
      if (!grid[k]) continue;
      if (i > 0 && grid[k - 1]) union(parent, size, k, k - 1);
      if (j > 0 && grid[k - L]) union(parent, size, k, k - L);
    }
  }
  const labels = new Int32Array(N);
  const sizes = new Map();
  for (let k = 0; k < N; k += 1) {
    if (grid[k]) {
      const r = find(parent, k);
      labels[k] = r + 1;
      sizes.set(r + 1, (sizes.get(r + 1) || 0) + 1);
    }
  }
  return { labels, sizes };
}

// Largest-cluster fraction of the lattice.
export function largestClusterFraction(grid, L) {
  const { sizes } = cluster(grid, L);
  let max = 0;
  for (const s of sizes.values()) if (s > max) max = s;
  return max / (L * L);
}

// Does a spanning cluster exist (top row connected to bottom row)?
export function spans(grid, L) {
  const { labels } = cluster(grid, L);
  const topLabels = new Set();
  for (let i = 0; i < L; i += 1) if (labels[i]) topLabels.add(labels[i]);
  for (let i = 0; i < L; i += 1) {
    if (labels[(L - 1) * L + i] && topLabels.has(labels[(L - 1) * L + i])) return true;
  }
  return false;
}
