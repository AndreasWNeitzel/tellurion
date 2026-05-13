// sim.js
// Brachistochrone problem: among all paths from A = (0, 0) to B = (X_B, -Y_B)
// in a uniform gravitational field, the path that minimizes descent time
// under a frictionless bead is a cycloid (Johann Bernoulli 1696).
//
// Parametric cycloid through origin and (X_B, -Y_B):
//   x(theta) = R (theta - sin theta)
//   y(theta) = -R (1 - cos theta)
//
// where R is chosen so that the endpoint (X_B, -Y_B) lies on the curve at
// theta = theta_B. Given Y_B and X_B, this is a transcendental equation in
// theta_B which we solve by bisection; then R = X_B / (theta_B - sin theta_B).
//
// Time to traverse: T_cycloid = sqrt(R / g) * theta_B.
//
// Comparison paths:
//   straight line from A to B
//   circular arc tangent to A horizontally (the natural "drop and roll"
//   intuition) passing through B
//
// Reference: Marion and Thornton, Classical Dynamics Ch. 6 (`marion-thornton`).

export const G = 9.81;
export const X_B = 4.0;
export const Y_B = 2.0;

// Solve for theta_B and R given X_B, Y_B.
function solveCycloid() {
  // y / x = (1 - cos theta) / (theta - sin theta)
  const target = Y_B / X_B;
  // Bisection over (0.1, 2 pi - 0.1)
  let lo = 0.001, hi = 2 * Math.PI - 0.001;
  for (let i = 0; i < 80; i += 1) {
    const mid = 0.5 * (lo + hi);
    const ratio = (1 - Math.cos(mid)) / (mid - Math.sin(mid));
    if (ratio > target) lo = mid; else hi = mid;
  }
  const thetaB = 0.5 * (lo + hi);
  const R = X_B / (thetaB - Math.sin(thetaB));
  return { thetaB, R };
}
export const CYCLOID = solveCycloid();
export const T_CYCLOID = Math.sqrt(CYCLOID.R / G) * CYCLOID.thetaB;

// Velocity along cycloid (from energy conservation): v(theta) = sqrt(2 g y(theta))
function velocityAtY(yDown) {
  // yDown is positive (depth below start)
  return Math.sqrt(Math.max(0, 2 * G * yDown));
}

// Position of bead on cycloid at time t. We integrate ds/v = dt along the
// path. For the cycloid this has the elegant closed form via theta(t).
// Use s parameter or directly theta(t) via numerical inversion.
// Actually simplest: simulate via Runge-Kutta of (x, y) under constraint y(x).
// But cleanest is to find theta(t).
//
// From Lagrangian on cycloid: d theta / dt = sqrt(g / R) -- constant.
// (See Marion-Thornton Ch. 6, or Lemos Ch. 2.) So theta(t) = sqrt(g / R) * t.
export function positionOnCycloid(t) {
  const omega = Math.sqrt(G / CYCLOID.R);
  const theta = omega * t;
  if (theta >= CYCLOID.thetaB) {
    return { x: X_B, y: -Y_B, done: true };
  }
  return {
    x: CYCLOID.R * (theta - Math.sin(theta)),
    y: -CYCLOID.R * (1 - Math.cos(theta)),
    done: false,
  };
}

// Straight line: parametrize as s in [0, L]. v(s) = sqrt(2 g y(s)).
// Here y(s) = -Y_B * s / L. Time to traverse:
//   T_line = integral 0..L ds / v = sqrt(L^2 / (g Y_B))
// Actually: along a uniform incline, accel = g sin(alpha) and length L,
// so T = sqrt(2 L / a) = sqrt(2 L / (g sin alpha)) = sqrt(2 L^2 / (g Y_B)).
const L_LINE = Math.sqrt(X_B * X_B + Y_B * Y_B);
const ACCEL_LINE = G * Y_B / L_LINE;
export const T_LINE = Math.sqrt(2 * L_LINE / ACCEL_LINE);
export function positionOnLine(t) {
  const sLine = 0.5 * ACCEL_LINE * t * t;
  if (sLine >= L_LINE) return { x: X_B, y: -Y_B, done: true };
  const frac = sLine / L_LINE;
  return { x: X_B * frac, y: -Y_B * frac, done: false };
}

// Circular arc passing through (0, 0) and (X_B, -Y_B), tangent to x-axis at (0, 0).
// Center at (0, -R_c) with R_c chosen so the arc passes through (X_B, -Y_B).
// (X_B - 0)^2 + (-Y_B - (-R_c))^2 = R_c^2
// X_B^2 + (R_c - Y_B)^2 = R_c^2
// X_B^2 + R_c^2 - 2 R_c Y_B + Y_B^2 = R_c^2
// X_B^2 + Y_B^2 = 2 R_c Y_B
// R_c = (X_B^2 + Y_B^2) / (2 Y_B)
export const R_ARC = (X_B * X_B + Y_B * Y_B) / (2 * Y_B);
// On the arc, angle phi from positive y-axis (downward toward center): the
// bead starts at phi = pi (top of circle, at origin) and ends where it meets B.
// Bottom of the circle is at (0, -2 R_c). At (X_B, -Y_B):
//   sin(phi) = X_B / R_c,  cos(phi) = (R_c - Y_B) / R_c.
const PHI_B = Math.atan2(X_B / R_ARC, (R_ARC - Y_B) / R_ARC);
// Equation of motion along arc: d phi / dt = sqrt(2 g R (1 - cos phi)) / R.
// Integrate numerically.
export function arcXY(phi) {
  return { x: R_ARC * Math.sin(phi), y: R_ARC * Math.cos(phi) - R_ARC };
}
function arcSpeed(phi) {
  return Math.sqrt(Math.max(0, 2 * G * R_ARC * (1 - Math.cos(phi)))) / R_ARC;
}
// Precompute arc time table (phi, t).
// Use the analytic solution near phi = 0 to handle the v -> 0 singularity:
// for small phi, v approx sqrt(g R) * phi, ds = R dphi, so dt = dphi / v
// integrates to t ~ 2 sqrt(phi / g) * sqrt(R) = sqrt(4 R phi / g).
// Start the numerical integration at phi_start = 1e-5 and assign
// t_start = 2 sqrt(R phi_start / g).
const ARC_TABLE = (() => {
  const steps = 5000;
  const phi_start = 1e-5;
  const t_start = 2 * Math.sqrt(R_ARC * phi_start / G);
  const dphi = (PHI_B - phi_start) / steps;
  const phis = new Float64Array(steps + 1);
  const ts = new Float64Array(steps + 1);
  let phi = phi_start, t = t_start;
  phis[0] = phi; ts[0] = t;
  for (let i = 1; i <= steps; i += 1) {
    const v_avg = 0.5 * (arcSpeed(phi) + arcSpeed(phi + dphi));
    t += dphi / Math.max(1e-9, v_avg);
    phi += dphi;
    phis[i] = phi; ts[i] = t;
  }
  return { phis, ts, steps, T_TOTAL: ts[steps] };
})();
export const T_ARC = ARC_TABLE.T_TOTAL;

export function positionOnArc(t) {
  if (t >= ARC_TABLE.ts[ARC_TABLE.steps]) return { x: X_B, y: -Y_B, done: true };
  if (t <= 0) return { x: 0, y: 0, done: false };
  // Binary search for t in ARC_TABLE.ts
  let lo = 0, hi = ARC_TABLE.steps;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >>> 1;
    if (ARC_TABLE.ts[mid] < t) lo = mid; else hi = mid;
  }
  const dt = ARC_TABLE.ts[hi] - ARC_TABLE.ts[lo];
  const frac = dt > 0 ? (t - ARC_TABLE.ts[lo]) / dt : 0;
  const phi = ARC_TABLE.phis[lo] + frac * (ARC_TABLE.phis[hi] - ARC_TABLE.phis[lo]);
  const p = arcXY(phi);
  return { x: p.x, y: p.y, done: false };
}

// Sample each curve as a polyline for rendering.
export function cycloidCurve(N = 200) {
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const theta = CYCLOID.thetaB * i / N;
    pts.push([CYCLOID.R * (theta - Math.sin(theta)), -CYCLOID.R * (1 - Math.cos(theta))]);
  }
  return pts;
}
export function lineCurve(N = 80) {
  const pts = [];
  for (let i = 0; i <= N; i += 1) pts.push([X_B * i / N, -Y_B * i / N]);
  return pts;
}
export function arcCurve(N = 200) {
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const phi = PHI_B * i / N;
    const p = arcXY(phi);
    pts.push([p.x, p.y]);
  }
  return pts;
}
