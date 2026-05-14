// Voigt profile: convolution of Gaussian (thermal broadening) and Lorentzian (natural).
// Approximate Voigt-Hjerting function as a sum of two Pseudo-Voigt components.
// Reference: Mihalas Stellar Atmospheres Ch. 9 (`mihalas-atm`); Carroll-Ostlie Ch. 9.5
// (`carroll-ostlie`).
export function gaussian(x, sigma) {
  return Math.exp(-0.5 * (x / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}
export function lorentzian(x, gamma) {
  return (gamma / Math.PI) / (x * x + gamma * gamma);
}
// Pseudo-Voigt approximation: linear mix.
export function pseudoVoigt(x, sigma, gamma) {
  const f_G = 2 * sigma * Math.sqrt(2 * Math.log(2));
  const f_L = 2 * gamma;
  const f = Math.pow(Math.pow(f_G, 5) + 2.69269 * Math.pow(f_G, 4) * f_L
    + 2.42843 * Math.pow(f_G, 3) * f_L * f_L
    + 4.47163 * Math.pow(f_G, 2) * Math.pow(f_L, 3)
    + 0.07842 * f_G * Math.pow(f_L, 4)
    + Math.pow(f_L, 5), 0.2);
  const eta = 1.36603 * (f_L / f) - 0.47719 * Math.pow(f_L / f, 2) + 0.11116 * Math.pow(f_L / f, 3);
  const sigmaEff = f / (2 * Math.sqrt(2 * Math.log(2)));
  return eta * lorentzian(x, f / 2) + (1 - eta) * gaussian(x, sigmaEff);
}
