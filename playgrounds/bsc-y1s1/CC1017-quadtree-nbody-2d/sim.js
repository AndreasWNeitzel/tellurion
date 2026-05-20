// Headless simulation for the quadtree N-body playground. The numerics
// (tree build, BH force walk, leapfrog, direct sum) live in the
// shared engine; this module wires the initial conditions (a thin
// gravity-bound disk with a heavy core) and exposes them so the
// invariants test can reproduce them deterministically.
//
// Reference: Barnes and Hut, Nature 324 (1986) 446 (`barnes-hut1986`).

export {
  createState, buildTree, accBH, accDirect, leapfrog, snapshotTree,
  kineticEnergy, potentialEnergy,
} from '../../../shared/js/engine/quadtree-2d.js';

import { createState as csImported, leapfrog as lfImported } from '../../../shared/js/engine/quadtree-2d.js';

// Mulberry32 PRNG so the initial disk is reproducible across browser
// and Node test runs.
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

// Build a Mestel-like exponential disk of N bodies in 2D. A heavy
// central mass M_core fixes the rotation curve, and outer particles
// are placed on circular orbits with a thin velocity dispersion.
export function makeDisk(N, opts = {}) {
  const { seed = 0xC0FFEE, M_core = 50, R_max = 1.0, R_scale = 0.35, dispersion = 0.02 } = opts;
  const rng = rng32(seed);
  const state = csImported(N);
  // body 0 is the heavy core at the origin.
  state.x[0] = 0; state.x[1] = 0;
  state.v[0] = 0; state.v[1] = 0;
  state.m[0] = M_core;
  for (let i = 1; i < N; i += 1) {
    // Inverse-CDF sample of an exponential disk truncated at R_max.
    const u = rng();
    const r = -R_scale * Math.log(1 - u * (1 - Math.exp(-R_max / R_scale)));
    const th = rng() * 2 * Math.PI;
    const cx = Math.cos(th), sy = Math.sin(th);
    state.x[2 * i]     = r * cx;
    state.x[2 * i + 1] = r * sy;
    state.m[i] = 1 / N;                         // total disk mass ~ 1
    // Circular speed from the core mass at radius r (ignoring disk
    // self-gravity for initial conditions).
    const vCirc = Math.sqrt(M_core / Math.max(r, 0.05));
    const vx = -vCirc * sy + dispersion * (rng() - 0.5);
    const vy =  vCirc * cx + dispersion * (rng() - 0.5);
    state.v[2 * i] = vx;
    state.v[2 * i + 1] = vy;
  }
  return state;
}
