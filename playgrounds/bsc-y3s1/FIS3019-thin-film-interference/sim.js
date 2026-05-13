// sim.js
// Thin-film interference (normal incidence, two-beam approximation).
//
// A film of refractive index n_film and thickness d sits between media of
// indices n_top (above) and n_substrate (below). For a wavelength
// lambda_0 in vacuum, the reflection coefficient is (Fresnel for two
// interfaces, no multiple reflections):
//
//   r12 = (n_top - n_film) / (n_top + n_film)
//   r23 = (n_film - n_substrate) / (n_film + n_substrate)
//   delta = (4 pi n_film d) / lambda_0     (phase from round trip in film)
//
//   R(lambda) = |r12 + r23 e^{-i delta}|^2 / |1 + r12 r23 e^{-i delta}|^2
//
// (Two-beam approximation drops the |1 + ...| denominator and gives
//  R approx r12^2 + r23^2 + 2 r12 r23 cos(delta).)
//
// For visualization we compute R vs lambda over visible range.
//
// Reference: Hecht, Optics 5e Ch. 9 (Newton's rings, oil slicks).

export const N_AIR = 1.0;

export function reflectance(lambda_nm, n_film, d_nm, n_top = N_AIR, n_sub = 1.5) {
  const r12 = (n_top - n_film) / (n_top + n_film);
  const r23 = (n_film - n_sub) / (n_film + n_sub);
  const delta = (4 * Math.PI * n_film * d_nm) / lambda_nm;
  // Full Airy formula:
  const num_re = r12 + r23 * Math.cos(delta);
  const num_im = -r23 * Math.sin(delta);
  const den_re = 1 + r12 * r23 * Math.cos(delta);
  const den_im = -r12 * r23 * Math.sin(delta);
  const num_sq = num_re * num_re + num_im * num_im;
  const den_sq = den_re * den_re + den_im * den_im;
  return num_sq / den_sq;
}

// Convert nm wavelength to RGB color (approximate, for visualization).
export function wavelengthToRGB(lambda) {
  let R = 0, G = 0, B = 0;
  if (lambda < 380) lambda = 380;
  if (lambda > 780) lambda = 780;
  if (lambda < 440) { R = -(lambda - 440) / 60; B = 1; }
  else if (lambda < 490) { G = (lambda - 440) / 50; B = 1; }
  else if (lambda < 510) { G = 1; B = -(lambda - 510) / 20; }
  else if (lambda < 580) { R = (lambda - 510) / 70; G = 1; }
  else if (lambda < 645) { R = 1; G = -(lambda - 645) / 65; }
  else                   { R = 1; }
  // Attenuate at extremes
  let factor = 1;
  if (lambda < 420) factor = 0.3 + 0.7 * (lambda - 380) / 40;
  if (lambda > 700) factor = 0.3 + 0.7 * (780 - lambda) / 80;
  return [Math.max(0, R * factor * 255) | 0, Math.max(0, G * factor * 255) | 0, Math.max(0, B * factor * 255) | 0];
}

// Predict the constructive maxima of R(lambda) at fixed n_film, d. For
// air-film-glass and normal incidence with a pi phase shift only at the
// first interface (n_film > n_air, n_sub > n_film):
//   2 n_film d = (m + 0.5) lambda  (constructive)
//   2 n_film d = m lambda          (destructive)
// We use the case n_film > n_sub or n_film < n_sub; the formulas differ
// only in which interface has the pi shift.
export function constructiveLambda(n_film, d_nm, m, n_top, n_sub) {
  // For air (n_top=1) - film (n_film=1.3) - glass (n_sub=1.5):
  // Both interfaces (low-high transitions) reflect with a pi phase shift,
  // so they cancel. Constructive: 2 n_film d = m lambda.
  // For soap film in air (low-high-low): only the top interface has pi shift.
  // Constructive: 2 n_film d = (m + 0.5) lambda.
  const lowHighHigh = n_top < n_film && n_film < n_sub;
  const lowHighLow  = n_top < n_film && n_film > n_sub;
  if (lowHighHigh) return 2 * n_film * d_nm / m;
  if (lowHighLow)  return 2 * n_film * d_nm / (m + 0.5);
  return null;
}
