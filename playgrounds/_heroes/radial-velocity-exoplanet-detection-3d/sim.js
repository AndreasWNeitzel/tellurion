// Headless physics for the radial-velocity exoplanet detection hero.
// A star + planet two-body system orbits the centre of mass. The
// star traces a small ellipse mirroring the planet's, with semi-
// major axis ratio m_p / M_star. The observer sees the star's
// line-of-sight velocity oscillate as
//
//   v_r(t) = K [cos(theta(t) + omega) + e cos(omega)],
//
// where K = (2 pi G / P)^(1/3) m_p sin(i) / (M_star + m_p)^(2/3) / sqrt(1-e^2)
// is the RV semi-amplitude, theta(t) is the true anomaly, omega is
// the argument of periastron, e is the eccentricity, P is the
// orbital period, and i is the orbital inclination.
//
// Reference: Murray and Dermott, Solar System Dynamics, CUP 1999,
// Ch. 2 (`murraydermott1999`); Lovis and Fischer in Seager (ed.),
// Exoplanets, 2010, Ch. 2 (RV detection methods).

// Solve Kepler's equation E - e sin E = M iteratively (Newton-Raphson).
export function solveKepler(M, e, tol = 1e-10, maxIter = 30) {
  let E = M + e * Math.sin(M);
  for (let k = 0; k < maxIter; k += 1) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

// True anomaly theta from eccentric anomaly E.
export function trueAnomaly(E, e) {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2),
                        Math.sqrt(1 - e) * Math.cos(E / 2));
}

// RV semi-amplitude in code units (G = 1, P arbitrary, masses in
// arbitrary units). Returns K = (2 pi / P)^(1/3) * m_p sin(i) /
// (M_star + m_p)^(2/3) / sqrt(1 - e^2). All G factors absorbed.
export function rvSemiAmplitude(opts) {
  const { M_star = 1, m_p = 0.001, P = 1, e = 0, i = Math.PI / 2 } = opts;
  return Math.pow(2 * Math.PI / P, 1 / 3) * m_p * Math.sin(i)
    / Math.pow(M_star + m_p, 2 / 3) / Math.sqrt(1 - e * e);
}

// Radial velocity of the star at time t. Convention: positive v_r =
// star moving away from observer (red-shifted).
export function radialVelocity(t, opts) {
  const { P = 1, e = 0, omega = 0, t0 = 0 } = opts;
  const K = rvSemiAmplitude(opts);
  const M = 2 * Math.PI * (t - t0) / P;            // mean anomaly
  const E = solveKepler(M, e);
  const theta = trueAnomaly(E, e);
  return K * (Math.cos(theta + omega) + e * Math.cos(omega));
}

// Star and planet positions in the orbital plane (top-down) at time t.
// Both orbit the centre of mass; |a_star| / |a_planet| = m_p / M_star.
// Returns x_star, y_star, x_planet, y_planet in code units.
export function positions(t, opts) {
  const { M_star = 1, m_p = 0.001, P = 1, e = 0, omega = 0, a_planet = 1, t0 = 0 } = opts;
  const M = 2 * Math.PI * (t - t0) / P;
  const E = solveKepler(M, e);
  const theta = trueAnomaly(E, e);
  const r_planet = a_planet * (1 - e * e) / (1 + e * Math.cos(theta));
  const px = r_planet * Math.cos(theta + omega);
  const py = r_planet * Math.sin(theta + omega);
  // Star reflects through COM with ratio m_p / M_star (small).
  const ratio = -m_p / M_star;
  return { px, py, sx: ratio * px, sy: ratio * py };
}

// Doppler wavelength shift: delta lambda / lambda = v_r / c.
// For visualization we report a normalized line position around 0.
export function dopplerShift(v_r, cSpeed = 1) {
  return v_r / cSpeed;
}
