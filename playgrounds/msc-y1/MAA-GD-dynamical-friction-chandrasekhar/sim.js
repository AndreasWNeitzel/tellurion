// Chandrasekhar dynamical friction on a massive perturber moving through a
// background of light particles with Maxwellian velocity dispersion sigma.
//   dv/dt = -4 pi G^2 (M+m) rho ln(Lambda) [ erf(X) - 2 X / sqrt(pi) exp(-X^2) ] / v^2 * v_hat,
// with X = v / (sqrt(2) sigma). For M >> m, the term (M+m) reduces to M.
// Reference: Binney-Tremaine Galactic Dynamics 2e Ch. 8 (`binney-tremaine`).
export const G_SI = 6.674e-11;
export function frictionMag(v, M_kg, rho, sigma, logLambda = 10) {
  const X = v / (Math.sqrt(2) * sigma);
  const dist = 4 * Math.PI * G_SI * G_SI * M_kg * rho * logLambda;
  const erf_X = erf(X);
  const f_X = erf_X - (2 * X / Math.sqrt(Math.PI)) * Math.exp(-X * X);
  return dist * f_X / (v * v);
}
function erf(x) {
  // Abramowitz-Stegun approximation.
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  let s = 0;
  for (let i = 0; i < 5; i += 1) s += a[i] * Math.pow(t, i + 1);
  return Math.sign(x) * (1 - s * Math.exp(-x * x));
}
