// sim.js
// Parallel transport on the unit sphere. A spherical triangle with
// vertices at three points on the sphere has angle excess equal to its
// enclosed solid angle (Gauss-Bonnet on the sphere of constant
// curvature K = 1). When a vector is parallel-transported around the
// triangle, it rotates by an angle equal to the solid angle.
//
// For a triangle with interior angles A, B, C:
//   solid angle Omega = A + B + C - pi.
//
// Concrete demo: take a "Beltrami's classic" triangle with two great
// circles meeting at the north pole and a piece of equator. Vertices:
//   P1 = (0, 0, 1)                          (north pole)
//   P2 = (sin alpha, 0, cos alpha)           (down to equator at lon = 0)
//   P3 = (sin alpha cos beta, sin alpha sin beta, cos alpha)
//          (down to lat = pi/2 - alpha at lon = beta)
//
// where alpha = polar angle (90 deg = equator) and beta = longitude
// span of the equatorial leg. For alpha = pi/2 (full equator triangle)
// the solid angle equals beta.
//
// Reference: do Carmo, Differential Geometry of Curves and Surfaces
// Ch. 4 (cited via `carroll2019` for the GR-text-rendering of the
// same idea).

// Holonomy angle (radians) for a Beltrami triangle with the polar leg
// dropping to colatitude alpha and equator span beta.
// For the "full equator" case (alpha = pi/2), holonomy = beta.
// For general alpha, the solid angle is (1 - cos alpha) * beta. The
// holonomy after parallel transport equals this.
export function holonomy(alphaRad, betaRad) {
  return (1 - Math.cos(alphaRad)) * betaRad;
}

// Gauss-Bonnet via interior angles. The two pole-edges of the Beltrami
// triangle meet at angle beta at the pole; the two equator-edges meet
// at angle pi/2 each. So A + B + C = pi/2 + pi/2 + beta = pi + beta.
// Holonomy = A + B + C - pi = beta (matching the cos alpha = 0 case).
export function interiorAngleSum(alphaRad, betaRad) {
  // For Beltrami triangle the three interior angles are:
  //   at pole: beta
  //   at each equator vertex: depends on alpha
  // Standard spherical excess: A + B + C - pi = Omega (solid angle).
  return Math.PI + holonomy(alphaRad, betaRad);
}

// Sphere geometry helpers.
export function sphericalToCartesian(lat, lon) {
  // lat in [-pi/2, pi/2], lon in [-pi, pi].
  return {
    x: Math.cos(lat) * Math.cos(lon),
    y: Math.cos(lat) * Math.sin(lon),
    z: Math.sin(lat),
  };
}
