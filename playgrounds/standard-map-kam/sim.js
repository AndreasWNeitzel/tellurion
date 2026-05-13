// sim.js
// Chirikov standard map ("kicked rotator"):
//   p_{n+1} = p_n + K sin(theta_n)        (mod 2pi)
//   theta_{n+1} = theta_n + p_{n+1}       (mod 2pi)
//
// Area-preserving discrete map on the cylinder/torus. At K = 0 the map is
// integrable (invariant horizontal lines p = const). As K grows the lines
// distort, and KAM tori with the most irrational winding numbers persist
// longest. The "golden" KAM torus with winding (sqrt(5)-1)/2 breaks at
// the critical value K_c = 0.971635... (Greene 1979; Chirikov 1979).
// Beyond K_c, large-scale diffusion in p is possible.

import { makeRng } from '../../shared/js/render/rng.js';

const TWO_PI = 2 * Math.PI;

function wrap(x) {
  let y = x % TWO_PI;
  if (y < 0) y += TWO_PI;
  return y;
}

// Iterate the standard map for nIter steps starting from (theta0, p0) and
// return the visited points as two parallel Float64Arrays.
export function iterateOrbit(theta0, p0, K, nIter) {
  const thetas = new Float64Array(nIter);
  const ps = new Float64Array(nIter);
  let theta = wrap(theta0);
  let p = wrap(p0);
  for (let i = 0; i < nIter; i += 1) {
    p = wrap(p + K * Math.sin(theta));
    theta = wrap(theta + p);
    thetas[i] = theta;
    ps[i] = p;
  }
  return { thetas, ps };
}

// Build a phase-portrait by tracing nOrbits orbits, each of length nPerOrbit.
// Seeds are spread out in p along the vertical centerline theta = pi.
export function phasePortrait({
  K, nOrbits = 32, nPerOrbit = 1200, seed = 0xC0FFEE,
} = {}) {
  const rng = makeRng(seed);
  const orbits = new Array(nOrbits);
  for (let o = 0; o < nOrbits; o += 1) {
    const theta0 = Math.PI;
    const p0 = TWO_PI * o / nOrbits;
    const { thetas, ps } = iterateOrbit(theta0, p0, K, nPerOrbit);
    orbits[o] = { theta0, p0, thetas, ps };
  }
  void rng;
  return orbits;
}

// Lyapunov exponent for the map via the Jacobian and a single tangent
// vector. M = [[1, 1], [K cos theta, K cos theta + 1]] is the linearization
// at each step.
export function maxLyapunov({ K, theta0 = 0.5, p0 = 0.3, nIter = 50_000 } = {}) {
  let theta = wrap(theta0);
  let p = wrap(p0);
  let dx = 1, dy = 0;
  let logSum = 0;
  const RENORM_EVERY = 100;
  for (let i = 1; i <= nIter; i += 1) {
    const c = Math.cos(theta);
    const newP = wrap(p + K * Math.sin(theta));
    const newTheta = wrap(theta + newP);
    const ndx = K * c * dx + dx + dy;
    const ndy = K * c * dx + dy;
    dx = ndx; dy = ndy;
    theta = newTheta; p = newP;
    if (i % RENORM_EVERY === 0) {
      const n = Math.hypot(dx, dy);
      if (n > 0) {
        logSum += Math.log(n);
        dx /= n; dy /= n;
      }
    }
  }
  return logSum / nIter;
}

// Critical K for the breakdown of the golden-mean KAM torus.
export const K_CRITICAL = 0.971635406;
