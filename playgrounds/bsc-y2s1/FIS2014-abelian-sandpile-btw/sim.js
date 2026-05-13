// sim.js
// Bak-Tang-Wiesenfeld (BTW) abelian sandpile model on a 2D L x L lattice.
//
// Rules:
//   * Each site holds a height z in {0, 1, 2, 3} (or more during a topple).
//   * Add a single grain to a random site.
//   * If z >= 4 at any site, it topples: z -= 4, and each of the 4
//     neighbors (N, S, E, W) gains 1. Grains at the boundary fall off
//     (lost).
//   * Toppling cascades until no site has z >= 4.
//
// Avalanche statistics: P(s) ~ s^(-tau) with tau approx 1.21 in 2D.
//
// Reference: Bak, Tang, Wiesenfeld 1987 PRL; Bak 1996 How Nature Works
// (`bak1996`).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

export const L = 32;

export function createBTW({ L_size = L, seed = DEFAULT_SEED } = {}) {
  const grid = new Int16Array(L_size * L_size);
  return {
    L: L_size,
    grid,
    rng: makeRng(seed),
    t: 0,
    avalanches: [],   // array of avalanche sizes since last reset
    lastAvalanche: 0,
    lastTopples: [],  // (x, y, count) cells that toppled during last avalanche
  };
}

// Drop one grain and topple to stability.
export function stepBTW(s) {
  const idx = Math.floor(s.rng() * s.L * s.L);
  s.grid[idx] += 1;
  let toppleCount = 0;
  const touched = new Set();
  const queue = [idx];
  while (queue.length > 0) {
    const i = queue.pop();
    if (s.grid[i] < 4) continue;
    s.grid[i] -= 4;
    toppleCount += 1;
    touched.add(i);
    const x = i % s.L, y = Math.floor(i / s.L);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= s.L || ny < 0 || ny >= s.L) continue;  // boundary loss
      const ni = ny * s.L + nx;
      s.grid[ni] += 1;
      if (s.grid[ni] >= 4) queue.push(ni);
    }
  }
  s.avalanches.push(toppleCount);
  if (s.avalanches.length > 10_000) s.avalanches.shift();
  s.lastAvalanche = toppleCount;
  s.t += 1;
  return toppleCount;
}

// Compute a power-law histogram of avalanche sizes.
export function avalanchePLBins(s, nbins = 30) {
  // Log-spaced bins from 1 to max.
  const sizes = s.avalanches.filter(a => a > 0);
  if (sizes.length === 0) return { bins: [], counts: [] };
  const maxS = Math.max(...sizes);
  const lmin = 0, lmax = Math.log10(maxS) + 1e-9;
  const bins = new Float64Array(nbins);
  const counts = new Float64Array(nbins);
  for (let i = 0; i < nbins; i += 1) bins[i] = Math.pow(10, lmin + (lmax - lmin) * (i + 0.5) / nbins);
  for (const sz of sizes) {
    const l = Math.log10(sz);
    const idx = Math.min(nbins - 1, Math.floor((l - lmin) / (lmax - lmin) * nbins));
    counts[idx] += 1;
  }
  // Normalize by bin width (log-spaced) for proper P(s).
  for (let i = 0; i < nbins; i += 1) {
    const dlog = (lmax - lmin) / nbins;
    const width = Math.pow(10, lmin + (lmax - lmin) * (i + 1) / nbins) - Math.pow(10, lmin + (lmax - lmin) * i / nbins);
    counts[i] /= (sizes.length * width);
  }
  return { bins: Array.from(bins), counts: Array.from(counts) };
}
