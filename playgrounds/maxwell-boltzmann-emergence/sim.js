// sim.js
// Maxwell-Boltzmann distribution emerging from elastic hard-disk collisions
// in 2D. The system starts with all particles at the same speed v_0 but
// random orientations. Pairwise elastic collisions redistribute the
// speeds until the distribution converges to the 2D Maxwell-Boltzmann:
//
//   p(v) = (m / (k_B T)) v exp(-m v^2 / (2 k_B T))
//
// Spatial-hash neighbor lookup (cell size = 2 RADIUS) keeps collision
// resolution O(N) on average instead of O(N^2).
//
// Reference: Reif, Fundamentals of Statistical and Thermal Physics Ch. 1
// (`reif`).

import { makeRng, DEFAULT_SEED } from '../../shared/js/render/rng.js';

export const BOX = 8.0;
export const N_DEFAULT = 1000;
// Pack so disk radius is small enough that 1000 disks fit comfortably.
// Disc-fraction phi = N pi r^2 / BOX^2. For phi = 0.2 (modest density):
// r = sqrt(0.2 * 64 / (pi * 1000)) ~= 0.064.
export const RADIUS = 0.06;
export const M_PARTICLE = 1.0;
const CELL_SIZE = 2 * RADIUS;
const NCELLS = Math.ceil(BOX / CELL_SIZE);

export function createGas({ N = N_DEFAULT, v0 = 1.0, seed = DEFAULT_SEED } = {}) {
  const rng = makeRng(seed);
  const x = new Float64Array(N);
  const y = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);
  // Place on a regular grid that leaves enough margin around radii.
  const ncol = Math.ceil(Math.sqrt(N));
  const sp = (BOX - 2 * RADIUS - 0.1) / ncol;
  for (let i = 0; i < N; i += 1) {
    const ix = i % ncol, iy = Math.floor(i / ncol);
    x[i] = RADIUS + 0.05 + (ix + 0.5) * sp;
    y[i] = RADIUS + 0.05 + (iy + 0.5) * sp;
    const theta = 2 * Math.PI * rng();
    vx[i] = v0 * Math.cos(theta);
    vy[i] = v0 * Math.sin(theta);
  }
  return { x, y, vx, vy, N, t: 0, nSteps: 0 };
}

function cellOf(p) { return Math.max(0, Math.min(NCELLS - 1, Math.floor(p / CELL_SIZE))); }

// Resolve a single pair if they overlap and approach.
function resolvePair(s, i, j) {
  const dx = s.x[j] - s.x[i];
  const dy = s.y[j] - s.y[i];
  const dist2 = dx * dx + dy * dy;
  const r2 = (2 * RADIUS) * (2 * RADIUS);
  if (dist2 > r2 || dist2 < 1e-14) return;
  const dist = Math.sqrt(dist2);
  const nx = dx / dist, ny = dy / dist;
  const dvx = s.vx[j] - s.vx[i];
  const dvy = s.vy[j] - s.vy[i];
  const vAlong = dvx * nx + dvy * ny;
  if (vAlong > 0) return;
  s.vx[i] += vAlong * nx;
  s.vy[i] += vAlong * ny;
  s.vx[j] -= vAlong * nx;
  s.vy[j] -= vAlong * ny;
  const overlap = (2 * RADIUS - dist) / 2;
  s.x[i] -= overlap * nx; s.y[i] -= overlap * ny;
  s.x[j] += overlap * nx; s.y[j] += overlap * ny;
}

// Spatial-hash collision pass: each cell at most a few disks.
function collideAll(s) {
  // Build cell -> particle list.
  const head = new Int32Array(NCELLS * NCELLS).fill(-1);
  const next = new Int32Array(s.N);
  for (let i = 0; i < s.N; i += 1) {
    const cx = cellOf(s.x[i]);
    const cy = cellOf(s.y[i]);
    const idx = cy * NCELLS + cx;
    next[i] = head[idx];
    head[idx] = i;
  }
  // For each occupied cell, check pairs against same cell and 4 forward
  // neighbours so each pair is visited once.
  for (let cy = 0; cy < NCELLS; cy += 1) {
    for (let cx = 0; cx < NCELLS; cx += 1) {
      const idx0 = cy * NCELLS + cx;
      for (let i = head[idx0]; i !== -1; i = next[i]) {
        // Same cell: pairs (i, j) with j after i in the list.
        for (let j = next[i]; j !== -1; j = next[j]) resolvePair(s, i, j);
        // Forward neighbours: (+1, 0), (-1, +1), (0, +1), (+1, +1).
        const neighbours = [[1, 0], [-1, 1], [0, 1], [1, 1]];
        for (const [dx, dy] of neighbours) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= NCELLS || ny < 0 || ny >= NCELLS) continue;
          const idxN = ny * NCELLS + nx;
          for (let j = head[idxN]; j !== -1; j = next[j]) resolvePair(s, i, j);
        }
      }
    }
  }
}

export function stepGas(s, dt = 0.01) {
  for (let i = 0; i < s.N; i += 1) {
    s.x[i] += s.vx[i] * dt;
    s.y[i] += s.vy[i] * dt;
    if (s.x[i] < RADIUS)         { s.x[i] = RADIUS;       s.vx[i] = -s.vx[i]; }
    if (s.x[i] > BOX - RADIUS)   { s.x[i] = BOX - RADIUS; s.vx[i] = -s.vx[i]; }
    if (s.y[i] < RADIUS)         { s.y[i] = RADIUS;       s.vy[i] = -s.vy[i]; }
    if (s.y[i] > BOX - RADIUS)   { s.y[i] = BOX - RADIUS; s.vy[i] = -s.vy[i]; }
  }
  collideAll(s);
  s.t += dt;
  s.nSteps += 1;
}

export function totalKE(s) {
  let KE = 0;
  for (let i = 0; i < s.N; i += 1) KE += 0.5 * M_PARTICLE * (s.vx[i] * s.vx[i] + s.vy[i] * s.vy[i]);
  return KE;
}

export function meanSpeed(s) {
  let sum = 0;
  for (let i = 0; i < s.N; i += 1) sum += Math.sqrt(s.vx[i] * s.vx[i] + s.vy[i] * s.vy[i]);
  return sum / s.N;
}

export function maxwellBoltzmann2D(v, sigma) {
  return v / (sigma * sigma) * Math.exp(-v * v / (2 * sigma * sigma));
}

export function speedHistogram(s, nbins = 32, vmax = 3.0) {
  const bins = new Float64Array(nbins);
  const dv = vmax / nbins;
  for (let i = 0; i < s.N; i += 1) {
    const v = Math.sqrt(s.vx[i] * s.vx[i] + s.vy[i] * s.vy[i]);
    const k = Math.min(nbins - 1, Math.floor(v / dv));
    bins[k] += 1;
  }
  for (let k = 0; k < nbins; k += 1) bins[k] /= (s.N * dv);
  return { bins, dv, vmax };
}
