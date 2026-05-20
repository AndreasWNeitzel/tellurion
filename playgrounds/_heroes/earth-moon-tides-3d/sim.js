// Headless physics for the Earth-Moon-Sun tides hero. The tidal
// potential of a perturber of mass M at distance D, at a point on
// Earth's surface displaced by r from Earth's center, is the
// gradient of Newton's gravity over the small distance r:
//
//   Phi_tide(r, theta) = -(G M / D^3) r^2 (3 cos^2 theta - 1) / 2,
//
// where theta is the angle between r and the line to the perturber.
// The L = 2 Legendre polynomial structure means TWO bulges, one
// facing the perturber and one on the opposite side; that is the
// key to why there are two high tides per day.
//
// References: Murray and Dermott, Solar System Dynamics, CUP 1999,
// Ch. 4 (`murraydermott1999`); Lambeck, Geophysical Geodesy, Oxford
// 1988, Ch. 3. The lunar tide amplitude on Earth is about 0.5 m;
// solar is ~46% of lunar.

export const A_LUNAR = 1.0;        // lunar tidal amplitude (code units)
export const A_SOLAR = 0.46;       // solar / lunar ~ 0.46

// L=2 Legendre polynomial in cos(theta). Tidal bulge shape; the
// equipotential offset is proportional to this.
export function P2(cosTheta) {
  return 0.5 * (3 * cosTheta * cosTheta - 1);
}

// Tidal height (radial displacement above mean Earth radius) at
// colatitude theta_M from the line to the Moon and theta_S from the
// Sun. The combined tide is the sum of two L=2 bulges. Returns the
// height in units of the lunar amplitude.
export function tideHeight(cosThetaM, cosThetaS) {
  return A_LUNAR * P2(cosThetaM) + A_SOLAR * P2(cosThetaS);
}

// Lunar orbital phase 0 = new moon (Sun-Earth-Moon aligned, Moon between
// Sun and Earth observer-side... we use the convention that the Moon
// is along +x from Earth at phase=0; the Sun is always at +x at large
// distance). Returns the unit vector from Earth toward Moon.
export function moonPosition(phase) {
  return [Math.cos(phase), Math.sin(phase), 0];
}

// Sun direction (constant in code units): from Earth toward Sun.
export const SUN_DIR = [1, 0, 0];

// Tidal regime classifier. Spring tides occur near new/full moon
// (phase ~ 0 or pi); neap tides at quarter moon (phase ~ pi/2, 3pi/2).
// Returns 'spring' or 'neap' along with the maximum tide amplitude
// at any point on the equator.
export function tidalRegime(phase) {
  // Maximum equatorial tide amplitude:
  //   evaluate cosThetaM and cosThetaS along the equator and find max
  const N = 36;
  let maxH = -Infinity, minH = Infinity;
  for (let k = 0; k < N; k += 1) {
    const phiE = (k / N) * 2 * Math.PI;
    const cosThetaM = Math.cos(phiE - phase);
    const cosThetaS = Math.cos(phiE);
    const h = tideHeight(cosThetaM, cosThetaS);
    if (h > maxH) maxH = h;
    if (h < minH) minH = h;
  }
  const range = maxH - minH;
  // Spring tide range = 2 * (A_LUNAR + A_SOLAR) ~ 2.92
  // Neap tide range  = 2 * (A_LUNAR - A_SOLAR) ~ 1.08
  // Classify by halfway:
  const isSpring = range > 0.5 * (2 * (A_LUNAR + A_SOLAR) + 2 * (A_LUNAR - A_SOLAR));
  return { kind: isSpring ? 'spring' : 'neap', range, maxH, minH };
}

// Compute tide height at a surface point (theta_sphere, phi_sphere)
// given the Moon's orbital phase. theta_sphere is colatitude (from
// +z), phi_sphere is longitude.
export function tideAt(theta_sphere, phi_sphere, phase) {
  // Surface unit vector
  const sinT = Math.sin(theta_sphere);
  const cosT = Math.cos(theta_sphere);
  const sx = sinT * Math.cos(phi_sphere);
  const sy = sinT * Math.sin(phi_sphere);
  const sz = cosT;
  // Moon direction
  const [mx, my, mz] = moonPosition(phase);
  const cosThetaM = sx * mx + sy * my + sz * mz;
  // Sun direction
  const cosThetaS = sx * SUN_DIR[0] + sy * SUN_DIR[1] + sz * SUN_DIR[2];
  return tideHeight(cosThetaM, cosThetaS);
}
