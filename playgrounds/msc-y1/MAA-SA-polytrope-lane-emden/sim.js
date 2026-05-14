// sim.js
// Lane-Emden equation for polytropic stars
//   d^2 theta / d xi^2 + (2 / xi) d theta / d xi + theta^n = 0
// with boundary conditions theta(0) = 1, theta'(0) = 0.
//
// Closed-form solutions:
//   n = 0: theta(xi) = 1 - xi^2 / 6, xi_1 = sqrt(6).
//   n = 1: theta(xi) = sin(xi) / xi, xi_1 = pi.
//   n = 5: theta(xi) = 1 / sqrt(1 + xi^2 / 3), xi_1 = infinity (infinite radius).
//
// Numerical solutions via RK4 for arbitrary n. Common stellar values:
//   n = 3/2 (non-rel degenerate, brown dwarfs, low-mass MS): xi_1 ~ 3.6537.
//   n = 3   (relativistic-limit white dwarf, M_Ch): xi_1 ~ 6.8969.
//
// Reference: Hansen-Kawaler-Trimble, Stellar Interiors 2e Ch. 7
// (`hansen-kawaler`).

// Closed-form analytic solutions where available.
export function analyticTheta(n, xi) {
  if (n === 0) return 1 - xi * xi / 6;
  if (n === 1) {
    if (xi < 1e-6) return 1 - xi * xi / 6; // sin(xi)/xi Taylor
    return Math.sin(xi) / xi;
  }
  if (n === 5) return 1 / Math.sqrt(1 + xi * xi / 3);
  return null;
}

// Numerical RK4 integration of Lane-Emden, returning the trajectory
// theta(xi) and the first zero crossing xi_1 (or the maximum xi reached).
export function solveLaneEmden(n, dxi = 1e-3, xiMax = 50) {
  const xs = [0];
  const ts = [1];
  let xi = 0, theta = 1, eta = 0; // eta = d theta / d xi.
  // Avoid singularity at xi = 0: take one Euler step using the small-xi expansion theta ~ 1 - xi^2/6.
  xi = dxi;
  theta = 1 - xi * xi / 6;
  eta = -xi / 3;
  xs.push(xi); ts.push(theta);

  function deriv(xi, theta, eta) {
    const safeTheta = theta > 0 ? theta : 0;
    const power = Math.pow(safeTheta, n);
    return {
      dTheta: eta,
      dEta: xi > 1e-12 ? -(2 / xi) * eta - power : -power,
    };
  }

  while (theta > 0 && xi < xiMax) {
    const k1 = deriv(xi, theta, eta);
    const k2 = deriv(xi + dxi / 2, theta + dxi / 2 * k1.dTheta, eta + dxi / 2 * k1.dEta);
    const k3 = deriv(xi + dxi / 2, theta + dxi / 2 * k2.dTheta, eta + dxi / 2 * k2.dEta);
    const k4 = deriv(xi + dxi,     theta + dxi * k3.dTheta,     eta + dxi * k3.dEta);
    const dTheta = dxi / 6 * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta);
    const dEta   = dxi / 6 * (k1.dEta + 2 * k2.dEta + 2 * k3.dEta + k4.dEta);
    theta += dTheta;
    eta += dEta;
    xi += dxi;
    if (xs.length < 4000) {
      xs.push(xi);
      ts.push(theta);
    }
  }
  // Linear interpolation for xi_1 if we crossed zero.
  let xi1 = xi;
  if (ts[ts.length - 1] < 0 && ts[ts.length - 2] > 0) {
    const t1 = ts[ts.length - 2], t2 = ts[ts.length - 1];
    const x1 = xs[xs.length - 2], x2 = xs[xs.length - 1];
    xi1 = x1 + (0 - t1) / (t2 - t1) * (x2 - x1);
  }
  return { xi: xs, theta: ts, xi1 };
}

export const KNOWN_XI1 = {
  0:   Math.sqrt(6),
  1:   Math.PI,
  1.5: 3.6537,
  3:   6.8969,
};
