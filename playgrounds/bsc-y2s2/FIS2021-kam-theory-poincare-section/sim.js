// The Chirikov-Taylor standard map, the canonical model of the
// KAM transition to chaos:
//   p' = p + K sin(theta)        (mod 2 pi)
//   theta' = theta + p'          (mod 2 pi)
// It is an area-preserving twist map (Jacobian determinant exactly
// 1). At K = 0 the action p is conserved and the Poincare section is
// horizontal lines; as K grows KAM tori break, and the last (golden-
// mean) torus is destroyed at Greene's K_c ~ 0.9716, above which p
// diffuses globally. Headless, deterministic. Reference: Lichtenberg
// and Lieberman, Regular and Chaotic Dynamics (2nd ed.), Ch. 4
// (`lichtenberg-lieberman`); Goldstein, Poole and Safko, Classical
// Mechanics (3rd ed.), Ch. 11 (`goldstein-mech`).

export const KC_GOLDEN = 0.971635406;       // Greene's critical K
export const TWO_PI = 2 * Math.PI;
const wrap = (x) => ((x % TWO_PI) + TWO_PI) % TWO_PI;

// One forward iterate.
export function stdMap(theta, p, K) {
  const p2 = p + K * Math.sin(theta);
  const t2 = theta + p2;
  return [wrap(t2), wrap(p2)];
}
// The exact inverse: p = p' - K sin(theta), theta = theta' - p'.
export function stdMapInverse(theta2, p2, K) {
  const theta = wrap(theta2 - p2);
  const p = wrap(p2 - K * Math.sin(theta));
  return [theta, p];
}

// Jacobian determinant of the (unwrapped) map; identically 1.
export function jacobianDet(theta, K) {
  const dTt = 1 + K * Math.cos(theta), dTp = 1;
  const dPt = K * Math.cos(theta), dPp = 1;
  return dTt * dPp - dTp * dPt;                // = 1
}

// Iterate an orbit, returning the (theta,p) points (p kept on a
// signed branch around p0 to measure spreading, not wrapped).
export function orbit(theta0, p0, K, n) {
  const pts = [[wrap(theta0), wrap(p0)]];
  let th = wrap(theta0), p = wrap(p0);
  for (let i = 0; i < n; i += 1) { [th, p] = stdMap(th, p, K); pts.push([th, p]); }
  return pts;
}

// Spread of p over an orbit (max-min); a bounded KAM torus keeps
// this small, a chaotic orbit fills the cylinder.
export function pSpread(theta0, p0, K, n) {
  let th = wrap(theta0), p = p0, lo = p0, hi = p0;
  for (let i = 0; i < n; i += 1) {
    const p2 = p + K * Math.sin(th);
    th = wrap(th + p2); p = p2;
    lo = Math.min(lo, p); hi = Math.max(hi, p);
  }
  return hi - lo;
}

// Diffusion estimate: variance of p growth per step averaged over an
// ensemble (quasilinear D ~ K^2/2 for large K).
export function diffusionCoeff(K, n = 400, ens = 60, seed = 1) {
  let s = seed >>> 0;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  let acc = 0;
  for (let e = 0; e < ens; e += 1) {
    let th = rng() * TWO_PI, p = 0, p0 = 0;
    for (let i = 0; i < n; i += 1) { const p2 = p + K * Math.sin(th); th = wrap(th + p2); p = p2; }
    acc += (p - p0) * (p - p0);
  }
  return acc / (ens * n);                      // <(dp)^2>/n
}
export function quasilinearD(K) { return 0.5 * K * K; }

// Linearized-map trace and Greene residue R = (2 - tr M)/4 at a
// period-1 fixed point with the given cos(theta*). Elliptic
// (stable) island for 0 < R < 1.
export function fixedPointTrace(cosTheta, K) {
  // M = [[1 + K c, 1],[K c, 1]] -> tr = 2 + K c
  return 2 + K * cosTheta;
}
export function residue(cosTheta, K) { return (2 - fixedPointTrace(cosTheta, K)) / 4; }

// Rotation number of a near-integrable orbit at K = 0: omega = p0
// per iterate (theta advances by p0); /2pi as a winding number.
export function rotationNumberK0(p0) { return wrap(p0) / TWO_PI; }
