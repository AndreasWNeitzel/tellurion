// sim.js
// Eddington grey-atmosphere temperature profile. For a stellar
// atmosphere in radiative equilibrium with frequency-independent
// opacity, the temperature as a function of optical depth tau is
//
//   T(tau) = T_eff [3/4 (tau + 2/3)]^(1/4).
//
// Special values:
//   T(0)   = T_eff (1/2)^(1/4) ~ 0.841 T_eff (boundary temperature)
//   T(2/3) = T_eff exactly (photosphere)
//   T -> T_eff (3 tau / 4)^(1/4) for large tau (interior)
//
// Reference: Hansen-Kawaler-Trimble, Stellar Interiors 2e Ch. 3
// (`hansen-kawaler`) and Mihalas Stellar Atmospheres.

export function temperatureKEdd(tau, Teff) {
  return Teff * Math.pow((3 / 4) * (tau + 2 / 3), 0.25);
}

// Boundary temperature ratio.
export const T_BOUNDARY_RATIO = Math.pow(0.5, 0.25);

// Mean optical depth where T = T_eff.
export const TAU_PHOTOSPHERE = 2 / 3;

// Pressure profile (constant g): P(tau) ~ tau in this approximation.
// Return P / P_ref where P_ref = tau_ref / kappa.
export function pressureRatio(tau) {
  return tau;
}

// Limb-darkening integrand: I(theta) / I(0) = a + b cos(theta) (Eddington-Barbier).
// For Eddington-Hopf, b/a ~ 1.5 with a/(a+b) = 0.4. The simple form is:
// I(0)/I(theta) = 1 (radial); at theta = 90 deg, dimmer by factor (a/(a+b))?
// For demonstration we use the linear Eddington limb-darkening:
//   I(mu) / I(1) = 0.4 + 0.6 mu where mu = cos theta.
export function limbDarkening(muCos) {
  return 0.4 + 0.6 * muCos;
}
