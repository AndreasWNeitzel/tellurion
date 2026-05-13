// sim.js
// Relativistic beaming of an isotropic source in its rest frame, observed
// from the lab frame.
//
// A source at rest emits isotropically with intensity I'(theta') = I'_0.
// Boosted with Lorentz factor gamma, beta = sqrt(1 - 1/gamma^2), along +x:
//
// Aberration: cos(theta) = (cos(theta') + beta) / (1 + beta cos(theta')),
// where theta' is rest-frame angle and theta is lab-frame angle.
//
// Doppler factor: D(theta) = 1 / (gamma (1 - beta cos(theta))).
// Observed intensity for an isotropic monochromatic source (Rybicki & Lightman
// 1979, Section 4.8):
//   I(theta) = D(theta)^{3 + alpha}  * I_0    (alpha = spectral index)
//
// We use alpha = 0 (bolometric) by default; alpha = 1 for a typical AGN jet.

export function doppler(beta, theta) {
  // D = 1 / (gamma (1 - beta cos theta)) = sqrt(1 - beta^2) / (1 - beta cos theta)
  return Math.sqrt(1 - beta * beta) / (1 - beta * Math.cos(theta));
}

export function aberratedAngle(beta, thetaRest) {
  const c = Math.cos(thetaRest);
  return Math.acos((c + beta) / (1 + beta * c));
}

export function beamingPattern({ gamma = 5, alpha = 0, n = 360 } = {}) {
  const beta = Math.sqrt(1 - 1 / (gamma * gamma));
  const thetas = new Float64Array(n);
  const intensities = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const theta = 2 * Math.PI * (i / n);
    thetas[i] = theta;
    const D = doppler(beta, theta);
    intensities[i] = Math.pow(D, 3 + alpha);
  }
  return { thetas, intensities, beta };
}

// Beaming half-angle: theta where D(theta) = D(0) / 2.
// For ultra-relativistic gamma >> 1, theta_beam ~ 1 / gamma.
export function beamingHalfAngle(beta) {
  // Solve D(theta) = D(0) / 2 ; D(0) = 1 / (gamma (1 - beta)) ~ 2 gamma for beta close to 1.
  const D0 = doppler(beta, 0);
  // bisect in (0, pi).
  let lo = 0, hi = Math.PI;
  for (let it = 0; it < 80; it += 1) {
    const mid = 0.5 * (lo + hi);
    const D = doppler(beta, mid);
    if (D > D0 / 2) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}
