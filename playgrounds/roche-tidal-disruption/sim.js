// sim.js
// Tidal disruption of a fluid satellite passing near a primary. We model
// the satellite as N test particles initially packed in a small uniform
// disc. Each feels gravity from the primary plus a soft self-gravity
// toward the satellite's instantaneous center of mass, controlled by a
// "cohesion" parameter. When the orbit takes the cloud inside the Roche
// radius, tides win and the cloud stretches into a stream.
//
// Roche radius (fluid satellite, equal densities): r_R = 2.44 R_primary.
// In our code units the primary is a point mass and the cloud radius is
// fixed; the slider controls the cohesion strength (analog of internal
// gravity G_self).
//
// Reference: Binney and Tremaine 2008, Galactic Dynamics 2e, Section 8.2.

import { makeRng } from '../../shared/js/render/rng.js';

const TWO_PI = 2 * Math.PI;
const G = 1;
const M_PRIMARY = 1;

export function createCloud({ N = 80, a = 4.0, e = 0.5, rCloud = 0.30, seed = 0xC0FFEE } = {}) {
  const rng = makeRng(seed);
  const r0 = a * (1 + e);          // start at apoastron
  const vCirc = Math.sqrt(G * M_PRIMARY * (2 / r0 - 1 / a));  // vis-viva
  // Velocity at apoastron is tangential (perpendicular to r)
  const xs = new Float64Array(N);
  const ys = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const ang = rng() * TWO_PI;
    const rr = rCloud * Math.sqrt(rng());
    xs[i] = r0 + rr * Math.cos(ang);
    ys[i] = rr * Math.sin(ang);
    vx[i] = 0;
    vy[i] = vCirc;
  }
  return { N, xs, ys, vx, vy, t: 0, rCloud, a, e };
}

function comAndAcc(cloud, cohesion) {
  const N = cloud.N;
  let cx = 0, cy = 0;
  for (let i = 0; i < N; i += 1) { cx += cloud.xs[i]; cy += cloud.ys[i]; }
  cx /= N; cy /= N;
  const ax = new Float64Array(N), ay = new Float64Array(N);
  const softening2 = cloud.rCloud * cloud.rCloud * 0.04;
  for (let i = 0; i < N; i += 1) {
    const x = cloud.xs[i], y = cloud.ys[i];
    // Primary
    const r2 = x * x + y * y + 1e-6;
    const r3 = r2 * Math.sqrt(r2);
    const ap = -G * M_PRIMARY / r3;
    // Self toward com (softened)
    const dxs = x - cx, dys = y - cy;
    const ds2 = dxs * dxs + dys * dys + softening2;
    const ds3 = ds2 * Math.sqrt(ds2);
    ax[i] = ap * x - cohesion * dxs / ds3;
    ay[i] = ap * y - cohesion * dys / ds3;
  }
  return { ax, ay, cx, cy };
}

export function stepCloud(cloud, dt, cohesion) {
  const N = cloud.N;
  // Velocity-Verlet
  const a0 = comAndAcc(cloud, cohesion);
  for (let i = 0; i < N; i += 1) {
    cloud.vx[i] += 0.5 * dt * a0.ax[i];
    cloud.vy[i] += 0.5 * dt * a0.ay[i];
    cloud.xs[i] += dt * cloud.vx[i];
    cloud.ys[i] += dt * cloud.vy[i];
  }
  const a1 = comAndAcc(cloud, cohesion);
  for (let i = 0; i < N; i += 1) {
    cloud.vx[i] += 0.5 * dt * a1.ax[i];
    cloud.vy[i] += 0.5 * dt * a1.ay[i];
  }
  cloud.t += dt;
}

// Roche radius for an equal-density fluid satellite.
export function rocheLimitFluid(R_primary) {
  return 2.44 * R_primary;
}

// Approximate effective "stream length" of a tidally stretched cloud, used as
// a diagnostic. Just the maximum distance among all particles from CoM.
export function streamLength(cloud) {
  let cx = 0, cy = 0;
  for (let i = 0; i < cloud.N; i += 1) { cx += cloud.xs[i]; cy += cloud.ys[i]; }
  cx /= cloud.N; cy /= cloud.N;
  let dMax = 0;
  for (let i = 0; i < cloud.N; i += 1) {
    const d = Math.hypot(cloud.xs[i] - cx, cloud.ys[i] - cy);
    if (d > dMax) dMax = d;
  }
  return dMax;
}

export function comDistance(cloud) {
  let cx = 0, cy = 0;
  for (let i = 0; i < cloud.N; i += 1) { cx += cloud.xs[i]; cy += cloud.ys[i]; }
  cx /= cloud.N; cy /= cloud.N;
  return Math.hypot(cx, cy);
}
