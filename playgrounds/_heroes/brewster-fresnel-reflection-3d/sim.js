// Headless physics for the Brewster + Fresnel + TIR hero. Light of
// arbitrary polarization strikes a planar interface between two
// homogeneous media (refractive indices n1, n2) at angle theta_i.
// Snell's law gives the refraction angle:
//   n1 sin(theta_i) = n2 sin(theta_t).
// Fresnel amplitude coefficients for the two polarizations:
//   r_s = (n1 cos theta_i - n2 cos theta_t) / (n1 cos theta_i + n2 cos theta_t)
//   r_p = (n2 cos theta_i - n1 cos theta_t) / (n2 cos theta_i + n1 cos theta_t)
// Energy reflectances are R_s = r_s^2, R_p = r_p^2.
// Brewster angle (R_p = 0):
//   tan(theta_B) = n2 / n1
// Critical angle (R_s = R_p = 1 above this) when n1 > n2:
//   sin(theta_c) = n2 / n1.
//
// References:
//   Hecht, Optics, 5th ed., Ch. 4 (`hecht-optics`).
//   Brewster, Phil. Trans. R. Soc. 105 (1815) 125.

const DEG = Math.PI / 180;

export function snellAngle(theta_i_rad, n1, n2) {
  const s = (n1 / n2) * Math.sin(theta_i_rad);
  if (Math.abs(s) > 1) return null;     // total internal reflection
  return Math.asin(s);
}

export function brewsterAngle(n1, n2) {
  return Math.atan2(n2, n1);
}

export function criticalAngle(n1, n2) {
  if (n2 >= n1) return null;
  return Math.asin(n2 / n1);
}

export function fresnel_rs(theta_i_rad, n1, n2) {
  const theta_t = snellAngle(theta_i_rad, n1, n2);
  if (theta_t === null) return { r: 1, R: 1 };   // TIR
  const num = n1 * Math.cos(theta_i_rad) - n2 * Math.cos(theta_t);
  const den = n1 * Math.cos(theta_i_rad) + n2 * Math.cos(theta_t);
  const r = num / den;
  return { r, R: r * r };
}

export function fresnel_rp(theta_i_rad, n1, n2) {
  const theta_t = snellAngle(theta_i_rad, n1, n2);
  if (theta_t === null) return { r: 1, R: 1 };   // TIR
  const num = n2 * Math.cos(theta_i_rad) - n1 * Math.cos(theta_t);
  const den = n2 * Math.cos(theta_i_rad) + n1 * Math.cos(theta_t);
  const r = num / den;
  return { r, R: r * r };
}

export function transmittance_s(theta_i_rad, n1, n2) {
  return 1 - fresnel_rs(theta_i_rad, n1, n2).R;
}

export function transmittance_p(theta_i_rad, n1, n2) {
  return 1 - fresnel_rp(theta_i_rad, n1, n2).R;
}

// Unpolarized: R_unpol = (R_s + R_p) / 2.
export function fresnel_unpol(theta_i_rad, n1, n2) {
  return 0.5 * (fresnel_rs(theta_i_rad, n1, n2).R + fresnel_rp(theta_i_rad, n1, n2).R);
}

// Convenience: common materials.
export const MATERIALS = [
  { name: 'air', n: 1.000 },
  { name: 'water', n: 1.333 },
  { name: 'fused silica', n: 1.458 },
  { name: 'crown glass', n: 1.520 },
  { name: 'flint glass', n: 1.620 },
  { name: 'diamond', n: 2.417 },
];

// Helper: classify the geometry.
//   'normal': normal incidence, R_s = R_p.
//   'tir': total internal reflection.
//   'brewster': p-polarization perfectly transmitted.
//   'normal-incidence': theta_i ~ 0.
export function regime(theta_i_rad, n1, n2) {
  if (theta_i_rad < 0.5 * DEG) return 'normal-incidence';
  const theta_c = criticalAngle(n1, n2);
  if (theta_c !== null && theta_i_rad > theta_c) return 'tir';
  const theta_B = brewsterAngle(n1, n2);
  if (Math.abs(theta_i_rad - theta_B) < 0.5 * DEG) return 'brewster';
  return 'oblique';
}
