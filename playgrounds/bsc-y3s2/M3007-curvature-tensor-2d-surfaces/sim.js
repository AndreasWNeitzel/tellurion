// Gaussian curvature of common 2D surfaces.
// Sphere of radius R: K = 1 / R^2 (constant positive).
// Hyperbolic plane: K = -1 / a^2 (constant negative).
// Torus, major R, minor r: K(theta) = cos(theta) / (r (R + r cos(theta))).
// Reference: Carroll Spacetime and Geometry App. C; Riley-Hobson Ch. 26 (`riley-hobson`).
export function sphereK(R) { return 1 / (R * R); }
export function hyperbolicK(a) { return -1 / (a * a); }
export function torusK(theta, R, r) {
  return Math.cos(theta) / (r * (R + r * Math.cos(theta)));
}
export function cylinderK() { return 0; }
export function gaussBonnetSphere(R) { return 4 * Math.PI; } // integral of K over a sphere is 4 pi.
