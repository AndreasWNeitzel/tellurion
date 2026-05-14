// Airy PSF + Maréchal Strehl ratio.
// Airy disk: I(theta) = I_0 (2 J_1(x) / x)^2 with x = pi D sin(theta) / lambda.
// First zero at sin(theta) = 1.22 lambda / D (diffraction limit).
// Strehl S ≈ exp(-(2 pi sigma_phi)^2) for rms wavefront error sigma_phi (in waves, λ-units).
// Reference: Born-Wolf Optics Ch. 8 (`born-wolf`); Hardy Adaptive Optics (`hardy-ao`).
export function airyIntensity(theta, lambdaNm, D_m) {
  const lambda = lambdaNm * 1e-9;
  const x = Math.PI * D_m * Math.sin(theta) / lambda;
  if (Math.abs(x) < 1e-6) return 1;
  return Math.pow(besselJ1(x) / x * 2, 2);
}
function besselJ1(x) {
  // Series for small x; asymptotic for large.
  if (Math.abs(x) < 8) {
    const x2 = x * x;
    let term = x / 2, sum = term;
    for (let n = 1; n < 30; n += 1) {
      term *= -x2 / (4 * n * (n + 1));
      sum += term;
      if (Math.abs(term) < 1e-12) break;
    }
    return sum;
  }
  const ax = Math.abs(x);
  return Math.sqrt(2 / (Math.PI * ax)) * Math.cos(ax - 3 * Math.PI / 4);
}
export function strehl(sigma_waves) {
  return Math.exp(-Math.pow(2 * Math.PI * sigma_waves, 2));
}
export function firstNullArcsec(lambdaNm, D_m) {
  return 1.22 * lambdaNm * 1e-9 / D_m * (180 / Math.PI) * 3600;
}
