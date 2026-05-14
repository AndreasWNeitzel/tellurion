// Geodesic deviation equation. Two nearby geodesics on a sphere of radius R diverge or converge:
//   D^2 xi / D tau^2 = R^a_bcd u^b u^c xi^d.
// On a sphere, two great circles starting parallel near the equator converge at the pole.
// We propagate two test points starting at (theta = pi/2, phi = phi_0) with d phi separation,
// integrating along the great circles. Their angular separation oscillates between max and 0.
// Reference: Carroll Spacetime and Geometry Ch. 3 (`carroll-spacetime`).
export function greatCircle(t, theta0, phi0, alpha) {
  // Geodesic on unit sphere starting at (theta0, phi0) with initial direction alpha
  // (alpha = 0 means moving east, alpha = pi/2 means moving north).
  // Parametric form via spherical trig: simple meridional case here (alpha = 0):
  // theta(t) = theta0, phi(t) = phi0 + t (along equator).
  // We use a general great-circle solution via rotation matrices.
  const cAlpha = Math.cos(alpha), sAlpha = Math.sin(alpha);
  const cT = Math.cos(theta0), sT = Math.sin(theta0);
  const cP = Math.cos(phi0), sP = Math.sin(phi0);
  const east = [-sP, cP, 0];
  const north = [-cT * cP, -cT * sP, sT];
  const start = [sT * cP, sT * sP, cT];
  const tHat = [cAlpha * east[0] + sAlpha * north[0], cAlpha * east[1] + sAlpha * north[1], cAlpha * east[2] + sAlpha * north[2]];
  const pos = [Math.cos(t) * start[0] + Math.sin(t) * tHat[0], Math.cos(t) * start[1] + Math.sin(t) * tHat[1], Math.cos(t) * start[2] + Math.sin(t) * tHat[2]];
  const newTheta = Math.acos(Math.max(-1, Math.min(1, pos[2])));
  const newPhi = Math.atan2(pos[1], pos[0]);
  return { theta: newTheta, phi: newPhi, x: pos[0], y: pos[1], z: pos[2] };
}
export function angularSeparation(a, b) {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}
