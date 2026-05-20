// Headless physics for the galaxy-collision-3d hero. Two disk galaxies
// in counter-orbiting Kepler trajectories collide and tidally interact.
// Force model: shared 2D Barnes-Hut quadtree (O(N log N)). Each galaxy
// has a heavy core particle plus N_disk test stars in a Mestel-like
// exponential disk in circular rotation. Reference: Toomre and Toomre,
// ApJ 178 (1972) 623 (`toomretoomre1972`); Barnes and Hut, Nature 324
// (1986) 446 (`barnes-hut1986`).

export {
  createState, leapfrog, accBH, accDirect, snapshotTree,
} from '../../../shared/js/engine/quadtree-2d.js';

import { createState as createStateImported, leapfrog as leapfrogImported } from '../../../shared/js/engine/quadtree-2d.js';

function rng32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a two-galaxy initial condition: cores at (-d/2, 0) and
// (+d/2, 0), each with N_disk test stars in an exponential disk in
// circular rotation, and counter-rotating to set up a prograde-prograde
// pass (the classic Toomre fly-by geometry).
//
// d = separation, V = relative core velocity (head-on retrograde
// approach has V along +y; prograde encounter is V along +y for the
// left galaxy and -y for the right).
export function makeTwoGalaxies(opts = {}) {
  const {
    seed = 0xC0FFEE, N_disk = 1200,
    M_core = 3, R_scale = 0.25, R_max = 0.6, R_min = 0.18,
    d = 2.5, V = 0.25,
  } = opts;
  const N = 2 * (N_disk + 1);     // 2 cores + 2 * N_disk
  const state = createStateImported(N);
  const rng = rng32(seed);

  // Core 0 at (-d/2, 0), moving in +y.
  // Core 1 at (+d/2, 0), moving in -y.
  const cores = [
    { x: -d / 2, y: 0,  vx: 0, vy: +V, m: M_core },
    { x: +d / 2, y: 0,  vx: 0, vy: -V, m: M_core },
  ];

  function placeGalaxy(idx, cx, cy, cvx, cvy, M, prograde) {
    state.x[2 * idx]     = cx;
    state.x[2 * idx + 1] = cy;
    state.v[2 * idx]     = cvx;
    state.v[2 * idx + 1] = cvy;
    state.m[idx] = M;
    for (let k = 1; k <= N_disk; k += 1) {
      const i = idx + k * 2;        // interleave: not used; we place sequentially
    }
  }

  // Sequential layout: [core0, disk0..., core1, disk1...]
  let idx = 0;
  for (let g = 0; g < 2; g += 1) {
    const core = cores[g];
    state.x[2 * idx] = core.x;
    state.x[2 * idx + 1] = core.y;
    state.v[2 * idx] = core.vx;
    state.v[2 * idx + 1] = core.vy;
    state.m[idx] = core.m;
    const coreIdx = idx;
    idx += 1;
    for (let k = 0; k < N_disk; k += 1) {
      const u = rng();
      let r = -R_scale * Math.log(1 - u * (1 - Math.exp(-R_max / R_scale)));
      if (r < R_min) r = R_min + (R_min - r);    // reflect away from core
      const th = rng() * 2 * Math.PI;
      const cx = Math.cos(th), sy = Math.sin(th);
      state.x[2 * idx]     = core.x + r * cx;
      state.x[2 * idx + 1] = core.y + r * sy;
      state.m[idx] = 1 / N_disk;
      const vCirc = Math.sqrt(M_core / r);
      // Prograde direction for each galaxy: +ccw for galaxy 0, also
      // +ccw for galaxy 1 to make both have the same spin (a classic
      // tidal-tail-favorable geometry).
      const sign = g === 0 ? 1 : 1;
      state.v[2 * idx]     = core.vx - sign * vCirc * sy;
      state.v[2 * idx + 1] = core.vy + sign * vCirc * cx;
      idx += 1;
    }
  }
  return state;
}

// Convenience: run a few steps to settle initial conditions.
export function warmup(state, steps, dt, opts) {
  for (let n = 0; n < steps; n += 1) leapfrogImported(state, dt, opts);
}
