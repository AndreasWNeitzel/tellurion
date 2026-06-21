// polytrope.js
// Lane-Emden polytrope structure, the standard self-gravitating gas sphere
// with P = K rho^(1 + 1/n_poly).
//
// Solves the dimensionless Lane-Emden equation
//   (1/xi^2) d/dxi (xi^2 dtheta/dxi) + theta^n_poly = 0,
//   theta(0) = 1, theta'(0) = 0,
// from the centre to the first surface zero xi_1, by RK4 on the stored grid.
// Density rho ~ theta^n_poly, pressure P ~ theta^(n_poly+1), so the squared
// sound speed c^2 = Gamma1 P/rho ~ theta. The buoyancy (Brunt-Vaisala) and
// acoustic (Lamb) frequencies of the model follow from theta and theta'.
//
// Known surface zeros used by the tests: n=0 -> sqrt(6), n=1 -> pi,
// n=3 -> 6.89685 (Chandrasekhar, An Introduction to the Study of Stellar
// Structure, 1939, Ch. 4, Table 4).

const CACHE = new Map();

// Integrate the Lane-Emden equation for index nPoly to its first zero.
// Returns { nPoly, xi1, h, xs, th, dth } with th[0] = 1, dth[0] = 0.
export function laneEmden(nPoly = 3, opts = {}) {
  const key = `${nPoly}:${opts.h ?? 0.002}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const h = opts.h ?? 0.002;
  // theta'' = -theta^nPoly - (2/xi) theta'. Start one full step off the centre
  // with the series theta = 1 - xi^2/6 + nPoly xi^4/120 (and its derivative), so
  // every stored sample lands on an exact multiple of h and thetaAt can index by
  // floor(xi/h) without drift.
  let xi = h;
  let theta = 1 - xi * xi / 6 + nPoly * xi ** 4 / 120;
  let dtheta = -xi / 3 + nPoly * xi ** 3 / 30;
  const xs = [0], th = [1], dth = [0];
  const deriv = (x, y, z) => { const src = y > 0 ? Math.pow(y, nPoly) : 0; return [z, -src - (2 / x) * z]; };
  let prevXi = 0, prevTh = 1;
  while (theta > 0 && xi < 1e4) {
    xs.push(xi); th.push(theta); dth.push(dtheta);
    prevXi = xi; prevTh = theta;
    const [k1y, k1z] = deriv(xi, theta, dtheta);
    const [k2y, k2z] = deriv(xi + h / 2, theta + h / 2 * k1y, dtheta + h / 2 * k1z);
    const [k3y, k3z] = deriv(xi + h / 2, theta + h / 2 * k2y, dtheta + h / 2 * k2z);
    const [k4y, k4z] = deriv(xi + h, theta + h * k3y, dtheta + h * k3z);
    theta += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);
    dtheta += h / 6 * (k1z + 2 * k2z + 2 * k3z + k4z);
    xi += h;
  }
  // surface zero by linear interpolation between the last positive sample and
  // the first non-positive one.
  const xi1 = prevXi + h * prevTh / (prevTh - theta);
  const model = { nPoly, xi1, h, xs, th, dth };
  CACHE.set(key, model);
  return model;
}

// theta(xi) by linear interpolation; 1 at the centre, 0 beyond the surface.
export function thetaAt(model, xi) {
  if (xi <= 0) return 1;
  if (xi >= model.xi1) return 0;
  const i = Math.floor(xi / model.h);
  const f = xi / model.h - i;
  const a = model.th[i] ?? 0, b = model.th[i + 1] ?? 0;
  return a + f * (b - a);
}

// theta'(xi) by linear interpolation (negative throughout the interior).
export function dthetaAt(model, xi) {
  if (xi <= 0) return 0;
  if (xi >= model.xi1) {
    // extrapolate the last interior slope to the surface zero.
    const k = model.dth.length - 1;
    return model.dth[k] ?? 0;
  }
  const i = Math.floor(xi / model.h);
  const f = xi / model.h - i;
  const a = model.dth[i] ?? 0, b = model.dth[i + 1] ?? 0;
  return a + f * (b - a);
}

// Convenience: dimensionless squared sound speed c^2 = Gamma1 P/rho, normalised
// to unity at the centre (c^2 = theta), as a function of fractional radius
// x = r/R = xi/xi_1.
export function soundSpeed2(model, x) {
  return Math.max(thetaAt(model, x * model.xi1), 0);
}
