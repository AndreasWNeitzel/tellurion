// Stellar spectrum: Planck blackbody continuum + Voigt-like absorption lines.
// B_lambda(T) = (2 h c^2 / lambda^5) / (exp(h c / (lambda k T)) - 1).
// Lines treated as Gaussian absorption profiles. Wien's law: lambda_max T = 2.898e-3 m K.
// Reference: Carroll-Ostlie Ch. 3-9 (`carroll-ostlie`).
export const H = 6.62607015e-34, C = 299792458, KB = 1.380649e-23;
export function planckLambda(lambdaM, T) {
  const x = H * C / (lambdaM * KB * T);
  return 2 * H * C * C / Math.pow(lambdaM, 5) / (Math.exp(x) - 1);
}
export function wienPeakNm(T) { return 2.898e-3 / T * 1e9; }
export function lineProfile(lambdaNm, lineNm, depth, sigmaNm) {
  return depth * Math.exp(-Math.pow((lambdaNm - lineNm) / sigmaNm, 2));
}
// Standard stellar lines (nm) with depths and widths (sigma in nm).
export const LINES = [
  { name: 'H_alpha', lam: 656.3, depth: 0.7, sigma: 0.3 },
  { name: 'H_beta', lam: 486.1, depth: 0.5, sigma: 0.25 },
  { name: 'H_gamma', lam: 434.0, depth: 0.4, sigma: 0.2 },
  { name: 'Ca II K', lam: 393.4, depth: 0.6, sigma: 0.18 },
  { name: 'Ca II H', lam: 396.8, depth: 0.55, sigma: 0.18 },
  { name: 'Na D', lam: 589.3, depth: 0.4, sigma: 0.15 },
  { name: 'Mg b', lam: 517.3, depth: 0.4, sigma: 0.15 },
];
export function spectrum(lambdaNm, T, lineDepth = 1) {
  const lam_m = lambdaNm * 1e-9;
  const B = planckLambda(lam_m, T);
  let abs = 0;
  for (const L of LINES) abs += lineProfile(lambdaNm, L.lam, L.depth * lineDepth, L.sigma);
  return B * Math.max(0, 1 - Math.min(1, abs));
}
