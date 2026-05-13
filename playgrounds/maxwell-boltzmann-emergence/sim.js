// sim.js
// Maxwell-Boltzmann distribution emerging from elastic hard-disk collisions
// in 2D. The system starts with all particles at the same speed v_0 but
// random orientations. Pairwise elastic collisions redistribute the
// speeds until the distribution converges to the 2D Maxwell-Boltzmann:
//
//   p(v) = (m / (k_B T)) v exp(-m v^2 / (2 k_B T))
//
// where m v^2 / 2 averages to k_B T per dimension.
//
// Simplifications: m = 1, all disks have the same radius r. Time-step
// based: no event-driven collision detection. Collisions are detected when
// two disks overlap; velocities are then resolved with the standard elastic
// 2D formula.
//
// Reference: Reif, Fundamentals of Statistical and Thermal Physics Ch. 1
// (`reif`).

import { makeRng, DEFAULT_SEED } from '../../shared/js/render/rng.js';

export const BOX = 8.0;
export const RADIUS = 0.15;
export const M_PARTICLE = 1.0;

export function createGas({ N = 80, v0 = 1.0, seed = DEFAULT_SEED } = {}) {
  const rng = makeRng(seed);
  const x = new Float64Array(N);
  const y = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);
  // Place particles on a grid then perturb slightly so they don't overlap.
  const ncol = Math.ceil(Math.sqrt(N));
  const sp = (BOX - 1) / ncol;
  for (let i = 0; i < N; i += 1) {
    const ix = i % ncol, iy = Math.floor(i / ncol);
    x[i] = 0.5 + (ix + 0.5) * sp;
    y[i] = 0.5 + (iy + 0.5) * sp;
    const theta = 2 * Math.PI * rng();
    vx[i] = v0 * Math.cos(theta);
    vy[i] = v0 * Math.sin(theta);
  }
  return { x, y, vx, vy, N, t: 0, nSteps: 0 };
}

// Elastic collision between disks i and j.
function resolveCollision(s, i, j) {
  const dx = s.x[j] - s.x[i];
  const dy = s.y[j] - s.y[i];
  const dist2 = dx * dx + dy * dy;
  if (dist2 > (2 * RADIUS) * (2 * RADIUS)) return;
  const dist = Math.sqrt(dist2);
  if (dist < 1e-9) return;
  const nx = dx / dist, ny = dy / dist;
  const dvx = s.vx[j] - s.vx[i];
  const dvy = s.vy[j] - s.vy[i];
  const vAlong = dvx * nx + dvy * ny;
  if (vAlong > 0) return;          // moving apart, no collision
  // Elastic, equal mass: exchange the normal component.
  s.vx[i] += vAlong * nx;
  s.vy[i] += vAlong * ny;
  s.vx[j] -= vAlong * nx;
  s.vy[j] -= vAlong * ny;
  // Push them apart to avoid sticking
  const overlap = (2 * RADIUS - dist) / 2;
  s.x[i] -= overlap * nx; s.y[i] -= overlap * ny;
  s.x[j] += overlap * nx; s.y[j] += overlap * ny;
}

export function stepGas(s, dt = 0.01) {
  for (let i = 0; i < s.N; i += 1) {
    s.x[i] += s.vx[i] * dt;
    s.y[i] += s.vy[i] * dt;
    // Walls (reflecting)
    if (s.x[i] < RADIUS)         { s.x[i] = RADIUS;       s.vx[i] = -s.vx[i]; }
    if (s.x[i] > BOX - RADIUS)   { s.x[i] = BOX - RADIUS; s.vx[i] = -s.vx[i]; }
    if (s.y[i] < RADIUS)         { s.y[i] = RADIUS;       s.vy[i] = -s.vy[i]; }
    if (s.y[i] > BOX - RADIUS)   { s.y[i] = BOX - RADIUS; s.vy[i] = -s.vy[i]; }
  }
  // Pairwise collision detection (O(N^2)). N = 80 keeps this cheap.
  for (let i = 0; i < s.N; i += 1) {
    for (let j = i + 1; j < s.N; j += 1) resolveCollision(s, i, j);
  }
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

// Analytic MB in 2D: f(v) = v / sigma^2 * exp(-v^2 / (2 sigma^2))
// where sigma^2 = k_B T / m = <v_x^2> (the variance of a single component).
export function maxwellBoltzmann2D(v, sigma) {
  return v / (sigma * sigma) * Math.exp(-v * v / (2 * sigma * sigma));
}

// Histogram of speeds in nbins.
export function speedHistogram(s, nbins = 24, vmax = 3.0) {
  const bins = new Float64Array(nbins);
  const dv = vmax / nbins;
  for (let i = 0; i < s.N; i += 1) {
    const v = Math.sqrt(s.vx[i] * s.vx[i] + s.vy[i] * s.vy[i]);
    const k = Math.min(nbins - 1, Math.floor(v / dv));
    bins[k] += 1;
  }
  // Normalize so integral = 1
  for (let k = 0; k < nbins; k += 1) bins[k] /= (s.N * dv);
  return { bins, dv, vmax };
}
