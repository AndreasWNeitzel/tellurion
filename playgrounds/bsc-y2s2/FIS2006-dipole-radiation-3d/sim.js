// Electric/magnetic dipole and half-wave antenna radiation (SI). An
// oscillating electric dipole p0 cos(omega t) radiates with the
// angular pattern sin^2(theta), zero along the axis and maximum in the
// equatorial plane. The time-averaged power per solid angle is
//   dP/dOmega = (mu0 p0^2 omega^4 / 32 pi^2 c) sin^2 theta,
// integrating to the Larmor-type total
//   P = mu0 p0^2 omega^4 / (12 pi c).
// In the far zone E, B and r-hat form an orthogonal triad with
// |E| = c |B| and the Poynting flux falls as 1/r^2. Headless and
// deterministic. Reference: Jackson, Classical Electrodynamics
// (3rd ed.), Ch. 9.

export const EPS0 = 8.8541878128e-12;
export const MU0 = 1.25663706212e-6;
export const C = 2.99792458e8;

// Angular shape of an ideal (Hertzian) dipole: sin^2(theta).
export function dipolePattern(theta) { const s = Math.sin(theta); return s * s; }

// Half-wave antenna pattern, with the removable limits at 0 and pi.
export function antennaPattern(theta) {
  const s = Math.sin(theta);
  if (s < 1e-7) return 0;
  const x = Math.cos((Math.PI / 2) * Math.cos(theta)) / s;
  return x * x;
}

export function totalPowerE(p0, omega) {
  return MU0 * p0 * p0 * Math.pow(omega, 4) / (12 * Math.PI * C);
}

export function dPdOmegaE(theta, p0, omega) {
  return (MU0 * p0 * p0 * Math.pow(omega, 4) / (32 * Math.PI * Math.PI * C)) * dipolePattern(theta);
}

// Magnetic-dipole total power (same angular shape, m0 in A m^2).
export function totalPowerM(m0, omega) {
  return MU0 * m0 * m0 * Math.pow(omega, 4) / (12 * Math.PI * Math.pow(C, 3));
}

// Larmor power of a point charge of acceleration a (relation check).
export function larmorPoint(q, a) {
  return q * q * a * a / (6 * Math.PI * EPS0 * Math.pow(C, 3));
}

// Numeric total power by integrating dP/dOmega over the sphere.
export function integratedPower(p0, omega, n = 2000) {
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    const th = Math.PI * (i + 0.5) / n;
    s += dPdOmegaE(th, p0, omega) * Math.sin(th);
  }
  return s * (Math.PI / n) * 2 * Math.PI;
}

// Poynting flux through a sphere of radius r: integral of S r^2 dOmega,
// which must equal the total power (independent of r).
export function sphereFlux(r, p0, omega, n = 2000) {
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    const th = Math.PI * (i + 0.5) / n;
    const S = dPdOmegaE(th, p0, omega) / (r * r);          // S = (dP/dOmega)/r^2
    s += S * r * r * Math.sin(th);
  }
  return s * (Math.PI / n) * 2 * Math.PI;
}

// Directivity D = 4 pi max(pattern) / integral(pattern dOmega).
export function directivity(patternFn, n = 4000) {
  let mx = 0, integ = 0;
  for (let i = 0; i < n; i += 1) {
    const th = Math.PI * (i + 0.5) / n, p = patternFn(th);
    if (p > mx) mx = p;
    integ += p * Math.sin(th);
  }
  integ *= (Math.PI / n) * 2 * Math.PI;
  return 4 * Math.PI * mx / integ;
}

// Far-zone unit vectors at (theta, phi) for a z-aligned dipole: r-hat
// radial, E along theta-hat, B along phi-hat. Returns the triad and
// the |E|/|B| ratio (should be c).
export function farFieldTriad(theta, phi) {
  const st = Math.sin(theta), ct = Math.cos(theta), cp = Math.cos(phi), sp = Math.sin(phi);
  const rhat = [st * cp, st * sp, ct];
  const thetaHat = [ct * cp, ct * sp, -st];                 // E direction
  const phiHat = [-sp, cp, 0];                              // B direction
  const Emag = st;                                          // ~ sin theta / r (drop 1/r)
  const Bmag = Emag / C;
  return { rhat, Ehat: thetaHat, Bhat: phiHat, Emag, Bmag };
}

export function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
