// Headless physics for the stellar oscillation modes playground.
//
// A non-radial oscillation mode of a spherical star separates into an angular
// part, the spherical harmonic Y_l^m(theta, phi), and a radial part, the
// eigenfunction xi_r(r) whose number of interior nodes is the radial order n.
// This module supplies both, grounded in a real polytropic model rather than
// sketched curves:
//
//   - The structure is the n_poly = 3 Lane-Emden polytrope, integrated here.
//     For a polytrope rho ~ theta^n_poly, P ~ theta^(n_poly+1), so the squared
//     sound speed c^2 = Gamma1 P/rho ~ theta. That single relation fixes the
//     acoustic structure used below.
//   - Acoustic (p-mode) frequencies come from the JWKB quantisation of the
//     radial cavity, integral_{r_t}^{R} k_r dr = (n + 1/2) pi, with the radial
//     wavenumber k_r^2 = (omega^2 - S_l^2)/c^2 and the Lamb frequency
//     S_l^2 = l(l+1) c^2 / r^2. The lower turning point r_t is where omega = S_l.
//   - The eigenfunction xi_r(r) is the JWKB form cos(Phi(r) - pi/4); the
//     quantisation guarantees exactly n interior nodes.
//
// Frequencies are reported in microhertz, scaled so the radial (l = 0) large
// separation matches a solar-like Delta_nu = 135 uHz; only the overall scale is
// set this way, the structure is the genuine polytrope.
//
// References: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3 (asymptotic theory, eq. 3.215-3.234); Tassoul, ApJS 43 (1980) 469;
// Unno et al., Nonradial Oscillations of Stars (1989).

export const N_POLY = 3;
export const GAMMA1 = 5 / 3;
export const SOLAR_DNU_UHZ = 135.0;     // large separation the l = 0 ladder is scaled to

// --- Lane-Emden polytrope -------------------------------------------------
// Solve theta'' + (2/xi) theta' + theta^N_POLY = 0, theta(0) = 1, theta'(0) = 0,
// to the first zero xi_1. Stored on a uniform xi grid for interpolation.
let LE = null;
function solveLaneEmden() {
  if (LE) return LE;
  const h = 0.002;
  // Series start near the centre to step off the 1/xi singularity.
  let xi = 1e-4;
  let theta = 1 - xi * xi / 6 + N_POLY * xi ** 4 / 120;
  let dtheta = -xi / 3 + N_POLY * xi ** 3 / 30;
  const xs = [0], th = [1], dth = [0];
  // theta'' = -theta^N_POLY - (2/xi) theta'; integration starts at xi = 1e-4 so
  // the 1/xi term is finite (theta' ~ -xi/3 there).
  const deriv = (x, y, z) => { const src = y > 0 ? Math.pow(y, N_POLY) : 0; return [z, -src - (2 / x) * z]; };
  while (theta > 0 && xi < 20) {
    xs.push(xi); th.push(theta); dth.push(dtheta);
    const [k1y, k1z] = deriv(xi, theta, dtheta);
    const [k2y, k2z] = deriv(xi + h / 2, theta + h / 2 * k1y, dtheta + h / 2 * k1z);
    const [k3y, k3z] = deriv(xi + h / 2, theta + h / 2 * k2y, dtheta + h / 2 * k2z);
    const [k4y, k4z] = deriv(xi + h, theta + h * k3y, dtheta + h * k3z);
    theta += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);
    dtheta += h / 6 * (k1z + 2 * k2z + 2 * k3z + k4z);
    xi += h;
  }
  // Linear interpolation for the surface zero between the last two samples.
  const xPrev = xs[xs.length - 1], thPrev = th[th.length - 1];
  const xi1 = xPrev + h * thPrev / (thPrev - theta);
  LE = { h, xs, th, dth, xi1 };
  return LE;
}

// theta(xi) by linear interpolation on the stored grid (0 beyond the surface).
function thetaAt(xi) {
  const { h, th, xi1 } = solveLaneEmden();
  if (xi <= 0) return 1;
  if (xi >= xi1) return 0;
  const i = Math.floor(xi / h);
  const f = xi / h - i;
  const a = th[i] ?? 0, b = th[i + 1] ?? 0;
  return a + f * (b - a);
}

export function laneEmden() { return solveLaneEmden(); }

// Dimensionless sound speed c(xi) = sqrt(theta) (units c_0 = 1) and the squared
// Lamb frequency S_l^2 = l(l+1) theta xi_1^2 / xi^2 (units c_0/R).
function csound(xi) { return Math.sqrt(Math.max(thetaAt(xi), 0)); }
function lamb2(xi, l) {
  if (l === 0) return 0;
  const { xi1 } = solveLaneEmden();
  const x = xi / xi1;                      // r/R
  if (x <= 0) return Infinity;
  return l * (l + 1) * Math.max(thetaAt(xi), 0) / (x * x);
}

// Acoustic radial phase integral_{xi_t}^{xi} sqrt(omega^2 - S_l^2)/sqrt(theta) dxi / xi_1.
// Returns { phi, nodes } where nodes are the xi of the interior nodes of
// cos(Phi - pi/4). Trapezoidal over a fine grid inside the cavity.
function radialPhase(omega, l, xiHi) {
  const { xi1, h } = solveLaneEmden();
  const hi = Math.min(xiHi, xi1 - 1e-6);
  let phi = 0, prevIntegrand = 0, started = false;
  const steps = Math.max(64, Math.round(hi / h));
  const dx = hi / steps;
  let lastPhase = -Math.PI / 4;
  const nodes = [];
  for (let i = 1; i <= steps; i += 1) {
    const xi = i * dx;
    const th = Math.max(thetaAt(xi), 1e-9);
    const arg = omega * omega - lamb2(xi, l);
    const integrand = arg > 0 ? Math.sqrt(arg / th) : 0;
    if (arg > 0) {
      if (started) phi += 0.5 * (prevIntegrand + integrand) * dx / xi1;
      const phase = phi - Math.PI / 4;
      // a node each time the cos argument passes an odd multiple of pi/2.
      const kPrev = Math.floor((lastPhase - Math.PI / 2) / Math.PI);
      const kNow = Math.floor((phase - Math.PI / 2) / Math.PI);
      if (started && kNow > kPrev) nodes.push(xi);
      lastPhase = phase;
      started = true;
    }
    prevIntegrand = integrand;
  }
  return { phi, nodes };
}

// JWKB quantisation: find omega so that the total radial phase across the cavity
// equals (n + 1/2) pi. Phi is monotone increasing in omega, so bisect.
const FREQ_CACHE = new Map();
function omegaDimensionless(n, l) {
  const key = `${n},${l}`;
  if (FREQ_CACHE.has(key)) return FREQ_CACHE.get(key);
  const { xi1 } = solveLaneEmden();
  const target = (n + 0.5) * Math.PI;
  let lo = 1e-4, hi = 400;
  for (let it = 0; it < 80; it += 1) {
    const mid = 0.5 * (lo + hi);
    const { phi } = radialPhase(mid, l, xi1);
    if (phi < target) lo = mid; else hi = mid;
  }
  const omega = 0.5 * (lo + hi);
  FREQ_CACHE.set(key, omega);
  return omega;
}

// Scale factor: omega(n+1,0) - omega(n,0) = pi xi_1 / A_0 in dimensionless units,
// which is 2 pi Delta_nu. Pin Delta_nu to SOLAR_DNU_UHZ.
let SCALE_UHZ = null;
function scaleUHz() {
  if (SCALE_UHZ != null) return SCALE_UHZ;
  const d = omegaDimensionless(6, 0) - omegaDimensionless(5, 0);   // 2 pi Delta_nu (dimensionless)
  const dnuDimless = d / (2 * Math.PI);
  SCALE_UHZ = SOLAR_DNU_UHZ / dnuDimless;
  return SCALE_UHZ;
}

// Cyclic mode frequency nu(n, l) in microhertz.
export function modeFrequency(n, l) {
  return omegaDimensionless(n, l) / (2 * Math.PI) * scaleUHz();
}

// Lower turning point r_t/R where omega = S_l (0 for l = 0).
export function turningRadius(n, l) {
  if (l === 0) return 0;
  const { xi1 } = solveLaneEmden();
  const omega = omegaDimensionless(n, l);
  // S_l^2 falls from +inf at the centre to 0 at the surface, so scan outward
  // for the first xi where omega^2 >= S_l^2.
  const steps = 600;
  for (let i = 1; i <= steps; i += 1) {
    const xi = xi1 * i / steps;
    if (omega * omega >= lamb2(xi, l)) return xi / xi1;
  }
  return 0;
}

// Sample the radial eigenfunction xi_r(r) on x = r/R in [0, 1]. Returns
// { x[], xi[], nodes[] (in r/R), rt }. The JWKB amplitude is clipped to a high
// percentile so the surface and turning-point singularities do not dominate the
// plot, then the whole curve is normalised to unit peak.
export function radialEigenfunction(n, l, nSamples = 320) {
  const { xi1 } = solveLaneEmden();
  const omega = omegaDimensionless(n, l);
  const xt = turningRadius(n, l) * xi1;     // turning point in xi
  const x = new Float64Array(nSamples);
  const xi = new Float64Array(nSamples);
  const amp = new Float64Array(nSamples);
  const nodeXi = radialPhase(omega, l, xi1).nodes;

  // running phase from the turning point outward.
  let phi = 0, prev = 0, started = false;
  const env = [];
  for (let i = 0; i < nSamples; i += 1) {
    const xx = (i + 0.5) / nSamples;          // r/R cell centre
    const xiv = xx * xi1;
    x[i] = xx;
    const th = Math.max(thetaAt(xiv), 1e-9);
    const arg = omega * omega - lamb2(xiv, l);
    if (arg > 0) {
      const integrand = Math.sqrt(arg / th);
      if (started) phi += 0.5 * (prev + integrand) * (xi1 / nSamples) / xi1;
      prev = integrand; started = true;
      const envelope = Math.pow(th, -1.5) * Math.pow(arg, -0.25);
      env.push(envelope);
      xi[i] = Math.cos(phi - Math.PI / 4);
      amp[i] = envelope;
    } else {
      xi[i] = 0; amp[i] = 0; prev = 0;        // evanescent interior: negligible
    }
  }
  // clip envelope at the 60th percentile, apply, normalise to unit peak. The
  // JWKB amplitude diverges at the surface and turning point; clipping keeps the
  // interior oscillations (hence the n nodes) visible rather than dwarfed.
  const sorted = [...env].sort((a, b) => a - b);
  const cap = sorted.length ? sorted[Math.floor(0.6 * (sorted.length - 1))] : 1;
  let peak = 1e-12;
  for (let i = 0; i < nSamples; i += 1) { xi[i] *= Math.min(amp[i], cap); peak = Math.max(peak, Math.abs(xi[i])); }
  for (let i = 0; i < nSamples; i += 1) xi[i] /= peak;
  return { x, xi, nodes: nodeXi.map((v) => v / xi1), rt: xt / xi1 };
}

// --- Angular part: real spherical harmonics --------------------------------
function factorial(k) { let r = 1; for (let i = 2; i <= k; i += 1) r *= i; return r; }

// Associated Legendre P_l^m(x) by the standard upward recurrence (l up to ~8).
export function plgndr(l, m, x) {
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt((1 - x) * (1 + x));
    let fact = 1;
    for (let i = 1; i <= m; i += 1) { pmm *= -fact * somx2; fact += 2; }
  }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) {
    pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1; pmmp1 = pll;
  }
  return pll;
}

// Real spherical harmonic, orthonormal over the sphere.
export function realYlm(l, m, theta, phi) {
  const x = Math.cos(theta);
  const mm = Math.abs(m);
  const norm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * factorial(l - mm) / factorial(l + mm));
  const p = plgndr(l, mm, x);
  if (m > 0) return Math.SQRT2 * norm * p * Math.cos(mm * phi);
  if (m < 0) return Math.SQRT2 * norm * p * Math.sin(mm * phi);
  return norm * p;
}

// Node counts on the surface, for the readout: l - |m| nodal latitude circles
// and (m == 0 ? 0 : 2|m|) nodal meridians.
export function surfaceNodes(l, m) {
  const mm = Math.abs(m);
  return { latitudes: l - mm, meridians: mm === 0 ? 0 : 2 * mm };
}
