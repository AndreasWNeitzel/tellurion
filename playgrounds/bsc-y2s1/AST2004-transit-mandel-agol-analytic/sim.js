// Mandel & Agol (2002) analytic transit light curve, uniform-source limit.
// Inputs: planet-to-star radius ratio p = Rp / Rs; normalized separation z = d / Rs.
// Returns the fractional flux F (1 = out of transit, 1 - p^2 = full transit).
// Reference: Mandel & Agol 2002 ApJ 580 L171 (`mandelagol2002`).
export function uniformLambda(p, z) {
  if (z >= 1 + p) return 0;
  if (z <= 1 - p) return p * p;
  if (z <= p - 1) return 1;
  const kappa1 = Math.acos((1 - p * p + z * z) / (2 * z));
  const kappa0 = Math.acos((p * p + z * z - 1) / (2 * p * z));
  const k0p = p * p * kappa0;
  const kappa1_term = kappa1;
  const sqrtTerm = 0.5 * Math.sqrt(Math.max(0, (4 * z * z - Math.pow(1 + z * z - p * p, 2))));
  return (k0p + kappa1_term - sqrtTerm) / Math.PI;
}
export function fluxAt(p, z) { return 1 - uniformLambda(p, z); }
// Quadratic limb darkening: F = (1 - u1(1 - mu) - u2(1 - mu)^2).
// For simplicity we provide a fast convolution of uniform-source transit with
// a 1D limb-darkening profile parameterized by (u1, u2) via ring decomposition.
export function fluxWithLimb(p, z, u1, u2, nRings = 30) {
  // Decompose stellar disk into nRings annuli, weight each by intensity:
  //   I(mu) / I0 = 1 - u1 (1 - mu) - u2 (1 - mu)^2.
  let totalI = 0, occulted = 0;
  for (let k = 0; k < nRings; k += 1) {
    const r_in = k / nRings, r_out = (k + 1) / nRings;
    const r = 0.5 * (r_in + r_out);
    const mu = Math.sqrt(1 - r * r);
    const I = 1 - u1 * (1 - mu) - u2 * (1 - mu) * (1 - mu);
    const dA = Math.PI * (r_out * r_out - r_in * r_in);
    totalI += I * dA;
    // Fraction of ring area occulted by the planet.
    // Approximation: scale uniform-source occulted fraction by the area ratio.
    if (r < 1) {
      const lam = uniformLambda(p / r_out, z / r_out);
      occulted += I * dA * lam;
    }
  }
  return Math.max(0, 1 - occulted / totalI);
}
