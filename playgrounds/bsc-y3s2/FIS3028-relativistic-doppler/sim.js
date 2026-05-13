// sim.js
// Relativistic Doppler shift. A source emits at frequency f_s in its
// rest frame and moves with velocity v = beta c relative to the
// observer. The observed frequency at angle theta from the line of
// motion (in the observer frame) is
//
//   f_obs = f_s / (gamma (1 - beta cos theta)).
//
// Limits:
//   theta = 0 (head-on approach):       f_obs = f_s sqrt((1 + beta) / (1 - beta))
//   theta = pi (recession):              f_obs = f_s sqrt((1 - beta) / (1 + beta))
//   theta = pi/2 (transverse):           f_obs = f_s / gamma  (pure SR effect)
//
// Reference: Jackson, Classical Electrodynamics 3e Ch. 11
// (`jackson1998`).

export function gamma(beta) {
  return 1 / Math.sqrt(1 - beta * beta);
}

// f_obs / f_src at angle theta (radians) and dimensionless speed beta.
export function dopplerFactor(beta, thetaRad) {
  const g = gamma(beta);
  return 1 / (g * (1 - beta * Math.cos(thetaRad)));
}

// Specific named cases.
export function longitudinalApproach(beta) {
  // theta = 0
  return Math.sqrt((1 + beta) / (1 - beta));
}
export function longitudinalRecession(beta) {
  // theta = pi
  return Math.sqrt((1 - beta) / (1 + beta));
}
export function transverse(beta) {
  // theta = pi/2 in observer frame
  return 1 / gamma(beta);
}
