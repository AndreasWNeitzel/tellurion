// sim.js
// Stellar aberration. Light from a star travels along direction
// n = (cos theta_rest, sin theta_rest, 0) in the star's rest frame. The
// observer moves at beta along the +x axis. By Lorentz aberration the
// observed direction makes an angle theta_obs with the +x axis given by
//
//   cos theta_obs = (cos theta_rest + beta) / (1 + beta cos theta_rest).
//
// (We take "observer sees the source at angle theta_obs from motion
// direction".) The aberration shift is theta_rest - theta_obs.
//
// Earth's orbital speed is v ~ 29.78 km/s, beta ~ 9.93e-5; this gives
// a small-angle annual aberration of ~20.5 arcseconds. Numerically:
//   theta_rest - theta_obs ~ beta sin(theta_rest) for beta << 1.
//
// Reference: Jackson, Classical Electrodynamics 3e Ch. 11
// (`jackson1998`).

export const BETA_EARTH_ORBIT = 9.93e-5; // ~29.78 km/s / c

// Observed angle (radians) given rest-frame angle (radians) and beta.
export function thetaObs(thetaRest, beta) {
  const c = Math.cos(thetaRest);
  return Math.acos((c + beta) / (1 + beta * c));
}

// Inverse: rest-frame angle given observed angle.
export function thetaRest(thetaObs, beta) {
  const c = Math.cos(thetaObs);
  return Math.acos((c - beta) / (1 - beta * c));
}

// Aberration shift in radians.
export function aberrationShift(thetaRest, beta) {
  return thetaRest - thetaObs(thetaRest, beta);
}

// Constant of aberration in arcseconds for Earth's orbital speed (20.50 as).
export const ABERRATION_CONST_AS = 20.49551;

// Small-beta approximation: delta theta ~ beta sin theta.
export function aberrationSmallBeta(thetaRest, beta) {
  return beta * Math.sin(thetaRest);
}
