// sim.js
// Matter-radiation equality in a Friedmann universe. Matter density
// scales as rho_m ~ a^-3 (number density dilution); radiation density
// scales as rho_r ~ a^-4 (number density dilution plus redshift of
// photon energy). The crossover at a_eq is where rho_m = rho_r:
//
//   Omega_m a_eq^-3 = Omega_r a_eq^-4
//   a_eq = Omega_r / Omega_m
//   1 + z_eq = 1 / a_eq = Omega_m / Omega_r
//
// Standard LCDM values: Omega_m = 0.315, Omega_r = 9.24e-5
// (from CMB + free-streaming neutrinos at T_gamma = 2.725 K). This
// gives 1 + z_eq ~ 3410.
//
// Reference: Liddle, An Introduction to Modern Cosmology 3e Ch. 4
// (`liddle-cosmology`).

export const OMEGA_M_DEFAULT = 0.315;
export const OMEGA_R_DEFAULT = 9.24e-5;

// Densities normalized to today (a = 1, rho_x(today) = Omega_x rho_crit).
export function rhoMatter(a, OmegaM) {
  return OmegaM / (a * a * a);
}
export function rhoRadiation(a, OmegaR) {
  return OmegaR / (a * a * a * a);
}
export function rhoLambda(OmegaLam) {
  return OmegaLam;
}

// Scale factor of matter-radiation equality.
export function aEq(OmegaM, OmegaR) {
  return OmegaR / OmegaM;
}
export function zEq(OmegaM, OmegaR) {
  return OmegaM / OmegaR - 1;
}

// Hubble parameter H(a) / H_0 for a flat universe.
export function HoverH0(a, OmegaM, OmegaR, OmegaLam) {
  return Math.sqrt(
    OmegaR / (a * a * a * a) + OmegaM / (a * a * a) + OmegaLam,
  );
}
