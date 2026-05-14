// Skin effect: AC field penetrates a good conductor with exponential decay.
// Skin depth: delta = sqrt(2 / (omega mu sigma)).
// E(z, t) = E_0 exp(-z / delta) cos(omega t - z / delta).
// Reference: Griffiths E&M Ch. 9 (`griffiths-em`); Jackson Ch. 8 (`jackson3e`).
export const MU0 = 4 * Math.PI * 1e-7;
export function skinDepth(omega, sigma, mu_r = 1) {
  return Math.sqrt(2 / (omega * mu_r * MU0 * sigma));
}
export function fieldE(z, t, omega, sigma, E0 = 1, mu_r = 1) {
  const d = skinDepth(omega, sigma, mu_r);
  return E0 * Math.exp(-z / d) * Math.cos(omega * t - z / d);
}
// Surface impedance of a good conductor: Z_s = (1 + i) / (sigma delta).
// Loss tangent and good-conductor regime: sigma >> omega eps.
export function isGoodConductor(omega, sigma, eps_r = 1) {
  const EPS0 = 8.854e-12;
  return sigma / (omega * eps_r * EPS0) > 100;
}
