// sim.js
// Fresnel reflectance at a planar dielectric interface, with Brewster's
// angle for p-polarization.
//
// For light incident from medium 1 to medium 2 at angle theta_i, with
// transmission angle theta_t given by Snell's law n_1 sin theta_i = n_2 sin theta_t:
//
//   r_s = (n_1 cos theta_i - n_2 cos theta_t) / (n_1 cos theta_i + n_2 cos theta_t)
//   r_p = (n_2 cos theta_i - n_1 cos theta_t) / (n_2 cos theta_i + n_1 cos theta_t)
//
// R_s = r_s^2, R_p = r_p^2. Brewster: r_p = 0 at theta_B = atan(n_2 / n_1).
//
// Reference: Hecht, Optics 5e Ch. 4 (Fresnel formulas).

export function snellRefract(theta_i, n1, n2) {
  const sin_t = (n1 / n2) * Math.sin(theta_i);
  if (Math.abs(sin_t) > 1) return null;        // TIR
  return Math.asin(sin_t);
}

export function fresnelR(theta_i, n1, n2) {
  const theta_t = snellRefract(theta_i, n1, n2);
  if (theta_t === null) return { Rs: 1, Rp: 1, theta_t: null };
  const cos_i = Math.cos(theta_i);
  const cos_t = Math.cos(theta_t);
  const rs = (n1 * cos_i - n2 * cos_t) / (n1 * cos_i + n2 * cos_t);
  const rp = (n2 * cos_i - n1 * cos_t) / (n2 * cos_i + n1 * cos_t);
  return { Rs: rs * rs, Rp: rp * rp, theta_t };
}

export function brewsterAngle(n1, n2) {
  return Math.atan2(n2, n1);
}
export function criticalAngle(n1, n2) {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}
