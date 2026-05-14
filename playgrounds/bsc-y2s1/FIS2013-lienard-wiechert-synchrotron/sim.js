// Liénard-Wiechert radiation: angular distribution for relativistic acceleration.
// Two limiting cases:
//   (a) acceleration parallel to velocity: dP/dOmega ~ sin^2(theta) / (1 - beta cos theta)^5
//   (b) acceleration perpendicular to velocity (circular / synchrotron):
//       dP/dOmega ~ [(1 - beta cos theta)^2 - (1 - beta^2) sin^2 theta cos^2 phi] / (1 - beta cos theta)^5
// Forward-beamed within angle ~ 1/gamma in the relativistic limit.
// Reference: Jackson 3e Ch. 14 (`jackson3e`).
export function gammaFromBeta(beta) { return 1 / Math.sqrt(1 - beta * beta); }
export function betaFromGamma(gamma) { return Math.sqrt(1 - 1 / (gamma * gamma)); }
export function lobeParallel(theta, beta) {
  return Math.sin(theta) ** 2 / Math.pow(1 - beta * Math.cos(theta), 5);
}
export function lobePerpendicular(theta, phi, beta) {
  const c = Math.cos(theta), s2 = Math.sin(theta) ** 2;
  const num = Math.pow(1 - beta * c, 2) - (1 - beta * beta) * s2 * Math.cos(phi) ** 2;
  return Math.max(0, num) / Math.pow(1 - beta * c, 5);
}
// Approximate opening angle of the beam (relativistic limit).
export function openingAngle(gamma) { return 1 / gamma; }
