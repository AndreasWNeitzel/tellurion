// Tree-level QED e+ e- -> mu+ mu- (the textbook s-channel process;
// Peskin and Schroeder Ch. 5; Halzen and Martin Ch. 6; Feynman 1949).
// Natural units, energies in GeV; the cross section is also given in
// nanobarns. Each QED vertex carries a factor e, so an amplitude with
// V vertices scales as alpha^{V/2} and |M|^2 as alpha^V.

export const ALPHA = 1 / 137.035999084;
export const ME = 0.00051099895;                       // GeV
export const MMU = 0.1056583755;                       // GeV
export const GEV2_TO_NB = 3.893793721e5;               // 1 GeV^-2 = 0.389 mb

// Muon velocity in the CM frame: beta = sqrt(1 - 4 m_mu^2 / s).
export function beta(sqrts) {
  const s = sqrts * sqrts;
  return Math.sqrt(Math.max(0, 1 - 4 * MMU * MMU / s));
}

// Mandelstam invariants (CM frame, scattering angle theta). The
// identity s + t + u = sum of the four external masses squared holds
// exactly: 2 m_e^2 + 2 m_mu^2.
export function mandelstam(sqrts, cosTheta) {
  const s = sqrts * sqrts;
  const E = sqrts / 2;                                  // each particle's CM energy
  const pin = Math.sqrt(Math.max(0, E * E - ME * ME));
  const pout = Math.sqrt(Math.max(0, E * E - MMU * MMU));
  const t = ME * ME + MMU * MMU - 2 * (E * E - pin * pout * cosTheta);
  const u = ME * ME + MMU * MMU - 2 * (E * E + pin * pout * cosTheta);
  return { s, t, u, sumMasses: 2 * ME * ME + 2 * MMU * MMU };
}

// Total tree cross section (GeV^-2):
//   sigma = (4 pi alpha^2 / 3 s) * beta * (3 - beta^2)/2.
export function sigmaEEtoMuMu(sqrts, alpha = ALPHA) {
  const s = sqrts * sqrts;
  if (sqrts <= 2 * MMU) return 0;                       // below threshold
  const b = beta(sqrts);
  return (4 * Math.PI * alpha * alpha / (3 * s)) * b * (3 - b * b) / 2;
}
export function sigmaNb(sqrts, alpha = ALPHA) { return sigmaEEtoMuMu(sqrts, alpha) * GEV2_TO_NB; }
// Ultrarelativistic point cross section (beta -> 1): 4 pi alpha^2/3 s.
export function sigmaPoint(sqrts, alpha = ALPHA) {
  return 4 * Math.PI * alpha * alpha / (3 * sqrts * sqrts);
}

// Differential cross section dsigma/dOmega (GeV^-2/sr):
//   (alpha^2 beta / 4 s) [ 1 + cos^2 + (1 - beta^2)(1 - cos^2) ].
export function dSigmadOmega(sqrts, cosTheta, alpha = ALPHA) {
  if (sqrts <= 2 * MMU) return 0;
  const s = sqrts * sqrts, b = beta(sqrts), c2 = cosTheta * cosTheta;
  return (alpha * alpha * b / (4 * s)) * (1 + c2 + (1 - b * b) * (1 - c2));
}
// Numerically integrated total (consistency check vs sigmaEEtoMuMu).
export function sigmaFromAngular(sqrts, N = 2000, alpha = ALPHA) {
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const c = -1 + 2 * i / N;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * dSigmadOmega(sqrts, c, alpha);
  }
  return 2 * Math.PI * (s * (2 / N) / 3);                // integral over phi and cos
}

// Feynman-rule bookkeeping: a diagram with V vertices.
export function amplitudeAlphaExponent(nVertices) { return nVertices / 2; }
export function matrixElementAlphaPower(nVertices) { return nVertices; }

// Cross-section curve over a sqrt(s) range (GeV) in nb.
export function sigmaCurve(sMin, sMax, steps, alpha = ALPHA) {
  const e = new Float64Array(steps + 1), sig = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const E = sMin + (sMax - sMin) * i / steps;
    e[i] = E; sig[i] = sigmaNb(E, alpha);
  }
  return { e, sig };
}
