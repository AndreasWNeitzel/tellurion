// Headless physics for the pulsar lighthouse hero.
// A neutron star rotates about its spin axis at angular velocity
// Omega = 2 pi / P. The magnetic-dipole axis is tilted by an
// obliquity alpha from the spin axis. Each magnetic pole emits a
// radio beam in a cone of half-angle rho. The observer's line of
// sight makes inclination angle i with the spin axis. As the star
// rotates the cones sweep through space; whenever the line of sight
// lies inside a cone, we observe a pulse.
//
// Geometry references:
//   Lorimer and Kramer, Handbook of Pulsar Astronomy, CUP 2005,
//   Chapter 3. Citation key `lorimer-kramer-pulsars`.
//   Goldreich and Julian, Astrophys. J. 157 (1969) 869.
//   Manchester and Taylor, Pulsars, W. H. Freeman 1977 (classic).
//
// Pulse profile model: Gaussian in the angular separation between
// the line of sight and the magnetic pole, with width rho.
//   I(phi) = exp[ - (theta(phi) / rho)^2 ]
// where theta(phi) is the angular distance from LOS to nearer pole.

export const DEFAULT_PERIOD = 1.0;          // seconds
export const DEFAULT_OBLIQUITY = 50;         // degrees
export const DEFAULT_INCLINATION = 65;       // degrees, observer
export const DEFAULT_RHO = 12;               // degrees, cone opening (radio beam)
export const DEFAULT_PHASE = 0;

const DEG = Math.PI / 180;

// Magnetic-pole unit vector at phase psi (rotation phase).
export function magneticPoleVector(alphaDeg, psi) {
  // Spin axis = z. At psi = 0 the pole lies in the (x,z) plane at
  // polar angle alpha. Rotation by psi about z spins the pole.
  const a = alphaDeg * DEG;
  return {
    x: Math.sin(a) * Math.cos(psi),
    y: Math.sin(a) * Math.sin(psi),
    z: Math.cos(a),
  };
}

// Line-of-sight vector (fixed). i = inclination from spin axis.
export function losVector(iDeg) {
  const i = iDeg * DEG;
  return { x: Math.sin(i), y: 0, z: Math.cos(i) };
}

// Angular separation in radians between two unit vectors.
export function angularSeparation(u, v) {
  const dot = u.x * v.x + u.y * v.y + u.z * v.z;
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

// Pulse intensity at rotation phase psi, observer inclination i,
// obliquity alpha, cone opening rho.
export function pulseIntensity(psi, alphaDeg, iDeg, rhoDeg) {
  const los = losVector(iDeg);
  const poleN = magneticPoleVector(alphaDeg, psi);
  const poleS = { x: -poleN.x, y: -poleN.y, z: -poleN.z };
  const tN = angularSeparation(los, poleN);
  const tS = angularSeparation(los, poleS);
  const t = Math.min(tN, tS);
  const rho = rhoDeg * DEG;
  return Math.exp(-(t * t) / (rho * rho));
}

// Pulse profile over a full rotation (256 samples by default).
export function pulseProfile(alphaDeg, iDeg, rhoDeg, N = 256) {
  const out = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const psi = (k / N) * 2 * Math.PI;
    out[k] = pulseIntensity(psi, alphaDeg, iDeg, rhoDeg);
  }
  return out;
}

// Geometry visibility conditions:
//  - "single-pulse" if exactly one cone crosses LOS per rotation.
//  - "interpulse" if both cones cross (visible at |i - 90| < rho).
//  - "missed beam" if neither (|i - alpha| > rho and |i - (180 - alpha)| > rho).
export function visibilityRegime(alphaDeg, iDeg, rhoDeg) {
  const dN = Math.abs(iDeg - alphaDeg);
  const dS = Math.abs(iDeg - (180 - alphaDeg));
  const seesN = dN < rhoDeg + 5;     // generous in degrees, beam sweeps through
  const seesS = dS < rhoDeg + 5;
  if (seesN && seesS) return 'interpulse';
  if (seesN || seesS) return 'single-pulse';
  return 'missed';
}

// Spin-down luminosity scaling (informational): E_dot ~ B^2 R^6 Omega^4 / c^3.
// We report only the period change formula for context.
export function spinDownTimescale_yr(P_s, dotP_s_per_s) {
  // tau = P / (2 P_dot)
  if (dotP_s_per_s <= 0) return Infinity;
  return P_s / (2 * dotP_s_per_s) / (365.25 * 86400);
}
