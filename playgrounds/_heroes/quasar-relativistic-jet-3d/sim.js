// Headless physics for the quasar relativistic-jet hero.
// A relativistic jet of bulk Lorentz factor Gamma = 1 / sqrt(1 - beta^2)
// is launched along the rotation axis of a supermassive black hole.
// An observer at angle theta from the jet axis sees the approaching
// jet Doppler-boosted by delta_+ and the counter-jet de-boosted by
// delta_-, where the Doppler factor is
//
//   delta = 1 / ( Gamma (1 - beta cos theta) )
//
// for the approaching side, replace cos theta with -cos theta for
// the receding side.
//
// Observed monochromatic flux scales as F_obs = F_rest * delta^(p)
// with p = 2 + alpha (for a moving "blob") or p = 3 + alpha (for a
// continuous jet), where alpha is the spectral index F_nu ~ nu^-alpha.
// We use the moving-blob exponent p = 3 - alpha for monochromatic
// flux in a steady jet (Lind and Blandford 1985).
//
// Apparent transverse velocity (superluminal motion):
//   beta_app = beta sin theta / (1 - beta cos theta)
// peaks at cos theta = beta giving beta_app_max = Gamma * beta.
//
// References:
//   Rybicki and Lightman, Radiative Processes in Astrophysics, Wiley
//   1979, Chapter 4. Citation key `rybicki-lightman`.
//   Lind and Blandford, ApJ 295 (1985) 358 (Doppler boost form).
//   Urry and Padovani, PASP 107 (1995) 803 (unified scheme).

export const SPECTRAL_INDEX = 0.7;          // typical radio blazar
export const FLUX_EXPONENT = 3 - SPECTRAL_INDEX;

export function gamma(beta) {
  if (beta >= 1) return Infinity;
  return 1 / Math.sqrt(1 - beta * beta);
}

// Doppler factor for an approaching or receding flow.
export function dopplerFactor(beta, thetaRad, approaching = true) {
  const g = gamma(beta);
  const cos = Math.cos(thetaRad);
  const denom = approaching ? (1 - beta * cos) : (1 + beta * cos);
  return 1 / (g * denom);
}

// Apparent flux ratio: F_jet / F_counter = (delta_+ / delta_-)^p.
export function fluxRatio(beta, thetaRad, p = FLUX_EXPONENT) {
  const dp = dopplerFactor(beta, thetaRad, true);
  const dm = dopplerFactor(beta, thetaRad, false);
  return Math.pow(dp / dm, p);
}

// Apparent transverse velocity (units of c).
export function apparentSuperluminal(beta, thetaRad) {
  const cos = Math.cos(thetaRad);
  const sin = Math.sin(thetaRad);
  return beta * sin / (1 - beta * cos);
}

// Angle of maximum apparent velocity.
export function thetaMaxSuperluminal(beta) {
  return Math.acos(beta);
}

// Maximum apparent transverse velocity.
export function maxApparent(beta) {
  return beta * gamma(beta);
}

// Critical Lorentz angle 1/Gamma (relativistic beaming half-angle).
export function beamingHalfAngle(beta) {
  return 1 / gamma(beta);
}

// Brightness of a continuous jet at viewing angle theta (in units of
// the rest-frame value). For p = 3 - alpha.
export function brightness(beta, thetaRad, approaching = true) {
  const d = dopplerFactor(beta, thetaRad, approaching);
  return Math.pow(d, FLUX_EXPONENT);
}
