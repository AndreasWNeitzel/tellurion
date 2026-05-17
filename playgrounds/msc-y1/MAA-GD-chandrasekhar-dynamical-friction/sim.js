// Chandrasekhar dynamical friction, the pieces that have a closed form
// so they can be gate-tested and shared with the renderer.
// a_DF = 4 pi G^2 M rho lnLambda f(X) / V^2, with X = V / (sqrt2 sigma)
// and f(X) = erf(X) - 2 X exp(-X^2) / sqrt(pi).
// Reference: Binney and Tremaine, Galactic Dynamics (2nd ed.), Sec. 8.1.

export function erf(x) {
  const s = x < 0 ? -1 : 1; x = Math.abs(x);              // Abramowitz and Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

// Fraction of the Maxwellian field slower than the perturber.
export function fOfX(X) {
  return erf(X) - 2 * X * Math.exp(-X * X) / Math.sqrt(Math.PI);
}

// Deceleration magnitude per unit perturber mass.
export function chandrasekharDecel(V, sigma, rho, lnLambda, G = 1, M = 1) {
  const X = V / (Math.SQRT2 * sigma);
  return 4 * Math.PI * G * G * M * rho * lnLambda * fOfX(X) / Math.max(V * V, 1e-12);
}
